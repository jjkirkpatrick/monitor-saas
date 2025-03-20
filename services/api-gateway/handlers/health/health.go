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

// Check godoc
// @Summary      Health check endpoint
// @Description  Returns OK if the service is healthy
// @Tags         health
// @Accept       json
// @Produce      json
// @Success      200  {object}  map[string]string
// @Router       /health [get]
func (h *Handler) Check(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
