// THEME-CONTRAST REGRESSION (T6) — the diagram-fill and primary-label pairs.
//
// An independent review found: (a) the figure renderers painted pale
// hardcoded fills (#f2f2f2) behind tokenized pale ink — unreadable in the
// dark preview (BondDiagram values, MoneyDiagram values, CompassDiagram
// letters, DivisionDiagram dots); (b) the Print button paired the bright
// dark-theme turquoise with a hardcoded WHITE label (~1.9:1).
//
// The fix: one shared --paper-diagram fill token (pale grey on the light
// paper, deep slate on the dark sheet, print-forced back to the legacy
// #f2f2f2) and one --on-primary label token paired with --primary per theme.
//
// jsdom resolves no CSS, so this suite pins the guarantee at the app.css
// SOURCE: the declared hex values are extracted and run through the exact
// WCAG 2.x relative-luminance contrast formula. Component-level emission is
// pinned too (no hardcoded fill survives, the button label rides the token).

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    BondDiagram,
    CompassDiagram,
    DashboardContextProvider,
    DataDiagram,
    DivisionDiagram,
    MATH_FRAMEWORK,
    MoneyDiagram,
    RectangleDiagram,
    ShapeFigures,
    ShapeTransformationDiagram,
    useDashboardStore
} from './index';
import { AdditionWorksheet } from '../plugins/math/AdditionWorksheet';
import type { DashboardStoreStructure } from './store';
import type { ShapeTransformationFigure } from './types';

afterEach(cleanup);

// ── WCAG 2.x relative luminance + contrast ratio (exact formula) ─────────────
function luminance(hex: string): number {
    const value = hex.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(value)) throw new Error(`not a 6-digit hex: ${hex}`);
    const channels = [0, 2, 4]
        .map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
        .map((channel) => (channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)));
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background: string): number {
    const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (lighter + 0.05) / (darker + 0.05);
}

// The stylesheet source (cwd = this package root under vitest, the same
// pattern PrintableSheet.test.tsx uses for the print-block pin).
const css = readFileSync(join(process.cwd(), 'src', 'app.css'), 'utf8');

