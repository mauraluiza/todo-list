# To-Do List - Sistema de Gerenciamento de Tarefas

## 📋 Visão Geral

Este é um aplicativo web moderno de gerenciamento de tarefas (to-do list) desenvolvido em vanilla JavaScript, HTML e CSS. A versão atual conta com uma **arquitetura híbrida**, permitindo o uso offline ou sincronizado na nuvem via Supabase. O foco do projeto é oferecer uma experiência de usuário premium, com edição rica de texto, manipulação avançada de imagens e design responsivo.

## ✨ Características Principais

### 1. **Gerenciamento Avançado**
- ✅ **CRUD Completo:** Criação, leitura, edição e exclusão.
- 📝 **Rich Text:** Editor Quill.js customizado.
- 🖼️ **Imagens Pro:** Upload, redimensionamento por arraste e alinhamento visual.
- 🎯 **Prioridades:** Níveis (Baixa, Normal, Urgente) com ordenação automática.
- 📅 **Prazos:** Controle de datas de vencimento.
- 📁 **Organização:** Pastas e Tags (Tickets).

### 2. **Sincronização & Segurança (Supabase)**
- ☁️ **Cloud Sync:** Banco de dados PostgreSQL em tempo real.
- 🔐 **Autenticação:** Sistema de contas seguro (Email/Senha).
- 🔄 **Híbrido:** Funciona perfeitamente offline (LocalStorage) se não configurado.
- 🛡️ **Segurança:** Dados isolados por usuário (Row Level Security).

### 3. **Interface (UI/UX)**
- 🎨 Temas Claro/Escuro automáticos.
- 📱 Responsividade total (Mobile/Desktop).
- 📍 Sidebar intuitiva com botão de **Logout** facilitado.

## 🏗️ Estrutura do Projeto

```
todo-list/
├── index.html            # Markup principal e Modais
├── style.css             # Estilos, Variáveis e Temas
├── script.js             # Lógica de interação e Camada de Dados
├── supabase-config.js    # Arquivo de configuração do usuário (Credenciais)
├── DATABASE_SETUP.md     # Manual de configuração do Banco de Dados
├── README.md             # Visão geral do projeto
└── TECHNICAL.md          # Documentação profunda para desenvolvedores
```

## 🚀 Como Usar

1. **Acesso Básico (Offline):**
   - Abra o `index.html` em qualquer navegador. O app funcionará localmente.

2. **Habilitar Nuvem (Recomendado):**
   - Siga as instruções em `DATABASE_SETUP.md` para criar seu banco gratuito.
   - Configure o `supabase-config.js`.
   - Ao recarregar, faça login ou crie sua conta no modal.

3. **Recursos de Imagem:**
   - Cole imagens direto da área de transferência ou use o botão de upload.
   - Clique na imagem para revelar as alças de redimensionamento e opções de alinhamento.

4. **Importar/Exportar:**
   - Use o botão no cabeçalho para importar `.txt`/`.html`.
   - Exporte tarefas individuais pelo menu no rodapé do modal de edição.

## 🛠️ Stack Tecnológico

- **Frontend:** HTML5, CSS3, Vanilla JS.
- **Backend:** Supabase (PostgreSQL, Auth).
- **Bibliotecas:** 
  - `Quill.js` (Editor de Texto)
  - `@supabase/supabase-js` (Cliente Web)
  - `Google Fonts` (Família Outfit)

## 📝 Notas de Desenvolvimento

Para detalhes sobre a implementação do banco de dados, mapeamento de colunas (`description` vs `desc`) e funcionamento do redimensionamento de imagens, consulte o arquivo `TECHNICAL.md`.

## 👨‍💻 Licença e Autor

Projeto open-source para fins educacionais.
