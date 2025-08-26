-- Migration: Add sentiment analysis columns to memories table
-- Sprint 2.2 - Análise de Sentimentos
-- Date: January 2025

-- Add sentiment and confidence columns to memories table
ALTER TABLE memories 
  ADD COLUMN sentiment TEXT CHECK (sentiment IN ('positive','negative','neutral')) DEFAULT 'neutral',
  ADD COLUMN confidence FLOAT DEFAULT 0.0;

-- Create index for better query performance on sentiment filtering
CREATE INDEX idx_memories_sentiment ON memories(sentiment);

-- Update existing memories to have default sentiment values
UPDATE memories 
SET sentiment = 'neutral', confidence = 0.5 
WHERE sentiment IS NULL;

-- Add comment to document the new columns
COMMENT ON COLUMN memories.sentiment IS 'AI-analyzed sentiment: positive, negative, or neutral';
COMMENT ON COLUMN memories.confidence IS 'AI confidence score for sentiment analysis (0.0 to 1.0)';