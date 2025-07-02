-- Educational Platform Database Schema
-- This file documents the database structure for the educational platform

-- ===== EXISTING TABLES =====

-- Students table (already exists)
-- CREATE TABLE students (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   full_name TEXT NOT NULL,
--   phone_number TEXT UNIQUE NOT NULL,
--   password_hash TEXT NOT NULL,
--   is_approved BOOLEAN DEFAULT FALSE,
--   approved_device_id TEXT,
--   approved_device_fingerprint TEXT,
--   current_session_id TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   approved_at TIMESTAMP WITH TIME ZONE
-- );

-- Lessons table (already exists)
-- CREATE TABLE lessons (
--   id TEXT PRIMARY KEY,
--   title TEXT NOT NULL,
--   color TEXT,
--   created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   lastUpdated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   views INTEGER DEFAULT 0,
--   order INTEGER,
--   subject TEXT,
--   grade TEXT,
--   tags TEXT[],
--   description TEXT,
--   purpose TEXT,
--   pricing TEXT,
--   lessonImage TEXT,
--   randomQuestions BOOLEAN DEFAULT FALSE,
--   content JSONB
-- );

-- Results table (already exists)
-- CREATE TABLE results (
--   id TEXT PRIMARY KEY,
--   lessonId TEXT REFERENCES lessons(id),
--   student_id UUID REFERENCES students(id),
--   questions JSONB,
--   score INTEGER,
--   totalPoints INTEGER,
--   studentInfo JSONB,
--   timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   ipAddress TEXT
-- );

-- Ratings table (already exists)
-- CREATE TABLE ratings (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   student_id UUID REFERENCES students(id) UNIQUE,
--   rating INTEGER DEFAULT 1500,
--   last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Rating history table (already exists)
-- CREATE TABLE rating_history (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   student_id UUID REFERENCES students(id),
--   lesson_id TEXT REFERENCES lessons(id),
--   previous_rating INTEGER,
--   rating_change INTEGER,
--   new_rating INTEGER,
--   performance DECIMAL,
--   time_taken INTEGER,
--   streak INTEGER,
--   timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Quizzes table (already exists)
-- CREATE TABLE quizzes (
--   id TEXT PRIMARY KEY,
--   quiz_data JSONB
-- );

-- Quiz results table (already exists)
-- CREATE TABLE quiz_results (
--   id TEXT PRIMARY KEY,
--   student_id UUID REFERENCES students(id),
--   lessonId TEXT,
--   score INTEGER,
--   totalPoints INTEGER,
--   questions JSONB,
--   timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   ipAddress TEXT
-- );

-- ===== NEW TABLES FOR ENHANCED PROGRESS TRACKING =====

-- Student progress summary table (optional - can be calculated from results)
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) UNIQUE,
  total_lessons_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_score INTEGER DEFAULT 0,
  total_possible_score INTEGER DEFAULT 0,
  accuracy_percentage DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student achievements table
CREATE TABLE IF NOT EXISTS student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  achievement_id TEXT NOT NULL,
  achievement_title TEXT NOT NULL,
  achievement_description TEXT,
  achievement_icon TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, achievement_id)
);

-- Student learning streaks table (detailed streak tracking)
CREATE TABLE IF NOT EXISTS student_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  streak_date DATE NOT NULL,
  lessons_completed INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, streak_date)
);

-- Student mistakes tracking (for review system)
CREATE TABLE IF NOT EXISTS student_mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  lesson_id TEXT REFERENCES lessons(id),
  question_text TEXT,
  user_answer TEXT,
  correct_answer TEXT,
  question_type TEXT DEFAULT 'multiple_choice',
  mistake_count INTEGER DEFAULT 1,
  last_mistake_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lesson completion tracking (detailed completion info)
CREATE TABLE IF NOT EXISTS lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  lesson_id TEXT REFERENCES lessons(id),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score INTEGER,
  total_points INTEGER,
  time_taken INTEGER, -- in seconds
  attempts INTEGER DEFAULT 1,
  UNIQUE(student_id, lesson_id)
);

-- ===== INDEXES FOR PERFORMANCE =====

-- Indexes for existing tables (if not already present)
CREATE INDEX IF NOT EXISTS idx_results_student_id ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_lesson_id ON results(lessonId);
CREATE INDEX IF NOT EXISTS idx_results_timestamp ON results(timestamp);
CREATE INDEX IF NOT EXISTS idx_ratings_student_id ON ratings(student_id);
CREATE INDEX IF NOT EXISTS idx_rating_history_student_id ON rating_history(student_id);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_achievements_student_id ON student_achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_student_streaks_student_id ON student_streaks(student_id);
CREATE INDEX IF NOT EXISTS idx_student_streaks_date ON student_streaks(streak_date);
CREATE INDEX IF NOT EXISTS idx_student_mistakes_student_id ON student_mistakes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_mistakes_lesson_id ON student_mistakes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_student_id ON lesson_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson_id ON lesson_completions(lesson_id);

-- ===== FUNCTIONS AND TRIGGERS =====

-- Function to update student progress summary
CREATE OR REPLACE FUNCTION update_student_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_progress (student_id, total_lessons_completed, last_activity_date, total_score, total_possible_score, updated_at)
  VALUES (
    NEW.student_id,
    1,
    CURRENT_DATE,
    NEW.score,
    NEW.totalPoints,
    NOW()
  )
  ON CONFLICT (student_id) DO UPDATE SET
    total_lessons_completed = student_progress.total_lessons_completed + 1,
    last_activity_date = CURRENT_DATE,
    total_score = student_progress.total_score + NEW.score,
    total_possible_score = student_progress.total_possible_score + NEW.totalPoints,
    accuracy_percentage = CASE 
      WHEN (student_progress.total_possible_score + NEW.totalPoints) > 0 
      THEN ((student_progress.total_score + NEW.score)::DECIMAL / (student_progress.total_possible_score + NEW.totalPoints)) * 100
      ELSE 0 
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update progress when results are inserted
CREATE TRIGGER trigger_update_student_progress
  AFTER INSERT ON results
  FOR EACH ROW
  EXECUTE FUNCTION update_student_progress();

-- ===== SAMPLE DATA QUERIES =====

-- Query to get student progress overview
-- SELECT 
--   s.full_name,
--   sp.total_lessons_completed,
--   sp.current_streak,
--   sp.accuracy_percentage,
--   sp.last_activity_date
-- FROM students s
-- LEFT JOIN student_progress sp ON s.id = sp.student_id
-- WHERE s.id = $1;

-- Query to get student achievements
-- SELECT 
--   achievement_title,
--   achievement_description,
--   achievement_icon,
--   earned_at
-- FROM student_achievements
-- WHERE student_id = $1
-- ORDER BY earned_at DESC;

-- Query to get learning statistics
-- SELECT 
--   COUNT(*) as total_lessons,
--   AVG(score) as average_score,
--   SUM(score) as total_score,
--   COUNT(DISTINCT DATE(timestamp)) as active_days
-- FROM results
-- WHERE student_id = $1
--   AND timestamp >= NOW() - INTERVAL '30 days';
