-- MIGRATION V5: Fix Infinite Recursion & Restore Insert
-- Run this in Supabase SQL Editor

-- 1. Helper Function to break RLS Recursion
-- This function checks if the current user has access to a task's organization context.
-- It works as SECURITY DEFINER, bypassing RLS on the 'tasks' table when reading it, preventing the loop.
CREATE OR REPLACE FUNCTION check_task_access_for_participants(_task_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Secure search path
AS $$
BEGIN
    -- Check if user is in the same organization as the task
    -- OR if the task has no organization (personal) - though sharing usually implies org.
    -- We'll assume sharing is Org-only feature.
    RETURN EXISTS (
        SELECT 1
        FROM tasks t
        JOIN organization_members om ON t.organization_id = om.organization_id
        WHERE t.id = _task_id
        AND om.user_id = auth.uid()
    );
END;
$$;

-- 2. Update Policy for Task Participants
-- Drop the policy causing recursion
DROP POLICY IF EXISTS "Org members can view participants" ON task_participants;

-- Create new policy using the function
CREATE POLICY "Org members can view participants" ON task_participants
    FOR SELECT USING (
        -- User can see their own participation
        user_id = auth.uid() 
        OR 
        -- User is in the task's organization (Recursion Safe)
        check_task_access_for_participants(task_id)
    );

-- 3. Restore Missing INSERT Policy for Tasks
-- V4 dropped the "ALL" policy and didn't replace the INSERT part for normal users.
CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );
