import { useState } from "react"
import { useOrganization } from "../../contexts/OrganizationProvider"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Building2, Users } from "lucide-react"

export default function OrganizationModal({ open, onOpenChange }) {
    const { createOrganization, joinOrganization } = useOrganization()
    const [loading, setLoading] = useState(false)
    const [createName, setCreateName] = useState("")
    const [joinCode, setJoinCode] = useState("")
    const [error, setError] = useState("")

    const handleCreate = async (e) => {
        e.preventDefault()
        setError("")
        if (!createName.trim()) return

        setLoading(true)
        const { error } = await createOrganization(createName)
        setLoading(false)

        if (error) {
            setError("Erro ao criar organização. Tente novamente.")
        } else {
            setCreateName("")
            onOpenChange(false)
        }
    }

    const handleJoin = async (e) => {
        e.preventDefault()
        setError("")
        if (!joinCode.trim()) return

        setLoading(true)
        const { error } = await joinOrganization(joinCode)
        setLoading(false)

        if (error) {
            setError(error.message || "Erro ao entrar na organização.")
        } else {
            setJoinCode("")
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Gerenciar Organizações</DialogTitle>
                    <DialogDescription>
                        Crie um novo ambiente de trabalho ou entre em um existente.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="create" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="create">Criar</TabsTrigger>
                        <TabsTrigger value="join">Participar</TabsTrigger>
                    </TabsList>

                    {/* Create Tab */}
                    <TabsContent value="create">
                        <form onSubmit={handleCreate} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome da Organização</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        placeholder="Ex: Minha Empresa"
                                        className="pl-9"
                                        value={createName}
                                        onChange={(e) => setCreateName(e.target.value)}
                                    />
                                </div>
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Criando..." : "Criar Organização"}
                            </Button>
                        </form>
                    </TabsContent>

                    {/* Join Tab */}
                    <TabsContent value="join">
                        <form onSubmit={handleJoin} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Código de Convite</Label>
                                <div className="relative">
                                    <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="code"
                                        placeholder="Ex: company-x7z9"
                                        className="pl-9"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Peça o código ao administrador da organização.
                                </p>
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Entrando..." : "Entrar na Organização"}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
