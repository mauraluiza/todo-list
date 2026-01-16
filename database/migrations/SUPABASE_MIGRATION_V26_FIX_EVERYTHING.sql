-- MIGRATION V26: FIX CRITICAL BUGS (PARTICIPANTS & VISIBILITY)

-- 1. BACKFILL PROFILES (Fixes "Cannot add participant" constraint error)
-- We need to ensure every user in auth.users has a matching profile.
-- This requires permissions usually available in the SQL Editor.
INSERT INTO public.profiles (id, email)
SELECT id, email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. LOOSEN CONSTRAINT (Safety Net)
-- Change todo_participants to reference auth.users directly, not profiles.
-- This prevents the "FK Violation" even if a profile is missing (though backfill helps).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'todo_participants_user_id_fkey'
    ) THEN
        ALTER TABLE todo_participants DROP CONSTRAINT todo_participants_user_id_fkey;
    END IF;
END $$;

ALTER TABLE todo_participants
    ADD CONSTRAINT todo_participants_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;


-- 3. REFRESH RLS ON ORGANIZATION MEMBERS (Fixes "No users found")
-- Ensure members can see each other.
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view other members" ON organization_members;
CREATE POLICY "Members can view other members" ON organization_members
    FOR SELECT USING (
        -- I can see rows where the org_id is one of MY orgs
        organization_id IN (
            SELECT organization_id 
            FROM organization_members as my_memberships
            WHERE my_memberships.user_id = auth.uid()
        )
    );

-- 4. REFRESH RLS ON TODOS (Fixes "Created task not visible")
-- Explicitly allow Org View.
DROP POLICY IF EXISTS "org_member_view" ON todos;
CREATE POLICY "org_member_view" ON todos
    FOR SELECT USING (
        organization_id IS NOT NULL AND
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Ensure Org Insert is allowed
DROP POLICY IF EXISTS "org_member_insert" ON todos;
CREATE POLICY "org_member_insert" ON todos
    FOR INSERT WITH CHECK (
        organization_id IS NOT NULL AND
        organization_id IN (
            SELECT organization_id 
            FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );
