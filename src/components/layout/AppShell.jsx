import { useState, useMemo } from "react"
import { Sidebar } from "./Sidebar"
import { useTodos } from "../../hooks/useTodos"
import { useLists } from "../../hooks/useLists"
import { useOrganization } from "../../contexts/OrganizationProvider"
import { useAuth } from "../../contexts/AuthProvider"
import { Button } from "../ui/button"
import { Check, Trash2, Plus, Info, RefreshCcw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import TaskModal from "../features/TaskModal"
import AiChat from "../AiChat"

export default function AppShell({ children }) {
    const [view, setView] = useState("all")
    const [statusFilter, setStatusFilter] = useState("pending")
    const [priorityFilter, setPriorityFilter] = useState("all")

    const isTrashView = view === 'trash'
    const effectiveStatusFilter = isTrashView ? 'trash' : (statusFilter === 'completed' ? 'completed' : 'pending')

    // Pass statusFilter to hook to handle data fetching/subscription
    const { todos, loading, addTodo, updateTodo, deleteTodo, restoreTodo, permDeleteTodo, addParticipant, removeParticipant } = useTodos(effectiveStatusFilter, view)
    const { lists } = useLists()
    const { currentOrg } = useOrganization()
    const { user } = useAuth()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState(null)

    const viewTitle = useMemo(() => {
        if (view === 'trash') return 'Lixeira'
        if (view === 'all') return 'Todas'
        const list = lists.find(l => l.id === view)
        return list ? list.title : 'Todas'
    }, [view, lists])

    // Filter by priority locally since useTodos returns sorted list for the status
    const filteredTodos = useMemo(() => {
        if (priorityFilter === 'all') return todos
        return todos.filter(t => (t.priority || 'none') === priorityFilter)
    }, [todos, priorityFilter])

    const handleCreateTask = async (taskData) => {
        if (view !== 'all' && view !== 'trash') {
            taskData.listId = view
        }

        const { participants = [], ...todoPayload } = taskData
        const { data } = await addTodo(todoPayload)

        if (data && participants.length > 0) {
            // Assign participants
            await Promise.all(participants.map(uid => addParticipant(data.id, uid)))
        }
    }

    const handleUpdateTask = async (taskData) => {
        if (editingTask) {
            const { participants: newParticipants, ...todoPayload } = taskData
            await updateTodo(editingTask.id, todoPayload)

            // Sync Participants (if provided/changed)
            if (newParticipants) {
                const oldIds = editingTask.participants?.map(p => p.user?.id).filter(Boolean) || []

                const toAdd = newParticipants.filter(id => !oldIds.includes(id))
                const toRemove = oldIds.filter(id => !newParticipants.includes(id))

                if (toAdd.length > 0 || toRemove.length > 0) {
                    await Promise.all([
                        ...toAdd.map(uid => addParticipant(editingTask.id, uid)),
                        ...toRemove.map(uid => removeParticipant(editingTask.id, uid))
                    ])
                }
            }
        }
    }

    const openForCreate = () => {
        setEditingTask(null)
        setIsModalOpen(true)
    }

    const openForEdit = (todo) => {
        setEditingTask(todo)
        setIsModalOpen(true)
    }

    const getPriorityStyles = (priority) => {
        // Handle null/undefined as 'none'
        const p = priority || 'none'
        switch (p) {
            case 'high':
                // Urgent: Soft Red
                return 'bg-red-50/70 dark:bg-red-950/20 border-red-200/60 dark:border-red-900/50 hover:bg-red-100/60 dark:hover:bg-red-950/30'
            case 'low':
                // Low: Soft Orange
                return 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-200/60 dark:border-orange-900/50 hover:bg-orange-100/60 dark:hover:bg-orange-950/30'
            case 'none':
            default:
                // None: Soft Gray/Light
                return 'bg-gray-50/40 dark:bg-gray-900/10 border-gray-200/60 dark:border-gray-800/50 hover:bg-gray-100/60 dark:hover:bg-gray-900/20'
        }
    }

    const getPriorityLabel = (priority) => {
        const p = priority || 'none'
        switch (p) {
            case 'high': return <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">Urgente</span>
            case 'low': return <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 rounded-full">Baixa</span> // "Baixa Prioridade" -> "Baixa" for space
            default: return null
        }
    }

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar activeView={view} onViewChange={setView} />
            <main className="flex-1 overflow-auto p-6 transition-all duration-300">
                {children ? children : (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <header className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary/90">
                                    {viewTitle}
                                </h1>
                                <p className="text-muted-foreground mt-2 text-lg">Suas tarefas e prioridades.</p>
                            </div>
                            {!isTrashView && (
                                <Button onClick={openForCreate} size="lg" className="h-12 px-6 shadow-md">
                                    <Plus className="mr-2 h-5 w-5" /> Nova Tarefa
                                </Button>
                            )}
                        </header>

                        {/* Filters and Tabs - Hide in Trash View */}
                        {!isTrashView && (
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/30 p-2 rounded-xl border">
                                <div className="flex p-1 bg-muted rounded-lg">
                                    <button
                                        onClick={() => setStatusFilter('pending')}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statusFilter === 'pending' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        A Fazer
                                    </button>
                                    <button
                                        onClick={() => setStatusFilter('completed')}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statusFilter === 'completed' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Concluídas
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">Filtrar por:</span>
                                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                        <SelectTrigger className="w-[180px] bg-background">
                                            <SelectValue placeholder="Prioridade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas</SelectItem>
                                            <SelectItem value="high">Urgente</SelectItem>
                                            <SelectItem value="low">Baixa Prioridade</SelectItem>
                                            <SelectItem value="none">Sem Prioridade</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Task List */}
                        <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {loading && <div className="text-muted-foreground text-center py-10">Carregando tarefas...</div>}

                            {!loading && filteredTodos.length === 0 && (
                                <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                    <p>Nenhuma tarefa encontrada.</p>
                                    {statusFilter === 'pending' && <Button variant="link" onClick={openForCreate}>Criar tarefa agora</Button>}
                                </div>
                            )}

                            {filteredTodos.map(todo => {
                                // Calculate days remaining for Trash items
                                let daysRemaining = null
                                if (isTrashView && todo.deleted_at) {
                                    const deleteDate = new Date(todo.deleted_at)
                                    const expirationDate = new Date(deleteDate.getTime() + (30 * 24 * 60 * 60 * 1000))
                                    const diffTime = expirationDate - new Date()
                                    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                                    if (daysRemaining < 0) daysRemaining = 0
                                }

                                const isCreator = todo.user_id === user?.id
                                const isAdmin = currentOrg?.role === 'admin' || currentOrg?.role === 'owner'
                                const isParticipant = todo.participants?.some(p => p.user?.id === user?.id)
                                const canEdit = !currentOrg || isCreator || isAdmin || isParticipant
                                const canDelete = !currentOrg || isCreator || isAdmin

                                return (
                                    <div
                                        key={todo.id}
                                        className={`group flex items-center justify-between p-4 border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${getPriorityStyles(todo.priority)}`}
                                        onClick={() => !isTrashView && openForEdit(todo)}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            {!isTrashView && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        updateTodo(todo.id, { status: todo.status === 'completed' ? 'pending' : 'completed' })
                                                    }}
                                                    className={`rounded-full p-1 border transition-colors ${todo.status === 'completed' ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground text-transparent hover:bg-primary/10'}`}
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                            )}

                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-lg font-medium transition-all ${!isTrashView && todo.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                                        {todo.title}
                                                    </span>
                                                    {!isTrashView && getPriorityLabel(todo.priority)}
                                                    {isTrashView && daysRemaining !== null && (
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${daysRemaining < 5 ? 'bg-red-100 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                                                            {daysRemaining} dias
                                                        </span>
                                                    )}
                                                </div>

                                                {todo.description && (
                                                    <span className="text-xs text-muted-foreground flex items-center">
                                                        <Info className="h-3 w-3 mr-1" /> Ver detalhes
                                                    </span>
                                                )}

                                                {/* Creator and Participants (Org Mode) */}
                                                {currentOrg && (todo.creator || (todo.participants && todo.participants.length > 0)) && (
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {todo.creator && (
                                                            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                                                Criado por: <span className="font-medium text-foreground/80">{todo.creator.full_name || todo.creator.email}</span>
                                                            </span>
                                                        )}

                                                        {todo.participants && todo.participants.length > 0 && (
                                                            <div className="flex -space-x-1.5 overflow-hidden">
                                                                {todo.participants
                                                                    .filter(p => p.user)
                                                                    .map(({ user }) => (
                                                                        <div
                                                                            key={user.id}
                                                                            className="inline-block h-5 w-5 rounded-full ring-2 ring-background bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300 uppercase"
                                                                            title={user.full_name || user.email}
                                                                        >
                                                                            {(user.full_name || user.email || '?')[0]}
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isTrashView ? (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-primary hover:text-primary hover:bg-primary/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            restoreTodo(todo.id)
                                                        }}
                                                    >
                                                        <RefreshCcw className="h-4 w-4 mr-2" /> Restaurar
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (confirm('Tem certeza? Essa ação não pode ser desfeita.')) {
                                                                permDeleteTodo(todo.id)
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                                    </Button>
                                                </>
                                            ) : (
                                                canDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 z-10"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteTodo(todo.id)
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </main>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                task={editingTask}
                onSave={editingTask ? handleUpdateTask : handleCreateTask}
                lists={lists}
            />
            {/* AI Chat Widget */}
            <AiChat />
        </div>
    )
}
