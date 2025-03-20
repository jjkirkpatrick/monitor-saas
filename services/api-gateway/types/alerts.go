package types

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// AlertSeverity represents the severity level of an alert
type AlertSeverity string

const (
	AlertSeverityInfo     AlertSeverity = "info"
	AlertSeverityWarning  AlertSeverity = "warning"
	AlertSeverityCritical AlertSeverity = "critical"
)

// AlertStatus represents the current status of an alert
type AlertStatus string

const (
	AlertStatusTriggered    AlertStatus = "triggered"
	AlertStatusAcknowledged AlertStatus = "acknowledged"
	AlertStatusResolved     AlertStatus = "resolved"
)

// AlertCondition represents the type of condition that triggers an alert
type AlertCondition string

const (
	AlertConditionStatusCode    AlertCondition = "status_code"
	AlertConditionLatency       AlertCondition = "latency"
	AlertConditionAvailability  AlertCondition = "availability"
	AlertConditionSSLExpiry     AlertCondition = "ssl_expiry"
	AlertConditionKeyword       AlertCondition = "keyword"
	AlertConditionPattern       AlertCondition = "pattern"
)

// AlertThreshold represents the threshold configuration for an alert
type AlertThreshold struct {
	Min           *float64 `json:"min,omitempty"`
	Max           *float64 `json:"max,omitempty"`
	ExactMatch    *string  `json:"exact_match,omitempty"`
	Pattern       *string  `json:"pattern,omitempty"`
	DaysInAdvance *int     `json:"days_in_advance,omitempty"` // For SSL expiry alerts
}

// CreateAlertConfigRequest represents the request body for creating a new alert configuration
type CreateAlertConfigRequest struct {
	MonitorID        uuid.UUID      `json:"monitor_id" binding:"required"`
	Name             string         `json:"name" binding:"required"`
	Condition        AlertCondition `json:"condition" binding:"required"`
	Threshold        AlertThreshold `json:"threshold" binding:"required"`
	Severity         AlertSeverity  `json:"severity" binding:"required"`
	ConsecutiveCount int            `json:"consecutive_count" binding:"required,min=1"`
	CooldownMinutes  int            `json:"cooldown_minutes" binding:"required,min=1"`
}

// UpdateAlertConfigRequest represents the request body for updating an alert configuration
type UpdateAlertConfigRequest struct {
	Name             *string         `json:"name,omitempty"`
	Condition        *AlertCondition `json:"condition,omitempty"`
	Threshold        *AlertThreshold `json:"threshold,omitempty"`
	Severity         *AlertSeverity  `json:"severity,omitempty"`
	ConsecutiveCount *int            `json:"consecutive_count,omitempty" binding:"omitempty,min=1"`
	CooldownMinutes  *int            `json:"cooldown_minutes,omitempty" binding:"omitempty,min=1"`
	Enabled          *bool           `json:"enabled,omitempty"`
}

// AlertConfig represents an alert configuration entity
type AlertConfig struct {
	ID               uuid.UUID      `json:"id"`
	MonitorID        uuid.UUID      `json:"monitor_id"`
	Name             string         `json:"name"`
	Condition        AlertCondition `json:"condition"`
	Threshold        AlertThreshold `json:"threshold"`
	Severity         AlertSeverity  `json:"severity"`
	Enabled          bool           `json:"enabled"`
	ConsecutiveCount int            `json:"consecutive_count"`
	CooldownMinutes  int            `json:"cooldown_minutes"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
}

// AlertHistory represents an alert history entry
type AlertHistory struct {
	ID             uuid.UUID          `json:"id"`
	ConfigID       uuid.UUID          `json:"config_id"`
	MonitorID      uuid.UUID          `json:"monitor_id"`
	Status         AlertStatus        `json:"status"`
	TriggeredAt    time.Time          `json:"triggered_at"`
	AcknowledgedAt *time.Time         `json:"acknowledged_at,omitempty"`
	ResolvedAt     *time.Time         `json:"resolved_at,omitempty"`
	AcknowledgedBy *uuid.UUID         `json:"acknowledged_by,omitempty"`
	Details        json.RawMessage    `json:"details"`
}

// NotificationPreferences represents a user's notification preferences
type NotificationPreferences struct {
	UserID           uuid.UUID      `json:"user_id"`
	MonitorID        *uuid.UUID     `json:"monitor_id,omitempty"`
	Email            bool           `json:"email"`
	SMS              bool           `json:"sms"`
	WebhookURL       *string        `json:"webhook_url,omitempty"`
	SlackWebhookURL  *string        `json:"slack_webhook_url,omitempty"`
	TelegramChatID   *string        `json:"telegram_chat_id,omitempty"`
	SeverityFilter   []AlertSeverity `json:"severity_filter"`
	QuietHoursStart  *time.Time     `json:"quiet_hours_start,omitempty"`
	QuietHoursEnd    *time.Time     `json:"quiet_hours_end,omitempty"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
}

// ListAlertConfigsResponse represents the response for listing alert configurations
type ListAlertConfigsResponse struct {
	AlertConfigs []AlertConfig `json:"alert_configs"`
	Total        int          `json:"total"`
}

// GetAlertConfigResponse represents the response for getting a single alert configuration
type GetAlertConfigResponse struct {
	AlertConfig AlertConfig `json:"alert_config"`
}

// ListAlertHistoryResponse represents the response for listing alert history
type ListAlertHistoryResponse struct {
	AlertHistory []AlertHistory `json:"alert_history"`
	Total        int           `json:"total"`
}

// GetAlertHistoryResponse represents the response for getting a single alert history entry
type GetAlertHistoryResponse struct {
	AlertHistory AlertHistory `json:"alert_history"`
}
