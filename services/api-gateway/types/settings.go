package types

import (
	"time"

	"github.com/google/uuid"
)

// ThemePreference represents the user's theme preference
type ThemePreference string

const (
	ThemeLight  ThemePreference = "light"
	ThemeDark   ThemePreference = "dark"
	ThemeSystem ThemePreference = "system"
)

// TimezonePreference represents the user's timezone preference
type TimezonePreference string

const (
	TimezoneUTC             TimezonePreference = "UTC"
	TimezoneNewYork         TimezonePreference = "America/New_York"
	TimezoneLosAngeles      TimezonePreference = "America/Los_Angeles"
	TimezoneLondon          TimezonePreference = "Europe/London"
	TimezoneParis           TimezonePreference = "Europe/Paris"
	TimezoneTokyo           TimezonePreference = "Asia/Tokyo"
	TimezoneSingapore       TimezonePreference = "Asia/Singapore"
	TimezoneSydney          TimezonePreference = "Australia/Sydney"
)

// UserSettings represents a user's settings
type UserSettings struct {
	UserID                 uuid.UUID         `json:"user_id"`
	Theme                  ThemePreference   `json:"theme"`
	Timezone              TimezonePreference `json:"timezone"`
	DateFormat            string            `json:"date_format"`
	TimeFormat            string            `json:"time_format"`
	DefaultDashboardView   string            `json:"default_dashboard_view"`
	DashboardRefreshInterval int             `json:"dashboard_refresh_interval"`
	EmailDigestEnabled    bool              `json:"email_digest_enabled"`
	EmailDigestFrequency  string            `json:"email_digest_frequency"`
	MobileNumber         *string            `json:"mobile_number,omitempty"`
	TelegramUsername     *string            `json:"telegram_username,omitempty"`
	WebhookSecret        *string            `json:"webhook_secret,omitempty"`
	APIKeyEnabled        bool               `json:"api_key_enabled"`
	APIKey              *string            `json:"api_key,omitempty"`
	APIKeyCreatedAt     *time.Time         `json:"api_key_created_at,omitempty"`
	APIKeyLastUsedAt    *time.Time         `json:"api_key_last_used_at,omitempty"`
	CreatedAt            time.Time          `json:"created_at"`
	UpdatedAt            time.Time          `json:"updated_at"`
}

// UserLimits represents a user's usage limits
type UserLimits struct {
	UserID                      uuid.UUID `json:"user_id"`
	MaxMonitors                 int       `json:"max_monitors"`
	MaxChecksPerDay            int       `json:"max_checks_per_day"`
	MaxAlertConfigsPerMonitor  int       `json:"max_alert_configs_per_monitor"`
	MaxNotificationChannels    int       `json:"max_notification_channels"`
	RetentionDays             int       `json:"retention_days"`
	APIRateLimitPerMinute     int       `json:"api_rate_limit_per_minute"`
	CreatedAt                 time.Time  `json:"created_at"`
	UpdatedAt                 time.Time  `json:"updated_at"`
}

// UserUsageStats represents a user's usage statistics
type UserUsageStats struct {
	UserID                uuid.UUID `json:"user_id"`
	Date                 time.Time `json:"date"`
	TotalChecks          int       `json:"total_checks"`
	TotalAlertsTriggered int       `json:"total_alerts_triggered"`
	TotalNotificationsSent int     `json:"total_notifications_sent"`
	APICalls             int       `json:"api_calls"`
	DataTransferBytes    int64     `json:"data_transfer_bytes"`
}

// UpdateSettingsRequest represents the request body for updating user settings
type UpdateSettingsRequest struct {
	Theme                  *ThemePreference   `json:"theme,omitempty"`
	Timezone              *TimezonePreference `json:"timezone,omitempty"`
	DateFormat            *string            `json:"date_format,omitempty"`
	TimeFormat            *string            `json:"time_format,omitempty"`
	DefaultDashboardView   *string            `json:"default_dashboard_view,omitempty"`
	DashboardRefreshInterval *int             `json:"dashboard_refresh_interval,omitempty"`
	EmailDigestEnabled    *bool              `json:"email_digest_enabled,omitempty"`
	EmailDigestFrequency  *string            `json:"email_digest_frequency,omitempty"`
	MobileNumber         *string            `json:"mobile_number,omitempty"`
	TelegramUsername     *string            `json:"telegram_username,omitempty"`
	WebhookSecret        *string            `json:"webhook_secret,omitempty"`
	APIKeyEnabled        *bool              `json:"api_key_enabled,omitempty"`
}

// GetSettingsResponse represents the response for getting user settings
type GetSettingsResponse struct {
	Settings UserSettings `json:"settings"`
	Limits   UserLimits  `json:"limits"`
	Usage    UserUsageStats `json:"usage"`
}

// GenerateAPIKeyResponse represents the response for generating a new API key
type GenerateAPIKeyResponse struct {
	APIKey     string    `json:"api_key"`
	CreatedAt  time.Time `json:"created_at"`
	ExpiresAt  time.Time `json:"expires_at"`
}

// ToggleSettingResponse represents the response for toggling a boolean setting
type ToggleSettingResponse struct {
	Setting   string    `json:"setting"`
	Value     bool      `json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TestWebhookRequest represents the request for testing a webhook
type TestWebhookRequest struct {
	URL string `json:"url" binding:"required"`
}

// TestWebhookResponse represents the response for testing a webhook
type TestWebhookResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}
