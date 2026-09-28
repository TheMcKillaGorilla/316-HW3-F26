/**
 * CurrentListContext.jsx
 *
 * The open list: fetching it, editing it, undo and redo, and saving it.
 *
 * App only mounts this provider while a list is open, so the undo history is
 * created when a list opens and thrown away when it closes.
 *
 * Every change, undo and redo included, sends the whole list to the server.
 * Undo needs no special handling on the server: to the server, restoring an
 * old snapshot is simply one more save.
 */
import { createContext, useContext, useEffect } from 'react';
import * as api from '../api/api.js';
import { useUndoRedo } from '../hooks/useUndoRedo.js';
import { useLists } from './ListsContext.jsx';
import { useModals } from './ModalContext.jsx';

const CurrentListContext = createContext(null);

export function useCurrentList() {
    const value = useContext(CurrentListContext);
    if (value === null) throw new Error('useCurrentList must be used inside a <CurrentListProvider>');
    return value;
}

export function CurrentListProvider({ children }) {
    const { currentListId, closeList } = useLists();
    const { inform } = useModals();

    // null until the list has arrived from the server
    const undoRedo = useUndoRedo(null);
    const list = undoRedo.present;

    // fetch the list when it is opened; the ignore flag is explained in ListsContext
    useEffect(() => {
        let ignore = false;
        api.getList(currentListId)
            .then((loaded) => {
                if (ignore) return;
                undoRedo.reset(loaded);
            })
            .catch((error) => {
                if (ignore) return;
                inform({ title: 'The List Could Not Be Opened', message: error.message });
                closeList();
            });
        return () => { ignore = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentListId]);

    const value = {
        list,
        /** the one way to change the list: updater is given it and returns the new version */
        change: undoRedo.set,
        undo: undoRedo.undo,
        redo: undoRedo.redo,
        canUndo: undoRedo.canUndo,
        canRedo: undoRedo.canRedo
    };

    return <CurrentListContext.Provider value={value}>{children}</CurrentListContext.Provider>;
}
