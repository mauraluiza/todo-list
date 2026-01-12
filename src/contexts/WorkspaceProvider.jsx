import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthProvider'

const WorkspaceContext = createContext({})

export function WorkspaceProvider({ children }) {
    const { user } = useAuth()
    const [currentWorkspace, setCurrentWorkspace] = useState(null)
    const [workspaces, setWorkspaces] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchWorkspaces = async () => {
        if (!user) {
            setWorkspaces([])
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('workspaces')
                .select('*, workspace_members(role)')
                .order('name')

            if (error) throw error
            setWorkspaces(data || [])
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
        const { data, error } = await supabase.rpc('create_workspace_safe', { name_input: name })

        // Fallback if RPC not exists (though better to stick to one method, for now I copy logic)
        // Actually, sticking to clientside transaction for simplicity as per previous code

        try {
            const { data: wsData, error: wsError } = await supabase
                .from('workspaces')
                .insert({ name, owner_id: user.id })
                .select()
                .single()

            if (wsError) throw wsError

            await supabase.from('workspace_members').insert({
                workspace_id: wsData.id,
                user_id: user.id,
                role: 'owner'
            })

            await fetchWorkspaces()
            setCurrentWorkspace(wsData)
            return wsData
        } catch (err) {
            throw err
        }
    }

    const joinWorkspace = async (code) => {
        try {
            const { data: ws, error: findError } = await supabase
                .from('workspaces')
                .select('id')
                .eq('invite_code', code)
                .single()

            if (findError || !ws) throw new Error('Código inválido')

            const { error: joinError } = await supabase
                .from('workspace_members')
                .insert({
                    workspace_id: ws.id,
                    user_id: user.id,
                    role: 'member'
                })

            if (joinError) throw joinError
            await fetchWorkspaces()
        } catch (err) {
            throw err
        }
    }

    return (
        <WorkspaceContext.Provider value={{
            workspaces,
            currentWorkspace,
            setCurrentWorkspace,
            createWorkspace,
            joinWorkspace,
            loading
        }}>
            {children}
        </WorkspaceContext.Provider>
    )
}

export const useWorkspace = () => useContext(WorkspaceContext)
