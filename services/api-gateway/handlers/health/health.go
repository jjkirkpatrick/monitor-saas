package health

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jjkirkpatrick/monitoring/services/api-gateway/handlers"
)

// Handler handles health check requests
type Handler struct {
	*handlers.Handler
}

// NewHandler creates a new health handler
func NewHandler(base *handlers.Handler) *Handler {
	return &Handler{
		Handler: base,
	}
}

// Check handles the health check endpoint
func (h *Handler) Check(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
} 