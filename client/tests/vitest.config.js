/**
 * vitest.config.js
 *
 * The client's tests. The folders say how much is involved:
 *
 *   tests/unit          one module on its own
 *   tests/integration   components, contexts and hooks together, driven the way
 *                       a user drives them, against a fake server
 *   ../tests/e2e        the whole application in a real browser (Playwright),
 *                       against the real server and a real database
 *
 * A file that needs a document starts with // @vitest-environment jsdom.
 *
 * Run through npm (npm test), which passes --config. A bare npx vitest would
 * not find this file.
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// the client folder, one level up from this file
const ROOT = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
    root: ROOT,

    // the same plugin vite.config.js uses, so a component is compiled for a test
    // exactly as it is compiled for the browser
    plugins: [react()],

    test: {
        environment: 'node',

        // the DOM matchers, and cleanup after every test
        setupFiles: ['./tests/setup.js'],

        include: [
            'tests/unit/**/*.test.{js,jsx}',
            'tests/integration/**/*.test.{js,jsx}'
        ],

        exclude: ['node_modules/**'],

        // pinned, so the evening time zone test means the same thing anywhere
        env: {
            TZ: 'America/New_York'
        },

        // undo every vi.spyOn and vi.stubGlobal (the fake server) between tests
        restoreMocks: true,
        unstubGlobals: true,

        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            reportsDirectory: 'tests/output/coverage',
            include: ['src/**/*.{js,jsx}'],
            exclude: ['src/main.jsx']
        }
    }
});
