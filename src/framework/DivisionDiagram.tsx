// DivisionWorksheet supplies the story counts via types.ts's DivisionFigure.
// This renderer draws the VISIBLE equal-group model — buckets with dots
// inside — and NEVER labels the quotient ("how many groups / each"): that
// result is the private answer.
// (Shared by the PageStack preview and the .print-doc tree.)
//
// COLOURS (T6 theme fix): the bucket fill rides the shared --paper-diagram
// token (pale grey light / deep slate dark) so the ink dots stay countable in
// the dark preview; print pins the legacy #f2f2f2.
import React from 'react';
import { arrayCreate } from '@presource/core';
import { styledComponent } from '@presource/react';
import type { DivisionFigure } from './types';

// Block-level span inside the illustrated ProblemText.
//
// SIZE (R2): the 26-unit bucket row renders at 1.5x (39px tall) so the dots
// inside each bucket are countable at a glance; six buckets (the widest deal)
// print 186px, inside the single-column sheet. 1.5 is a binary-exact scale,
// so every derived width/height attribute stays a clean number.
const DiagramRoot = styledComponent('span', {
    display: 'block',
    width: 'fit-content',
    marginTop: '6px'
});

// Bucket dimensions (viewBox units): 20 × 26, 6-unit gaps, displayed at 1.5x.
// Dots are 2-unit circles in a 2-column grid (10 dots max: rows 0..4).
const BOX_W = 20;
const BOX_H = 26;
const GAP = 6;
const SCALE = 1.5;

export function DivisionDiagram({ figure }: { figure: DivisionFigure }) {
    // Both story forms draw the same picture: `groups` buckets, each holding
    // `buckets` dots (total = groups × buckets, exact by construction).
    const groups = figure.kind === 'share' ? figure.friends : figure.total / figure.size;
    const dotsPerBox = figure.kind === 'share' ? figure.total / figure.friends : figure.size;
    const buckets = arrayCreate(({ index }) => index < groups ? index : undefined);
    return (
        <DiagramRoot>
            <svg
                width={`${(groups * BOX_W + (groups - 1) * GAP) * SCALE}px`}
                height={`${BOX_H * SCALE}px`}
                viewBox={`0 0 ${groups * BOX_W + (groups - 1) * GAP} ${BOX_H}`}
                role="img"
                // Neutral accessible name: the bucket/dot COUNTS are the data,
                // the quotient question's answer is never spoken.
                aria-label="equal groups of objects"
            >
                {buckets.map((group) => (
                    <g key={group}>
                        <rect
                            x={group * (BOX_W + GAP)}
                            y="0"
                            width={BOX_W}
                            height={BOX_H}
                            rx="3"
                            fill="var(--paper-diagram)"
                            stroke="var(--paper-ink)"
                            strokeWidth="1"
                        />
                        {arrayCreate(({ index }) => {
                            if (index >= dotsPerBox) return undefined;
                            const col = index % 2;
                            const row = Math.floor(index / 2);
                            return (
                                <circle
                                    key={index}
                                    cx={group * (BOX_W + GAP) + 6.5 + col * 7}
                                    cy={4 + row * 4}
                                    r="2"
                                    fill="var(--paper-ink)"
                                />
                            );
                        })}
                    </g>
                ))}
            </svg>
        </DiagramRoot>
    );
}
