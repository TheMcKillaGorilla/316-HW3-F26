/**
 * listDTO.js
 *
 * DATA TRANSFER OBJECTS: the exact shapes that cross the network, and nothing
 * else. A Mongoose document carries _id, __v, position, timestamps and a pile
 * of methods, none of which the client should see or depend on. These
 * functions decide what goes out, and fromRequest decides what comes in.
 *
 * There are two outgoing shapes, and the difference between them is the point
 * of this assignment:
 *
 *   metadata   { id, name, itemCount, completedCount }, all the home screen needs
 *   full list  { id, name, items }, sent only when a list is opened
 */

/** @return {Object} what the home screen needs to draw one card */
export function toMetadata(list) {
    return {
        id: String(list._id),
        name: list.name,
        itemCount: list.items.length,
        completedCount: list.items.filter((item) => item.completed).length
    };
}

/** @return {Object} the whole list, for editing */
export function toListJSON(list) {
    return {
        id: String(list._id),
        name: list.name,
        items: list.items.map(toItemJSON)
    };
}

/** one item, in both directions: toListJSON sends it, fromRequest accepts it */
export function toItemJSON({ id, description, dateEntered }) {
    return { id, description, dateEntered };
}

/**
 * Only the fields a client is allowed to change. Anything else in the body,
 * like a position or an _id, is ignored rather than written to the database.
 *
 * @return {Object|null} { name, items }, or null if either is missing
 */
export function fromRequest(body) {
    if (typeof body?.name !== 'string' || !Array.isArray(body?.items)) return null;
    return { name: body.name, items: body.items.map(toItemJSON) };
}
