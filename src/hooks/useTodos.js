import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'

export function useTodos(activeListId, statusFilter) {
    const { user } = useAuth()
    const { currentWorkspace } = useWorkspace()
    const [todos, setTodos] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchTodos = useCallback(async () => {
        if (!user) return

        setLoading(true)
        try {
            let query = supabase
                .from('todos')
                .select('*')
                .order('created_at', { ascending: false })

            // 1. Filter by Workspace (Scope)
            if (currentWorkspace) {
                query = query.eq('workspace_id', currentWorkspace.id)
            } else {
                query = query.is('workspace_id', null)
            }

            // 2. Filter by List
            if (activeListId === 'inbox') {
                query = query.is('list_id', null)
            } else if (activeListId && activeListId !== 'all') {
                query = query.eq('list_id', activeListId)
            }

            // 3. Filter by Status/Priority (Tabs)
            if (statusFilter === 'pending') {
                query = query.eq('status', 'pending')
            } else if (statusFilter === 'urgent') {
                query = query.eq('priority', 'urgent').neq('status', 'completed')
            } else if (statusFilter === 'completed') {
                query = query.eq('status', 'completed')
            } else {
                query = query.neq('status', 'archived')
            }

            const { data, error } = await query

            if (error) throw error
            setTodos(data || [])
        } catch (err) {
            console.error('Error fetching todos:', err)
        } finally {
            setLoading(false)
        }
    }, [user, currentWorkspace, activeListId, statusFilter]) // Add currentWorkspace dependency

    useEffect(() => {
        fetchTodos()
    }, [fetchTodos])

    return { todos, loading, refresh: fetchTodos }
}
