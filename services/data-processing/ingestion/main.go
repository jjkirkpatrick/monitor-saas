package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jjkirkpatrick/monitoring/pkg/observability"
	"github.com/nats-io/nats.go"
	"go.uber.org/zap"
)

type CheckResult struct {
	MonitorID string            `json:"monitor_id"`
	WorkerID  string            `json:"worker_id"`
	Timestamp time.Time         `json:"timestamp"`
	Duration  int64             `json:"duration"`
	Success   bool              `json:"success"`
	Error     string            `json:"error,omitempty"`
	Details   map[string]string `json:"details,omitempty"`
}

type IngestionService struct {
	logger   *zap.Logger
	natsConn *nats.Conn
	db       *sql.DB
}

func NewIngestionService(logger *zap.Logger, natsConn *nats.Conn, db *sql.DB) *IngestionService {
	return &IngestionService{
		logger:   logger,
		natsConn: natsConn,
		db:       db,
	}
}

func (s *IngestionService) Start() error {
	// Create tables if they don't exist
	if err := s.initDatabase(); err != nil {
		return err
	}

	// Subscribe to check results
	if _, err := s.natsConn.Subscribe("probes.check.result", s.handleCheckResult); err != nil {
		return err
	}

	return nil
}

func (s *IngestionService) initDatabase() error {
	// Create hypertable for check results
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS check_results (
			monitor_id TEXT NOT NULL,
			worker_id TEXT NOT NULL,
			timestamp TIMESTAMPTZ NOT NULL,
			duration BIGINT NOT NULL,
			success BOOLEAN NOT NULL,
			error TEXT,
			details JSONB,
			PRIMARY KEY (monitor_id, timestamp)
		);

		SELECT create_hypertable('check_results', 'timestamp', 
			chunk_time_interval => INTERVAL '1 day',
			if_not_exists => TRUE
		);

		CREATE INDEX IF NOT EXISTS idx_check_results_monitor_success ON check_results (monitor_id, success, timestamp DESC);
		CREATE INDEX IF NOT EXISTS idx_check_results_timestamp ON check_results (timestamp DESC);
	`)
	if err != nil {
		return err
	}

	return nil
}

func (s *IngestionService) handleCheckResult(msg *nats.Msg) {
	var result CheckResult
	if err := json.Unmarshal(msg.Data, &result); err != nil {
		s.logger.Error("failed to unmarshal check result", zap.Error(err))
		return
	}

	// Store result in TimescaleDB
	details, err := json.Marshal(result.Details)
	if err != nil {
		s.logger.Error("failed to marshal details", zap.Error(err))
		return
	}

	_, err = s.db.Exec(`
		INSERT INTO check_results (
			monitor_id, worker_id, timestamp, duration, success, error, details
		) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		result.MonitorID,
		result.WorkerID,
		result.Timestamp,
		result.Duration,
		result.Success,
		result.Error,
		details,
	)
	if err != nil {
		s.logger.Error("failed to insert check result",
			zap.Error(err),
			zap.String("monitor_id", result.MonitorID))
		return
	}

	// Forward to analytics service
	analyticsData, _ := json.Marshal(map[string]interface{}{
		"type":       "check_result",
		"monitor_id": result.MonitorID,
		"timestamp":  result.Timestamp,
		"success":    result.Success,
		"duration":   result.Duration,
	})
	if err := s.natsConn.Publish("analytics.ingest", analyticsData); err != nil {
		s.logger.Error("failed to forward to analytics", zap.Error(err))
	}
}

func main() {
	// Initialize logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Initialize OpenTelemetry
	shutdown, err := observability.InitTracer("ingestion-service")
	if err != nil {
		logger.Fatal("failed to initialize tracer", zap.Error(err))
	}
	defer shutdown()

	// Connect to TimescaleDB
	db, err := sql.Open("postgres", os.Getenv("TIMESCALE_DSN"))
	if err != nil {
		logger.Fatal("failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// Test database connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		logger.Fatal("failed to ping database", zap.Error(err))
	}

	// Connect to NATS
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}

	nc, err := nats.Connect(natsURL)
	if err != nil {
		logger.Fatal("failed to connect to NATS", zap.Error(err))
	}
	defer nc.Close()

	// Create and start ingestion service
	service := NewIngestionService(logger, nc, db)
	if err := service.Start(); err != nil {
		logger.Fatal("failed to start ingestion service", zap.Error(err))
	}

	// Wait for shutdown signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	logger.Info("ingestion service stopped")
}
