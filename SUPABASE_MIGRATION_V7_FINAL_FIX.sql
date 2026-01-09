-- MIGRATION V7: FINAL FIX - Break Recursion by Simplifying Task Policy
-- Run this in Supabase SQL Editor

-- THE PROBLEM:
-- The policy "Users can access tasks they own or participate in" checks the 'task_participants' table.
-- The policy on 'task_participants' checks the 'tasks' table (via function or direct).
-- Even with the Security Definer function, complex joins can sometimes still trigger recursion checks in Postgres 15+ if RLS is heavy.

-- THE SOLUTION:
-- Decouple the check. 
-- 1. Tasks are visible if:
--    a) auth.uid() == user_id (OWNER)
--    b) auth.uid() is in task_participants for this task.
-- 
-- 2. Participants are visible if:
--    a) user_id == auth.uid() (Viewing self)
--    b) The TASK they belong to is visible? -> RECURSION.

-- SIMPLIFIED APPROACH:
-- Let participants be visible if the user is a member of the SAME ORGANIZATION as the participant entry implies?
-- No, that's too broad.

-- ROBUST FIX:
-- Redefine Task Policy to NOT rely on complex joins if possible, or force Materialized path.
-- But actually, the previous V5 function "check_task_access_for_participants" was meant to fix reading *participants*.
-- The error is now on *TASKS*.

-- Let's fix the TASK policy "Users can access tasks they own or participate in".

DROP POLICY IF EXISTS "Users can access tasks they own or participate in" ON tasks;
DROP POLICY IF EXISTS "Users can edit tasks they own or participate in" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;

-- 1. INSERT (Simple)
CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. SELECT (The tricky one)
-- Instead of a subquery that might be analyzed recursively, let's use a DIRECT LEFT JOIN check logic or a Function.
-- Let's create a SECURITY DEFINER function to check if a user is a participant of a task.
-- This hides the lookup from RLS engine's recursion detector.

CREATE OR REPLACE FUNCTION is_task_participant(_task_id BIGINT, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM task_participants
        WHERE task_id = _task_id AND user_id = _user_id
    );
END;
$$;

CREATE POLICY "Users can access tasks they own or participate in" ON tasks
    FOR SELECT USING (
        user_id = auth.uid() -- Owner
        OR
        is_task_participant(id, auth.uid()) -- Participant (Safe Function)
    );

-- 3. UPDATE
CREATE POLICY "Users can edit tasks they own or participate in" ON tasks
    FOR UPDATE USING (
        user_id = auth.uid() 
        OR
        is_task_participant(id, auth.uid())
    );

-- 4. DELETE (Owner only)
-- No change needed if "Only owner can delete tasks" is still active.
-- Just in case:
DROP POLICY IF EXISTS "Only owner can delete tasks" ON tasks;
CREATE POLICY "Only owner can delete tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);
