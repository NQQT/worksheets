// Rendering contract for types.ts's ShapeFigure[] (framework/ShapeFigure.tsx).
// Exact shape math belongs in plugins/ShapesWorksheet.test.ts; these fixtures
// pin the printed cards: one 40-unit viewBox SVG per shape (72px display) in
// option order, the shape's label, and neutral accessible names — side/corner/
// face counts and answers are PRIVATE and never enter the DOM.
import React from 'react';
import { arrayCreate } from '@presource/core';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ShapeFigures } from './ShapeFigure';
import type { ShapeFigure } from './types';

afterEach(cleanup);

describe('ShapeFigures', () => {
    it('prints one labelled card per shape in option order (72px display)', () => {
        const shapes: readonly ShapeFigure[] = Object.freeze([
            { name: 'triangle', kind: '2d' },
            { name: 'square', kind: '2d' },
            { name: 'cube', kind: '3d' }
        ]);
        const { container } = render(<ShapeFigures shapes={shapes} />);
        // The root span wraps the one card per shape (option order).
        const cards = container.firstElementChild!.children.length;
        expect(cards).toBe(3);
        const svgs = container.querySelectorAll('svg');
        expect(svgs).toHaveLength(3);
        // Each card: the 40×40 SVG, the exact neutral name, then the label.
        expect(arrayCreate(({ index }) => svgs[index]?.getAttribute('viewBox'))).toEqual(['0 0 40 40', '0 0 40 40', '0 0 40 40']);
        expect(arrayCreate(({ index }) => svgs[index]?.getAttribute('aria-label'))).toEqual(['shape triangle', 'shape square', 'shape cube']);
        // Labels repeat the option names in the SAME order (no reordering that
        // could align an answer with a card).
        expect(arrayCreate(({ index }) => container.querySelectorAll('span span span')[index]?.textContent)).toEqual(['triangle', 'square', 'cube']);
        expect(container.textContent).toBe('trianglesquarecube');
    });

    it.each([
        { name: 'triangle', kind: '2d', expect: (svg: SVGSVGElement) => svg.querySelector('polygon')?.getAttribute('points') },
        { name: 'hexagon', kind: '2d', expect: (svg: SVGSVGElement) => svg.querySelector('polygon')?.getAttribute('points') },
        { name: 'circle', kind: '2d', expect: (svg: SVGSVGElement) => svg.querySelector('circle')?.getAttribute('r') },
        { name: 'oval', kind: '2d', expect: (svg: SVGSVGElement) => svg.querySelector('ellipse')?.getAttribute('rx') },
        { name: 'sphere', kind: '3d', expect: (svg: SVGSVGElement) => svg.querySelectorAll('circle').length }
    ] as { name: string; kind: '2d' | '3d'; expect: (svg: SVGSVGElement) => unknown }[])
    ('draws the %s outline/solid with its exact geometry', ({ name, kind, expect: probe }) => {
        const { container } = render(<ShapeFigures shapes={[Object.freeze({ name, kind } as ShapeFigure)]} />);
        const svg = container.querySelector('svg')!;
        switch (name) {
            case 'triangle':
                // Apex (20,4), base corners (36,34)/(4,34) — the exact pin.
                expect(probe(svg)).toBe('20,4 36,34 4,34');
                break;
            case 'hexagon':
                expect(probe(svg)).toBe('20,3 34.7,11.5 34.7,28.5 20,37 5.3,28.5 5.3,11.5');
                break;
            case 'circle':
                expect(probe(svg)).toBe('16');
                break;
            case 'oval':
                expect(probe(svg)).toBe('16');
                break;
            case 'sphere':
                // Outline circle + equator ellipse: exactly one <circle>.
                expect(probe(svg)).toBe(1);
                expect(svg.querySelector('ellipse')).not.toBeNull();
                break;
        }
    });

    it('draws the 3-D solids as monochrome line drawings (no filled faces)', () => {
        const { container } = render(<ShapeFigures shapes={[Object.freeze({ name: 'cube', kind: '3d' })]} />);
        const svg = container.querySelector('svg')!;
        // Cube: two face squares + four corner joins, all stroked. The card
        // label (printed name) is the ONLY text in the card.
        expect(svg.querySelectorAll('rect')).toHaveLength(2);
        expect(svg.querySelectorAll('line')).toHaveLength(4);
        expect(container.textContent).toBe('cube');
    });

    it('renders repeatedly without changing card order or geometry (determinism)', () => {
        const shapes: readonly ShapeFigure[] = Object.freeze([
            { name: 'square', kind: '2d' },
            { name: 'cylinder', kind: '3d' }
        ]);
        const { container, rerender } = render(<ShapeFigures shapes={shapes} />);
        const originalMarkup = container.innerHTML;
        rerender(<ShapeFigures shapes={shapes} />);
        expect(container.innerHTML).toBe(originalMarkup);
        expect(shapes).toEqual([{ name: 'square', kind: '2d' }, { name: 'cylinder', kind: '3d' }]);
    });
});
