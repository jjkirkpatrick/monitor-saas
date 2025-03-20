-- name: CheckUserLimits :one
WITH user_monitor_count AS (
    SELECT COUNT(*) as monitor_count
    FROM monitors
    WHERE user_id = $1
),
user_daily_checks AS (
    SELECT COUNT(*) as check_count
    FROM monitor_results mr
    JOIN monitors m ON mr.monitor_id = m.id
    WHERE m.user_id = $1
    AND mr.time >= CURRENT_DATE
),
user_alert_configs AS (
    SELECT monitor_id, COUNT(*) as alert_count
    FROM alert_configs ac
    JOIN monitors m ON ac.monitor_id = m.id
    WHERE m.user_id = $1
    GROUP BY monitor_id
    ORDER BY alert_count DESC
    LIMIT 1
),
user_notification_channels AS (
    SELECT
        COUNT(DISTINCT CASE WHEN email THEN 'email' END) +
        COUNT(DISTINCT CASE WHEN sms THEN 'sms' END) +
        COUNT(DISTINCT CASE WHEN webhook_url IS NOT NULL THEN 'webhook' END) +
        COUNT(DISTINCT CASE WHEN slack_webhook_url IS NOT NULL THEN 'slack' END) +
        COUNT(DISTINCT CASE WHEN telegram_chat_id IS NOT NULL THEN 'telegram' END) as channel_count
    FROM notification_preferences
    WHERE user_id = $1
)
SELECT
    ul.*,
    COALESCE(umc.monitor_count, 0) as current_monitor_count,
    COALESCE(udc.check_count, 0) as current_check_count,
    COALESCE(uac.alert_count, 0) as max_alert_count_per_monitor,
    COALESCE(unc.channel_count, 0) as current_notification_channels,
    CASE
        WHEN COALESCE(umc.monitor_count, 0) >= ul.max_monitors THEN 'monitor_limit_reached'
        WHEN COALESCE(udc.check_count, 0) >= ul.max_checks_per_day THEN 'daily_check_limit_reached'
        WHEN COALESCE(uac.alert_count, 0) >= ul.max_alert_configs_per_monitor THEN 'alert_config_limit_reached'
        WHEN COALESCE(unc.channel_count, 0) >= ul.max_notification_channels THEN 'notification_channel_limit_reached'
        ELSE 'ok'
    END as limit_status
FROM user_limits ul
LEFT JOIN user_monitor_count umc ON true
LEFT JOIN user_daily_checks udc ON true
LEFT JOIN user_alert_configs uac ON true
LEFT JOIN user_notification_channels unc ON true
WHERE ul.user_id = $1;

-- name: IncrementUsageStats :exec
INSERT INTO user_usage_stats (
    user_id,
    date,
    total_checks,
    total_alerts_triggered,
    total_notifications_sent,
    api_calls,
    data_transfer_bytes
) VALUES (
    $1, CURRENT_DATE, $2, $3, $4, $5, $6
)
ON CONFLICT (user_id, date)
DO UPDATE SET
    total_checks = user_usage_stats.total_checks + EXCLUDED.total_checks,
    total_alerts_triggered = user_usage_stats.total_alerts_triggered + EXCLUDED.total_alerts_triggered,
    total_notifications_sent = user_usage_stats.total_notifications_sent + EXCLUDED.total_notifications_sent,
    api_calls = user_usage_stats.api_calls + EXCLUDED.api_calls,
    data_transfer_bytes = user_usage_stats.data_transfer_bytes + EXCLUDED.data_transfer_bytes;

-- name: GetUserUsageByDateRange :many
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

-- name: GetUserLimitsWithUsage :one
WITH current_usage AS (
    SELECT
        SUM(total_checks) as total_checks_30d,
        SUM(total_alerts_triggered) as total_alerts_30d,
        SUM(total_notifications_sent) as total_notifications_30d,
        SUM(api_calls) as total_api_calls_30d,
        SUM(data_transfer_bytes) as total_data_transfer_30d
    FROM user_usage_stats
    WHERE user_id = $1
    AND date >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT
    ul.*,
    COALESCE(cu.total_checks_30d, 0) as total_checks_30d,
    COALESCE(cu.total_alerts_30d, 0) as total_alerts_30d,
    COALESCE(cu.total_notifications_30d, 0) as total_notifications_30d,
    COALESCE(cu.total_api_calls_30d, 0) as total_api_calls_30d,
    COALESCE(cu.total_data_transfer_30d, 0) as total_data_transfer_30d
FROM user_limits ul
LEFT JOIN current_usage cu ON true
WHERE ul.user_id = $1;
