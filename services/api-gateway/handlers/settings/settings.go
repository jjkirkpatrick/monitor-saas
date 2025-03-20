package settings

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	sqlc "github.com/jjkirkpatrick/monitoring/internal/database/generated"
	"github.com/jjkirkpatrick/monitoring/services/api-gateway/handlers"
	"github.com/jjkirkpatrick/monitoring/services/api-gateway/types"
	"go.uber.org/zap"
)

type Handler struct {
	*handlers.Handler
}

func NewHandler(h *handlers.Handler) *Handler {
	h.Logger.Info("initializing settings handler")
	return &Handler{Handler: h}
}

// generateAPIKey creates a new API key with a prefix
func generateAPIKey() string {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return ""
	}
	return fmt.Sprintf("mk_%s", hex.EncodeToString(bytes))
}

// Get godoc
// @Summary      Get user settings
// @Description  Get settings for the authenticated user
// @Tags         settings
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Success      200  {object}  types.GetSettingsResponse
// @Failure      401  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /settings [get]
func (h *Handler) Get(c *gin.Context) {
	h.Logger.Info("handling GET /settings request")

	userID := c.GetString("user_id")
	if userID == "" {
		h.Logger.Warn("unauthorized request - missing user_id")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	uid := uuid.MustParse(userID)
	h.Logger.Debug("parsed user ID", zap.String("user_id", userID))

	// Get user settings
	settings, err := h.DB.Queries.GetUserSettings(c, uid)
	if err != nil {
		h.Logger.Error("failed to get user settings",
			zap.Error(err),
			zap.String("user_id", userID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user settings"})
		return
	}
	h.Logger.Debug("retrieved user settings", zap.Any("settings", settings))

	// Get user limits
	limits, err := h.DB.Queries.GetUserLimits(c, uid)
	if err != nil {
		h.Logger.Error("failed to get user limits",
			zap.Error(err),
			zap.String("user_id", userID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user limits"})
		return
	}
	h.Logger.Debug("retrieved user limits", zap.Any("limits", limits))

	// Get today's usage stats
	today := pgtype.Date{
		Time:  time.Now(),
		Valid: true,
	}
	usage, err := h.DB.Queries.GetUserUsageStats(c, sqlc.GetUserUsageStatsParams{
		UserID: uid,
		Date:   today,
	})
	if err != nil {
		if err == pgx.ErrNoRows {
			h.Logger.Info("no usage stats found for today, initializing empty stats",
				zap.String("user_id", userID),
				zap.Time("date", today.Time))
			// Initialize empty usage stats if no data exists for today
			usage = sqlc.UserUsageStat{
				UserID: uid,
				Date: pgtype.Date{
					Time:  time.Now(),
					Valid: true,
				},
				TotalChecks:            0,
				TotalAlertsTriggered:   0,
				TotalNotificationsSent: 0,
				ApiCalls:               0,
				DataTransferBytes:      0,
			}
		} else {
			h.Logger.Error("failed to get user usage stats",
				zap.Error(err),
				zap.String("user_id", userID))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user usage stats"})
			return
		}
	}
	h.Logger.Debug("retrieved user usage stats", zap.Any("usage", usage))

	// Convert to response type
	response := types.GetSettingsResponse{
		Settings: types.UserSettings{
			UserID:                   settings.UserID,
			Theme:                    types.ThemePreference(settings.Theme),
			Timezone:                 types.TimezonePreference(settings.Timezone),
			DateFormat:               settings.DateFormat,
			TimeFormat:               settings.TimeFormat,
			DefaultDashboardView:     settings.DefaultDashboardView,
			DashboardRefreshInterval: int(settings.DashboardRefreshInterval),
			EmailDigestEnabled:       settings.EmailDigestEnabled,
			EmailDigestFrequency:     settings.EmailDigestFrequency,
			MobileNumber:             getStringPtr(settings.MobileNumber),
			TelegramUsername:         getStringPtr(settings.TelegramUsername),
			WebhookSecret:            getStringPtr(settings.WebhookSecret),
			APIKeyEnabled:            settings.ApiKeyEnabled,
			APIKey:                   getStringPtr(settings.ApiKey),
			APIKeyCreatedAt:          getTimePtr(settings.ApiKeyCreatedAt),
			APIKeyLastUsedAt:         getTimePtr(settings.ApiKeyLastUsedAt),
			CreatedAt:                settings.CreatedAt.Time,
			UpdatedAt:                settings.UpdatedAt.Time,
		},
		Limits: types.UserLimits{
			UserID:                    limits.UserID,
			MaxMonitors:               int(limits.MaxMonitors),
			MaxChecksPerDay:           int(limits.MaxChecksPerDay),
			MaxAlertConfigsPerMonitor: int(limits.MaxAlertConfigsPerMonitor),
			MaxNotificationChannels:   int(limits.MaxNotificationChannels),
			RetentionDays:             int(limits.RetentionDays),
			APIRateLimitPerMinute:     int(limits.ApiRateLimitPerMinute),
			CreatedAt:                 limits.CreatedAt.Time,
			UpdatedAt:                 limits.UpdatedAt.Time,
		},
		Usage: types.UserUsageStats{
			UserID:                 usage.UserID,
			Date:                   usage.Date.Time,
			TotalChecks:            int(usage.TotalChecks),
			TotalAlertsTriggered:   int(usage.TotalAlertsTriggered),
			TotalNotificationsSent: int(usage.TotalNotificationsSent),
			APICalls:               int(usage.ApiCalls),
			DataTransferBytes:      usage.DataTransferBytes,
		},
	}

	h.Logger.Info("successfully retrieved all user settings and stats",
		zap.String("user_id", userID),
		zap.String("theme", string(response.Settings.Theme)),
		zap.String("timezone", string(response.Settings.Timezone)),
		zap.Int("total_checks", response.Usage.TotalChecks))

	c.JSON(http.StatusOK, response)
}

// Update handles PUT /api/v1/settings
// @Summary Update all user settings
// @Description Updates all settings for the authenticated user
// @Tags settings
// @Accept json
// @Produce json
// @Security Bearer
// @Param settings body types.UpdateSettingsRequest true "Settings to update"
// @Success 200 {object} types.UserSettings
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /settings [put]
func (h *Handler) Update(c *gin.Context) {
	h.Logger.Info("handling PUT /settings request")

	userID := c.GetString("user_id")
	if userID == "" {
		h.Logger.Warn("unauthorized request - missing user_id")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req types.UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.Logger.Warn("invalid request body",
			zap.Error(err),
			zap.String("user_id", userID))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.Logger.Debug("received update settings request",
		zap.String("user_id", userID),
		zap.Any("request", req))

	// Validate theme if it's being updated
	if req.Theme != nil {
		theme := string(*req.Theme)
		if theme == "" {
			h.Logger.Warn("invalid theme value - empty",
				zap.String("user_id", userID))
			c.JSON(http.StatusBadRequest, gin.H{"error": "theme cannot be empty"})
			return
		}
		if theme != "light" && theme != "dark" && theme != "system" {
			h.Logger.Warn("invalid theme value",
				zap.String("user_id", userID),
				zap.String("theme", theme))
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid theme value. Must be 'light', 'dark', or 'system'"})
			return
		}
	}

	// Validate timezone if it's being updated
	if req.Timezone != nil {
		timezone := string(*req.Timezone)
		if timezone == "" {
			h.Logger.Warn("invalid timezone value - empty",
				zap.String("user_id", userID))
			c.JSON(http.StatusBadRequest, gin.H{"error": "timezone cannot be empty"})
			return
		}
		validTimezones := map[string]bool{
			"UTC":                 true,
			"America/New_York":    true,
			"America/Los_Angeles": true,
			"Europe/London":       true,
			"Europe/Paris":        true,
			"Asia/Tokyo":          true,
			"Asia/Singapore":      true,
			"Australia/Sydney":    true,
		}
		if !validTimezones[timezone] {
			h.Logger.Warn("invalid timezone value",
				zap.String("user_id", userID),
				zap.String("timezone", timezone))
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid timezone value"})
			return
		}
	}

	uid := uuid.MustParse(userID)

	// Update user settings
	settings, err := h.DB.Queries.UpdateUserSettings(c, sqlc.UpdateUserSettingsParams{
		UserID:                   uid,
		Theme:                    sqlc.ThemePreference(stringValue((*string)(req.Theme))),
		Timezone:                 sqlc.TimezonePreference(stringValue((*string)(req.Timezone))),
		DateFormat:               stringValue(req.DateFormat),
		TimeFormat:               stringValue(req.TimeFormat),
		DefaultDashboardView:     stringValue(req.DefaultDashboardView),
		DashboardRefreshInterval: int32Value(req.DashboardRefreshInterval),
		EmailDigestEnabled:       boolValue(req.EmailDigestEnabled),
		EmailDigestFrequency:     stringValue(req.EmailDigestFrequency),
		MobileNumber:             stringToNullString(req.MobileNumber),
		TelegramUsername:         stringToNullString(req.TelegramUsername),
		WebhookSecret:            stringToNullString(req.WebhookSecret),
		ApiKeyEnabled:            boolValue(req.APIKeyEnabled),
	})
	if err != nil {
		h.Logger.Error("failed to update user settings",
			zap.Error(err),
			zap.String("user_id", userID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user settings"})
		return
	}

	h.Logger.Debug("successfully updated user settings",
		zap.String("user_id", userID),
		zap.Any("settings", settings))

	// Convert to response type
	response := types.UserSettings{
		UserID:                   settings.UserID,
		Theme:                    types.ThemePreference(settings.Theme),
		Timezone:                 types.TimezonePreference(settings.Timezone),
		DateFormat:               settings.DateFormat,
		TimeFormat:               settings.TimeFormat,
		DefaultDashboardView:     settings.DefaultDashboardView,
		DashboardRefreshInterval: int(settings.DashboardRefreshInterval),
		EmailDigestEnabled:       settings.EmailDigestEnabled,
		EmailDigestFrequency:     settings.EmailDigestFrequency,
		MobileNumber:             getStringPtr(settings.MobileNumber),
		TelegramUsername:         getStringPtr(settings.TelegramUsername),
		WebhookSecret:            getStringPtr(settings.WebhookSecret),
		APIKeyEnabled:            settings.ApiKeyEnabled,
		APIKey:                   getStringPtr(settings.ApiKey),
		APIKeyCreatedAt:          getTimePtr(settings.ApiKeyCreatedAt),
		APIKeyLastUsedAt:         getTimePtr(settings.ApiKeyLastUsedAt),
		CreatedAt:                settings.CreatedAt.Time,
		UpdatedAt:                settings.UpdatedAt.Time,
	}

	h.Logger.Info("settings updated successfully",
		zap.String("user_id", userID),
		zap.String("theme", string(response.Theme)),
		zap.String("timezone", string(response.Timezone)),
		zap.Time("updated_at", response.UpdatedAt))

	c.JSON(http.StatusOK, response)
}

// UpdateSingle handles PATCH /api/v1/settings
// @Summary Update a single setting
// @Description Updates a single setting for the authenticated user
// @Tags settings
// @Accept json
// @Produce json
// @Security Bearer
// @Param setting body types.UpdateSettingsRequest true "Setting to update"
// @Success 200 {object} types.UserSettings
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /settings [patch]
func (h *Handler) UpdateSingle(c *gin.Context) {
	h.Logger.Info("handling PATCH /settings request")

	userID := c.GetString("user_id")
	if userID == "" {
		h.Logger.Warn("unauthorized request - missing user_id")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req types.UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.Logger.Warn("invalid request body",
			zap.Error(err),
			zap.String("user_id", userID))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h.Logger.Debug("received update single setting request",
		zap.String("user_id", userID),
		zap.Any("request", req))

	// Validate that only one setting is being updated
	nonNilFields := countNonNilFields(req)
	if nonNilFields > 1 {
		h.Logger.Warn("multiple settings provided for single update",
			zap.String("user_id", userID),
			zap.Int("field_count", nonNilFields))
		c.JSON(http.StatusBadRequest, gin.H{"error": "only one setting can be updated at a time with PATCH"})
		return
	}

	// Validate theme if it's being updated
	if req.Theme != nil {
		theme := string(*req.Theme)
		if theme == "" {
			h.Logger.Warn("invalid theme value - empty",
				zap.String("user_id", userID))
			c.JSON(http.StatusBadRequest, gin.H{"error": "theme cannot be empty"})
			return
		}
		if theme != "light" && theme != "dark" && theme != "system" {
			h.Logger.Warn("invalid theme value",
				zap.String("user_id", userID),
				zap.String("theme", theme))
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid theme value. Must be 'light', 'dark', or 'system'"})
			return
		}
	}

	// Validate timezone if it's being updated
	if req.Timezone != nil {
		timezone := string(*req.Timezone)
		if timezone == "" {
			h.Logger.Warn("invalid timezone value - empty",
				zap.String("user_id", userID))
			c.JSON(http.StatusBadRequest, gin.H{"error": "timezone cannot be empty"})
			return
		}
		validTimezones := map[string]bool{
			"UTC":                 true,
			"America/New_York":    true,
			"America/Los_Angeles": true,
			"Europe/London":       true,
			"Europe/Paris":        true,
			"Asia/Tokyo":          true,
			"Asia/Singapore":      true,
			"Australia/Sydney":    true,
		}
		if !validTimezones[timezone] {
			h.Logger.Warn("invalid timezone value",
				zap.String("user_id", userID),
				zap.String("timezone", timezone))
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid timezone value"})
			return
		}
	}

	uid := uuid.MustParse(userID)

	// Update user settings
	settings, err := h.DB.Queries.UpdateUserSettings(c, sqlc.UpdateUserSettingsParams{
		UserID:                   uid,
		Theme:                    sqlc.ThemePreference(stringValue((*string)(req.Theme))),
		Timezone:                 sqlc.TimezonePreference(stringValue((*string)(req.Timezone))),
		DateFormat:               stringValue(req.DateFormat),
		TimeFormat:               stringValue(req.TimeFormat),
		DefaultDashboardView:     stringValue(req.DefaultDashboardView),
		DashboardRefreshInterval: int32Value(req.DashboardRefreshInterval),
		EmailDigestEnabled:       boolValue(req.EmailDigestEnabled),
		EmailDigestFrequency:     stringValue(req.EmailDigestFrequency),
		MobileNumber:             stringToNullString(req.MobileNumber),
		TelegramUsername:         stringToNullString(req.TelegramUsername),
		WebhookSecret:            stringToNullString(req.WebhookSecret),
		ApiKeyEnabled:            boolValue(req.APIKeyEnabled),
	})
	if err != nil {
		h.Logger.Error("failed to update user setting",
			zap.Error(err),
			zap.String("user_id", userID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user setting"})
		return
	}

	h.Logger.Debug("successfully updated single setting",
		zap.String("user_id", userID),
		zap.Any("settings", settings))

	// Convert to response type
	response := types.UserSettings{
		UserID:                   settings.UserID,
		Theme:                    types.ThemePreference(settings.Theme),
		Timezone:                 types.TimezonePreference(settings.Timezone),
		DateFormat:               settings.DateFormat,
		TimeFormat:               settings.TimeFormat,
		DefaultDashboardView:     settings.DefaultDashboardView,
		DashboardRefreshInterval: int(settings.DashboardRefreshInterval),
		EmailDigestEnabled:       settings.EmailDigestEnabled,
		EmailDigestFrequency:     settings.EmailDigestFrequency,
		MobileNumber:             getStringPtr(settings.MobileNumber),
		TelegramUsername:         getStringPtr(settings.TelegramUsername),
		WebhookSecret:            getStringPtr(settings.WebhookSecret),
		APIKeyEnabled:            settings.ApiKeyEnabled,
		APIKey:                   getStringPtr(settings.ApiKey),
		APIKeyCreatedAt:          getTimePtr(settings.ApiKeyCreatedAt),
		APIKeyLastUsedAt:         getTimePtr(settings.ApiKeyLastUsedAt),
		CreatedAt:                settings.CreatedAt.Time,
		UpdatedAt:                settings.UpdatedAt.Time,
	}

	h.Logger.Info("single setting updated successfully",
		zap.String("user_id", userID),
		zap.Time("updated_at", response.UpdatedAt))

	c.JSON(http.StatusOK, response)
}

// ToggleSetting handles POST /api/v1/settings/toggle/:setting
// @Summary Toggle a boolean setting
// @Description Toggles a boolean setting for the authenticated user
// @Tags settings
// @Accept json
// @Produce json
// @Security Bearer
// @Param setting path string true "Setting name to toggle"
// @Success 200 {object} types.ToggleSettingResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /settings/toggle/{setting} [post]
func (h *Handler) ToggleSetting(c *gin.Context) {
	h.Logger.Info("handling POST /settings/toggle request")

	userID := c.GetString("user_id")
	if userID == "" {
		h.Logger.Warn("unauthorized request - missing user_id")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	settingName := c.Param("setting")
	if settingName == "" {
		h.Logger.Warn("missing setting name parameter",
			zap.String("user_id", userID))
		c.JSON(http.StatusBadRequest, gin.H{"error": "setting name is required"})
		return
	}

	h.Logger.Debug("received toggle setting request",
		zap.String("user_id", userID),
		zap.String("setting", settingName))

	// Validate that the setting is a boolean type
	if !isToggleableSetting(settingName) {
		h.Logger.Warn("invalid toggleable setting",
			zap.String("user_id", userID),
			zap.String("setting", settingName))
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("setting '%s' is not a boolean setting that can be toggled", settingName)})
		return
	}

	uid := uuid.MustParse(userID)

	// Get current setting value
	settings, err := h.DB.Queries.GetUserSettings(c, uid)
	if err != nil {
		h.Logger.Error("failed to get user settings",
			zap.Error(err),
			zap.String("user_id", userID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user settings"})
		return
	}

	// Toggle the setting manually since we don't have a direct ToggleSetting query
	var newValue bool
	var updateParams sqlc.UpdateUserSettingsParams
	updateParams.UserID = uid

	switch settingName {
	case "emailDigestEnabled":
		newValue = !settings.EmailDigestEnabled
		updateParams.EmailDigestEnabled = newValue
	case "apiKeyEnabled":
		newValue = !settings.ApiKeyEnabled
		updateParams.ApiKeyEnabled = newValue
	default:
		h.Logger.Warn("unsupported setting for toggle",
			zap.String("user_id", userID),
			zap.String("setting", settingName))
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("setting '%s' cannot be toggled", settingName)})
		return
	}

	h.Logger.Debug("toggling setting",
		zap.String("user_id", userID),
		zap.String("setting", settingName),
		zap.Bool("new_value", newValue))

	// Update the setting
	updatedSettings, err := h.DB.Queries.UpdateUserSettings(c, updateParams)
	if err != nil {
		h.Logger.Error("failed to toggle setting",
			zap.Error(err),
			zap.String("user_id", userID),
			zap.String("setting", settingName))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to toggle setting"})
		return
	}

	h.Logger.Info("setting toggled successfully",
		zap.String("user_id", userID),
		zap.String("setting", settingName),
		zap.Bool("new_value", newValue),
		zap.Time("updated_at", updatedSettings.UpdatedAt.Time))

	// Return the response
	c.JSON(http.StatusOK, types.ToggleSettingResponse{
		Setting:   settingName,
		Value:     newValue,
		UpdatedAt: updatedSettings.UpdatedAt.Time,
	})
}

// GenerateAPIKey handles POST /api/v1/settings/api-key
// @Summary Generate a new API key
// @Description Generates a new API key for the authenticated user
// @Tags settings
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} types.GenerateAPIKeyResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /settings/api-key [post]
func (h *Handler) GenerateAPIKey(c *gin.Context) {
	h.Logger.Info("handling POST /settings/api-key request")

	userID := c.GetString("user_id")
	if userID == "" {
		h.Logger.Warn("unauthorized request - missing user_id")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	uid := uuid.MustParse(userID)

	// Generate a new API key
	apiKeyStr := generateAPIKey()
	if apiKeyStr == "" {
		h.Logger.Error("failed to generate API key",
			zap.String("user_id", userID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate API key"})
		return
	}

	h.Logger.Debug("generated new API key",
		zap.String("user_id", userID))

	// Set expiration date (30 days from now)
	now := time.Now()
	expiresAt := now.AddDate(0, 0, 30)
	nowTz := pgtype.Timestamptz{Time: now, Valid: true}

	// Update user settings with new API key
	_, err := h.DB.Queries.UpdateUserSettings(c, sqlc.UpdateUserSettingsParams{
		UserID:          uid,
		ApiKey:          pgtype.Text{String: apiKeyStr, Valid: true},
		ApiKeyCreatedAt: nowTz,
		ApiKeyEnabled:   true,
	})
	if err != nil {
		h.Logger.Error("failed to save new API key",
			zap.Error(err),
			zap.String("user_id", userID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate API key"})
		return
	}

	h.Logger.Info("API key generated successfully",
		zap.String("user_id", userID),
		zap.Time("created_at", now),
		zap.Time("expires_at", expiresAt))

	// Return the new API key
	c.JSON(http.StatusOK, types.GenerateAPIKeyResponse{
		APIKey:    apiKeyStr,
		CreatedAt: now,
		ExpiresAt: expiresAt,
	})
}

// ResetSettings handles POST /api/v1/settings/reset
// @Summary Reset user settings to defaults
// @Description Resets all user settings to their default values
// @Tags settings
// @Accept json
// @Produce json
// @Security Bearer
// @Success 200 {object} types.UserSettings
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /settings/reset [post]
func (h *Handler) ResetSettings(c *gin.Context) {
	h.Logger.Info("handling POST /settings/reset request")

	userID := c.GetString("user_id")
	if userID == "" {
		h.Logger.Warn("unauthorized request - missing user_id")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	uid := uuid.MustParse(userID)

	h.Logger.Debug("resetting settings to defaults",
		zap.String("user_id", userID))

	// Reset user settings to defaults using UpdateUserSettings with default values
	settings, err := h.DB.Queries.UpdateUserSettings(c, sqlc.UpdateUserSettingsParams{
		UserID:                   uid,
		Theme:                    sqlc.ThemePreference("system"),
		Timezone:                 sqlc.TimezonePreference("UTC"),
		DateFormat:               "YYYY-MM-DD",
		TimeFormat:               "HH:mm:ss",
		DefaultDashboardView:     "overview",
		DashboardRefreshInterval: 60,
		EmailDigestEnabled:       true,
		EmailDigestFrequency:     "daily",
		MobileNumber:             pgtype.Text{Valid: false},
		TelegramUsername:         pgtype.Text{Valid: false},
		WebhookSecret:            pgtype.Text{Valid: false},
		ApiKeyEnabled:            false,
		ApiKey:                   pgtype.Text{Valid: false},
		ApiKeyCreatedAt:          pgtype.Timestamptz{Valid: false},
	})
	if err != nil {
		h.Logger.Error("failed to reset user settings",
			zap.Error(err),
			zap.String("user_id", userID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reset user settings"})
		return
	}

	// Convert to response type
	response := types.UserSettings{
		UserID:                   settings.UserID,
		Theme:                    types.ThemePreference(settings.Theme),
		Timezone:                 types.TimezonePreference(settings.Timezone),
		DateFormat:               settings.DateFormat,
		TimeFormat:               settings.TimeFormat,
		DefaultDashboardView:     settings.DefaultDashboardView,
		DashboardRefreshInterval: int(settings.DashboardRefreshInterval),
		EmailDigestEnabled:       settings.EmailDigestEnabled,
		EmailDigestFrequency:     settings.EmailDigestFrequency,
		MobileNumber:             getStringPtr(settings.MobileNumber),
		TelegramUsername:         getStringPtr(settings.TelegramUsername),
		WebhookSecret:            getStringPtr(settings.WebhookSecret),
		APIKeyEnabled:            settings.ApiKeyEnabled,
		APIKey:                   getStringPtr(settings.ApiKey),
		APIKeyCreatedAt:          getTimePtr(settings.ApiKeyCreatedAt),
		APIKeyLastUsedAt:         getTimePtr(settings.ApiKeyLastUsedAt),
		CreatedAt:                settings.CreatedAt.Time,
		UpdatedAt:                settings.UpdatedAt.Time,
	}

	c.JSON(http.StatusOK, response)
}

// TestWebhook handles POST /api/v1/settings/test-webhook
// @Summary Test webhook configuration
// @Description Tests the webhook configuration by sending a test payload
// @Tags settings
// @Accept json
// @Produce json
// @Security Bearer
// @Param webhook body types.TestWebhookRequest true "Webhook configuration to test"
// @Success 200 {object} types.TestWebhookResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /settings/test-webhook [post]
func (h *Handler) TestWebhook(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req types.TestWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user settings to get the webhook secret
	uid := uuid.MustParse(userID)
	settings, err := h.DB.Queries.GetUserSettings(c, uid)
	if err != nil {
		h.Logger.Error("failed to get user settings", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user settings"})
		return
	}

	// Prepare test payload
	payload := map[string]interface{}{
		"event":     "test",
		"timestamp": time.Now().Format(time.RFC3339),
		"data": map[string]interface{}{
			"message": "This is a test webhook from Monitor SaaS",
		},
	}

	// Send test webhook
	// In a real implementation, you would make an HTTP request to the webhook URL
	// with the test payload and the webhook secret in the headers
	// For this example, we'll just simulate a successful response

	// Log the webhook test
	h.Logger.Info("webhook test",
		zap.String("user_id", userID),
		zap.String("webhook_url", req.URL),
		zap.Bool("has_secret", settings.WebhookSecret.Valid),
		zap.Any("payload", payload),
	)

	// Return success response
	c.JSON(http.StatusOK, types.TestWebhookResponse{
		Success: true,
		Message: "Webhook test sent successfully",
	})
}

// Helper functions

func stringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func int32Value(i *int) int32 {
	if i == nil {
		return 0
	}
	return int32(*i)
}

func boolValue(b *bool) bool {
	if b == nil {
		return false
	}
	return *b
}

func stringToNullString(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

func getStringPtr(s pgtype.Text) *string {
	if !s.Valid {
		return nil
	}
	return &s.String
}

func getTimePtr(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	return &t.Time
}

// countNonNilFields counts the number of non-nil fields in the UpdateSettingsRequest
func countNonNilFields(req types.UpdateSettingsRequest) int {
	count := 0
	if req.Theme != nil {
		count++
	}
	if req.Timezone != nil {
		count++
	}
	if req.DateFormat != nil {
		count++
	}
	if req.TimeFormat != nil {
		count++
	}
	if req.DefaultDashboardView != nil {
		count++
	}
	if req.DashboardRefreshInterval != nil {
		count++
	}
	if req.EmailDigestEnabled != nil {
		count++
	}
	if req.EmailDigestFrequency != nil {
		count++
	}
	if req.MobileNumber != nil {
		count++
	}
	if req.TelegramUsername != nil {
		count++
	}
	if req.WebhookSecret != nil {
		count++
	}
	if req.APIKeyEnabled != nil {
		count++
	}
	return count
}

// isToggleableSetting checks if a setting can be toggled (is a boolean type)
func isToggleableSetting(setting string) bool {
	toggleableSettings := map[string]bool{
		"email_digest_enabled": true,
		"api_key_enabled":      true,
	}

	// Convert to snake_case if needed
	snakeCase := camelToSnakeCase(setting)

	return toggleableSettings[setting] || toggleableSettings[snakeCase]
}

// camelToSnakeCase converts camelCase to snake_case
func camelToSnakeCase(s string) string {
	var result strings.Builder
	for i, r := range s {
		if i > 0 && r >= 'A' && r <= 'Z' {
			result.WriteRune('_')
		}
		result.WriteRune(r)
	}
	return strings.ToLower(result.String())
}
