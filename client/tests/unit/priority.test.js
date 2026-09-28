/**
 * priority.test.js
 */
import { describe, expect, it } from 'vitest';
import { Priority, PRIORITIES } from '../../src/model/priority.js';

describe('Priority', () => {
    it('holds the three priorities', () => {
        expect(Priority).toEqual({ HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' });
    });

    it('lists them most urgent first', () => {
        expect(PRIORITIES).toEqual(['High', 'Medium', 'Low']);
    });
});
