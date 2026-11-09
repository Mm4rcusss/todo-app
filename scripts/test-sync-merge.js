#!/usr/bin/env node
'use strict';

const store = Object.create(null);
global.localStorage = {
    getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; },
    key(index) { return Object.keys(store)[index] || null; },
    get length() { return Object.keys(store).length; }
};
global.window = global;
global.document = { hidden: false, addEventListener() {} };
global.location = { search: '', pathname: '/', hash: '', href: 'http://localhost/' };

require('../js/sync.js');

const sync = global.OrbitSync;
if (!sync?._test) {
    throw new Error('OrbitSync._test helpers were not exported');
}

const {
    filterPulledLists,
    filterPulledGroups,
    filterPulledTasks,
    listIsDeleted,
    groupIsDeleted,
    taskIsDeleted,
    mergeById,
    threeWayTask,
    summarizeSyncDiff
} = sync._test;

let failed = 0;
function assert(name, condition) {
    if (condition) {
        console.log(`ok  ${name}`);
        return;
    }
    failed += 1;
    console.error(`FAIL ${name}`);
}

function ids(items) {
    return (items || []).map((item) => String(item.id)).sort().join(',');
}

function pullTasks({ live, remote, tombs, idsAtStart }) {
    const deletedTasks = new Set([...(tombs || [])].map(String));
    const liveIds = new Set((live || []).map((task) => String(task.id)));
    const start = new Set([...(idsAtStart || liveIds)].map(String));
    const remoteIds = new Set((remote || []).map((task) => String(task.id)));
    return filterPulledTasks(mergeById(live || [], remote || []), {
        tombs: deletedTasks,
        idsAtStart: start,
        liveIds,
        remoteIds
    });
}

function pullLists({ live, remote, tombs, idsAtStart, localOnlyIds, serverDeletedIds }) {
    const deletedLists = new Set([...(tombs || [])].map(String));
    const remoteLists = (remote || []).filter((list) => !listIsDeleted(list.id, deletedLists));
    const liveIds = new Set((live || []).map((list) => String(list.id)));
    const start = new Set([...(idsAtStart || liveIds)].map(String));
    const remoteIds = new Set(remoteLists.map((list) => String(list.id)));
    return filterPulledLists(mergeById(live || [], remoteLists), {
        tombs: deletedLists,
        idsAtStart: start,
        liveIds,
        remoteIds,
        localOnlyIds: new Set([...(localOnlyIds || [])].map(String)),
        serverDeletedIds: new Set([...(serverDeletedIds || [])].map(String))
    });
}

function pullGroups({ live, remote, tombs, idsAtStart, serverDeletedIds }) {
    const deletedGroups = new Set([...(tombs || [])].map(String));
    const remoteGroups = (remote || []).filter((group) => !groupIsDeleted(group.id, deletedGroups));
    const liveIds = new Set((live || []).map((group) => String(group.id)));
    const start = new Set([...(idsAtStart || liveIds)].map(String));
    const remoteIds = new Set(remoteGroups.map((group) => String(group.id)));
    return filterPulledGroups(mergeById(live || [], remoteGroups), {
        tombs: deletedGroups,
        idsAtStart: start,
        liveIds,
        remoteIds,
        serverDeletedIds: new Set([...(serverDeletedIds || [])].map(String))
    });
}

function applyCloud(state, remote) {
    const gone = new Set([...(state.deletedListIds || []), ...sync.deletedListIds()].map(String));
    const goneGroups = new Set([...(state.deletedGroupIds || []), ...sync.deletedGroupIds()].map(String));
    const goneTasks = new Set([...(state.deletedTaskIds || []), ...(sync.deletedTaskIds?.() || [])].map(String));
    state.lists = (remote.lists || []).filter((list) => !listIsDeleted(list.id, gone) && !gone.has(String(list.id)));
    state.groups = (remote.groups || []).filter((group) => !groupIsDeleted(group.id, goneGroups) && !goneGroups.has(String(group.id)));
    state.tasks = (remote.tasks || []).filter((task) => !taskIsDeleted(task.id, goneTasks) && !goneTasks.has(String(task.id)));
}

