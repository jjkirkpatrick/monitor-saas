-- name: CreateMonitor :one
INSERT INTO monitors (
    user_id,
    name,
    type,
    target,
    interval,
    timeout,
    status,
    locations,
    expected_status_codes,
    follow_redirects,
    verify_ssl,
    port,
    dns_record_type,
    expected_response
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
) RETURNING *;

-- name: GetMonitor :one
SELECT * FROM monitors
WHERE id = $1 AND user_id = $2;

-- name: ListMonitors :many
SELECT * FROM monitors
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: ListActiveMonitors :many
SELECT * FROM monitors
WHERE status = 'active'
ORDER BY created_at DESC;

-- name: ListMonitorsByType :many
SELECT * FROM monitors
WHERE user_id = $1 AND type = $2
ORDER BY created_at DESC;

-- name: UpdateMonitor :one
UPDATE monitors
SET
    name = COALESCE($3, name),
    type = COALESCE($4, type),
    target = COALESCE($5, target),
    interval = COALESCE($6, interval),
    timeout = COALESCE($7, timeout),
    status = COALESCE($8, status),
    locations = COALESCE($9, locations),
    expected_status_codes = COALESCE($10, expected_status_codes),
    follow_redirects = COALESCE($11, follow_redirects),
    verify_ssl = COALESCE($12, verify_ssl),
    port = COALESCE($13, port),
    dns_record_type = COALESCE($14, dns_record_type),
    expected_response = COALESCE($15, expected_response)
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: UpdateMonitorStatus :one
UPDATE monitors
SET status = $3
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteMonitor :exec
DELETE FROM monitors
WHERE id = $1 AND user_id = $2;

-- name: GetMonitorCount :one
SELECT COUNT(*) FROM monitors
WHERE user_id = $1;

-- name: GetMonitorsByLocation :many
SELECT * FROM monitors
WHERE status = 'active'
AND $1 = ANY(locations)
ORDER BY created_at DESC;

-- name: GetMonitorsNeedingCheck :many
WITH last_check AS (
    SELECT monitor_id, MAX(time) as last_check_time
    FROM monitor_results
    GROUP BY monitor_id
)
SELECT m.*
FROM monitors m
LEFT JOIN last_check lc ON m.id = lc.monitor_id
WHERE m.status = 'active'
AND (
    lc.last_check_time IS NULL
    OR lc.last_check_time < NOW() - (m.interval || ' seconds')::interval
)
ORDER BY COALESCE(lc.last_check_time, '1970-01-01'::timestamptz) ASC;

-- name: GetMonitorWithStats :one
WITH stats AS (
    SELECT
        monitor_id,
        COUNT(*) as total_checks,
        COUNT(*) FILTER (WHERE success = true) as successful_checks,
        AVG(latency) as avg_latency,
        MAX(latency) as max_latency,
        MIN(latency) as min_latency
    FROM monitor_results
    WHERE monitor_id = $1
    AND time > NOW() - INTERVAL '24 hours'
    GROUP BY monitor_id
)
SELECT
    m.*,
    COALESCE(s.total_checks, 0) as checks_24h,
    COALESCE(s.successful_checks, 0) as successful_checks_24h,
    COALESCE(s.avg_latency, 0) as avg_latency_24h,
    COALESCE(s.max_latency, 0) as max_latency_24h,
    COALESCE(s.min_latency, 0) as min_latency_24h,
    CASE
        WHEN s.total_checks > 0 THEN (s.successful_checks::float / s.total_checks::float) * 100
        ELSE 0
    END as uptime_24h
FROM monitors m
LEFT JOIN stats s ON m.id = s.monitor_id
WHERE m.id = $1 AND m.user_id = $2;
