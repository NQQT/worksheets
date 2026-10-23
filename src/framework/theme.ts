// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// FRAMEWORK THEME â€” the distribution's colour palette + theme-mode system.
//
// TWO LAYERS IN ONE MODULE:
//
// 1. PALETTE TOKENS (R5): every runtime colour is a CSS CUSTOM PROPERTY
//    declared in src/app.css (`:root` = light values,
//    `:root[data-theme='dark']` = dark values, and @media print forces the
//    paper tokens back to white/dark-ink). Components reference the tokens as
//    `var(--...)` strings inside their styledComponent maps, so switching the
//    theme is a single attribute flip on <html> â€” no re-render plumbing and no
//    new dependencies. The THEME object below stays as the canonical LIGHT
//    palette reference (app.css mirrors these values); hosting another subject
//    distribution = swapping the token values in app.css (maths uses indigo on
//    slate: primary #4f46e5, hairlines #e4e9f2, canvas #eef1f7 â€” see
//    distribution/maths/src/framework).
//
// 2. THEME-MODE SYSTEM (R5): the user picks System / Light / Dark.
//    - the CHOICE persists under a package-specific localStorage key;
//    - 'system' follows the OS `prefers-color-scheme: dark` media query and
//      keeps following it live (matchMedia 'change' subscription);
//    - every environment access (localStorage, matchMedia, document) is
//      guarded so absent/blocked APIs degrade gracefully to the defaults
//      (choice 'system', effective 'light') instead of throwing.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€ Light palette reference (mirrored by the :root tokens in app.css) â”€â”€â”€â”€â”€â”€â”€

export const THEME = {
    // Preview canvas / page field: pale teal with a subtle dot grid.
    canvasBg: '#e6f0ed',
    canvasDot: '#cfe3de',
    // Hairline borders (toolbar card, canvas frame, ghost buttons, pills).
    hairline: '#d9e6e2',
    // Soft fill for stepper/zoom group pills.
    pillBg: '#e6efec',
    // Idle rail button background (slightly tinted white).
    railIdleBg: '#f6fbf9',
    // Rail "coming soon" notice card background.
    noticeBg: '#f6fbf9',
    // Primary accent (Print button, active icon chips) + its PAIRED label
    // colour (white on teal-700 clears WCAG AA 5.5:1).
    primary: '#0f766e',
    onPrimary: '#ffffff',
    // Primary button glow.
    primaryShadow: 'rgba(15,118,110,0.35)',
    // Active grade-pill glow (softer than the button glow).
    primaryPillShadow: 'rgba(15,118,110,0.2)',
    // Active rail entry / grade pill fill + ring.
    activeFill: '#ccfbf1',
    activeRing: '#99f6e4',
    // Active text colours (rail entries are darker than pills).
    activeRailText: '#134e4a',
    activePillText: '#0f766e'
} as const;

// â”€â”€ Theme-mode system â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// What the user can pick in the Theme selector. 'system' = follow the OS.
export type ThemeChoice = 'system' | 'light' | 'dark';

// What is actually applied to the UI (the resolved result of a choice).
export type EffectiveTheme = 'light' | 'dark';

// Selectable choices, in display order (System first â€” it is the default).
export const THEME_CHOICES: readonly ThemeChoice[] = ['system', 'light', 'dark'];

// Fallback when nothing is stored, and for any stored value that is not one
// of the known choices (corrupt/foreign keys degrade to the safe default).
export const DEFAULT_THEME_CHOICE: ThemeChoice = 'system';

// Package-specific persistence key: this distribution shares the browser with
// the maths distribution (and anything else on GitHub Pages origins), so the
// key is namespaced and the two apps never overwrite each other's choice.
export const THEME_STORAGE_KEY = '@distribution/worksheets:theme';

// Narrow any unknown value (storage read, select event) to a valid choice.
export function normalizeThemeChoice(value: unknown): ThemeChoice {
    return THEME_CHOICES.includes(value as ThemeChoice)
        ? (value as ThemeChoice)
        : DEFAULT_THEME_CHOICE;
}

// The minimal storage surface the helpers need (also what tests inject).
type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;

// Resolve the default storage lazily and defensively: accessing
// window.localStorage THROWS in some privacy configurations â€” that must
// degrade to "no persistence", never crash the dashboard.
function defaultStorage(): ThemeStorage | null {
    try {
        return typeof window !== 'undefined' ? window.localStorage : null;
    } catch {
        return null;
    }
}

// Read the persisted choice. null = nothing stored (caller falls back to the
// default); an invalid stored value normalizes to the default choice.
export function readStoredThemeChoice(storage?: ThemeStorage | null): ThemeChoice | null {
    const store = storage === undefined ? defaultStorage() : storage;
    if (!store) return null;
    try {
        const raw = store.getItem(THEME_STORAGE_KEY);
        return raw === null ? null : normalizeThemeChoice(raw);
    } catch {
        // Storage read blocked â€” behave like "nothing stored".
        return null;
    }
}

// Persist the choice; failures (private mode, quota) are swallowed on purpose:
// the theme still applies for the session, it just does not survive reload.
export function writeStoredThemeChoice(choice: ThemeChoice, storage?: ThemeStorage | null): void {
    const store = storage === undefined ? defaultStorage() : storage;
    if (!store) return;
    try {
        store.setItem(THEME_STORAGE_KEY, choice);
    } catch {
        // Graceful: session-only theme.
    }
}

// Does the OS currently prefer a dark scheme? Guarded for environments without
// matchMedia (older engines, non-browser hosts) => treated as light.
export function systemPrefersDark(
    query?: (query: string) => { matches: boolean } | null
): boolean {
    const matcher =
        query ??
        (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? (q: string) => window.matchMedia(q)
            : undefined);
    if (!matcher) return false;
    try {
        return Boolean(matcher('(prefers-color-scheme: dark)')?.matches);
    } catch {
        return false;
    }
}

// Resolve a choice + OS preference into the theme actually applied. Manual
// Light/Dark choices IGNORE the OS preference entirely.
export function resolveEffectiveTheme(choice: ThemeChoice, prefersDark: boolean): EffectiveTheme {
    if (choice === 'system') return prefersDark ? 'dark' : 'light';
    return choice;
}

// Apply the effective theme to the document root (the attribute selector in
// app.css swaps every colour token). No document (SSR/tests without DOM) =>
// no-op.
export function applyThemeAttribute(effective: EffectiveTheme, root?: HTMLElement | null): void {
    const target = root ?? (typeof document !== 'undefined' ? document.documentElement : null);
    if (!target) return;
    target.setAttribute('data-theme', effective);
}
