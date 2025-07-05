-- Migration: Add Streak Tracking System
-- Date: 2025-01-05
-- Description: Creates tables for tracking daily learning streaks and gamification features

-- ===== STREAK SYSTEM =====

-- Student Streaks Table
CREATE TABLE IF NOT EXISTS student_streaks (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    streak_freezes_available INTEGER DEFAULT 3,
    streak_freezes_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(student_id),
    CHECK(current_streak >= 0),
    CHECK(longest_streak >= 0),
    CHECK(streak_freezes_available >= 0),
    CHECK(streak_freezes_used >= 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_streaks_student_id ON student_streaks(student_id);
CREATE INDEX IF NOT EXISTS idx_student_streaks_current_streak ON student_streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_student_streaks_longest_streak ON student_streaks(longest_streak DESC);
CREATE INDEX IF NOT EXISTS idx_student_streaks_last_activity ON student_streaks(last_activity_date);

-- ===== XP SYSTEM =====

-- Student XP Table
CREATE TABLE IF NOT EXISTS student_xp (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    xp_to_next_level INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(student_id),
    CHECK(total_xp >= 0),
    CHECK(current_level >= 1),
    CHECK(xp_to_next_level >= 0)
);

-- XP Transaction History
CREATE TABLE IF NOT EXISTS xp_transactions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    transaction_type VARCHAR(100) NOT NULL, -- 'lesson_completion', 'streak_bonus', 'achievement', etc.
    description TEXT,
    lesson_id VARCHAR(255), -- Optional reference to lesson
    result_id INTEGER, -- Optional reference to result
    metadata JSONB, -- Additional context data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK(xp_amount != 0) -- Can be positive (earned) or negative (penalties)
);

-- Create indexes for XP system
CREATE INDEX IF NOT EXISTS idx_student_xp_student_id ON student_xp(student_id);
CREATE INDEX IF NOT EXISTS idx_student_xp_total_xp ON student_xp(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_student_xp_current_level ON student_xp(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_student_id ON xp_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_type ON xp_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON xp_transactions(created_at);

-- ===== ACHIEVEMENT SYSTEM =====

-- Achievements Master Table
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    badge_icon VARCHAR(100), -- Emoji or icon class
    category VARCHAR(100) NOT NULL, -- 'discovery', 'mastery', 'social', 'persistence', 'accuracy'
    requirements JSONB NOT NULL, -- Conditions for earning the achievement
    xp_reward INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK(xp_reward >= 0)
);

-- Student Achievements (Many-to-Many)
CREATE TABLE IF NOT EXISTS student_achievements (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB, -- Additional data about how achievement was earned
    
    -- Constraints
    UNIQUE(student_id, achievement_id)
);

-- Create indexes for achievement system
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_student_achievements_student_id ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_achievement_id ON student_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_earned_at ON student_achievements(earned_at);

-- ===== DAILY QUESTS SYSTEM =====

-- Daily Quests Master Table
CREATE TABLE IF NOT EXISTS daily_quests (
    id SERIAL PRIMARY KEY,
    quest_type VARCHAR(100) NOT NULL, -- 'knowledge', 'exploration', 'social', 'consistency', 'challenge'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements JSONB NOT NULL, -- Quest completion conditions
    xp_reward INTEGER DEFAULT 0,
    streak_shield_reward BOOLEAN DEFAULT FALSE, -- Awards streak protection
    active_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK(xp_reward >= 0)
);

-- Student Quest Progress
CREATE TABLE IF NOT EXISTS student_quest_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    quest_id INTEGER NOT NULL REFERENCES daily_quests(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    target_progress INTEGER NOT NULL DEFAULT 1,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB, -- Progress tracking data
    
    -- Constraints
    UNIQUE(student_id, quest_id),
    CHECK(progress >= 0),
    CHECK(target_progress > 0)
);

-- Create indexes for quest system
CREATE INDEX IF NOT EXISTS idx_daily_quests_active_date ON daily_quests(active_date);
CREATE INDEX IF NOT EXISTS idx_daily_quests_type ON daily_quests(quest_type);
CREATE INDEX IF NOT EXISTS idx_daily_quests_active ON daily_quests(is_active);
CREATE INDEX IF NOT EXISTS idx_student_quest_progress_student_id ON student_quest_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_quest_progress_quest_id ON student_quest_progress(quest_id);
CREATE INDEX IF NOT EXISTS idx_student_quest_progress_completed ON student_quest_progress(completed);

-- ===== WEEKLY LEAGUES SYSTEM =====

-- League Seasons
CREATE TABLE IF NOT EXISTS league_seasons (
    id SERIAL PRIMARY KEY,
    season_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK(end_date > start_date)
);

-- League Divisions
CREATE TABLE IF NOT EXISTS league_divisions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- 'Electron', 'Proton', 'Neutron', 'Photon'
    min_xp_per_week INTEGER NOT NULL DEFAULT 0,
    max_xp_per_week INTEGER, -- NULL for highest division
    division_order INTEGER NOT NULL, -- 1 = lowest, 4 = highest
    icon VARCHAR(100), -- Division icon/emoji
    color VARCHAR(50), -- Division theme color
    
    -- Constraints
    UNIQUE(name),
    UNIQUE(division_order),
    CHECK(min_xp_per_week >= 0),
    CHECK(max_xp_per_week IS NULL OR max_xp_per_week > min_xp_per_week)
);

-- Student League Participation
CREATE TABLE IF NOT EXISTS student_league_participation (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    season_id INTEGER NOT NULL REFERENCES league_seasons(id) ON DELETE CASCADE,
    division_id INTEGER NOT NULL REFERENCES league_divisions(id),
    weekly_xp INTEGER DEFAULT 0,
    rank_in_division INTEGER,
    promoted BOOLEAN DEFAULT FALSE,
    demoted BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(student_id, season_id),
    CHECK(weekly_xp >= 0),
    CHECK(rank_in_division IS NULL OR rank_in_division > 0)
);

-- Create indexes for league system
CREATE INDEX IF NOT EXISTS idx_league_seasons_active ON league_seasons(is_active);
CREATE INDEX IF NOT EXISTS idx_league_seasons_dates ON league_seasons(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_league_divisions_order ON league_divisions(division_order);
CREATE INDEX IF NOT EXISTS idx_student_league_participation_student_id ON student_league_participation(student_id);
CREATE INDEX IF NOT EXISTS idx_student_league_participation_season_id ON student_league_participation(season_id);
CREATE INDEX IF NOT EXISTS idx_student_league_participation_division_id ON student_league_participation(division_id);
CREATE INDEX IF NOT EXISTS idx_student_league_participation_weekly_xp ON student_league_participation(weekly_xp DESC);

-- ===== SOCIAL FEATURES =====

-- Student Study Groups
CREATE TABLE IF NOT EXISTS study_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    max_members INTEGER DEFAULT 8,
    current_members INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    created_by INTEGER NOT NULL REFERENCES students(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK(max_members > 0),
    CHECK(current_members >= 0),
    CHECK(current_members <= max_members)
);

-- Study Group Memberships
CREATE TABLE IF NOT EXISTS study_group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'creator', 'admin', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    UNIQUE(group_id, student_id)
);

-- Activity Feed
CREATE TABLE IF NOT EXISTS activity_feed (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL, -- 'lesson_completed', 'achievement_earned', 'streak_milestone', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB, -- Additional activity data
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for social features
CREATE INDEX IF NOT EXISTS idx_study_groups_public ON study_groups(is_public);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON study_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_study_group_members_group_id ON study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_student_id ON study_group_members(student_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_active ON study_group_members(is_active);
CREATE INDEX IF NOT EXISTS idx_activity_feed_student_id ON activity_feed(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_public_created ON activity_feed(is_public, created_at DESC);

-- ===== SPACED REPETITION SYSTEM =====

-- Concept Mastery Tracking
CREATE TABLE IF NOT EXISTS concept_mastery (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    concept_name VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    lesson_id VARCHAR(255), -- Optional reference to specific lesson
    mastery_level DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0 (0% to 100%)
    last_reviewed TIMESTAMP WITH TIME ZONE,
    next_review TIMESTAMP WITH TIME ZONE,
    review_interval_days INTEGER DEFAULT 1,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(student_id, concept_name),
    CHECK(mastery_level >= 0.0 AND mastery_level <= 1.0),
    CHECK(review_interval_days > 0),
    CHECK(correct_count >= 0),
    CHECK(incorrect_count >= 0)
);

-- Review Sessions
CREATE TABLE IF NOT EXISTS review_sessions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    concept_mastery_id INTEGER NOT NULL REFERENCES concept_mastery(id) ON DELETE CASCADE,
    session_type VARCHAR(50) DEFAULT 'spaced_repetition', -- 'spaced_repetition', 'mistake_review', 'random_practice'
    questions_attempted INTEGER DEFAULT 0,
    questions_correct INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- seconds
    difficulty_level VARCHAR(50), -- 'easy', 'medium', 'hard'
    session_data JSONB, -- Questions and answers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK(questions_attempted >= 0),
    CHECK(questions_correct >= 0),
    CHECK(questions_correct <= questions_attempted),
    CHECK(time_spent >= 0)
);

-- Create indexes for spaced repetition
CREATE INDEX IF NOT EXISTS idx_concept_mastery_student_id ON concept_mastery(student_id);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_subject ON concept_mastery(subject);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_next_review ON concept_mastery(next_review);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_mastery_level ON concept_mastery(mastery_level);
CREATE INDEX IF NOT EXISTS idx_review_sessions_student_id ON review_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_concept_mastery_id ON review_sessions(concept_mastery_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_created_at ON review_sessions(created_at);

-- ===== INSERT INITIAL DATA =====

-- Insert default achievements
INSERT INTO achievements (name, title, description, badge_icon, category, requirements, xp_reward) VALUES
-- Discovery Achievements
('first_lesson', 'First Steps', 'Complete your first lesson', '🎯', 'discovery', '{"lessons_completed": 1}', 50),
('physics_explorer', 'Physics Explorer', 'Try lessons from 3 different subjects', '🔍', 'discovery', '{"different_subjects": 3}', 150),
('curious_mind', 'Curious Mind', 'Complete lessons on 5 consecutive days', '🧠', 'discovery', '{"consecutive_days": 5}', 200),

-- Mastery Achievements
('lessons_10', 'Dedicated Learner', 'Complete 10 lessons', '📚', 'mastery', '{"lessons_completed": 10}', 250),
('lessons_50', 'Knowledge Seeker', 'Complete 50 lessons', '🏆', 'mastery', '{"lessons_completed": 50}', 750),
('lessons_100', 'Physics Master', 'Complete 100 lessons', '👑', 'mastery', '{"lessons_completed": 100}', 1500),
('subject_master_mechanics', 'Mechanics Master', 'Complete 15 mechanics lessons', '⚙️', 'mastery', '{"subject": "Mechanics", "lessons_completed": 15}', 400),
('subject_master_waves', 'Wave Specialist', 'Complete 15 wave physics lessons', '🌊', 'mastery', '{"subject": "Waves", "lessons_completed": 15}', 400),
('subject_master_electricity', 'Electric Expert', 'Complete 15 electricity lessons', '⚡', 'mastery', '{"subject": "Electricity", "lessons_completed": 15}', 400),
('physics_scholar', 'Physics Scholar', 'Master 3 different physics subjects', '🎓', 'mastery', '{"subjects_mastered": 3}', 800),

-- Persistence Achievements
('streak_3', 'Getting Started', 'Maintain a 3-day learning streak', '🔥', 'persistence', '{"streak_days": 3}', 100),
('streak_7', 'Week Warrior', 'Maintain a 7-day learning streak', '💫', 'persistence', '{"streak_days": 7}', 200),
('streak_30', 'Monthly Master', 'Maintain a 30-day learning streak', '💪', 'persistence', '{"streak_days": 30}', 500),
('streak_100', 'Century Champion', 'Maintain a 100-day learning streak', '🏅', 'persistence', '{"streak_days": 100}', 1000),
('daily_dedication', 'Daily Dedication', 'Study every day for a week', '📅', 'persistence', '{"daily_study_week": true}', 300),
('weekend_warrior', 'Weekend Warrior', 'Complete 10 weekend study sessions', '🥷', 'persistence', '{"weekend_sessions": 10}', 250),
('comeback_kid', 'Comeback Kid', 'Return to studying after a week break', '🔄', 'persistence', '{"comeback_pattern": true}', 200),

-- Accuracy Achievements
('perfectionist', 'Perfect Score', 'Achieve 100% on any lesson', '⭐', 'accuracy', '{"perfect_scores": 1}', 150),
('perfect_master', 'Perfect Master', 'Achieve 100% on 10 lessons', '🌟', 'accuracy', '{"perfect_scores": 10}', 500),
('accuracy_90', 'Precision Master', 'Maintain 90% accuracy over 5+ lessons', '🎯', 'accuracy', '{"accuracy_percentage": 90, "min_lessons": 5}', 300),
('accuracy_95', 'Near Perfect', 'Maintain 95% accuracy over 10+ lessons', '💎', 'accuracy', '{"accuracy_percentage": 95, "min_lessons": 10}', 600),
('improvement_seeker', 'Improvement Seeker', 'Show significant improvement over time', '📈', 'accuracy', '{"improvement_pattern": true}', 250),

-- Speed Achievements
('speed_demon', 'Speed Learner', 'Complete a lesson in under 5 minutes', '⚡', 'speed', '{"fast_completion": 300}', 100),
('lightning_fast', 'Lightning Fast', 'Complete a lesson in under 3 minutes', '🔥', 'speed', '{"fast_completion": 180}', 200),
('efficiency_expert', 'Efficiency Expert', 'Complete 5 lessons quickly', '🚀', 'speed', '{"fast_completions": 5}', 300),

-- Social Achievements
('helper', 'Study Buddy', 'Help 5 fellow students', '🤝', 'social', '{"students_helped": 5}', 200),
('mentor', 'Physics Mentor', 'Help 20 fellow students', '👨‍🏫', 'social', '{"students_helped": 20}', 500),
('community_leader', 'Community Leader', 'Active in study groups', '👑', 'social', '{"group_participation": true}', 300),

-- Special Achievements
('early_bird', 'Early Bird', 'Complete most lessons in the morning', '🌅', 'special', '{"morning_pattern": true}', 150),
('night_owl', 'Night Owl', 'Complete most lessons at night', '🦉', 'special', '{"night_pattern": true}', 150),
('einstein_follower', 'Einstein''s Protégé', 'Demonstrate exceptional physics understanding', '🧠', 'special', '{"exceptional_performance": true}', 1000),
('newton_apprentice', 'Newton''s Apprentice', 'Master classical mechanics concepts', '🍎', 'special', '{"mechanics_mastery": true}', 800),
('quantum_explorer', 'Quantum Explorer', 'Venture into quantum physics', '⚛️', 'special', '{"quantum_topics": true}', 1200)
ON CONFLICT (name) DO NOTHING;

-- Insert league divisions
INSERT INTO league_divisions (name, min_xp_per_week, max_xp_per_week, division_order, icon, color) VALUES
('Electron League', 0, 499, 1, '⚛️', '#6366F1'),
('Proton League', 500, 999, 2, '🔬', '#8B5CF6'),
('Neutron League', 1000, 1999, 3, '⚗️', '#06B6D4'),
('Photon League', 2000, NULL, 4, '💫', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

-- Create function to automatically update streak record updated_at timestamp
CREATE OR REPLACE FUNCTION update_streak_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_student_streaks_updated_at ON student_streaks;
CREATE TRIGGER update_student_streaks_updated_at
    BEFORE UPDATE ON student_streaks
    FOR EACH ROW
    EXECUTE FUNCTION update_streak_updated_at();

-- Create function to automatically update XP record updated_at timestamp
CREATE OR REPLACE FUNCTION update_xp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic XP timestamp updates
DROP TRIGGER IF EXISTS update_student_xp_updated_at ON student_xp;
CREATE TRIGGER update_student_xp_updated_at
    BEFORE UPDATE ON student_xp
    FOR EACH ROW
    EXECUTE FUNCTION update_xp_updated_at();

-- Add comments to tables for documentation
COMMENT ON TABLE student_streaks IS 'Tracks daily learning streaks for gamification';
COMMENT ON TABLE student_xp IS 'Tracks student experience points and levels';
COMMENT ON TABLE xp_transactions IS 'Log of all XP earning and spending activities';
COMMENT ON TABLE achievements IS 'Master list of available achievements/badges';
COMMENT ON TABLE student_achievements IS 'Tracks which achievements each student has earned';
COMMENT ON TABLE daily_quests IS 'Daily micro-challenges for engagement';
COMMENT ON TABLE student_quest_progress IS 'Tracks student progress on daily quests';
COMMENT ON TABLE league_seasons IS 'Weekly competitive league seasons';
COMMENT ON TABLE league_divisions IS 'League divisions based on XP performance';
COMMENT ON TABLE student_league_participation IS 'Student participation in league competitions';
COMMENT ON TABLE study_groups IS 'Student-created study groups for collaboration';
COMMENT ON TABLE study_group_members IS 'Membership records for study groups';
COMMENT ON TABLE activity_feed IS 'Social activity feed for sharing achievements';
COMMENT ON TABLE concept_mastery IS 'Tracks mastery level of physics concepts';
COMMENT ON TABLE review_sessions IS 'Records of spaced repetition review sessions';

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;