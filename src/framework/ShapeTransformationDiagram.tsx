// ShapeTransformationsWorksheet supplies the geometry via types.ts's
// ShapeTransformationFigure. This renderer never calculates a transform or
// receives an answer; SVG's positive-down y axis already matches the data.
//
// COLOURS (T6 theme fix): the polygon fill rides the shared --paper-diagram
// token (pale grey light / deep slate dark); print pins the legacy #f2f2f2.
import React from 'react';
import { arrayCreate } from '@presource/core';
import { styledComponent } from '@presource/react';
import type { ShapeTransformationFigure } from './types';

// Spans keep this valid inside PrintableSheet's ProblemText span.
//
// SIZE (R2): five 88px cards plus four 8px gaps (472px) fit the ~703px
// single-column sheet with room to spare, and at 88px the outlines are large
// enough to compare, shade and label by hand. The viewBox stays '-4 -4 8 8'
// so the pinned guide markup (MathsDashboard.test.tsx byte-pins the dashed
// line/centre dot) and every polygon coordinate render UNCHANGED — only the
// display size grows, which also thickens the 0.18-unit outline to ~2.6px.
const DiagramRoot = styledComponent('span', {
    display: 'flex',
    width: 'fit-content',
    maxWidth: '100%',
    gap: '8px',
    marginTop: '6px',
    alignItems: 'flex-start',
    whiteSpace: 'normal'
});

const DiagramCard = styledComponent('span', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '88px',
    flex: '0 0 88px',
    gap: '3px'
});

// An explicit 17px label line plus the 3px gap and 88px SVG totals 108px;
// inherited worksheet line heights must not enlarge the printed cards.
const CardLabel = styledComponent('span', {
    fontSize: '14px',
    lineHeight: '17px',
    fontWeight: 600
});

export function ShapeTransformationDiagram({ figure }: { figure: ShapeTransformationFigure }) {
    // Keep the plugin's candidate order and readonly vertices untouched. The
    // original uses the same outline styling, so no option is singled out.
    const cards = [{ label: 'Original', points: figure.original }, ...figure.options];
    return (
        <DiagramRoot>
            {cards.map(({ label, points }, index) => (
                <DiagramCard key={index}>
                    <CardLabel>{label}</CardLabel>
                    <svg
                        width="88px"
                        height="88px"
                        viewBox="-4 -4 8 8"
                        role="img"
                        aria-label={index === 0 ? `Original ${figure.name}` : `Option ${label}`}
                    >
                        {/* Format only: no vertex sorting, coordinate changes,
                            or inferred closing point on these SVG polygons. */}
                        <polygon
                            points={arrayCreate(({ index: pointIndex }) => points[pointIndex]?.join(',')).join(' ')}
                            fill="var(--paper-diagram)"
                            stroke="var(--paper-ink)"
                            strokeWidth="0.18"
                            strokeLinejoin="round"
                        />
                        {/* Guides overlay the ORIGINAL so they remain visible
                            through its light fill; candidates have none. */}
                        {index === 0 && figure.guide !== 'centre' && (
                            <line
                                x1={figure.guide === 'vertical' ? '0' : '-4'}
                                y1={figure.guide === 'vertical' ? '-4' : '0'}
                                x2={figure.guide === 'vertical' ? '0' : '4'}
                                y2={figure.guide === 'vertical' ? '4' : '0'}
                                stroke="var(--paper-ink)"
                                strokeWidth="0.12"
                                strokeDasharray="0.4 0.3"
                            />
                        )}
                        {index === 0 && figure.guide === 'centre' && (
                            <circle cx="0" cy="0" r="0.2" fill="var(--paper-ink)" />
                        )}
                    </svg>
                </DiagramCard>
            ))}
        </DiagramRoot>
    );
}
