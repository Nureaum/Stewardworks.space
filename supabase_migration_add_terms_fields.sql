-- Migration: Add terms acceptance fields to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS terms_signature TEXT DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN profiles.terms_accepted_at IS 'Timestamp when user accepted the Site Notice & Terms of Participation';
COMMENT ON COLUMN profiles.terms_signature IS 'Digital signature (full name) provided when accepting terms';
