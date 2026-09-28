/**
 * useUndoRedo.js
 *
 * Undo and redo by keeping snapshots: the Memento pattern. Before every edit,
 * keep the old value. Undo does not reverse anything; it goes back to an
 * earlier snapshot.
 *
 *     past      [oldest, ..., newest]   what undo can go back to
 *     present   the value on screen
 *     future    [next, ..., furthest]   what redo can go forward to
 *
 * THIS IS A PLACEHOLDER, and replacing it is part of the assignment. It keeps
 * only the present value, so edits show on screen, but nothing can be undone. Keep what it returns exactly as it is: CurrentListContext and the
 * tests depend on those names.
 */
import { useState } from 'react';

/** the most snapshots the past may hold; older ones are forgotten */
export const LIMIT = 100;

export function useUndoRedo(initialValue) {
    const [present, setPresent] = useState(initialValue);

    return {
        present,
        /** records a change. updater is given the present value and returns the new one */
        set: (updater) => setPresent(updater),
        undo: () => {},
        redo: () => {},
        /** starts again from value, with nothing to undo or redo */
        reset: (value) => setPresent(value),
        canUndo: false,
        canRedo: false
    };
}
