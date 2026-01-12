# Maura's To-Do List

Um aplicativo de tarefas moderno, responsivo e com suporte a sincronização em nuvem via Supabase.

## 📋 Sobre
O projeto é um **Single Page Application (SPA)** construída com Vanilla JS, focado em alta performance e experiência do usuário. Ele opera em arquitetura híbrida:
- **Offline First**: Funciona sem internet usando `LocalStorage`.
- **Cloud Sync**: Sincroniza automaticamente quando conectado ao Supabase.

## ✨ Funcionalidades Principais
- **Editor Rico**: Descrições com suporte a HTML, imagens e formatação.
- **Organização**: Pastas, Tickets (tags) e Prioridades.
- **Colaboração**: Suporte a Organizações e compartilhamento de tarefas.
- **Segurança**: Row Level Security (RLS) garantindo isolamento de dados.
- **Temas**: Dark/Light mode com persistência.

## 🚀 Stack Tecnológica
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Backend (BaaS)**: Supabase (PostgreSQL, Auth, Realtime).
- **Libs**: Quill.js (Editor de texto).

## 📂 Estrutura do Projeto
```
/
├── css/              # Estilos globais e componentes
├── js/               # Lógica da aplicação
│   ├── script.js     # Core logic (State management, UI, Auth)
│   └── supabase-config.js # Configuração do cliente Supabase
├── database/         # Migrations e scripts SQL
├── docs/             # Documentação Técnica e de Setup
└── index.html        # Entry point
```

## 🛠️ Configuração e Instalação

### Pré-requisitos
- Um navegador moderno.
- (Opcional) Conta no Supabase para funcionalidades de nuvem.

### Como Rodar Localmente
1. Clone o repositório.
2. Abra o arquivo `index.html` no navegador.
3. Para ativar a nuvem, configure o `js/supabase-config.js` (veja `docs/DATABASE_SETUP.md`).

## 🤖 Para Agentes de IA e Desenvolvedores
Se você está migrando, refatorando ou analisando este código, consulte **obrigatoriamente**:
- [docs/TECHNICAL.md](docs/TECHNICAL.md): Detalhes profundos da arquitetura, banco e regras de negócio.
- [docs/DATABASE_SETUP.md](docs/DATABASE_SETUP.md): Instruções de setup do banco.

**Pontos de Atenção:**
- A lógica de UI e Estado está acoplada em `script.js`. Em refatorações, priorize desacoplar o gerenciamento de estado da manipulação do DOM.
- As regras de segurança (RLS) no banco são vitais para a funcionalidade multi-usuário (veja migrations recentes).