// All 6-digit hex values declared for a token, in FILE ORDER: the light
// :root palette first, the dark palette second, then @media print. (The
// regex pins the token name against the following colon, so
// '--primary-shadow:' can never match a '--primary:' scan.)
function tokenHexValues(token: string): string[] {
    return [...css.matchAll(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})\\s*;`, 'g'))].map((m) => m[1]);
}

describe('the diagram fill token --paper-diagram (T6 pair: fill ↔ paper ink)', () => {
    it('declares exactly three values: light screen, dark screen, print', () => {
        expect(tokenHexValues('--paper-diagram')).toEqual(['#f2f2f2', '#202d47', '#f2f2f2']);
    });

    it('LIGHT: the pale fill contrasts with the light-paper ink (AA 4.5:1)', () => {
        const fills = tokenHexValues('--paper-diagram');
        const inks = tokenHexValues('--paper-ink');
        // Exact ratio of #1a1a1a on #f2f2f2 ≈ 15.55:1…
        expect(contrast(inks[0], fills[0])).toBeCloseTo(15.55, 1);
        // …and the requirement itself: at least WCAG AA.
        expect(contrast(inks[0], fills[0])).toBeGreaterThanOrEqual(4.5);
    });

    it('DARK: the deep slate fill contrasts with the dark-paper ink (the 1.05:1 regression)', () => {
        const fills = tokenHexValues('--paper-diagram');
        const inks = tokenHexValues('--paper-ink');
        // The pre-fix pair (#f2f2f2 fill, #e8edf6 ink) was ≈ 1.05:1; the
        // dark fill now clears AA by a wide margin (#202d47 vs #e8edf6).
        expect(contrast(inks[1], fills[1])).toBeCloseTo(11.7, 1);
        expect(contrast(inks[1], fills[1])).toBeGreaterThanOrEqual(4.5);
    });

    it('PRINT: the fill is the legacy pale grey on white paper (print rendering preserved)', () => {
        const fills = tokenHexValues('--paper-diagram');
        const inks = tokenHexValues('--paper-ink');
        expect(fills[2]).toBe('#f2f2f2');
        expect(inks[2]).toBe('#1a1a1a');
        expect(contrast(inks[2], fills[2])).toBeCloseTo(15.55, 1);
    });
});

describe('the primary label token --on-primary (T6 pair: primary fill ↔ button label)', () => {
    it('declares exactly two values: light and dark, paired with --primary', () => {
        expect(tokenHexValues('--on-primary')).toEqual(['#ffffff', '#04211d']);
        // The paired primary fills (light/dark; the print block never
        // re-declares them — the print tree paints no chrome).
        expect(tokenHexValues('--primary')).toEqual(['#0f766e', '#2dd4bf']);
    });

    it('LIGHT: white on the deep teal clears WCAG AA (the Print button label)', () => {
        const primaries = tokenHexValues('--primary');
        const onPrimaries = tokenHexValues('--on-primary');
        expect(contrast(onPrimaries[0], primaries[0])).toBeCloseTo(5.47, 1);
        expect(contrast(onPrimaries[0], primaries[0])).toBeGreaterThanOrEqual(4.5);
    });

    it('DARK: the deep teal-black label on the bright turquoise clears WCAG AA (was ~1.86:1 with white)', () => {
        const primaries = tokenHexValues('--primary');
        const onPrimaries = tokenHexValues('--on-primary');
        // The pre-fix pair (#2dd4bf bg, #ffffff label) measured ≈ 1.86:1.
        expect(contrast('#ffffff', primaries[1])).toBeCloseTo(1.86, 1);
        expect(contrast(onPrimaries[1], primaries[1])).toBeCloseTo(9.09, 1);
        expect(contrast(onPrimaries[1], primaries[1])).toBeGreaterThanOrEqual(4.5);
    });
});

// ── Component emission: no hardcoded pale fill survives any renderer ─────────
// Minimal figures exercising every fill branch of the eight diagram
// renderers; each must emit the shared token and NO hardcoded pale hex.
const HARDCODED_PALE_FILLS = ['#f2f2f2', '#e5e7eb'];

function renderedSvgMarkup(container: HTMLElement): string {
    return Array.from(container.querySelectorAll('svg')).map((svg) => svg.outerHTML).join('\n');
}

describe('every diagram renderer emits the shared fill token (no hardcoded pale hex)', () => {
    it('BondDiagram — shaded circles carry the token', () => {
        const { container } = render(<BondDiagram figure={Object.freeze({ whole: 10, left: 4, right: null })} />);
        const svg = renderedSvgMarkup(container);
        expect(svg).toContain('var(--paper-diagram)');
        for (const hex of HARDCODED_PALE_FILLS) expect(svg).not.toContain(hex);
    });

    it('MoneyDiagram — note + coin fills carry the token', () => {
        const { container } = render(<MoneyDiagram figure={Object.freeze({ given: [100, 10] })} />);
        const svg = renderedSvgMarkup(container);
        expect(svg).toContain('var(--paper-diagram)');
        for (const hex of HARDCODED_PALE_FILLS) expect(svg).not.toContain(hex);
    });

    it('CompassDiagram — rose dial and map square carry the token', () => {
        const rose = render(<CompassDiagram figure={Object.freeze({ map: false })} />);
        expect(renderedSvgMarkup(rose.container)).toContain('var(--paper-diagram)');
        rose.unmount();
        const map = render(<CompassDiagram figure={Object.freeze({ map: true })} />);
        expect(renderedSvgMarkup(map.container)).toContain('var(--paper-diagram)');
        for (const hex of HARDCODED_PALE_FILLS) expect(renderedSvgMarkup(map.container)).not.toContain(hex);
    });

    it('DivisionDiagram — bucket fills carry the token', () => {
        const { container } = render(
            <DivisionDiagram figure={Object.freeze({ kind: 'share', friends: 2, total: 12 })} />
        );
        const svg = renderedSvgMarkup(container);
        expect(svg).toContain('var(--paper-diagram)');
        for (const hex of HARDCODED_PALE_FILLS) expect(svg).not.toContain(hex);
    });

    it('DataDiagram — star and column-bar fills carry the token', () => {
        const stars = render(<DataDiagram figure={Object.freeze({ kind: 'picture', stars: 2 })} />);
        expect(renderedSvgMarkup(stars.container)).toContain('var(--paper-diagram)');
        stars.unmount();
        const bars = render(
            <DataDiagram figure={Object.freeze({ kind: 'column', leftName: 'Cats', rightName: 'Dogs', left: 3, right: 5 })} />
        );
        const svg = renderedSvgMarkup(bars.container);
        expect(svg).toContain('var(--paper-diagram)');
        for (const hex of HARDCODED_PALE_FILLS) expect(svg).not.toContain(hex);
    });

    it('ShapeFigures — shape-card outlines carry the token', () => {
        const { container } = render(
            <ShapeFigures shapes={Object.freeze([{ name: 'circle', kind: '2d' }, { name: 'cube', kind: '3d' }])} />
        );
        const svg = renderedSvgMarkup(container);
        expect(svg).toContain('var(--paper-diagram)');
        for (const hex of HARDCODED_PALE_FILLS) expect(svg).not.toContain(hex);
    });

    it('ShapeTransformationDiagram — the original/options polygons carry the token', () => {
        // Typed fixture: ShapePoint tuples (contextual typing keeps the
        // readonly [x, y] contract the plugin's real figures satisfy).
        const figure: ShapeTransformationFigure = {
            name: 'triangle',
            original: [[0, -2], [2, 2], [-2, 2]],
            options: [{ label: 'A', points: [[0, 2], [2, -2], [-2, -2]] }],
            guide: 'vertical'
        };
        const { container } = render(<ShapeTransformationDiagram figure={Object.freeze(figure)} />);
        const svg = renderedSvgMarkup(container);
        expect(svg).toContain('var(--paper-diagram)');
        for (const hex of HARDCODED_PALE_FILLS) expect(svg).not.toContain(hex);
    });

    it('RectangleDiagram — the shaded path band carries the token', () => {
        const { container } = render(
            <RectangleDiagram figure={Object.freeze({ kind: 'path', length: 18, width: 17, path: 1, unit: 'm' })} />
        );
        const svg = renderedSvgMarkup(container);
        expect(svg).toContain('var(--paper-diagram)');
        for (const hex of HARDCODED_PALE_FILLS) expect(svg).not.toContain(hex);
    });
});

// ── The primary chrome pairs the tokens (no hardcoded white label) ───────────
let probeStore: DashboardStoreStructure | null = null;
function StoreProbe() {
    probeStore = useDashboardStore();
    return null;
}

describe('the Print button — background var(--primary) + label var(--on-primary)', () => {
    it('the toolbar\u2019s primary button paints through the paired tokens, never a hardcoded white', () => {
        const plugin = AdditionWorksheet(MATH_FRAMEWORK);
        const Toolbar = plugin.toolbar!;
        render(
            <DashboardContextProvider>
                <StoreProbe />
                {React.createElement(Toolbar, {
                    context: { pluginId: plugin.id, entryId: plugin.id, store: {}, entries: plugin.entries }
                })}
            </DashboardContextProvider>
        );
        // The Print control exists…
        expect(screen.getByTestId('toolbar-print')).toBeDefined();
        // …and the injected Emotion rule for it pairs the tokens.
        const cssText = Array.from(document.querySelectorAll('style')).map((s) => s.textContent).join('');
        expect(cssText).toContain('background:var(--primary)');
        expect(cssText).toContain('color:var(--on-primary)');
        // The pre-fix hardcoded pairing cannot come back.
        expect(cssText.includes('background:var(--primary);color:#ffffff')).toBe(false);
        void probeStore;
    });
});
