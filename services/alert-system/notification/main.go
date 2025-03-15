package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/jjkirkpatrick/monitoring/pkg/observability"
	_ "github.com/lib/pq"
	"github.com/nats-io/nats.go"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type NotificationService struct {
	logger    *zap.Logger
	natsConn  *nats.Conn
	db        *sql.DB
	redis     *redis.Client
	providers map[string]NotificationProvider
	mu        sync.RWMutex
}

type NotificationProvider interface {
	Send(notification *Notification) error
}

type Notification struct {
	ID          string            `json:"id"`
	Type        string            `json:"type"`
	RuleID      string            `json:"rule_id"`
	MonitorID   string            `json:"monitor_id"`
	IncidentID  string           `json:"incident_id"`
	Channels    []string          `json:"channels"`
	Timestamp   time.Time         `json:"timestamp"`
	Message     string            `json:"message"`
	Status      string            `json:"status"`
	RetryCount  int              `json:"retry_count"`
	LastRetry   time.Time         `json:"last_retry"`
	Metadata    map[string]string `json:"metadata"`
}

// Email notification provider
type EmailProvider struct {
	// In a real implementation, this would contain SMTP configuration
	logger *zap.Logger
}

func (p *EmailProvider) Send(n *Notification) error {
	// Simulate sending email
	p.logger.Info("sending email notification",
		zap.String("notification_id", n.ID),
		zap.String("message", n.Message))
	return nil
}

// SMS notification provider
type SMSProvider struct {
	// In a real implementation, this would contain SMS gateway configuration
	logger *zap.Logger
}

func (p *SMSProvider) Send(n *Notification) error {
	// Simulate sending SMS
	p.logger.Info("sending SMS notification",
		zap.String("notification_id", n.ID),
		zap.String("message", n.Message))
	return nil
}

func NewNotificationService(logger *zap.Logger, natsConn *nats.Conn, db *sql.DB, redis *redis.Client) *NotificationService {
	service := &NotificationService{
		logger:    logger,
		natsConn:  natsConn,
		db:        db,
		redis:     redis,
		providers: make(map[string]NotificationProvider),
	}

	// Register notification providers
	service.providers["email"] = &EmailProvider{logger: logger}
	service.providers["sms"] = &SMSProvider{logger: logger}

	return service
}

func (s *NotificationService) Start() error {
	// Initialize database
	if err := s.initDatabase(); err != nil {
		return err
	}

	// Subscribe to notification requests
	if _, err := s.natsConn.Subscribe("notifications.send", s.handleNotification); err != nil {
		return err
	}

	// Start retry worker
	go s.runRetryWorker()

	return nil
}

func (s *NotificationService) initDatabase() error {
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS notifications (
			id TEXT PRIMARY KEY,
			type TEXT NOT NULL,
			rule_id TEXT NOT NULL,
			monitor_id TEXT NOT NULL,
			incident_id TEXT NOT NULL,
			channels TEXT[] NOT NULL,
			timestamp TIMESTAMPTZ NOT NULL,
			message TEXT NOT NULL,
			status TEXT NOT NULL,
			retry_count INTEGER NOT NULL DEFAULT 0,
			last_retry TIMESTAMPTZ,
			metadata JSONB
		);

		CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
		CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp);
	`)
	return err
}

func (s *NotificationService) handleNotification(msg *nats.Msg) {
	var notification Notification
	if err := json.Unmarshal(msg.Data, &notification); err != nil {
		s.logger.Error("failed to unmarshal notification", zap.Error(err))
		return
	}

	// Generate notification ID if not provided
	if notification.ID == "" {
		notification.ID = generateID()
	}

	// Set initial status
	notification.Status = "pending"
	notification.RetryCount = 0

	// Store notification
	if err := s.storeNotification(&notification); err != nil {
		s.logger.Error("failed to store notification",
			zap.Error(err),
			zap.String("notification_id", notification.ID))
		return
	}

	// Process notification
	go s.processNotification(&notification)
}

func (s *NotificationService) storeNotification(n *Notification) error {
	metadata, err := json.Marshal(n.Metadata)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(`
		INSERT INTO notifications (
			id, type, rule_id, monitor_id, incident_id,
			channels, timestamp, message, status,
			retry_count, last_retry, metadata
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
		n.ID, n.Type, n.RuleID, n.MonitorID, n.IncidentID,
		n.Channels, n.Timestamp, n.Message, n.Status,
		n.RetryCount, n.LastRetry, metadata,
	)
	return err
}

