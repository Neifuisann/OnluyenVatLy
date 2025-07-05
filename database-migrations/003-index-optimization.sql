-- Phase 3: Index Corrections & Optimization
-- File: database-migrations/003-index-optimization.sql
-- Description: Fix broken indexes, update materialized views, and optimize performance
-- Date: 2025-01-05

BEGIN;

-- ===== PRE-MIGRATION VALIDATION =====
DO $$
BEGIN
    RAISE NOTICE 'Starting Phase 3: Index Corrections & Optimization';
    RAISE NOTICE 'Current timestamp: %', NOW();
END $$;

-- ===== 1. FIX BROKEN PERFORMANCE INDEXES =====
DO $$
BEGIN
    RAISE NOTICE 'Fixing broken performance indexes...';
END $$;

-- Drop and recreate indexes with correct column names
-- Fix results table indexes that reference wrong column names
DROP INDEX IF EXISTS idx_results_lesson_score;
CREATE INDEX IF NOT EXISTS idx_results_lesson_score ON results("lessonId", score, "totalPoints");

-- Add index for the new total_points column as well
CREATE INDEX IF NOT EXISTS idx_results_lesson_score_snake ON results("lessonId", score, total_points);

-- Fix students table index that references missing device_hash column
-- (This should now work since we added device_hash in Phase 1)
DROP INDEX IF EXISTS idx_students_session_device;
CREATE INDEX IF NOT EXISTS idx_students_session_device ON students(current_session_id, device_hash) 
WHERE current_session_id IS NOT NULL;

-- Fix lessons table index for visible column
-- (This should now work since we added visible in Phase 1)
DROP INDEX IF EXISTS idx_lessons_order_visible;
CREATE INDEX IF NOT EXISTS idx_lessons_order_visible ON lessons("order", created DESC) 
WHERE visible = true;

-- ===== 2. ADD MISSING PERFORMANCE INDEXES =====
DO $$
BEGIN
    RAISE NOTICE 'Adding missing performance indexes...';
END $$;

-- Add indexes for AI-related columns
CREATE INDEX IF NOT EXISTS idx_lessons_ai_summary ON lessons(ai_summary) WHERE ai_summary IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_auto_generated_image ON lessons(auto_generated_image);

-- Add indexes for results table new columns
CREATE INDEX IF NOT EXISTS idx_results_time_taken ON results("timeTaken") WHERE "timeTaken" IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_results_mode_timestamp ON results(mode, timestamp DESC);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_lessons_visible_subject_grade ON lessons(visible, subject, grade) 
WHERE visible = true;

CREATE INDEX IF NOT EXISTS idx_results_student_lesson_timestamp ON results(student_id, "lessonId", timestamp DESC);

-- ===== 3. UPDATE MATERIALIZED VIEWS =====
DO $$
BEGIN
    RAISE NOTICE 'Updating materialized views...';
END $$;

-- Drop and recreate lesson_stats materialized view with correct column references
DROP MATERIALIZED VIEW IF EXISTS lesson_stats;

CREATE MATERIALIZED VIEW lesson_stats AS
SELECT 
    l.id as lesson_id,
    l.title,
    COUNT(DISTINCT r.student_id) as unique_students,
    COUNT(r.id) as total_attempts,
    ROUND(AVG(r.score::numeric / NULLIF(r."totalPoints", 0) * 100)::numeric, 2) as avg_score_percentage,
    MAX(r.timestamp) as last_activity,
    l.created,
    l."order",
    l.visible,
    l.subject,
    l.grade
FROM lessons l
LEFT JOIN results r ON l.id = r."lessonId"
WHERE l.visible = true
GROUP BY l.id, l.title, l.created, l."order", l.visible, l.subject, l.grade
ORDER BY l."order" ASC NULLS LAST;

-- Create unique index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_stats_lesson_id ON lesson_stats(lesson_id);

