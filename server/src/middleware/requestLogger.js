/**
 * requestLogger.js
 *
 * Prints one line per request, i.e. "PUT /api/lists/66f0... 200 12ms".
 *
 * Two patterns in six lines. As middleware it is a link in the chain: it does
 * its part and calls next() to pass the request along. And it cannot know the
 * status code yet, because no response exists at that moment, so it subscribes
 * to the response's 'finish' event instead (res is a Node EventEmitter). That
 * is the Observer pattern.
 */
export function requestLogger(req, res, next) {
    const start = performance.now();
    res.on('finish', () => {
        const ms = Math.round(performance.now() - start);
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    });
    next();
}
