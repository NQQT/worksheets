// Rendering contract for types.ts's MoneyFigure (framework/MoneyDiagram.tsx).
// The plugin's money math belongs in plugins/MoneyWorksheet.test.ts; these
// fixtures pin the GIVEN pieces only: coins < 100 print as coin slots with
// their value label, values >= 100 as note slots ("$1"/"$2"/"$5"), in the
// prompt's order — totals, coin sets and swap counts are PRIVATE and are
// never entered (the "what coins make X?" form attaches no figure at all).
import React from 'react';
// PAPER-TOKEN NOTE (union adaptation): the source app pinned HARDCODED
// white/dark-ink colours; the merged framework paints paper + ink through
// the theme tokens (var(--paper-*) - theme-adaptive on screen, forced back
// to the light print palette by app.css @media print), so the colour pins
// below assert the token strings the components now emit.
import { arrayCreate } from '@presource/core';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MoneyDiagram } from './MoneyDiagram';
import type { MoneyFigure } from './types';

afterEach(cleanup);

describe('MoneyDiagram', () => {
    it('prints the given note + coin as exact slots with value labels only', () => {
        // $1 note (32-unit slot) + 10c coin (22-unit slot) = 54-unit row,
        // displayed 1.5x → 81×36px; viewBox geometry stays in 24-unit rows.
        const { container } = render(<MoneyDiagram figure={Object.freeze({ given: [100, 10] })} />);
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('viewBox')).toBe('0 0 54 24');
        expect(svg.getAttribute('width')).toBe('81px');
        expect(svg.getAttribute('height')).toBe('36px');
        expect(svg.getAttribute('aria-label')).toBe('coins and notes');
        // The note: rounded rect (x+3…x+29) with the "$1" label centred.
        const note = svg.querySelector('rect')!;
        expect(note.outerHTML).toBe(
            '<rect x="3" y="2" width="26" height="20" rx="2" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="1.5"></rect>'
        );
        // The coin: 20px circle centred in its 22px slot, "10c" label inside.
        const coin = svg.querySelector('circle')!;
        expect(coin.outerHTML).toBe(
            '<circle cx="43" cy="12" r="10" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="1.5"></circle>'
        );
        // The labels are the GIVEN values in order — no total printed.
        const texts = arrayCreate(({ index }) => svg.querySelectorAll('text')[index]?.textContent);
        expect(texts).toEqual(['$1', '10c']);
    });

    it('prints a single given coin as one 22px slot', () => {
        const { container } = render(<MoneyDiagram figure={Object.freeze({ given: [20] })} />);
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('viewBox')).toBe('0 0 22 24');
        expect(svg.querySelector('circle')!.getAttribute('cx')).toBe('11');
        expect(svg.querySelectorAll('text')[0].textContent).toBe('20c');
        expect(svg.querySelector('rect')).toBeNull();
    });

    it('lays out a mixed jar of coins left to right in given order', () => {
        // Five-cent jar of 3: 3 × 22px = 66px, circles at 11, 33, 55.
        const { container } = render(<MoneyDiagram figure={Object.freeze({ given: [5, 5, 5] })} />);
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('viewBox')).toBe('0 0 66 24');
        const circles = svg.querySelectorAll('circle');
        expect(circles).toHaveLength(3);
        expect(arrayCreate(({ index }) => circles[index]?.getAttribute('cx'))).toEqual(['11', '33', '55']);
        const texts = arrayCreate(({ index }) => svg.querySelectorAll('text')[index]?.textContent);
        expect(texts).toEqual(['5c', '5c', '5c']);
    });

    it('renders repeatedly without changing slot geometry (determinism)', () => {
        const figure: MoneyFigure = Object.freeze({ given: [500, 10] });
        const { container, rerender } = render(<MoneyDiagram figure={figure} />);
        const originalMarkup = container.innerHTML;
        rerender(<MoneyDiagram figure={figure} />);
        expect(container.innerHTML).toBe(originalMarkup);
    });
});
