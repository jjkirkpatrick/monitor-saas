package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jjkirkpatrick/monitoring/pkg/auth"
	"github.com/jjkirkpatrick/monitoring/pkg/observability"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.uber.org/zap"
)

type handler struct {
	logger *zap.Logger
}

func newHandler(logger *zap.Logger) *handler {
	return &handler{
		logger: logger,
	}
}

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Error loading .env file: %v", err)
	}

	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Initialize OpenTelemetry
	shutdown, err := observability.InitTracer("api-gateway")
	if err != nil {
		logger.Fatal("failed to initialize tracer", zap.Error(err))
	}
	defer shutdown()

	// Initialize Prometheus metrics
	prometheus.MustRegister(prometheus.NewBuildInfoCollector())

	// Initialize Gin
	router := gin.New()
	router.Use(
		gin.Recovery(),
		otelgin.Middleware("api-gateway"),
		observability.LoggerMiddleware(logger),
		observability.PrometheusMiddleware(),
		cors.New(cors.Config{
			AllowOrigins:     []string{"http://localhost:3000"},
			AllowMethods:     []string{"PUT", "PATCH", "GET", "POST", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Origin", "Authorization", "Content-Type", "Accept", "X-Requested-With"},
			ExposeHeaders:    []string{"Content-Length"},
			AllowCredentials: true,
			AllowOriginFunc: func(origin string) bool {
				return origin == "http://localhost:3000"
			},
			MaxAge: 12 * time.Hour,
		}),
		func(c *gin.Context) {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

			if c.Request.Method == "OPTIONS" {
				c.AbortWithStatus(204)
				return
			}

			c.Next()
		},
	)

	// Metrics endpoint for Prometheus
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Initialize Auth0 middleware
	auth, err := auth.NewAuth0Middleware(
		os.Getenv("AUTH0_DOMAIN"),
		os.Getenv("AUTH0_AUDIENCE"),
	)
	if err != nil {
		logger.Fatal("failed to initialize auth middleware", zap.Error(err))
	}

	h := newHandler(logger)

	// API Routes
	v1 := router.Group("/api/v1")
	{
		// Public routes
		public := v1.Group("/public")
		{
			public.GET("/health", h.healthCheck)
		}

		// Protected routes
		protected := v1.Group("/")
		protected.Use(auth.Middleware())
		{
			monitors := protected.Group("/monitors")
			{
				monitors.GET("", h.listMonitors)
				monitors.POST("", h.createMonitor)
				monitors.GET("/:id", h.getMonitor)
				monitors.PUT("/:id", h.updateMonitor)
				monitors.DELETE("/:id", h.deleteMonitor)
			}

			alerts := protected.Group("/alerts")
			{
				alerts.GET("", h.listAlerts)
				alerts.POST("", h.createAlert)
				alerts.GET("/:id", h.getAlert)
				alerts.PUT("/:id", h.updateAlert)
				alerts.DELETE("/:id", h.deleteAlert)
			}

			settings := protected.Group("/settings")
			{
				settings.GET("", h.getSettings)
				settings.PUT("", h.updateSettings)
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
func (h *handler) healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *handler) listMonitors(c *gin.Context) {
	h.logger.Info("handling request",
		zap.String("handler", "listMonitors"),
		zap.String("method", "GET"),
		zap.String("path", "/monitors"))

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
func (h *handler) createMonitor(c *gin.Context) { c.Status(http.StatusNotImplemented) }
func (h *handler) getMonitor(c *gin.Context)    { c.Status(http.StatusNotImplemented) }
func (h *handler) updateMonitor(c *gin.Context) { c.Status(http.StatusNotImplemented) }
func (h *handler) deleteMonitor(c *gin.Context) { c.Status(http.StatusNotImplemented) }

func (h *handler) listAlerts(c *gin.Context)  { c.Status(http.StatusNotImplemented) }
func (h *handler) createAlert(c *gin.Context) { c.Status(http.StatusNotImplemented) }
func (h *handler) getAlert(c *gin.Context)    { c.Status(http.StatusNotImplemented) }
func (h *handler) updateAlert(c *gin.Context) { c.Status(http.StatusNotImplemented) }
func (h *handler) deleteAlert(c *gin.Context) { c.Status(http.StatusNotImplemented) }

func (h *handler) getSettings(c *gin.Context)    { c.Status(http.StatusNotImplemented) }
func (h *handler) updateSettings(c *gin.Context) { c.Status(http.StatusNotImplemented) }