// --- list races ---
assert(
    'list: tombstone blocks stale remote after delete',
    ids(pullLists({
        live: [{ id: 'keep' }],
        remote: [{ id: 'keep' }, { id: 'gone' }],
        tombs: ['gone']
    })) === 'keep'
);

assert(
    'list: in-flight pull does not restore a list removed while fetching',
    ids(pullLists({
        live: [{ id: 'keep' }],
        remote: [{ id: 'keep' }, { id: 'gone' }],
        tombs: [],
        idsAtStart: ['keep', 'gone']
    })) === 'keep'
);

assert(
    'list: new list from another device still arrives',
    ids(pullLists({
        live: [{ id: 'keep' }],
        remote: [{ id: 'keep' }, { id: 'new-from-phone' }],
        tombs: []
    })) === 'keep,new-from-phone'
);

assert(
    'list: editor copy that vanished from remote stays gone',
    ids(pullLists({
        live: [{ id: 'shared', role: 'editor' }],
        remote: [],
        tombs: []
    })) === ''
);

assert(
    'list: unsynced local draft is kept',
    ids(pullLists({
        live: [{ id: 'draft' }],
        remote: [],
        tombs: []
    })) === 'draft'
);

// --- group races (the pop-back loop) ---
assert(
    'group: tombstone blocks stale remote after delete',
    ids(pullGroups({
        live: [{ id: 'keep' }],
        remote: [{ id: 'keep' }, { id: 'gone-group' }],
        tombs: ['gone-group']
    })) === 'keep'
);

assert(
    'group: in-flight pull does not restore a group removed while fetching',
    ids(pullGroups({
        live: [{ id: 'keep' }],
        remote: [{ id: 'keep' }, { id: 'gone-group' }],
        tombs: [],
        idsAtStart: ['keep', 'gone-group']
    })) === 'keep'
);

assert(
    'group: old mergeById without tombs WOULD resurrect (documents the bug)',
    ids(mergeById([{ id: 'keep' }], [{ id: 'keep' }, { id: 'gone-group' }])) === 'gone-group,keep'
);

assert(
    'group: new group from another device still arrives',
    ids(pullGroups({
        live: [{ id: 'keep' }],
        remote: [{ id: 'keep' }, { id: 'new-group' }],
        tombs: []
    })) === 'keep,new-group'
);

assert(
    'group: restored local group is kept even if remote delete has not landed',
    ids(pullGroups({
        live: [{ id: 'restored' }],
        remote: [],
        tombs: []
    })) === 'restored'
);

// --- remember / applyCloud loop ---
sync.rememberDeleted('list-a');
sync.rememberDeletedGroup('group-a');
const state = {
    lists: [{ id: 'keep-list' }],
    groups: [{ id: 'keep-group' }],
    deletedListIds: ['list-a'],
    deletedGroupIds: ['group-a']
};
applyCloud(state, {
    lists: [{ id: 'keep-list' }, { id: 'list-a' }],
    groups: [{ id: 'keep-group' }, { id: 'group-a' }]
});
assert('applyCloud: deleted list does not pop back', ids(state.lists) === 'keep-list');
assert('applyCloud: deleted group does not pop back', ids(state.groups) === 'keep-group');

const afterPull = pullGroups({
    live: state.groups,
    remote: [{ id: 'keep-group' }, { id: 'group-a' }],
    tombs: sync.deletedGroupIds()
});
assert('pull then apply: group still gone after 3s stale poll', ids(afterPull) === 'keep-group');

const afterListPull = pullLists({
    live: state.lists,
    remote: [{ id: 'keep-list' }, { id: 'list-a' }],
    tombs: sync.deletedListIds()
});
assert('pull then apply: list still gone after 3s stale poll', ids(afterListPull) === 'keep-list');

sync.forgetDeleted('list-a');
sync.forgetDeletedGroup('group-a');
assert('restore: list tombstone cleared', !sync.deletedListIds().includes('list-a'));
assert('restore: group tombstone cleared', !sync.deletedGroupIds().includes('group-a'));

const restoredGroups = pullGroups({
    live: [{ id: 'group-a' }],
    remote: [{ id: 'group-a' }],
    tombs: sync.deletedGroupIds()
});
assert('restore: group can come back after forgetDeletedGroup', ids(restoredGroups) === 'group-a');

