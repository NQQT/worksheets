// ─────────────────────────────────────────────────────────────────────────────
// Theme selector — the R5 user-facing control for Light / Dark / System.
//
// A NATIVE <select> with a real <label> (accessible by construction: keyboard
// operable, announced as "Theme", options announced by value):
//   System (default) — follow the OS `prefers-color-scheme`, live.
//   Light / Dark     — manual override, wins over the OS preference.
//
// HOW THE THEME APPLIES: the resolved effective theme is written as a
// `data-theme` attribute on <html>; app.css carries the colour tokens per
// theme, so every styledComponent referencing `var(--...)` re-paints with a
// single attribute flip (no React re-render needed for the colours themselves,
// no new dependencies — package-local by design).
//
// PERSISTENCE: the CHOICE (not the effective theme) is stored under the
// package-specific key from theme.ts, so a reload restores the user's pick
// and the maths distribution's choice is untouched. Every environment access
// (localStorage / matchMedia) is guarded — blocked or absent APIs degrade to
// the safe defaults instead of crashing the dashboard.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { styledComponent, useStateHook } from '@presource/react';
import {
    applyThemeAttribute,
    normalizeThemeChoice,
    readStoredThemeChoice,
    resolveEffectiveTheme,
    systemPrefersDark,
    writeStoredThemeChoice,
    THEME_CHOICES,
    type ThemeChoice
} from './theme';

// Human labels for the option values (display order = THEME_CHOICES).
const THEME_LABELS: Record<ThemeChoice, string> = {
    system: 'System',
    light: 'Light',
    dark: 'Dark'
};

// ── Controller hook ──────────────────────────────────────────────────────────
// Owns the persisted choice, applies the effective theme on mount and on every
// change, and — while the choice is 'system' — keeps following the OS live.
export function useThemeController() {
    // Initial choice: persisted value (normalized; invalid/absent => default).
    const choice = useStateHook<ThemeChoice>(
        readStoredThemeChoice() ?? normalizeThemeChoice(undefined)
    );

    // Mount effect: apply the initial effective theme, then track the OS.
    // The useStateHook accessor is identity-stable for the component's life,
    // so this effect runs once; choice changes re-apply through setChoice,
    // and OS changes re-apply through the matchMedia subscription (only in
    // System mode — a manual override must not be dragged by the OS).
    useEffect(() => {
        const apply = () =>
            applyThemeAttribute(resolveEffectiveTheme(choice(), systemPrefersDark()));
        apply();

        // No matchMedia (or no window) => nothing live to follow; the applied
        // effective theme stands.
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => {
            if (choice() === 'system') apply();
        };
        // addEventListener is the modern API; guard for engines that only
        // ship the deprecated addListener (graceful: no live tracking).
        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', onChange);
            return () => mq.removeEventListener('change', onChange);
        }
        if (typeof (mq as any).addListener === 'function') {
            (mq as any).addListener(onChange);
            return () => (mq as any).removeListener(onChange);
        }
    }, [choice]);

    // User picks a choice: normalize, re-render the select, persist, apply.
    const setChoice = (next: unknown) => {
        const normalized = normalizeThemeChoice(next);
        choice(normalized);
        writeStoredThemeChoice(normalized);
        applyThemeAttribute(resolveEffectiveTheme(normalized, systemPrefersDark()));
    };

    return { choice: choice(), setChoice };
}

// ── Selector UI ──────────────────────────────────────────────────────────────

// Field wrapper: label text + select side by side, themed like the other
// header chrome (hairline pill on the surface colour). styledComponent's
// typed surface is plain HTMLAttributes (no `htmlFor`), so cast to the
// LabelHTMLAttributes surface (the PageInput pattern in worksheet-kit.tsx).
const ThemeField = styledComponent('label', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
    cursor: 'pointer'
}) as unknown as React.ForwardRefExoticComponent<
    React.LabelHTMLAttributes<HTMLLabelElement> & {
        theme?: any;
        [breakpoint: string]: any;
    }
>;

const ThemeLabelText = styledComponent('span', {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--faint)'
});

// Native select keeps full keyboard/screen-reader semantics; styledComponent's
// typed surface is HTMLAttributes (no value/onChange), so cast to the
// SelectHTMLAttributes surface (the PageInput pattern in worksheet-kit.tsx).
const ThemeSelect = styledComponent('select', {
    height: '32px',
    padding: '0 10px',
    borderRadius: '999px',
    border: '1px solid var(--hairline)',
    background: 'var(--surface)',
    color: 'var(--control-fg)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none'
}) as unknown as React.ForwardRefExoticComponent<
    React.SelectHTMLAttributes<HTMLSelectElement> & {
        theme?: any;
        [breakpoint: string]: any;
    }
>;

export function ThemeSelector() {
    const { choice, setChoice } = useThemeController();
    return (
        <ThemeField htmlFor="english-theme-select">
            <ThemeLabelText>Theme</ThemeLabelText>
            <ThemeSelect
                id="english-theme-select"
                data-testid="theme-select"
                value={choice}
                onChange={(e) => setChoice((e.target as HTMLSelectElement).value)}
            >
                {THEME_CHOICES.map((value) => (
                    <option key={value} value={value}>
                        {THEME_LABELS[value]}
                    </option>
                ))}
            </ThemeSelect>
        </ThemeField>
    );
}
