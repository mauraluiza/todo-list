import { useState } from "react"
import { useAuth } from "../../contexts/AuthProvider"
import { useOrganization } from "../../contexts/OrganizationProvider"
import { useLists } from "../../hooks/useLists"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog"
import { LogOut, LayoutList, Settings, Folder, Trash2, Plus } from "lucide-react"
import { ModeToggle } from "../features/ModeToggle"
import OrganizationSwitcher from "../organizations/OrganizationSwitcher"
import OrganizationModal from "../organizations/OrganizationModal"
import OrganizationSettings from "../organizations/OrganizationSettings"

export function Sidebar({ activeView, onViewChange }) {
    const { user, signOut } = useAuth()
    const { currentOrg } = useOrganization()
    const { lists, addList, deleteList } = useLists()
    const [isNewListModalOpen, setIsNewListModalOpen] = useState(false)
    const [isOrgModalOpen, setIsOrgModalOpen] = useState(false)
    const [isOrgSettingsOpen, setIsOrgSettingsOpen] = useState(false)
    const [newListName, setNewListName] = useState("")

    const handleCreateList = async () => {
        if (!newListName.trim()) return
        await addList(newListName)
        setNewListName("")
        setIsNewListModalOpen(false)
    }

    return (
        <aside className="w-64 border-r bg-card flex flex-col h-screen">
            {/* Header: Organization Switcher */}
            <div className="p-4 border-b">
                <OrganizationSwitcher onCreateClick={() => setIsOrgModalOpen(true)} />
            </div>

            <OrganizationModal
                open={isOrgModalOpen}
                onOpenChange={setIsOrgModalOpen}
            />

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="space-y-1">
                    <Button
                        variant={activeView === 'all' ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => onViewChange('all')}
                    >
                        <LayoutList className="mr-2 h-4 w-4" />
                        Todas
                    </Button>
                </div>

                <div className="space-y-1">
                    <Button
                        variant={activeView === 'trash' ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-muted-foreground hover:text-foreground"
                        onClick={() => onViewChange('trash')}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Lixeira
                    </Button>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1">
                        <h4 className="text-sm font-semibold tracking-tight">Pastas</h4>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsNewListModalOpen(true)}>
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                    {lists.length === 0 && (
                        <div className="text-xs text-muted-foreground px-2">
                            Nenhuma pasta criada.
                        </div>
                    )}
                    {lists.map(list => (
                        <div key={list.id} className="group flex items-center">
                            <Button
                                variant={activeView === list.id ? 'secondary' : 'ghost'}
                                className="w-full justify-start pl-2"
                                onClick={() => onViewChange(list.id)}
                            >
                                <Folder className="mr-2 h-4 w-4" />
                                <span className="truncate">{list.title}</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-[-24px] z-10 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm('Tem certeza que deseja excluir esta pasta? As tarefas nela não serão apagadas, apenas desvinculadas.')) {
                                        deleteList(list.id)
                                    }
                                }}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t space-y-2">
                <div className="flex items-center justify-between px-2 pb-2">
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={user?.email}>
                        {user?.email}
                    </span>
                    <ModeToggle />
                </div>

                {/* Org Settings Button (Only if in an Org) */}
                {currentOrg && (
                    <Button variant="ghost" className="w-full justify-start" onClick={() => setIsOrgSettingsOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" /> Configurações da Org
                    </Button>
                )}

                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                </Button>
            </div>

            {/* New List Modal */}
            <Dialog open={isNewListModalOpen} onOpenChange={setIsNewListModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Pasta</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Nome da pasta"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewListModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateList}>Criar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <OrganizationSettings
                open={isOrgSettingsOpen}
                onOpenChange={setIsOrgSettingsOpen}
            />
        </aside>
    )
}
