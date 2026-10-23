// DataWorksheet supplies the counts via types.ts's DataFigure. This renderer
// never prints a total, difference, unit scale or name answer; it only draws
// the exact marks, stars and bars the plugin attached, in preview AND print.
// (Shared by the PageStack preview and the .print-doc tree.)
//
// COLOURS (T6 theme fix): star/bar fills ride the shared --paper-diagram
// token (pale grey light / deep slate dark); print pins the legacy #f2f2f2.
import React from 'react';
import { arrayCreate } from '@presource/core';
import { styledComponent } from '@presource/react';
import type { DataFigure } from './types';

// Spans keep this valid inside PrintableSheet's illustrated ProblemText (the
// same nesting constraint ShapeTransformationDiagram.tsx works under). The
// 6px top margin separates figure from prompt on the roomier rows.
const DiagramRoot = styledComponent('span', {
    display: 'block',
    width: 'fit-content',
    marginTop: '6px'
});

// 5-pointed star centred at (cx, cy): outer radius 6 / inner radius 2.5,
// fixed to one decimal so the pin (DataDiagram.test.tsx) stays exact.
function starPoints(cx: number, cy: number) {
    // (x, y) offsets of the 10 alternating outer/inner vertices, precomputed
    // from the standard 5-point star angles (see DataDiagram.test.tsx).
    const offsets: Array<[number, number]> = [
        [0, -6], [1.47, -2.02], [5.71, -1.85], [2.38, 0.77],
        [5.71, 4.85], [0, 2.5], [-5.71, 4.85], [-2.38, 0.77],
        [-5.71, -1.85], [-1.47, -2.02]
    ];
    return offsets.map(([x, y]) => `${(cx + x).toFixed(2)},${(cy + y).toFixed(2)}`).join(' ');
}

export function DataDiagram({ figure }: { figure: DataFigure }) {
    if (figure.kind === 'tally') {
        // Classic tallies: floor(total/5) five-groups (4 strokes + slash) plus
        // the remainder as single strokes.
        //
        // SIZE (R2): 8-unit stroke pitch, 40-unit group pitch, 36-unit height
        // rendered 1:1 — the marks are ~50% taller than the old 24px strip so
        // they read at arm's length, while the worst case (total 40 = 8 full
        // groups) stays 322px wide, inside the ~335px two-column sheet.
        const fives = Math.floor(figure.total / 5);
        const rest = figure.total % 5;
        const width = fives * 40 + (rest > 0 ? rest * 8 + 4 : 0) + 2;
        return (
            <DiagramRoot>
                <svg
                    width={`${width}px`}
                    height="36px"
                    viewBox={`0 0 ${width} 36`}
                    role="img"
                    // Neutral accessible name — the total is the PRIVATE answer.
                    aria-label="tally marks"
                >
                    {arrayCreate(({ index }) => {
                        if (index >= fives) return undefined;
                        const x = index * 40;
                        return (
                            <g key={`five-${index}`}>
                                {arrayCreate(({ index: s }) => {
                                    if (s >= 4) return undefined;
                                    return <line key={s} x1={x + s * 8} y1="5" x2={x + s * 8} y2="31" stroke="var(--paper-ink)" strokeWidth="2.5" />;
                                })}
                                <line x1={x + 2} y1="32" x2={x + 26} y2="4" stroke="var(--paper-ink)" strokeWidth="2.5" />
                            </g>
                        );
                    })}
                    {arrayCreate(({ index }) => {
                        if (index >= rest) return undefined;
                        const x = fives * 40 + index * 8;
                        return <line key={`rest-${index}`} x1={x} y1="5" x2={x} y2="31" stroke="var(--paper-ink)" strokeWidth="2.5" />;
                    })}
                </svg>
            </DiagramRoot>
        );
    }
    if (figure.kind === 'picture') {
        // One star per counted unit (the "1 star = u things" scale is the
        // prompt's text, not the figure's — the figure prints the stars only).
        // SIZE (R2): the 14-unit viewBox row renders at 2x (28px tall) so the
        // counted stars are big enough to tick/cross out; 6 stars (the plugin
        // ceiling) print 200px, inside the two-column sheet.
        const width = figure.stars * 18 - 8;
        return (
            <DiagramRoot>
                <svg
                    width={`${width * 2}px`}
                    height="28px"
                    viewBox={`0 0 ${width} 14`}
                    role="img"
                    // Neutral: star counts ARE the printed data, but the unit
                    // scale and the total answer stay out of accessible names.
                    aria-label="picture graph"
                >
                    {arrayCreate(({ index }) => {
                        if (index >= figure.stars) return undefined;
                        return (
                            <polygon
                                key={index}
                                points={starPoints(9 + index * 18, 7)}
                                fill="var(--paper-diagram)"
                                stroke="var(--paper-ink)"
                                strokeWidth="1"
                                strokeLinejoin="round"
                            />
                        );
                    })}
                </svg>
            </DiagramRoot>
        );
    }
    // Column graph: two named bars, 2px per square in the 76×80 viewBox,
    // rendered at 1.25x (95×100px) so the bars are readable and the names
    // print at ~11px. The figure + the long prose prompt stay inside one row
    // at the sheet's current 4-per-page single-column layout (figure + three
    // wrapped prompt lines ≈ 170.8px in a 210.5px row). No heights-in-numbers,
    // no difference label (the difference is the PRIVATE answer).
    const leftHeight = figure.left * 2;
    const rightHeight = figure.right * 2;
    return (
        <DiagramRoot>
            <svg
                width="95px"
                height="100px"
                viewBox="0 0 76 80"
                role="img"
                aria-label="column graph"
            >
                {/* Baseline */}
                <line x1="6" y1="68" x2="70" y2="68" stroke="var(--paper-ink)" strokeWidth="1.5" />
                {/* The two bars (value = square count, printed as pixels only) */}
                <rect x="12" y={68 - leftHeight} width="22" height={leftHeight} fill="var(--paper-diagram)" stroke="var(--paper-ink)" strokeWidth="1" />
                <rect x="42" y={68 - rightHeight} width="22" height={rightHeight} fill="var(--paper-diagram)" stroke="var(--paper-ink)" strokeWidth="1" />
                {/* Names only — never vote counts. */}
                <text x="23" y="78" fontSize="9" textAnchor="middle" fill="var(--paper-ink)">{figure.leftName}</text>
                <text x="53" y="78" fontSize="9" textAnchor="middle" fill="var(--paper-ink)">{figure.rightName}</text>
            </svg>
        </DiagramRoot>
    );
}
