// CompassWorksheet supplies the reference data via types.ts's CompassFigure:
// a compass rose (or a N-at-top map square), the GIVEN facing, and the
// instructed turn if any. This renderer NEVER labels where the turn lands —
// that direction is the private answer.
// (Shared by the PageStack preview and the .print-doc tree.)
//
// COLOURS (T6 theme fix): the map square and rose dial fill with the shared
// --paper-diagram token (pale grey light / deep slate dark) so the ink N/E/S/W
// letters stay readable in the dark preview; print pins the legacy #f2f2f2.
import React from 'react';
import { styledComponent } from '@presource/react';
import type { CompassFigure, CompassCardinal } from './types';

// Block-level span inside the illustrated ProblemText (same nesting the other
// figure renderers use).
//
// SIZE (R2): the rose/map print at 84px — big enough for a child to write the
// four cardinals beside the rose or mark a route on the map square. The 48-unit
// viewBox is untouched (all pinned geometry in CompassDiagram.test.tsx), so the
// display scale simply thickens every stroke (~3.5px) and numeral (~14px).
// Capacity: 6px margin + 84px rose + two wrapped 16px prompt lines + a 40.5px
// answer line ≈ 173.7px, which fits single-column sheets at ≤4/page (210.5px
// rows) — see plugins/layout-capacity.test.ts.
const DiagramRoot = styledComponent('span', {
    display: 'block',
    width: 'fit-content',
    marginTop: '6px'
});

// Cardinal angles in degrees, CLOCKWISE from top (the sheet's compass order:
// N → E → S → W — the same indexing plugins/CompassWorksheet.ts uses).
const CARDINAL_DEG: Record<CompassCardinal, number> = { North: 0, East: 90, South: 180, West: 270 };

// Point on the 48-unit dial at radius r, angle deg clockwise from 12-o'clock.
// Fixed to two decimals so the geometry pins (CompassDiagram.test.tsx) are exact.
function polar(r: number, deg: number): [number, number] {
    const rad = (deg * Math.PI) / 180;
    return [
        Number((24 + r * Math.sin(rad)).toFixed(2)),
        Number((24 - r * Math.cos(rad)).toFixed(2))
    ];
}

// The instructed-turn arrow: a radius-13 arc STARTING at the given facing and
// sweeping the turn (quarter 60°, half 150°) — showing the instruction, with
// an arrowhead pointing the sweep direction. The end direction is unlabeled.
function turnArc(facing: CompassCardinal, turn: 'right' | 'left' | 'half') {
    const base = CARDINAL_DEG[facing];
    // Right = clockwise (deg increasing), left = anticlockwise.
    const span = turn === 'half' ? 150 : 60;
    const dir = turn === 'left' ? -1 : 1;
    const sweepFlag = turn === 'left' ? 0 : 1;
    const start = polar(13, base + dir * 15);
    const end = polar(13, base + dir * (15 + span));
    // Arrowhead: unit tangent at the end (direction of travel), 5px ahead,
    // 2px side wings.
    const endDeg = base + dir * (15 + span);
    const rad = (endDeg * Math.PI) / 180;
    // d/dθ (x, y) = (r cosθ, r sinθ) for clockwise travel; flip for left.
    const tx = (Math.cos(rad) * dir).toFixed(2);
    const ty = (Math.sin(rad) * dir).toFixed(2);
    const tip: [number, number] = [
        Number((end[0] + 5 * Number(tx)).toFixed(2)),
        Number((end[1] + 5 * Number(ty)).toFixed(2))
    ];
    const wingA: [number, number] = [
        Number((end[0] + 2 * Number(ty)).toFixed(2)),
        Number((end[1] - 2 * Number(tx)).toFixed(2))
    ];
    const wingB: [number, number] = [
        Number((end[0] - 2 * Number(ty)).toFixed(2)),
        Number((end[1] + 2 * Number(tx)).toFixed(2))
    ];
    return {
        path: `M${start[0]},${start[1]} A13,13 0 0 ${sweepFlag} ${end[0]},${end[1]}`,
        head: `${tip[0]},${tip[1]} ${wingA[0]},${wingA[1]} ${wingB[0]},${wingB[1]}`
    };
}

export function CompassDiagram({ figure }: { figure: CompassFigure }) {
    if (figure.map) {
        // N-at-top map square: the orientation given by every map item. The
        // answer direction (bottom/left/right edge) is never marked.
        return (
            <DiagramRoot>
                <svg
                    width="84px"
                    height="84px"
                    viewBox="0 0 48 48"
                    role="img"
                    aria-label="map with north at the top"
                >
                    <rect x="10" y="10" width="28" height="28" fill="var(--paper-diagram)" stroke="var(--paper-ink)" strokeWidth="2" />
                    {/* "north" arrow above the square */}
                    <line x1="24" y1="10" x2="24" y2="4" stroke="var(--paper-ink)" strokeWidth="1.5" />
                    <polygon points="24,2 22,6 26,6" fill="var(--paper-ink)" />
                    <text x="24" y="19" fontSize="9" fontWeight="700" textAnchor="middle" fill="var(--paper-ink)">N</text>
                </svg>
            </DiagramRoot>
        );
    }
    // Compass rose: rim + cardinal ticks + N/E/S/W letters (the shared
    // reference every turn/side/opposite item reasons from).
    const ticks: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = (['North', 'East', 'South', 'West'] as const).map((cardinal) => {
        const a = polar(17, CARDINAL_DEG[cardinal]);
        const b = polar(20, CARDINAL_DEG[cardinal]);
        return { x1: a[0], y1: a[1], x2: b[0], y2: b[1], key: cardinal };
    });
    const facing = figure.facing ? polar(19, CARDINAL_DEG[figure.facing]) : null;
    const arc = figure.facing && figure.turn ? turnArc(figure.facing, figure.turn) : null;
    return (
        <DiagramRoot>
            <svg
                width="84px"
                height="84px"
                viewBox="0 0 48 48"
                role="img"
                // Neutral: names the reference, never the answer direction.
                aria-label="compass rose"
            >
                <circle cx="24" cy="24" r="20" fill="var(--paper-diagram)" stroke="var(--paper-ink)" strokeWidth="2" />
                {ticks.map((tick) => (
                    <line key={tick.key} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="var(--paper-ink)" strokeWidth="1.5" />
                ))}
                <text x="24" y="12" fontSize="8" fontWeight="700" textAnchor="middle" fill="var(--paper-ink)">N</text>
                <text x="38" y="26.5" fontSize="8" fontWeight="700" textAnchor="middle" fill="var(--paper-ink)">E</text>
                <text x="24" y="41" fontSize="8" fontWeight="700" textAnchor="middle" fill="var(--paper-ink)">S</text>
                <text x="10" y="26.5" fontSize="8" fontWeight="700" textAnchor="middle" fill="var(--paper-ink)">W</text>
                {/* The GIVEN facing (a dot on the rim side of its letter) */}
                {facing && <circle cx={facing[0]} cy={facing[1]} r="3" fill="var(--paper-ink)" />}
                {/* The instructed turn arrow (instruction, not result) */}
                {arc && (
                    <g>
                        <path d={arc.path} fill="none" stroke="var(--paper-ink)" strokeWidth="1.5" />
                        <polygon points={arc.head} fill="var(--paper-ink)" />
                    </g>
                )}
            </svg>
        </DiagramRoot>
    );
}
