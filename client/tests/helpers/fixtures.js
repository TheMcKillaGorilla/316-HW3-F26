/**
 * fixtures.js
 *
 * Sample lists, as the server would send them. Tests hand these to the fake
 * server (see fakeServer.js); the home screen then gets their metadata.
 */

/**
 * A short list, small enough that a test can assert on it item by item.
 */
export const WEEKEND_LIST = {
    id: 'list-weekend',
    name: "Wolfie's Weekend",
    items: [
        {
            id: 'item-hike',
            description: 'Hike the Ashokan rail trail',
            dateEntered: '2026-09-01',
            priority: 'Medium',
            targetDate: '2026-09-19',
            completed: false
        },
        {
            id: 'item-read',
            description: 'Read chapter four',
            dateEntered: '2026-09-02',
            priority: 'High',
            targetDate: null,
            completed: true
        },
        {
            id: 'item-call',
            description: 'Call home',
            dateEntered: '2026-09-03',
            priority: 'Low',
            targetDate: '2026-09-20',
            completed: false
        }
    ]
};

export const CHORES_LIST = {
    id: 'list-chores',
    name: 'Chores',
    items: [
        {
            id: 'item-sweep',
            description: 'Sweep the kitchen',
            dateEntered: '2026-09-01',
            priority: 'Low',
            targetDate: null,
            completed: false
        }
    ]
};

export const EMPTY_LIST = {
    id: 'list-empty',
    name: 'Nothing Here Yet',
    items: []
};

/** @return {Object} the metadata the server would send for a list */
export function metadataOf(list) {
    return {
        id: list.id,
        name: list.name,
        itemCount: list.items.length,
        completedCount: list.items.filter((item) => item.completed).length
    };
}
