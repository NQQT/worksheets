// Rendering contract for types.ts PerimeterAreaFigure (rectangle / lshape /
// path), drawn by framework/RectangleDiagram.tsx in preview AND print. The
// generator owns every perimeter/area answer; these fixtures pin the printed
// SVG geometry, the "?" stand-in a null side prints and the ANSWER-PRIVACY
// contract: no accessible name ever carries a digit, the path kind never
// labels its outer sides, and reverse-question rectangles draw fixed
// stand-ins, never a computed value (RectangleDiagram.tsx header note).
import React from 'react';
// PAPER-TOKEN NOTE (union adaptation): the source app pinned HARDCODED
// white/dark-ink colours; the merged framework paints paper + ink through
// the theme tokens (var(--paper-*) - theme-adaptive on screen, forced back
// to the light print palette by app.css @media print), so the colour pins
// below assert the token strings the components now emit.
import { arrayCreate } from '@presource/core';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RectangleDiagram } from './RectangleDiagram';
import type { PerimeterAreaFigure } from './types';

afterEach(cleanup);

// ── Pinned geometry (framework/RectangleDiagram.tsx constants) ───────────────
// 1 unit = 1px. LEFT_GUTTER 44 + TOP_GUTTER 18 reserve the side-label room,
// PAD 2 clears the 2px shape stroke, and every side label prints at
// font-size 12 in ink var(--paper-ink) on paper var(--paper-bg). A fully-known rectangle
// scales by min(150/length, 60/width); the fixed stand-ins are NULL_SQUARE
// 48 (both sides unknown), NULL_LENGTH 70 (only length unknown) and
// NULL_WIDTH 40 (only width unknown).

// Every side label shares one four-attribute signature, so each expected
// <text> outerHTML is built once here instead of repeated inline per test.
function labelText(x: number, y: number, text: string, anchor: 'middle' | 'end' | 'start' = 'middle') {
    return `<text x="${x}" y="${y}" font-size="12" font-weight="600" fill="var(--paper-ink)" text-anchor="${anchor}">${text}</text>`;
}

// Exact unit-square lattice for a grid figure: row-major, one (cell-2)²
// square inset 1px into every cell×cell slot at (44 + col·cell + 1,
// 18 + row·cell + 1) — the same arrayCreate factory idiom
// RowsColumnsDiagram.test.tsx uses for its lattice pins.
function expectedCells(len: number, wid: number, cell: number) {
    return arrayCreate(({ index }) => {
        if (index >= len * wid) return undefined;
        const row = Math.floor(index / len);
        const col = index % len;
        return `<rect x="${44 + col * cell + 1}" y="${18 + row * cell + 1}" width="${cell - 2}" height="${cell - 2}" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="1"></rect>`;
    });
}

// The bold boundary <rect> printed AFTER every cell (grid figures only):
// fill none + 2px stroke so it reads as the rectangle outline itself.
function boundaryRect(gridW: number, gridH: number) {
    return `<rect x="44" y="18" width="${gridW}" height="${gridH}" fill="none" stroke="var(--paper-ink)" stroke-width="2"></rect>`;
}

