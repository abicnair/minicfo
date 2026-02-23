-- Add mission_kickoff_at column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mission_kickoff_at TIMESTAMPTZ;

-- Commentary: This column will store the timestamp when the analyst first 
-- successfully connects their GCP account.
