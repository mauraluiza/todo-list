import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthProvider'
import { useWorkspace } from '../contexts/WorkspaceProvider'

export function useTodos(statusFilter = 'all', listId = null) {
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

            // List Filter Logic
            if (listId && listId !== 'all') {
                query = query.eq('list_id', listId)
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

            // Client-side sorting for priority
            // Client-side sorting for priority
            const priorityOrder = { high: 0, low: 1, none: 2 }
            const sortedData = (data || []).sort((a, b) => {
                const priorityA = a.priority || 'none'
                const priorityB = b.priority || 'none'
                const pA = priorityOrder[priorityA] ?? 2
                const pB = priorityOrder[priorityB] ?? 2
                if (pA !== pB) return pA - pB
                // Secondary sort by created_at desc (newest first)
                return new Date(b.created_at) - new Date(a.created_at)
            })

            setTodos(sortedData)
        } catch (err) {
            console.error('Error fetching todos:', err)
        } finally {
            setLoading(false)
        }
    }, [user, currentWorkspace, statusFilter, listId])

    useEffect(() => {
        fetchTodos()
    }, [fetchTodos])

    const addTodo = async ({ title, description = '', priority = 'none', listId = null }) => {
        if (!title.trim()) return

        // If priority is 'none', strictly send null to database to avoid potential string issues or constraints
        // Also handling falsy values just in case
        const dbPriority = (priority === 'none' || !priority) ? null : priority

        const payload = {
            title,
            description,
            priority: dbPriority,
            status: 'pending',
            owner_id: user.id,
            workspace_id: currentWorkspace?.id || null,
            list_id: listId
        }

        const { error } = await supabase.from('todos').insert(payload)

        if (error) {
            console.error('Error adding todo:', error)
            return error
        }

        fetchTodos()
        return null
    }

    const updateTodo = async (id, updates) => {
        // If updating priority to 'none', send null
        if (updates.priority === 'none') {
            updates.priority = null
        }
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
