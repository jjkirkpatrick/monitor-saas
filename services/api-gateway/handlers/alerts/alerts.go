package alerts

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	return &Handler{Handler: h}
}

// List godoc
// @Summary      List alert configurations
// @Description  Get all alert configurations for the authenticated user
// @Tags         alerts
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Success      200  {object}  types.ListAlertConfigsResponse
// @Failure      401  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /alerts [get]
func (h *Handler) List(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Get alert configs from database
	alertConfigs, err := h.DB.Queries.ListAlertConfigs(c, uuid.MustParse(userID))
	if err != nil {
		h.Logger.Error("failed to list alert configs", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list alert configs"})
		return
	}

	// Convert to response type
	response := types.ListAlertConfigsResponse{
		AlertConfigs: make([]types.AlertConfig, len(alertConfigs)),
		Total:        len(alertConfigs),
	}

	for i, ac := range alertConfigs {
		var threshold types.AlertThreshold
		if err := json.Unmarshal(ac.Threshold, &threshold); err != nil {
			h.Logger.Error("failed to unmarshal threshold", zap.Error(err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process alert config"})
			return
		}

		response.AlertConfigs[i] = types.AlertConfig{
			ID:               ac.ID,
			MonitorID:        ac.MonitorID,
			Name:             ac.Name,
			Condition:        types.AlertCondition(ac.Condition),
			Threshold:        threshold,
			Severity:         types.AlertSeverity(ac.Severity),
			Enabled:          ac.Enabled,
			ConsecutiveCount: int(ac.ConsecutiveCount),
			CooldownMinutes:  int(ac.CooldownMinutes),
			CreatedAt:        ac.CreatedAt.Time,
			UpdatedAt:        ac.UpdatedAt.Time,
		}
	}

	c.JSON(http.StatusOK, response)
}

// Get godoc
// @Summary      Get alert config details
// @Description  Get details for a specific alert config by ID
// @Tags         alerts
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id   path      string  true  "Alert Config ID"
// @Success      200  {object}  types.GetAlertConfigResponse
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /alerts/{id} [get]
func (h *Handler) Get(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid alert config id"})
		return
	}

	// Get alert config from database
	alertConfig, err := h.DB.Queries.GetAlertConfig(c, sqlc.GetAlertConfigParams{
		ID:     id,
		UserID: uuid.MustParse(userID),
	})
	if err != nil {
		h.Logger.Error("failed to get alert config", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get alert config"})
		return
	}

	var threshold types.AlertThreshold
	if err := json.Unmarshal(alertConfig.Threshold, &threshold); err != nil {
		h.Logger.Error("failed to unmarshal threshold", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process alert config"})
		return
	}

	// Convert to response type
	response := types.GetAlertConfigResponse{
		AlertConfig: types.AlertConfig{
			ID:               alertConfig.ID,
			MonitorID:        alertConfig.MonitorID,
			Name:             alertConfig.Name,
			Condition:        types.AlertCondition(alertConfig.Condition),
			Threshold:        threshold,
			Severity:         types.AlertSeverity(alertConfig.Severity),
			Enabled:          alertConfig.Enabled,
			ConsecutiveCount: int(alertConfig.ConsecutiveCount),
			CooldownMinutes:  int(alertConfig.CooldownMinutes),
			CreatedAt:        alertConfig.CreatedAt.Time,
			UpdatedAt:        alertConfig.UpdatedAt.Time,
		},
	}

	c.JSON(http.StatusOK, response)
}

// Create godoc
// @Summary      Create alert config
// @Description  Create a new alert configuration for a monitor
// @Tags         alerts
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        request  body      types.CreateAlertConfigRequest  true  "Alert config details"
// @Success      200      {object}  types.GetAlertConfigResponse
// @Failure      400      {object}  map[string]string
// @Failure      401      {object}  map[string]string
// @Failure      500      {object}  map[string]string
// @Router       /alerts [post]
func (h *Handler) Create(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req types.CreateAlertConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert threshold to JSON
	thresholdJSON, err := json.Marshal(req.Threshold)
	if err != nil {
		h.Logger.Error("failed to marshal threshold", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid threshold format"})
		return
	}

	// Create alert config in database
	alertConfig, err := h.DB.Queries.CreateAlertConfig(c, sqlc.CreateAlertConfigParams{
		MonitorID:        req.MonitorID,
		Name:             req.Name,
		Condition:        sqlc.AlertCondition(req.Condition),
		Threshold:        thresholdJSON,
		Severity:         sqlc.AlertSeverity(req.Severity),
		Enabled:          true,
		ConsecutiveCount: int32(req.ConsecutiveCount),
		CooldownMinutes:  int32(req.CooldownMinutes),
	})
	if err != nil {
		h.Logger.Error("failed to create alert config", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create alert config"})
		return
	}

	var threshold types.AlertThreshold
	if err := json.Unmarshal(alertConfig.Threshold, &threshold); err != nil {
		h.Logger.Error("failed to unmarshal threshold", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process alert config"})
		return
	}

	// Convert to response type
	response := types.GetAlertConfigResponse{
		AlertConfig: types.AlertConfig{
			ID:               alertConfig.ID,
			MonitorID:        alertConfig.MonitorID,
			Name:             alertConfig.Name,
			Condition:        types.AlertCondition(alertConfig.Condition),
			Threshold:        threshold,
			Severity:         types.AlertSeverity(alertConfig.Severity),
			Enabled:          alertConfig.Enabled,
			ConsecutiveCount: int(alertConfig.ConsecutiveCount),
			CooldownMinutes:  int(alertConfig.CooldownMinutes),
			CreatedAt:        alertConfig.CreatedAt.Time,
			UpdatedAt:        alertConfig.UpdatedAt.Time,
		},
	}

	c.JSON(http.StatusCreated, response)
}

// Update godoc
// @Summary      Update alert config
// @Description  Update an existing alert configuration by ID
// @Tags         alerts
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id   path      string  true  "Alert Config ID"
// @Param        request body types.UpdateAlertConfigRequest true "Alert config update request"
// @Success      200  {object}  types.GetAlertConfigResponse
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /alerts/{id} [put]
func (h *Handler) Update(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid alert config id"})
		return
	}

	var req types.UpdateAlertConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing alert config to ensure ownership and get monitor_id
	existingConfig, err := h.DB.Queries.GetAlertConfig(c, sqlc.GetAlertConfigParams{
		ID:     id,
		UserID: uuid.MustParse(userID),
	})
	if err != nil {
		h.Logger.Error("failed to get alert config", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get alert config"})
		return
	}

	// Update alert config in database
	alertConfig, err := h.DB.Queries.UpdateAlertConfig(c, sqlc.UpdateAlertConfigParams{
		ID:               id,
		MonitorID:        existingConfig.MonitorID,
		Name:             stringValue(req.Name),
		Condition:        sqlc.AlertCondition(stringValue((*string)(req.Condition))),
		Severity:         sqlc.AlertSeverity(stringValue((*string)(req.Severity))),
		Enabled:          boolValue(req.Enabled),
		ConsecutiveCount: int32Value(req.ConsecutiveCount),
		CooldownMinutes:  int32Value(req.CooldownMinutes),
	})
	if err != nil {
		h.Logger.Error("failed to update alert config", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update alert config"})
		return
	}

	var threshold types.AlertThreshold
	if err := json.Unmarshal(alertConfig.Threshold, &threshold); err != nil {
		h.Logger.Error("failed to unmarshal threshold", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process alert config"})
		return
	}

	// Convert to response type
	response := types.GetAlertConfigResponse{
		AlertConfig: types.AlertConfig{
			ID:               alertConfig.ID,
			MonitorID:        alertConfig.MonitorID,
			Name:             alertConfig.Name,
			Condition:        types.AlertCondition(alertConfig.Condition),
			Threshold:        threshold,
			Severity:         types.AlertSeverity(alertConfig.Severity),
			Enabled:          alertConfig.Enabled,
			ConsecutiveCount: int(alertConfig.ConsecutiveCount),
			CooldownMinutes:  int(alertConfig.CooldownMinutes),
			CreatedAt:        alertConfig.CreatedAt.Time,
			UpdatedAt:        alertConfig.UpdatedAt.Time,
		},
	}

	c.JSON(http.StatusOK, response)
}

// Delete godoc
// @Summary      Delete alert config
// @Description  Delete an alert configuration by ID
// @Tags         alerts
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id   path      string  true  "Alert Config ID"
// @Success      204  {object}  nil
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /alerts/{id} [delete]
func (h *Handler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid alert config id"})
		return
	}

	// Delete alert config from database
	err = h.DB.Queries.DeleteAlertConfig(c, sqlc.DeleteAlertConfigParams{
		ID:     id,
		UserID: uuid.MustParse(userID),
	})
	if err != nil {
		h.Logger.Error("failed to delete alert config", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete alert config"})
		return
	}

	c.Status(http.StatusNoContent)
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
