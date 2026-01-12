import React, { useState } from 'react'
import { Modal } from '../common/Modal.jsx'
import { ListForm } from './ListForm.jsx'
import { SettingsModal } from '../settings/SettingsModal.jsx' // IMPORT SettingsModal
import { useWorkspace } from '../../contexts/WorkspaceContext'

export function Sidebar({ activeFolder, onFolderChange, customLists = [], onListCreated }) {
    const { currentWorkspace, setCurrentWorkspace, myWorkspaces, createWorkspace, joinWorkspace } = useWorkspace()
    const [isListModalOpen, setIsListModalOpen] = useState(false)
    const [isOrgModalOpen, setIsOrgModalOpen] = useState(false)
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false) // NEW

    // Org Form State
    const [orgMode, setOrgMode] = useState('create') // 'create' | 'join'
    const [orgInput, setOrgInput] = useState('')

    // System Folders
    const systemFolders = [
        { id: 'inbox', label: 'Inbox' }
    ]

    const handleSaveList = () => {
        if (onListCreated) onListCreated()
        setIsListModalOpen(false)
    }

    const handleOrgSubmit = async (e) => {
        e.preventDefault()
        if (!orgInput.trim()) return

        try {
            if (orgMode === 'create') {
                await createWorkspace(orgInput)
                alert('Organização criada!')
            } else {
                await joinWorkspace(orgInput)
            }
            setIsOrgModalOpen(false)
            setOrgInput('')
        } catch (err) {
            // Error managed in context usually
        }
    }

    return (
        <>
            <aside className="sidebar">
                {/* WORKSPACE SELECTOR */}
                <div style={{ padding: '0 0 16px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                        Ambiente
                    </div>
                    <select
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                        value={currentWorkspace ? currentWorkspace.id : 'personal'}
                        onChange={(e) => {
                            const val = e.target.value
                            if (val === 'personal') setCurrentWorkspace(null)
                            else if (val === 'new_org') {
                                setOrgMode('create')
                                setIsOrgModalOpen(true)
                            }
                            else if (val === 'join_org') {
                                setOrgMode('join')
                                setIsOrgModalOpen(true)
                            }
                            else {
                                const ws = myWorkspaces.find(w => w.id === val)
                                setCurrentWorkspace(ws)
                            }
                        }}
                    >
                        <option value="personal">👤 Pessoal</option>
                        <optgroup label="Minhas Organizações">
                            {myWorkspaces.map(ws => (
                                <option key={ws.id} value={ws.id}>🏢 {ws.name}</option>
                            ))}
                        </optgroup>
                        <optgroup label="Ações">
                            <option value="new_org">+ Criar Nova Org...</option>
                            <option value="join_org">-> Entrar com Código...</option>
                        </optgroup>
                    </select>
                    {currentWorkspace && (
                        <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Código: <code style={{ background: 'var(--bg-body)', padding: '2px 4px', borderRadius: 4 }}>{currentWorkspace.invite_code}</code>
                        </div>
                    )}
                </div>

                <div className="sidebar-header" style={{ marginTop: 16 }}>
                    <h2 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                        {currentWorkspace ? 'Pastas da Org' : 'Pastas Pessoais'}
                    </h2>
                    <button
                        className="add-folder-btn"
                        title="Nova Pasta"
                        onClick={() => setIsListModalOpen(true)}
                    >
                        +
                    </button>
                </div>

                <div className="folder-list">
                    {/* System Folders */}
                    {systemFolders.map(folder => (
                        <div key={folder.id} className="folder-row">
                            <button
                                className={`folder-item ${activeFolder === folder.id ? 'active' : ''}`}
                                onClick={() => onFolderChange(folder.id)}
                            >
                                {folder.label}
                            </button>
                        </div>
                    ))}

                    {/* Divider */}
                    {customLists.length > 0 && <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }}></div>}

                    {/* User Lists */}
                    {customLists.map(list => (
                        <div key={list.id} className="folder-row">
                            <button
                                className={`folder-item ${activeFolder === list.id ? 'active' : ''}`}
                                onClick={() => onFolderChange(list.id)}
                            >
                                📁 {list.title}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="sidebar-footer">
                    {/* SETTINGS BUTTON */}
                    <button
                        className="sidebar-logout-btn"
                        onClick={() => setIsSettingsModalOpen(true)}
                        style={{ marginBottom: 10, background: 'transparent', border: 'none', color: 'var(--text-main)', padding: '12px', justifyContent: 'flex-start' }}
                    >
                        <span className="logout-text" style={{ color: 'var(--text-main)' }}>⚙️ Configurações</span>
                    </button>

                    <button className="sidebar-logout-btn" onClick={() => window.location.reload()}>
                        <span className="logout-text">Sair</span>
                    </button>
                </div>
            </aside>

            {/* Modal List */}
            <Modal
                isOpen={isListModalOpen}
                onClose={() => setIsListModalOpen(false)}
                title="Nova Pasta"
            >
                <ListForm onClose={() => setIsListModalOpen(false)} onSave={handleSaveList} />
            </Modal>

            {/* Modal Org */}
            <Modal
                isOpen={isOrgModalOpen}
                onClose={() => setIsOrgModalOpen(false)}
                title={orgMode === 'create' ? 'Criar Organização' : 'Entrar na Organização'}
            >
                <form onSubmit={handleOrgSubmit}>
                    <div className="modal-body" style={{ padding: 24, gap: 16 }}>
                        <label>{orgMode === 'create' ? 'Nome da Organização' : 'Código de Convite'}</label>
                        <input
                            autoFocus
                            value={orgInput}
                            onChange={e => setOrgInput(e.target.value)}
                            placeholder={orgMode === 'create' ? 'Ex: Empresa X' : 'Informe o código recebido'}
                            style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                        />
                    </div>
                    <div className="modal-footer">
                        <button type="submit" className="primary-btn">
                            {orgMode === 'create' ? 'Criar' : 'Entrar'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Settings */}
            <Modal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                title="Configurações"
            >
                <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />
            </Modal>
        </>
    )
}
