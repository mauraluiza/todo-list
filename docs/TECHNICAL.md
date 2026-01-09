# Documentação Técnica - To-Do List Application

## 📐 Arquitetura Híbrida

O sistema utiliza um padrão **Abstracted Data Layer (Camada de Dados Abstraída)**, permitindo operar em dois modos:

1.  **Modo Offline (Default):** Utiliza `LocalStorage` do navegador persistindo arrays `tasks` e `folders`.
2.  **Modo Nuvem (Supabase):** Utiliza PostgreSQL e Auth via API, ativado automaticamente quando as credenciais são detectadas em `supabase-config.js` e há uma sessão ativa.

### Fluxo de Inicialização (`script.js`)
1.  **Boot:** `DOMContentLoaded` lê `window.supabase`.
2.  **Verificação:** `DB.init()` verifica sessão (`supabase.auth.getSession`).
3.  **Auth UI:** Se configurado mas não logado, abre o modal de login.
4.  **Carga de Dados:** `DB.loadAll()` popula os arrays globais, priorizando a nuvem se logado.

---

## 🗂️ Implementação de Interfaces (UI/UX)

### 1. Transições Suaves (Smooth Modals)
A aplicação utiliza um sistema de classes CSS para gerenciar estados de animação, substituindo keyframes rígidos por transições fluidas.
- **Helper:** `setModalState(modal, isOpen)` em `script.js`.
- **Lógica:**
    - **Open:** Remove `.hidden`, força reflow (`void modal.offsetWidth`), adiciona `.visible` (trigger opacity: 1, backdrop-filter: 8px).
    - **Close:** Remove `.visible` (fade out), aguarda `transitionend` (400ms setTimeout), adiciona `.hidden`.

### 2. Modais Customizados
Substituição de `alert/prompt` nativos por modais estilizados baseados em Promises:
- **`showCustomPrompt(title, default, placeholder)`:** Retorna Promise<String>. Suporta placeholder para instruções UX sem sujar o valor inicial.
- **`showCustomConfirm(title, msg)`:** Retorna Promise<Boolean>.

---

## 🔐 Controle de Acesso e Segurança

### Autenticação (Supabase Auth)
- **Login:** Email/Password.
- **Cadastro Restrito:** Implementado no client-side (`btnSignUp` listener).
    - Exige código de autorização (`admin-maura`) via `showCustomPrompt`.
    - Bloqueia chamadas à API `signUp` se o código falhar.

### Row Level Security (RLS - Banco de Dados)
Políticas aplicadas nas tabelas `tasks` e `folders`:
- `SELECT`, `INSERT`, `UPDATE`, `DELETE`: Permitido apenas onde `auth.uid() = user_id`.

---

## 💾 Schema do Banco de Dados

**Tabela: `tasks`**
- `id` (bigint): Timestamp.
- `user_id` (uuid): FK auth.users.
- `description` (text): HTML do Quill.js (inclui imagens Base64).
- `deleted_at` (timestamp): Soft Delete para Lixeira.

**Tabela: `folders`**
- `id` (text): String customizada (ex: `f_TIMESTAMP`).
- `user_id` (uuid): FK auth.users.

---

## 🖼️ Sistema de Imagens
- **Armazenamento:** Base64 embedado no HTML da task (coluna `description`).
- **Editor:** Quill.js customizado.
- **Ferramentas:** Overlay de redimensionamento (`#resize-wrapper`) e menu flutuante de alinhamento injetados dinamicamente no DOM ao clicar na imagem.

---

## 📝 Notas de Manutenção

1. **Placeholders em Prompts:** Ao usar `showCustomPrompt` para instruções que não devem ser editadas, passe o texto no terceiro argumento (`placeholder`).
2. **Mappers:** O frontend usa `camelCase` (`desc`, `folderId`), o banco usa `snake_case` (`description`, `folder_id`). Mappers em `script.js` cuidam dessa tradução.
