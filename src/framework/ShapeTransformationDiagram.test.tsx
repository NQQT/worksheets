// Rendering contract for types.ts ShapeTransformationFigure. The plugin's
// maths belongs in plugins/ShapeTransformationsWorksheet.test.ts; these fixtures
// deliberately pin supplied SVG geometry rather than deriving correct options.
import React from 'react';
// PAPER-TOKEN NOTE (union adaptation): the source app pinned HARDCODED
// white/dark-ink colours; the merged framework paints paper + ink through
// the theme tokens (var(--paper-*) - theme-adaptive on screen, forced back
// to the light print palette by app.css @media print), so the colour pins
// below assert the token strings the components now emit.
import { arrayCreate, arrayEach, jsonStringify } from '@presource/core';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ShapeTransformationDiagram } from './ShapeTransformationDiagram';
import type { ShapeTransformationFigure } from './types';

afterEach(cleanup);

const figure: ShapeTransformationFigure = {
    name: 'triangle',
    original: [[-3, -2], [2, -1], [-1, 3]],
    options: [
        { label: 'A', points: [[3, 2], [-2, 1], [1, -3]] },
        { label: 'B', points: [[-3, -2], [2, -1], [-1, 3]] },
        { label: 'C', points: [[2, -3], [1, 2], [-3, -1]] },
        { label: 'D', points: [[-3, 2], [2, 1], [-1, -3]] }
    ],
    guide: 'vertical'
};

// Freeze tuples, lists and records, not just the outer fixture: in-place
// rotation, vertex sorting or candidate reordering must fail during rendering.
arrayEach([...figure.original], ({ value }) => { Object.freeze(value); });
Object.freeze(figure.original);
arrayEach([...figure.options], ({ value: option }) => {
    arrayEach([...option.points], ({ value }) => { Object.freeze(value); });
    Object.freeze(option.points);
    Object.freeze(option);
});
Object.freeze(figure.options);
Object.freeze(figure);

const expectedPolygons = [
    '<polygon points="-3,-2 2,-1 -1,3" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="0.18" stroke-linejoin="round"></polygon>',
    '<polygon points="3,2 -2,1 1,-3" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="0.18" stroke-linejoin="round"></polygon>',
    '<polygon points="-3,-2 2,-1 -1,3" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="0.18" stroke-linejoin="round"></polygon>',
    '<polygon points="2,-3 1,2 -3,-1" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="0.18" stroke-linejoin="round"></polygon>',
    '<polygon points="-3,2 2,1 -1,-3" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="0.18" stroke-linejoin="round"></polygon>'
];

