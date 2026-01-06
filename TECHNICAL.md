# Documentação Técnica - To-Do List Application

## 📐 Arquitetura do Sistema

### Visão Geral
Aplicação Single Page Application (SPA) construída com Vanilla JavaScript, sem frameworks. O sistema segue o padrão de **Event-Driven Architecture** com estado centralizado no LocalStorage.

### Fluxo de Dados
```
User Input → Event Listeners → State Update → LocalStorage → Re-render → DOM Update
```

## 🗂️ Estrutura de Arquivos

### 1. `index.html` (180 linhas)

**Estrutura HTML Semântica:**

```html
<body>
  <div class="layout-wrapper">
    <aside class="sidebar">...</aside>  <!-- Navegação de pastas -->
    <main class="app-container">
      <header>...</header>              <!-- Título, controles, botões -->
      <div class="filters">...</div>    <!-- Filtros de status -->
      <div class="task-grid">...</div>  <!-- Grid de cards de tarefas -->
    </main>
  </div>
  
  <div class="modal-overlay">         <!-- Modal de edição -->
    <div class="modal-container">
      <div class="modal-header">...</div>
      <div class="modal-body">
        <div id="editor-container"></div> <!-- Quill Editor -->
        <div class="modal-meta-controls">...</div>
      </div>
      <div class="modal-footer">...</div>
    </div>
  </div>
</body>
```

**CDNs Integrados:**
- Google Fonts (Outfit): Tipografia moderna
- Quill.js 1.3.6: Editor de texto rico

**Elementos Importantes:**
- `#taskList`: Container dinâmico para cards de tarefas
- `#folderList`: Lista de pastas renderizada dinamicamente
- `#editor-container`: Inicializado pelo Quill.js
- `#taskModalOverlay`: Modal controlado por classes `.hidden`

---

### 2. `style.css` (760 linhas)

**Organização:**

```css
:root                     /* Linhas 1-36: Variáveis CSS (tema claro) */
[data-theme="dark"]       /* Linhas 38-68: Variáveis CSS (tema escuro) */
* { box-sizing }          /* Linhas 70-75: Reset CSS */
body                      /* Linhas 77-88: Background com gradientes radiais */

/* Layout Principal */
.layout-wrapper           /* Linhas 91-94: Flex container */
.sidebar                  /* Linhas 96-110: Sidebar fixa */
.app-container            /* Linhas 212-221: Container principal com margin-left */

/* Componentes */
.task-card                /* Linhas 398-416: Cards de tarefas */
.modal-overlay            /* Linhas 553-573: Modal com backdrop blur */
.filter-btn               /* Linhas 287-343: Botões de filtro */
.theme-toggle             /* Linhas 369-388: Toggle de tema com ícones SVG */

/* Status Classes */
.status-pending           /* Linha 437: Borda laranja */
.status-urgent            /* Linha 441: Borda vermelha */
.status-low               /* Linha 445: Borda cinza */
.status-completed         /* Linha 450: Borda verde + opacity */
.status-trash             /* Linha 455: Borda cinza + grayscale */
```

**Variáveis CSS Críticas:**

