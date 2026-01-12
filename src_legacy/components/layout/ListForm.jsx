import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'

export function ListForm({ onClose, onSave }) {
    const { user } = useAuth()
    const { currentWorkspace } = useWorkspace()
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!title.trim()) return

        setLoading(true)
        try {
            const { error } = await supabase
                .from('lists')
                .insert({
                    title: title,
                    owner_id: user.id,
                    workspace_id: currentWorkspace ? currentWorkspace.id : null
                })

            if (error) throw error
            onSave() // Refresh sidebar list
            onClose()
        } catch (err) {
            alert('Erro ao criar lista: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ padding: '24px', gap: '16px' }}>
                <div className="control-group">
                    <label>Nome da Nova Pasta</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        autoFocus
                        placeholder="Ex: Projetos Freelancer"
                    />
                </div>
            </div>
            <div className="modal-footer">
                <div className="date-info"></div>
                <div className="footer-actions">
                    <button type="submit" className="primary-btn" disabled={loading}>
                        {loading ? 'Criando...' : 'Criar Pasta'}
                    </button>
                </div>
            </div>
        </form>
    )
}
