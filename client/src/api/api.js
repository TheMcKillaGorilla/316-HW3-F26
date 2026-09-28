/**
 * api.js
 *
 * FACADE: the one door between the client and the server. The rest of the
 * application calls api.getList(id) and gets a list back. It never sees a URL,
 * an HTTP method, a status code, JSON parsing or fetch itself. If the API
 * changes, this is the one file that changes with it.
 *
 * During development Vite forwards every /api request to the Express server on
 * port 4000 (see vite.config.js), so these relative URLs work unchanged.
 */

/** thrown for anything that goes wrong talking to the server */
export class ApiError extends Error {
    constructor(message, status = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

/**
 * Requests go out one at a time, in the order they were made. Without this,
 * two quick edits send two PUTs that can arrive in either order, and the older
 * list could be the one saved. It also means opening a list always waits for
 * the last save of it to land.
 */
let queue = Promise.resolve();

function request(method, url, body) {
    const result = queue.then(() => send(method, url, body));
    // the next request waits for this one whether it worked or not
    queue = result.catch(() => {});
    return result;
}

async function send(method, url, body) {
    let response;
    try {
        response = await fetch(url, {
            method,
            headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body)
        });
    } catch {
        // fetch only rejects when no answer came back at all
        throw new ApiError('The Wolfie Lists server could not be reached. Is it running?');
    }

    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new ApiError(data?.error ?? `The server answered ${response.status}.`, response.status);
    }
    return data;
}

/** @return {Promise<Object[]>} { id, name, itemCount, completedCount } per list */
export const getAllMetadata = () => request('GET', '/api/lists');

/** @return {Promise<Object>} the whole list, { id, name, items } */
export const getList = (id) => request('GET', `/api/lists/${id}`);

export const deleteList = (id) => request('DELETE', `/api/lists/${id}`);
