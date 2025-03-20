package middleware

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"

	"github.com/jjkirkpatrick/monitoring/internal/database"
)

type LimitError struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

var limitMessages = map[string]string{
	"monitor_limit_reached":              "You have reached your maximum number of monitors",
	"daily_check_limit_reached":          "You have reached your daily check limit",
	"alert_config_limit_reached":         "You have reached your maximum number of alert configurations per monitor",
	"notification_channel_limit_reached": "You have reached your maximum number of notification channels",
}

// CheckUserLimits middleware checks if the user has exceeded any limits
func CheckUserLimits(db *database.DB, limitTypes ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get user ID from context (set by auth middleware)
			userID, ok := r.Context().Value("user_id").(uuid.UUID)
			if !ok {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// Check user limits
			limits, err := db.Queries.CheckUserLimits(r.Context(), userID)
			if err != nil {
				http.Error(w, "Failed to check user limits", http.StatusInternalServerError)
				return
			}

			// If no specific limit types are provided, check all limits
			if len(limitTypes) == 0 {
				if limits.LimitStatus != "ok" {
					message, ok := limitMessages[limits.LimitStatus]
					if !ok {
						message = "Resource limit reached"
					}
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusForbidden)
					json.NewEncoder(w).Encode(LimitError{
						Status:  limits.LimitStatus,
						Message: message,
					})
					return
				}
			} else {
				// Check only specified limit types
				for _, limitType := range limitTypes {
					switch limitType {
					case "monitors":
						if limits.CurrentMonitorCount >= int64(limits.MaxMonitors) {
							sendLimitError(w, "monitor_limit_reached")
							return
						}
					case "checks":
						if limits.CurrentCheckCount >= int64(limits.MaxChecksPerDay) {
							sendLimitError(w, "daily_check_limit_reached")
							return
						}
					case "alerts":
						if limits.MaxAlertCountPerMonitor >= int64(limits.MaxAlertConfigsPerMonitor) {
							sendLimitError(w, "alert_config_limit_reached")
							return
						}
					case "notifications":
						if int64(limits.CurrentNotificationChannels) >= int64(limits.MaxNotificationChannels) {
							sendLimitError(w, "notification_channel_limit_reached")
							return
						}
					}
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

func sendLimitError(w http.ResponseWriter, status string) {
	message, ok := limitMessages[status]
	if !ok {
		message = "Resource limit reached"
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)
	json.NewEncoder(w).Encode(LimitError{
		Status:  status,
		Message: message,
	})
}