describe('ShapeTransformationDiagram', () => {
    // Pure polygons and span cards avoid invalid ProblemText nesting and any
    // CSS transform that could disagree with the plugin's supplied vertices.
    it('prints exact monochrome polygons and compact span cards in data order', () => {
        const { container } = render(<span><ShapeTransformationDiagram figure={figure} /></span>);
        const root = screen.getByRole('img', { name: 'Original triangle' }).parentElement!.parentElement!;
        const cards = root.children;
        const polygons = container.querySelectorAll('polygon');

        expect(root.tagName).toBe('SPAN');
        expect(arrayCreate(({ index }) => {
            const card = cards[index];
            return card && {
                tag: card.tagName,
                labelTag: card.firstElementChild!.tagName,
                label: card.firstElementChild!.textContent
            };
        })).toEqual([
            { tag: 'SPAN', labelTag: 'SPAN', label: 'Original' },
            { tag: 'SPAN', labelTag: 'SPAN', label: 'A' },
            { tag: 'SPAN', labelTag: 'SPAN', label: 'B' },
            { tag: 'SPAN', labelTag: 'SPAN', label: 'C' },
            { tag: 'SPAN', labelTag: 'SPAN', label: 'D' }
        ]);
        expect(arrayCreate(({ index }) => polygons[index]?.outerHTML)).toEqual(expectedPolygons);
        expect(container.querySelector('[style]')).toBe(null);

        const rootStyle = getComputedStyle(root);
        const cardStyle = getComputedStyle(cards[0]);
        const labelStyle = getComputedStyle(cards[0].firstElementChild!);
        expect({
            display: rootStyle.display,
            width: rootStyle.width,
            gap: rootStyle.gap,
            marginTop: rootStyle.marginTop,
            cardDisplay: cardStyle.display,
            cardDirection: cardStyle.flexDirection,
            cardWidth: cardStyle.width,
            cardGap: cardStyle.gap,
            labelFont: labelStyle.fontSize,
            labelLine: labelStyle.lineHeight
        }).toEqual({
            display: 'flex',
            width: 'fit-content',
            gap: '8px',
            marginTop: '6px',
            cardDisplay: 'flex',
            cardDirection: 'column',
            cardWidth: '88px',
            cardGap: '3px',
            labelFont: '14px',
            labelLine: '17px'
        });
    });

    // Accessible names identify the original and letters only. Neither the
    // image attributes nor the candidate labels identify a correct answer.
    it('uses exact SVG coordinate bounds, pixel sizes and neutral accessible names', () => {
        render(<ShapeTransformationDiagram figure={figure} />);
        const images = screen.getAllByRole('img');
        expect(arrayCreate(({ index }) => {
            const image = images[index];
            return image && {
                name: image.getAttribute('aria-label'),
                role: image.getAttribute('role'),
                viewBox: image.getAttribute('viewBox'),
                width: image.getAttribute('width'),
                height: image.getAttribute('height')
            };
        })).toEqual([
            { name: 'Original triangle', role: 'img', viewBox: '-4 -4 8 8', width: '88px', height: '88px' },
            { name: 'Option A', role: 'img', viewBox: '-4 -4 8 8', width: '88px', height: '88px' },
            { name: 'Option B', role: 'img', viewBox: '-4 -4 8 8', width: '88px', height: '88px' },
            { name: 'Option C', role: 'img', viewBox: '-4 -4 8 8', width: '88px', height: '88px' },
            { name: 'Option D', role: 'img', viewBox: '-4 -4 8 8', width: '88px', height: '88px' }
        ]);
    });

    // All three guides share local centre (0,0); full markup pins coordinates
    // and dash styling while empty candidate lists exclude stray guide marks.
    it.each([
        ['vertical', '<line x1="0" y1="-4" x2="0" y2="4" stroke="var(--paper-ink)" stroke-width="0.12" stroke-dasharray="0.4 0.3"></line>'],
        ['horizontal', '<line x1="-4" y1="0" x2="4" y2="0" stroke="var(--paper-ink)" stroke-width="0.12" stroke-dasharray="0.4 0.3"></line>'],
        ['centre', '<circle cx="0" cy="0" r="0.2" fill="var(--paper-ink)"></circle>']
    ] as const)('draws the %s guide on the original only', (guide, expectedGuide) => {
        const { container } = render(<ShapeTransformationDiagram figure={Object.freeze({ ...figure, guide })} />);
        const images = screen.getAllByRole('img');
        const polygons = container.querySelectorAll('polygon');
        expect(arrayCreate(({ index }) => {
            const image = images[index];
            if (!image) return undefined;
            const marks = image.querySelectorAll('line, circle');
            return arrayCreate(({ index: markIndex }) => marks[markIndex]?.outerHTML);
        })).toEqual([[expectedGuide], [], [], [], []]);
        expect(arrayCreate(({ index }) => polygons[index]?.outerHTML)).toEqual(expectedPolygons);
    });

    // Vertex counts and candidate labels are data, not triangle-specific maths
    // or an assumed A-D sort. Reuse frozen candidates in a different order.
    it('draws a supplied quadrilateral and retains reordered candidate labels', () => {
        const reordered: ShapeTransformationFigure = Object.freeze({
            ...figure,
            name: 'quadrilateral',
            original: Object.freeze([
                Object.freeze([-3, -2] as const),
                Object.freeze([-1, -2] as const),
                Object.freeze([3, 3] as const),
                Object.freeze([1, 3] as const)
            ]),
            options: Object.freeze([figure.options[3], figure.options[1], figure.options[0], figure.options[2]])
        });
        const { container } = render(<ShapeTransformationDiagram figure={reordered} />);
        const images = screen.getAllByRole('img');
        const polygons = container.querySelectorAll('polygon');
        expect(arrayCreate(({ index }) => images[index]?.getAttribute('aria-label'))).toEqual([
            'Original quadrilateral', 'Option D', 'Option B', 'Option A', 'Option C'
        ]);
        expect(container.textContent).toBe('OriginalDBAC');
        expect(arrayCreate(({ index }) => polygons[index]?.outerHTML)).toEqual([
            '<polygon points="-3,-2 -1,-2 3,3 1,3" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="0.18" stroke-linejoin="round"></polygon>',
            expectedPolygons[4], expectedPolygons[2], expectedPolygons[1], expectedPolygons[3]
        ]);
    });

    // Preview and print can render the same deeply frozen figure repeatedly;
    // the entire output and serialized input must remain byte-identical.
    it('renders repeatedly without changing geometry or frozen readonly data', () => {
        const originalData = jsonStringify(figure);
        const { container, rerender } = render(<ShapeTransformationDiagram figure={figure} />);
        const originalMarkup = container.innerHTML;
        arrayEach(arrayCreate(3), () => {
            rerender(<ShapeTransformationDiagram figure={figure} />);
            expect(container.innerHTML).toBe(originalMarkup);
            expect(jsonStringify(figure)).toBe(originalData);
        });
    });
});
