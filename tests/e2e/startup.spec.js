/**
 * startup.spec.js
 *
 * Opening the application, in a real browser, against the real server.
 *
 * This catches what no other test can: every .jsx file compiled and served,
 * React mounted, the /api proxy forwarding to Express, and Express reading from
 * MongoDB. A mistake anywhere in that chain gives a blank or empty page.
 */
import { test, expect } from '@playwright/test';
import {
    API_URL, openApp, openList, homeView, listView, listCards, listCardNamed, listNames,
    readCache, reload, STARTER_LIST_NAMES, STARTER_LIST_SUBTITLES, SAMPLE_LIST_NAME
} from './support/app.js';

test.describe('opening the application', () => {
    test('shows the lists in the database', async ({ page }) => {
        await openApp(page);

        await expect(listCards(page)).toHaveCount(STARTER_LIST_NAMES.length);
        expect(await listNames(page)).toEqual(STARTER_LIST_NAMES);
    });

    test('shows how much of each list is done', async ({ page }) => {
        await openApp(page);

        const subtitles = await page.locator('.list-card-subtitle').allTextContents();
        expect(subtitles).toEqual(STARTER_LIST_SUBTITLES);
    });

    test('lands on the home screen, not inside a list', async ({ page }) => {
        await openApp(page);

        await expect(homeView(page)).toBeVisible();
        await expect(listView(page)).toBeHidden();
        await expect(page.locator('#modal-backdrop')).toBeHidden();
    });

    test('shows the Wolfie logo beside the title', async ({ page }) => {
        await openApp(page);

        const logo = homeView(page).locator('header img');
        await expect(logo).toBeVisible();
        expect(await logo.evaluate((img) => img.complete && img.naturalWidth > 0),
            'the logo image failed to load').toBe(true);
    });

    test('loads every module without a console error', async ({ page }) => {
        const problems = [];
        page.on('console', (message) => {
            if (message.type() === 'error') problems.push(message.text());
        });
        page.on('pageerror', (error) => problems.push(error.message));

        await openApp(page);
        await openList(page, SAMPLE_LIST_NAME);

        expect(problems).toEqual([]);
    });
});

test.describe('what crosses the network', () => {
    test('the home screen asks for metadata, and nothing else', async ({ page }) => {
        const requests = [];
        page.on('request', (request) => {
            const { pathname } = new URL(request.url());
            if (pathname.startsWith('/api/')) requests.push(`${request.method()} ${pathname}`);
        });

        await openApp(page);

        expect([...new Set(requests)]).toEqual(['GET /api/lists']);
    });

    test('the metadata carries counts, never items', async ({ page }) => {
        await openApp(page);

        const metadata = await (await page.request.get(`${API_URL}/api/lists`)).json();
        for (const list of metadata) {
            expect(Object.keys(list).sort()).toEqual(['completedCount', 'id', 'itemCount', 'name']);
        }
    });

    test('a list\'s items are fetched only when it is opened', async ({ page }) => {
        await openApp(page);

        const [response] = await Promise.all([
            page.waitForResponse((r) => /\/api\/lists\/[^/]+$/.test(new URL(r.url()).pathname)),
            openList(page, SAMPLE_LIST_NAME)
        ]);

        expect((await response.json()).name).toBe(SAMPLE_LIST_NAME);
    });
});

test.describe('the local storage cache', () => {
    test('holds the metadata and nothing more', async ({ page }) => {
        await openApp(page);

        const cached = await readCache(page);
        expect(cached.map((list) => list.name)).toEqual(STARTER_LIST_NAMES);
        for (const list of cached) {
            expect(list).not.toHaveProperty('items');
        }
    });

    test('draws the home screen even when the server cannot be reached', async ({ page }) => {
        await openApp(page);

        // from now on every API request fails as if the server were off. The
        // test is on the path, since the client's own src/api/api.js must load
        await page.route((url) => url.pathname.startsWith('/api/'), (route) => route.abort());
        await page.reload();

        await expect(page.locator('#alert-modal-title')).toHaveText('The Server Could Not Be Reached');
        await expect(listCards(page)).toHaveCount(STARTER_LIST_NAMES.length);
    });
});

test.describe('deleted lists', () => {
    test('stay deleted after a reload', async ({ page }) => {
        await openApp(page);
        await listCardNamed(page, SAMPLE_LIST_NAME).locator('[data-action="delete-list"]').click();
        await page.locator('#confirm-accept-button').click();
        await expect(listCards(page)).toHaveCount(STARTER_LIST_NAMES.length - 1);

        await reload(page);

        await expect(listCards(page)).toHaveCount(STARTER_LIST_NAMES.length - 1);
        expect(await listNames(page)).not.toContain(SAMPLE_LIST_NAME);
    });

    test('are not replaced by the examples when every list is gone', async ({ page }) => {
        await openApp(page);

        for (const name of STARTER_LIST_NAMES) {
            await listCardNamed(page, name).locator('[data-action="delete-list"]').click();
            await page.locator('#confirm-accept-button').click();
        }
        await expect(page.locator('#home-empty-message')).toContainText('do not have any lists');

        await reload(page);

        await expect(page.locator('#home-empty-message')).toContainText('do not have any lists');
        await expect(listCards(page)).toHaveCount(0);
    });
});
