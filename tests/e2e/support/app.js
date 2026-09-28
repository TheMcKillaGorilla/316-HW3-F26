/**
 * app.js
 *
 * Shared helpers for the Playwright tests.
 *
 * Everything that can be proved without a browser is proved by the client and
 * server suites. What is left here is what needs every tier running together:
 * that a change really reaches MongoDB and survives a reload, that the home
 * screen really is drawn from metadata, that Chrome's own drag and drop and
 * keyboard really reach our handlers.
 *
 * Every test starts with openApp, which resets the database to the example
 * lists in server/data/starter_lists.json, so those lists are the fixture.
 *
 * Selectors use ids, accessible names, labels and the few class names the
 * assignment lists, never a Tailwind class.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';

/** where the client caches the home screen's metadata */
export const STORAGE_KEY = 'cse316.wolfie-lists.hw3.v1';

/** the e2e server, started by playwright.config.js */
export const API_URL = 'http://localhost:4100';

/**
 * The example lists, read from the very file the server seeds from, so that
 * the example data is free to change and these tests follow along.
 */
export const STARTER_LISTS = JSON.parse(readFileSync(
    fileURLToPath(new URL('../../../server/data/starter_lists.json', import.meta.url)),
    'utf8')).lists;

/** the names of the lists in server/data/starter_lists.json, in order */
export const STARTER_LIST_NAMES = STARTER_LISTS.map((list) => list.name);

/** what each list card's subtitle should read, in order */
export const STARTER_LIST_SUBTITLES = STARTER_LISTS.map((list) => (list.items.length === 0)
    ? 'No items yet'
    : `${list.items.filter((item) => item.completed).length} of ${list.items.length} completed`);

/**
 * The list most of these tests work in, found by shape rather than by name: one
 * of exactly three items, at least one completed and at least one not.
 */
const SAMPLE_LIST = (() => {
    const sample = STARTER_LISTS.find((list) => list.items.length === 3
        && list.items.some((item) => item.completed)
        && list.items.some((item) => !item.completed));
    if (sample === undefined) {
        throw new Error(
            'the end to end tests need one starter list of exactly three items, at least one '
            + 'completed and at least one not, and server/data/starter_lists.json no longer '
            + 'has one');
    }
    return sample;
})();

/** the name of that list */
export const SAMPLE_LIST_NAME = SAMPLE_LIST.name;

/** any other starter list, for the tests that need a second one */
export const OTHER_LIST_NAME = STARTER_LIST_NAMES.find((name) => name !== SAMPLE_LIST_NAME);

/** its three items exactly as the file has them, in order */
export const SAMPLE_LIST_ITEMS = SAMPLE_LIST.items.map((item) => ({ ...item }));

/** the descriptions of those items, in order */
export const SAMPLE_ITEMS = SAMPLE_LIST_ITEMS.map((item) => item.description);

/** where the finished and the unfinished items sit, which the file decides */
export const SAMPLE_COMPLETED_INDEX = SAMPLE_LIST_ITEMS.findIndex((item) => item.completed);
export const SAMPLE_UNFINISHED_INDEX = SAMPLE_LIST_ITEMS.findIndex((item) => !item.completed);

/**
 * @param {string|null} isoDate
 * @return {string} that date as an item card shows it, i.e. 08/20/2026
 */
export function displayDate(isoDate) {
    if (typeof isoDate !== 'string') return '—';
    const [year, month, day] = isoDate.split('-');
    return `${month}/${day}/${year}`;
}

/** @return {import('@playwright/test').Locator} the home screen */
export const homeView = (page) => page.getByRole('region', { name: 'Home' });

/** @return {import('@playwright/test').Locator} the list screen */
export const listView = (page) => page.getByRole('region', { name: 'List editor' });

/**
 * Puts the example lists back in the database, opens the application, and
 * waits until the home screen has drawn them.
 */
export async function openApp(page) {
    const reset = await page.request.post(`${API_URL}/test/reset`);
    expect(reset.ok(), 'the e2e server could not reset the database').toBe(true);

    watchRequests(page);
    await page.goto('/');
    await expect(page.locator('.list-card').first()).toBeVisible();
}

/** Opens one of the lists on the home screen by name, and waits for its items. */
export async function openList(page, name) {
    await page.locator('.list-card', { hasText: name }).first().click();
    await expect(listView(page)).toBeVisible();
    await expect(page.locator('#list-loading-message')).toHaveCount(0);
}

/** the API requests each page has sent that have not been answered yet */
const unanswered = new WeakMap();

function watchRequests(page) {
    if (unanswered.has(page)) return;
    const pending = new Set();
    unanswered.set(page, pending);
    page.on('request', (request) => {
        if (new URL(request.url()).pathname.startsWith('/api/')) pending.add(request);
    });
    page.on('requestfinished', (request) => pending.delete(request));
    page.on('requestfailed', (request) => pending.delete(request));
}

