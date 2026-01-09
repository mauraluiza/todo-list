-- MIGRATION V5 & V6 Combined
-- FIX RECURSION and FIND ORG

-- --- PART 5: RECURSION FIX ---

-- 1. Helper Function to break RLS Recursion
CREATE OR REPLACE FUNCTION check_task_access_for_participants(_task_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Secure search path
AS $$
BEGIN
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
DROP POLICY IF EXISTS "Org members can view participants" ON task_participants;

CREATE POLICY "Org members can view participants" ON task_participants
    FOR SELECT USING (
        user_id = auth.uid() 
        OR 
        check_task_access_for_participants(task_id)
    );

-- 3. Restore Missing INSERT Policy for Tasks
CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- --- PART 6: FIND ORG BY CODE ---

-- 1. Create a Secure RPC Function to Lookup Org by Code
CREATE OR REPLACE FUNCTION get_org_by_code(p_code TEXT)
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.name
    FROM organizations o
    WHERE o.code = p_code;
END;
$$;