assert(
    'list: server row returns even if it was previously known locally',
    ids(pullLists({
        live: [{ id: 'keep' }],
        remote: [{ id: 'keep' }, { id: 'was-known' }],
        tombs: []
    })) === 'keep,was-known'
);

assert(
    'group: server row returns even if it was previously known locally',
    ids(pullGroups({
        live: [{ id: 'keep' }],
        remote: [{ id: 'keep' }, { id: 'was-known-group' }],
        tombs: []
    })) === 'keep,was-known-group'
);

assert(
    'list: server soft-delete drops the row',
    ids(pullLists({
        live: [{ id: 'keep' }, { id: 'gone' }],
        remote: [{ id: 'keep' }],
        tombs: [],
        serverDeletedIds: ['gone']
    })) === 'keep'
);

assert(
    'group: server soft-delete drops the row',
    ids(pullGroups({
        live: [{ id: 'keep' }, { id: 'gone-group' }],
        remote: [{ id: 'keep' }],
        tombs: [],
        serverDeletedIds: ['gone-group']
    })) === 'keep'
);

assert(
    'list: local-only list is kept and not replaced',
    ids(pullLists({
        live: [{ id: 'private' }],
        remote: [{ id: 'private', name: 'from-cloud' }],
        tombs: [],
        localOnlyIds: ['private']
    })) === 'private'
);

assert(
    'task: tombstone blocks stale remote after delete',
    ids(pullTasks({
        live: [{ id: 'keep-task' }],
        remote: [{ id: 'keep-task' }, { id: 'gone-task' }],
        tombs: ['gone-task']
    })) === 'keep-task'
);

assert(
    'task: in-flight pull does not restore a task removed while fetching',
    ids(pullTasks({
        live: [{ id: 'keep-task' }],
        remote: [{ id: 'keep-task' }, { id: 'gone-task' }],
        tombs: [],
        idsAtStart: ['keep-task', 'gone-task']
    })) === 'keep-task'
);

assert(
    'task: new task from another device still arrives',
    ids(pullTasks({
        live: [{ id: 'keep-task' }],
        remote: [{ id: 'keep-task' }, { id: 'new-task' }],
        tombs: []
    })) === 'keep-task,new-task'
);

sync.rememberDeletedTask('task-a');
const taskState = {
    lists: [{ id: 'keep-list' }],
    groups: [],
    tasks: [{ id: 'keep-task' }],
    deletedTaskIds: ['task-a']
};
applyCloud(taskState, {
    lists: [{ id: 'keep-list' }],
    groups: [],
    tasks: [{ id: 'keep-task' }, { id: 'task-a' }]
});
assert('applyCloud: deleted task does not pop back', ids(taskState.tasks) === 'keep-task');
assert(
    'pull then apply: task still gone after 3s stale poll',
    ids(pullTasks({
        live: taskState.tasks,
        remote: [{ id: 'keep-task' }, { id: 'task-a' }],
        tombs: sync.deletedTaskIds()
    })) === 'keep-task'
);
sync.forgetDeletedTask('task-a');
assert('restore: task tombstone cleared', !sync.deletedTaskIds().includes('task-a'));

const baseTask = {
    id: 't1',
    text: 'Buy milk',
    completed: false,
    date: '',
    listId: 'home',
    order: 0,
    tags: [],
    updatedAt: '2026-01-01T00:00:00.000Z'
};
const localOnlyComplete = {
    ...baseTask,
    completed: true,
    updatedAt: '2026-01-02T00:00:00.000Z'
};
const remoteOnlyText = {
    ...baseTask,
    text: 'Buy oat milk',
    updatedAt: '2026-01-02T01:00:00.000Z'
};
const autoMerge = threeWayTask(localOnlyComplete, remoteOnlyText, baseTask);
assert('task: non-overlapping field edits merge automatically', Boolean(autoMerge.value)
    && autoMerge.value.completed === true
    && autoMerge.value.text === 'Buy oat milk'
    && !autoMerge.conflict);

