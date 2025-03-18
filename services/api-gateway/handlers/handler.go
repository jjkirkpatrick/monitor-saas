package handlers

import (
	"github.com/jjkirkpatrick/monitoring/internal/database"
	"go.uber.org/zap"
)

// Handler contains common dependencies for all handlers
type Handler struct {
	Logger *zap.Logger
	DB     *database.DB
}

// NewHandler creates a new base handler with common dependencies
func NewHandler(logger *zap.Logger, db *database.DB) *Handler {
	return &Handler{
		Logger: logger,
		DB:     db,
	}
}
