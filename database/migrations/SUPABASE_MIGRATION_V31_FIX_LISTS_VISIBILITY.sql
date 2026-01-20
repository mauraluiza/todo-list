-- MIGRATION V31: FIX LISTS RLS & VISIBILITY

-- 1. Ensure 'list' table has organization_id (Validation)
-- Note: 'lists' was used in V17.
ALTER TABLE lists ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 2. Enable RLS
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

-- 3. Reset Policies
DROP POLICY IF EXISTS "Owner can manage lists" ON lists;
DROP POLICY IF EXISTS "Org members can view lists" ON lists;
DROP POLICY IF EXISTS "Org members can create lists" ON lists;
-- Drop any potential legacy policies
DROP POLICY IF EXISTS "lists_personal_policy" ON lists;
DROP POLICY IF EXISTS "lists_org_policy" ON lists;

-- 4. Create Correct Policies using V30 helper function 'get_user_org_ids'

-- A. PERSONAL LISTS
-- Only the owner can see lists that have NO organization (Personal Environment)
CREATE POLICY "lists_personal_policy" ON lists
    FOR ALL
    TO authenticated
    USING (
        organization_id IS NULL 
        AND owner_id = auth.uid()
    )
    WITH CHECK (
        organization_id IS NULL 
        AND owner_id = auth.uid()
    );

-- B. ORGANIZATION LISTS
-- Members of the organization can VIEW lists belonging to that organization
CREATE POLICY "lists_org_view" ON lists
    FOR SELECT
    TO authenticated
    USING (
        organization_id IS NOT NULL 
        AND organization_id IN (
            SELECT org_id FROM get_user_org_ids(auth.uid())
        )
    );

-- Members can INSERT/UPDATE/DELETE lists in their organization
-- (For a more restrictive model, we could limit DELETE to admins, 
-- but normally all members can manage lists in this app style)
CREATE POLICY "lists_org_manage" ON lists
    FOR ALL
    TO authenticated
    USING (
        organization_id IS NOT NULL 
        AND organization_id IN (
            SELECT org_id FROM get_user_org_ids(auth.uid())
        )
    )
    WITH CHECK (
        organization_id IS NOT NULL 
        AND organization_id IN (
            SELECT org_id FROM get_user_org_ids(auth.uid())
        )
    );

-- 5. Helper Script to Fix Null Data?
-- If the user wants to "fix" current null lists to be in an org, they must do it manually via SQL.
-- But we can ensure that future queries work.
-- This migration ensures that the API returns the correct lists for the active environment.
