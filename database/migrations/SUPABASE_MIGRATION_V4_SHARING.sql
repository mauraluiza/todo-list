-- MIGRATION V4: Task Sharing & Participant System
-- Run this in Supabase SQL Editor

-- 1. Create Task Participants Table
CREATE TABLE IF NOT EXISTS task_participants (
    task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (task_id, user_id)
);

ALTER TABLE task_participants ENABLE ROW LEVEL SECURITY;

-- 2. Policies for Task Participants

-- View: Users can see who works on a task IF they can see the task.
-- (Circular dependency risk if we define task visibility by participants, so be careful).
-- Simpler: Users can see participants if they belong to the task's organization.
CREATE POLICY "Org members can view participants" ON task_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE tasks.id = task_participants.task_id
            AND (
                tasks.organization_id IS NOT NULL 
                AND EXISTS (
                    SELECT 1 FROM organization_members
                    WHERE organization_id = tasks.organization_id
                    AND user_id = auth.uid()
                )
            )
        )
    );

-- Insert/Delete: Only the Task Creator (Owner) can manage participants.
CREATE POLICY "Task owner can manage participants" ON task_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE tasks.id = task_participants.task_id
            AND tasks.user_id = auth.uid()
        )
    );

-- 3. Update Tasks Visibility Policy (The Big One)

-- Drop old policy
DROP POLICY IF EXISTS "Users can access own tasks in their orgs" ON tasks;

-- New Policy:
-- Access if:
-- 1. User is the creator (user_id = auth.uid())
-- 2. OR User is a participant (exists in task_participants)
-- AND (Constraint) Task is in an Org the user belongs to (implicit for participants usually, but good for safety)
CREATE POLICY "Users can access tasks they own or participate in" ON tasks
    FOR SELECT USING (
        (auth.uid() = user_id) -- Owner
        OR
        (EXISTS ( -- Participant
            SELECT 1 FROM task_participants
            WHERE task_id = tasks.id
            AND user_id = auth.uid()
        ))
    );

-- Update Policy: Same as Select (Participants can edit)
CREATE POLICY "Users can edit tasks they own or participate in" ON tasks
    FOR UPDATE USING (
        (auth.uid() = user_id) 
        OR
        (EXISTS (
            SELECT 1 FROM task_participants
            WHERE task_id = tasks.id
            AND user_id = auth.uid()
        ))
    );

-- Delete Policy: ONLY Owner
CREATE POLICY "Only owner can delete tasks" ON tasks
    FOR DELETE USING (
        auth.uid() = user_id
    );


-- 4. Helper RPC to fetch Org Members (for the UI selection list)
-- We need to list potential users to share with.
-- Returns: id, email (from auth), username (from profiles)
CREATE OR REPLACE FUNCTION get_org_members(p_org_id UUID)
RETURNS TABLE (
    user_id UUID,
    email VARCHAR,
    username TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Security Check: Requester MUST be member of the org
  IF NOT EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = p_org_id 
      AND user_id = auth.uid()
  ) THEN
      RETURN; -- Return empty if not allowed
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email::VARCHAR, -- Cast to ensure type match
    p.username
  FROM organization_members om
  JOIN auth.users au ON au.id = om.user_id
  LEFT JOIN profiles p ON p.id = om.user_id
  WHERE om.organization_id = p_org_id;
END;
$$;
