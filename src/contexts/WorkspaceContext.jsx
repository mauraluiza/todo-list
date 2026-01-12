import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'

const WorkspaceContext = createContext({})

export function WorkspaceProvider({ children }) {
    const { user } = useAuth()
    const [currentWorkspace, setCurrentWorkspace] = useState(null) // null = Personal
    const [myWorkspaces, setMyWorkspaces] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchWorkspaces = async () => {
        if (!user) {
            setMyWorkspaces([])
            setLoading(false)
            return
        }
        try {
            // Fetch workspaces where user is a member
            const { data, error } = await supabase
                .from('workspaces')
                .select('*, workspace_members(role)')
                .order('name')

            if (error) throw error
            setMyWorkspaces(data || [])
        } catch (err) {
            console.error('Error fetching workspaces:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchWorkspaces()
    }, [user])

    const createWorkspace = async (name) => {
        if (!user) return
        try {
            // 1. Create Workspace
            const { data: wsData, error: wsError } = await supabase
                .from('workspaces')
                .insert({
                    name,
                    owner_id: user.id
                })
                .select()
                .single()

            if (wsError) throw wsError

            // 2. Add creator as Owner/Admin in members
            const { error: memError } = await supabase
                .from('workspace_members')
                .insert({
                    workspace_id: wsData.id,
                    user_id: user.id,
                    role: 'owner'
                })

            if (memError) throw memError

            await fetchWorkspaces()
            setCurrentWorkspace(wsData) // Auto switch to new ws
            return wsData
        } catch (err) {
            alert('Erro ao criar organização: ' + err.message)
            throw err
        }
    }

    const joinWorkspace = async (inviteCode) => {
        if (!user) return
        try {
            // 1. Find workspace by code
            const { data: wsData, error: wsError } = await supabase
                .from('workspaces')
                .select('id')
                .eq('invite_code', inviteCode)
                .single()

            if (wsError || !wsData) throw new Error('Organização não encontrada com este código.')

            // 2. Add member
            const { error: memError } = await supabase
                .from('workspace_members')
                .insert({
                    workspace_id: wsData.id,
                    user_id: user.id,
                    role: 'member'
                })

            if (memError) {
                if (memError.code === '23505') throw new Error('Você já faz parte desta organização.')
                throw memError
            }

            await fetchWorkspaces()
            alert('Você entrou na organização com sucesso!')
        } catch (err) {
            alert(err.message)
        }
    }

    return (
        <WorkspaceContext.Provider value={{
            currentWorkspace,
            setCurrentWorkspace,
            myWorkspaces,
            createWorkspace,
            joinWorkspace,
            loading
        }}>
            {children}
        </WorkspaceContext.Provider>
    )
}

export const useWorkspace = () => useContext(WorkspaceContext)
