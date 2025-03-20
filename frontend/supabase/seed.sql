-- Pre-seed monitor types
INSERT INTO monitor_types (id, name, description, icon, is_active, configuration_schema, settings_schema)
VALUES
    ('http', 'HTTP/Website', 'Monitor websites and HTTP endpoints', 'Globe', true, 
    jsonb_build_object(
        'type', 'object',
        'required', array['url'],
        'properties', jsonb_build_object(
            'url', jsonb_build_object('type', 'string', 'format', 'uri'),
            'method', jsonb_build_object('type', 'string', 'enum', array['GET', 'POST', 'HEAD'], 'default', 'GET'),
            'headers', jsonb_build_object('type', 'object'),
            'body', jsonb_build_object('type', 'string'),
            'expectedStatusCode', jsonb_build_object('type', 'integer', 'default', 200),
            'verifySSL', jsonb_build_object('type', 'boolean', 'default', true),
            'timeoutSeconds', jsonb_build_object('type', 'integer', 'default', 30)
        )
    ),
    jsonb_build_object(
        'type', 'object',
        'properties', jsonb_build_object(
            'sslMonitoring', jsonb_build_object('type', 'boolean', 'default', false),
            'domainExpirationMonitoring', jsonb_build_object('type', 'boolean', 'default', false)
        )
    )),
    
    ('ping', 'Ping', 'Monitor host availability using ICMP ping', 'Signal', true,
    jsonb_build_object(
        'type', 'object',
        'required', array['host'],
        'properties', jsonb_build_object(
            'host', jsonb_build_object('type', 'string'),
            'count', jsonb_build_object('type', 'integer', 'minimum', 1)
        )
    ),
    NULL),
    
    ('port', 'Port', 'Monitor TCP port availability', 'Radio', true,
    jsonb_build_object(
        'type', 'object',
        'required', array['host', 'port'],
        'properties', jsonb_build_object(
            'host', jsonb_build_object('type', 'string'),
            'port', jsonb_build_object('type', 'integer', 'minimum', 1, 'maximum', 65535)
        )
    ),
    NULL)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    is_active = EXCLUDED.is_active,
    configuration_schema = EXCLUDED.configuration_schema,
    settings_schema = EXCLUDED.settings_schema;