import { useAuth } from "./contexts/AuthProvider"
import LoginPage from "./pages/LoginPage"
import Dashboard from "./pages/Dashboard"
import { Loader2 } from "lucide-react"

export default function App() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-lg font-medium text-muted-foreground">Carregando...</p>
                </div>
            </div>
        )
    }

    return user ? <Dashboard /> : <LoginPage />
}
