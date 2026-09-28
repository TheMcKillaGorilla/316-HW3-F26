/**
 * database.js
 *
 * A real MongoDB for the integration tests. globalSetup.js has already started
 * one in memory; each test file connects to a database of its own on it, and
 * clearDatabase runs before each test so no test sees another's lists.
 */
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { inject } from 'vitest';
import { List } from '../../src/models/List.js';

export async function startDatabase() {
    await mongoose.connect(inject('mongoUri'), { dbName: `test-${randomUUID()}` });
}

export async function stopDatabase() {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
}

export async function clearDatabase() {
    await List.deleteMany({});
}

/**
 * Puts lists straight into the database, in order, bypassing the API.
 *
 * @param {Object[]} lists plain { name, items } objects
 * @return {Promise<string[]>} their new ids
 */
export async function insertLists(lists) {
    const created = await List.insertMany(lists.map((list, position) => ({ ...list, position })));
    return created.map((list) => String(list._id));
}
