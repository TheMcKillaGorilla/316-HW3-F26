/**
 * api.test.js
 *
 * The Facade over fetch: the right method, URL and body for each call, errors
 * turned into ApiErrors, and requests kept in order.
 */
import { describe, expect, it, vi } from 'vitest';
import * as api from '../../src/api/api.js';
import { ApiError } from '../../src/api/api.js';

/** stubs fetch to answer every request with one status and body */
function answerWith(status, body = null) {
    const fetchSpy = vi.fn(async () => ({ ok: status < 400, status, json: async () => body }));
    vi.stubGlobal('fetch', fetchSpy);
    return fetchSpy;
}

describe('each call', () => {
    it.each([
        ['getAllMetadata', [], 'GET', '/api/lists'],
        ['getList', ['abc'], 'GET', '/api/lists/abc'],
        ['createList', [], 'POST', '/api/lists'],
        ['duplicateList', ['abc'], 'POST', '/api/lists/abc/duplicate'],
        ['deleteList', ['abc'], 'DELETE', '/api/lists/abc']
    ])('%s sends %s %s', async (name, args, method, url) => {
        const fetchSpy = answerWith(200, {});
        await api[name](...args);
        expect(fetchSpy).toHaveBeenCalledWith(url, expect.objectContaining({ method }));
    });

    it('saveList PUTs the name and items as JSON, and nothing else', async () => {
        const fetchSpy = answerWith(200, {});
        await api.saveList({ id: 'abc', name: 'Chores', items: [], extra: 'no' });

        const [url, options] = fetchSpy.mock.calls[0];
        expect(url).toBe('/api/lists/abc');
        expect(options.method).toBe('PUT');
        expect(options.headers['Content-Type']).toBe('application/json');
        expect(JSON.parse(options.body)).toEqual({ name: 'Chores', items: [] });
    });

    it('hands back the parsed body', async () => {
        answerWith(200, [{ id: 'a' }]);
        expect(await api.getAllMetadata()).toEqual([{ id: 'a' }]);
    });

    it('hands back null for a 204 with no body', async () => {
        answerWith(204);
        expect(await api.deleteList('abc')).toBeNull();
    });
});

describe('errors', () => {
    it('carries the server\'s own message and status', async () => {
        answerWith(404, { error: 'There is no list with that id.' });

        const error = await api.getList('abc').catch((caught) => caught);

        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toBe('There is no list with that id.');
        expect(error.status).toBe(404);
    });

    it('says the server could not be reached when there was no answer at all', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));

        await expect(api.getAllMetadata()).rejects.toThrow(/could not be reached/);
    });

    it('does not stop later requests from going out', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
        await api.getAllMetadata().catch(() => {});

        answerWith(200, []);
        expect(await api.getAllMetadata()).toEqual([]);
    });
});

describe('ordering', () => {
    /**
     * Two saves in quick succession must reach the server in the order they
     * were made, or the older version of the list could be the one kept.
     */
    it('sends one request at a time, in the order they were made', async () => {
        const order = [];
        let releaseFirst;
        vi.stubGlobal('fetch', vi.fn((url, { body }) => {
            const { name } = JSON.parse(body);
            order.push(`start ${name}`);
            return new Promise((resolve) => {
                const finish = () => {
                    order.push(`end ${name}`);
                    resolve({ ok: true, status: 200, json: async () => ({}) });
                };
                if (name === 'first') releaseFirst = finish; else finish();
            });
        }));

        const first = api.saveList({ id: 'a', name: 'first', items: [] });
        const second = api.saveList({ id: 'a', name: 'second', items: [] });

        // the second has not even started while the first is outstanding
        await vi.waitFor(() => expect(order).toEqual(['start first']));
        releaseFirst();
        await Promise.all([first, second]);

        expect(order).toEqual(['start first', 'end first', 'start second', 'end second']);
    });
});
