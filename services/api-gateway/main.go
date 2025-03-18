package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jjkirkpatrick/monitoring/internal/database"
	"github.com/jjkirkpatrick/monitoring/pkg/auth"
	"github.com/jjkirkpatrick/monitoring/pkg/observability"
	"github.com/jjkirkpatrick/monitoring/services/api-gateway/handlers"
	"github.com/jjkirkpatrick/monitoring/services/api-gateway/handlers/alerts"
	"github.com/jjkirkpatrick/monitoring/services/api-gateway/handlers/health"
	"github.com/jjkirkpatrick/monitoring/services/api-gateway/handlers/monitors"
	"github.com/jjkirkpatrick/monitoring/services/api-gateway/handlers/settings"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
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

	// Initialize Database
	ctx := context.Background()
	db, err := database.New(ctx)
	if err != nil {
		logger.Fatal("failed to initialize database", zap.Error(err))
	}
	defer db.Close()

	// Initialize Prometheus metrics
	prometheus.MustRegister(collectors.NewBuildInfoCollector())

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

	// Initialize base handler
	baseHandler := handlers.NewHandler(logger, db)

	// Initialize domain handlers
	healthHandler := health.NewHandler(baseHandler)
	monitorsHandler := monitors.NewHandler(baseHandler)
	alertsHandler := alerts.NewHandler(baseHandler)
	settingsHandler := settings.NewHandler(baseHandler)

	// API Routes
	v1 := router.Group("/api/v1")
	{
		// Public routes
		public := v1.Group("/public")
		{
			public.GET("/health", healthHandler.Check)
		}

		// Protected routes
		protected := v1.Group("/")
		protected.Use(auth.JWTMiddleware())
		{
			monitors := protected.Group("/monitors")
			{
				monitors.GET("", monitorsHandler.List)
				monitors.POST("", monitorsHandler.Create)
				monitors.GET("/:id", monitorsHandler.Get)
				monitors.PUT("/:id", monitorsHandler.Update)
				monitors.DELETE("/:id", monitorsHandler.Delete)
			}

			alerts := protected.Group("/alerts")
			{
				alerts.GET("", alertsHandler.List)
				alerts.POST("", alertsHandler.Create)
				alerts.GET("/:id", alertsHandler.Get)
				alerts.PUT("/:id", alertsHandler.Update)
				alerts.DELETE("/:id", alertsHandler.Delete)
			}

			settings := protected.Group("/settings")
			{
				settings.GET("", settingsHandler.Get)
				settings.PUT("", settingsHandler.Update)
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
