import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthProvider'
import { useOrganization } from '../contexts/OrganizationProvider'

export function useTodos(statusFilter = 'all', listId = null) {
    const { user } = useAuth()
    const { currentOrg } = useOrganization()
    const [todos, setTodos] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchTodos = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            let query = supabase
                .from('tasks') // CHANGED: 'todos' -> 'tasks'
                .select('*')
                .order('created_at', { ascending: false })

            // ENVIRONMENT ISOLATION LOGIC
            if (currentOrg) {
                // Organization Environment
                query = query.eq('organization_id', currentOrg.id)
            } else {
                // Personal Environment
                // Explicitly check for NULL organization_id to ensure isolation
                // Also check owner_id (user_id in tasks table) for extra safety, though RLS handles it.
                // Note: In 'tasks' table, the column is 'user_id', not 'owner_id'.
                query = query.is('organization_id', null).eq('user_id', user.id)
            }

            // List Filter Logic (If Lists feature is migrated later, keeping simple for now)
            // if (listId && listId !== 'all') { query = query.eq('list_id', listId) }

            // Status Filter Logic
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter)
            } else {
                // Default: exclude archived/trash if applicable
            }

            const { data, error } = await query

            if (error) throw error

            // Client-side sorting (Priority)
            const priorityOrder = { high: 0, low: 1, none: 2 }
            const sortedData = (data || []).sort((a, b) => {
                const priorityA = a.priority || 'none'
                const priorityB = b.priority || 'none'
                const pA = priorityOrder[priorityA] ?? 2
                const pB = priorityOrder[priorityB] ?? 2
                if (pA !== pB) return pA - pB
                return new Date(b.created_at) - new Date(a.created_at)
            })

            setTodos(sortedData)
        } catch (err) {
            console.error('Error fetching tasks:', err)
        } finally {
            setLoading(false)
        }
    }, [user, currentOrg, statusFilter]) // Removed listId dep until lists are reimplemented

    useEffect(() => {
        fetchTodos()
    }, [fetchTodos])

    const addTodo = async ({ title, description = '', priority = 'none' }) => {
        if (!title.trim()) return

        const dbPriority = (priority === 'none' || !priority) ? null : priority

        const payload = {
            title,
            description,
            priority: dbPriority,
            status: 'pending',
            user_id: user.id, // Creator
            organization_id: currentOrg ? currentOrg.id : null, // Environment
            // list_id: listId
        }

        const { error } = await supabase.from('tasks').insert(payload)

        if (error) {
            console.error('Error adding task:', error)
            return error
        }

        fetchTodos()
        return null
    }

    const updateTodo = async (id, updates) => {
        if (updates.priority === 'none') {
            updates.priority = null
        }
        const { error } = await supabase.from('tasks').update(updates).eq('id', id)
        if (!error) fetchTodos()
        return error
    }

    const deleteTodo = async (id) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id)
        if (!error) fetchTodos()
        return error
    }

    return { todos, loading, addTodo, updateTodo, deleteTodo, refresh: fetchTodos }
}
