// @vitest-environment jsdom
/**
 * metadataCache.test.js
 *
 * Local storage as a cache: it gives back what was put in, and any failure
 * means "nothing cached" rather than an error.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadCachedMetadata, saveCachedMetadata, STORAGE_KEY } from '../../src/data/metadataCache.js';

const METADATA = [{ id: 'a', name: 'Chores', itemCount: 2, completedCount: 1 }];

beforeEach(() => window.localStorage.clear());

describe('the metadata cache', () => {
    it('gives back what was saved', () => {
        saveCachedMetadata(METADATA);
        expect(loadCachedMetadata()).toEqual(METADATA);
    });

    it('uses a key of its own, not HW2\'s', () => {
        saveCachedMetadata(METADATA);
        expect(STORAGE_KEY).toMatch(/hw3/);
        expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    });

    it('answers null when nothing has been cached', () => {
        expect(loadCachedMetadata()).toBeNull();
    });

    it('answers null for something unreadable', () => {
        window.localStorage.setItem(STORAGE_KEY, '{ not json');
        expect(loadCachedMetadata()).toBeNull();
    });

    it('answers null for readable JSON that is not an array', () => {
        window.localStorage.setItem(STORAGE_KEY, '{"lists":[]}');
        expect(loadCachedMetadata()).toBeNull();
    });

    it('does not throw when storage refuses the write', () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });
        expect(() => saveCachedMetadata(METADATA)).not.toThrow();
    });
});