```css
/* Cores de Prioridade */
--color-pending: #F59E0B;    /* Laranja - Prioridade "Baixa" (normal) */
--color-urgent: #EF4444;     /* Vermelho - Prioridade "Urgente" */
--color-low: #94A3B8;        /* Cinza - "Sem prioridade" (low) */
--color-completed: #10B981;  /* Verde - Tarefas concluídas */
--color-trash: #64748B;      /* Cinza escuro - Lixeira */

/* Cores Primárias */
--primary: #8B5CF6;          /* Roxo - Ações principais */
--bg-body: #F8FAFC;          /* Fundo geral */
--bg-card: rgba(255,255,255,0.75); /* Cards com transparência */
--text-main: #1E293B;        /* Texto principal */

/* Sombras */
--shadow-card: 0 4px 6px -1px rgb(0 0 0 / 0.05);
--shadow-hover: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

**Técnicas CSS Avançadas:**

1. **Backdrop Blur:**
   ```css
   .task-card {
     backdrop-filter: blur(var(--blur-strength)); /* 16px */
   }
   ```

2. **Fade Effect em Cards:**
   ```css
   .task-card::after {
     content: '';
     background: linear-gradient(transparent, var(--bg-card));
     height: 60px;
     position: absolute;
     bottom: 0;
   }
   ```

3. **Toggle de Tema (Linhas 346-367):**
   ```css
   /* Esconde Moon em Light Mode */
   html:not([data-theme="dark"]) .moon-icon {
     opacity: 0;
     transform: rotate(-90deg) scale(0);
   }
   ```

4. **Grid Responsivo:**
   ```css
   .task-grid {
     grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
     gap: 24px;
   }
   ```

**Responsividade:**
- Media query em `@media (max-width: 768px)` (linha 754)
- Modal ocupa 100% da tela em mobile

---

### 3. `script.js` (504 linhas)

**Estrutura do Código:**

```javascript
document.addEventListener('DOMContentLoaded', () => {
  // === SEÇÃO 1: DOM ELEMENTS (Linhas 2-32) ===
  const taskList = document.getElementById('taskList');
  // ... todos os elementos DOM
  
  // === SEÇÃO 2: EDITOR INIT (Linhas 34-46) ===
  const quill = new Quill('#editor-container', { ... });
  
  // === SEÇÃO 3: STATE (Linhas 48-57) ===
  let tasks = JSON.parse(localStorage.getItem('onboardingTasks')) || [];
  let folders = JSON.parse(localStorage.getItem('onboardingFolders')) || [...];
  let activeFolderId = 'all';
  let activeStatusFilter = 'all';
  let currentTaskId = null;
  
  // === SEÇÃO 4: INIT (Linhas 59-63) ===
  cleanupTrash();
  initTheme();
  renderFolders();
  renderTasks();
  
  // === SEÇÃO 5: EVENT LISTENERS (Linhas 65-196) ===
  // Import, Export, Sidebar, Filters, Modal
  
  // === SEÇÃO 6: CORE FUNCTIONS (Linhas 198-398) ===
  // saveFolders, saveTasks, renderFolders, openModal, saveCurrentTask
  
  // === SEÇÃO 7: RENDERING (Linhas 400-483) ===
  // renderTasks (principal função de renderização)
  
  // === SEÇÃO 8: UTILITIES (Linhas 485-502) ===
  // initTheme, escapeHtml
});
```

**Funções Principais:**

#### `renderTasks()` (Linhas 401-483)
**Responsabilidade:** Renderizar todas as tarefas com base nos filtros ativos.

**Fluxo:**
1. **Filtragem** (Linhas 405-414):
   ```javascript
   if (activeStatusFilter !== 'trash') {
     filtered = filtered.filter(t => !t.deletedAt);
     if (activeFolderId !== 'all') filtered = filtered.filter(...);
     if (activeStatusFilter === 'pending') filtered = filtered.filter(...);
   }
   ```

2. **Ordenação** (Linhas 417-428):
   ```javascript
   const getWeight = (t) => {
     if (t.completed) return 1;          // Menor peso
     if (t.priority === 'urgente') return 4;
     if (t.priority === 'normal') return 3;
     return 2; // low (Sem prioridade)
   };
   filtered.sort((a, b) => (wB - wA) || (b.id - a.id));
   ```
   - **Ordem de exibição:** Urgente (4) → Baixa (3) → Sem prioridade (2) → Concluídas (1)
   - Desempate por ID (mais recente primeiro)

3. **Determinação de Status Class** (Linhas 439-443):
   ```javascript
   let statusClass = 'status-pending';
   if (activeStatusFilter === 'trash') statusClass = 'status-trash';
   else if (task.completed) statusClass = 'status-completed';
   else if (task.priority === 'urgente') statusClass = 'status-urgent';
   else if (task.priority === 'low') statusClass = 'status-low';
   ```

4. **Renderização de Cards** (Linhas 472-480):
   - Usa `innerHTML` para injetar estrutura
   - Inclui título, descrição (HTML do Quill), meta (ticket, pasta)
   - Botões de ação (completar/restaurar)

**IMPORTANTE:** A descrição é renderizada como HTML bruto do Quill:
```javascript
<div class="card-desc ql-editor" style="padding:0 !important; pointer-events:none;">
  ${task.desc || ''}
