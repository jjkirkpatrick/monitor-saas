-- Create monitor results table
CREATE TABLE monitor_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    time TIMESTAMPTZ NOT NULL DEFAULT now(),
    location TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    latency INTEGER, -- Response time in milliseconds
    status_code INTEGER, -- HTTP status code
    response_size INTEGER, -- Size of response in bytes
    error_message TEXT, -- Error message if any
    certificate_expiry TIMESTAMPTZ, -- SSL certificate expiry for HTTPS
    dns_resolution_time INTEGER, -- DNS resolution time in milliseconds
    tls_handshake_time INTEGER, -- TLS handshake time in milliseconds
    connect_time INTEGER, -- TCP connection time in milliseconds
    first_byte_time INTEGER, -- Time to first byte in milliseconds
    total_time INTEGER -- Total check time in milliseconds
);

-- Create indexes for common query patterns
CREATE INDEX monitor_results_monitor_id_time_idx ON monitor_results(monitor_id, time DESC);
CREATE INDEX monitor_results_success_idx ON monitor_results(success);
CREATE INDEX monitor_results_location_idx ON monitor_results(location);
CREATE INDEX monitor_results_time_idx ON monitor_results(time DESC);

-- Create materialized view for hourly stats
CREATE MATERIALIZED VIEW monitor_results_hourly AS
SELECT
    date_trunc('hour', time) AS bucket,
    monitor_id,
    location,
    COUNT(*) AS total_checks,
    COUNT(*) FILTER (WHERE success = true) AS successful_checks,
    AVG(latency) AS avg_latency,
    MIN(latency) AS min_latency,
    MAX(latency) AS max_latency,
    MODE() WITHIN GROUP (ORDER BY status_code) AS most_common_status
FROM monitor_results
GROUP BY bucket, monitor_id, location;

CREATE UNIQUE INDEX monitor_results_hourly_unique_idx ON monitor_results_hourly(bucket, monitor_id, location);

-- Add RLS policies
ALTER TABLE monitor_results ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select only their own monitor results
CREATE POLICY "Users can view their own monitor results" ON monitor_results
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM monitors
        WHERE monitors.id = monitor_results.monitor_id
        AND monitors.user_id = auth.uid()
    ));

-- Policy to allow system to insert monitor results
CREATE POLICY "System can insert monitor results" ON monitor_results
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM monitors
        WHERE monitors.id = monitor_results.monitor_id
    ));

-- No update/delete policies needed as historical data should not be modified

-- Create function to refresh hourly stats
CREATE OR REPLACE FUNCTION refresh_monitor_results_hourly()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY monitor_results_hourly;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up old data (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_monitor_results()
RETURNS void AS $$
BEGIN
    DELETE FROM monitor_results
    WHERE time < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to refresh stats and cleanup old data (this requires pg_cron extension)
-- Note: These jobs should ideally be managed by the application layer if pg_cron is not available
/*
SELECT cron.schedule('0 * * * *', $$SELECT refresh_monitor_results_hourly();$$);
SELECT cron.schedule('0 0 * * *', $$SELECT cleanup_old_monitor_results();$$);
*/
