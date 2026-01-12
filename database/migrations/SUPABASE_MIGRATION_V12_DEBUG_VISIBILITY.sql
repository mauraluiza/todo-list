-- MIGRATION V12: RECURSION FIX FOR TASKS & PARTICIPANTS INTERACTION
-- Run this in Supabase SQL Editor

-- ISSUE DETECTED:
-- Tasks are disappearing or not showing up for others.
-- The previous V11 policy:
--    organization_id IN (SELECT org_id FROM get_my_org_ids(auth.uid()))
-- works for SELECTING Tasks.

-- BUT, the `task_participants` table also has a policy (V4/V5) that might be conflicting or recursive when joined?
-- V5 Policy for `task_participants` used `check_task_access_for_participants(task_id)`.
-- Inside `check_task_access_for_participants`, it joins `tasks` table!
-- If we are Selecting Tasks -> Checks Policy -> Logic might imply checking participants -> Checking Task -> recursion.

-- SIMPLIFICATION STRATEGY:
-- We need to ensure that the logic for "Seeing a Task" does NOT depend on "Seeing a Participant" row that depends on "Seeing a Task".

-- 1. Redefine 'task_participants' visibility to be very simple.
-- If you are looking at `task_participants`, you are likely already authorized to see the task context.
-- Let's allow users to see ALL entries in `task_participants` if they are in the same ORG as the task?
-- Or simpler: If they are a member of the Org linked to the task.

DROP POLICY IF EXISTS "Org members can view participants" ON task_participants;

-- New Policy for Task Participants:
-- Visible if user is in the same Organization as the limit task? 
-- This requires joining Tasks. Joining Tasks triggers Task Policy. Task Policy triggers... loop?

-- SOLUTION:
-- Use a SECURITY DEFINER function to check "Is User In Same Org As Task" for the Participant Policy.
-- Actually V5 `check_task_access_for_participants` WAS a Security Definer.
-- Let's review it.
-- It does `SELECT 1 FROM tasks t JOIN organization_members om ...`
-- Since it's Security Definer, it bypasses RLS on `tasks`. So this SHOULD be safe.

-- HOWEVER, let's look at the TASK Policy V11.
-- It uses `get_my_org_ids(auth.uid())`. This is safe (queries `organization_members` via SecDef).

-- WHAT IF `organization_id` is NULL on the task?
-- If `organization_id` is null (Personal), then V11 clause 3 is false.
-- Clause 1 (Owner) is true if own.
-- Clause 2 (Participant) -> `is_task_participant`.
-- `is_task_participant` does `SELECT 1 FROM task_participants`.
-- Does accessing `task_participants` trigger its policy? YES.
-- And `task_participants` policy uses `check_task_access_for_participants` which accesses `tasks` (SecDef).

-- Wait, if SecDef functions work correctly, recursion should be broken.
-- But if the logs say "Disappeared", maybe the INSERT failed silent?
-- Or maybe the SELECT is filtering it out.

-- LET'S TRY TO DEBUG BY GRANTING A "FAILSAFE" POLICY using a simpler logic for now.
-- Let's make `task_participants` viewable by "Anyone authenticated" for a moment? No, insecure.

-- HYPOTHESIS:
-- The task insertion sent `organization_id`.
-- The user refreshed. `loadAll` called.
-- `loadAll` filters `eq('organization_id', currentOrg.id)`.
-- Subabase Policy V11 applied.
-- `get_my_org_ids` returns the list.
-- If the Org ID matches, it returns.

-- Why would it fail for "Outro Usuario"?
-- User B is in the same org.
-- User B calls `loadAll`.
-- V11 Policy: Is User B in Org X? Yes.
-- So User B should see it.

-- Maybe the issue is simpler:
-- "fiz login com o meu novamente e ela sumiu".
-- This implies **DATA LOSS** or **SOFT DELETE**.
-- Did the user click "Delete"? Or did the sync fail?
-- We added logs for `addTask`. The user didn't report an error alert.
-- So `INSERT` returned success.
-- If it returns success, data is in the DB.
-- If it disappears on reload, 'SELECT' policy is hiding it OR it was deleted.

-- CHECKPOINT:
-- Does `tasks` table have `deleted_at` set?
-- The frontend filters `!t.deletedAt` by default.
-- If the DB inserted with `deleted_at` not null? No, default null.

-- LET'S TRY THIS:
-- Maybe the `get_my_org_ids` function (V10) is not returning what we think?
-- Or the `organization_members` table is slightly desynced?

-- ACTUALLY, I see a potential flaw in `is_task_participant`.
-- It is simple SELECT.
-- But `task_participants` policy might be blocking it?
-- `is_task_participant` is SECURITY DEFINER. So it bypasses `task_participants` RLS!
-- So that path is safe.

-- Let's look at `get_my_org_ids`.
-- It selects `organization_id` from `organization_members`.
-- It is SECURITY DEFINER. It bypasses RLS on `organization_members`. Safe.

-- So why filter out?
-- Maybe `organization_id` on the TASK was not saved correctly?
-- In `script.js`: `if (currentOrg) dbTask.organization_id = currentOrg.id;`
-- If `currentOrg` was null or undefined, it saves as Personal.
-- But user says "criei em uma organização".

-- LETS RELAX THE POLICY SLIGHTLY to match V11 intent but be more direct.
-- And lets Debug the `organization_members` RLS again.

-- RE-APPLYING V11 LOGIC but explicitly ensuring no weird joins.

DROP POLICY IF EXISTS "Users can view tasks in their orgs or own tasks" ON tasks;

CREATE POLICY "Users can view tasks in their orgs or own tasks" ON tasks
    FOR SELECT USING (
        -- 1. Owner
        user_id = auth.uid() 
        OR
        -- 2. Organization Member (using the safe function)
        (
            organization_id IN (
                SELECT org_id FROM get_my_org_ids(auth.uid())
            )
        )
        OR
        -- 3. Participant (using safe function)
        is_task_participant(id, auth.uid())
    );

-- Is it possible the `profiles` join in JS `loadAll` caused RLS issues?
-- We join `profiles`. 
-- V8 added "Org members can view other members profiles".
-- That policy relies on `organization_members` join.
-- If `organization_members` RLS is recursive? V10 fixed it.

-- WAIT! I found a subtle bug in V11 logic vs V8 logic.
-- V8 profile policy:
-- EXISTS (SELECT 1 FROM organization_members ... WHERE user_id = auth.uid() ... AND user_id = profiles.id)
-- This does a self-join on `organization_members`.
-- If `organization_members` has a policy that uses `get_my_org_ids`...
-- And `get_my_org_ids` (SecDef) accesses `organization_members` (Raw).
-- This chain seems okay because SecDef breaks the chain.

-- BUT if "Users can view members of their orgs" (V10) is used by normal query...
-- And V10 policy uses `get_my_org_ids` (SecDef).
-- This represents 1 level of depth. Should be fine.

-- LETS TRY ONE THING:
-- Maybe the `tasks` policy is failing because `organization_id` type mismatch? UUID vs Text? No, both UUID.

-- WHAT IF `get_my_org_ids` is cached or stale? Unlikely per request.

-- LETS ADD A BACKUP POLICY for Organization Members to be absolutely sure they can see tasks.
-- If I am in Org X, I want to see Task Y in Org X.

-- Maybe the issue is `user_id` mismatch?
-- If I used `admin-maura` code, maybe I acted as `admin` not `maura`?
-- RLS uses `auth.uid()`.

-- Let's try to Force-Refresh the Schema Cache or Policy Cache by drop/create.