</div>
```

#### `openModal(taskId)` (Linhas 253-296)
**Responsabilidade:** Abrir modal para criar ou editar tarefa.

**Modo Edição (taskId fornecido):**
```javascript
if (taskId) {
  const task = tasks.find(t => t.id === taskId);
  modalTitleInput.value = task.title;
  quill.root.innerHTML = task.desc || '';  // Injetar HTML
  modalPrioritySelect.value = task.priority || 'normal';
  // ...
  modalDeleteBtn.textContent = task.deletedAt 
    ? 'Excluir Permanentemente' 
    : 'Mover para Lixeira';
}
```

**Modo Criação:**
```javascript
else {
  modalTitleInput.value = '';
  quill.setText('');
  modalPrioritySelect.value = 'low';  // PADRÃO: Sem prioridade
  modalFolderSelect.value = activeFolderId !== 'all' ? activeFolderId : '';
  modalDeleteBtn.classList.add('hidden');
}
```

#### `saveCurrentTask()` (Linhas 303-339)
**Responsabilidade:** Salvar tarefa nova ou atualizada.

**Extração de Conteúdo:**
```javascript
const htmlContent = quill.root.innerHTML; // HTML completo do editor
const title = modalTitleInput.value.trim();
const priority = modalPrioritySelect.value;
```

**Criação de Tarefa:**
```javascript
tasks.unshift({
  id: Date.now(),
  title,
  desc: htmlContent,           // HTML do Quill
  richDesc: true,              // Flag para indicar HTML
  folderId,
  priority,
  ticket,
  completed: false,
  createdAt: new Date().toISOString()
});
```

#### `cleanupTrash()` (Linhas 203-209)
**Responsabilidade:** Remover automaticamente itens da lixeira com mais de 30 dias.

```javascript
const now = Date.now();
const limit = 30 * 24 * 60 * 60 * 1000; // 30 dias em ms
tasks = tasks.filter(t => 
  !t.deletedAt || (now - new Date(t.deletedAt).getTime() <= limit)
);
```

**Chamado:** Na inicialização do app (linha 60).

#### Importação de Arquivos (Linhas 67-108)

**Suporte:** `.txt` e `.html`

**Fluxo:**
1. Usuário clica em "Importar" → Trigger `<input type="file">`
2. FileReader lê o arquivo como texto
3. Extrai título do nome do arquivo (sem extensão)
4. Cria nova tarefa:
   ```javascript
   const newTask = {
     id: Date.now(),
     title: title,
     desc: content,  // ou HTML formatado para .txt
     priority: 'low',  // PADRÃO
     folderId: activeFolderId !== 'all' ? activeFolderId : null,
     completed: false,
     createdAt: new Date().toISOString()
   };
   ```

**Conversão de .txt para HTML:**
```javascript
if (file.name.endsWith('.html')) {
  newTask.desc = content; // HTML direto
} else {
  // Converte linhas de texto em parágrafos HTML
  newTask.desc = content.split('\n')
    .map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>')
    .join('');
}
```

#### Exportação de Tarefas (Linhas 132-155)

**Formatos:** TXT ou HTML

**TXT:**
```javascript
content = quill.getText();  // Texto puro sem formatação
content = `Título: ${title}\n\n${content}`;
```

**HTML:**
```javascript
content = quill.root.innerHTML;
content = `<!DOCTYPE html><html><head>
  <meta charset="utf-8"><title>${title}</title>
</head><body><h1>${title}</h1>${content}</body></html>`;
```

**Download:**
```javascript
const blob = new Blob([content], { type: mime });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `${title}.${ext}`;
a.click();
URL.revokeObjectURL(url);
```

---

## 🔐 Estrutura de Dados Detalhada

### Task Object
```typescript
interface Task {
  id: number;                    // Timestamp da criação
  title: string;                 // Título da tarefa
  desc: string;                  // HTML com formatação do Quill
  richDesc: boolean;             // Sempre true (indica HTML)
  folderId: string | null;       // ID da pasta ou null
  priority: 'low' | 'normal' | 'urgente';  // Prioridade
  ticket: string;                // Tag/ticket de referência
  completed: boolean;            // Status de conclusão
  createdAt: string;             // ISO 8601 timestamp
  updatedAt?: string;            // ISO 8601 timestamp (opcional)
  deletedAt: string | null;      // ISO 8601 ou null (soft delete)
}
```

**Exemplo Real:**
```json
{
  "id": 1736174568123,
  "title": "Implementar sistema de prioridades",
  "desc": "<p>Adicionar três níveis:</p><ul><li>Sem prioridade</li><li>Baixa</li><li>Urgente</li></ul>",
  "richDesc": true,
  "folderId": "work",
  "priority": "urgente",
  "ticket": "TASK-001",
  "completed": false,
  "createdAt": "2026-01-06T15:22:48.123Z",
  "updatedAt": "2026-01-06T15:25:10.456Z",
  "deletedAt": null
}
```

### Folder Object
```typescript
interface Folder {
  id: string;     // 'f_' + timestamp ou ID customizado
  name: string;   // Nome exibido
}
```

**Folders Padrão:**
```javascript
[
  { id: 'work', name: 'Trabalho' },
  { id: 'personal', name: 'Pessoal' }
]
```

---

## 🧩 Integrações e Dependências

### Quill.js Configuration

**Inicialização (Linhas 36-46):**
```javascript
const quill = new Quill('#editor-container', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'strike'],           // Formatação de texto
      [{'list': 'ordered'}, {'list': 'bullet'}, {'list': 'check'}],  // Listas
      ['clean']                                // Limpar formatação
    ]
  },
  placeholder: 'Descreva os detalhes da tarefa...'
});
```

**Métodos Usados:**
- `quill.root.innerHTML`: Obter/definir HTML completo
- `quill.setText('')`: Limpar editor
- `quill.getText()`: Obter texto puro (para export TXT)

**Estilos Customizados (style.css, linhas 643-669):**
```css
.ql-toolbar.ql-snow {
  border: none !important;
  border-bottom: 1px solid var(--border) !important;
  padding: 12px 24px !important;
}

