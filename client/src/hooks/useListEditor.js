/**
 * useListEditor.js
 *
 * Everything the list screen can do, as one hook. A component calls
 * duplicateItem(index) and never has to know about the contexts, the history
 * or the model behind it.
 *
 * Compare this with HW2, where each edit built a transaction object that knew
 * how to undo itself. Here each edit is just a call to change() with the new
 * version of the list. Undo comes for free, because useUndoRedo kept the old one.
 */
import { useCurrentList } from '../context/CurrentListContext.jsx';
import { useLists } from '../context/ListsContext.jsx';
import { useModals } from '../context/ModalContext.jsx';
import { cloneItem, createListItem, itemValues, valuesAreEqual } from '../model/listItem.js';
import * as model from '../model/wolfieList.js';

/** what the item modal is currently being used for */
export const ItemModalModes = {
    CREATE: 'create',
    EDIT: 'edit'
};

export function useListEditor() {
    const { list, change, undo, redo, canUndo, canRedo } = useCurrentList();
    const { closeList } = useLists();
    const { openItemModal, closeItemModal, askConfirm, inform } = useModals();

    /** the + button: the item is only created once the user presses Add */
    function requestAddItem() {
        openItemModal({
            mode: ItemModalModes.CREATE,
            index: -1,
            itemCount: 0,
            values: itemValues(createListItem())
        });
    }

    function requestEditItem(index) {
        openItemModal({
            mode: ItemModalModes.EDIT,
            index,
            itemCount: list.items.length,
            values: itemValues(list.items[index])
        });
    }

    /**
     * OK, Previous or Next in the item modal. Adds the item, records the edit,
     * or does nothing if nothing changed.
     *
     * @param {Object} request { mode, index, values, then } where then is
     * 'close', 'next' or 'previous'
     */
    function commitItemModal({ mode, index, values, then = 'close' }) {
        // the alert opens on top of the item modal, so what was typed is kept
        if (values.description === '') {
            inform({ title: 'A Description Is Required', message: 'Every item needs a description.' });
            return;
        }

        if (mode === ItemModalModes.CREATE) {
            const item = createListItem(values);
            change((current) => model.addItem(current, item));
            closeItemModal();
            return;
        }

        if (!valuesAreEqual(itemValues(list.items[index]), values)) {
            // keeps the item's id, so it is still the same item
            change((current) => model.replaceItemAt(current, index, { ...current.items[index], ...values }));
        }

        if (then === 'next') {
            requestEditItem(index + 1);
        } else if (then === 'previous') {
            requestEditItem(index - 1);
        } else {
            closeItemModal();
        }
    }

    /** the copy goes directly beneath the original */
    function duplicateItem(index) {
        const copy = cloneItem(list.items[index]);
        change((current) => model.addItem(current, copy, index + 1));
    }

    function requestDeleteItem(index) {
        const item = list.items[index];
        askConfirm({
            title: 'Delete This Item?',
            message: `The item "${item.description}" will be removed from this list. You can undo this afterwards.`,
            acceptLabel: 'Delete Item',
            onAccept: () => change((current) => model.removeItemAt(current, index))
        });
    }

    function moveItem(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        change((current) => model.moveItem(current, fromIndex, toIndex));
    }

    function renameList(requestedName) {
        const newName = model.normalizeListName(requestedName);
        if (newName === list.name) return;
        change((current) => model.withName(current, newName));
    }

    return {
        list,
        items: list?.items ?? [],
        canUndo,
        canRedo,
        undo,
        redo,
        closeList,
        requestAddItem,
        requestEditItem,
        commitItemModal,
        duplicateItem,
        requestDeleteItem,
        moveItem,
        renameList
    };
}
