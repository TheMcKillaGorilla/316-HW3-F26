/**
 * duplicateList.test.js
 *
 * POST /api/lists/:id/duplicate, through real HTTP requests (supertest) to the
 * real app, backed by a real MongoDB running in memory. Nothing is mocked.
 *
 * Every test follows the same three steps:
 *
 *   1. put lists in the database          insertLists([...])
 *   2. send a request                     await api().post(`/api/lists/${id}/duplicate`)
 *   3. check the response and what the database now holds
 *
 * listsApi.test.js tests every other route the same way, and is the place to
 * look for examples.
 *
 * YOU WRITE THESE TESTS. Each it.todo below names one test. Turn each into a
 * real test by changing it.todo('...') to it('...', () => { ... }) and
 * writing the test body. Keep the names: they are how your tests are graded.
 * Your tests must pass against a correct server, and should fail against one
 * that gets the behavior in their name wrong.
 */
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { clearDatabase, insertLists, startDatabase, stopDatabase } from '../helpers/database.js';
import { CHORES_LIST, WEEKEND_LIST } from '../helpers/fixtures.js';

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

describe('POST /api/lists/:id/duplicate', () => {
    it.todo('answers 201 with the metadata of the copy');
    it.todo('files the copy directly beneath the original');
    it.todo('copies every item, each with an id of its own');
    it.todo('leaves the original list as it was');
    it.todo('does not reuse a copy name that is taken');
    it.todo('keeps a copy of a long name within 60 characters');
    it.todo('answers 404 for an id no list has');
});
