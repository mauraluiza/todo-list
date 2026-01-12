import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'

export function useLists() {
    const { user } = useAuth()
    const { currentWorkspace } = useWorkspace()
    const [lists, setLists] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchLists = async () => {
        if (!user) {
            setLists([])
            return
        }
        try {
            let query = supabase
                .from('lists')
                .select('*')
                .order('created_at', { ascending: true })

            if (currentWorkspace) {
                query = query.eq('workspace_id', currentWorkspace.id)
            } else {
                query = query.is('workspace_id', null)
            }

            const { data, error } = await query

            if (error) throw error
            setLists(data || [])
        } catch (err) {
            console.error('Error fetching lists:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLists()
    }, [user, currentWorkspace]) // Refetch when workspace changes

    return { lists, loading, refreshLists: fetchLists }
}
