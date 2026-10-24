(function (global) {
    const PUSH_WAIT = 800;
    let client = null;
    let pushTimer = 0;
    let hooks = {};
    let lastSyncAt = null;
    let lastError = '';
    let busy = false;
    let pendingKind = null;
    let ready = false;
    let pollTimer = 0;
    let liveChannel = null;
    let wallpaperTimer = 0;
    let wallpaperChannel = null;
    const TOMBSTONE_KEY = 'orbit_deleted_lists';
    const GROUP_TOMBSTONE_KEY = 'orbit_deleted_groups';
    const TASK_TOMBSTONE_KEY = 'orbit_deleted_tasks';
    const KNOWN_LISTS_KEY = 'orbit_known_lists';
    const KNOWN_GROUPS_KEY = 'orbit_known_groups';
    const INVITE_KEY = 'orbit_invite_token';
    const SYNC_MIGRATION_KEY = 'orbit_sync_migration';
    const SYNC_MIGRATION_VERSION = 2;
    const USER_CACHE_DB = 'orbit_user_cache';
    const USER_CACHE_STORE = 'snapshots';
    const sessionListTombs = new Set();
    const sessionGroupTombs = new Set();
    const sessionTaskTombs = new Set();
    let pullBlocked = false;
    let cachedUserId = null;

    function loadStoredIds(key) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
            return [];
        }
    }

    function loadTombs() {
        return loadStoredIds(TOMBSTONE_KEY);
    }

    function loadGroupTombs() {
        return loadStoredIds(GROUP_TOMBSTONE_KEY);
    }

    function rememberIds(key, session, extras, stateField) {
        extras.forEach((item) => session.add(item));
        const next = [...new Set([...loadStoredIds(key), ...extras])].slice(-200);
        try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
        const state = hooks.getState?.();
        if (state) {
            if (!Array.isArray(state[stateField])) state[stateField] = [];
            extras.forEach((item) => {
                if (!state[stateField].map(String).includes(item)) state[stateField].push(item);
            });
        }
        return next;
    }

    function forgetIds(key, session, extras, stateField) {
        const blocked = new Set(extras);
        extras.forEach((item) => session.delete(item));
        const next = loadStoredIds(key).filter((item) => !blocked.has(item));
        try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
        const state = hooks.getState?.();
        if (state && Array.isArray(state[stateField])) {
            state[stateField] = state[stateField].filter((item) => !blocked.has(String(item)));
        }
        return next;
    }

    function rememberDeleted(id) {
        const extras = [String(id)];
        if (isHomeListId(id)) extras.push('default');
        return rememberIds(TOMBSTONE_KEY, sessionListTombs, extras, 'deletedListIds');
    }

    function forgetDeleted(id) {
        const extras = [String(id)];
        if (isHomeListId(id)) extras.push('default');
        return forgetIds(TOMBSTONE_KEY, sessionListTombs, extras, 'deletedListIds');
    }

    function rememberDeletedGroup(id) {
        return rememberIds(GROUP_TOMBSTONE_KEY, sessionGroupTombs, [String(id)], 'deletedGroupIds');
    }

    function forgetDeletedGroup(id) {
        return forgetIds(GROUP_TOMBSTONE_KEY, sessionGroupTombs, [String(id)], 'deletedGroupIds');
    }

    function rememberDeletedTask(ids) {
        const extras = (Array.isArray(ids) ? ids : [ids]).map(String).filter(Boolean);
        return rememberIds(TASK_TOMBSTONE_KEY, sessionTaskTombs, extras, 'deletedTaskIds');
    }

    function forgetDeletedTask(ids) {
        const extras = (Array.isArray(ids) ? ids : [ids]).map(String).filter(Boolean);
        return forgetIds(TASK_TOMBSTONE_KEY, sessionTaskTombs, extras, 'deletedTaskIds');
    }

    function tombstoneSet(state) {
        return new Set([
            ...sessionListTombs,
            ...loadTombs(),
            ...((state?.deletedListIds) || [])
        ].map(String));
    }

    function groupTombstoneSet(state) {
        return new Set([
            ...sessionGroupTombs,
            ...loadGroupTombs(),
            ...((state?.deletedGroupIds) || [])
        ].map(String));
    }

    function loadTaskTombs() {
        return loadStoredIds(TASK_TOMBSTONE_KEY);
    }

    function taskTombstoneSet(state) {
        return new Set([
            ...sessionTaskTombs,
            ...loadTaskTombs(),
            ...((state?.deletedTaskIds) || [])
        ].map(String));
    }

    function listIsDeleted(id, tombs) {
        const value = String(id || '');
        const blocked = tombs instanceof Set ? tombs : new Set([...(tombs || [])].map(String));
        if (blocked.has(value)) return true;
        if (!isHomeListId(value)) return false;
        return blocked.has('default') || [...blocked].some((item) => item.startsWith('home_'));
    }

    function groupIsDeleted(id, tombs) {
        const value = String(id || '');
        const blocked = tombs instanceof Set ? tombs : new Set([...(tombs || [])].map(String));
        return blocked.has(value);
    }

    function taskIsDeleted(id, tombs) {
        const value = String(id || '');
        const blocked = tombs instanceof Set ? tombs : new Set([...(tombs || [])].map(String));
        return blocked.has(value);
    }

    function expandTombs(state, userId) {
        const blocked = tombstoneSet(state);
        if (listIsDeleted('default', blocked) || (userId && listIsDeleted(homeListId(userId), blocked))) {
            blocked.add('default');
            if (userId) blocked.add(homeListId(userId));
        }
        return blocked;
    }

    function expandGroupTombs(state) {
        return groupTombstoneSet(state);
    }

    function loadKnown(key) {
        return new Set(loadStoredIds(key));
    }

    function saveKnown(key, ids) {
        const next = [...new Set([...ids].map(String))].slice(-500);
        try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
        return new Set(next);
    }

    function rememberKnown(kind, ids) {
        const key = kind === 'group' ? KNOWN_GROUPS_KEY : KNOWN_LISTS_KEY;
        const next = loadKnown(key);
        (ids || []).forEach((id) => {
            if (id) next.add(String(id));
        });
        return saveKnown(key, next);
    }

    function knownListIds(state) {
        const next = loadKnown(KNOWN_LISTS_KEY);
        (state?.lists || []).forEach((list) => {
            if (list?.id) next.add(String(list.id));
        });
        (state?.deletedListIds || []).forEach((id) => next.add(String(id)));
        return next;
    }

    function knownGroupIds(state) {
        const next = loadKnown(KNOWN_GROUPS_KEY);
        (state?.groups || []).forEach((group) => {
            if (group?.id) next.add(String(group.id));
        });
        (state?.deletedGroupIds || []).forEach((id) => next.add(String(id)));
        return next;
    }

    function noteLocalDelete(ids, kind = 'list') {
        pullBlocked = true;
        const list = (Array.isArray(ids) ? ids : [ids]).map(String).filter(Boolean);
        if (kind === 'task') rememberDeletedTask(list);
        else if (kind === 'group') list.forEach((id) => rememberDeletedGroup(id));
        else list.forEach((id) => rememberDeleted(id));
    }

    function runLocalMigration() {
        let ver = 0;
        try { ver = Number(localStorage.getItem(SYNC_MIGRATION_KEY) || 0) || 0; } catch { ver = 0; }
        if (ver >= SYNC_MIGRATION_VERSION) return false;
        try {
            localStorage.removeItem(KNOWN_LISTS_KEY);
            localStorage.removeItem(KNOWN_GROUPS_KEY);
            localStorage.removeItem(TOMBSTONE_KEY);
            localStorage.removeItem(GROUP_TOMBSTONE_KEY);
            localStorage.removeItem(TASK_TOMBSTONE_KEY);
            localStorage.setItem(SYNC_MIGRATION_KEY, String(SYNC_MIGRATION_VERSION));
        } catch { /* ignore */ }
        sessionListTombs.clear();
        sessionGroupTombs.clear();
        sessionTaskTombs.clear();
        const state = hooks.getState?.();
        if (state) {
            state.deletedListIds = [];
            state.deletedGroupIds = [];
            state.deletedTaskIds = [];
        }
        return true;
    }

    function syncPrefs() {
        const settings = hooks.getState?.()?.settings || {};
        const mode = settings.syncMode === 'off' || settings.syncMode === 'push' ? settings.syncMode : 'live';
        return {
            mode,
            lists: settings.syncLists !== false,
            groups: settings.syncGroups !== false
        };
    }

    function listIsLocalOnly(list) {
        return list?.sync === false;
    }

    function filterPulledLists(merged, { tombs, idsAtStart, liveIds, remoteIds, localOnlyIds, serverDeletedIds }) {
        return (merged || []).filter((list) => {
            const id = String(list.id);
            if (serverDeletedIds?.has(id) || listIsDeleted(id, tombs)) return false;
            if (localOnlyIds?.has(id)) return liveIds.has(id);
            if (idsAtStart.has(id) && !liveIds.has(id)) return false;
            if (remoteIds.has(id)) return true;
            if (list.role === 'editor') return false;
            return !list.ownerId;
        });
    }

    function filterPulledGroups(merged, { tombs, idsAtStart, liveIds, remoteIds, serverDeletedIds }) {
        return (merged || []).filter((group) => {
            const id = String(group.id);
            if (serverDeletedIds?.has(id) || groupIsDeleted(id, tombs)) return false;
            if (idsAtStart.has(id) && !liveIds.has(id)) return false;
            if (remoteIds.has(id)) return true;
            return liveIds.has(id);
        });
    }

    function filterPulledTasks(merged, { tombs, idsAtStart, liveIds, remoteIds, serverDeletedIds }) {
        return (merged || []).filter((task) => {
            const id = String(task.id);
            if (serverDeletedIds?.has(id) || taskIsDeleted(id, tombs)) return false;
            if (idsAtStart.has(id) && !liveIds.has(id)) return false;
            if (remoteIds.has(id)) return true;
            return liveIds.has(id);
        });
    }

    function config() {
        return global.ORBIT_SUPABASE || {};
    }

    function isConfigured() {
        const cfg = config();
        return Boolean(
            cfg.url
            && cfg.anonKey
            && !String(cfg.url).includes('YOUR_PROJECT')
            && !String(cfg.anonKey).includes('YOUR_ANON')
        );
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function stamp(value) {
        const time = Date.parse(value);
        return Number.isFinite(time) ? time : 0;
    }

    function newer(a, b) {
        return stamp(a?.updatedAt) >= stamp(b?.updatedAt) ? a : b;
    }

    function rowDeletedAt(row) {
        return row?.deleted_at || row?.deletedAt || null;
    }

    function isSoftDeleted(row) {
        return Boolean(rowDeletedAt(row));
    }

    function mergeTaskFields(local, remote) {
        if (!local) return remote;
        if (!remote) return local;
        const localStamp = stamp(local.updatedAt);
        const remoteStamp = stamp(remote.updatedAt);
        if (remoteStamp > localStamp) {
            return {
                ...local,
                ...remote,
                text: remote.text,
                completed: remote.completed,
                date: remote.date,
                tags: remote.tags,
                order: remote.order,
                updatedAt: remote.updatedAt
            };
        }
        if (localStamp > remoteStamp) {
            return {
                ...remote,
                ...local,
                text: local.text,
                completed: local.completed,
                date: local.date,
                tags: local.tags,
                order: local.order,
                updatedAt: local.updatedAt
            };
        }
        return {
            ...local,
            text: local.text,
            completed: local.completed,
            date: local.date || remote.date,
            tags: Array.isArray(local.tags) && local.tags.length ? local.tags : remote.tags,
            order: local.order,
            listId: local.listId || remote.listId,
            updatedAt: local.updatedAt || remote.updatedAt
        };
    }

    function formatError(err) {
        if (!err) return 'Sync failed';
        if (typeof err === 'string') return err;
        const text = [err.message, err.details, err.hint].filter(Boolean).join(' — ');
        if (isOnConflictMismatch(err)) return '';
        if (/row-level security/i.test(text)) {
            return 'Cloud blocked that save. A list id was already taken, so Orbit will retry with a new id.';
        }
        return text || 'Sync failed';
    }

    function formatAuthError(err) {
        const text = `${err?.message || ''} ${err?.code || ''} ${err?.status || ''}`;
        if (/rate.?limit|over_email_send_rate_limit|email_send|too many requests|429/i.test(text)) {
            return 'Too many emails just now. Wait a few minutes, then tap Log in with your password. Don’t tap Create account or Send sign-in link again — those send another email.';
        }
        return err?.message || 'Something went wrong.';
    }

    function isOnConflictMismatch(err) {
        const code = String(err?.code || '');
        const text = `${err?.message || ''} ${err?.details || ''} ${err?.hint || ''}`;
        return code === '42P10' || /on conflict|no unique or exclusion constraint/i.test(text);
    }

    function isBlockedWrite(err) {
        const code = String(err?.code || '');
        const text = `${err?.message || ''} ${err?.details || ''} ${err?.hint || ''}`;
        return code === '23505' || code === '42501' || code === '42P10'
            || /row-level security|duplicate key|on conflict|no unique or exclusion constraint/i.test(text);
    }

    function mergeKinds(a, b) {
        if (!a) return b;
        if (!b) return a;
        if (a === b) return a;
        return 'both';
    }

    function homeListId(userId) {
        return `home_${String(userId).replace(/-/g, '')}`;
    }

    function isHomeListId(id) {
        const value = String(id || '');
        return value === 'default' || value.startsWith('home_');
    }

    function settingsForCloud(settings) {
        const copy = { ...(settings || {}) };
        delete copy.pets;
        delete copy.petChoice;
        delete copy.loginChip;
        delete copy.optimizedMode;
        delete copy.trash;
        delete copy.syncMode;
        delete copy.syncLists;
        delete copy.syncGroups;
        return copy;
    }

    const WALLPAPER_MAX = 8;
    const WALLPAPER_BYTES = 10 * 1024 * 1024;
    const MEDIA_BUCKET = 'orbit-media';
    const WALLPAPER_FILE_LIMIT = WALLPAPER_BYTES;

    function wallpaperQuota(themes, extraBytes = 0, extraCount = 0) {
        const items = themes || [];
        const count = items.length + extraCount;
        const bytes = items.reduce((sum, theme) => sum + (Number(theme.bytes) || 0), 0) + extraBytes;
        return {
            count,
            bytes,
            maxCount: WALLPAPER_MAX,
            maxBytes: WALLPAPER_BYTES,
            ok: count <= WALLPAPER_MAX && bytes <= WALLPAPER_BYTES
        };
    }

    function themesForCloud(themes) {
        return (themes || []).map((theme) => ({
            id: String(theme.id),
            name: theme.name || 'Wallpaper',
            color: theme.color || '#b19eef',
            bytes: Number(theme.bytes) || 0,
            updatedAt: theme.updatedAt || nowIso()
        })).slice(0, WALLPAPER_MAX);
    }

    function wallpaperObjectPath(userId, id) {
        return `${userId}/wallpapers/${String(id)}.jpg`;
    }

    async function upsertUserPrefs(sb, user, state) {
        const { error } = await sb.from('user_prefs').upsert({
            user_id: user.id,
            settings: settingsForCloud(state.settings),
            bits_params: state.bitsParams || {},
            wallpaper_adjust: state.wallpaperAdjust && typeof state.wallpaperAdjust === 'object' ? state.wallpaperAdjust : {},
            custom_themes: themesForCloud(state.customThemes),
            current_list_id: state.currentListId || null,
            updated_at: nowIso()
        }, { onConflict: 'user_id' });
        if (error) throw error;
    }

    function dataUrlToBlob(dataUrl) {
        const parts = String(dataUrl || '').split(',');
        const head = parts[0] || '';
        const body = parts[1] || '';
        const mime = /data:([^;]+)/.exec(head)?.[1] || 'image/jpeg';
        const binary = atob(body);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: mime });
    }

    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('Could not read that photo.'));
            reader.readAsDataURL(blob);
        });
    }

    async function uploadWallpaperFile(id, blob) {
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user || !blob) return;
        if (syncPrefs().mode === 'off') return;
        if (blob.size > WALLPAPER_FILE_LIMIT) {
            const err = new Error(`Wallpaper is too large (max ${Math.round(WALLPAPER_FILE_LIMIT / (1024 * 1024))} MB).`);
            hooks.onWallpaperError?.(err.message);
            throw err;
        }
        const { error } = await sb.storage.from(MEDIA_BUCKET).upload(
            wallpaperObjectPath(user.id, id),
            blob,
            { upsert: true, contentType: blob.type || 'image/jpeg', cacheControl: '3600' }
        );
        if (error) {
            const message = formatError(error) || 'Wallpaper upload failed.';
            hooks.onWallpaperError?.(message);
            throw error;
        }
    }

    async function deleteWallpaperFile(id) {
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user || !id) return;
        const { error } = await sb.storage.from(MEDIA_BUCKET).remove([wallpaperObjectPath(user.id, id)]);
        if (error && !/not found|404/i.test(error.message || '')) throw error;
    }

    async function downloadWallpaperBlob(sb, userId, id) {
        const path = wallpaperObjectPath(userId, id);
        const { data, error } = await sb.storage.from(MEDIA_BUCKET).download(path);
        if (!error && data) return data;
        const signed = await sb.storage.from(MEDIA_BUCKET).createSignedUrl(path, 120);
        if (signed.error || !signed.data?.signedUrl) return null;
        const res = await fetch(signed.data.signedUrl);
        if (!res.ok) return null;
        return res.blob();
    }

    async function uploadMissingWallpapers() {
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user || syncPrefs().mode === 'off') return;
        const themes = hooks.getState?.()?.customThemes || [];
        let remoteNames = new Set();
        const listed = await sb.storage.from(MEDIA_BUCKET).list(`${user.id}/wallpapers`, { limit: 50 });
        if (!listed.error) {
            remoteNames = new Set((listed.data || []).map((row) => String(row.name || '').replace(/\.jpg$/i, '')));
        }
        for (const theme of themes) {
            const id = String(theme.id);
            if (remoteNames.has(id)) continue;
            const dataUrl = await hooks.wallpaperGet?.(id);
            if (!dataUrl) continue;
            try {
                await uploadWallpaperFile(id, dataUrlToBlob(dataUrl));
            } catch (err) {
                console.warn('Orbit wallpaper upload', err);
                hooks.onWallpaperError?.(formatError(err) || 'Wallpaper upload failed.');
            }
        }
    }

    async function downloadMissingWallpapers() {
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user || syncPrefs().mode === 'off') return;
        const themes = hooks.getState?.()?.customThemes || [];
        let wrote = false;
        for (const theme of themes) {
            const id = String(theme.id);
            const local = await hooks.wallpaperGet?.(id);
            if (local) continue;
            try {
                const blob = await downloadWallpaperBlob(sb, user.id, id);
                if (!blob) continue;
                await hooks.wallpaperPut?.(id, await blobToDataUrl(blob));
                wrote = true;
            } catch (err) {
                console.warn('Orbit wallpaper download', err);
            }
        }
        return wrote;
    }

    async function syncWallpaperMedia() {
        try {
            await uploadMissingWallpapers();
            const wrote = await downloadMissingWallpapers();
            if (wrote) hooks.onMedia?.();
        } catch (err) {
            console.warn('Orbit wallpaper sync', err);
        }
    }

    let wallpaperBusy = false;
    function editingNow() {
        return Boolean(hooks.isEditing?.());
    }

    async function pullWallpaperState() {
        if (wallpaperBusy || syncPrefs().mode === 'off' || editingNow()) return;
        const sb = await getClient();
        const user = await sessionUser();
        const state = hooks.getState?.();
        if (!sb || !user || !state) return;
        wallpaperBusy = true;
        try {
            const { data: prefs, error } = await sb.from('user_prefs')
                .select('custom_themes, wallpaper_adjust')
                .eq('user_id', user.id)
                .maybeSingle();
            if (error) throw error;
            const remoteThemes = Array.isArray(prefs?.custom_themes) ? prefs.custom_themes : [];
            const merged = mergeById(state.customThemes || [], remoteThemes).slice(0, WALLPAPER_MAX);
            const idsBefore = (state.customThemes || []).map((theme) => String(theme.id)).join('\n');
            const idsAfter = merged.map((theme) => String(theme.id)).join('\n');
            const idsChanged = idsBefore !== idsAfter;
            let adjustChanged = false;
            if (idsChanged) state.customThemes = merged;
            if (prefs?.wallpaper_adjust && typeof prefs.wallpaper_adjust === 'object') {
                const nextAdjust = { ...(state.wallpaperAdjust || {}), ...prefs.wallpaper_adjust };
                if (JSON.stringify(state.wallpaperAdjust || {}) !== JSON.stringify(nextAdjust)) {
                    state.wallpaperAdjust = nextAdjust;
                    adjustChanged = true;
                }
            }
            if (idsChanged || adjustChanged) hooks.persistLocal?.();
            const wrote = await downloadMissingWallpapers();
            if (idsChanged || wrote) hooks.onMedia?.();
        } catch (err) {
            console.warn('Orbit wallpaper pull', err);
        } finally {
            wallpaperBusy = false;
        }
    }

    const AUTH_STORAGE_KEY = 'orbit-todo-auth';

    function migrateAuthStorage() {
        try {
            if (localStorage.getItem(AUTH_STORAGE_KEY)) return;
            const projectRef = String(config().url || '').match(/https?:\/\/([^.]+)\.supabase\.co/i)?.[1];
            if (!projectRef) return;
            const legacyKey = `sb-${projectRef}-auth-token`;
            const legacy = localStorage.getItem(legacyKey);
            if (legacy) localStorage.setItem(AUTH_STORAGE_KEY, legacy);
        } catch {
            /* ignore */
        }
    }

    async function getClient() {
        if (!isConfigured() || !global.supabase?.createClient) return null;
        if (client) return client;
        migrateAuthStorage();
        client = global.supabase.createClient(config().url, config().anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: 'pkce',
                storage: global.localStorage,
                storageKey: AUTH_STORAGE_KEY
            }
        });
        return client;
    }

    async function sessionUser() {
        const sb = await getClient();
        if (!sb) return null;
        // Local persisted session only. Do not call getUser() here: when signed
        // out it returns "Auth session missing!" which was leaking into the
        // account UI, and calling auth APIs inside onAuthStateChange deadlocks.
        const { data: sessionData } = await sb.auth.getSession();
        return sessionData?.session?.user || null;
    }

    async function handleAuthEvent(event, session) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
            await OrbitSync.consumeInviteFromUrl();
            const user = session?.user || null;
            if (user) {
                cachedUserId = user.id;
                hooks.ensureLiveDefault?.();
            }
            const prefsNow = syncPrefs();
            if (prefsNow.mode === 'off') {
                stopLive();
                stopWallpaperWatch();
            } else if (event === 'SIGNED_IN') {
                // Real login only — never wipe on INITIAL_SESSION / reload.
                await hooks.wipeGuestLocal?.();
                if (user) await paintFromUserCache(user.id);
                await run('pull', { force: true });
                await startLive();
                await startWallpaperWatch();
            } else if (prefsNow.mode === 'live') {
                if (event === 'INITIAL_SESSION' && user) await paintFromUserCache(user.id);
                await run(event === 'TOKEN_REFRESHED' ? 'push' : 'both');
                await startLive();
                await startWallpaperWatch();
            } else {
                await run('push');
                stopLive();
                await startWallpaperWatch();
            }
        }
        if (event === 'SIGNED_OUT') {
            stopLive();
            stopWallpaperWatch();
            cachedUserId = null;
            hooks.onStatus?.();
        }
        hooks.onAuth?.();
    }

    function storedInvite() {
        try {
            return sessionStorage.getItem(INVITE_KEY) || localStorage.getItem(INVITE_KEY) || '';
        } catch {
            return '';
        }
    }

    function rememberInvite(token) {
        if (!token) return;
        try {
            sessionStorage.setItem(INVITE_KEY, token);
            localStorage.setItem(INVITE_KEY, token);
        } catch {
            /* ignore quota */
        }
    }

    function forgetInvite() {
        try {
            sessionStorage.removeItem(INVITE_KEY);
            localStorage.removeItem(INVITE_KEY);
        } catch {
            /* ignore */
        }
    }

    function inviteFromLocation() {
        const params = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(String(location.hash || '').replace(/^#/, ''));
        return params.get('invite') || hashParams.get('invite') || storedInvite();
    }

    function redirectTo() {
        const url = new URL(location.href);
        const invite = inviteFromLocation();
        url.hash = '';
        url.search = '';
        if (invite) url.searchParams.set('invite', invite);
        return url.toString();
    }

    function randomToken() {
        const bytes = new Uint8Array(24);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    }

    function toListRow(list, userId, deletedAt = null) {
        return {
            id: String(list.id),
            owner_id: userId,
            group_id: list.groupId || null,
            name: list.name || 'List',
            icon: list.icon || '📋',
            theme: list.theme || 'rb-particles',
            color: list.color || '#b19eef',
            reset_frequency: list.resetFrequency || 'none',
            reset: list.reset && typeof list.reset === 'object' ? list.reset : { type: 'none' },
            deleted_at: deletedAt,
            updated_at: list.updatedAt || nowIso()
        };
    }

    function fromListRow(row, role) {
        return {
            id: row.id,
            name: row.name,
            icon: row.icon,
            theme: row.theme,
            color: row.color,
            resetFrequency: row.reset_frequency,
            reset: row.reset && typeof row.reset === 'object' ? row.reset : { type: 'none' },
            groupId: row.group_id || '',
            ownerId: row.owner_id,
            role: role || (row.owner_id ? 'owner' : 'editor'),
            shared: role === 'editor',
            deletedAt: rowDeletedAt(row),
            updatedAt: row.updated_at
        };
    }

    function toTaskRow(task, deletedAt = null) {
        return {
            id: String(task.id),
            list_id: String(task.listId),
            text: task.text || '',
            completed: Boolean(task.completed),
            date: task.date || null,
            tags: Array.isArray(task.tags) ? task.tags : [],
            sort_order: Number.isFinite(Number(task.order)) ? Number(task.order) : 0,
            deleted_at: deletedAt,
            updated_at: task.updatedAt || nowIso()
        };
    }

    function fromTaskRow(row) {
        return {
            id: row.id,
            listId: row.list_id,
            text: row.text,
            completed: Boolean(row.completed),
            date: row.date || '',
            tags: Array.isArray(row.tags) ? row.tags : [],
            order: Number(row.sort_order) || 0,
            deletedAt: rowDeletedAt(row),
            updatedAt: row.updated_at
        };
    }

    function toGroupRow(group, userId, index, deletedAt = null) {
        return {
            id: String(group.id),
            user_id: userId,
            name: group.name || 'Group',
            sort: Number.isFinite(Number(group.sort)) ? Number(group.sort) : index,
            deleted_at: deletedAt,
            updated_at: group.updatedAt || nowIso()
        };
    }

    function fromGroupRow(row) {
        return {
            id: row.id,
            name: row.name,
            sort: Number(row.sort) || 0,
            deletedAt: rowDeletedAt(row),
            updatedAt: row.updated_at
        };
    }

    function mergeById(localItems, remoteItems, mergeFn) {
        const map = new Map();
        (localItems || []).forEach((item) => {
            if (item?.id) map.set(String(item.id), item);
        });
        (remoteItems || []).forEach((item) => {
            const id = String(item.id);
            const current = map.get(id);
            if (!current) {
                map.set(id, item);
                return;
            }
            map.set(id, mergeFn ? mergeFn(current, item) : newer(item, current));
        });
        return [...map.values()];
    }

    function ensureHomeListId(state, userId) {
        if (!state || !userId) return false;
        const homeId = homeListId(userId);
        const tombs = expandTombs(state, userId);
        const lists = state.lists || [];
        if (listIsDeleted('default', tombs) || listIsDeleted(homeId, tombs)) {
            const next = lists.filter((list) => !listIsDeleted(list.id, tombs));
            const changed = next.length !== lists.length;
            state.lists = next;
            if (!next.some((list) => String(list.id) === String(state.currentListId))) {
                state.currentListId = next[0]?.id || '';
            }
            return changed;
        }
        const defaultList = lists.find((list) => String(list.id) === 'default');
        if (!defaultList) return false;

        (state.tasks || []).forEach((task) => {
            if (String(task.listId) === 'default') task.listId = homeId;
        });
        if (String(state.currentListId) === 'default') state.currentListId = homeId;

        const homeList = lists.find((list) => String(list.id) === homeId);
        if (homeList) {
            const keep = newer(defaultList, homeList);
            if (keep === defaultList) {
                homeList.name = defaultList.name;
                homeList.icon = defaultList.icon;
                homeList.theme = defaultList.theme;
                homeList.color = defaultList.color;
                homeList.resetFrequency = defaultList.resetFrequency;
                homeList.reset = defaultList.reset;
                homeList.groupId = defaultList.groupId;
                homeList.updatedAt = defaultList.updatedAt || nowIso();
            }
            state.lists = lists.filter((list) => String(list.id) !== 'default');
        } else {
            defaultList.id = homeId;
            defaultList.updatedAt = defaultList.updatedAt || nowIso();
        }
        return true;
    }

    function remapListId(state, oldId, newId) {
        const from = String(oldId);
        const to = String(newId);
        (state.lists || []).forEach((list) => {
            if (String(list.id) === from) list.id = to;
        });
        (state.tasks || []).forEach((task) => {
            if (String(task.listId) === from) task.listId = to;
        });
        if (String(state.currentListId) === from) state.currentListId = to;
    }

    function ensureDefaultTagIds(state, userId) {
        if (!state || !userId) return false;
        const compact = String(userId).replace(/-/g, '');
        const map = new Map();
        (state.tags || []).forEach((tag) => {
            const id = String(tag.id);
            if (id !== 'urgent' && id !== 'work') return;
            const next = `tag_${compact}_${id}`;
            map.set(id, next);
            tag.id = next;
            tag.updatedAt = nowIso();
        });
        if (!map.size) return false;
        (state.tasks || []).forEach((task) => {
            task.tags = (task.tags || []).map((id) => map.get(String(id)) || id);
        });
        return true;
    }

    function ownedLists(state, userId) {
        const blocked = expandTombs(state, userId);
        return (state.lists || []).filter((list) => (
            list.role !== 'editor'
            && (!list.ownerId || String(list.ownerId) === String(userId))
            && !listIsDeleted(list.id, blocked)
            && !listIsLocalOnly(list)
        ));
    }

    async function upsertByUser(sb, table, rows) {
        if (!rows.length) return null;
        const { error } = await sb.from(table).upsert(rows, { onConflict: 'user_id,id' });
        return error || null;
    }

    async function insertListRow(sb, row) {
        const { error } = await sb.from('lists').insert(row);
        return error;
    }

    async function saveOwnedLists(sb, state, userId) {
        const saved = [];
        for (const list of ownedLists(state, userId)) {
            if (listIsDeleted(list.id, expandTombs(state, userId))) continue;
            const row = toListRow(list, userId, null);
            if (String(list.ownerId) === String(userId)) {
                const { data, error } = await sb.from('lists')
                    .update(row)
                    .eq('id', row.id)
                    .eq('owner_id', userId)
                    .select('id');
                if (error && !isBlockedWrite(error)) throw error;
                if (!error && data?.length) {
                    saved.push(list);
                    continue;
                }
            }

            const error = await insertListRow(sb, row);
            if (!error) {
                list.ownerId = userId;
                list.role = 'owner';
                saved.push(list);
                continue;
            }
            if (!isBlockedWrite(error)) throw error;
            throw new Error('Could not save that list id to the cloud. Try again or create a new list.');
        }
        return saved;
    }

    async function softDeleteTombstonedGroups(sb, state, userId) {
        const removedGroups = [...expandGroupTombs(state)].filter((id) => id && id !== 'default');
        if (!removedGroups.length) return;
        const stampNow = nowIso();
        const rows = removedGroups.map((id, index) => ({
            id: String(id),
            user_id: userId,
            name: 'Deleted',
            sort: index,
            deleted_at: stampNow,
            updated_at: stampNow
        }));
        const error = await upsertByUser(sb, 'groups', rows);
        if (error && !isBlockedWrite(error)) throw error;
    }

    async function softDeleteTombstonedLists(sb, state, userId) {
        const removedLists = [...expandTombs(state, userId)];
        if (!removedLists.length) return;
        const stampNow = nowIso();
        for (const id of removedLists) {
            if (id === 'default') continue;
            const { error: updateError } = await sb.from('lists')
                .update({ deleted_at: stampNow, updated_at: stampNow })
                .eq('id', id)
                .eq('owner_id', userId);
            if (updateError && !isBlockedWrite(updateError)) throw updateError;
            const { error: leaveError } = await sb.rpc('leave_shared_list', { p_list_id: id });
            void leaveError;
        }
    }

    async function softDeleteTombstonedTasks(sb, state) {
        const deletedIds = [...taskTombstoneSet(state)];
        if (!deletedIds.length) return;
        const stampNow = nowIso();
        const { error } = await sb.from('tasks')
            .update({ deleted_at: stampNow, updated_at: stampNow })
            .in('id', deletedIds);
        if (error && !isBlockedWrite(error)) throw error;
    }

    function openUserCacheDb() {
        return new Promise((resolve, reject) => {
            if (!global.indexedDB) {
                resolve(null);
                return;
            }
            const req = indexedDB.open(USER_CACHE_DB, 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(USER_CACHE_STORE)) {
                    db.createObjectStore(USER_CACHE_STORE);
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error || new Error('Could not open user cache.'));
        });
    }

    async function saveUserCache(userId, snapshot) {
        if (!userId || !snapshot) return;
        try {
            const db = await openUserCacheDb();
            if (!db) return;
            const payload = {
                lists: snapshot.lists || [],
                tasks: snapshot.tasks || [],
                tags: snapshot.tags || [],
                groups: snapshot.groups || [],
                settings: snapshot.settings || {},
                bitsParams: snapshot.bitsParams || {},
                customThemes: snapshot.customThemes || [],
                wallpaperAdjust: snapshot.wallpaperAdjust || {},
                currentListId: snapshot.currentListId || '',
                savedAt: nowIso()
            };
            await new Promise((resolve, reject) => {
                const tx = db.transaction(USER_CACHE_STORE, 'readwrite');
                tx.objectStore(USER_CACHE_STORE).put(payload, String(userId));
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
            db.close?.();
        } catch (err) {
            console.warn('Orbit user cache save', err);
        }
    }

    async function loadUserCache(userId) {
        if (!userId) return null;
        try {
            const db = await openUserCacheDb();
            if (!db) return null;
            const row = await new Promise((resolve, reject) => {
                const tx = db.transaction(USER_CACHE_STORE, 'readonly');
                const req = tx.objectStore(USER_CACHE_STORE).get(String(userId));
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => reject(req.error);
            });
            db.close?.();
            return row;
        } catch (err) {
            console.warn('Orbit user cache load', err);
            return null;
        }
    }

    async function paintFromUserCache(userId) {
        const cached = await loadUserCache(userId);
        if (!cached || !hooks.applyCloud) return false;
        hooks.applyCloud(cached);
        return true;
    }

    function applyIncrementalChange(table, payload) {
        const state = hooks.getState?.();
        if (!state || !hooks.applyCloud || editingNow()) {
            schedulePull();
            return;
        }
        const event = payload?.eventType || payload?.event;
        const row = payload?.new || payload?.record || null;
        const old = payload?.old || null;
        if (table === 'tasks') {
            if (event === 'DELETE' || (row && isSoftDeleted(row))) {
                const id = String((row || old)?.id || '');
                if (!id) return schedulePull();
                forgetDeletedTask(id);
                state.tasks = (state.tasks || []).filter((task) => String(task.id) !== id);
            } else if (row) {
                const next = fromTaskRow(row);
                if (isSoftDeleted(next)) {
                    state.tasks = (state.tasks || []).filter((task) => String(task.id) !== String(next.id));
                } else {
                    const index = (state.tasks || []).findIndex((task) => String(task.id) === String(next.id));
                    if (index >= 0) state.tasks[index] = mergeTaskFields(state.tasks[index], next);
                    else state.tasks = [...(state.tasks || []), next];
                }
            } else {
                return schedulePull();
            }
        } else if (table === 'lists') {
            if (event === 'DELETE' || (row && isSoftDeleted(row))) {
                const id = String((row || old)?.id || '');
                if (!id) return schedulePull();
                forgetDeleted(id);
                state.lists = (state.lists || []).filter((list) => String(list.id) !== id);
                state.tasks = (state.tasks || []).filter((task) => String(task.listId) !== id);
            } else if (row) {
                const next = fromListRow(row, 'owner');
                if (isSoftDeleted(next)) {
                    state.lists = (state.lists || []).filter((list) => String(list.id) !== String(next.id));
                } else {
                    const index = (state.lists || []).findIndex((list) => String(list.id) === String(next.id));
                    if (index >= 0) state.lists[index] = newer(next, state.lists[index]);
                    else state.lists = [...(state.lists || []), next];
                }
            } else {
                return schedulePull();
            }
        } else if (table === 'groups') {
            if (event === 'DELETE' || (row && isSoftDeleted(row))) {
                const id = String((row || old)?.id || '');
                if (!id) return schedulePull();
                forgetDeletedGroup(id);
                state.groups = (state.groups || []).filter((group) => String(group.id) !== id);
            } else if (row) {
                const next = fromGroupRow(row);
                if (isSoftDeleted(next)) {
                    state.groups = (state.groups || []).filter((group) => String(group.id) !== String(next.id));
                } else {
                    const index = (state.groups || []).findIndex((group) => String(group.id) === String(next.id));
                    if (index >= 0) state.groups[index] = newer(next, state.groups[index]);
                    else state.groups = [...(state.groups || []), next];
                }
            } else {
                return schedulePull();
            }
        } else {
            return schedulePull();
        }
        hooks.persistLocal?.();
        hooks.applyCloud({
            lists: state.lists,
            tasks: state.tasks,
            tags: state.tags,
            groups: state.groups,
            settings: state.settings,
            bitsParams: state.bitsParams,
            customThemes: state.customThemes,
            wallpaperAdjust: state.wallpaperAdjust,
            currentListId: state.currentListId
        });
    }

    async function pull() {
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user || !hooks.getState || !hooks.applyCloud) return;
        const prefsNow = syncPrefs();
        if (prefsNow.mode === 'off') return;

        const local = hooks.getState();
        if (ensureHomeListId(local, user.id) || ensureDefaultTagIds(local, user.id)) hooks.persistLocal?.();
        const idsAtStart = new Set((local.lists || []).map((list) => String(list.id)));
        const groupIdsAtStart = new Set((local.groups || []).map((group) => String(group.id)));
        const taskIdsAtStart = new Set((local.tasks || []).map((task) => String(task.id)));
        const themeIdsAtStart = new Set((local.customThemes || []).map((theme) => String(theme.id)));

        const [listsRes, membersRes, tasksRes, tagsRes, groupsRes, prefsRes] = await Promise.all([
            sb.from('lists').select('*'),
            sb.from('list_members').select('list_id, role, user_id').eq('user_id', user.id),
            sb.from('tasks').select('*'),
            sb.from('tags').select('*').eq('user_id', user.id),
            sb.from('groups').select('*').eq('user_id', user.id),
            sb.from('user_prefs').select('*').eq('user_id', user.id).maybeSingle()
        ]);

        const err = listsRes.error || membersRes.error || tasksRes.error || tagsRes.error || groupsRes.error || prefsRes.error;
        if (err) throw err;

        const live = hooks.getState() || local;
        const previousSync = lastSyncAt;
        const roleByList = {};
        (membersRes.data || []).forEach((row) => {
            roleByList[row.list_id] = row.role;
        });

        const deletedLists = expandTombs(live, user.id);
        const deletedGroups = expandGroupTombs(live);
        const allRemoteLists = (listsRes.data || []).map((row) => fromListRow(row, roleByList[row.id] || 'editor'));
        const serverDeletedLists = new Set(
            allRemoteLists.filter((list) => isSoftDeleted(list)).map((list) => String(list.id))
        );
        serverDeletedLists.forEach((id) => forgetDeleted(id));
        const remoteLists = allRemoteLists.filter((list) => (
            !isSoftDeleted(list) && !listIsDeleted(list.id, deletedLists)
        ));

        const allRemoteTasks = (tasksRes.data || []).map(fromTaskRow);
        const serverDeletedTasks = new Set(
            allRemoteTasks.filter((task) => isSoftDeleted(task)).map((task) => String(task.id))
        );
        if (serverDeletedTasks.size) forgetDeletedTask([...serverDeletedTasks]);
        const remoteTasks = allRemoteTasks.filter((task) => !isSoftDeleted(task));

        const remoteTags = (tagsRes.data || [])
            .filter((row) => !isSoftDeleted(row))
            .map((row) => ({
                id: row.id,
                name: row.name,
                color: row.color,
                updatedAt: row.updated_at
            }));

        const allRemoteGroups = (groupsRes.data || []).map(fromGroupRow);
        const serverDeletedGroups = new Set(
            allRemoteGroups.filter((group) => isSoftDeleted(group)).map((group) => String(group.id))
        );
        serverDeletedGroups.forEach((id) => forgetDeletedGroup(id));
        const remoteGroups = allRemoteGroups.filter((group) => (
            !isSoftDeleted(group) && !groupIsDeleted(group.id, deletedGroups)
        ));

        const liveIds = new Set((live.lists || []).map((list) => String(list.id)));
        const liveGroupIds = new Set((live.groups || []).map((group) => String(group.id)));
        const liveTaskIds = new Set((live.tasks || []).map((task) => String(task.id)));
        const deleted = taskTombstoneSet(live);
        const remoteIds = new Set(remoteLists.map((list) => String(list.id)));
        const remoteGroupIds = new Set(remoteGroups.map((group) => String(group.id)));
        const localOnlyIds = new Set(
            (live.lists || []).filter(listIsLocalOnly).map((list) => String(list.id))
        );
        const contentPrefs = syncPrefs();

        const lists = contentPrefs.lists
            ? filterPulledLists(mergeById(live.lists || [], remoteLists), {
                tombs: deletedLists,
                idsAtStart,
                liveIds,
                remoteIds,
                localOnlyIds,
                serverDeletedIds: serverDeletedLists
            })
            : [...(live.lists || [])];

        const remoteTaskIds = new Set(remoteTasks.map((task) => String(task.id)));
        const listIds = new Set(lists.map((list) => String(list.id)));
        const tasks = contentPrefs.lists
            ? filterPulledTasks(mergeById(live.tasks || [], remoteTasks, mergeTaskFields), {
                tombs: deleted,
                idsAtStart: taskIdsAtStart,
                liveIds: liveTaskIds,
                remoteIds: remoteTaskIds,
                serverDeletedIds: serverDeletedTasks
            }).filter((task) => {
                const id = String(task.id);
                if (!listIds.has(String(task.listId)) || listIsDeleted(task.listId, deletedLists)) return false;
                if (serverDeletedLists.has(String(task.listId))) return false;
                if (localOnlyIds.has(String(task.listId))) return true;
                if (remoteTaskIds.has(id)) return true;
                return !previousSync || stamp(task.updatedAt) >= stamp(previousSync);
            })
            : [...(live.tasks || [])].filter((task) => !taskIsDeleted(task.id, deleted));
        const tags = mergeById(live.tags || [], remoteTags);
        const groups = contentPrefs.groups
            ? filterPulledGroups(mergeById(live.groups || [], remoteGroups), {
                tombs: deletedGroups,
                idsAtStart: groupIdsAtStart,
                liveIds: liveGroupIds,
                remoteIds: remoteGroupIds,
                serverDeletedIds: serverDeletedGroups
            })
            : [...(live.groups || [])];

        const prefs = prefsRes.data;
        let settings = live.settings;
        let bitsParams = live.bitsParams;
        let customThemes = live.customThemes || [];
        let wallpaperAdjust = live.wallpaperAdjust || {};
        if (prefs && stamp(prefs.updated_at) >= stamp(live.settings?.updatedAt)) {
            const localPets = live.settings?.pets;
            const localPetChoice = live.settings?.petChoice;
            settings = { ...(live.settings || {}), ...(prefs.settings || {}), updatedAt: prefs.updated_at };
            if (localPets) settings.pets = localPets;
            if (localPetChoice) settings.petChoice = localPetChoice;
            bitsParams = prefs.bits_params && typeof prefs.bits_params === 'object' ? prefs.bits_params : bitsParams;
            if (prefs.wallpaper_adjust && typeof prefs.wallpaper_adjust === 'object') {
                wallpaperAdjust = { ...(live.wallpaperAdjust || {}), ...prefs.wallpaper_adjust };
            }
        }
        const liveThemeIds = new Set((live.customThemes || []).map((theme) => String(theme.id)));
        const remoteThemes = Array.isArray(prefs?.custom_themes) ? prefs.custom_themes : [];
        customThemes = mergeById(live.customThemes || [], remoteThemes).filter((theme) => {
            const id = String(theme.id);
            if (themeIdsAtStart.has(id) && !liveThemeIds.has(id)) return false;
            return true;
        }).slice(0, WALLPAPER_MAX);

        let currentListId = live.currentListId;
        const fresh = hooks.getState() || live;
        const tombsNow = expandTombs(fresh, user.id);
        const groupTombsNow = expandGroupTombs(fresh);
        const freshTaskIds = new Set((fresh.tasks || []).map((task) => String(task.id)));
        const taskTombsNow = taskTombstoneSet(fresh);
        const cloudState = { lists, tasks, currentListId };
        ensureHomeListId(cloudState, user.id);
        cloudState.lists = (cloudState.lists || []).filter((list) => {
            const id = String(list.id);
            if (serverDeletedLists.has(id) || listIsDeleted(id, tombsNow)) return false;
            return true;
        }).map((list) => {
            const localList = (fresh.lists || []).find((item) => String(item.id) === String(list.id));
            return listIsLocalOnly(localList) ? localList : list;
        });
        const keptListIds = new Set((cloudState.lists || []).map((list) => String(list.id)));
        cloudState.tasks = (cloudState.tasks || []).filter((task) => {
            const id = String(task.id);
            if (listIsDeleted(task.listId, tombsNow) || !keptListIds.has(String(task.listId))) return false;
            if (serverDeletedTasks.has(id) || taskIsDeleted(id, taskTombsNow)) return false;
            if (taskIdsAtStart.has(id) && !freshTaskIds.has(id)) return false;
            return true;
        });
        const editing = hooks.editingItem?.();
        if (editing?.kind === 'task') {
            const localTask = (fresh.tasks || []).find((item) => String(item.id) === String(editing.id || editing.taskId));
            if (localTask) {
                const text = typeof editing.value === 'string' ? editing.value : localTask.text;
                const pinned = { ...localTask, text };
                const index = cloudState.tasks.findIndex((item) => String(item.id) === String(localTask.id));
                if (index >= 0) cloudState.tasks[index] = { ...cloudState.tasks[index], ...pinned };
                else cloudState.tasks.push(pinned);
            }
        }
        if (editing?.kind === 'list') {
            const localList = (fresh.lists || []).find((item) => String(item.id) === String(editing.id))
                || (fresh.lists || []).find((item) => String(item.id) === String(fresh.currentListId));
            if (localList && String(editing.value || '').trim()) {
                const index = cloudState.lists.findIndex((item) => String(item.id) === String(localList.id));
                if (index >= 0) {
                    cloudState.lists[index] = { ...cloudState.lists[index], name: editing.value.trim() };
                }
            }
        }
        const keptGroups = (groups || []).filter((group) => {
            const id = String(group.id);
            if (serverDeletedGroups.has(id) || groupIsDeleted(id, groupTombsNow)) return false;
            return true;
        });
        const liveCurrent = String(fresh.currentListId || live.currentListId || '');
        if (keptListIds.has(liveCurrent)) {
            cloudState.currentListId = fresh.currentListId || live.currentListId;
        } else if (prefs?.current_list_id && keptListIds.has(String(prefs.current_list_id))) {
            cloudState.currentListId = prefs.current_list_id;
        } else {
            cloudState.currentListId = cloudState.lists[0]?.id || '';
        }

        if (editingNow() && !hooks.editingItem?.()) {
            pendingKind = mergeKinds(pendingKind, 'pull');
            return;
        }

        lastSyncAt = nowIso();
        lastError = '';
        const snapshot = {
            lists: cloudState.lists,
            tasks: cloudState.tasks,
            tags,
            groups: keptGroups,
            settings,
            bitsParams,
            customThemes,
            wallpaperAdjust,
            currentListId: cloudState.currentListId
        };
        hooks.applyCloud(snapshot);
        void saveUserCache(user.id, snapshot);
        await syncWallpaperMedia();
    }

    async function push() {
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user || !hooks.getState) return;
        const prefsNow = syncPrefs();
        if (prefsNow.mode === 'off') return;
        const state = hooks.getState();
        if (ensureHomeListId(state, user.id) || ensureDefaultTagIds(state, user.id)) hooks.persistLocal?.();
        await uploadMissingWallpapers();
        await upsertUserPrefs(sb, user, hooks.getState());

        await softDeleteTombstonedLists(sb, state, user.id);
        const owned = prefsNow.lists ? await saveOwnedLists(sb, hooks.getState(), user.id) : [];
        const afterLists = hooks.getState();
        const blocked = expandTombs(afterLists, user.id);
        const editable = prefsNow.lists
            ? (afterLists.lists || []).filter((list) => !listIsDeleted(list.id, blocked) && !listIsLocalOnly(list))
            : [];
        const editableIds = editable.map((list) => String(list.id));

        await softDeleteTombstonedTasks(sb, hooks.getState() || state);

        if (owned.length) {
            const { error: memberError } = await sb.from('list_members').upsert(
                owned.map((list) => ({
                    list_id: String(list.id),
                    user_id: user.id,
                    role: 'owner'
                })),
                { onConflict: 'list_id,user_id', ignoreDuplicates: true }
            );
            if (memberError && isOnConflictMismatch(memberError)) {
                for (const list of owned) {
                    const { error: insertMember } = await sb.from('list_members').insert({
                        list_id: String(list.id),
                        user_id: user.id,
                        role: 'owner'
                    });
                    if (insertMember && !isBlockedWrite(insertMember)) throw insertMember;
                }
            } else if (memberError && !isBlockedWrite(memberError)) {
                throw memberError;
            }
        }

        const groupState = hooks.getState();
        await softDeleteTombstonedGroups(sb, groupState, user.id);
        const groupTombs = expandGroupTombs(groupState);
        const liveGroups = prefsNow.groups
            ? (groupState.groups || []).filter((group) => !groupIsDeleted(group.id, groupTombs))
            : [];
        const groups = liveGroups.map((group, index) => toGroupRow(group, user.id, index, null));
        if (groups.length) {
            const error = await upsertByUser(sb, 'groups', groups);
            if (error) throw error;
        }

        const afterGroups = hooks.getState();
        await softDeleteTombstonedLists(sb, afterGroups, user.id);
        await softDeleteTombstonedGroups(sb, afterGroups, user.id);

        const ownedIds = new Set(owned.map((list) => String(list.id)));
        const localTasks = (state.tasks || []).filter((task) => editableIds.includes(String(task.listId)));
        if (editableIds.length) {
            const { data: remoteTasks, error: taskSelectError } = await sb.from('tasks')
                .select('id, list_id, updated_at, deleted_at')
                .in('list_id', editableIds);
            if (taskSelectError) throw taskSelectError;
            const remoteById = new Map((remoteTasks || []).map((row) => [String(row.id), row]));
            const toUpsert = localTasks.filter((task) => {
                const remote = remoteById.get(String(task.id));
                if (!remote) return true;
                if (remote.deleted_at) return false;
                return stamp(task.updatedAt) >= stamp(remote.updated_at);
            });
            if (toUpsert.length) {
                const { error } = await sb.from('tasks').upsert(
                    toUpsert.map((task) => toTaskRow(task, null)),
                    { onConflict: 'id' }
                );
                if (error && isBlockedWrite(error)) {
                    toUpsert.forEach((task) => {
                        if (!ownedIds.has(String(task.listId))) return;
                        if (String(task.id).startsWith('task_')) return;
                        task.id = `task_${crypto.randomUUID()}`;
                    });
                    hooks.persistLocal?.();
                    const { error: retryError } = await sb.from('tasks').upsert(
                        toUpsert.map((task) => toTaskRow(task, null)),
                        { onConflict: 'id' }
                    );
                    if (retryError) throw retryError;
                } else if (error) {
                    throw error;
                }
            }
        } else if (localTasks.length) {
            const { error } = await sb.from('tasks').upsert(
                localTasks.map((task) => toTaskRow(task, null)),
                { onConflict: 'id' }
            );
            if (error) throw error;
        }

        const tags = (state.tags || []).map((tag) => ({
            id: String(tag.id),
            user_id: user.id,
            name: tag.name || 'Tag',
            color: tag.color || '#b19eef',
            deleted_at: null,
            updated_at: tag.updatedAt || nowIso()
        }));
        if (tags.length) {
            const error = await upsertByUser(sb, 'tags', tags);
            if (error) throw error;
        }

        await upsertUserPrefs(sb, user, hooks.getState() || state);
        lastSyncAt = nowIso();
        lastError = '';
        pullBlocked = false;
        void saveUserCache(user.id, hooks.getState() || state);
        const wrote = await downloadMissingWallpapers();
        if (wrote) hooks.onMedia?.();
    }

    async function run(kind, options = {}) {
        if (!kind) return;
        const prefsNow = syncPrefs();
        if (prefsNow.mode === 'off' && !options.force) return;
        if (busy) {
            pendingKind = mergeKinds(pendingKind, kind);
            return;
        }
        busy = true;
        pendingKind = mergeKinds(pendingKind, kind);
        try {
            while (pendingKind) {
                const next = pendingKind;
                pendingKind = null;
                if (next === 'push' || next === 'both') await push();
                const allowPull = options.force || (!pullBlocked && prefsNow.mode === 'live');
                if ((next === 'pull' || next === 'both') && allowPull) await pull();
            }
        } catch (err) {
            lastError = formatError(err);
            if (!lastError) lastError = '';
            console.warn('Orbit sync', err);
        } finally {
            busy = false;
            hooks.onStatus?.();
            if (pendingKind) run(pendingKind, options);
        }
    }

    function schedulePull() {
        if (!isConfigured() || !ready) return;
        if (syncPrefs().mode !== 'off') void pullWallpaperState();
        if (pullBlocked || syncPrefs().mode !== 'live') return;
        sessionUser().then((user) => {
            if (!user) return;
            if (pushTimer) {
                pendingKind = mergeKinds(pendingKind, 'pull');
                return;
            }
            run('pull');
        }).catch(() => {});
    }

    function stopLive() {
        if (pollTimer) {
            global.clearInterval(pollTimer);
            pollTimer = 0;
        }
        if (liveChannel) {
            liveChannel.unsubscribe();
            liveChannel = null;
        }
    }

    function stopWallpaperWatch() {
        if (wallpaperTimer) {
            global.clearInterval(wallpaperTimer);
            wallpaperTimer = 0;
        }
        if (wallpaperChannel) {
            wallpaperChannel.unsubscribe();
            wallpaperChannel = null;
        }
    }

    async function startWallpaperWatch() {
        stopWallpaperWatch();
        if (syncPrefs().mode === 'off') return;
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user) return;
        wallpaperChannel = sb.channel('orbit-wallpapers')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_prefs',
                filter: `user_id=eq.${user.id}`
            }, () => { void pullWallpaperState(); })
            .subscribe();
        wallpaperTimer = global.setInterval(() => {
            if (!document.hidden) void pullWallpaperState();
        }, 4000);
        await pullWallpaperState();
    }

    async function startLive() {
        stopLive();
        if (syncPrefs().mode !== 'live') return;
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user) return;
        liveChannel = sb.channel('orbit-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
                try { applyIncrementalChange('tasks', payload); } catch { schedulePull(); }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, (payload) => {
                try { applyIncrementalChange('lists', payload); } catch { schedulePull(); }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, (payload) => {
                try { applyIncrementalChange('groups', payload); } catch { schedulePull(); }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'list_members' }, () => schedulePull())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tags' }, () => schedulePull())
            .subscribe();
        pollTimer = global.setInterval(() => {
            if (!document.hidden) schedulePull();
        }, 8000);
    }

    function schedulePush() {
        if (!isConfigured() || !ready) return;
        if (syncPrefs().mode === 'off') return;
        clearTimeout(pushTimer);
        pushTimer = global.setTimeout(() => {
            pushTimer = 0;
            sessionUser().then((user) => {
                if (user) run('push');
            }).catch(() => {});
        }, PUSH_WAIT);
    }

    const OrbitSync = {
        isConfigured,
        isHomeListId,
        formatAuthError,
        lastSyncAt() { return lastSyncAt; },
        lastError() { return lastError; },
        pendingInvite() { return Boolean(inviteFromLocation()); },
        rememberDeleted,
        forgetDeleted,
        rememberDeletedGroup,
        forgetDeletedGroup,
        rememberDeletedTask,
        forgetDeletedTask,
        noteLocalDelete,
        listIsDeleted,
        groupIsDeleted,
        taskIsDeleted,
        deletedListIds() {
            return [...tombstoneSet(hooks.getState?.())];
        },
        deletedGroupIds() {
            return [...groupTombstoneSet(hooks.getState?.())];
        },
        deletedTaskIds() {
            return [...taskTombstoneSet(hooks.getState?.())];
        },
        syncMode() {
            return syncPrefs().mode;
        },
        applySyncMode() {
            if (syncPrefs().mode === 'off') {
                stopLive();
                stopWallpaperWatch();
                return Promise.resolve();
            }
            const live = syncPrefs().mode === 'live' ? startLive() : (stopLive(), Promise.resolve());
            return Promise.all([live, startWallpaperWatch()]);
        },
        wallpaperQuota,
        async uploadWallpaper(id, blob) {
            await uploadWallpaperFile(id, blob);
        },
        async deleteWallpaper(id) {
            await deleteWallpaperFile(id);
        },
        async syncWallpapers() {
            await syncWallpaperMedia();
        },
        _test: {
            filterPulledLists,
            filterPulledGroups,
            filterPulledTasks,
            listIsDeleted,
            groupIsDeleted,
            taskIsDeleted,
            mergeById
        },
        async user() {
            return sessionUser();
        },
        async init(nextHooks) {
            hooks = nextHooks || {};
            runLocalMigration();
            const sb = await getClient();
            if (!sb) {
                hooks.onStatus?.();
                return;
            }
            // Sync callback must not await auth APIs (getSession/getUser) or the
            // supabase-js auth lock deadlocks and reload looks signed-out.
            sb.auth.onAuthStateChange((event, session) => {
                global.setTimeout(() => {
                    void handleAuthEvent(event, session);
                }, 0);
            });
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) schedulePull();
            });
            window.addEventListener('focus', () => schedulePull());
            document.addEventListener('focusout', () => {
                global.setTimeout(() => {
                    if (editingNow()) return;
                    schedulePull();
                }, 200);
            });
            await OrbitSync.consumeInviteFromUrl();
            ready = true;
            const user = await sessionUser();
            if (user) {
                cachedUserId = user.id;
                hooks.ensureLiveDefault?.();
                await paintFromUserCache(user.id);
                await startLive();
                await startWallpaperWatch();
            }
            hooks.onStatus?.();
            hooks.onAuth?.();
        },
        async sendMagicLink(email) {
            const sb = await getClient();
            if (!sb) throw new Error('Cloud sync is not configured.');
            const { error } = await sb.auth.signInWithOtp({
                email: String(email || '').trim(),
                options: { emailRedirectTo: redirectTo() }
            });
            if (error) throw error;
        },
        async signInWithPassword(email, password) {
            const sb = await getClient();
            if (!sb) throw new Error('Cloud sync is not configured.');
            const { error } = await sb.auth.signInWithPassword({
                email: String(email || '').trim(),
                password: String(password || '')
            });
            if (error) throw error;
        },
        async signUpWithPassword(email, password) {
            const sb = await getClient();
            if (!sb) throw new Error('Cloud sync is not configured.');
            const { data, error } = await sb.auth.signUp({
                email: String(email || '').trim(),
                password: String(password || ''),
                options: { emailRedirectTo: redirectTo() }
            });
            if (error) throw error;
            return data;
        },
        async signOut() {
            const sb = await getClient();
            if (!sb) return;
            await sb.auth.signOut();
        },
        schedulePush,
        async syncNow() {
            if (syncPrefs().mode === 'off') return;
            pullBlocked = false;
            await run('both', { force: true });
        },
        async pushNow() {
            await run('push');
        },
        async createInvite() {
            throw new Error('List sharing is paused while personal sync is being fixed.');
        },
        async redeemInvite(token) {
            const sb = await getClient();
            const user = await sessionUser();
            if (!sb) throw new Error('Cloud sync is not configured.');
            if (!user) throw new Error('Sign in first, then open the invite again.');
            const { data, error } = await sb.rpc('redeem_list_invite', { invite_token: String(token) });
            if (error) throw error;
            await run('pull');
            if (data) hooks.onJoinedList?.(data);
            return data;
        },
        async consumeInviteFromUrl() {
            const params = new URLSearchParams(location.search);
            const token = inviteFromLocation();
            if (params.get('invite')) rememberInvite(params.get('invite'));
            if (!token) return;
            rememberInvite(token);
            const user = await sessionUser();
            if (!user) {
                hooks.onInvitePending?.();
                hooks.onStatus?.();
                return;
            }
            try {
                await OrbitSync.redeemInvite(token);
                forgetInvite();
                params.delete('invite');
                const next = `${location.pathname}${params.toString() ? `?${params}` : ''}${location.hash}`;
                history.replaceState({}, '', next);
            } catch (err) {
                lastError = formatError(err) || 'Could not join that list.';
                hooks.onStatus?.();
            }
        },
        async leaveList(listId) {
            rememberDeleted(listId);
            const sb = await getClient();
            if (!sb) return;
            const { error } = await sb.rpc('leave_shared_list', { p_list_id: String(listId) });
            if (error) throw error;
        },
        async removeList(listId) {
            rememberDeleted(listId);
            const sb = await getClient();
            const user = await sessionUser();
            if (!sb || !user || !listId) return;
            const id = String(listId);
            const stampNow = nowIso();
            const { error: softError } = await sb.from('lists')
                .update({ deleted_at: stampNow, updated_at: stampNow })
                .eq('id', id)
                .eq('owner_id', user.id);
            if (softError && !isBlockedWrite(softError)) throw softError;
            const { error: leaveError } = await sb.rpc('leave_shared_list', { p_list_id: id });
            void leaveError;
        }
    };

    global.OrbitSync = OrbitSync;
})(window);
