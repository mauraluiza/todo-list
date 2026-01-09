-- MIGRATION V8: FIX VISIBILITY ISSUES
-- Run this in Supabase SQL Editor

-- ISSUE 1: Users not seeing EACH OTHER in the list.
-- This is likely because `get_org_members` joins with `auth.users` and `profiles`.
-- If RLS is enabled on `profiles` (which it is), users might only be able to see their OWN profile.
-- We need to open up `profiles` visibility for members of the same organization.

CREATE POLICY "Org members can view other members profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members om_me
            JOIN organization_members om_them ON om_me.organization_id = om_them.organization_id
            WHERE om_me.user_id = auth.uid() -- I am in the org
            AND om_them.user_id = profiles.id -- They are in the same org
        )
    );

-- ISSUE 2: Users not seeing TASKS of the organization.
-- The current task policy (V7) only allows: Owner OR Participant.
-- But usually, in an organization, you expect to see tasks assigned to the organization, OR at least have a way to see "Open Tasks".
-- HOWEVER, based on requirements: "compartilhado... deve aparecer no ambiente de ambos".
-- Assuming "Private by Default" logic:
-- If the logic is "Owner + Shared Only", then V7 is correct technically.
-- BUT, if you say "so 1 visualiza as tasks", maybe the other user IS NOT a participant yet?
-- Or maybe the `organization_id` is missing?

-- Wait, the `get_org_members` works as SECURITY DEFINER, so it *should* bypass profile RLS.
-- Let's check `get_org_members` again.
-- It joins `auth.users`. `auth.users` is usually safe to read in SECURITY DEFINER, but `auth.users` is not a public table.
-- The function returns `email`. By default, Supabase might not expose `auth.users` select even to security definer functions owned by postgres? No, postgres owner can do anything.
-- BUT, if the function is created by a user who is not superuser, it might fail? No, usually fine.

-- Let's try to debug `get_org_members`.
-- If `profiles` row doesn't exist for the user (because they didn't finish profile setup), LEFT JOIN should handle it.
-- BUT, `organization_members` insert might have failed silently in previous steps if RLS was blocking?

-- Let's ensure `organization_members` policies are correct.
-- We only had "Users can join orgs" (INSERT).
-- Do we have SELECT policy for `organization_members`?
-- If a user cannot SEE that they are a member, the helper checks `IF NOT EXISTS` might fail?
-- "IF NOT EXISTS (SELECT 1 FROM organization_members ...)" -> If I can't SELECT my own membership, this returns false!

CREATE POLICY "Users can view their own memberships" ON organization_members
    FOR SELECT USING (user_id = auth.uid());
    
-- And maybe view other members of the same org?
CREATE POLICY "Users can view members of their orgs" ON organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

-- Also, let's make sure the Task Policy V7 didn't accidentally exclude Organization logic entirely.
-- V7: `user_id = auth.uid() OR is_task_participant(...)`
-- This means "Private tasks" logic.
-- If you want "Organization Wide Visibility" (anyone in org sees all tasks), that's different.
-- The requirement said "o usuario... pode selecionar outros usuarios... quando a tarefa for compartilhada, ela deve aparecer...".
-- This implies Private by default, visible only to selected.
-- So if User B doesn't see tasks, it's because they were NOT shared with User B, OR User B is not creating them.
-- If User B creates a task, User A shouldn't see it unless shared.
-- If this is working as intended, then checks are fine.

-- BUT "não aparece outros membros da organização":
-- This confirms Issue 1/2 regarding `organization_members` SELECT policy.
-- The `get_org_members` RPC does `SECURITY DEFINER`, so it bypasses policies.
-- So why implies list is empty?
-- Maybe `organization_members` table is empty for them?
-- Did the "Join" flow actually work?
-- Please verify `organization_members` table content in Supabase Dashboard.

-- Assuming `get_org_members` is fine, maybe the UI is failing to render?
-- Let's assume the issue is related to `organization_members` visibility for client-side checks OR the RPC not returning data properly.
-- Actually, we added logs in previous step.
-- If the user says "não aparece", the RPC returned empty list?

-- Let's be safe and apply the RLS fixes for `organization_members` and `profiles` just in case the UI or other parts rely on them directly (standard queries).

-- RE-APPLYING correct grants.
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;

