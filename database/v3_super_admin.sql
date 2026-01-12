-- POLICY FOR SUPER ADMIN (mauraluiza015@gmail.com)
-- Run this in your Supabase SQL Editor to grant full access to this user.

-- 1. Helper function to identify the super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if the current user's email matches the admin email
    RETURN (SELECT email FROM auth.users WHERE id = auth.uid()) = 'mauraluiza015@gmail.com';
END;
$$;

-- 2. Apply "Bypass" policies to all major tables
-- These policies use "FOR ALL" (Select, Insert, Update, Delete)
-- and logic is simply: IF is_super_admin() THEN TRUE

-- Workspaces
CREATE POLICY "Super Admin Workspaces" ON public.workspaces
FOR ALL USING (public.is_super_admin());

-- Workspace Members
CREATE POLICY "Super Admin Members" ON public.workspace_members
FOR ALL USING (public.is_super_admin());

-- Lists
CREATE POLICY "Super Admin Lists" ON public.lists
FOR ALL USING (public.is_super_admin());

-- Todos
CREATE POLICY "Super Admin Todos" ON public.todos
FOR ALL USING (public.is_super_admin());

-- Profiles
CREATE POLICY "Super Admin Profiles" ON public.profiles
FOR ALL USING (public.is_super_admin());
