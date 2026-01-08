# Configuração do Banco de Dados (Supabase)

Para sincronizar suas tarefas na nuvem e acessá-las de qualquer dispositivo, você precisa criar um projeto gratuito no Supabase.

## Passo 1: Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e crie uma conta.
2. Clique em **"New Project"**.
3. Preencha os detalhes (Nome, Senha do Database, Região). A região mais próxima (ex: São Paulo/Brazil) é melhor.
4. Aguarde o projeto ser provisionado (leva 1-2 minutos).

## Passo 2: Configurar Tabelas

Vá na seção **SQL Editor** do menu lateral esquerdo no Supabase, crie uma **New Query** e cole o seguinte código para criar as tabelas com as permissões corretas:

```sql
-- Habilitar extensão UUID (geralmente já vem habilitada)
create extension if not exists "uuid-ossp";

-- Tabela de Pastas
create table folders (
  id text primary key, -- Usamos strings 'f_xxx' ou 'work'
  user_id uuid references auth.users not null,
  name text not null,
  created_at timestamptz default now()
);

-- Habilitar segurança (Row Level Security)
alter table folders enable row level security;

-- Política: Usuário só vê/edita suas próprias pastas
create policy "Users can manage their own folders"
on folders for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- Tabela de Tarefas
create table tasks (
  id bigint primary key, -- Usamos timestamp (Date.now()) do JS
  user_id uuid references auth.users not null,
  title text,
  description text, -- HTML (antigo 'desc')
  folder_id text references folders(id) on delete set null,
  priority text,
  status text,
  completed boolean,
  due_date date,
  ticket text,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz
);

-- Habilitar segurança (Row Level Security)
alter table tasks enable row level security;

-- Política: Usuário só vê/edita suas próprias tarefas
create policy "Users can manage their own tasks"
on tasks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

Clique em **RUN** para criar as tabelas.

> **Nota sobre Imagens:** Imagens muito grandes podem falhar ao salvar se excederem o limite do banco. O ideal é usar imagens pequenas ou comprimidas.

## Passo 3: Obter Credenciais

1. No painel do Supabase, vá em **Project Settings** (ícone de engrenagem) -> **API**.
2. Copie a **Project URL**.
3. Copie a **Project API Key** (chave `anon` / `public`).

## Passo 4: Configurar no Aplicativo

1. Abra o arquivo `supabase-config.js` na raiz do seu projeto.
2. Substitua os valores placeholder pelas suas credenciais:

```javascript
const SUPABASE_URL = 'SUA_URL_COPIADA_AQUI';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_COPIADA_AQUI';
```

## Passo 5: Testar

1. Recarregue sua página `index.html`.
2. O modal de login deve aparecer.
3. Crie uma conta com email/senha (não precisa ser email real se não configurar confirmação, mas lembre a senha).
4. Suas tarefas agora serão salvas na nuvem!

## Solução de Problemas

- **Login falhou?** Verifique no console do navegador (F12) se há erros vermelhos.
- **Não salva?** Verifique se criou as políticas RLS corretamente no Passo 2. Sem elas, o banco bloqueia gravações.
