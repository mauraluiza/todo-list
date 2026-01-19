import { useState, useEffect } from "react"
import { useOrganization } from "../../contexts/OrganizationProvider"
import { useAuth } from "../../contexts/AuthProvider"
import { supabase } from "../../lib/supabase"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "../ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Users, Settings, LogOut, Trash2, Copy, Check } from "lucide-react"

export default function OrganizationSettings({ open, onOpenChange }) {
    const { currentOrg, setCurrentOrg, refreshOrganizations } = useOrganization()
    const { user } = useAuth()
    const [members, setMembers] = useState([])
    const [loadingMembers, setLoadingMembers] = useState(false)
    const [copied, setCopied] = useState(false)

    // Fetch members when modal opens and org is active
    useEffect(() => {
        if (open && currentOrg) {
            fetchMembers()
        }
    }, [open, currentOrg])

    const fetchMembers = async () => {
        if (!currentOrg) return
        setLoadingMembers(true)
        try {
            const { data, error } = await supabase
                .from('organization_members')
                .select(`
                    id,
                    role,
                    user_id,
                    profile:profiles ( full_name, email )
                `)
                .eq('organization_id', currentOrg.id)

            // If direct auth.users access is blocked (common security pattern),
            // you might need a public 'profiles' table.

            setMembers(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingMembers(false)
        }
    }

    const copyCode = () => {
        if (currentOrg?.code) {
            navigator.clipboard.writeText(currentOrg.code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleLeave = async () => {
        if (!confirm("Tem certeza que deseja sair desta organização?")) return

        try {
            await supabase
                .from('organization_members')
                .delete()
                .eq('organization_id', currentOrg.id)
                .eq('user_id', user.id)

            await refreshOrganizations()
            setCurrentOrg(null) // Switch to personal
            onOpenChange(false)
        } catch (err) {
            console.error(err)
        }
    }

    const handleDeleteOrg = async () => {
        const confirmName = prompt(`Digite "${currentOrg.name}" para confirmar a exclusão PERMANENTE da organização e de todas as tarefas.`)
        if (confirmName !== currentOrg.name) return alert("Nome incorreto.")

        try {
            await supabase
                .from('organizations')
                .delete()
                .eq('id', currentOrg.id)

            await refreshOrganizations()
            setCurrentOrg(null)
            onOpenChange(false)
        } catch (err) {
            console.error(err)
            alert("Erro ao excluir. Verifique se você é o dono.")
        }
    }

    if (!currentOrg) return null

    const isAdmin = currentOrg.role === 'admin' || currentOrg.role === 'owner'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Configurações da Organização</DialogTitle>
                    <DialogDescription>
                        Gerencie permissões e membros de <strong>{currentOrg.name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="members" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList>
                        <TabsTrigger value="members">Membros</TabsTrigger>
                        <TabsTrigger value="settings">Geral</TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="flex-1 overflow-auto py-4 space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                            <div>
                                <Label className="text-xs text-muted-foreground">Código de Convite</Label>
                                <div className="font-mono text-lg tracking-wider">{currentOrg.code}</div>
                            </div>
                            <Button size="sm" variant="outline" onClick={copyCode}>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied ? "Copiado" : "Copiar"}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Lista de Membros</h4>
                            {loadingMembers ? (
                                <div className="text-sm text-muted-foreground">Carregando...</div>
                            ) : (
                                <div className="space-y-1">
                                    {members.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                    <UserIcon />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        {member.profile?.email || member.profile?.full_name || "Usuário"} {member.user_id === user.id && "(Você)"}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                                                </div>
                                            </div>
                                            {/* Admin actions could go here (remove member) */}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4 py-4">
                        <div className="space-y-4">
                            <div className="p-4 border rounded-lg border-destructive/20 bg-destructive/5 space-y-4">
                                <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
                                    <LogOut className="h-4 w-4" /> Zona de Perigo
                                </h4>

                                <div className="flex items-center justify-between">
                                    <div className="text-sm">
                                        <p className="font-medium">Sair da Organização</p>
                                        <p className="text-muted-foreground text-xs">Você perderá acesso às tarefas.</p>
                                    </div>
                                    <Button variant="destructive" size="sm" onClick={handleLeave}>Sair</Button>
                                </div>

                                {isAdmin && (
                                    <>
                                        <div className="h-px bg-destructive/20" />
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm">
                                                <p className="font-medium">Excluir Organização</p>
                                                <p className="text-muted-foreground text-xs">Ação irreversível. Apaga todas as tarefas.</p>
                                            </div>
                                            <Button variant="destructive" size="sm" onClick={handleDeleteOrg}>Excluir Definitivamente</Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

function UserIcon() {
    return (
        <svg
            className="h-4 w-4 opacity-50"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
