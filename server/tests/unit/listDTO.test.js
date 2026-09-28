/**
 * listDTO.test.js
 *
 * What crosses the network. These tests are the contract the client is built
 * against: exactly these fields, and nothing from Mongo's internals.
 * toMetadata has a file of its own, toMetadata.test.js.
 */
import { describe, expect, it } from 'vitest';
import { fromRequest, toListJSON } from '../../src/dto/listDTO.js';
import { List } from '../../src/models/List.js';
import { WEEKEND_LIST } from '../helpers/fixtures.js';

const document = () => new List({ ...WEEKEND_LIST, position: 3 });

describe('toListJSON', () => {
    it('sends the id as a string called id, and no Mongo fields', () => {
        const json = toListJSON(document());

        expect(Object.keys(json).sort()).toEqual(['id', 'items', 'name']);
        expect(typeof json.id).toBe('string');
    });

    it('sends every item field, and only those', () => {
        expect(toListJSON(document()).items).toEqual(WEEKEND_LIST.items);
    });
});

describe('fromRequest', () => {
    it('keeps the name and items', () => {
        expect(fromRequest(WEEKEND_LIST)).toEqual(WEEKEND_LIST);
    });

    it('drops anything a client is not allowed to set', () => {
        const changes = fromRequest({ ...WEEKEND_LIST, _id: 'x', position: 99, createdAt: 'x' });
        expect(Object.keys(changes).sort()).toEqual(['items', 'name']);
    });

    it('drops unknown fields on items too', () => {
        const items = [{ ...WEEKEND_LIST.items[0], color: 'blue' }];
        expect(fromRequest({ name: 'x', items }).items[0]).not.toHaveProperty('color');
    });

    it.each([
        ['no body', undefined],
        ['no name', { items: [] }],
        ['no items', { name: 'x' }],
        ['items that are not an array', { name: 'x', items: 'lots' }]
    ])('answers null for %s', (_, body) => {
        expect(fromRequest(body)).toBeNull();
    });
});
