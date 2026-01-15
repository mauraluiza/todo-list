-- QUERY 1: Compare Columns of 'tasks' and 'todos'
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_name IN ('tasks', 'todos')
ORDER BY table_name, ordinal_position;

-- QUERY 2: Check Constraints (Primary Keys, Foreign Keys)
SELECT
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_type, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.table_name IN ('tasks', 'todos');

-- QUERY 3: Check Row Counts to estimate migration size
SELECT 'tasks' as table_name, count(*) as row_count FROM tasks
UNION ALL
SELECT 'todos' as table_name, count(*) as row_count FROM todos;
