-- name: CreateMonitorResult :one
INSERT INTO monitor_results (
    monitor_id,
    location,
    success,
    latency,
    status_code,
    response_size,
    error_message,
    certificate_expiry,
    dns_resolution_time,
    tls_handshake_time,
    connect_time,
    first_byte_time,
    total_time
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
) RETURNING *;

-- name: GetMonitorResults :many
SELECT * FROM monitor_results
WHERE monitor_id = $1
AND time >= $2
AND time <= $3
ORDER BY time DESC
LIMIT $4;

-- name: GetLatestMonitorResult :one
SELECT * FROM monitor_results
WHERE monitor_id = $1
ORDER BY time DESC
LIMIT 1;

-- name: GetMonitorResultsByLocation :many
SELECT * FROM monitor_results
WHERE monitor_id = $1
AND location = $2
AND time >= $3
AND time <= $4
ORDER BY time DESC
LIMIT $5;

-- name: GetMonitorStats :one
SELECT
    COUNT(*) as total_checks,
    COUNT(*) FILTER (WHERE success = true) as successful_checks,
    ROUND(AVG(latency)::numeric, 2) as avg_latency,
    MAX(latency) as max_latency,
    MIN(latency) as min_latency,
    ROUND((COUNT(*) FILTER (WHERE success = true)::float / COUNT(*)::float * 100)::numeric, 2) as success_rate,
    MODE() WITHIN GROUP (ORDER BY status_code) as most_common_status_code,
    MAX(certificate_expiry) as latest_cert_expiry,
    ROUND(AVG(dns_resolution_time)::numeric, 2) as avg_dns_time,
    ROUND(AVG(tls_handshake_time)::numeric, 2) as avg_tls_time,
    ROUND(AVG(connect_time)::numeric, 2) as avg_connect_time,
    ROUND(AVG(first_byte_time)::numeric, 2) as avg_ttfb
FROM monitor_results
WHERE monitor_id = $1
AND time >= $2
AND time <= $3;

-- name: GetMonitorStatsGroupedByLocation :many
SELECT
    location,
    COUNT(*) as total_checks,
    COUNT(*) FILTER (WHERE success = true) as successful_checks,
    ROUND(AVG(latency)::numeric, 2) as avg_latency,
    MAX(latency) as max_latency,
    MIN(latency) as min_latency,
    ROUND((COUNT(*) FILTER (WHERE success = true)::float / COUNT(*)::float * 100)::numeric, 2) as success_rate
FROM monitor_results
WHERE monitor_id = $1
AND time >= $2
AND time <= $3
GROUP BY location
ORDER BY location;

-- name: GetMonitorTimeSeries :many
WITH time_buckets AS (
    SELECT
        date_trunc($4::text, time) as bucket,
        COUNT(*) as total_checks,
        COUNT(*) FILTER (WHERE success = true) as successful_checks,
        ROUND(AVG(latency)::numeric, 2) as avg_latency,
        MAX(latency) as max_latency,
        MIN(latency) as min_latency
    FROM monitor_results
    WHERE monitor_id = $1
    AND time >= $2
    AND time <= $3
    GROUP BY bucket
    ORDER BY bucket
)
SELECT
    bucket as time,
    total_checks,
    successful_checks,
    avg_latency,
    max_latency,
    min_latency,
    ROUND((successful_checks::float / total_checks::float * 100)::numeric, 2) as success_rate
FROM time_buckets;

-- name: GetMonitorHourlyStats :many
SELECT
    bucket,
    monitor_id,
    location,
    total_checks,
    successful_checks,
    avg_latency,
    min_latency,
    max_latency,
    most_common_status,
    ROUND((successful_checks::float / total_checks::float * 100)::numeric, 2) as success_rate
FROM monitor_results_hourly
WHERE monitor_id = $1
AND bucket >= $2
AND bucket <= $3
ORDER BY bucket DESC;

-- name: GetFailedChecks :many
SELECT * FROM monitor_results
WHERE monitor_id = $1
AND success = false
AND time >= $2
AND time <= $3
ORDER BY time DESC
LIMIT $4;

-- name: GetMonitorResultsCount :one
SELECT COUNT(*) FROM monitor_results
WHERE monitor_id = $1
AND time >= $2
AND time <= $3;

-- name: DeleteOldMonitorResults :exec
DELETE FROM monitor_results
WHERE time < NOW() - ($1 || ' days')::interval;

-- name: RefreshHourlyStats :exec
SELECT refresh_monitor_results_hourly();
