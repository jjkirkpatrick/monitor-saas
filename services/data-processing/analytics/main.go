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
	_ "github.com/lib/pq"
	"github.com/nats-io/nats.go"
	"go.uber.org/zap"
)

type AnalyticsService struct {
	logger   *zap.Logger
	natsConn *nats.Conn
	db       *sql.DB
}

type CheckResultData struct {
	Type      string    `json:"type"`
	MonitorID string    `json:"monitor_id"`
	Timestamp time.Time `json:"timestamp"`
	Success   bool      `json:"success"`
	Duration  int64     `json:"duration"`
}

func NewAnalyticsService(logger *zap.Logger, natsConn *nats.Conn, db *sql.DB) *AnalyticsService {
	return &AnalyticsService{
		logger:   logger,
		natsConn: natsConn,
		db:       db,
	}
}

func (s *AnalyticsService) Start() error {
	// Create tables if they don't exist
	if err := s.initDatabase(); err != nil {
		return err
	}

	// Subscribe to analytics data
	if _, err := s.natsConn.Subscribe("analytics.ingest", s.handleAnalyticsData); err != nil {
		return err
	}

	// Start periodic aggregation jobs
	go s.runHourlyAggregation()
	go s.runDailyAggregation()

	return nil
}

func (s *AnalyticsService) initDatabase() error {
	_, err := s.db.Exec(`
		-- Hourly aggregations table
		CREATE TABLE IF NOT EXISTS monitor_stats_hourly (
			monitor_id TEXT NOT NULL,
			hour TIMESTAMPTZ NOT NULL,
			total_checks INTEGER NOT NULL,
			successful_checks INTEGER NOT NULL,
			failed_checks INTEGER NOT NULL,
			avg_duration BIGINT NOT NULL,
			min_duration BIGINT NOT NULL,
			max_duration BIGINT NOT NULL,
			p95_duration BIGINT NOT NULL,
			uptime_percentage FLOAT NOT NULL,
			PRIMARY KEY (monitor_id, hour)
		);

		-- Daily aggregations table
		CREATE TABLE IF NOT EXISTS monitor_stats_daily (
			monitor_id TEXT NOT NULL,
			day DATE NOT NULL,
			total_checks INTEGER NOT NULL,
			successful_checks INTEGER NOT NULL,
			failed_checks INTEGER NOT NULL,
			avg_duration BIGINT NOT NULL,
			min_duration BIGINT NOT NULL,
			max_duration BIGINT NOT NULL,
			p95_duration BIGINT NOT NULL,
			uptime_percentage FLOAT NOT NULL,
			PRIMARY KEY (monitor_id, day)
		);

		-- Convert tables to hypertables
		SELECT create_hypertable('monitor_stats_hourly', 'hour',
			chunk_time_interval => INTERVAL '1 week',
			if_not_exists => TRUE
		);

		SELECT create_hypertable('monitor_stats_daily', 'day',
			chunk_time_interval => INTERVAL '1 month',
			if_not_exists => TRUE
		);

		-- Create indexes
		CREATE INDEX IF NOT EXISTS idx_monitor_stats_hourly_monitor ON monitor_stats_hourly (monitor_id, hour DESC);
		CREATE INDEX IF NOT EXISTS idx_monitor_stats_daily_monitor ON monitor_stats_daily (monitor_id, day DESC);
	`)
	return err
}

func (s *AnalyticsService) handleAnalyticsData(msg *nats.Msg) {
	var data CheckResultData
	if err := json.Unmarshal(msg.Data, &data); err != nil {
		s.logger.Error("failed to unmarshal analytics data", zap.Error(err))
		return
	}

	if data.Type != "check_result" {
		return // Only process check results for now
	}

	// Store raw data for future analysis if needed
	// This could be stored in a separate table or sent to another system
}

func (s *AnalyticsService) runHourlyAggregation() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		if err := s.aggregateHourlyStats(); err != nil {
			s.logger.Error("failed to aggregate hourly stats", zap.Error(err))
		}
	}
}

