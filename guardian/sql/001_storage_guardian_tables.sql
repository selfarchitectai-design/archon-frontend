-- ============================================
-- ARCHON Storage Guardian - Migration 001
-- Tables for metrics, cleanup logs, and feature flags
-- ============================================

-- 1. Storage Metrics Snapshots
CREATE TABLE IF NOT EXISTS archon_storage_metrics (
    id SERIAL PRIMARY KEY,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Disk Overall
    disk_total_bytes BIGINT,
    disk_used_bytes BIGINT,
    disk_available_bytes BIGINT,
    disk_used_percent DECIMAL(5,2),
    
    -- By Component (JSONB for flexibility)
    component_breakdown JSONB DEFAULT '{}',
    -- Expected structure:
    -- {
    --   "docker": {"images": 0, "volumes": 0, "cache": 0, "total": 0},
    --   "postgres": {"total": 0, "tables": {"events": 0, "n8n": 0}},
    --   "logs": {"app": 0, "system": 0, "nginx": 0, "total": 0},
    --   "n8n": {"data": 0, "executions": 0},
    --   "vector": {"items": 0, "embeddings": 0, "index": 0}
    -- }
    
    -- Growth Metrics
    growth_bytes_24h BIGINT DEFAULT 0,
    growth_bytes_7d_avg BIGINT DEFAULT 0,
    days_to_70_percent INTEGER,
    days_to_80_percent INTEGER,
    days_to_90_percent INTEGER
);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_storage_metrics_recorded_at 
ON archon_storage_metrics(recorded_at DESC);

-- 2. Cleanup Action Logs
CREATE TABLE IF NOT EXISTS archon_cleanup_logs (
    id SERIAL PRIMARY KEY,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Action Details
    action_name VARCHAR(100) NOT NULL,
    action_tier INTEGER NOT NULL CHECK (action_tier IN (0, 1, 2)),
    action_type VARCHAR(50) NOT NULL, -- auto, approved, manual
    
    -- Results
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, running, success, failed, skipped
    bytes_freed BIGINT DEFAULT 0,
    duration_ms INTEGER,
    
    -- Context
    trigger_reason VARCHAR(255), -- threshold, scheduled, manual, emergency
    disk_before_percent DECIMAL(5,2),
    disk_after_percent DECIMAL(5,2),
    
    -- Error Handling
    error_message TEXT,
    
    -- Audit
    approved_by VARCHAR(100), -- NULL for auto actions
    metadata JSONB DEFAULT '{}'
);

