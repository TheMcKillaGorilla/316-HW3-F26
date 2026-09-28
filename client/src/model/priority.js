/**
 * priority.js
 *
 * The three priorities a list item may have. The rest of the application uses
 * Priority.HIGH rather than the string "High", so the spelling lives in one place.
 */
export const Priority = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low'
};

/** most urgent first, which is the order the item modal offers them in */
export const PRIORITIES = [Priority.HIGH, Priority.MEDIUM, Priority.LOW];
