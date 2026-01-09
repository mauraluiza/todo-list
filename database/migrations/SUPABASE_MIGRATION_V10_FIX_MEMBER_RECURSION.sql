-- MIGRATION V10: FINAL RECURSION FIX FOR MEMBERSHIPS
-- Run this in Supabase SQL Editor

-- THE NEW PROBLEM:
-- Error: "infinite recursion detected in policy for relation \"organization_members\""
-- This happens because the policy "Users can view members of their orgs" does this:
-- SELECT ... FROM organization_members 
-- WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())

-- The subquery `SELECT organization_id FROM organization_members` triggers the SAME policy again! -> Infinite Loop.

-- THE SOLUTION:
-- We need to break the recursion loop for `organization_members` too, just like we did for `tasks` in V7.
-- We will use a SECURITY DEFINER function to reliably check "Is this user a member of Org X?" without triggering RLS.

-- 1. Create Helper Function
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

-- 2. Drop the Recursive Policy
DROP POLICY IF EXISTS "Users can view members of their orgs" ON organization_members;

-- 3. Create Safe Policy
-- This allows users to see ANY row in 'organization_members' IF the 'organization_id' of that row
-- is in the list of Organization IDs that the user belongs to (fetched via secure function).
CREATE POLICY "Users can view members of their orgs" ON organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT org_id FROM get_my_org_ids(auth.uid())
        )
    );

-- Note: The policy "Users can view their own memberships" (WHERE user_id = auth.uid()) is fine and non-recursive.
-- But the "View others" policy was the culprit.
