import { useState, useMemo } from "react"
import { Sidebar } from "./Sidebar"
import { useTodos } from "../../hooks/useTodos"
import { useLists } from "../../hooks/useLists"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Check, Trash2, Plus, Info } from "lucide-react"
import TaskModal from "../TaskModal"

export default function AppShell({ children }) {
    const [view, setView] = useState("all")
    const { todos, loading, addTodo, updateTodo, deleteTodo } = useTodos('all', view)
    const { lists } = useLists()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState(null)

    const viewTitle = useMemo(() => {
        if (view === 'all') return 'Todas'
        const list = lists.find(l => l.id === view)
        return list ? list.title : 'Todas'
    }, [view, lists])

    const handleCreateTask = async (taskData) => {
        // If we are currently viewing a specific list, default the new task to that list
        if (view !== 'all') {
            taskData.listId = view
        }
        await addTodo(taskData)
    }

    const handleUpdateTask = async (taskData) => {
        if (editingTask) {
            await updateTodo(editingTask.id, taskData)
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

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar activeView={view} onViewChange={setView} />
            <main className="flex-1 overflow-auto p-6 transition-all duration-300">
                {children ? children : (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <header className="flex justify-between items-end">
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary/90">
                                    {viewTitle}
                                </h1>
                                <p className="text-muted-foreground mt-2 text-lg">Suas tarefas e prioridades.</p>
                            </div>
                            <Button onClick={openForCreate} size="lg" className="h-12 px-6 shadow-md">
                                <Plus className="mr-2 h-5 w-5" /> Nova Tarefa
                            </Button>
                        </header>

                        {/* Task List */}
                        <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {loading && <div className="text-muted-foreground">Carregando tarefas...</div>}

                            {!loading && todos.length === 0 && (
                                <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                    <p>Nenhuma tarefa encontrada nesta lista.</p>
                                    <Button variant="link" onClick={openForCreate}>Criar tarefa agora</Button>
                                </div>
                            )}

                            {todos.map(todo => (
                                <div
                                    key={todo.id}
                                    className="group flex items-center justify-between p-4 bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/50"
                                    onClick={() => openForEdit(todo)}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                updateTodo(todo.id, { status: todo.status === 'completed' ? 'pending' : 'completed' })
                                            }}
                                            className={`rounded-full p-1 border transition-colors ${todo.status === 'completed' ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground text-transparent hover:bg-primary/10'}`}
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <div className="flex flex-col">
                                            <span className={`text-lg font-medium transition-all ${todo.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                                {todo.title}
                                            </span>
                                            {/* Show small indicator if description exists */}
                                            {todo.description && (
                                                <span className="text-xs text-muted-foreground flex items-center mt-1">
                                                    <Info className="h-3 w-3 mr-1" /> Ver detalhes
                                                </span>
                                            )}
                                        </div>
                                    </div>
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
                                </div>
                            ))}
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
        </div>
    )
}
