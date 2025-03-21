// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.28.0

package sqlc

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type AlertCondition string

const (
	AlertConditionStatusCode   AlertCondition = "status_code"
	AlertConditionLatency      AlertCondition = "latency"
	AlertConditionAvailability AlertCondition = "availability"
	AlertConditionSslExpiry    AlertCondition = "ssl_expiry"
	AlertConditionKeyword      AlertCondition = "keyword"
	AlertConditionPattern      AlertCondition = "pattern"
)

func (e *AlertCondition) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = AlertCondition(s)
	case string:
		*e = AlertCondition(s)
	default:
		return fmt.Errorf("unsupported scan type for AlertCondition: %T", src)
	}
	return nil
}

type NullAlertCondition struct {
	AlertCondition AlertCondition
	Valid          bool // Valid is true if AlertCondition is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullAlertCondition) Scan(value interface{}) error {
	if value == nil {
		ns.AlertCondition, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.AlertCondition.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullAlertCondition) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.AlertCondition), nil
}

type AlertSeverity string

const (
	AlertSeverityInfo     AlertSeverity = "info"
	AlertSeverityWarning  AlertSeverity = "warning"
	AlertSeverityCritical AlertSeverity = "critical"
)

func (e *AlertSeverity) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = AlertSeverity(s)
	case string:
		*e = AlertSeverity(s)
	default:
		return fmt.Errorf("unsupported scan type for AlertSeverity: %T", src)
	}
	return nil
}

type NullAlertSeverity struct {
	AlertSeverity AlertSeverity
	Valid         bool // Valid is true if AlertSeverity is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullAlertSeverity) Scan(value interface{}) error {
	if value == nil {
		ns.AlertSeverity, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.AlertSeverity.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullAlertSeverity) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.AlertSeverity), nil
}

type AlertStatus string

const (
	AlertStatusTriggered    AlertStatus = "triggered"
	AlertStatusAcknowledged AlertStatus = "acknowledged"
	AlertStatusResolved     AlertStatus = "resolved"
)

func (e *AlertStatus) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = AlertStatus(s)
	case string:
		*e = AlertStatus(s)
	default:
		return fmt.Errorf("unsupported scan type for AlertStatus: %T", src)
	}
	return nil
}

type NullAlertStatus struct {
	AlertStatus AlertStatus
	Valid       bool // Valid is true if AlertStatus is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullAlertStatus) Scan(value interface{}) error {
	if value == nil {
		ns.AlertStatus, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.AlertStatus.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullAlertStatus) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.AlertStatus), nil
}

type MonitorStatus string

const (
	MonitorStatusActive MonitorStatus = "active"
	MonitorStatusPaused MonitorStatus = "paused"
	MonitorStatusError  MonitorStatus = "error"
)

func (e *MonitorStatus) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = MonitorStatus(s)
	case string:
		*e = MonitorStatus(s)
	default:
		return fmt.Errorf("unsupported scan type for MonitorStatus: %T", src)
	}
	return nil
}

type NullMonitorStatus struct {
	MonitorStatus MonitorStatus
	Valid         bool // Valid is true if MonitorStatus is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullMonitorStatus) Scan(value interface{}) error {
	if value == nil {
		ns.MonitorStatus, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.MonitorStatus.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullMonitorStatus) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.MonitorStatus), nil
}

type MonitorType string

const (
	MonitorTypeHttp MonitorType = "http"
	MonitorTypeTcp  MonitorType = "tcp"
	MonitorTypePing MonitorType = "ping"
	MonitorTypeDns  MonitorType = "dns"
)

func (e *MonitorType) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = MonitorType(s)
	case string:
		*e = MonitorType(s)
	default:
		return fmt.Errorf("unsupported scan type for MonitorType: %T", src)
	}
	return nil
}

type NullMonitorType struct {
	MonitorType MonitorType
	Valid       bool // Valid is true if MonitorType is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullMonitorType) Scan(value interface{}) error {
	if value == nil {
		ns.MonitorType, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.MonitorType.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullMonitorType) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.MonitorType), nil
}

type ThemePreference string

const (
	ThemePreferenceLight  ThemePreference = "light"
	ThemePreferenceDark   ThemePreference = "dark"
	ThemePreferenceSystem ThemePreference = "system"
)

func (e *ThemePreference) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = ThemePreference(s)
	case string:
		*e = ThemePreference(s)
	default:
		return fmt.Errorf("unsupported scan type for ThemePreference: %T", src)
	}
	return nil
}

type NullThemePreference struct {
	ThemePreference ThemePreference
	Valid           bool // Valid is true if ThemePreference is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullThemePreference) Scan(value interface{}) error {
	if value == nil {
		ns.ThemePreference, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.ThemePreference.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullThemePreference) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.ThemePreference), nil
}

type TimezonePreference string

const (
	TimezonePreferenceUTC               TimezonePreference = "UTC"
	TimezonePreferenceAmericaNewYork    TimezonePreference = "America/New_York"
	TimezonePreferenceAmericaLosAngeles TimezonePreference = "America/Los_Angeles"
	TimezonePreferenceEuropeLondon      TimezonePreference = "Europe/London"
	TimezonePreferenceEuropeParis       TimezonePreference = "Europe/Paris"
	TimezonePreferenceAsiaTokyo         TimezonePreference = "Asia/Tokyo"
	TimezonePreferenceAsiaSingapore     TimezonePreference = "Asia/Singapore"
	TimezonePreferenceAustraliaSydney   TimezonePreference = "Australia/Sydney"
)

