-- MIGRATION V29: FIX PARTICIPANTS FK

-- The frontend is failing with "Could not find a relationship between 'todo_participants' and 'profiles'"
-- This disrupts the entire list fetching because it's a critical part of the query.
-- The query is: participants:todo_participants(user:profiles(...))
-- This implies that `todo_participants` has a FK to `profiles` (alias user).
-- Currently, `todo_participants` likely has a FK to `auth.users` via `user_id`.
-- But `profiles` is also keyed by `id` (which is the user_id).
-- PostgREST needs an explicit FK between table A and table B to allow embedding.
-- We must add a FK from `todo_participants.user_id` to `profiles.id`.

-- Check if constraint exists, if not add it.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'todo_participants_user_id_profiles_fkey'
    ) THEN
        ALTER TABLE todo_participants
        ADD CONSTRAINT todo_participants_user_id_profiles_fkey
        FOREIGN KEY (user_id) REFERENCES profiles(id)
        ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;
END $$;
