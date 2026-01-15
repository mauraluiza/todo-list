-- CHECK POLICIES
SELECT * FROM pg_policies WHERE tablename = 'todos';

-- CHECK ROWS (Bypass RLS if running as admin in SQL Editor, tests existence)
SELECT count(*) as total_todos, organization_id, user_id FROM todos GROUP BY organization_id, user_id;

-- TEST INSERT (Validate constraints)
-- INSERT INTO todos (title, user_id, owner_id) VALUES ('Test SQL Insert', 'YOUR_USER_ID', 'YOUR_USER_ID');

-- VERIFY DATA (As requested in Step 5)
SELECT * FROM todos;
SELECT * FROM todos WHERE organization_id IS NULL; -- Personal tasks
SELECT * FROM todos WHERE organization_id IS NOT NULL; -- Org tasks
