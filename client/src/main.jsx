/**
 * main.jsx
 *
 * The entry point. StrictMode runs every effect twice in development, to make
 * effects that are not safe to run twice fail early. It does nothing in a
 * production build.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './css/wolfie_lists.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
);
