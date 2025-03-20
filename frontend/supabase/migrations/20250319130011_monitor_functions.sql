-- Migration: 20250319140000_monitor_functions.sql
-- Creates functions for monitor CRUD operations and supporting functionality

-- ===============================
-- MONITOR CREATION FUNCTIONS
-- ===============================

-- Function to validate monitor configuration against the monitor type schema
CREATE OR REPLACE FUNCTION validate_monitor_config(
    p_monitor_type_id TEXT,
    p_configuration JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    schema JSONB;
    required_field TEXT;
BEGIN
    -- Get the schema for the monitor type
    SELECT configuration_schema INTO schema
    FROM monitor_types
    WHERE id = p_monitor_type_id;

    IF schema IS NULL THEN
        RAISE EXCEPTION 'Invalid monitor type: %', p_monitor_type_id;
    END IF;

    -- Check required fields
    FOR required_field IN SELECT jsonb_array_elements_text(schema->'required')
    LOOP
        IF p_configuration->required_field IS NULL THEN
            RAISE EXCEPTION 'Missing required field: %', required_field;
        END IF;
    END LOOP;

    -- Additional validation could be added here

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

-- Function to create a monitor with type-specific configuration
CREATE OR REPLACE FUNCTION create_monitor(
    p_account_id UUID,
    p_name TEXT,
    p_monitor_type_id TEXT,
    p_description TEXT DEFAULT NULL,
    p_interval_seconds INTEGER DEFAULT 300,
    p_timeout_seconds INTEGER DEFAULT 30,
    p_alert_after_failures INTEGER DEFAULT 1,
    p_alert_recovery_threshold INTEGER DEFAULT 1,
    p_alert_autoclose_minutes INTEGER DEFAULT 1440,
    p_tags TEXT[] DEFAULT NULL,
    p_severity TEXT DEFAULT 'medium',
    p_maintenance_mode BOOLEAN DEFAULT FALSE,
    p_configuration JSONB DEFAULT '{}'::JSONB,
    p_settings JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_monitor_id UUID;
    v_monitor_type_record RECORD;
BEGIN
    -- Verify user has access to account
    IF NOT EXISTS(
        SELECT 1 FROM basejump.account_user 
        WHERE account_id = p_account_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You must be a member of the account to create a monitor';
    END IF;

    -- Get monitor type details
    SELECT * INTO v_monitor_type_record 
    FROM monitor_types 
    WHERE id = p_monitor_type_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or inactive monitor type: %', p_monitor_type_id;
    END IF;

    -- Check if premium type is allowed
    IF v_monitor_type_record.is_premium = true THEN
        -- You could add premium account validation here
        -- For now, we'll allow it
    END IF;

    -- Validate configuration against schema
    PERFORM validate_monitor_config(p_monitor_type_id, p_configuration);

    -- Validate numeric inputs
    IF p_interval_seconds < 60 THEN
        RAISE EXCEPTION 'interval_seconds must be at least 60 seconds';
    END IF;

    IF p_timeout_seconds <= 0 THEN
        RAISE EXCEPTION 'timeout_seconds must be positive';
    END IF;

    IF p_alert_after_failures <= 0 THEN
        RAISE EXCEPTION 'alert_after_failures must be positive';
    END IF;

    -- Insert the new monitor
    INSERT INTO monitors (
        account_id,
        name,
        monitor_type_id,
        description,
        interval_seconds,
        timeout_seconds,
        alert_after_failures,
        alert_recovery_threshold,
        alert_autoclose_minutes,
        tags,
        severity,
        maintenance_mode,
        configuration,
        settings,
        created_at,
        updated_at
    )
    VALUES (
        p_account_id,
        p_name,
        p_monitor_type_id,
        p_description,
        p_interval_seconds,
        p_timeout_seconds,
        p_alert_after_failures,
        p_alert_recovery_threshold,
        p_alert_autoclose_minutes,
        p_tags,
        p_severity,
        p_maintenance_mode,
        p_configuration,
        p_settings,
        now(),
        now()
    )
    RETURNING id INTO new_monitor_id;

    -- Insert extension records based on monitor type
    CASE p_monitor_type_id
        WHEN 'http' THEN
            INSERT INTO monitor_http_extension (
                monitor_id,
                url,
                method,
                headers,
                body,
                expected_status_code,
                verify_ssl,
                follow_redirects,
                max_redirects,
                content_match,
                content_match_mode,
                basic_auth_user,
                basic_auth_password
            )
            VALUES (
                new_monitor_id,
                p_configuration->>'url',
                COALESCE(p_configuration->>'method', 'GET'),
                COALESCE((p_configuration->'headers')::JSONB, '{}'::JSONB),
                p_configuration->>'body',
                COALESCE((p_configuration->>'expectedStatusCode')::INTEGER, 200),
                COALESCE((p_configuration->>'verifySSL')::BOOLEAN, TRUE),
                COALESCE((p_configuration->>'followRedirects')::BOOLEAN, TRUE),
                COALESCE((p_configuration->>'maxRedirects')::INTEGER, 5),
                p_configuration->>'contentMatch',
                COALESCE(p_configuration->>'contentMatchMode', 'contains'),
                p_configuration->>'basicAuthUser',
                p_configuration->>'basicAuthPassword'
            );
            
        WHEN 'ping' THEN
            INSERT INTO monitor_ping_extension (
                monitor_id,
                host,
                packet_count,
                packet_size,
                max_latency_ms,
                max_packet_loss_percent
            )
            VALUES (
                new_monitor_id,
                p_configuration->>'host',
                COALESCE((p_configuration->>'packetCount')::INTEGER, 4),
                COALESCE((p_configuration->>'packetSize')::INTEGER, 56),
                COALESCE((p_configuration->>'maxLatencyMs')::INTEGER, 500),
                COALESCE((p_configuration->>'maxPacketLossPercent')::INTEGER, 10)
            );
            
        WHEN 'port' THEN
            INSERT INTO monitor_port_extension (
                monitor_id,
                host,
                port,
                send_string,
                expected_response,
                expect_string_match_mode
            )
            VALUES (
                new_monitor_id,
                p_configuration->>'host',
                (p_configuration->>'port')::INTEGER,
                p_configuration->>'sendString',
                p_configuration->>'expectedResponse',
                COALESCE(p_configuration->>'expectStringMatchMode', 'contains')
            );
            
        WHEN 'dns' THEN
            INSERT INTO monitor_dns_extension (
                monitor_id,
                hostname,
                record_type,
                nameserver,
                expected_ip,
                expected_value,
                check_propagation
            )
            VALUES (
                new_monitor_id,
                p_configuration->>'hostname',
                p_configuration->>'recordType',
                p_configuration->>'nameserver',
                CASE 
                    WHEN p_configuration->'expectedIp' IS NOT NULL 
                    THEN ARRAY(SELECT jsonb_array_elements_text(p_configuration->'expectedIp'))
                    ELSE NULL
                END,
                p_configuration->>'expectedValue',
                COALESCE((p_configuration->>'checkPropagation')::BOOLEAN, FALSE)
            );
        
        -- Add more WHEN clauses for other monitor types
        
    END CASE;

    RETURN new_monitor_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Re-raise the exception with additional context
        RAISE EXCEPTION 'Error creating monitor: %', SQLERRM;
END;
$$;

-- ===============================
-- MONITOR READ FUNCTIONS
-- ===============================

-- Function to get a single monitor with all its details
CREATE OR REPLACE FUNCTION get_monitor(p_monitor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    monitor_record RECORD;
    extension_data JSONB;
BEGIN
    -- Verify user has access to the monitor
    IF NOT EXISTS (
        SELECT 1 
        FROM monitors m
        JOIN basejump.account_user au ON au.account_id = m.account_id
        WHERE m.id = p_monitor_id AND au.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You do not have access to this monitor';
    END IF;

    -- Get basic monitor data
    SELECT 
        m.*,
        mt.name AS monitor_type_name,
        mt.icon AS monitor_type_icon
    INTO monitor_record
    FROM monitors m
    JOIN monitor_types mt ON m.monitor_type_id = mt.id
    WHERE m.id = p_monitor_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Get the extension data based on monitor type
    CASE monitor_record.monitor_type_id
        WHEN 'http' THEN
            SELECT to_jsonb(ext) INTO extension_data
            FROM monitor_http_extension ext
            WHERE ext.monitor_id = p_monitor_id;
            
        WHEN 'ping' THEN
            SELECT to_jsonb(ext) INTO extension_data
            FROM monitor_ping_extension ext
            WHERE ext.monitor_id = p_monitor_id;
            
        WHEN 'port' THEN
            SELECT to_jsonb(ext) INTO extension_data
            FROM monitor_port_extension ext
            WHERE ext.monitor_id = p_monitor_id;
            
        WHEN 'dns' THEN
            SELECT to_jsonb(ext) INTO extension_data
            FROM monitor_dns_extension ext
            WHERE ext.monitor_id = p_monitor_id;
            
        -- Add more WHEN clauses for other monitor types
        
        ELSE
            extension_data := '{}'::JSONB;
    END CASE;

    -- Build the complete result
    SELECT jsonb_build_object(
        'id', monitor_record.id,
        'account_id', monitor_record.account_id,
        'name', monitor_record.name,
        'description', monitor_record.description,
        'monitor_type_id', monitor_record.monitor_type_id,
        'monitor_type_name', monitor_record.monitor_type_name,
        'monitor_type_icon', monitor_record.monitor_type_icon,
        'status', monitor_record.status,
        'active', monitor_record.active,
        'maintenance_mode', monitor_record.maintenance_mode,
        'maintenance_until', monitor_record.maintenance_until,
        'interval_seconds', monitor_record.interval_seconds,
        'timeout_seconds', monitor_record.timeout_seconds,
        'alert_after_failures', monitor_record.alert_after_failures,
        'alert_recovery_threshold', monitor_record.alert_recovery_threshold,
        'alert_autoclose_minutes', monitor_record.alert_autoclose_minutes,
        'last_check_at', monitor_record.last_check_at,
        'next_check_at', monitor_record.next_check_at,
        'last_status_change_at', monitor_record.last_status_change_at,
        'tags', monitor_record.tags,
        'severity', monitor_record.severity,
        'labels', monitor_record.labels,
        'settings', monitor_record.settings,
        'configuration', monitor_record.configuration,
        'last_response_time_ms', monitor_record.last_response_time_ms,
        'last_error', monitor_record.last_error,
        'consecutive_successes', monitor_record.consecutive_successes,
        'consecutive_failures', monitor_record.consecutive_failures,
        'created_at', monitor_record.created_at,
        'updated_at', monitor_record.updated_at,
        'extension', extension_data
    ) INTO result;

    RETURN result;
END;
$$;

-- Function to get monitors with pagination and filtering
CREATE OR REPLACE FUNCTION get_monitors(
    p_account_id UUID,
    p_page_size INTEGER DEFAULT 25,
    p_page_number INTEGER DEFAULT 1,
    p_status TEXT DEFAULT NULL,
    p_monitor_type_id TEXT DEFAULT NULL,
    p_tag TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    monitors_data JSONB;
    total_count INTEGER;
    offset_val INTEGER;
BEGIN
    -- Verify user has access to account
    IF NOT EXISTS(
        SELECT 1 FROM basejump.account_user 
        WHERE account_id = p_account_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You must be a member of the account to view monitors';
    END IF;

    -- Calculate offset
    offset_val := (p_page_number - 1) * p_page_size;

    -- Get total count with filters
    EXECUTE 
        'SELECT COUNT(*)
         FROM monitors m
         JOIN monitor_types mt ON m.monitor_type_id = mt.id
         WHERE m.account_id = $1
         ' || 
         CASE WHEN p_status IS NOT NULL THEN 'AND m.status = $2 ' ELSE '' END ||
         CASE WHEN p_monitor_type_id IS NOT NULL THEN 'AND m.monitor_type_id = $3 ' ELSE '' END ||
         CASE WHEN p_tag IS NOT NULL THEN 'AND $4 = ANY(m.tags) ' ELSE '' END ||
         CASE WHEN p_search IS NOT NULL THEN 'AND (m.name ILIKE $5 OR m.description ILIKE $5) ' ELSE '' END
    INTO total_count
    USING 
        p_account_id,
        p_status,
        p_monitor_type_id,
        p_tag,
        CASE WHEN p_search IS NOT NULL THEN '%' || p_search || '%' ELSE NULL END;

    -- Get monitors with pagination
    EXECUTE 
        'SELECT jsonb_agg(jsonb_build_object(
            ''id'', m.id,
            ''name'', m.name,
            ''description'', m.description,
            ''monitor_type_id'', m.monitor_type_id,
            ''monitor_type_name'', mt.name,
            ''monitor_type_icon'', mt.icon,
            ''status'', m.status,
            ''active'', m.active,
            ''maintenance_mode'', m.maintenance_mode,
            ''last_check_at'', m.last_check_at,
            ''next_check_at'', m.next_check_at,
            ''tags'', m.tags,
            ''severity'', m.severity,
            ''last_response_time_ms'', m.last_response_time_ms,
            ''last_error'', m.last_error,
            ''created_at'', m.created_at
         ))
         FROM monitors m
         JOIN monitor_types mt ON m.monitor_type_id = mt.id
         WHERE m.account_id = $1
         ' || 
         CASE WHEN p_status IS NOT NULL THEN 'AND m.status = $2 ' ELSE '' END ||
         CASE WHEN p_monitor_type_id IS NOT NULL THEN 'AND m.monitor_type_id = $3 ' ELSE '' END ||
         CASE WHEN p_tag IS NOT NULL THEN 'AND $4 = ANY(m.tags) ' ELSE '' END ||
         CASE WHEN p_search IS NOT NULL THEN 'AND (m.name ILIKE $5 OR m.description ILIKE $5) ' ELSE '' END ||
         'ORDER BY m.created_at DESC
          LIMIT $6 OFFSET $7'
    INTO monitors_data
    USING 
        p_account_id,
        p_status,
        p_monitor_type_id,
        p_tag,
        CASE WHEN p_search IS NOT NULL THEN '%' || p_search || '%' ELSE NULL END,
        p_page_size,
        offset_val;

    -- Build the complete result with pagination info
    SELECT jsonb_build_object(
        'monitors', COALESCE(monitors_data, '[]'::JSONB),
        'pagination', jsonb_build_object(
            'total_count', total_count,
            'total_pages', CEIL(total_count::FLOAT / p_page_size),
            'page_size', p_page_size,
            'page_number', p_page_number
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- Function to get monitors that need to be checked
CREATE OR REPLACE FUNCTION get_monitors_to_check(p_limit INTEGER DEFAULT 100)
RETURNS SETOF monitors
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM monitors m
    WHERE 
        m.active = true 
        AND m.maintenance_mode = false
        AND (
            m.next_check_at IS NULL 
            OR 
            m.next_check_at <= now()
        )
    ORDER BY m.next_check_at ASC NULLS FIRST
    LIMIT p_limit;
END;
$$;

-- ===============================
-- MONITOR UPDATE FUNCTIONS
-- ===============================

-- Function to update a monitor
CREATE OR REPLACE FUNCTION update_monitor(
    p_monitor_id UUID,
    p_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_interval_seconds INTEGER DEFAULT NULL,
    p_timeout_seconds INTEGER DEFAULT NULL,
    p_alert_after_failures INTEGER DEFAULT NULL,
    p_alert_recovery_threshold INTEGER DEFAULT NULL,
    p_alert_autoclose_minutes INTEGER DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_severity TEXT DEFAULT NULL,
    p_configuration JSONB DEFAULT NULL,
    p_settings JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    monitor_record RECORD;
    monitor_type_id TEXT;
    extension_table TEXT;
    update_query TEXT;
    result JSONB;
BEGIN
    -- Get the monitor details first
    SELECT * INTO monitor_record
    FROM monitors
    WHERE id = p_monitor_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Monitor not found';
    END IF;
    
    -- Verify user has access to the monitor's account
    IF NOT EXISTS(
        SELECT 1 FROM basejump.account_user 
        WHERE account_id = monitor_record.account_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You do not have access to update this monitor';
    END IF;

    monitor_type_id := monitor_record.monitor_type_id;

    -- Validate configuration if provided
    IF p_configuration IS NOT NULL THEN
        PERFORM validate_monitor_config(monitor_type_id, p_configuration);
    END IF;

    -- Validate numeric inputs if provided
    IF p_interval_seconds IS NOT NULL AND p_interval_seconds < 60 THEN
        RAISE EXCEPTION 'interval_seconds must be at least 60 seconds';
    END IF;

    IF p_timeout_seconds IS NOT NULL AND p_timeout_seconds <= 0 THEN
        RAISE EXCEPTION 'timeout_seconds must be positive';
    END IF;

    IF p_alert_after_failures IS NOT NULL AND p_alert_after_failures <= 0 THEN
        RAISE EXCEPTION 'alert_after_failures must be positive';
    END IF;

    -- Update the monitor with non-null values
    UPDATE monitors
    SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        interval_seconds = COALESCE(p_interval_seconds, interval_seconds),
        timeout_seconds = COALESCE(p_timeout_seconds, timeout_seconds),
        alert_after_failures = COALESCE(p_alert_after_failures, alert_after_failures),
        alert_recovery_threshold = COALESCE(p_alert_recovery_threshold, alert_recovery_threshold),
        alert_autoclose_minutes = COALESCE(p_alert_autoclose_minutes, alert_autoclose_minutes),
        tags = COALESCE(p_tags, tags),
        severity = COALESCE(p_severity, severity),
        configuration = COALESCE(p_configuration, configuration),
        settings = COALESCE(p_settings, settings),
        updated_at = now()
    WHERE id = p_monitor_id;

    -- Update extension table if configuration provided
    IF p_configuration IS NOT NULL THEN
        -- Determine extension table and update it
        CASE monitor_type_id
            WHEN 'http' THEN
                UPDATE monitor_http_extension
                SET
                    url = COALESCE(p_configuration->>'url', url),
                    method = COALESCE(p_configuration->>'method', method),
                    headers = COALESCE((p_configuration->'headers')::JSONB, headers),
                    body = COALESCE(p_configuration->>'body', body),
                    expected_status_code = COALESCE((p_configuration->>'expectedStatusCode')::INTEGER, expected_status_code),
                    verify_ssl = COALESCE((p_configuration->>'verifySSL')::BOOLEAN, verify_ssl),
                    follow_redirects = COALESCE((p_configuration->>'followRedirects')::BOOLEAN, follow_redirects),
                    max_redirects = COALESCE((p_configuration->>'maxRedirects')::INTEGER, max_redirects),
                    content_match = COALESCE(p_configuration->>'contentMatch', content_match),
                    content_match_mode = COALESCE(p_configuration->>'contentMatchMode', content_match_mode),
                    basic_auth_user = COALESCE(p_configuration->>'basicAuthUser', basic_auth_user),
                    basic_auth_password = COALESCE(p_configuration->>'basicAuthPassword', basic_auth_password)
                WHERE monitor_id = p_monitor_id;
                
            WHEN 'ping' THEN
                UPDATE monitor_ping_extension
                SET
                    host = COALESCE(p_configuration->>'host', host),
                    packet_count = COALESCE((p_configuration->>'packetCount')::INTEGER, packet_count),
                    packet_size = COALESCE((p_configuration->>'packetSize')::INTEGER, packet_size),
                    max_latency_ms = COALESCE((p_configuration->>'maxLatencyMs')::INTEGER, max_latency_ms),
                    max_packet_loss_percent = COALESCE((p_configuration->>'maxPacketLossPercent')::INTEGER, max_packet_loss_percent)
                WHERE monitor_id = p_monitor_id;
                
            WHEN 'port' THEN
                UPDATE monitor_port_extension
                SET
                    host = COALESCE(p_configuration->>'host', host),
                    port = COALESCE((p_configuration->>'port')::INTEGER, port),
                    send_string = COALESCE(p_configuration->>'sendString', send_string),
                    expected_response = COALESCE(p_configuration->>'expectedResponse', expected_response),
                    expect_string_match_mode = COALESCE(p_configuration->>'expectStringMatchMode', expect_string_match_mode)
                WHERE monitor_id = p_monitor_id;
                
            WHEN 'dns' THEN
                UPDATE monitor_dns_extension
                SET
                    hostname = COALESCE(p_configuration->>'hostname', hostname),
                    record_type = COALESCE(p_configuration->>'recordType', record_type),
                    nameserver = COALESCE(p_configuration->>'nameserver', nameserver),
                    expected_ip = CASE 
                        WHEN p_configuration->'expectedIp' IS NOT NULL 
                        THEN ARRAY(SELECT jsonb_array_elements_text(p_configuration->'expectedIp'))
                        ELSE expected_ip
                    END,
                    expected_value = COALESCE(p_configuration->>'expectedValue', expected_value),
                    check_propagation = COALESCE((p_configuration->>'checkPropagation')::BOOLEAN, check_propagation)
                WHERE monitor_id = p_monitor_id;
                
            -- Add more WHEN clauses for other monitor types
            
        END CASE;
    END IF;

    -- Return the updated monitor
    SELECT get_monitor(p_monitor_id) INTO result;
    RETURN result;
END;
$$;

-- Function to toggle monitor maintenance mode
CREATE OR REPLACE FUNCTION toggle_monitor_maintenance(
    p_monitor_id UUID,
    p_maintenance_mode BOOLEAN,
    p_maintenance_until TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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
        RAISE EXCEPTION 'You do not have access to update this monitor';
    END IF;

    -- Update maintenance mode
    UPDATE monitors
    SET
        maintenance_mode = p_maintenance_mode,
        maintenance_until = p_maintenance_until,
        updated_at = now()
    WHERE id = p_monitor_id;
    
    RETURN TRUE;
END;
$$;

-- Function to toggle monitor active state
CREATE OR REPLACE FUNCTION toggle_monitor_active(
    p_monitor_id UUID,
    p_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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
        RAISE EXCEPTION 'You do not have access to update this monitor';
    END IF;

    -- Update active state
    UPDATE monitors
    SET
        active = p_active,
        updated_at = now()
    WHERE id = p_monitor_id;
    
    RETURN TRUE;
END;
$$;

-- ===============================
-- MONITOR DELETE FUNCTIONS
-- ===============================

-- Function to delete a monitor
CREATE OR REPLACE FUNCTION delete_monitor(p_monitor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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
        RAISE EXCEPTION 'You do not have access to delete this monitor';
    END IF;

    -- Delete the monitor (will cascade to extensions and metrics)
    DELETE FROM monitors
    WHERE id = p_monitor_id;
    
    RETURN TRUE;
END;
$$;

-- ===============================
-- MONITOR STATS FUNCTIONS
-- ===============================

-- Function to get monitor stats
CREATE OR REPLACE FUNCTION public.get_monitor_stats(p_account_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    monitor_limit INTEGER := 50; -- Default limit, could be dynamic based on subscription
    type_stats JSONB;
BEGIN
    -- Verify user has access to account
    IF NOT EXISTS(
        SELECT 1 FROM basejump.account_user 
        WHERE account_id = p_account_id AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You must be a member of the account to view monitor stats';
    END IF;

    -- Separate query for type stats to avoid nested aggregates
    WITH type_aggregates AS (
        SELECT 
            mt.id AS monitor_type_id,
            mt.name AS monitor_type_name,
            COUNT(m.id) AS total_count,
            COUNT(*) FILTER (WHERE m.status = 'up' AND m.active = true AND m.maintenance_mode = false) AS up_count,
            COUNT(*) FILTER (WHERE m.status = 'down' AND m.active = true AND m.maintenance_mode = false) AS down_count
        FROM monitor_types mt
        LEFT JOIN monitors m ON m.monitor_type_id = mt.id AND m.account_id = p_account_id
        GROUP BY mt.id, mt.name
    )
    SELECT jsonb_object_agg(
        monitor_type_id, 
        jsonb_build_object(
            'name', monitor_type_name,
            'count', total_count,
            'up', up_count,
            'down', down_count
        )
    ) INTO type_stats
    FROM type_aggregates;

    -- Generate overall monitor stats
    SELECT jsonb_build_object(
        'total', COUNT(*),
        'active', COUNT(*) FILTER (WHERE active = true),
        'in_maintenance', COUNT(*) FILTER (WHERE maintenance_mode = true),
        'status_counts', jsonb_build_object(
            'up', COUNT(*) FILTER (WHERE status = 'up' AND active = true AND maintenance_mode = false),
            'down', COUNT(*) FILTER (WHERE status = 'down' AND active = true AND maintenance_mode = false),
            'degraded', COUNT(*) FILTER (WHERE status = 'degraded' AND active = true AND maintenance_mode = false),
            'warning', COUNT(*) FILTER (WHERE status = 'warning' AND active = true AND maintenance_mode = false),
            'error', COUNT(*) FILTER (WHERE status = 'error' AND active = true AND maintenance_mode = false),
            'pending', COUNT(*) FILTER (WHERE status = 'pending' AND active = true AND maintenance_mode = false)
        ),
        'by_type', type_stats,
        'limits', jsonb_build_object(
            'monitor_limit', monitor_limit,
            'monitors_available', monitor_limit - COUNT(*)
        )
    ) INTO result
    FROM monitors
    WHERE account_id = p_account_id;

    RETURN result;
END;
$$;

-- Function to get paginated list of monitors with minimal information
CREATE OR REPLACE FUNCTION get_monitors_list(
    p_account_id UUID,
    p_page_size INTEGER DEFAULT 25,
    p_page_number INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    monitors_data JSONB;
    total_count INTEGER;
    offset_val INTEGER;
BEGIN
    -- Verify user has access to the account
    IF NOT EXISTS (
        SELECT 1 
        FROM basejump.account_user 
        WHERE account_id = p_account_id 
          AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You must be a member of the account to view monitors';
    END IF;

    -- Calculate the offset for pagination
    offset_val := (p_page_number - 1) * p_page_size;

    -- Retrieve the total count of monitors for the account
    SELECT COUNT(*)
      INTO total_count
      FROM monitors m
     WHERE m.account_id = p_account_id;

    -- Retrieve paginated monitor data, aggregating it as JSONB
    SELECT jsonb_agg(
             jsonb_build_object(
               'id', m.id,
               'name', m.name,
               'monitor_type_id', m.monitor_type_id,
               'status', m.status,
               'active', m.active,
               'maintenance_mode', m.maintenance_mode,
               'last_check_at', m.last_check_at,
               'severity', m.severity,
               'created_at', m.created_at
             )
             ORDER BY m.created_at DESC
           )
      INTO monitors_data
      FROM monitors m
     WHERE m.account_id = p_account_id
     LIMIT p_page_size
    OFFSET offset_val;

    -- Build and return the final JSONB result with pagination info
    result := jsonb_build_object(
        'monitors', COALESCE(monitors_data, '[]'::JSONB),
        'pagination', jsonb_build_object(
            'total_count', total_count,
            'total_pages', CEIL(total_count::FLOAT / p_page_size),
            'page_size', p_page_size,
            'page_number', p_page_number
        )
    );

    RETURN result;
END;
$$;

-- Ensure the function is accessible to authenticated users



-- Ensure the function is accessible to authenticated users
GRANT EXECUTE ON FUNCTION public.get_monitor_stats(UUID) TO authenticated;

--