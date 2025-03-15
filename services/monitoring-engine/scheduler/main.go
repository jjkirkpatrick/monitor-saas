package main

import (
	"encoding/json"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jjkirkpatrick/monitoring/pkg/observability"
	"github.com/nats-io/nats.go"
	"go.uber.org/zap"
)

type Monitor struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	URL         string        `json:"url"`
	Type        string        `json:"type"` // HTTP, HTTPS, TCP, UDP, DNS
	Interval    time.Duration `json:"interval"`
	Timeout     time.Duration `json:"timeout"`
	RetryCount  int          `json:"retry_count"`
	LastChecked time.Time    `json:"last_checked"`
	Status      string       `json:"status"`
}

type Scheduler struct {
	logger     *zap.Logger
	natsConn   *nats.Conn
	monitors   map[string]*Monitor
	schedules  map[string]*time.Ticker
	shutdownCh chan struct{}
}

func NewScheduler(logger *zap.Logger, natsConn *nats.Conn) *Scheduler {
	return &Scheduler{
		logger:     logger,
		natsConn:   natsConn,
		monitors:   make(map[string]*Monitor),
		schedules:  make(map[string]*time.Ticker),
		shutdownCh: make(chan struct{}),
	}
}

func (s *Scheduler) Start() error {
	// Subscribe to monitor updates
	if _, err := s.natsConn.Subscribe("monitors.updates", s.handleMonitorUpdate); err != nil {
		return err
	}

	// Subscribe to monitor deletions
	if _, err := s.natsConn.Subscribe("monitors.deletions", s.handleMonitorDeletion); err != nil {
		return err
	}

	return nil
}

func (s *Scheduler) handleMonitorUpdate(msg *nats.Msg) {
	var monitor Monitor
	if err := json.Unmarshal(msg.Data, &monitor); err != nil {
		s.logger.Error("failed to unmarshal monitor", zap.Error(err))
		return
	}

	// Stop existing schedule if any
	if ticker, exists := s.schedules[monitor.ID]; exists {
		ticker.Stop()
		delete(s.schedules, monitor.ID)
	}

	// Create new schedule
	ticker := time.NewTicker(monitor.Interval)
	s.schedules[monitor.ID] = ticker
	s.monitors[monitor.ID] = &monitor

	// Start monitoring routine
	go func() {
		for {
			select {
			case <-ticker.C:
				// Publish check request to probe manager
				checkRequest, _ := json.Marshal(map[string]interface{}{
					"monitor_id": monitor.ID,
					"url":       monitor.URL,
					"type":      monitor.Type,
					"timeout":   monitor.Timeout,
				})
				s.natsConn.Publish("probes.check.request", checkRequest)
			case <-s.shutdownCh:
				ticker.Stop()
				return
			}
		}
	}()
}

func (s *Scheduler) handleMonitorDeletion(msg *nats.Msg) {
	var monitorID string
	if err := json.Unmarshal(msg.Data, &monitorID); err != nil {
		s.logger.Error("failed to unmarshal monitor ID", zap.Error(err))
		return
	}

	if ticker, exists := s.schedules[monitorID]; exists {
		ticker.Stop()
		delete(s.schedules, monitorID)
		delete(s.monitors, monitorID)
	}
}

func (s *Scheduler) Stop() {
	close(s.shutdownCh)
	for _, ticker := range s.schedules {
		ticker.Stop()
	}
}

func main() {
	// Initialize logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Initialize OpenTelemetry
	shutdown, err := observability.InitTracer("scheduler-service")
	if err != nil {
		logger.Fatal("failed to initialize tracer", zap.Error(err))
	}
	defer shutdown()

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

	// Create and start scheduler
	scheduler := NewScheduler(logger, nc)
	if err := scheduler.Start(); err != nil {
		logger.Fatal("failed to start scheduler", zap.Error(err))
	}

	// Wait for shutdown signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	// Graceful shutdown
	scheduler.Stop()
	logger.Info("scheduler stopped")
}
