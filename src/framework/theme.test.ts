// Unit tests for the R5 theme-mode helpers in framework/theme.ts.
//
// These pin the pure decision logic (choice normalization, persistence,
// effective-theme resolution, attribute application) with injected fakes, so
// the System/Light/Dark behaviour is verified independently of React — the
// composed behaviour (selector UI, live OS updates) is pinned in
// components/EnglishDashboard.test.tsx.

import { describe, it, expect } from 'vitest';
import {
    applyThemeAttribute,
    normalizeThemeChoice,
    readStoredThemeChoice,
    resolveEffectiveTheme,
    systemPrefersDark,
    writeStoredThemeChoice,
    DEFAULT_THEME_CHOICE,
    THEME_CHOICES,
    THEME_STORAGE_KEY
} from './theme';

// Minimal in-memory Storage fake (the helpers only use getItem/setItem).
function fakeStorage(initial: Record<string, string> = {}) {
    const data = new Map(Object.entries(initial));
    return {
        getItem: (key: string) => data.get(key) ?? null,
        setItem: (key: string, value: string) => {
            data.set(key, value);
        },
        dump: () => Object.fromEntries(data)
    };
}

describe('normalizeThemeChoice', () => {
    it('accepts every advertised choice unchanged', () => {
        for (const choice of THEME_CHOICES) {
            expect(normalizeThemeChoice(choice)).toBe(choice);
        }
    });

    it('maps every unknown value to the default (system)', () => {
        for (const bad of ['neon', '', 'SYSTEM', 'auto', null, undefined, 0, {}]) {
            expect(normalizeThemeChoice(bad)).toBe(DEFAULT_THEME_CHOICE);
        }
    });
});

describe('resolveEffectiveTheme', () => {
    it('System follows the OS preference', () => {
        expect(resolveEffectiveTheme('system', true)).toBe('dark');
        expect(resolveEffectiveTheme('system', false)).toBe('light');
    });

    it('manual Light/Dark ignore the OS preference entirely', () => {
        expect(resolveEffectiveTheme('light', true)).toBe('light');
        expect(resolveEffectiveTheme('light', false)).toBe('light');
        expect(resolveEffectiveTheme('dark', true)).toBe('dark');
        expect(resolveEffectiveTheme('dark', false)).toBe('dark');
    });
});

describe('persistence (readStoredThemeChoice / writeStoredThemeChoice)', () => {
    it('read: null when the package key is absent', () => {
        expect(readStoredThemeChoice(fakeStorage())).toBeNull();
    });

    it('read: returns the stored valid choice', () => {
        expect(readStoredThemeChoice(fakeStorage({ [THEME_STORAGE_KEY]: 'dark' }))).toBe('dark');
        expect(readStoredThemeChoice(fakeStorage({ [THEME_STORAGE_KEY]: 'light' }))).toBe('light');
    });

    it('read: an invalid stored value normalizes to the default choice', () => {
        expect(readStoredThemeChoice(fakeStorage({ [THEME_STORAGE_KEY]: 'neon' }))).toBe('system');
    });

    it('read: a throwing storage degrades to null (no persistence)', () => {
        const hostile = {
            getItem() {
                throw new Error('blocked');
            },
            setItem() {
                throw new Error('blocked');
            }
        };
        expect(readStoredThemeChoice(hostile)).toBeNull();
    });

    it('write: stores under the package-specific key only', () => {
        const store = fakeStorage({ 'maths-worksheets.theme': 'dark' });
        writeStoredThemeChoice('light', store);
        // Exact key + exact value; the foreign (maths) key is untouched.
        expect(store.dump()).toEqual({
            'maths-worksheets.theme': 'dark',
            [THEME_STORAGE_KEY]: 'light'
        });
    });

    it('write: a throwing storage never crashes the caller', () => {
        const hostile = {
            getItem: () => null,
            setItem() {
                throw new Error('quota');
            }
        };
        expect(() => writeStoredThemeChoice('dark', hostile)).not.toThrow();
    });
});

describe('systemPrefersDark', () => {
    it('true / false follow the media query result', () => {
        expect(systemPrefersDark(() => ({ matches: true }))).toBe(true);
        expect(systemPrefersDark(() => ({ matches: false }))).toBe(false);
    });

    it('a missing or throwing matcher degrades to light (false)', () => {
        expect(systemPrefersDark(() => null)).toBe(false);
        expect(
            systemPrefersDark(() => {
                throw new Error('no matchMedia');
            })
        ).toBe(false);
    });
});

describe('applyThemeAttribute', () => {
    it('writes data-theme on the given root element', () => {
        const el = document.createElement('div');
        applyThemeAttribute('dark', el);
        expect(el.getAttribute('data-theme')).toBe('dark');
        applyThemeAttribute('light', el);
        expect(el.getAttribute('data-theme')).toBe('light');
    });

    it('defaults to <html> and tolerates a null root (no DOM)', () => {
        applyThemeAttribute('dark');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        expect(() => applyThemeAttribute('light', null)).not.toThrow();
    });
});
