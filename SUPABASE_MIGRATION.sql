-- MIGRATION: Organization System
-- Run this in your Supabase SQL Editor to enable Multi-Tenancy

-- 1. Create Organizations Table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE, -- The "admin-maura" code goes here
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Members Table (Many-to-Many: Users <-> Orgs)
CREATE TABLE IF NOT EXISTS organization_members (
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (organization_id, user_id)
);

-- 3. Update Tasks & Folders to belong to an Org
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 4. Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Organization Members: Users can see memberships for themselves
CREATE POLICY "Users can view own memberships" ON organization_members
    FOR SELECT USING (auth.uid() = user_id);

-- Organizations: Users can view org details IF they are a member
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = organizations.id
            AND organization_members.user_id = auth.uid()
        )
    );

-- Tasks: Users can only see tasks where they are a member of the task's org (OR if it's their personal task - implicit null check usually handled by app logic, but here we enforce org scope if set)
-- NOTE: We are keeping the existing "user_id" check for now, but extending it to allow ORG checks if we wanted shared tasks.
-- For now, the app logic filters by org_id. Let's strictly scope visibility.

-- Update Tasks Policy (Assuming separate policy name to avoid conflict with existing)
DROP POLICY IF EXISTS "Users can only access their own records" ON tasks;
CREATE POLICY "Users can access own tasks in their orgs" ON tasks
    FOR ALL USING (
        auth.uid() = user_id 
        AND (
            organization_id IS NULL 
            OR EXISTS (
                SELECT 1 FROM organization_members 
                WHERE organization_id = tasks.organization_id 
                AND user_id = auth.uid()
            )
        )
    );

-- Update Folders Policy
DROP POLICY IF EXISTS "Users can only access their own folders" ON folders;
CREATE POLICY "Users can access own folders in their orgs" ON folders
    FOR ALL USING (
        auth.uid() = user_id 
        AND (
            organization_id IS NULL 
            OR EXISTS (
                SELECT 1 FROM organization_members 
                WHERE organization_id = folders.organization_id 
                AND user_id = auth.uid()
            )
        )
    );

-- 6. Insert Default Organization (Maura)
-- This creates the org if it doesn't exist.
INSERT INTO organizations (name, code)
VALUES ('Organização Maura', 'admin-maura')
ON CONFLICT (code) DO NOTHING;

-- Allow public insert into org members only via specific secured methods or trigger?
-- For this prototype, we allow authenticated users to INSERT into organization_members IF they know the Code (Handled in Client via 2-step verification or RLS bypass which is tricky).
-- SIMPLER: Allow users to insert THEMSELVES into organization_members.
CREATE POLICY "Users can join orgs" ON organization_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);
