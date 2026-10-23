// ShapesWorksheet supplies the named shapes via types.ts's ShapeFigure[].
// This renderer draws each shape GEOMETRICALLY ACCURATE (the catalogue the
// generator offers) with its label underneath; it never counts sides,
// corners, faces or answers any comparison — those stay private problem data.
// (Shared by the PageStack preview and the .print-doc tree.)
//
// COLOURS (T6 theme fix): every shape card fill rides the shared
// --paper-diagram token (pale grey light / deep slate dark); print pins the
// legacy #f2f2f2.
import React from 'react';
import { styledComponent } from '@presource/react';
import type { ShapeFigure } from './types';

// Spans keep this valid inside PrintableSheet's illustrated ProblemText
// (the same nesting constraint ShapeTransformationDiagram.tsx works under).
//
// SIZE (R2): cards are 72px wide — the outline is large enough to shade/label
// by hand, and three candidates + gaps (3×72 + 2×10 = 236px) fit the 665px
// single-column sheet, so the current 5-per-page density never wraps a row
// (figure + two wrapped prompt lines ≈ 141.2px in a 163.6px row).
// The 40-unit viewBox is unchanged: every stroke renders at ~2.7px and every
// proportion is resolution-independent.
const DiagramRoot = styledComponent('span', {
    display: 'flex',
    width: 'fit-content',
    maxWidth: '100%',
    gap: '10px',
    marginTop: '6px',
    alignItems: 'flex-start',
    whiteSpace: 'normal'
});

const DiagramCard = styledComponent('span', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '72px',
    flex: '0 0 72px',
    gap: '3px'
});

// Explicit 17px label line so inherited worksheet line heights can't enlarge it.
const CardLabel = styledComponent('span', {
    fontSize: '13px',
    lineHeight: '17px',
    fontWeight: 600
});

// 2-D outlines in a 40×40 viewBox (positive y down, as in SVG). Each returns
// the EXACT element(s) — no derived coordinates.
function shape2d(name: string) {
    switch (name) {
        case 'circle':
            return <circle cx="20" cy="20" r="16" fill="var(--paper-diagram)" stroke="var(--paper-ink)" strokeWidth="1.5" />;
        case 'oval':
            return <ellipse cx="20" cy="20" rx="16" ry="10" fill="var(--paper-diagram)" stroke="var(--paper-ink)" strokeWidth="1.5" />;
        case 'triangle':
            return <polygon points="20,4 36,34 4,34" fill="var(--paper-diagram)" stroke="var(--paper-ink)" strokeWidth="1.5" strokeLinejoin="round" />;
        case 'square':
            return <rect x="6" y="6" width="28" height="28" fill="var(--paper-diagram)" stroke="var(--paper-ink)" strokeWidth="1.5" />;
        case 'rectangle':
            return <rect x="2" y="10" width="36" height="20" fill="var(--paper-diagram)" stroke="var(--paper-ink)" strokeWidth="1.5" />;
        case 'hexagon':
            return <polygon points="20,3 34.7,11.5 34.7,28.5 20,37 5.3,28.5 5.3,11.5" fill="var(--paper-diagram)" stroke="var(--paper-ink)" strokeWidth="1.5" strokeLinejoin="round" />;
        default:
            // Every 2-D name the generator offers has a case above; a foreign
            // name degrades to a plain outlined square so the card still prints.
            return <rect x="6" y="6" width="28" height="28" fill="var(--paper-diagram)" stroke="var(--paper-ink)" strokeWidth="1.5" />;
    }
}

