import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

const AuthContext = createContext({})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // 1. Initial Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        }).catch(err => {
            console.error("Auth Init Error:", err)
            setLoading(false)
        })

        // 2. Subscription
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            setLoading(false)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Sync Profile on User Change
    useEffect(() => {
        if (user) {
            const upsertProfile = async () => {
                try {
                    const updates = {
                        id: user.id,
                        email: user.email,
                        updated_at: new Date(),
                        // Ideally get full_name from metadata if available, else email
                        full_name: user.user_metadata?.full_name || user.email.split('@')[0]
                    }

                    const { error } = await supabase.from('profiles').upsert(updates)
                    if (error) console.error("Error syncing profile:", error)
                } catch (err) {
                    console.error("Profile sync exception:", err)
                }
            }
            upsertProfile()
        }
    }, [user])

    const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
    const signUp = (email, password) => supabase.auth.signUp({ email, password })
    const signOut = () => supabase.auth.signOut()

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