/**
 * Waits until every save has been answered. Saves happen in the background, so
 * reloading straight after an edit could cut one off. A real user is far
 * slower than a test, but a test has to wait deliberately. The client sends
 * one request at a time, so this checks twice to catch the gap between them.
 */
export async function waitForSaves(page) {
    const pending = unanswered.get(page);
    for (let quietChecks = 0; quietChecks < 2; quietChecks++) {
        await expect.poll(() => pending.size).toBe(0);
        await page.waitForTimeout(150);
        if (pending.size > 0) quietChecks = -1;
    }
}

/** Reloads the page once every save has landed, and waits for the home screen. */
export async function reload(page) {
    await waitForSaves(page);
    await page.reload();
    await expect(homeView(page)).toBeVisible();
}

/** @return {import('@playwright/test').Locator} every list card on the home screen */
export const listCards = (page) => page.locator('#list-card-container .list-card');

/** @return {import('@playwright/test').Locator} the list card for one list */
export const listCardNamed = (page, name) => page.locator('.list-card', { hasText: name }).first();

/** @return {import('@playwright/test').Locator} every item card in the open list */
export const itemCards = (page) => page.locator('#item-card-container .item-card');

/** @return {import('@playwright/test').Locator} the item card at one position */
export const itemCardAt = (page, index) =>
    page.locator(`#item-card-container .item-card[data-index="${index}"]`);

/** @return {import('@playwright/test').Locator} an item card's duplicate button */
export const duplicateButton = (card) => card.getByRole('button', { name: /^Duplicate the item/ });

/** @return {import('@playwright/test').Locator} an item card's delete button */
export const deleteButton = (card) => card.getByRole('button', { name: /^Delete the item/ });

/** @return {import('@playwright/test').Locator} the + button in the list view */
export const addItemButton = (page) => page.getByRole('button', { name: 'Add a new item' });

/** @return {Promise<string[]>} the descriptions of the items on screen, in order */
export async function itemDescriptions(page) {
    return page.locator('#item-card-container .item-card .item-description').allTextContents();
}

/** @return {Promise<string[]>} the names of the lists on the home screen */
export async function listNames(page) {
    return page.locator('#list-card-container .list-card-title').allTextContents();
}

/** the item modal's controls, found by label as the assignment names them */
export const modal = {
    description: (page) => page.locator('#item-description-input'),
    dateEntered: (page) => page.locator('#item-date-entered-input'),
    priority: (page) => page.getByLabel('Priority', { exact: true }),
    targetDate: (page) => page.getByLabel(/meant to be finished by/),
    completed: (page) => page.getByLabel('Completed', { exact: true }),
    previous: (page) => page.locator('#item-modal').getByRole('button', { name: /Previous/ }),
    next: (page) => page.locator('#item-next-button'),
    ok: (page) => page.locator('#item-ok-button'),
    cancel: (page) => page.locator('#item-cancel-button')
};

/**
 * Fills in the item modal and presses a button.
 *
 * @param {Object} values
 * @param {string} press one of ok, cancel, next, previous
 */
export async function fillItemModal(
    page, { description, dateEntered, priority, targetDate, completed } = {}, press = 'ok') {
    await expect(page.locator('#item-modal')).toBeVisible();

    if (description !== undefined) await modal.description(page).fill(description);
    if (dateEntered !== undefined) await modal.dateEntered(page).fill(dateEntered);
    if (priority !== undefined) await modal.priority(page).selectOption(priority);
    if (targetDate !== undefined) await modal.targetDate(page).fill(targetDate);
    if (completed !== undefined) await modal.completed(page).setChecked(completed);

    await modal[press](page).click();
}

/**
 * The item modal's heading tells a user where they are while stepping through a
 * list, so it has to carry both the position and the total.
 */
export async function expectHeadingShowsItem(page, position, total) {
    const heading = page.locator('#item-modal-heading');
    await expect(heading).toHaveText(new RegExp(`\\b${position}\\b`));
    await expect(heading).toHaveText(new RegExp(`\\b${total}\\b`));
}

/** @return {Promise<Object[]|null>} the metadata the client has cached in local storage */
export async function readCache(page) {
    return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key)), STORAGE_KEY);
}

/** @return {Promise<Object[]>} every list in the database, read through the API */
export async function listsInDatabase(page) {
    const metadata = await (await page.request.get(`${API_URL}/api/lists`)).json();
    return Promise.all(metadata.map(async ({ id }) =>
        (await page.request.get(`${API_URL}/api/lists/${id}`)).json()));
}
