// @vitest-environment jsdom
/**
 * App.test.jsx
 *
 * The whole client talking to the (fake) server: what is loaded when, what is
 * cached, what is saved, and what happens when the server is not there.
 *
 * THE LOAD BEARING TESTS are in the first two groups. The home screen gets
 * metadata and nothing more, a list's items are fetched only when it is opened,
 * and local storage never holds an item.
 */
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { readCache, renderApp, resetStorage, seedCache } from '../helpers/harness.jsx';
import { CHORES_LIST, metadataOf, WEEKEND_LIST } from '../helpers/fixtures.js';

beforeEach(resetStorage);

const listCards = () => screen.queryAllByRole('button', { name: /^Open the list named/ });

async function openWeekend(user) {
    await user.click(await screen.findByRole('button', { name: /Open the list named Wolfie/ }));
    await screen.findByRole('button', { name: 'Edit the item Call home' });
}

describe('what the home screen loads', () => {
    it('asks the server for the metadata only', async () => {
        const { server } = renderApp({ lists: [WEEKEND_LIST, CHORES_LIST] });

        await waitFor(() => expect(listCards()).toHaveLength(2));
        expect(server.requests.every((request) => request.url === '/api/lists')).toBe(true);
    });

    it('does not fetch any list until it is opened', async () => {
        const { server, user } = renderApp({ lists: [WEEKEND_LIST, CHORES_LIST] });
        await waitFor(() => expect(listCards()).toHaveLength(2));

        expect(server.requests.filter((request) => request.url !== '/api/lists')).toEqual([]);

        await openWeekend(user);

        const fetchedLists = server.requestsOf('GET').map((request) => request.url)
            .filter((url) => url !== '/api/lists');
        expect(new Set(fetchedLists)).toEqual(new Set([`/api/lists/${WEEKEND_LIST.id}`]));
    });

    it('fetches the list again every time it is opened', async () => {
        const { server, user } = renderApp();
        await openWeekend(user);
        await user.click(screen.getByRole('button', { name: 'Close this list' }));

        server.list(WEEKEND_LIST.id).items[2].description = 'Changed elsewhere';
        await user.click(await screen.findByRole('button', { name: /Open the list named Wolfie/ }));

        expect(await screen.findByRole('button', { name: 'Edit the item Changed elsewhere' }))
            .toBeInTheDocument();
    });

    it('says it is loading while a list is on its way', async () => {
        const { server, user } = renderApp();
        const card = await screen.findByRole('button', { name: /Open the list named Wolfie/ });

        let answer;
        server.wait = new Promise((resolve) => { answer = resolve; });
        await user.click(card);

        expect(await screen.findByText(/Loading this list/)).toBeInTheDocument();
        answer();
        await screen.findByRole('button', { name: 'Edit the item Call home' });
        expect(screen.queryByText(/Loading this list/)).not.toBeInTheDocument();
    });
});

describe('the local storage cache', () => {
    it('holds the metadata the server sent, and never any items', async () => {
        renderApp({ lists: [WEEKEND_LIST, CHORES_LIST] });

        await waitFor(() => expect(readCache()).toEqual([
            metadataOf(WEEKEND_LIST), metadataOf(CHORES_LIST)
        ]));
        for (const entry of readCache()) {
            expect(Object.keys(entry).sort()).toEqual(['completedCount', 'id', 'itemCount', 'name']);
        }
    });

    it('draws the cached cards before the server has answered', async () => {
        seedCache([metadataOf(CHORES_LIST)]);
        const { server } = renderApp({ lists: [WEEKEND_LIST] });
        server.down = true;

        // on the very first render, from the cache alone
        expect(listCards()).toHaveLength(1);
        expect(listCards()[0]).toHaveTextContent('Chores');
    });

    it('replaces the cached cards with the server\'s once it answers', async () => {
        seedCache([metadataOf(CHORES_LIST)]);
        renderApp({ lists: [WEEKEND_LIST] });

        await waitFor(() => expect(listCards()[0]).toHaveTextContent("Wolfie's Weekend"));
        expect(listCards()).toHaveLength(1);
        await waitFor(() => expect(readCache()).toEqual([metadataOf(WEEKEND_LIST)]));
    });

    it('keeps up with every change, including the counts after an edit', async () => {
        const { user } = renderApp();
        await openWeekend(user);

        await user.click(screen.getByRole('button', { name: 'Delete the item Call home' }));
        await user.click(await screen.findByRole('button', { name: 'Delete Item' }));

        await waitFor(() => expect(readCache()[0]).toMatchObject({ itemCount: 2, completedCount: 1 }));
    });
});

