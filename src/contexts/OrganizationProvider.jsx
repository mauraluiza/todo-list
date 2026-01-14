import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthProvider'

const OrganizationContext = createContext({})

export function OrganizationProvider({ children }) {
    const { user } = useAuth()
    const [organizations, setOrganizations] = useState([])
    const [currentOrg, setCurrentOrg] = useState(null) // null = Personal Environment
    const [loading, setLoading] = useState(true)

    const fetchOrganizations = async () => {
        if (!user) {
            setOrganizations([])
            setCurrentOrg(null)
            setLoading(false)
            return
        }

        try {
            // Fetch orgs user is a member of
            const { data, error } = await supabase
                .from('organizations')
                .select(`
                    id,
                    name,
                    code,
                    role:organization_members!inner(role)
                `)

            if (error) throw error

            // Transform data to flatten role
            const formattedOrgs = data.map(org => ({
                id: org.id,
                name: org.name,
                code: org.code,
                role: org.role[0]?.role || 'member'
            }))

            setOrganizations(formattedOrgs)

            // Validate currentOrg is still valid (user might have been removed)
            if (currentOrg && !formattedOrgs.find(o => o.id === currentOrg.id)) {
                setCurrentOrg(null) // Reset to personal
            }

        } catch (err) {
            console.error('Error fetching organizations:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrganizations()
    }, [user])

    const createOrganization = async (name) => {
        try {
            // Generate a random unique code: NameSlug-Random4Chars
            const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)
            const random = Math.random().toString(36).substring(2, 6)
            const code = `${slug}-${random}`

            // 1. Create Org
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .insert({ name, code, created_by: user.id })
                .select()
                .single()

            if (orgError) throw orgError

            // 2. Add Creator as Admin Member (RLS might auto-handle, but ensuring strictly)
            // Note: If Policy "Join orgs" allows inserting self, this works.
            const { error: memberError } = await supabase
                .from('organization_members')
                .insert({
                    organization_id: org.id,
                    user_id: user.id,
                    role: 'admin'
                })

            if (memberError) {
                // Rollback org creation if member fail (simplified manual rollback)
                await supabase.from('organizations').delete().eq('id', org.id)
                throw memberError
            }

            await fetchOrganizations()
            setCurrentOrg({ ...org, role: 'admin' }) // Auto switch
            return { data: org, error: null }
        } catch (error) {
            console.error('Create Org Error:', error)
            return { data: null, error }
        }
    }

    const joinOrganization = async (code) => {
        try {
            // 1. Find Org
            const { data: org, error: findError } = await supabase
                .from('organizations')
                .select('id')
                .eq('code', code)
                .single()

            if (findError || !org) throw new Error('Organização não encontrada com este código.')

            // 2. Check if already member
            const isMember = organizations.find(o => o.id === org.id)
            if (isMember) throw new Error('Você já faz parte desta organização.')

            // 3. Join
            const { error: joinError } = await supabase
                .from('organization_members')
                .insert({
                    organization_id: org.id,
                    user_id: user.id,
                    role: 'member'
                })

            if (joinError) throw joinError

            await fetchOrganizations()
            return { error: null }
        } catch (error) {
            return { error }
        }
    }

    // Admin Only
    const removeMember = async (orgId, userId) => {
        // Implement logic
    }

    const deleteOrganization = async (orgId) => {
        // Implement logic
    }

    return (
        <OrganizationContext.Provider value={{
            organizations,
            currentOrg,
            setCurrentOrg, // Expose to allow switching
            createOrganization,
            joinOrganization,
            refreshOrganizations: fetchOrganizations,
            loading
        }}>
            {children}
        </OrganizationContext.Provider>
    )
}

export const useOrganization = () => useContext(OrganizationContext)
