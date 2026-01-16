-- MIGRATION V25: PROFILES AND PARTICIPANTS
-- Implements robust user identity and task participation.

-- 1. PROFILES TABLE
-- Mirrors auth.users to provide accessible user data (Name, Email) for UI.
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure columns exist if table was already there
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE profiles ADD COLUMN full_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- Everyone can read profiles (needed to see who created tasks). 
-- In a stricter org setup, we would limit to "same org members", but global read is acceptable for "Name Display" in this context.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (Upsert on login)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. TODO PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS todo_participants (
    todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Use profiles to ensure existence
    added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (todo_id, user_id)
);

-- Enable RLS
ALTER TABLE todo_participants ENABLE ROW LEVEL SECURITY;

-- Participants Policies
-- View: If I can see the Todo, I can see its participants?
-- Actually, simple rule: Org members can view participants of tasks in that org.
DROP POLICY IF EXISTS "Org members view participants" ON todo_participants;
CREATE POLICY "Org members view participants" ON todo_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM todos 
            WHERE todos.id = todo_participants.todo_id
            AND todos.organization_id IS NOT NULL 
            AND EXISTS (
                SELECT 1 FROM organization_members 
                WHERE organization_id = todos.organization_id 
                AND user_id = auth.uid()
            )
        )
    );

-- Insert/Delete: Task Owner (Creator) OR Org Admin can manage participants.
-- Simplified: If I can UPDATE the todo, I can manage participants.
DROP POLICY IF EXISTS "Task managers manage participants" ON todo_participants;
CREATE POLICY "Task managers manage participants" ON todo_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM todos 
            WHERE todos.id = todo_participants.todo_id
            AND (
                todos.user_id = auth.uid() -- Owner
                OR 
                -- Admin check (simplified, assuming admins can update any task in org)
                EXISTS (
                    SELECT 1 FROM organization_members 
                    WHERE organization_id = todos.organization_id 
                    AND user_id = auth.uid() 
                    AND role IN ('owner', 'admin')
                )
            )
        )
    );

-- Helper to safely get profile info even if record missing (View)
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
    id, 
    COALESCE(full_name, email) as display_name,
    email
FROM profiles;
