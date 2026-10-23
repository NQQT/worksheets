// Rendering contract for types.ts's DataFigure (framework/DataDiagram.tsx).
// The generator's tally/graph math belongs in plugins/DataWorksheet.test.ts;
// these fixtures pin the supplied SVG marks only: totals, differences and
// unit scales are PRIVATE answers and must never enter the DOM.
import React from 'react';
// PAPER-TOKEN NOTE (union adaptation): the source app pinned HARDCODED
// white/dark-ink colours; the merged framework paints paper + ink through
// the theme tokens (var(--paper-*) - theme-adaptive on screen, forced back
// to the light print palette by app.css @media print), so the colour pins
// below assert the token strings the components now emit.
import { arrayCreate } from '@presource/core';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DataDiagram } from './DataDiagram';
import type { DataFigure } from './types';

afterEach(cleanup);

describe('DataDiagram — tally figures', () => {
    it('prints the exact five-groups + remainder strokes with a neutral name', () => {
        // total 13 = two five-groups (4 strokes + slash each) + 3 remainder
        // strokes: 13 <line> elements, 110px wide (2×40 + 3×8 + 4 + 2) at the
        // roomy 8-unit stroke / 40-unit group pitch, 36-unit height.
        render(<DataDiagram figure={Object.freeze({ kind: 'tally', total: 13 })} />);
        const image = screen.getByRole('img');
        expect(image.getAttribute('aria-label')).toBe('tally marks');
        expect(image.getAttribute('viewBox')).toBe('0 0 110 36');
        expect(image.getAttribute('width')).toBe('110px');
        expect(image.getAttribute('height')).toBe('36px');
        // No <text> anywhere: the total is the private answer, never spoken.
        expect(image.querySelectorAll('text')).toHaveLength(0);
        // Two five-groups: 4 vertical strokes + 1 slash per group, then the
        // 3 remainder strokes after the 80-unit group run.
        const lines = image.querySelectorAll('line');
        expect(lines).toHaveLength(13);
        expect(arrayCreate(({ index }) => lines[index]?.outerHTML)).toEqual([
            '<line x1="0" y1="5" x2="0" y2="31" stroke="var(--paper-ink)" stroke-width="2.5"></line>',
            '<line x1="8" y1="5" x2="8" y2="31" stroke="var(--paper-ink)" stroke-width="2.5"></line>',
            '<line x1="16" y1="5" x2="16" y2="31" stroke="var(--paper-ink)" stroke-width="2.5"></line>',
            '<line x1="24" y1="5" x2="24" y2="31" stroke="var(--paper-ink)" stroke-width="2.5"></line>',
            '<line x1="2" y1="32" x2="26" y2="4" stroke="var(--paper-ink)" stroke-width="2.5"></line>',
            '<line x1="40" y1="5" x2="40" y2="31" stroke="var(--paper-ink)" stroke-width="2.5"></line>',
            '<line x1="48" y1="5" x2="48" y2="31" stroke="var(--paper-ink)" stroke-width="2.5"></line>',
            '<line x1="56" y1="5" x2="56" y2="31" stroke="var(--paper-ink)" stroke-width="2.5"></line>',
            '<line x1="64" y1="5" x2="64" y2="31" stroke="var(--paper-ink)" stroke-width="2.5"></line>',
            '<line x1="42" y1="32" x2="66" y2="4" stroke="var(--paper-ink)" stroke-width="2.5"></line>',
            '<line x1="80" y1="5" x2="80" y2="31" stroke="var(--paper-ink)" stroke-width="2.5"></line>',
            '<line x1="88" y1="5" x2="88" y2="31" stroke="var(--paper-ink)" stroke-width="2.5"></line>',
            '<line x1="96" y1="5" x2="96" y2="31" stroke="var(--paper-ink)" stroke-width="2.5"></line>'
        ]);
    });

    it('degrades a whole-multiple total to groups only (no remainder strokes)', () => {
        // total 15 = three five-groups exactly: 12 vertical strokes (3×4) + 3
        // slashes inside 3×40 + 2 = 122px.
        const { container } = render(<DataDiagram figure={Object.freeze({ kind: 'tally', total: 15 })} />);
        const image = container.querySelector('svg')!;
        expect(image.getAttribute('viewBox')).toBe('0 0 122 36');
        expect(image.querySelectorAll('line[y1="5"]')).toHaveLength(12); // vertical strokes
        expect(image.querySelectorAll('line[y1="32"]')).toHaveLength(3); // group slashes
        expect(image.querySelectorAll('line')).toHaveLength(15);
    });

    it('keeps the worst-case Year 2 tally (total 40) inside the two-column sheet', () => {
        // 8 full groups: 8×40 + 2 = 322px — under the ~335px two-column width,
        // so the densest data page never clips the marks.
        const { container } = render(<DataDiagram figure={Object.freeze({ kind: 'tally', total: 40 })} />);
        const image = container.querySelector('svg')!;
        expect(image.getAttribute('viewBox')).toBe('0 0 322 36');
        expect(image.querySelectorAll('line')).toHaveLength(40);
    });
});

