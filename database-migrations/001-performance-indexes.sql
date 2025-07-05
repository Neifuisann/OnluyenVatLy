-- Performance Optimization Indexes
-- These indexes will significantly improve query performance for common operations

-- 1. Rating history queries (fixes N+1 query performance)
-- Used for calculating rating changes over time periods
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rating_history_student_timestamp 
ON rating_history(student_id, timestamp);

-- 2. Results table for lesson statistics and student progress
-- Used for lesson completion tracking and statistics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_results_lesson_student 
ON results(lessonId, student_id);

-- 3. Results ordered by timestamp for activity tracking
-- Used for getting latest student activity and progress
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_results_student_timestamp 
ON results(student_id, timestamp DESC);

-- 4. Session cleanup performance
-- Used for session store cleanup operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_expires 
ON session(expire) WHERE expire IS NOT NULL;

-- 5. Student management queries
-- Used for admin student listing and approval workflows
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_approved_created 
ON students(is_approved, created_at DESC);

-- 6. Lesson ordering and visibility
-- Used for lesson listing with proper order
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_order_visible 
ON lessons("order", created_at DESC) WHERE visible = true;

-- 7. Rating system performance
-- Used for leaderboard and rating calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ratings_rating_desc 
ON ratings(rating DESC, student_id);

-- 8. Lesson search and filtering
-- Used for lesson search functionality
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_search 
ON lessons USING gin(to_tsvector('simple', title || ' ' || COALESCE(description, '')));

-- 9. Results aggregation for statistics
-- Used for lesson performance analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_results_lesson_score 
ON results(lessonId, score, total_points);

-- 10. Session management by student
-- Used for device validation and session cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_students_session_device 
ON students(current_session_id, device_hash) WHERE current_session_id IS NOT NULL;

-- Analyze tables after creating indexes to update statistics
ANALYZE rating_history;
ANALYZE results;
ANALYZE session;
ANALYZE students;
ANALYZE lessons;
ANALYZE ratings;

-- Create materialized view for lesson statistics (optional optimization)
-- This can be refreshed periodically instead of calculating stats in real-time
CREATE MATERIALIZED VIEW IF NOT EXISTS lesson_stats AS
SELECT 
    l.id as lesson_id,
    l.title,
    COUNT(DISTINCT r.student_id) as unique_students,
    COUNT(r.id) as total_attempts,
    ROUND(AVG(r.score::float / NULLIF(r.total_points, 0) * 100), 2) as avg_score_percentage,
    MAX(r.timestamp) as last_activity,
    l.created_at,
    l."order"
FROM lessons l
LEFT JOIN results r ON l.id = r.lessonId
WHERE l.visible = true
GROUP BY l.id, l.title, l.created_at, l."order"
ORDER BY l."order" ASC;

-- Create unique index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_stats_lesson_id 
ON lesson_stats(lesson_id);

-- Grant permissions (adjust as needed for your user)
-- GRANT SELECT ON lesson_stats TO your_app_user;

-- Instructions for refreshing the materialized view:
-- This should be done periodically (e.g., every hour) or after significant data changes
-- REFRESH MATERIALIZED VIEW CONCURRENTLY lesson_stats;