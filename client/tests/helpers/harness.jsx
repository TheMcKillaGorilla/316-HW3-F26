/**
 * harness.jsx
 *
 * Two ways of putting the application on screen for a test. Both install the
 * fake server first, holding whatever lists the test asks for, and both render
 * under StrictMode, exactly as main.jsx does, so an effect that is not safe to
 * run twice fails here rather than in the browser.
 */
import { StrictMode, useEffect } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App.jsx';
import { CurrentListProvider, useCurrentList } from '../../src/context/CurrentListContext.jsx';
import { ListsProvider, useLists } from '../../src/context/ListsContext.jsx';
import { ModalProvider, useModals } from '../../src/context/ModalContext.jsx';
import { useListEditor } from '../../src/hooks/useListEditor.js';
import { STORAGE_KEY } from '../../src/data/metadataCache.js';
import { installFakeServer } from './fakeServer.js';
import { WEEKEND_LIST } from './fixtures.js';

/** empties local storage; call from beforeEach in any file that renders the app */
export function resetStorage() {
    window.localStorage.clear();
}

/** puts metadata into local storage the way a previous visit would have */
export function seedCache(metadata) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
}

/** @return {Object[]|null} the metadata currently cached in local storage */
export function readCache() {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY));
}

/**
 * Renders the whole application, the way a user meets it.
 *
 * @param {Object} options
 * @param {Object[]} options.lists the lists the fake server holds
 * @return {Object} the testing library result, a userEvent instance, and the
 * fake server
 */
export function renderApp({ lists = [WEEKEND_LIST] } = {}) {
    const server = installFakeServer(lists);
    return {
        server,
        user: userEvent.setup(),
        ...render(<StrictMode><App /></StrictMode>)
    };
}

/**
 * Renders just the providers, with one list already open, and hands the test
 * direct access to the editor hook and the contexts. The editing tests use
 * this to drive the real contexts and the real history without clicking.
 *
 * @return {Object} `context`, whose .current is refreshed on every render and
 * holds the editor, the contexts and the modal controls, plus the fake server
 */
export function renderOpenList({ lists = [WEEKEND_LIST], openIndex = 0 } = {}) {
    const server = installFakeServer(lists);

    // not state: updated on every render so a test always reads the latest
    const context = { current: null };

    function Probe() {
        context.current = {
            editor: useListEditor(),
            currentList: useCurrentList(),
            lists: useLists(),
            modals: useModals()
        };
        return null;
    }

    /** opens a list once the metadata has arrived, then does what App does */
    function Harness() {
        const { isLoaded, metadata, currentListId, openList } = useLists();

        useEffect(() => {
            if (!isLoaded || currentListId !== null || metadata.length === 0) return;
            openList(metadata[openIndex].id);
        }, [isLoaded, metadata, currentListId, openList]);

        if (currentListId === null) return null;

        return (
            <CurrentListProvider key={currentListId}>
                <Probe />
            </CurrentListProvider>
        );
    }

    const result = render(
        <StrictMode>
            <ModalProvider>
                <ListsProvider>
                    <Harness />
                </ListsProvider>
            </ModalProvider>
        </StrictMode>
    );

    return { context, server, user: userEvent.setup(), ...result };
}
