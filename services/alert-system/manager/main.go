package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/jjkirkpatrick/monitoring/pkg/observability"
	_ "github.com/lib/pq"
	"github.com/nats-io/nats.go"
	"go.uber.org/zap"
)

type AlertManager struct {
	logger    *zap.Logger
	natsConn  *nats.Conn
	db        *sql.DB
	cache     map[string]*AlertRule
	cacheLock sync.RWMutex
}

type AlertRule struct {
	ID              string         `json:"id"`
	MonitorID       string         `json:"monitor_id"`
	Name            string         `json:"name"`
	Condition       string         `json:"condition"` // e.g., "response_time > 1000" or "status == error"
	ThresholdValue  float64        `json:"threshold_value"`
	ThresholdUnit   string         `json:"threshold_unit"` // ms, %, etc.
	WindowDuration  time.Duration  `json:"window_duration"`
	AlertFrequency  time.Duration  `json:"alert_frequency"`
	LastAlertTime   time.Time      `json:"last_alert_time"`
	Channels        []string       `json:"channels"` // email, sms, slack, etc.
	LastEvaluation  time.Time      `json:"last_evaluation"`
	Status          string         `json:"status"` // active, resolved, etc.
	IncidentID      sql.NullString `json:"incident_id"`
}

type Incident struct {
	ID          string    `json:"id"`
	AlertRuleID string    `json:"alert_rule_id"`
	MonitorID   string    `json:"monitor_id"`
	Status      string    `json:"status"` // open, acknowledged, resolved
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time,omitempty"`
	UpdateTime  time.Time `json:"update_time"`
}

func NewAlertManager(logger *zap.Logger, natsConn *nats.Conn, db *sql.DB) *AlertManager {
	return &AlertManager{
		logger:    logger,
		natsConn:  natsConn,
		db:        db,
		cache:     make(map[string]*AlertRule),
		cacheLock: sync.RWMutex{},
	}
}

func (am *AlertManager) Start() error {
	// Initialize database
	if err := am.initDatabase(); err != nil {
		return err
	}

	// Load alert rules into cache
	if err := am.loadAlertRules(); err != nil {
		return err
	}

	// Subscribe to check results
	if _, err := am.natsConn.Subscribe("probes.check.result", am.handleCheckResult); err != nil {
		return err
	}

	// Subscribe to alert rule updates
	if _, err := am.natsConn.Subscribe("alerts.rule.update", am.handleRuleUpdate); err != nil {
		return err
	}

	// Start periodic evaluation
	go am.runPeriodicEvaluation()

	return nil
}

func (am *AlertManager) initDatabase() error {
	_, err := am.db.Exec(`
		CREATE TABLE IF NOT EXISTS alert_rules (
			id TEXT PRIMARY KEY,
			monitor_id TEXT NOT NULL,
			name TEXT NOT NULL,
			condition TEXT NOT NULL,
			threshold_value DOUBLE PRECISION NOT NULL,
			threshold_unit TEXT NOT NULL,
			window_duration INTERVAL NOT NULL,
			alert_frequency INTERVAL NOT NULL,
			last_alert_time TIMESTAMPTZ,
			channels TEXT[] NOT NULL,
			last_evaluation TIMESTAMPTZ,
			status TEXT NOT NULL,
			incident_id TEXT
		);

		CREATE TABLE IF NOT EXISTS incidents (
			id TEXT PRIMARY KEY,
			alert_rule_id TEXT NOT NULL,
			monitor_id TEXT NOT NULL,
			status TEXT NOT NULL,
			start_time TIMESTAMPTZ NOT NULL,
			end_time TIMESTAMPTZ,
			update_time TIMESTAMPTZ NOT NULL,
			FOREIGN KEY (alert_rule_id) REFERENCES alert_rules(id)
		);

		CREATE INDEX IF NOT EXISTS idx_alert_rules_monitor ON alert_rules(monitor_id);
		CREATE INDEX IF NOT EXISTS idx_incidents_alert_rule ON incidents(alert_rule_id);
		CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
	`)
	return err
}

