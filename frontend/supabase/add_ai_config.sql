-- Add ai_config column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_config JSONB DEFAULT '{}'::jsonb;

-- Ensure RLS allows updates to this column (already covered by existing policies)
COMMENT ON COLUMN public.profiles.ai_config IS 'User-specific AI configurations including API keys.';