-- Index for reporting
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_executed_at 
ON archon_cleanup_logs(executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_cleanup_logs_action_tier 
ON archon_cleanup_logs(action_tier);

-- 3. Feature Flags (for Vector Memory control)
CREATE TABLE IF NOT EXISTS archon_feature_flags (
    flag_name VARCHAR(100) PRIMARY KEY,
    enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(100),
    description TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Insert default flags (all OFF)
INSERT INTO archon_feature_flags (flag_name, enabled, description) VALUES
    ('vector_enabled', FALSE, 'Master switch for vector memory layer'),
    ('vector_write_enabled', FALSE, 'Allow writing to vector memory'),
    ('vector_search_enabled', FALSE, 'Allow searching vector memory'),
    ('auto_cleanup_tier2', TRUE, 'Auto-run Tier-2 cleanup actions'),
    ('auto_cleanup_emergency', TRUE, 'Auto-run emergency cleanup at 90%+'),
    ('storage_alerts_enabled', TRUE, 'Send storage alerts to Slack')
ON CONFLICT (flag_name) DO NOTHING;

-- 4. Alert History
CREATE TABLE IF NOT EXISTS archon_alerts (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    alert_type VARCHAR(50) NOT NULL, -- disk_warning, disk_critical, disk_emergency, growth_high
    severity VARCHAR(20) NOT NULL, -- info, warning, critical, emergency
    
    message TEXT NOT NULL,
    metric_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    
    -- Delivery
    channels_notified TEXT[], -- ['slack', 'email']
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by VARCHAR(100),
    
    -- Cooldown tracking
    alert_fingerprint VARCHAR(64), -- For dedup/cooldown
    
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at 
ON archon_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_fingerprint 
ON archon_alerts(alert_fingerprint);

-- 5. Retention Policies Configuration
CREATE TABLE IF NOT EXISTS archon_retention_policies (
    id SERIAL PRIMARY KEY,
    resource_name VARCHAR(100) UNIQUE NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- logs, metrics, executions, events
    protection_tier INTEGER NOT NULL CHECK (protection_tier IN (0, 1, 2)),
    
    -- Retention Settings
    full_retention_days INTEGER,
    archive_retention_days INTEGER,
    
    -- Actions
    auto_action VARCHAR(50), -- rotate, compress, archive, delete, downsample
    requires_approval BOOLEAN DEFAULT FALSE,
    archive_destination VARCHAR(255), -- s3://bucket/path
    
    -- Status
    enabled BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMP WITH TIME ZONE,
    
    metadata JSONB DEFAULT '{}'
);

-- Insert default policies
INSERT INTO archon_retention_policies 
(resource_name, resource_type, protection_tier, full_retention_days, archive_retention_days, auto_action, requires_approval) 
VALUES
    -- Tier 2 (Auto)
    ('docker_images', 'docker', 2, 1, NULL, 'prune', FALSE),
    ('docker_cache', 'docker', 2, 1, NULL, 'prune', FALSE),
    ('journald', 'logs', 2, 7, NULL, 'vacuum', FALSE),
    ('tmp_files', 'system', 2, 7, NULL, 'delete', FALSE),
    ('apt_cache', 'system', 2, 1, NULL, 'clean', FALSE),
    
    -- Tier 1 (Managed)
    ('app_logs', 'logs', 1, 7, 30, 'rotate_compress', FALSE),
    ('nginx_logs', 'logs', 1, 7, 14, 'rotate_compress', FALSE),
    ('n8n_executions', 'executions', 1, 30, 90, 'archive_delete', TRUE),
    ('metrics_high_res', 'metrics', 1, 7, 30, 'downsample', FALSE),
    
    -- Tier 0 (Protected)
    ('core_events', 'database', 0, NULL, NULL, 'none', TRUE),
    ('vector_items', 'database', 0, NULL, NULL, 'none', TRUE),
    ('vector_embeddings', 'database', 0, NULL, NULL, 'none', TRUE),
    ('backups', 'backup', 0, NULL, NULL, 'none', TRUE)
ON CONFLICT (resource_name) DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get current feature flag
CREATE OR REPLACE FUNCTION get_feature_flag(p_flag_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    v_enabled BOOLEAN;
BEGIN
    SELECT enabled INTO v_enabled 
    FROM archon_feature_flags 
    WHERE flag_name = p_flag_name;
    
    RETURN COALESCE(v_enabled, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to set feature flag
CREATE OR REPLACE FUNCTION set_feature_flag(
    p_flag_name VARCHAR, 
    p_enabled BOOLEAN, 
    p_updated_by VARCHAR DEFAULT 'system'
)
RETURNS VOID AS $$
BEGIN
    UPDATE archon_feature_flags 
    SET enabled = p_enabled, 
        updated_at = NOW(), 
        updated_by = p_updated_by
    WHERE flag_name = p_flag_name;
END;
$$ LANGUAGE plpgsql;

-- Function to log cleanup action
CREATE OR REPLACE FUNCTION log_cleanup_action(
    p_action_name VARCHAR,
    p_action_tier INTEGER,
    p_action_type VARCHAR,
    p_status VARCHAR,
    p_bytes_freed BIGINT,
    p_duration_ms INTEGER,
    p_trigger_reason VARCHAR,
    p_error_message TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_id INTEGER;
BEGIN
    INSERT INTO archon_cleanup_logs 
    (action_name, action_tier, action_type, status, bytes_freed, duration_ms, trigger_reason, error_message)
    VALUES 
    (p_action_name, p_action_tier, p_action_type, p_status, p_bytes_freed, p_duration_ms, p_trigger_reason, p_error_message)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check alert cooldown
CREATE OR REPLACE FUNCTION should_send_alert(
    p_alert_type VARCHAR,
    p_cooldown_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    v_last_alert TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT MAX(created_at) INTO v_last_alert
    FROM archon_alerts
    WHERE alert_type = p_alert_type
    AND created_at > NOW() - (p_cooldown_minutes || ' minutes')::INTERVAL;
    
    RETURN v_last_alert IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR DASHBOARD
-- ============================================

-- Latest storage snapshot
CREATE OR REPLACE VIEW v_storage_latest AS
SELECT 
    recorded_at,
    disk_total_bytes,
    disk_used_bytes,
    disk_available_bytes,
    disk_used_percent,
    component_breakdown,
    growth_bytes_24h,
    growth_bytes_7d_avg,
    days_to_80_percent,
    CASE 
        WHEN disk_used_percent < 70 THEN 'healthy'
        WHEN disk_used_percent < 80 THEN 'warning'
        WHEN disk_used_percent < 90 THEN 'critical'
        ELSE 'emergency'
    END as health_status
FROM archon_storage_metrics
ORDER BY recorded_at DESC
LIMIT 1;

-- Cleanup summary (last 7 days)
CREATE OR REPLACE VIEW v_cleanup_summary AS
SELECT 
    DATE(executed_at) as cleanup_date,
    COUNT(*) as total_actions,
    COUNT(*) FILTER (WHERE status = 'success') as successful,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    SUM(bytes_freed) as total_bytes_freed,
    AVG(duration_ms) as avg_duration_ms
FROM archon_cleanup_logs
WHERE executed_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(executed_at)
ORDER BY cleanup_date DESC;

-- Feature flags status
CREATE OR REPLACE VIEW v_feature_flags AS
SELECT 
    flag_name,
    enabled,
    updated_at,
    description
FROM archon_feature_flags
ORDER BY flag_name;

-- ============================================
-- GRANTS (adjust role names as needed)
-- ============================================
-- GRANT SELECT, INSERT ON archon_storage_metrics TO archon_app;
-- GRANT SELECT, INSERT ON archon_cleanup_logs TO archon_app;
-- GRANT SELECT, UPDATE ON archon_feature_flags TO archon_app;
-- GRANT SELECT, INSERT, UPDATE ON archon_alerts TO archon_app;
-- GRANT SELECT, UPDATE ON archon_retention_policies TO archon_app;

-- Done!
SELECT 'Migration 001 completed successfully' as status;
