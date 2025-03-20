package monitors

import (
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
// @Summary      List monitors
// @Description  Get all monitors for the authenticated user
// @Tags         monitors
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Success      200  {object}  types.ListMonitorsResponse
// @Failure      401  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /monitors [get]
func (h *Handler) List(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Get monitors from database
	monitors, err := h.DB.Queries.ListMonitors(c, uuid.MustParse(userID))
	if err != nil {
		h.Logger.Error("failed to get monitors", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get monitors"})
		return
	}

	// Convert to response type
	response := types.ListMonitorsResponse{
		Monitors: make([]types.Monitor, len(monitors)),
		Total:    len(monitors),
	}

	for i, m := range monitors {
		response.Monitors[i] = types.Monitor{
			ID:                  m.ID,
			UserID:              m.UserID,
			Name:                m.Name,
			Type:                types.MonitorType(m.Type),
			Target:              m.Target,
			Interval:            int(m.Interval),
			Timeout:             int(m.Timeout),
			Status:              types.MonitorStatus(m.Status),
			Locations:           m.Locations,
			ExpectedStatusCodes: intSlice32To64(m.ExpectedStatusCodes),
			FollowRedirects:     m.FollowRedirects.Bool,
			VerifySSL:           m.VerifySsl.Bool,
			Port:                getIntPtr(m.Port),
			DNSRecordType:       getStringPtr(m.DnsRecordType),
			ExpectedResponse:    getStringPtr(m.ExpectedResponse),
			CreatedAt:           m.CreatedAt.Time,
			UpdatedAt:           m.UpdatedAt.Time,
		}
	}

	c.JSON(http.StatusOK, response)
}

// Get godoc
// @Summary      Get monitor details
// @Description  Get details for a specific monitor by ID
// @Tags         monitors
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id   path      string  true  "Monitor ID"
// @Success      200  {object}  types.GetMonitorResponse
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /monitors/{id} [get]
func (h *Handler) Get(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid monitor id"})
		return
	}

	// Get monitor from database
	monitor, err := h.DB.Queries.GetMonitor(c, sqlc.GetMonitorParams{
		ID:     id,
		UserID: uuid.MustParse(userID),
	})
	if err != nil {
		h.Logger.Error("failed to get monitor", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get monitor"})
		return
	}

	// Convert to response type
	response := types.GetMonitorResponse{
		Monitor: types.Monitor{
			ID:                  monitor.ID,
			UserID:              monitor.UserID,
			Name:                monitor.Name,
			Type:                types.MonitorType(monitor.Type),
			Target:              monitor.Target,
			Interval:            int(monitor.Interval),
			Timeout:             int(monitor.Timeout),
			Status:              types.MonitorStatus(monitor.Status),
			Locations:           monitor.Locations,
			ExpectedStatusCodes: intSlice32To64(monitor.ExpectedStatusCodes),
			FollowRedirects:     monitor.FollowRedirects.Bool,
			VerifySSL:           monitor.VerifySsl.Bool,
			Port:                getIntPtr(monitor.Port),
			DNSRecordType:       getStringPtr(monitor.DnsRecordType),
			ExpectedResponse:    getStringPtr(monitor.ExpectedResponse),
			CreatedAt:           monitor.CreatedAt.Time,
			UpdatedAt:           monitor.UpdatedAt.Time,
		},
	}

	c.JSON(http.StatusOK, response)
}

// Create godoc
// @Summary      Create a new monitor
// @Description  Creates a new monitor for the authenticated user
// @Tags         monitors
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        monitor  body      types.CreateMonitorRequest  true  "Monitor to create"
// @Success      200     {object}  types.GetMonitorResponse
// @Failure      400     {object}  map[string]string
// @Failure      401     {object}  map[string]string
// @Failure      500     {object}  map[string]string
// @Router       /monitors [post]
func (h *Handler) Create(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req types.CreateMonitorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create monitor in database
	monitor, err := h.DB.Queries.CreateMonitor(c, sqlc.CreateMonitorParams{
		UserID:              uuid.MustParse(userID),
		Name:                req.Name,
		Type:                sqlc.MonitorType(req.Type),
		Target:              req.Target,
		Interval:            int32(req.Interval),
		Timeout:             int32(req.Timeout),
		Status:              sqlc.MonitorStatus(req.Status),
		Locations:           req.Locations,
		ExpectedStatusCodes: intSlice64To32(req.ExpectedStatusCodes),
		FollowRedirects:     boolToNullBool(req.FollowRedirects),
		VerifySsl:           boolToNullBool(req.VerifySSL),
		Port:                intToNullInt(req.Port),
		DnsRecordType:       stringToNullString(req.DNSRecordType),
		ExpectedResponse:    stringToNullString(req.ExpectedResponse),
	})
	if err != nil {
		h.Logger.Error("failed to create monitor", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create monitor"})
		return
	}

	// Convert to response type
	response := types.GetMonitorResponse{
		Monitor: types.Monitor{
			ID:                  monitor.ID,
			UserID:              monitor.UserID,
			Name:                monitor.Name,
			Type:                types.MonitorType(monitor.Type),
			Target:              monitor.Target,
			Interval:            int(monitor.Interval),
			Timeout:             int(monitor.Timeout),
			Status:              types.MonitorStatus(monitor.Status),
			Locations:           monitor.Locations,
			ExpectedStatusCodes: intSlice32To64(monitor.ExpectedStatusCodes),
			FollowRedirects:     monitor.FollowRedirects.Bool,
			VerifySSL:           monitor.VerifySsl.Bool,
			Port:                getIntPtr(monitor.Port),
			DNSRecordType:       getStringPtr(monitor.DnsRecordType),
			ExpectedResponse:    getStringPtr(monitor.ExpectedResponse),
			CreatedAt:           monitor.CreatedAt.Time,
			UpdatedAt:           monitor.UpdatedAt.Time,
		},
	}

	c.JSON(http.StatusCreated, response)
}

// Update godoc
// @Summary      Update a monitor
// @Description  Updates an existing monitor for the authenticated user
// @Tags         monitors
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id   path      string  true  "Monitor ID"
// @Param        monitor  body  types.UpdateMonitorRequest  true  "Monitor to update"
// @Success      200  {object}  types.GetMonitorResponse
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /monitors/{id} [put]
func (h *Handler) Update(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid monitor id"})
		return
	}

	var req types.UpdateMonitorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get existing monitor to ensure ownership
	_, err = h.DB.Queries.GetMonitor(c, sqlc.GetMonitorParams{
		ID:     id,
		UserID: uuid.MustParse(userID),
	})
	if err != nil {
		h.Logger.Error("failed to get monitor", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get monitor"})
		return
	}

	// Update monitor in database
	monitor, err := h.DB.Queries.UpdateMonitor(c, sqlc.UpdateMonitorParams{
		ID:                  id,
		UserID:              uuid.MustParse(userID),
		Name:                stringValue(req.Name),
		Type:                sqlc.MonitorType(stringValue((*string)(req.Type))),
		Target:              stringValue(req.Target),
		Interval:            int32Value(req.Interval),
		Timeout:             int32Value(req.Timeout),
		Status:              sqlc.MonitorStatus(stringValue((*string)(req.Status))),
		Locations:           req.Locations,
		ExpectedStatusCodes: intSlice64To32(req.ExpectedStatusCodes),
		FollowRedirects:     boolToNullBool(req.FollowRedirects),
		VerifySsl:           boolToNullBool(req.VerifySSL),
		Port:                intToNullInt(req.Port),
		DnsRecordType:       stringToNullString(req.DNSRecordType),
		ExpectedResponse:    stringToNullString(req.ExpectedResponse),
	})
	if err != nil {
		h.Logger.Error("failed to update monitor", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update monitor"})
		return
	}

	// Convert to response type
	response := types.GetMonitorResponse{
		Monitor: types.Monitor{
			ID:                  monitor.ID,
			UserID:              monitor.UserID,
			Name:                monitor.Name,
			Type:                types.MonitorType(monitor.Type),
			Target:              monitor.Target,
			Interval:            int(monitor.Interval),
			Timeout:             int(monitor.Timeout),
			Status:              types.MonitorStatus(monitor.Status),
			Locations:           monitor.Locations,
			ExpectedStatusCodes: intSlice32To64(monitor.ExpectedStatusCodes),
			FollowRedirects:     monitor.FollowRedirects.Bool,
			VerifySSL:           monitor.VerifySsl.Bool,
			Port:                getIntPtr(monitor.Port),
			DNSRecordType:       getStringPtr(monitor.DnsRecordType),
			ExpectedResponse:    getStringPtr(monitor.ExpectedResponse),
			CreatedAt:           monitor.CreatedAt.Time,
			UpdatedAt:           monitor.UpdatedAt.Time,
		},
	}

	c.JSON(http.StatusOK, response)
}

// Delete godoc
// @Summary      Delete a monitor
// @Description  Deletes a monitor for the authenticated user
// @Tags         monitors
// @Accept       json
// @Produce      json
// @Security     Bearer
// @Param        id   path      string  true  "Monitor ID"
// @Success      204  {object}  nil
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /monitors/{id} [delete]
func (h *Handler) Delete(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid monitor id"})
		return
	}

	// Delete monitor from database
	err = h.DB.Queries.DeleteMonitor(c, sqlc.DeleteMonitorParams{
		ID:     id,
		UserID: uuid.MustParse(userID),
	})
	if err != nil {
		h.Logger.Error("failed to delete monitor", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete monitor"})
		return
	}

	c.Status(http.StatusNoContent)
}

// Helper functions for type conversions

func intSlice32To64(in []int32) []int {
	if in == nil {
		return nil
	}
	out := make([]int, len(in))
	for i, v := range in {
		out[i] = int(v)
	}
	return out
}

func intSlice64To32(in []int) []int32 {
	if in == nil {
		return nil
	}
	out := make([]int32, len(in))
	for i, v := range in {
		out[i] = int32(v)
	}
	return out
}

func boolToNullBool(b *bool) pgtype.Bool {
	if b == nil {
		return pgtype.Bool{Valid: false}
	}
	return pgtype.Bool{Bool: *b, Valid: true}
}

func intToNullInt(i *int) pgtype.Int4 {
	if i == nil {
		return pgtype.Int4{Valid: false}
	}
	return pgtype.Int4{Int32: int32(*i), Valid: true}
}

func stringToNullString(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

func getIntPtr(n pgtype.Int4) *int {
	if !n.Valid {
		return nil
	}
	v := int(n.Int32)
	return &v
}

func getStringPtr(s pgtype.Text) *string {
	if !s.Valid {
		return nil
	}
	return &s.String
}

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
