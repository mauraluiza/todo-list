# Implementação do Sistema de Prioridades

## Visão Geral
Foi adicionado um sistema de prioridades às tarefas, permitindo classificar itens como "Urgent", "Low" ou "None". Além disso, foram implementados filtros, ordenação e abas separadas para tarefas pendentes e concluídas.

## Alterações Realizadas

### Banco de Dados
- Criado arquivo de migração `database/migrations/ADD_PRIORITY_COLUMN.sql`.
- Comando SQL: `ALTER TABLE todos ADD COLUMN IF NOT EXISTS priority text DEFAULT 'none';`

### Frontend

#### Componentes
- **`src/components/features/TaskModal.jsx`**:
  - Adicionado campo "Prioridade" (Select) no formulário.
  - Opções: Sem prioridade (padrão), Baixa, Urgente.
  - Layout da grid ajustado para acomodar o novo campo.

- **`src/components/layout/AppShell.jsx`**:
  - **Abas**: Implementada separação entre "A Fazer" e "Concluídas".
  - **Filtros**: Adicionado dropdown para filtrar por prioridade na lista visível.
  - **Visualização**: Cards de tarefas agora mudam de cor baseado na prioridade:
    - Urgente: Laranja/Avermelhado suave.
    - Baixa: Azul/Céu suave.
    - Sem prioridade: Padrão (Clean).
  - Adicionados badges (etiquetas) indicando a prioridade dentro do card.

#### Hooks
- **`src/hooks/useTodos.js`**:
  - Atualizado `addTodo` para aceitar e salvar o campo `priority`.
  - Implementada ordenação **Client-Side** personalizada:
    1. Urgente
    2. Baixa
    3. Sem prioridade
    4. Data de criação (mais recente primeiro)

## Como Validar
1. Execute o comando SQL no Supabase para criar a coluna.
2. Crie uma nova tarefa selecionando "Urgente".
3. Verifique se ela aparece no topo da lista "A Fazer" com fundo alaranjado.
4. Crie uma tarefa "Baixa" e verifique a ordenação e cor azulada.
5. Marque uma tarefa como concluída e verifique se ela move para a aba "Concluídas".
6. Use o filtro de prioridade para ver apenas tarefas urgentes.
