/**
 * vitest.config.js
 *
 * The server's tests, in two tiers like the client's:
 *
 *   tests/unit          one module on its own, no database
 *   tests/integration   real HTTP requests (supertest) against the real app and
 *                       a real MongoDB, running in memory (mongodb-memory-server)
 *
 * globalSetup.js starts one in-memory MongoDB for the whole run. It is
 * downloaded the first time the tests run (several hundred MB, once), and
 * each test file gets a throwaway database on it, so the tests never touch
 * your wolfie_lists data.
 */
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    root: fileURLToPath(new URL('..', import.meta.url)),
    test: {
        environment: 'node',
        include: ['tests/**/*.test.js'],
        globalSetup: ['tests/globalSetup.js'],
        restoreMocks: true
    }
});
