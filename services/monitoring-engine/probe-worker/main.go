package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/google/uuid"
	"github.com/jjkirkpatrick/monitoring/pkg/observability"
	"github.com/nats-io/nats.go"
	"go.uber.org/zap"
)

type ProbeWorker struct {
	ID        string
	logger    *zap.Logger
	natsConn  *nats.Conn
	client    *http.Client
	supported []string
}

func NewProbeWorker(logger *zap.Logger, natsConn *nats.Conn) *ProbeWorker {
	return &ProbeWorker{
		ID:     uuid.New().String(),
		logger: logger,
		natsConn: natsConn,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		supported: []string{"HTTP", "HTTPS", "TCP", "UDP", "DNS"},
	}
}

func (w *ProbeWorker) Start() error {
	// Register with probe manager
	registration, _ := json.Marshal(map[string]interface{}{
		"id":          w.ID,
		"check_types": w.supported,
	})
	if err := w.natsConn.Publish("probes.register", registration); err != nil {
		return fmt.Errorf("failed to register worker: %v", err)
	}

	// Start heartbeat routine
	go w.sendHeartbeats()

	// Subscribe to check assignments
	subject := fmt.Sprintf("probes.check.assign.%s", w.ID)
	if _, err := w.natsConn.Subscribe(subject, w.handleCheckAssignment); err != nil {
		return fmt.Errorf("failed to subscribe to check assignments: %v", err)
	}

	return nil
}

func (w *ProbeWorker) sendHeartbeats() {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	heartbeat, _ := json.Marshal(map[string]string{
		"worker_id": w.ID,
	})

	for range ticker.C {
		if err := w.natsConn.Publish("probes.heartbeat", heartbeat); err != nil {
			w.logger.Error("failed to send heartbeat", zap.Error(err))
		}
	}
}

func (w *ProbeWorker) handleCheckAssignment(msg *nats.Msg) {
	var assignment struct {
		MonitorID string `json:"monitor_id"`
		URL       string `json:"url"`
		Type      string `json:"type"`
		Timeout   string `json:"timeout"`
	}
	if err := json.Unmarshal(msg.Data, &assignment); err != nil {
		w.logger.Error("failed to unmarshal check assignment", zap.Error(err))
		return
	}

	// Parse timeout
	timeout, err := time.ParseDuration(assignment.Timeout)
	if err != nil {
		timeout = 10 * time.Second
	}

	// Execute check based on type
	start := time.Now()
	result := w.executeCheck(assignment.Type, assignment.URL, timeout)
	duration := time.Since(start)

	// Publish check result
	checkResult, _ := json.Marshal(map[string]interface{}{
		"monitor_id": assignment.MonitorID,
		"worker_id":  w.ID,
		"timestamp":  time.Now(),
		"duration":   duration.Milliseconds(),
		"success":    result.Success,
		"error":      result.Error,
		"details":    result.Details,
	})

	if err := w.natsConn.Publish("probes.check.result", checkResult); err != nil {
		w.logger.Error("failed to publish check result", zap.Error(err))
	}
}

type CheckResult struct {
	Success bool              `json:"success"`
	Error   string           `json:"error,omitempty"`
	Details map[string]string `json:"details,omitempty"`
}

func (w *ProbeWorker) executeCheck(checkType, target string, timeout time.Duration) CheckResult {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	switch strings.ToUpper(checkType) {
	case "HTTP", "HTTPS":
		return w.httpCheck(ctx, target)
	case "TCP":
		return w.tcpCheck(ctx, target)
	case "UDP":
		return w.udpCheck(ctx, target)
	case "DNS":
		return w.dnsCheck(ctx, target)
	default:
		return CheckResult{
			Success: false,
			Error:   fmt.Sprintf("unsupported check type: %s", checkType),
		}
	}
}

func (w *ProbeWorker) httpCheck(ctx context.Context, url string) CheckResult {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return CheckResult{Success: false, Error: err.Error()}
	}

	resp, err := w.client.Do(req)
	if err != nil {
		return CheckResult{Success: false, Error: err.Error()}
	}
	defer resp.Body.Close()

	return CheckResult{
		Success: resp.StatusCode < 400,
		Details: map[string]string{
			"status_code": fmt.Sprintf("%d", resp.StatusCode),
			"status":      resp.Status,
		},
	}
}

func (w *ProbeWorker) tcpCheck(ctx context.Context, target string) CheckResult {
	var d net.Dialer
	conn, err := d.DialContext(ctx, "tcp", target)
	if err != nil {
		return CheckResult{Success: false, Error: err.Error()}
	}
	defer conn.Close()

	return CheckResult{Success: true}
}

func (w *ProbeWorker) udpCheck(ctx context.Context, target string) CheckResult {
	var d net.Dialer
	conn, err := d.DialContext(ctx, "udp", target)
	if err != nil {
		return CheckResult{Success: false, Error: err.Error()}
	}
	defer conn.Close()

	return CheckResult{Success: true}
}

func (w *ProbeWorker) dnsCheck(ctx context.Context, target string) CheckResult {
	resolver := &net.Resolver{}
	ips, err := resolver.LookupIPAddr(ctx, target)
	if err != nil {
		return CheckResult{Success: false, Error: err.Error()}
	}

	details := make(map[string]string)
	for i, ip := range ips {
		details[fmt.Sprintf("ip_%d", i+1)] = ip.String()
	}

	return CheckResult{
		Success: true,
		Details: details,
	}
}

func main() {
	// Initialize logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Initialize OpenTelemetry
	shutdown, err := observability.InitTracer("probe-worker")
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

	// Create and start probe worker
	worker := NewProbeWorker(logger, nc)
	if err := worker.Start(); err != nil {
		logger.Fatal("failed to start probe worker", zap.Error(err))
	}

	// Wait for shutdown signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	logger.Info("probe worker stopped")
}
