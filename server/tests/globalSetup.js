/**
 * globalSetup.js
 *
 * Starts ONE in-memory MongoDB before any test file runs, and stops it after
 * the last. Each test file then works in a database of its own on that server
 * (see helpers/database.js), so files can still run in parallel.
 *
 * The first run downloads MongoDB (several hundred MB) into your user cache,
 * which is why it happens once, here, rather than once per file.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

export default async function setup({ provide }) {
    const mongod = await MongoMemoryServer.create();
    provide('mongoUri', mongod.getUri());
    return () => mongod.stop();
}
