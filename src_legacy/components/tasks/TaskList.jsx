export function TaskList({ tasks, loading, onTaskClick }) {
    if (loading) return <div className="empty-state visible">Carregando...</div>

    if (tasks.length === 0) {
        return (
            <div className="empty-state visible">
                Nenhuma tarefa encontrada.
            </div>
        )
    }

    return (
        <div className="task-grid">
            {tasks.map(task => (
                <div
                    key={task.id}
                    className={`task-card status-${task.status}`}
                    onClick={() => onTaskClick(task)}
                >
                    <div className="card-header">
                        <span className="card-title">{task.title}</span>
                        <div className="card-actions">
                            <button className="action-btn">✏️</button>
                        </div>
                    </div>
                    <div className="card-desc" dangerouslySetInnerHTML={{
                        // Sanitize strip tags or render secure HTML?
                        // For preview, let's just strip tags to avoid breaking layout, 
                        // or clamp lines.
                        // ReactQuill produces HTML. We can use a simple regex to get text or render it.
                        // Rendering is safer if we trust Quill, or we can use a library.
                        // For now, render direct with caution (legacy app did this).
                        __html: task.description
                    }} />

                    <div className="card-meta">
                        <div className="date-info">
                            {task.due_at ? new Date(task.due_at).toLocaleDateString() : 'Sem data'}
                        </div>
                        {/* Show Priority Icon/Text */}
                        {task.priority === 'urgent' && <span style={{ color: 'var(--color-urgent)', fontSize: '0.8rem' }}>🔥 Urgente</span>}
                    </div>
                </div>
            ))}
        </div>
    )
}
