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
    const TOMBSTONE_KEY = 'orbit_deleted_lists';
    const GROUP_TOMBSTONE_KEY = 'orbit_deleted_groups';
    const KNOWN_LISTS_KEY = 'orbit_known_lists';
    const KNOWN_GROUPS_KEY = 'orbit_known_groups';
    const sessionListTombs = new Set();
    const sessionGroupTombs = new Set();
    let pullBlocked = false;

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
        rememberKnown('list', extras);
        return rememberIds(TOMBSTONE_KEY, sessionListTombs, extras, 'deletedListIds');
    }

    function forgetDeleted(id) {
        const extras = [String(id)];
        if (isHomeListId(id)) extras.push('default');
        return forgetIds(TOMBSTONE_KEY, sessionListTombs, extras, 'deletedListIds');
    }

    function rememberDeletedGroup(id) {
        rememberKnown('group', [String(id)]);
        return rememberIds(GROUP_TOMBSTONE_KEY, sessionGroupTombs, [String(id)], 'deletedGroupIds');
    }

    function forgetDeletedGroup(id) {
        return forgetIds(GROUP_TOMBSTONE_KEY, sessionGroupTombs, [String(id)], 'deletedGroupIds');
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
        rememberKnown(kind, Array.isArray(ids) ? ids : [ids]);
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

    function filterPulledLists(merged, { tombs, idsAtStart, liveIds, remoteIds, knownIds, localOnlyIds }) {
        return (merged || []).filter((list) => {
            const id = String(list.id);
            if (listIsDeleted(id, tombs)) return false;
            if (localOnlyIds?.has(id)) return liveIds.has(id);
            if (idsAtStart.has(id) && !liveIds.has(id)) return false;
            if (knownIds?.has(id) && !liveIds.has(id)) return false;
            if (remoteIds.has(id)) return !listIsDeleted(id, tombs);
            if (list.role === 'editor') return false;
            return !list.ownerId;
        });
    }

    function filterPulledGroups(merged, { tombs, idsAtStart, liveIds, remoteIds, knownIds }) {
        return (merged || []).filter((group) => {
            const id = String(group.id);
            if (groupIsDeleted(id, tombs)) return false;
            if (idsAtStart.has(id) && !liveIds.has(id)) return false;
            if (knownIds?.has(id) && !liveIds.has(id)) return false;
            if (remoteIds.has(id)) return !groupIsDeleted(id, tombs);
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
        if (!rows.length) return;
        let lastError = null;
        for (const onConflict of ['id', 'user_id,id']) {
            const { error } = await sb.from(table).upsert(rows, { onConflict });
            if (!error) return;
            lastError = error;
            if (!isOnConflictMismatch(error)) return error;
        }
        return lastError;
    }

    async function insertListRow(sb, row) {
        const { error } = await sb.from('lists').insert(row);
        return error;
    }

    async function saveOwnedLists(sb, state, userId) {
        const saved = [];
        let remapped = false;
        for (const list of ownedLists(state, userId)) {
            if (listIsDeleted(list.id, expandTombs(state, userId))) continue;
            const row = toListRow(list, userId);
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

            let error = await insertListRow(sb, row);
            if (!error) {
                list.ownerId = userId;
                list.role = 'owner';
                saved.push(list);
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
            saved.push(list);
        }
        if (remapped) hooks.persistLocal?.();
        return saved;
    }

    async function deleteTombstonedGroups(sb, state, userId) {
        const removedGroups = [...expandGroupTombs(state)];
        if (!removedGroups.length) return;
        const { error } = await sb.from('groups')
            .delete()
            .eq('user_id', userId)
            .in('id', removedGroups);
        if (error && !isBlockedWrite(error)) throw error;
    }

    async function deleteTombstonedLists(sb, state, userId) {
        const removedLists = [...expandTombs(state, userId)];
        if (!removedLists.length) return;
        const { error: listDeleteError } = await sb.from('lists')
            .delete()
            .in('id', removedLists);
        if (listDeleteError && !isBlockedWrite(listDeleteError)) throw listDeleteError;
        for (const id of removedLists) {
            const { error: leaveError } = await sb.rpc('leave_shared_list', { p_list_id: id });
            void leaveError;
        }
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
        rememberKnown('list', idsAtStart);
        rememberKnown('group', groupIdsAtStart);

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
        const remoteLists = (listsRes.data || [])
            .map((row) => fromListRow(row, roleByList[row.id] || 'editor'))
            .filter((list) => !listIsDeleted(list.id, deletedLists));
        const remoteTasks = (tasksRes.data || []).map(fromTaskRow);
        const remoteTags = (tagsRes.data || []).map((row) => ({
            id: row.id,
            name: row.name,
            color: row.color,
            updatedAt: row.updated_at
        }));
        const remoteGroups = (groupsRes.data || [])
            .map((row) => ({
                id: row.id,
                name: row.name,
                sort: Number(row.sort) || 0,
                updatedAt: row.updated_at
            }))
            .filter((group) => !groupIsDeleted(group.id, deletedGroups));

        const liveIds = new Set((live.lists || []).map((list) => String(list.id)));
        const liveGroupIds = new Set((live.groups || []).map((group) => String(group.id)));
        const deleted = new Set((live.deletedTaskIds || []).map(String));
        const remoteIds = new Set(remoteLists.map((list) => String(list.id)));
        const remoteGroupIds = new Set(remoteGroups.map((group) => String(group.id)));
        const knownLists = knownListIds(live);
        const knownGroups = knownGroupIds(live);
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
                knownIds: knownLists,
                localOnlyIds
            })
            : [...(live.lists || [])];

        const remoteTaskIds = new Set(remoteTasks.map((task) => String(task.id)));
        const listIds = new Set(lists.map((list) => String(list.id)));
        const tasks = contentPrefs.lists
            ? mergeById(live.tasks || [], remoteTasks).filter((task) => {
                const id = String(task.id);
                if (!listIds.has(String(task.listId)) || deleted.has(id) || listIsDeleted(task.listId, deletedLists)) return false;
                if (localOnlyIds.has(String(task.listId))) return true;
                if (remoteTaskIds.has(id)) return true;
                return !previousSync || stamp(task.updatedAt) >= stamp(previousSync);
            })
            : [...(live.tasks || [])];
        const tags = mergeById(live.tags || [], remoteTags);
        const groups = contentPrefs.groups
            ? filterPulledGroups(mergeById(live.groups || [], remoteGroups), {
                tombs: deletedGroups,
                idsAtStart: groupIdsAtStart,
                liveIds: liveGroupIds,
                remoteIds: remoteGroupIds,
                knownIds: knownGroups
            })
            : [...(live.groups || [])];

        const prefs = prefsRes.data;
        let settings = live.settings;
        let bitsParams = live.bitsParams;
        if (prefs && stamp(prefs.updated_at) >= stamp(live.settings?.updatedAt)) {
            const localPets = live.settings?.pets;
            const localPetChoice = live.settings?.petChoice;
            settings = { ...(live.settings || {}), ...(prefs.settings || {}), updatedAt: prefs.updated_at };
            if (localPets) settings.pets = localPets;
            if (localPetChoice) settings.petChoice = localPetChoice;
            bitsParams = prefs.bits_params && typeof prefs.bits_params === 'object' ? prefs.bits_params : bitsParams;
        }

        let currentListId = live.currentListId;
        const fresh = hooks.getState() || live;
        const tombsNow = expandTombs(fresh, user.id);
        const groupTombsNow = expandGroupTombs(fresh);
        const freshListIds = new Set((fresh.lists || []).map((list) => String(list.id)));
        const freshGroupIds = new Set((fresh.groups || []).map((group) => String(group.id)));
        const knownNow = knownListIds(fresh);
        const knownGroupsNow = knownGroupIds(fresh);
        const cloudState = { lists, tasks, currentListId };
        ensureHomeListId(cloudState, user.id);
        cloudState.lists = (cloudState.lists || []).filter((list) => {
            const id = String(list.id);
            if (listIsDeleted(id, tombsNow)) return false;
            if (knownNow.has(id) && !freshListIds.has(id)) return false;
            return true;
        }).map((list) => {
            const localList = (fresh.lists || []).find((item) => String(item.id) === String(list.id));
            return listIsLocalOnly(localList) ? localList : list;
        });
        const keptListIds = new Set((cloudState.lists || []).map((list) => String(list.id)));
        cloudState.tasks = (cloudState.tasks || []).filter((task) => (
            !listIsDeleted(task.listId, tombsNow) && keptListIds.has(String(task.listId))
        ));
        const keptGroups = (groups || []).filter((group) => {
            const id = String(group.id);
            if (groupIsDeleted(id, groupTombsNow)) return false;
            if (knownGroupsNow.has(id) && !freshGroupIds.has(id)) return false;
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

        lastSyncAt = nowIso();
        lastError = '';
        rememberKnown('list', keptListIds);
        rememberKnown('group', keptGroups.map((group) => group.id));
        hooks.applyCloud({
            lists: cloudState.lists,
            tasks: cloudState.tasks,
            tags,
            groups: keptGroups,
            settings,
            bitsParams,
            currentListId: cloudState.currentListId
        });
    }

    async function push() {
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user || !hooks.getState) return;
        const prefsNow = syncPrefs();
        if (prefsNow.mode === 'off') return;
        const state = hooks.getState();
        if (ensureHomeListId(state, user.id) || ensureDefaultTagIds(state, user.id)) hooks.persistLocal?.();
        rememberKnown('list', (state.lists || []).map((list) => list.id));
        rememberKnown('group', (state.groups || []).map((group) => group.id));

        await deleteTombstonedLists(sb, state, user.id);
        const owned = prefsNow.lists ? await saveOwnedLists(sb, hooks.getState(), user.id) : [];
        const afterLists = hooks.getState();
        const blocked = expandTombs(afterLists, user.id);
        const editable = prefsNow.lists
            ? (afterLists.lists || []).filter((list) => !listIsDeleted(list.id, blocked) && !listIsLocalOnly(list))
            : [];
        const editableIds = editable.map((list) => String(list.id));

        const deletedIds = (state.deletedTaskIds || []).map(String).filter(Boolean);
        if (deletedIds.length) {
            const { error: deleteError } = await sb.from('tasks').delete().in('id', deletedIds);
            if (deleteError && !isBlockedWrite(deleteError)) throw deleteError;
            state.deletedTaskIds = [];
            hooks.persistLocal?.();
        }

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
        await deleteTombstonedGroups(sb, groupState, user.id);
        const groupTombs = expandGroupTombs(groupState);
        const liveGroups = prefsNow.groups
            ? (groupState.groups || []).filter((group) => !groupIsDeleted(group.id, groupTombs))
            : [];
        const groups = liveGroups.map((group, index) => ({
            id: String(group.id),
            user_id: user.id,
            name: group.name || 'Group',
            sort: Number.isFinite(Number(group.sort)) ? Number(group.sort) : index,
            updated_at: group.updatedAt || nowIso()
        }));
        if (groups.length) {
            let error = await upsertByUser(sb, 'groups', groups);
            if (error && isBlockedWrite(error)) {
                for (const group of liveGroups) {
                    const compact = String(user.id).replace(/-/g, '');
                    if (String(group.id).includes(compact)) continue;
                    const next = `group_${compact}_${group.id}`.slice(0, 80);
                    (groupState.lists || []).forEach((list) => {
                        if (String(list.groupId) === String(group.id)) list.groupId = next;
                    });
                    group.id = next;
                }
                hooks.persistLocal?.();
                const retryTombs = expandGroupTombs(hooks.getState());
                const retryGroups = (hooks.getState().groups || [])
                    .filter((group) => !groupIsDeleted(group.id, retryTombs))
                    .map((group, index) => ({
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

        const afterGroups = hooks.getState();
        await deleteTombstonedLists(sb, afterGroups, user.id);
        await deleteTombstonedGroups(sb, afterGroups, user.id);

        if (prefsNow.groups) {
            const { data: remoteGroups } = await sb.from('groups').select('id').eq('user_id', user.id);
            const keptGroupIds = new Set(
                (afterGroups.groups || [])
                    .filter((group) => !groupIsDeleted(group.id, expandGroupTombs(afterGroups)))
                    .map((group) => String(group.id))
            );
            const extraGroups = (remoteGroups || [])
                .map((row) => row.id)
                .filter((id) => !keptGroupIds.has(String(id)) || groupIsDeleted(id, expandGroupTombs(afterGroups)));
            if (extraGroups.length) {
                const { error } = await sb.from('groups').delete().eq('user_id', user.id).in('id', extraGroups);
                if (error) throw error;
            }
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
        pullBlocked = false;
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

    async function startLive() {
        stopLive();
        if (syncPrefs().mode !== 'live') return;
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user) return;
        liveChannel = sb.channel('orbit-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => schedulePull())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'lists' }, () => schedulePull())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => schedulePull())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'list_members' }, () => schedulePull())
            .subscribe();
        pollTimer = global.setInterval(() => {
            if (!document.hidden) schedulePull();
        }, 3000);
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
        noteLocalDelete,
        listIsDeleted,
        groupIsDeleted,
        deletedListIds() {
            return [...tombstoneSet(hooks.getState?.())];
        },
        deletedGroupIds() {
            return [...groupTombstoneSet(hooks.getState?.())];
        },
        syncMode() {
            return syncPrefs().mode;
        },
        applySyncMode() {
            if (syncPrefs().mode === 'live') return startLive();
            stopLive();
            return Promise.resolve();
        },
        _test: {
            filterPulledLists,
            filterPulledGroups,
            listIsDeleted,
            groupIsDeleted,
            mergeById
        },
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
                    const prefsNow = syncPrefs();
                    if (prefsNow.mode === 'off') {
                        stopLive();
                    } else if (event === 'SIGNED_IN') {
                        await run('both', { force: true });
                        await startLive();
                    } else if (prefsNow.mode === 'live') {
                        await run(event === 'TOKEN_REFRESHED' ? 'push' : 'both');
                        await startLive();
                    } else {
                        await run('push');
                        stopLive();
                    }
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
            const { error: deleteError } = await sb.from('lists').delete().eq('id', id);
            if (deleteError && !isBlockedWrite(deleteError)) throw deleteError;
            const { error: leaveError } = await sb.rpc('leave_shared_list', { p_list_id: id });
            void leaveError;
        }
    };

    global.OrbitSync = OrbitSync;
})(window);
