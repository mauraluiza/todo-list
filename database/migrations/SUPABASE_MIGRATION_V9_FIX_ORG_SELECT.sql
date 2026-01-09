-- MIGRATION V9: Fix Organizations Table Visibility
-- Run this in Supabase SQL Editor

-- ISSUE: 
-- Users cannot populate the Organization Switcher because they cannot SELECT/READ the `organizations` table.
-- While they can see `organization_members` (thanks to V8), the join to `organizations` fails (returns null) if RLS on `organizations` blocks it.

-- We need a policy allowing users to SEE organizations they are a member of.

CREATE POLICY "Users can view organizations they belong to" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = organizations.id
            AND user_id = auth.uid()
        )
    );
