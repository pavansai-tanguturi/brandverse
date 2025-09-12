-- SQL Commands to Remove Session Storage from Database
-- Run these commands in your Supabase SQL Editor to clean up session tables

-- 1. DROP SESSION TABLE (if it exists)
DROP TABLE IF EXISTS public.session CASCADE;

-- 2. REMOVE ANY SESSION-RELATED INDEXES
DROP INDEX IF EXISTS IDX_session_expire;

-- 3. VERIFY CLEANUP
-- Check if session table still exists (should return no results)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%session%';

-- Note: Session data is now stored in memory only
-- This means sessions will be lost when the server restarts
-- But provides better performance and reduces database load
