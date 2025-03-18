package settings

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jjkirkpatrick/monitoring/services/api-gateway/handlers"
)

// Handler handles settings-related requests
type Handler struct {
	*handlers.Handler
}

// NewHandler creates a new settings handler
func NewHandler(base *handlers.Handler) *Handler {
	return &Handler{
		Handler: base,
	}
}

// Get handles getting settings
func (h *Handler) Get(c *gin.Context) {
	c.Status(http.StatusNotImplemented)
}

// Update handles updating settings
func (h *Handler) Update(c *gin.Context) {
	c.Status(http.StatusNotImplemented)
}
