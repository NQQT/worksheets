// MoneyWorksheet supplies the GIVEN money via types.ts's MoneyFigure (cents
// values, >= 100 = a note). This renderer only draws those given coins/notes;
// the coin SETS that make an amount, totals and swap results stay private
// problem data and are never drawn.
// (Shared by the PageStack preview and the .print-doc tree.)
//
// COLOURS (T6 theme fix): the coin/note fills ride the shared
// --paper-diagram token (pale grey light / deep slate dark — AA contrast
// against the ink labels inside them); print pins the legacy #f2f2f2.
import React from 'react';
import { styledComponent } from '@presource/react';
import type { MoneyFigure } from './types';

// Block-level span inside the illustrated ProblemText.
//
// SIZE (R2): the 24-unit row renders at 1.5x (36px tall) so coin/note labels
// read at ~11px; a row of up to nine pieces (the plugin ceiling) prints 297px,
// inside the single-column sheet at full width.
const DiagramRoot = styledComponent('span', {
    display: 'block',
    width: 'fit-content',
    marginTop: '6px'
});

// Print labels for a cents value: < 100 is a coin ("5c"), >= 100 a note
// ("$1"/"$2"/"$5" — Australian denominations in the MoneyWorksheet catalogue).
function valueLabel(cents: number): string {
    return cents >= 100 ? `$${cents / 100}` : `${cents}c`;
}

function piece(cents: number, x: number) {
    if (cents >= 100) {
        // Note: 32px slot, 26×20 rectangle centred on the 24px row.
        return (
            <g key={x}>
                <rect x={x + 3} y="2" width="26" height="20" rx="2" fill="var(--paper-diagram)" stroke="var(--paper-ink)" strokeWidth="1.5" />
                <text x={x + 16} y="14.5" fontSize="8" fontWeight="700" textAnchor="middle" fill="var(--paper-ink)">{valueLabel(cents)}</text>
            </g>
        );
    }
    // Coin: 22px slot, 20px circle centred on the 24px row.
    return (
        <g key={x}>
            <circle cx={x + 11} cy="12" r="10" fill="var(--paper-diagram)" stroke="var(--paper-ink)" strokeWidth="1.5" />
            <text x={x + 11} y="14.5" fontSize="7" fontWeight="700" textAnchor="middle" fill="var(--paper-ink)">{valueLabel(cents)}</text>
        </g>
    );
}

export function MoneyDiagram({ figure }: { figure: MoneyFigure }) {
    // Lay the given pieces left to right in the prompt's order; the running
    // slot total IS the viewBox width.
    let x = 0;
    const pieces = figure.given.map((cents) => {
        const item = piece(cents, x);
        x += cents >= 100 ? 32 : 22;
        return item;
    });
    const width = x;
    return (
        <DiagramRoot>
            <svg
                width={`${width * 1.5}px`}
                height="36px"
                viewBox={`0 0 ${width} 24`}
                role="img"
                // Neutral: lists the given money only, never totals or answers.
                aria-label="coins and notes"
            >
                {pieces}
            </svg>
        </DiagramRoot>
    );
}
