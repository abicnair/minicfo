-- Create a table to track per-user, per-mission engagement
CREATE TABLE IF NOT EXISTS user_missions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  kickoff_at TIMESTAMPTZ,
  unlocked_datasets JSONB DEFAULT '[]'::jsonb,
  synced_datasets JSONB DEFAULT '[]'::jsonb,
  credits INTEGER DEFAULT 100,
  PRIMARY KEY (user_id, mission_id)
);

-- Enable Row Level Security
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own mission progress"
ON user_missions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own mission progress"
ON user_missions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
