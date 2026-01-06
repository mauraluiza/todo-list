document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const taskList = document.getElementById('taskList');
    const folderList = document.getElementById('folderList');
    const emptyState = document.getElementById('emptyState');
    const pageTitle = document.getElementById('pageTitle');
    const sidebar = document.getElementById('sidebar');

    // Buttons
    const newTaskBtn = document.getElementById('newTaskBtn');
    const themeToggleBtn = document.getElementById('themeToggle');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const addFolderBtn = document.getElementById('addFolderBtn');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Modal Elements
    const modalOverlay = document.getElementById('taskModalOverlay');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalTitleInput = document.getElementById('modalTitleInput');
    const modalFolderSelect = document.getElementById('modalFolderSelect');
    const modalPrioritySelect = document.getElementById('modalPrioritySelect');
    const modalTicketInput = document.getElementById('modalTicketInput');
    const modalDateInfo = document.getElementById('modalDateInfo');
    const modalSaveBtn = document.getElementById('modalSaveBtn');
    const modalDeleteBtn = document.getElementById('modalDeleteBtn');

    // --- Editor Init ---
    // Initialize Quill
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'strike'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
                ['clean']
            ]
        },
        placeholder: 'Descreva os detalhes da tarefa...'
    });

    // --- State ---
    let tasks = JSON.parse(localStorage.getItem('onboardingTasks')) || [];
    let folders = JSON.parse(localStorage.getItem('onboardingFolders')) || [
        { id: 'work', name: 'Trabalho' },
        { id: 'personal', name: 'Pessoal' }
    ];

    let activeFolderId = 'all';
    let activeStatusFilter = 'all';
    let currentTaskId = null; // null = creating new

    // --- Init ---
    cleanupTrash();
    initTheme();
    renderFolders();
    renderTasks();

    // --- Interaction Listeners ---

    // Sidebar & Navigation
    toggleSidebarBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

    addFolderBtn.addEventListener('click', () => {
        const name = prompt('Nome da nova pasta:');
        if (name && name.trim()) {
            folders.push({ id: 'f_' + Date.now(), name: name.trim() });
            saveFolders();
            renderFolders();
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeStatusFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // Modal / Task Actions
    newTaskBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    modalSaveBtn.addEventListener('click', saveCurrentTask);

    modalDeleteBtn.addEventListener('click', () => {
        if (!currentTaskId) return;
        // Logic depends if it's already in trash or not
        const task = tasks.find(t => t.id === currentTaskId);
        if (task.deletedAt) {
            destroyTask(currentTaskId);
        } else {
            softDeleteTask(currentTaskId);
        }
    });

    // --- Core Functions ---

    function saveFolders() { localStorage.setItem('onboardingFolders', JSON.stringify(folders)); }
    function saveTasks() { localStorage.setItem('onboardingTasks', JSON.stringify(tasks)); }

    function cleanupTrash() {
        const now = Date.now();
        const limit = 30 * 24 * 60 * 60 * 1000;
        const initial = tasks.length;
        tasks = tasks.filter(t => !t.deletedAt || (now - new Date(t.deletedAt).getTime() <= limit));
        if (tasks.length !== initial) saveTasks();
    }

    function renderFolders() {
        folderList.innerHTML = `
            <div class="folder-row">
                <button class="folder-item ${activeFolderId === 'all' ? 'active' : ''}" onclick="window.selectFolder('all')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    Todas
                </button>
            </div>
        `;

        folders.forEach(folder => {
            const div = document.createElement('div');
            div.className = 'folder-row';
            div.innerHTML = `
                <button class="folder-item ${activeFolderId === folder.id ? 'active' : ''}" onclick="window.selectFolder('${folder.id}')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(folder.name)}</span>
                </button>
                <div class="folder-actions">
                     <button class="folder-action-btn" onclick="window.editFolder('${folder.id}')" title="Renomear">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                     </button>
                     <button class="folder-action-btn" onclick="window.deleteFolder('${folder.id}')" title="Excluir">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                     </button>
                </div>
            `;
            folderList.appendChild(div);
        });

        // Update Modal Select
        modalFolderSelect.innerHTML = '<option value="">Sem pasta</option>';
        folders.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = f.name;
            modalFolderSelect.appendChild(opt);
        });
    }

    // --- Modal Logic ---

    function openModal(taskId = null) {
        currentTaskId = taskId;

        if (taskId) {
            // Edit Mode
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            modalTitleInput.value = task.title;
            // Set Quill content
            if (task.richDesc) {
                // If we have saved delta or html
                // For simplicity let's assume we save HTML in 'desc' or 'richDesc'
                // Let's use 'desc' for HTML now.
                quill.root.innerHTML = task.desc || '';
            } else {
                quill.setText(task.desc || '');
            }

            modalFolderSelect.value = task.folderId || '';
            modalPrioritySelect.value = task.priority || 'normal';
            modalTicketInput.value = task.ticket || '';

            const dateStr = new Date(task.createdAt).toLocaleDateString();
            modalDateInfo.textContent = `Criado em ${dateStr}`;

            modalDeleteBtn.classList.remove('hidden');
            if (task.deletedAt) modalDeleteBtn.textContent = 'Excluir Permanentemente';
            else modalDeleteBtn.textContent = 'Mover para Lixeira';

        } else {
            // Create Mode
            modalTitleInput.value = '';
            quill.setText('');
            modalFolderSelect.value = activeFolderId !== 'all' ? activeFolderId : '';
            modalPrioritySelect.value = 'normal';
            modalTicketInput.value = '';
            modalDateInfo.textContent = 'Nova tarefa';
            modalDeleteBtn.classList.add('hidden');
        }

        modalOverlay.classList.remove('hidden');
        if (!taskId) modalTitleInput.focus();
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        currentTaskId = null;
    }

    function saveCurrentTask() {
        const title = modalTitleInput.value.trim();
        if (!title) { modalTitleInput.focus(); return; }

        // Get HTML from Quill
        const htmlContent = quill.root.innerHTML; // contains tags
        // Also get text for preview if needed, but we can strip html later

        const folderId = modalFolderSelect.value;
        const priority = modalPrioritySelect.value;
        const ticket = modalTicketInput.value.trim();

        if (currentTaskId) {
            tasks = tasks.map(t => {
                if (t.id === currentTaskId) {
                    return { ...t, title, desc: htmlContent, richDesc: true, folderId, priority, ticket, updatedAt: new Date().toISOString() };
                }
                return t;
            });
        } else {
            tasks.unshift({
                id: Date.now(),
                title,
                desc: htmlContent,
                richDesc: true, // Marker to know it's HTML
                folderId,
                priority,
                ticket,
                completed: false,
                createdAt: new Date().toISOString()
            });
        }

        saveTasks();
        renderTasks();
        closeModal();
    }

    // --- Global Actions ---
    window.selectFolder = (id) => {
        activeFolderId = id;
        renderFolders();
        pageTitle.textContent = (id === 'all') ? 'Todas' : (folders.find(f => f.id === id)?.name || 'Pasta');
        sidebar.classList.remove('open');
        renderTasks();
    };

    window.editFolder = (id) => {
        const f = folders.find(x => x.id === id);
        if (!f) return;
        const n = prompt('Novo nome:', f.name);
        if (n && n.trim()) { f.name = n.trim(); saveFolders(); renderFolders(); }
    };

    window.deleteFolder = (id) => {
        if (!confirm('Excluir pasta?')) return;
        folders = folders.filter(x => x.id !== id);
        tasks = tasks.map(t => t.folderId === id ? { ...t, folderId: null } : t);
        saveFolders();
        if (activeFolderId === id) window.selectFolder('all');
        else renderFolders();
    };

    // Task Context Actions
    window.openTask = (id) => openModal(id);

    function softDeleteTask(id) {
        if (confirm('Mover para Lixeira?')) {
            tasks = tasks.map(t => t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t);
            saveTasks();
            renderTasks();
            closeModal();
        }
    }

    function destroyTask(id) {
        if (confirm('Excluir permanentemente?')) {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
            closeModal();
        }
    }

    window.restoreTask = (id) => {
        tasks = tasks.map(t => t.id === id ? { ...t, deletedAt: null } : t);
        saveTasks();
        renderTasks();
    };

    window.toggleComplete = (e, id) => {
        e.stopPropagation(); // prevent modal open
        tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        saveTasks();
        renderTasks();
    };

    // --- Rendering ---
    function renderTasks() {
        taskList.innerHTML = '';
        let filtered = tasks;

        if (activeStatusFilter !== 'trash') {
            filtered = filtered.filter(t => !t.deletedAt);
            if (activeFolderId !== 'all') filtered = filtered.filter(t => t.folderId === activeFolderId);

            if (activeStatusFilter === 'pending') filtered = filtered.filter(t => !t.completed);
            else if (activeStatusFilter === 'completed') filtered = filtered.filter(t => t.completed);
            else if (activeStatusFilter === 'urgent') filtered = filtered.filter(t => t.priority === 'urgente' && !t.completed);
        } else {
            filtered = filtered.filter(t => t.deletedAt);
        }

        // Sort
        filtered.sort((a, b) => {
            if (activeStatusFilter === 'trash') return new Date(b.deletedAt) - new Date(a.deletedAt);
            const wA = (a.completed ? 1 : (a.priority === 'urgente' ? 3 : 2));
            const wB = (b.completed ? 1 : (b.priority === 'urgente' ? 3 : 2));
            return (wB - wA) || (b.id - a.id);
        });

        if (filtered.length === 0) {
            emptyState.classList.add('visible');
            emptyState.querySelector('p').textContent = activeStatusFilter === 'trash' ? 'Lixeira vazia 🗑️' : 'Nenhum card por aqui ✨';
        } else {
            emptyState.classList.remove('visible');
        }

        filtered.forEach(task => {
            const card = document.createElement('div');
            let statusClass = 'status-pending';
            if (activeStatusFilter === 'trash') statusClass = 'status-trash';
            else if (task.completed) statusClass = 'status-completed';
            else if (task.priority === 'urgente') statusClass = 'status-urgent';

            card.className = `task-card ${statusClass}`;
            card.onclick = () => window.openTask(task.id);

            // Tags
            let metaHtml = '';
            if (task.ticket) metaHtml += `<div class="ticket-tag">#${escapeHtml(task.ticket)}</div>`;
            if ((activeFolderId === 'all' || activeStatusFilter === 'trash') && task.folderId) {
                const f = folders.find(x => x.id === task.folderId);
                if (f) metaHtml += `<div class="ticket-tag" style="margin-left:auto;">${escapeHtml(f.name)}</div>`;
            }

            // Buttons
            let actionHtml = '';
            if (activeStatusFilter === 'trash') {
                actionHtml = `
                    <button class="action-btn" onclick="event.stopPropagation(); window.restoreTask(${task.id})" title="Restaurar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg></button>
                `;
            } else {
                const checkIcon = task.completed
                    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path></svg>'  // Check
                    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>'; // Circle

                actionHtml = `
                    <button class="action-btn" onclick="window.toggleComplete(event, ${task.id})">${checkIcon}</button>
                `;
            }

            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${escapeHtml(task.title)}</h3>
                    <div class="card-actions">${actionHtml}</div>
                </div>
                <!-- Render simplified HTML for preview, strip images etc if needed, but for now just raw HTML -->
                <div class="card-desc ql-editor" style="padding:0 !important; pointer-events:none;">${task.desc || ''}</div>
                <div class="card-meta">${metaHtml}</div>
            `;
            taskList.appendChild(card);
        });
    }

    function initTheme() {
        const t = localStorage.getItem('theme');
        if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        themeToggleBtn.addEventListener('click', () => {
            const n = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', n);
            localStorage.setItem('theme', n);
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }
});
