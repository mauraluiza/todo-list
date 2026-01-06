# To-Do List - Sistema de Gerenciamento de Tarefas

## 📋 Visão Geral

Este é um aplicativo web moderno de gerenciamento de tarefas (to-do list) desenvolvido em vanilla JavaScript, HTML e CSS. O sistema oferece uma experiência rica de usuário com edição de texto avançada, organização por pastas, sistema de prioridades e funcionalidades de importação/exportação.

## ✨ Características Principais

### 1. **Gerenciamento de Tarefas**
- ✅ Criação, edição e exclusão de tarefas
- 📝 Editor de texto rico (Rich Text Editor) usando Quill.js
- 🎯 Sistema de prioridades com três níveis
- 📁 Organização em pastas personalizáveis
- 🏷️ Sistema de tickets/tags para referência
- ✓ Marcação de tarefas como concluídas
- 🗑️ Lixeira com exclusão reversível (soft delete)

### 2. **Interface do Usuário**
- 🎨 Design moderno e minimalista
- 🌓 Modo claro/escuro com transições suaves
- 📱 Interface responsiva
- 🎭 Animações e transições elegantes
- 💫 Background com gradientes radiais sutis
- 🪟 Modal de edição em tela cheia com efeito de blur

### 3. **Funcionalidades Avançadas**
- 📥 Importação de arquivos `.txt` e `.html`
- 📤 Exportação de tarefas em formatos TXT ou HTML
- 🔍 Filtros por status (todas, pendentes, urgentes, concluídas)
- 📂 Filtros por pasta
- 🗂️ Ordenação inteligente por prioridade
- 💾 Persistência local usando LocalStorage
- 🧹 Limpeza automática da lixeira (30 dias)

## 🎯 Sistema de Prioridades

O sistema possui três níveis de prioridade:

1. **Sem prioridade** (`low`) - Cor: Cinza (#94A3B8)
   - Prioridade padrão para novas tarefas
   - Peso de ordenação: 2

2. **Baixa** (`normal`) - Cor: Laranja (#F59E0B)
   - Prioridade intermediária
   - Peso de ordenação: 3

3. **Urgente** (`urgente`) - Cor: Vermelho (#EF4444)
   - Maior prioridade
   - Peso de ordenação: 4

**Ordem de exibição:** Urgente → Baixa → Sem prioridade → Concluídas (peso: 1)

## 🏗️ Estrutura do Projeto

```
todo-list/
├── index.html          # Estrutura HTML principal
├── style.css           # Estilos e temas
├── script.js           # Lógica da aplicação
├── README.md           # Este arquivo (overview)
└── TECHNICAL.md        # Documentação técnica detalhada
```

## 🚀 Como Usar

1. **Abrir o aplicativo:**
   - Abra o arquivo `index.html` em um navegador moderno
   - Ou utilize um servidor local (ex: Live Server, http-server)

2. **Criar uma tarefa:**
   - Clique no botão "Nova Tarefa"
   - Preencha o título e descrição (com formatação rica)
   - Selecione pasta, prioridade e ticket (opcional)
   - Clique em "Salvar"

3. **Organizar em pastas:**
   - Use o botão "+" na sidebar para criar pastas
   - Clique em uma pasta para ver suas tarefas
   - Renomeie ou exclua pastas usando os ícones ao passar o mouse

4. **Filtrar tarefas:**
   - Use os botões de filtro: Todas, Pendentes, Urgentes, Concluídas
   - Clique no botão "Lixeira" para ver itens excluídos

5. **Importar/Exportar:**
   - **Importar:** Clique em "Importar" no cabeçalho e selecione um arquivo .txt ou .html
   - **Exportar:** Abra uma tarefa e clique em "Exportar" no rodapé do modal

## 💾 Armazenamento de Dados

Os dados são salvos automaticamente no **LocalStorage** do navegador:
- `onboardingTasks`: Array de todas as tarefas
- `onboardingFolders`: Array de pastas personalizadas
- `theme`: Preferência de tema (light/dark)

## 🎨 Temas

O aplicativo suporta dois temas com variáveis CSS personalizadas:

- **Modo Claro:** Tons de branco, cinza claro e roxo (#8B5CF6)
- **Modo Escuro:** Tons de azul escuro (#0F172A) com ajustes de contraste

O tema é detectado automaticamente baseado na preferência do sistema e pode ser alternado manualmente.

## 📱 Responsividade

O layout se adapta para:
- **Desktop:** Sidebar fixa, grid de tarefas responsivo
- **Mobile:** Sidebar retrátil, modal em tela cheia

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Estrutura semântica
- **CSS3:** Variáveis CSS, Grid, Flexbox, animações
- **JavaScript (ES6+):** Vanilla JS com features modernas
- **Quill.js 1.3.6:** Editor de texto rico
- **Google Fonts:** Fonte Outfit para tipografia moderna
- **LocalStorage API:** Persistência de dados
- **FileReader API:** Importação de arquivos
- **Blob API:** Exportação de arquivos

## 🔮 Funcionalidades Futuras (Sugestões)

- [ ] Drag and drop para reordenar tarefas
- [ ] Busca/pesquisa de tarefas
- [ ] Subtarefas (checklists dentro de tarefas)
- [ ] Anexos de imagens
- [ ] Lembretes e notificações
- [ ] Sincronização na nuvem
- [ ] Colaboração em tempo real
- [ ] Estatísticas e dashboards
- [ ] PWA (Progressive Web App)
- [ ] Atalhos de teclado

## 📝 Notas para Continuidade do Desenvolvimento

### Convenções de Código
- Variáveis em camelCase
- Funções descritivas em verbos (render, save, toggle)
- Estados globais no escopo principal do DOMContentLoaded
- Event listeners configurados na seção de inicialização

### Estrutura de Dados das Tarefas
```javascript
{
  id: timestamp,
  title: string,
  desc: string (HTML),
  richDesc: boolean,
  folderId: string | null,
  priority: 'low' | 'normal' | 'urgente',
  ticket: string,
  completed: boolean,
  createdAt: ISO string,
  updatedAt: ISO string (opcional),
  deletedAt: ISO string | null
}
```

### Estrutura de Dados das Pastas
```javascript
{
  id: string ('f_' + timestamp ou IDs específicos),
  name: string
}
```

## 👨‍💻 Autor

Desenvolvido com foco em UX/UI moderno e código limpo.

## 📄 Licença

Este projeto é de código aberto para fins educacionais e pessoais.
