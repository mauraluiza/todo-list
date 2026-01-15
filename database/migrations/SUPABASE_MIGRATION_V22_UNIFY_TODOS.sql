-- MIGRATION V22: UNIFY TO TODOS TABLE
-- Goal: Use 'todos' as the single source of truth.
-- 1. Standardize 'todos' schema
-- 2. Migrate data from 'tasks' -> 'todos'
-- 3. Apply RLS to 'todos'
-- 4. Rename 'tasks' to 'tasks_backup'

-- 1. SCHEMA STANDARDIZATION
ALTER TABLE todos ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Map owner_id to user_id if user_id is null (for old records)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'owner_id') THEN
        UPDATE todos SET user_id = owner_id WHERE user_id IS NULL;
    END IF;
END $$;

-- 2. DATA MIGRATION (TASKS -> TODOS)
-- Since 'tasks' has BIGINT IDs and 'todos' has UUIDs, we MUST generate new IDs.
-- We cannot preserve the old BIGINT IDs in a UUID column.
-- Use NOT EXISTS to prevent duplicates based on content if run multiple times.

INSERT INTO todos (id, title, description, status, priority, user_id, owner_id, organization_id, created_at)
SELECT 
    gen_random_uuid(),  -- Generate NEW UUID
    t.title, 
    t.description, 
    t.status::task_status, -- CAST TEXT TO ENUM
    CASE 
        WHEN t.priority = 'normal' THEN 'low'::task_priority
        ELSE t.priority::task_priority
    END, -- Handle legacy 'normal' value
    t.user_id, 
    t.user_id, -- owner_id (Required by existing schema)
    t.organization_id, 
    t.created_at 
FROM tasks t
WHERE NOT EXISTS (
    SELECT 1 FROM todos existing 
    WHERE existing.title = t.title 
    AND existing.created_at = t.created_at
);

-- 3. APPLY RLS POLICIES TO TODOS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Re-create policies on 'todos' matching what we had for 'tasks'
DROP POLICY IF EXISTS "ALL_ACCESS_OWNER" ON todos;
CREATE POLICY "ALL_ACCESS_OWNER" ON todos
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "VIEW_ORG_MEMBER" ON todos;
CREATE POLICY "VIEW_ORG_MEMBER" ON todos
    FOR SELECT USING (
        organization_id IS NOT NULL 
        AND organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

-- 4. CLEANUP
ALTER TABLE tasks RENAME TO tasks_backup;
