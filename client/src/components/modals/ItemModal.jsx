/**
 * ItemModal.jsx
 *
 * Viewing and editing one item. It changes nothing itself: it hands the values
 * typed to commitItemModal, which decides whether that is an add, an edit, or
 * nothing because nothing changed. Previous and Next commit and then move.
 *
 * The form is controlled (every keystroke goes through state), unlike the list
 * name field, because nothing is saved until OK and the values are read as a set.
 */
import { useRef, useState } from 'react';
import { ModalNames, useModals } from '../../context/ModalContext.jsx';
import { useListEditor } from '../../hooks/useListEditor.js';
import { DateUtil } from '../../common/DateUtil.js';
import { PRIORITIES } from '../../model/priority.js';
import Modal, { ModalButton, ModalFooter, ModalHeading } from './Modal.jsx';

export default function ItemModal() {
    const { itemModal, closeItemModal } = useModals();
    const { commitItemModal } = useListEditor();

    const descriptionRef = useRef(null);

    // one piece of state for the whole form, so that Previous and Next can
    // replace every field in a single update
    const [values, setValues] = useState(() => ({
        description: itemModal.values.description ?? '',
        dateEntered: itemModal.values.dateEntered ?? DateUtil.today(),
        priority: itemModal.values.priority,
        targetDate: itemModal.values.targetDate,
        completed: itemModal.values.completed === true
    }));

    const isEditing = itemModal.mode === 'edit';

    function setField(field, value) {
        setValues((previous) => ({ ...previous, [field]: value }));
    }

    /**
     * Validates on the way out and hands the values over.
     *
     * @param {string} then 'close', 'next' or 'previous'
     */
    function commit(then) {
        commitItemModal({
            mode: itemModal.mode,
            index: itemModal.index,
            values: {
                ...values,
                description: values.description.trim(),
                dateEntered: values.dateEntered || DateUtil.today(),
                targetDate: values.targetDate || null
            },
            then
        });
    }

    /**
     * Pressing Enter anywhere in the form is the same as pressing OK.
     * preventDefault also stops the browser from submitting the form itself.
     */
    function handleFormKeyDown(event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        commit('close');
    }

    // Previous is meaningless on the first item, Next on the last, and both are
    // meaningless while describing an item that does not exist yet
    const canGoPrevious = isEditing && itemModal.index > 0;
    const canGoNext = isEditing && itemModal.index < itemModal.itemCount - 1;

    return (
        <Modal
            name={ModalNames.ITEM}
            id="item-modal"
            labelledBy="item-modal-heading"
            // Escape means cancel, exactly like the Cancel button
            onCancel={closeItemModal}
            // the description is the field the user actually came here to type
            // in, so that is where focus belongs, not on whatever control happens
            // to come first
            initialFocusRef={descriptionRef}>

            <ModalHeading id="item-modal-heading">
                {isEditing ? `Item ${itemModal.index + 1} of ${itemModal.itemCount}` : 'New Item'}
            </ModalHeading>

            <form id="item-modal-form" autoComplete="off"
                  onKeyDown={handleFormKeyDown}
                  onSubmit={(event) => event.preventDefault()}
                  className="flex flex-col gap-4 p-5">

                <div className={FIELD}>
                    <label className={FIELD_LABEL} htmlFor="item-description-input">Description</label>
                    <input
                        id="item-description-input"
                        ref={descriptionRef}
                        type="text"
                        maxLength={200}
                        placeholder="What needs to be done?"
                        value={values.description}
                        onChange={(event) => setField('description', event.target.value)}
                        className={`${CONTROL} w-full`} />
                </div>

                <div className={FIELD_ROW}>
                    <div className={FIELD}>
                        <label className={FIELD_LABEL} htmlFor="item-date-entered-input">Date Entered</label>
                        <input
                            id="item-date-entered-input"
                            type="date"
                            value={values.dateEntered ?? ''}
                            onChange={(event) => setField('dateEntered', event.target.value)}
                            className={`${CONTROL} w-full min-w-36`} />
                    </div>

                    <div className={FIELD}>
                        <label className={FIELD_LABEL} htmlFor="item-priority-select">Priority</label>
                        {/* the options come from priority.js, so adding a priority is one line there */}
                        <select
                            id="item-priority-select"
                            value={values.priority}
                            onChange={(event) => setField('priority', event.target.value)}
                            className={`${CONTROL} w-full`}>
                            {PRIORITIES.map((priority) => (
                                <option key={priority} value={priority}>{priority}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={FIELD}>
                    <span className={FIELD_LABEL}>Target Date</span>
                    {/* a target date says when an item should be done, the checkbox whether it is */}
                    <div className="flex items-center gap-3">
                        <input
                            id="item-target-date-input"
                            type="date"
                            aria-label="The date this item is meant to be finished by"
                            value={values.targetDate ?? ''}
                            onChange={(event) => setField('targetDate', event.target.value)}
                            className={`${CONTROL} min-w-36 flex-none`} />
                        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap">
                            <input
                                id="item-completed-checkbox"
                                type="checkbox"
                                checked={values.completed}
                                onChange={(event) => setField('completed', event.target.checked)}
                                className="h-[1.0625rem] w-[1.0625rem] cursor-pointer accent-sbu-red" />
                            <span>Completed</span>
                        </label>
                    </div>
                </div>
            </form>

            <ModalFooter>
                <div className="flex gap-2">
                    <ModalButton id="item-previous-button" variant="quiet"
                                 disabled={!canGoPrevious}
                                 title="Save and move to the previous item"
                                 onClick={() => commit('previous')}>
                        ◀&nbsp;Previous
                    </ModalButton>
                    <ModalButton id="item-next-button" variant="quiet"
                                 disabled={!canGoNext}
                                 title="Save and move to the next item"
                                 onClick={() => commit('next')}>
                        Next&nbsp;▶
                    </ModalButton>
                </div>
                <div className="ml-auto flex gap-2">
                    <ModalButton id="item-cancel-button" variant="secondary"
                                 onClick={closeItemModal}>
                        Cancel
                    </ModalButton>
                    <ModalButton id="item-ok-button" variant="primary"
                                 onClick={() => commit('close')}>
                        {isEditing ? 'OK' : 'Add'}
                    </ModalButton>
                </div>
            </ModalFooter>
        </Modal>
    );
}

const FIELD = 'flex min-w-0 flex-1 flex-col gap-[0.3125rem]';

const FIELD_LABEL =
    'text-xs font-bold tracking-[0.08em] uppercase text-grey-700';

const FIELD_ROW =
    'flex items-end gap-4 max-[46rem]:flex-col max-[46rem]:items-stretch';

/** the look of every input and select in this modal; each sets its own width */
const CONTROL =
    'rounded-control border border-grey-300 bg-sbu-white px-2.5 py-2 text-base '
    + 'text-grey-900 placeholder:text-grey-500 '
    + 'focus:border-sbu-red focus:outline-2 focus:outline-offset-[0.0625rem] focus:outline-sbu-red '
    + 'disabled:cursor-not-allowed disabled:bg-grey-100 disabled:text-grey-500';
