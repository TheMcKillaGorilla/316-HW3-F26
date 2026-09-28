/**
 * metadataCache.js
 *
 * Local storage now holds only a copy of the home screen's metadata, never a
 * list's items. The server is where lists live. This copy exists so the home
 * screen can be drawn the instant the page opens, before the server answers,
 * and so the cards are still there to look at if it never does.
 *
 * Because it is only a cache, a failure here is never worth bothering the user
 * about: at worst the home screen waits a moment for the server.
 */
export const STORAGE_KEY = 'cse316.wolfie-lists.hw3.v1';

/** @return {Object[]|null} the cached metadata, or null if there is none */
export function loadCachedMetadata() {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
        return Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

export function saveCachedMetadata(metadata) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
    } catch {
        // storage is full or switched off, and the server still has everything
    }
}
