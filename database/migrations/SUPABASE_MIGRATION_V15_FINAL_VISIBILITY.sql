-- MIGRATION V15: CONSOLIDATED VISIBILITY REPAIR (FULL & SELF-CONTAINED)
-- Run this in Supabase SQL Editor

-- 1. HELPER FUNCTION (Ensuring it exists for the policies below)
-- This function securely fetches the list of organizations a user belongs to.
CREATE OR REPLACE FUNCTION get_my_org_ids(_user_id UUID)
RETURNS TABLE (org_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT organization_id
    FROM organization_members
    WHERE user_id = _user_id;
END;
$$;

-- 2. HELPER FUNCTION FOR PARTICIPANTS
-- This function securely checks if a user is a participant.
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

-- 3. CLEANUP: Drop ALL policies on tasks to start fresh
DROP POLICY IF EXISTS "Users can access tasks they own or participate in" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks in their orgs or own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can edit tasks they own or participate in" ON tasks;
DROP POLICY IF EXISTS "Users can see own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can see tasks they participate in" ON tasks;
DROP POLICY IF EXISTS "Users can see tasks in their orgs" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Participants can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Only owner can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Owner can see" ON tasks;
DROP POLICY IF EXISTS "Participant can see" ON tasks;
DROP POLICY IF EXISTS "Org member can see" ON tasks;
DROP POLICY IF EXISTS "Owner can update" ON tasks;
DROP POLICY IF EXISTS "Participant can update" ON tasks;
DROP POLICY IF EXISTS "Owner can delete" ON tasks;

-- 4. INSERT POLICY
CREATE POLICY "Owner can insert" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. SELECT POLICIES
-- A. Owner Visibility (Always guaranteed)
CREATE POLICY "Owner can see" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

-- B. Participant Visibility (Using Safe Function)
CREATE POLICY "Participant can see" ON tasks
    FOR SELECT USING (is_task_participant(id, auth.uid()));

-- C. Organization Visibility (Using Safe Function)
-- This allows you to see tasks linked to your organisations.
CREATE POLICY "Org member can see" ON tasks
    FOR SELECT USING (
        organization_id IS NOT NULL 
        AND 
        organization_id IN (SELECT org_id FROM get_my_org_ids(auth.uid()))
    );

-- 6. UPDATE POLICIES
CREATE POLICY "Owner can update" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Participant can update" ON tasks
    FOR UPDATE USING (is_task_participant(id, auth.uid()));

-- 7. DELETE POLICY
CREATE POLICY "Owner can delete" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- 8. ENSURE GRANTS
GRANT ALL ON tasks TO authenticated;
GRANT ALL ON tasks TO service_role;
