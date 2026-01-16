-- MIGRATION V27: FIX RECURSION

-- 1. FIX INFINITE RECURSION IN ORGANIZATION_MEMBERS
-- The error "infinite recursion detected in policy" happens because the policy:
-- "Members can view other members" selects from organization_members within its check.
-- We must break the recursion by ensuring the inner select does NOT use the same policy check or uses a different mechanism.

-- The problematic policy was:
-- organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())

-- When checking row X in table OM, it runs the query.
-- The subquery selects from OM. 
-- The subquery triggers the policy again.
-- Recursion.

-- FIX: We can use a SECURITY DEFINER function to fetch my org IDs, bypassing RLS for that specific lookup.
-- OR we can rely on a simpler policy if Supabase supports it, but Function is safest for recursion.

CREATE OR REPLACE FUNCTION get_user_org_ids(uid uuid)
RETURNS TABLE (org_id UUID)
LANGUAGE sql SECURITY DEFINER
AS $$
    SELECT organization_id FROM organization_members WHERE user_id = uid;
$$;

DROP POLICY IF EXISTS "Members can view other members" ON organization_members;
CREATE POLICY "Members can view other members" ON organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT org_id FROM get_user_org_ids(auth.uid())
        )
    );

-- Also fix "View members of own orgs" if it exists from V16, as it might conflict or duplicate.
DROP POLICY IF EXISTS "View members of own orgs" ON organization_members;


-- 2. FIX PENDING FOREIGN KEY ISSUE (PGRST200)
-- "Could not find a relationship between 'todos' and 'profiles'"
-- This means Supabase PostgREST cache is stale OR the FK doesn't strictly exist on the `todos` table pointing to `profiles`.
-- The `todos` table has `user_id` pointing to `auth.users`.
-- `profiles` also has `id` pointing to `auth.users`.
-- They are effectively 1:1.
-- However, PostgREST needs an explicit Foreign Key to join them via `!todos_user_id_fkey` hint if we use that hint.

-- Actually, `todos.user_id` references `auth.users`. `profiles.id` references `auth.users`.
-- Standard practice: Add a FK from todos.user_id to profiles.id? NO, that creates double constraint.
-- Better: Rely on the view or change the query hint.
-- The error says: "using the hint 'todos_user_id_fkey'". 
-- This hint refers to the constraint name in the database.
-- The constraint on `todos` is likely `todos_user_id_fkey` -> `auth.users`.
-- But we are trying to join `profiles`.
-- PostgREST can join tables if they share a FK. 
-- Since `profiles.id` IS the PK, and `todos.user_id` is a FK to `auth.users`, there is no direct FK from `todos` to `profiles`.

-- SOLUTION: creating a Foreign Key from todos to profiles is messy.
-- EASIER: The query in frontend uses `creator:profiles!todos_user_id_fkey(...)`. 
-- This syntax FORCES Supabase to look for a FK named `todos_user_id_fkey` between `todos` and `profiles`.
-- But that FK connects `todos` and `auth.users`.
-- We should remove the explicit hint if it's wrong, OR create a virtual relationship, OR simplisticly...
-- We can add a FK from todos.user_id to profiles.id IF we want strong integrity, but `auth.users` is the source of truth.

-- TRICK: We can just let the query join on `user_id` = `id` without the hint if we remove the hint from the JS code, OR we can add the constraint.
-- Adding the constraint is robust for ensuring profile existence.

ALTER TABLE todos
    DROP CONSTRAINT IF EXISTS todos_user_id_profile_fkey;

-- We can't easily add a second FK on the same column to a different table in standard SQL without overlap issues usually, 
-- but Postgres allows it.
-- Let's try to add it.
ALTER TABLE todos
    ADD CONSTRAINT todos_user_id_profile_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- Now the frontend can use `!todos_user_id_profile_fkey` or just let Supabase discover it.
