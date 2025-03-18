package alerts

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jjkirkpatrick/monitoring/services/api-gateway/handlers"
)

// Handler handles alert-related requests
type Handler struct {
	*handlers.Handler
}

// NewHandler creates a new alerts handler
func NewHandler(base *handlers.Handler) *Handler {
	return &Handler{
		Handler: base,
	}
}

// List handles listing all alerts
func (h *Handler) List(c *gin.Context) {
	c.Status(http.StatusNotImplemented)
}

// Create handles alert creation
func (h *Handler) Create(c *gin.Context) {
	c.Status(http.StatusNotImplemented)
}

// Get handles getting a specific alert
func (h *Handler) Get(c *gin.Context) {
	c.Status(http.StatusNotImplemented)
}

// Update handles updating a specific alert
func (h *Handler) Update(c *gin.Context) {
	c.Status(http.StatusNotImplemented)
}

// Delete handles deleting a specific alert
func (h *Handler) Delete(c *gin.Context) {
	c.Status(http.StatusNotImplemented)
}
