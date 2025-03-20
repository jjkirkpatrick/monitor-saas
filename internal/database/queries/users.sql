-- name: GetUserSettings :one
SELECT * FROM user_settings
WHERE user_id = $1;

-- name: UpdateUserSettings :one
UPDATE user_settings
SET
    theme = COALESCE($2, theme),
    timezone = COALESCE($3, timezone),
    date_format = COALESCE($4, date_format),
    time_format = COALESCE($5, time_format),
    default_dashboard_view = COALESCE($6, default_dashboard_view),
    dashboard_refresh_interval = COALESCE($7, dashboard_refresh_interval),
    email_digest_enabled = COALESCE($8, email_digest_enabled),
    email_digest_frequency = COALESCE($9, email_digest_frequency),
    mobile_number = COALESCE($10, mobile_number),
    telegram_username = COALESCE($11, telegram_username),
    webhook_secret = COALESCE($12, webhook_secret),
    api_key_enabled = COALESCE($13, api_key_enabled),
    api_key = COALESCE($14, api_key),
    api_key_created_at = COALESCE($15, api_key_created_at)
WHERE user_id = $1
RETURNING *;

-- name: GetUserLimits :one
SELECT * FROM user_limits
WHERE user_id = $1;

-- name: UpdateUserLimits :one
UPDATE user_limits
SET
    max_monitors = COALESCE($2, max_monitors),
    max_checks_per_day = COALESCE($3, max_checks_per_day),
    max_alert_configs_per_monitor = COALESCE($4, max_alert_configs_per_monitor),
    max_notification_channels = COALESCE($5, max_notification_channels),
    retention_days = COALESCE($6, retention_days),
    api_rate_limit_per_minute = COALESCE($7, api_rate_limit_per_minute)
WHERE user_id = $1
RETURNING *;

-- name: GetUserUsageStats :one
SELECT * FROM user_usage_stats
WHERE user_id = $1 AND date = $2;

-- name: GetUserUsageStatsByDateRange :many
SELECT
    date,
    total_checks,
    total_alerts_triggered,
    total_notifications_sent,
    api_calls,
    data_transfer_bytes
FROM user_usage_stats
WHERE user_id = $1
AND date >= $2
AND date <= $3
ORDER BY date;

