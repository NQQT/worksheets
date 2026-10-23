// Rendering contract for types.ts RowsColumnsFigure. The plugin's grid math
// belongs in plugins/RowsColumnsWorksheet.test.ts; these fixtures pin the
// supplied SVG lattice (dimensions only) and never derive answers.
import React from 'react';
// PAPER-TOKEN NOTE (union adaptation): the source app pinned HARDCODED
// white/dark-ink colours; the merged framework paints paper + ink through
// the theme tokens (var(--paper-*) - theme-adaptive on screen, forced back
// to the light print palette by app.css @media print), so the colour pins
// below assert the token strings the components now emit.
import { arrayCreate } from '@presource/core';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RowsColumnsDiagram } from './RowsColumnsDiagram';
import type { RowsColumnsFigure } from './types';

afterEach(cleanup);

// A 3 × 4 grid (12 cells) plus the largest printed grid 5 × 5 (25 cells).
const figure = Object.freeze({ rows: 3, cols: 4 } as RowsColumnsFigure);
const large = Object.freeze({ rows: 5, cols: 5 } as RowsColumnsFigure);

// Exact rect lattice for a {rows, cols} figure: row-major, one 10 × 10 square
// inset 1 unit into each 12-unit slot (framework/RowsColumnsDiagram.tsx).
function expectedRects(rows: number, cols: number) {
    return arrayCreate(({ index }) => {
        if (index >= rows * cols) return undefined;
        const row = Math.floor(index / cols);
        const col = index % cols;
        return `<rect x="${col * 12 + 1}" y="${row * 12 + 1}" width="10" height="10" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="1"></rect>`;
    });
}

describe('RowsColumnsDiagram', () => {
    it('prints the exact monochrome square lattice with neutral accessible names', () => {
        const { container } = render(<span><RowsColumnsDiagram figure={figure} /></span>);
        const image = screen.getByRole('img');

        // Dimensions only: the accessible name and the SVG both stay neutral
        // — no totals, no "3 rows and 4 columns", no answers (private data).
        expect(image.getAttribute('aria-label')).toBe('grid of squares');
        expect(image.getAttribute('viewBox')).toBe('0 0 48 36');
        // 20px per 12-unit cell (roomy countable squares).
        expect(image.getAttribute('width')).toBe('80px');
        expect(image.getAttribute('height')).toBe('60px');
        expect(container.querySelectorAll('text').length).toBe(0);
        expect(container.querySelectorAll('rect').length).toBe(12);
        expect(arrayCreate(({ index }) => container.querySelectorAll('rect')[index]?.outerHTML)).toEqual(expectedRects(3, 4));
    });

    it.each([
        { rows: 5, cols: 5 },
        { rows: 1, cols: 5 },
        { rows: 4, cols: 1 }
    ])('sizes the SVG for a %i × %i grid (max 100 × 100px printed)', ({ rows, cols }) => {
        const { container } = render(<RowsColumnsDiagram figure={Object.freeze({ rows, cols })} />);
        const image = screen.getByRole('img');
        expect(image.getAttribute('viewBox')).toBe(`0 0 ${12 * cols} ${12 * rows}`);
        expect(image.getAttribute('width')).toBe(`${20 * cols}px`);
        expect(image.getAttribute('height')).toBe(`${20 * rows}px`);
        expect(container.querySelectorAll('rect').length).toBe(rows * cols);
        expect(arrayCreate(({ index }) => container.querySelectorAll('rect')[index]?.outerHTML)).toEqual(expectedRects(rows, cols));
    });

    it('renders repeatedly without changing geometry or the readonly figure', () => {
        const { container, rerender } = render(<RowsColumnsDiagram figure={large} />);
        const originalMarkup = container.innerHTML;
        expect(container.querySelectorAll('rect').length).toBe(25);
        rerender(<RowsColumnsDiagram figure={large} />);
        expect(container.innerHTML).toBe(originalMarkup);
        expect(large).toEqual({ rows: 5, cols: 5 });
    });
});