func (am *AlertManager) loadAlertRules() error {
	rows, err := am.db.Query("SELECT * FROM alert_rules WHERE status = 'active'")
	if err != nil {
		return err
	}
	defer rows.Close()

	am.cacheLock.Lock()
	defer am.cacheLock.Unlock()

	for rows.Next() {
		var rule AlertRule
		if err := rows.Scan(
			&rule.ID, &rule.MonitorID, &rule.Name, &rule.Condition,
			&rule.ThresholdValue, &rule.ThresholdUnit, &rule.WindowDuration,
			&rule.AlertFrequency, &rule.LastAlertTime, &rule.Channels,
			&rule.LastEvaluation, &rule.Status, &rule.IncidentID,
		); err != nil {
			return err
		}
		am.cache[rule.ID] = &rule
	}

	return rows.Err()
}

func (am *AlertManager) handleCheckResult(msg *nats.Msg) {
	var result struct {
		MonitorID string    `json:"monitor_id"`
		Success   bool      `json:"success"`
		Duration  int64     `json:"duration"`
		Timestamp time.Time `json:"timestamp"`
	}
	if err := json.Unmarshal(msg.Data, &result); err != nil {
		am.logger.Error("failed to unmarshal check result", zap.Error(err))
		return
	}

	// Evaluate applicable rules
	am.cacheLock.RLock()
	defer am.cacheLock.RUnlock()

	for _, rule := range am.cache {
		if rule.MonitorID == result.MonitorID {
			if err := am.evaluateRule(rule, result); err != nil {
				am.logger.Error("failed to evaluate rule",
					zap.Error(err),
					zap.String("rule_id", rule.ID))
			}
		}
	}
}

type CheckResult struct {
	MonitorID string    `json:"monitor_id"`
	Success   bool      `json:"success"`
	Duration  int64     `json:"duration"`
	Timestamp time.Time `json:"timestamp"`
}

func (am *AlertManager) evaluateRule(rule *AlertRule, result CheckResult) error {
	// Check if it's time to alert based on frequency
	if time.Since(rule.LastAlertTime) < rule.AlertFrequency {
		return nil
	}

	var shouldAlert bool
	switch rule.Condition {
	case "status == error":
		shouldAlert = !result.Success
	case "response_time > threshold":
		shouldAlert = float64(result.Duration) > rule.ThresholdValue
	}

	if shouldAlert {
		// Create or update incident
		if rule.IncidentID.Valid {
			// Update existing incident
			if err := am.updateIncident(rule.IncidentID.String, result.Timestamp); err != nil {
				return err
			}
		} else {
			// Create new incident
			incidentID, err := am.createIncident(rule.ID, result.MonitorID, result.Timestamp)
			if err != nil {
				return err
			}
			rule.IncidentID = sql.NullString{String: incidentID, Valid: true}
		}

		// Send notification
		notification, _ := json.Marshal(map[string]interface{}{
			"type":        "alert",
			"rule_id":     rule.ID,
			"monitor_id":  rule.MonitorID,
			"incident_id": rule.IncidentID.String,
			"channels":    rule.Channels,
			"timestamp":   result.Timestamp,
			"message":     rule.Name,
		})
		if err := am.natsConn.Publish("notifications.send", notification); err != nil {
			am.logger.Error("failed to publish notification", zap.Error(err))
		}

		rule.LastAlertTime = result.Timestamp
	} else if rule.IncidentID.Valid {
		// Resolve incident if conditions are back to normal
		if err := am.resolveIncident(rule.IncidentID.String, result.Timestamp); err != nil {
			return err
		}
		rule.IncidentID = sql.NullString{Valid: false}
	}

	return nil
}

func (am *AlertManager) createIncident(ruleID, monitorID string, timestamp time.Time) (string, error) {
	var incidentID string
	err := am.db.QueryRow(`
		INSERT INTO incidents (
			id, alert_rule_id, monitor_id, status, start_time, update_time
		) VALUES (
			gen_random_uuid(), $1, $2, 'open', $3, $3
		) RETURNING id`,
		ruleID, monitorID, timestamp,
	).Scan(&incidentID)
	return incidentID, err
}

