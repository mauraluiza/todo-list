# Documentação Técnica - To-Do List Application

> **⚠️ NOTA PARA DESENVOLVEDORES:** Este documento reflete a arquitetura atualizada para **React (Vite) + Supabase Multi-Tenant V2**.

## 📐 Arquitetura do Sistema

O sistema foi refatorado de uma SPA Vanilla JS para uma aplicação **React modular** baseada em Componentes e Hooks.

### Estrutura de Diretórios e Componentes

A code base foi reorganizada para melhor manutenibilidade:

- **`src/contexts/`**: Contém todos os Providers globais.
  - `AuthProvider`: Autenticação via Supabase.
  - `WorkspaceProvider`: Gerenciamento de estado Multi-tenant.
  - `ThemeProvider`: Controle de tema (dark/light/system).
  
- **`src/components/features/`**: Funcionalidades complexas e reutilizáveis.
  - `RichTextEditor`: Editor de texto baseado em Tiptap.
  - `TaskModal`: Modal principal de criação/edição de tarefas.
  - `ModeToggle`: Switch de tema.

- **`src/hooks/`**: Hooks customizados de acesso a dados (`useTodos`, `useLists`).
  - Esses hooks abstraem a lógica de "Ouvir o Workspace atual" para garantir isolamento de dados.

- **`src/components/ui/`**: Componentes base de interface (Shadcn UI).
- **`src/components/layout/`**: Componentes estruturais (`AppShell`, `Sidebar`).

## 💾 Schema do Banco de Dados (Supabase V2)

O schema do banco (definido em `database/v2_schema_setup.sql`) suporta multi-tenancy e colaboração.

### Tabelas Principais

#### 1. `todos` (Tarefas)
Tabela central de tarefas.
- `id` (uuid): PK.
- `title` (text): Título.
- `description` (text): **Rich Text (HTML)** salvo do ReactQuill.
- `workspace_id` (uuid, nullable):
    - `NULL` = Tarefa Pessoal.
    - `UUID` = Tarefa Pertencente a uma Organização.
- `list_id` (uuid): FK para tabela `lists` (antiga `folders`).
- `owner_id` (uuid): Criador da tarefa.
- `assigned_to` (uuid): Responsável pela tarefa.

#### 2. `lists` (Pastas/Listas)
Agrupadores de tarefas.
- `workspace_id` (uuid, nullable): Define se a lista é pessoal ou de uma org.

#### 3. `workspaces` (Organizações)
- `id` (uuid): PK.
- `name` (text): Nome da empresa/org.
- `owner_id` (uuid): Criador.
- `invite_code` (text): Código único de 6 caracteres para convite.

#### 4. `profiles` (**NOVO**)
Tabela auxiliar para metadados de usuário não suportados nativamente pelo `auth.users` ou para lookup rápido.
- `id` (uuid): PK, referência 1:1 ao `auth.users`.
- `username` (text): Nome de usuário único para login.
- `email` (text): Cópia do email para facilitar buscas (ex: login por username).

---

## 🔐 Segurança e RLS (Row Level Security)

As políticas de segurança foram atualizadas para suportar o modelo Multi-Tenant.

- **Tasks/Lists**:
    - Se `workspace_id` é NULL: Usuário só vê se `owner_id == auth.uid()`.
    - Se `workspace_id` existe: Usuário vê se é **Membro** do Workspace (verificado via join na tabela `workspace_members`).

---

## 🌟 Funcionalidades Específicas implementation

### 1. Login por Username
O frontend (`AuthWall`) permite input de "Email ou Usuário".
- Se input não tem `@`: O sistema faz um lookup na tabela `profiles` buscando o `email` associado ao `username`.
- O login efetivo no Supabase continua sendo via Email/Senha, mas essa abstração é transparente para o usuário.

### 2. Editor de Texto Rico (Rich Text)
- Biblioteca: `react-quill`.
- Armazenamento: HTML puro no campo `description` do banco.
- Sanitização: O React renderiza usando `dangerouslySetInnerHTML`. Cuidado deve ser tomado com XSS se houver input de terceiros não confiáveis, mas o Quill já sanitiza o básico.

### 3. AI Chat (Frontend)
- **Portal**: A janela de chat é renderizada usando `ReactDOM.createPortal(..., document.body)`.
- **Posicionamento**: Usa `position: fixed` e cálculo dinâmico (`calc(50% + 240px)`) para se posicionar sempre à direita do modal central.
- **Interação**: Um `useEffect` observa a abertura do chat e aplica uma transformação CSS (`translateX`) no container do Modal principal, empurrando-o para a esquerda para evitar sobreposição.

---

## ⚠️ Migração e Produção

### Persistência de Dados Antigos
Se o sistema for atualizado sobre uma base de dados existente:
1.  As tarefas antigas **não possuem** a coluna `workspace_id` (ou ela será criada como NULL).
2.  **Comportamento**: Como o sistema trata `workspace_id IS NULL` como "Ambiente Pessoal", **todas as tarefas legadas aparecerão automaticamente no Workspace Pessoal** do usuário. Nenhuma migração de dados complexa é necessária.
3.  A integridade é mantida pois o RLS continua validando o `owner_id`.

### Deploy
Ao subir para produção, certifique-se de:
1.  Rodar o script `database/v2_schema_setup.sql` no SQL Editor do Supabase. Ele é idempotente (`IF NOT EXISTS`), então é seguro rodar múltiplas vezes.
2.  Configurar as variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) no serviço de hospedagem (Vercel/Netlify).
