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
    const LEGACY_MOBILE_KEY = 'orbit_mobile_state';
    const SHELL_KEY = document.body.classList.contains('orbit-mobile') ? 'orbit_shell_mobile' : 'orbit_shell_desktop';
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

    function setBackgroundPreview(on) {
        document.body.classList.toggle('is-previewing-bg', Boolean(on));
        window.BitsFX?.setSaverMode?.(on ? false : Boolean(state.settings.optimizedMode));
        applyTheme(currentList()?.theme || DEFAULT_THEME);
        if (on) window.BitsFX?.resume?.();
    }

    function openModal(modal) {
        modal.classList.remove('hidden');
        requestAnimationFrame(() => modal.classList.add('visible'));
        if (modal === themeModal) setBackgroundPreview(true);
    }

    function closeModal(modal) {
        modal.classList.remove('visible');
        if (modal === themeModal) setBackgroundPreview(false);
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
        deletedTaskIds: [],
        deletedListIds: [],
        deletedGroupIds: [],
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
            window: { width: 34, height: 53 },
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
        applyPerformanceMode({ skipRestart: true });
        applyTheme(list?.theme || DEFAULT_THEME);
        renderWidgets();
        window.BitsFX?.initUI({ addBtn });
        bindCloud();
        if (state.settings.sidebar.mode === 'dock' && window.matchMedia('(min-width: 769px)').matches) {
            setSidebarOpen(true);
        }
        if (currentList() && !window.matchMedia('(pointer: coarse)').matches) todoInput.focus();
    }

    function parseStoredState(raw) {
        if (!raw) return null;
        try {
            const value = JSON.parse(raw);
            return value && typeof value === 'object' ? value : null;
        } catch {
            return null;
        }
    }

    function mergeItemsById(a, b) {
        const map = new Map();
        [...(a || []), ...(b || [])].forEach((item) => {
            if (!item?.id) return;
            const id = String(item.id);
            const current = map.get(id);
            if (!current) {
                map.set(id, item);
                return;
            }
            const nextTime = Date.parse(item.updatedAt) || 0;
            const currentTime = Date.parse(current.updatedAt) || 0;
            map.set(id, nextTime >= currentTime ? { ...current, ...item } : { ...item, ...current });
        });
        return [...map.values()];
    }

    function mergeLocalSaves(primary, secondary) {
        if (!primary) return secondary;
        if (!secondary) return primary;
        return {
            ...secondary,
            ...primary,
            lists: mergeItemsById(primary.lists, secondary.lists),
            tasks: mergeItemsById(primary.tasks, secondary.tasks),
            tags: mergeItemsById(primary.tags, secondary.tags),
            groups: mergeItemsById(primary.groups, secondary.groups),
            deletedTaskIds: [...new Set([...(primary.deletedTaskIds || []), ...(secondary.deletedTaskIds || [])].map(String))],
            deletedListIds: [...new Set([...(primary.deletedListIds || []), ...(secondary.deletedListIds || [])].map(String))],
            deletedGroupIds: [...new Set([...(primary.deletedGroupIds || []), ...(secondary.deletedGroupIds || [])].map(String))],
            settings: { ...(secondary.settings || {}), ...(primary.settings || {}) }
        };
    }

    function readSharedState() {
        return mergeLocalSaves(
            parseStoredState(localStorage.getItem(STATE_KEY)),
            parseStoredState(localStorage.getItem(LEGACY_MOBILE_KEY))
        );
    }

    function applyShellSettings() {
        const shell = parseStoredState(localStorage.getItem(SHELL_KEY));
        if (!state.settings) state.settings = {};
        if (shell?.window) state.settings.window = shell.window;
        if (!shell?.usedCompactWindow) {
            const width = Number(state.settings.window?.width);
            const height = Number(state.settings.window?.height);
            if (!state.settings.window || (width === 68 && height === 78)) {
                state.settings.window = { width: 34, height: 53 };
            }
        }
        if (shell?.sidebar) state.settings.sidebar = { ...(state.settings.sidebar || {}), ...shell.sidebar };
        if (shell?.taskScale != null) state.settings.taskScale = shell.taskScale;
        if (shell && Object.prototype.hasOwnProperty.call(shell, 'loginChip')) {
            state.settings.loginChip = shell.loginChip;
        } else {
            delete state.settings.loginChip;
        }
        state.settings.optimizedMode = Boolean(shell?.optimizedMode);
        state.settings.syncMode = shell?.syncMode === 'off' || shell?.syncMode === 'live' ? shell.syncMode : 'push';
        state.settings.syncLists = shell?.syncLists !== false;
        state.settings.syncGroups = shell?.syncGroups !== false;
        if (shell && Object.prototype.hasOwnProperty.call(shell, 'trash')) {
            state.settings.trash = Array.isArray(shell.trash) ? shell.trash.slice(0, 5) : [];
        } else {
            delete state.settings.trash;
        }
        if (document.body.classList.contains('orbit-mobile')) {
            if (!state.settings.sidebar) state.settings.sidebar = { side: 'left', mode: 'overlay' };
            state.settings.sidebar.mode = 'overlay';
        }
    }

    function writeLocalState() {
        const previous = parseStoredState(localStorage.getItem(STATE_KEY)) || {};
        const payload = JSON.parse(JSON.stringify(state));
        if (payload.settings) {
            delete payload.settings.loginChip;
            delete payload.settings.optimizedMode;
            delete payload.settings.trash;
            delete payload.settings.syncMode;
            delete payload.settings.syncLists;
            delete payload.settings.syncGroups;
        }
        if (document.body.classList.contains('orbit-mobile') && previous.settings) {
            payload.settings = {
                ...(payload.settings || {}),
                window: previous.settings.window || payload.settings?.window,
                sidebar: previous.settings.sidebar || payload.settings?.sidebar,
                taskScale: previous.settings.taskScale ?? payload.settings?.taskScale
            };
            if (payload.settings) {
                delete payload.settings.loginChip;
                delete payload.settings.optimizedMode;
                delete payload.settings.trash;
                delete payload.settings.syncMode;
                delete payload.settings.syncLists;
                delete payload.settings.syncGroups;
            }
        }
        localStorage.setItem(STATE_KEY, JSON.stringify(payload));
        try { localStorage.removeItem(LEGACY_MOBILE_KEY); } catch { /* ignore */ }
        try {
            localStorage.setItem(SHELL_KEY, JSON.stringify({
                window: state.settings.window,
                sidebar: state.settings.sidebar,
                taskScale: state.settings.taskScale,
                loginChip: state.settings.loginChip || { hidden: false },
                optimizedMode: Boolean(state.settings.optimizedMode),
                usedCompactWindow: true,
                syncMode: state.settings.syncMode === 'off' || state.settings.syncMode === 'live' ? state.settings.syncMode : 'push',
                syncLists: state.settings.syncLists !== false,
                syncGroups: state.settings.syncGroups !== false,
                trash: Array.isArray(state.settings.trash) ? state.settings.trash.slice(0, 5) : []
            }));
        } catch { /* ignore */ }
    }

    function loginChipConfig() {
        const cfg = state.settings.loginChip;
        return cfg && typeof cfg === 'object' ? cfg : {};
    }

    function clampLoginChipPos(x, y, chip) {
        const w = chip.offsetWidth || 120;
        const h = chip.offsetHeight || 44;
        const maxX = Math.max(8, window.innerWidth - w - 8);
        const maxY = Math.max(8, window.innerHeight - h - 8);
        return {
            x: Math.min(maxX, Math.max(8, x)),
            y: Math.min(maxY, Math.max(8, y))
        };
    }

    function applyLoginChip() {
        const chip = document.getElementById('login-chip');
        const cfg = loginChipConfig();
        const hidden = Boolean(cfg.hidden);
        document.body.classList.toggle('login-chip-hidden', hidden);
        if (chip) {
            chip.hidden = hidden;
            if (Number.isFinite(Number(cfg.x)) && Number.isFinite(Number(cfg.y))) {
                const pos = clampLoginChipPos(Number(cfg.x), Number(cfg.y), chip);
                chip.style.left = `${pos.x}px`;
                chip.style.top = `${pos.y}px`;
                chip.style.right = 'auto';
                chip.style.bottom = 'auto';
            } else {
                chip.style.left = '';
                chip.style.top = '';
                chip.style.right = '';
                chip.style.bottom = '';
            }
        }
        const showBtn = document.getElementById('show-login-chip-btn');
        if (showBtn) showBtn.hidden = !hidden;
    }

    function persistLoginChip(patch) {
        state.settings.loginChip = { ...loginChipConfig(), ...patch };
        applyLoginChip();
        saveState({ skipSync: true });
    }

    function bindLoginChip() {
        const chip = document.getElementById('login-chip');
        if (!chip) return;
        let dragging = false;
        let moved = false;
        let startX = 0;
        let startY = 0;
        let origX = 0;
        let origY = 0;

        chip.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if (e.target.closest('#hide-login-chip')) return;
            dragging = true;
            moved = false;
            chip.dataset.dragged = '0';
            const rect = chip.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            origX = rect.left;
            origY = rect.top;
            chip.setPointerCapture?.(e.pointerId);
        });

        chip.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (!moved && (dx * dx + dy * dy) < 36) return;
            moved = true;
            chip.dataset.dragged = '1';
            const pos = clampLoginChipPos(origX + dx, origY + dy, chip);
            chip.style.left = `${pos.x}px`;
            chip.style.top = `${pos.y}px`;
            chip.style.right = 'auto';
            chip.style.bottom = 'auto';
        });

        const endDrag = () => {
            if (!dragging) return;
            dragging = false;
            if (moved) {
                const rect = chip.getBoundingClientRect();
                const pos = clampLoginChipPos(rect.left, rect.top, chip);
                persistLoginChip({ x: pos.x, y: pos.y });
            }
        };
        chip.addEventListener('pointerup', endDrag);
        chip.addEventListener('pointercancel', endDrag);

        document.getElementById('hide-login-chip')?.addEventListener('click', (e) => {
            e.stopPropagation();
            persistLoginChip({ hidden: true });
        });
        document.getElementById('show-login-chip-btn')?.addEventListener('click', () => {
            persistLoginChip({ hidden: false });
        });
        window.addEventListener('resize', () => applyLoginChip());
        applyLoginChip();
    }

    function loadState() {
        const saved = readSharedState();
        if (!saved) return;

        try {
            state = { ...state, ...saved };
            if (!Array.isArray(state.lists)) state.lists = [];
            if (!Array.isArray(state.tasks)) state.tasks = [];
            if (!Array.isArray(state.tags)) state.tags = [];
            if (!Array.isArray(state.groups)) state.groups = [];
            if (!Array.isArray(state.deletedTaskIds)) state.deletedTaskIds = [];
            if (!Array.isArray(state.deletedListIds)) state.deletedListIds = [];
            if (!Array.isArray(state.deletedGroupIds)) state.deletedGroupIds = [];
            const goneLists = new Set([
                ...state.deletedListIds,
                ...(window.OrbitSync?.deletedListIds?.() || [])
            ].map(String));
            state.lists = state.lists.filter((list) => !(
                window.OrbitSync?.listIsDeleted?.(list.id, goneLists) || goneLists.has(String(list.id))
            ));
            const goneGroups = new Set([
                ...state.deletedGroupIds,
                ...(window.OrbitSync?.deletedGroupIds?.() || [])
            ].map(String));
            state.groups = state.groups.filter((group) => !(
                window.OrbitSync?.groupIsDeleted?.(group.id, goneGroups) || goneGroups.has(String(group.id))
            ));
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
            if (!state.settings.window) state.settings.window = { width: 34, height: 53 };
            state.settings.window.width = clamp(Number(state.settings.window.width) || 34, 28, 96);
            state.settings.window.height = clamp(Number(state.settings.window.height) || 53, 40, 94);
            state.settings.taskScale = clamp(Number(state.settings.taskScale) || 1, 0.8, 1.5);
            if (!state.bitsParams || typeof state.bitsParams !== 'object') state.bitsParams = {};
            if (!state.wallpaperAdjust || typeof state.wallpaperAdjust !== 'object') state.wallpaperAdjust = {};
            if (!Array.isArray(state.customThemes)) state.customThemes = [];
            state.customThemes.forEach((theme) => {
                if (!theme.name) theme.name = 'Wallpaper';
            });
            if (!state.lists.some((list) => sameId(list.id, state.currentListId))) {
                state.currentListId = state.lists[0]?.id || '';
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
                if (!Number.isFinite(Number(list.sort))) list.sort = 0;
                list.reset = normalizeReset(list);
            });
            readSidebarTree();
            sidebarFocusGroupId = currentList()?.groupId || '';
            state.tasks.forEach((task, index) => {
                if (task.order === undefined) task.order = index;
                if (!task.tags) task.tags = [];
            });
            applyShellSettings();
            saveState({ skipSync: true });
        } catch {
            console.warn('Saved data was unreadable; starting with a fresh list.');
        }
    }

    const fingerprints = new Map();
    let skipListClick = false;
    let sidebarFocusGroupId = '';

    function itemFingerprint(item) {
        if (!item || typeof item !== 'object') return '';
        const copy = { ...item };
        delete copy.updatedAt;
        return JSON.stringify(copy);
    }

    function rememberFingerprints() {
        fingerprints.clear();
        [...(state.lists || []), ...(state.tasks || []), ...(state.tags || []), ...(state.groups || [])].forEach((item) => {
            if (item?.id) fingerprints.set(String(item.id), itemFingerprint(item));
        });
    }

    function stampDirtyItems() {
        const now = new Date().toISOString();
        const mark = (items) => {
            (items || []).forEach((item) => {
                if (!item?.id) return;
                const key = String(item.id);
                const fp = itemFingerprint(item);
                if (fingerprints.get(key) !== fp) {
                    item.updatedAt = now;
                    fingerprints.set(key, itemFingerprint(item));
                }
            });
        };
        mark(state.lists);
        mark(state.tasks);
        mark(state.tags);
        mark(state.groups);
    }

    function saveState(options = {}) {
        writeSidebarTree();
        if (options.skipSync) rememberFingerprints();
        else stampDirtyItems();
        try {
            writeLocalState();
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
        listTitle.replaceChildren();

        const inviteBtn = document.getElementById('header-invite-btn');
        if (!list) {
            const title = document.createElement('span');
            title.className = 'header-title-input gradient-text no-list-title';
            title.textContent = 'Currently no list';
            listTitle.append(title);
            currentDateEl.textContent = 'Use + New List in the sidebar';
            if (inviteBtn) inviteBtn.hidden = true;
            return;
        }

        const titleText = list.name;
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
            if (titleInput.value.trim()) {
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
        if (inviteBtn) inviteBtn.hidden = document.getElementById('cloud-actions')?.hidden || list.role === 'editor';
    }

    function groupParentId(group) {
        const parent = String(group?.parentId || '');
        if (!parent || sameId(parent, group?.id)) return '';
        if (!(state.groups || []).some((item) => sameId(item.id, parent))) return '';
        return parent;
    }

    function isInsideGroup(nodeId, ancestorId) {
        let current = String(nodeId || '');
        const seen = new Set();
        while (current) {
            if (sameId(current, ancestorId)) return true;
            if (seen.has(current)) return false;
            seen.add(current);
            const group = (state.groups || []).find((item) => sameId(item.id, current));
            current = groupParentId(group);
        }
        return false;
    }

    function readSidebarTree() {
        const tree = state.settings?.sidebarTree || { groups: {}, lists: {} };
        (state.groups || []).forEach((group, index) => {
            const meta = tree.groups?.[String(group.id)] || {};
            group.parentId = String(meta.parentId || '');
            group.collapsed = Boolean(meta.collapsed);
            group.sort = Number.isFinite(Number(meta.sort)) ? Number(meta.sort) : (Number(group.sort) || index);
        });
        (state.lists || []).forEach((list, index) => {
            const meta = tree.lists?.[String(list.id)] || {};
            if (!list.groupId) list.groupId = '';
            list.sort = Number.isFinite(Number(meta.sort)) ? Number(meta.sort) : (Number(list.sort) || index);
        });
        (state.groups || []).forEach((group) => {
            if (isInsideGroup(group.parentId, group.id)) group.parentId = '';
            group.parentId = groupParentId(group);
        });
    }

    function writeSidebarTree() {
        if (!state.settings) state.settings = {};
        const groups = {};
        const lists = {};
        (state.groups || []).forEach((group) => {
            groups[String(group.id)] = {
                parentId: String(group.parentId || ''),
                collapsed: Boolean(group.collapsed),
                sort: Number(group.sort) || 0
            };
        });
        (state.lists || []).forEach((list) => {
            lists[String(list.id)] = { sort: Number(list.sort) || 0 };
        });
        state.settings.sidebarTree = { groups, lists };
    }

    function treeChildren(parentId) {
        const pid = String(parentId || '');
        const knownGroups = new Set((state.groups || []).map((group) => String(group.id)));
        const groups = (state.groups || [])
            .filter((group) => groupParentId(group) === pid)
            .map((group) => ({ kind: 'group', item: group, sort: Number(group.sort) || 0, name: group.name || '' }));
        const lists = (state.lists || [])
            .filter((list) => {
                const gid = String(list.groupId || '');
                if (!pid) return !gid || !knownGroups.has(gid);
                return sameId(gid, pid);
            })
            .map((list) => ({ kind: 'list', item: list, sort: Number(list.sort) || 0, name: list.name || '' }));
        return [...groups, ...lists].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
    }

    function nextTreeSort(parentId) {
        const kids = treeChildren(parentId);
        return kids.length ? Math.max(...kids.map((node) => Number(node.sort) || 0)) + 1 : 0;
    }

    function expandGroupPath(groupId) {
        let current = String(groupId || '');
        const seen = new Set();
        while (current) {
            const group = (state.groups || []).find((item) => sameId(item.id, current));
            if (!group || seen.has(current)) break;
            seen.add(current);
            group.collapsed = false;
            current = groupParentId(group);
        }
    }

    function revealSidebarItem(selector) {
        setSidebarOpen(true);
        renderSidebar();
        requestAnimationFrame(() => {
            const el = listsNav.querySelector(selector);
            if (!el) return;
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            el.classList.add('sidebar-flash');
            el.addEventListener('animationend', () => el.classList.remove('sidebar-flash'), { once: true });
        });
    }

    function cloneJson(value) {
        return JSON.parse(JSON.stringify(value));
    }

    const TRASH_MAX = 5;

    function trashItems() {
        if (!Array.isArray(state.settings.trash)) state.settings.trash = [];
        return state.settings.trash;
    }

    function pushTrash(entry) {
        const next = [entry, ...trashItems().filter((item) => item?.id !== entry.id)];
        state.settings.trash = next.slice(0, TRASH_MAX);
    }

    function snapshotDeletedList(list) {
        return {
            id: uid('trash_'),
            kind: 'list',
            deletedAt: new Date().toISOString(),
            name: list.name,
            list: cloneJson(list),
            tasks: state.tasks.filter((task) => sameId(task.listId, list.id)).map(cloneJson)
        };
    }

    function snapshotDeletedGroup(group) {
        return {
            id: uid('trash_'),
            kind: 'group',
            deletedAt: new Date().toISOString(),
            name: group.name,
            group: cloneJson(group),
            childListIds: state.lists.filter((list) => sameId(list.groupId, group.id)).map((list) => String(list.id)),
            childGroupIds: state.groups.filter((item) => sameId(item.parentId, group.id)).map((item) => String(item.id))
        };
    }

    function formatTrashWhen(iso) {
        const time = Date.parse(iso);
        if (!Number.isFinite(time)) return 'Recently';
        return new Date(time).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }

    function renderTrash() {
        const root = document.getElementById('trash-list');
        const emptyBtn = document.getElementById('empty-history-btn');
        if (!root) return;
        const items = trashItems();
        root.replaceChildren();
        if (emptyBtn) emptyBtn.hidden = !items.length;
        if (!items.length) {
            const empty = document.createElement('p');
            empty.className = 'trash-empty';
            empty.textContent = 'No deleted lists or groups yet.';
            root.appendChild(empty);
            return;
        }
        items.forEach((entry) => {
            const row = document.createElement('div');
            row.className = 'trash-row';
            const kind = entry.kind === 'group' ? 'Group' : 'List';
            const extra = entry.kind === 'list' && Array.isArray(entry.tasks)
                ? ` · ${entry.tasks.length} task${entry.tasks.length === 1 ? '' : 's'}`
                : '';
            row.innerHTML = `
                <div>
                    <strong>${escapeHtml(entry.name || kind)}</strong>
                    <span>${kind}${extra} · ${escapeHtml(formatTrashWhen(entry.deletedAt))}</span>
                </div>
            `;
            const restore = document.createElement('button');
            restore.type = 'button';
            restore.textContent = 'Restore';
            restore.addEventListener('click', () => restoreTrash(entry.id));
            row.appendChild(restore);
            root.appendChild(row);
        });
    }

    function restoreTrash(entryId) {
        const items = trashItems();
        const index = items.findIndex((item) => item?.id === entryId);
        if (index === -1) return;
        const [entry] = items.splice(index, 1);
        state.settings.trash = items;
        if (entry.kind === 'group' && entry.group) {
            window.OrbitSync?.forgetDeletedGroup?.(entry.group.id);
            if (!Array.isArray(state.groups)) state.groups = [];
            if (!state.groups.some((group) => sameId(group.id, entry.group.id))) {
                const parent = String(entry.group.parentId || '');
                if (parent && !state.groups.some((group) => sameId(group.id, parent))) {
                    entry.group.parentId = '';
                }
                state.groups.push(entry.group);
            }
            (entry.childListIds || []).forEach((id) => {
                const list = state.lists.find((item) => sameId(item.id, id));
                if (list) list.groupId = entry.group.id;
            });
            (entry.childGroupIds || []).forEach((id) => {
                const group = state.groups.find((item) => sameId(item.id, id));
                if (group) group.parentId = entry.group.id;
            });
            sidebarFocusGroupId = entry.group.id;
            expandGroupPath(entry.group.id);
            saveState();
            renderSidebar();
            revealSidebarItem(`.list-group-header[data-group-id="${CSS.escape(String(entry.group.id))}"]`);
            renderTrash();
            showNotice(`Restored group "${entry.name}".`);
            return;
        }
        if (entry.kind === 'list' && entry.list) {
            const list = entry.list;
            if (state.lists.some((item) => sameId(item.id, list.id))) {
                renderTrash();
                showNotice('That list is already here.');
                return;
            }
            if (list.groupId && !state.groups.some((group) => sameId(group.id, list.groupId))) {
                list.groupId = '';
            }
            window.OrbitSync?.forgetDeleted?.(list.id);
            if (isHomeList(list.id)) window.OrbitSync?.forgetDeleted?.('default');
            state.lists.push(list);
            (entry.tasks || []).forEach((task) => {
                if (!state.tasks.some((item) => sameId(item.id, task.id))) state.tasks.push(task);
            });
            state.currentListId = list.id;
            sidebarFocusGroupId = list.groupId || '';
            expandGroupPath(list.groupId);
            applyTheme(list.theme || DEFAULT_THEME);
            saveState();
            renderSidebar();
            renderHeader();
            renderTodos();
            refreshCalendarMarkers();
            revealSidebarItem(`.list-item[data-list-id="${CSS.escape(String(list.id))}"]`);
            renderTrash();
            showNotice(`Restored list "${entry.name}".`);
        }
    }

    async function emptyTrash() {
        if (!trashItems().length) return;
        const confirmed = await showConfirm('Empty history? You will not be able to restore these lists or groups.');
        if (!confirmed) return;
        state.settings.trash = [];
        saveState({ skipSync: true });
        renderTrash();
        showNotice('History emptied.');
    }

    function focusedGroupId() {
        if ((state.groups || []).some((group) => sameId(group.id, sidebarFocusGroupId))) {
            return String(sidebarFocusGroupId);
        }
        const list = currentList();
        const gid = String(list?.groupId || '');
        return (state.groups || []).some((group) => sameId(group.id, gid)) ? gid : '';
    }

    function renderListRow(list, depth) {
        const li = document.createElement('li');
        li.className = `list-item${sameId(list.id, state.currentListId) ? ' active' : ''}${depth ? ' in-group' : ''}`;
        li.style.setProperty('--depth', String(depth || 0));
        li.dataset.listId = String(list.id);
        li.dataset.kind = 'list';
        li.dataset.id = String(list.id);
        li.dataset.parent = String(list.groupId || '');
        li.dataset.depth = String(depth || 0);
        const sharedMark = list.role === 'editor' ? ' <span class="list-shared">shared</span>' : '';
        li.innerHTML = `
            <div class="list-info">
                <span class="tree-indent" aria-hidden="true"></span>
                <span class="list-drag-handle" aria-hidden="true">⋮⋮</span>
                <span class="list-dot" style="background-color: ${escapeHtml(list.color || DEFAULT_ACCENT)};"></span>
                <span class="list-name">${escapeHtml(list.name)}${sharedMark}</span>
            </div>
            <div class="list-actions">
                <button type="button" class="btn-icon-small list-edit-btn settings-list-btn" title="Edit list" aria-label="Edit list">Edit</button>
                <button type="button" class="btn-icon-small delete-list-btn" title="${list.role === 'editor' ? 'Leave list' : 'Delete'}" aria-label="${list.role === 'editor' ? 'Leave list' : 'Delete list'}">×</button>
            </div>
        `;

        li.addEventListener('click', (e) => {
            if (e.target.closest('.btn-icon-small, .list-drag-handle')) return;
            if (skipListClick) {
                skipListClick = false;
                return;
            }
            state.currentListId = list.id;
            sidebarFocusGroupId = list.groupId || '';
            applyTheme(list.theme || DEFAULT_THEME);
            saveState();
            renderSidebar();
            renderHeader();
            renderTodos();
            if (isPhoneLayout() || document.body.classList.contains('orbit-mobile')) setSidebarOpen(false);
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
                if (!leaving) pushTrash(snapshotDeletedList(list));
                window.OrbitSync?.rememberDeleted?.(list.id);
                if (isHomeList(list.id)) window.OrbitSync?.rememberDeleted?.('default');
                window.OrbitSync?.noteLocalDelete?.(list.id);
                if (!Array.isArray(state.deletedListIds)) state.deletedListIds = [];
                state.deletedListIds.push(String(list.id));
                state.lists = state.lists.filter((item) => !sameId(item.id, list.id));
                if (!leaving) state.tasks = state.tasks.filter((task) => !sameId(task.listId, list.id));
                if (sameId(state.currentListId, list.id)) {
                    state.currentListId = state.lists[0]?.id || '';
                    applyTheme(currentList()?.theme || DEFAULT_THEME);
                }
                saveState();
                renderSidebar();
                renderHeader();
                renderTodos();
                refreshCalendarMarkers();
                try {
                    if (leaving) await window.OrbitSync?.leaveList(list.id);
                    else await window.OrbitSync?.removeList(list.id);
                    await window.OrbitSync?.pushNow?.();
                } catch {
                    /* tombstone keeps it from coming back until cloud delete lands */
                }
            });
        }
        bindTreeDrag(li);
        return li;
    }

    function renderGroupRow(group, depth) {
        const collapsed = Boolean(group.collapsed);
        const header = document.createElement('li');
        header.className = `list-group-header${collapsed ? ' is-collapsed' : ' is-expanded'}${sameId(sidebarFocusGroupId, group.id) ? ' is-focused' : ''}`;
        header.style.setProperty('--depth', String(depth || 0));
        header.dataset.groupId = String(group.id);
        header.dataset.kind = 'group';
        header.dataset.id = String(group.id);
        header.dataset.parent = groupParentId(group);
        header.dataset.depth = String(depth || 0);
        header.dataset.expanded = collapsed ? 'false' : 'true';
        header.innerHTML = `
            <div class="tree-row">
                <span class="tree-indent" aria-hidden="true"></span>
                <span class="list-drag-handle" aria-hidden="true">⋮⋮</span>
                <span class="tree-chevron" aria-hidden="true">${collapsed ? '>' : 'v'}</span>
                <span class="tree-name">${escapeHtml(group.name)}</span>
            </div>
            <button type="button" class="btn-icon-small delete-group-btn" title="Remove group" aria-label="Remove group">×</button>
        `;
        header.addEventListener('click', (e) => {
            if (e.target.closest('.btn-icon-small, .list-drag-handle')) return;
            if (skipListClick) {
                skipListClick = false;
                return;
            }
            group.collapsed = !group.collapsed;
            sidebarFocusGroupId = group.id;
            saveState();
            renderSidebar();
        });
        header.querySelector('.delete-group-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            const confirmed = await showConfirm(`Remove group "${group.name}"? Lists and groups inside stay, they just move up one level.`);
            if (!confirmed) return;
            pushTrash(snapshotDeletedGroup(group));
            window.OrbitSync?.rememberDeletedGroup?.(group.id);
            window.OrbitSync?.noteLocalDelete?.(group.id, 'group');
            if (!Array.isArray(state.deletedGroupIds)) state.deletedGroupIds = [];
            state.deletedGroupIds.push(String(group.id));
            const parent = groupParentId(group);
            state.lists.forEach((list) => {
                if (sameId(list.groupId, group.id)) list.groupId = parent;
            });
            state.groups.forEach((item) => {
                if (sameId(item.parentId, group.id)) item.parentId = parent;
            });
            state.groups = state.groups.filter((item) => !sameId(item.id, group.id));
            if (sameId(sidebarFocusGroupId, group.id)) sidebarFocusGroupId = parent;
            saveState();
            renderSidebar();
            try { await window.OrbitSync?.pushNow?.(); } catch { /* tombstone keeps it gone */ }
        });
        bindTreeDrag(header);
        return header;
    }

    function appendTree(parentId, depth) {
        treeChildren(parentId).forEach((node) => {
            if (node.kind === 'group') {
                listsNav.appendChild(renderGroupRow(node.item, depth));
                if (!node.item.collapsed) appendTree(node.item.id, depth + 1);
            } else {
                listsNav.appendChild(renderListRow(node.item, depth));
            }
        });
    }

    function renderSidebar() {
        listsNav.replaceChildren();
        appendTree('', 0);
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
        if (taskDragActive) return;
        sweepOrphanTodos();
        const noList = !currentList();
        const emptyCopy = emptyState.querySelector('p');
        const emptyHint = emptyState.querySelector('span');
        todoInput.disabled = noList;
        addBtn.disabled = noList;
        todoInput.placeholder = noList ? 'Create a list first' : "What's on your mind?";

        if (noList) {
            todoList.replaceChildren();
            todoList.hidden = true;
            emptyState.hidden = false;
            if (emptyCopy) emptyCopy.textContent = 'Currently no list';
            if (emptyHint) emptyHint.textContent = 'Add a list from the sidebar, or pick a template in Settings.';
            updateCount([]);
            return;
        }

        if (emptyCopy) emptyCopy.textContent = 'Nothing here yet';
        if (emptyHint) emptyHint.textContent = 'Add a task, or try a template in Settings.';

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
        if (!currentList()) {
            showNotice('Create a list first.');
            return;
        }

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
        window.OrbitSync?.rememberDeletedTask?.(removed.id);
        window.OrbitSync?.noteLocalDelete?.(removed.id, 'task');
        saveState();
        renderTodos();
        refreshCalendarMarkers();
        showUndo('Task deleted', () => {
            window.OrbitSync?.forgetDeletedTask?.(removed.id);
            state.tasks.splice(index, 0, removed);
            saveState();
            renderTodos();
            refreshCalendarMarkers();
        });
        void window.OrbitSync?.pushNow?.();
    }

    async function addNewList() {
        const listName = await showInput('Enter new list name:', 'My New List');
        if (!listName) return;
        const groupId = focusedGroupId();
        const newList = {
            id: uid('list_'),
            name: listName,
            icon: '📋',
            theme: DEFAULT_THEME,
            color: DEFAULT_ACCENT,
            resetFrequency: 'none',
            reset: { type: 'none' },
            groupId,
            sort: nextTreeSort(groupId),
            role: 'owner'
        };
        state.lists.push(newList);
        state.currentListId = newList.id;
        sidebarFocusGroupId = groupId;
        expandGroupPath(groupId);
        applyTheme(DEFAULT_THEME);
        saveState();
        renderHeader();
        renderTodos();
        revealSidebarItem(`.list-item[data-list-id="${CSS.escape(String(newList.id))}"]`);
    }

    async function addNewGroup() {
        const name = await showInput('New group name:', 'School');
        if (!name) return;
        if (!Array.isArray(state.groups)) state.groups = [];
        const parentId = focusedGroupId();
        const group = {
            id: uid('group_'),
            name,
            parentId,
            collapsed: false,
            sort: nextTreeSort(parentId),
            updatedAt: new Date().toISOString()
        };
        state.groups.push(group);
        sidebarFocusGroupId = group.id;
        expandGroupPath(parentId);
        saveState();
        revealSidebarItem(`.list-group-header[data-group-id="${CSS.escape(String(group.id))}"]`);
    }

    function collapseAddNewMenu() {
        const menu = document.getElementById('add-new-menu');
        const btn = document.getElementById('add-new-btn');
        if (!menu || !btn) return;
        const phone = document.body.classList.contains('orbit-mobile')
            || window.matchMedia('(max-width: 768px)').matches;
        if (!phone) return;
        menu.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
    }

    function measureTreeTops(exclude) {
        const map = new Map();
        [...listsNav.children].forEach((el) => {
            if (el === exclude || el.hidden) return;
            map.set(el, el.getBoundingClientRect().top);
        });
        return map;
    }

    function playTreeFlip(first, exclude) {
        if (!canAnimateReorder()) return;
        [...listsNav.children].forEach((el) => {
            if (el === exclude || el.hidden) return;
            const last = el.getBoundingClientRect().top;
            const prev = first.get(el);
            if (prev == null) return;
            const invert = prev - last;
            if (Math.abs(invert) < 1) return;
            el.style.transition = 'none';
            el.style.transform = `translateY(${invert}px)`;
            el.getBoundingClientRect();
            el.style.transition = 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)';
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

    function pinDragGhost(el, clientX, clientY, grabX, grabY) {
        el.style.left = `${clientX - grabX}px`;
        el.style.top = `${clientY - grabY}px`;
    }

    function liftDragGhost(el, width) {
        document.body.appendChild(el);
        el.style.width = `${width}px`;
        el.style.position = 'fixed';
        el.style.zIndex = '400';
        el.style.margin = '0';
        el.style.pointerEvents = 'none';
        el.style.boxSizing = 'border-box';
        el.style.maxWidth = 'none';
    }

    let taskDragActive = false;

    function sweepOrphanTodos(keep) {
        document.querySelectorAll('body > .todo-item').forEach((el) => {
            if (el !== keep && !todoList.contains(el)) el.remove();
        });
    }

    function clearTodoMotion(el) {
        if (!el) return;
        el.style.transition = '';
        el.style.transform = '';
        el.style.top = '';
        el.style.left = '';
        el.style.width = '';
        el.style.position = '';
        el.style.zIndex = '';
        el.style.margin = '';
        el.style.pointerEvents = '';
        el.style.boxSizing = '';
        el.style.maxWidth = '';
        el.style.boxShadow = '';
        el.removeAttribute('style');
        el.classList.remove('dragging');
    }

    function bindTreeDrag(row) {
        const handle = row.querySelector('.list-drag-handle');
        if (!handle) return;
        handle.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            startSidebarTreeDrag(row, handle, e);
        });
    }

    function startSidebarTreeDrag(item, handle, event) {
        const kind = item.dataset.kind;
        const id = item.dataset.id;
        if (!kind || !id) return;
        handle.setPointerCapture?.(event.pointerId);
        const rect = item.getBoundingClientRect();
        const offsetY = event.clientY - rect.top;
        const offsetX = event.clientX - rect.left;
        const placeholder = document.createElement('li');
        placeholder.className = 'tree-placeholder';
        placeholder.style.height = `${rect.height}px`;
        placeholder.setAttribute('aria-hidden', 'true');

        const hidden = [];
        if (kind === 'group') {
            [...listsNav.children].forEach((row) => {
                if (row === item) return;
                if (isInsideGroup(row.dataset.parent, id) || isInsideGroup(row.dataset.id, id)) {
                    row.hidden = true;
                    hidden.push(row);
                }
            });
        }

        let moved = false;
        let lastX = event.clientX;
        let lastY = event.clientY;
        let dragging = true;
        let settled = false;
        let scrollRaf = 0;

        const treeRows = () => [...listsNav.children].filter((el) => (
            el !== item && el !== placeholder && !el.hidden
        ));

        const movePlaceholder = (clientX, clientY) => {
            listsNav.querySelectorAll('.drop-into').forEach((el) => el.classList.remove('drop-into'));
            const over = document.elementFromPoint(clientX, clientY)?.closest('.list-group-header, .list-item');
            if (over && over !== item && over.dataset.kind === 'group' && !(kind === 'group' && (sameId(over.dataset.id, id) || isInsideGroup(over.dataset.id, id)))) {
                const box = over.getBoundingClientRect();
                const t = (clientY - box.top) / Math.max(box.height, 1);
                if (t > 0.22 && t < 0.78) over.classList.add('drop-into');
            }
            const nodes = treeRows();
            const before = nodes.find((el) => {
                const box = el.getBoundingClientRect();
                return clientY < box.top + box.height / 2;
            });
            if (before && placeholder.nextElementSibling === before) return;
            if (!before && listsNav.lastElementChild === placeholder) return;
            const first = measureTreeTops(item);
            if (before) listsNav.insertBefore(placeholder, before);
            else listsNav.appendChild(placeholder);
            playTreeFlip(first, item);
        };

        const lift = () => {
            if (moved) return;
            moved = true;
            item.after(placeholder);
            item.classList.add('dragging');
            listsNav.classList.add('is-sorting');
            liftDragGhost(item, rect.width);
            pinDragGhost(item, event.clientX, event.clientY, offsetX, offsetY);
            item.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.45)';
        };

        const tickScroll = () => {
            if (!dragging) return;
            const box = listsNav.getBoundingClientRect();
            const edge = 48;
            let delta = 0;
            if (lastY < box.top + edge) delta = -Math.max(2, (box.top + edge - lastY) * 0.16);
            else if (lastY > box.bottom - edge) delta = Math.max(2, (lastY - (box.bottom - edge)) * 0.16);
            if (delta) {
                listsNav.scrollTop += delta;
                if (moved) movePlaceholder(lastX, lastY);
            }
            scrollRaf = requestAnimationFrame(tickScroll);
        };

        const onMove = (ev) => {
            lastX = ev.clientX;
            lastY = ev.clientY;
            if (!moved && Math.hypot(ev.clientX - event.clientX, ev.clientY - event.clientY) < 6) return;
            lift();
            pinDragGhost(item, ev.clientX, ev.clientY, offsetX, offsetY);
            movePlaceholder(ev.clientX, ev.clientY);
        };

        const destParentFromDom = () => {
            const into = listsNav.querySelector('.list-group-header.drop-into');
            if (into?.dataset.id && !(kind === 'group' && (sameId(into.dataset.id, id) || isInsideGroup(into.dataset.id, id)))) {
                return { parent: String(into.dataset.id), append: true };
            }
            let prev = placeholder.previousElementSibling;
            while (prev && (prev === item || prev.hidden)) prev = prev.previousElementSibling;
            if (!prev) return { parent: '', append: false };
            if (prev.dataset.kind === 'group' && prev.dataset.expanded === 'true' && !(kind === 'group' && sameId(prev.dataset.id, id))) {
                return { parent: String(prev.dataset.id), append: false };
            }
            return { parent: String(prev.dataset.parent || ''), append: false };
        };

        const destIndexFromDom = (parent, append) => {
            if (append) {
                return treeChildren(parent).filter((node) => !(node.kind === kind && sameId(node.item.id, id))).length;
            }
            let index = 0;
            let seen = false;
            [...listsNav.children].forEach((row) => {
                if (row === item || row.hidden) return;
                if (row === placeholder) {
                    seen = true;
                    return;
                }
                if (!seen && String(row.dataset.parent || '') === String(parent || '')) index += 1;
            });
            return index;
        };

        const moveTreeNode = (destParent, destIndex) => {
            const group = kind === 'group' ? (state.groups || []).find((item) => sameId(item.id, id)) : null;
            const list = kind === 'list' ? (state.lists || []).find((item) => sameId(item.id, id)) : null;
            if (!group && !list) return;
            const oldParent = kind === 'group' ? groupParentId(group) : String(list.groupId || '');
            if (kind === 'group' && (sameId(id, destParent) || isInsideGroup(destParent, id))) {
                destParent = oldParent;
            }
            if (kind === 'group') group.parentId = destParent;
            else list.groupId = destParent;
            const nodes = treeChildren(destParent).filter((node) => !(node.kind === kind && sameId(node.item.id, id)));
            nodes.splice(Math.max(0, Math.min(destIndex, nodes.length)), 0, { kind, item: group || list, sort: 0, name: '' });
            nodes.forEach((node, index) => {
                node.item.sort = index;
            });
            if (oldParent !== destParent) {
                treeChildren(oldParent).forEach((node, index) => {
                    node.item.sort = index;
                });
            }
        };

        const finish = () => {
            if (settled) return;
            settled = true;
            dragging = false;
            cancelAnimationFrame(scrollRaf);
            handle.releasePointerCapture?.(event.pointerId);
            document.removeEventListener('pointermove', onMove, true);
            document.removeEventListener('pointerup', end, true);
            document.removeEventListener('pointercancel', end, true);
            hidden.forEach((row) => { row.hidden = false; });
            listsNav.querySelectorAll('.drop-into').forEach((el) => el.classList.remove('drop-into'));
            if (!moved) {
                item.removeAttribute('style');
                item.classList.remove('dragging');
                listsNav.classList.remove('is-sorting');
                placeholder.remove();
                return;
            }
            skipListClick = true;
            const dest = destParentFromDom();
            moveTreeNode(dest.parent, destIndexFromDom(dest.parent, dest.append));
            if (kind === 'list') sidebarFocusGroupId = dest.parent;
            else sidebarFocusGroupId = id;
            expandGroupPath(dest.parent);
            item.remove();
            placeholder.remove();
            listsNav.classList.remove('is-sorting');
            saveState();
            renderSidebar();
        };

        const end = () => finish();
        document.addEventListener('pointermove', onMove, true);
        document.addEventListener('pointerup', end, true);
        document.addEventListener('pointercancel', end, true);
        scrollRaf = requestAnimationFrame(tickScroll);
    }

    async function clearCompleted() {
        const tasks = visibleTasks().filter((task) => task.completed);
        if (!tasks.length) return;

        const confirmed = await showConfirm(`Clear ${tasks.length} completed task${tasks.length !== 1 ? 's' : ''}?`);
        if (!confirmed) return;

        const ids = new Set(tasks.map((task) => String(task.id)));
        state.tasks = state.tasks.filter((task) => !ids.has(String(task.id)));
        window.OrbitSync?.rememberDeletedTask?.([...ids]);
        window.OrbitSync?.noteLocalDelete?.([...ids], 'task');
        saveState();
        renderTodos();
        refreshCalendarMarkers();
        void window.OrbitSync?.pushNow?.();
    }

    function bindPointerReorder(item) {
        const handle = item.querySelector('.drag-handle');
        handle.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 || taskDragActive) return;
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
        const pointerId = event.pointerId;
        const rect = item.getBoundingClientRect();
        const grabX = event.clientX - rect.left;
        const grabY = event.clientY - rect.top;
        const placeholder = document.createElement('li');
        placeholder.className = 'todo-placeholder';
        placeholder.style.height = `${rect.height}px`;
        placeholder.setAttribute('aria-hidden', 'true');

        let lastY = event.clientY;
        let dragging = true;
        let lifted = false;
        let settled = false;
        let scrollRaf = 0;
        taskDragActive = true;

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

        const lift = () => {
            if (lifted) return;
            lifted = true;
            item.after(placeholder);
            item.classList.add('dragging');
            todoList.classList.add('is-sorting');
            liftDragGhost(item, rect.width);
            pinDragGhost(item, event.clientX, event.clientY, grabX, grabY);
        };

        const tickScroll = () => {
            if (!dragging) return;
            const box = todoList.getBoundingClientRect();
            const edge = 56;
            let delta = 0;
            if (lastY < box.top + edge) delta = -Math.max(3, (box.top + edge - lastY) * 0.18);
            else if (lastY > box.bottom - edge) delta = Math.max(3, (lastY - (box.bottom - edge)) * 0.18);
            if (delta && lifted) {
                todoList.scrollTop += delta;
                movePlaceholder(lastY);
            }
            scrollRaf = requestAnimationFrame(tickScroll);
        };

        const onMove = (ev) => {
            if (ev.pointerId !== pointerId) return;
            lastY = ev.clientY;
            if (!lifted && Math.hypot(ev.clientX - event.clientX, ev.clientY - event.clientY) < 6) return;
            lift();
            pinDragGhost(item, ev.clientX, ev.clientY, grabX, grabY);
            movePlaceholder(ev.clientY);
        };

        const finish = () => {
            if (settled) return;
            settled = true;
            dragging = false;
            cancelAnimationFrame(scrollRaf);
            document.removeEventListener('pointermove', onMove, true);
            document.removeEventListener('pointerup', end, true);
            document.removeEventListener('pointercancel', end, true);
            try { handle.releasePointerCapture?.(pointerId); } catch { /* ignore */ }

            const drop = () => {
                [...todoList.children].forEach((el) => {
                    if (el === placeholder) return;
                    el.style.transition = '';
                    el.style.transform = '';
                });
                clearTodoMotion(item);
                if (placeholder.parentNode) placeholder.replaceWith(item);
                else if (!todoList.contains(item)) todoList.appendChild(item);
                placeholder.remove();
                todoList.classList.remove('is-sorting');
                taskDragActive = false;
                sweepOrphanTodos(item);
                if (lifted) updateTaskOrder();
            };

            drop();
        };

        const end = (ev) => {
            if (ev && ev.pointerId !== pointerId) return;
            finish();
        };

        document.addEventListener('pointermove', onMove, true);
        document.addEventListener('pointerup', end, true);
        document.addEventListener('pointercancel', end, true);
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
            const addGroupOptions = (parentId, depth) => {
                treeChildren(parentId).forEach((node) => {
                    if (node.kind !== 'group') return;
                    const option = document.createElement('option');
                    option.value = node.item.id;
                    option.textContent = `${depth ? `${'  '.repeat(depth)}` : ''}${node.item.name}`;
                    if (sameId(node.item.id, list.groupId)) option.selected = true;
                    groupSelect.appendChild(option);
                    addGroupOptions(node.item.id, depth + 1);
                });
            };
            addGroupOptions('', 0);
        }
        const shareGroup = document.getElementById('share-list-group');
        if (shareGroup) shareGroup.hidden = list.role === 'editor' || list.sync === false;
        const listSync = document.getElementById('list-sync-toggle');
        if (listSync) {
            listSync.checked = list.sync !== false;
            listSync.disabled = list.role === 'editor';
        }
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
            const listSync = document.getElementById('list-sync-toggle');
            if (listSync && list.role !== 'editor') list.sync = listSync.checked;
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
        renderWallpaperQuota();
        void backfillWallpaperBytes();
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
    const MEDIA_DB_FALLBACK = 'orbit_mobile_media';
    const MEDIA_STORE = 'wallpapers';

    function openMediaDb(name = MEDIA_DB) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(name, 1);
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

    async function wallpaperGetFrom(name, id) {
        try {
            const db = await openMediaDb(name);
            return await new Promise((resolve, reject) => {
                const request = db.transaction(MEDIA_STORE, 'readonly').objectStore(MEDIA_STORE).get(id);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            });
        } catch {
            return null;
        }
    }

    async function wallpaperGet(id) {
        return (await wallpaperGetFrom(MEDIA_DB, id)) || (await wallpaperGetFrom(MEDIA_DB_FALLBACK, id));
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

    function dataUrlBytes(dataUrl) {
        const body = String(dataUrl || '').split(',')[1] || '';
        if (!body) return 0;
        const pad = body.endsWith('==') ? 2 : body.endsWith('=') ? 1 : 0;
        return Math.max(0, Math.floor(body.length * 3 / 4) - pad);
    }

    function formatStorageBytes(bytes) {
        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
        return `${bytes} B`;
    }

    function wallpaperQuotaNow(extraBytes = 0, extraCount = 0) {
        if (window.OrbitSync?.wallpaperQuota) {
            return window.OrbitSync.wallpaperQuota(state.customThemes, extraBytes, extraCount);
        }
        const maxCount = 8;
        const maxBytes = 10 * 1024 * 1024;
        const count = (state.customThemes || []).length + extraCount;
        const used = (state.customThemes || []).reduce((sum, theme) => sum + (Number(theme.bytes) || 0), 0) + extraBytes;
        return { count, bytes: used, maxCount, maxBytes, ok: count <= maxCount && used <= maxBytes };
    }

    function renderWallpaperQuota() {
        const el = document.getElementById('wallpaper-quota');
        if (!el) return;
        const quota = wallpaperQuotaNow();
        el.textContent = `${quota.count} / ${quota.maxCount} photos · ${formatStorageBytes(quota.bytes)} / ${formatStorageBytes(quota.maxBytes)}. Sign in to sync these across devices.`;
    }

    let wallpaperByteFill = false;
    async function backfillWallpaperBytes() {
        if (wallpaperByteFill) return;
        wallpaperByteFill = true;
        let changed = false;
        for (const theme of state.customThemes || []) {
            if (Number(theme.bytes) > 0) continue;
            try {
                const dataUrl = await wallpaperGet(theme.id);
                if (!dataUrl) continue;
                theme.bytes = dataUrlBytes(dataUrl);
                changed = true;
            } catch { /* ignore */ }
        }
        if (changed) {
            saveState();
            renderWallpaperQuota();
        }
    }

    async function handleWallpaperUpload(file) {
        const list = currentList();
        if (!list || !file) return;
        if (!file.type.startsWith('image/')) {
            setWallpaperStatus('Please choose an image file.');
            return;
        }
        const countCheck = wallpaperQuotaNow(0, 1);
        if (!countCheck.ok && countCheck.count > countCheck.maxCount) {
            setWallpaperStatus(`You can save ${countCheck.maxCount} photos per account.`);
            return;
        }
        setWallpaperStatus('Optimizing wallpaper…');
        try {
            const suggested = file.name.replace(/\.[^.]+$/, '').slice(0, 32) || 'Wallpaper';
            const named = await showInput('Name this wallpaper', 'e.g. Night sky', suggested);
            const dataUrl = await compressImage(file);
            const bytes = dataUrlBytes(dataUrl);
            const quota = wallpaperQuotaNow(bytes, 1);
            if (!quota.ok) {
                if (quota.count > quota.maxCount) {
                    setWallpaperStatus(`You can save ${quota.maxCount} photos per account.`);
                } else {
                    setWallpaperStatus(`That photo would go over ${formatStorageBytes(quota.maxBytes)} of wallpaper storage.`);
                }
                return;
            }
            const id = uid('custom_');
            await wallpaperPut(id, dataUrl);
            try {
                const blob = await (await fetch(dataUrl)).blob();
                await window.OrbitSync?.uploadWallpaper?.(id, blob);
            } catch {
                /* Local save still works; cloud upload retries on the next sync. */
            }
            const custom = {
                id,
                name: (named || suggested).slice(0, 32),
                color: list.color || DEFAULT_ACCENT,
                bytes,
                updatedAt: new Date().toISOString()
            };
            state.customThemes.push(custom);
            list.theme = id;
            saveState();
            await applyTheme(id);
            renderThemeOptions();
            setWallpaperStatus('Wallpaper added. Signed-in accounts sync it across devices.');
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
        try { await window.OrbitSync?.deleteWallpaper?.(themeId); } catch { /* ignore */ }
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

    let appliedThemeId = '';

    function applyTheme(themeId) {
        applyListAccent();
        const nextId = themeId || DEFAULT_THEME;
        if (state.settings.optimizedMode) {
            if (appliedThemeId === 'optimized') {
                renderBitsControls();
                renderWallpaperControls();
                return;
            }
            window.BitsFX?.stop();
            resetBackgroundLayer();
            backgroundLayer.style.backgroundColor = '#050816';
            appliedThemeId = 'optimized';
            renderBitsControls();
            renderWallpaperControls();
            return;
        }

        if (window.BitsFX?.isBitsTheme(nextId)) {
            if (appliedThemeId === nextId) {
                renderBitsControls();
                renderWallpaperControls();
                return;
            }
            resetBackgroundLayer();
            const params = { ...window.BitsFX.getDefaults(nextId), ...(state.bitsParams[nextId] || {}) };
            backgroundLayer.style.backgroundColor = '#050816';
            window.BitsFX.start(nextId, backgroundLayer, params);
            appliedThemeId = nextId;
            renderBitsControls();
            renderWallpaperControls();
            return;
        }

        window.BitsFX?.stop();

        const custom = state.customThemes.find((theme) => theme.id === nextId);
        if (custom || String(nextId).startsWith('custom_')) {
            const showing = /url\(/.test(backgroundLayer.style.backgroundImage || '');
            if (appliedThemeId === nextId && showing) {
                applyWallpaperAdjust(nextId);
                renderBitsControls();
                renderWallpaperControls();
                return;
            }
            if (!showing) {
                resetBackgroundLayer();
                backgroundLayer.style.backgroundColor = '#050816';
            }
            wallpaperGet(nextId).then((dataUrl) => {
                if (currentList()?.theme !== nextId) return;
                if (!dataUrl) return;
                backgroundLayer.style.backgroundColor = '#050816';
                backgroundLayer.style.backgroundImage = `url("${dataUrl}")`;
                backgroundLayer.style.backgroundRepeat = 'no-repeat';
                applyWallpaperAdjust(nextId);
            }).catch(() => {});
            applyWallpaperAdjust(nextId);
            appliedThemeId = nextId;
            renderBitsControls();
            renderWallpaperControls();
            return;
        }

        if (appliedThemeId === nextId) {
            renderBitsControls();
            renderWallpaperControls();
            return;
        }

        resetBackgroundLayer();

        const theme = themes.find((item) => item.id === nextId) || themes[0];
        if (theme.animated) backgroundLayer.classList.add('animate-bg');
        if (String(theme.bg).includes('url(')) {
            backgroundLayer.style.backgroundImage = theme.bg;
            backgroundLayer.style.backgroundRepeat = 'no-repeat';
            applyWallpaperAdjust(nextId);
        } else {
            backgroundLayer.style.backgroundImage = theme.bg;
        }
        appliedThemeId = nextId;
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

    const DEFAULT_WINDOW = { width: 34, height: 53 };
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
        if (enterEditBtn) {
            enterEditBtn.textContent = editMode
                ? 'Done arranging window & widgets'
                : 'Edit window size & widget positions';
        }
        document.querySelectorAll('.js-open-settings').forEach((btn) => {
            btn.setAttribute('aria-label', editMode ? 'Open settings (arranging window and widgets)' : 'Open settings');
        });
    }

    function showSettingsHome() {
        const home = document.getElementById('settings-home');
        if (home) home.hidden = false;
        document.querySelectorAll('.settings-panel').forEach((panel) => {
            panel.hidden = true;
        });
    }

    function openSettingsPanel(id) {
        const home = document.getElementById('settings-home');
        if (home) home.hidden = true;
        document.querySelectorAll('.settings-panel').forEach((panel) => {
            panel.hidden = panel.id !== `settings-panel-${id}`;
        });
        if (id === 'history') renderTrash();
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

    function syncModeValue() {
        const mode = state.settings.syncMode;
        return mode === 'off' || mode === 'live' ? mode : 'push';
    }

    function syncModeHint(mode) {
        if (mode === 'off') return 'This device stays local. Sign in still works. Nothing uploads or downloads.';
        if (mode === 'live') return 'Keeps phone and computer in sync automatically. If a deleted list comes back, switch to Upload only.';
        return 'Sends your changes. Will not pull lists back every few seconds. Tap Sync when you want to download from another device.';
    }

    function applySyncSettingsUi() {
        const mode = syncModeValue();
        document.querySelectorAll('#sync-mode-choices [data-sync-mode]').forEach((btn) => {
            btn.classList.toggle('selected', btn.dataset.syncMode === mode);
        });
        const hint = document.getElementById('sync-mode-hint');
        if (hint) hint.textContent = syncModeHint(mode);
        const lists = document.getElementById('sync-lists');
        const groups = document.getElementById('sync-groups');
        if (lists) lists.checked = state.settings.syncLists !== false;
        if (groups) groups.checked = state.settings.syncGroups !== false;
        const what = document.getElementById('sync-what-group');
        if (what) what.hidden = mode === 'off';
    }

    async function setSyncMode(mode) {
        state.settings.syncMode = mode === 'off' || mode === 'live' ? mode : 'push';
        applySyncSettingsUi();
        saveState({ skipSync: true });
        await window.OrbitSync?.applySyncMode?.();
        if (state.settings.syncMode === 'push') window.OrbitSync?.schedulePush?.();
        refreshAccountUi();
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
        const optimizedBox = document.getElementById('optimized-mode');
        if (optimizedBox) optimizedBox.checked = Boolean(state.settings.optimizedMode);
        applySyncSettingsUi();
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

    function stopClock() {
        clearInterval(clockTimer);
        clockTimer = null;
    }

    function startClock() {
        stopClock();
        if (document.hidden || !state.settings.widgets?.clock) return;
        const face = document.getElementById('widget-clock-face');
        if (!face) return;
        clockTimer = setInterval(() => {
            const next = document.getElementById('widget-clock-face');
            if (next) next.textContent = formatClock(new Date());
        }, state.settings.optimizedMode ? 30000 : 1000);
    }

    function applyPerformanceMode(options = {}) {
        const on = Boolean(state.settings.optimizedMode);
        document.body.classList.toggle('is-optimized', on);
        window.BitsFX?.setSaverMode?.(on);
        const box = document.getElementById('optimized-mode');
        if (box) box.checked = on;
        if (options.skipRestart) return;
        applyTheme(currentList()?.theme || DEFAULT_THEME);
        if (on) {
            window.OrbitPet?.stop();
            startClock();
            return;
        }
        renderWidgets();
    }

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

        startClock();

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
        if (state.settings.optimizedMode || !state.settings.widgets?.pet || !state.settings.pets.length) {
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
        const importModal = document.getElementById('backup-import-modal');
        if (importModal && isModalOpen(importModal)) {
            closeModal(importModal);
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
        refreshAfterBackup();
        if (window.OrbitSync?.user) {
            const user = await window.OrbitSync.user();
            if (user) await window.OrbitSync.pushNow?.();
        }
    }

    function bindBackup() {
        const exportBtn = document.getElementById('backup-export-btn');
        const shareBtn = document.getElementById('backup-share-btn');
        const importInput = document.getElementById('backup-import-input');
        const restoreBtn = document.getElementById('backup-restore-btn');
        const restoreHint = document.getElementById('backup-restore-hint');
        const templateGroup = document.getElementById('template-group');
        const importModal = document.getElementById('backup-import-modal');
        if (!window.OrbitBackup || !exportBtn || !importInput) return;

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

        let pendingImport = null;

        const closeImportModal = () => {
            pendingImport = null;
            if (importModal) closeModal(importModal);
        };

        const selectedBackupIds = () => Array.from(
            document.querySelectorAll('#backup-import-lists input[type="checkbox"]:checked')
        ).map((input) => input.value);

        const openImportPicker = (imported, fileName) => {
            pendingImport = imported;
            const meta = document.getElementById('backup-import-meta');
            const box = document.getElementById('backup-import-lists');
            if (meta) {
                const count = imported.data.lists.length;
                let text = `${fileName || 'Backup'} · ${count} list${count === 1 ? '' : 's'}. Tick the ones you want.`;
                if (imported.exportedAt) {
                    const when = Date.parse(imported.exportedAt);
                    if (Number.isFinite(when)) text += ` Saved ${new Date(when).toLocaleString()}.`;
                }
                meta.textContent = text;
            }
            if (box) {
                box.replaceChildren();
                imported.data.lists.forEach((list) => {
                    const tasks = imported.data.tasks.filter((task) => String(task.listId) === String(list.id)).length;
                    const row = document.createElement('label');
                    row.className = 'check-row';
                    const boxEl = document.createElement('input');
                    boxEl.type = 'checkbox';
                    boxEl.value = String(list.id);
                    boxEl.checked = true;
                    row.append(boxEl, document.createTextNode(` ${list.icon || '📋'} ${list.name} (${tasks})`));
                    box.appendChild(row);
                });
            }
            closeModal(prefsModal);
            if (importModal) openModal(importModal);
        };

        const applySelectedBackup = async (mode) => {
            if (!pendingImport) return;
            try {
                const picked = window.OrbitBackup.selectLists(pendingImport, selectedBackupIds());
                const before = new Set(state.lists.map((list) => String(list.id)));
                await applyBackup(picked, mode);
                const added = state.lists.find((list) => !before.has(String(list.id)))
                    || state.lists.find((list) => sameId(list.id, picked.data.currentListId));
                if (added) {
                    state.currentListId = added.id;
                    saveState();
                    refreshAfterBackup();
                }
                syncRestoreButton();
                closeImportModal();
                showNotice(mode === 'replace'
                    ? 'Backup restored. Restore my lists is in Settings.'
                    : 'Selected lists added. Restore my lists is in Settings.');
            } catch (err) {
                showNotice(err.message || 'Could not import that file.');
            }
        };

        exportBtn.addEventListener('click', () => exportBackup(false));
        shareBtn?.addEventListener('click', () => exportBackup(true));
        importInput.addEventListener('change', async () => {
            const file = importInput.files?.[0];
            importInput.value = '';
            if (!file) return;
            try {
                openImportPicker(window.OrbitBackup.parse(await file.text()), file.name);
            } catch (err) {
                showNotice(err.message || 'Could not import that file.');
            }
        });
        document.getElementById('backup-import-cancel')?.addEventListener('click', closeImportModal);
        document.getElementById('backup-import-merge')?.addEventListener('click', () => applySelectedBackup('merge'));
        document.getElementById('backup-import-replace')?.addEventListener('click', async () => {
            const ok = await showConfirm('Replace your current lists with the selected backup lists?');
            if (!ok) return;
            applySelectedBackup('replace');
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
                ? 'Use email and a password. If you already created an account, tap Log in — creating it again sends another email.'
                : 'Cloud sync is not configured. Add your Supabase URL and anon key in js/supabase-config.js.';
        }
        const user = configured ? await window.OrbitSync.user() : null;
        document.body.classList.toggle('is-signed-in', Boolean(user));
        const shortName = user ? String(user.email || 'You').split('@')[0] : 'Log in';
        document.querySelectorAll('.account-btn-label').forEach((label) => {
            label.textContent = shortName;
        });
        document.querySelectorAll('.js-open-account, #account-btn').forEach((btn) => {
            btn.classList.toggle('is-signed-in', Boolean(user));
            btn.setAttribute('aria-label', user ? `Signed in as ${user.email}` : 'Log in');
            btn.title = user ? `Signed in as ${user.email}` : 'Log in';
        });
        document.querySelectorAll('.account-btn-dot').forEach((dot) => {
            dot.hidden = !user;
        });
        const navTitle = document.getElementById('account-nav-title');
        const navHint = document.getElementById('account-nav-hint');
        if (navTitle) navTitle.textContent = user ? 'Account' : 'Log in';
        if (navHint) navHint.textContent = user ? (user.email || 'Signed in') : 'Sync this device across phone and computer';
        const prefsBtn = document.getElementById('prefs-btn');
        if (prefsBtn) {
            prefsBtn.setAttribute('aria-label', user ? 'Open settings' : 'Open settings and log in');
        }
        const title = document.getElementById('account-modal-title');
        if (title) title.textContent = user ? 'Account' : 'Log in';
        const cloudActions = document.getElementById('cloud-actions');
        if (cloudActions) cloudActions.hidden = !user;
        const headerSync = document.getElementById('header-sync-btn');
        if (headerSync) headerSync.hidden = !user || syncModeValue() === 'off';
        const accountSync = document.getElementById('account-sync-btn');
        if (accountSync) accountSync.hidden = !user || syncModeValue() === 'off';
        const inviteBtn = document.getElementById('header-invite-btn');
        if (inviteBtn) inviteBtn.hidden = !user || !currentList() || currentList()?.role === 'editor' || currentList()?.sync === false;
        if (signedOut) signedOut.hidden = !configured || Boolean(user);
        if (signedIn) signedIn.hidden = !user;
        if (emailLabel) emailLabel.textContent = user?.email || '';
        const err = window.OrbitSync?.lastError();
        const synced = window.OrbitSync?.lastSyncAt();
        const note = err
            || (window.OrbitSync?.pendingInvite?.() && !user ? 'Sign in to join the shared list from your invite link.' : '')
            || (synced ? `Last sync ${new Date(synced).toLocaleString()}` : '');
        if (status) {
            status.hidden = !note;
            status.textContent = note;
            status.classList.toggle('sync-error', Boolean(err));
        }
    }

    function isTypingTarget(el) {
        if (!el || el === document.body || el === document.documentElement) return false;
        if (el.isContentEditable) return true;
        if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return false;
        const type = String(el.type || 'text').toLowerCase();
        return !['checkbox', 'radio', 'range', 'color', 'file', 'button', 'submit', 'reset', 'hidden'].includes(type);
    }

    let editSession = null;
    let editBlurTimer = 0;

    function describeEditor(el) {
        if (!isTypingTarget(el)) return null;
        const taskId = el.closest('.todo-item')?.dataset.id || '';
        const isTitle = el.classList.contains('header-title-input');
        return {
            kind: taskId ? 'task' : (isTitle ? 'list' : (el.id === 'todo-input' ? 'composer' : 'field')),
            taskId,
            isTitle,
            id: taskId || (isTitle ? String(state.currentListId || '') : (el.id || '')),
            value: 'value' in el ? el.value : '',
            start: el.selectionStart,
            end: el.selectionEnd
        };
    }

    function beginEditSession(el) {
        const next = describeEditor(el);
        if (!next) return;
        if (editBlurTimer) {
            clearTimeout(editBlurTimer);
            editBlurTimer = 0;
        }
        editSession = next;
    }

    function snapshotEditSession() {
        const live = describeEditor(document.activeElement);
        if (live) editSession = live;
        return editSession;
    }

    function releaseEditSession() {
        if (isTypingTarget(document.activeElement)) {
            beginEditSession(document.activeElement);
            return;
        }
        const wasEditing = Boolean(editSession);
        editSession = null;
        if (!wasEditing || taskDragActive) return;
        renderSidebar();
        renderCalendar();
        renderHeader();
        renderTodos();
        refreshCalendarMarkers();
    }

    function bindEditSession() {
        const capture = (e) => beginEditSession(e.target);
        document.addEventListener('pointerdown', capture, true);
        document.addEventListener('focusin', capture);
        document.addEventListener('input', capture);
        document.addEventListener('focusout', () => {
            editBlurTimer = window.setTimeout(releaseEditSession, 150);
        });
    }

    function restoreEditor(snap) {
        if (!snap) return;
        const apply = () => {
            let el = null;
            if (snap.taskId || snap.kind === 'task') {
                el = todoList.querySelector(`.todo-item[data-id="${CSS.escape(String(snap.taskId || snap.id))}"] .todo-input-edit`);
            } else if (snap.isTitle || snap.kind === 'list') {
                el = listTitle.querySelector('.header-title-input');
            } else if (snap.id) {
                el = document.getElementById(snap.id);
            }
            if (!el || !isTypingTarget(el)) return;
            if (snap.value != null && 'value' in el && el.value !== snap.value) el.value = snap.value;
            el.focus({ preventScroll: true });
            try {
                const start = Number.isInteger(snap.start) ? snap.start : el.value.length;
                const end = Number.isInteger(snap.end) ? snap.end : start;
                el.setSelectionRange(start, end);
            } catch { /* ignore */ }
        };
        apply();
        requestAnimationFrame(apply);
    }

    function applyCloudState(remote) {
        const editor = snapshotEditSession();
        const lockedTask = (editor?.kind === 'task' || editor?.taskId)
            ? state.tasks.find((item) => String(item.id) === String(editor.taskId || editor.id))
            : null;
        const lockedList = (editor?.kind === 'list' || editor?.isTitle)
            ? (state.lists.find((item) => String(item.id) === String(editor.id)) || currentList())
            : null;
        const localPets = state.settings?.pets;
        const localPetChoice = state.settings?.petChoice;
        const gone = new Set([
            ...(state.deletedListIds || []),
            ...(window.OrbitSync?.deletedListIds?.() || [])
        ].map(String));
        const blocked = (id) => (
            window.OrbitSync?.listIsDeleted?.(id, gone) || gone.has(String(id))
        );
        const goneGroups = new Set([
            ...(state.deletedGroupIds || []),
            ...(window.OrbitSync?.deletedGroupIds?.() || [])
        ].map(String));
        const blockedGroup = (id) => (
            window.OrbitSync?.groupIsDeleted?.(id, goneGroups) || goneGroups.has(String(id))
        );
        const goneTasks = new Set([
            ...(state.deletedTaskIds || []),
            ...(window.OrbitSync?.deletedTaskIds?.() || [])
        ].map(String));
        const keepCurrent = state.currentListId;
        state.lists = (remote.lists || []).filter((list) => !blocked(list.id));
        state.tasks = (remote.tasks || []).filter((task) => (
            !blocked(task.listId) && !goneTasks.has(String(task.id))
        ));
        state.tags = remote.tags;
        state.groups = (remote.groups || []).filter((group) => !blockedGroup(group.id));
        if (remote.settings) {
            state.settings = { ...state.settings, ...remote.settings };
            delete state.settings.loginChip;
            delete state.settings.optimizedMode;
            delete state.settings.trash;
            delete state.settings.syncMode;
            delete state.settings.syncLists;
            delete state.settings.syncGroups;
            if (localPets) state.settings.pets = localPets;
            if (localPetChoice) state.settings.petChoice = localPetChoice;
        }
        if (remote.bitsParams) state.bitsParams = remote.bitsParams;
        if (Array.isArray(remote.customThemes)) state.customThemes = remote.customThemes;
        if (remote.wallpaperAdjust && typeof remote.wallpaperAdjust === 'object') {
            state.wallpaperAdjust = remote.wallpaperAdjust;
        }
        applyShellSettings();
        readSidebarTree();
        if (state.lists.some((list) => sameId(list.id, keepCurrent))) {
            state.currentListId = keepCurrent;
        } else if (remote.currentListId && state.lists.some((list) => sameId(list.id, remote.currentListId))) {
            state.currentListId = remote.currentListId;
        } else {
            state.currentListId = state.lists[0]?.id || '';
        }
        if (lockedTask) {
            const text = typeof editor.value === 'string' ? editor.value : lockedTask.text;
            const pinned = { ...lockedTask, text };
            const index = state.tasks.findIndex((item) => String(item.id) === String(lockedTask.id));
            if (index >= 0) state.tasks[index] = { ...state.tasks[index], ...pinned };
            else state.tasks.push(pinned);
        } else if (editor?.taskId) {
            const task = state.tasks.find((item) => String(item.id) === String(editor.taskId));
            if (task && typeof editor.value === 'string' && task.text !== editor.value) {
                task.text = editor.value;
                task.updatedAt = new Date().toISOString();
            }
        }
        if (lockedList && String(editor.value || '').trim()) {
            const name = editor.value.trim();
            const index = state.lists.findIndex((item) => String(item.id) === String(lockedList.id));
            if (index >= 0 && state.lists[index].name !== name) {
                state.lists[index] = { ...state.lists[index], name, updatedAt: new Date().toISOString() };
            }
        } else if (editor?.isTitle) {
            const list = currentList();
            if (list && String(editor.value || '').trim() && list.name !== editor.value.trim()) {
                list.name = editor.value.trim();
                list.updatedAt = new Date().toISOString();
            }
        }
        saveState({ skipSync: true });
        if (taskDragActive) return;
        if (editor?.kind === 'task' || editor?.taskId || editor?.kind === 'composer') {
            renderSidebar();
            renderCalendar();
            return;
        }
        if (editor?.kind === 'list' || editor?.isTitle) {
            renderSidebar();
            renderCalendar();
            renderTodos();
            return;
        }
        if (editor) return;
        renderSidebar();
        renderCalendar();
        renderHeader();
        renderTodos();
        applyTheme(currentList()?.theme || DEFAULT_THEME);
        renderThemeOptions();
        renderWidgets();
        syncLayoutModal();
        refreshAccountUi();
        applyLoginChip();
        restoreEditor(editor);
    }

    function bindCloud() {
        window.OrbitSync?.init({
            getState: () => state,
            applyCloud: applyCloudState,
            persistLocal: () => saveState({ skipSync: true }),
            isEditing: () => Boolean(editSession || isTypingTarget(document.activeElement)),
            editingItem: () => snapshotEditSession(),
            wallpaperGet,
            wallpaperPut,
            onMedia: () => {
                if (isTypingTarget(document.activeElement)) return;
                renderThemeOptions();
                applyTheme(currentList()?.theme || DEFAULT_THEME);
            },
            onAuth: () => { refreshAccountUi(); },
            onStatus: () => {
                if (isTypingTarget(document.activeElement)) return;
                refreshAccountUi();
            },
            onInvitePending: () => {
                showNotice('Sign in to join that shared list.');
                refreshAccountUi();
            },
            onJoinedList: (listId) => {
                if (!listId) return;
                if (state.lists.some((list) => sameId(list.id, listId))) {
                    state.currentListId = listId;
                    saveState({ skipSync: true });
                    renderSidebar();
                    renderHeader();
                    renderTodos();
                    applyTheme(currentList()?.theme || DEFAULT_THEME);
                }
                showNotice('You joined a shared list. Changes stay in sync.');
            }
        });
        refreshAccountUi();
    }

    function setupEventListeners() {
        bindEditSession();
        addBtn.addEventListener('click', addTodo);
        todoInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addTodo();
        });
        clearCompletedBtn.addEventListener('click', clearCompleted);
        addListBtn.addEventListener('click', () => {
            collapseAddNewMenu();
            addNewList();
        });
        addGroupBtn?.addEventListener('click', () => {
            collapseAddNewMenu();
            addNewGroup();
        });
        document.getElementById('add-new-btn')?.addEventListener('click', () => {
            const menu = document.getElementById('add-new-menu');
            const btn = document.getElementById('add-new-btn');
            if (!menu || !btn) return;
            const open = !menu.classList.contains('is-open');
            menu.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', String(open));
        });
        menuBtn.addEventListener('click', toggleSidebar);
        closeSidebarBtn.addEventListener('click', () => setSidebarOpen(false));
        sidebarOverlay.addEventListener('click', () => setSidebarOpen(false));
        document.getElementById('edit-lists-btn')?.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            const btn = document.getElementById('edit-lists-btn');
            const on = !sidebar.classList.contains('is-list-editing');
            sidebar.classList.toggle('is-list-editing', on);
            btn.setAttribute('aria-pressed', String(on));
            btn.setAttribute('aria-label', on ? 'Done editing lists' : 'Edit lists');
            btn.textContent = on ? 'Done' : 'Edit';
        });
        bindLoginChip();

        const openPrefs = () => {
            setPetStatus('');
            syncLayoutModal();
            applyWindowSize();
            applyTaskScale();
            document.getElementById('backup-restore-btn').hidden = !window.OrbitBackup?.readRestorePoint(localStorage, STATE_KEY);
            document.getElementById('backup-restore-hint').hidden = document.getElementById('backup-restore-btn').hidden;
            showSettingsHome();
            setSidebarOpen(false);
            openModal(prefsModal);
        };
        document.querySelectorAll('.js-open-settings').forEach((btn) => {
            btn.addEventListener('click', openPrefs);
        });
        document.querySelectorAll('.js-open-account').forEach((btn) => {
            btn.addEventListener('click', () => {
                const chip = document.getElementById('login-chip');
                if (chip?.dataset.dragged === '1') {
                    chip.dataset.dragged = '0';
                    return;
                }
                closeModal(prefsModal);
                refreshAccountUi();
                openModal(document.getElementById('account-modal'));
            });
        });
        document.getElementById('close-account-modal')?.addEventListener('click', () => {
            closeModal(document.getElementById('account-modal'));
        });
        prefsModal.querySelectorAll('[data-settings-panel]').forEach((btn) => {
            btn.addEventListener('click', () => openSettingsPanel(btn.dataset.settingsPanel));
        });
        prefsModal.querySelectorAll('.settings-back-btn').forEach((btn) => {
            btn.addEventListener('click', showSettingsHome);
        });
        listColorPicker.addEventListener('input', () => setCurrentListColor(listColorPicker.value));
        closePrefsModal.addEventListener('click', () => {
            showSettingsHome();
            closeModal(prefsModal);
        });
        openThemeBtn.addEventListener('click', () => {
            closeModal(prefsModal);
            setWallpaperStatus('');
            renderThemeOptions();
            openModal(themeModal);
        });
        enterEditBtn?.addEventListener('click', () => {
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
        document.getElementById('empty-history-btn')?.addEventListener('click', emptyTrash);
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
        document.getElementById('optimized-mode')?.addEventListener('change', (e) => {
            state.settings.optimizedMode = e.target.checked;
            applyPerformanceMode();
            saveState({ skipSync: true });
        });
        document.getElementById('sync-mode-choices')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-sync-mode]');
            if (!btn) return;
            setSyncMode(btn.dataset.syncMode);
        });
        document.getElementById('sync-lists')?.addEventListener('change', (e) => {
            state.settings.syncLists = e.target.checked;
            saveState({ skipSync: true });
        });
        document.getElementById('sync-groups')?.addEventListener('change', (e) => {
            state.settings.syncGroups = e.target.checked;
            saveState({ skipSync: true });
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stopClock();
            else startClock();
        });
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
        const setAccountNote = (message, isError) => {
            const status = document.getElementById('account-status');
            if (!status) return;
            status.hidden = !message;
            status.textContent = message || '';
            status.classList.toggle('sync-error', Boolean(isError));
        };
        const authNote = (err, fallback) => window.OrbitSync?.formatAuthError?.(err) || err?.message || fallback;
        const readAccountEmail = () => document.getElementById('account-email')?.value.trim() || '';
        const readAccountPassword = () => document.getElementById('account-password')?.value || '';
        document.getElementById('account-login-btn')?.addEventListener('click', async () => {
            const email = readAccountEmail();
            const password = readAccountPassword();
            if (!email.includes('@')) {
                setAccountNote('Enter your email address.');
                return;
            }
            if (password.length < 6) {
                setAccountNote('Password needs at least 6 characters.');
                return;
            }
            try {
                await window.OrbitSync.signInWithPassword(email, password);
                setAccountNote('');
                refreshAccountUi();
            } catch (err) {
                setAccountNote(authNote(err, 'Could not log in.'), true);
            }
        });
        document.getElementById('account-signup-btn')?.addEventListener('click', async () => {
            const email = readAccountEmail();
            const password = readAccountPassword();
            if (!email.includes('@')) {
                setAccountNote('Enter your email address.');
                return;
            }
            if (password.length < 6) {
                setAccountNote('Password needs at least 6 characters.');
                return;
            }
            try {
                const data = await window.OrbitSync.signUpWithPassword(email, password);
                if (data?.session) {
                    setAccountNote('');
                    refreshAccountUi();
                } else {
                    setAccountNote('Account created. If it asks you to confirm, check email once, then tap Log in. Don’t tap Create account again.');
                }
            } catch (err) {
                setAccountNote(authNote(err, 'Could not create that account.'), true);
            }
        });
        document.getElementById('account-password')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('account-login-btn')?.click();
        });
        document.getElementById('account-signin-btn')?.addEventListener('click', async () => {
            const email = readAccountEmail();
            if (!email) {
                setAccountNote('Enter your email first.');
                return;
            }
            try {
                await window.OrbitSync.sendMagicLink(email);
                setAccountNote('Check your email for the sign-in link.');
            } catch (err) {
                setAccountNote(authNote(err, 'Could not send that link.'), true);
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
        const syncNow = async () => {
            const btn = document.getElementById('header-sync-btn');
            if (btn) btn.textContent = 'Syncing…';
            await window.OrbitSync?.syncNow?.();
            if (btn) btn.textContent = 'Sync';
            refreshAccountUi();
            showNotice('Synced.');
        };
        document.getElementById('header-sync-btn')?.addEventListener('click', syncNow);
        const copyInvite = async (listId, status) => {
            if (!listId) {
                showNotice('Create a list first.');
                return;
            }
            try {
                if (status) {
                    status.hidden = false;
                    status.textContent = 'Preparing invite…';
                }
                const link = await window.OrbitSync.createInvite(listId);
                try {
                    await navigator.clipboard.writeText(link);
                    if (status) { status.hidden = false; status.textContent = 'Invite copied. Send it — they sign in and the list stays in sync.'; }
                    else showNotice('Invite copied. Send that link.');
                } catch {
                    if (status) { status.hidden = false; status.textContent = link; }
                    else showNotice(link);
                }
            } catch (err) {
                const message = err.message || 'Could not create an invite.';
                if (status) { status.hidden = false; status.textContent = message; }
                else showNotice(message);
            }
        };
        document.getElementById('header-invite-btn')?.addEventListener('click', () => {
            copyInvite(state.currentListId);
        });
        document.getElementById('account-signout-btn')?.addEventListener('click', async () => {
            await window.OrbitSync?.signOut();
            refreshAccountUi();
        });
        document.getElementById('share-list-btn')?.addEventListener('click', async () => {
            await copyInvite(settingsListId, document.getElementById('share-list-status'));
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

        [themeModal, prefsModal, confirmModal, inputModal, settingsModal, document.getElementById('tag-modal'), document.getElementById('backup-import-modal')].forEach((modal) => {
            if (!modal) return;
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
