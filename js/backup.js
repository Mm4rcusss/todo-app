(function (global) {
    const FORMAT = 'orbit-backup';
    const VERSION = 1;
    const WARN_SIZE = 4 * 1024 * 1024;
    const PET_KEY = 'widget_pet';
    const BUILTIN_THEMES = [
        'default', 'ocean', 'forest', 'sunset', 'night', 'aurora', 'candy',
        'grass', 'sunny', 'beach', 'sky', 'meadow', 'blossom', 'peach', 'mint', 'lagoon',
        'nature', 'galaxy', 'dust', 'nebula', 'webb',
        'rb-aurora', 'rb-particles', 'rb-waves', 'rb-silk', 'rb-orbs',
        'rb-lightning', 'rb-grid', 'rb-plasma'
    ];

    function clip(value, max) {
        return String(value ?? '').slice(0, max);
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function isDataImage(value) {
        return typeof value === 'string'
            && value.startsWith('data:image/')
            && value.length < 8_000_000;
    }

    function isHexColor(value) {
        return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
    }

    function sanitizeReset(reset) {
        if (!reset || typeof reset !== 'object') return { type: 'none' };
        const type = ['none', 'interval', 'date', 'range'].includes(reset.type) ? reset.type : 'none';
        const out = { type };
        if (type === 'interval') {
            out.interval = Math.min(365, Math.max(1, Number(reset.interval) || 1));
            out.unit = reset.unit === 'weeks' ? 'weeks' : 'days';
        }
        if (type === 'date') out.date = clip(reset.date, 10);
        if (type === 'range') {
            out.startDate = clip(reset.startDate, 10);
            out.endDate = clip(reset.endDate, 10);
        }
        return out;
    }

    function sanitizeList(list) {
        if (!list || typeof list !== 'object') return null;
        const id = clip(list.id, 80);
        const name = clip(list.name, 60).trim() || 'List';
        if (!id) return null;
        return {
            id,
            name,
            icon: clip(list.icon, 32) || '📋',
            theme: clip(list.theme, 80) || 'rb-particles',
            color: isHexColor(list.color) ? list.color : '#b19eef',
            resetFrequency: clip(list.resetFrequency, 20) || 'none',
            reset: sanitizeReset(list.reset),
            groupId: clip(list.groupId, 80),
            updatedAt: clip(list.updatedAt, 40)
        };
    }

    function sanitizeTask(task, index) {
        if (!task || typeof task !== 'object') return null;
        const id = clip(task.id, 80);
        const text = clip(task.text, 240).trim();
        const listId = clip(task.listId, 80);
        if (!id || !text || !listId) return null;
        const tags = Array.isArray(task.tags)
            ? task.tags.map((tag) => clip(tag, 80)).filter(Boolean).slice(0, 24)
            : [];
        return {
            id,
            text,
            completed: Boolean(task.completed),
            listId,
            date: clip(task.date, 10),
            tags,
            order: Number.isFinite(Number(task.order)) ? Number(task.order) : index,
            updatedAt: clip(task.updatedAt, 40)
        };
    }

    function sanitizeTag(tag) {
        if (!tag || typeof tag !== 'object') return null;
        const id = clip(tag.id, 80);
        const name = clip(tag.name, 24).trim();
        if (!id || !name) return null;
        return {
            id,
            name,
            color: isHexColor(tag.color) ? tag.color : '#b19eef'
        };
    }

    function sanitizeTheme(theme) {
        if (!theme || typeof theme !== 'object') return null;
        const id = clip(theme.id, 80);
        if (!id) return null;
        return {
            id,
            name: clip(theme.name, 32).trim() || 'Wallpaper',
            color: isHexColor(theme.color) ? theme.color : '#b19eef'
        };
    }

    function sanitizeGroup(group) {
        if (!group || typeof group !== 'object') return null;
        const id = clip(group.id, 80);
        const name = clip(group.name, 40).trim() || 'Group';
        if (!id) return null;
        return {
            id,
            name,
            sort: Number.isFinite(Number(group.sort)) ? Number(group.sort) : 0
        };
    }

    function sanitizeSettings(settings) {
        if (!settings || typeof settings !== 'object') return {};
        return clone(settings);
    }

    function sanitizeParams(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? clone(value) : {};
    }

    function sanitizeData(data) {
        const lists = data.lists.map(sanitizeList).filter(Boolean);
        const listIds = new Set(lists.map((list) => list.id));
        const tags = (Array.isArray(data.tags) ? data.tags : []).map(sanitizeTag).filter(Boolean);
        const tasks = data.tasks
            .map(sanitizeTask)
            .filter((task) => task && listIds.has(task.listId));
        const customThemes = (Array.isArray(data.customThemes) ? data.customThemes : [])
            .map(sanitizeTheme)
            .filter(Boolean);
        let currentListId = clip(data.currentListId, 80);
        if (!listIds.has(currentListId) && lists[0]) currentListId = lists[0].id;
        return {
            lists,
            tasks,
            tags,
            groups: (Array.isArray(data.groups) ? data.groups : []).map(sanitizeGroup).filter(Boolean),
            currentListId,
            settings: sanitizeSettings(data.settings),
            customThemes,
            bitsParams: sanitizeParams(data.bitsParams),
            wallpaperAdjust: sanitizeParams(data.wallpaperAdjust)
        };
    }

    function sanitizeMedia(media) {
        const wallpapers = {};
        const source = media && typeof media === 'object' ? media.wallpapers : null;
        if (source && typeof source === 'object') {
            Object.entries(source).forEach(([id, dataUrl]) => {
                const key = clip(id, 80);
                if (key && isDataImage(dataUrl)) wallpapers[key] = dataUrl;
            });
        }
        return {
            wallpapers,
            pet: media && isDataImage(media.pet) ? media.pet : null
        };
    }

    function resolveTheme(themeId, customIds, fallback) {
        if (BUILTIN_THEMES.includes(themeId) || customIds.has(themeId)) return themeId;
        return fallback;
    }

    function filename() {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `orbit-backup-${y}-${m}-${d}.json`;
    }

    function build(state, media) {
        const lists = (state.lists || []).map((list) => {
            const clean = sanitizeList(list);
            return clean;
        }).filter(Boolean);

        return {
            format: FORMAT,
            version: VERSION,
            exportedAt: new Date().toISOString(),
            data: {
                lists,
                tasks: (state.tasks || []).map(sanitizeTask).filter(Boolean),
                tags: (state.tags || []).map(sanitizeTag).filter(Boolean),
                groups: (state.groups || []).map(sanitizeGroup).filter(Boolean),
                currentListId: clip(state.currentListId, 80),
                settings: sanitizeSettings(state.settings),
                customThemes: (state.customThemes || []).map(sanitizeTheme).filter(Boolean),
                bitsParams: sanitizeParams(state.bitsParams),
                wallpaperAdjust: sanitizeParams(state.wallpaperAdjust)
            },
            media: {
                wallpapers: media?.wallpapers && typeof media.wallpapers === 'object' ? media.wallpapers : {},
                pet: media?.pet || null
            }
        };
    }

    function parse(text) {
        let raw;
        try {
            raw = JSON.parse(text);
        } catch {
            throw new Error('That file is not valid JSON.');
        }
        const looksLikeBackup = raw && (raw.format === FORMAT || (raw.data && Array.isArray(raw.data.lists)));
        if (!looksLikeBackup) {
            throw new Error('This is not an Orbit backup file.');
        }
        if (Number(raw.version || VERSION) > VERSION) {
            throw new Error('This backup was made with a newer Orbit and cannot be opened yet.');
        }
        if (!raw.data || !Array.isArray(raw.data.lists) || !Array.isArray(raw.data.tasks)) {
            throw new Error('This backup is missing lists or tasks.');
        }
        const data = sanitizeData(raw.data);
        if (!data.lists.length) {
            throw new Error('This backup has no lists to import.');
        }
        return {
            data,
            media: sanitizeMedia(raw.media),
            exportedAt: raw.exportedAt || ''
        };
    }

    function merge(current, imported, options) {
        const uid = options.uid;
        const fallback = options.defaultTheme || 'rb-particles';
        const listMap = new Map();
        const tagMap = new Map();
        const themeMap = new Map();

        const customThemes = [...(current.customThemes || [])];
        (imported.data.customThemes || []).forEach((theme) => {
            const nextId = uid('custom_');
            themeMap.set(theme.id, nextId);
            customThemes.push({ ...theme, id: nextId });
        });

        const wallpaperAdjust = { ...(current.wallpaperAdjust || {}) };
        Object.entries(imported.data.wallpaperAdjust || {}).forEach(([id, value]) => {
            wallpaperAdjust[themeMap.get(id) || id] = value;
        });

        const bitsParams = { ...(current.bitsParams || {}), ...(imported.data.bitsParams || {}) };

        const lists = [...(current.lists || [])];
        imported.data.lists.forEach((list) => {
            const nextId = uid('list_');
            listMap.set(list.id, nextId);
            const customId = themeMap.get(list.theme);
            const theme = customId || resolveTheme(list.theme, new Set(), fallback);
            lists.push({ ...list, id: nextId, theme });
        });

        const groupMap = new Map();
        const groups = [...(current.groups || [])];
        (imported.data.groups || []).forEach((group) => {
            const nextId = uid('group_');
            groupMap.set(group.id, nextId);
            groups.push({ ...group, id: nextId });
        });
        lists.forEach((list) => {
            if (list.groupId && groupMap.has(list.groupId)) list.groupId = groupMap.get(list.groupId);
        });

        const tags = [...(current.tags || [])];
        (imported.data.tags || []).forEach((tag) => {
            const nextId = uid('tag_');
            tagMap.set(tag.id, nextId);
            tags.push({ ...tag, id: nextId });
        });

        const tasks = [...(current.tasks || [])];
        imported.data.tasks.forEach((task) => {
            const listId = listMap.get(task.listId);
            if (!listId) return;
            tasks.push({
                ...task,
                id: uid('task_'),
                listId,
                tags: (task.tags || []).map((tagId) => tagMap.get(tagId)).filter(Boolean)
            });
        });

        const media = { wallpapers: {}, pet: null };
        Object.entries(imported.media?.wallpapers || {}).forEach(([id, dataUrl]) => {
            const nextId = themeMap.get(id);
            if (nextId) media.wallpapers[nextId] = dataUrl;
        });

        return {
            data: {
                lists,
                tasks,
                tags,
                groups,
                currentListId: current.currentListId,
                settings: current.settings || {},
                customThemes,
                bitsParams,
                wallpaperAdjust
            },
            media
        };
    }

    function selectLists(imported, selectedIds) {
        const wanted = new Set((selectedIds || []).map((id) => String(id)));
        const lists = (imported.data.lists || []).filter((list) => wanted.has(String(list.id)));
        if (!lists.length) throw new Error('Pick at least one list to import.');
        const listIds = new Set(lists.map((list) => String(list.id)));
        const tasks = (imported.data.tasks || []).filter((task) => listIds.has(String(task.listId)));
        const groupIds = new Set(lists.map((list) => list.groupId).filter(Boolean).map(String));
        const groups = (imported.data.groups || []).filter((group) => groupIds.has(String(group.id)));
        const tagIds = new Set();
        tasks.forEach((task) => (task.tags || []).forEach((id) => tagIds.add(String(id))));
        const tags = (imported.data.tags || []).filter((tag) => tagIds.has(String(tag.id)));
        let currentListId = imported.data.currentListId;
        if (!listIds.has(String(currentListId))) currentListId = lists[0]?.id || '';
        const themeIds = new Set(
            lists.map((list) => list.theme).filter((id) => String(id || '').startsWith('custom_'))
        );
        const customThemes = (imported.data.customThemes || []).filter((theme) => themeIds.has(theme.id));
        const wallpapers = {};
        Object.entries(imported.media?.wallpapers || {}).forEach(([id, dataUrl]) => {
            if (themeIds.has(id)) wallpapers[id] = dataUrl;
        });
        const wallpaperAdjust = {};
        Object.entries(imported.data.wallpaperAdjust || {}).forEach(([id, value]) => {
            if (themeIds.has(id)) wallpaperAdjust[id] = value;
        });
        return {
            data: {
                ...imported.data,
                lists,
                tasks,
                tags,
                groups,
                currentListId,
                customThemes,
                wallpaperAdjust
            },
            media: {
                wallpapers,
                pet: imported.media?.pet || null
            }
        };
    }

    function applyThemeFallback(data, media, fallback) {
        const customIds = new Set((data.customThemes || []).map((theme) => theme.id));
        const photos = media?.wallpapers || {};
        const includedPhotos = Object.keys(photos).length > 0;
        data.lists.forEach((list) => {
            if (includedPhotos && customIds.has(list.theme) && !photos[list.theme]) {
                list.theme = fallback;
                return;
            }
            list.theme = resolveTheme(list.theme, customIds, fallback);
        });
        return data;
    }

    function byteSize(payload) {
        return new Blob([JSON.stringify(payload)]).size;
    }

    function canShareFile(file) {
        return Boolean(navigator.share && navigator.canShare && file && navigator.canShare({ files: [file] }));
    }

    function toFile(payload) {
        const json = JSON.stringify(payload, null, 2);
        return new File([json], filename(), { type: 'application/json' });
    }

    function download(payload) {
        const file = toFile(payload);
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        return file;
    }

    async function share(payload) {
        const file = toFile(payload);
        if (!canShareFile(file)) return false;
        await navigator.share({ files: [file], title: 'Orbit backup' });
        return true;
    }

    function restoreStorageKey(stateKey) {
        return `${stateKey}_restore_point`;
    }

    function capture(state) {
        return {
            lists: clone(state.lists || []),
            tasks: clone(state.tasks || []),
            tags: clone(state.tags || []),
            groups: clone(state.groups || []),
            currentListId: state.currentListId,
            settings: clone(state.settings || {}),
            customThemes: clone(state.customThemes || []),
            bitsParams: clone(state.bitsParams || {}),
            wallpaperAdjust: clone(state.wallpaperAdjust || {})
        };
    }

    function saveRestorePoint(storage, stateKey, state) {
        const key = restoreStorageKey(stateKey);
        if (storage.getItem(key)) return false;
        storage.setItem(key, JSON.stringify({
            savedAt: new Date().toISOString(),
            data: capture(state)
        }));
        return true;
    }

    function readRestorePoint(storage, stateKey) {
        try {
            const parsed = JSON.parse(storage.getItem(restoreStorageKey(stateKey)));
            if (!parsed?.data || !Array.isArray(parsed.data.lists)) return null;
            return parsed;
        } catch {
            return null;
        }
    }

    function clearRestorePoint(storage, stateKey) {
        storage.removeItem(restoreStorageKey(stateKey));
    }

    global.OrbitBackup = {
        FORMAT,
        VERSION,
        WARN_SIZE,
        PET_KEY,
        BUILTIN_THEMES,
        filename,
        build,
        parse,
        merge,
        selectLists,
        applyThemeFallback,
        byteSize,
        canShareFile,
        toFile,
        download,
        share,
        capture,
        saveRestorePoint,
        readRestorePoint,
        clearRestorePoint,
        clip
    };
})(window);
