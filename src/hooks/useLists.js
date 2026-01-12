import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthProvider'
import { useWorkspace } from '../contexts/WorkspaceProvider'

export function useLists() {
    const { user } = useAuth()
    const { currentWorkspace } = useWorkspace()
    const [lists, setLists] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchLists = useCallback(async () => {
        if (!user) return
        setLoading(true)
        try {
            let query = supabase
                .from('lists')
                .select('*')
                .order('created_at', { ascending: true })

            // Workspace Logic
            if (currentWorkspace) {
                query = query.eq('workspace_id', currentWorkspace.id)
            } else {
                query = query.is('workspace_id', null).eq('owner_id', user.id)
            }

            const { data, error } = await query

            if (error) throw error
            setLists(data || [])
        } catch (err) {
            console.error('Error fetching lists:', err)
        } finally {
            setLoading(false)
        }
    }, [user, currentWorkspace])

    useEffect(() => {
        fetchLists()
    }, [fetchLists])

    const addList = async (title) => {
        if (!title.trim()) return

        const payload = {
            title,
            owner_id: user.id,
            workspace_id: currentWorkspace?.id || null
        }

        const { error } = await supabase.from('lists').insert(payload)
        if (!error) fetchLists()
        return error
    }

    const deleteList = async (id) => {
        const { error } = await supabase.from('lists').delete().eq('id', id)
        if (!error) fetchLists()
        return error
    }

    return { lists, loading, addList, deleteList, refresh: fetchLists }
}
