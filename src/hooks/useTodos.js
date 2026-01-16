import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthProvider'
import { useOrganization } from '../contexts/OrganizationProvider'

export function useTodos(statusFilter = 'all', listId = null) {
    const { user } = useAuth() || {}
    const { currentOrg } = useOrganization()
    const [todos, setTodos] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchTodos = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            let query = supabase
                .from('todos') // CHANGED: 'tasks' -> 'todos' (Unified)
                .select(`
                    *,
                    creator:profiles!todos_user_id_fkey(full_name, email),
                    participants:todo_participants(
                        user:profiles(id, full_name, email)
                    )
                `)
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
            // Status Filter Logic
            if (statusFilter === 'trash') {
                // TRASH VIEW: Only deleted items
                query = query.not('deleted_at', 'is', null)
            } else {
                // NORMAL VIEW: Non-deleted items
                query = query.is('deleted_at', null)

                if (statusFilter !== 'all') {
                    query = query.eq('status', statusFilter)
                }
            }

            const { data, error } = await query

            if (error) {
                console.error('SUPABASE FETCH ERROR:', error)
                throw error
            }

            console.log('SUPABASE FETCH SUCCESS:', {
                count: data.length,
                sample: data[0],
                filter: { statusFilter, org: currentOrg?.id }
            })

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
            owner_id: user.id, // REQUIRED by table constraint
            // list_id: listId
        }

        console.log('ATTEMPTING INSERT:', payload)

        const { data, error } = await supabase.from('todos').insert(payload).select().single()

        if (error) {
            console.error('Error adding task:', error)
            return { error }
        }

        fetchTodos()
        return { data }
    }

    const updateTodo = async (id, updates) => {
        if (updates.priority === 'none') {
            updates.priority = null
        }
        const { error } = await supabase.from('todos').update(updates).eq('id', id)
        if (!error) fetchTodos()
        return error
    }

    // Soft Delete: Move to Trash
    const deleteTodo = async (id) => {
        const { error } = await supabase
            .from('todos')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)

        if (!error) fetchTodos()
        return error
    }

    // Restore from Trash
    const restoreTodo = async (id) => {
        const { error } = await supabase
            .from('todos')
            .update({ deleted_at: null })
            .eq('id', id)

        if (!error) fetchTodos()
        return error
    }

    // Hard Delete: Remove forever
    const permDeleteTodo = async (id) => {
        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id)

        if (!error) fetchTodos()
        return error
    }


    const addParticipant = async (todoId, userId) => {
        const { error } = await supabase
            .from('todo_participants')
            .insert({ todo_id: todoId, user_id: userId })

        if (!error) fetchTodos()
        return error
    }

    const removeParticipant = async (todoId, userId) => {
        const { error } = await supabase
            .from('todo_participants')
            .delete()
            .match({ todo_id: todoId, user_id: userId })

        if (!error) fetchTodos()
        return error
    }

    return {
        todos,
        loading,
        addTodo,
        updateTodo,
        deleteTodo,
        restoreTodo,
        permDeleteTodo,
        addParticipant,
        removeParticipant,
        refresh: fetchTodos
    }
}