func (am *AlertManager) updateIncident(incidentID string, timestamp time.Time) error {
	_, err := am.db.Exec(`
		UPDATE incidents
		SET update_time = $2
		WHERE id = $1`,
		incidentID, timestamp,
	)
	return err
}

func (am *AlertManager) resolveIncident(incidentID string, timestamp time.Time) error {
	_, err := am.db.Exec(`
		UPDATE incidents
		SET status = 'resolved', end_time = $2, update_time = $2
		WHERE id = $1`,
		incidentID, timestamp,
	)
	return err
}

func (am *AlertManager) handleRuleUpdate(msg *nats.Msg) {
	var rule AlertRule
	if err := json.Unmarshal(msg.Data, &rule); err != nil {
		am.logger.Error("failed to unmarshal rule update", zap.Error(err))
		return
	}

	am.cacheLock.Lock()
	defer am.cacheLock.Unlock()

	if rule.Status == "deleted" {
		delete(am.cache, rule.ID)
	} else {
		am.cache[rule.ID] = &rule
	}
}

func (am *AlertManager) runPeriodicEvaluation() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		am.cacheLock.RLock()
		for _, rule := range am.cache {
			// Evaluate window-based conditions
			if err := am.evaluateWindowedRule(rule); err != nil {
				am.logger.Error("failed to evaluate windowed rule",
					zap.Error(err),
					zap.String("rule_id", rule.ID))
			}
		}
		am.cacheLock.RUnlock()
	}
}

func (am *AlertManager) evaluateWindowedRule(rule *AlertRule) error {
	// Query aggregated data for the window
	var failureCount, totalCount int
	err := am.db.QueryRow(`
		SELECT
			COUNT(*) FILTER (WHERE success = false) as failure_count,
			COUNT(*) as total_count
		FROM check_results
		WHERE
			monitor_id = $1 AND
			timestamp > NOW() - $2::interval`,
		rule.MonitorID, rule.WindowDuration,
	).Scan(&failureCount, &totalCount)
	if err != nil {
		return err
	}

	if totalCount == 0 {
		return nil
	}

	failureRate := float64(failureCount) / float64(totalCount) * 100
	if failureRate > rule.ThresholdValue {
		// Create incident and send notification
		if !rule.IncidentID.Valid {
			incidentID, err := am.createIncident(rule.ID, rule.MonitorID, time.Now())
			if err != nil {
				return err
			}
			rule.IncidentID = sql.NullString{String: incidentID, Valid: true}

			notification, _ := json.Marshal(map[string]interface{}{
				"type":        "alert",
				"rule_id":     rule.ID,
				"monitor_id":  rule.MonitorID,
				"incident_id": incidentID,
				"channels":    rule.Channels,
				"timestamp":   time.Now(),
				"message":     fmt.Sprintf("%s: Failure rate %.2f%% exceeds threshold %.2f%%", rule.Name, failureRate, rule.ThresholdValue),
			})
			if err := am.natsConn.Publish("notifications.send", notification); err != nil {
				am.logger.Error("failed to publish notification", zap.Error(err))
			}
		}
	} else if rule.IncidentID.Valid {
		// Resolve incident if conditions are back to normal
		if err := am.resolveIncident(rule.IncidentID.String, time.Now()); err != nil {
			return err
		}
		rule.IncidentID = sql.NullString{Valid: false}
	}

	return nil
}

func main() {
	// Initialize logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Initialize OpenTelemetry
	shutdown, err := observability.InitTracer("alert-manager")
	if err != nil {
		logger.Fatal("failed to initialize tracer", zap.Error(err))
	}
	defer shutdown()

	// Connect to PostgreSQL
	db, err := sql.Open("postgres", os.Getenv("POSTGRES_DSN"))
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

	// Create and start alert manager
	manager := NewAlertManager(logger, nc, db)
	if err := manager.Start(); err != nil {
		logger.Fatal("failed to start alert manager", zap.Error(err))
	}

	// Wait for shutdown signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	logger.Info("alert manager stopped")
}
