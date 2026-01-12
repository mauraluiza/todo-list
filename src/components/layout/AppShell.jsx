import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { useTodos } from "../../hooks/useTodos"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Check, Trash2, Circle } from "lucide-react"

export default function AppShell({ children }) {
    const [view, setView] = useState("inbox")
    const { todos, loading, addTodo, updateTodo, deleteTodo } = useTodos()
    const [newTask, setNewTask] = useState("")

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            addTodo(newTask)
            setNewTask("")
        }
    }

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar activeView={view} onViewChange={setView} />
            <main className="flex-1 overflow-auto p-6 transition-all duration-300">
                {children ? children : (
                    <div className="max-w-4xl mx-auto space-y-8">
                        <header>
                            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary/90">
                                {view === 'inbox' ? 'Inbox' : view}
                            </h1>
                            <p className="text-muted-foreground mt-2 text-lg">Suas tarefas e prioridades.</p>
                        </header>

                        {/* Add Task */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="O que precisa ser feito?"
                                className="h-12 text-lg shadow-sm"
                                value={newTask}
                                onChange={e => setNewTask(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <Button onClick={() => { addTodo(newTask); setNewTask("") }} size="lg" className="h-12 px-8">
                                Adicionar
                            </Button>
                        </div>

                        {/* Task List */}
                        <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {loading && <div className="text-muted-foreground">Carregando tarefas...</div>}

                            {!loading && todos.length === 0 && (
                                <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                    <p>Tudo limpo! Aproveite seu dia.</p>
                                </div>
                            )}

                            {todos.map(todo => (
                                <div key={todo.id} className="group flex items-center justify-between p-4 bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                                    <div className="flex items-center gap-4 flex-1">
                                        <button
                                            onClick={() => updateTodo(todo.id, { status: todo.status === 'completed' ? 'pending' : 'completed' })}
                                            className={`rounded-full p-1 border transition-colors ${todo.status === 'completed' ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground text-transparent hover:bg-primary/10'}`}
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <span className={`text-lg font-medium transition-all ${todo.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                            {todo.title}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10" onClick={() => deleteTodo(todo.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
