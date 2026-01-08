# Documentação Técnica - To-Do List Application

## 📐 Arquitetura Híbrida

O sistema utiliza um padrão **Abstracted Data Layer (Camada de Dados Abstraída)**, permitindo operar em dois modos:

1.  **Modo Offline (Default):** Utiliza `LocalStorage` do navegador.
2.  **Modo Nuvem (Supabase):** Utiliza PostgreSQL e Auth via API, ativado automaticamente quando as credenciais são detectadas em `supabase-config.js`.

### Fluxo de Inicialização (`script.js`)
1.  **Boot:** `DOMContentLoaded` lê `window.supabase`.
2.  **Verificação:** `DB.init()` checa se há uma sessão ativa (`supabase.auth.getSession`).
3.  **Decisão:**
    *   **Logado:** Carrega dados do banco (`DB.loadAll`).
    *   **Anon/Erro:** Carrega dados locais (`loadFromLocal`).
4.  **UI de Auth:** O `authModal` é exibido se o Supabase estiver configurado mas não houver sessão.

---

## 🗂️ Estrutura de Arquivos e Código

### 1. `script.js` (Core Logic)
O coração da aplicação foi refatorado para usar o objeto `DB`:

*   **Objeto `DB`:** Interface unificada (`addTask`, `updateTask`, `deleteFolder`). Ele contém a lógica condicional `if (user) { ... } else { ... }`.
*   **Mappers (`mapTaskToDB` / `mapDBToTask`):**
    *   Converte camelCase (Frontend) para snake_case (Banco).
    *   **Importante:** Mapeia a propriedade interna `desc` para a coluna `description` no banco (pois `desc` é palavra reservada em SQL).
*   **Gestão de Estado:** Variáveis globais `tasks`, `folders`, `user` mantêm o estado reativo da UI.

### 2. `supabase-config.js` (Config)
*   Arquivo separado para isolar credenciais.
*   Detecta a biblioteca global `window.Supabase` e inicializa o cliente, expondo-o em `window.supabase`.

### 3. `index.html` & `style.css`
*   **Modal de Auth:** Markup adicionado no final do body, controlado via classe `.hidden`.
*   **Botão Logout:** Posicionado na Sidebar (`margin-top: auto`) para melhor UX.
*   **Estilos:** Variáveis CSS (`--primary`, `--bg-body`) controlam o tema. Estilos específicos para o form de login (`.control-group`) foram adicionados.

---

## 💾 Banco de Dados (Schema)

O backend utiliza **PostgreSQL** hospedado no Supabase.

### Tabela: `tasks`
| Coluna | Tipo | Notas |
|:--- |:--- |:--- |
| `id` | bigint | Timestamp (Date.now) para compatibilidade JS |
| `user_id` | uuid | Chave estrangeira para `auth.users` |
| `description` | text | Armazena o HTML do editor (incluindo imagens Base64) |
| `title` | text | Título da tarefa |
| `priority` | text | 'low', 'normal', 'urgente' |
| `folder_id` | text | ID da pasta vinculada |
| `created_at` | timestamp | |
| `deleted_at` | timestamp | Usado para Soft Delete (Lixeira) |

### Tabela: `folders`
| Coluna | Tipo | Notas |
|:--- |:--- |:--- |
| `id` | text | ID da pasta (ex: 'f_172...') |
| `user_id` | uuid | Chave estrangeira |
| `name` | text | Nome da pasta |

**Segurança (RLS):**
Políticas *Row Level Security* garantem que `auth.uid() = user_id`. Usuários não podem ler nem escrever dados uns dos outros.

---

## 🖼️ Sistema de Imagens (Custom Implementation)

A manipulação de imagens é feita de forma customizada no frontend:

1.  **Upload:**
    *   Interceptado pelo `imageHandler`.
    *   Arquivos são convertidos para **Base64** via FileReader.
    *   *Nota:* O limite de tamanho depende da capacidade do payload do Supabase (recomendado < 5MB).
2.  **Redimensionamento:**
    *   Um overlay (`#resize-wrapper`) é criado sobre a imagem selecionada.
    *   8 alças de controle (`nw`, `n`, `ne`...) permitem redimensionamento preciso via `mousemove`.
3.  **Alinhamento:**
    *   Menu flutuante (`.image-edit-menu`) injeta classes CSS (`.img-left`, `.img-center`) na tag `<img>`.

---

## 🔄 Fluxos de Trabalho

### Fluxo de Autenticação
1.  Usuário digita credenciais -> `supabase.auth.signInWithPassword`.
2.  Listener `onAuthStateChange` detecta `SIGNED_IN`.
3.  App dispara `DB.loadAll()` -> Atualiza Arrays Globais -> Re-renderiza UI (`renderTasks`).

### Fluxo de Edição (Híbrido)
1.  Usuário clica "Salvar" no Modal.
2.  `saveCurrentTask()` constrói o objeto da tarefa.
3.  Chama `DB.updateTask(task)` (Async - Vai pro Supabase se online).
4.  Chama `saveTasks()` (Sync - Salva no LocalStorage como backup/cache).
5.  Atualiza DOM.

---

## 📝 Orientações para Continuidade (IA)

1.  **Ao Modificar o Banco:**
    *   Sempre atualize o `DATABASE_SETUP.md` com o novo SQL.
    *   Lembre-se de atualizar os mappers no `script.js`.
2.  **Ao Adicionar Features de UI:**
    *   Use as variáveis de tema existentes em `style.css`.
    *   Para novos modais, siga o padrão do `authModal` e `taskModal`.
3.  **Migração de Imagens (Futuro):**
    *   Para escalar, substitua o armazenamento Base64 por **Supabase Storage**.
    *   Será necessário alterar o `imageHandler` para fazer upload do Blob, receber a URL pública e inserir `<img src="URL">`.

**Versão da Documentação:** 2.0 (Pós-Supabase)
