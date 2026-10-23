// Rendering contract for types.ts's CompassFigure (framework/CompassDiagram.tsx).
// The prompt math belongs in plugins/CompassWorksheet.test.ts; these fixtures
// pin the exact rose/map geometry: the reference cardinals, the GIVEN facing
// dot, and the instructed-turn arrow — the direction the turn LANDS on (the
// answer) is never labelled, so text nodes are N/E/S/W and "N" only.
import React from 'react';
// PAPER-TOKEN NOTE (union adaptation): the source app pinned HARDCODED
// white/dark-ink colours; the merged framework paints paper + ink through
// the theme tokens (var(--paper-*) - theme-adaptive on screen, forced back
// to the light print palette by app.css @media print), so the colour pins
// below assert the token strings the components now emit.
import { arrayCreate } from '@presource/core';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CompassDiagram } from './CompassDiagram';
import type { CompassFigure } from './types';

afterEach(cleanup);

describe('CompassDiagram — compass rose', () => {
    it('prints the rose reference with the four cardinal letters and no facing', () => {
        const { container } = render(<CompassDiagram figure={Object.freeze({ map: false })} />);
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('viewBox')).toBe('0 0 48 48');
        expect(svg.getAttribute('aria-label')).toBe('compass rose');
        // Rim + 4 cardinal ticks + 4 letters, and nothing else (no facing dot,
        // no turn arc — the plain reference rose).
        expect(svg.querySelectorAll('circle')).toHaveLength(1);
        expect(svg.querySelectorAll('line')).toHaveLength(4);
        expect(svg.querySelectorAll('path')).toHaveLength(0);
        const texts = arrayCreate(({ index }) => svg.querySelectorAll('text')[index]?.textContent);
        expect(texts).toEqual(['N', 'E', 'S', 'W']);
        // Exact tick geometry (radius 17 → 20 at each cardinal, 48-unit dial).
        expect(arrayCreate(({ index }) => svg.querySelectorAll('line')[index]?.outerHTML)).toEqual([
            '<line x1="24" y1="7" x2="24" y2="4" stroke="var(--paper-ink)" stroke-width="1.5"></line>',
            '<line x1="41" y1="24" x2="44" y2="24" stroke="var(--paper-ink)" stroke-width="1.5"></line>',
            '<line x1="24" y1="41" x2="24" y2="44" stroke="var(--paper-ink)" stroke-width="1.5"></line>',
            '<line x1="7" y1="24" x2="4" y2="24" stroke="var(--paper-ink)" stroke-width="1.5"></line>'
        ]);
    });

    it('marks the GIVEN facing as a dot and never the answer direction', () => {
        const { container } = render(<CompassDiagram figure={Object.freeze({ map: false, facing: 'East' })} />);
        const svg = container.querySelector('svg')!;
        // One extra circle: the facing dot on the rim at East (43, 24).
        expect(svg.querySelectorAll('circle')).toHaveLength(2);
        const dot = svg.querySelectorAll('circle')[1];
        expect(dot.getAttribute('cx')).toBe('43');
        expect(dot.getAttribute('cy')).toBe('24');
        expect(dot.getAttribute('r')).toBe('3');
        // Text is STILL only the reference letters — no "South"/result label.
        const texts = arrayCreate(({ index }) => svg.querySelectorAll('text')[index]?.textContent);
        expect(texts).toEqual(['N', 'E', 'S', 'W']);
    });

    it('draws the instructed right-quarter arc with the exact swept geometry', () => {
        // facing East, turn right: a radius-13 arc sweeps 60° clockwise from
        // the facing — the exact arc + arrowhead pins (renderer turnArc).
        render(<CompassDiagram figure={Object.freeze({ map: false, facing: 'East', turn: 'right' })} />);
        const svg = document.querySelector('svg')!;
        const path = svg.querySelector('path')!;
        expect(path.getAttribute('d')).toBe('M36.56,27.36 A13,13 0 0 1 27.36,36.56');
        const head = svg.querySelectorAll('polygon');
        expect(head).toHaveLength(1);
        // Arrowhead at the arc end (27.36, 36.56) pointing along the sweep:
        // tip 5px ahead on the tangent, wings ±2px.
        expect(head[0].getAttribute('points')).toBe('22.51,37.86 27.88,38.5 26.84,34.62');
    });

    it('draws the half-turn arc (150° sweep) for facing South', () => {
        render(<CompassDiagram figure={Object.freeze({ map: false, facing: 'South', turn: 'half' })} />);
        const svg = document.querySelector('svg')!;
        const path = svg.querySelector('path')!;
        expect(path.getAttribute('d')).toBe('M20.64,36.56 A13,13 0 0 1 20.64,11.44');
        // The arc ends unlabeled: the landing on East/West is never spoken.
        const texts = arrayCreate(({ index }) => svg.querySelectorAll('text')[index]?.textContent);
        expect(texts).toEqual(['N', 'E', 'S', 'W']);
    });

    it('renders repeatedly without changing geometry (determinism)', () => {
        const figure: CompassFigure = Object.freeze({ map: false, facing: 'West', turn: 'left' });
        const { container, rerender } = render(<CompassDiagram figure={figure} />);
        const originalMarkup = container.innerHTML;
        rerender(<CompassDiagram figure={figure} />);
        expect(container.innerHTML).toBe(originalMarkup);
    });
});

describe('CompassDiagram — N-at-top map', () => {
    it('prints the map square with the north arrow and a single N label', () => {
        const { container } = render(<CompassDiagram figure={Object.freeze({ map: true })} />);
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('viewBox')).toBe('0 0 48 48');
        expect(svg.getAttribute('aria-label')).toBe('map with north at the top');
        expect(svg.querySelector('rect')?.outerHTML).toBe(
            '<rect x="10" y="10" width="28" height="28" fill="var(--paper-diagram)" stroke="var(--paper-ink)" stroke-width="2"></rect>'
        );
        // The north arrow (stem + head) above the square, the bottom/left/right
        // answer edges are never marked.
        const arrow = svg.querySelectorAll('line');
        expect(arrow).toHaveLength(1);
        expect(arrow[0].outerHTML).toBe('<line x1="24" y1="10" x2="24" y2="4" stroke="var(--paper-ink)" stroke-width="1.5"></line>');
        expect(svg.querySelectorAll('polygon')).toHaveLength(1);
        const texts = arrayCreate(({ index }) => svg.querySelectorAll('text')[index]?.textContent);
        expect(texts).toEqual(['N']);
    });
});
