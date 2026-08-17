(function (global) {
    const PUSH_WAIT = 800;
    let client = null;
    let pushTimer = 0;
    let hooks = {};
    let lastSyncAt = null;
    let lastError = '';
    let busy = false;
    let ready = false;

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
        const { data } = await sb.auth.getUser();
        return data?.user || null;
    }

    function redirectTo() {
        const url = new URL(location.href);
        url.hash = '';
        url.search = '';
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
            owner_id: list.ownerId || userId,
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

    async function pull() {
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user || !hooks.getState || !hooks.applyCloud) return;

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

        const local = hooks.getState();
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
        let wallpaperAdjust = local.wallpaperAdjust;
        let customThemes = local.customThemes;
        let currentListId = local.currentListId;
        if (prefs && stamp(prefs.updated_at) >= stamp(local.settings?.updatedAt)) {
            settings = { ...(local.settings || {}), ...(prefs.settings || {}), updatedAt: prefs.updated_at };
            bitsParams = prefs.bits_params && typeof prefs.bits_params === 'object' ? prefs.bits_params : bitsParams;
            wallpaperAdjust = prefs.wallpaper_adjust && typeof prefs.wallpaper_adjust === 'object'
                ? prefs.wallpaper_adjust
                : wallpaperAdjust;
            if (Array.isArray(prefs.custom_themes)) customThemes = prefs.custom_themes;
            if (prefs.current_list_id) currentListId = prefs.current_list_id;
        }

        lastSyncAt = nowIso();
        lastError = '';
        hooks.applyCloud({
            lists,
            tasks,
            tags,
            groups,
            settings,
            bitsParams,
            wallpaperAdjust,
            customThemes,
            currentListId
        });
    }

    async function push() {
        const sb = await getClient();
        const user = await sessionUser();
        if (!sb || !user || !hooks.getState) return;
        const state = hooks.getState();
        const owned = (state.lists || []).filter((list) => list.role !== 'editor');
        const editable = state.lists || [];
        const editableIds = editable.map((list) => String(list.id));

        if (owned.length) {
            const { error } = await sb.from('lists').upsert(owned.map((list) => toListRow(list, user.id)));
            if (error) throw error;
        }

        const groups = (state.groups || []).map((group, index) => ({
            id: String(group.id),
            user_id: user.id,
            name: group.name || 'Group',
            sort: Number.isFinite(Number(group.sort)) ? Number(group.sort) : index,
            updated_at: group.updatedAt || nowIso()
        }));
        if (groups.length) {
            const { error } = await sb.from('groups').upsert(groups);
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
        const localGroupIds = new Set(groups.map((group) => group.id));
        const extraGroups = (remoteGroups || []).filter((row) => !localGroupIds.has(row.id)).map((row) => row.id);
        if (extraGroups.length) {
            const { error } = await sb.from('groups').delete().in('id', extraGroups);
            if (error) throw error;
        }

        const localTasks = (state.tasks || []).filter((task) => editableIds.includes(String(task.listId)));
        if (localTasks.length) {
            const { error } = await sb.from('tasks').upsert(localTasks.map(toTaskRow));
            if (error) throw error;
        }
        if (editableIds.length) {
            const { data: remoteTasks, error: taskSelectError } = await sb.from('tasks').select('id').in('list_id', editableIds);
            if (taskSelectError) throw taskSelectError;
            const localTaskIds = new Set(localTasks.map((task) => String(task.id)));
            const extraTasks = (remoteTasks || []).filter((row) => !localTaskIds.has(row.id)).map((row) => row.id);
            if (extraTasks.length) {
                const { error } = await sb.from('tasks').delete().in('id', extraTasks);
                if (error) throw error;
            }
        }

        const tags = (state.tags || []).map((tag) => ({
            id: String(tag.id),
            user_id: user.id,
            name: tag.name || 'Tag',
            color: tag.color || '#b19eef',
            updated_at: tag.updatedAt || nowIso()
        }));
        if (tags.length) {
            const { error } = await sb.from('tags').upsert(tags);
            if (error) throw error;
        }
        const { data: remoteTags } = await sb.from('tags').select('id').eq('user_id', user.id);
        const localTagIds = new Set(tags.map((tag) => tag.id));
        const extraTags = (remoteTags || []).filter((row) => !localTagIds.has(row.id)).map((row) => row.id);
        if (extraTags.length) {
            const { error } = await sb.from('tags').delete().in('id', extraTags);
            if (error) throw error;
        }

        const { error: prefsError } = await sb.from('user_prefs').upsert({
            user_id: user.id,
            settings: state.settings || {},
            bits_params: state.bitsParams || {},
            wallpaper_adjust: state.wallpaperAdjust || {},
            custom_themes: (state.customThemes || []).map((theme) => ({
                id: theme.id,
                name: theme.name,
                color: theme.color
            })),
            current_list_id: state.currentListId || null,
            updated_at: nowIso()
        });
        if (prefsError) throw prefsError;

        lastSyncAt = nowIso();
        lastError = '';
    }

    async function run(kind) {
        if (busy) return;
        busy = true;
        try {
            if (kind === 'pull' || kind === 'both') await pull();
            if (kind === 'push' || kind === 'both') await push();
        } catch (err) {
            lastError = err?.message || 'Sync failed';
            console.warn('Orbit sync', err);
        } finally {
            busy = false;
            hooks.onStatus?.();
        }
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
        lastSyncAt() { return lastSyncAt; },
        lastError() { return lastError; },
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
                    await run('both');
                    await OrbitSync.consumeInviteFromUrl();
                }
                if (event === 'SIGNED_OUT') hooks.onStatus?.();
                hooks.onAuth?.();
            });
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) sessionUser().then((user) => { if (user) run('pull'); });
            });
            window.addEventListener('focus', () => {
                sessionUser().then((user) => { if (user) run('pull'); });
            });
            await OrbitSync.consumeInviteFromUrl();
            ready = true;
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
        async createInvite(listId) {
            const sb = await getClient();
            const user = await sessionUser();
            if (!sb || !user) throw new Error('Sign in to share a list.');
            const token = randomToken();
            const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString();
            const { error } = await sb.from('list_invites').insert({
                token,
                list_id: String(listId),
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
            return data;
        },
        async consumeInviteFromUrl() {
            const params = new URLSearchParams(location.search);
            const token = params.get('invite') || sessionStorage.getItem('orbit_invite');
            if (params.get('invite')) sessionStorage.setItem('orbit_invite', params.get('invite'));
            if (!token) return;
            const user = await sessionUser();
            if (!user) return;
            try {
                await OrbitSync.redeemInvite(token);
                sessionStorage.removeItem('orbit_invite');
                params.delete('invite');
                const next = `${location.pathname}${params.toString() ? `?${params}` : ''}${location.hash}`;
                history.replaceState({}, '', next);
            } catch (err) {
                lastError = err?.message || 'Could not join that list.';
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