func (e *TimezonePreference) Scan(src interface{}) error {
	switch s := src.(type) {
	case []byte:
		*e = TimezonePreference(s)
	case string:
		*e = TimezonePreference(s)
	default:
		return fmt.Errorf("unsupported scan type for TimezonePreference: %T", src)
	}
	return nil
}

type NullTimezonePreference struct {
	TimezonePreference TimezonePreference
	Valid              bool // Valid is true if TimezonePreference is not NULL
}

// Scan implements the Scanner interface.
func (ns *NullTimezonePreference) Scan(value interface{}) error {
	if value == nil {
		ns.TimezonePreference, ns.Valid = "", false
		return nil
	}
	ns.Valid = true
	return ns.TimezonePreference.Scan(value)
}

// Value implements the driver Valuer interface.
func (ns NullTimezonePreference) Value() (driver.Value, error) {
	if !ns.Valid {
		return nil, nil
	}
	return string(ns.TimezonePreference), nil
}

type AlertConfig struct {
	ID               uuid.UUID
	MonitorID        uuid.UUID
	Name             string
	Condition        AlertCondition
	Threshold        json.RawMessage
	Severity         AlertSeverity
	Enabled          bool
	ConsecutiveCount int32
	CooldownMinutes  int32
	CreatedAt        pgtype.Timestamptz
	UpdatedAt        pgtype.Timestamptz
}

type AlertHistory struct {
	ID               uuid.UUID
	ConfigID         uuid.UUID
	MonitorID        uuid.UUID
	Status           AlertStatus
	TriggeredAt      pgtype.Timestamptz
	AcknowledgedAt   pgtype.Timestamptz
	ResolvedAt       pgtype.Timestamptz
	AcknowledgedBy   pgtype.UUID
	Details          json.RawMessage
	NotificationSent bool
}

type Monitor struct {
	ID                  uuid.UUID
	UserID              uuid.UUID
	Name                string
	Type                MonitorType
	Target              string
	Interval            int32
	Timeout             int32
	Status              MonitorStatus
	Locations           []string
	ExpectedStatusCodes []int32
	FollowRedirects     pgtype.Bool
	VerifySsl           pgtype.Bool
	Port                pgtype.Int4
	DnsRecordType       pgtype.Text
	ExpectedResponse    pgtype.Text
	CreatedAt           pgtype.Timestamptz
	UpdatedAt           pgtype.Timestamptz
}

type MonitorResult struct {
	ID                uuid.UUID
	MonitorID         uuid.UUID
	Time              pgtype.Timestamptz
	Location          string
	Success           bool
	Latency           pgtype.Int4
	StatusCode        pgtype.Int4
	ResponseSize      pgtype.Int4
	ErrorMessage      pgtype.Text
	CertificateExpiry pgtype.Timestamptz
	DnsResolutionTime pgtype.Int4
	TlsHandshakeTime  pgtype.Int4
	ConnectTime       pgtype.Int4
	FirstByteTime     pgtype.Int4
	TotalTime         pgtype.Int4
}

type MonitorResultsHourly struct {
	Bucket           pgtype.Interval
	MonitorID        uuid.UUID
	Location         string
	TotalChecks      int64
	SuccessfulChecks int64
	AvgLatency       float64
	MinLatency       interface{}
	MaxLatency       interface{}
	MostCommonStatus interface{}
}

type NotificationPreference struct {
	UserID          uuid.UUID
	MonitorID       uuid.UUID
	Email           bool
	Sms             bool
	WebhookUrl      pgtype.Text
	SlackWebhookUrl pgtype.Text
	TelegramChatID  pgtype.Text
	SeverityFilter  []AlertSeverity
	QuietHoursStart pgtype.Time
	QuietHoursEnd   pgtype.Time
	CreatedAt       pgtype.Timestamptz
	UpdatedAt       pgtype.Timestamptz
}

type UserLimit struct {
	UserID                    uuid.UUID
	MaxMonitors               int32
	MaxChecksPerDay           int32
	MaxAlertConfigsPerMonitor int32
	MaxNotificationChannels   int32
	RetentionDays             int32
	ApiRateLimitPerMinute     int32
	CreatedAt                 pgtype.Timestamptz
	UpdatedAt                 pgtype.Timestamptz
}

type UserSetting struct {
	UserID                   uuid.UUID
	Theme                    ThemePreference
	Timezone                 TimezonePreference
	DateFormat               string
	TimeFormat               string
	DefaultDashboardView     string
	DashboardRefreshInterval int32
	EmailDigestEnabled       bool
	EmailDigestFrequency     string
	MobileNumber             pgtype.Text
	TelegramUsername         pgtype.Text
	WebhookSecret            pgtype.Text
	ApiKeyEnabled            bool
	ApiKey                   pgtype.Text
	ApiKeyCreatedAt          pgtype.Timestamptz
	ApiKeyLastUsedAt         pgtype.Timestamptz
	CreatedAt                pgtype.Timestamptz
	UpdatedAt                pgtype.Timestamptz
}

type UserUsageStat struct {
	UserID                 uuid.UUID
	Date                   pgtype.Date
	TotalChecks            int32
	TotalAlertsTriggered   int32
	TotalNotificationsSent int32
	ApiCalls               int32
	DataTransferBytes      int64
}