// 3-D solids as monochrome line drawings (same 40×40 viewBox).
function shape3d(name: string) {
    const stroke = 'var(--paper-ink)';
    const fill = 'var(--paper-diagram)';
    switch (name) {
        case 'cube':
            // Isometric-style wireframe: front + back square, 4 corner joins.
            return (
                <g stroke={stroke} strokeWidth="1.5" fill="none">
                    <rect x="5" y="15" width="18" height="18" fill={fill} />
                    <rect x="17" y="5" width="18" height="18" fill={fill} />
                    <line x1="5" y1="15" x2="17" y2="5" />
                    <line x1="23" y1="15" x2="35" y2="5" />
                    <line x1="5" y1="33" x2="17" y2="23" />
                    <line x1="23" y1="33" x2="35" y2="23" />
                </g>
            );
        case 'prism':
            // Triangular prism: front triangle, back triangle (+10, -8), 3 joins.
            return (
                <g stroke={stroke} strokeWidth="1.5" fill="none">
                    <polygon points="5,15 5,33 21,33" fill={fill} />
                    <polygon points="15,7 15,25 31,25" fill={fill} />
                    <line x1="5" y1="15" x2="15" y2="7" />
                    <line x1="5" y1="33" x2="15" y2="25" />
                    <line x1="21" y1="33" x2="31" y2="25" />
                </g>
            );
        case 'pyramid':
            // Square-based pyramid: diamond base + apex with 4 edge lines.
            return (
                <g stroke={stroke} strokeWidth="1.5">
                    <polygon points="8,28 20,34 32,28 20,22" fill={fill} />
                    <line x1="20" y1="7" x2="8" y2="28" />
                    <line x1="20" y1="7" x2="32" y2="28" />
                    <line x1="20" y1="7" x2="20" y2="34" />
                    <line x1="20" y1="7" x2="20" y2="34" />
                    <circle cx="20" cy="7" r="1.5" fill={stroke} />
                </g>
            );
        case 'cylinder':
            // Top ellipse, two side lines, bottom arc.
            return (
                <g stroke={stroke} strokeWidth="1.5">
                    <ellipse cx="20" cy="8" rx="12" ry="5" fill={fill} />
                    <line x1="8" y1="8" x2="8" y2="32" />
                    <line x1="32" y1="8" x2="32" y2="32" />
                    <path d="M8,32 A12,5 0 0,0 32,32" fill={fill} />
                </g>
            );
        case 'cone':
            // Apex, tangent side lines, base ellipse (front arc only).
            return (
                <g stroke={stroke} strokeWidth="1.5">
                    <ellipse cx="20" cy="32" rx="14" ry="5" fill={fill} />
                    <line x1="20" y1="6" x2="6" y2="32" />
                    <line x1="20" y1="6" x2="34" y2="32" />
                    <circle cx="20" cy="6" r="1.5" fill={stroke} />
                </g>
            );
        case 'sphere':
            // Outline + equator ellipse.
            return (
                <g stroke={stroke} strokeWidth="1.5">
                    <circle cx="20" cy="20" r="16" fill={fill} />
                    <ellipse cx="20" cy="20" rx="16" ry="6" fill="none" />
                </g>
            );
        default:
            // Every 3-D name the generator offers has a case above.
            return <circle cx="20" cy="20" r="16" fill={fill} stroke={stroke} strokeWidth="1.5" />;
    }
}

// readonly: the generator hands the option order as a frozen array; a const
// prop keeps that ownership contract in the type (no copy made internally).
export function ShapeFigures({ shapes }: { shapes: readonly ShapeFigure[] }) {
    // Keep the plugin's option order untouched; every card is styled the same
    // way so no candidate stands out (the answer is the private data).
    return (
        <DiagramRoot>
            {shapes.map((shape, index) => (
                <DiagramCard key={`${shape.name}-${index}`}>
                    <svg
                        width="72px"
                        height="72px"
                        viewBox="0 0 40 40"
                        role="img"
                        // The label is the option's name (printed under the
                        // card); the accessible name repeats it, nothing more.
                        aria-label={`shape ${shape.name}`}
                    >
                        {shape.kind === '3d' ? shape3d(shape.name) : shape2d(shape.name)}
                    </svg>
                    <CardLabel>{shape.name}</CardLabel>
                </DiagramCard>
            ))}
        </DiagramRoot>
    );
}
