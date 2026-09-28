/**
 * setup.js
 *
 * Runs before every test file: adds the DOM matchers (toBeInTheDocument,
 * toHaveValue, ...) and unmounts whatever each test rendered.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
    cleanup();
});
