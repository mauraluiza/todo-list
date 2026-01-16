-- MIGRATION V28: FIX TASK VISIBILITY RECURSION

-- The user reports tasks are being saved but are invisible.
-- This is likely a Recursion issue in the TODOS policy similar to the one we fixed in organization_members.
-- The policy "org_member_view" selects from organization_members.
-- If selecting from organization_members triggers a check that selects from organization_members... we might still have issues,
-- BUT we fixed OM recursion.
-- HOWEVER, let's look at the TODO policy in V26:
-- "organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())"

-- If for some reason the RLS on OM blocks this subquery, todos won't show.
-- But we fixed OM RLS.

-- Another possibility: The SECURITY DEFINER function `get_user_org_ids` we created in V27 is safer.
-- We should use THAT function in the TODOS policy as well to be absolutely sure we are bypassing any weird RLS states when checking permission.

-- Also, verify PERSONAL tasks visibility. 
-- In V23, "owner_full_access" was: using (auth.uid() = user_id). This is fine.

-- Let's update `org_member_view` and `org_member_insert` on `todos` to use the helper function.

DROP POLICY IF EXISTS "org_member_view" ON todos;
CREATE POLICY "org_member_view" ON todos
    FOR SELECT USING (
        organization_id IS NOT NULL AND
        organization_id IN (
            SELECT org_id FROM get_user_org_ids(auth.uid())
        )
    );

DROP POLICY IF EXISTS "org_member_insert" ON todos;
CREATE POLICY "org_member_insert" ON todos
    FOR INSERT WITH CHECK (
        organization_id IS NOT NULL AND
        organization_id IN (
            SELECT org_id FROM get_user_org_ids(auth.uid())
        )
    );

-- Also update UPDATE/DELETE just in case
DROP POLICY IF EXISTS "org_member_update" ON todos;
CREATE POLICY "org_member_update" ON todos
    FOR UPDATE USING (
        organization_id IS NOT NULL AND
        organization_id IN (
            SELECT org_id FROM get_user_org_ids(auth.uid())
        )
    );

DROP POLICY IF EXISTS "org_member_delete" ON todos;
CREATE POLICY "org_member_delete" ON todos
    FOR DELETE USING (
        organization_id IS NOT NULL AND
        organization_id IN (
            SELECT org_id FROM get_user_org_ids(auth.uid())
        )
    );
