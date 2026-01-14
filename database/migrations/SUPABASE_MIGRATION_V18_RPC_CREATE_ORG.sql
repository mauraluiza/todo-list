-- MIGRATION V18: SECURE ORGANIZATION CREATION RPC
-- Goal: Create organization and creator member in a single atomic transaction.

CREATE OR REPLACE FUNCTION create_new_organization(
    org_name TEXT,
    org_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions (bypassing RLS for the insert steps)
SET search_path = public
AS $$
DECLARE
    new_org_id UUID;
    new_org RECORD;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- 1. Validate Input
    IF org_name IS NULL OR length(trim(org_name)) < 2 THEN
        RAISE EXCEPTION 'Nome da organização deve ter pelo menos 2 caracteres.';
    END IF;

    IF org_code IS NULL OR length(trim(org_code)) < 4 THEN
        RAISE EXCEPTION 'Código de convite deve ter pelo menos 4 caracteres.';
    END IF;

    -- 2. Insert Organization
    INSERT INTO organizations (name, code, created_by)
    VALUES (org_name, org_code, current_user_id)
    RETURNING id, name, code, created_at
    INTO new_org_id, new_org.name, new_org.code, new_org.created_at;

    -- Store ID in the record structure for returning
    new_org.id := new_org_id;

    -- 3. Insert Creator as Admin Member
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (new_org_id, current_user_id, 'admin');

    -- 4. Return the new org object (compatible with frontend expectation)
    RETURN jsonb_build_object(
        'id', new_org_id,
        'name', new_org.name,
        'code', new_org.code,
        'role', 'admin' -- Return role so frontend can switch immediately
    );

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Este código de convite já está em uso.';
    WHEN OTHERS THEN
        RAISE; -- Propagate other errors
END;
$$;
