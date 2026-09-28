/**
 * ModalLayer.jsx
 *
 * Renders whichever modals are open. The confirm and alert modals can open from
 * either screen, so App renders them once. The item modal edits the open list,
 * so it only exists inside CurrentListProvider (ItemModalHost).
 */
import { useLists } from '../../context/ListsContext.jsx';
import { useModals } from '../../context/ModalContext.jsx';
import AlertModal from './AlertModal.jsx';
import ConfirmModal from './ConfirmModal.jsx';
import ItemModal from './ItemModal.jsx';

/** the two modals that can be shown from either screen */
export default function ModalLayer() {
    return (
        <>
            <ConfirmModal />
            <AlertModal />
        </>
    );
}

/**
 * The key makes React build a fresh ItemModal when Next or Previous moves to
 * another item. Without it the form's state would keep the old item's values.
 */
export function ItemModalHost() {
    const { itemModal } = useModals();
    const { currentListId } = useLists();

    if (itemModal === null || currentListId === null) return null;

    return <ItemModal key={`${currentListId}:${itemModal.mode}:${itemModal.index}`} />;
}