func (s *AnalyticsService) runDailyAggregation() {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		if err := s.aggregateDailyStats(); err != nil {
			s.logger.Error("failed to aggregate daily stats", zap.Error(err))
		}
	}
}

func (s *AnalyticsService) aggregateHourlyStats() error {
	_, err := s.db.Exec(`
		INSERT INTO monitor_stats_hourly (
			monitor_id, hour,
			total_checks, successful_checks, failed_checks,
			avg_duration, min_duration, max_duration, p95_duration,
			uptime_percentage
		)
		SELECT
			monitor_id,
			date_trunc('hour', timestamp) as hour,
			COUNT(*) as total_checks,
			COUNT(*) FILTER (WHERE success = true) as successful_checks,
			COUNT(*) FILTER (WHERE success = false) as failed_checks,
			AVG(duration) as avg_duration,
			MIN(duration) as min_duration,
			MAX(duration) as max_duration,
			percentile_cont(0.95) WITHIN GROUP (ORDER BY duration) as p95_duration,
			(COUNT(*) FILTER (WHERE success = true)::FLOAT / COUNT(*)::FLOAT) * 100 as uptime_percentage
		FROM check_results
		WHERE
			timestamp >= date_trunc('hour', NOW() - INTERVAL '1 hour') AND
			timestamp < date_trunc('hour', NOW())
		GROUP BY monitor_id, date_trunc('hour', timestamp)
		ON CONFLICT (monitor_id, hour) DO UPDATE SET
			total_checks = EXCLUDED.total_checks,
			successful_checks = EXCLUDED.successful_checks,
			failed_checks = EXCLUDED.failed_checks,
			avg_duration = EXCLUDED.avg_duration,
			min_duration = EXCLUDED.min_duration,
			max_duration = EXCLUDED.max_duration,
			p95_duration = EXCLUDED.p95_duration,
			uptime_percentage = EXCLUDED.uptime_percentage
	`)
	return err
}

func (s *AnalyticsService) aggregateDailyStats() error {
	_, err := s.db.Exec(`
		INSERT INTO monitor_stats_daily (
			monitor_id, day,
			total_checks, successful_checks, failed_checks,
			avg_duration, min_duration, max_duration, p95_duration,
			uptime_percentage
		)
		SELECT
			monitor_id,
			date_trunc('day', hour)::DATE as day,
			SUM(total_checks) as total_checks,
			SUM(successful_checks) as successful_checks,
			SUM(failed_checks) as failed_checks,
			AVG(avg_duration) as avg_duration,
			MIN(min_duration) as min_duration,
			MAX(max_duration) as max_duration,
			percentile_cont(0.95) WITHIN GROUP (ORDER BY p95_duration) as p95_duration,
			(SUM(successful_checks)::FLOAT / SUM(total_checks)::FLOAT) * 100 as uptime_percentage
		FROM monitor_stats_hourly
		WHERE
			hour >= date_trunc('day', NOW() - INTERVAL '1 day') AND
			hour < date_trunc('day', NOW())
		GROUP BY monitor_id, date_trunc('day', hour)::DATE
		ON CONFLICT (monitor_id, day) DO UPDATE SET
			total_checks = EXCLUDED.total_checks,
			successful_checks = EXCLUDED.successful_checks,
			failed_checks = EXCLUDED.failed_checks,
			avg_duration = EXCLUDED.avg_duration,
			min_duration = EXCLUDED.min_duration,
			max_duration = EXCLUDED.max_duration,
			p95_duration = EXCLUDED.p95_duration,
			uptime_percentage = EXCLUDED.uptime_percentage
	`)
	return err
}

func main() {
	// Initialize logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Initialize OpenTelemetry
	shutdown, err := observability.InitTracer("analytics-service")
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

	// Create and start analytics service
	service := NewAnalyticsService(logger, nc, db)
	if err := service.Start(); err != nil {
		logger.Fatal("failed to start analytics service", zap.Error(err))
	}

	// Wait for shutdown signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	logger.Info("analytics service stopped")
}
