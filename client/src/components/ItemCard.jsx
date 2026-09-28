/**
 * ItemCard.jsx
 *
 * One card inside an open list: description, date entered, priority, target
 * date and a tick when completed, plus duplicate and delete. A colored stripe
 * down the left edge shows the priority, and a completed item is struck through.
 *
 * The card is draggable and carries its index, which ListView's drag and drop
 * code works from. The tick is aria-hidden because the card's aria-label
 * already tells a screen reader the item is completed.
 */
import { DateUtil } from '../common/DateUtil.js';
import { Priority } from '../model/priority.js';
import IconButton, { DELETE_GLYPH, DUPLICATE_GLYPH } from './IconButton.jsx';

/** the stripe down the left edge of the card */
const ACCENT_BY_PRIORITY = {
    [Priority.HIGH]: 'border-l-priority-high',
    [Priority.MEDIUM]: 'border-l-priority-medium',
    [Priority.LOW]: 'border-l-priority-low'
};

/** the pill in the priority column */
const PILL_BY_PRIORITY = {
    [Priority.HIGH]: 'bg-priority-high',
    [Priority.MEDIUM]: 'bg-priority-medium',
    [Priority.LOW]: 'bg-priority-low'
};

/** what the completed column shows for an item that is done. A character rather
 *  than markup, exactly like the em dash DateUtil falls back to */
export const COMPLETED_MARK = '✓';

export default function ItemCard({
    item,
    index,
    isDragging,
    dropIndicator,
    onEdit,
    onDuplicate,
    onDelete,
    onDragStart,
    onDragEnd
}) {
    const completed = item.completed;

    function handleKeyDown(event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onEdit();
    }

    // dropIndicator is 'before', 'after' or null. The two classes it can produce
    // are in the stylesheet because each is two box-shadows in one declaration,
    // which is past what a shadow utility can compose.
    const indicatorClass = dropIndicator === 'before' ? 'drop-before'
        : dropIndicator === 'after' ? 'drop-after'
        : 'shadow-card';

    return (
        <li
            className={`item-card item-grid mt-2.5 items-center gap-3 rounded-card
                        border-l-[0.3125rem] bg-sbu-white px-[0.875rem] py-2.5
                        transition-[box-shadow,transform] duration-150 first:mt-0
                        focus-visible:outline-[0.1875rem] focus-visible:outline-offset-2
                        focus-visible:outline-sbu-red
                        ${ACCENT_BY_PRIORITY[item.priority] ?? 'border-l-grey-300'}
                        ${indicatorClass}
                        ${completed ? 'item-completed bg-grey-050' : ''}
                        ${isDragging ? 'cursor-grabbing opacity-40' : 'cursor-pointer hover:-translate-y-px hover:shadow-card-hover'}`}
            data-item-id={item.id}
            data-index={index}
            role="button"
            tabIndex={0}
            draggable
            aria-label={completed
                ? `Edit the item ${item.description}, completed`
                : `Edit the item ${item.description}`}
            onClick={onEdit}
            onKeyDown={handleKeyDown}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}>

            <span className="area-handle cursor-grab text-center text-[1.125rem] leading-none text-grey-300"
                  aria-hidden="true">
                ⠿
            </span>

            <span className={`area-description item-description item-description-cell min-w-0
                              truncate font-semibold
                              ${completed ? 'text-grey-500 line-through' : ''}`}>
                {item.description}
            </span>

            <span className="area-entered item-date text-center text-[0.875rem] tabular-nums text-grey-700">
                {DateUtil.format(item.dateEntered)}
            </span>

            <span className="area-priority text-center">
                <span className={`priority-pill inline-block min-w-[4.5rem] rounded-full px-2 py-0.5
                                  text-center text-xs font-bold tracking-[0.04em] text-sbu-white
                                  ${PILL_BY_PRIORITY[item.priority] ?? 'bg-grey-500'}`}>
                    {item.priority}
                </span>
            </span>

            <span className="area-target item-date text-center text-[0.875rem] tabular-nums text-grey-700">
                {DateUtil.format(item.targetDate)}
            </span>

            <span className="area-completed text-center text-base leading-none text-completed-mark"
                  aria-hidden="true">
                {completed ? COMPLETED_MARK : ''}
            </span>

            <span className="area-actions flex justify-end gap-1">
                <IconButton
                    action="duplicate-item"
                    label={`Duplicate the item ${item.description}`}
                    glyph={DUPLICATE_GLYPH}
                    onClick={onDuplicate} />
                <IconButton
                    action="delete-item"
                    label={`Delete the item ${item.description}`}
                    glyph={DELETE_GLYPH}
                    danger
                    onClick={onDelete} />
            </span>
        </li>
    );
}
