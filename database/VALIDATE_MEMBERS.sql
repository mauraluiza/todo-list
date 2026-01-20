-- SCRIPT DE VALIDAÇÃO: MEMBROS E ORGANIZAÇÕES

-- 1. Visão Geral Detalhada
-- Lista todos os membros, nomes das organizações e dados dos usuários
SELECT 
    org.name AS "Nome da Organização",
    org.code AS "Código Org",
    p.full_name AS "Nome do Membro",
    p.email AS "Email do Membro",
    mem.role AS "Permissão (Role)",
    mem.created_at AS "Entrou em",
    mem.organization_id AS "Org ID"
FROM 
    organization_members mem
JOIN 
    organizations org ON mem.organization_id = org.id
LEFT JOIN 
    profiles p ON mem.user_id = p.id
ORDER BY 
    org.name, mem.role;

-- 2. Contagem de Membros por Organização
SELECT 
    org.name AS "Organização",
    COUNT(mem.user_id) AS "Total de Membros"
FROM 
    organization_members mem
JOIN 
    organizations org ON mem.organization_id = org.id
GROUP BY 
    org.name;

-- 3. Verificação de Integridade (Orfãos)
-- Procura membresias que apontam para organizações que não existem mais
SELECT * 
FROM organization_members 
WHERE organization_id NOT IN (SELECT id FROM organizations);

-- 4. Verificação de Integridade (Perfis Faltantes)
-- Procura membresias onde o usuário não tem perfil na tabela 'profiles'
SELECT * 
FROM organization_members 
WHERE user_id NOT IN (SELECT id FROM profiles);
