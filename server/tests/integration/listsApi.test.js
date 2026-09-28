/**
 * listsApi.test.js
 *
 * Every route in the API, through real HTTP requests to the real app, backed by
 * a real (in-memory) MongoDB. Nothing is mocked. The duplicate route has a
 * file of its own, duplicateList.test.js.
 *
 * THE LOAD BEARING TESTS are the first group: the home screen is sent metadata
 * and never items. That is the whole point of this assignment's API design.
 */
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { List } from '../../src/models/List.js';
import { clearDatabase, insertLists, startDatabase, stopDatabase } from '../helpers/database.js';
import { CHORES_LIST, EMPTY_LIST, WEEKEND_LIST } from '../helpers/fixtures.js';

const app = createApp({ logRequests: false });
const api = () => request(app);

/** an id shaped like a real one that no list has */
const MISSING_ID = new mongoose.Types.ObjectId().toString();

beforeAll(startDatabase);
afterAll(stopDatabase);
beforeEach(clearDatabase);

/** @return {Promise<string[]>} the list names in home screen order */
async function namesInOrder() {
    return (await api().get('/api/lists')).body.map((list) => list.name);
}

describe('GET /api/lists', () => {
    it('sends metadata only, never items', async () => {
        await insertLists([WEEKEND_LIST]);

        const response = await api().get('/api/lists');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(Object.keys(response.body[0]).sort())
            .toEqual(['completedCount', 'id', 'itemCount', 'name']);
    });

    it('counts the items and the completed items', async () => {
        await insertLists([WEEKEND_LIST, EMPTY_LIST]);

        const [weekend, empty] = (await api().get('/api/lists')).body;

        expect(weekend).toMatchObject({ itemCount: 3, completedCount: 1 });
        expect(empty).toMatchObject({ itemCount: 0, completedCount: 0 });
    });

    it('sends the lists in position order', async () => {
        await List.create({ ...CHORES_LIST, position: 5 });
        await List.create({ ...WEEKEND_LIST, position: 1 });

        expect(await namesInOrder()).toEqual(["Wolfie's Weekend", 'Chores']);
    });

    it('sends an empty array when there are no lists', async () => {
        const response = await api().get('/api/lists');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });
});

describe('GET /api/lists/:id', () => {
    it('sends the whole list', async () => {
        const [id] = await insertLists([WEEKEND_LIST]);

        const response = await api().get(`/api/lists/${id}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ id, ...WEEKEND_LIST });
    });

    it('answers 404 for an id no list has', async () => {
        const response = await api().get(`/api/lists/${MISSING_ID}`);
        expect(response.status).toBe(404);
        expect(response.body.error).toMatch(/no list/i);
    });

    it('answers 404 for something that is not an id at all', async () => {
        expect((await api().get('/api/lists/not-an-id')).status).toBe(404);
    });
});

describe('POST /api/lists', () => {
    it('makes an empty list called Untitled List and sends its metadata', async () => {
        const response = await api().post('/api/lists');

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({ name: 'Untitled List', itemCount: 0, completedCount: 0 });
        expect(await List.findById(response.body.id)).not.toBeNull();
    });

    it('does not reuse a name that is taken', async () => {
        await api().post('/api/lists');
        const second = await api().post('/api/lists');

        expect(second.body.name).toBe('Untitled List 2');
    });

    it('puts the new list at the bottom of the home screen', async () => {
        await insertLists([WEEKEND_LIST, CHORES_LIST]);
        await api().post('/api/lists');

        expect(await namesInOrder()).toEqual(["Wolfie's Weekend", 'Chores', 'Untitled List']);
    });
});

describe('PUT /api/lists/:id', () => {
    it('replaces the name and the items, and sends back the new metadata', async () => {
        const [id] = await insertLists([WEEKEND_LIST]);
        const items = WEEKEND_LIST.items.map((item) => ({ ...item, completed: true }));

        const response = await api().put(`/api/lists/${id}`).send({ name: 'Done', items });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ id, name: 'Done', itemCount: 3, completedCount: 3 });
        expect((await api().get(`/api/lists/${id}`)).body).toEqual({ id, name: 'Done', items });
    });

    it('keeps the item order it was sent', async () => {
        const [id] = await insertLists([WEEKEND_LIST]);
        const reversed = WEEKEND_LIST.items.toReversed();

        await api().put(`/api/lists/${id}`).send({ name: WEEKEND_LIST.name, items: reversed });

        expect((await api().get(`/api/lists/${id}`)).body.items).toEqual(reversed);
    });

    it('does not let a client move a list by sending a position', async () => {
        const [first] = await insertLists([WEEKEND_LIST, CHORES_LIST]);

        await api().put(`/api/lists/${first}`).send({ ...WEEKEND_LIST, position: 99 });

        expect(await namesInOrder()).toEqual(["Wolfie's Weekend", 'Chores']);
    });

    it('answers 400 when the name or items are missing', async () => {
        const [id] = await insertLists([WEEKEND_LIST]);

        expect((await api().put(`/api/lists/${id}`).send({ name: 'x' })).status).toBe(400);
        expect((await api().put(`/api/lists/${id}`).send({ items: [] })).status).toBe(400);
    });

    it('answers 400 when an item is invalid, and changes nothing', async () => {
        const [id] = await insertLists([WEEKEND_LIST]);
        const items = [{ ...WEEKEND_LIST.items[0], priority: 'Urgent' }];

        const response = await api().put(`/api/lists/${id}`).send({ name: 'x', items });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/priority/);
        expect((await api().get(`/api/lists/${id}`)).body.name).toBe(WEEKEND_LIST.name);
    });

    it('answers 404 for an id no list has', async () => {
        const response = await api().put(`/api/lists/${MISSING_ID}`).send(WEEKEND_LIST);
        expect(response.status).toBe(404);
    });
});

describe('DELETE /api/lists/:id', () => {
    it('deletes the list and answers 204', async () => {
        const [weekend] = await insertLists([WEEKEND_LIST, CHORES_LIST]);

        const response = await api().delete(`/api/lists/${weekend}`);

        expect(response.status).toBe(204);
        expect(await namesInOrder()).toEqual(['Chores']);
    });

    it('answers 404 for an id no list has', async () => {
        expect((await api().delete(`/api/lists/${MISSING_ID}`)).status).toBe(404);
    });

    it('leaves an empty collection behind, not the example lists', async () => {
        const [id] = await insertLists([WEEKEND_LIST]);
        await api().delete(`/api/lists/${id}`);

        expect((await api().get('/api/lists')).body).toEqual([]);
    });
});
