-- ===============================
-- MONITORS - CORE TABLE
-- ===============================

-- Enable TimescaleDB extension for time series data management
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create the core monitors table with essential fields common to all monitor types
CREATE TABLE IF NOT EXISTS public.monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    monitor_type_id TEXT NOT NULL REFERENCES monitor_types(id),
    name TEXT NOT NULL,
    description TEXT,
    
    -- Status & operational fields
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'up', 'down', 'error', 'degraded', 'warning')),
    active BOOLEAN DEFAULT true,
    maintenance_mode BOOLEAN DEFAULT false,
    maintenance_until TIMESTAMPTZ, -- Optional end time for scheduled maintenance
    
    -- Alerting configuration
    alert_after_failures INTEGER DEFAULT 1 CHECK (alert_after_failures > 0),
    alert_recovery_threshold INTEGER DEFAULT 1 CHECK (alert_recovery_threshold > 0),
    alert_autoclose_minutes INTEGER DEFAULT 1440, -- Auto-close alerts after 24 hours by default
    
    -- Check frequency and timing
    interval_seconds INTEGER DEFAULT 300 CHECK (interval_seconds >= 60), -- Minimum 60 seconds
    timeout_seconds INTEGER DEFAULT 30 CHECK (timeout_seconds > 0),
    last_check_at TIMESTAMPTZ,
    next_check_at TIMESTAMPTZ,
    last_status_change_at TIMESTAMPTZ,
    
    -- Organization & filtering
    tags TEXT[],
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    labels JSONB DEFAULT '{}'::jsonb, -- For key-value pairs used for filtering
    
    -- Common fields for all monitors
    settings JSONB DEFAULT '{}'::jsonb, -- General settings like retry configuration, etc.
    configuration JSONB DEFAULT '{}'::jsonb, -- Type-specific configuration

    -- Display & visualization
    display_order INTEGER DEFAULT 0,
    group_id UUID, -- Optional reference to a monitor group
    
    -- Summary metrics (populated from time series data)
    last_response_time_ms INTEGER,  -- Most recent response time
    last_error TEXT,                -- Most recent error message
    consecutive_successes INTEGER DEFAULT 0,
    consecutive_failures INTEGER DEFAULT 0,
    
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS set_monitors_timestamp ON public.monitors;
CREATE TRIGGER set_monitors_timestamp
    BEFORE UPDATE ON public.monitors
    FOR EACH ROW
    EXECUTE FUNCTION basejump.trigger_set_timestamps();

-- Trigger to update next_check_at when a monitor is created or interval is updated
CREATE OR REPLACE FUNCTION update_next_check_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.next_check_at := COALESCE(NEW.last_check_at, now()) + 
                         (NEW.interval_seconds || ' seconds')::interval;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_next_check_at ON public.monitors;
CREATE TRIGGER trigger_update_next_check_at
    BEFORE INSERT OR UPDATE OF interval_seconds, last_check_at ON public.monitors
    FOR EACH ROW
    EXECUTE FUNCTION update_next_check_at();

-- ===============================
-- MONITOR TYPE EXTENSIONS
-- ===============================

-- Create extension tables for each monitor type with specialized fields