func (s *NotificationService) processNotification(n *Notification) {
	for _, channel := range n.Channels {
		provider, exists := s.providers[channel]
		if !exists {
			s.logger.Error("unknown notification channel",
				zap.String("channel", channel),
				zap.String("notification_id", n.ID))
			continue
		}

		if err := provider.Send(n); err != nil {
			s.logger.Error("failed to send notification",
				zap.Error(err),
				zap.String("channel", channel),
				zap.String("notification_id", n.ID))

			// Schedule for retry
			s.scheduleRetry(n)
			return
		}
	}

	// Update notification status
	_, err := s.db.Exec(`
		UPDATE notifications
		SET status = 'sent'
		WHERE id = $1`,
		n.ID,
	)
	if err != nil {
		s.logger.Error("failed to update notification status",
			zap.Error(err),
			zap.String("notification_id", n.ID))
	}
}

func (s *NotificationService) scheduleRetry(n *Notification) {
	n.RetryCount++
	n.LastRetry = time.Now()
	n.Status = "retry"

	// Update notification in database
	_, err := s.db.Exec(`
		UPDATE notifications
		SET status = $2, retry_count = $3, last_retry = $4
		WHERE id = $1`,
		n.ID, n.Status, n.RetryCount, n.LastRetry,
	)
	if err != nil {
		s.logger.Error("failed to update notification for retry",
			zap.Error(err),
			zap.String("notification_id", n.ID))
		return
	}

	// Add to retry queue with exponential backoff
	retryDelay := time.Duration(1<<uint(n.RetryCount-1)) * time.Minute
	retryAt := time.Now().Add(retryDelay)

	// Store retry time in Redis
	ctx := context.Background()
	err = s.redis.ZAdd(ctx, "notification_retries", redis.Z{
		Score:  float64(retryAt.Unix()),
		Member: n.ID,
	}).Err()
	if err != nil {
		s.logger.Error("failed to schedule notification retry",
			zap.Error(err),
			zap.String("notification_id", n.ID))
	}
}

func (s *NotificationService) runRetryWorker() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		ctx := context.Background()
		now := float64(time.Now().Unix())

		// Get notifications due for retry
		results, err := s.redis.ZRangeByScore(ctx, "notification_retries", &redis.ZRangeBy{
			Min: "0",
			Max: fmt.Sprintf("%f", now),
		}).Result()
		if err != nil {
			s.logger.Error("failed to get notifications for retry", zap.Error(err))
			continue
		}

		for _, notificationID := range results {
			// Get notification details
			var n Notification
			err := s.db.QueryRow(`
				SELECT id, type, rule_id, monitor_id, incident_id,
					channels, timestamp, message, status,
					retry_count, last_retry, metadata
				FROM notifications
				WHERE id = $1`,
				notificationID,
			).Scan(&n.ID, &n.Type, &n.RuleID, &n.MonitorID, &n.IncidentID,
				&n.Channels, &n.Timestamp, &n.Message, &n.Status,
				&n.RetryCount, &n.LastRetry, &n.Metadata)
			if err != nil {
				s.logger.Error("failed to get notification for retry",
					zap.Error(err),
					zap.String("notification_id", notificationID))
				continue
			}

			// Remove from retry queue
			s.redis.ZRem(ctx, "notification_retries", notificationID)

			// Retry notification
			go s.processNotification(&n)
		}
	}
}

func generateID() string {
	return fmt.Sprintf("notif_%d", time.Now().UnixNano())
}

func main() {
	// Initialize logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Initialize OpenTelemetry
	shutdown, err := observability.InitTracer("notification-service")
	if err != nil {
		logger.Fatal("failed to initialize tracer", zap.Error(err))
	}
	defer shutdown()

	// Connect to PostgreSQL
	db, err := sql.Open("postgres", os.Getenv("POSTGRES_DSN"))
	if err != nil {
		logger.Fatal("failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	// Test database connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		logger.Fatal("failed to ping database", zap.Error(err))
	}

	// Connect to Redis
	redisClient := redis.NewClient(&redis.Options{
		Addr: os.Getenv("REDIS_URL"),
	})
	defer redisClient.Close()

	// Test Redis connection
	if err := redisClient.Ping(ctx).Err(); err != nil {
		logger.Fatal("failed to connect to Redis", zap.Error(err))
	}

	// Connect to NATS
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}

	nc, err := nats.Connect(natsURL)
	if err != nil {
		logger.Fatal("failed to connect to NATS", zap.Error(err))
	}
	defer nc.Close()

	// Create and start notification service
	service := NewNotificationService(logger, nc, db, redisClient)
	if err := service.Start(); err != nil {
		logger.Fatal("failed to start notification service", zap.Error(err))
	}

	// Wait for shutdown signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	logger.Info("notification service stopped")
}