describe('DataDiagram — picture graphs', () => {
    it('prints one 5-point star per counted unit (stars only, no scale)', () => {
        const { container } = render(<DataDiagram figure={Object.freeze({ kind: 'picture', stars: 6 })} />);
        const image = container.querySelector('svg')!;
        expect(image.getAttribute('aria-label')).toBe('picture graph');
        // 14-unit viewBox row displayed 2x (28px tall) for readable stars.
        expect(image.getAttribute('viewBox')).toBe('0 0 100 14');
        expect(image.getAttribute('width')).toBe('200px');
        expect(image.getAttribute('height')).toBe('28px');
        const polygons = image.querySelectorAll('polygon');
        expect(polygons).toHaveLength(6);
        // Star 1 is centred at (9, 7): the exact 10-vertex pentagram pin.
        expect(polygons[0].getAttribute('points')).toBe(
            '9.00,1.00 10.47,4.98 14.71,5.15 11.38,7.77 14.71,11.85 9.00,9.50 3.29,11.85 6.62,7.77 3.29,5.15 7.53,4.98'
        );
        // Stars follow the 18-unit pitch (centres 9, 27, 45, ...).
        expect(polygons[1].getAttribute('points')).toBe(
            '27.00,1.00 28.47,4.98 32.71,5.15 29.38,7.77 32.71,11.85 27.00,9.50 21.29,11.85 24.62,7.77 21.29,5.15 25.53,4.98'
        );
        // The star → thing scale and the total stay in the prompt/data only.
        expect(image.querySelectorAll('text')).toHaveLength(0);
    });

    it('sizes the SVG width from the star count', () => {
        // 4 stars: viewBox (4×18 − 8) = 64 units → 128px displayed; 1 star: 20px.
        const { container } = render(<DataDiagram figure={Object.freeze({ kind: 'picture', stars: 4 })} />);
        expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 64 14');
        expect(container.querySelector('svg')!.getAttribute('width')).toBe('128px');
        expect(container.querySelectorAll('polygon')).toHaveLength(4);
    });
});

describe('DataDiagram — column graphs', () => {
    it('prints the two named bars at 2px per vote with names only', () => {
        const { container } = render(<DataDiagram figure={Object.freeze({
            kind: 'column', leftName: 'Kai', rightName: 'Mia', left: 9, right: 8
        })} />);
        const image = container.querySelector('svg')!;
        expect(image.getAttribute('aria-label')).toBe('column graph');
        // 76×80 viewBox rendered 1.25x (95×100px) — bars stay 2 units/vote.
        expect(image.getAttribute('viewBox')).toBe('0 0 76 80');
        expect(image.getAttribute('width')).toBe('95px');
        expect(image.getAttribute('height')).toBe('100px');
        // The only text is the names — vote counts and the "how many more"
        // difference (the answer) are never printed.
        const texts = arrayCreate(({ index }) => image.querySelectorAll('text')[index]?.textContent);
        expect(texts).toEqual(['Kai', 'Mia']);
        const rects = image.querySelectorAll('rect');
        expect(arrayCreate(({ index }) => rects[index]?.outerHTML)).toEqual([
            '<rect x="12" y="50" width="22" height="18" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="1"></rect>',
            '<rect x="42" y="52" width="22" height="16" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="1"></rect>'
        ]);
        // Baseline at y=68 spans both bars.
        const baseline = image.querySelectorAll('line');
        expect(baseline).toHaveLength(1);
        expect(baseline[0].outerHTML).toBe('<line x1="6" y1="68" x2="70" y2="68" stroke="var(--paper-ink)" stroke-width="1.5"></line>');
    });

    it('renders repeatedly without changing geometry (determinism)', () => {
        const figure: DataFigure = Object.freeze({ kind: 'column', leftName: 'Tom', rightName: 'Sam', left: 7, right: 2 });
        const { container, rerender } = render(<DataDiagram figure={figure} />);
        const originalMarkup = container.innerHTML;
        rerender(<DataDiagram figure={figure} />);
        expect(container.innerHTML).toBe(originalMarkup);
    });
});
