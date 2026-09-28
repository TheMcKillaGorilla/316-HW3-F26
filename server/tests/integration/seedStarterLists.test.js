/**
 * seedStarterLists.test.js
 *
 * npm run seed. The expectations are read from the data file itself, so the
 * example lists are free to change.
 */
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { List } from '../../src/models/List.js';
import { seedStarterLists } from '../../src/seedStarterLists.js';
import { clearDatabase, insertLists, startDatabase, stopDatabase } from '../helpers/database.js';
import { CHORES_LIST } from '../helpers/fixtures.js';

const STARTER = JSON.parse(readFileSync(
    new URL('../../data/starter_lists.json', import.meta.url), 'utf8')).lists;

beforeAll(startDatabase);
afterAll(stopDatabase);
beforeEach(clearDatabase);

describe('seedStarterLists', () => {
    it('loads every example list, in the order the file has them', async () => {
        await seedStarterLists();

        const lists = await List.find().sort('position').lean();
        expect(lists.map((list) => list.name)).toEqual(STARTER.map((list) => list.name));
    });

    it('passes the schema, so the file is valid data', async () => {
        await seedStarterLists();

        for (const list of await List.find()) {
            await expect(list.validate()).resolves.toBeUndefined();
        }
    });

    it('gives every item an id of its own', async () => {
        await seedStarterLists();

        const ids = (await List.find().lean()).flatMap((list) => list.items.map((item) => item.id));
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('replaces whatever was there before', async () => {
        await insertLists([CHORES_LIST]);
        await seedStarterLists();

        expect(await List.countDocuments()).toBe(STARTER.length);
        expect(await List.findOne({ name: 'Chores' })).toBeNull();
    });
});
