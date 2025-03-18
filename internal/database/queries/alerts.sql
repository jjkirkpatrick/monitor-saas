-- name: CreateAlertConfig :one
INSERT INTO alert_configs (
    monitor_id,
    name,
    condition,
    threshold,
    severity,
    enabled,
    consecutive_count,
    cooldown_minutes
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING *;

-- name: GetAlertConfig :one
SELECT ac.*, m.user_id
FROM alert_configs ac
JOIN monitors m ON ac.monitor_id = m.id
WHERE ac.id = $1 AND m.user_id = $2;

-- name: ListAlertConfigs :many
SELECT ac.*
FROM alert_configs ac
JOIN monitors m ON ac.monitor_id = m.id
WHERE m.user_id = $1
ORDER BY ac.created_at DESC;

-- name: ListAlertConfigsByMonitor :many
SELECT *
FROM alert_configs
WHERE monitor_id = $1
ORDER BY created_at DESC;

-- name: UpdateAlertConfig :one
UPDATE alert_configs
SET
    name = COALESCE($3, name),
    condition = COALESCE($4, condition),
    threshold = COALESCE($4, threshold),
    severity = COALESCE($5, severity),
    enabled = COALESCE($6, enabled),
    consecutive_count = COALESCE($7, consecutive_count),
    cooldown_minutes = COALESCE($8, cooldown_minutes)
WHERE id = $1 AND monitor_id = $2
RETURNING *;

-- name: DeleteAlertConfig :exec
DELETE FROM alert_configs ac
USING monitors m
WHERE ac.id = $1 AND ac.monitor_id = m.id AND m.user_id = $2;

-- name: CreateAlertHistory :one
INSERT INTO alert_history (
    config_id,
    monitor_id,
    status,
    details
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetAlertHistory :one
SELECT ah.*, m.user_id
FROM alert_history ah
JOIN monitors m ON ah.monitor_id = m.id
WHERE ah.id = $1 AND m.user_id = $2;

-- name: ListAlertHistory :many
SELECT ah.*
FROM alert_history ah
JOIN monitors m ON ah.monitor_id = m.id
WHERE m.user_id = $1
ORDER BY ah.triggered_at DESC
LIMIT $2;

-- name: ListAlertHistoryByMonitor :many
SELECT *
FROM alert_history
WHERE monitor_id = $1
ORDER BY triggered_at DESC
LIMIT $2;

-- name: AcknowledgeAlert :one
UPDATE alert_history
SET
    status = 'acknowledged',
    acknowledged_at = NOW(),
    acknowledged_by = $3
WHERE id = $1 AND monitor_id = $2
RETURNING *;

-- name: ResolveAlert :one
UPDATE alert_history
SET
    status = 'resolved',
    resolved_at = NOW()
WHERE id = $1 AND monitor_id = $2
RETURNING *;

-- name: GetActiveAlerts :many
SELECT ah.*
FROM alert_history ah
JOIN monitors m ON ah.monitor_id = m.id
WHERE m.user_id = $1
AND ah.status = 'triggered'
ORDER BY ah.triggered_at DESC;

-- name: GetAlertStats :one
SELECT
    COUNT(*) as total_alerts,
    COUNT(*) FILTER (WHERE status = 'triggered') as active_alerts,
    COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged_alerts,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_alerts,
    COUNT(*) FILTER (WHERE triggered_at > NOW() - INTERVAL '24 hours') as alerts_24h
FROM alert_history ah
JOIN monitors m ON ah.monitor_id = m.id
WHERE m.user_id = $1;

-- name: UpsertNotificationPreferences :one
INSERT INTO notification_preferences (
    user_id,
    monitor_id,
    email,
    sms,
    webhook_url,
    slack_webhook_url,
    telegram_chat_id,
    severity_filter,
    quiet_hours_start,
    quiet_hours_end
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
)
ON CONFLICT (user_id, COALESCE(monitor_id, '00000000-0000-0000-0000-000000000000'::UUID))
DO UPDATE SET
    email = EXCLUDED.email,
    sms = EXCLUDED.sms,
    webhook_url = EXCLUDED.webhook_url,
    slack_webhook_url = EXCLUDED.slack_webhook_url,
    telegram_chat_id = EXCLUDED.telegram_chat_id,
    severity_filter = EXCLUDED.severity_filter,
    quiet_hours_start = EXCLUDED.quiet_hours_start,
    quiet_hours_end = EXCLUDED.quiet_hours_end,
    updated_at = NOW()
RETURNING *;

-- name: GetNotificationPreferences :one
SELECT *
FROM notification_preferences
WHERE user_id = $1 AND (monitor_id = $2 OR monitor_id IS NULL)
ORDER BY monitor_id NULLS LAST
LIMIT 1;

-- name: ListNotificationPreferences :many
SELECT *
FROM notification_preferences
WHERE user_id = $1
ORDER BY monitor_id NULLS LAST;

-- name: DeleteNotificationPreferences :exec
DELETE FROM notification_preferences
WHERE user_id = $1 AND monitor_id = $2;

-- name: GetPendingNotifications :many
SELECT ah.*, np.*, m.name as monitor_name
FROM alert_history ah
JOIN monitors m ON ah.monitor_id = m.id
JOIN notification_preferences np ON m.user_id = np.user_id
WHERE ah.notification_sent = false
AND ah.status = 'triggered'
AND (
    np.monitor_id IS NULL
    OR np.monitor_id = ah.monitor_id
)
AND ah.severity = ANY(np.severity_filter)
AND (
    np.quiet_hours_start IS NULL
    OR np.quiet_hours_end IS NULL
    OR NOT (
        CURRENT_TIME >= np.quiet_hours_start
        AND CURRENT_TIME <= np.quiet_hours_end
    )
)
ORDER BY ah.triggered_at ASC;

-- name: MarkNotificationSent :exec
UPDATE alert_history
SET notification_sent = true
WHERE id = $1;
