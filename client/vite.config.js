/**
 * vite.config.js
 *
 * Vite serves the React client on port 9000 and compiles JSX and Tailwind
 * (configured in src/css/wolfie_lists.css, there is no tailwind.config.js).
 *
 * The proxy is what connects the client to the server while developing. The
 * browser only ever talks to port 9000, and Vite forwards anything under /api
 * to the Express server. The client can therefore use plain relative URLs like
 * /api/lists, and the browser never makes a cross-origin request, so the
 * server needs no CORS setup.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// the end to end tests run their own server on another port and say so here
const API_URL = process.env.API_URL ?? 'http://localhost:4000';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 9000,
        strictPort: true,
        proxy: { '/api': API_URL }
    },
    preview: {
        port: 9000,
        strictPort: true,
        proxy: { '/api': API_URL }
    }
});
