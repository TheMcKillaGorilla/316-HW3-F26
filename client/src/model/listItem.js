/**
 * listItem.js
 *
 * One row inside a Wolfie List. An item is a plain object:
 *
 *     { id, description, dateEntered, priority, targetDate, completed }
 *
 * Nothing here ever changes an item. To edit one, build a new object carrying
 * the same id, i.e. { ...item, ...newValues }.
 *
 * The client makes item ids itself, the moment an item is created, so undo and
 * React's keys can tell items apart before the server has ever seen them.
 */
import { IdGenerator } from '../common/IdGenerator.js';
import { DateUtil } from '../common/DateUtil.js';
import { Priority } from './priority.js';

/**
 * @param {Object} values any of the item's fields, the rest get defaults
 * @return {Object} a new item
 */
export function createListItem(values = {}) {
    return {
        id: IdGenerator.next('item'),
        description: '',
        dateEntered: DateUtil.today(),
        priority: Priority.LOW,
        targetDate: null,
        completed: false,
        ...values
    };
}

/** @return {Object} everything but the id, i.e. what the item modal edits */
export function itemValues(item) {
    const { id, ...values } = item;
    return values;
}

/** @return {boolean} true if the two sets of values match field for field */
export function valuesAreEqual(oldValues, newValues) {
    return Object.keys({ ...oldValues, ...newValues })
        .every((field) => oldValues[field] === newValues[field]);
}

/** @return {Object} a copy of the item with an id of its own */
export function cloneItem(item) {
    return { ...item, id: IdGenerator.next('item') };
}
