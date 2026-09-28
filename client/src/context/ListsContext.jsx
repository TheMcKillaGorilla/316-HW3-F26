/**
 * ListsContext.jsx
 *
 * The home screen's data: METADATA about every list ({ id, name, itemCount,
 * completedCount }), never the lists' items. Also which list is open, and the
 * home screen's actions: create, duplicate and delete.
 *
 * The full list is only fetched once it is opened; see CurrentListContext.
 *
 * Creating, duplicating and deleting a list are not undoable, and each waits
 * for the server's answer before the screen changes, so the screen never shows
 * something the server refused.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../api/api.js';
import { loadCachedMetadata, saveCachedMetadata } from '../data/metadataCache.js';
import { useModals } from './ModalContext.jsx';

const ListsContext = createContext(null);

export function useLists() {
    const value = useContext(ListsContext);
    if (value === null) throw new Error('useLists must be used inside a <ListsProvider>');
    return value;
}

export function ListsProvider({ children }) {
    // the cache is the starting value, so cards show before the server answers
    const [metadata, setMetadata] = useState(() => loadCachedMetadata() ?? []);
    // true once the server has answered, or failed to
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentListId, setCurrentListId] = useState(null);

    // the id of a just created list, so ListView knows to select its name
    const [listNeedingNameFocus, setListNeedingNameFocus] = useState(null);

    const { inform } = useModals();

    /**
     * Ask the server for the real metadata once, at startup, and replace the
     * cached copy with it.
     *
     * In development StrictMode runs this effect twice. The ignore flag makes
     * the first run's answer, which arrives after its cleanup, do nothing.
     */
    useEffect(() => {
        let ignore = false;
        api.getAllMetadata()
            .then((fresh) => {
                if (!ignore) setMetadata(fresh);
            })
            .catch((error) => {
                if (!ignore) reportError('The Server Could Not Be Reached', error);
            })
            .finally(() => {
                if (!ignore) setIsLoaded(true);
            });
        return () => { ignore = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // keep the cache in step with every change
    useEffect(() => {
        saveCachedMetadata(metadata);
    }, [metadata]);

    function reportError(title, error) {
        inform({ title, message: error.message });
    }

    async function deleteList(listId) {
        try {
            await api.deleteList(listId);
            setMetadata((previous) => previous.filter((list) => list.id !== listId));
        } catch (error) {
            reportError('The List Could Not Be Deleted', error);
        }
    }

    /** called with the metadata the server sends back after every save */
    function updateMetadata(changed) {
        setMetadata((previous) => previous.map((list) => list.id === changed.id ? changed : list));
    }

    const value = {
        metadata,
        isLoaded,
        currentListId,
        listNeedingNameFocus,
        openList: (listId) => setCurrentListId(listId),
        closeList: () => setCurrentListId(null),
        deleteList,
        updateMetadata,
        clearNameFocusRequest: () => setListNeedingNameFocus(null)
    };

    return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}
