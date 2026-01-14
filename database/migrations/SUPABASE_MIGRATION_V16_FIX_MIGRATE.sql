-- MIGRATION V16 FIX: HANDLE BIGINT LEGACY TASKS
-- Run this to fix the ID error and complete migration.

-- 1. FIX TASKS TABLE ID (Handle Legacy BIGINT Structure)
DO $$
DECLARE
    col_type text;
BEGIN
    -- Check type of 'id' in 'tasks'
    SELECT data_type INTO col_type 
    FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'id';

    IF col_type = 'bigint' THEN
        -- It is BIGINT. Ensure it has a sequence/identity.
        -- We create a sequence manually to be safe and bind it.
        EXECUTE 'CREATE SEQUENCE IF NOT EXISTS tasks_id_seq_fix START 1';
        
        -- Only set default if it's currently null or doesn't have one (simplification: just set it)
        -- We use dynamic SQL to avoid parser errors if table structure differs in some way
        EXECUTE 'ALTER TABLE tasks ALTER COLUMN id SET DEFAULT nextval(''tasks_id_seq_fix'')';
        
        -- Sync sequence with max id just in case there's data
        EXECUTE 'SELECT setval(''tasks_id_seq_fix'', COALESCE((SELECT MAX(id) FROM tasks), 1))';
        
    ELSIF col_type = 'uuid' THEN
        -- It is UUID. Ensure validation.
        EXECUTE 'ALTER TABLE tasks ALTER COLUMN id SET DEFAULT gen_random_uuid()';
    END IF;
END $$;

-- 2. ENSURE OTHER COLUMNS EXIST (If table was old)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. RETRY DATA MIGRATION: TODOS -> TASKS
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'todos') THEN
        INSERT INTO tasks (title, description, status, priority, user_id, created_at, organization_id)
        SELECT 
            title,
            description,
            status,
            priority,
            owner_id, 
            created_at,
            NULL -- Personal
        FROM todos
        WHERE NOT EXISTS (
            SELECT 1 FROM tasks WHERE tasks.title = todos.title AND tasks.user_id = todos.owner_id
        );
    END IF;
END $$;

-- 4. VERIFY & FIX RLS (Re-run ensures safety)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ALL_ACCESS_OWNER" ON tasks;
DROP POLICY IF EXISTS "VIEW_ORG_MEMBER" ON tasks;
DROP POLICY IF EXISTS "VIEW_EDIT_PARTICIPANT" ON tasks;

CREATE POLICY "ALL_ACCESS_OWNER" ON tasks FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION get_my_org_ids_fix() RETURNS TABLE (org_id UUID) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN RETURN QUERY SELECT organization_id FROM organization_members WHERE user_id = auth.uid(); END; $$;

CREATE POLICY "VIEW_ORG_MEMBER" ON tasks FOR SELECT USING (
    organization_id IS NOT NULL AND organization_id IN (SELECT org_id FROM get_my_org_ids_fix())
);

CREATE POLICY "VIEW_EDIT_PARTICIPANT" ON tasks FOR SELECT USING (
    EXISTS (SELECT 1 FROM task_participants WHERE task_id = tasks.id AND user_id = auth.uid())
);
