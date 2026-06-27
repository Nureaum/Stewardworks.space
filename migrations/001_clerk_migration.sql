-- ============================================================
-- MIGRATION: Supabase Auth → Clerk Auth
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This modifies the profiles table to support Clerk user IDs
-- (which are text strings like 'user_2abc...' instead of UUIDs)
-- ============================================================

-- 1. Remove foreign key constraint to auth.users (no longer needed)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Change id column from UUID to TEXT to support Clerk user IDs
ALTER TABLE profiles ALTER COLUMN id TYPE text USING id::text;

-- 3. Disable RLS on profiles table (service role key bypasses RLS anyway,
--    but this prevents issues if RLS policies reference auth.uid())
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 4. Disable RLS on storage.objects for avatars bucket (service role bypasses RLS)
-- Note: Storage RLS is handled separately. Since we now upload via service role key,
-- existing RLS policies won't block us. No changes needed for storage.

-- ============================================================
-- DONE! Your profiles table now accepts Clerk user IDs.
-- ============================================================
