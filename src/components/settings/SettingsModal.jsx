import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

export function SettingsModal({ onClose }) {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'security'

    // Profile State
    const [username, setUsername] = useState('')
    const [currentUsername, setCurrentUsername] = useState('')
    const [loadingProfile, setLoadingProfile] = useState(false)

    // Security State
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loadingSecurity, setLoadingSecurity] = useState(false)

    useEffect(() => {
        if (user) loadProfile()
    }, [user])

    const loadProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single()

            if (data) {
                setCurrentUsername(data.username || '')
                setUsername(data.username || '')
            }
        } catch (err) {
            // No profile yet
        }
    }

    const handleSaveProfile = async (e) => {
        e.preventDefault()
        setLoadingProfile(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    username: username,
                    email: user.email // Store email for lookup
                })

            if (error) throw error
            setCurrentUsername(username)
            alert('Nome de usuário salvo!')
        } catch (err) {
            alert('Erro ao salvar nome de usuário: ' + err.message)
        } finally {
            setLoadingProfile(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            alert('As senhas não coincidem.')
            return
        }
        if (newPassword.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres.')
            return
        }

        setLoadingSecurity(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error
            alert('Senha alterada com sucesso!')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err) {
            alert('Erro ao alterar senha: ' + err.message)
        } finally {
            setLoadingSecurity(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 20px 20px 20px' }}>
            <div className="tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
                <button
                    style={{
                        flex: 1,
                        padding: 10,
                        background: activeTab === 'profile' ? 'var(--bg-card)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'profile' ? '2px solid var(--primary)' : 'none',
                        color: 'var(--text-main)',
                        cursor: 'pointer'
                    }}
                    onClick={() => setActiveTab('profile')}
                >
                    Perfil
                </button>
                <button
                    style={{
                        flex: 1,
                        padding: 10,
                        background: activeTab === 'security' ? 'var(--bg-card)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'security' ? '2px solid var(--primary)' : 'none',
                        color: 'var(--text-main)',
                        cursor: 'pointer'
                    }}
                    onClick={() => setActiveTab('security')}
                >
                    Segurança
                </button>
            </div>

            <div className="tab-content" style={{ flex: 1 }}>
                {activeTab === 'profile' && (
                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 5 }}>Nome de Usuário (para Login)</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="ex: maurinha123"
                                style={{
                                    width: '100%',
                                    padding: 10,
                                    borderRadius: 8,
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-main)'
                                }}
                            />
                            {currentUsername && <small style={{ color: 'var(--primary)', display: 'block', marginTop: 5 }}>Atual: {currentUsername}</small>}
                        </div>
                        <button type="submit" className="primary-btn" disabled={loadingProfile}>
                            {loadingProfile ? 'Salvando...' : 'Salvar'}
                        </button>
                    </form>
                )}

                {activeTab === 'security' && (
                    <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 5 }}>Nova Senha</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 10,
                                    borderRadius: 8,
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-main)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 5 }}>Confirmar Nova Senha</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: 10,
                                    borderRadius: 8,
                                    border: '1px solid var(--border)',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-main)'
                                }}
                            />
                        </div>
                        <button type="submit" className="primary-btn" disabled={loadingSecurity}>
                            {loadingSecurity ? 'Alterar Senha' : 'Alterar Senha'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
