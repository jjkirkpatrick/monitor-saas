-- Migration: 20250320000000_create_monitor_types.sql

-- ===============================
-- MONITOR TYPE CATEGORIES
-- ===============================

-- Create categories for organizing monitor types
CREATE TABLE public.monitor_type_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER set_monitor_type_categories_timestamp
    BEFORE UPDATE ON public.monitor_type_categories
    FOR EACH ROW
    EXECUTE FUNCTION basejump.trigger_set_timestamps();

-- Insert default categories
INSERT INTO public.monitor_type_categories (id, name, description, icon, display_order) VALUES
    ('web', 'Web & HTTP', 'Web applications, APIs, and HTTP services', 'Globe', 10),
    ('infrastructure', 'Infrastructure', 'Servers, network devices, and infrastructure services', 'Server', 20),
    ('database', 'Databases', 'Database servers and services', 'Database', 30),
    ('application', 'Applications', 'Application-specific monitoring', 'App', 40),
    ('custom', 'Custom', 'Custom and specialized monitoring types', 'Tool', 50);

-- ===============================
-- MONITOR TYPES
-- ===============================

-- Create monitor_types table
CREATE TABLE public.monitor_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT REFERENCES public.monitor_type_categories(id),
    icon TEXT, -- Icon identifier/name used in the UI
    icon_color TEXT DEFAULT '#4f46e5', -- Default indigo color for icons
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false, -- Is this a premium monitor type?
    configuration_schema JSONB, -- JSON Schema for type-specific configuration
    settings_schema JSONB, -- Schema for type-specific settings
    display_order INTEGER DEFAULT 0,
    required_permissions TEXT[], -- Any special permissions needed
    integration_id TEXT, -- For monitors that are part of a specific integration
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER set_monitor_types_timestamp
    BEFORE UPDATE ON public.monitor_types
    FOR EACH ROW
    EXECUTE FUNCTION basejump.trigger_set_timestamps();

