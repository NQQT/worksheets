// RowsColumnsWorksheet supplies the grid dimensions via types.ts's
// RowsColumnsFigure. This renderer never calculates a total, missing
// dimension or product; it only draws the exact r × c lattice of squares in
// preview AND print (Shared by PageStack preview and the .print-doc tree).
import React from 'react';
import { arrayCreate } from '@presource/core';
import { styledComponent } from '@presource/react';
import type { RowsColumnsFigure } from './types';

// Spans keep this valid inside PrintableSheet's ProblemText span (the same
// nesting constraint ShapeTransformationDiagram.tsx works under). One SVG
// per grid: each 12-unit cell displays as 20px, so the worst 5 × 5 grid
// prints at 100 × 100px — clearly countable squares, and figure + prompt
// still fit the six single-column rows the sheet pins (≈144px in ~151px).
const DiagramRoot = styledComponent('span', {
    display: 'block',
    width: 'fit-content',
    marginTop: '6px'
});

export function RowsColumnsDiagram({ figure }: { figure: RowsColumnsFigure }) {
    const { rows, cols } = figure;
    // Cell geometry: viewBox unit = 1/3.33 display px (12-unit cell => 20px).
    // Every cell is a 10 × 10 square inset 1 unit into its 12-unit slot, so
    // printed squares keep a uniform 1-unit gutter at any page scale.
    // Factory form (arrayCreate stops at undefined): one {x, y} slot per
    // cell, row-major order — the same factory idiom the shape cards use.
    const cells = arrayCreate(({ index }) => {
        if (index >= rows * cols) return undefined;
        const row = Math.floor(index / cols);
        const col = index % cols;
        return {
            x: col * 12 + 1,
            y: row * 12 + 1
        };
    });
    return (
        <DiagramRoot>
            <svg
                width={`${20 * cols}px`}
                height={`${20 * rows}px`}
                viewBox={`0 0 ${12 * cols} ${12 * rows}`}
                role="img"
                // Neutral accessible name: the figure must not print its
                // own answers ("3 rows and 4 columns" would answer the
                // "how many columns?" item for screen readers), exactly as
                // the shape cards' "Option A" names stay neutral.
                aria-label="grid of squares"
            >
                {cells.map(({ x, y }, index) => (
                    <rect
                        key={index}
                        x={x}
                        y={y}
                        width="10"
                        height="10"
                        fill="var(--paper-bg)"
                        stroke="var(--paper-ink)"
                        strokeWidth="1"
                    />
                ))}
            </svg>
        </DiagramRoot>
    );
}
