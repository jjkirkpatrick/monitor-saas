-- Create an enum for monitor types
CREATE TYPE monitor_type AS ENUM ('http', 'tcp', 'ping', 'dns');
CREATE TYPE monitor_status AS ENUM ('active', 'paused', 'error');

-- Create monitors table
CREATE TABLE monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type monitor_type NOT NULL,
    target TEXT NOT NULL, -- URL, IP, hostname etc.
    interval INTEGER NOT NULL DEFAULT 60, -- Check interval in seconds
    timeout INTEGER NOT NULL DEFAULT 30, -- Timeout in seconds
    status monitor_status NOT NULL DEFAULT 'active',
    locations TEXT[] NOT NULL DEFAULT ARRAY['us-east']::TEXT[], -- Array of monitoring locations
    expected_status_codes INTEGER[] DEFAULT ARRAY[200], -- For HTTP monitors
    follow_redirects BOOLEAN DEFAULT true, -- For HTTP monitors
    verify_ssl BOOLEAN DEFAULT true, -- For HTTP monitors
    port INTEGER, -- For TCP/DNS monitors
    dns_record_type TEXT, -- For DNS monitors
    expected_response TEXT, -- Expected response content/pattern
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select only their own monitors
CREATE POLICY "Users can view their own monitors" ON monitors
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own monitors
CREATE POLICY "Users can create monitors" ON monitors
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own monitors
CREATE POLICY "Users can update their own monitors" ON monitors
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own monitors
CREATE POLICY "Users can delete their own monitors" ON monitors
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX monitors_user_id_idx ON monitors(user_id);
CREATE INDEX monitors_status_idx ON monitors(status);

-- Add updated_at trigger
CREATE TRIGGER set_monitors_updated_at
    BEFORE UPDATE ON monitors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
