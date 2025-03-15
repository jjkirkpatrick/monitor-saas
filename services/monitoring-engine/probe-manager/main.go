package main

import (
	"encoding/json"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/jjkirkpatrick/monitoring/pkg/observability"
	"github.com/nats-io/nats.go"
	"go.uber.org/zap"
)

type ProbeWorker struct {
	ID        string    `json:"id"`
	LastSeen  time.Time `json:"last_seen"`
	Status    string    `json:"status"`
	CheckType []string  `json:"check_types"` // Supported check types (HTTP, HTTPS, TCP, UDP, DNS)
}

type ProbeManager struct {
	logger   *zap.Logger
	natsConn *nats.Conn
	workers  map[string]*ProbeWorker
	mu       sync.RWMutex
}

func NewProbeManager(logger *zap.Logger, natsConn *nats.Conn) *ProbeManager {
	return &ProbeManager{
		logger:   logger,
		natsConn: natsConn,
		workers:  make(map[string]*ProbeWorker),
	}
}

func (pm *ProbeManager) Start() error {
	// Subscribe to probe worker registrations
	if _, err := pm.natsConn.Subscribe("probes.register", pm.handleWorkerRegistration); err != nil {
		return err
	}

	// Subscribe to probe worker heartbeats
	if _, err := pm.natsConn.Subscribe("probes.heartbeat", pm.handleWorkerHeartbeat); err != nil {
		return err
	}

	// Subscribe to check requests from scheduler
	if _, err := pm.natsConn.Subscribe("probes.check.request", pm.handleCheckRequest); err != nil {
		return err
	}

	// Start worker cleanup routine
	go pm.cleanupInactiveWorkers()

	return nil
}

func (pm *ProbeManager) handleWorkerRegistration(msg *nats.Msg) {
	var worker ProbeWorker
	if err := json.Unmarshal(msg.Data, &worker); err != nil {
		pm.logger.Error("failed to unmarshal worker registration", zap.Error(err))
		return
	}

	pm.mu.Lock()
	worker.LastSeen = time.Now()
	worker.Status = "active"
	pm.workers[worker.ID] = &worker
	pm.mu.Unlock()

	pm.logger.Info("worker registered", zap.String("worker_id", worker.ID))
}

func (pm *ProbeManager) handleWorkerHeartbeat(msg *nats.Msg) {
	var heartbeat struct {
		WorkerID string `json:"worker_id"`
	}
	if err := json.Unmarshal(msg.Data, &heartbeat); err != nil {
		pm.logger.Error("failed to unmarshal worker heartbeat", zap.Error(err))
		return
	}

	pm.mu.Lock()
	if worker, exists := pm.workers[heartbeat.WorkerID]; exists {
		worker.LastSeen = time.Now()
		worker.Status = "active"
	}
	pm.mu.Unlock()
}

func (pm *ProbeManager) handleCheckRequest(msg *nats.Msg) {
	var request struct {
		MonitorID string `json:"monitor_id"`
		URL       string `json:"url"`
		Type      string `json:"type"`
		Timeout   string `json:"timeout"`
	}
	if err := json.Unmarshal(msg.Data, &request); err != nil {
		pm.logger.Error("failed to unmarshal check request", zap.Error(err))
		return
	}

	// Find available worker that supports the check type
	var selectedWorker *ProbeWorker
	pm.mu.RLock()
	for _, worker := range pm.workers {
		if worker.Status == "active" {
			for _, checkType := range worker.CheckType {
				if checkType == request.Type {
					selectedWorker = worker
					break
				}
			}
		}
		if selectedWorker != nil {
			break
		}
	}
	pm.mu.RUnlock()

	if selectedWorker == nil {
		pm.logger.Error("no available workers for check type",
			zap.String("monitor_id", request.MonitorID),
			zap.String("type", request.Type))
		return
	}

	// Forward check request to selected worker
	checkAssignment, _ := json.Marshal(map[string]interface{}{
		"monitor_id": request.MonitorID,
		"url":       request.URL,
		"type":      request.Type,
		"timeout":   request.Timeout,
		"worker_id": selectedWorker.ID,
	})

	subject := "probes.check.assign." + selectedWorker.ID
	if err := pm.natsConn.Publish(subject, checkAssignment); err != nil {
		pm.logger.Error("failed to publish check assignment",
			zap.String("worker_id", selectedWorker.ID),
			zap.Error(err))
	}
}

func (pm *ProbeManager) cleanupInactiveWorkers() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		now := time.Now()
		pm.mu.Lock()
		for id, worker := range pm.workers {
			if now.Sub(worker.LastSeen) > 1*time.Minute {
				worker.Status = "inactive"
				if now.Sub(worker.LastSeen) > 5*time.Minute {
					delete(pm.workers, id)
					pm.logger.Info("removed inactive worker", zap.String("worker_id", id))
				}
			}
		}
		pm.mu.Unlock()
	}
}

func main() {
	// Initialize logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Initialize OpenTelemetry
	shutdown, err := observability.InitTracer("probe-manager")
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

	// Create and start probe manager
	manager := NewProbeManager(logger, nc)
	if err := manager.Start(); err != nil {
		logger.Fatal("failed to start probe manager", zap.Error(err))
	}

	// Wait for shutdown signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	logger.Info("probe manager stopped")
}
