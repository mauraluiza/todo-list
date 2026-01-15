-- MIGRATION V20: FIX RPC VARIABLE ASSIGNMENT
-- Fixes "record 'new_org' is not assigned yet" error by using simple variables.

CREATE OR REPLACE FUNCTION create_new_organization(
    org_name TEXT,
    org_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
    v_name TEXT;
    v_code TEXT;
    v_created_at TIMESTAMP WITH TIME ZONE;
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
    -- Capture values into scalar variables instead of a generic RECORD to avoid assignment errors
    INSERT INTO organizations (name, code, created_by)
    VALUES (org_name, org_code, current_user_id)
    RETURNING id, name, code, created_at
    INTO v_org_id, v_name, v_code, v_created_at;

    -- 3. Insert Creator as Admin Member
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org_id, current_user_id, 'admin');

    -- 4. Return the new org object
    RETURN jsonb_build_object(
        'id', v_org_id,
        'name', v_name,
        'code', v_code,
        'created_at', v_created_at,
        'role', 'admin' 
    );

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Este código de convite já está em uso.';
    WHEN OTHERS THEN
        RAISE; -- Propagate other errors
END;
$$;
