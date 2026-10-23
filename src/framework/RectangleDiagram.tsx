// PerimeterAreaWorksheet supplies every measurement shape via types.ts's
// PerimeterAreaFigure. This renderer never calculates a perimeter, area or a
// missing side; it only draws the exact labelled shape the generator
// described, in preview AND print (shared by the PageStack preview and the
// .print-doc tree, exactly like RowsColumnsDiagram.tsx).
//
// ANSWER PRIVACY (the family contract, see PrintableSheet.tsx): a null side
// prints "?" — the value the prompt asks for is NEVER drawn. The path kind
// never labels its OUTER sides (the outer perimeter IS that form's answer),
// and no accessible name ever carries a number. Reverse-question rectangles
// are fixed stand-in sizes (NOT to scale), so a drawn side can never hint the
// private answer either.
import React from 'react';
import { arrayCreate } from '@presource/core';
import { styledComponent } from '@presource/react';
import type { PerimeterAreaFigure } from './types';

// Spans keep this valid inside PrintableSheet's illustrated ProblemText (a
// block child under the prompt, the same nesting RowsColumnsDiagram works
// under). The 6px top margin separates figure from prompt on the roomier rows.
const DiagramRoot = styledComponent('span', {
    display: 'block',
    width: 'fit-content',
    marginTop: '6px'
});

// ── Geometry constants ───────────────────────────────────────────────────────
// Pinned by RectangleDiagram.test.tsx and mirrored by the figure-height model
// in plugins/layout-capacity.test.ts — change all three together. Ink colours
// are the hardcoded paper/ink pair every figure uses (PrintableSheet.tsx
// header note: var(--paper-ink) ink on var(--paper-bg) paper in every theme).
const TOP_GUTTER = 18;    // px reserved ABOVE a top-labelled shape for its label
const LEFT_GUTTER = 44;   // px reserved LEFT of a left-labelled shape
const MAX_SHAPE_W = 150;  // widest drawn shape, px (scale budget)
const MAX_SHAPE_H = 60;   // tallest drawn shape, px (scale budget; floors to ≤59)
const NULL_SQUARE = 48;   // drawn side px when BOTH sides are unknown
const NULL_LENGTH = 70;   // drawn width px when only the LENGTH is unknown
const NULL_WIDTH = 40;    // drawn height px when only the WIDTH is unknown
const GRID_MAX_PX = 100;  // tallest unit-square grid, px (cell shrinks to fit)
const GRID_CELL_MAX = 14; // largest unit-square cell, px (countable squares)
const BOTTOM_LABEL = 16;  // px label row BELOW a bottom-labelled shape
const RIGHT_LABEL = 40;   // px label column RIGHT of a right-labelled shape
const PAD = 2;            // right/bottom svg padding past a 2px shape stroke
const LABEL_FONT = 12;    // side-label font size, px
const INK = 'var(--paper-ink)';
const PAPER = 'var(--paper-bg)';
// T6 theme fix: the shaded path band rides the shared --paper-diagram token
// (pale grey light / deep slate dark) instead of a hardcoded hex, so it stays
// visible on the dark preview; print pins the legacy light value.
const PATH_FILL = 'var(--paper-diagram)'; // shaded band = the path around a garden

// One side label (value + unit, or "? unit" for an unknown side). Anchored
// middle by default; left-side labels anchor "end" so they hug the shape
// without ever crossing its stroke.
function SideLabel({ x, y, text, anchor }: { x: number; y: number; text: string; anchor?: 'middle' | 'end' | 'start' }) {
    return (
        <text x={x} y={y} fontSize={LABEL_FONT} fontWeight="600" fill={INK} textAnchor={anchor ?? 'middle'}>
            {text}
        </text>
    );
}

