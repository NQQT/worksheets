// Rendering contract for types.ts's BondFigure (framework/BondDiagram.tsx).
// The plugin's fact math belongs in plugins/NumberBondsWorksheet.test.ts; these
// fixtures pin the exact part-part-whole geometry: the whole + GIVEN part
// print their values, the requested part prints as a BLANK circle and the
// missing answer never enters the DOM.
import React from 'react';
// PAPER-TOKEN NOTE (union adaptation): the source app pinned HARDCODED
// white/dark-ink colours; the merged framework paints paper + ink through
// the theme tokens (var(--paper-*) - theme-adaptive on screen, forced back
// to the light print palette by app.css @media print), so the colour pins
// below assert the token strings the components now emit.
import { arrayCreate } from '@presource/core';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BondDiagram } from './BondDiagram';
import type { BondFigure } from './types';

afterEach(cleanup);

describe('BondDiagram', () => {
    it('prints the whole, the given part and ONE blank circle for the missing part', () => {
        // whole 10, left 4 given, right null (the "__ and 2 make 10" twin):
        // exactly three circles and two printed values (the answer is absent).
        const { container } = render(<BondDiagram figure={Object.freeze({ whole: 10, left: 4, right: null })} />);
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('viewBox')).toBe('0 0 96 68');
        // 1.25x display (120×85px): the blank part circle prints ~35px across.
        expect(svg.getAttribute('width')).toBe('120px');
        expect(svg.getAttribute('height')).toBe('85px');
        expect(svg.getAttribute('aria-label')).toBe('part-part-whole bond');
        // Two precomputed links from the whole circle to each part circle
        // (the exact edge-to-edge coordinates pinned by the renderer).
        const links = svg.querySelectorAll('line');
        expect(arrayCreate(({ index }) => links[index]?.outerHTML)).toEqual([
            '<line x1="40.7" y1="27.9" x2="33.3" y2="40.1" stroke="var(--paper-ink)" stroke-width="2"></line>',
            '<line x1="55.3" y1="27.9" x2="62.7" y2="40.1" stroke="var(--paper-ink)" stroke-width="2"></line>'
        ]);
        // Circles: whole (shaded, at 48,16), left (shaded, at 26,52),
        // right (BLANK paper circle, at 70,52 — no value inside). Shaded
        // fills ride the shared --paper-diagram token (T6 theme fix: pale
        // grey light / deep slate dark, AA against the ink values inside).
        const circles = svg.querySelectorAll('circle');
        expect(circles).toHaveLength(3);
        expect(circles[0].outerHTML).toBe(
            '<circle cx="48" cy="16" r="14" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="2"></circle>'
        );
        expect(circles[1].outerHTML).toBe(
            '<circle cx="26" cy="52" r="14" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="2"></circle>'
        );
        expect(circles[2].outerHTML).toBe(
            '<circle cx="70" cy="52" r="14" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="2"></circle>'
        );
        // The only printed values: the whole and the given left part —
        // the missing 6 is never in the DOM.
        const texts = arrayCreate(({ index }) => svg.querySelectorAll('text')[index]?.textContent);
        expect(texts).toEqual(['10', '4']);
    });

    it('blanks the LEFT part when the prompt gives the right one', () => {
        // "__ + 1 = 10": right 1 given, left blank (the figure mirrors the
        // prompt's blank side, never the answer).
        const { container } = render(<BondDiagram figure={Object.freeze({ whole: 10, left: null, right: 1 })} />);
        const svg = container.querySelector('svg')!;
        const circles = svg.querySelectorAll('circle');
        // Left circle is the paper blank; the right carries its value.
        expect(circles[1].getAttribute('fill')).toBe('var(--paper-bg)');
        expect(circles[2].getAttribute('fill')).toBe('var(--paper-diagram)');
        const texts = arrayCreate(({ index }) => svg.querySelectorAll('text')[index]?.textContent);
        expect(texts).toEqual(['10', '1']);
    });

    it('prints both parts for a complete bond (no blank)', () => {
        const { container } = render(<BondDiagram figure={Object.freeze({ whole: 20, left: 13, right: 7 })} />);
        const svg = container.querySelector('svg')!;
        expect(svg.querySelectorAll('circle[fill="var(--paper-bg)"]')).toHaveLength(0);
        const texts = arrayCreate(({ index }) => svg.querySelectorAll('text')[index]?.textContent);
        expect(texts).toEqual(['20', '13', '7']);
    });

    it('renders repeatedly without changing geometry (determinism)', () => {
        const figure: BondFigure = Object.freeze({ whole: 10, left: 3, right: null });
        const { container, rerender } = render(<BondDiagram figure={figure} />);
        const originalMarkup = container.innerHTML;
        rerender(<BondDiagram figure={figure} />);
        expect(container.innerHTML).toBe(originalMarkup);
    });
});
