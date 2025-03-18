-- Create enum for alert severity levels
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

-- Create enum for alert status
CREATE TYPE alert_status AS ENUM ('triggered', 'acknowledged', 'resolved');

-- Create enum for alert conditions
CREATE TYPE alert_condition AS ENUM (
    'status_code', -- HTTP status code doesn't match expected
    'latency', -- Response time exceeds threshold
    'availability', -- Availability drops below threshold
    'ssl_expiry', -- SSL certificate expiring soon
    'keyword', -- Response doesn't contain expected keyword
    'pattern' -- Response doesn't match expected pattern
);

-- Create alert configurations table
CREATE TABLE alert_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    condition alert_condition NOT NULL,
    threshold JSONB NOT NULL, -- Flexible threshold configuration (e.g., {"min": 200, "max": 299} for status codes)
    severity alert_severity NOT NULL DEFAULT 'warning',
    enabled BOOLEAN NOT NULL DEFAULT true,
    consecutive_count INTEGER NOT NULL DEFAULT 1, -- Number of consecutive failures before alerting
    cooldown_minutes INTEGER NOT NULL DEFAULT 15, -- Minimum time between repeated alerts
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_threshold CHECK (jsonb_typeof(threshold) = 'object')
);

-- Create alert history table
CREATE TABLE alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES alert_configs(id) ON DELETE CASCADE,
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    status alert_status NOT NULL DEFAULT 'triggered',
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id),
    details JSONB NOT NULL DEFAULT '{}'::JSONB, -- Alert-specific details
    notification_sent BOOLEAN NOT NULL DEFAULT false
);

-- Create notification preferences table
CREATE TABLE notification_preferences (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    monitor_id UUID REFERENCES monitors(id) ON DELETE CASCADE,
    email BOOLEAN NOT NULL DEFAULT true,
    sms BOOLEAN NOT NULL DEFAULT false,
    webhook_url TEXT,
    slack_webhook_url TEXT,
    telegram_chat_id TEXT,
    severity_filter alert_severity[] DEFAULT ARRAY['warning', 'critical']::alert_severity[],
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, monitor_id)
);

-- Add RLS policies
ALTER TABLE alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Alert configs policies
CREATE POLICY "Users can view their own alert configs" ON alert_configs
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM monitors
        WHERE monitors.id = alert_configs.monitor_id
        AND monitors.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own alert configs" ON alert_configs
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM monitors
        WHERE monitors.id = alert_configs.monitor_id
        AND monitors.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM monitors
        WHERE monitors.id = alert_configs.monitor_id
        AND monitors.user_id = auth.uid()
    ));

-- Alert history policies
CREATE POLICY "Users can view their own alert history" ON alert_history
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM monitors
        WHERE monitors.id = alert_history.monitor_id
        AND monitors.user_id = auth.uid()
    ));

CREATE POLICY "Users can acknowledge their own alerts" ON alert_history
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM monitors
        WHERE monitors.id = alert_history.monitor_id
        AND monitors.user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM monitors
        WHERE monitors.id = alert_history.monitor_id
        AND monitors.user_id = auth.uid()
    ));

-- Notification preferences policies
CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
    FOR ALL
    USING (
        user_id = auth.uid()
        AND (
            monitor_id IS NULL 
            OR EXISTS (
                SELECT 1 FROM monitors
                WHERE monitors.id = notification_preferences.monitor_id
                AND monitors.user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        AND (
            monitor_id IS NULL 
            OR EXISTS (
                SELECT 1 FROM monitors
                WHERE monitors.id = notification_preferences.monitor_id
                AND monitors.user_id = auth.uid()
            )
        )
    );

-- Create indexes
CREATE INDEX alert_configs_monitor_id_idx ON alert_configs(monitor_id);
CREATE INDEX alert_history_monitor_id_idx ON alert_history(monitor_id);
CREATE INDEX alert_history_config_id_idx ON alert_history(config_id);
CREATE INDEX alert_history_status_idx ON alert_history(status);
CREATE INDEX notification_prefs_user_monitor_idx ON notification_preferences(user_id, monitor_id);

-- Add updated_at triggers
CREATE TRIGGER set_alert_configs_updated_at
    BEFORE UPDATE ON alert_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
