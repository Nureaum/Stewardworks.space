-- Add audio_url column to session_quotes table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

ALTER TABLE session_quotes 
ADD COLUMN IF NOT EXISTS audio_url TEXT DEFAULT NULL;

-- Optional: Create an index for quick lookups of quotes with audio
CREATE INDEX IF NOT EXISTS idx_session_quotes_has_audio 
ON session_quotes (session_id) 
WHERE audio_url IS NOT NULL;
