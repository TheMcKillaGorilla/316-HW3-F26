/**
 * listController.js
 *
 * The C in MVC. Each function handles one kind of request: it reads what it
 * needs from req, asks the List model for data, and sends back a DTO.
 *
 * None of these catch errors. A failed validation or a bad id is thrown, and
 * Express 5 passes it along to errorHandler.
 */
import { List } from '../models/List.js';
import { toListJSON, toMetadata } from '../dto/listDTO.js';
import { HttpError } from '../middleware/errorHandlers.js';

/** GET /api/lists, the home screen: metadata only, never items */
export async function getAllMetadata(req, res) {
    // BUILDER: each call adds to the query and returns it, and nothing is sent
    // to the database until it is awaited. select() fetches just the completed
    // flags, which is all the counts need.
    const lists = await List.find()
        .sort('position')
        .select('name items.completed')
        .lean();
    res.json(lists.map(toMetadata));
}

/** GET /api/lists/:id, one whole list, for editing */
export async function getList(req, res) {
    const list = await findList(req.params.id);
    res.json(toListJSON(list));
}

/** DELETE /api/lists/:id */
export async function deleteList(req, res) {
    const deleted = await List.findByIdAndDelete(req.params.id);
    if (deleted === null) throw new HttpError(404, 'There is no list with that id.');
    res.status(204).end();
}

async function findList(id) {
    const list = await List.findById(id);
    if (list === null) throw new HttpError(404, 'There is no list with that id.');
    return list;
}
