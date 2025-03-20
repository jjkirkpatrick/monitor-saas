package types

import (
	"time"

	"github.com/google/uuid"
)

// MonitorType represents the type of monitoring to be performed
type MonitorType string

const (
	MonitorTypeHTTP MonitorType = "http"
	MonitorTypeTCP  MonitorType = "tcp"
	MonitorTypePing MonitorType = "ping"
	MonitorTypeDNS  MonitorType = "dns"
)

// MonitorStatus represents the current status of a monitor
type MonitorStatus string

const (
	MonitorStatusActive MonitorStatus = "active"
	MonitorStatusPaused MonitorStatus = "paused"
	MonitorStatusError  MonitorStatus = "error"
)

// CreateMonitorRequest represents the request body for creating a new monitor
type CreateMonitorRequest struct {
	Name             string       `json:"name" binding:"required"`
	Type             MonitorType  `json:"type" binding:"required"`
	Target           string       `json:"target" binding:"required"`
	Interval         int          `json:"interval" binding:"required,min=30"`
	Timeout          int          `json:"timeout" binding:"required,min=5"`
	Status           MonitorStatus `json:"status"`
	Locations        []string     `json:"locations" binding:"required,min=1"`
	ExpectedStatusCodes []int     `json:"expected_status_codes,omitempty"`
	FollowRedirects  *bool        `json:"follow_redirects,omitempty"`
	VerifySSL        *bool        `json:"verify_ssl,omitempty"`
	Port             *int         `json:"port,omitempty"`
	DNSRecordType    *string      `json:"dns_record_type,omitempty"`
	ExpectedResponse *string      `json:"expected_response,omitempty"`
}

// UpdateMonitorRequest represents the request body for updating a monitor
type UpdateMonitorRequest struct {
	Name             *string      `json:"name,omitempty"`
	Type             *MonitorType `json:"type,omitempty"`
	Target           *string      `json:"target,omitempty"`
	Interval         *int         `json:"interval,omitempty" binding:"omitempty,min=30"`
	Timeout          *int         `json:"timeout,omitempty" binding:"omitempty,min=5"`
	Status           *MonitorStatus `json:"status,omitempty"`
	Locations        []string     `json:"locations,omitempty" binding:"omitempty,min=1"`
	ExpectedStatusCodes []int     `json:"expected_status_codes,omitempty"`
	FollowRedirects  *bool        `json:"follow_redirects,omitempty"`
	VerifySSL        *bool        `json:"verify_ssl,omitempty"`
	Port             *int         `json:"port,omitempty"`
	DNSRecordType    *string      `json:"dns_record_type,omitempty"`
	ExpectedResponse *string      `json:"expected_response,omitempty"`
}

// Monitor represents a monitor entity
type Monitor struct {
	ID                uuid.UUID    `json:"id"`
	UserID            uuid.UUID    `json:"user_id"`
	Name              string       `json:"name"`
	Type              MonitorType  `json:"type"`
	Target            string       `json:"target"`
	Interval          int          `json:"interval"`
	Timeout           int          `json:"timeout"`
	Status            MonitorStatus `json:"status"`
	Locations         []string     `json:"locations"`
	ExpectedStatusCodes []int      `json:"expected_status_codes,omitempty"`
	FollowRedirects   bool         `json:"follow_redirects,omitempty"`
	VerifySSL         bool         `json:"verify_ssl,omitempty"`
	Port              *int         `json:"port,omitempty"`
	DNSRecordType     *string      `json:"dns_record_type,omitempty"`
	ExpectedResponse  *string      `json:"expected_response,omitempty"`
	CreatedAt         time.Time    `json:"created_at"`
	UpdatedAt         time.Time    `json:"updated_at"`
}

// MonitorResult represents a monitoring check result
type MonitorResult struct {
	ID                uuid.UUID  `json:"id"`
	MonitorID         uuid.UUID  `json:"monitor_id"`
	Time              time.Time  `json:"time"`
	Location          string     `json:"location"`
	Success           bool       `json:"success"`
	Latency           *int       `json:"latency,omitempty"`
	StatusCode        *int       `json:"status_code,omitempty"`
	ResponseSize      *int       `json:"response_size,omitempty"`
	ErrorMessage      *string    `json:"error_message,omitempty"`
	CertificateExpiry *time.Time `json:"certificate_expiry,omitempty"`
	DNSResolutionTime *int       `json:"dns_resolution_time,omitempty"`
	TLSHandshakeTime  *int       `json:"tls_handshake_time,omitempty"`
	ConnectTime       *int       `json:"connect_time,omitempty"`
	FirstByteTime     *int       `json:"first_byte_time,omitempty"`
	TotalTime         *int       `json:"total_time,omitempty"`
}

// ListMonitorsResponse represents the response for listing monitors
type ListMonitorsResponse struct {
	Monitors []Monitor `json:"monitors"`
	Total    int      `json:"total"`
}

// GetMonitorResponse represents the response for getting a single monitor
type GetMonitorResponse struct {
	Monitor Monitor `json:"monitor"`
}
