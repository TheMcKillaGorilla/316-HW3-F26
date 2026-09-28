/**
 * middleware.test.js
 *
 * The parts of the chain that do not need a database: logging, unknown routes,
 * malformed JSON, and what the error handler turns each kind of error into.
 */
import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { errorHandler, HttpError } from '../../src/middleware/errorHandlers.js';

describe('the request logger', () => {
    it('logs the method, url and status once the response is finished', async () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});

        await request(createApp()).get('/api/nowhere');

        expect(log).toHaveBeenCalledWith(expect.stringMatching(/^GET \/api\/nowhere 404 \d+ms$/));
    });

    it('can be switched off', async () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});

        await request(createApp({ logRequests: false })).get('/api/nowhere');

        expect(log).not.toHaveBeenCalled();
    });
});

describe('the end of the chain', () => {
    const app = createApp({ logRequests: false });

    it('answers an unknown route with a 404 and a JSON error', async () => {
        const response = await request(app).get('/api/nowhere');

        expect(response.status).toBe(404);
        expect(response.body.error).toMatch(/GET \/api\/nowhere/);
    });

    it('answers malformed JSON with a 400', async () => {
        const response = await request(app)
            .put('/api/lists/66f000000000000000000000')
            .set('Content-Type', 'application/json')
            .send('{ not json');

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
    });
});

describe('the error handler', () => {
    /** a tiny app whose one route throws whatever it is given */
    function appThatThrows(error) {
        const app = express();
        app.get('/', () => { throw error; });
        app.use(errorHandler);
        return app;
    }

    it('uses the status an HttpError carries', async () => {
        const response = await request(appThatThrows(new HttpError(409, 'Taken'))).get('/');
        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: 'Taken' });
    });

    it('hides the details of an unexpected error', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});

        const response = await request(appThatThrows(new Error('secret stack details'))).get('/');

        expect(response.status).toBe(500);
        expect(response.body.error).not.toMatch(/secret/);
    });

    it('logs an unexpected error on the server', async () => {
        const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
        await request(appThatThrows(new Error('boom'))).get('/');
        expect(logged).toHaveBeenCalled();
    });

    it('catches errors thrown by async handlers too, which Express 5 passes on', async () => {
        const app = express();
        app.get('/', async () => { throw new HttpError(418, 'Short and stout'); });
        app.use(errorHandler);

        expect((await request(app).get('/')).status).toBe(418);
    });
});
