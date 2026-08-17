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
    const INVITE_KEY = 'orbit_invite';

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

    function formatError(err) {
        if (!err) return 'Sync failed';
        if (typeof err === 'string') return err;
        const text = [err.message, err.details, err.hint].filter(Boolean).join(' — ');
        if (/row-level security/i.test(text)) {
            return 'Cloud blocked that save. A list id was already taken, so Orbit will retry with a new id.';
        }
        return text || 'Sync failed';
    }

    function isBlockedWrite(err) {
        const code = String(err?.code || '');
        const text = `${err?.message || ''} ${err?.details || ''}`;
        return code === '23505' || code === '42501' || /row-level security|duplicate key/i.test(text);
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
        return copy;
    }

    async function getClient() {
        if (!isConfigured() || !global.supabase?.createClient) return null;
        if (client) return client;
        client = global.supabase.createClient(config().url, config().anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        return client;
    }

    async function sessionUser() {
        const sb = await getClient();
        if (!sb) return null;
        const { data: userData, error: userError } = await sb.auth.getUser();
        if (userData?.user) return userData.user;
        const { data: sessionData } = await sb.auth.getSession();
        if (sessionData?.session?.user) return sessionData.session.user;
        if (userError && sessionData?.session) lastError = formatError(userError);
        return null;
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

    function toListRow(list, userId) {
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
            updatedAt: row.updated_at
        };
    }

    function toTaskRow(task) {
        return {
            id: String(task.id),
            list_id: String(task.listId),
            text: task.text || '',
            completed: Boolean(task.completed),
            date: task.date || null,
            tags: Array.isArray(task.tags) ? task.tags : [],
            sort_order: Number.isFinite(Number(task.order)) ? Number(task.order) : 0,
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
            updatedAt: row.updated_at
        };
    }

    function mergeById(localItems, remoteItems) {
        const map = new Map();
        (localItems || []).forEach((item) => {
            if (item?.id) map.set(String(item.id), item);
        });
        (remoteItems || []).forEach((item) => {
            const id = String(item.id);
            const current = map.get(id);
            map.set(id, current ? newer(item, current) : item);
        });
        return [...map.values()];
    }

    function ensureHomeListId(state, userId) {
        if (!state || !userId) return false;
        const homeId = homeListId(userId);
        const lists = state.lists || [];
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
        return (state.lists || []).filter((list) => (
            list.role !== 'editor'
            && (!list.ownerId || String(list.ownerId) === String(userId))
        ));
    }

    async function upsertByUser(sb, table, rows) {
        if (!rows.length) return;
        let { error } = await sb.from(table).upsert(rows, { onConflict: 'user_id,id' });
        if (error && /on conflict|there is no unique/i.test(`${error.message} ${error.details || ''}`)) {
            ({ error } = await sb.from(table).upsert(rows, { onConflict: 'id' }));
        }
        return error;
    }

    async function insertListRow(sb, row) {
        const { error } = await sb.from('lists').insert(row);
        return error;
    }

    async function saveOwnedLists(sb, state, userId) {
        const owned = ownedLists(state, userId);
        let remapped = false;
        for (const list of owned) {
            const row = toListRow(list, userId);
            if (String(list.ownerId) === String(userId)) {
                const { data, error } = await sb.from('lists')
                    .update(row)
                    .eq('id', row.id)
                    .eq('owner_id', userId)
                    .select('id');
                if (error && !isBlockedWrite(error)) throw error;
                if (!error && data?.length) continue;
            }

            let error = await insertListRow(sb, row);
            if (!error) {
                list.ownerId = userId;
                list.role = 'owner';
                continue;
            }
            if (!isBlockedWrite(error)) throw error;

            const newId = `list_${crypto.randomUUID()}`;
            remapListId(state, list.id, newId);
            row.id = newId;
            error = await insertListRow(sb, row);
            if (error) throw error;
            list.ownerId = userId;
            list.role = 'owner';
            remapped = true;
        }
        if (remapped) hooks.persistLocal?.();
        return owned;
    }

    async function pull() {
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user || !hooks.getState || !hooks.applyCloud) return;

        const local = hooks.getState();
        if (ensureHomeListId(local, user.id) || ensureDefaultTagIds(local, user.id)) hooks.persistLocal?.();

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

        const roleByList = {};
        (membersRes.data || []).forEach((row) => {
            roleByList[row.list_id] = row.role;
        });

        const remoteLists = (listsRes.data || []).map((row) => fromListRow(row, roleByList[row.id] || 'editor'));
        const remoteTasks = (tasksRes.data || []).map(fromTaskRow);
        const remoteTags = (tagsRes.data || []).map((row) => ({
            id: row.id,
            name: row.name,
            color: row.color,
            updatedAt: row.updated_at
        }));
        const remoteGroups = (groupsRes.data || []).map((row) => ({
            id: row.id,
            name: row.name,
            sort: Number(row.sort) || 0,
            updatedAt: row.updated_at
        }));

        const ownedIds = new Set(
            (local.lists || [])
                .filter((list) => list.role !== 'editor')
                .map((list) => String(list.id))
        );
        const remoteIds = new Set(remoteLists.map((list) => String(list.id)));

        const lists = mergeById(
            (local.lists || []).filter((list) => list.role === 'editor' || ownedIds.has(String(list.id))),
            remoteLists
        ).filter((list) => remoteIds.has(String(list.id)) || list.role !== 'editor');

        const listIds = new Set(lists.map((list) => String(list.id)));
        const tasks = mergeById(local.tasks || [], remoteTasks).filter((task) => listIds.has(String(task.listId)));
        const tags = mergeById(local.tags || [], remoteTags);
        const groups = mergeById(local.groups || [], remoteGroups);

        const prefs = prefsRes.data;
        let settings = local.settings;
        let bitsParams = local.bitsParams;
        let currentListId = local.currentListId;
        if (prefs && stamp(prefs.updated_at) >= stamp(local.settings?.updatedAt)) {
            const localPets = local.settings?.pets;
            const localPetChoice = local.settings?.petChoice;
            settings = { ...(local.settings || {}), ...(prefs.settings || {}), updatedAt: prefs.updated_at };
            if (localPets) settings.pets = localPets;
            if (localPetChoice) settings.petChoice = localPetChoice;
            bitsParams = prefs.bits_params && typeof prefs.bits_params === 'object' ? prefs.bits_params : bitsParams;
            if (prefs.current_list_id) currentListId = prefs.current_list_id;
        }

        const cloudState = { lists, tasks, currentListId };
        ensureHomeListId(cloudState, user.id);

        lastSyncAt = nowIso();
        lastError = '';
        hooks.applyCloud({
            lists: cloudState.lists,
            tasks: cloudState.tasks,
            tags,
            groups,
            settings,
            bitsParams,
            currentListId: cloudState.currentListId
        });
    }

    async function push() {
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user || !hooks.getState) return;
        const state = hooks.getState();
        if (ensureHomeListId(state, user.id) || ensureDefaultTagIds(state, user.id)) hooks.persistLocal?.();

        const owned = await saveOwnedLists(sb, state, user.id);
        const editable = state.lists || [];
        const editableIds = editable.map((list) => String(list.id));

        if (owned.length) {
            const { error: memberError } = await sb.from('list_members').upsert(
                owned.map((list) => ({
                    list_id: String(list.id),
                    user_id: user.id,
                    role: 'owner'
                })),
                { onConflict: 'list_id,user_id', ignoreDuplicates: true }
            );
            if (memberError && !isBlockedWrite(memberError)) throw memberError;
        }

        const groups = (state.groups || []).map((group, index) => ({
            id: String(group.id),
            user_id: user.id,
            name: group.name || 'Group',
            sort: Number.isFinite(Number(group.sort)) ? Number(group.sort) : index,
            updated_at: group.updatedAt || nowIso()
        }));
        if (groups.length) {
            let error = await upsertByUser(sb, 'groups', groups);
            if (error && isBlockedWrite(error)) {
                for (const group of state.groups || []) {
                    const compact = String(user.id).replace(/-/g, '');
                    if (String(group.id).includes(compact)) continue;
                    const next = `group_${compact}_${group.id}`.slice(0, 80);
                    (state.lists || []).forEach((list) => {
                        if (String(list.groupId) === String(group.id)) list.groupId = next;
                    });
                    group.id = next;
                }
                hooks.persistLocal?.();
                const retryGroups = (state.groups || []).map((group, index) => ({
                    id: String(group.id),
                    user_id: user.id,
                    name: group.name || 'Group',
                    sort: Number.isFinite(Number(group.sort)) ? Number(group.sort) : index,
                    updated_at: group.updatedAt || nowIso()
                }));
                error = await upsertByUser(sb, 'groups', retryGroups);
            }
            if (error) throw error;
        }

        const { data: remoteOwned } = await sb.from('lists').select('id').eq('owner_id', user.id);
        const localOwnedIds = new Set(owned.map((list) => String(list.id)));
        const extraLists = (remoteOwned || []).filter((row) => !localOwnedIds.has(row.id)).map((row) => row.id);
        if (extraLists.length) {
            const { error } = await sb.from('lists').delete().in('id', extraLists);
            if (error) throw error;
        }

        const { data: remoteGroups } = await sb.from('groups').select('id').eq('user_id', user.id);
        const localGroupIds = new Set((state.groups || []).map((group) => String(group.id)));
        const extraGroups = (remoteGroups || []).filter((row) => !localGroupIds.has(row.id)).map((row) => row.id);
        if (extraGroups.length) {
            const { error } = await sb.from('groups').delete().eq('user_id', user.id).in('id', extraGroups);
            if (error) throw error;
        }

        const ownedIds = new Set(owned.map((list) => String(list.id)));
        const localTasks = (state.tasks || []).filter((task) => editableIds.includes(String(task.listId)));
        if (editableIds.length) {
            const { data: remoteTasks, error: taskSelectError } = await sb.from('tasks')
                .select('id, list_id, updated_at')
                .in('list_id', editableIds);
            if (taskSelectError) throw taskSelectError;
            const remoteById = new Map((remoteTasks || []).map((row) => [String(row.id), row]));
            const toUpsert = localTasks.filter((task) => {
                const remote = remoteById.get(String(task.id));
                if (!remote) return true;
                return stamp(task.updatedAt) >= stamp(remote.updated_at);
            });
            if (toUpsert.length) {
                const { error } = await sb.from('tasks').upsert(toUpsert.map(toTaskRow), { onConflict: 'id' });
                if (error && isBlockedWrite(error)) {
                    const compact = String(user.id).replace(/-/g, '');
                    toUpsert.forEach((task) => {
                        if (!ownedIds.has(String(task.listId))) return;
                        if (String(task.id).includes(compact)) return;
                        task.id = `task_${crypto.randomUUID()}`;
                    });
                    hooks.persistLocal?.();
                    const { error: retryError } = await sb.from('tasks').upsert(toUpsert.map(toTaskRow), { onConflict: 'id' });
                    if (retryError) throw retryError;
                } else if (error) {
                    throw error;
                }
            }
            const localTaskIds = new Set(localTasks.map((task) => String(task.id)));
            const extraOwned = (remoteTasks || [])
                .filter((row) => ownedIds.has(String(row.list_id)) && !localTaskIds.has(String(row.id)))
                .map((row) => row.id);
            if (extraOwned.length) {
                const { error } = await sb.from('tasks').delete().in('id', extraOwned);
                if (error) throw error;
            }
        } else if (localTasks.length) {
            const { error } = await sb.from('tasks').upsert(localTasks.map(toTaskRow), { onConflict: 'id' });
            if (error) throw error;
        }

        const tags = (state.tags || []).map((tag) => ({
            id: String(tag.id),
            user_id: user.id,
            name: tag.name || 'Tag',
            color: tag.color || '#b19eef',
            updated_at: tag.updatedAt || nowIso()
        }));
        if (tags.length) {
            let error = await upsertByUser(sb, 'tags', tags);
            if (error && isBlockedWrite(error)) {
                const compact = String(user.id).replace(/-/g, '');
                const map = new Map();
                (state.tags || []).forEach((tag) => {
                    const id = String(tag.id);
                    if (id.includes(compact)) return;
                    const next = `tag_${compact}_${id}`.slice(0, 80);
                    map.set(id, next);
                    tag.id = next;
                });
                if (map.size) {
                    (state.tasks || []).forEach((task) => {
                        task.tags = (task.tags || []).map((id) => map.get(String(id)) || id);
                    });
                    hooks.persistLocal?.();
                }
                const retryTags = (state.tags || []).map((tag) => ({
                    id: String(tag.id),
                    user_id: user.id,
                    name: tag.name || 'Tag',
                    color: tag.color || '#b19eef',
                    updated_at: tag.updatedAt || nowIso()
                }));
                error = await upsertByUser(sb, 'tags', retryTags);
            }
            if (error) throw error;
        }
        const { data: remoteTags } = await sb.from('tags').select('id').eq('user_id', user.id);
        const localTagIds = new Set((state.tags || []).map((tag) => String(tag.id)));
        const extraTags = (remoteTags || []).filter((row) => !localTagIds.has(row.id)).map((row) => row.id);
        if (extraTags.length) {
            const { error } = await sb.from('tags').delete().eq('user_id', user.id).in('id', extraTags);
            if (error) throw error;
        }

        const { error: prefsError } = await sb.from('user_prefs').upsert({
            user_id: user.id,
            settings: settingsForCloud(state.settings),
            bits_params: state.bitsParams || {},
            wallpaper_adjust: {},
            custom_themes: [],
            current_list_id: state.currentListId || null,
            updated_at: nowIso()
        }, { onConflict: 'user_id' });
        if (prefsError) throw prefsError;

        lastSyncAt = nowIso();
        lastError = '';
    }

    async function run(kind) {
        if (!kind) return;
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
                if (next === 'pull' || next === 'both') await pull();
                if (next === 'push' || next === 'both') await push();
            }
        } catch (err) {
            lastError = formatError(err);
            console.warn('Orbit sync', err);
        } finally {
            busy = false;
            hooks.onStatus?.();
            if (pendingKind) run(pendingKind);
        }
    }

    function schedulePull() {
        if (!isConfigured() || !ready) return;
        sessionUser().then((user) => {
            if (user) run('pull');
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

    async function startLive() {
        stopLive();
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user) return;
        liveChannel = sb.channel('orbit-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => schedulePull())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => schedulePull())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'list_members' }, () => schedulePull())
            .subscribe();
        pollTimer = global.setInterval(() => {
            if (!document.hidden) schedulePull();
        }, 5000);
    }

    function schedulePush() {
        if (!isConfigured() || !ready) return;
        clearTimeout(pushTimer);
        pushTimer = global.setTimeout(() => {
            sessionUser().then((user) => {
                if (user) run('push');
            }).catch(() => {});
        }, PUSH_WAIT);
    }

    const OrbitSync = {
        isConfigured,
        isHomeListId,
        lastSyncAt() { return lastSyncAt; },
        lastError() { return lastError; },
        pendingInvite() { return Boolean(inviteFromLocation()); },
        async user() {
            return sessionUser();
        },
        async init(nextHooks) {
            hooks = nextHooks || {};
            const sb = await getClient();
            if (!sb) {
                hooks.onStatus?.();
                return;
            }
            sb.auth.onAuthStateChange(async (event) => {
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
                    await OrbitSync.consumeInviteFromUrl();
                    await run('both');
                    await startLive();
                }
                if (event === 'SIGNED_OUT') {
                    stopLive();
                    hooks.onStatus?.();
                }
                hooks.onAuth?.();
            });
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) schedulePull();
            });
            window.addEventListener('focus', () => schedulePull());
            await OrbitSync.consumeInviteFromUrl();
            ready = true;
            if (await sessionUser()) await startLive();
            hooks.onStatus?.();
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
        async signOut() {
            const sb = await getClient();
            if (!sb) return;
            await sb.auth.signOut();
        },
        schedulePush,
        async syncNow() {
            await run('both');
        },
        async pushNow() {
            await run('push');
        },
        async createInvite(listId) {
            const sb = await getClient();
            const user = await sessionUser();
            if (!sb || !user) throw new Error('Sign in to share a list.');
            await run('push');
            const state = hooks.getState?.() || {};
            const list = (state.lists || []).find((item) => (
                String(item.id) === String(listId)
                || (String(listId) === 'default' && isHomeListId(item.id))
            ));
            if (!list) throw new Error('Upload this list first, then share it.');
            if (list.role === 'editor') throw new Error('Only the owner can share this list.');
            const token = randomToken();
            const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString();
            const { error } = await sb.from('list_invites').insert({
                token,
                list_id: String(list.id),
                created_by: user.id,
                expires_at: expires
            });
            if (error) throw error;
            const url = new URL(redirectTo());
            url.searchParams.set('invite', token);
            return url.toString();
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
            const sb = await getClient();
            if (!sb) return;
            const { error } = await sb.rpc('leave_shared_list', { p_list_id: String(listId) });
            if (error) throw error;
        }
    };

    global.OrbitSync = OrbitSync;
})(window);
