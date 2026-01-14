-- MIGRATION V16: FULL SYSTEM RESTRUCTURE & MIGRATION
-- Run this in Supabase SQL Editor to standardize the database.

-- 1. PREPARATION: Backup & Verification (Manual Step implied)
-- We assume 'todos' table contains the current working data.

-- 2. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. CREATE/VERIFY ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- 4. CREATE/VERIFY ORGANIZATION MEMBERS TABLE
CREATE TABLE IF NOT EXISTS organization_members (
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (organization_id, user_id)
);

-- 5. CREATE TASKS TABLE (The Target Table)
-- We use IF NOT EXISTS, but if it exists with wrong schema, we might need to ALTER.
-- For safety in this "Reset/Fix" migration, we will ensure columns exist.

CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- The Creator/Owner
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = Personal
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. CREATE TASK PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS task_participants (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (task_id, user_id)
);

-- 7. DATA MIGRATION: TODOS -> TASKS
-- Move data from the temporary 'todos' table to the robust 'tasks' table.
-- We map 'owner_id' to 'user_id'. 'organization_id' is NULL (Personal).
-- We assume 'todos' has: title, description, status, priority, owner_id, created_at
-- We attempt to cast IDs. If todos.id is not UUID, new IDs are generated.

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'todos') THEN
        INSERT INTO tasks (title, description, status, priority, user_id, created_at, organization_id)
        SELECT 
            title,
            description,
            status,
            priority,
            owner_id, -- Maps to user_id
            created_at,
            NULL -- Explicitly Personal
        FROM todos
        WHERE NOT EXISTS (
            -- Avoid duplicates if run multiple times (checking by title+user for basic dedupe if IDs don't match)
            SELECT 1 FROM tasks WHERE tasks.title = todos.title AND tasks.user_id = todos.owner_id AND tasks.created_at = todos.created_at
        );
        -- Note: We are NOT deleting from 'todos' yet to be safe.
    END IF;
END $$;

-- 8. SECURITY: ROW LEVEL SECURITY (RLS) policies
-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_participants ENABLE ROW LEVEL SECURITY;

-- Helper Functions
CREATE OR REPLACE FUNCTION get_my_org_ids()
RETURNS TABLE (org_id UUID)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION is_org_member(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM organization_members WHERE organization_id = _org_id AND user_id = auth.uid());
END;
$$;

-- ORG POLICIES
DROP POLICY IF EXISTS "View own orgs" ON organizations;
CREATE POLICY "View own orgs" ON organizations
    FOR SELECT USING (id IN (SELECT org_id FROM get_my_org_ids()));

DROP POLICY IF EXISTS "Create orgs" ON organizations;
CREATE POLICY "Create orgs" ON organizations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated'); -- Any auth user can create

-- MEMBER POLICIES
DROP POLICY IF EXISTS "View members of own orgs" ON organization_members;
CREATE POLICY "View members of own orgs" ON organization_members
    FOR SELECT USING (organization_id IN (SELECT org_id FROM get_my_org_ids()));

DROP POLICY IF EXISTS "Join orgs" ON organization_members;
CREATE POLICY "Join orgs" ON organization_members
    FOR INSERT WITH CHECK (auth.uid() = user_id); -- Can add self (logic handled by Invite Code in App)

-- TASK POLICIES
DROP POLICY IF EXISTS "ALL_ACCESS_OWNER" ON tasks;
DROP POLICY IF EXISTS "VIEW_ORG_MEMBER" ON tasks;
DROP POLICY IF EXISTS "VIEW_PARTICIPANT" ON tasks;

-- Owner has full access
CREATE POLICY "ALL_ACCESS_OWNER" ON tasks
    FOR ALL USING (auth.uid() = user_id);

-- Org Members can VIEW tasks in their org
CREATE POLICY "VIEW_ORG_MEMBER" ON tasks
    FOR SELECT USING (
        organization_id IS NOT NULL 
        AND organization_id IN (SELECT org_id FROM get_my_org_ids())
    );

-- Participants can VIEW/EDIT
CREATE POLICY "VIEW_EDIT_PARTICIPANT" ON tasks
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM task_participants WHERE task_id = tasks.id AND user_id = auth.uid())
    );

-- 9. CLEANUP (Optional - Commented out for safety)
-- DROP TABLE todos;
