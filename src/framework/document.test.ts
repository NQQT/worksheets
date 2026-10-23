// Unit tests for the framework's document assembly (buildDocument /
// generateSheet / generateDocument).
//
// Strategy: the chunker is DETERMINISTIC given a spec + seed, so the exact
// page layout (counts, continuous ids, empty-document gating) is pinned here
// with a throwaway inline spec. The REAL worksheet streams (exact prompts and
// answers per grade) are pinned in each worksheet plugin's own test file.

import { describe, it, expect } from 'vitest';
import { arrayCreate } from '@presource/core';
import { createRng, type Rng } from './rng';
import { getMathGradeConfig } from './catalogue';
import { buildDocument, generateDocument, generateSheet, type Problem } from './document';
import type { PerimeterAreaFigure, RowsColumnsFigure, ShapeTransformationFigure, WorksheetSpec } from './types';

const g1 = getMathGradeConfig(1);

// A fully deterministic throwaway spec: problem i is "i + 1 = __" and ignores
// the rng entirely, so the expected pages are trivially exact. perPage 24
// mirrors the real compact worksheets.
const fakeSpec: WorksheetSpec = {
    id: 'fake',
    label: 'Fake',
    icon: '*',
    perPage: 24,
    offered: () => true,
    scope: () => 'fake',
    generate: (_rng: Rng, _caps: unknown, count: number) =>
        Array.from({ length: count }, (_, i) => ({
            prompt: `${i} + 1 = __`,
            answer: `${i + 1}`
        }))
};

// Same spec but never offered — pins the "grade does not offer this worksheet"
// gating without depending on any real plugin.
const neverOffered: WorksheetSpec = { ...fakeSpec, id: 'never', offered: () => false };

function toProblem(id: number): Problem {
    return { id, type: 'fake', prompt: `${id - 1} + 1 = __`, answer: `${id}` };
}