describe('RectangleDiagram', () => {
    it('prints a fully-known rectangle scaled by min(150/length, 60/width) with both given sides labelled', () => {
        // length 10, width 7 → scale = min(15, 60/7) = 8.571… → 85 × 60 drawn
        // (7 · 60/7 lands exactly on 60 in double arithmetic).
        const figure = Object.freeze({ kind: 'rectangle', length: 10, width: 7, unit: 'cm' } as PerimeterAreaFigure);
        const { container } = render(<RectangleDiagram figure={figure} />);
        const image = screen.getByRole('img');
        expect(image.getAttribute('viewBox')).toBe('0 0 131 80');
        expect(image.getAttribute('width')).toBe('131px');
        expect(image.getAttribute('height')).toBe('80px');
        // The shape itself: white paper, 2px ink stroke, at (44, 18).
        expect(container.querySelectorAll('rect').length).toBe(1);
        expect(container.querySelectorAll('rect')[0]?.outerHTML).toBe(
            '<rect x="44" y="18" width="85" height="60" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="2"></rect>'
        );
        // "10 cm" centred above, "7 cm" anchored end so it hugs the stroke.
        expect(arrayCreate(({ index }) => container.querySelectorAll('text')[index]?.outerHTML)).toEqual([
            labelText(86.5, 14, '10 cm'),
            labelText(40, 52, '7 cm', 'end'),
        ]);
        // Answer privacy: the accessible name names the shape, never a
        // measurement (the area/perimeter is the private answer).
        const label = image.getAttribute('aria-label');
        expect(label).toBe('labelled rectangle');
        expect(label).not.toMatch(/\d/);
        // styledComponent renders classed spans only — no inline styles.
        expect(container.querySelectorAll('[style]').length).toBe(0);
    });

    it('prints a width-unknown rectangle with a fixed stand-in height and a "?" left label', () => {
        // length 8, width null → drawnW floor(8 · 150/8) = 150, drawnH
        // NULL_WIDTH 40: the reverse-question rectangle is NEVER to scale,
        // so a drawn side can never hint the private answer.
        const figure = Object.freeze({ kind: 'rectangle', length: 8, width: null, unit: 'cm' } as PerimeterAreaFigure);
        const { container } = render(<RectangleDiagram figure={figure} />);
        const image = screen.getByRole('img');
        expect(image.getAttribute('viewBox')).toBe('0 0 196 60');
        expect(image.getAttribute('width')).toBe('196px');
        expect(image.getAttribute('height')).toBe('60px');
        expect(container.querySelectorAll('rect').length).toBe(1);
        expect(container.querySelectorAll('rect')[0]?.outerHTML).toBe(
            '<rect x="44" y="18" width="150" height="40" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="2"></rect>'
        );
        // Given length still labels the top; the unknown width prints "? cm".
        expect(arrayCreate(({ index }) => container.querySelectorAll('text')[index]?.outerHTML)).toEqual([
            labelText(119, 14, '8 cm'),
            labelText(40, 42, '? cm', 'end'),
        ]);
        const label = image.getAttribute('aria-label');
        expect(label).toBe('labelled rectangle');
        expect(label).not.toMatch(/\d/);
        expect(container.querySelectorAll('[style]').length).toBe(0);
    });

    it('prints the both-unknown square-from-perimeter as the fixed 48 × 48 stand-in', () => {
        // Both sides null → NULL_SQUARE 48 × 48 drawn, "? m" on both labels
        // (the side the perimeter question asks for is never drawn).
        const figure = Object.freeze({ kind: 'rectangle', length: null, width: null, unit: 'm' } as PerimeterAreaFigure);
        const { container } = render(<RectangleDiagram figure={figure} />);
        const image = screen.getByRole('img');
        expect(image.getAttribute('viewBox')).toBe('0 0 94 68');
        expect(image.getAttribute('width')).toBe('94px');
        expect(image.getAttribute('height')).toBe('68px');
        expect(container.querySelectorAll('rect').length).toBe(1);
        expect(container.querySelectorAll('rect')[0]?.outerHTML).toBe(
            '<rect x="44" y="18" width="48" height="48" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="2"></rect>'
        );
        expect(arrayCreate(({ index }) => container.querySelectorAll('text')[index]?.outerHTML)).toEqual([
            labelText(68, 14, '? m'),
            labelText(40, 46, '? m', 'end'),
        ]);
        const label = image.getAttribute('aria-label');
        expect(label).toBe('labelled rectangle');
        expect(label).not.toMatch(/\d/);
        expect(container.querySelectorAll('[style]').length).toBe(0);
    });

    it('prints the unit-square lattice with the bold boundary outline and labelled sides', () => {
        // length 5, width 3 → cell = min(14, floor(100/3)) = 14 → 70 × 42
        // grid of 15 countable squares.
        const figure = Object.freeze({ kind: 'rectangle', length: 5, width: 3, unit: 'cm', grid: true } as PerimeterAreaFigure);
        const { container } = render(<RectangleDiagram figure={figure} />);
        const image = screen.getByRole('img');
        expect(image.getAttribute('aria-label')).toBe('rectangle covered in unit squares');
        expect(image.getAttribute('viewBox')).toBe('0 0 116 62');
        expect(image.getAttribute('width')).toBe('116px');
        expect(image.getAttribute('height')).toBe('62px');
        // 15 unit squares + the bold boundary drawn after them in DOM order.
        expect(container.querySelectorAll('rect').length).toBe(16);
        expect(arrayCreate(({ index }) => container.querySelectorAll('rect')[index]?.outerHTML)).toEqual([
            ...expectedCells(5, 3, 14),
            boundaryRect(70, 42),
        ]);
        // Sides stay labelled: they are given data; the square count is the
        // answer and stays off both the drawing and the accessible name.
        expect(arrayCreate(({ index }) => container.querySelectorAll('text')[index]?.outerHTML)).toEqual([
            labelText(79, 14, '5 cm'),
            labelText(40, 43, '3 cm', 'end'),
        ]);
        const label = image.getAttribute('aria-label');
        expect(label).toBe('rectangle covered in unit squares');
        expect(label).not.toMatch(/\d/);
        expect(container.querySelectorAll('[style]').length).toBe(0);
    });

    it('shrinks the lattice cell so a 9 × 9 grid never exceeds 100px tall', () => {
        // length 9, width 9 → cell = min(14, floor(100/9)) = 11 → 99 × 99
        // grid of 81 squares; the lattice keeps fitting the printed block.
        const figure = Object.freeze({ kind: 'rectangle', length: 9, width: 9, unit: 'cm', grid: true } as PerimeterAreaFigure);
        const { container } = render(<RectangleDiagram figure={figure} />);
        const image = screen.getByRole('img');
        expect(image.getAttribute('viewBox')).toBe('0 0 145 119');
        expect(image.getAttribute('width')).toBe('145px');
        expect(image.getAttribute('height')).toBe('119px');
        expect(container.querySelectorAll('rect').length).toBe(82);
        // Full 81-cell lattice at cell 11 (first square 45/19, last square
        // 133/107) + the bold boundary, in DOM order.
        expect(arrayCreate(({ index }) => container.querySelectorAll('rect')[index]?.outerHTML)).toEqual([
            ...expectedCells(9, 9, 11),
            boundaryRect(99, 99),
        ]);
        expect(arrayCreate(({ index }) => container.querySelectorAll('text')[index]?.outerHTML)).toEqual([
            labelText(93.5, 14, '9 cm'),
            labelText(40, 71.5, '9 cm', 'end'),
        ]);
        const label = image.getAttribute('aria-label');
        expect(label).toBe('rectangle covered in unit squares');
        expect(label).not.toMatch(/\d/);
        expect(container.querySelectorAll('[style]').length).toBe(0);
    });

    it('prints the L-shape as two bottom-aligned rectangles with all four given sides labelled', () => {
        // first 6-long × 5-wide column + second 4-long × 2-wide foot →
        // scale = min(150/(5+4), 60/max(6,2)) = 10 → column 50 × 60 at
        // (44, 18), foot 40 × 20 at (94, 58) — bottom-aligned so the shared
        // edge's two strokes overlap into one divider line.
        const figure = Object.freeze({
            kind: 'lshape',
            first: { length: 6, width: 5 },
            second: { length: 4, width: 2 },
            unit: 'cm'
        } as PerimeterAreaFigure);
        const { container } = render(<RectangleDiagram figure={figure} />);
        const image = screen.getByRole('img');
        expect(image.getAttribute('aria-label')).toBe('L-shape of two rectangles');
        expect(image.getAttribute('viewBox')).toBe('0 0 174 94');
        expect(image.getAttribute('width')).toBe('174px');
        expect(image.getAttribute('height')).toBe('94px');
        expect(arrayCreate(({ index }) => container.querySelectorAll('rect')[index]?.outerHTML)).toEqual([
            '<rect x="44" y="18" width="50" height="60" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="2"></rect>',
            '<rect x="94" y="58" width="40" height="20" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="2"></rect>'
        ]);
        // Label order: first.width above the column, first.length left (end
        // anchor), second.length under the foot, second.width right (start).
        expect(arrayCreate(({ index }) => container.querySelectorAll('text')[index]?.outerHTML)).toEqual([
            labelText(69, 14, '5 cm'),
            labelText(40, 52, '6 cm', 'end'),
            labelText(114, 91, '4 cm'),
            labelText(140, 72, '2 cm', 'start')
        ]);
        // All four sides are given data here, but the name stays neutral.
        const label = image.getAttribute('aria-label');
        expect(label).toBe('L-shape of two rectangles');
        expect(label).not.toMatch(/\d/);
        expect(container.querySelectorAll('[style]').length).toBe(0);
    });

    it('prints the garden path as a shaded band with both labels inside the garden', () => {
        // Garden 18 × 17 with a 1-unit path → outer 20 × 19 scaled by
        // min(150/20, 60/19) = 60/19 → outer 63 × 60 (both products land
        // exactly on integers), band floor(60/19) = 3 → garden 57 × 54 at
        // (4, 4). The OUTER sides are deliberately unlabelled: the outer
        // perimeter is that form's private answer.
        const figure = Object.freeze({ kind: 'path', length: 18, width: 17, path: 1, unit: 'm' } as PerimeterAreaFigure);
        const { container } = render(<RectangleDiagram figure={figure} />);
        const image = screen.getByRole('img');
        expect(image.getAttribute('aria-label')).toBe('garden with a path around it');
        expect(image.getAttribute('viewBox')).toBe('0 0 65 62');
        expect(image.getAttribute('width')).toBe('65px');
        expect(image.getAttribute('height')).toBe('62px');
        // Shaded outer band (the --paper-diagram token) + paper garden inset
        // by the band.
        expect(arrayCreate(({ index }) => container.querySelectorAll('rect')[index]?.outerHTML)).toEqual([
            '<rect x="1" y="1" width="63" height="60" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="2"></rect>',
            '<rect x="4" y="4" width="57" height="54" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="2"></rect>'
        ]);
        // Both garden labels sit INSIDE the garden (middle-anchored), so they
        // can never be mistaken for the unlabelled outer sides.
        expect(arrayCreate(({ index }) => container.querySelectorAll('text')[index]?.outerHTML)).toEqual([
            labelText(32.5, 17, '18 m'),
            labelText(20, 35, '17 m')
        ]);
        const label = image.getAttribute('aria-label');
        expect(label).toBe('garden with a path around it');
        expect(label).not.toMatch(/\d/);
        expect(container.querySelectorAll('[style]').length).toBe(0);
    });

    it('renders repeatedly without changing geometry or the readonly figure', () => {
        // The largest printed grid (81 squares) as the stress fixture.
        const large = Object.freeze({ kind: 'rectangle', length: 9, width: 9, unit: 'cm', grid: true } as PerimeterAreaFigure);
        const { container, rerender } = render(<RectangleDiagram figure={large} />);
        const originalMarkup = container.innerHTML;
        expect(container.querySelectorAll('rect').length).toBe(82);
        rerender(<RectangleDiagram figure={large} />);
        // Byte-identical markup after the rerender: no drift, no answer leak.
        expect(container.innerHTML).toBe(originalMarkup);
        expect(large).toEqual({ kind: 'rectangle', length: 9, width: 9, unit: 'cm', grid: true });
    });
});
