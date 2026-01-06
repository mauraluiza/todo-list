# To-Do List - Sistema de Gerenciamento de Tarefas

## 📋 Visão Geral

Este é um aplicativo web moderno de gerenciamento de tarefas (to-do list) desenvolvido em vanilla JavaScript, HTML e CSS. O sistema oferece uma experiência rica de usuário com edição de texto avançada, suporte a imagens com redimensionamento dinâmico, organização por pastas, sistema de prioridades e funcionalidades de importação/exportação.

## ✨ Características Principais

### 1. **Gerenciamento de Tarefas**
- ✅ Criação, edição e exclusão de tarefas
- 📝 Editor de texto rico (Rich Text Editor) usando Quill.js
- 🖼️ **Suporte a Imagens:** Upload, alinhamento e redimensionamento por arraste
- 🎯 Sistema de prioridades com três níveis
- 📅 **Controle de Prazos:** Campo de data para vencimento das tarefas
- 📁 Organização em pastas personalizáveis
- 🏷️ Sistema de tickets/tags para referência
- ✓ Marcação de tarefas como concluídas
- 🗑️ Lixeira com exclusão reversível (soft delete)

### 2. **Interface do Usuário**
- 🎨 Design moderno e minimalista
- 🌓 Modo claro/escuro com transições suaves e placeholder legível no dark mode
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
   - Abra o arquivo `index.html` em um navegador moderno.

2. **Criar uma tarefa:**
   - Clique no botão "Nova Tarefa".
   - Preencha o título e descrição.
   - **Imagens:** Clique no ícone de imagem na toolbar para fazer upload.
   - **Edição de Imagem:** Clique na imagem inserida para abrir o menu de alinhamento e arraste as alças nas bordas/cantos para redimensionar livremente.
   - Selecione pasta, prioridade, prazo e ticket (opcional).
   - Clique em "Salvar".

3. **Organizar em pastas:**
   - Use o botão "+" na sidebar para criar pastas.
   - Clique em uma pasta para ver suas tarefas.

4. **Filtrar tarefas:**
   - Use os botões de filtro: Todas, Pendentes, Urgentes, Concluídas.
   - Clique no botão "Lixeira" para ver itens excluídos.

5. **Importar/Exportar:**
   - **Importar:** Clique em "Importar" no cabeçalho.
   - **Exportar:** Abra uma tarefa e use o dropdown "Exportar" no rodapé do modal.

## 💾 Armazenamento de Dados

Os dados são salvos automaticamente no **LocalStorage** do navegador:
- `onboardingTasks`: Array de tarefas (incluindo imagens em Base64).
- `onboardingFolders`: Array de pastas personalizadas.
- `theme`: Preferência de tema (light/dark).

## 🎨 Temas

O aplicativo suporta dois temas:
- **Modo Claro:** Tons de branco, cinza claro e roxo (#8B5CF6).
- **Modo Escuro:** Tons de azul escuro (#0F172A). O placeholder do editor foi ajustado para melhor legibilidade.

## 📱 Responsividade

- **Desktop:** Sidebar fixa, grid de tarefas responsivo.
- **Mobile:** Sidebar retrátil, modal em tela cheia.

## 🛠️ Tecnologias Utilizadas

- **HTML5 & CSS3:** Layout semântico, variáveis CSS, Grid/Flexbox e animações.
- **JavaScript (ES6+):** Manipulação de DOM, Event Listeners e lógica baseada em estado.
- **Quill.js 1.3.6:** Editor de texto rico com customização de toolbar e handlers.
- **Image Handling:** Conversão automática para Base64 e sistema customizado de resizing via mouse events.
- **Google Fonts:** Fonte Outfit.
- **LocalStorage API:** Persistência de dados.

## 🔮 Funcionalidades Futuras (Sugestões)

- [ ] Drag and drop para reordenar tarefas na lista principal
- [ ] Busca/pesquisa de tarefas por título ou conteúdo
- [ ] Subtarefas (checklists dentro de tarefas)
- [ ] Lembretes e notificações baseados no prazo (due date)
- [ ] Sincronização na nuvem/IndexedDB para backups maiores
- [ ] Atalhos de teclado

## 📝 Notas para Continuidade do Desenvolvimento

### Estrutura de Dados das Tarefas
```javascript
{
  id: timestamp,
  title: string,
  desc: string (HTML incluindo Base64),
  richDesc: boolean (true),
  folderId: string | null,
  priority: 'low' | 'normal' | 'urgente',
  dueDate: string (YYYY-MM-DD) | "",
  ticket: string,
  completed: boolean,
  createdAt: ISO string,
  updatedAt: ISO string (opcional),
  deletedAt: ISO string | null
}
```

## 👨‍💻 Autor

Desenvolvido com foco em UX/UI moderno e código limpo.

## 📄 Licença

Este projeto é de código aberto para fins educacionais e pessoais.
