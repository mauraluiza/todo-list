-- MIGRATION V23: FIX RLS POLICIES
-- Ensure definitive access control for Personal and Organization tasks.

-- 1. ENABLE RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 2. RESET POLICIES
DROP POLICY IF EXISTS "ALL_ACCESS_OWNER" ON todos;
DROP POLICY IF EXISTS "VIEW_ORG_MEMBER" ON todos;
DROP POLICY IF EXISTS "owner_manage_own_tasks" ON todos;
DROP POLICY IF EXISTS "org_members_view_tasks" ON todos;
DROP POLICY IF EXISTS "org_members_create_tasks" ON todos;
DROP POLICY IF EXISTS "org_members_update_tasks" ON todos;

-- 3. POLICY: PERSONAL / OWNER ACCESS
-- Full access to tasks where the user is the 'user_id' (Creator/Owner)
CREATE POLICY "owner_full_access" ON todos
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. POLICY: ORGANIZATION READ ACCESS
-- Members can VIEW tasks in their organizations
CREATE POLICY "org_member_view" ON todos
FOR SELECT
TO authenticated
USING (
    organization_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = todos.organization_id 
        AND user_id = auth.uid()
    )
);

-- 5. POLICY: ORGANIZATION WRITE ACCESS (Optional, assuming members can Create/Edit)
-- Members can INSERT tasks into their organizations
CREATE POLICY "org_member_insert" ON todos
FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = todos.organization_id 
        AND user_id = auth.uid()
    )
);

-- Members can UPDATE tasks in their organizations
CREATE POLICY "org_member_update" ON todos
FOR UPDATE
TO authenticated
USING (
    organization_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = todos.organization_id 
        AND user_id = auth.uid()
    )
);

-- Members can DELETE tasks in their organizations? (Usually Admin or Owner, but for simplicity allowing members)
CREATE POLICY "org_member_delete" ON todos
FOR DELETE
TO authenticated
USING (
    organization_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = todos.organization_id 
        AND user_id = auth.uid()
    )
);
