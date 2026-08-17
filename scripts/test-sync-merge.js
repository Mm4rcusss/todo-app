#!/usr/bin/env node
'use strict';

const store = Object.create(null);
global.localStorage = {
    getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; }
};
global.window = global;
global.document = { hidden: false, addEventListener() {} };
global.location = { search: '', pathname: '/', hash: '', href: 'http://localhost/' };

require('../js/sync.js');

const sync = global.OrbitSync;
if (!sync?._test) {
    throw new Error('OrbitSync._test helpers were not exported');
}

const { filterPulledLists, filterPulledGroups, listIsDeleted, groupIsDeleted, mergeById } = sync._test;

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

function pullLists({ live, remote, tombs, idsAtStart, knownIds, localOnlyIds }) {
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
        knownIds: new Set([...(knownIds || [])].map(String)),
        localOnlyIds: new Set([...(localOnlyIds || [])].map(String))
    });
}

function pullGroups({ live, remote, tombs, idsAtStart, knownIds }) {
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
        knownIds: new Set([...(knownIds || [])].map(String))
    });
}

function applyCloud(state, remote) {
    const gone = new Set([...(state.deletedListIds || []), ...sync.deletedListIds()].map(String));
    const goneGroups = new Set([...(state.deletedGroupIds || []), ...sync.deletedGroupIds()].map(String));
    state.lists = (remote.lists || []).filter((list) => !listIsDeleted(list.id, gone) && !gone.has(String(list.id)));
    state.groups = (remote.groups || []).filter((group) => !groupIsDeleted(group.id, goneGroups) && !goneGroups.has(String(group.id)));
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
    'list: known-but-missing id never comes back even without a tombstone',
    ids(pullLists({
        live: [{ id: 'keep' }],
        remote: [{ id: 'keep' }, { id: 'gone' }],
        tombs: [],
        knownIds: ['keep', 'gone']
    })) === 'keep'
);

assert(
    'group: known-but-missing id never comes back even without a tombstone',
    ids(pullGroups({
        live: [{ id: 'keep' }],
        remote: [{ id: 'keep' }, { id: 'gone-group' }],
        tombs: [],
        knownIds: ['keep', 'gone-group']
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

if (failed) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
}
console.log('\nall sync merge checks passed');
