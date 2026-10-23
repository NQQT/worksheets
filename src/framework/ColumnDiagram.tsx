// AdditionWorksheet / SubtractionWorksheet (Year 3 multi-digit pairs) supply
// the terms via types.ts's ColumnFigure. This renderer right-aligns the terms
// into a vertical column layout — operator before the last row, a result rule
// below — and NEVER prints the sum/result (it is the private answer).
// (Shared by the PageStack preview and the .print-doc tree.)
import React from 'react';
import { arrayCreate } from '@presource/core';
import { styledComponent } from '@presource/react';
import type { ColumnFigure } from './types';

// Block-level span inside the illustrated ProblemText.
//
// SIZE (R2): the 10-unit digits render at 1.5x (15px) so the columns line up
// under a pencil, and the viewBox now reserves an 18-unit strip BELOW the
// result rule (WORKING_SPACE) — the student writes the sum inside the figure,
// not in the page margin. A two-term three-digit pair prints ~60×81px, so the
// Year 3 sheets run single-column at ≤7 per page (the deeper-task density) to
// keep figure + wrapped prompt inside one row (≈102.6px in a 110px row).
const DiagramRoot = styledComponent('span', {
    display: 'block',
    width: 'fit-content',
    marginTop: '6px'
});

const ROW_PITCH = 12;
const TOP = 10;
const DIGIT_WIDTH = 6;
// Clear writing room under the result rule (viewBox units, 1.5x on screen).
const WORKING_SPACE = 18;
// Display scale: viewBox units render 1.5x larger for print readability.
const SCALE = 1.5;

export function ColumnDiagram({ figure }: { figure: ColumnFigure }) {
    const digits = Math.max(...figure.terms.map((term) => String(term).length));
    const width = digits * DIGIT_WIDTH + 12; // operator + right margin
    // Rows stack from TOP; the rule sits 4 below the last row and the
    // WORKING_SPACE strip (plus the old 10-unit bottom pad) stays empty.
    const height = TOP + (figure.terms.length - 1) * ROW_PITCH + 10 + WORKING_SPACE;
    return (
        <DiagramRoot>
            <svg
                width={`${width * SCALE}px`}
                height={`${height * SCALE}px`}
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                // Neutral: the rows are the GIVEN operands only; no result.
                aria-label={figure.op === '+' ? 'vertical sum layout' : 'vertical difference layout'}
            >
                {/* Rows, right-aligned; the operator sits before the LAST row */}
                {arrayCreate(({ index }) => {
                    if (index >= figure.terms.length) return undefined;
                    const text = index === figure.terms.length - 1 ? `${figure.op === '-' ? '−' : '+'}${figure.terms[index]}` : `${figure.terms[index]}`;
                    return (
                        <text
                            key={index}
                            x={width - 4}
                            y={TOP + index * ROW_PITCH}
                            fontSize="10"
                            fontWeight="600"
                            textAnchor="end"
                            fontFamily="monospace"
                            fill="var(--paper-ink)"
                        >
                            {text}
                        </text>
                    );
                })}
                {/* The result rule: the student writes the answer below it. */}
                <line x1="2" y1={TOP + (figure.terms.length - 1) * ROW_PITCH + 4} x2={width - 2} y2={TOP + (figure.terms.length - 1) * ROW_PITCH + 4} stroke="var(--paper-ink)" strokeWidth="1.5" />
            </svg>
        </DiagramRoot>
    );
}
