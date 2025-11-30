document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const itemsLeft = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const listsNav = document.getElementById('lists-nav');
    const addListBtn = document.getElementById('add-list-btn');
    const listTitle = document.getElementById('list-title');
    const currentDateEl = document.getElementById('current-date');
    const calendarMini = document.getElementById('calendar-mini');
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const themeBtn = document.getElementById('theme-btn');
    const themeModal = document.getElementById('theme-modal');
    const themeGrid = document.getElementById('theme-grid');
    const closeThemeModal = document.getElementById('close-theme-modal');
    const backgroundLayer = document.querySelector('.background-layer');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');
    const inputModal = document.getElementById('input-modal');
    const inputField = document.getElementById('input-field');
    const inputTitle = document.getElementById('input-title');
    const inputOkBtn = document.getElementById('input-ok-btn');
    const inputCancelBtn = document.getElementById('input-cancel-btn');

    // --- Custom Confirm Dialog ---
    function showConfirm(message) {
        return new Promise((resolve) => {
            confirmMessage.textContent = message;
            confirmModal.classList.remove('hidden');
            setTimeout(() => confirmModal.classList.add('visible'), 10);

            const handleYes = () => {
                cleanup();
                resolve(true);
            };

            const handleNo = () => {
                cleanup();
                resolve(false);
            };

            const cleanup = () => {
                confirmModal.classList.remove('visible');
                setTimeout(() => confirmModal.classList.add('hidden'), 300);
                confirmYesBtn.removeEventListener('click', handleYes);
                confirmNoBtn.removeEventListener('click', handleNo);
            };

            confirmYesBtn.addEventListener('click', handleYes);
            confirmNoBtn.addEventListener('click', handleNo);
        });
    }

    // --- Custom Input Dialog ---
    function showInput(title, placeholder = '') {
        return new Promise((resolve) => {
            inputTitle.textContent = title;
            inputField.value = '';
            inputField.placeholder = placeholder;
            inputModal.classList.remove('hidden');
            setTimeout(() => {
                inputModal.classList.add('visible');
                inputField.focus();
            }, 10);

            const handleOk = () => {
                const value = inputField.value.trim();
                cleanup();
                resolve(value || null);
            };

            const handleCancel = () => {
                cleanup();
                resolve(null);
            };

            const handleEnter = (e) => {
                if (e.key === 'Enter') handleOk();
            };

            const cleanup = () => {
                inputModal.classList.remove('visible');
                setTimeout(() => inputModal.classList.add('hidden'), 300);
                inputOkBtn.removeEventListener('click', handleOk);
                inputCancelBtn.removeEventListener('click', handleCancel);
                inputField.removeEventListener('keypress', handleEnter);
            };

            inputOkBtn.addEventListener('click', handleOk);
            inputCancelBtn.addEventListener('click', handleCancel);
            inputField.addEventListener('keypress', handleEnter);
        });
    }

    // --- State Management ---
    let state = {
        lists: [
            { id: 'default', name: 'My Tasks', icon: '📝', theme: 'default', color: '#ffe135', resetFrequency: 'none' }
        ],
        tasks: [], // { id, text, completed, listId, date, tags: [], order: 0 }
        tags: [
            { id: 'urgent', name: 'Urgent', color: '#ff4d4d' },
            { id: 'work', name: 'Work', color: '#00bfff' }
        ],
        currentListId: 'default',
        currentDate: new Date().toISOString().split('T')[0],
        viewDate: new Date().toISOString().split('T')[0],
        settings: {
            sortBy: 'custom' // 'custom', 'alpha', 'completed'
        }
    };

    // --- Initialization ---
    function init() {
        loadState();
        migrateOldData();
        checkRecurringLists();
        renderSidebar();
        renderCalendar();
        renderHeader();
        renderTodos();
        setupEventListeners();

        const currentList = state.lists.find(l => l.id === state.currentListId);
        if (currentList) {
            applyTheme(currentList.theme || 'default');
        }
    }

    function loadState() {
        const savedState = localStorage.getItem('nanobanana_state');
        if (savedState) {
            state = JSON.parse(savedState);
            state.currentDate = new Date().toISOString().split('T')[0];
            state.viewDate = state.currentDate;

            // Migrations
            state.lists.forEach(l => {
                if (!l.theme) l.theme = 'default';
                if (!l.color) l.color = '#ffe135';
                if (!l.resetFrequency) l.resetFrequency = 'none';
            });
            if (!state.tags) state.tags = [];
            if (!state.settings) state.settings = {}; // Ensure settings object exists
            if (!state.settings.sortBy) state.settings.sortBy = 'custom';

            // Ensure tasks have order and tags
            state.tasks.forEach((t, index) => {
                if (t.order === undefined) t.order = index;
                if (!t.tags) t.tags = [];
            });
        }
    }

    function saveState() {
        localStorage.setItem('nanobanana_state', JSON.stringify(state));
    }

    function checkRecurringLists() {
        const lastRun = localStorage.getItem('nanobanana_last_run');
        const today = new Date().toISOString().split('T')[0];

        if (lastRun !== today) {
            state.lists.forEach(list => {
                if (list.resetFrequency === 'daily') {
                    resetListTasks(list.id);
                }
                // Weekly logic could go here (check if Monday etc)
            });
            localStorage.setItem('nanobanana_last_run', today);
            saveState();
        }
    }

    function resetListTasks(listId) {
        state.tasks.forEach(t => {
            if (t.listId === listId) {
                t.completed = false;
            }
        });
    }

    function migrateOldData() {
        const oldTodos = JSON.parse(localStorage.getItem('nanobanana_todos'));
        if (oldTodos && oldTodos.length > 0) {
            // Check if we already migrated
            const alreadyMigrated = state.tasks.some(t => t.migrated);
            if (!alreadyMigrated) {
                const today = new Date().toISOString().split('T')[0];
                const migratedTasks = oldTodos.map((t, index) => ({
                    ...t,
                    listId: 'default',
                    date: today,
                    migrated: true,
                    tags: [],
                    order: index
                }));
                state.tasks = [...state.tasks, ...migratedTasks];
                localStorage.removeItem('nanobanana_todos'); // Clean up
                saveState();
            }
        }
    }

    // --- Rendering ---

    function renderHeader() {
        const currentList = state.lists.find(l => l.id === state.currentListId);
        const titleText = currentList ? currentList.name : 'My Tasks';

        listTitle.innerHTML = '';

        // Editable Title
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'header-title-input';
        titleInput.value = titleText;
        titleInput.spellcheck = false;

        // Auto-resize input
        titleInput.style.width = ((titleInput.value.length + 1) * 1.2) + 'ch';
        titleInput.addEventListener('input', () => {
            titleInput.style.width = ((titleInput.value.length + 1) * 1.2) + 'ch';
        });

        titleInput.addEventListener('blur', () => {
            if (currentList && titleInput.value.trim() !== '') {
                currentList.name = titleInput.value.trim();
                saveState();
                renderSidebar();
            } else {
                titleInput.value = titleText; // Revert if empty
            }
        });

        titleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') titleInput.blur();
        });

        listTitle.appendChild(titleInput);

        // Sort Button
        const sortBtn = document.createElement('button');
        sortBtn.className = 'btn-icon-small sort-btn';
        const labels = { 'custom': '⇅', 'alpha': 'AZ', 'completed': '✓' };
        sortBtn.innerHTML = labels[state.settings.sortBy];
        sortBtn.title = 'Sort Tasks';
        sortBtn.addEventListener('click', toggleSortMenu);
        listTitle.appendChild(sortBtn);

        const dateObj = new Date(state.currentDate);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = dateObj.toLocaleDateString('en-US', options);
    }

    function renderSidebar() {
        listsNav.innerHTML = '';
        state.lists.forEach(list => {
            const li = document.createElement('li');
            li.className = `list-item ${list.id === state.currentListId ? 'active' : ''}`;

            const dotColor = list.color || '#ffe135';

            li.innerHTML = `
                <div class="list-info">
                    <span class="list-dot" style="background-color: ${dotColor};"></span>
                    <span class="list-name">${list.name}</span>
                </div>
                ${list.id !== 'default' ? `
                <div class="list-actions">
                    <button class="btn-icon-small settings-list-btn" title="Settings">⚙️</button>
                    <button class="btn-icon-small delete-list-btn" title="Delete">×</button>
                </div>
                ` : `
                <div class="list-actions">
                    <button class="btn-icon-small settings-list-btn" title="Settings">⚙️</button>
                </div>
                `}
            `;

            li.addEventListener('click', (e) => {
                if (e.target.closest('.btn-icon-small')) return;
                state.currentListId = list.id;
                applyTheme(list.theme || 'default');
                saveState();
                renderSidebar();
                renderHeader();
                renderTodos();
                // Keep sidebar open when switching lists
            });

            // Settings action
            const settingsBtn = li.querySelector('.settings-list-btn');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openListSettings(list.id);
                });
            }

            // Delete action
            const deleteBtn = li.querySelector('.delete-list-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete list "${list.name}" and all its tasks?`)) {
                        state.lists = state.lists.filter(l => l.id !== list.id);
                        state.tasks = state.tasks.filter(t => t.listId !== list.id);
                        if (state.currentListId === list.id) {
                            state.currentListId = 'default';
                            applyTheme('default');
                        }
                        saveState();
                        renderSidebar();
                        renderHeader();
                        renderTodos();
                    }
                });
            }

            listsNav.appendChild(li);
        });
    }

    function renderCalendar() {
        // Simple monthly view for the current date's month
        const date = new Date(state.viewDate);
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0 = Sunday

        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        let html = `
            <div class="calendar-header">
                <button class="btn-icon-small" id="prev-month">‹</button>
                <span>${monthNames[month]} ${year}</span>
                <button class="btn-icon-small" id="next-month">›</button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-day-name">S</div>
                <div class="calendar-day-name">M</div>
                <div class="calendar-day-name">T</div>
                <div class="calendar-day-name">W</div>
                <div class="calendar-day-name">T</div>
                <div class="calendar-day-name">F</div>
                <div class="calendar-day-name">S</div>
        `;

        // Empty slots for days before the 1st
        for (let i = 0; i < startingDay; i++) {
            html += `<div></div>`;
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const isActive = dayString === state.currentDate;
            const hasTasks = state.tasks.some(t => t.date === dayString && !t.completed);

            html += `
                <div class="calendar-day ${isActive ? 'active' : ''} ${hasTasks ? 'has-tasks' : ''}" 
                     data-date="${dayString}">
                    ${i}
                </div>
            `;
        }

        html += `</div>`;
        calendarMini.innerHTML = html;

        // Navigation listeners
        calendarMini.querySelector('#prev-month').addEventListener('click', () => changeMonth(-1));
        calendarMini.querySelector('#next-month').addEventListener('click', () => changeMonth(1));

        // Add click listeners to days
        calendarMini.querySelectorAll('.calendar-day[data-date]').forEach(el => {
            el.addEventListener('click', () => {
                state.currentDate = el.dataset.date;
                saveState();
                renderCalendar(); // Re-render to update active state
                renderHeader();
                renderTodos();
            });
        });
    }

    function changeMonth(offset) {
        const date = new Date(state.viewDate);
        date.setMonth(date.getMonth() + offset);
        state.viewDate = date.toISOString().split('T')[0];
        renderCalendar();
    }

    function renderTodos() {
        todoList.innerHTML = '';
        let filteredTasks = state.tasks.filter(t =>
            t.listId === state.currentListId &&
            t.date === state.currentDate
        );

        // Sorting
        if (state.settings.sortBy === 'alpha') {
            filteredTasks.sort((a, b) => a.text.localeCompare(b.text));
        } else if (state.settings.sortBy === 'completed') {
            filteredTasks.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
        } else {
            // Custom order
            filteredTasks.sort((a, b) => a.order - b.order);
        }

        filteredTasks.forEach(todo => {
            todoList.appendChild(createTodoElement(todo));
        });

        updateCount(filteredTasks);
    }

    function createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.dataset.id = todo.id;
        li.draggable = true;

        // Tags HTML
        const tagsHtml = todo.tags.map(tagId => {
            const tag = state.tags.find(t => t.id === tagId);
            return tag ? `<span class="task-tag" style="background-color: ${tag.color};">${escapeHtml(tag.name)}</span>` : '';
        }).join('');

        li.innerHTML = `
            <div class="drag-handle">⋮⋮</div>
            <div class="checkbox"></div>
            <div class="todo-content">
                <input type="text" class="todo-input-edit" value="${escapeHtml(todo.text)}" spellcheck="false">
                <div class="todo-tags">${tagsHtml}</div>
            </div>
            <div class="todo-actions">
                <button class="btn-icon-small tag-btn" title="Add Tag">🏷️</button>
                <button class="delete-btn" aria-label="Delete task">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        `;

        // Inline Edit
        const input = li.querySelector('.todo-input-edit');
        input.addEventListener('blur', () => {
            if (input.value.trim() !== '') {
                todo.text = input.value.trim();
                saveState();
            } else {
                input.value = todo.text;
            }
        });
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') input.blur();
        });

        // Toggle completion
        const checkbox = li.querySelector('.checkbox');
        checkbox.addEventListener('click', () => {
            todo.completed = !todo.completed;
            saveState();
            renderTodos();
            renderCalendar();
        });

        // Delete task
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            state.tasks = state.tasks.filter(t => t.id !== todo.id);
            saveState();
            renderTodos();
            renderCalendar();
        });

        // Tag Button
        const tagBtn = li.querySelector('.tag-btn');
        tagBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openTagMenu(todo.id, e.clientX, e.clientY);
        });

        // Drag Events
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);

        return li;
    }

    function updateCount(currentTasks) {
        const activeCount = currentTasks.filter(t => !t.completed).length;
        itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
    }

    // --- Actions ---

    function addTodo() {
        const text = todoInput.value.trim();
        if (text) {
            const newTodo = {
                id: Date.now(),
                text: text,
                completed: false,
                listId: state.currentListId,
                date: state.currentDate,
                tags: [],
                order: state.tasks.length
            };
            state.tasks.push(newTodo);
            saveState();
            todoInput.value = '';
            todoInput.focus();
            renderTodos();
            renderCalendar();
        }
    }

    async function addNewList() {
        const listName = await showInput("Enter new list name:", "My New List");
        if (listName) {
            const newList = {
                id: 'list_' + Date.now(),
                name: listName,
                icon: '📋',
                theme: 'default',
                color: '#ffe135',
                resetFrequency: 'none'
            };
            state.lists.push(newList);
            state.currentListId = newList.id;
            applyTheme('default');
            saveState();
            renderSidebar();
            renderHeader();
            renderTodos();
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Drag and Drop Logic ---
    let draggedItem = null;

    function handleDragStart(e) {
        draggedItem = this;
        e.dataTransfer.effectAllowed = 'move';
        this.classList.add('dragging');
    }

    function handleDragOver(e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDrop(e) {
        if (e.stopPropagation) e.stopPropagation();
        if (draggedItem !== this) {
            // Reorder in DOM
            this.parentNode.insertBefore(draggedItem, this);

            // Reorder in State
            updateTaskOrder();
        }
        return false;
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        draggedItem = null;
    }

    function updateTaskOrder() {
        const items = Array.from(todoList.children);
        items.forEach((item, index) => {
            const id = parseInt(item.dataset.id);
            const task = state.tasks.find(t => t.id === id);
            if (task) task.order = index;
        });
        saveState();
    }

    // --- Settings & Menus ---

    function openListSettings(listId) {
        const list = state.lists.find(l => l.id === listId);
        if (!list) return;

        // Simple prompt-based settings for now (or modal if we had HTML for it)
        // Let's use a dynamic modal approach since we have a theme modal we can repurpose/copy
        // For this iteration, let's inject a simple settings modal

        let modal = document.getElementById('settings-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'settings-modal';
            modal.className = 'modal hidden';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>List Settings</h3>
                    <div class="setting-group">
                        <label for="list-color-picker">List Color</label>
                        <input type="color" id="list-color-picker">
                    </div>
                    <div class="setting-group">
                        <label for="list-reset-select">Reset Frequency</label>
                        <select id="list-reset-select">
                            <option value="none">None</option>
                            <option value="daily">Daily</option>
                        </select>
                    </div>
                    <button id="save-settings-btn" class="btn-primary">Save</button>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const colorPicker = modal.querySelector('#list-color-picker');
        const resetSelect = modal.querySelector('#list-reset-select');
        const saveBtn = modal.querySelector('#save-settings-btn');

        colorPicker.value = list.color || '#ffe135';
        resetSelect.value = list.resetFrequency || 'none';

        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('visible'), 10);

        saveBtn.onclick = () => {
            list.color = colorPicker.value;
            list.resetFrequency = resetSelect.value;
            saveState();
            renderSidebar();
            modal.classList.remove('visible');
            setTimeout(() => modal.classList.add('hidden'), 300);
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('visible');
                setTimeout(() => modal.classList.add('hidden'), 300);
            }
        };
    }

    function toggleSortMenu() {
        const currentSort = state.settings.sortBy;
        const nextSort = currentSort === 'custom' ? 'alpha' : (currentSort === 'alpha' ? 'completed' : 'custom');
        state.settings.sortBy = nextSort;

        const sortBtn = document.querySelector('.sort-btn');
        const labels = { 'custom': '⇅', 'alpha': 'AZ', 'completed': '✓' };
        sortBtn.innerHTML = labels[nextSort];

        saveState();
        renderTodos();
    }

    function openTagMenu(taskId, x, y) {
        // Remove existing menu
        const existing = document.querySelector('.tag-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.className = 'tag-menu';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;

        const task = state.tasks.find(t => t.id === taskId);

        state.tags.forEach(tag => {
            const item = document.createElement('div');
            item.className = 'tag-menu-item';

            const tagContent = document.createElement('div');
            tagContent.style.display = 'flex';
            tagContent.style.alignItems = 'center';
            tagContent.style.gap = '8px';
            tagContent.style.flex = '1';
            tagContent.innerHTML = `<span class="tag-dot" style="background-color: ${tag.color}"></span> ${escapeHtml(tag.name)}`;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon-small delete-tag-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = 'Delete tag';
            deleteBtn.style.opacity = '0';
            deleteBtn.style.transition = 'opacity 0.2s';

            item.appendChild(tagContent);
            item.appendChild(deleteBtn);

            if (task.tags.includes(tag.id)) item.classList.add('selected');

            // Show delete button on hover
            item.addEventListener('mouseenter', () => deleteBtn.style.opacity = '1');
            item.addEventListener('mouseleave', () => deleteBtn.style.opacity = '0');

            // Toggle tag on task
            tagContent.addEventListener('click', () => {
                if (task.tags.includes(tag.id)) {
                    task.tags = task.tags.filter(id => id !== tag.id);
                } else {
                    task.tags.push(tag.id);
                }
                saveState();
                renderTodos();
                menu.remove();
            });

            // Delete tag
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const confirmed = await showConfirm(`Are you sure you want to delete "${tag.name}"?`);
                if (confirmed) {
                    state.tags = state.tags.filter(t => t.id !== tag.id);
                    // Remove tag from all tasks
                    state.tasks.forEach(t => {
                        if (t.tags && t.tags.includes(tag.id)) {
                            t.tags = t.tags.filter(id => id !== tag.id);
                        }
                    });
                    saveState();
                    renderTodos();
                    menu.remove();
                }
            });

            menu.appendChild(item);
        });

        // Add new tag option
        const addTagItem = document.createElement('div');
        addTagItem.className = 'tag-menu-item add-tag';
        addTagItem.textContent = '+ New Tag';
        addTagItem.addEventListener('click', () => {
            openTagCreationModal(task);
            menu.remove();
        });
        menu.appendChild(addTagItem);

        document.body.appendChild(menu);

        // Close on click outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && !e.target.closest('.tag-menu-item')) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    // --- Tag Modal Logic ---
    const tagColors = ['#ff4d4d', '#ff9f43', '#ffe135', '#2ecc71', '#00bfff', '#a55eea', '#ff69b4', '#ffffff'];
    let currentTaskForTag = null;

    function openTagCreationModal(task) {
        currentTaskForTag = task;
        const modal = document.getElementById('tag-modal');
        const palette = document.getElementById('tag-color-palette');
        const nameInput = document.getElementById('new-tag-name');
        const saveBtn = document.getElementById('save-tag-btn');
        const cancelBtn = document.getElementById('cancel-tag-btn');

        let selectedColor = tagColors[0];
        nameInput.value = '';

        // Render Palette
        palette.innerHTML = '';
        tagColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            if (color === selectedColor) swatch.classList.add('selected');

            swatch.addEventListener('click', () => {
                palette.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                selectedColor = color;
            });
            palette.appendChild(swatch);
        });

        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('visible'), 10);

        // Handlers
        // Clone to remove old listeners
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newSaveBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (name) {
                const newTag = { id: 'tag_' + Date.now(), name, color: selectedColor };
                state.tags.push(newTag);
                currentTaskForTag.tags.push(newTag.id);
                saveState();
                renderTodos();
                closeTagModal();
            }
        });

        newCancelBtn.addEventListener('click', closeTagModal);
    }

    function closeTagModal() {
        const modal = document.getElementById('tag-modal');
        modal.classList.remove('visible');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }

    // --- Themes ---
    const themes = [
        { id: 'default', name: 'Banana', color: '#ffe135', bg: 'url("assets/background.png")' },
        { id: 'ocean', name: 'Ocean', color: '#00bfff', bg: 'linear-gradient(45deg, #2b5876, #4e4376)', animated: true },
        { id: 'forest', name: 'Forest', color: '#2ecc71', bg: 'linear-gradient(45deg, #134e5e, #71b280)', animated: true },
        { id: 'sunset', name: 'Sunset', color: '#ff7e5f', bg: 'linear-gradient(45deg, #ff7e5f, #feb47b)', animated: true },
        { id: 'night', name: 'Night', color: '#a8c0ff', bg: 'linear-gradient(45deg, #000428, #004e92)', animated: true },
        { id: 'aurora', name: 'Aurora', color: '#00ffcc', bg: 'linear-gradient(45deg, #00c6ff, #0072ff)', animated: true },
        { id: 'candy', name: 'Candy', color: '#ff69b4', bg: 'linear-gradient(45deg, #ff9a9e, #fecfef)', animated: true },
        // User Uploaded Images
        { id: 'nature', name: 'Nature', color: '#a8e6cf', bg: 'url("cena-lic-lp-nature-cropped.jpg")' },
        { id: 'galaxy', name: 'Galaxy', color: '#dcedc1', bg: 'url("m31-layered-uv-and-optical.jpg")' },
        { id: 'dust', name: 'Cosmic', color: '#ffd3b6', bg: 'url("pia18915-planck-polarizeddust-2.jpg")' },
        { id: 'nebula', name: 'Nebula', color: '#ffaaa5', bg: 'url("stsci-01g8jzq6gwxhex15pyy60wdrsk-2.png")' },
        { id: 'webb', name: 'Webb', color: '#ff8b94', bg: 'url("web-first-images-release.png")' }
    ];

    function renderThemeOptions() {
        const currentList = state.lists.find(l => l.id === state.currentListId);
        const currentThemeId = currentList ? currentList.theme : 'default';

        themeGrid.innerHTML = '';
        themes.forEach(theme => {
            const div = document.createElement('div');
            div.className = `theme-option ${currentThemeId === theme.id ? 'selected' : ''}`;

            if (theme.bg.includes('url')) {
                div.style.backgroundImage = theme.bg;
                div.style.backgroundSize = 'cover';
                div.style.backgroundPosition = 'center';
            } else {
                div.style.background = theme.bg;
            }

            div.addEventListener('click', () => {
                if (currentList) {
                    currentList.theme = theme.id;
                    applyTheme(theme.id);
                    saveState();
                    renderThemeOptions();
                }
            });
            themeGrid.appendChild(div);
        });
    }

    function applyTheme(themeId) {
        const theme = themes.find(t => t.id === themeId) || themes[0];
        document.documentElement.style.setProperty('--color-accent', theme.color);

        // Reset classes
        backgroundLayer.className = 'background-layer';
        if (theme.animated) {
            backgroundLayer.classList.add('animate-bg');
        }

        // Reset both background and backgroundImage
        backgroundLayer.style.background = '';
        backgroundLayer.style.backgroundImage = '';

        // Apply the appropriate background
        if (theme.bg.includes('url')) {
            backgroundLayer.style.backgroundImage = theme.bg;
        } else if (theme.bg.includes('gradient')) {
            backgroundLayer.style.backgroundImage = theme.bg;
        } else {
            backgroundLayer.style.background = theme.bg;
        }
    }

    // --- Sidebar Toggle Logic ---
    function initSidebarState() {
        sidebar.classList.add('collapsed');
    }

    function toggleSidebar() {
        sidebar.classList.toggle('collapsed');
    }

    // --- Event Listeners ---

    function setupEventListeners() {
        addBtn.onclick = addTodo;
        todoInput.onkeypress = (e) => { if (e.key === 'Enter') addTodo(); };

        clearCompletedBtn.onclick = () => {
            state.tasks = state.tasks.filter(t =>
                !(t.listId === state.currentListId && t.date === state.currentDate && t.completed)
            );
            saveState();
            renderTodos();
        };

        addListBtn.onclick = addNewList;

        menuBtn.onclick = toggleSidebar;

        if (typeof closeSidebarBtn !== 'undefined' && closeSidebarBtn) {
            closeSidebarBtn.onclick = toggleSidebar;
        }

        // Sidebar stays open when clicking outside - user must manually close it
        // This keeps sidebar persistent when switching lists/dates

        themeBtn.onclick = () => {
            renderThemeOptions();
            themeModal.classList.remove('hidden');
            setTimeout(() => themeModal.classList.add('visible'), 10);
        };

        closeThemeModal.onclick = () => {
            themeModal.classList.remove('visible');
            setTimeout(() => themeModal.classList.add('hidden'), 300);
        };
    }

    // Start app
    init();
    initSidebarState();
});
