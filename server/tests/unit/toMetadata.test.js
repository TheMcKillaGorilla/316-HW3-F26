/**
 * toMetadata.test.js
 *
 * toMetadata turns one list from the database into the four fields the home
 * screen draws a card from. It is a pure function, so a test is three steps:
 * make a list, call toMetadata, check what came back. No database is needed,
 * because new List(...) builds a document in memory without saving it.
 *
 * YOU WRITE THESE TESTS. Each it.todo below names one test. Turn each into a
 * real test by changing it.todo('...') to it('...', () => { ... }) and
 * writing the test body. Keep the names: they are how your tests are graded.
 * Your tests must pass against a correct server, and should fail against one
 * that gets the behavior in their name wrong.
 */
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { toMetadata } from '../../src/dto/listDTO.js';
import { List } from '../../src/models/List.js';
import { EMPTY_LIST, WEEKEND_LIST } from '../helpers/fixtures.js';

/** @return {List} an unsaved list document, as a query would hand it back */
const document = (values) => new List({ position: 0, ...values });

describe('toMetadata', () => {
    it.todo('has exactly the fields id, name, itemCount and completedCount');
    it.todo('sends the id as a string, not an ObjectId');
    it.todo('sends the name unchanged');
    it.todo('counts every item');
    it.todo('counts only the completed items');
    it.todo('answers 0 and 0 for a list with no items');
    it.todo('works on a plain object from a lean query too');
});