-- Insert default monitor types
INSERT INTO public.monitor_types (id, name, description, category, icon, configuration_schema, display_order) 
VALUES
    ('http', 'HTTP/Website', 'Monitor websites and HTTP endpoints', 'web', 'Globe', jsonb_build_object(
        'type', 'object',
        'required', array['url'],
        'properties', jsonb_build_object(
            'url', jsonb_build_object('type', 'string', 'format', 'uri'),
            'method', jsonb_build_object('type', 'string', 'enum', array['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'OPTIONS'], 'default', 'GET'),
            'headers', jsonb_build_object('type', 'object'),
            'body', jsonb_build_object('type', 'string'),
            'expectedStatusCode', jsonb_build_object('type', 'integer', 'default', 200),
            'verifySSL', jsonb_build_object('type', 'boolean', 'default', true),
            'followRedirects', jsonb_build_object('type', 'boolean', 'default', true),
            'maxRedirects', jsonb_build_object('type', 'integer', 'default', 5),
            'timeout', jsonb_build_object('type', 'integer', 'default', 30),
            'contentMatch', jsonb_build_object('type', 'string'),
            'contentMatchMode', jsonb_build_object('type', 'string', 'enum', array['contains', 'not_contains', 'regex', 'not_regex'], 'default', 'contains'),
            'basicAuthUser', jsonb_build_object('type', 'string'),
            'basicAuthPassword', jsonb_build_object('type', 'string', 'format', 'password')
        )
    ), 10),
    
    ('ping', 'Ping', 'Monitor host availability using ICMP ping', 'infrastructure', 'Signal', jsonb_build_object(
        'type', 'object',
        'required', array['host'],
        'properties', jsonb_build_object(
            'host', jsonb_build_object('type', 'string'),
            'packetCount', jsonb_build_object('type', 'integer', 'minimum', 1, 'default', 4),
            'packetSize', jsonb_build_object('type', 'integer', 'default', 56),
            'maxLatencyMs', jsonb_build_object('type', 'integer', 'default', 500),
            'maxPacketLossPercent', jsonb_build_object('type', 'integer', 'minimum', 0, 'maximum', 100, 'default', 10)
        )
    ), 20),
    
    ('port', 'TCP Port', 'Monitor TCP port availability', 'infrastructure', 'Radio', jsonb_build_object(
        'type', 'object',
        'required', array['host', 'port'],
        'properties', jsonb_build_object(
            'host', jsonb_build_object('type', 'string'),
            'port', jsonb_build_object('type', 'integer', 'minimum', 1, 'maximum', 65535),
            'sendString', jsonb_build_object('type', 'string'),
            'expectedResponse', jsonb_build_object('type', 'string'),
            'expectStringMatchMode', jsonb_build_object('type', 'string', 'enum', array['contains', 'not_contains', 'regex', 'not_regex'], 'default', 'contains')
        )
    ), 30),
    
    ('dns', 'DNS', 'Monitor DNS records and resolution', 'infrastructure', 'Globe', jsonb_build_object(
        'type', 'object',
        'required', array['hostname', 'recordType'],
        'properties', jsonb_build_object(
            'hostname', jsonb_build_object('type', 'string'),
            'recordType', jsonb_build_object('type', 'string', 'enum', array['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'SRV']),
            'nameserver', jsonb_build_object('type', 'string'),
            'expectedIp', jsonb_build_object('type', 'array', 'items', jsonb_build_object('type', 'string')),
            'expectedValue', jsonb_build_object('type', 'string'),
            'checkPropagation', jsonb_build_object('type', 'boolean', 'default', false)
        )
    ), 40),
    
    ('ssl', 'SSL Certificate', 'Monitor SSL certificate validity and expiration', 'web', 'Shield', jsonb_build_object(
        'type', 'object',
        'required', array['host'],
        'properties', jsonb_build_object(
            'host', jsonb_build_object('type', 'string'),
            'port', jsonb_build_object('type', 'integer', 'default', 443),
            'expiryThresholdDays', jsonb_build_object('type', 'integer', 'default', 30),
            'verifyChain', jsonb_build_object('type', 'boolean', 'default', true),
            'checkRevocation', jsonb_build_object('type', 'boolean', 'default', false)
        )
    ), 50),
    
    ('heartbeat', 'Heartbeat', 'Monitor for inbound pings within expected intervals', 'application', 'Heart', jsonb_build_object(
        'type', 'object',
        'properties', jsonb_build_object(
            'expectedIntervalMinutes', jsonb_build_object('type', 'integer', 'minimum', 1, 'default', 15),
            'graceIntervalMinutes', jsonb_build_object('type', 'integer', 'minimum', 1, 'default', 5)
        )
    ), 60),
    
    ('keyword', 'Keyword Rank', 'Monitor search engine keyword rankings', 'web', 'Search', jsonb_build_object(
        'type', 'object',
        'required', array['keyword', 'domain'],
        'properties', jsonb_build_object(
            'keyword', jsonb_build_object('type', 'string'),
            'domain', jsonb_build_object('type', 'string'),
            'searchEngine', jsonb_build_object('type', 'string', 'enum', array['google', 'bing', 'yahoo'], 'default', 'google'),
            'monitorPositionUnder', jsonb_build_object('type', 'integer', 'default', 10),
            'alertIfAbovePosition', jsonb_build_object('type', 'integer', 'default', 20)
        )
    ), 70),
    
    ('api', 'API Performance', 'Monitor API performance and status', 'web', 'Activity', jsonb_build_object(
        'type', 'object',
        'required', array['endpoint'],
        'properties', jsonb_build_object(
            'endpoint', jsonb_build_object('type', 'string', 'format', 'uri'),
            'method', jsonb_build_object('type', 'string', 'enum', array['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], 'default', 'GET'),
            'headers', jsonb_build_object('type', 'object'),
            'body', jsonb_build_object('type', 'string'),
            'authentication', jsonb_build_object(
                'type', 'string', 
                'enum', array['none', 'basic', 'bearer', 'api_key'], 
                'default', 'none'
            ),
            'authDetails', jsonb_build_object('type', 'object'),
            'expectedResponseTime', jsonb_build_object('type', 'integer', 'default', 500),
            'validateJsonSchema', jsonb_build_object('type', 'boolean', 'default', false),
            'jsonSchema', jsonb_build_object('type', 'object')
        )
    ), 80),
    
    ('smtp', 'Email/SMTP', 'Monitor email servers', 'application', 'Mail', jsonb_build_object(
        'type', 'object',
        'required', array['host'],
        'properties', jsonb_build_object(
            'host', jsonb_build_object('type', 'string'),
            'port', jsonb_build_object('type', 'integer', 'default', 25),
            'useTls', jsonb_build_object('type', 'boolean', 'default', true),
            'username', jsonb_build_object('type', 'string'),
            'password', jsonb_build_object('type', 'string', 'format', 'password'),
            'testEmail', jsonb_build_object('type', 'boolean', 'default', false),
            'testEmailRecipient', jsonb_build_object('type', 'string', 'format', 'email')
        )
    ), 90),
    
    ('database', 'Database', 'Monitor database connectivity and performance', 'database', 'Database', jsonb_build_object(
        'type', 'object',
        'required', array['type', 'host'],
        'properties', jsonb_build_object(
            'type', jsonb_build_object('type', 'string', 'enum', array['postgresql', 'mysql', 'mariadb', 'mongodb', 'redis']),
            'host', jsonb_build_object('type', 'string'),
            'port', jsonb_build_object('type', 'integer'),
            'database', jsonb_build_object('type', 'string'),
            'username', jsonb_build_object('type', 'string'),
            'password', jsonb_build_object('type', 'string', 'format', 'password'),
            'query', jsonb_build_object('type', 'string'),
            'connectionTimeout', jsonb_build_object('type', 'integer', 'default', 10),
            'queryTimeout', jsonb_build_object('type', 'integer', 'default', 30)
        )
    ), 100);

-- ===============================
-- RLS POLICIES
-- ===============================

-- Enable RLS
ALTER TABLE public.monitor_type_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitor_types ENABLE ROW LEVEL SECURITY;

-- Read-only policy for monitor_type_categories for authenticated users
CREATE POLICY monitor_type_categories_select_policy ON public.monitor_type_categories
    FOR SELECT TO authenticated
    USING (true);

-- Read-only policy for monitor_types for authenticated users
CREATE POLICY monitor_types_select_policy ON public.monitor_types
    FOR SELECT TO authenticated
    USING (true);

-- ===============================
-- INDEXES
-- ===============================

CREATE INDEX IF NOT EXISTS idx_monitor_types_category ON public.monitor_types(category);
CREATE INDEX IF NOT EXISTS idx_monitor_types_active ON public.monitor_types(is_active) WHERE is_active = true;

-- ===============================
-- GRANTS
-- ===============================

-- Grant access to tables
GRANT SELECT ON public.monitor_type_categories TO authenticated;
GRANT SELECT ON public.monitor_types TO authenticated;

-- ===============================
-- FUNCTIONS
-- ===============================

-- Function to get all active monitor types
CREATE OR REPLACE FUNCTION public.get_monitor_types()
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    category TEXT,
    category_name TEXT,
    icon TEXT,
    icon_color TEXT,
    is_premium BOOLEAN,
    configuration_schema JSONB,
    settings_schema JSONB,
    display_order INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mt.id,
        mt.name,
        mt.description,
        mt.category,
        mtc.name AS category_name,
        mt.icon,
        mt.icon_color,
        mt.is_premium,
        mt.configuration_schema,
        mt.settings_schema,
        mt.display_order
    FROM monitor_types mt
    LEFT JOIN monitor_type_categories mtc ON mt.category = mtc.id
    WHERE mt.is_active = true
    ORDER BY mt.display_order, mt.name;
END;
$$;

-- Grant function access
GRANT EXECUTE ON FUNCTION public.get_monitor_types() TO authenticated;