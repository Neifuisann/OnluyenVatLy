-- Database Schema Updates for Settings Functionality
-- Execute these commands in Supabase SQL Editor

-- 1. Add new columns to students table for settings
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS grade_level VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS school_name VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_visible BOOLEAN DEFAULT true;
ALTER TABLE students ADD COLUMN IF NOT EXISTS leaderboard_visible BOOLEAN DEFAULT true;

-- 2. Create student_settings table for flexible settings storage
CREATE TABLE IF NOT EXISTS student_settings (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    settings_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id)
);

-- 3. Create student_devices table for device management
CREATE TABLE IF NOT EXISTS student_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 4. Create index for device lookup
CREATE INDEX IF NOT EXISTS idx_student_devices_student_id ON student_devices(student_id);
CREATE INDEX IF NOT EXISTS idx_student_devices_fingerprint ON student_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_student_devices_active ON student_devices(is_active);

-- 5. Create account_deletion_requests table
CREATE TABLE IF NOT EXISTS account_deletion_requests (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    processed_by INTEGER REFERENCES admins(id)
);

-- 6. Create index for deletion requests
CREATE INDEX IF NOT EXISTS idx_deletion_requests_student_id ON account_deletion_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON account_deletion_requests(status);

-- 7. Create student_achievements table (for future use)
CREATE TABLE IF NOT EXISTS student_achievements (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL,
    achievement_data JSONB DEFAULT '{}',
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, achievement_type)
);

-- 8. Create index for achievements
CREATE INDEX IF NOT EXISTS idx_student_achievements_student_id ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_type ON student_achievements(achievement_type);

-- 9. Update existing students table if needed (add missing columns for device binding)
ALTER TABLE students ADD COLUMN IF NOT EXISTS approved_device_fingerprint VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS device_registered_at TIMESTAMP;

-- 10. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Create trigger for student_settings table
DROP TRIGGER IF EXISTS update_student_settings_updated_at ON student_settings;
CREATE TRIGGER update_student_settings_updated_at
    BEFORE UPDATE ON student_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Create trigger for student_devices table
DROP TRIGGER IF EXISTS update_student_devices_last_activity ON student_devices;
CREATE TRIGGER update_student_devices_last_activity
    BEFORE UPDATE ON student_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Insert default settings for existing students
INSERT INTO student_settings (student_id, settings_data)
SELECT 
    id,
    '{
        "sound-effects": true,
        "animations": true,
        "study-reminders": true,
        "achievement-notifications": true,
        "public-profile": true,
        "leaderboard-visible": true,
        "progress-visible": true
    }'::jsonb
FROM students 
WHERE id NOT IN (SELECT student_id FROM student_settings)
ON CONFLICT (student_id) DO NOTHING;

-- 14. Create RLS (Row Level Security) policies if needed
-- Enable RLS on sensitive tables
ALTER TABLE student_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements ENABLE ROW LEVEL SECURITY;

-- 15. Create policies for student_settings (students can only access their own settings)
CREATE POLICY IF NOT EXISTS "Students can view own settings" ON student_settings
    FOR SELECT USING (auth.uid()::text = student_id::text);

CREATE POLICY IF NOT EXISTS "Students can update own settings" ON student_settings
    FOR UPDATE USING (auth.uid()::text = student_id::text);

CREATE POLICY IF NOT EXISTS "Students can insert own settings" ON student_settings
    FOR INSERT WITH CHECK (auth.uid()::text = student_id::text);

-- 16. Create policies for student_devices
CREATE POLICY IF NOT EXISTS "Students can view own devices" ON student_devices
    FOR SELECT USING (auth.uid()::text = student_id::text);

CREATE POLICY IF NOT EXISTS "Students can update own devices" ON student_devices
    FOR UPDATE USING (auth.uid()::text = student_id::text);

CREATE POLICY IF NOT EXISTS "Students can delete own devices" ON student_devices
    FOR DELETE USING (auth.uid()::text = student_id::text);

-- 17. Create policies for account_deletion_requests
CREATE POLICY IF NOT EXISTS "Students can view own deletion requests" ON account_deletion_requests
    FOR SELECT USING (auth.uid()::text = student_id::text);

CREATE POLICY IF NOT EXISTS "Students can create own deletion requests" ON account_deletion_requests
    FOR INSERT WITH CHECK (auth.uid()::text = student_id::text);

-- 18. Create policies for student_achievements
CREATE POLICY IF NOT EXISTS "Students can view own achievements" ON student_achievements
    FOR SELECT USING (auth.uid()::text = student_id::text);

-- 19. Create view for student profile with settings
CREATE OR REPLACE VIEW student_profiles AS
SELECT 
    s.id,
    s.full_name,
    s.phone_number,
    s.avatar_url,
    s.grade_level,
    s.school_name,
    s.bio,
    s.profile_visible,
    s.leaderboard_visible,
    s.is_approved,
    s.created_at,
    s.last_login_at,
    st.settings_data,
    COUNT(DISTINCT r.id) as completed_lessons,
    AVG(r.score) as average_score,
    MAX(r.created_at) as last_activity
FROM students s
LEFT JOIN student_settings st ON s.id = st.student_id
LEFT JOIN results r ON s.id = r.student_id
GROUP BY s.id, st.settings_data;

-- 20. Create function to clean up old devices (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_devices()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete devices that haven't been active for more than 30 days
    DELETE FROM student_devices 
    WHERE last_activity < CURRENT_TIMESTAMP - INTERVAL '30 days'
    AND is_active = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 21. Create function to export student data (for GDPR compliance)
CREATE OR REPLACE FUNCTION export_student_data(p_student_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'profile', to_jsonb(s.*),
        'settings', st.settings_data,
        'devices', (
            SELECT jsonb_agg(to_jsonb(d.*))
            FROM student_devices d
            WHERE d.student_id = p_student_id
        ),
        'results', (
            SELECT jsonb_agg(to_jsonb(r.*))
            FROM results r
            WHERE r.student_id = p_student_id
        ),
        'achievements', (
            SELECT jsonb_agg(to_jsonb(a.*))
            FROM student_achievements a
            WHERE a.student_id = p_student_id
        ),
        'exported_at', CURRENT_TIMESTAMP
    ) INTO result
    FROM students s
    LEFT JOIN student_settings st ON s.id = st.student_id
    WHERE s.id = p_student_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- End of schema updates