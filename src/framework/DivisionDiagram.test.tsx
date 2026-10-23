// Rendering contract for types.ts's DivisionFigure (framework/DivisionDiagram.tsx).
// The story math belongs in plugins/DivisionWorksheet.test.ts; these fixtures
// pin the equal-group model: `friends`/`total ÷ size` buckets with exactly
// `dots` circles each — the quotient answer is never labelled anywhere.
import React from 'react';
// PAPER-TOKEN NOTE (union adaptation): the source app pinned HARDCODED
// white/dark-ink colours; the merged framework paints paper + ink through
// the theme tokens (var(--paper-*) - theme-adaptive on screen, forced back
// to the light print palette by app.css @media print), so the colour pins
// below assert the token strings the components now emit.
import { arrayCreate } from '@presource/core';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DivisionDiagram } from './DivisionDiagram';
import type { DivisionFigure } from './types';

afterEach(cleanup);

describe('DivisionDiagram — share model', () => {
    it('prints friends buckets each holding total ÷ friends dots', () => {
        // 12 crayons shared between 2 friends: 2 buckets × 6 dots. Buckets are
        // 20×26 units with 6-unit gaps (46 wide) displayed 1.5x → 69×39px; the
        // quotient (6) is never text.
        const { container } = render(<DivisionDiagram figure={Object.freeze({ kind: 'share', friends: 2, total: 12 })} />);
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('viewBox')).toBe('0 0 46 26');
        expect(svg.getAttribute('width')).toBe('69px');
        expect(svg.getAttribute('height')).toBe('39px');
        expect(svg.getAttribute('aria-label')).toBe('equal groups of objects');
        const rects = svg.querySelectorAll('rect');
        expect(rects).toHaveLength(2);
        expect(arrayCreate(({ index }) => rects[index]?.outerHTML)).toEqual([
            '<rect x="0" y="0" width="20" height="26" rx="3" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="1"></rect>',
            '<rect x="26" y="0" width="20" height="26" rx="3" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="1"></rect>'
        ]);
        // Dots fill a 2-column grid (cx 6.5/13.5, cy 4/8/12) inside each bucket.
        const dots = svg.querySelectorAll('circle');
        expect(dots).toHaveLength(12);
        expect(arrayCreate(({ index }) => dots[index]?.outerHTML)).toEqual([
            '<circle cx="6.5" cy="4" r="2" fill="var(--paper-ink)"></circle>',
            '<circle cx="13.5" cy="4" r="2" fill="var(--paper-ink)"></circle>',
            '<circle cx="6.5" cy="8" r="2" fill="var(--paper-ink)"></circle>',
            '<circle cx="13.5" cy="8" r="2" fill="var(--paper-ink)"></circle>',
            '<circle cx="6.5" cy="12" r="2" fill="var(--paper-ink)"></circle>',
            '<circle cx="13.5" cy="12" r="2" fill="var(--paper-ink)"></circle>',
            '<circle cx="32.5" cy="4" r="2" fill="var(--paper-ink)"></circle>',
            '<circle cx="39.5" cy="4" r="2" fill="var(--paper-ink)"></circle>',
            '<circle cx="32.5" cy="8" r="2" fill="var(--paper-ink)"></circle>',
            '<circle cx="39.5" cy="8" r="2" fill="var(--paper-ink)"></circle>',
            '<circle cx="32.5" cy="12" r="2" fill="var(--paper-ink)"></circle>',
            '<circle cx="39.5" cy="12" r="2" fill="var(--paper-ink)"></circle>'
        ]);
        // The answer (how many each friend gets) stays out of the DOM.
        expect(svg.querySelectorAll('text')).toHaveLength(0);
    });
});

describe('DivisionDiagram — groups-of model', () => {
    it('prints total ÷ size buckets each holding size dots', () => {
        // 9 objects in groups of 3: 3 buckets × 3 dots → 3×20 + 2×6 = 72px.
        const { container } = render(<DivisionDiagram figure={Object.freeze({ kind: 'groupsOf', size: 3, total: 9 })} />);
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('viewBox')).toBe('0 0 72 26');
        expect(svg.querySelectorAll('rect')).toHaveLength(3);
        const dots = svg.querySelectorAll('circle');
        expect(dots).toHaveLength(9);
        // Three dots per bucket: rows 0-1 of the 2-column grid (cy 4/8).
        expect(arrayCreate(({ index }) => dots[index]?.getAttribute('cx'))).toEqual(['6.5', '13.5', '6.5', '32.5', '39.5', '32.5', '58.5', '65.5', '58.5']);
        expect(arrayCreate(({ index }) => dots[index]?.getAttribute('cy'))).toEqual(['4', '4', '8', '4', '4', '8', '4', '4', '8']);
        expect(svg.querySelectorAll('text')).toHaveLength(0);
    });

    it('renders repeatedly without changing bucket geometry (determinism)', () => {
        const figure: DivisionFigure = Object.freeze({ kind: 'share', friends: 5, total: 30 });
        const { container, rerender } = render(<DivisionDiagram figure={figure} />);
        const originalMarkup = container.innerHTML;
        rerender(<DivisionDiagram figure={figure} />);
        expect(container.innerHTML).toBe(originalMarkup);
        // 5 buckets × 6 dots: 5×20 + 4×6 = 124px, the widest this sheet prints.
        rerender(<DivisionDiagram figure={figure} />);
        expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 124 26');
    });
});
