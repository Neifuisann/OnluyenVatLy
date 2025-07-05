-- Phase 1: Critical Schema Fixes
-- File: database-migrations/001-critical-schema-fixes.sql
-- Description: Add missing columns, sync data, and create essential functions
-- Date: 2025-01-05

BEGIN;

-- ===== PRE-MIGRATION VALIDATION =====
DO $$
BEGIN
    RAISE NOTICE 'Starting Phase 1: Critical Schema Fixes';
    RAISE NOTICE 'Current timestamp: %', NOW();
END $$;

-- Check current table counts for validation
DO $$
DECLARE
    student_count INTEGER;
    lesson_count INTEGER;
    result_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO student_count FROM students;
    SELECT COUNT(*) INTO lesson_count FROM lessons;
    SELECT COUNT(*) INTO result_count FROM results;
    
    RAISE NOTICE 'Pre-migration counts - Students: %, Lessons: %, Results: %', 
                 student_count, lesson_count, result_count;
END $$;

-- ===== 1. ADD MISSING COLUMNS TO LESSONS TABLE =====
DO $$
BEGIN
    RAISE NOTICE 'Adding missing columns to lessons table...';
END $$;

-- Add visible column (referenced in performance indexes)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT TRUE;

-- Add AI-related columns from migration
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS ai_image_prompt TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS auto_generated_image BOOLEAN DEFAULT FALSE;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMP;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS ai_image_generated_at TIMESTAMP;

-- ===== 2. ADD MISSING COLUMNS TO RESULTS TABLE =====
DO $$
BEGIN
    RAISE NOTICE 'Adding missing columns to results table...';
END $$;

-- Add total_points column (snake_case version of totalPoints)
ALTER TABLE results ADD COLUMN IF NOT EXISTS total_points INTEGER;

-- Add missing columns referenced in application
ALTER TABLE results ADD COLUMN IF NOT EXISTS "timeTaken" INTEGER;
ALTER TABLE results ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'practice';

-- ===== 3. ADD MISSING COLUMNS TO STUDENTS TABLE =====
DO $$
BEGIN
    RAISE NOTICE 'Adding missing columns to students table...';
END $$;

-- Add device_hash column (referenced in performance indexes)
ALTER TABLE students ADD COLUMN IF NOT EXISTS device_hash VARCHAR(255);

-- ===== 4. SYNC DATA FOR NEW COLUMNS =====
DO $$
BEGIN
    RAISE NOTICE 'Syncing data for new columns...';
END $$;

-- Sync totalPoints to total_points in results table
UPDATE results 
SET total_points = "totalPoints" 
WHERE total_points IS NULL AND "totalPoints" IS NOT NULL;

-- Set default visible = true for all existing lessons
UPDATE lessons 
SET visible = TRUE 
WHERE visible IS NULL;

-- Generate device_hash from existing approved_device_fingerprint
UPDATE students 
SET device_hash = approved_device_fingerprint 
WHERE device_hash IS NULL AND approved_device_fingerprint IS NOT NULL;

-- ===== 5. CREATE MISSING SEARCH FUNCTION =====
DO $$
BEGIN
    RAISE NOTICE 'Creating search_lessons function...';
END $$;

-- Drop existing function if it exists with different signature
DROP FUNCTION IF EXISTS search_lessons(TEXT);

-- Create search_lessons function that the application calls
CREATE OR REPLACE FUNCTION search_lessons(search_term TEXT)
RETURNS TABLE(
    id TEXT,
    title TEXT,
    description TEXT,
    subject TEXT,
    grade INTEGER,
    tags JSONB,
    views INTEGER,
    created TIMESTAMP WITH TIME ZONE,
    "order" BIGINT,
    visible BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.title,
        l.description,
        l.subject,
        l.grade,
        l.tags,
        l.views,
        l.created,
        l."order",
        l.visible
    FROM lessons l
    WHERE 
        l.visible = TRUE AND
        (
            l.title ILIKE '%' || search_term || '%' OR
            COALESCE(l.description, '') ILIKE '%' || search_term || '%' OR
            COALESCE(l.subject, '') ILIKE '%' || search_term || '%'
        )
    ORDER BY l."order" ASC NULLS LAST, l.created DESC;
END;
$$ LANGUAGE plpgsql;

-- ===== 6. CREATE BASIC INDEXES FOR NEW COLUMNS =====
DO $$
BEGIN
    RAISE NOTICE 'Creating indexes for new columns...';
END $$;

-- Index for lessons.visible column
CREATE INDEX IF NOT EXISTS idx_lessons_visible ON lessons(visible);

-- Index for results.mode column
CREATE INDEX IF NOT EXISTS idx_results_mode ON results(mode);

-- Index for results.total_points column
CREATE INDEX IF NOT EXISTS idx_results_total_points ON results(total_points);

-- ===== POST-MIGRATION VALIDATION =====
DO $$
DECLARE
    lessons_with_visible INTEGER;
    results_with_total_points INTEGER;
    students_with_device_hash INTEGER;
BEGIN
    -- Count records with new columns populated
    SELECT COUNT(*) INTO lessons_with_visible FROM lessons WHERE visible IS NOT NULL;
    SELECT COUNT(*) INTO results_with_total_points FROM results WHERE total_points IS NOT NULL;
    SELECT COUNT(*) INTO students_with_device_hash FROM students WHERE device_hash IS NOT NULL;
    
    RAISE NOTICE 'Post-migration validation:';
    RAISE NOTICE '- Lessons with visible column: %', lessons_with_visible;
    RAISE NOTICE '- Results with total_points: %', results_with_total_points;
    RAISE NOTICE '- Students with device_hash: %', students_with_device_hash;
    
    -- Test search function
    PERFORM search_lessons('physics');
    RAISE NOTICE '- search_lessons function created and tested successfully';
END $$;

-- ===== COMPLETION MESSAGE =====
DO $$
BEGIN
    RAISE NOTICE 'Phase 1: Critical Schema Fixes completed successfully!';
    RAISE NOTICE 'Completion timestamp: %', NOW();
END $$;

COMMIT;

-- ===== ROLLBACK SCRIPT (COMMENTED OUT) =====
-- In case rollback is needed, uncomment and run:
/*
BEGIN;
-- Remove added columns (WARNING: This will lose data!)
-- ALTER TABLE lessons DROP COLUMN IF EXISTS visible;
-- ALTER TABLE lessons DROP COLUMN IF EXISTS ai_summary;
-- ALTER TABLE lessons DROP COLUMN IF EXISTS ai_image_prompt;
-- ALTER TABLE lessons DROP COLUMN IF EXISTS auto_generated_image;
-- ALTER TABLE lessons DROP COLUMN IF EXISTS ai_summary_generated_at;
-- ALTER TABLE lessons DROP COLUMN IF EXISTS ai_image_generated_at;
-- ALTER TABLE results DROP COLUMN IF EXISTS total_points;
-- ALTER TABLE results DROP COLUMN IF EXISTS "timeTaken";
-- ALTER TABLE results DROP COLUMN IF EXISTS mode;
-- ALTER TABLE students DROP COLUMN IF EXISTS device_hash;
-- DROP FUNCTION IF EXISTS search_lessons(TEXT);
-- DROP INDEX IF EXISTS idx_lessons_visible;
-- DROP INDEX IF EXISTS idx_results_mode;
-- DROP INDEX IF EXISTS idx_results_total_points;
COMMIT;
*/
