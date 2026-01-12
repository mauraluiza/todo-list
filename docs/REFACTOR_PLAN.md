# Plano de Refatoração Completa - To-Do List V2

Este documento detalha o plano de execução para a modernização completa do sistema, migrando de Vanilla JS para React e reestruturando o banco de dados.

## 1. Arquitetura Frontend (React + Vite)
O novo frontend será construído com **React**, utilizando **Vite** para build tool.

- **Framework**: React 18+
- **Linguagem**: JavaScript (migração gradual para TS possível, mas manteremos JS por compatibilidade imediata se preferir, ou adotaremos TS para rigidez. *Decisão: Manter JSX para velocidade de migração, estruturando como componentes funcionais.*) -> *Ajuste: O prompt pede "Engenheiro Sênior", então usarei padrões sólidos.*
- **Estilização**: **Vanilla CSS (CSS Modules)**. Aprovetaremos o `style.css` existente, modularizando-o para evitar conflitos, mas mantendo a fidelidade visual estrita.
- **Estado**: **Context API** + Hooks customizados (`useAuth`, `useTasks`).
- **Roteamento**: React Router (se necessário, embora seja SPA, ter rotas para Login/App ajuda).

### Estrutura de Pastas Proposta:
```
/src
  /components
    /common       # Botões, Inputs, Modais (UI baseada no design atual)
    /layout       # Sidebar, Header
    /tasks        # TaskCard, TaskList, TaskEditor
  /contexts       # AuthContext, DataContext
  /hooks          # Hooks de lógica (useAsync, useSupabase)
  /services       # Camada de API (Supabase)
  /styles         # CSS Global e Variaveis
  App.jsx
  main.jsx
```

## 2. Novo Schema do Banco de Dados (PostgreSQL)
O banco atual sofre de falta de padronização. O novo schema (`v2`) utilizará UUIDs, convenções `snake_case` estritas e tipos corretos.

### Tabelas Principais (prefixo `v2_` para isolamento inicial):
1.  **`profiles`** (Mantida/Ajustada):
    - `id` (UUID, PK, FK auth.users)
    - `full_name`, `avatar_url`, etc.
2.  **`workspaces`** (Substitui `organizations`):
    - `id` (UUID, PK)
    - `name` (TEXT)
    - `owner_id` (UUID, FK profiles)
3.  **`lists`** (Substitui `folders`):
    - `id` (UUID, PK)
    - `workspace_id` (UUID, FK workspaces, Nullable -> Pessoal)
    - `owner_id` (UUID, FK profiles)
    - `title` (TEXT)
4.  **`todos`** (Substitui `tasks`):
    - `id` (UUID, PK) - *Adeus `Date.now()`*
    - `list_id` (UUID, FK lists)
    - `workspace_id` (UUID, FK workspaces)
    - `owner_id` (UUID, FK profiles)
    - `title` (TEXT)
    - `description` (TEXT) - *HTML legacy suportado*
    - `status` (ENUM: 'pending', 'in_progress', 'completed', 'cancelled')
    - `priority` (ENUM: 'low', 'medium', 'high', 'urgent')
    - `due_at` (TIMESTAMPTZ)
    - `created_at`, `updated_at`
5.  **`todo_assignees`** (Substitui participants):
    - `todo_id`, `user_id` (Composite PK)

## 3. Estratégia de Migração (Segurança de Dados)
A migração será feita em etapas para garantir **Zero Data Loss**.

1.  **Backup**: Snapshot atual (Já realizado).
2.  **Schema Paralelo**: Criar tabelas `v2_` sem deletar as antigas.
3.  **Script de Migração (SQL)**:
    - Inserir dados de `tasks` -> `todos`.
    - Converter IDs numéricos para UUIDs (gerando novos UUIDs e mapar se necessário, ou apenas deixar novos). *Decisão: Gerar novos UUIDs. Como não há URLs profundas expostas publicamente dependendo do ID, mudar o ID é seguro.*
4.  **Validação**: Contar registros antigos vs novos.
5.  **Cutover**: Virar a chave do frontend para ler `v2`.

## 4. Plano de Execução
1.  Mover código legado para `/legacy_v1`.
2.  Inicializar React App na raiz.
3.  Configurar Cliente Supabase no React.
4.  Criar Componentes visuais portando o CSS.
5.  Aplicar Migration SQL no Banco.
6.  Conectar React ao novo Schema.

**Status**: Pronto para iniciar.
