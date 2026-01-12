import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthProvider'
import { useWorkspace } from '../components/WorkspaceProvider'

export function useTodos(statusFilter = 'all') {
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

            // Workspace Logic
            if (currentWorkspace) {
                query = query.eq('workspace_id', currentWorkspace.id)
            } else {
                query = query.is('workspace_id', null).eq('owner_id', user.id)
            }

            // Status Filter Logic
            if (statusFilter !== 'all') {
                if (statusFilter === 'archived') {
                    // maybe handle trash logic
                } else {
                    query = query.eq('status', statusFilter)
                }
            } else {
                // Filter out archived/trash by default if 'all' means 'active'
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
    }, [user, currentWorkspace, statusFilter])

    useEffect(() => {
        fetchTodos()
    }, [fetchTodos])

    const addTodo = async (title, priority = 'medium') => {
        if (!title.trim()) return

        const payload = {
            title,
            priority,
            status: 'pending',
            owner_id: user.id,
            workspace_id: currentWorkspace?.id || null
        }

        const { error } = await supabase.from('todos').insert(payload)
        if (!error) fetchTodos()
        return error
    }

    const updateTodo = async (id, updates) => {
        const { error } = await supabase.from('todos').update(updates).eq('id', id)
        if (!error) fetchTodos()
        return error
    }

    const deleteTodo = async (id) => {
        const { error } = await supabase.from('todos').delete().eq('id', id)
        if (!error) fetchTodos()
        return error
    }

    return { todos, loading, addTodo, updateTodo, deleteTodo, refresh: fetchTodos }
}
