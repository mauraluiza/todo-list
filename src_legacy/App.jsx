/* RESTAURANDO APP COMPLETO COM CORREÇÕES FINAIS */
import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WorkspaceProvider, useWorkspace } from './contexts/WorkspaceContext' // Added useWorkspace import
import { useLists } from './hooks/useLists'
import { useTodos } from './hooks/useTodos'
import { Sidebar } from './components/layout/Sidebar.jsx'
import { Header } from './components/layout/Header.jsx'
import { TaskList } from './components/tasks/TaskList.jsx'
import { Modal } from './components/common/Modal.jsx'
import { TaskForm } from './components/tasks/TaskForm.jsx'
import { supabase } from './lib/supabaseClient'
import './index.css'

function AuthWall({ children }) {
  const { user, signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)

  if (user) return children

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      if (isLogin) {
        // Check if input is email or username
        let loginIdentifier = email;
        const isEmail = email.includes('@');

        if (!isEmail) {
          // It's a username, lookup email
          const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', email) // 'email' state holds the input value
            .single()

          if (error || !data || !data.email) {
            throw new Error('Usuário não encontrado ou sem email vinculado.')
          }
          loginIdentifier = data.email
        }

        await signIn(loginIdentifier, password)
      } else {
        await signUp(email, password)
        alert('Conta criada! Faça login.')
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-body)', color: 'black' }}>
      {console.log('Rendering AuthWall. User:', user)}
      <div className="modal-container" style={{ height: 'auto', padding: '40px', maxWidth: '400px', opacity: 1, transform: 'none' }}>
        <h2 style={{ marginBottom: '20px' }}>{isLogin ? 'Entrar' : 'Cadastrar'}</h2>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="text"
            placeholder={isLogin ? "Email ou Usuário" : "Email"}
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
          />
          <button type="submit" className="primary-btn" disabled={authLoading}>
            {authLoading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>
        <button
          onClick={() => setIsLogin(!isLogin)}
          style={{ marginTop: '10px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
        >
          {isLogin ? 'Criar conta' : 'Já tenho conta'}
        </button>
      </div>
    </div>
  )
}

function TodoApp() {
  const [activeFolderId, setActiveFolderId] = useState('inbox')
  const [statusFilter, setStatusFilter] = useState('all')

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  const { lists, refreshLists } = useLists()
  const { todos, loading: todosLoading, refresh } = useTodos(activeFolderId, statusFilter)
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace() // Need this context for imports

  const handleNewTask = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const handleSave = () => {
    refresh()
    setIsModalOpen(false)
  }

  const handleToggleTheme = () => {
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target.result
      let title = file.name.replace(/\.(txt|html)$/, '')
      let description = content

      // Simple parsing logic (could be improved)
      if (file.name.endsWith('.html')) {
        // Basic strip tags if we wanted plain text description, but we support HTMLish desc?
        // For now, save raw content.
        // Maybe extract title from <title> tag?
        const titleMatch = content.match(/<title>(.*?)<\/title>/)
        if (titleMatch) title = titleMatch[1]

        const bodyMatch = content.match(/<body>([\s\S]*?)<\/body>/)
        if (bodyMatch) description = bodyMatch[1] // Clean body content
      }

      try {
        const { error } = await supabase
          .from('todos')
          .insert({
            title: title,
            description: description,
            status: 'pending',
            priority: 'medium',
            owner_id: user.id,
            workspace_id: currentWorkspace ? currentWorkspace.id : null
          })

        if (error) throw error
        alert('Tarefa importada com sucesso!')
        refresh()
      } catch (err) {
        alert('Erro ao importar: ' + err.message)
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset input
  }

  return (
    <div className="layout-wrapper">
      <Sidebar
        activeFolder={activeFolderId}
        onFolderChange={setActiveFolderId}
        customLists={lists}
        onListCreated={refreshLists}
      />
      <main className="app-container">
        <Header
          onNewTask={handleNewTask}
          onToggleTheme={handleToggleTheme}
          onImport={handleImport}
        />

        <div className="filters">
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >Todas</button>
          <button
            className={`filter-btn btn-pending ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >Pendentes</button>
          <button
            className={`filter-btn btn-urgent ${statusFilter === 'urgent' ? 'active' : ''}`}
            onClick={() => setStatusFilter('urgent')}
          >Urgentes</button>
          <button
            className={`filter-btn btn-completed ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >Concluídas</button>
        </div>

        <TaskList
          tasks={todos}
          loading={todosLoading}
          onTaskClick={handleEditTask}
        />
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={null}
      >
        <TaskForm
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          lists={lists || []}
          initialData={editingTask}
          initialListId={activeFolderId !== 'all' ? activeFolderId : ''}
        />
      </Modal>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider> {/* Wrapped WorkspaceProvider */}
        <AuthWall>
          <TodoApp />
        </AuthWall>
      </WorkspaceProvider>
    </AuthProvider>
  )
}

export default App
