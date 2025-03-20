-- Migration: 20250319150000_monitor_metrics_functions.sql
-- Creates functions for monitor metrics, check processing, and analytics

-- ===============================
-- MONITOR CHECK PROCESSING
-- ===============================

-- Function to record a monitor check result
CREATE OR REPLACE FUNCTION record_monitor_check(
    p_monitor_id UUID,
    p_status TEXT,
    p_response_time_ms INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_http_status_code INTEGER DEFAULT NULL,
    p_certificate_days_remaining INTEGER DEFAULT NULL,
    p_dns_resolution_time_ms INTEGER DEFAULT NULL,
    p_packet_loss_percent DECIMAL(5,2) DEFAULT NULL,
    p_latency_min_ms INTEGER DEFAULT NULL,
    p_latency_avg_ms INTEGER DEFAULT NULL,
    p_latency_max_ms INTEGER DEFAULT NULL,
    p_metric_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    metric_id UUID;
    prev_status TEXT;
    curr_consecutive_successes INTEGER;
    curr_consecutive_failures INTEGER;
    should_update_status BOOLEAN := FALSE;
    alert_after_failures INTEGER;
    alert_recovery_threshold INTEGER;
BEGIN
    -- Get current monitor state
    SELECT 
        status, 
        consecutive_successes, 
        consecutive_failures,
        m.alert_after_failures,
        m.alert_recovery_threshold
    INTO 
        prev_status, 
        curr_consecutive_successes, 
        curr_consecutive_failures,
        alert_after_failures,
        alert_recovery_threshold
    FROM monitors m
    WHERE id = p_monitor_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Monitor not found';
    END IF;

    -- Insert the check result into metrics
    INSERT INTO monitor_metrics (
        monitor_id,
        check_time,
        status,
        response_time_ms,
        error_message,
        http_status_code,
        certificate_days_remaining,
        dns_resolution_time_ms,
        packet_loss_percent,
        latency_min_ms,
        latency_avg_ms,
        latency_max_ms,
        metric_data
    )
    VALUES (
        p_monitor_id,
        now(),
        p_status,
        p_response_time_ms,
        p_error_message,
        p_http_status_code,
        p_certificate_days_remaining,
        p_dns_resolution_time_ms,
        p_packet_loss_percent,
        p_latency_min_ms,
        p_latency_avg_ms,
        p_latency_max_ms,
        p_metric_data
    )
    RETURNING id INTO metric_id;

    -- Update consecutive success/failure counters
    IF p_status = 'up' THEN
        curr_consecutive_successes := curr_consecutive_successes + 1;
        curr_consecutive_failures := 0;
        
        -- Check if we should update status to 'up' after recovery
        IF prev_status != 'up' AND curr_consecutive_successes >= alert_recovery_threshold THEN
            should_update_status := TRUE;
        END IF;
    ELSE
        curr_consecutive_failures := curr_consecutive_failures + 1;
        curr_consecutive_successes := 0;
        
        -- Check if we should update status to non-up after failures
        IF prev_status = 'up' AND curr_consecutive_failures >= alert_after_failures THEN
            should_update_status := TRUE;
        END IF;
    END IF;

    -- Update the monitor with the check result
    UPDATE monitors
    SET 
        last_check_at = now(),
        last_response_time_ms = p_response_time_ms,
        last_error = p_error_message,
        consecutive_successes = curr_consecutive_successes,
        consecutive_failures = curr_consecutive_failures,
        status = CASE 
            WHEN should_update_status THEN p_status
            ELSE status
        END,
        last_status_change_at = CASE 
            WHEN should_update_status THEN now()
            ELSE last_status_change_at
        END
    WHERE id = p_monitor_id;

    -- If status changed, trigger alerts (in a real implementation, 
    -- this would likely call an external service or add to a queue)
    IF should_update_status THEN
        -- For demo purposes, log the status change
        RAISE NOTICE 'Monitor % status changed from % to %', p_monitor_id, prev_status, p_status;
        
        -- In a real implementation, you might:
        -- 1. Insert into an alerts table
        -- 2. Call a notification service
        -- 3. Log the event for auditing
    END IF;

    RETURN metric_id;
END;
$$;

-- Function to check if monitor is in maintenance
CREATE OR REPLACE FUNCTION is_monitor_in_maintenance(p_monitor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    in_maintenance BOOLEAN;
BEGIN
    SELECT 
        CASE
            WHEN maintenance_mode = TRUE AND (maintenance_until IS NULL OR maintenance_until > now()) THEN TRUE
            WHEN maintenance_mode = TRUE AND maintenance_until <= now() THEN FALSE
            ELSE FALSE
        END INTO in_maintenance
    FROM monitors
    WHERE id = p_monitor_id;
    
    -- If monitor in maintenance but past the end time, update it
    IF in_maintenance = FALSE AND EXISTS (
        SELECT 1 FROM monitors 
        WHERE id = p_monitor_id AND maintenance_mode = TRUE AND maintenance_until <= now()
    ) THEN
        UPDATE monitors
        SET maintenance_mode = FALSE
        WHERE id = p_monitor_id;
    END IF;
    
    RETURN COALESCE(in_maintenance, FALSE);
END;
$$;

-- ===============================
-- MONITOR ANALYTICS FUNCTIONS
-- ===============================

-- Function to get monitor uptime percentage for a given period
CREATE OR REPLACE FUNCTION get_monitor_uptime(
    p_monitor_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ DEFAULT now()
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_checks INTEGER;
    successful_checks INTEGER;
    uptime_percentage NUMERIC;
    monitor_account_id UUID;
BEGIN
    -- Get the account ID for the monitor
    SELECT account_id INTO monitor_account_id
    FROM monitors
    WHERE id = p_monitor_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Monitor not found';
    END IF;
    
    -- Verify user has access to the monitor's account
    IF NOT EXISTS(
        SELECT 1 FROM basejump.account_user 
        WHERE account_id = monitor_account_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You do not have access to view this monitor';
    END IF;

    -- Get check counts
    SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'up') AS successful
    INTO 
        total_checks,
        successful_checks
    FROM monitor_metrics
    WHERE 
        monitor_id = p_monitor_id
        AND check_time BETWEEN p_start_time AND p_end_time;
        
    -- Calculate uptime percentage
    IF total_checks > 0 THEN
        uptime_percentage := (successful_checks::NUMERIC / total_checks) * 100;
    ELSE
        uptime_percentage := NULL; -- No data for the period
    END IF;
    
    RETURN uptime_percentage;
END;
$$;

-- Function to get monitor response time statistics for a period
CREATE OR REPLACE FUNCTION get_monitor_response_stats(
    p_monitor_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ DEFAULT now()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    monitor_account_id UUID;
BEGIN
    -- Get the account ID for the monitor
    SELECT account_id INTO monitor_account_id
    FROM monitors
    WHERE id = p_monitor_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Monitor not found';
    END IF;
    
    -- Verify user has access to the monitor's account
    IF NOT EXISTS(
        SELECT 1 FROM basejump.account_user 
        WHERE account_id = monitor_account_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You do not have access to view this monitor';
    END IF;

    -- Get response time statistics
    SELECT jsonb_build_object(
        'min', MIN(response_time_ms),
        'max', MAX(response_time_ms),
        'avg', AVG(response_time_ms)::INTEGER,
        'p90', percentile_cont(0.90) WITHIN GROUP (ORDER BY response_time_ms),
        'p95', percentile_cont(0.95) WITHIN GROUP (ORDER BY response_time_ms),
        'p99', percentile_cont(0.99) WITHIN GROUP (ORDER BY response_time_ms),
        'count', COUNT(*)
    ) INTO result
    FROM monitor_metrics
    WHERE 
        monitor_id = p_monitor_id
        AND check_time BETWEEN p_start_time AND p_end_time
        AND response_time_ms IS NOT NULL;
        
    RETURN result;
END;
$$;

-- Function to get monitor metrics for a period with pagination
CREATE OR REPLACE FUNCTION get_monitor_metrics(
    p_monitor_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ DEFAULT now(),
    p_page_size INTEGER DEFAULT 100,
    p_page_number INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    metrics_data JSONB;
    total_count INTEGER;
    offset_val INTEGER;
    monitor_account_id UUID;
BEGIN
    -- Get the account ID for the monitor
    SELECT account_id INTO monitor_account_id
    FROM monitors
    WHERE id = p_monitor_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Monitor not found';
    END IF;
    
    -- Verify user has access to the monitor's account
    IF NOT EXISTS(
        SELECT 1 FROM basejump.account_user 
        WHERE account_id = monitor_account_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You do not have access to view this monitor';
    END IF;

    -- Calculate offset
    offset_val := (p_page_number - 1) * p_page_size;

    -- Get total count
    SELECT COUNT(*)
    INTO total_count
    FROM monitor_metrics
    WHERE 
        monitor_id = p_monitor_id
        AND check_time BETWEEN p_start_time AND p_end_time;

    -- Get metrics with pagination
    SELECT jsonb_agg(jsonb_build_object(
        'id', mm.id,
        'check_time', mm.check_time,
        'status', mm.status,
        'response_time_ms', mm.response_time_ms,
        'error_message', mm.error_message,
        'http_status_code', mm.http_status_code,
        'certificate_days_remaining', mm.certificate_days_remaining,
        'dns_resolution_time_ms', mm.dns_resolution_time_ms,
        'packet_loss_percent', mm.packet_loss_percent,
        'latency_min_ms', mm.latency_min_ms,
        'latency_avg_ms', mm.latency_avg_ms,
        'latency_max_ms', mm.latency_max_ms,
        'metric_data', mm.metric_data
    ))
    INTO metrics_data
    FROM monitor_metrics mm
    WHERE 
        mm.monitor_id = p_monitor_id
        AND mm.check_time BETWEEN p_start_time AND p_end_time
    ORDER BY mm.check_time DESC
    LIMIT p_page_size
    OFFSET offset_val;

    -- Build the complete result with pagination info
    SELECT jsonb_build_object(
        'metrics', COALESCE(metrics_data, '[]'::JSONB),
        'pagination', jsonb_build_object(
            'total_count', total_count,
            'total_pages', CEIL(total_count::FLOAT / p_page_size),
            'page_size', p_page_size,
            'page_number', p_page_number
        ),
        'summary', jsonb_build_object(
            'uptime_percentage', get_monitor_uptime(p_monitor_id, p_start_time, p_end_time),
            'response_stats', get_monitor_response_stats(p_monitor_id, p_start_time, p_end_time)
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- ===============================
-- TIMESCALEDB SPECIFIC FUNCTIONS
-- ===============================

-- Function to create continuous aggregates for monitor metrics
CREATE OR REPLACE FUNCTION create_monitor_continuous_aggregates()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create daily aggregate view
    EXECUTE '
    CREATE MATERIALIZED VIEW IF NOT EXISTS daily_monitor_status
    WITH (timescaledb.continuous) AS
    SELECT 
        monitor_id,
        time_bucket(''1 day'', check_time) AS day,
        count(*) AS total_checks,
        count(*) FILTER (WHERE status = ''up'') AS successful_checks,
        min(response_time_ms) AS min_response_time,
        avg(response_time_ms)::integer AS avg_response_time,
        max(response_time_ms) AS max_response_time
    FROM public.monitor_metrics
    GROUP BY monitor_id, time_bucket(''1 day'', check_time);
    ';

    -- Create hourly aggregate view
    EXECUTE '
    CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_monitor_status
    WITH (timescaledb.continuous) AS
    SELECT 
        monitor_id,
        time_bucket(''1 hour'', check_time) AS hour,
        count(*) AS total_checks,
        count(*) FILTER (WHERE status = ''up'') AS successful_checks,
        min(response_time_ms) AS min_response_time,
        avg(response_time_ms)::integer AS avg_response_time,
        max(response_time_ms) AS max_response_time
    FROM public.monitor_metrics
    GROUP BY monitor_id, time_bucket(''1 hour'', check_time);
    ';

    -- Set refresh policies (refresh every 1 hour for hourly data, every 1 day for daily data)
    EXECUTE '
    SELECT add_continuous_aggregate_policy(''hourly_monitor_status'',
        start_offset => ''2 days''::interval,
        end_offset => ''1 hour''::interval,
        schedule_interval => ''1 hour''::interval);
    ';

    EXECUTE '
    SELECT add_continuous_aggregate_policy(''daily_monitor_status'',
        start_offset => ''30 days''::interval,
        end_offset => ''1 day''::interval,
        schedule_interval => ''1 day''::interval);
    ';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating continuous aggregates: %', SQLERRM;
        -- Continue without failing the whole function
END;
$$;

-- Function to set up compression policy for monitor metrics
CREATE OR REPLACE FUNCTION setup_monitor_metrics_compression(
    p_compress_after INTERVAL DEFAULT INTERVAL '7 days',
    p_compression_job_interval INTERVAL DEFAULT INTERVAL '1 day'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Enable compression on the hypertable
    EXECUTE '
    ALTER TABLE monitor_metrics SET (
        timescaledb.compress,
        timescaledb.compress_orderby = ''check_time DESC'',
        timescaledb.compress_segmentby = ''monitor_id, status''
    );
    ';

    -- Add compression policy
    EXECUTE FORMAT('
    SELECT add_compression_policy(
        ''monitor_metrics'', 
        compress_after => INTERVAL ''%s'',
        scheduled_interval => INTERVAL ''%s''
    );
    ', p_compress_after, p_compression_job_interval);
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error setting up compression: %', SQLERRM;
        -- Continue without failing the whole function
END;
$$;

-- ===============================
-- MONITOR GROUP FUNCTIONS
-- ===============================

-- Create monitor groups table (for organizing monitors)
CREATE TABLE IF NOT EXISTS public.monitor_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#4f46e5',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS set_monitor_groups_timestamp ON public.monitor_groups;
CREATE TRIGGER set_monitor_groups_timestamp
    BEFORE UPDATE ON public.monitor_groups
    FOR EACH ROW
    EXECUTE FUNCTION basejump.trigger_set_timestamps();

-- Enable RLS on monitor groups
ALTER TABLE monitor_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for monitor groups
CREATE POLICY monitor_groups_select_policy ON monitor_groups
    FOR SELECT
    USING (account_id IN (
        SELECT account_id FROM basejump.account_user WHERE user_id = auth.uid()
    ));

CREATE POLICY monitor_groups_insert_policy ON monitor_groups
    FOR INSERT
    WITH CHECK (account_id IN (
        SELECT account_id FROM basejump.account_user WHERE user_id = auth.uid()
    ));

CREATE POLICY monitor_groups_update_policy ON monitor_groups
    FOR UPDATE
    USING (account_id IN (
        SELECT account_id FROM basejump.account_user WHERE user_id = auth.uid()
    ));

CREATE POLICY monitor_groups_delete_policy ON monitor_groups
    FOR DELETE
    USING (account_id IN (
        SELECT account_id FROM basejump.account_user WHERE user_id = auth.uid()
    ));

-- CRUD functions for monitor groups

-- Function to create a monitor group
CREATE OR REPLACE FUNCTION create_monitor_group(
    p_account_id UUID,
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_icon TEXT DEFAULT NULL,
    p_color TEXT DEFAULT '#4f46e5'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_group_id UUID;
BEGIN
    -- Verify user has access to account
    IF NOT EXISTS(
        SELECT 1 FROM basejump.account_user 
        WHERE account_id = p_account_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You must be a member of the account to create a monitor group';
    END IF;

    -- Insert the new group
    INSERT INTO monitor_groups (
        account_id,
        name,
        description,
        icon,
        color
    )
    VALUES (
        p_account_id,
        p_name,
        p_description,
        p_icon,
        p_color
    )
    RETURNING id INTO new_group_id;

    RETURN new_group_id;
END;
$$;

-- Function to update a monitor group
CREATE OR REPLACE FUNCTION update_monitor_group(
    p_group_id UUID,
    p_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_icon TEXT DEFAULT NULL,
    p_color TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    group_account_id UUID;
BEGIN
    -- Get the account ID for the group
    SELECT account_id INTO group_account_id
    FROM monitor_groups
    WHERE id = p_group_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Monitor group not found';
    END IF;
    
    -- Verify user has access to the group's account
    IF NOT EXISTS(
        SELECT 1 FROM basejump.account_user 
        WHERE account_id = group_account_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You do not have access to update this monitor group';
    END IF;

    -- Update the group with non-null values
    UPDATE monitor_groups
    SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        icon = COALESCE(p_icon, icon),
        color = COALESCE(p_color, color)
    WHERE id = p_group_id;
    
    RETURN TRUE;
END;
$$;

-- Function to delete a monitor group
CREATE OR REPLACE FUNCTION delete_monitor_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    group_account_id UUID;
BEGIN
    -- Get the account ID for the group
    SELECT account_id INTO group_account_id
    FROM monitor_groups
    WHERE id = p_group_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Monitor group not found';
    END IF;
    
    -- Verify user has access to the group's account
    IF NOT EXISTS(
        SELECT 1 FROM basejump.account_user 
        WHERE account_id = group_account_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You do not have access to delete this monitor group';
    END IF;

    -- Remove group association from monitors
    UPDATE monitors
    SET group_id = NULL
    WHERE group_id = p_group_id;

    -- Delete the group
    DELETE FROM monitor_groups
    WHERE id = p_group_id;
    
    RETURN TRUE;
END;
$$;

-- Function to associate a monitor with a group
CREATE OR REPLACE FUNCTION set_monitor_group(
    p_monitor_id UUID,
    p_group_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    monitor_account_id UUID;
    group_account_id UUID;
BEGIN
    -- Get the account IDs for the monitor and group
    SELECT account_id INTO monitor_account_id
    FROM monitors
    WHERE id = p_monitor_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Monitor not found';
    END IF;
    
    -- If group_id is NULL, just remove the association
    IF p_group_id IS NULL THEN
        UPDATE monitors
        SET group_id = NULL
        WHERE id = p_monitor_id;
        
        RETURN TRUE;
    END IF;
    
    -- Get group account ID
    SELECT account_id INTO group_account_id
    FROM monitor_groups
    WHERE id = p_group_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Monitor group not found';
    END IF;
    
    -- Verify both are in the same account
    IF monitor_account_id != group_account_id THEN
        RAISE EXCEPTION 'Monitor and group must belong to the same account';
    END IF;
    
    -- Verify user has access to the account
    IF NOT EXISTS(
        SELECT 1 FROM basejump.account_user 
        WHERE account_id = monitor_account_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You do not have access to update this monitor';
    END IF;

    -- Update the monitor's group
    UPDATE monitors
    SET group_id = p_group_id
    WHERE id = p_monitor_id;
    
    RETURN TRUE;
END;
$$;

-- ===============================
-- GRANT FUNCTION ACCESS
-- ===============================

-- CRUD operations
GRANT EXECUTE ON FUNCTION validate_monitor_config(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_monitor(UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT[], TEXT, BOOLEAN, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monitor(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monitors(UUID, INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monitors_to_check(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_monitor(UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT[], TEXT, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_monitor_maintenance(UUID, BOOLEAN, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_monitor_active(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_monitor(UUID) TO authenticated;

-- Metrics and analytics
GRANT EXECUTE ON FUNCTION record_monitor_check(UUID, TEXT, INTEGER, TEXT, INTEGER, INTEGER, INTEGER, DECIMAL, INTEGER, INTEGER, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION is_monitor_in_maintenance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monitor_uptime(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monitor_response_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monitor_metrics(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_monitor_stats(UUID) TO authenticated;

-- TimescaleDB functions
GRANT EXECUTE ON FUNCTION create_monitor_continuous_aggregates() TO authenticated;
GRANT EXECUTE ON FUNCTION setup_monitor_metrics_compression(INTERVAL, INTERVAL) TO authenticated;

-- Group functions
GRANT EXECUTE ON FUNCTION create_monitor_group(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_monitor_group(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_monitor_group(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_monitor_group(UUID, UUID) TO authenticated;

-- Grant access to tables
GRANT SELECT, INSERT, UPDATE, DELETE ON monitor_groups TO authenticated;