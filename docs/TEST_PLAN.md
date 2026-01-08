# Plano de Testes de Usabilidade - Maura's To-Do List

Este documento descreve os cenários de teste recomendados para validar a funcionalidade, responsividade e experiência do usuário (UX) da aplicação To-Do List, tanto em ambientes Desktop quanto Mobile.

## 1. Configuração do Ambiente
*   **Desktop:** Testar no Google Chrome, Firefox e Edge (últimas versões). Use a ferramenta de inspeção do navegador para simular resoluções responsivas.
*   **Mobile:** Testar em dispositivos reais iOS (Safari e Chrome) e Android (Chrome). Se não possível, use o modo responsivo do navegador (DevTools - F12).

---

## 2. Testes de Layout e Responsividade

### 📱 Mobile (Smartphone)
*   **[ ] Menu Lateral e Overlay:**
    *   Ao abrir o app, o menu lateral (Pastas) deve estar oculto.
    *   Clicar no ícone de menu (canto superior esquerdo) deve abrir o menu lateral *com animação suave*.
    *   Deve aparecer um fundo escuro (overlay) atrás do menu.
    *   Clicar neste fundo escuro deve fechar o menu.
    *   O menu deve fechar automaticamente ao selecionar uma pasta.
*   **[ ] Botão de Nova Tarefa (FAB):**
    *   Verificar se o botão redondo flutuante (+) está fixo no canto inferior direito.
    *   Ao rolar a lista de tarefas, o botão deve permanecer visível.
*   **[ ] Filtros Horizontais:**
    *   Verificar se os botões de filtro (Todas, Pendentes, etc.) estão em uma linha horizontal no topo.
    *   Tentar deslizar (scroll horizontal) os filtros para ver se funcionam fluidamente.
*   **[ ] Cartões de Tarefa:**
    *   Os cartões devem ocupar a largura total (com margens confortáveis).
    *   O texto não deve estar cortado ou ilegível.
*   **[ ] Modal de Edição (Full Screen):**
    *   Ao criar/editar uma tarefa, a janela deve ocupar a tela inteira.
    *   O teclado virtual não deve quebrar o layout (o botão "Salvar" deve permanecer acessível ou ser rolável).

### 💻 Desktop
*   **[ ] Layout Geral:**
    *   Menu lateral fixo à esquerda (sempre visível).
    *   Lista de tarefas organizada em grade (GRID) responsiva (cards se ajustam conforme largura da janela).
*   **[ ] Modal de Edição:**
    *   Deve aparecer como uma janela centralizada (pop-up) com fundo escurecido.

---

## 3. Funcionalidades Principais (Core)

### Gestão de Tarefas
*   **[ ] Criar Tarefa Simples:**
    *   Clicar em "Nova Tarefa".
    *   Inserir apenas Título e Salvar. Verificar se aparece no topo da lista "Todas".
*   **[ ] Criar Tarefa Completa:**
    *   Inserir Título e Descrição rica (Negrito, Lista).
    *   Selecionar uma Prioridade (Ex: Urgente).
    *   Definir uma Data e adicionar um Ticket (#123).
    *   Salvar e verificar se o card exibe a borda colorida da prioridade e a etiqueta do ticket.
*   **[ ] Editar Tarefa:**
    *   Clicar em um card existente.
    *   Alterar o texto e mudar a pasta.
    *   Salvar e verificar se a alteração refletiu na lista imediatamente.
*   **[ ] Concluir Tarefa:**
    *   Clicar no botão de "Check" (✔) no card.
    *   O card deve ficar levemente transparente ou com o título riscado.
    *   O card deve ir para o filtro "Concluídas".
*   **[ ] Desmarcar Tarefa (Reabrir):**
    *   Ir em "Concluídas", clicar no botão de desfazer (seta/voltar). A tarefa deve voltar para "Todas" e "Pendentes".

### Editor de Texto (Quill)
*   **[ ] Formatação:** Testar Negrito, Itálico, Listas (Bolinhas e Números).
*   **[ ] Imagens:**
    *   Clicar no ícone de imagem e fazer upload de uma foto pequena.
    *   **(Mobile)**: Verificar se a imagem fica ajustada à largura da tela e não "estoura" o layout.
    *   **(Desktop)**: Clicar na imagem inserida e testar o redimensionamento e alinhamento (Esquerda/Centro/Direita).

### Gestão de Pastas
*   **[ ] Criar Pasta:** Clicar no "+" ao lado de "Pastas", dar um nome e verificar se aparece na lista.
*   **[ ] Alternar Pastas:**
    *   Criar uma tarefa na "Pasta A".
    *   Ir para a visualização "Todas" -> Tarefa deve aparecer.
    *   Clicar na "Pasta A" -> Tarefa deve aparecer.
    *   Clicar na "Pasta B" -> Tarefa NÃO deve aparecer (lista vazia).
*   **[ ] Renomear/Excluir:** Passar o mouse (ou clicar no menu da pasta) para renomear ou deletar. Ao deletar uma pasta, verificar se as tarefas perdem a referência sem quebrar o app.

---

## 4. Fluxo de Autenticação e Dados

*   **[ ] Primeira Abertura (Modal de Boas-vindas):**
    *   Ao abrir em aba anônima (sem login), deve aparecer o modal "Bem-vindo(a)!".
    *   Testar o botão **"Continuar offline"**: O app deve carregar com dados locais (LocalStorage).
*   **[ ] Login/Cadastro (Opcional - Se backend ativo):**
    *   Tentar criar conta com email fictício. Verificar mensagem de sucesso/erro.
    *   Se logado, verificar se o botão "Sair" aparece no topo.
*   **[ ] Persistência Local:**
    *   (Modo Offline) Criar tarefas, recarregar a página (F5 ou puxar para atualizar no mobile). As tarefas devem permanecer lá.

---

## 5. Testes de Interface (UI) e Estilo

*   **[ ] Modo Escuro (Dark Mode):**
    *   Clicar no ícone de Sol/Lua no topo.
    *   Verificar se todas as cores (fundo, cards, texto) invertem corretamente e se a legibilidade se mantém boa.
    *   Recarregar a página e verificar se a preferência de tema foi salva.
*   **[ ] Visualização Vazia:**
    *   Limpar todas as tarefas (ou usar filtro vazio).
    *   Verificar se a mensagem "Nenhum card por aqui ✨" ou "Lixeira vazia" aparece centralizada.

## 6. Lixeira e Exclusão

*   **[ ] Mover para Lixeira:**
    *   Abrir uma tarefa e clicar em "Excluir" (ícone ou texto).
    *   A tarefa deve sumir da lista principal.
*   **[ ] Verificar Lixeira:**
    *   Clicar no filtro "Lixeira". A tarefa deve estar lá.
*   **[ ] Restaurar:**
    *   Clicar no botão de restaurar na tarefa da lixeira. Ela deve voltar para a lista "Todas".
*   **[ ] Exclusão Permanente:**
    *   Na Lixeira, abrir a tarefa e clicar em "Excluir Permanentemente". Ela deve sumir para sempre.
