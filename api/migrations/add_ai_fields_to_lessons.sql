-- Add AI-related fields to lessons table
-- Run this migration in your Supabase SQL editor

-- Add AI summary field
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Add AI image prompt field
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS ai_image_prompt TEXT;

-- Add flag to indicate if image was auto-generated
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS auto_generated_image BOOLEAN DEFAULT FALSE;

-- Add timestamp for when AI summary was generated
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMP;

-- Add timestamp for when AI image was generated
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS ai_image_generated_at TIMESTAMP;

-- Create index for lessons without AI summaries (for bulk generation)
CREATE INDEX IF NOT EXISTS idx_lessons_missing_ai_summary 
ON lessons(id) 
WHERE (description IS NULL OR description = '') AND ai_summary IS NULL;

-- Create AI interactions history table
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- 'chat', 'explanation', 'practice', 'summary', 'image'
  request TEXT NOT NULL,
  response TEXT,
  tokens_used INTEGER,
  model_used VARCHAR(50) DEFAULT 'gemini-2.5-flash',
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB -- Additional data like lesson_id, error info, etc.
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_ai_interactions_student_id ON ai_interactions(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_type ON ai_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at);

-- Create AI insights cache table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'student', 'lesson', 'class'
  entity_id UUID NOT NULL,
  insight_type VARCHAR(100) NOT NULL, -- 'performance_analysis', 'recommendation', 'summary'
  insights JSONB NOT NULL,
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for insights
CREATE INDEX IF NOT EXISTS idx_ai_insights_entity ON ai_insights(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_expires ON ai_insights(expires_at) WHERE is_active = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN lessons.ai_summary IS 'AI-generated summary of the lesson content';
COMMENT ON COLUMN lessons.ai_image_prompt IS 'Prompt used to generate the lesson image';
COMMENT ON COLUMN lessons.auto_generated_image IS 'Flag indicating if the lesson image was AI-generated';
COMMENT ON TABLE ai_interactions IS 'History of all AI interactions for tracking and analytics';
COMMENT ON TABLE ai_insights IS 'Cached AI-generated insights and analytics';