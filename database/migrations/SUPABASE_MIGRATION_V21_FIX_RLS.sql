-- MIGRATION V21: FIX RLS INFINITE RECURSION
-- The previous policies caused an infinite loop where:
-- Policy "View members" calls get_my_org_ids() -> queries organization_members -> triggers Policy "View members" -> ...
-- Solution: Split policies to allow viewing OWN membership without recursion.

-- 0. Ensure get_my_org_ids exists (Moved to top to prevent "function does not exist" error in policies)
CREATE OR REPLACE FUNCTION get_my_org_ids()
RETURNS TABLE (org_id UUID)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
END;
$$;

-- 1. Organization Members Policies
DROP POLICY IF EXISTS "View members of own orgs" ON organization_members;
DROP POLICY IF EXISTS "Join orgs" ON organization_members;

-- Policy A: View OWN membership (Break recursion base case)
CREATE POLICY "View own membership" ON organization_members
    FOR SELECT USING (user_id = auth.uid());

-- Policy B: View OTHER members in my orgs (Recursive but safe now that base case exists?)
-- Actually, strict recursion still applies if looking at others.
-- But get_my_org_ids() should now succeed because it can match "View own membership" policy for the user's rows
CREATE POLICY "View organization peers" ON organization_members
    FOR SELECT USING (
        organization_id IN (
            -- This function calls organization_members
            -- But it will match "View own membership" policy for the user's rows
            SELECT org_id FROM get_my_org_ids() 
        )
    );

-- Policy C: Join (Insert self)
CREATE POLICY "Join organizations" ON organization_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);
