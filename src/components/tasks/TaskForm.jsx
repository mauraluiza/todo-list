import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'

export function TaskForm({ onClose, onSave, lists = [], initialData = null, initialListId = '' }) {
    const { user } = useAuth()
    const { currentWorkspace } = useWorkspace()
    const [title, setTitle] = useState('')
    const [desc, setDesc] = useState('')
    const [priority, setPriority] = useState('medium')
    const [status, setStatus] = useState('pending')
    const [dueDate, setDueDate] = useState('')
    const [listId, setListId] = useState('')
    const [loading, setLoading] = useState(false)
    const [showAIChat, setShowAIChat] = useState(false)

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '')
            setDesc(initialData.description || '')
            setPriority(initialData.priority || 'medium')
            setStatus(initialData.status || 'pending')
            if (initialData.due_at) {
                setDueDate(new Date(initialData.due_at).toISOString().split('T')[0])
            }
            setListId(initialData.list_id || '')
        } else {
            if (initialListId && initialListId !== 'inbox' && initialListId !== 'all') {
                setListId(initialListId)
            } else {
                setListId('')
            }
        }
    }, [initialData, lists, initialListId])

    const handleSubmit = async () => {
        if (!title.trim()) {
            alert('A tarefa precisa de um título.')
            return
        }

        setLoading(true)
        try {
            const payload = {
                title,
                description: desc,
                priority,
                status,
                due_at: dueDate ? new Date(dueDate).toISOString() : null,
                list_id: listId || null,
                owner_id: user.id,
                workspace_id: currentWorkspace ? currentWorkspace.id : null
            }

            let error = null
            if (initialData?.id) {
                const { error: err } = await supabase
                    .from('todos')
                    .update(payload)
                    .eq('id', initialData.id)
                error = err
            } else {
                const { error: err } = await supabase
                    .from('todos')
                    .insert(payload)
                error = err
            }

            if (error) throw error

            onSave()
            onClose()
        } catch (err) {
            console.error('Error saving task:', err)
            alert('Erro ao salvar: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('todos')
                .delete()
                .eq('id', initialData.id)

            if (error) throw error
            onSave()
            onClose()
        } catch (err) {
            alert('Erro ao deletar: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleExport = (format) => {
        if (!initialData) return

        const content = `
            Título: ${title}
            Prioridade: ${priority}
            Status: ${status}
            Pasta: ${lists.find(l => l.id === listId)?.title || 'Inbox'}
            Vencimento: ${dueDate || 'Sem data'}
            
            Descrição:
            ${desc}
        `

        let blob
        let filename

        if (format === 'html') {
            const htmlContent = `
                <html>
                <head><title>${title}</title></head>
                <body>
                    <h1>${title}</h1>
                    <p><strong>Prioridade:</strong> ${priority}</p>
                    <p><strong>Status:</strong> ${status}</p>
                    <p><strong>Vencimento:</strong> ${dueDate || 'Sem data'}</p>
                    <hr/>
                    <div>${desc}</div>
                </body>
                </html>
            `
            blob = new Blob([htmlContent], { type: 'text/html' })
            filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
        } else {
            blob = new Blob([content], { type: 'text/plain' })
            filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
        }

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    useEffect(() => {
        const modalContainer = document.querySelector('.modal-container')
        if (modalContainer) {
            modalContainer.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            if (showAIChat) {
                // Shift modal to left
                modalContainer.style.transform = 'translateX(-180px)'
            } else {
                // Reset to center
                modalContainer.style.transform = 'translateX(0)'
            }
        }
    }, [showAIChat])

    return (
        <>
            {/* AI CHAT WINDOW - PORTALED to body to escape modal clipping */}
            {showAIChat && createPortal(
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: 'calc(50% + 240px)',
                    transform: 'translateY(-50%)',
                    width: '320px',
                    height: '80vh',
                    backgroundColor: 'var(--bg-sidebar)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 9999,
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                    <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>✨ AI Assistant</span>
                        <button onClick={() => setShowAIChat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>&times;</button>
                    </div>
                    <div style={{ flex: 1, padding: '12px', overflowY: 'auto', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        <p style={{ background: 'var(--bg-body)', padding: '8px', borderRadius: '8px' }}>Olá! Sou sua assistente de tarefas. Como posso ajudar a melhorar esta descrição?</p>
                    </div>
                    <div style={{ padding: '10px', borderTop: '1px solid var(--border)' }}>
                        <input
                            type="text"
                            placeholder="Digite sua mensagem..."
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-body)', color: 'var(--text-main)' }}
                        />
                    </div>
                </div>,
                document.body
            )}

            <div className="modal-header" style={{ border: 'none', paddingBottom: 0, justifyContent: 'space-between' }}>
                <input
                    id="modalTitleInput"
                    type="text"
                    placeholder="Título da Tarefa..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    autoFocus
                    style={{ flex: 1 }}
                />

                {initialData && (
                    <div className="export-controls" style={{ marginLeft: 10 }}>
                        <button onClick={() => handleExport('txt')} style={{ fontSize: '0.8rem', padding: '4px 8px', marginRight: 5, cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-main)' }}>
                            📥 TXT
                        </button>
                        <button onClick={() => handleExport('html')} style={{ fontSize: '0.8rem', padding: '4px 8px', cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-main)' }}>
                            📥 HTML
                        </button>
                    </div>
                )}
            </div>

            <div className="modal-body">
                <ReactQuill
                    theme="snow"
                    value={desc}
                    onChange={setDesc}
                    placeholder="Detalhes da tarefa..."
                    modules={{
                        toolbar: [
                            [{ 'header': [1, 2, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
                            ['link', 'image'],
                            ['clean']
                        ]
                    }}
                    style={{
                        height: '200px',
                        marginBottom: '40px'
                    }}
                />
            </div>

            <div className="modal-meta-controls">
                <div className="control-group">
                    <label>Pasta</label>
                    <select value={listId} onChange={e => setListId(e.target.value)}>
                        <option value="">Inbox</option>
                        {lists.map(l => (
                            <option key={l.id} value={l.id}>{l.title}</option>
                        ))}
                    </select>
                </div>

                <div className="control-group">
                    <label>Prioridade</label>
                    <select value={priority} onChange={e => setPriority(e.target.value)}>
                        <option value="low">Baixa</option>
                        <option value="medium">Normal</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                    </select>
                </div>

                <div className="control-group">
                    <label>Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="pending">Pendente</option>
                        <option value="in_progress">Em Progresso</option>
                        <option value="completed">Concluída</option>
                    </select>
                </div>

                <div className="control-group">
                    <label>Vencimento</label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                    />
                </div>
            </div>

            <div className="modal-footer">
                <div className="date-info">
                    {initialData ? `Criado em: ${new Date(initialData.created_at).toLocaleDateString()}` : 'Nova tarefa'}
                </div>
                <div className="footer-actions">
                    {initialData && (
                        <button
                            type="button"
                            className="action-btn-text delete"
                            style={{ marginRight: '10px', color: 'var(--color-urgent)' }}
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            Excluir
                        </button>
                    )}
                    <button className="primary-btn" onClick={() => setShowAIChat(!showAIChat)} style={{ marginRight: '10px', background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', border: 'none', color: 'white', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)', transition: 'transform 0.2s', fontWeight: 600 }}>
                        ✨ AI Chat
                    </button>
                    <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </>
    )
}
