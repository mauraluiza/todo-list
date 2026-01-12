-- NEW SCHEMA V2 - REPAIR & SETUP
-- Autor: Antigravity Agent
-- Objetivo: Corrigir esquema parcialmente criado e garantir colunas V2

BEGIN;

-- 1. ENUMS (Safe Creation)
DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES & COLUMNS FIXES

-- PUBLIC PROFILES (For Username Login)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT
);

-- WORKSPACES
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- GARANTIR COLUNA INVITE_CODE
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='invite_code') THEN
        ALTER TABLE public.workspaces ADD COLUMN invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex');
    END IF;
END $$;

-- WORKSPACE MEMBERS
CREATE TABLE IF NOT EXISTS public.workspace_members (
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role org_role DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (workspace_id, user_id)
);

-- LISTS
CREATE TABLE IF NOT EXISTS public.lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- TODOS
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'pending',
    priority task_priority DEFAULT 'medium',
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    list_id UUID REFERENCES public.lists(id) ON DELETE SET NULL,
    due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- TODO ASSIGNEES
CREATE TABLE IF NOT EXISTS public.todo_assignees (
    todo_id UUID REFERENCES public.todos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (todo_id, user_id)
);

-- 3. RLS POLICIES (DROP & RECREATE para evitar conflitos)

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Clean old policies
DROP POLICY IF EXISTS "Workspaces visible to members" ON public.workspaces;
DROP POLICY IF EXISTS "Members visibility" ON public.workspace_members;
DROP POLICY IF EXISTS "Members insert self" ON public.workspace_members;
DROP POLICY IF EXISTS "Lists visibility" ON public.lists;
DROP POLICY IF EXISTS "Lists insert" ON public.lists;
DROP POLICY IF EXISTS "Todos Select" ON public.todos;
DROP POLICY IF EXISTS "Todos Insert" ON public.todos;
DROP POLICY IF EXISTS "Todos Update" ON public.todos;
DROP POLICY IF EXISTS "Todos Delete" ON public.todos;
DROP POLICY IF EXISTS "Allow lookup by invite code" ON public.workspaces;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.workspaces;

-- Public Profiles Policies
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- --- RECREATE POLICIES (Workspaces, Tasks...) ---

-- Workspaces
CREATE POLICY "Enable insert for authenticated users" ON public.workspaces 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Workspaces visible to members" ON public.workspaces
FOR SELECT USING (
   auth.role() = 'authenticated' -- Permite leitura para lookup (join by code)
);

-- Workspace Members
CREATE POLICY "Members visibility" ON public.workspace_members
FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM workspace_members AS wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid())
);

CREATE POLICY "Members insert self" ON public.workspace_members
FOR INSERT WITH CHECK (
    user_id = auth.uid() 
);

-- Lists
CREATE POLICY "Lists visibility" ON public.lists
FOR SELECT USING (
    (workspace_id IS NULL AND owner_id = auth.uid()) OR
    (workspace_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM workspace_members WHERE workspace_id = lists.workspace_id AND user_id = auth.uid()
    ))
);

CREATE POLICY "Lists insert" ON public.lists
FOR INSERT WITH CHECK (
    (workspace_id IS NULL AND owner_id = auth.uid()) OR
    (workspace_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM workspace_members WHERE workspace_id = lists.workspace_id AND user_id = auth.uid()
    ))
);

-- Todos
CREATE POLICY "Todos Select" ON public.todos
FOR SELECT USING (
    (workspace_id IS NULL AND owner_id = auth.uid()) OR
    (workspace_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM workspace_members WHERE workspace_id = todos.workspace_id AND user_id = auth.uid()
    ))
);

CREATE POLICY "Todos Insert" ON public.todos
FOR INSERT WITH CHECK (
    (workspace_id IS NULL AND owner_id = auth.uid()) OR
    (workspace_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM workspace_members WHERE workspace_id = todos.workspace_id AND user_id = auth.uid()
    ))
);

CREATE POLICY "Todos Update" ON public.todos
FOR UPDATE USING (
    (workspace_id IS NULL AND owner_id = auth.uid()) OR
    (workspace_id IS NOT NULL AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM todo_assignees WHERE todo_id = todos.id AND user_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = todos.workspace_id AND user_id = auth.uid() AND role IN ('admin', 'owner'))
    ))
);

CREATE POLICY "Todos Delete" ON public.todos
FOR DELETE USING (
    (workspace_id IS NULL AND owner_id = auth.uid()) OR
    (workspace_id IS NOT NULL AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = todos.workspace_id AND user_id = auth.uid() AND role IN ('admin', 'owner'))
    ))
);

COMMIT;