-- HTTP Monitor Extensions
CREATE TABLE IF NOT EXISTS public.monitor_http_extension (
    monitor_id UUID PRIMARY KEY REFERENCES public.monitors(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    method TEXT DEFAULT 'GET' CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS')),
    headers JSONB DEFAULT '{}'::jsonb,
    body TEXT,
    expected_status_code INTEGER DEFAULT 200,
    verify_ssl BOOLEAN DEFAULT true,
    follow_redirects BOOLEAN DEFAULT true,
    max_redirects INTEGER DEFAULT 5,
    content_match TEXT, -- String to match in response body
    content_match_mode TEXT DEFAULT 'contains' CHECK (content_match_mode IN ('contains', 'not_contains', 'regex', 'not_regex')),
    basic_auth_user TEXT,
    basic_auth_password TEXT,
    certificate_expiry_days INTEGER DEFAULT 30, -- Alert if SSL cert expires within X days
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ping Monitor Extensions
CREATE TABLE IF NOT EXISTS public.monitor_ping_extension (
    monitor_id UUID PRIMARY KEY REFERENCES public.monitors(id) ON DELETE CASCADE,
    host TEXT NOT NULL,
    packet_count INTEGER DEFAULT 4 CHECK (packet_count > 0),
    packet_size INTEGER DEFAULT 56 CHECK (packet_size > 0),
    max_latency_ms INTEGER DEFAULT 500,
    max_packet_loss_percent INTEGER DEFAULT 10 CHECK (max_packet_loss_percent BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TCP Port Monitor Extensions
CREATE TABLE IF NOT EXISTS public.monitor_port_extension (
    monitor_id UUID PRIMARY KEY REFERENCES public.monitors(id) ON DELETE CASCADE,
    host TEXT NOT NULL,
    port INTEGER NOT NULL CHECK (port BETWEEN 1 AND 65535),
    send_string TEXT, -- Optional string to send after connection
    expected_response TEXT, -- Optional expected response
    expect_string_match_mode TEXT DEFAULT 'contains' CHECK (expect_string_match_mode IN ('contains', 'not_contains', 'regex', 'not_regex')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DNS Monitor Extensions
CREATE TABLE IF NOT EXISTS public.monitor_dns_extension (
    monitor_id UUID PRIMARY KEY REFERENCES public.monitors(id) ON DELETE CASCADE,
    hostname TEXT NOT NULL,
    record_type TEXT NOT NULL CHECK (record_type IN ('A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'SRV')),
    nameserver TEXT, -- Optional specific nameserver to query
    expected_ip TEXT[], -- For A/AAAA records
    expected_value TEXT, -- For other record types
    check_propagation BOOLEAN DEFAULT false, -- Check across multiple nameservers
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add triggers for timestamp updates on extension tables
CREATE OR REPLACE FUNCTION create_extension_timestamp_triggers() RETURNS void AS $$
DECLARE
    tbl_name TEXT;
BEGIN
    FOR tbl_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' AND t.table_name LIKE 'monitor_%_extension'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_%s_timestamp ON public.%s;
            CREATE TRIGGER set_%s_timestamp
                BEFORE UPDATE ON public.%s
                FOR EACH ROW
                EXECUTE FUNCTION basejump.trigger_set_timestamps();
        ', tbl_name, tbl_name, tbl_name, tbl_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT create_extension_timestamp_triggers();

-- ===============================
-- METRICS AND TIME SERIES DATA
-- ===============================

-- Create extension for time series (TimescaleDB)
-- Note: This requires the TimescaleDB extension to be installed on the database
-- CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Monitor check results table for storing time series data
CREATE TABLE IF NOT EXISTS public.monitor_metrics (
    id UUID DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL REFERENCES public.monitors(id) ON DELETE CASCADE,
    check_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL, -- 'up', 'down', 'error', 'degraded', 'warning'
    response_time_ms INTEGER,
    error_message TEXT,
    http_status_code INTEGER, -- For HTTP monitors
    certificate_days_remaining INTEGER, -- For SSL checks
    dns_resolution_time_ms INTEGER, -- For DNS checks
    packet_loss_percent DECIMAL(5,2), -- For ping monitors
    latency_min_ms INTEGER,
    latency_avg_ms INTEGER,
    latency_max_ms INTEGER,
    metric_data JSONB, -- For monitor-type specific metrics
    PRIMARY KEY (id, check_time)
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('public.monitor_metrics', 'check_time');


-- -- Create continuous aggregates for common queries
-- CREATE MATERIALIZED VIEW daily_monitor_status 
-- WITH (timescaledb.continuous) AS
-- SELECT 
--     monitor_id,
--     time_bucket('1 day', check_time) AS day,
--     count(*) AS total_checks,
--     count(*) FILTER (WHERE status = 'up') AS successful_checks,
--     min(response_time_ms) AS min_response_time,
--     avg(response_time_ms)::integer AS avg_response_time,
--     max(response_time_ms) AS max_response_time
-- FROM public.monitor_metrics
-- GROUP BY monitor_id, time_bucket('1 day', check_time);

-- CREATE MATERIALIZED VIEW hourly_monitor_status 
-- WITH (timescaledb.continuous) AS
-- SELECT 
--     monitor_id,
--     time_bucket('1 hour', check_time) AS hour,
--     count(*) AS total_checks,
--     count(*) FILTER (WHERE status = 'up') AS successful_checks,
--     min(response_time_ms) AS min_response_time,
--     avg(response_time_ms)::integer AS avg_response_time,
--     max(response_time_ms) AS max_response_time
-- FROM public.monitor_metrics
-- GROUP BY monitor_id, time_bucket('1 hour', check_time);

-- Enable RLS on metrics table
ALTER TABLE monitor_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policy for metrics
CREATE POLICY monitor_metrics_select_policy ON monitor_metrics
    FOR SELECT
    USING (monitor_id IN (
        SELECT m.id 
        FROM monitors m
        JOIN basejump.account_user au ON au.account_id = m.account_id
        WHERE au.user_id = auth.uid()
    ));

-- Grant access to metrics table
GRANT SELECT, INSERT ON monitor_metrics TO authenticated;

-- ===============================
-- RLS POLICIES
-- ===============================

-- Enable RLS on monitors table
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;

-- Base policies for monitors table
DROP POLICY IF EXISTS monitors_select_policy ON monitors;
CREATE POLICY monitors_select_policy ON monitors
    FOR SELECT
    USING (account_id IN (
        SELECT account_id FROM basejump.account_user WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS monitors_insert_policy ON monitors;
CREATE POLICY monitors_insert_policy ON monitors
    FOR INSERT
    WITH CHECK (account_id IN (
        SELECT account_id FROM basejump.account_user WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS monitors_update_policy ON monitors;
CREATE POLICY monitors_update_policy ON monitors
    FOR UPDATE
    USING (account_id IN (
        SELECT account_id FROM basejump.account_user WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS monitors_delete_policy ON monitors;
CREATE POLICY monitors_delete_policy ON monitors
    FOR DELETE
    USING (account_id IN (
        SELECT account_id FROM basejump.account_user WHERE user_id = auth.uid()
    ));

-- Function to create RLS policies for all extension tables
CREATE OR REPLACE FUNCTION create_extension_rls_policies() RETURNS void AS $$
DECLARE
    tbl_name TEXT;
BEGIN
    FOR tbl_name IN 
        SELECT t.table_name 
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' AND t.table_name LIKE 'monitor_%_extension'
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY;', tbl_name);
        
        -- Select policy
        EXECUTE format('
            DROP POLICY IF EXISTS %s_select_policy ON %s;
            CREATE POLICY %s_select_policy ON %s
                FOR SELECT
                USING (monitor_id IN (
                    SELECT m.id 
                    FROM monitors m
                    JOIN basejump.account_user au ON au.account_id = m.account_id
                    WHERE au.user_id = auth.uid()
                ));
        ', tbl_name, tbl_name, tbl_name, tbl_name);
        
        -- Insert policy
        EXECUTE format('
            DROP POLICY IF EXISTS %s_insert_policy ON %s;
            CREATE POLICY %s_insert_policy ON %s
                FOR INSERT
                WITH CHECK (monitor_id IN (
                    SELECT m.id 
                    FROM monitors m
                    JOIN basejump.account_user au ON au.account_id = m.account_id
                    WHERE au.user_id = auth.uid()
                ));
        ', tbl_name, tbl_name, tbl_name, tbl_name);
        
        -- Update policy
        EXECUTE format('
            DROP POLICY IF EXISTS %s_update_policy ON %s;
            CREATE POLICY %s_update_policy ON %s
                FOR UPDATE
                USING (monitor_id IN (
                    SELECT m.id 
                    FROM monitors m
                    JOIN basejump.account_user au ON au.account_id = m.account_id
                    WHERE au.user_id = auth.uid()
                ));
        ', tbl_name, tbl_name, tbl_name, tbl_name);
        
        -- Delete policy
        EXECUTE format('
            DROP POLICY IF EXISTS %s_delete_policy ON %s;
            CREATE POLICY %s_delete_policy ON %s
                FOR DELETE
                USING (monitor_id IN (
                    SELECT m.id 
                    FROM monitors m
                    JOIN basejump.account_user au ON au.account_id = m.account_id
                    WHERE au.user_id = auth.uid()
                ));
        ', tbl_name, tbl_name, tbl_name, tbl_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT create_extension_rls_policies();

-- ===============================
-- INDEXES
-- ===============================

-- Core indexes for monitors table
CREATE INDEX IF NOT EXISTS idx_monitors_account_id ON monitors(account_id);
CREATE INDEX IF NOT EXISTS idx_monitors_status ON monitors(status);
CREATE INDEX IF NOT EXISTS idx_monitors_active ON monitors(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_monitors_next_check_at ON monitors(next_check_at) WHERE active = true AND maintenance_mode = false;
CREATE INDEX IF NOT EXISTS idx_monitors_type_id ON monitors(monitor_type_id);
CREATE INDEX IF NOT EXISTS idx_monitors_tags ON monitors USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_monitors_labels ON monitors USING gin(labels);
CREATE INDEX IF NOT EXISTS idx_monitors_group_id ON monitors(group_id);

-- Extension table indexes
CREATE INDEX IF NOT EXISTS idx_monitor_http_url ON monitor_http_extension(url);
CREATE INDEX IF NOT EXISTS idx_monitor_ping_host ON monitor_ping_extension(host);
CREATE INDEX IF NOT EXISTS idx_monitor_port_host_port ON monitor_port_extension(host, port);
CREATE INDEX IF NOT EXISTS idx_monitor_dns_hostname_type ON monitor_dns_extension(hostname, record_type);

-- Indexes for metrics table
CREATE INDEX IF NOT EXISTS idx_monitor_metrics_monitor_id ON monitor_metrics(monitor_id);
CREATE INDEX IF NOT EXISTS idx_monitor_metrics_status ON monitor_metrics(status);
-- The following index is created automatically by TimescaleDB
-- CREATE INDEX IF NOT EXISTS idx_monitor_metrics_check_time ON monitor_metrics(check_time DESC);

-- Additional compound index for common queries
CREATE INDEX IF NOT EXISTS idx_monitor_metrics_monitor_status ON monitor_metrics(monitor_id, status, check_time DESC);

-- ===============================
-- GRANTS
-- ===============================

-- Grant access to tables
GRANT SELECT, INSERT, UPDATE, DELETE ON monitors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monitor_http_extension TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monitor_ping_extension TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monitor_port_extension TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monitor_dns_extension TO authenticated;