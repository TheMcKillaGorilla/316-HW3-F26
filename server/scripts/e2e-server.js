/**
 * e2e-server.js
 *
 * The server the end to end tests run against: the real app, but on a
 * throwaway in-memory MongoDB so the tests never touch your wolfie_lists data.
 * Playwright starts and stops it (see tests/e2e/playwright.config.js).
 *
 * It adds one route the real server does not have. POST /test/reset puts the
 * example lists back, and the tests call it before each one so every test
 * starts from the same data. It lives out here, in front of the app rather
 * than inside it, so it can never be reached on the real server.
 */
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { seedStarterLists } from '../src/seedStarterLists.js';

const PORT = Number(process.env.E2E_API_PORT) || 4100;

const mongod = await MongoMemoryServer.create();
await mongoose.connect(mongod.getUri());

const server = express();
server.post('/test/reset', async (req, res) => {
    await seedStarterLists();
    res.status(204).end();
});
server.use(createApp({ logRequests: false }));

server.listen(PORT, () => console.log(`e2e API listening on http://localhost:${PORT}`));

// Playwright stops the server with a signal; take the database down with it
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
        await mongoose.disconnect();
        await mongod.stop();
        process.exit(0);
    });
}
