/**
 * wolfieList.js
 *
 * A single named to-do list, as the client edits it. A list is a plain object:
 *
 *     { id, name, items }
 *
 * Every function here returns a NEW list rather than changing the one it was
 * given, because React only redraws when it is handed a different object, and
 * because the undo history (useUndoRedo) keeps the old ones as snapshots.
 *
 * Creating, copying and naming whole lists moved to the server in HW3, since
 * the client no longer has every list to hand.
 */
export const DEFAULT_LIST_NAME = 'Untitled List';
export const MAX_NAME_LENGTH = 60;

/** @return {string} what the user typed, trimmed, shortened and never empty */
export function normalizeListName(name) {
    const trimmed = name.trim();
    return trimmed === '' ? DEFAULT_LIST_NAME : trimmed.slice(0, MAX_NAME_LENGTH);
}

export function addItem(list, item, index = list.items.length) {
    return { ...list, items: list.items.toSpliced(index, 0, item) };
}

export function removeItemAt(list, index) {
    return { ...list, items: list.items.toSpliced(index, 1) };
}

export function replaceItemAt(list, index, item) {
    return { ...list, items: list.items.with(index, item) };
}

export function moveItem(list, fromIndex, toIndex) {
    const moved = list.items[fromIndex];
    return { ...list, items: list.items.toSpliced(fromIndex, 1).toSpliced(toIndex, 0, moved) };
}

export function withName(list, name) {
    return { ...list, name };
}
