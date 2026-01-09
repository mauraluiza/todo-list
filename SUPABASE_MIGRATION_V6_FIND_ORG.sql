-- MIGRATION V6: Fix Find Organization by Code
-- Run this in Supabase SQL Editor

-- The issue: Users cannot look up an Organization by 'code' because they are not members yet.
-- The RLS policy "Users can view their organizations" only allows seeing orgs where they are ALREADY members.
-- We need a way to look up ONLY the ID and Name of an organization given its CODE, for the purpose of joining.

-- 1. Create a Secure RPC Function to Lookup Org by Code
CREATE OR REPLACE FUNCTION get_org_by_code(p_code TEXT)
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with admin privileges, bypassing RLS
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT o.id, o.name
    FROM organizations o
    WHERE o.code = p_code;
END;
$$;
