/**
 * seedStarterLists.js
 *
 * Replaces every list in the database with the example lists in
 * data/starter_lists.json. Used by `npm run seed` and by the end to end tests.
 *
 * The file carries no ids. Mongo gives each list one, and each item gets a
 * fresh one here.
 */
import { readFile } from 'node:fs/promises';
import { List, newItemId } from './models/List.js';

const STARTER_FILE = new URL('../data/starter_lists.json', import.meta.url);

/** @return {Promise<number>} how many lists were written */
export async function seedStarterLists() {
    const { lists } = JSON.parse(await readFile(STARTER_FILE, 'utf8'));

    await List.deleteMany({});
    await List.insertMany(lists.map((list, position) => ({
        name: list.name,
        position,
        items: list.items.map((item) => ({ ...item, id: newItemId() }))
    })));
    return lists.length;
}
