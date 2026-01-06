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

    // Export / Import Elements
    const importBtn = document.getElementById('importBtn');
    const importInput = document.getElementById('importInput');
    const exportBtnTrigger = document.getElementById('exportBtnTrigger');
    const exportMenu = document.getElementById('exportMenu');
    const exportOpts = document.querySelectorAll('.export-opt');

    // --- Editor Init ---
    // Initialize Quill with image support
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: {
                container: [
                    ['bold', 'italic', 'strike'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
                    ['image'],
                    ['clean']
                ],
                handlers: {
                    image: imageHandler
                }
            }
        },
        placeholder: 'Descreva os detalhes da tarefa...'
    });

    // Custom image handler for Quill
    function imageHandler() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = () => {
            const file = input.files[0];
            if (!file) return;

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Imagem muito grande! Máximo permitido: 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result;
                const range = quill.getSelection(true);
                quill.insertEmbed(range.index, 'image', base64);
                quill.setSelection(range.index + 1);
            };
            reader.readAsDataURL(file);
        };
    }

    // Image editing - resize handles and menu
    let currentEditingImage = null;
    let imageMenu = null;
    let resizeWrapper = null;
    let isResizing = false;
    let startX, startY, startWidth, startHeight;
    let currentHandle = null;

    function createResizeWrapper() {
        if (resizeWrapper) return resizeWrapper;

        resizeWrapper = document.createElement('div');
        resizeWrapper.className = 'image-resize-wrapper hidden';
        resizeWrapper.innerHTML = `
            <div class="resize-handle handle-nw" data-handle="nw"></div>
            <div class="resize-handle handle-n" data-handle="n"></div>
            <div class="resize-handle handle-ne" data-handle="ne"></div>
            <div class="resize-handle handle-e" data-handle="e"></div>
            <div class="resize-handle handle-se" data-handle="se"></div>
            <div class="resize-handle handle-s" data-handle="s"></div>
            <div class="resize-handle handle-sw" data-handle="sw"></div>
            <div class="resize-handle handle-w" data-handle="w"></div>
        `;
        document.body.appendChild(resizeWrapper);

        // Handle mouse events for resizing
        resizeWrapper.querySelectorAll('.resize-handle').forEach(handle => {
            handle.addEventListener('mousedown', startResize);
        });

        return resizeWrapper;
    }

    function startResize(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!currentEditingImage) return;

        isResizing = true;
        currentHandle = e.target.dataset.handle;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = currentEditingImage.offsetWidth;
        startHeight = currentEditingImage.offsetHeight;

        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
    }

    function doResize(e) {
        if (!isResizing || !currentEditingImage) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        const aspectRatio = startWidth / startHeight;

        switch (currentHandle) {
            case 'e':
                newWidth = Math.max(50, startWidth + deltaX);
                break;
            case 'w':
                newWidth = Math.max(50, startWidth - deltaX);
                break;
            case 's':
                newHeight = Math.max(50, startHeight + deltaY);
                break;
            case 'n':
                newHeight = Math.max(50, startHeight - deltaY);
                break;
            case 'se':
                newWidth = Math.max(50, startWidth + deltaX);
                newHeight = newWidth / aspectRatio;
                break;
            case 'sw':
                newWidth = Math.max(50, startWidth - deltaX);
                newHeight = newWidth / aspectRatio;
                break;
            case 'ne':
                newWidth = Math.max(50, startWidth + deltaX);
                newHeight = newWidth / aspectRatio;
                break;
            case 'nw':
                newWidth = Math.max(50, startWidth - deltaX);
                newHeight = newWidth / aspectRatio;
                break;
        }

        currentEditingImage.style.width = `${newWidth}px`;
        currentEditingImage.style.height = `${newHeight}px`;

        updateResizeWrapper();
    }

    function stopResize(e) {
        isResizing = false;
        currentHandle = null;
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', stopResize);
    }

    function updateResizeWrapper() {
        if (!resizeWrapper || !currentEditingImage) return;

        const rect = currentEditingImage.getBoundingClientRect();
        resizeWrapper.style.left = `${rect.left + window.scrollX}px`;
        resizeWrapper.style.top = `${rect.top + window.scrollY}px`;
        resizeWrapper.style.width = `${rect.width}px`;
        resizeWrapper.style.height = `${rect.height}px`;
    }

    function createImageMenu() {
        if (imageMenu) return imageMenu;

        imageMenu = document.createElement('div');
        imageMenu.className = 'image-edit-menu hidden';
        imageMenu.innerHTML = `
            <div class="image-menu-section">
                <span class="menu-label">Alinhamento</span>
                <div class="menu-options">
                    <button data-align="left" title="Esquerda">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="12" x2="15" y2="12"></line>
                            <line x1="3" y1="18" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <button data-align="center" title="Centro">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="6" y1="12" x2="18" y2="12"></line>
                            <line x1="4" y1="18" x2="20" y2="18"></line>
                        </svg>
                    </button>
                    <button data-align="right" title="Direita">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="9" y1="12" x2="21" y2="12"></line>
                            <line x1="6" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <button class="delete-image-btn" data-action="delete" title="Remover imagem">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Remover
            </button>
        `;

        document.body.appendChild(imageMenu);

        // Align buttons
        imageMenu.querySelectorAll('[data-align]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!currentEditingImage) return;
                const align = btn.dataset.align;
                currentEditingImage.classList.remove('img-left', 'img-center', 'img-right');
                currentEditingImage.classList.add(`img-${align}`);
                updateActiveButtons();
            });
        });

        // Delete button
        imageMenu.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
            e.stopPropagation();
            if (!currentEditingImage) return;
            currentEditingImage.remove();
            hideImageMenu();
        });

        return imageMenu;
    }

    function updateActiveButtons() {
        if (!currentEditingImage || !imageMenu) return;

        // Update align buttons
        imageMenu.querySelectorAll('[data-align]').forEach(btn => {
            const align = btn.dataset.align;
            btn.classList.toggle('active', currentEditingImage.classList.contains(`img-${align}`));
        });
    }

    function showImageMenu(img, event) {
        createImageMenu();
        createResizeWrapper();
        currentEditingImage = img;

        // Show resize wrapper
        resizeWrapper.classList.remove('hidden');
        updateResizeWrapper();

        // Position menu
        const rect = img.getBoundingClientRect();
        const menuWidth = 180;
        const menuHeight = 100;

        let left = rect.left + (rect.width / 2) - (menuWidth / 2);
        let top = rect.top - menuHeight - 15;

        // Keep menu in viewport
        if (left < 10) left = 10;
        if (left + menuWidth > window.innerWidth - 10) left = window.innerWidth - menuWidth - 10;
        if (top < 10) top = rect.bottom + 15;

        imageMenu.style.left = `${left}px`;
        imageMenu.style.top = `${top}px`;
        imageMenu.classList.remove('hidden');

        updateActiveButtons();
    }

    function hideImageMenu() {
        if (imageMenu) {
            imageMenu.classList.add('hidden');
        }
        if (resizeWrapper) {
            resizeWrapper.classList.add('hidden');
        }
        currentEditingImage = null;
    }

    // Listen for clicks on images in editor
    quill.root.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
            e.stopPropagation();
            showImageMenu(e.target, e);
        } else {
            hideImageMenu();
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (imageMenu && !imageMenu.contains(e.target) && e.target.tagName !== 'IMG' &&
            (!resizeWrapper || !resizeWrapper.contains(e.target))) {
            hideImageMenu();
        }
    });

    // Update wrapper position on scroll/resize
    window.addEventListener('scroll', () => {
        if (currentEditingImage && resizeWrapper && !resizeWrapper.classList.contains('hidden')) {
            updateResizeWrapper();
        }
    });

    modalOverlay.addEventListener('scroll', () => {
        if (currentEditingImage && resizeWrapper && !resizeWrapper.classList.contains('hidden')) {
            updateResizeWrapper();
        }
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

    // Import Logic
    if (importBtn) {
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                const content = ev.target.result;
                const title = file.name.replace(/\.[^/.]+$/, ""); // remove extension

                // Create Task
                const newTask = {
                    id: Date.now(),
                    title: title,
                    desc: content,
                    richDesc: true, // Assume content is suitable or will be handled
                    folderId: activeFolderId !== 'all' ? activeFolderId : null,
                    priority: 'low',
                    ticket: '',
                    completed: false,
                    createdAt: new Date().toISOString()
                };

                // Handling HTML vs Text
                if (file.name.endsWith('.html')) {
                    newTask.desc = content;
                } else {
                    // Plain text to HTML paragraphs
                    newTask.desc = content.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>').join('');
                }

                tasks.unshift(newTask);
                saveTasks();
                renderTasks();
                alert('Nota importada com sucesso!');
                importInput.value = '';
            };
            reader.readAsText(file);
        });
    }

    // Export Logic
    if (exportBtnTrigger) {
        exportBtnTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            exportMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!exportMenu.classList.contains('hidden') && !e.target.closest('.export-dropdown')) {
                exportMenu.classList.add('hidden');
            }
        });

        exportOpts.forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.format;
                exportTask(format);
                exportMenu.classList.add('hidden');
            });
        });
    }

    function exportTask(format) {
        const title = modalTitleInput.value || 'tarefa';
        let content = '';
        let mime = 'text/plain';
        let ext = 'txt';

        if (format === 'html') {
            content = quill.root.innerHTML;
            mime = 'text/html';
            ext = 'html';
            content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1>${content}</body></html>`;
        } else {
            content = quill.getText();
            content = `Título: ${title}\n\n${content}`;
        }

        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    }

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
            modalPrioritySelect.value = 'low';
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
            const getWeight = (t) => {
                if (t.completed) return 1;
                if (t.priority === 'urgente') return 4;
                if (t.priority === 'normal') return 3;
                return 2; // low
            };
            const wA = getWeight(a);
            const wB = getWeight(b);
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
            else if (task.priority === 'low') statusClass = 'status-low';

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
                    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 3"></path><path d="M3 3h6"></path><path d="M3 3v6"></path></svg>'  // Undo
                    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'; // Check

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
