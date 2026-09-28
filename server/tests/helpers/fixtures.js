/**
 * fixtures.js
 *
 * The same sample lists the client tests use, without ids for the lists
 * themselves, since Mongo makes those.
 */
export const WEEKEND_LIST = {
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
    name: 'Nothing Here Yet',
    items: []
};
