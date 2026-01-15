-- MIGRATION V24: SOFT DELETE (TRASH)
-- Adds columns for soft delete and automatic cleanup logic.

-- 1. ADD COLUMNS
ALTER TABLE todos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 2. CREATE CLEANUP FUNCTION
-- Deletes tasks that have been in trash for more than 30 days.
CREATE OR REPLACE FUNCTION delete_old_trash()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM todos
    WHERE deleted_at < (now() - INTERVAL '30 days');
END;
$$;

-- 3. UPDATED RLS POLICIES (Review)
-- Use existing policies but acknowledge new columns.
-- The existing "org_member_update" and "owner_full_access" should already cover updates to these columns.
-- We do NOT restrict SELECT by deleted_at at the RLS level, because the SAME user needs to see both active and deleted tasks (just in different views).
-- The application (Frontend/Hooks) is responsible for filtering `deleted_at IS NULL` for standard lists.

-- However, we can add a specific index to help with performance
CREATE INDEX IF NOT EXISTS idx_todos_deleted_at ON todos(deleted_at);

-- 4. TRIGGER FOR AUTO-CLEANUP (Optional/Simple Approach)
-- In Supabase/Postgres, we can't easily auto-schedule without pg_cron.
-- We will expose the function to be called via RPC or Cron if enabled.
-- For now, the function `delete_old_trash` is enough.