describe('buildDocument — multi-page worksheets', () => {
    // A 2-page document is ONE stream of 2×perPage problems chunked into
    // pages — so page 1 must be byte-identical to the single-page sheet.
    it('page 1 of a 2-page document equals the single-page sheet', () => {
        const two = generateDocument(fakeSpec, g1, 12345, 2);
        expect(two.pages).toHaveLength(2);
        expect(two.total).toBe(48);
        expect(two.pages[0]).toEqual(generateSheet(fakeSpec, g1, 12345));
    });

    // Problem ids must run continuously across page boundaries (1..72 for a
    // 3-page sheet), so printed pages read as one numbered set.
    it('problem ids run continuously across pages', () => {
        const doc = generateDocument(fakeSpec, g1, 12345, 3);
        expect(doc.pages).toHaveLength(3);
        expect(doc.total).toBe(72);
        expect(doc.pages.flat().map((p) => p.id)).toEqual(Array.from({ length: 72 }, (_, i) => i + 1));
        // Page boundaries land exactly after every 24 (spec.perPage).
        expect(doc.pages[2][0]).toEqual(toProblem(49));
        expect(doc.pages[2][23]).toEqual(toProblem(72));
    });

    it('stamps every problem with the owning worksheet id', () => {
        const sheet = generateSheet(fakeSpec, g1, 12345);
        expect(sheet).toHaveLength(24);
        expect(sheet.every((p) => p.type === 'fake')).toBe(true);
    });

    it('returns an empty document for an unimplemented grade', () => {
        // Grade 7 is not implemented (see framework/grades.ts) regardless of
        // the spec's own offered() verdict. (Grades 3..6 are implemented —
        // the addition ladder.)
        expect(generateSheet(fakeSpec, getMathGradeConfig(7), 12345)).toEqual([]);
    });

    it('returns an empty document for a worksheet the grade does not offer', () => {
        expect(generateSheet(neverOffered, g1, 12345)).toEqual([]);
    });

    it('returns an empty document for a bogus page count', () => {
        expect(generateDocument(fakeSpec, g1, 12345, 0)).toEqual({ pages: [], total: 0 });
        expect(buildDocument(fakeSpec, g1, 12345, -1)).toEqual({ pages: [], total: 0 });
    });

    it('uses the provided seed through the real rng (same seed => same sheet)', () => {
        const a = generateSheet(fakeSpec, g1, createRng(1) && 777);
        const b = generateSheet(fakeSpec, g1, 777);
        expect(a).toEqual(b);
    });

    it('carries an optional clock figure through id stamping and chunking', () => {
        // Problems may attach a ClockFigure (analog clock drawn by the sheet
        // renderer); the chunker must spread it through verbatim — including
        // the hands: false blank-face variant.
        const clockSpec: WorksheetSpec = {
            ...fakeSpec,
            id: 'clocky',
            generate: (_rng, _caps, count) =>
                Array.from({ length: count }, (_, i) => ({
                    prompt: 'What time is shown?__',
                    answer: `${i} o'clock`,
                    clock: i % 2 === 0 ? { hour: i + 1, minute: 30 } : { hour: 3, minute: 0, hands: false }
                }))
        };
        const doc = generateDocument(clockSpec, g1, 42, 2);
        expect(doc.pages[0][0]).toEqual({
            id: 1,
            type: 'clocky',
            prompt: 'What time is shown?__',
            answer: "0 o'clock",
            clock: { hour: 1, minute: 30 }
        });
        // Page-2 item keeps BOTH the continuous id and its figure (item 25 =
        // i 24, even => drawn-hands variant { hour: 25, minute: 30 }).
        expect(doc.pages[1][0].clock).toEqual({ hour: 25, minute: 30 });
        expect(doc.pages[1][0].id).toBe(25);
    });

    it('preserves shape vertices, guide and option order across page boundaries', () => {
        // Figure data belongs to the plugin, not the chunker. Two-question
        // pages expose both continuous ids and unchanged figure metadata;
        // ShapeTransformationDiagram.test.tsx covers the rendering contract.
        const figure: ShapeTransformationFigure = {
            name: 'triangle',
            original: [[-2, -2], [2, -2], [-2, 1]],
            guide: 'vertical',
            options: [
                { label: 'A', points: [[2, -2], [-2, -2], [2, 1]] },
                { label: 'B', points: [[-2, -2], [2, -2], [-2, 1]] }
            ]
        };
        const shapeSpec: WorksheetSpec = {
            ...fakeSpec,
            id: 'shape-figure',
            perPage: 2,
            generate: (_rng, _caps, count) => arrayCreate(({ index }) => index < count ? {
                prompt: `Flip triangle ${index + 1}. __`,
                answer: 'A',
                shapeTransformation: figure
            } : undefined)
        };
        expect(generateDocument(shapeSpec, g1, 42, 2)).toEqual({
            pages: [
                [
                    { id: 1, type: 'shape-figure', prompt: 'Flip triangle 1. __', answer: 'A', shapeTransformation: figure },
                    { id: 2, type: 'shape-figure', prompt: 'Flip triangle 2. __', answer: 'A', shapeTransformation: figure }
                ],
                [
                    { id: 3, type: 'shape-figure', prompt: 'Flip triangle 3. __', answer: 'A', shapeTransformation: figure },
                    { id: 4, type: 'shape-figure', prompt: 'Flip triangle 4. __', answer: 'A', shapeTransformation: figure }
                ]
            ],
            total: 4
        });
    });

    it('carries a rows/columns grid figure verbatim across page boundaries', () => {
        // The grid dimensions belong to the plugin (RowsColumnsWorksheet.ts);
        // the chunker must not recompute, round or drop them — same contract
        // as the clock figure above.
        const figure: RowsColumnsFigure = { rows: 3, cols: 4 };
        const gridSpec: WorksheetSpec = {
            ...fakeSpec,
            id: 'grid-figure',
            perPage: 2,
            generate: (_rng, _caps, count) => arrayCreate(({ index }) => index < count ? {
                prompt: `Grid ${index + 1}. __`,
                answer: '12',
                rowsColumns: figure
            } : undefined)
        };
        expect(generateDocument(gridSpec, g1, 42, 2)).toEqual({
            pages: [
                [
                    { id: 1, type: 'grid-figure', prompt: 'Grid 1. __', answer: '12', rowsColumns: { rows: 3, cols: 4 } },
                    { id: 2, type: 'grid-figure', prompt: 'Grid 2. __', answer: '12', rowsColumns: { rows: 3, cols: 4 } }
                ],
                [
                    { id: 3, type: 'grid-figure', prompt: 'Grid 3. __', answer: '12', rowsColumns: { rows: 3, cols: 4 } },
                    { id: 4, type: 'grid-figure', prompt: 'Grid 4. __', answer: '12', rowsColumns: { rows: 3, cols: 4 } }
                ]
            ],
            total: 4
        });
    });

    it('carries a perimeter/area figure verbatim across page boundaries', () => {
        // The L-shape measurements belong to the plugin (PerimeterAreaWorksheet,
        // drawn by RectangleDiagram.tsx); the chunker must not recompute, round
        // or drop them — same contract as the clock, shape and grid figures.
        const figure: PerimeterAreaFigure = {
            kind: 'lshape',
            first: { length: 6, width: 5 },
            second: { length: 4, width: 2 },
            unit: 'cm'
        };
        const perimeterSpec: WorksheetSpec = {
            ...fakeSpec,
            id: 'perimeter-figure',
            perPage: 2,
            generate: (_rng, _caps, count) => arrayCreate(({ index }) => index < count ? {
                prompt: `L-shape ${index + 1}. __`,
                answer: '30',
                perimeterArea: figure
            } : undefined)
        };
        expect(generateDocument(perimeterSpec, g1, 42, 2)).toEqual({
            pages: [
                [
                    { id: 1, type: 'perimeter-figure', prompt: 'L-shape 1. __', answer: '30', perimeterArea: figure },
                    { id: 2, type: 'perimeter-figure', prompt: 'L-shape 2. __', answer: '30', perimeterArea: figure }
                ],
                [
                    { id: 3, type: 'perimeter-figure', prompt: 'L-shape 3. __', answer: '30', perimeterArea: figure },
                    { id: 4, type: 'perimeter-figure', prompt: 'L-shape 4. __', answer: '30', perimeterArea: figure }
                ]
            ],
            total: 4
        });
        // Every row — including both sides of the page boundary — carries the
        // SAME object the generator produced (buildDocument's spread passes the
        // reference through untouched, so no recompute happens).
        expect(generateDocument(perimeterSpec, g1, 42, 2).pages[0][1].perimeterArea).toBe(figure);
        expect(generateDocument(perimeterSpec, g1, 42, 2).pages[1][0].perimeterArea).toBe(figure);
    });
});
