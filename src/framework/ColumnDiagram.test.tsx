// Rendering contract for types.ts's ColumnFigure (framework/ColumnDiagram.tsx).
// The pair math belongs in plugins/{Addition,Subtraction}Worksheet.test.ts;
// these fixtures pin the right-aligned vertical layout: operand rows with the
// operator before the LAST row and a result rule below — the sum/result is
// the private answer and never enters the DOM.
import React from 'react';
// PAPER-TOKEN NOTE (union adaptation): the source app pinned HARDCODED
// white/dark-ink colours; the merged framework paints paper + ink through
// the theme tokens (var(--paper-*) - theme-adaptive on screen, forced back
// to the light print palette by app.css @media print), so the colour pins
// below assert the token strings the components now emit.
import { arrayCreate } from '@presource/core';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ColumnDiagram } from './ColumnDiagram';
import type { ColumnFigure } from './types';

afterEach(cleanup);

describe('ColumnDiagram — vertical sum', () => {
    it('right-aligns the pair under a result rule with the + before the last row', () => {
        // 53 + 942: 3-digit width (3×6 + 12 = 30 units), 12-unit row pitch from
        // y=10, plus the 18-unit WORKING_SPACE strip under the rule → 50 units
        // tall, displayed 1.5x (45×75px); digits end-aligned at x=width−4.
        const { container } = render(<ColumnDiagram figure={Object.freeze({ terms: [53, 942], op: '+' })} />);
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('viewBox')).toBe('0 0 30 50');
        expect(svg.getAttribute('width')).toBe('45px');
        expect(svg.getAttribute('height')).toBe('75px');
        expect(svg.getAttribute('aria-label')).toBe('vertical sum layout');
        const texts = svg.querySelectorAll('text');
        expect(arrayCreate(({ index }) => texts[index]?.textContent)).toEqual(['53', '+942']);
        // Exact row geometry: operator row at y=22, operands end-aligned.
        expect(arrayCreate(({ index }) => texts[index]?.outerHTML)).toEqual([
            '<text x="26" y="10" font-size="10" font-weight="600" text-anchor="end" font-family="monospace" fill="var(--paper-ink)">53</text>',
            '<text x="26" y="22" font-size="10" font-weight="600" text-anchor="end" font-family="monospace" fill="var(--paper-ink)">+942</text>'
        ]);
        // The result rule sits 4px below the last row, spanning the width.
        const rule = svg.querySelector('line')!;
        expect(rule.outerHTML).toBe(
            '<line x1="2" y1="26" x2="28" y2="26" stroke="var(--paper-ink)" stroke-width="1.5"></line>'
        );
        // The sum 995 is the private answer: it must not appear anywhere.
        expect(svg.textContent).not.toContain('995');
    });
});

describe('ColumnDiagram — vertical difference', () => {
    it('prints the − marker before the subtrahend with the difference layout', () => {
        const { container } = render(<ColumnDiagram figure={Object.freeze({ terms: [990, 175], op: '-' })} />);
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('aria-label')).toBe('vertical difference layout');
        const texts = svg.querySelectorAll('text');
        expect(arrayCreate(({ index }) => texts[index]?.textContent)).toEqual(['990', '−175']);
        // The result 815 never enters the DOM.
        expect(svg.textContent).not.toContain('815');
    });

    it('sizes the figure from the longest operand (monospace alignment)', () => {
        // 1- and 2-digit terms share the 2-digit width (2×6 + 12 = 24 units);
        // rows stack at the 12-unit pitch and end-align at x=width−4.
        const { container } = render(<ColumnDiagram figure={Object.freeze({ terms: [4, 85], op: '+' })} />);
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('viewBox')).toBe('0 0 24 50');
        const texts = svg.querySelectorAll('text');
        expect(arrayCreate(({ index }) => texts[index]?.outerHTML)).toEqual([
            '<text x="20" y="10" font-size="10" font-weight="600" text-anchor="end" font-family="monospace" fill="var(--paper-ink)">4</text>',
            '<text x="20" y="22" font-size="10" font-weight="600" text-anchor="end" font-family="monospace" fill="var(--paper-ink)">+85</text>'
        ]);
    });

    it('renders repeatedly without changing column geometry (determinism)', () => {
        const figure: ColumnFigure = Object.freeze({ terms: [53, 942], op: '+' });
        const { container, rerender } = render(<ColumnDiagram figure={figure} />);
        const originalMarkup = container.innerHTML;
        rerender(<ColumnDiagram figure={figure} />);
        expect(container.innerHTML).toBe(originalMarkup);
    });
});
