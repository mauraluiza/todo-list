export function Header({ onToggleTheme, onNewTask, onImport }) {
    return (
        <header>
            <div className="header-left">
                <h1>Minhas Tarefas</h1>
            </div>
            <div className="header-controls">
                <button className="theme-toggle" onClick={onToggleTheme}>
                    <span className="sun-icon">☀️</span>
                    <span className="moon-icon">🌙</span>
                </button>
                <div style={{ marginRight: 8, display: 'inline-block' }}>
                    <input
                        type="file"
                        id="import-task-input"
                        accept=".txt,.html"
                        style={{ display: 'none' }}
                        onChange={onImport}
                    />
                    <button
                        className="primary-btn-header"
                        onClick={() => document.getElementById('import-task-input').click()}
                        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border)', fontWeight: 'normal', boxShadow: 'none' }}
                    >
                        📤 Importar
                    </button>
                </div>
                <button className="primary-btn-header" onClick={onNewTask} style={{ height: '42px', display: 'flex', alignItems: 'center' }}>
                    Nova Tarefa
                </button>
            </div>
        </header>
    )
}
