# Documentação Técnica - To-Do List Application

## 📐 Arquitetura do Sistema

### Visão Geral
Aplicação Single Page Application (SPA) construída com Vanilla JavaScript, sem frameworks. O sistema segue o padrão de **Event-Driven Architecture** com estado centralizado no LocalStorage. O editor de texto rico é integrado via Quill.js com extensões customizadas para manipulação de imagens.

### Fluxo de Dados
```
User Input → Event Listeners → State Update → LocalStorage → Re-render → DOM Update
```

## 🗂️ Estrutura de Arquivos

### 1. `index.html` (~184 linhas)

**Estrutura HTML Semântica:**

```html
<body>
  <div class="layout-wrapper">
    <aside class="sidebar">...</aside>  <!-- Navegação de pastas -->
    <main class="app-container">
      <header>...</header>              <!-- Título, controles, botões -->
      <div class="filters">...</div>    <!-- Filtros de status -->
      <div id="taskList" class="task-grid"></div>  <!-- Grid de cards de tarefas -->
    </main>
  </div>
  
  <div class="modal-overlay">         <!-- Modal de edição -->
    <div class="modal-container">
      <div class="modal-header">...</div>
      <div class="modal-body">
        <div id="editor-container"></div> <!-- Quill Editor -->
        <div class="modal-meta-controls">
          <!-- Campo de Pasta, Prioridade, Prazo e Ticket -->
          <input type="date" id="modalDueDateInput">
        </div>
      </div>
      <div class="modal-footer">...</div>
    </div>
  </div>
</body>
```

### 2. `style.css` (~1050 linhas)

**Novas Seções e Variáveis:**
- **Imagens no Editor:** Estilos para `img` dentro da classe `.ql-editor`, incluindo transições e bordas.
- **Resize Handles:** Sistema de alças (`.resize-handle`) para redimensionamento diagonal e lateral.
- **Menu de Edição de Imagem:** Classe `.image-edit-menu` para o menu flutuante de alinhamento.
- **Placeholder Visibility:** Customização do pseudo-elemento `.ql-editor.ql-blank::before` para garantir legibilidade no modo escuro (`#94A3B8`).

**Classes de Alinhamento Dinâmico:**
```css
.ql-editor img.img-left   { display: block; margin-left: 0; margin-right: auto; }
.ql-editor img.img-center { display: block; margin-left: auto; margin-right: auto; }
.ql-editor img.img-right  { display: block; margin-left: auto; margin-right: 0; }
```

### 3. `script.js` (~800 linhas)

**Novos Módulos e Lógica:**

#### A. Sistema de Imagens (Custom Quill Integration)
1. **`imageHandler()`**: Intercepta o clique no botão de imagem da toolbar.
   - Abre seletor de arquivos.
   - Converte imagem para Base64 via `FileReader`.
   - Insere no Quill como `insertEmbed`.
   - Limite de 5MB por arquivo para evitar estouro do LocalStorage.

2. **Resize Widget (`createResizeWrapper`)**:
   - Cria um overlay dinâmico com 8 alças (`nw`, `n`, `ne`, `e`, `se`, `s`, `sw`, `w`).
   - Escuta eventos de mouse (`mousedown`, `mousemove`, `mouseup`).
   - **Lógica de Proporção:** Alças de canto mantêm a `aspectRatio` original, enquanto alças laterais permitem redimensionamento livre.

3. **Menu de Contexto (`createImageMenu`)**:
   - Aparece ao clicar em qualquer `IMG` dentro do editor.
   - Permite alterar o alinhamento via injeção de classes CSS.
   - Permite a remoção imediata do nó da imagem.

#### B. Persistência de Prazos
- Adicionada referência ao `modalDueDateInput` (linha 22).
- Funções `openModal` e `saveCurrentTask` agora manipulam a propriedade `dueDate` no objeto da tarefa.

---

## 🔐 Estrutura de Dados Detalhada

### Task Object
```typescript
interface Task {
  id: number;                    // Timestamp da criação
  title: string;                 // Título da tarefa
  desc: string;                  // HTML completo (incluindo imagens em Base64 e estilos inline)
  richDesc: boolean;             // Flag de renderização rich text
  folderId: string | null;       // ID da pasta vinculada
  priority: 'low' | 'normal' | 'urgente'; 
  dueDate: string;               // Formato "YYYY-MM-DD" para prazos
  ticket: string;                // Tag/Referência customizada
  completed: boolean;            
  createdAt: string;             // ISO string
  updatedAt?: string;            // ISO string
  deletedAt: string | null;      // ISO string (soft delete)
}
```

---

## 🔄 Fluxos de Trabalho Avançados

### Fluxo: Inserção e Redimensionamento de Imagem

```
1. Clique no botão de imagem na Toolbar
   ↓
2. imageHandler: Seleção de arquivo → Conversão Base64 → Inserção
   ↓
3. Clique do usuário na imagem inserida
   ↓
4. showImageMenu:
   - Exibe Alças de Resize (8 pontos)
   - Exibe Menu de Alinhamento acima/abaixo da imagem
   ↓
5. Arraste de alça (Resizing):
   - Calcula delta de movimento
   - Aplica width/height inline na tag <img>
   - Sincroniza posição do resize wrapper
   ↓
6. Escolha de Alinhamento:
   - Adiciona classe (ex: img-center) à tag <img>
```

---

## 🚀 Melhorias Futuras (Orientações para IA)

### 1. Sistema de Busca / Filtro de Texto
**Onde implementar:** Em `renderTasks()`.
**Dica:** Use `quill.getText()` para converter a descrição HTML em texto puro antes de comparar com a query de busca para evitar tags no resultado.

### 2. Otimização de Imagens
**Onde implementar:** Em `imageHandler()`.
**Dica:** Antes de salvar em Base64, use um `<canvas>` para redimensionar imagens muito grandes proporcionalmente, reduzindo o peso do LocalStorage.

### 3. Sincronização de Resize
**Problema:** Atualmente as alças seguem o scroll da página e do modal via event listeners.
**Dica:** Se adicionar animações complexas no modal, garanta que o `updateResizeWrapper()` seja chamado no final da transição.

### 4. Notificações de Prazo
**Dica:** Na inicialização, compare a data atual com `task.dueDate` e destaque cards que vencem hoje ou estão atrasados em `renderTasks()`.

---

## 📊 Métricas e Convenções
- **JS Style:** Vanilla ES6, escopo centralizado em `DOMContentLoaded`.
- **CSS Style:** Variáveis para tema, nomes semânticos, mobile-first nas seções críticas.
- **LocalStorage Usage:** Cuidado com o limite de 5MB do navegador ao inserir muitas imagens Base64.

---

## 🔑 Variáveis e Estados Globais

**Estado da Aplicação (script.js):**
- `tasks`: Array de objetos `Task`
- `folders`: Array de objetos `Folder`
- `activeFolderId`: Filtro de pasta atual
- `activeStatusFilter`: Filtro de status (all, pending, etc.)
- `currentTaskId`: ID da tarefa aberta no modal (null se nova)

**Estado de Edição de Imagem:**
- `currentEditingImage`: Referência ao nó `<img>` sendo editado
- `isResizing`: Boolean indicando arraste ativo

**Última Atualização:** 2026-01-06  
**Versão:** 1.2.0  
**Status:** Produção ativa
