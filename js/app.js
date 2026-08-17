document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const emptyState = document.getElementById('empty-state');
    const itemsLeft = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const listsNav = document.getElementById('lists-nav');
    const addListBtn = document.getElementById('add-list-btn');
    const addGroupBtn = document.getElementById('add-group-btn');
    const listTitle = document.getElementById('list-title');
    const currentDateEl = document.getElementById('current-date');
    const calendarMini = document.getElementById('calendar-mini');
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const appWrapper = document.querySelector('.app-wrapper');
    const prefsBtn = document.getElementById('prefs-btn');
    const prefsModal = document.getElementById('prefs-modal');
    const closePrefsModal = document.getElementById('close-prefs-modal');
    const openThemeBtn = document.getElementById('open-theme-btn');
    const enterEditBtn = document.getElementById('enter-edit-btn');
    const editDoneBtn = document.getElementById('edit-done-btn');
    const resizeHandles = document.getElementById('resize-handles');
    const windowWidthInput = document.getElementById('window-width');
    const windowHeightInput = document.getElementById('window-height');
    const windowWidthValue = document.getElementById('window-width-value');
    const windowHeightValue = document.getElementById('window-height-value');
    const windowResetBtn = document.getElementById('window-reset-btn');
    const taskScaleDown = document.getElementById('task-scale-down');
    const taskScaleUp = document.getElementById('task-scale-up');
    const taskScaleValue = document.getElementById('task-scale-value');
    const taskScaleReset = document.getElementById('task-scale-reset');
    const appContainer = document.querySelector('.app-container');
    const themeModal = document.getElementById('theme-modal');
    const themeGrid = document.getElementById('theme-grid');
    const bitsGrid = document.getElementById('bits-grid');
    const bitsControls = document.getElementById('bits-controls');
    const bitsControlsFields = document.getElementById('bits-controls-fields');
    const bitsResetBtn = document.getElementById('bits-reset-btn');
    const closeThemeModal = document.getElementById('close-theme-modal');
    const wallpaperControls = document.getElementById('wallpaper-controls');
    const wallpaperControlsFields = document.getElementById('wallpaper-controls-fields');
    const wallpaperNameGroup = document.getElementById('wallpaper-name-group');
    const wallpaperNameInput = document.getElementById('wallpaper-name');
    const wallpaperResetBtn = document.getElementById('wallpaper-reset-btn');
    const editBar = document.getElementById('edit-bar');
    const widgetLayer = document.getElementById('widget-layer');
    const widgetClockToggle = document.getElementById('widget-clock');
    const widgetDateToggle = document.getElementById('widget-date');
    const widgetPetToggle = document.getElementById('widget-pet');
    const petUploadGroup = document.getElementById('pet-upload-group');
    const petInput = document.getElementById('pet-input');
    const petRemoveBtn = document.getElementById('pet-remove-btn');
    const petStatus = document.getElementById('pet-status');
    const widgetResetBtn = document.getElementById('widget-reset-btn');
    const PET_MEDIA_KEY = 'widget_pet';
    const PET_ASSET_BASE = './assets/pets/';
    const STATE_KEY = 'nanobanana_state';
    let petRenderToken = 0;
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
    const settingsModal = document.getElementById('settings-modal');
    const listColorPicker = document.getElementById('prefs-list-color');
    const prefsListColorName = document.getElementById('prefs-list-color-name');
    const listResetSelect = document.getElementById('list-reset-select');
    const resetIntervalFields = document.getElementById('reset-interval-fields');
    const resetDateFields = document.getElementById('reset-date-fields');
    const resetRangeFields = document.getElementById('reset-range-fields');
    const resetIntervalCount = document.getElementById('reset-interval-count');
    const resetIntervalUnit = document.getElementById('reset-interval-unit');
    const resetDateInput = document.getElementById('reset-date');
    const resetStartInput = document.getElementById('reset-start');
    const resetEndInput = document.getElementById('reset-end');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    const wallpaperInput = document.getElementById('wallpaper-input');
    const wallpaperStatus = document.getElementById('wallpaper-status');
    const toastEl = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastUndoBtn = document.getElementById('toast-undo');

    const MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const SORT_LABELS = { custom: '⇅', alpha: 'AZ', completed: '✓' };
    const SORT_TITLES = {
        custom: 'Custom order — click to sort A–Z',
        alpha: 'A–Z — click to sort by status',
        completed: 'By status — click for custom order'
    };
    const DATE_FORMAT = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const TAG_COLORS = ['#ff4d4d', '#ff9f43', '#ffe135', '#2ecc71', '#00bfff', '#a55eea', '#ff69b4', '#ffffff'];
    const DEFAULT_THEME = 'rb-particles';
    const DEFAULT_ACCENT = '#b19eef';

    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function todayLocal() {
        return formatDate(new Date());
    }

    function parseLocalDate(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    function uid(prefix = '') {
        if (crypto.randomUUID) return prefix + crypto.randomUUID();
        return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function sameId(a, b) {
        return String(a) === String(b);
    }

    function isHomeList(id) {
        const value = String(id || '');
        return value === 'default' || value.startsWith('home_') || Boolean(window.OrbitSync?.isHomeListId?.(id));
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function currentList() {
        return state.lists.find((list) => sameId(list.id, state.currentListId));
    }

    function normalizeReset(list) {
        if (list?.reset?.type) return list.reset;
        if (list?.resetFrequency === 'daily') {
            return { type: 'interval', interval: 1, unit: 'days' };
        }
        return { type: 'none' };
    }

    function isRecurringList(list = currentList()) {
        const type = normalizeReset(list).type;
        return type === 'interval' || type === 'date' || type === 'range';
    }

    function visibleTasks() {
        return state.tasks.filter((task) => {
            if (!sameId(task.listId, state.currentListId)) return false;
            if (isRecurringList()) return true;
            return task.date === state.currentDate;
        });
    }

    function daysBetween(from, to) {
        const a = parseLocalDate(from);
        const b = parseLocalDate(to);
        return Math.round((b - a) / 86400000);
    }

    function shouldResetList(list, today) {
        const reset = normalizeReset(list);
        if (reset.type === 'none') return false;
        if (reset.lastRun === today) return false;

        if (reset.type === 'interval') {
            const step = Math.max(1, Number(reset.interval) || 1);
            const days = reset.unit === 'weeks' ? step * 7 : step;
            if (!reset.lastRun) return true;
            return daysBetween(reset.lastRun, today) >= days;
        }
        if (reset.type === 'date') {
            return Boolean(reset.date) && today === reset.date;
        }
        if (reset.type === 'range') {
            return Boolean(reset.startDate && reset.endDate)
                && today >= reset.startDate
                && today <= reset.endDate;
        }
        return false;
    }

    function resetLabel(list) {
        const reset = normalizeReset(list);
        if (reset.type === 'interval') {
            const n = Math.max(1, Number(reset.interval) || 1);
            if (reset.unit === 'weeks') return n === 1 ? 'Resets every week' : `Resets every ${n} weeks`;
            return n === 1 ? 'Resets every day' : `Resets every ${n} days`;
        }
        if (reset.type === 'date' && reset.date) {
            return `Resets on ${parseLocalDate(reset.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        if (reset.type === 'range' && reset.startDate && reset.endDate) {
            const start = parseLocalDate(reset.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const end = parseLocalDate(reset.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `Active ${start} – ${end}`;
        }
        return '';
    }

    function openModal(modal) {
        modal.classList.remove('hidden');
        requestAnimationFrame(() => modal.classList.add('visible'));
    }

    function closeModal(modal) {
        modal.classList.remove('visible');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }

    function isModalOpen(modal) {
        return modal.classList.contains('visible');
    }

    let dialogResolver = null;

    function finishDialog(value) {
        confirmYesBtn.textContent = 'Yes';
        confirmNoBtn.textContent = 'No';
        const resolve = dialogResolver;
        dialogResolver = null;
        resolve?.(value);
    }

    function showConfirm(message, labels) {
        return new Promise((resolve) => {
            finishDialog(false);
            dialogResolver = resolve;
            confirmMessage.textContent = message;
            confirmYesBtn.textContent = labels?.yes || 'Yes';
            confirmNoBtn.textContent = labels?.no || 'No';
            openModal(confirmModal);
            confirmNoBtn.focus();
        });
    }

    function showInput(title, placeholder = '', initial = '') {
        return new Promise((resolve) => {
            finishDialog(null);
            dialogResolver = resolve;
            inputTitle.textContent = title;
            inputField.value = initial;
            inputField.placeholder = placeholder;
            openModal(inputModal);
            setTimeout(() => inputField.focus(), 50);
        });
    }

    let undoAction = null;
    let undoTimer = null;

    function hideToast() {
        toastEl.hidden = true;
        toastUndoBtn.hidden = false;
        undoAction = null;
        clearTimeout(undoTimer);
    }

    function showNotice(message) {
        undoAction = null;
        toastMessage.textContent = message;
        toastUndoBtn.hidden = true;
        toastEl.hidden = false;
        clearTimeout(undoTimer);
        undoTimer = setTimeout(hideToast, 4000);
    }

    function showUndo(message, restore) {
        undoAction = restore;
        toastMessage.textContent = message;
        toastUndoBtn.hidden = false;
        toastEl.hidden = false;
        clearTimeout(undoTimer);
        undoTimer = setTimeout(hideToast, 5000);
    }

    let state = {
        lists: [
            { id: 'default', name: 'My Tasks', icon: '📝', theme: 'rb-particles', color: '#b19eef', resetFrequency: 'none' }
        ],
        tasks: [],
        tags: [
            { id: 'urgent', name: 'Urgent', color: '#ff4d4d' },
            { id: 'work', name: 'Work', color: '#00bfff' }
        ],
        currentListId: 'default',
        groups: [],
        currentDate: todayLocal(),
        viewDate: todayLocal(),
        settings: {
            sortBy: 'custom',
            sidebar: { side: 'left', mode: 'dock' },
            widgets: { clock: false, date: false, pet: false },
            petChoice: 'cat',
            pets: [],
            widgetPos: {},
            widgetViewport: true,
            window: { width: 68, height: 78 },
            taskScale: 1
        },
        customThemes: [],
        bitsParams: {},
        wallpaperAdjust: {}
    };

    function init() {
        loadState();
        migrateOldData();
        checkRecurringLists();
        renderSidebar();
        renderCalendar();
        renderHeader();
        renderTodos();
        setupEventListeners();

        const list = currentList();
        applyLayout();
        applyWindowSize();
        applyTaskScale();
        applyTheme(list?.theme || DEFAULT_THEME);
        renderWidgets();
        window.BitsFX?.initUI({ addBtn });
        bindCloud();
        if (state.settings.sidebar.mode === 'dock' && window.matchMedia('(min-width: 769px)').matches) {
            setSidebarOpen(true);
        }
        if (!window.matchMedia('(pointer: coarse)').matches) todoInput.focus();
    }

    function loadState() {
        const raw = localStorage.getItem('nanobanana_state');
        if (!raw) return;

        try {
            const saved = JSON.parse(raw);
            state = { ...state, ...saved };
            if (!Array.isArray(state.lists) || state.lists.length === 0) {
                state.lists = [
                    { id: 'default', name: 'My Tasks', icon: '📝', theme: 'rb-particles', color: '#b19eef', resetFrequency: 'none' }
                ];
            }
            if (!Array.isArray(state.tasks)) state.tasks = [];
            if (!Array.isArray(state.tags)) state.tags = [];
            if (!Array.isArray(state.groups)) state.groups = [];
            if (!state.settings) state.settings = {};
            if (!state.settings.sortBy) state.settings.sortBy = 'custom';
            if (!state.settings.sidebar) state.settings.sidebar = { side: 'left', mode: 'dock' };
            if (state.settings.sidebar.side !== 'right') state.settings.sidebar.side = 'left';
            if (state.settings.sidebar.mode !== 'overlay') state.settings.sidebar.mode = 'dock';
            if (!state.settings.widgets) state.settings.widgets = { clock: false, date: false, pet: false };
            state.settings.widgets.clock = Boolean(state.settings.widgets.clock);
            state.settings.widgets.date = Boolean(state.settings.widgets.date);
            state.settings.widgets.pet = Boolean(state.settings.widgets.pet);
            if (state.settings.petChoice) {
                state.settings.petChoice = window.OrbitPet
                    ? window.OrbitPet.normalize(state.settings.petChoice)
                    : String(state.settings.petChoice);
            }
            if (!Array.isArray(state.settings.pets)) state.settings.pets = [];
            migratePets();
            if (!state.settings.widgetPos || typeof state.settings.widgetPos !== 'object') state.settings.widgetPos = {};
            if (!state.settings.widgetViewport) {
                state.settings.widgetViewport = true;
                const migrated = {};
                Object.entries(state.settings.widgetPos).forEach(([name, pos]) => {
                    migrated[name] = {
                        scale: clamp(Number(pos?.scale) || 1, 0.7, 2.2)
                    };
                });
                state.settings.widgetPos = migrated;
            } else {
                Object.keys(state.settings.widgetPos).forEach((name) => {
                    const pos = state.settings.widgetPos[name];
                    if (!pos || typeof pos !== 'object') {
                        state.settings.widgetPos[name] = {};
                        return;
                    }
                    pos.scale = clamp(Number(pos.scale) || 1, 0.7, 2.2);
                    pos.custom = Boolean(pos.custom);
                });
            }
            if (!state.settings.window) state.settings.window = { width: 68, height: 78 };
            state.settings.window.width = clamp(Number(state.settings.window.width) || 68, 28, 96);
            state.settings.window.height = clamp(Number(state.settings.window.height) || 78, 40, 94);
            state.settings.taskScale = clamp(Number(state.settings.taskScale) || 1, 0.8, 1.5);
            if (!state.bitsParams || typeof state.bitsParams !== 'object') state.bitsParams = {};
            if (!state.wallpaperAdjust || typeof state.wallpaperAdjust !== 'object') state.wallpaperAdjust = {};
            if (!Array.isArray(state.customThemes)) state.customThemes = [];
            state.customThemes.forEach((theme) => {
                if (!theme.name) theme.name = 'Wallpaper';
            });
            if (!state.lists.some((list) => sameId(list.id, state.currentListId))) {
                state.currentListId = state.lists[0].id;
            }

            state.currentDate = todayLocal();
            state.viewDate = state.currentDate;

            if (!state.settings.usedParticlesDefault) {
                state.lists.forEach((list) => {
                    if (!list.theme || list.theme === 'default') list.theme = DEFAULT_THEME;
                });
                state.settings.usedParticlesDefault = true;
            }

            state.lists.forEach((list) => {
                if (!list.theme) list.theme = DEFAULT_THEME;
                if (!list.color) list.color = DEFAULT_ACCENT;
                if (!list.resetFrequency) list.resetFrequency = 'none';
                if (!list.groupId) list.groupId = '';
                if (list.role !== 'editor') list.role = 'owner';
                list.reset = normalizeReset(list);
            });
            state.tasks.forEach((task, index) => {
                if (task.order === undefined) task.order = index;
                if (!task.tags) task.tags = [];
            });
            saveState();
        } catch {
            console.warn('Saved data was unreadable; starting with a fresh list.');
        }
    }

    function saveState(options = {}) {
        try {
            localStorage.setItem('nanobanana_state', JSON.stringify(state));
        } catch (err) {
            console.warn('Could not save tasks.', err);
        }
        if (!options.skipSync) window.OrbitSync?.schedulePush();
    }

    function checkRecurringLists() {
        const today = todayLocal();
        let changed = false;

        state.lists.forEach((list) => {
            if (!shouldResetList(list, today)) return;
            resetListTasks(list.id);
            list.reset = { ...normalizeReset(list), lastRun: today };
            list.resetFrequency = list.reset.type === 'interval' && list.reset.interval === 1 && list.reset.unit === 'days'
                ? 'daily'
                : list.reset.type;
            changed = true;
        });

        if (changed) {
            localStorage.setItem('nanobanana_last_run', today);
            saveState();
        }
    }

    function resetListTasks(listId) {
        state.tasks.forEach((task) => {
            if (sameId(task.listId, listId)) task.completed = false;
        });
    }

    function migrateOldData() {
        const raw = localStorage.getItem('nanobanana_todos');
        if (!raw) return;

        try {
            const oldTodos = JSON.parse(raw);
            if (!oldTodos?.length) return;
            if (state.tasks.some((task) => task.migrated)) return;

            const today = todayLocal();
            const migratedTasks = oldTodos.map((task, index) => ({
                ...task,
                listId: 'default',
                date: today,
                migrated: true,
                tags: [],
                order: index
            }));
            state.tasks = [...state.tasks, ...migratedTasks];
            localStorage.removeItem('nanobanana_todos');
            saveState();
        } catch {
            localStorage.removeItem('nanobanana_todos');
        }
    }

    function renderHeader() {
        const list = currentList();
        const titleText = list ? list.name : 'My Tasks';

        listTitle.replaceChildren();

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'header-title-input gradient-text';
        titleInput.value = titleText;
        titleInput.spellcheck = false;
        titleInput.maxLength = 40;
        titleInput.setAttribute('aria-label', 'List name');
        titleInput.size = Math.max(titleInput.value.length, 4);

        titleInput.addEventListener('input', () => {
            titleInput.size = Math.max(titleInput.value.length, 4);
        });
        titleInput.addEventListener('blur', () => {
            if (list && titleInput.value.trim()) {
                list.name = titleInput.value.trim();
                saveState();
                renderSidebar();
            } else {
                titleInput.value = titleText;
                titleInput.size = Math.max(titleText.length, 4);
            }
        });
        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') titleInput.blur();
        });

        const sortBtn = document.createElement('button');
        sortBtn.type = 'button';
        sortBtn.className = 'btn-icon-small sort-btn';
        sortBtn.textContent = SORT_LABELS[state.settings.sortBy];
        sortBtn.title = SORT_TITLES[state.settings.sortBy];
        sortBtn.setAttribute('aria-label', SORT_TITLES[state.settings.sortBy]);
        sortBtn.addEventListener('click', toggleSort);

        listTitle.append(titleInput, sortBtn);

        currentDateEl.textContent = resetLabel(list) || parseLocalDate(state.currentDate).toLocaleDateString('en-US', DATE_FORMAT);
    }

    function renderListRow(list, inGroup) {
        const li = document.createElement('li');
        li.className = `list-item${sameId(list.id, state.currentListId) ? ' active' : ''}${inGroup ? ' in-group' : ''}`;
        const sharedMark = list.role === 'editor' ? ' <span class="list-shared">shared</span>' : '';
        li.innerHTML = `
            <div class="list-info">
                <span class="list-dot" style="background-color: ${escapeHtml(list.color || DEFAULT_ACCENT)};"></span>
                <span class="list-name">${escapeHtml(list.name)}${sharedMark}</span>
            </div>
            <div class="list-actions">
                <button type="button" class="btn-icon-small settings-list-btn" title="Settings" aria-label="List settings">⚙️</button>
                ${!isHomeList(list.id) ? `<button type="button" class="btn-icon-small delete-list-btn" title="${list.role === 'editor' ? 'Leave list' : 'Delete'}" aria-label="${list.role === 'editor' ? 'Leave list' : 'Delete list'}">×</button>` : ''}
            </div>
        `;

        li.addEventListener('click', (e) => {
            if (e.target.closest('.btn-icon-small')) return;
            state.currentListId = list.id;
            applyTheme(list.theme || DEFAULT_THEME);
            saveState();
            renderSidebar();
            renderHeader();
            renderTodos();
        });

        li.querySelector('.settings-list-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openListSettings(list.id);
        });

        const deleteBtn = li.querySelector('.delete-list-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const leaving = list.role === 'editor';
                const confirmed = await showConfirm(
                    leaving
                        ? `Leave shared list "${list.name}"?`
                        : `Delete list "${list.name}" and all its tasks?`
                );
                if (!confirmed) return;
                if (leaving) {
                    try { await window.OrbitSync?.leaveList(list.id); } catch { /* still remove locally */ }
                }
                state.lists = state.lists.filter((item) => !sameId(item.id, list.id));
                if (!leaving) state.tasks = state.tasks.filter((task) => !sameId(task.listId, list.id));
                if (sameId(state.currentListId, list.id)) {
                    state.currentListId = state.lists[0]?.id || 'default';
                    applyTheme(currentList()?.theme || DEFAULT_THEME);
                }
                saveState();
                renderSidebar();
                renderHeader();
                renderTodos();
                refreshCalendarMarkers();
            });
        }
        return li;
    }

    function renderSidebar() {
        listsNav.replaceChildren();
        const groups = [...(state.groups || [])].sort((a, b) => (a.sort || 0) - (b.sort || 0));
        const groupedIds = new Set(groups.map((group) => group.id));
        const ungrouped = state.lists.filter((list) => !list.groupId || !groupedIds.has(list.groupId));
        ungrouped.forEach((list) => listsNav.appendChild(renderListRow(list, false)));

        groups.forEach((group) => {
            const header = document.createElement('li');
            header.className = 'list-group-header';
            header.innerHTML = `
                <span>${escapeHtml(group.name)}</span>
                <button type="button" class="btn-icon-small delete-group-btn" title="Remove group" aria-label="Remove group">×</button>
            `;
            header.querySelector('.delete-group-btn').addEventListener('click', async (e) => {
                e.stopPropagation();
                const confirmed = await showConfirm(`Remove group "${group.name}"? Lists stay, they just move out.`);
                if (!confirmed) return;
                state.lists.forEach((list) => {
                    if (sameId(list.groupId, group.id)) list.groupId = '';
                });
                state.groups = state.groups.filter((item) => !sameId(item.id, group.id));
                saveState();
                renderSidebar();
            });
            listsNav.appendChild(header);
            state.lists
                .filter((list) => sameId(list.groupId, group.id))
                .forEach((list) => listsNav.appendChild(renderListRow(list, true)));
        });
    }

    function renderCalendar() {
        const date = parseLocalDate(state.viewDate);
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startingDay = new Date(year, month, 1).getDay();
        const today = todayLocal();

        let html = `
            <div class="calendar-header">
                <button type="button" class="btn-icon-small" id="prev-month" aria-label="Previous month">‹</button>
                <button type="button" class="calendar-month-btn" id="jump-today" title="Jump to today">${MONTH_NAMES[month]} ${year}</button>
                <button type="button" class="btn-icon-small" id="next-month" aria-label="Next month">›</button>
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

        for (let i = 0; i < startingDay; i++) html += '<div></div>';

        for (let day = 1; day <= daysInMonth; day++) {
            const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const classes = [
                'calendar-day',
                dayString === state.currentDate ? 'active' : '',
                dayString === today ? 'today' : '',
                hasIncompleteOn(dayString) ? 'has-tasks' : ''
            ].filter(Boolean).join(' ');

            html += `<button type="button" class="${classes}" data-date="${dayString}">${day}</button>`;
        }

        html += '</div>';
        calendarMini.innerHTML = html;

        calendarMini.querySelector('#prev-month').addEventListener('click', () => changeMonth(-1));
        calendarMini.querySelector('#next-month').addEventListener('click', () => changeMonth(1));
        calendarMini.querySelector('#jump-today').addEventListener('click', jumpToToday);
        calendarMini.querySelectorAll('.calendar-day[data-date]').forEach((el) => {
            el.addEventListener('click', () => selectDate(el.dataset.date));
        });
    }

    function hasIncompleteOn(dayString) {
        return state.tasks.some((task) => task.date === dayString && !task.completed);
    }

    function refreshCalendarMarkers() {
        if (!calendarMini.querySelector('.calendar-day')) {
            renderCalendar();
            return;
        }
        calendarMini.querySelectorAll('.calendar-day[data-date]').forEach((el) => {
            el.classList.toggle('has-tasks', hasIncompleteOn(el.dataset.date));
            el.classList.toggle('active', el.dataset.date === state.currentDate);
        });
    }

    function changeMonth(offset) {
        const [year, month] = state.viewDate.split('-').map(Number);
        state.viewDate = formatDate(new Date(year, month - 1 + offset, 1));
        renderCalendar();
    }

    function jumpToToday() {
        const today = todayLocal();
        state.currentDate = today;
        state.viewDate = today;
        saveState();
        renderCalendar();
        renderHeader();
        renderTodos();
    }

    function selectDate(dateStr) {
        state.currentDate = dateStr;
        saveState();
        refreshCalendarMarkers();
        renderHeader();
        renderTodos();
    }

    function sortedTasks(tasks) {
        const items = [...tasks];
        if (state.settings.sortBy === 'alpha') {
            items.sort((a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: 'base' }));
        } else if (state.settings.sortBy === 'completed') {
            items.sort((a, b) => Number(a.completed) - Number(b.completed));
        } else {
            items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }
        items.sort((a, b) => Number(Boolean(a.completed)) - Number(Boolean(b.completed)));
        return items;
    }

    function renderTodos() {
        const tasks = sortedTasks(visibleTasks());
        const fragment = document.createDocumentFragment();
        tasks.forEach((todo) => fragment.appendChild(createTodoElement(todo)));
        todoList.replaceChildren(fragment);

        emptyState.hidden = tasks.length > 0;
        todoList.hidden = tasks.length === 0;
        updateCount(tasks);
    }

    function createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item${todo.completed ? ' completed' : ''}`;
        li.dataset.id = String(todo.id);

        const tagsHtml = (todo.tags || []).map((tagId) => {
            const tag = state.tags.find((item) => sameId(item.id, tagId));
            return tag
                ? `<span class="task-tag" style="background-color: ${escapeHtml(tag.color)};">${escapeHtml(tag.name)}</span>`
                : '';
        }).join('');

        li.innerHTML = `
            <div class="reorder-controls">
                <button type="button" class="drag-handle" title="Drag to reorder" aria-label="Drag to reorder">⋮⋮</button>
            </div>
            <button type="button" class="checkbox" role="checkbox" aria-checked="${todo.completed}" aria-label="${todo.completed ? 'Mark as not done' : 'Mark as done'}"></button>
            <div class="todo-content">
                <input type="text" class="todo-input-edit" value="${escapeHtml(todo.text)}" spellcheck="false" maxlength="240" aria-label="Task text">
                <div class="todo-tags">${tagsHtml}</div>
            </div>
            <div class="todo-actions">
                <button type="button" class="btn-icon-small tag-btn" title="Add tag" aria-label="Add tag">🏷️</button>
                <button type="button" class="delete-btn" aria-label="Delete task">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        `;

        const input = li.querySelector('.todo-input-edit');
        input.addEventListener('blur', () => {
            if (input.value.trim()) {
                todo.text = input.value.trim();
                saveState();
            } else {
                input.value = todo.text;
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
        });

        li.querySelector('.checkbox').addEventListener('click', () => {
            toggleTaskCompleted(todo, li);
        });

        li.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(todo);
        });

        li.querySelector('.tag-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openTagMenu(todo.id, e.clientX, e.clientY);
        });

        bindPointerReorder(li);
        window.BitsFX?.enhanceTodo(li);
        return li;
    }

    function toggleTaskCompleted(todo, item) {
        todo.completed = !todo.completed;
        const checkbox = item.querySelector('.checkbox');
        checkbox.setAttribute('aria-checked', String(todo.completed));
        checkbox.setAttribute('aria-label', todo.completed ? 'Mark as not done' : 'Mark as done');
        item.classList.toggle('completed', todo.completed);

        const first = measureListTops();
        todoList.classList.add('is-sorting');
        if (todo.completed) {
            todoList.appendChild(item);
        } else {
            const firstDone = [...todoList.children].find((el) => el !== item && el.classList.contains('completed'));
            if (firstDone) todoList.insertBefore(item, firstDone);
            else todoList.appendChild(item);
        }
        playListFlip(first);
        updateTaskOrder();
        updateCount(visibleTasks());
        refreshCalendarMarkers();
        window.setTimeout(() => todoList.classList.remove('is-sorting'), 300);
    }

    function updateCount(currentTasks) {
        const activeCount = currentTasks.filter((task) => !task.completed).length;
        itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
        clearCompletedBtn.hidden = !currentTasks.some((task) => task.completed);
    }

    function addTodo() {
        const text = todoInput.value.trim();
        if (!text) return;

        state.tasks.push({
            id: uid('task_'),
            text,
            completed: false,
            listId: state.currentListId,
            date: state.currentDate,
            tags: [],
            order: state.tasks.length
        });
        saveState();
        todoInput.value = '';
        renderTodos();
        refreshCalendarMarkers();
        todoInput.focus();
    }

    function deleteTask(todo) {
        const index = state.tasks.findIndex((task) => sameId(task.id, todo.id));
        if (index === -1) return;
        const [removed] = state.tasks.splice(index, 1);
        saveState();
        renderTodos();
        refreshCalendarMarkers();
        showUndo('Task deleted', () => {
            state.tasks.splice(index, 0, removed);
            saveState();
            renderTodos();
            refreshCalendarMarkers();
        });
    }

    async function addNewList() {
        const listName = await showInput('Enter new list name:', 'My New List');
        if (!listName) return;

        const newList = {
            id: uid('list_'),
            name: listName,
            icon: '📋',
            theme: DEFAULT_THEME,
            color: DEFAULT_ACCENT,
            resetFrequency: 'none',
            reset: { type: 'none' },
            groupId: '',
            role: 'owner'
        };
        state.lists.push(newList);
        state.currentListId = newList.id;
        applyTheme(DEFAULT_THEME);
        saveState();
        renderSidebar();
        renderHeader();
        renderTodos();
    }

    async function addNewGroup() {
        const name = await showInput('New group name:', 'School');
        if (!name) return;
        if (!Array.isArray(state.groups)) state.groups = [];
        state.groups.push({
            id: uid('group_'),
            name,
            sort: state.groups.length,
            updatedAt: new Date().toISOString()
        });
        saveState();
        renderSidebar();
    }

    async function clearCompleted() {
        const tasks = visibleTasks().filter((task) => task.completed);
        if (!tasks.length) return;

        const confirmed = await showConfirm(`Clear ${tasks.length} completed task${tasks.length !== 1 ? 's' : ''}?`);
        if (!confirmed) return;

        const ids = new Set(tasks.map((task) => String(task.id)));
        state.tasks = state.tasks.filter((task) => !ids.has(String(task.id)));
        saveState();
        renderTodos();
        refreshCalendarMarkers();
    }

    function bindPointerReorder(item) {
        const handle = item.querySelector('.drag-handle');
        handle.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            startPointerDrag(item, handle, e);
        });
    }

    function canAnimateReorder() {
        return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function measureListTops(exclude) {
        const map = new Map();
        [...todoList.children].forEach((el) => {
            if (el === exclude) return;
            map.set(el, el.getBoundingClientRect().top);
        });
        return map;
    }

    function playListFlip(first, exclude) {
        if (!canAnimateReorder()) return;
        [...todoList.children].forEach((el) => {
            if (el === exclude) return;
            const last = el.getBoundingClientRect().top;
            const prev = first.get(el);
            if (prev == null) return;
            const invert = prev - last;
            if (Math.abs(invert) < 1) return;
            el.style.transition = 'none';
            el.style.transform = `translateY(${invert}px)`;
            el.getBoundingClientRect();
            el.style.transition = 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)';
            el.style.transform = '';
            const clear = (event) => {
                if (event && event.propertyName !== 'transform') return;
                el.style.transition = '';
                el.style.transform = '';
                el.removeEventListener('transitionend', clear);
            };
            el.addEventListener('transitionend', clear);
        });
    }

    function startPointerDrag(item, handle, event) {
        handle.setPointerCapture?.(event.pointerId);
        const rect = item.getBoundingClientRect();
        const offsetY = event.clientY - rect.top;
        const placeholder = document.createElement('li');
        placeholder.className = 'todo-placeholder';
        placeholder.style.height = `${rect.height}px`;
        placeholder.setAttribute('aria-hidden', 'true');

        item.after(placeholder);
        item.classList.add('dragging');
        todoList.classList.add('is-sorting');
        item.style.width = `${rect.width}px`;
        item.style.left = `${rect.left}px`;
        item.style.top = `${rect.top}px`;
        item.style.position = 'fixed';
        item.style.zIndex = '80';
        item.style.margin = '0';
        item.style.pointerEvents = 'none';

        let lastY = event.clientY;
        let dragging = true;
        let scrollRaf = 0;
        let settled = false;

        const movePlaceholder = (clientY) => {
            const nodes = [...todoList.children].filter((el) => el !== item && el !== placeholder);
            const before = nodes.find((el) => {
                const box = el.getBoundingClientRect();
                return clientY < box.top + box.height / 2;
            });
            if (before && placeholder.nextElementSibling === before) return;
            if (!before && todoList.lastElementChild === placeholder) return;
            const first = measureListTops(item);
            if (before) todoList.insertBefore(placeholder, before);
            else todoList.appendChild(placeholder);
            playListFlip(first, item);
        };

        const tickScroll = () => {
            if (!dragging) return;
            const box = todoList.getBoundingClientRect();
            const edge = 56;
            let delta = 0;
            if (lastY < box.top + edge) delta = -Math.max(3, (box.top + edge - lastY) * 0.18);
            else if (lastY > box.bottom - edge) delta = Math.max(3, (lastY - (box.bottom - edge)) * 0.18);
            if (delta) {
                todoList.scrollTop += delta;
                movePlaceholder(lastY);
            }
            scrollRaf = requestAnimationFrame(tickScroll);
        };

        const onMove = (ev) => {
            lastY = ev.clientY;
            item.style.top = `${ev.clientY - offsetY}px`;
            movePlaceholder(ev.clientY);
        };

        const finish = () => {
            if (settled) return;
            settled = true;
            dragging = false;
            cancelAnimationFrame(scrollRaf);
            handle.releasePointerCapture?.(event.pointerId);
            handle.removeEventListener('pointermove', onMove);
            handle.removeEventListener('pointerup', end);
            handle.removeEventListener('pointercancel', end);

            const dest = placeholder.getBoundingClientRect();
            const drop = () => {
                item.removeAttribute('style');
                placeholder.replaceWith(item);
                todoList.classList.remove('is-sorting');
                updateTaskOrder();
            };

            item.classList.remove('dragging');
            if (!canAnimateReorder()) {
                drop();
                return;
            }
            item.style.transition = 'top 0.2s cubic-bezier(0.22, 1, 0.36, 1), left 0.2s cubic-bezier(0.22, 1, 0.36, 1), transform 0.2s ease';
            item.style.transform = 'none';
            item.style.top = `${dest.top}px`;
            item.style.left = `${dest.left}px`;
            window.setTimeout(drop, 200);
        };

        const end = () => finish();

        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', end);
        handle.addEventListener('pointercancel', end);
        scrollRaf = requestAnimationFrame(tickScroll);
    }

    function updateTaskOrder() {
        Array.from(todoList.children).forEach((item, index) => {
            const task = state.tasks.find((t) => sameId(t.id, item.dataset.id));
            if (task) task.order = index;
        });
        state.settings.sortBy = 'custom';
        const sortBtn = document.querySelector('.sort-btn');
        if (sortBtn) {
            sortBtn.textContent = SORT_LABELS.custom;
            sortBtn.title = SORT_TITLES.custom;
        }
        saveState();
    }

    let settingsListId = null;

    function syncResetFields() {
        const type = listResetSelect.value;
        resetIntervalFields.hidden = type !== 'interval';
        resetDateFields.hidden = type !== 'date';
        resetRangeFields.hidden = type !== 'range';
    }

    function openListSettings(listId) {
        const list = state.lists.find((item) => sameId(item.id, listId));
        if (!list) return;
        settingsListId = listId;
        const reset = normalizeReset(list);
        listResetSelect.value = reset.type || 'none';
        resetIntervalCount.value = reset.interval || 1;
        resetIntervalUnit.value = reset.unit || 'days';
        resetDateInput.value = reset.date || '';
        resetStartInput.value = reset.startDate || '';
        resetEndInput.value = reset.endDate || '';
        const groupSelect = document.getElementById('list-group-select');
        if (groupSelect) {
            groupSelect.innerHTML = '<option value="">No group</option>';
            (state.groups || []).forEach((group) => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.name;
                if (sameId(group.id, list.groupId)) option.selected = true;
                groupSelect.appendChild(option);
            });
        }
        const shareGroup = document.getElementById('share-list-group');
        if (shareGroup) shareGroup.hidden = list.role === 'editor';
        const shareStatus = document.getElementById('share-list-status');
        if (shareStatus) {
            shareStatus.hidden = true;
            shareStatus.textContent = '';
        }
        syncResetFields();
        openModal(settingsModal);
    }

    function saveListSettings() {
        const list = state.lists.find((item) => sameId(item.id, settingsListId));
        if (list) {
            const type = listResetSelect.value;
            list.reset = { type, lastRun: normalizeReset(list).lastRun || null };
            if (type === 'interval') {
                list.reset.interval = Math.max(1, Number(resetIntervalCount.value) || 1);
                list.reset.unit = resetIntervalUnit.value;
            } else if (type === 'date') {
                list.reset.date = resetDateInput.value || todayLocal();
            } else if (type === 'range') {
                list.reset.startDate = resetStartInput.value || todayLocal();
                list.reset.endDate = resetEndInput.value || list.reset.startDate;
                if (list.reset.endDate < list.reset.startDate) {
                    [list.reset.startDate, list.reset.endDate] = [list.reset.endDate, list.reset.startDate];
                }
            }
            list.resetFrequency = type === 'interval' && list.reset.interval === 1 && list.reset.unit === 'days'
                ? 'daily'
                : type;
            const groupSelect = document.getElementById('list-group-select');
            if (groupSelect) list.groupId = groupSelect.value || '';
            list.updatedAt = new Date().toISOString();
            saveState();
            renderSidebar();
            renderHeader();
            renderTodos();
        }
        closeModal(settingsModal);
    }

    function toggleSort() {
        const currentSort = state.settings.sortBy;
        state.settings.sortBy = currentSort === 'custom' ? 'alpha' : currentSort === 'alpha' ? 'completed' : 'custom';
        saveState();
        renderHeader();
        renderTodos();
    }

    function closeTagMenu() {
        document.querySelector('.tag-menu')?.remove();
    }

    function placeMenu(menu, x, y) {
        const pad = 8;
        const width = 220;
        const left = Math.min(x, window.innerWidth - width - pad);
        menu.style.left = `${Math.max(pad, left)}px`;
        menu.style.top = `${y}px`;
        document.body.appendChild(menu);
        const rect = menu.getBoundingClientRect();
        if (rect.bottom > window.innerHeight - pad) {
            menu.style.top = `${Math.max(pad, y - rect.height)}px`;
        }
    }

    function openTagMenu(taskId, x, y) {
        closeTagMenu();

        const task = state.tasks.find((item) => sameId(item.id, taskId));
        if (!task) return;

        const menu = document.createElement('div');
        menu.className = 'tag-menu';
        menu.setAttribute('role', 'menu');

        state.tags.forEach((tag) => {
            const item = document.createElement('div');
            item.className = `tag-menu-item${task.tags.includes(tag.id) ? ' selected' : ''}`;
            item.innerHTML = `
                <div class="tag-menu-label">
                    <span class="tag-dot" style="background-color: ${escapeHtml(tag.color)}"></span>
                    ${escapeHtml(tag.name)}
                </div>
                <button type="button" class="btn-icon-small delete-tag-btn" title="Delete tag" aria-label="Delete tag">×</button>
            `;

            item.querySelector('.tag-menu-label').addEventListener('click', () => {
                if (task.tags.includes(tag.id)) {
                    task.tags = task.tags.filter((id) => id !== tag.id);
                } else {
                    task.tags.push(tag.id);
                }
                saveState();
                renderTodos();
                closeTagMenu();
            });

            item.querySelector('.delete-tag-btn').addEventListener('click', async (e) => {
                e.stopPropagation();
                const confirmed = await showConfirm(`Delete the "${tag.name}" tag?`);
                if (!confirmed) return;
                state.tags = state.tags.filter((itemTag) => itemTag.id !== tag.id);
                state.tasks.forEach((taskItem) => {
                    if (taskItem.tags?.includes(tag.id)) {
                        taskItem.tags = taskItem.tags.filter((id) => id !== tag.id);
                    }
                });
                saveState();
                renderTodos();
                closeTagMenu();
            });

            menu.appendChild(item);
        });

        const addTagItem = document.createElement('button');
        addTagItem.type = 'button';
        addTagItem.className = 'tag-menu-item add-tag';
        addTagItem.textContent = '+ New Tag';
        addTagItem.addEventListener('click', () => {
            closeTagMenu();
            openTagCreationModal(task);
        });
        menu.appendChild(addTagItem);

        placeMenu(menu, x, y);
    }

    let currentTaskForTag = null;
    let selectedTagColor = TAG_COLORS[0];

    function openTagCreationModal(task) {
        currentTaskForTag = task;
        selectedTagColor = TAG_COLORS[0];
        const palette = document.getElementById('tag-color-palette');
        const nameInput = document.getElementById('new-tag-name');
        nameInput.value = '';
        palette.replaceChildren();

        TAG_COLORS.forEach((color) => {
            const swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.className = `color-swatch${color === selectedTagColor ? ' selected' : ''}`;
            swatch.style.backgroundColor = color;
            swatch.setAttribute('aria-label', `Choose ${color}`);
            swatch.addEventListener('click', () => {
                selectedTagColor = color;
                palette.querySelectorAll('.color-swatch').forEach((el) => el.classList.remove('selected'));
                swatch.classList.add('selected');
            });
            palette.appendChild(swatch);
        });

        openModal(document.getElementById('tag-modal'));
        setTimeout(() => nameInput.focus(), 50);
    }

    function saveNewTag() {
        const name = document.getElementById('new-tag-name').value.trim();
        if (!name || !currentTaskForTag) return;
        const newTag = { id: uid('tag_'), name, color: selectedTagColor };
        state.tags.push(newTag);
        currentTaskForTag.tags.push(newTag.id);
        saveState();
        renderTodos();
        closeModal(document.getElementById('tag-modal'));
    }

    const themes = [
        { id: 'default', name: 'Banana', color: '#ffe135', bg: 'url("assets/background.png")' },
        { id: 'ocean', name: 'Ocean', color: '#00bfff', bg: 'linear-gradient(45deg, #2b5876, #4e4376)', animated: true },
        { id: 'forest', name: 'Forest', color: '#2ecc71', bg: 'linear-gradient(45deg, #134e5e, #71b280)', animated: true },
        { id: 'sunset', name: 'Sunset', color: '#ff7e5f', bg: 'linear-gradient(45deg, #ff7e5f, #feb47b)', animated: true },
        { id: 'night', name: 'Night', color: '#a8c0ff', bg: 'linear-gradient(45deg, #000428, #004e92)', animated: true },
        { id: 'aurora', name: 'Beam', color: '#00ffcc', bg: 'linear-gradient(45deg, #00c6ff, #0072ff)', animated: true },
        { id: 'candy', name: 'Candy', color: '#ff69b4', bg: 'linear-gradient(45deg, #ff9a9e, #fecfef)', animated: true },
        { id: 'grass', name: 'Grass', color: '#66bb6a', bg: 'linear-gradient(180deg, #81d4fa 0%, #c5e1a5 38%, #7cb342 68%, #33691e 100%)', animated: true },
        { id: 'sunny', name: 'Sunny', color: '#ffd54f', bg: 'linear-gradient(180deg, #29b6f6 0%, #81d4fa 28%, #fff59d 62%, #ffcc80 100%)', animated: true },
        { id: 'beach', name: 'Beach', color: '#26c6da', bg: 'linear-gradient(180deg, #81d4fa 0%, #4dd0e1 36%, #fff8e1 70%, #ffe0b2 100%)', animated: true },
        { id: 'sky', name: 'Sky', color: '#42a5f5', bg: 'linear-gradient(180deg, #1565c0 0%, #42a5f5 42%, #bbdefb 100%)', animated: true },
        { id: 'meadow', name: 'Meadow', color: '#9ccc65', bg: 'linear-gradient(180deg, #90caf9 0%, #c8e6c9 48%, #81c784 100%)', animated: true },
        { id: 'blossom', name: 'Blossom', color: '#f48fb1', bg: 'linear-gradient(180deg, #fce4ec 0%, #f8bbd0 38%, #ce93d8 100%)', animated: true },
        { id: 'peach', name: 'Peach', color: '#ffab91', bg: 'linear-gradient(180deg, #ffe0b2 0%, #ffccbc 48%, #f8bbd0 100%)', animated: true },
        { id: 'mint', name: 'Mint', color: '#80cbc4', bg: 'linear-gradient(180deg, #e0f7fa 0%, #b2dfdb 46%, #4db6ac 100%)', animated: true },
        { id: 'lagoon', name: 'Lagoon', color: '#26a69a', bg: 'linear-gradient(180deg, #b3e5fc 0%, #4dd0e1 40%, #00838f 100%)', animated: true },
        { id: 'nature', name: 'Nature', color: '#a8e6cf', bg: 'url("cena-lic-lp-nature-cropped.jpg")' },
        { id: 'galaxy', name: 'Galaxy', color: '#dcedc1', bg: 'url("m31-layered-uv-and-optical.jpg")' },
        { id: 'dust', name: 'Cosmic', color: '#ffd3b6', bg: 'url("pia18915-planck-polarizeddust-2.jpg")' },
        { id: 'nebula', name: 'Nebula', color: '#ffaaa5', bg: 'url("stsci-01g8jzq6gwxhex15pyy60wdrsk-2.jpg")' },
        { id: 'webb', name: 'Webb', color: '#ff8b94', bg: 'url("web-first-images-release.jpg")' }
    ];

    function makeThemeButton(theme, currentThemeId, list) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `theme-option${theme.custom ? ' custom-theme' : ''}${theme.effect ? ` bits-preview bits-${theme.effect}` : ''}${currentThemeId === theme.id ? ' selected' : ''}`;
        if (!theme.effect) {
            button.style.background = theme.bg && (theme.animated || !String(theme.bg).includes('url')) ? theme.bg : theme.color;
        }
        button.innerHTML = `<span class="theme-name">${escapeHtml(theme.name)}</span>`;
        button.setAttribute('aria-label', theme.name);
        button.addEventListener('click', () => {
            if (!list) return;
            list.theme = theme.id;
            applyTheme(theme.id);
            saveState();
            renderThemeOptions();
        });
        return button;
    }

    function renderThemeOptions() {
        const list = currentList();
        const currentThemeId = list ? list.theme : DEFAULT_THEME;
        themeGrid.replaceChildren();
        bitsGrid.replaceChildren();

        const classicThemes = [
            ...themes,
            ...state.customThemes.map((theme) => ({ ...theme, custom: true }))
        ];

        classicThemes.forEach((theme) => {
            const button = makeThemeButton(theme, currentThemeId, list);
            if (theme.custom) {
                wallpaperGet(theme.id).then((dataUrl) => {
                    if (dataUrl) {
                        button.style.backgroundImage = `url("${dataUrl}")`;
                        button.style.backgroundRepeat = 'no-repeat';
                        button.style.backgroundSize = 'cover';
                        button.style.backgroundPosition = 'center';
                    }
                }).catch(() => {});
                const rename = document.createElement('button');
                rename.type = 'button';
                rename.className = 'theme-rename';
                rename.setAttribute('aria-label', 'Rename wallpaper');
                rename.textContent = '✎';
                rename.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const next = await showInput('Rename wallpaper', 'Wallpaper name', theme.name || 'Wallpaper');
                    if (!next) return;
                    const stored = state.customThemes.find((item) => item.id === theme.id);
                    if (stored) stored.name = next.slice(0, 32);
                    saveState();
                    renderThemeOptions();
                });
                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'theme-delete';
                remove.setAttribute('aria-label', 'Remove wallpaper');
                remove.textContent = '×';
                remove.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteCustomTheme(theme.id);
                });
                button.appendChild(rename);
                button.appendChild(remove);
            }
            themeGrid.appendChild(button);
        });

        (window.BitsFX?.themes || []).forEach((theme) => {
            bitsGrid.appendChild(makeThemeButton(theme, currentThemeId, list));
        });
        renderBitsControls();
        renderWallpaperControls();
    }

    function renderBitsControls() {
        const list = currentList();
        const themeId = list?.theme;
        const isBits = window.BitsFX?.isBitsTheme(themeId);
        bitsControls.hidden = !isBits;
        bitsControlsFields.replaceChildren();
        if (!isBits) return;

        const schema = window.BitsFX.getSchema(themeId);
        const values = { ...window.BitsFX.getDefaults(themeId), ...(state.bitsParams[themeId] || {}) };

        schema.forEach((field) => {
            const row = document.createElement('div');
            row.className = 'bits-field';
            const label = document.createElement('label');
            const inputId = `bits-param-${field.key}`;
            label.setAttribute('for', inputId);
            label.textContent = field.label;
            const input = document.createElement('input');
            input.id = inputId;
            input.type = field.type;
            if (field.type === 'range') {
                input.min = String(field.min);
                input.max = String(field.max);
                input.step = String(field.step);
            }
            input.value = values[field.key];
            const applyValue = (raw) => {
                const value = field.type === 'range' ? Number(raw) : raw;
                state.bitsParams[themeId] = { ...(state.bitsParams[themeId] || {}), [field.key]: value };
                saveState();
                window.BitsFX.updateParams({ [field.key]: value });
            };
            input.addEventListener('input', () => applyValue(input.value));
            row.append(label, input);
            bitsControlsFields.appendChild(row);
        });
    }

    function resetBitsParams() {
        const list = currentList();
        if (!list || !window.BitsFX?.isBitsTheme(list.theme)) return;
        delete state.bitsParams[list.theme];
        saveState();
        applyTheme(list.theme);
        renderBitsControls();
    }

    const MEDIA_DB = 'nanobanana_media';
    const MEDIA_STORE = 'wallpapers';

    function openMediaDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(MEDIA_DB, 1);
            request.onupgradeneeded = () => request.result.createObjectStore(MEDIA_STORE);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function wallpaperPut(id, dataUrl) {
        const db = await openMediaDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(MEDIA_STORE, 'readwrite');
            tx.objectStore(MEDIA_STORE).put(dataUrl, id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async function wallpaperGet(id) {
        const db = await openMediaDb();
        return new Promise((resolve, reject) => {
            const request = db.transaction(MEDIA_STORE, 'readonly').objectStore(MEDIA_STORE).get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async function wallpaperDel(id) {
        const db = await openMediaDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(MEDIA_STORE, 'readwrite');
            tx.objectStore(MEDIA_STORE).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    function compressImage(file) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            const objectUrl = URL.createObjectURL(file);
            image.onload = () => {
                const max = 1920;
                let { width, height } = image;
                if (Math.max(width, height) > max) {
                    const scale = max / Math.max(width, height);
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(image, 0, 0, width, height);
                URL.revokeObjectURL(objectUrl);
                resolve(canvas.toDataURL('image/jpeg', 0.82));
            };
            image.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error('Could not read that image.'));
            };
            image.src = objectUrl;
        });
    }

    function setWallpaperStatus(message) {
        wallpaperStatus.hidden = !message;
        wallpaperStatus.textContent = message || '';
    }

    async function handleWallpaperUpload(file) {
        const list = currentList();
        if (!list || !file) return;
        if (!file.type.startsWith('image/')) {
            setWallpaperStatus('Please choose an image file.');
            return;
        }
        setWallpaperStatus('Optimizing wallpaper…');
        try {
            const suggested = file.name.replace(/\.[^.]+$/, '').slice(0, 32) || 'Wallpaper';
            const named = await showInput('Name this wallpaper', 'e.g. Night sky', suggested);
            const dataUrl = await compressImage(file);
            const id = uid('custom_');
            await wallpaperPut(id, dataUrl);
            const custom = {
                id,
                name: (named || suggested).slice(0, 32),
                color: list.color || DEFAULT_ACCENT
            };
            state.customThemes.push(custom);
            list.theme = id;
            saveState();
            await applyTheme(id);
            renderThemeOptions();
            setWallpaperStatus('Wallpaper added to this list.');
        } catch (err) {
            setWallpaperStatus(err.message || 'Could not save that wallpaper.');
        }
    }

    async function deleteCustomTheme(themeId) {
        state.customThemes = state.customThemes.filter((theme) => theme.id !== themeId);
        state.lists.forEach((list) => {
            if (list.theme === themeId) list.theme = DEFAULT_THEME;
        });
        delete state.wallpaperAdjust[themeId];
        try { await wallpaperDel(themeId); } catch { /* ignore */ }
        saveState();
        applyTheme(currentList()?.theme || DEFAULT_THEME);
        renderThemeOptions();
    }

    const WALLPAPER_DEFAULTS = {
        fit: 'cover',
        zoom: 100,
        posX: 50,
        posY: 50,
        brightness: 100,
        contrast: 100,
        saturate: 100,
        blur: 0
    };

    const WALLPAPER_FIELDS = [
        { key: 'zoom', label: 'Zoom', min: 100, max: 180, step: 1, suffix: '%' },
        { key: 'posX', label: 'Position X', min: 0, max: 100, step: 1, suffix: '%' },
        { key: 'posY', label: 'Position Y', min: 0, max: 100, step: 1, suffix: '%' },
        { key: 'brightness', label: 'Brightness', min: 40, max: 160, step: 1, suffix: '%' },
        { key: 'contrast', label: 'Contrast', min: 40, max: 160, step: 1, suffix: '%' },
        { key: 'saturate', label: 'Saturation', min: 0, max: 200, step: 1, suffix: '%' },
        { key: 'blur', label: 'Blur', min: 0, max: 16, step: 1, suffix: 'px' }
    ];

    function isPhotoTheme(themeId) {
        if (state.customThemes.some((theme) => theme.id === themeId)) return true;
        const theme = themes.find((item) => item.id === themeId);
        return Boolean(theme && String(theme.bg).includes('url('));
    }

    function getWallpaperAdjust(themeId) {
        return { ...WALLPAPER_DEFAULTS, ...(state.wallpaperAdjust?.[themeId] || {}) };
    }

    function resetBackgroundLayer() {
        const style = backgroundLayer.style;
        style.background = '';
        style.backgroundImage = '';
        style.backgroundColor = '';
        style.backgroundSize = '';
        style.backgroundPosition = '';
        style.backgroundRepeat = '';
        style.filter = '';
        style.transform = '';
        backgroundLayer.className = 'background-layer';
    }

    function applyWallpaperAdjust(themeId) {
        if (!isPhotoTheme(themeId)) {
            backgroundLayer.style.filter = '';
            backgroundLayer.style.transform = '';
            return;
        }
        const adj = getWallpaperAdjust(themeId);
        const size = adj.fit === 'contain' ? 'contain' : adj.fit === 'fill' ? '100% 100%' : 'cover';
        backgroundLayer.style.backgroundRepeat = 'no-repeat';
        backgroundLayer.style.backgroundSize = size;
        backgroundLayer.style.backgroundPosition = `${adj.posX}% ${adj.posY}%`;
        backgroundLayer.style.filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturate}%) blur(${adj.blur}px)`;
        const zoom = Math.max(100, Number(adj.zoom) || 100) / 100;
        backgroundLayer.style.transform = zoom === 1 ? '' : `scale(${zoom})`;
    }

    function setWallpaperAdjust(themeId, partial) {
        state.wallpaperAdjust[themeId] = { ...getWallpaperAdjust(themeId), ...partial };
        saveState();
        applyWallpaperAdjust(themeId);
    }

    function renderWallpaperControls() {
        const list = currentList();
        const themeId = list?.theme;
        const custom = state.customThemes.find((theme) => theme.id === themeId);
        const photo = isPhotoTheme(themeId);
        wallpaperControls.hidden = !photo;
        wallpaperNameGroup.hidden = !custom;
        wallpaperControlsFields.replaceChildren();
        if (!photo) return;

        const adj = getWallpaperAdjust(themeId);
        if (custom) wallpaperNameInput.value = custom.name || '';

        document.querySelectorAll('#wallpaper-fit-choices [data-fit]').forEach((btn) => {
            btn.classList.toggle('selected', btn.dataset.fit === adj.fit);
        });

        WALLPAPER_FIELDS.forEach((field) => {
            const row = document.createElement('div');
            row.className = 'bits-field';
            const label = document.createElement('label');
            const inputId = `wall-param-${field.key}`;
            label.setAttribute('for', inputId);
            label.textContent = `${field.label} ${adj[field.key]}${field.suffix}`;
            const input = document.createElement('input');
            input.id = inputId;
            input.type = 'range';
            input.min = String(field.min);
            input.max = String(field.max);
            input.step = String(field.step);
            input.value = String(adj[field.key]);
            input.addEventListener('input', () => {
                const value = Number(input.value);
                label.textContent = `${field.label} ${value}${field.suffix}`;
                setWallpaperAdjust(themeId, { [field.key]: value });
            });
            row.append(label, input);
            wallpaperControlsFields.appendChild(row);
        });
    }

    function applyListAccent(list = currentList()) {
        const accent = list?.color || DEFAULT_ACCENT;
        document.documentElement.style.setProperty('--color-accent', accent);
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#050816');
    }

    function applyTheme(themeId) {
        window.BitsFX?.stop();
        resetBackgroundLayer();
        applyListAccent();

        const custom = state.customThemes.find((theme) => theme.id === themeId);
        if (custom) {
            backgroundLayer.style.backgroundColor = custom.color || '#050816';
            backgroundLayer.style.backgroundRepeat = 'no-repeat';
            wallpaperGet(themeId).then((dataUrl) => {
                if (currentList()?.theme !== themeId) return;
                if (dataUrl) backgroundLayer.style.backgroundImage = `url("${dataUrl}")`;
                applyWallpaperAdjust(themeId);
            }).catch(() => {});
            applyWallpaperAdjust(themeId);
            renderBitsControls();
            renderWallpaperControls();
            return;
        }

        if (window.BitsFX?.isBitsTheme(themeId)) {
            const params = { ...window.BitsFX.getDefaults(themeId), ...(state.bitsParams[themeId] || {}) };
            backgroundLayer.style.backgroundColor = '#050816';
            window.BitsFX.start(themeId, backgroundLayer, params);
            renderBitsControls();
            renderWallpaperControls();
            return;
        }

        const theme = themes.find((item) => item.id === themeId) || themes[0];
        if (theme.animated) backgroundLayer.classList.add('animate-bg');
        if (String(theme.bg).includes('url(')) {
            backgroundLayer.style.backgroundImage = theme.bg;
            backgroundLayer.style.backgroundRepeat = 'no-repeat';
            applyWallpaperAdjust(themeId);
        } else {
            backgroundLayer.style.backgroundImage = theme.bg;
        }
        renderBitsControls();
        renderWallpaperControls();
    }

    function applyLayout() {
        const side = state.settings.sidebar?.side === 'right' ? 'right' : 'left';
        const mode = state.settings.sidebar?.mode === 'overlay' ? 'overlay' : 'dock';
        appWrapper.classList.toggle('sidebar-right', side === 'right');
        appWrapper.classList.toggle('sidebar-mode-dock', mode === 'dock');
        appWrapper.classList.toggle('sidebar-mode-overlay', mode === 'overlay');
    }

    const DEFAULT_WINDOW = { width: 68, height: 78 };
    const WINDOW_LIMITS = { minW: 28, maxW: 96, minH: 40, maxH: 94 };
    const TASK_SCALE = { min: 0.8, max: 1.5, step: 0.1, def: 1 };
    const phoneLayoutMql = window.matchMedia('(max-width: 768px)');
    let editMode = false;

    function isPhoneLayout() {
        return phoneLayoutMql.matches;
    }

    function applyWindowSize() {
        const width = clamp(Number(state.settings.window?.width) || DEFAULT_WINDOW.width, WINDOW_LIMITS.minW, WINDOW_LIMITS.maxW);
        const height = clamp(Number(state.settings.window?.height) || DEFAULT_WINDOW.height, WINDOW_LIMITS.minH, WINDOW_LIMITS.maxH);
        state.settings.window = {
            width: Math.round(width * 10) / 10,
            height: Math.round(height * 10) / 10
        };
        appWrapper.style.setProperty('--app-width', String(state.settings.window.width));
        appWrapper.style.setProperty('--app-height', String(state.settings.window.height));
        windowWidthInput.value = String(Math.round(state.settings.window.width));
        windowHeightInput.value = String(Math.round(state.settings.window.height));
        windowWidthValue.textContent = `${Math.round(state.settings.window.width)}%`;
        windowHeightValue.textContent = `${Math.round(state.settings.window.height)}%`;
        scheduleWidgetLayout();
    }

    function setWindowSize(width, height, persist = true) {
        state.settings.window = {
            width: clamp(width, WINDOW_LIMITS.minW, WINDOW_LIMITS.maxW),
            height: clamp(height, WINDOW_LIMITS.minH, WINDOW_LIMITS.maxH)
        };
        applyWindowSize();
        if (persist) saveState();
    }

    function applyTaskScale(live = false) {
        let scale = clamp(Number(state.settings.taskScale) || TASK_SCALE.def, TASK_SCALE.min, TASK_SCALE.max);
        if (!live) {
            scale = Math.round(scale * 10) / 10;
            state.settings.taskScale = scale;
        }
        document.documentElement.style.setProperty('--task-scale', String(scale));
        if (taskScaleValue) {
            taskScaleValue.textContent = `${Math.round(scale * 100)}%`;
        }
        if (taskScaleDown) taskScaleDown.disabled = scale <= TASK_SCALE.min + 0.001;
        if (taskScaleUp) taskScaleUp.disabled = scale >= TASK_SCALE.max - 0.001;
    }

    function setTaskScale(scale, persist = true) {
        state.settings.taskScale = clamp(Number(scale) || TASK_SCALE.def, TASK_SCALE.min, TASK_SCALE.max);
        applyTaskScale(!persist);
        if (persist) saveState();
    }

    function bumpTaskScale(dir) {
        setTaskScale((Number(state.settings.taskScale) || TASK_SCALE.def) + dir * TASK_SCALE.step);
    }

    function bindTaskScale() {
        taskScaleDown?.addEventListener('click', () => bumpTaskScale(-1));
        taskScaleUp?.addEventListener('click', () => bumpTaskScale(1));
        taskScaleReset?.addEventListener('click', () => setTaskScale(TASK_SCALE.def));

        let pinch = null;
        const pinchDist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const pinchTarget = appContainer || todoList;

        pinchTarget.addEventListener('touchstart', (e) => {
            if (!isPhoneLayout() || e.touches.length !== 2) return;
            pinch = {
                startDist: pinchDist(e.touches[0], e.touches[1]),
                startScale: Number(state.settings.taskScale) || TASK_SCALE.def
            };
        }, { passive: true });

        pinchTarget.addEventListener('touchmove', (e) => {
            if (!pinch || e.touches.length !== 2) return;
            e.preventDefault();
            const next = pinch.startScale * (pinchDist(e.touches[0], e.touches[1]) / Math.max(1, pinch.startDist));
            setTaskScale(next, false);
        }, { passive: false });

        const endPinch = () => {
            if (!pinch) return;
            pinch = null;
            setTaskScale(state.settings.taskScale, true);
        };
        pinchTarget.addEventListener('touchend', endPinch);
        pinchTarget.addEventListener('touchcancel', endPinch);

        phoneLayoutMql.addEventListener('change', () => {
            if (isPhoneLayout() && editMode) setEditMode(false);
        });

        document.addEventListener('keydown', (e) => {
            if (!isPhoneLayout() || !(e.metaKey || e.ctrlKey)) return;
            if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                bumpTaskScale(1);
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                bumpTaskScale(-1);
            } else if (e.key === '0') {
                e.preventDefault();
                setTaskScale(TASK_SCALE.def);
            }
        });
    }

    function setEditMode(on) {
        if (on && isPhoneLayout()) on = false;
        editMode = Boolean(on);
        appWrapper.classList.toggle('is-editing', editMode);
        document.body.classList.toggle('is-editing', editMode);
        editBar.hidden = !editMode;
        const canResize = editMode && window.matchMedia('(min-width: 769px)').matches;
        resizeHandles.hidden = !canResize;
        enterEditBtn.textContent = editMode ? 'Exit edit mode' : 'Enter edit mode';
        prefsBtn.setAttribute('aria-label', editMode ? 'Open settings (edit mode on)' : 'Open settings');
    }

    function bindWindowResize() {
        let drag = null;

        const onMove = (e) => {
            if (!drag) return;
            const dxVw = ((e.clientX - drag.x) / window.innerWidth) * 100;
            const dyVh = ((e.clientY - drag.y) / window.innerHeight) * 100;
            let width = drag.width;
            let height = drag.height;
            if (drag.dir.includes('e')) width += dxVw * 2;
            if (drag.dir.includes('w')) width -= dxVw * 2;
            if (drag.dir.includes('s')) height += dyVh * 2;
            if (drag.dir.includes('n')) height -= dyVh * 2;
            setWindowSize(width, height, false);
        };

        const onUp = () => {
            if (!drag) return;
            drag = null;
            appWrapper.classList.remove('is-resizing');
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            saveState();
        };

        resizeHandles.addEventListener('pointerdown', (e) => {
            const handle = e.target.closest('[data-dir]');
            if (!handle || !editMode) return;
            e.preventDefault();
            drag = {
                dir: handle.dataset.dir,
                x: e.clientX,
                y: e.clientY,
                width: state.settings.window.width,
                height: state.settings.window.height
            };
            appWrapper.classList.add('is-resizing');
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        });
    }

    function isDesktopDock() {
        return state.settings.sidebar.mode === 'dock' && window.matchMedia('(min-width: 769px)').matches;
    }

    function setSidebarPlacement(side, mode) {
        state.settings.sidebar = {
            side: side === 'right' ? 'right' : 'left',
            mode: mode === 'overlay' ? 'overlay' : 'dock'
        };
        saveState();
        applyLayout();
        if (isDesktopDock()) setSidebarOpen(true);
        syncLayoutModal();
        scheduleWidgetLayout();
    }

    function setWidgetEnabled(name, enabled) {
        state.settings.widgets[name] = Boolean(enabled);
        if (name === 'pet' && enabled) ensureDefaultPet();
        saveState();
        renderWidgets();
        syncLayoutModal();
    }

    function syncLayoutModal() {
        const side = state.settings.sidebar.side === 'right' ? 'right' : 'left';
        const mode = state.settings.sidebar.mode === 'overlay' ? 'overlay' : 'dock';
        document.querySelectorAll('#sidebar-side-choices [data-side]').forEach((btn) => {
            btn.classList.toggle('selected', btn.dataset.side === side);
        });
        document.querySelectorAll('#sidebar-mode-choices [data-mode]').forEach((btn) => {
            btn.classList.toggle('selected', btn.dataset.mode === mode);
        });
        widgetClockToggle.checked = Boolean(state.settings.widgets.clock);
        widgetDateToggle.checked = Boolean(state.settings.widgets.date);
        widgetPetToggle.checked = Boolean(state.settings.widgets.pet);
        petUploadGroup.hidden = !state.settings.widgets.pet;
        if (state.settings.widgets.pet) renderPetChoices();
        ['clock', 'date', 'pet'].forEach((name) => {
            const field = document.querySelector(`[data-widget-scale="${name}"]`);
            const input = document.getElementById(`widget-${name}-scale`);
            const value = document.getElementById(`widget-${name}-scale-value`);
            const on = Boolean(state.settings.widgets[name]);
            if (field) field.hidden = !on;
            const scale = getWidgetScale(name);
            if (input) input.value = String(Math.round(scale * 100));
            if (value) value.textContent = `${Math.round(scale * 100)}%`;
        });
        const list = currentList();
        if (list && listColorPicker) {
            listColorPicker.value = list.color || DEFAULT_ACCENT;
            prefsListColorName.textContent = list.name || 'This list';
        }
    }

    function setCurrentListColor(color) {
        const list = currentList();
        if (!list || !color) return;
        list.color = color;
        applyListAccent(list);
        saveState();
        renderSidebar();
        renderHeader();
    }

    let clockTimer = null;

    function formatClock(date) {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    function formatWidgetDate(date) {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    const WIDGET_NAMES = ['clock', 'date', 'pet'];
    const WIDGET_SCALE = { min: 0.7, max: 2.2, def: 1 };
    let widgetLayoutTimer = 0;

    function widgetRecord(name) {
        if (!state.settings.widgetPos) state.settings.widgetPos = {};
        if (!state.settings.widgetPos[name] || typeof state.settings.widgetPos[name] !== 'object') {
            state.settings.widgetPos[name] = {};
        }
        return state.settings.widgetPos[name];
    }

    function getWidgetScale(name) {
        return clamp(Number(widgetRecord(name).scale) || WIDGET_SCALE.def, WIDGET_SCALE.min, WIDGET_SCALE.max);
    }

    function clampWidgetPercent(x, y) {
        return {
            x: clamp(x, -14, 97),
            y: clamp(y, -8, 96)
        };
    }

    function getWidgetPos(name) {
        const saved = state.settings.widgetPos?.[name];
        if (!Number.isFinite(Number(saved?.x)) || !Number.isFinite(Number(saved?.y))) return null;
        return clampWidgetPercent(Number(saved.x), Number(saved.y));
    }

    function applyWidgetPos(el, name) {
        const pos = getWidgetPos(name);
        if (!pos) {
            el.style.visibility = 'hidden';
            el.style.left = '0%';
            el.style.top = '0%';
            return;
        }
        el.style.visibility = '';
        el.style.left = `${pos.x}%`;
        el.style.top = `${pos.y}%`;
    }

    function applyWidgetScale(el, name) {
        el.style.setProperty('--widget-scale', String(getWidgetScale(name)));
    }

    function syncWidgetScaleUi(name) {
        const scale = getWidgetScale(name);
        const input = document.getElementById(`widget-${name}-scale`);
        const value = document.getElementById(`widget-${name}-scale-value`);
        if (input) input.value = String(Math.round(scale * 100));
        if (value) value.textContent = `${Math.round(scale * 100)}%`;
    }

    function setWidgetScale(name, scale, persist = true) {
        const rec = widgetRecord(name);
        rec.scale = clamp(Number(scale) || WIDGET_SCALE.def, WIDGET_SCALE.min, WIDGET_SCALE.max);
        const el = widgetLayer.querySelector(`[data-widget="${name}"]`);
        if (el) applyWidgetScale(el, name);
        if (name === 'pet') window.OrbitPet?.setScale(getWidgetScale('pet'));
        syncWidgetScaleUi(name);
        if (name !== 'pet' && !rec.custom) scheduleWidgetLayout();
        if (persist) saveState();
    }

    function setWidgetPos(name, x, y, persist = true, custom = true) {
        const rec = widgetRecord(name);
        const next = clampWidgetPercent(x, y);
        rec.x = next.x;
        rec.y = next.y;
        rec.custom = Boolean(custom);
        rec.scale = getWidgetScale(name);
        const el = widgetLayer.querySelector(`[data-widget="${name}"]`);
        if (el) applyWidgetPos(el, name);
        if (persist) saveState();
    }

    function placeDefaultWidgets() {
        const floats = [...widgetLayer.querySelectorAll('.widget-float')];
        const auto = floats.filter((el) => !widgetRecord(el.dataset.widget).custom);
        if (!auto.length) return;
        const wrap = appWrapper.getBoundingClientRect();
        const vw = Math.max(1, window.innerWidth);
        const vh = Math.max(1, window.innerHeight);
        const gap = 10;
        const boxes = auto.map((el) => el.getBoundingClientRect());
        const maxH = Math.max(...boxes.map((box) => box.height), 32);
        let yPx = wrap.top - 12 - maxH;
        if (yPx < 8) yPx = 8;
        let xPx = wrap.left;
        auto.forEach((el, index) => {
            const box = boxes[index];
            setWidgetPos(el.dataset.widget, (xPx / vw) * 100, (yPx / vh) * 100, false, false);
            xPx += box.width + gap;
        });
    }

    function scheduleWidgetLayout() {
        clearTimeout(widgetLayoutTimer);
        widgetLayoutTimer = window.setTimeout(placeDefaultWidgets, 180);
    }

    function resetWidgetLayout() {
        WIDGET_NAMES.forEach((name) => {
            state.settings.widgetPos[name] = { scale: WIDGET_SCALE.def };
        });
        renderWidgets();
        saveState();
        syncLayoutModal();
    }

    function bindWidgetDrag(el, name) {
        el.addEventListener('pointerdown', (e) => {
            if (!editMode || e.button !== 0) return;
            if (e.target.closest('.widget-resize')) return;
            e.preventDefault();
            e.stopPropagation();
            const origin = getWidgetPos(name) || { x: (el.offsetLeft / Math.max(1, window.innerWidth)) * 100, y: (el.offsetTop / Math.max(1, window.innerHeight)) * 100 };
            const startX = e.clientX;
            const startY = e.clientY;
            el.classList.add('is-dragging');
            el.setPointerCapture?.(e.pointerId);

            const onMove = (ev) => {
                const x = origin.x + ((ev.clientX - startX) / Math.max(1, window.innerWidth)) * 100;
                const y = origin.y + ((ev.clientY - startY) / Math.max(1, window.innerHeight)) * 100;
                setWidgetPos(name, x, y, false, true);
            };
            const onUp = () => {
                el.classList.remove('is-dragging');
                el.releasePointerCapture?.(e.pointerId);
                el.removeEventListener('pointermove', onMove);
                el.removeEventListener('pointerup', onUp);
                el.removeEventListener('pointercancel', onUp);
                saveState();
            };
            el.addEventListener('pointermove', onMove);
            el.addEventListener('pointerup', onUp);
            el.addEventListener('pointercancel', onUp);
        });
    }

    function bindWidgetResize(el, name) {
        const handle = el.querySelector('.widget-resize');
        if (!handle) return;
        handle.addEventListener('pointerdown', (e) => {
            if (!editMode || e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            const startScale = getWidgetScale(name);
            const startBox = el.getBoundingClientRect();
            const startX = e.clientX;
            const startY = e.clientY;
            el.classList.add('is-resizing');
            handle.setPointerCapture?.(e.pointerId);

            const onMove = (ev) => {
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;
                const factor = Math.max(startBox.width, 24) > 0
                    ? (startBox.width + dx + dy) / startBox.width
                    : 1;
                setWidgetScale(name, startScale * factor, false);
            };
            const onUp = () => {
                el.classList.remove('is-resizing');
                handle.releasePointerCapture?.(e.pointerId);
                handle.removeEventListener('pointermove', onMove);
                handle.removeEventListener('pointerup', onUp);
                handle.removeEventListener('pointercancel', onUp);
                saveState();
            };
            handle.addEventListener('pointermove', onMove);
            handle.addEventListener('pointerup', onUp);
            handle.addEventListener('pointercancel', onUp);
        });
    }

    function createWidgetShell(name, inner) {
        const shell = document.createElement('div');
        shell.className = 'widget-float';
        shell.dataset.widget = name;
        applyWidgetScale(shell, name);
        applyWidgetPos(shell, name);
        shell.appendChild(inner);
        const resize = document.createElement('span');
        resize.className = 'widget-resize';
        resize.title = 'Resize widget';
        resize.setAttribute('aria-hidden', 'true');
        shell.appendChild(resize);
        bindWidgetDrag(shell, name);
        bindWidgetResize(shell, name);
        return shell;
    }

    function renderWidgets() {
        const widgets = state.settings.widgets || {};
        const showClock = Boolean(widgets.clock);
        const showDate = Boolean(widgets.date);
        widgetLayer.replaceChildren();
        widgetLayer.hidden = !(showClock || showDate);

        if (showClock) {
            const el = document.createElement('div');
            el.className = 'widget widget-clock';
            el.id = 'widget-clock-face';
            el.textContent = formatClock(new Date());
            widgetLayer.appendChild(createWidgetShell('clock', el));
        }

        if (showDate) {
            const el = document.createElement('div');
            el.className = 'widget widget-date';
            el.textContent = formatWidgetDate(new Date());
            widgetLayer.appendChild(createWidgetShell('date', el));
        }

        placeDefaultWidgets();

        clearInterval(clockTimer);
        clockTimer = null;
        if (showClock) {
            clockTimer = setInterval(() => {
                const face = document.getElementById('widget-clock-face');
                if (face) face.textContent = formatClock(new Date());
            }, 1000);
        }

        renderRoamPet();
    }

    function migratePets() {
        if (!Array.isArray(state.settings.pets)) state.settings.pets = [];
        state.settings.pets = state.settings.pets
            .map((pet) => {
                if (!pet || typeof pet !== 'object') return null;
                const id = String(pet.id || '').slice(0, 80);
                if (!id) return null;
                return {
                    id,
                    type: window.OrbitPet ? window.OrbitPet.normalize(pet.type) : (pet.type || 'cat')
                };
            })
            .filter(Boolean)
            .slice(0, window.OrbitPet?.MAX || 32);
        if (!state.settings.pets.length && state.settings.widgets?.pet) {
            const type = state.settings.petChoice
                ? (window.OrbitPet ? window.OrbitPet.normalize(state.settings.petChoice) : 'cat')
                : (window.OrbitPet?.DEFAULT || 'cat');
            state.settings.pets.push({ id: uid('pet-'), type });
        }
    }

    function ensureDefaultPet() {
        migratePets();
        if (!state.settings.pets.length) {
            state.settings.pets.push({ id: uid('pet-'), type: window.OrbitPet?.DEFAULT || 'cat' });
        }
    }

    async function srcForType(type) {
        const normalized = window.OrbitPet?.normalize(type) || 'cat';
        if (normalized === 'custom') {
            try {
                const url = await wallpaperGet(PET_MEDIA_KEY);
                if (url) return url;
            } catch { /* ignore */ }
            return window.OrbitPet.presetSrc('cat', PET_ASSET_BASE);
        }
        return window.OrbitPet.presetSrc(normalized, PET_ASSET_BASE);
    }

    async function renderRoamPet() {
        const token = ++petRenderToken;
        migratePets();
        if (!state.settings.widgets?.pet || !state.settings.pets.length) {
            window.OrbitPet?.stop();
            return;
        }
        const items = [];
        for (const pet of state.settings.pets) {
            items.push({ id: pet.id, src: await srcForType(pet.type) });
            if (token !== petRenderToken) return;
        }
        window.OrbitPet?.sync(items, { scale: getWidgetScale('pet') });
    }

    async function renderPetChoices() {
        const grid = document.getElementById('pet-choice-grid');
        const roster = document.getElementById('pet-roster');
        const clearBtn = document.getElementById('pet-clear-btn');
        if (!grid || !window.OrbitPet) return;
        migratePets();
        const counts = {};
        state.settings.pets.forEach((pet) => {
            counts[pet.type] = (counts[pet.type] || 0) + 1;
        });
        let customUrl = null;
        try { customUrl = await wallpaperGet(PET_MEDIA_KEY); } catch { customUrl = null; }

        grid.replaceChildren();
        const types = [...window.OrbitPet.PRESETS];
        if (customUrl) types.push({ id: 'custom', name: 'Yours' });
        types.forEach((preset) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pet-choice';
            btn.dataset.addPet = preset.id;
            const n = counts[preset.id] || 0;
            btn.classList.toggle('selected', n > 0);
            btn.setAttribute('aria-label', `Add ${preset.name}`);
            const img = document.createElement('img');
            img.src = preset.id === 'custom' ? customUrl : window.OrbitPet.presetSrc(preset.id, PET_ASSET_BASE);
            img.alt = '';
            const label = document.createElement('span');
            label.textContent = preset.name;
            btn.append(img, label);
            if (n) {
                const badge = document.createElement('span');
                badge.className = 'pet-choice-count';
                badge.textContent = String(n);
                btn.appendChild(badge);
            }
            grid.appendChild(btn);
        });

        if (roster) {
            roster.replaceChildren();
            roster.hidden = !state.settings.pets.length;
            state.settings.pets.forEach((pet) => {
                const chip = document.createElement('div');
                chip.className = 'pet-chip';
                const img = document.createElement('img');
                img.alt = '';
                img.src = pet.type === 'custom' && customUrl
                    ? customUrl
                    : window.OrbitPet.presetSrc(pet.type === 'custom' ? 'cat' : pet.type, PET_ASSET_BASE);
                const name = document.createElement('span');
                name.textContent = window.OrbitPet.presetName(pet.type);
                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'pet-chip-remove';
                remove.dataset.removePet = pet.id;
                remove.setAttribute('aria-label', `Remove ${window.OrbitPet.presetName(pet.type)}`);
                remove.textContent = '×';
                chip.append(img, name, remove);
                roster.appendChild(chip);
            });
        }
        if (clearBtn) clearBtn.hidden = !state.settings.pets.length;
    }

    function addPet(type) {
        migratePets();
        const max = window.OrbitPet?.MAX || 32;
        if (state.settings.pets.length >= max) {
            setPetStatus(`That's the max (${max}).`);
            return;
        }
        state.settings.pets.push({
            id: uid('pet-'),
            type: window.OrbitPet?.normalize(type) || 'cat'
        });
        state.settings.widgets.pet = true;
        saveState();
        renderRoamPet();
        syncLayoutModal();
        setPetStatus('');
    }

    function removePetById(id) {
        migratePets();
        state.settings.pets = state.settings.pets.filter((pet) => pet.id !== id);
        saveState();
        renderRoamPet();
        syncLayoutModal();
    }

    function clearPets() {
        state.settings.pets = [];
        saveState();
        renderRoamPet();
        syncLayoutModal();
        setPetStatus('All pets cleared.');
    }

    function setPetStatus(message) {
        petStatus.hidden = !message;
        petStatus.textContent = message || '';
    }

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Could not read that file.'));
            reader.readAsDataURL(file);
        });
    }

    async function handlePetUpload(file) {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setPetStatus('Please choose a GIF or image.');
            return;
        }
        if (file.size > 2.5 * 1024 * 1024) {
            setPetStatus('Keep the pet under 2.5 MB.');
            return;
        }
        setPetStatus('Saving pet…');
        try {
            const dataUrl = await readFileAsDataUrl(file);
            await wallpaperPut(PET_MEDIA_KEY, dataUrl);
            state.settings.widgets.pet = true;
            migratePets();
            if (state.settings.pets.length < (window.OrbitPet?.MAX || 32)) {
                state.settings.pets.push({ id: uid('pet-'), type: 'custom' });
            }
            saveState();
            renderWidgets();
            syncLayoutModal();
            setPetStatus('Pet saved.');
        } catch (err) {
            setPetStatus(err.message || 'Could not save that pet.');
        }
    }

    async function removePet() {
        try { await wallpaperDel(PET_MEDIA_KEY); } catch { /* ignore */ }
        migratePets();
        state.settings.pets = state.settings.pets.filter((pet) => pet.type !== 'custom');
        saveState();
        renderWidgets();
        syncLayoutModal();
        setPetStatus('Uploaded GIF removed.');
    }

    function setSidebarOpen(open) {
        sidebar.classList.toggle('is-open', open);
        sidebarOverlay.classList.toggle('is-open', open);
        menuBtn.classList.toggle('is-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Close lists' : 'Open lists');
    }

    function toggleSidebar() {
        setSidebarOpen(!sidebar.classList.contains('is-open'));
    }

    function closeOpenOverlays() {
        closeTagMenu();
        if (isModalOpen(confirmModal)) {
            closeModal(confirmModal);
            finishDialog(false);
            return true;
        }
        if (isModalOpen(inputModal)) {
            closeModal(inputModal);
            finishDialog(null);
            return true;
        }
        if (isModalOpen(themeModal)) {
            closeModal(themeModal);
            return true;
        }
        if (isModalOpen(prefsModal)) {
            closeModal(prefsModal);
            return true;
        }
        if (isModalOpen(settingsModal)) {
            closeModal(settingsModal);
            return true;
        }
        if (isModalOpen(document.getElementById('tag-modal'))) {
            closeModal(document.getElementById('tag-modal'));
            return true;
        }
        if (editMode) {
            setEditMode(false);
            return true;
        }
        if (sidebar.classList.contains('is-open')) {
            setSidebarOpen(false);
            return true;
        }
        return false;
    }

    async function collectBackupMedia() {
        const wallpapers = {};
        for (const theme of state.customThemes || []) {
            try {
                const dataUrl = await wallpaperGet(theme.id);
                if (dataUrl) wallpapers[theme.id] = dataUrl;
            } catch {
                /* skip missing photo */
            }
        }
        let pet = null;
        try {
            pet = await wallpaperGet(PET_MEDIA_KEY);
        } catch {
            pet = null;
        }
        return { wallpapers, pet };
    }

    async function createBackupPayload() {
        const includeMedia = Boolean(document.getElementById('backup-include-media')?.checked);
        const media = includeMedia ? await collectBackupMedia() : { wallpapers: {}, pet: null };
        return window.OrbitBackup.build(state, media);
    }

    function refreshAfterBackup() {
        checkRecurringLists();
        renderSidebar();
        renderCalendar();
        renderHeader();
        renderTodos();
        applyLayout();
        applyWindowSize();
        applyTaskScale();
        applyTheme(currentList()?.theme || DEFAULT_THEME);
        renderWidgets();
        syncLayoutModal();
    }

    async function applyBackup(imported, mode, options = {}) {
        if (options.snapshot !== false) {
            window.OrbitBackup.saveRestorePoint(localStorage, STATE_KEY, state);
        }
        const fallback = DEFAULT_THEME;
        const prepared = {
            data: window.OrbitBackup.applyThemeFallback(imported.data, imported.media, fallback),
            media: imported.media
        };
        const next = mode === 'merge'
            ? window.OrbitBackup.merge(state, prepared, { uid, defaultTheme: fallback })
            : prepared;

        const oldThemeIds = (state.customThemes || []).map((theme) => theme.id);
        state.lists = next.data.lists;
        state.tasks = next.data.tasks;
        state.tags = next.data.tags;
        if (Array.isArray(next.data.groups)) state.groups = next.data.groups;
        state.currentListId = next.data.currentListId;
        state.customThemes = next.data.customThemes;
        state.bitsParams = next.data.bitsParams;
        state.wallpaperAdjust = next.data.wallpaperAdjust;
        if (mode === 'replace') {
            state.settings = { ...state.settings, ...(next.data.settings || {}) };
        }
        state.settings.usedParticlesDefault = true;

        if (mode === 'replace') {
            const keep = new Set((state.customThemes || []).map((theme) => theme.id));
            for (const id of oldThemeIds) {
                if (!keep.has(id)) {
                    try { await wallpaperDel(id); } catch { /* ignore */ }
                }
            }
        }

        for (const [id, dataUrl] of Object.entries(next.media?.wallpapers || {})) {
            try { await wallpaperPut(id, dataUrl); } catch { /* ignore */ }
        }
        if (mode === 'replace' && next.media?.pet) {
            try { await wallpaperPut(PET_MEDIA_KEY, next.media.pet); } catch { /* ignore */ }
        }

        saveState();
        loadState();
        refreshAfterBackup();
    }

    function bindBackup() {
        const exportBtn = document.getElementById('backup-export-btn');
        const shareBtn = document.getElementById('backup-share-btn');
        const importBtn = document.getElementById('backup-import-btn');
        const importInput = document.getElementById('backup-import-input');
        const restoreBtn = document.getElementById('backup-restore-btn');
        const restoreHint = document.getElementById('backup-restore-hint');
        const templateGroup = document.getElementById('template-group');
        if (!window.OrbitBackup || !exportBtn || !importBtn || !importInput) return;

        const syncRestoreButton = () => {
            const hasPoint = Boolean(window.OrbitBackup.readRestorePoint(localStorage, STATE_KEY));
            if (restoreBtn) restoreBtn.hidden = !hasPoint;
            if (restoreHint) restoreHint.hidden = !hasPoint;
        };

        const probe = window.OrbitBackup.toFile({ format: 'orbit-backup', version: 1, data: { lists: [], tasks: [] } });
        if (shareBtn && window.OrbitBackup.canShareFile(probe)) shareBtn.hidden = false;
        syncRestoreButton();

        const exportBackup = async (shareIt) => {
            try {
                const payload = await createBackupPayload();
                const size = window.OrbitBackup.byteSize(payload);
                if (size > window.OrbitBackup.WARN_SIZE) {
                    const ok = await showConfirm('This backup is over 4 MB because of photos. Save it anyway?');
                    if (!ok) return;
                }
                if (shareIt) {
                    const shared = await window.OrbitBackup.share(payload);
                    if (shared) {
                        showNotice('Backup ready to share.');
                        return;
                    }
                }
                window.OrbitBackup.download(payload);
                showNotice('Backup downloaded.');
            } catch (err) {
                if (err?.name === 'AbortError') return;
                showNotice(err.message || 'Could not export that backup.');
            }
        };

        exportBtn.addEventListener('click', () => exportBackup(false));
        shareBtn?.addEventListener('click', () => exportBackup(true));
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', async () => {
            const file = importInput.files?.[0];
            importInput.value = '';
            if (!file) return;
            try {
                const imported = window.OrbitBackup.parse(await file.text());
                const proceed = await showConfirm('Import this Orbit backup?');
                if (!proceed) return;
                const replace = await showConfirm(
                    'Replace everything with this backup? Choose Merge to keep yours and add the imported lists.',
                    { yes: 'Replace', no: 'Merge' }
                );
                await applyBackup(imported, replace ? 'replace' : 'merge');
                syncRestoreButton();
                closeModal(prefsModal);
                showNotice(replace ? 'Backup restored. Restore my lists is in Settings.' : 'Backup merged. Restore my lists is in Settings.');
            } catch (err) {
                showNotice(err.message || 'Could not import that file.');
            }
        });

        restoreBtn?.addEventListener('click', async () => {
            const point = window.OrbitBackup.readRestorePoint(localStorage, STATE_KEY);
            if (!point) return;
            const ok = await showConfirm('Restore the lists you had before templates or imports?');
            if (!ok) return;
            await applyBackup({ data: point.data, media: { wallpapers: {}, pet: null } }, 'replace', { snapshot: false });
            window.OrbitBackup.clearRestorePoint(localStorage, STATE_KEY);
            syncRestoreButton();
            closeModal(prefsModal);
            showNotice('Your original lists are back.');
        });

        templateGroup?.addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-template]');
            if (!btn) return;
            const id = btn.dataset.template;
            const base = templateGroup.dataset.templateBase || './templates';
            try {
                const response = await fetch(`${base}/${id}.json`);
                if (!response.ok) throw new Error('Could not load that template.');
                const imported = window.OrbitBackup.parse(await response.text());
                const name = imported.data.lists[0]?.name || 'this template';
                if (state.lists.some((list) => list.name === name)) {
                    showNotice(`You already have ${name}.`);
                    return;
                }
                const ok = await showConfirm(`Add “${name}” to your lists? Your current tasks will stay.`);
                if (!ok) return;
                const before = new Set(state.lists.map((list) => String(list.id)));
                await applyBackup(imported, 'merge');
                const added = state.lists.find((list) => !before.has(String(list.id)));
                if (added) {
                    state.currentListId = added.id;
                    saveState();
                    refreshAfterBackup();
                }
                syncRestoreButton();
                closeModal(prefsModal);
                showNotice(`${name} added. Restore my lists is in Settings.`);
            } catch (err) {
                showNotice(err.message || 'Could not add that template.');
            }
        });
    }

    async function refreshAccountUi() {
        const hint = document.getElementById('account-hint');
        const signedOut = document.getElementById('account-signed-out');
        const signedIn = document.getElementById('account-signed-in');
        const emailLabel = document.getElementById('account-email-label');
        const status = document.getElementById('account-status');
        const configured = Boolean(window.OrbitSync?.isConfigured());
        if (hint) {
            hint.textContent = configured
                ? 'Optional. Sign in to sync lists across devices and share a list with someone.'
                : 'Cloud sync is not configured. Add your Supabase URL and anon key in js/supabase-config.js.';
        }
        const user = configured ? await window.OrbitSync.user() : null;
        if (signedOut) signedOut.hidden = !configured || Boolean(user);
        if (signedIn) signedIn.hidden = !user;
        if (emailLabel) emailLabel.textContent = user?.email || '';
        const err = window.OrbitSync?.lastError();
        const synced = window.OrbitSync?.lastSyncAt();
        const note = err || (synced ? `Last sync ${new Date(synced).toLocaleString()}` : '');
        if (status) {
            status.hidden = !note;
            status.textContent = note;
            status.classList.toggle('sync-error', Boolean(err));
        }
    }

    function applyCloudState(remote) {
        const localPets = state.settings?.pets;
        const localPetChoice = state.settings?.petChoice;
        state.lists = remote.lists;
        state.tasks = remote.tasks;
        state.tags = remote.tags;
        state.groups = remote.groups || [];
        if (remote.settings) {
            state.settings = { ...state.settings, ...remote.settings };
            if (localPets) state.settings.pets = localPets;
            if (localPetChoice) state.settings.petChoice = localPetChoice;
        }
        if (remote.bitsParams) state.bitsParams = remote.bitsParams;
        if (remote.currentListId) state.currentListId = remote.currentListId;
        if (!state.lists.some((list) => sameId(list.id, state.currentListId))) {
            state.currentListId = state.lists[0]?.id || 'default';
        }
        saveState({ skipSync: true });
        renderSidebar();
        renderCalendar();
        renderHeader();
        renderTodos();
        applyTheme(currentList()?.theme || DEFAULT_THEME);
        renderWidgets();
        syncLayoutModal();
        refreshAccountUi();
    }

    function bindCloud() {
        window.OrbitSync?.init({
            getState: () => state,
            applyCloud: applyCloudState,
            persistLocal: () => saveState({ skipSync: true }),
            onAuth: () => { refreshAccountUi(); },
            onStatus: () => { refreshAccountUi(); }
        });
        refreshAccountUi();
    }

    function setupEventListeners() {
        addBtn.addEventListener('click', addTodo);
        todoInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addTodo();
        });
        clearCompletedBtn.addEventListener('click', clearCompleted);
        addListBtn.addEventListener('click', addNewList);
        addGroupBtn?.addEventListener('click', addNewGroup);
        menuBtn.addEventListener('click', toggleSidebar);
        closeSidebarBtn.addEventListener('click', () => setSidebarOpen(false));
        sidebarOverlay.addEventListener('click', () => setSidebarOpen(false));

        prefsBtn.addEventListener('click', () => {
            setPetStatus('');
            syncLayoutModal();
            applyWindowSize();
            applyTaskScale();
            document.getElementById('backup-restore-btn').hidden = !window.OrbitBackup?.readRestorePoint(localStorage, STATE_KEY);
            document.getElementById('backup-restore-hint').hidden = document.getElementById('backup-restore-btn').hidden;
            refreshAccountUi();
            openModal(prefsModal);
        });
        listColorPicker.addEventListener('input', () => setCurrentListColor(listColorPicker.value));
        closePrefsModal.addEventListener('click', () => closeModal(prefsModal));
        openThemeBtn.addEventListener('click', () => {
            closeModal(prefsModal);
            setWallpaperStatus('');
            renderThemeOptions();
            openModal(themeModal);
        });
        enterEditBtn.addEventListener('click', () => {
            closeModal(prefsModal);
            setEditMode(!editMode);
        });
        editDoneBtn.addEventListener('click', () => setEditMode(false));
        document.getElementById('wallpaper-fit-choices').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-fit]');
            const list = currentList();
            if (!btn || !list || !isPhotoTheme(list.theme)) return;
            setWallpaperAdjust(list.theme, { fit: btn.dataset.fit });
            renderWallpaperControls();
        });
        wallpaperNameInput.addEventListener('change', () => {
            const list = currentList();
            const custom = state.customThemes.find((theme) => theme.id === list?.theme);
            if (!custom) return;
            custom.name = wallpaperNameInput.value.trim().slice(0, 32) || 'Wallpaper';
            saveState();
            renderThemeOptions();
        });
        wallpaperResetBtn.addEventListener('click', () => {
            const list = currentList();
            if (!list || !isPhotoTheme(list.theme)) return;
            delete state.wallpaperAdjust[list.theme];
            saveState();
            applyWallpaperAdjust(list.theme);
            renderWallpaperControls();
        });
        windowWidthInput.addEventListener('input', () => {
            setWindowSize(Number(windowWidthInput.value), state.settings.window.height);
        });
        windowHeightInput.addEventListener('input', () => {
            setWindowSize(state.settings.window.width, Number(windowHeightInput.value));
        });
        windowResetBtn.addEventListener('click', () => setWindowSize(DEFAULT_WINDOW.width, DEFAULT_WINDOW.height));
        wallpaperInput.addEventListener('change', () => {
            const file = wallpaperInput.files?.[0];
            wallpaperInput.value = '';
            handleWallpaperUpload(file);
        });
        listResetSelect.addEventListener('change', syncResetFields);
        closeThemeModal.addEventListener('click', () => closeModal(themeModal));
        bitsResetBtn.addEventListener('click', resetBitsParams);

        document.getElementById('sidebar-side-choices').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-side]');
            if (!btn) return;
            setSidebarPlacement(btn.dataset.side, state.settings.sidebar.mode);
        });
        document.getElementById('sidebar-mode-choices').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-mode]');
            if (!btn) return;
            setSidebarPlacement(state.settings.sidebar.side, btn.dataset.mode);
        });
        widgetClockToggle.addEventListener('change', () => setWidgetEnabled('clock', widgetClockToggle.checked));
        widgetDateToggle.addEventListener('change', () => setWidgetEnabled('date', widgetDateToggle.checked));
        widgetPetToggle.addEventListener('change', () => setWidgetEnabled('pet', widgetPetToggle.checked));
        WIDGET_NAMES.forEach((name) => {
            const input = document.getElementById(`widget-${name}-scale`);
            input?.addEventListener('input', () => setWidgetScale(name, Number(input.value) / 100, false));
            input?.addEventListener('change', () => saveState());
        });
        widgetResetBtn?.addEventListener('click', resetWidgetLayout);
        window.addEventListener('resize', scheduleWidgetLayout);
        petInput.addEventListener('change', () => {
            const file = petInput.files?.[0];
            petInput.value = '';
            handlePetUpload(file);
        });
        petRemoveBtn.addEventListener('click', removePet);
        document.getElementById('pet-choice-grid')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-add-pet]');
            if (!btn) return;
            addPet(btn.dataset.addPet);
        });
        document.getElementById('pet-roster')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-remove-pet]');
            if (!btn) return;
            removePetById(btn.dataset.removePet);
        });
        document.getElementById('pet-clear-btn')?.addEventListener('click', clearPets);
        bindWindowResize();
        bindTaskScale();
        bindBackup();

        confirmYesBtn.addEventListener('click', () => {
            closeModal(confirmModal);
            finishDialog(true);
        });
        confirmNoBtn.addEventListener('click', () => {
            closeModal(confirmModal);
            finishDialog(false);
        });
        inputOkBtn.addEventListener('click', () => {
            closeModal(inputModal);
            finishDialog(inputField.value.trim() || null);
        });
        inputCancelBtn.addEventListener('click', () => {
            closeModal(inputModal);
            finishDialog(null);
        });
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') inputOkBtn.click();
        });

        saveSettingsBtn.addEventListener('click', saveListSettings);
        cancelSettingsBtn.addEventListener('click', () => closeModal(settingsModal));
        document.getElementById('account-signin-btn')?.addEventListener('click', async () => {
            const email = document.getElementById('account-email')?.value.trim();
            const status = document.getElementById('account-status');
            if (!email) {
                if (status) { status.hidden = false; status.textContent = 'Enter your email first.'; }
                return;
            }
            try {
                await window.OrbitSync.sendMagicLink(email);
                if (status) { status.hidden = false; status.textContent = 'Check your email for the sign-in link.'; }
            } catch (err) {
                if (status) { status.hidden = false; status.textContent = err.message || 'Could not send that link.'; }
            }
        });
        document.getElementById('account-sync-btn')?.addEventListener('click', async () => {
            const status = document.getElementById('account-status');
            if (status) {
                status.hidden = false;
                status.classList.remove('sync-error');
                status.textContent = 'Syncing…';
            }
            await window.OrbitSync?.syncNow?.();
            refreshAccountUi();
        });
        document.getElementById('account-signout-btn')?.addEventListener('click', async () => {
            await window.OrbitSync?.signOut();
            refreshAccountUi();
        });
        document.getElementById('share-list-btn')?.addEventListener('click', async () => {
            const status = document.getElementById('share-list-status');
            try {
                const link = await window.OrbitSync.createInvite(settingsListId);
                try {
                    await navigator.clipboard.writeText(link);
                    if (status) { status.hidden = false; status.textContent = 'Invite link copied.'; }
                } catch {
                    if (status) { status.hidden = false; status.textContent = link; }
                }
            } catch (err) {
                if (status) { status.hidden = false; status.textContent = err.message || 'Could not create an invite.'; }
            }
        });

        document.getElementById('save-tag-btn').addEventListener('click', saveNewTag);
        document.getElementById('cancel-tag-btn').addEventListener('click', () => {
            closeModal(document.getElementById('tag-modal'));
        });
        document.getElementById('new-tag-name').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveNewTag();
        });

        toastUndoBtn.addEventListener('click', () => {
            undoAction?.();
            hideToast();
        });

        [themeModal, prefsModal, confirmModal, inputModal, settingsModal, document.getElementById('tag-modal')].forEach((modal) => {
            modal.addEventListener('click', (e) => {
                if (e.target !== modal) return;
                if (modal === confirmModal) {
                    closeModal(modal);
                    finishDialog(false);
                } else if (modal === inputModal) {
                    closeModal(modal);
                    finishDialog(null);
                } else {
                    closeModal(modal);
                }
            });
        });

        document.addEventListener('click', (e) => {
            const menu = document.querySelector('.tag-menu');
            if (menu && !menu.contains(e.target) && !e.target.closest('.tag-btn')) closeTagMenu();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeOpenOverlays();
        });
    }

    init();
});