-- Create additional indexes on materialized view for common queries
CREATE INDEX IF NOT EXISTS idx_lesson_stats_subject ON lesson_stats(subject);
CREATE INDEX IF NOT EXISTS idx_lesson_stats_grade ON lesson_stats(grade);
CREATE INDEX IF NOT EXISTS idx_lesson_stats_unique_students ON lesson_stats(unique_students DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_stats_avg_score ON lesson_stats(avg_score_percentage DESC);

-- ===== 4. OPTIMIZE EXISTING INDEXES =====
DO $$
BEGIN
    RAISE NOTICE 'Optimizing existing indexes...';
END $$;

-- Add missing indexes that should exist based on common query patterns
CREATE INDEX IF NOT EXISTS idx_students_phone_approved ON students(phone_number, is_approved);
CREATE INDEX IF NOT EXISTS idx_students_approved_device ON students(approved_device_id) WHERE approved_device_id IS NOT NULL;

-- Add indexes for rating system performance
CREATE INDEX IF NOT EXISTS idx_rating_history_student_lesson ON rating_history(student_id, lesson_id, timestamp DESC);

-- Add indexes for session management
CREATE INDEX IF NOT EXISTS idx_session_sid_expire ON session(sid, expire);

-- ===== 5. ANALYZE TABLES FOR QUERY OPTIMIZATION =====
DO $$
BEGIN
    RAISE NOTICE 'Running ANALYZE on updated tables...';
END $$;

-- Update table statistics for query planner
ANALYZE students;
ANALYZE lessons;
ANALYZE results;
ANALYZE ratings;
ANALYZE rating_history;
ANALYZE session;
ANALYZE admins;
ANALYZE ai_interactions;
ANALYZE ai_insights;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW lesson_stats;

-- ===== 6. CREATE PERFORMANCE MONITORING VIEWS =====
DO $$
BEGIN
    RAISE NOTICE 'Creating performance monitoring views...';
END $$;

-- Create view for monitoring index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
    i.schemaname,
    i.relname as table_name,
    i.indexrelname as index_name,
    i.idx_scan,
    i.idx_tup_read,
    i.idx_tup_fetch,
    pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size
FROM pg_stat_user_indexes i
WHERE i.schemaname = 'public'
ORDER BY i.idx_scan DESC;

-- Create view for monitoring table sizes
CREATE OR REPLACE VIEW table_size_stats AS
SELECT
    c.relname as table_name,
    pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
    pg_size_pretty(pg_relation_size(c.oid)) as table_size,
    pg_size_pretty(pg_total_relation_size(c.oid) - pg_relation_size(c.oid)) as index_size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY pg_total_relation_size(c.oid) DESC;

-- ===== POST-MIGRATION VALIDATION =====
DO $$
DECLARE
    index_count INTEGER;
    materialized_view_count INTEGER;
BEGIN
    -- Count indexes
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    -- Count materialized views
    SELECT COUNT(*) INTO materialized_view_count 
    FROM pg_matviews 
    WHERE schemaname = 'public';
    
    RAISE NOTICE 'Post-migration validation:';
    RAISE NOTICE '- Total indexes created: %', index_count;
    RAISE NOTICE '- Materialized views: %', materialized_view_count;
    
    -- Test materialized view
    PERFORM * FROM lesson_stats LIMIT 1;
    RAISE NOTICE '- lesson_stats materialized view is accessible';
    
    -- Test performance monitoring views
    PERFORM * FROM index_usage_stats LIMIT 1;
    PERFORM * FROM table_size_stats LIMIT 1;
    RAISE NOTICE '- Performance monitoring views created successfully';
END $$;

-- ===== COMPLETION MESSAGE =====
DO $$
BEGIN
    RAISE NOTICE 'Phase 3: Index Corrections & Optimization completed successfully!';
    RAISE NOTICE 'Completion timestamp: %', NOW();
    RAISE NOTICE 'Recommendation: Monitor index usage with: SELECT * FROM index_usage_stats;';
    RAISE NOTICE 'Recommendation: Check table sizes with: SELECT * FROM table_size_stats;';
END $$;

COMMIT;

-- ===== ROLLBACK SCRIPT (COMMENTED OUT) =====
-- In case rollback is needed, uncomment and run:
/*
BEGIN;
-- Drop performance monitoring views
DROP VIEW IF EXISTS index_usage_stats;
DROP VIEW IF EXISTS table_size_stats;

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS lesson_stats;

-- Drop new indexes (keep original ones)
DROP INDEX IF EXISTS idx_results_lesson_score_snake;
DROP INDEX IF EXISTS idx_lessons_ai_summary;
DROP INDEX IF EXISTS idx_lessons_auto_generated_image;
DROP INDEX IF EXISTS idx_results_time_taken;
DROP INDEX IF EXISTS idx_results_mode_timestamp;
DROP INDEX IF EXISTS idx_lessons_visible_subject_grade;
DROP INDEX IF EXISTS idx_results_student_lesson_timestamp;
DROP INDEX IF EXISTS idx_lesson_stats_subject;
DROP INDEX IF EXISTS idx_lesson_stats_grade;
DROP INDEX IF EXISTS idx_lesson_stats_unique_students;
DROP INDEX IF EXISTS idx_lesson_stats_avg_score;
DROP INDEX IF EXISTS idx_students_phone_approved;
DROP INDEX IF EXISTS idx_students_approved_device;
DROP INDEX IF EXISTS idx_rating_history_student_lesson;
DROP INDEX IF EXISTS idx_session_sid_expire;
COMMIT;
*/