.ql-container.ql-snow {
  border: none !important;
  flex: 1;
  font-family: 'Outfit', sans-serif !important;
  font-size: 1rem !important;
}
```

### LocalStorage Schema

**Keys:**
- `onboardingTasks`: Array serializado de tarefas
- `onboardingFolders`: Array serializado de pastas
- `theme`: String ('light' | 'dark')

**Persistência Automática:**
```javascript
function saveTasks() {
  localStorage.setItem('onboardingTasks', JSON.stringify(tasks));
}
function saveFolders() {
  localStorage.setItem('onboardingFolders', JSON.stringify(folders));
}
```

**Carregamento:**
```javascript
let tasks = JSON.parse(localStorage.getItem('onboardingTasks')) || [];
```

---

## 🎨 Sistema de Temas

### Detecção Automática
```javascript
function initTheme() {
  const t = localStorage.getItem('theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}
```

### Toggle Manual
```javascript
themeToggleBtn.addEventListener('click', () => {
  const n = document.documentElement.getAttribute('data-theme') === 'dark' 
    ? 'light' 
    : 'dark';
  document.documentElement.setAttribute('data-theme', n);
  localStorage.setItem('theme', n);
});
```

### Variáveis CSS Reagindo ao Tema
```css
:root { --primary: #8B5CF6; }
[data-theme="dark"] { --primary: #A78BFA; }
```

---

## 🐛 Tratamento de Erros e Edge Cases

### 1. Título Vazio
```javascript
function saveCurrentTask() {
  const title = modalTitleInput.value.trim();
  if (!title) { 
    modalTitleInput.focus(); 
    return; 
  }
  // ...
}
```

### 2. Pastas Excluídas
```javascript
window.deleteFolder = (id) => {
  folders = folders.filter(x => x.id !== id);
  tasks = tasks.map(t => 
    t.folderId === id ? { ...t, folderId: null } : t
  );
  // Se estiver na pasta sendo excluída, volta para "Todas"
  if (activeFolderId === id) window.selectFolder('all');
};
```

### 3. XSS Protection
```javascript
function escapeHtml(text) {
  if (!text) return '';
  const d = document.createElement('div');
  d.textContent = text;  // Sanitiza automaticamente
  return d.innerHTML;
}
```

**Uso:**
```javascript
<h3 class="card-title">${escapeHtml(task.title)}</h3>
```

### 4. Empty State
```javascript
if (filtered.length === 0) {
  emptyState.classList.add('visible');
  emptyState.querySelector('p').textContent = 
    activeStatusFilter === 'trash' 
      ? 'Lixeira vazia 🗑️' 
      : 'Nenhum card por aqui ✨';
}
```

---

## 🔄 Fluxos de Trabalho Completos

### Fluxo: Criar Nova Tarefa

```
1. Usuário clica "Nova Tarefa"
   ↓
2. openModal(null)
   - Limpa campos
   - Define priority = 'low' (padrão)
   - Mostra modal
   ↓
3. Usuário preenche campos e clica "Salvar"
   ↓
4. saveCurrentTask()
   - Valida título
   - Extrai HTML do Quill
   - Cria objeto task
   - tasks.unshift(newTask)
   ↓
5. saveTasks()
   - Serializa array
   - Salva no localStorage
   ↓
6. renderTasks()
   - Filtra e ordena
   - Gera HTML dos cards
   - Injeta no DOM
   ↓
7. closeModal()
```

### Fluxo: Soft Delete → Restore

```
1. Usuário clica "Mover para Lixeira" no modal
   ↓
2. softDeleteTask(id)
   - Adiciona deletedAt: ISO timestamp
   - Não remove do array
   ↓
3. renderTasks() com activeStatusFilter = 'all'
   - filtered.filter(t => !t.deletedAt)
   - Tarefa NÃO aparece
   ↓
4. Usuário clica "Lixeira" no filtro
   ↓
5. renderTasks() com activeStatusFilter = 'trash'
   - filtered.filter(t => t.deletedAt)
   - Tarefa aparece com statusClass = 'status-trash'
   - Botão "Restaurar" visível
   ↓
6. Usuário clica "Restaurar"
   ↓
7. restoreTask(id)
   - Define deletedAt = null
   ↓
8. renderTasks()
   - Tarefa volta para lista normal
```

### Fluxo: Importação de Arquivo

```
1. Usuário clica "Importar"
   ↓
2. <input type="file"> é ativado
   ↓
3. Usuário seleciona arquivo .txt ou .html
   ↓
4. FileReader.readAsText(file)
   ↓
5. reader.onload = (ev) => { ... }
   - content = ev.target.result
   - title = nome do arquivo sem extensão
   ↓
6. Se .html:
     newTask.desc = content (HTML direto)
   Se .txt:
     newTask.desc = linhas convertidas em <p>...</p>
   ↓
7. tasks.unshift(newTask)
   - Com priority: 'low' (padrão)
   - Com folderId: pasta ativa ou null
   ↓
8. saveTasks() → renderTasks()
   ↓
9. Alert "Nota importada com sucesso!"
```

---

## 🧪 Pontos Críticos para Testes

### 1. Ordenação de Tarefas
**Arquivo:** `script.js`, linhas 417-428

**Cenário de Teste:**
```javascript
// Criar tarefas com prioridades diferentes
const testTasks = [
  { priority: 'low', completed: false },      // Peso 2
  { priority: 'normal', completed: false },   // Peso 3
  { priority: 'urgente', completed: false },  // Peso 4
  { priority: 'low', completed: true }        // Peso 1
];

// Ordem esperada: urgente → normal → low (pendente) → low (concluída)
```

### 2. Soft Delete e Limpeza
**Arquivo:** `script.js`, linhas 203-209

**Cenário de Teste:**
```javascript
// Criar tarefa com deletedAt há 31 dias
const oldTask = {
  id: 1,
  deletedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
};

// Após cleanupTrash(), tarefa deve ser removida
```

### 3. XSS em Títulos
**Arquivo:** `script.js`, linha 474

**Cenário de Teste:**
```javascript
const maliciousTask = {
  title: '<script>alert("XSS")</script>',
  // ...
};

// Título deve ser exibido como texto, não executado
// Graças ao escapeHtml()
```

### 4. Prioridade Padrão
**Arquivo:** `script.js`, linha 288

**Cenário de Teste:**
```javascript
// Ao criar nova tarefa
openModal(null);
// modalPrioritySelect.value deve ser 'low'
```

---

## 🚀 Melhorias Futuras (Orientações para IA)

### 1. Implementar Drag and Drop
**Localização sugerida:** `script.js`, após linha 176

```javascript
// Adicionar event listeners para dragstart, dragover, drop
taskList.addEventListener('dragover', (e) => { ... });
taskList.addEventListener('drop', (e) => {
  // Reordenar array tasks baseado na posição
  // Adicionar campo 'order: number' às tarefas
});
```

**CSS necessário:** Adicionar `.dragging` class em `style.css`

### 2. Sistema de Busca
**Localização sugerida:** `index.html`, linha 88 (antes dos filtros)

```html
<input type="text" id="searchInput" placeholder="Buscar tarefas..." />
```

**Script.js:**
```javascript
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  // Adicionar filtro em renderTasks()
  filtered = filtered.filter(t => 
    t.title.toLowerCase().includes(query) ||
    quill.getText(t.desc).toLowerCase().includes(query)
  );
});
```

### 3. Subtarefas (Checklists)
**Estrutura de dados:**
```javascript
interface Task {
  // ... campos existentes
  subtasks?: Array<{
    id: number;
    text: string;
    completed: boolean;
  }>;
}
```

**Renderização:** Adicionar lista de checkboxes no card e modal

### 4. IndexedDB para Performance
**Motivação:** LocalStorage tem limite de ~5-10MB

**Migração sugerida:**
```javascript
// Criar database
const dbPromise = indexedDB.open('TodoApp', 1);
dbPromise.onupgradeneeded = (event) => {
  const db = event.target.result;
  db.createObjectStore('tasks', { keyPath: 'id' });
  db.createObjectStore('folders', { keyPath: 'id' });
};

// Substituir localStorage.setItem/getItem por transações IndexedDB
```

---

## 📊 Métricas de Código

- **Linhas Totais:** ~1444 linhas (HTML: 180, CSS: 760, JS: 504)
- **Complexidade Ciclomática (renderTasks):** ~15
- **Dependências Externas:** 2 (Quill.js, Google Fonts)
- **Tamanho Estimado:** ~50KB (uncompressed)
- **Browser Support:** Chrome 90+, Firefox 88+, Safari 14+

---

## 🔑 Variáveis e Estados Globais

**Estado da Aplicação (script.js, linhas 48-57):**
```javascript
let tasks = [];                 // Array de todas as tarefas
let folders = [];               // Array de todas as pastas
let activeFolderId = 'all';     // Pasta selecionada
let activeStatusFilter = 'all'; // Filtro ativo (all, pending, urgent, completed, trash)
let currentTaskId = null;       // ID da tarefa em edição (null = criar nova)
```

**Constantes DOM (linhas 2-32):**
- Todos os elementos são referenciados no início do script
- Permite fácil manutenção e autocomplete

---

## 🎯 Convenções e Padrões

### Nomenclatura
- **Variáveis:** camelCase (`activeFolderId`, `taskList`)
- **Funções:** verbos em camelCase (`renderTasks`, `saveCurrentTask`)
- **Classes CSS:** kebab-case (`.task-card`, `.modal-overlay`)
- **IDs HTML:** camelCase (`#taskModalOverlay`)

### Event Listeners
- Todos registrados na seção de inicialização (linhas 65-196)
- Uso de arrow functions para contexto correto
- `stopPropagation()` para evitar bubbling indesejado

### Rendering Pattern
```javascript
function render() {
  container.innerHTML = '';  // Limpar
  items.forEach(item => {
    const el = document.createElement('div');
    el.innerHTML = `...`;
    container.appendChild(el);
  });
}
```

### Data Persistence
- **Write:** Após cada modificação (`saveTasks()`, `saveFolders()`)
- **Read:** Apenas na inicialização
- **Formato:** JSON serializado

---

## 📝 Notas para IA Continuar Desenvolvimento

### Ao Adicionar Novas Funcionalidades:
1. **Estado:** Adicionar novas variáveis globais após linha 57
2. **Event Listeners:** Registrar após linha 196
3. **Funções:** Adicionar após linha 398 (antes de renderTasks)
4. **CSS:** Adicionar no final de `style.css` (ou criar arquivo separado)

### Ao Modificar Prioridades:
- **HTML:** Atualizar `<select id="modalPrioritySelect">` (linhas 136-140)
- **CSS:** Adicionar novas variáveis de cor em `:root` (linhas 1-36)
- **JS:** Atualizar função `getWeight()` (linhas 419-424)

### Ao Adicionar Novos Filtros:
- **HTML:** Adicionar botão em `.filters` (após linha 93)
- **JS:** Adicionar caso em `renderTasks()` (após linha 411)

### Performance Tips:
- **Renderização:** Atualmente re-renderiza tudo. Para muitos cards (>100), considerar virtualização
- **LocalStorage:** Trocar por IndexedDB se superar 1000 tarefas
- **Event Delegation:** Usar no taskList para evitar múltiplos listeners

---

**Última Atualização:** 2026-01-06  
**Versão:** 1.0.0  
**Status:** Produção
