/**
 * fakeServer.js
 *
 * A stand-in for the Express server, installed in place of fetch, so the client
 * tests run without a server or a database. It answers the same six routes with
 * the same shapes, and records every request, so a test can check what reached
 * the "server" as well as what is on screen.
 *
 * The real server's behavior is proved by server/tests. What these tests prove
 * is that the client makes the right requests and copes with the answers,
 * including no answer at all (server.down = true).
 */
import { vi } from 'vitest';

export function installFakeServer(lists = []) {
    const server = {
        /** every list, in home screen order, as the database would hold them */
        lists: structuredClone(lists),
        /** every request made, as { method, url, body } */
        requests: [],
        /** set to true to make every request fail as if the server were off */
        down: false,
        /** set to a promise to hold every answer back until it resolves */
        wait: null,

        /** @return {Object|undefined} one stored list */
        list: (id) => server.lists.find((list) => list.id === id),
        /** @return {Object[]} the requests with this method, i.e. 'PUT' */
        requestsOf: (method) => server.requests.filter((request) => request.method === method)
    };

    let nextId = 1;

    function metadataOf(list) {
        return {
            id: list.id,
            name: list.name,
            itemCount: list.items.length,
            completedCount: list.items.filter((item) => item.completed).length
        };
    }

    function unusedName(desired) {
        const taken = new Set(server.lists.map((list) => list.name));
        let name = desired;
        for (let counter = 2; taken.has(name); counter++) name = `${desired} ${counter}`;
        return name;
    }

    /** @return {[number, *]} the status and body the real server would send */
    function answer(method, url, body) {
        const [, , , id, action] = url.split('/');   // '', 'api', 'lists', id, action
        const index = server.lists.findIndex((list) => list.id === id);
        const list = server.lists[index];

        if (id === undefined) {
            if (method === 'GET') return [200, server.lists.map(metadataOf)];
            const created = { id: `server-list-${nextId++}`, name: unusedName('Untitled List'), items: [] };
            server.lists.push(created);
            return [201, metadataOf(created)];
        }

        if (list === undefined) return [404, { error: 'There is no list with that id.' }];

        if (action === 'duplicate') {
            const copy = {
                id: `server-list-${nextId++}`,
                name: unusedName(`${list.name} (Copy)`).slice(0, 60),
                items: list.items.map((item) => ({ ...item, id: `${item.id}-copy-${nextId++}` }))
            };
            server.lists.splice(index + 1, 0, copy);
            return [201, metadataOf(copy)];
        }

        switch (method) {
            case 'GET':
                return [200, structuredClone(list)];
            case 'PUT':
                server.lists[index] = { id, name: body.name, items: structuredClone(body.items) };
                return [200, metadataOf(server.lists[index])];
            case 'DELETE':
                server.lists.splice(index, 1);
                return [204, null];
            default:
                return [404, { error: `There is no ${method} ${url}` }];
        }
    }

    vi.stubGlobal('fetch', vi.fn(async (url, { method = 'GET', body } = {}) => {
        const parsed = body === undefined ? undefined : JSON.parse(body);
        server.requests.push({ method, url, body: parsed });

        await server.wait;
        if (server.down) throw new TypeError('Failed to fetch');

        const [status, data] = answer(method, url, parsed);
        return { ok: status < 400, status, json: async () => data };
    }));

    return server;
}
