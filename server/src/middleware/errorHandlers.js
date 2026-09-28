/**
 * errorHandlers.js
 *
 * The last two links in the middleware chain (see app.js).
 *
 * Every controller is free to simply throw. Express 5 catches the error, even
 * from an async function, skips every remaining ordinary middleware, and hands
 * it to the first middleware that takes four parameters. That is errorHandler,
 * which is the one place an error becomes an HTTP response.
 */

/** an error that already knows which status code it means */
export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

/** reached only when no route matched */
export function notFound(req, res, next) {
    next(new HttpError(404, `There is no ${req.method} ${req.originalUrl}`));
}

/**
 * Express recognizes an error handler by its four parameters, so next has to
 * stay in the list even though it is never called.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
    let status = error.status ?? 500;
    let message = error.message;

    if (error.name === 'ValidationError') {
        // Mongoose rejected the data, i.e. an item with no description
        status = 400;
    } else if (error.name === 'CastError') {
        // an :id that is not even shaped like a Mongo id cannot name a list
        status = 404;
        message = 'There is no list with that id.';
    }

    if (status >= 500) {
        // log the details here, and do not show them to the client
        console.error(error);
        message = 'Something went wrong on the server.';
    }

    res.status(status).json({ error: message });
}
