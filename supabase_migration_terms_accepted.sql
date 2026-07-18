-- Migration: Add terms_accepted_at column to profiles table
-- Run this in your Supabase SQL editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL;

-- Optional: Add a comment for clarity
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Timestamp when user accepted the Site Notice & Terms of Participation';
