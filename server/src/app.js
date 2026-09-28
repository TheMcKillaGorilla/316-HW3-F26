/**
 * app.js
 *
 * Builds the Express application without starting it. server.js starts it for
 * real, and the tests hand it straight to supertest, which is why building and
 * listening are kept apart.
 *
 * CHAIN OF RESPONSIBILITY
 * -----------------------
 * Every request travels down the app.use() calls below, in order. Each link
 * either answers the request or calls next() to hand it on:
 *
 *   requestLogger   notes the request, always passes it on
 *   express.json()  turns a JSON body into req.body, or passes on an error
 *   /api/lists      answers any request the list router has a route for
 *   notFound        reached only if nothing above answered
 *   errorHandler    reached whenever anything above passed on an error
 *
 * The order is the behavior. Put notFound first and every request is a 404.
 */
import express from 'express';
import listRoutes from './routes/listRoutes.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFound } from './middleware/errorHandlers.js';

export function createApp({ logRequests = true } = {}) {
    const app = express();

    if (logRequests) app.use(requestLogger);
    app.use(express.json());
    app.use('/api/lists', listRoutes);
    app.use(notFound);
    app.use(errorHandler);

    return app;
}
