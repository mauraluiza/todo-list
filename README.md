# React + Vite To-Do Application

This is a modern, responsive To-Do List application built with React, Vite, and Supabase.

## ✨ Features

- **Authentication**: Secure email/password login and registration.
- **Login via Username**: Option to login with a custom username or email.
- **Multi-tenancy Workspaces**: 
  - Manage **Personal Tasks** separately from **Organization Tasks**.
  - Create new organizations and invite members via code.
  - Switch contexts seamlessly via the Sidebar selector.
- **Rich Text Editor**: 
  - Create tasks with rich formatting (Bold, Italic, Lists, Checklists).
  - Insert images and links directly into task descriptions.
- **Organization**:
  - Organize tasks into **Folders** (formerly Lists).
  - Filter by status, priority, and folders.
- **Import/Export**:
  - **Export** individual tasks to `.txt` or `.html` formats.
  - **Import** tasks via `.txt` (simple text) or `.html` (rich text) files.
- **User Settings**:
  - Defined Username Profile.
  - Change Password with security checks.
- **AI Assistant Integration** (Frontend):
  - Dedicated "AI Chat" interface for future task assistance.
  - Floating chat window with side-by-side view (shifts task modal for visibility).

## 🚀 Technology Stack

- **Frontend**: React, Vite
- **Styling**: Vanilla CSS (Variables, Dark/Light Mode support)
- **Editor**: Tiptap (Rich Text, headless)
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Icons**: Emoji-based UI

## 🛠 Setup & Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables by copying `.env.example` to `.env` (requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).
4.  Run the development server:
    ```bash
    npm run dev
    ```

## 📦 Database Schema

The application relies on a robust PostgreSQL schema handled by Supabase.
See `docs/TECHNICAL.md` for detailed schema and architectural decisions.
Main tables: `todos`, `workspaces`, `lists`, `profiles`.

## 🎨 Design System

The app follows a "Glassmorphism" inspired design with:
- Translucent modals and cards.
- Blurred backgrounds (`backdrop-filter`).
- Smooth transitions and micro-interactions (hover effects, modal shifts).
- Adaptive Dark/Light themes.
