package monitors

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jjkirkpatrick/monitoring/services/api-gateway/handlers"
	"go.uber.org/zap"
)

// Handler handles monitor-related requests
type Handler struct {
	*handlers.Handler
}

// NewHandler creates a new monitors handler
func NewHandler(base *handlers.Handler) *Handler {
	return &Handler{
		Handler: base,
	}
}

// List handles listing all monitors
func (h *Handler) List(c *gin.Context) {
	h.Logger.Info("handling request",
		zap.String("handler", "listMonitors"),
		zap.String("method", "GET"),
		zap.String("path", "/monitors"))

	user, ok := c.Get("USER")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": user})
}

// Create handles monitor creation
func (h *Handler) Create(c *gin.Context) {
	c.Status(http.StatusNotImplemented)
}

// Get handles getting a specific monitor
func (h *Handler) Get(c *gin.Context) {
	c.Status(http.StatusNotImplemented)
}

// Update handles updating a specific monitor
func (h *Handler) Update(c *gin.Context) {
	c.Status(http.StatusNotImplemented)
}

// Delete handles deleting a specific monitor
func (h *Handler) Delete(c *gin.Context) {
	c.Status(http.StatusNotImplemented)
}
