document.addEventListener('DOMContentLoaded', () => {
    const supabase = window.supabase;
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
    const orgSelect = document.getElementById('orgSelect');
    const joinOrgBtn = document.getElementById('joinOrgBtn');
    const settingsBtn = document.getElementById('settingsBtn'); // Admin Btn

    // Modal Elements
    const modalOverlay = document.getElementById('taskModalOverlay');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalTitleInput = document.getElementById('modalTitleInput');
    const modalFolderSelect = document.getElementById('modalFolderSelect');
    const modalPrioritySelect = document.getElementById('modalPrioritySelect');
    const modalDueDateInput = document.getElementById('modalDueDateInput');
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


    // --- Helper for Modal Animations ---
    function setModalState(modal, isOpen) {
        if (!modal) return;
        if (isOpen) {
            modal.classList.remove('hidden');
            // Force reflow
            void modal.offsetWidth;
            modal.classList.add('visible');
        } else {
            modal.classList.remove('visible');
            setTimeout(() => {
                if (!modal.classList.contains('visible')) {
                    modal.classList.add('hidden');
                }
            }, 400);
        }
    }

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

    // Confirm / Prompt Custom Modals
    const inputModal = document.getElementById('inputModal');
    const inputModalTitle = document.getElementById('inputModalTitle');
    const inputModalValue = document.getElementById('inputModalValue');
    const inputModalCancel = document.getElementById('inputModalCancel');
    const inputModalConfirm = document.getElementById('inputModalConfirm');

    const confirmModal = document.getElementById('confirmModal');
    const confirmModalTitle = document.getElementById('confirmModalTitle');
    const confirmModalMessage = document.getElementById('confirmModalMessage');
    const confirmModalCancel = document.getElementById('confirmModalCancel');
    const confirmModalConfirm = document.getElementById('confirmModalConfirm');

    function showCustomPrompt(title, defaultValue = '', placeholder = '') {
        return new Promise((resolve) => {
            inputModalTitle.textContent = title;
            inputModalValue.value = defaultValue;
            inputModalValue.placeholder = placeholder;
            setModalState(inputModal, true);
            inputModalValue.focus();

            const close = () => {
                setModalState(inputModal, false);
                // Cleanup to prevent multiple listeners accumulation if reused differently
                inputModalConfirm.onclick = null;
                inputModalCancel.onclick = null;
                inputModalValue.onkeydown = null;
            };

            inputModalConfirm.onclick = () => {
                const val = inputModalValue.value;
                close();
                resolve(val);
            };

            inputModalCancel.onclick = () => {
                close();
                resolve(null);
            };

            inputModalValue.onkeydown = (e) => {
                if (e.key === 'Enter') inputModalConfirm.click();
                if (e.key === 'Escape') inputModalCancel.click();
            };
        });
    }

    function showCustomConfirm(title, message) {
        return new Promise((resolve) => {
            confirmModalTitle.textContent = title;
            confirmModalMessage.textContent = message;
            setModalState(confirmModal, true);

            const close = () => {
                setModalState(confirmModal, false);
                confirmModalConfirm.onclick = null;
                confirmModalCancel.onclick = null;
            };

            confirmModalConfirm.onclick = () => {
                close();
                resolve(true);
            };

            confirmModalCancel.onclick = () => {
                close();
                resolve(false);
            };
        });
    }

    modalOverlay.addEventListener('scroll', () => {
        if (currentEditingImage && resizeWrapper && !resizeWrapper.classList.contains('hidden')) {
            updateResizeWrapper();
        }
    });

    // --- State ---
    // --- State ---
    let tasks = [];
    let folders = [];
    let activeFolderId = 'all';
    let activeStatusFilter = 'all';
    let currentTaskId = null; // null = creating new
    let user = null; // Supabase user
    let myOrgs = [];
    let currentOrg = null; // { id, name } or null (Personal)

    // --- DB Interface (Abstraction) ---
    const DB = {
        async init() {
            if (supabase) {
                const { data: { session } } = await supabase.auth.getSession();
                user = session?.user || null;

                // Auth State Listener
                supabase.auth.onAuthStateChange(async (event, session) => {
                    user = session?.user || null;
                    updateAuthUI();
                    if (event === 'SIGNED_IN') {
                        await this.loadAll();
                        renderTasks();
                        renderFolders();
                        closeAuthModal();
                    } else if (event === 'SIGNED_OUT') {
                        tasks = [];
                        folders = [];
                        renderTasks();
                        renderFolders();
                        openAuthModal();
                    }
                });

                // Initial UI Update
                updateAuthUI();
            } else {
                console.log('Supabase not configured. Using LocalStorage.');
            }

            if (!user && !supabase) {
                // Load from LocalStorage if no Supabase or not logged in yet (and skipped auth)
                document.querySelector('.org-switcher').style.display = 'none'; // Hide switcher offline
                this.loadFromLocal();
            } else if (user) {
                // Load Organizations and Profile
                await this.loadOrgs();
                await this.loadProfile();
                await this.loadAll();
            } else {
                // Supabase configured but not logged in -> Show Modal
                openAuthModal();
            }
        },

        async loadProfile() {
            if (!user) return;
            const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (!error && data) {
                // Populate modal fields (lazy way, better to have a state object but direct DOM is fine for this size)
                const pUsername = document.getElementById('profileUsername');
                const pFirst = document.getElementById('profileFirstName');
                const pLast = document.getElementById('profileLastName');
                const pNick = document.getElementById('profileNickname');
                const pBirth = document.getElementById('profileBirthDate');
                const pEmail = document.getElementById('profileEmailDisplay');

                if (pUsername) pUsername.value = data.username || '';
                if (pFirst) pFirst.value = data.first_name || '';
                if (pLast) pLast.value = data.last_name || '';
                if (pNick) pNick.value = data.nickname || '';
                if (pBirth) pBirth.value = data.birth_date || ''; // Ensure YYYY-MM-DD
                if (pEmail) pEmail.value = user.email;
            } else if (error && error.code === 'PGRST116') {
                // No profile found? Should be created by trigger, but we can upsert one just in case.
                await supabase.from('profiles').insert({ id: user.id });
            }
        },

        async saveProfile(profileData) {
            if (!user) return;
            const { error } = await supabase.from('profiles').update(profileData).eq('id', user.id);
            if (error) {
                if (error.code === '23505') alert('Nome de usuário já está em uso.'); // Unique violation
                else alert('Erro ao salvar perfil: ' + error.message);
                return false;
            }
            return true;
        },

        async loadOrgs() {
            if (!user) return;
            // Fetch organizations the user is a member of
            const { data, error } = await supabase
                .from('organization_members')
                .select(`
                    organization_id,
                    organizations ( id, name, code )
                `);

            if (error || !data) {
                console.warn('Orgs fetch error (Tables might not exist yet):', error);
                myOrgs = [];
            } else {
                myOrgs = data.map(row => row.organizations).filter(o => o); // flattening
            }

            // Default to first org or maintain selection
            if (myOrgs.length > 0) {
                if (!currentOrg || !myOrgs.find(o => o.id === currentOrg.id)) {
                    currentOrg = myOrgs[0];
                }
            } else {
                currentOrg = null; // Personal Mode
            }
            renderOrgSwitcher();
        },

        async loadAll() {
            if (user) {
                // Load Folders (Filtered by Org)
                let fQuery = supabase.from('folders').select('*').order('created_at');
                if (currentOrg) fQuery = fQuery.eq('organization_id', currentOrg.id);
                else fQuery = fQuery.is('organization_id', null);

                const { data: fData, error: fError } = await fQuery;
                if (!fError) folders = fData || [];

                // Load Tasks (Filtered by Org)
                let tQuery = supabase.from('tasks').select('*').order('created_at', { ascending: false });
                if (currentOrg) tQuery = tQuery.eq('organization_id', currentOrg.id);
                else tQuery = tQuery.is('organization_id', null);

                const { data: tData, error: tError } = await tQuery;
                if (!tError) {
                    // Map DB columns to our object structure if needed, or stick to DB structure.
                    // Let's adapt DB snake_case to our camelCase logic or refactor app to use snake_case.
                    // For minimal refactor, let's map:
                    tasks = (tData || []).map(t => ({
                        ...t,
                        desc: t.description,
                        folderId: t.folder_id,
                        richDesc: true, // always true for now
                        dueDate: t.due_date,
                        createdAt: t.created_at,
                        deletedAt: t.deleted_at
                    }));
                }
            } else {
                this.loadFromLocal();
            }
        },

        loadFromLocal() {
            tasks = JSON.parse(localStorage.getItem('onboardingTasks')) || [];
            folders = JSON.parse(localStorage.getItem('onboardingFolders')) || [
                { id: 'work', name: 'Trabalho' },
                { id: 'personal', name: 'Pessoal' }
            ];
        },

        async addTask(task) {
            if (user) {
                const dbTask = mapTaskToDB(task);
                if (currentOrg) dbTask.organization_id = currentOrg.id;

                const { data, error } = await supabase.from('tasks').insert(dbTask).select().single();
                if (data) return mapDBToTask(data);
                if (error) { alert('Erro ao salvar no banco: ' + error.message); return task; }
            } else {
                return task; // Local save is handled by full array save
            }
        },

        async updateTask(task) {
            if (user) {
                const dbTask = mapTaskToDB(task);
                // Keep existing org_id or use current? Usually tasks don't move orgs simply by edit.
                // We rely on RLS preventing move if not allowed.
                const { error } = await supabase.from('tasks').update(dbTask).eq('id', task.id);
                if (error) alert('Erro ao atualizar: ' + error.message);
            }
        },

        async deleteFolder(id) {
            if (user) {
                await supabase.from('folders').delete().eq('id', id);
            }
        },

        async addFolder(folder) {
            if (user) {
                const payload = {
                    id: folder.id,
                    user_id: user.id,
                    name: folder.name
                };
                if (currentOrg) payload.organization_id = currentOrg.id;

                const { error } = await supabase.from('folders').insert(payload);
                if (error) {
                    console.error('Erro ao criar pasta:', error);
                    alert('Erro ao criar pasta: ' + error.message);
                    // Revert local change if needed, but for now just alerting is enough to debug
                }
            }
        },

        async updateFolder(folder) {
            if (user) {
                const { error } = await supabase.from('folders').update({ name: folder.name }).eq('id', folder.id);
                if (error) {
                    console.error('Erro ao atualizar pasta:', error);
                    alert('Erro ao atualizar pasta: ' + error.message);
                }
            }
        },

        async createOrganization(name, code) {
            if (!user) return;
            // 1. Insert Org
            const { data: org, error } = await supabase.from('organizations').insert({
                name,
                code
            }).select().single();

            if (error) {
                alert('Erro ao criar: ' + error.message);
                return false;
            }

            // 2. Add creator as member (admin role could be future)
            await supabase.from('organization_members').insert({
                organization_id: org.id,
                user_id: user.id,
                role: 'admin'
            });

            return true;
        },

        async saveLocal() {
            if (!user) {
                localStorage.setItem('onboardingTasks', JSON.stringify(tasks));
                localStorage.setItem('onboardingFolders', JSON.stringify(folders));
            }
        }
    };

    // Helper Mappers
    function mapTaskToDB(t) {
        return {
            id: t.id,
            user_id: user.id,
            title: t.title,
            description: t.desc, // HTML (Base64 included) -> Renamed to avoid keyword
            folder_id: t.folderId || null, // FIX: Send NULL if empty string to satisfy Foreign Key
            priority: t.priority,
            status: t.completed ? 'completed' : 'pending',
            completed: t.completed,
            due_date: t.dueDate || null,
            ticket: t.ticket,
            created_at: t.createdAt,
            deleted_at: t.deletedAt || null
        };
    }

    function mapDBToTask(dbT) {
        return {
            ...dbT,
            desc: dbT.description, // Map back to internal 'desc'
            folderId: dbT.folder_id,
            richDesc: true,
            dueDate: dbT.due_date,
            createdAt: dbT.created_at,
            deletedAt: dbT.deleted_at
        };
    }

    // --- Auth Logic ---
    const authModal = document.getElementById('authModal');
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');
    const btnSignIn = document.getElementById('btnSignIn');
    const btnSignUp = document.getElementById('btnSignUp');
    const btnSkipAuth = document.getElementById('btnSkipAuth');
    const btnForgotPassword = document.getElementById('btnForgotPassword');
    const authError = document.getElementById('authError');
    const logoutBtn = document.getElementById('logoutBtn');
    // Variables for Settings (formerly Admin)
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');

    // Admin Section
    const adminSection = document.getElementById('adminSection');
    const adminOrgName = document.getElementById('adminOrgName');
    const adminOrgCode = document.getElementById('adminOrgCode');
    const adminCreateOrgBtn = document.getElementById('adminCreateOrgBtn');

    // Profile Section
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const triggerResetPasswordBtn = document.getElementById('triggerResetPasswordBtn');

    function openAuthModal() {
        if (authModal) setModalState(authModal, true);
    }

    function closeAuthModal() {
        if (authModal) setModalState(authModal, false);
    }

    function updateAuthUI() {
        if (user) {
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            if (settingsBtn) settingsBtn.classList.remove('hidden'); // Always show for logged users
        } else {
            if (logoutBtn) logoutBtn.classList.add('hidden');
            if (settingsBtn) settingsBtn.classList.add('hidden');
        }
    }

    if (btnSignIn) {
        btnSignIn.addEventListener('click', async () => {
            if (!supabase) return alert('Configure o supabase-config.js primeiro');
            let inputLogin = authEmail.value.trim();
            const password = authPassword.value;

            if (!inputLogin || !password) return alert('Preencha login e senha');

            authError.style.display = 'none';

            let emailToUse = inputLogin;

            // Check if input looks like email
            if (!inputLogin.includes('@')) {
                // Assume username -> Lookup Email
                const { data, error } = await supabase.rpc('get_email_by_username', { p_username: inputLogin });
                if (error || !data || data.length === 0) {
                    authError.textContent = 'Usuário não encontrado.';
                    authError.style.display = 'block';
                    return;
                }
                emailToUse = data[0].email; // Extract email from row
            }

            const { error } = await supabase.auth.signInWithPassword({ email: emailToUse, password });
            if (error) {
                authError.textContent = error.message;
                authError.style.display = 'block';
            }
        });
    }

    if (btnSignUp) {
        btnSignUp.addEventListener('click', async () => {
            if (!supabase) return alert('Configure o supabase-config.js primeiro');

            // 1. Ask for code
            const inputCode = await showCustomPrompt('Criar Conta', '', 'Código da organização (ex: admin-maura)');
            if (!inputCode) return; // Cancelled

            const email = authEmail.value;
            const password = authPassword.value;
            if (!email || !password) return alert('Preencha email e senha.');

            // 2. Validate Code against DB (or legacy hardcode for prototype safety)
            let orgIdToJoin = null;

            // Try fetch org by code
            const { data: orgs, error: orgError } = await supabase
                .from('organizations')
                .select('id, code')
                .eq('code', inputCode)
                .single();

            if (orgs) {
                orgIdToJoin = orgs.id;
            } else if (inputCode === 'admin-maura') {
                // Fallback for prompt requirement: "considere que o codigo admin-maura faz parte da organização maura"
                // If the table doesn't exist or is empty, we proceed to create user, BUT we warn/handle logic later.
                // For now, let's allow content.
            } else {
                return alert('Código de organização inválido.');
            }

            authError.style.display = 'none';

            // 3. Sign Up
            const { data: authData, error } = await supabase.auth.signUp({ email, password });

            if (error) {
                authError.textContent = error.message;
                authError.style.display = 'block';
            } else {
                // 4. If success and we have an org to join, insert into members
                // Note: Triggers are better for this, but client-side logic requested.
                if (authData.user && orgIdToJoin) {
                    await supabase.from('organization_members').insert({
                        organization_id: orgIdToJoin,
                        user_id: authData.user.id,
                        role: 'member'
                    });
                }
                alert('Verifique seu email para confirmar o cadastro!');
            }
        });
    }

    if (btnForgotPassword) {
        btnForgotPassword.addEventListener('click', async () => {
            if (!supabase) return alert('Configure o supabase-config.js primeiro');
            const email = authEmail.value;
            if (!email) {
                authError.textContent = 'Digite seu email para recuperar a senha.';
                authError.style.display = 'block';
                return;
            }
            authError.style.display = 'none';

            // Supabase Reset Password
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.href, // Redirect back to this app
            });

            if (error) {
                authError.textContent = error.message;
                authError.style.display = 'block';
            } else {
                alert('Email de recuperação enviado! Verifique sua caixa de entrada.');
            }
        });
    }

    if (btnSkipAuth) {
        btnSkipAuth.addEventListener('click', () => {
            closeAuthModal();
            DB.loadFromLocal();
            renderTasks();
            renderFolders();
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (supabase) await supabase.auth.signOut();
        });
    }

    // --- Init ---
    initTheme();
    // Async init
    DB.init().then(() => {
        renderFolders();
        renderTasks();
    });

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
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function toggleSidebar() {
        sidebar.classList.toggle('open');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
    }

    toggleSidebarBtn.addEventListener('click', toggleSidebar);

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
    }

    addFolderBtn.addEventListener('click', async () => {
        const name = await showCustomPrompt('Nova Pasta', '');
        if (name && name.trim()) {
            const newFolder = { id: 'f_' + Date.now(), name: name.trim() };
            folders.push(newFolder);
            await DB.addFolder(newFolder);
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

    if (orgSelect) {
        orgSelect.addEventListener('change', async (e) => {
            const newVal = e.target.value;
            if (newVal === 'personal') currentOrg = null;
            else currentOrg = myOrgs.find(o => o.id === newVal);

            // Reload data
            await DB.loadAll();
            renderFolders();
            renderTasks();
            pageTitle.textContent = currentOrg ? currentOrg.name : 'Pessoal';
        });
    }

    if (joinOrgBtn) {
        joinOrgBtn.addEventListener('click', async () => {
            if (!user) return alert('Faça login primeiro.');
            const code = await showCustomPrompt('Entrar em Organização', '', 'Código da organização');
            if (code) {
                const { data: org, error } = await supabase.from('organizations').select('id, name').eq('code', code).single();
                if (error || !org) return alert('Organização não encontrada para este código.');

                const { error: joinError } = await supabase.from('organization_members').insert({
                    organization_id: org.id,
                    user_id: user.id
                });

                if (joinError) alert('Erro ao entrar (talvez já participe?): ' + joinError.message);
                else {
                    alert(`Bem-vindo à ${org.name}!`);
                    await DB.loadOrgs(); // refresh list
                }
            }
        });
    }


    // Settings / Admin Actions
    if (settingsBtn) {
        settingsBtn.addEventListener('click', async () => {
            // 1. Show modal
            if (settingsModal) setModalState(settingsModal, true);

            // 2. Toggle Admin Section
            if (user && user.email === 'mauraluiza015@gmail.com') {
                adminSection.classList.remove('hidden');
            } else {
                adminSection.classList.add('hidden');
            }

            // 3. Refresh Profile Data
            await DB.loadProfile();
        });
    }

    if (closeSettingsModalBtn) {
        closeSettingsModalBtn.addEventListener('click', () => {
            if (settingsModal) setModalState(settingsModal, false);
        });
    }

    // Save Profile
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            const username = document.getElementById('profileUsername').value.trim();
            const first_name = document.getElementById('profileFirstName').value.trim();
            const last_name = document.getElementById('profileLastName').value.trim();
            const nickname = document.getElementById('profileNickname').value.trim();
            const birth_date = document.getElementById('profileBirthDate').value;

            if (username.length > 0 && username.length < 3) return alert('Nome de usuário muito curto.');

            const success = await DB.saveProfile({
                username: username || null,
                first_name,
                last_name,
                nickname,
                birth_date: birth_date || null
            });

            if (success) {
                alert('Perfil atualizado!');
                // Could update UI elsewhere if nickname is used in header
            }
        });
    }

    // Password Reset Trigger
    if (triggerResetPasswordBtn) {
        triggerResetPasswordBtn.addEventListener('click', async () => {
            if (!user || !user.email) return;
            const confirm = await showCustomConfirm('Redefinir Senha', `Enviar email de redefinição para ${user.email}?`);
            if (confirm) {
                const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                    redirectTo: window.location.href,
                });
                if (error) alert('Erro: ' + error.message);
                else alert('Email enviado! Verifique sua caixa de entrada.');
            }
        });
    }

    if (adminCreateOrgBtn) {
        adminCreateOrgBtn.addEventListener('click', async () => {
            const name = adminOrgName.value.trim();
            const code = adminOrgCode.value.trim();

            if (!name || !code) return alert('Preencha nome e código.');

            const success = await DB.createOrganization(name, code);
            if (success) {
                alert('Organização criada com sucesso!');
                adminOrgName.value = '';
                adminOrgCode.value = '';
                setModalState(adminModal, false);
                await DB.loadOrgs(); // refresh list
            }
        });
    }

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

    function saveFolders() { DB.saveLocal(); }
    function saveTasks() { DB.saveLocal(); }

    function cleanupTrash() {
        const now = Date.now();
        const limit = 30 * 24 * 60 * 60 * 1000;
        const initial = tasks.length;
        tasks = tasks.filter(t => !t.deletedAt || (now - new Date(t.deletedAt).getTime() <= limit));
        if (tasks.length !== initial) saveTasks();
    }

    function renderFolders() {
        // ... (no change to render logic itself yet, just re-use existing)
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
                quill.root.innerHTML = task.desc || '';
            } else {
                quill.setText(task.desc || '');
            }

            modalFolderSelect.value = task.folderId || '';
            modalPrioritySelect.value = task.priority || 'normal';
            modalDueDateInput.value = task.dueDate || '';
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
            modalDueDateInput.value = '';
            modalTicketInput.value = '';
            modalDateInfo.textContent = 'Nova tarefa';
            modalDeleteBtn.classList.add('hidden');
        }

        if (!taskId) modalTitleInput.focus();
        setModalState(modalOverlay, true);
    }

    function closeModal() {
        setModalState(modalOverlay, false);
        currentTaskId = null;
    }

    async function saveCurrentTask() {
        const title = modalTitleInput.value.trim();
        if (!title) { modalTitleInput.focus(); return; }

        const htmlContent = quill.root.innerHTML; // contains tags
        const folderId = modalFolderSelect.value;
        const priority = modalPrioritySelect.value;
        const dueDate = modalDueDateInput.value;
        const ticket = modalTicketInput.value.trim();

        if (currentTaskId) {
            // Update Array
            let updatedTaskRef = null;
            tasks = tasks.map(t => {
                if (t.id === currentTaskId) {
                    updatedTaskRef = { ...t, title, desc: htmlContent, richDesc: true, folderId, priority, dueDate, ticket, updatedAt: new Date().toISOString() };
                    return updatedTaskRef;
                }
                return t;
            });

            // Update DB
            if (updatedTaskRef) {
                await DB.updateTask(updatedTaskRef);
            }

        } else {
            // New Task
            const newTask = {
                id: Date.now(),
                title,
                desc: htmlContent,
                richDesc: true,
                folderId,
                priority,
                dueDate,
                ticket,
                completed: false,
                createdAt: new Date().toISOString()
            };
            tasks.unshift(newTask);

            // Add to DB
            // We might want to wait for ID from DB if we used generated IDs, but we use timestamps/client-IDs for simplicity now.
            // If using BigInt in DB, we need to be careful. JS Date.now() fits in BigInt.
            const savedTask = await DB.addTask(newTask);
            // If DB returns a new object (e.g. with server timestamp), we should update our local state.
            // But let's trust our optimistic UI for now or sync later.
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

        // Mobile: Close sidebar after selection
        if (window.innerWidth <= 900) {
            sidebar.classList.remove('open');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        }

        renderTasks();
    };

    window.editFolder = async (id) => {
        const f = folders.find(x => x.id === id);
        if (!f) return;
        const n = await showCustomPrompt('Renomear Pasta', f.name);
        if (n && n.trim()) {
            f.name = n.trim();
            await DB.updateFolder(f);
            saveFolders();
            renderFolders();
        }
    };

    window.deleteFolder = async (id) => {
        if (!await showCustomConfirm('Excluir Pasta', 'Tem certeza que deseja excluir esta pasta?')) return;
        await DB.deleteFolder(id); // Delete from DB first
        folders = folders.filter(x => x.id !== id);
        tasks = tasks.map(t => t.folderId === id ? { ...t, folderId: null } : t);

        saveFolders();
        if (activeFolderId === id) window.selectFolder('all');
        else renderFolders();
    };

    // Task Context Actions
    window.openTask = (id) => openModal(id);

    async function softDeleteTask(id) {
        if (await showCustomConfirm('Lixeira', 'Mover para a Lixeira?')) {
            const t = tasks.find(x => x.id === id);
            if (!t) return;
            t.deletedAt = new Date().toISOString();

            if (user) await DB.updateTask(t);

            saveTasks();
            renderTasks();
            closeModal();
        }
    }

    async function destroyTask(id) {
        if (await showCustomConfirm('Excluir', 'Excluir permanentemente? Esta ação não pode ser desfeita.')) {
            if (user && supabase) {
                // Delete from DB
                const { error } = await supabase.from('tasks').delete().eq('id', id);
                if (error && error.code !== 'PGRST116') { // PGRST116 is no rows, ignore
                    console.error(error);
                }
            }
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
            closeModal();
        }
    }

    window.restoreTask = async (id) => {
        const t = tasks.find(x => x.id === id);
        if (!t) return;
        t.deletedAt = null;

        if (user) await DB.updateTask(t);

        saveTasks();
        renderTasks();
    };

    window.toggleComplete = async (e, id) => {
        e.stopPropagation(); // prevent modal open
        const t = tasks.find(x => x.id === id);
        if (!t) return;
        t.completed = !t.completed;

        if (user) await DB.updateTask(t);

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

    function renderOrgSwitcher() {
        if (!orgSelect) return;
        orgSelect.innerHTML = '';

        // Option: Personal
        // const optPersonal = document.createElement('option');
        // optPersonal.value = 'personal';
        // optPersonal.textContent = 'Pessoal (Offline)';
        // if (!currentOrg) optPersonal.selected = true;
        // orgSelect.appendChild(optPersonal);

        if (myOrgs.length === 0) {
            const opt = document.createElement('option');
            opt.text = "Sem Organização";
            orgSelect.appendChild(opt);
            orgSelect.disabled = true;
            return;
        }
        orgSelect.disabled = false;

        myOrgs.forEach(org => {
            const opt = document.createElement('option');
            opt.value = org.id;
            opt.textContent = org.name;
            if (currentOrg && currentOrg.id === org.id) opt.selected = true;
            orgSelect.appendChild(opt);
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }
});
