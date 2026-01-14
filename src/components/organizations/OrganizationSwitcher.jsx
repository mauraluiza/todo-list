import { ChevronsUpDown, Plus, Building2, User } from "lucide-react"
import { useOrganization } from "../../contexts/OrganizationProvider"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Button } from "../ui/button"

export default function OrganizationSwitcher({ onCreateClick }) {
    const { organizations, currentOrg, setCurrentOrg } = useOrganization()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between mb-4 border-dashed border-gray-600 hover:border-solid">
                    <div className="flex items-center gap-2 overflow-hidden">
                        {currentOrg ? (
                            <Building2 className="h-4 w-4 shrink-0" />
                        ) : (
                            <User className="h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate">
                            {currentOrg ? currentOrg.name : "Pessoal"}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px]">
                <DropdownMenuLabel>Ambiente Atual</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Personal Environment Option */}
                <DropdownMenuItem
                    onSelect={() => setCurrentOrg(null)}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <User className="h-4 w-4 text-blue-500" />
                    <span>Pessoal</span>
                    {!currentOrg && <span className="ml-auto text-xs opacity-50">✓</span>}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Minhas Organizações</DropdownMenuLabel>

                {organizations.length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                        Nenhuma organização
                    </div>
                )}

                {organizations.map((org) => (
                    <DropdownMenuItem
                        key={org.id}
                        onSelect={() => setCurrentOrg(org)}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <Building2 className="h-4 w-4 text-purple-500" />
                        <span>{org.name}</span>
                        {currentOrg?.id === org.id && <span className="ml-auto text-xs opacity-50">✓</span>}
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onSelect={onCreateClick}
                    className="flex items-center gap-2 cursor-pointer text-primary focus:text-primary"
                >
                    <Plus className="h-4 w-4" />
                    <span>Nova Organização</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