-- name: UpsertUserUsageStats :one
INSERT INTO user_usage_stats (
    user_id,
    date,
    total_checks,
    total_alerts_triggered,
    total_notifications_sent,
    api_calls,
    data_transfer_bytes
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
ON CONFLICT (user_id, date)
DO UPDATE SET
    total_checks = user_usage_stats.total_checks + EXCLUDED.total_checks,
    total_alerts_triggered = user_usage_stats.total_alerts_triggered + EXCLUDED.total_alerts_triggered,
    total_notifications_sent = user_usage_stats.total_notifications_sent + EXCLUDED.total_notifications_sent,
    api_calls = user_usage_stats.api_calls + EXCLUDED.api_calls,
    data_transfer_bytes = user_usage_stats.data_transfer_bytes + EXCLUDED.data_transfer_bytes
RETURNING *;

-- name: GenerateApiKey :one
WITH new_key AS (
    SELECT generate_api_key() as key
)
UPDATE user_settings
SET
    api_key = new_key.key,
    api_key_enabled = true,
    api_key_created_at = NOW()
FROM new_key
WHERE user_id = $1
RETURNING api_key;

-- name: RevokeApiKey :exec
UPDATE user_settings
SET
    api_key = NULL,
    api_key_enabled = false,
    api_key_created_at = NULL,
    api_key_last_used_at = NULL
WHERE user_id = $1;

-- name: UpdateApiKeyLastUsed :exec
UPDATE user_settings
SET api_key_last_used_at = NOW()
WHERE user_id = $1;

-- name: ToggleSetting :one
UPDATE user_settings
SET
    email_digest_enabled = CASE WHEN $2 = 'email_digest_enabled' THEN NOT email_digest_enabled ELSE email_digest_enabled END,
    api_key_enabled = CASE WHEN $2 = 'api_key_enabled' THEN NOT api_key_enabled ELSE api_key_enabled END
WHERE user_id = $1
RETURNING *;

-- name: ResetUserSettings :one
UPDATE user_settings
SET
    theme = 'system',
    timezone = 'UTC',
    date_format = 'YYYY-MM-DD',
    time_format = 'HH:mm:ss',
    default_dashboard_view = 'overview',
    dashboard_refresh_interval = 60,
    email_digest_enabled = true,
    email_digest_frequency = 'daily',
    mobile_number = NULL,
    telegram_username = NULL,
    webhook_secret = NULL,
    api_key_enabled = false,
    api_key = NULL,
    api_key_created_at = NULL,
    api_key_last_used_at = NULL
WHERE user_id = $1
RETURNING *;

-- name: GetUserMonitoringStats :one
SELECT
    COUNT(*) total_monitors,
    COUNT(*) FILTER (WHERE status = 'active') active_monitors,
    COUNT(*) FILTER (WHERE status = 'paused') paused_monitors,
    COUNT(*) FILTER (WHERE status = 'error') error_monitors,
    (
        SELECT COUNT(*) 
        FROM monitor_results mr
        JOIN monitors m2 ON mr.monitor_id = m2.id
        WHERE m2.user_id = $1
        AND mr.time > NOW() - INTERVAL '24 hours'
    ) checks_24h,
    (
        SELECT COUNT(*) 
        FROM monitor_results mr
        JOIN monitors m2 ON mr.monitor_id = m2.id
        WHERE m2.user_id = $1
        AND mr.time > NOW() - INTERVAL '24 hours'
        AND mr.success = true
    ) successful_checks_24h,
    (
        SELECT ROUND(AVG(latency)::numeric, 2)
        FROM monitor_results mr
        JOIN monitors m2 ON mr.monitor_id = m2.id
        WHERE m2.user_id = $1
        AND mr.time > NOW() - INTERVAL '24 hours'
    ) avg_latency_24h,
    (
        SELECT COUNT(*)
        FROM alert_history ah
        JOIN monitors m2 ON ah.monitor_id = m2.id
        WHERE m2.user_id = $1
        AND ah.triggered_at > NOW() - INTERVAL '24 hours'
    ) alerts_24h,
    (
        SELECT COUNT(*)
        FROM alert_history ah
        JOIN monitors m2 ON ah.monitor_id = m2.id
        WHERE m2.user_id = $1
        AND ah.triggered_at > NOW() - INTERVAL '24 hours'
        AND ah.status = 'triggered'
    ) active_alerts_24h
FROM monitors m
WHERE m.user_id = $1;


-- name: GetUsersNearingLimits :many
WITH user_monitor_counts AS (
    SELECT
        m.user_id,
        COUNT(*) as monitor_count
    FROM monitors m
    GROUP BY m.user_id
),
user_check_counts AS (
    SELECT
        m.user_id,
        COUNT(*) as check_count
    FROM monitor_results mr
    JOIN monitors m ON mr.monitor_id = m.id
    WHERE mr.time >= CURRENT_DATE
    GROUP BY m.user_id
),
user_alert_counts AS (
    SELECT
        m.user_id,
        COUNT(*) as alert_count
    FROM alert_configs ac
    JOIN monitors m ON ac.monitor_id = m.id
    GROUP BY m.user_id
)
SELECT
    ul.*,
    COALESCE(umc.monitor_count, 0) as current_monitor_count,
    COALESCE(ucc.check_count, 0) as current_check_count,
    COALESCE(uac.alert_count, 0) as current_alert_count
FROM user_limits ul
LEFT JOIN user_monitor_counts umc ON ul.user_id = umc.user_id
LEFT JOIN user_check_counts ucc ON ul.user_id = ucc.user_id
LEFT JOIN user_alert_counts uac ON ul.user_id = uac.user_id
WHERE
    COALESCE(umc.monitor_count, 0) >= ul.max_monitors * 0.8
    OR COALESCE(ucc.check_count, 0) >= ul.max_checks_per_day * 0.8;
