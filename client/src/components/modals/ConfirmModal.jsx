/**
 * ConfirmModal.jsx
 *
 * The warning modal. Nothing is deleted without it. The caller passes the
 * function to run on accept, and a closure carries whatever it needs.
 */
import { useRef } from 'react';
import { ModalNames, useModals } from '../../context/ModalContext.jsx';
import Modal, { ModalButton, ModalFooter, ModalHeading, ModalMessage } from './Modal.jsx';

export default function ConfirmModal() {
    const { confirmModal, closeConfirmModal } = useModals();
    const declineRef = useRef(null);

    if (confirmModal === null) return null;

    function handleAccept() {
        // closed first, so anything the action reports opens on a clear screen
        closeConfirmModal();
        confirmModal.onAccept?.();
    }

    return (
        <Modal
            name={ModalNames.CONFIRM}
            id="confirm-modal"
            role="alertdialog"
            labelledBy="confirm-modal-heading"
            describedBy="confirm-modal-message"
            small
            // Escape means no, exactly like the Cancel button
            onCancel={closeConfirmModal}
            // focus starts on Cancel, so pressing Enter cannot delete by accident
            initialFocusRef={declineRef}>

            <ModalHeading id="confirm-modal-heading" titleId="confirm-modal-title" icon="⚠" warning>
                {confirmModal.title}
            </ModalHeading>

            <ModalMessage id="confirm-modal-message">{confirmModal.message}</ModalMessage>

            <ModalFooter>
                <div className="ml-auto flex gap-2">
                    <ModalButton id="confirm-decline-button" ref={declineRef}
                                 variant="secondary" onClick={closeConfirmModal}>
                        Cancel
                    </ModalButton>
                    <ModalButton id="confirm-accept-button" variant="danger" onClick={handleAccept}>
                        {confirmModal.acceptLabel}
                    </ModalButton>
                </div>
            </ModalFooter>
        </Modal>
    );
}
