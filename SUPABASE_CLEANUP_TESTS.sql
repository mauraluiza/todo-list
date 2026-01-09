-- MIGRATION: CLEANUP TEST TASKS
-- Run this in Supabase SQL Editor to delete test data

-- Deletes all tasks containing 'teste' (case insensitive) in the title.
DELETE FROM tasks
WHERE title ILIKE '%teste%';
