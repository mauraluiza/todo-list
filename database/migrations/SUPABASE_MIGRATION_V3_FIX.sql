-- MIGRATION V3: Fix RLS for Admin Organization Creation
-- Run this in Supabase SQL Editor to fix the "violates row-level security policy" error.

-- 1. Allow Admin to CREATE (INSERT) Organizations
-- We use auth.jwt() ->> 'email' to securely check the user's email from the token.
CREATE POLICY "Admin can create organizations" ON organizations
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'email' = 'mauraluiza015@gmail.com'
    );

-- 2. Allow Admin to VIEW (SELECT) ALL Organizations
-- This is critical! When you create an org, Supabase tries to return the new row.
-- Without this, the return fails because you aren't a member yet.
CREATE POLICY "Admin can view all organizations" ON organizations
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'mauraluiza015@gmail.com'
    );

-- 3. Allow Admin to UPDATE/DELETE Organizations (Full Management)
CREATE POLICY "Admin can update organizations" ON organizations
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'mauraluiza015@gmail.com'
    );

CREATE POLICY "Admin can delete organizations" ON organizations
    FOR DELETE USING (
        auth.jwt() ->> 'email' = 'mauraluiza015@gmail.com'
    );
