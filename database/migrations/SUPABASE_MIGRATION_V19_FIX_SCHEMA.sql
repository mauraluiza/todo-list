-- MIGRATION V19: FIX ORGANIZATIONS SCHEMA
-- The 'organizations' table might exist from an older version without 'created_by'.
-- This script matches the schema expectation of the create_new_organization RPC.

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