// ── rectangle kind ───────────────────────────────────────────────────────────
// Height model (mirrored by layout-capacity.test.ts):
//   svg height = TOP_GUTTER + drawnH + PAD, drawnH =
//     floor(width * scale) with scale = min(150/length, 60/width)  (both known)
//     NULL_WIDTH (40)                                              (width null)
//     NULL_SQUARE (48)                                             (both null)
// so the worst printed block is 6 + 18 + 59 + 2 = 85px.
function RectangleFigure({ figure }: { figure: Extract<PerimeterAreaFigure, { kind: 'rectangle' }> }) {
    const { length, width, unit, grid } = figure;
    // One shared scale keeps a fully-known rectangle proportional; unknown
    // sides use the fixed stand-ins above (never a computed value).
    const scale = Math.min(
        length !== null ? MAX_SHAPE_W / length : Infinity,
        width !== null ? MAX_SHAPE_H / width : Infinity
    );
    const drawnW = Math.floor(length !== null ? length * scale : width !== null ? NULL_LENGTH : NULL_SQUARE);
    const drawnH = Math.floor(width !== null ? width * scale : length !== null ? NULL_WIDTH : NULL_SQUARE);

    if (grid) {
        // Unit-square lattice for the count-the-squares items (Year 4 area by
        // counting, AC9M4M02 — counting the drawn squares IS the method). The
        // cell shrinks so the grid never exceeds GRID_MAX_PX tall; sides stay
        // labelled (they are given data, the count is the answer). The
        // generator attaches `grid` only with BOTH sides known (a counting
        // rectangle); unknown sides degrade to an empty lattice, never a crash.
        const len = length ?? 0;
        const wid = width ?? 0;
        const cell = Math.min(GRID_CELL_MAX, Math.floor(GRID_MAX_PX / wid));
        const gridW = len * cell;
        const gridH = wid * cell;
        // Factory form (arrayCreate stops at undefined): one slot per square,
        // row-major, inset 1px into its cell so the lattice shows gutters.
        const cells = arrayCreate(({ index }) => {
            if (index >= len * wid) return undefined;
            const row = Math.floor(index / len);
            const col = index % len;
            return { x: LEFT_GUTTER + col * cell + 1, y: TOP_GUTTER + row * cell + 1 };
        });
        return (
            <DiagramRoot>
                <svg
                    width={`${LEFT_GUTTER + gridW + PAD}px`}
                    height={`${TOP_GUTTER + gridH + PAD}px`}
                    viewBox={`0 0 ${LEFT_GUTTER + gridW + PAD} ${TOP_GUTTER + gridH + PAD}`}
                    role="img"
                    // Neutral accessible name — never the square count.
                    aria-label="rectangle covered in unit squares"
                >
                    {cells.map(({ x, y }, index) => (
                        <rect key={index} x={x} y={y} width={cell - 2} height={cell - 2} fill={PAPER} stroke={INK} strokeWidth="1" />
                    ))}
                    {/* Bold outline over the lattice: the rectangle itself. */}
                    <rect x={LEFT_GUTTER} y={TOP_GUTTER} width={gridW} height={gridH} fill="none" stroke={INK} strokeWidth="2" />
                    <SideLabel x={LEFT_GUTTER + gridW / 2} y={TOP_GUTTER - 4} text={`${len} ${unit}`} />
                    <SideLabel x={LEFT_GUTTER - 4} y={TOP_GUTTER + gridH / 2 + 4} text={`${wid} ${unit}`} anchor="end" />
                </svg>
            </DiagramRoot>
        );
    }
    return (
        <DiagramRoot>
            <svg
                width={`${LEFT_GUTTER + drawnW + PAD}px`}
                height={`${TOP_GUTTER + drawnH + PAD}px`}
                viewBox={`0 0 ${LEFT_GUTTER + drawnW + PAD} ${TOP_GUTTER + drawnH + PAD}`}
                role="img"
                // Neutral accessible name — no side value, no "?" semantics.
                aria-label="labelled rectangle"
            >
                <rect x={LEFT_GUTTER} y={TOP_GUTTER} width={drawnW} height={drawnH} fill={PAPER} stroke={INK} strokeWidth="2" />
                <SideLabel x={LEFT_GUTTER + drawnW / 2} y={TOP_GUTTER - 4} text={`${length ?? '?'} ${unit}`} />
                <SideLabel x={LEFT_GUTTER - 4} y={TOP_GUTTER + drawnH / 2 + 4} text={`${width ?? '?'} ${unit}`} anchor="end" />
            </svg>
        </DiagramRoot>
    );
}

