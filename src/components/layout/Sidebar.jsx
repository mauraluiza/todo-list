import { useState } from "react"
import { useAuth } from "../AuthProvider"
import { useWorkspace } from "../WorkspaceProvider"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Input } from "../ui/input"
import { ChevronDown, Plus, LogOut, LayoutList, Settings, User } from "lucide-react"

export function Sidebar({ activeView, onViewChange }) {
    const { user, signOut } = useAuth()
    const { workspaces, currentWorkspace, setCurrentWorkspace, createWorkspace, joinWorkspace } = useWorkspace()

    return (
        <aside className="w-64 border-r bg-card flex flex-col h-screen">
            {/* Header: User / Workspace Switcher */}
            <div className="p-4 border-b">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            <span className="truncate">
                                {currentWorkspace ? currentWorkspace.name : "Pessoal"}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start">
                        <DropdownMenuLabel>Ambiente</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setCurrentWorkspace(null)}>
                            <User className="mr-2 h-4 w-4" /> Pessoal
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Organizações</DropdownMenuLabel>
                        {workspaces.map(ws => (
                            <DropdownMenuItem key={ws.id} onClick={() => setCurrentWorkspace(ws)}>
                                {ws.name}
                            </DropdownMenuItem>
                        ))}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Plus className="mr-2 h-4 w-4" /> Nova Organização...
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="space-y-1">
                    <Button
                        variant={activeView === 'inbox' ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => onViewChange('inbox')}
                    >
                        <LayoutList className="mr-2 h-4 w-4" />
                        Inbox
                    </Button>
                    {/* Future: Add Lists here */}
                </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t space-y-2">
                <div className="text-xs text-muted-foreground px-2 pb-2">
                    {user?.email}
                </div>
                <Button variant="ghost" className="w-full justify-start" onClick={() => {/* Settings */ }}>
                    <Settings className="mr-2 h-4 w-4" /> Configurações
                </Button>
                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                </Button>
            </div>
        </aside>
    )
}
