package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jjkirkpatrick/monitoring/pkg/auth"
	"github.com/jjkirkpatrick/monitoring/pkg/observability"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.uber.org/zap"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Initialize OpenTelemetry
	shutdown, err := observability.InitTracer("api-gateway")
	if err != nil {
		logger.Fatal("failed to initialize tracer", zap.Error(err))
	}
	defer shutdown()

	// Initialize Gin
	router := gin.New()
	router.Use(
		gin.Recovery(),
		otelgin.Middleware("api-gateway"),
		observability.LoggerMiddleware(logger),
	)

	// Initialize Auth0 middleware
	auth, err := auth.NewAuth0Middleware(
		os.Getenv("AUTH0_DOMAIN"),
		os.Getenv("AUTH0_AUDIENCE"),
	)
	if err != nil {
		logger.Fatal("failed to initialize auth middleware", zap.Error(err))
	}

	// API Routes
	v1 := router.Group("/api/v1")
	{
		// Public routes
		public := v1.Group("/public")
		{
			public.GET("/health", healthCheck)
		}

		// Protected routes
		protected := v1.Group("/")
		protected.Use(auth.Middleware())
		{
			monitors := protected.Group("/monitors")
			{
				monitors.GET("", listMonitors)
				monitors.POST("", createMonitor)
				monitors.GET("/:id", getMonitor)
				monitors.PUT("/:id", updateMonitor)
				monitors.DELETE("/:id", deleteMonitor)
			}

			alerts := protected.Group("/alerts")
			{
				alerts.GET("", listAlerts)
				alerts.POST("", createAlert)
				alerts.GET("/:id", getAlert)
				alerts.PUT("/:id", updateAlert)
				alerts.DELETE("/:id", deleteAlert)
			}

			settings := protected.Group("/settings")
			{
				settings.GET("", getSettings)
				settings.PUT("", updateSettings)
			}
		}
	}

	// Start server
	srv := &http.Server{
		Addr:    ":8080",
		Handler: router,
	}

	// Graceful shutdown
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("failed to start server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	// Shutdown server
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("server forced to shutdown", zap.Error(err))
	}

	logger.Info("server exited properly")
}

// Handler stubs
func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func listMonitors(c *gin.Context)   { c.Status(http.StatusNotImplemented) }
func createMonitor(c *gin.Context)  { c.Status(http.StatusNotImplemented) }
func getMonitor(c *gin.Context)     { c.Status(http.StatusNotImplemented) }
func updateMonitor(c *gin.Context)  { c.Status(http.StatusNotImplemented) }
func deleteMonitor(c *gin.Context)  { c.Status(http.StatusNotImplemented) }

func listAlerts(c *gin.Context)   { c.Status(http.StatusNotImplemented) }
func createAlert(c *gin.Context)  { c.Status(http.StatusNotImplemented) }
func getAlert(c *gin.Context)     { c.Status(http.StatusNotImplemented) }
func updateAlert(c *gin.Context)  { c.Status(http.StatusNotImplemented) }
func deleteAlert(c *gin.Context)  { c.Status(http.StatusNotImplemented) }

func getSettings(c *gin.Context)    { c.Status(http.StatusNotImplemented) }
func updateSettings(c *gin.Context) { c.Status(http.StatusNotImplemented) }
