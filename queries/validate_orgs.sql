-- VALIDATION SCRIPT: Check Organization Logic

-- 1. Check if ANY organizations exist
SELECT count(*) as total_orgs FROM organizations;

-- 2. Check if current user is in any organization (Replace 'YOUR_USER_ID' manually if testing in Supabase, here we list all)
SELECT * FROM organization_members LIMIT 10;

-- 3. Check specific Org Member count
SELECT organization_id, count(*) as member_count 
FROM organization_members 
GROUP BY organization_id;

-- 4. Check Profiles (Crucial for participants)
SELECT count(*) as total_profiles FROM profiles;

-- 5. Check Todo Participants table
SELECT * FROM todo_participants LIMIT 5;
