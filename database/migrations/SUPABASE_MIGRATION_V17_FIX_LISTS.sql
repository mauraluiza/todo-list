-- MIGRATION V17: FIX LISTS TABLE FOR ORGANIZATIONS
-- Ensure 'lists' table supports organizations

-- 1. Add organization_id to lists if missing
ALTER TABLE lists ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 2. Enable RLS on lists
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

-- 3. Policies for Lists
DROP POLICY IF EXISTS "Owner can manage lists" ON lists;
DROP POLICY IF EXISTS "Org members can view lists" ON lists;

-- Owner (Personal & Creator) - Full Access
CREATE POLICY "Owner can manage lists" ON lists
    FOR ALL USING (auth.uid() = owner_id);

-- Org Members - View Access
CREATE POLICY "Org members can view lists" ON lists
    FOR SELECT USING (
        organization_id IS NOT NULL 
        AND organization_id IN (SELECT org_id FROM get_my_org_ids_fix())
    );

-- Org Admins/Members - Create/Edit Access (Simplified: Any member can create lists in org)
CREATE POLICY "Org members can create lists" ON lists
    FOR INSERT WITH CHECK (
        organization_id IS NOT NULL 
        AND organization_id IN (SELECT org_id FROM get_my_org_ids_fix())
    );
