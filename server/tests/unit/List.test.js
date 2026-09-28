/**
 * List.test.js
 *
 * The schema's validation rules and the naming helper. validate() runs the
 * schema's checks without saving, so none of this needs a database.
 */
import { describe, expect, it } from 'vitest';
import { buildUnusedName, List, newItemId } from '../../src/models/List.js';
import { WEEKEND_LIST } from '../helpers/fixtures.js';

/** @return {Promise<Object|null>} the validation errors by path, or null if valid */
async function errorsFor(values) {
    try {
        await new List({ position: 0, ...values }).validate();
        return null;
    } catch (error) {
        return error.errors;
    }
}

describe('a valid list', () => {
    it('passes validation', async () => {
        expect(await errorsFor(WEEKEND_LIST)).toBeNull();
    });

    it('may have no items', async () => {
        expect(await errorsFor({ name: 'Empty' })).toBeNull();
    });

    it('fills in the defaults for an item', async () => {
        const list = new List({
            name: 'Defaults',
            position: 0,
            items: [{ id: 'item-a', description: 'Something', dateEntered: '2026-09-01' }]
        });
        await list.validate();

        expect(list.items[0].priority).toBe('Low');
        expect(list.items[0].targetDate).toBeNull();
        expect(list.items[0].completed).toBe(false);
    });

    it('trims the name', () => {
        expect(new List({ name: '  Spaced  ', position: 0 }).name).toBe('Spaced');
    });
});

describe('an invalid list', () => {
    it('must have a name', async () => {
        expect(await errorsFor({ name: '   ' })).toHaveProperty('name');
    });

    it('may not have a name longer than 60 characters', async () => {
        expect(await errorsFor({ name: 'x'.repeat(61) })).toHaveProperty('name');
    });

    it('must have a position', async () => {
        const list = new List({ name: 'No Position' });
        await expect(list.validate()).rejects.toThrow(/position/);
    });

    it.each([
        ['an item with no description', { description: '  ' }, 'items.0.description'],
        ['an unknown priority', { priority: 'Urgent' }, 'items.0.priority'],
        ['a malformed date entered', { dateEntered: '09/01/2026' }, 'items.0.dateEntered'],
        ['a malformed target date', { targetDate: 'tomorrow' }, 'items.0.targetDate'],
        ['an item with no id', { id: undefined }, 'items.0.id']
    ])('rejects %s', async (_, change, path) => {
        const item = { ...WEEKEND_LIST.items[0], ...change };
        expect(await errorsFor({ name: 'Bad', items: [item] })).toHaveProperty([path]);
    });
});

describe('buildUnusedName', () => {
    it('keeps the name when nobody has it', () => {
        expect(buildUnusedName(['Chores'], 'Untitled List')).toBe('Untitled List');
    });

    it('counts up from 2 until it finds a free name', () => {
        expect(buildUnusedName(['Untitled List', 'Untitled List 2'], 'Untitled List'))
            .toBe('Untitled List 3');
    });
});

describe('newItemId', () => {
    it('makes a different id every time, in the form the client uses', () => {
        const first = newItemId();
        expect(first).toMatch(/^item-/);
        expect(newItemId()).not.toBe(first);
    });
});
