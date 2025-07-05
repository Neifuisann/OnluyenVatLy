-- Phase 2: Missing Tables Creation
-- File: database-migrations/002-missing-tables.sql
-- Description: Create missing tables (admins, ai_interactions, ai_insights) with proper relationships
-- Date: 2025-01-05

BEGIN;

-- ===== PRE-MIGRATION VALIDATION =====
DO $$
BEGIN
    RAISE NOTICE 'Starting Phase 2: Missing Tables Creation';
    RAISE NOTICE 'Current timestamp: %', NOW();
END $$;

-- ===== 1. CREATE ADMINS TABLE =====
DO $$
BEGIN
    RAISE NOTICE 'Creating admins table...';
END $$;

-- Create admins table (referenced by account_deletion_requests)
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    permissions JSONB DEFAULT '{"admin": true}',
    
    -- Constraints
    CONSTRAINT admins_username_length CHECK (LENGTH(username) >= 3),
    CONSTRAINT admins_password_hash_length CHECK (LENGTH(password_hash) >= 10)
);

-- ===== 2. CREATE AI INTERACTIONS TABLE =====
DO $$
BEGIN
    RAISE NOTICE 'Creating ai_interactions table...';
END $$;

-- Create AI interactions table
CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL,
    request TEXT NOT NULL,
    response TEXT,
    tokens_used INTEGER,
    model_used VARCHAR(50) DEFAULT 'gemini-1.5-flash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    
    -- Constraints
    CONSTRAINT ai_interactions_type_check CHECK (
        interaction_type IN ('chat', 'explanation', 'practice', 'summary', 'image', 'analysis')
    ),
    CONSTRAINT ai_interactions_tokens_positive CHECK (tokens_used IS NULL OR tokens_used >= 0)
);

-- ===== 3. CREATE AI INSIGHTS TABLE =====
DO $$
BEGIN
    RAISE NOTICE 'Creating ai_insights table...';
END $$;

-- Create AI insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    insight_type VARCHAR(100) NOT NULL,
    insights JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    CONSTRAINT ai_insights_entity_type_check CHECK (
        entity_type IN ('student', 'lesson', 'class', 'system')
    ),
    CONSTRAINT ai_insights_insight_type_check CHECK (
        insight_type IN ('performance_analysis', 'recommendation', 'summary', 'prediction', 'trend')
    ),
    CONSTRAINT ai_insights_expires_future CHECK (
        expires_at IS NULL OR expires_at > generated_at
    )
);

-- ===== 4. CREATE INDEXES FOR NEW TABLES =====
DO $$
BEGIN
    RAISE NOTICE 'Creating indexes for new tables...';
END $$;

-- Indexes for admins table
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admins_created_at ON admins(created_at);

-- Indexes for ai_interactions table
CREATE INDEX IF NOT EXISTS idx_ai_interactions_student_id ON ai_interactions(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_type ON ai_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_model ON ai_interactions(model_used);

-- Indexes for ai_insights table
CREATE INDEX IF NOT EXISTS idx_ai_insights_entity ON ai_insights(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_expires ON ai_insights(expires_at) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ai_insights_active ON ai_insights(is_active);

-- ===== 5. INSERT DEFAULT DATA =====
DO $$
BEGIN
    RAISE NOTICE 'Inserting default data...';
END $$;

-- Insert default admin user (password: 'admin123' - CHANGE IN PRODUCTION!)
INSERT INTO admins (username, password_hash, full_name, email) VALUES 
('admin', '$2b$10$R4tMQGVYYReQayD82yx.6.E/4bE.0Ue.vmmWT6t1ggXrJFA3wUCqu', 'System Administrator', 'admin@onluyenvatly.com')
ON CONFLICT (username) DO NOTHING;

-- ===== 6. UPDATE FOREIGN KEY REFERENCES =====
DO $$
BEGIN
    RAISE NOTICE 'Updating foreign key references...';
END $$;

-- Update account_deletion_requests to properly reference admins table
-- Note: This assumes the processed_by column exists and should reference admins(id)
-- If the column doesn't exist or has different constraints, this will be handled gracefully

-- Check if account_deletion_requests.processed_by needs to be updated
DO $$
DECLARE
    fk_exists BOOLEAN;
BEGIN
    -- Check if foreign key constraint already exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'account_deletion_requests'
        AND constraint_name LIKE '%processed_by%'
    ) INTO fk_exists;
    
    IF NOT fk_exists THEN
        -- Add foreign key constraint if it doesn't exist
        BEGIN
            ALTER TABLE account_deletion_requests 
            ADD CONSTRAINT fk_account_deletion_requests_processed_by 
            FOREIGN KEY (processed_by) REFERENCES admins(id);
            
            RAISE NOTICE 'Added foreign key constraint for account_deletion_requests.processed_by';
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Foreign key constraint for processed_by already exists';
    END IF;
END $$;

-- ===== POST-MIGRATION VALIDATION =====
DO $$
DECLARE
    admins_count INTEGER;
    ai_interactions_count INTEGER;
    ai_insights_count INTEGER;
BEGIN
    -- Count records in new tables
    SELECT COUNT(*) INTO admins_count FROM admins;
    SELECT COUNT(*) INTO ai_interactions_count FROM ai_interactions;
    SELECT COUNT(*) INTO ai_insights_count FROM ai_insights;
    
    RAISE NOTICE 'Post-migration validation:';
    RAISE NOTICE '- Admins table created with % records', admins_count;
    RAISE NOTICE '- AI interactions table created with % records', ai_interactions_count;
    RAISE NOTICE '- AI insights table created with % records', ai_insights_count;
    
    -- Verify default admin was created
    IF admins_count > 0 THEN
        RAISE NOTICE '- Default admin user created successfully';
    ELSE
        RAISE WARNING 'No admin users found after migration';
    END IF;
END $$;

-- ===== COMPLETION MESSAGE =====
DO $$
BEGIN
    RAISE NOTICE 'Phase 2: Missing Tables Creation completed successfully!';
    RAISE NOTICE 'Completion timestamp: %', NOW();
END $$;

COMMIT;

-- ===== ROLLBACK SCRIPT (COMMENTED OUT) =====
-- In case rollback is needed, uncomment and run:
/*
BEGIN;
-- Remove foreign key constraints first
ALTER TABLE account_deletion_requests DROP CONSTRAINT IF EXISTS fk_account_deletion_requests_processed_by;

-- Drop tables (WARNING: This will lose all data!)
DROP TABLE IF EXISTS ai_insights;
DROP TABLE IF EXISTS ai_interactions;
DROP TABLE IF EXISTS admins;

-- Drop indexes
DROP INDEX IF EXISTS idx_admins_username;
DROP INDEX IF EXISTS idx_admins_active;
DROP INDEX IF EXISTS idx_admins_created_at;
DROP INDEX IF EXISTS idx_ai_interactions_student_id;
DROP INDEX IF EXISTS idx_ai_interactions_type;
DROP INDEX IF EXISTS idx_ai_interactions_created_at;
DROP INDEX IF EXISTS idx_ai_interactions_model;
DROP INDEX IF EXISTS idx_ai_insights_entity;
DROP INDEX IF EXISTS idx_ai_insights_type;
DROP INDEX IF EXISTS idx_ai_insights_expires;
DROP INDEX IF EXISTS idx_ai_insights_active;
COMMIT;
*/
