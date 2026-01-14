import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthProvider'
import { useOrganization } from '../contexts/OrganizationProvider'

export function useLists() {
    const { user } = useAuth()
    const { currentOrg } = useOrganization()
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

            // Environment Logic
            if (currentOrg) {
                query = query.eq('organization_id', currentOrg.id)
            } else {
                // Personal: check for NULL org and correct owner/user
                // Note: Assuming 'lists' table calls creator 'owner_id' (legacy) or 'user_id'
                // We will try to preserve existing legacy logic for personal lists
                // and use organization_id for org lists.
                query = query.is('organization_id', null).eq('owner_id', user.id)
            }

            const { data, error } = await query

            if (error) throw error
            setLists(data || [])
        } catch (err) {
            console.error('Error fetching lists:', err)
        } finally {
            setLoading(false)
        }
    }, [user, currentOrg])

    useEffect(() => {
        fetchLists()
    }, [fetchLists])

    const addList = async (title) => {
        if (!title.trim()) return

        const payload = {
            title,
            owner_id: user.id,
            organization_id: currentOrg ? currentOrg.id : null
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
