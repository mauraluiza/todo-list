import { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Loader2 } from "lucide-react";

import { supabase } from "../lib/supabase";

export default function LoginPage() {
    const { signIn, signUp } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleAuth = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            let emailToUse = identifier;

            if (isLogin && !identifier.includes("@")) {
                // Determine email from username
                const { data, error: profileError } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('username', identifier)
                    .single();

                if (profileError || !data?.email) {
                    throw new Error("Usuário não encontrado.");
                }
                emailToUse = data.email;
            }

            if (isLogin) {
                const { error } = await signIn(emailToUse, password);
                if (error) throw error;
            } else {
                const { error } = await signUp(identifier, password);
                if (error) throw error;
                alert("Conta criada! Verifique seu email ou faça login.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-green-500/10 blur-[120px]" />

            <div className="relative z-10 w-full max-w-md space-y-8 rounded-2xl border bg-card/50 backdrop-blur-sm p-10 shadow-lg animate-in fade-in zoom-in duration-500">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
                        {isLogin ? "Bem-vindo de volta" : "Criar conta"}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {isLogin
                            ? "Entre com suas credenciais para acessar."
                            : "Preencha os dados para começar."}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleAuth}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <Input
                            type="text"
                            placeholder="Email ou Usuário"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-sm font-medium text-destructive text-center bg-destructive/10 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLogin ? "Entrar" : "Cadastrar"}
                    </Button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            {isLogin
                                ? "Não tem uma conta? Cadastre-se"
                                : "Já tem uma conta? Entre"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
