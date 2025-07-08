-- Add missing columns to lessons table
-- Run this migration in your Supabase SQL editor to fix the PGRST204 error

-- Time limit configuration columns
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS timeLimitEnabled BOOLEAN DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS timeLimitHours INTEGER DEFAULT 0;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS timeLimitMinutes INTEGER DEFAULT 30;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS timeLimitSeconds INTEGER DEFAULT 0;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS showCountdown BOOLEAN DEFAULT true;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS autoSubmit BOOLEAN DEFAULT true;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS warningAlerts BOOLEAN DEFAULT false;

-- Randomization configuration columns
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS shuffleQuestions BOOLEAN DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS shuffleAnswers BOOLEAN DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS enableQuestionPool BOOLEAN DEFAULT false;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS questionPoolSize INTEGER DEFAULT 5;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS difficultyRatios JSONB DEFAULT '{"easy": 30, "medium": 50, "hard": 20}';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS randomizationSeed TEXT DEFAULT '';

-- Quiz mode column
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'test';

-- Add comments for documentation
COMMENT ON COLUMN lessons.timeLimitEnabled IS 'Whether time limit is enabled for this lesson';
COMMENT ON COLUMN lessons.timeLimitHours IS 'Time limit hours component';
COMMENT ON COLUMN lessons.timeLimitMinutes IS 'Time limit minutes component';
COMMENT ON COLUMN lessons.timeLimitSeconds IS 'Time limit seconds component';
COMMENT ON COLUMN lessons.showCountdown IS 'Whether to show countdown timer during quiz';
COMMENT ON COLUMN lessons.autoSubmit IS 'Whether to auto-submit when time limit is reached';
COMMENT ON COLUMN lessons.warningAlerts IS 'Whether to show warning alerts during quiz';
COMMENT ON COLUMN lessons.shuffleQuestions IS 'Whether to shuffle question order';
COMMENT ON COLUMN lessons.shuffleAnswers IS 'Whether to shuffle answer options';
COMMENT ON COLUMN lessons.enableQuestionPool IS 'Whether to use question pool randomization';
COMMENT ON COLUMN lessons.questionPoolSize IS 'Size of question pool when randomization is enabled';
COMMENT ON COLUMN lessons.difficultyRatios IS 'Difficulty distribution ratios for question pool';
COMMENT ON COLUMN lessons.randomizationSeed IS 'Seed for consistent randomization';
COMMENT ON COLUMN lessons.mode IS 'Quiz mode: test, practice, or study';
