/**
 * List.js
 *
 * The M in MVC: what a list looks like in the database. One document per list,
 * with its items stored inside it as subdocuments, because an item never
 * exists outside its list and is always loaded with it.
 *
 * The schema is also where incoming data gets checked. A PUT that sends an item
 * with no description or a name 500 characters long fails validation when it
 * is saved, and the error handler turns that into a 400.
 *
 * Mongoose saves only the fields a schema names. Anything else in the data is
 * dropped without a word, so a field missing here is a field that never
 * reaches the database.
 */
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';

export const DEFAULT_LIST_NAME = 'Untitled List';
export const MAX_NAME_LENGTH = 60;

// dates are stored as YYYY-MM-DD strings, exactly as the client uses them
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Item ids are strings made by the client, not ObjectIds made by Mongo. The
 * client has to give a new item an id the moment it is created, before the
 * server has seen it, so that undo and React's keys can tell items apart.
 * _id: false stops Mongo adding a second id of its own.
 */
const itemSchema = new mongoose.Schema({
    id: { type: String, required: true },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    dateEntered: { type: String, required: true, match: ISO_DATE }
}, { _id: false });

const listSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: MAX_NAME_LENGTH },
    // where the list sits on the home screen, lowest first
    position: { type: Number, required: true },
    items: { type: [itemSchema], default: [] }
}, { timestamps: true });

export const List = mongoose.model('List', listSchema);

/** @return {string} a new item id, in the same form the client makes them */
export function newItemId() {
    return `item-${randomUUID()}`;
}

/**
 * @return {string} desiredName if no list has it, otherwise the first of
 * "desiredName 2", "desiredName 3" and so on that is free
 */
export function buildUnusedName(takenNames, desiredName) {
    const taken = new Set(takenNames);
    let name = desiredName;
    for (let counter = 2; taken.has(name); counter++) {
        name = `${desiredName} ${counter}`;
    }
    return name;
}