// ── lshape kind ──────────────────────────────────────────────────────────────
// "One A by B and one C by D": first = tall left column (length vertical,
// width horizontal), second = bottom-right foot (length horizontal, width
// vertical), bottom-aligned so the two strokes on the shared edge overlap
// into one line. Height model (mirrored by layout-capacity.test.ts):
//   svg height = TOP_GUTTER + shapeH + BOTTOM_LABEL with
//   shapeH = floor(max(first.length, second.width) * scale),
//   scale = min(150/(first.width + second.length), 60/max-heights)
// so the worst printed block is 6 + 18 + 59 + 16 = 99px.
function LShapeFigure({ figure }: { figure: Extract<PerimeterAreaFigure, { kind: 'lshape' }> }) {
    const { first, second, unit } = figure;
    const totalW = first.width + second.length;
    const totalH = Math.max(first.length, second.width);
    const scale = Math.min(MAX_SHAPE_W / totalW, MAX_SHAPE_H / totalH);
    const colW = Math.floor(first.width * scale);
    const colH = Math.floor(first.length * scale);
    const footW = Math.floor(second.length * scale);
    const footH = Math.floor(second.width * scale);
    // Bottom-aligned: the taller part's top edge sits in the top gutter, the
    // shorter one starts lower. shapeH is the drawn total height.
    const shapeH = Math.max(colH, footH);
    const colTop = TOP_GUTTER + (shapeH - colH);
    const footTop = TOP_GUTTER + (shapeH - footH);
    const bottom = TOP_GUTTER + shapeH;
    const footLeft = LEFT_GUTTER + colW;
    const footRight = footLeft + footW;
    return (
        <DiagramRoot>
            <svg
                width={`${LEFT_GUTTER + colW + footW + RIGHT_LABEL}px`}
                height={`${TOP_GUTTER + shapeH + BOTTOM_LABEL}px`}
                viewBox={`0 0 ${LEFT_GUTTER + colW + footW + RIGHT_LABEL} ${TOP_GUTTER + shapeH + BOTTOM_LABEL}`}
                role="img"
                // Neutral accessible name — the four labels are given data.
                aria-label="L-shape of two rectangles"
            >
                {/* Both parts drawn white-on-ink; the shared edge is where
                    the two strokes overlap into a single divider line. */}
                <rect x={LEFT_GUTTER} y={colTop} width={colW} height={colH} fill={PAPER} stroke={INK} strokeWidth="2" />
                <rect x={footLeft} y={footTop} width={footW} height={footH} fill={PAPER} stroke={INK} strokeWidth="2" />
                {/* first's own sides: width above the column, length at left */}
                <SideLabel x={LEFT_GUTTER + colW / 2} y={colTop - 4} text={`${first.width} ${unit}`} />
                <SideLabel x={LEFT_GUTTER - 4} y={(colTop + bottom) / 2 + 4} text={`${first.length} ${unit}`} anchor="end" />
                {/* second's own sides: length under the foot, width at right */}
                <SideLabel x={(footLeft + footRight) / 2} y={bottom + 13} text={`${second.length} ${unit}`} />
                <SideLabel x={footRight + 6} y={(footTop + bottom) / 2 + 4} text={`${second.width} ${unit}`} anchor="start" />
            </svg>
        </DiagramRoot>
    );
}

// ── path kind ────────────────────────────────────────────────────────────────
// Garden ringed by a path band: the OUTER rectangle (garden + 2×path) is
// shaded, the white garden sits inset by the band thickness. Both garden
// labels sit INSIDE the garden so they can never be mistaken for the outer
// sides — the outer perimeter is that form's PRIVATE answer and stays
// unlabelled. Height model (mirrored by layout-capacity.test.ts):
//   svg height = outerH + 2 with outerH = floor((width + 2*path) * scale),
//   scale = min(150/(length + 2*path), 60/(width + 2*path))
// so the worst printed block is 6 + 59 + 2 = 67px.
function PathFigure({ figure }: { figure: Extract<PerimeterAreaFigure, { kind: 'path' }> }) {
    const { length, width, path, unit } = figure;
    const scale = Math.min(MAX_SHAPE_W / (length + 2 * path), MAX_SHAPE_H / (width + 2 * path));
    const outerW = Math.floor((length + 2 * path) * scale);
    const outerH = Math.floor((width + 2 * path) * scale);
    const band = Math.floor(path * scale); // drawn path thickness, px
    const gardenX = 1 + band;
    const gardenY = 1 + band;
    const gardenW = outerW - 2 * band;
    const gardenH = outerH - 2 * band;
    return (
        <DiagramRoot>
            <svg
                width={`${outerW + PAD}px`}
                height={`${outerH + PAD}px`}
                viewBox={`0 0 ${outerW + PAD} ${outerH + PAD}`}
                role="img"
                // Neutral accessible name — the garden sides are given data;
                // the asked outer perimeter is never drawn or named.
                aria-label="garden with a path around it"
            >
                {/* Shaded outer rectangle = garden + path band on all sides. */}
                <rect x="1" y="1" width={outerW} height={outerH} fill={PATH_FILL} stroke={INK} strokeWidth="2" />
                {/* White garden inset by the band; labels sit inside it. */}
                <rect x={gardenX} y={gardenY} width={gardenW} height={gardenH} fill={PAPER} stroke={INK} strokeWidth="2" />
                <SideLabel x={gardenX + gardenW / 2} y={gardenY + 13} text={`${length} ${unit}`} />
                <SideLabel x={gardenX + 16} y={gardenY + gardenH / 2 + 4} text={`${width} ${unit}`} />
            </svg>
        </DiagramRoot>
    );
}

// Kind dispatch (DataDiagram's early-return idiom — the union is fixed, so
// exhaustive branches need no switch machinery).
export function RectangleDiagram({ figure }: { figure: PerimeterAreaFigure }) {
    if (figure.kind === 'lshape') return <LShapeFigure figure={figure} />;
    if (figure.kind === 'path') return <PathFigure figure={figure} />;
    return <RectangleFigure figure={figure} />;
}
