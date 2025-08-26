-- Create achievements table for user gamification
CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('primeira_memoria', 'reflexivo', 'nostalgico', 'explorador')),
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient user queries
CREATE INDEX idx_achievements_user_id ON achievements(user_id);

-- Create unique constraint to prevent duplicate achievements per user
CREATE UNIQUE INDEX idx_achievements_user_type ON achievements(user_id, achievement_type);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own achievements" ON achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements" ON achievements
  FOR INSERT WITH CHECK (true);

-- Grant permissions to authenticated users
GRANT SELECT ON achievements TO authenticated;
GRANT INSERT ON achievements TO authenticated;

-- Grant permissions to anon users (for public viewing if needed)
GRANT SELECT ON achievements TO anon;