const localText = { ...baseTask, text: 'Buy almond milk', updatedAt: '2026-01-03T00:00:00.000Z' };
const remoteText = { ...baseTask, text: 'Buy soy milk', updatedAt: '2026-01-03T00:00:01.000Z' };
const conflictMerge = threeWayTask(localText, remoteText, baseTask);
assert('task: same-field divergence becomes a conflict', Boolean(conflictMerge.conflict)
    && conflictMerge.conflict.fields.includes('text'));

const diff = summarizeSyncDiff(
    {
        lists: [{ id: 'home', name: 'My Tasks' }],
        tasks: [{ id: 'keep', text: 'Stay', listId: 'home', completed: false }]
    },
    [{ id: 'home', name: 'My Tasks' }, { id: 'errands', name: 'Errands' }],
    [
        { id: 'keep', text: 'Stay put', listId: 'home', completed: false },
        { id: 'new', text: 'New task', listId: 'home', completed: false }
    ]
);
assert('diff: reports added task/list', diff.added.some((item) => item.id === 'new')
    && diff.added.some((item) => item.id === 'errands'));
assert('diff: reports changed task', diff.changed.some((item) => item.id === 'keep'));

const typedLocal = {
    id: 'typed-now',
    text: 'Just typed',
    listId: 'home',
    completed: false,
    updatedAt: '2020-01-01T00:00:00.000Z'
};
assert(
    'task: unsynced local create survives pull filter even with old updatedAt',
    ids(pullTasks({
        live: [{ id: 'keep-task' }, typedLocal],
        remote: [{ id: 'keep-task' }],
        tombs: []
    })) === 'keep-task,typed-now'
);

assert(
    'list: unsynced owned local list is kept for its tasks',
    ids(pullLists({
        live: [{ id: 'home_abc', name: 'My Tasks', ownerId: 'user-1', role: 'owner' }],
        remote: [],
        tombs: []
    })) === 'home_abc'
);

assert(
    'list: guest default tomb does not hide the account home list',
    !listIsDeleted('home_abc', new Set(['default']))
    && ids(pullLists({
        live: [{ id: 'home_abc', name: 'My Tasks', role: 'owner' }],
        remote: [{ id: 'home_abc', name: 'My Tasks', role: 'owner' }],
        tombs: ['default']
    })) === 'home_abc'
);

assert(
    'list: exact home tombstone still hides that list',
    listIsDeleted('home_abc', new Set(['home_abc']))
    && ids(pullLists({
        live: [{ id: 'home_abc', name: 'My Tasks', role: 'owner' }],
        remote: [{ id: 'home_abc', name: 'My Tasks', role: 'owner' }],
        tombs: ['home_abc']
    })) === ''
);

const typedDiff = summarizeSyncDiff(
    {
        lists: [{ id: 'home', name: 'My Tasks' }],
        tasks: [{ id: 'typed-now', text: 'Just typed', listId: 'home' }]
    },
    [{ id: 'home', name: 'My Tasks' }],
    []
);
assert(
    'diff: just-typed local task is an upload, not a delete',
    typedDiff.added.some((item) => item.id === 'typed-now')
    && !typedDiff.deleted.some((item) => item.id === 'typed-now')
);

const phoneDiff = summarizeSyncDiff(
    {
        lists: [{ id: 'home', name: 'My Tasks' }],
        tasks: []
    },
    [{ id: 'home', name: 'My Tasks' }],
    [{ id: 'phone-1', text: 'From phone', listId: 'home', completed: false }]
);
assert(
    'diff: phone task shows as incoming add',
    phoneDiff.added.some((item) => item.id === 'phone-1')
    && phoneDiff.added.length > 0
    && !phoneDiff.deleted.some((item) => item.id === 'phone-1')
);

