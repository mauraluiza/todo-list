-- MIGRATION V32: IMPLEMENT ROLE BASED PERMISSIONS
-- Objectives:
-- 1. Secure UPDATE/DELETE on todos based on Creator/Admin/Participant roles.
-- 2. Secure INSERT/DELETE on todo_participants (Manage participants).

-- Helper: Get Todo Details securely to avoid RLS recursion
CREATE OR REPLACE FUNCTION get_todo_security_info(_todo_id BIGINT)
RETURNS TABLE (t_owner_id UUID, t_org_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT user_id, organization_id FROM todos WHERE id = _todo_id;
END;
$$;

-- Helper: Check if user is Org Admin
CREATE OR REPLACE FUNCTION is_org_admin(_org_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = _org_id AND user_id = _user_id AND role IN ('admin', 'owner')
    );
END;
$$;

-- UPDATE POLICY FOR TODOS
-- Allowed: Creator OR Org Admin OR Participant
DROP POLICY IF EXISTS "org_member_update" ON todos;
CREATE POLICY "org_member_update" ON todos
    FOR UPDATE
    TO authenticated
    USING (
        -- 1. Personal Task Owner
        (organization_id IS NULL AND user_id = auth.uid())
        OR
        -- 2. Organization Logic
        (
            organization_id IS NOT NULL 
            AND (
                -- Creator
                user_id = auth.uid()
                OR
                -- Admin
                is_org_admin(organization_id, auth.uid())
                OR
                -- Participant (Explicit check on todo_participants table)
                EXISTS (
                    SELECT 1 FROM todo_participants 
                    WHERE todo_id = todos.id AND user_id = auth.uid()
                )
            )
        )
    );

-- DELETE POLICY FOR TODOS
-- Allowed: Creator OR Org Admin
DROP POLICY IF EXISTS "org_member_delete" ON todos;
CREATE POLICY "org_member_delete" ON todos
    FOR DELETE
    TO authenticated
    USING (
        -- 1. Personal Task Owner
        (organization_id IS NULL AND user_id = auth.uid())
        OR
        -- 2. Organization Logic
        (
            organization_id IS NOT NULL 
            AND (
                -- Creator
                user_id = auth.uid()
                OR
                -- Admin
                is_org_admin(organization_id, auth.uid())
            )
        )
    );

-- POLICIES FOR TODO_PARTICIPANTS
-- Only Creator or Admin can Manage (Add/Remove) Partners
DROP POLICY IF EXISTS "manage_participants" ON todo_participants;

-- INSERT
CREATE POLICY "manage_participants_insert" ON todo_participants
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM get_todo_security_info(todo_id) t
            WHERE 
                -- Actor is Creator of the Todo
                t.t_owner_id = auth.uid()
                OR
                -- Actor is Admin of the Todo's Org
                (t.t_org_id IS NOT NULL AND is_org_admin(t.t_org_id, auth.uid()))
        )
    );

-- DELETE
CREATE POLICY "manage_participants_delete" ON todo_participants
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM get_todo_security_info(todo_id) t
            WHERE 
                -- Actor is Creator of the Todo
                t.t_owner_id = auth.uid()
                OR
                -- Actor is Admin of the Todo's Org
                (t.t_org_id IS NOT NULL AND is_org_admin(t.t_org_id, auth.uid()))
        )
    );
