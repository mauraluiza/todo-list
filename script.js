document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskInput = document.getElementById('taskInput');
    const descInput = document.getElementById('descInput');
    const ticketInput = document.getElementById('ticketInput');
    const prioritySelect = document.getElementById('prioritySelect');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const emptyState = document.getElementById('emptyState');

    // State
    let tasks = JSON.parse(localStorage.getItem('onboardingTasks')) || [];
    let currentFilter = 'all';

    // Init
    renderTasks();

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);

    // Add task on Ctrl+Enter in description or Enter in Title
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            descInput.focus();
        }
    });

    descInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') addTask();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // Core Functions
    function addTask() {
        const title = taskInput.value.trim();
        const desc = descInput.value.trim();
        const ticket = ticketInput.value.trim();
        const priority = prioritySelect.value; // 'normal' or 'urgente'

        if (!title) {
            taskInput.focus();
            return;
        }

        const newTask = {
            id: Date.now(),
            title: title,
            desc: desc,
            ticket: ticket || null,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask);
        saveTasks();
        renderTasks();

        // Reset Form
        taskInput.value = '';
        descInput.value = '';
        ticketInput.value = '';
        prioritySelect.value = 'normal';
        taskInput.focus();
    }

    function toggleTask(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        saveTasks();
        renderTasks();
    }

    function deleteTask(id) {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            tasks = tasks.filter(task => task.id !== id);
            saveTasks();
            renderTasks();
        }
    }

    function saveTasks() {
        localStorage.setItem('onboardingTasks', JSON.stringify(tasks));
    }

    function renderTasks() {
        taskList.innerHTML = '';

        let filteredTasks = tasks;

        if (currentFilter === 'pending') {
            filteredTasks = tasks.filter(t => !t.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(t => t.completed);
        } else if (currentFilter === 'urgent') {
            filteredTasks = tasks.filter(t => t.priority === 'urgente' && !t.completed);
        }

        if (filteredTasks.length === 0) {
            emptyState.classList.add('visible');
        } else {
            emptyState.classList.remove('visible');
        }

        filteredTasks.forEach(task => {
            const card = document.createElement('div');

            // Determine status class for card accent border
            let statusClass = 'status-pending';
            if (task.completed) statusClass = 'status-completed';
            else if (task.priority === 'urgente') statusClass = 'status-urgent';

            card.className = `task-card ${statusClass}`;

            const ticketHtml = task.ticket
                ? `<div class="ticket-tag">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <span>#${escapeHtml(task.ticket)}</span>
                   </div>`
                : '<div></div>'; // Spacer

            const completeIcon = task.completed
                ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>` // Undo icon logic essentially
                : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

            const completeTitle = task.completed ? 'Reabrir tarefa' : 'Concluir tarefa';

            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${escapeHtml(task.title)}</h3>
                    <div class="card-actions">
                         <button class="action-btn complete" title="${completeTitle}" onclick="window.toggleTaskCtx(${task.id})">
                             ${task.completed
                    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 3"></path><path d="M3 3h6"></path><path d="M3 3v6"></path></svg>'
                    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                }
                         </button>
                         <button class="action-btn delete" title="Excluir" onclick="window.deleteTaskCtx(${task.id})">
                             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                         </button>
                    </div>
                </div>
                
                <p class="card-desc">${escapeHtml(task.desc)}</p>
                
                <div class="card-meta">
                    ${ticketHtml}
                </div>
            `;

            taskList.appendChild(card);
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    window.toggleTaskCtx = toggleTask;
    window.deleteTaskCtx = deleteTask;
});
