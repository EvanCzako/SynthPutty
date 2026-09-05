/*
 * Theme selection.
 *
 * A theme is nothing but a block of seed colours in
 * `styles/variables.module.css`, applied as an attribute on <html>, so adding
 * one means editing that stylesheet and this list -- no component changes.
 *
 * The palettes are shared with DoughLoops2 and ChordFinder so the three apps
 * read as one family.
 */

export const THEMES = [
    { id: 'midnight', label: 'Midnight', tone: 'dark' },
    { id: 'plum', label: 'Plum', tone: 'dark' },
    { id: 'neon', label: 'Neon', tone: 'dark' },
    { id: 'ocean', label: 'Ocean', tone: 'dark' },
    { id: 'forest', label: 'Forest', tone: 'dark' },
    { id: 'terminal', label: 'Terminal', tone: 'dark' },
    { id: 'bakery', label: 'Bakery', tone: 'dark' },
    { id: 'sunset', label: 'Sunset', tone: 'dark' },
    { id: 'rose', label: 'Rose', tone: 'dark' },
    { id: 'mono', label: 'Mono', tone: 'dark' },
    { id: 'daylight', label: 'Daylight', tone: 'light' },
    { id: 'arctic', label: 'Arctic', tone: 'light' },
    { id: 'candy', label: 'Candy', tone: 'light' },
    { id: 'sand', label: 'Sand', tone: 'light' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

/* The default is the bare :root values, so selecting it writes no attribute at
 * all rather than an attribute that means "the default". */
export const DEFAULT_THEME: ThemeId = 'midnight';

/* Namespaced because the sibling apps share an origin when served from one
 * GitHub Pages account. */
const THEME_KEY = 'synthputty.theme';

/* Reading storage is the trust boundary: anything not in the current list is
 * discarded rather than written to the DOM. */
function read<T extends string>(key: string, allowed: readonly { id: T }[], fallback: T): T {
    try {
        const stored = localStorage.getItem(key);
        return allowed.some((option) => option.id === stored) ? (stored as T) : fallback;
    } catch {
        /* Private browsing throws on access, not just on write. */
        return fallback;
    }
}

function write(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch {
        /* A display preference is not worth surfacing a failure for. */
    }
}

export function readStoredTheme(): ThemeId {
    return read(THEME_KEY, THEMES, DEFAULT_THEME);
}

export function applyTheme(theme: ThemeId): void {
    const root = document.documentElement;
    if (theme === DEFAULT_THEME) root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    write(THEME_KEY, theme);
}

/* Used by the error boundary's recovery button: a corrupt or unreadable
 * preference must not be able to re-break the app on every reload. */
export function clearStoredPreferences(): void {
    try {
        localStorage.removeItem(THEME_KEY);
    } catch {
        /* Nothing to clear if storage is unavailable. */
    }
}