describe('saving', () => {
    it('sends the whole list after an edit', async () => {
        const { server, user } = renderApp();
        await openWeekend(user);

        await user.click(screen.getByRole('button', { name: 'Edit the item Hike the Ashokan rail trail' }));
        await user.clear(await screen.findByLabelText('Description'));
        await user.type(screen.getByLabelText('Description'), 'Hike Bear Mountain');
        await user.click(screen.getByRole('button', { name: 'OK' }));

        await waitFor(() => {
            expect(server.list(WEEKEND_LIST.id).items[0].description).toBe('Hike Bear Mountain');
        });
        expect(server.requestsOf('PUT').at(-1).body.items).toHaveLength(3);
    });

    it('sends an undo through to the server too', async () => {
        const { server, user } = renderApp();
        await openWeekend(user);

        await user.click(screen.getByRole('button', { name: 'Delete the item Call home' }));
        await user.click(await screen.findByRole('button', { name: 'Delete Item' }));
        await waitFor(() => expect(server.list(WEEKEND_LIST.id).items).toHaveLength(2));

        await user.click(screen.getByRole('button', { name: 'Undo' }));
        await waitFor(() => expect(server.list(WEEKEND_LIST.id).items).toHaveLength(3));
    });

    it('saves nothing just because a list was opened and closed', async () => {
        const { server, user } = renderApp();
        await openWeekend(user);
        await user.click(screen.getByRole('button', { name: 'Close this list' }));
        await screen.findByRole('button', { name: /Open the list named Wolfie/ });

        expect(server.requestsOf('PUT')).toEqual([]);
    });

    it('updates the card on the home screen from the server\'s answer', async () => {
        const { user } = renderApp();
        await openWeekend(user);

        await user.click(screen.getByRole('button', { name: 'Duplicate the item Read chapter four' }));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled());
        await user.click(screen.getByRole('button', { name: 'Close this list' }));

        expect(await screen.findByText('2 of 4 completed')).toBeInTheDocument();
    });
});

describe('when the server is not there', () => {
    it('says so, and still shows the cached cards', async () => {
        seedCache([metadataOf(WEEKEND_LIST)]);
        const { server } = renderApp();
        server.down = true;

        expect(await screen.findByText('The Server Could Not Be Reached')).toBeInTheDocument();
        expect(listCards()).toHaveLength(1);
    });

    it('says so, and shows the empty home screen when nothing was cached', async () => {
        const { server } = renderApp();
        server.down = true;

        expect(await screen.findByText('The Server Could Not Be Reached')).toBeInTheDocument();
        expect(await screen.findByText(/do not have any lists yet/i)).toBeInTheDocument();
    });

    it('says so and goes back home when a list cannot be opened', async () => {
        const { server, user } = renderApp();
        await waitFor(() => expect(listCards()).toHaveLength(1));
        server.down = true;

        await user.click(screen.getByRole('button', { name: /Open the list named Wolfie/ }));

        expect(await screen.findByText('The List Could Not Be Opened')).toBeInTheDocument();
        await waitFor(() => expect(listCards()).toHaveLength(1));
    });

    it('says so when a change cannot be saved, and keeps it on screen', async () => {
        const { server, user } = renderApp();
        await openWeekend(user);
        server.down = true;

        await user.click(screen.getByRole('button', { name: 'Duplicate the item Call home' }));

        expect(await screen.findByText('Changes Were Not Saved')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Edit the item Call home' })).toHaveLength(2);
    });

    it('says so, and changes nothing, when a list cannot be created', async () => {
        const { server, user } = renderApp();
        await waitFor(() => expect(listCards()).toHaveLength(1));
        server.down = true;

        await user.click(screen.getByRole('button', { name: 'Create a new list' }));

        expect(await screen.findByText('The List Could Not Be Created')).toBeInTheDocument();
        expect(listCards()).toHaveLength(1);
    });

    it('answers with the server\'s own message when it refuses a request', async () => {
        const { server, user } = renderApp();
        await waitFor(() => expect(listCards()).toHaveLength(1));
        // deleted behind this client's back
        server.lists = [];

        await user.click(screen.getByRole('button', { name: /Open the list named Wolfie/ }));

        expect(await screen.findByText('There is no list with that id.')).toBeInTheDocument();
    });
});

describe('moving between the two screens', () => {
    it('has only one screen in the document at a time', async () => {
        const { user } = renderApp();

        await waitFor(() => expect(listCards()).toHaveLength(1));
        expect(screen.queryByRole('region', { name: 'List editor' })).not.toBeInTheDocument();

        await openWeekend(user);
        expect(listCards()).toHaveLength(0);
    });
});
