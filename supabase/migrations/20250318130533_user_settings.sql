-- Create enum for theme preference
CREATE TYPE theme_preference AS ENUM ('light', 'dark', 'system');

-- Create enum for timezone preference
CREATE TYPE timezone_preference AS ENUM (
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Australia/Sydney'
);

-- Create user settings table
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme theme_preference NOT NULL DEFAULT 'system',
    timezone timezone_preference NOT NULL DEFAULT 'UTC',
    date_format TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    time_format TEXT NOT NULL DEFAULT 'HH:mm:ss',
    default_dashboard_view TEXT NOT NULL DEFAULT 'overview',
    dashboard_refresh_interval INTEGER NOT NULL DEFAULT 60, -- in seconds
    email_digest_enabled BOOLEAN NOT NULL DEFAULT true,
    email_digest_frequency TEXT NOT NULL DEFAULT 'daily',
    mobile_number TEXT, -- For SMS notifications
    telegram_username TEXT,
    webhook_secret TEXT,
    api_key_enabled BOOLEAN NOT NULL DEFAULT false,
    api_key TEXT UNIQUE,
    api_key_created_at TIMESTAMPTZ,
    api_key_last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_date_format CHECK (date_format ~ '^[YMDHms\-/: ]+$'),
    CONSTRAINT valid_time_format CHECK (time_format ~ '^[YMDHms\-/: ]+$'),
    CONSTRAINT valid_digest_frequency CHECK (email_digest_frequency IN ('daily', 'weekly', 'monthly')),
    CONSTRAINT valid_mobile_number CHECK (
        mobile_number IS NULL OR 
        mobile_number ~ '^\+[1-9]\d{1,14}$'
    )
);

-- Create user limits table
CREATE TABLE user_limits (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    max_monitors INTEGER NOT NULL DEFAULT 10,
    max_checks_per_day INTEGER NOT NULL DEFAULT 1000,
    max_alert_configs_per_monitor INTEGER NOT NULL DEFAULT 5,
    max_notification_channels INTEGER NOT NULL DEFAULT 3,
    retention_days INTEGER NOT NULL DEFAULT 30,
    api_rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user usage stats table
CREATE TABLE user_usage_stats (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_checks INTEGER NOT NULL DEFAULT 0,
    total_alerts_triggered INTEGER NOT NULL DEFAULT 0,
    total_notifications_sent INTEGER NOT NULL DEFAULT 0,
    api_calls INTEGER NOT NULL DEFAULT 0,
    data_transfer_bytes BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, date)
);

-- Add RLS policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_stats ENABLE ROW LEVEL SECURITY;

-- User settings policies
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- User limits policies
CREATE POLICY "Users can view their own limits" ON user_limits
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only allow system to update limits
CREATE POLICY "System can manage user limits" ON user_limits
    FOR ALL
    USING (false)
    WITH CHECK (false);

-- User usage stats policies
CREATE POLICY "Users can view their own usage stats" ON user_usage_stats
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only allow system to update usage stats
CREATE POLICY "System can manage usage stats" ON user_usage_stats
    FOR ALL
    USING (false)
    WITH CHECK (false);

-- Create indexes
CREATE INDEX user_usage_stats_date_idx ON user_usage_stats(date);

-- Add updated_at triggers
CREATE TRIGGER set_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_user_limits_updated_at
    BEFORE UPDATE ON user_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate API key
CREATE OR REPLACE FUNCTION generate_api_key() RETURNS TEXT
    LANGUAGE plpgsql
    AS $$
DECLARE
    key TEXT;
BEGIN
    key := encode(gen_random_bytes(32), 'hex');
    RETURN concat('mk_', key);
END;
$$;

-- Create function to automatically create user settings and limits on user creation
CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
BEGIN
    -- Create default user settings
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id);
    
    -- Create default user limits
    INSERT INTO user_limits (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$;

-- Create trigger to handle new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