if (typeof sync.clearLocalTombs === 'function') {
    sync.rememberDeleted('ghost-list');
    sync.rememberDeletedTask('ghost-task');
    sync.clearLocalTombs();
    assert('clearLocalTombs: list tombs cleared', sync.deletedListIds().length === 0);
    assert('clearLocalTombs: task tombs cleared', sync.deletedTaskIds().length === 0);
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function authStorageChecks() {
    global.ORBIT_SUPABASE = {
        url: 'https://pggxuazefxudgymqcuvl.supabase.co',
        anonKey: 'test-anon-key'
    };
    const legacyKey = 'sb-pggxuazefxudgymqcuvl-auth-token';
    const verifierKey = 'sb-pggxuazefxudgymqcuvl-auth-token-code-verifier';

    localStorage.removeItem('orbit-todo-auth');
    localStorage.setItem(legacyKey, 'legacy-session');
    sync._test.migrateAuthStorage();
    assert('migrate copies legacy auth then deletes it', localStorage.getItem('orbit-todo-auth') === 'legacy-session' && localStorage.getItem(legacyKey) == null);
    sync._test.migrateAuthStorage();
    assert('migrate is idempotent', localStorage.getItem('orbit-todo-auth') === 'legacy-session' && localStorage.getItem(legacyKey) == null);

    localStorage.setItem('orbit-todo-auth', 'current-session');
    localStorage.setItem(legacyKey, 'legacy-session');
    sync._test.migrateAuthStorage();
    assert(
        'migrate drops leftover legacy when the new key already exists',
        localStorage.getItem('orbit-todo-auth') === 'current-session' && localStorage.getItem(legacyKey) == null
    );

    localStorage.removeItem('orbit-todo-auth');
    localStorage.setItem(legacyKey, 'legacy-session');
    const originalSet = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key, value) => {
        if (key === 'orbit-todo-auth') throw new Error('quota');
        originalSet(key, value);
    };
    let migrateThrew = false;
    try { sync._test.migrateAuthStorage(); } catch { migrateThrew = true; }
    localStorage.setItem = originalSet;
    assert('migrate ignores storage write errors', !migrateThrew);
    assert(
        'failed migrate copy keeps the legacy key',
        localStorage.getItem(legacyKey) === 'legacy-session' && localStorage.getItem('orbit-todo-auth') == null
    );

    const originalGet = localStorage.getItem.bind(localStorage);
    localStorage.getItem = () => { throw new Error('denied'); };
    migrateThrew = false;
    try { sync._test.migrateAuthStorage(); } catch { migrateThrew = true; }
    localStorage.getItem = originalGet;
    assert('migrate ignores storage read errors', !migrateThrew);

    localStorage.setItem('orbit-todo-auth', 'current-session');
    localStorage.setItem('sb-otherproj-auth-token', 'other-session');
    localStorage.setItem(verifierKey, 'verifier');
    const originalRemove = localStorage.removeItem.bind(localStorage);
    localStorage.removeItem = (key) => {
        if (key === 'orbit-todo-auth') throw new Error('blocked');
        originalRemove(key);
    };
    let clearThrew = false;
    try { sync._test.clearStoredAuth(); } catch { clearThrew = true; }
    localStorage.removeItem = originalRemove;
    assert('clearStoredAuth ignores storage errors', !clearThrew);
    assert('clearStoredAuth still removes other legacy tokens', localStorage.getItem('sb-otherproj-auth-token') == null);
    assert('clearStoredAuth leaves the pkce verifier', localStorage.getItem(verifierKey) === 'verifier');
    originalRemove('orbit-todo-auth');

    let active = 0;
    let maxActive = 0;
    const order = [];
    const track = (name, ms, fail) => sync._test.enqueueSerial(async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await delay(ms);
        active -= 1;
        if (fail) throw new Error(`fail ${name}`);
        order.push(name);
    });
    const first = track('wipe', 30);
    const second = track('push', 5, true);
    const third = track('next', 5);
    await first;
    await second.catch(() => {});
    await third;
    assert('auth handlers do not overlap', maxActive === 1);
    assert('auth handlers continue in order after a failure', order.join(',') === 'wipe,next');

    let guest = ['guest-todo'];
    let pushed = null;
    const wipe = sync._test.enqueueSerial(async () => {
        await delay(15);
        guest = ['cloud-todo'];
    });
    const push = sync._test.enqueueSerial(async () => {
        pushed = guest.slice();
    });
    await wipe;
    await push;
    assert('queued sign-in wipe finishes before a later push', pushed.join(',') === 'cloud-todo');

    let signOutCalls = 0;
    global.supabase = {
        createClient() {
            return {
                auth: {
                    signOut() {
                        signOutCalls += 1;
                        return Promise.reject(new Error('network'));
                    }
                }
            };
        }
    };
    localStorage.setItem('orbit-todo-auth', 'current-session');
    localStorage.setItem(legacyKey, 'legacy-session');
    localStorage.setItem('sb-otherproj-auth-token', 'other-session');
    localStorage.setItem(verifierKey, 'verifier');
    let signOutError = '';
    try {
        await sync.signOut();
    } catch (err) {
        signOutError = err.message;
    }
    assert('signOut still surfaces auth errors', signOutError === 'network' && signOutCalls === 1);
    assert('signOut clears orbit-todo-auth', localStorage.getItem('orbit-todo-auth') == null);
    assert('signOut clears the project legacy token', localStorage.getItem(legacyKey) == null);
    assert('signOut clears every leftover sb-*-auth-token', localStorage.getItem('sb-otherproj-auth-token') == null);
    assert('signOut does not clear the pkce verifier', localStorage.getItem(verifierKey) === 'verifier');

    const backupStore = new Map();
    const pendingGets = [];
    let holdGets = false;
    global.indexedDB = {
        open() {
            const request = { onsuccess: null, onerror: null, onupgradeneeded: null, result: null };
            queueMicrotask(() => {
                request.result = {
                    objectStoreNames: { contains() { return true; } },
                    transaction() {
                        const tx = { oncomplete: null, onerror: null };
                        tx.objectStore = () => ({
                            get(key) {
                                const req = {
                                    result: backupStore.has(String(key)) ? backupStore.get(String(key)) : null,
                                    onsuccess: null,
                                    onerror: null
                                };
                                const fire = () => { if (req.onsuccess) req.onsuccess(); };
                                if (holdGets) pendingGets.push(fire);
                                else queueMicrotask(fire);
                                return req;
                            },
                            put(value, key) {
                                backupStore.set(String(key), String(value));
                                queueMicrotask(() => { if (tx.oncomplete) tx.oncomplete(); });
                                return {};
                            },
                            delete(key) {
                                backupStore.delete(String(key));
                                queueMicrotask(() => { if (tx.oncomplete) tx.oncomplete(); });
                                return {};
                            }
                        });
                        return tx;
                    },
                    close() {}
                };
                if (request.onsuccess) request.onsuccess();
            });
            return request;
        }
    };

    delete require.cache[require.resolve('../js/sync.js')];
    require('../js/sync.js');
    const fresh = global.OrbitSync;

    const sessionJson = JSON.stringify({ user: { id: 'user-1', email: 'a@b.c' } });
    backupStore.set('orbit-todo-auth', sessionJson);
    localStorage.removeItem('orbit-todo-auth');
    const restored = await fresh.user();
    assert(
        'indexedDB backup restores a signed-in session',
        restored?.id === 'user-1' && localStorage.getItem('orbit-todo-auth') === sessionJson
    );

    localStorage.removeItem('orbit-todo-auth');
    backupStore.set('orbit-todo-auth', sessionJson);
    holdGets = true;
    const reading = fresh.user();
    for (let i = 0; i < 50 && pendingGets.length === 0; i += 1) await delay(10);
    assert('session read is waiting on the indexedDB backup', pendingGets.length === 1);
    let raceSignOut = '';
    try {
        await fresh.signOut();
    } catch (err) {
        raceSignOut = err.message;
    }
    holdGets = false;
    while (pendingGets.length) pendingGets.shift()();
    await reading;
    assert('signOut still surfaces auth errors after the backup race', raceSignOut === 'network');
    assert(
        'in-flight session read does not restore auth during sign-out',
        localStorage.getItem('orbit-todo-auth') == null && backupStore.has('orbit-todo-auth') === false
    );
    const afterSignOut = await fresh.user();
    assert(
        'sign-out stays signed out when a backup used to exist',
        afterSignOut == null && localStorage.getItem('orbit-todo-auth') == null
    );
    delete global.indexedDB;
}

authStorageChecks().then(() => {
    if (failed) {
        console.error(`\n${failed} check(s) failed`);
        process.exit(1);
    }
    console.log('\nall sync merge checks passed');
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
