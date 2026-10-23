// Unit tests for the MULTIPLICATION worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). DEPTH-FIRST SHEET: eight CONNECTED
// multi-part tasks per page (switch / diff / missing-pair / verify / grid /
// step families); answers list the blank values IN PRINTED ORDER, comma
// separated. Years 2 and 3 both keep tables to 10; Prep, Year 1 and Years
// 4..12 must produce empty sheets (see framework/grades.test.ts for the
// complete later-grade configurations).

import { createElement, useEffect } from 'react';
import { cleanup, render } from '@testing-library/react';
import { arrayCreate, arrayEach } from '@presource/core';
import { describe, it, expect, afterEach } from 'vitest';
import {
    seedFrom, getMathGradeConfig, generateSheet, generateDocument,
    MATH_FRAMEWORK, DashboardContextProvider, useDashboardSession
} from '../../framework';
import { multiplicationSpec, MultiplicationWorksheet } from './MultiplicationWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);
const g3 = getMathGradeConfig(3);

afterEach(cleanup);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(multiplicationSpec, grade, seedFrom([grade.id, multiplicationSpec.id, 0]));
}

describe('multiplication plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(multiplicationSpec.id).toBe('mult');
        expect(multiplicationSpec.label).toBe('Multiplication');
        expect(multiplicationSpec.icon).toBe('×');
        // Depth-first: six connected tasks per A4 page (T3M3: 8 rows clipped
        // the array-figure worst case — see plugins/layout-capacity.test.ts).
        expect(multiplicationSpec.perPage).toBe(6);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(multiplicationSpec.scope(g2)).toBe('times tables to 10');
        expect(multiplicationSpec.scope(g3)).toBe('times tables to 10');
    });

    it('renders the exact Year 3 toolbar subtitle with enabled controls', () => {
        // Exercise worksheet-kit.tsx through this factory alone; registration
        // in plugins/index.ts and dashboard integration are separate concerns.
        const plugin = MultiplicationWorksheet(MATH_FRAMEWORK);
        function Year3Toolbar() {
            const session = useDashboardSession();
            useEffect(() => {
                session.level = 4;
            }, [session]);
            return createElement(plugin.toolbar!, {
                context: { pluginId: plugin.id, entryId: plugin.id, store: {}, entries: plugin.entries }
            });
        }
        const view = render(createElement(DashboardContextProvider, null, createElement(Year3Toolbar)));
        // ONE TITLE FORMAT: "<Label> level <requested>"; the subtitle is the
        // bare scope (the title now carries the label).
        expect(view.getByTestId('toolbar-title').textContent).toBe('Multiplication level 4');
        expect(view.getByText('times tables to 10')).toBeDefined();
        expect(view.getByTestId('toolbar-randomize').getAttribute('aria-disabled')).toBeNull();
        expect(view.getByTestId('toolbar-print').getAttribute('aria-disabled')).toBeNull();
    });
});

describe('multiplication — availability gating', () => {
    it('Prep and Year 1 do not offer times tables (empty sheets)', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toEqual([]);
    });

    it('offers Years 2 and 3 through the sidebar gate without enabling later grades', () => {
        const plugin = MultiplicationWorksheet(MATH_FRAMEWORK);
        const gates: [boolean, boolean | undefined][] = [];
        // Grade order 0..12: each pair pins the spec gate and factory sidebar
        // gate independently; empty output is tested separately below.
        arrayEach([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], ({ value: id }) => {
            const grade = getMathGradeConfig(id);
            gates.push([multiplicationSpec.offered(grade), plugin.isOffered?.(grade)]);
        });
        expect(gates).toEqual([
            [false, false],
            [false, false],
            [true, true],
            [true, true],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false],
            [false, false]
        ]);
    });

    // Explicit unoffered grades avoid deriving expected emptiness from the
    // gate being tested; both single-sheet and multi-page outputs are exact.
    it.each([0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12])('grade %i produces no multiplication document', (id) => {
        const grade = getMathGradeConfig(id);
        expect(sheet(grade)).toEqual([]);
        expect(generateDocument(multiplicationSpec, grade, seedFrom([id, 'mult', 0]), 2))
            .toEqual({ pages: [], total: 0 });
    });
});

describe('multiplication - Year 3 (times tables to 10)', () => {
    it('matches the exact Year 3 sheet using the unchanged Year 2 fact space', () => {
        // grades.ts changes only availability and multCap; the connected
        // families (diff / missing-pair / verify / grid / switch / step) and
        // their pinned answers stay intact.
        const s = sheet(g3);
        expect(s).toEqual([
            {"prompt":"6 × 3 = __ and 6 × 1 = __; the products differ by __","answer":"18, 6, 12","id":1,"type":"mult"},
            {"prompt":"__ × 9 = 63 and 6 × __ = 48","answer":"7, 8","id":2,"type":"mult"},
            {"prompt":"True or false: 6 × 1 = 7. __; if it is wrong, fix it: 6 × 1 = __","answer":"Wrong, 6","wideBlanks":true,"id":3,"type":"mult"},
            {"prompt":"The grid shows __ rows of __ squares; the total is __","answer":"4, 2, 8","rowsColumns":{"rows":4,"cols":2},"id":4,"type":"mult"},
            {"prompt":"4 × 1 = __ and 1 × 4 = __","answer":"4, 4","id":5,"type":"mult"},
            {"prompt":"6 × 1 = __ and 6 × 2 = __","answer":"6, 12","id":6,"type":"mult"},
        ]);
        // The grid row is the only figure-backed task: its three blanks must
        // match the printed rowsColumns exactly (rows, cols, rows*cols).
        const grid = s[3];
        expect(grid.rowsColumns).toEqual({ rows: 4, cols: 2 });
        expect(grid.answer).toBe('4, 2, 8');
    });

    it('continues the exact stream on page 2 with unique prompts and continuous ids', () => {
        const seed = seedFrom([3, 'mult', 0]);
        const doc = generateDocument(multiplicationSpec, g3, seed, 2);
        expect(doc.total).toBe(12);
        expect(doc.pages.map((page) => page.length)).toEqual([6, 6]);
        expect(doc.pages[0]).toEqual(sheet(g3));
        expect(doc.pages[1]).toEqual([
            {"prompt":"6 × 3 = __ and 6 × 7 = __; the products differ by __","answer":"18, 42, 24","id":7,"type":"mult"},
            {"prompt":"__ × 5 = 50 and 7 × __ = 63","answer":"10, 9","id":8,"type":"mult"},
            {"prompt":"The grid shows __ rows of __ squares; the total is __","answer":"3, 4, 12","rowsColumns":{"rows":3,"cols":4},"id":9,"type":"mult"},
            {"prompt":"True or false: 7 × 5 = 28. __; if it is wrong, fix it: 7 × 5 = __","answer":"Wrong, 35","wideBlanks":true,"id":10,"type":"mult"},
            {"prompt":"8 × 1 = __ and 8 × 2 = __","answer":"8, 16","id":11,"type":"mult"},
            {"prompt":"6 × 2 = __ and 2 × 6 = __","answer":"12, 12","id":12,"type":"mult"},
        ]);
        // The arrayCreate factory stops at undefined, yielding exactly ids 1..12.
        expect(doc.pages.flat().map((p) => p.id)).toEqual(arrayCreate(({ index }) => index < 12 ? index + 1 : undefined));
        // Uniqueness is keyed on the printed TASK, not just the sentence: the
        // two grid rows share the generic grid prompt but carry different
        // figures (4x2 vs 3x4), so the figure joins the key.
        expect(new Set(doc.pages.flat().map((p) => `${p.prompt}|${JSON.stringify(p.rowsColumns ?? '')}`)).size).toBe(12);
        expect(generateDocument(multiplicationSpec, g3, seed, 3).pages.slice(0, 2)).toEqual(doc.pages);
    });

    it('repeats identical seeds and pins a fresh deterministic refresh stream', () => {
        const seed = seedFrom([3, 'mult', 0]);
        const refreshedSeed = seedFrom([3, 'mult', 1]);
        const doc = generateDocument(multiplicationSpec, g3, seed, 2);
        const refreshed = generateDocument(multiplicationSpec, g3, refreshedSeed, 2);
        expect(generateDocument(multiplicationSpec, g3, seed, 2)).toEqual(doc);
        expect(refreshed.pages[0].slice(0, 3)).toEqual([
            {"prompt":"The grid shows __ rows of __ squares; the total is __","answer":"5, 3, 15","rowsColumns":{"rows":5,"cols":3},"id":1,"type":"mult"},
            {"prompt":"8 × 8 = __ and 8 × 9 = __","answer":"64, 72","id":2,"type":"mult"},
            {"prompt":"True or false: 7 × 9 = 70. __; if it is wrong, fix it: 7 × 9 = __","answer":"Wrong, 63","wideBlanks":true,"id":3,"type":"mult"},
        ]);
        expect(refreshed.total).toBe(12);
        expect(refreshed).not.toEqual(doc);
        expect(generateDocument(multiplicationSpec, g3, refreshedSeed, 2)).toEqual(refreshed);
        // The same cap and seed yield the same fact stream in Years 2 and 3;
        // the usual grade-specific seeds produce their different pinned sheets.
        expect(generateDocument(multiplicationSpec, g2, seed, 2)).toEqual(doc);
    });
});

describe('multiplication — Year 2 (times tables to 10)', () => {
    it('matches the exact Grade 2 times-tables sheet (operands <= 10)', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"__ × 6 = 54 and 7 × __ = 42","answer":"9, 6","id":1,"type":"mult"},
            {"prompt":"1 × 9 = __ and 1 × 5 = __; the products differ by __","answer":"9, 5, 4","id":2,"type":"mult"},
            {"prompt":"The grid shows __ rows of __ squares; the total is __","answer":"2, 3, 6","rowsColumns":{"rows":2,"cols":3},"id":3,"type":"mult"},
            {"prompt":"5 × 4 = __ and 5 × 5 = __","answer":"20, 25","id":4,"type":"mult"},
            {"prompt":"True or false: 9 × 7 = 63. __; if it is wrong, fix it: 9 × 7 = __","answer":"Correct, 63","wideBlanks":true,"id":5,"type":"mult"},
            {"prompt":"10 × 1 = __ and 1 × 10 = __","answer":"10, 10","id":6,"type":"mult"},
        ]);
        // Every printed factor stays within the times-tables cap and every
        // stated product is a correct fact. The missing-pair row (id 1) and
        // the grid row (id 3) are verified against their own blanks.
        for (const p of s) {
            for (const m of p.prompt.matchAll(/(\d+) × (\d+) = (\d+)/g)) {
                expect(Number(m[1])).toBeLessThanOrEqual(10);
                expect(Number(m[2])).toBeLessThanOrEqual(10);
                expect(Number(m[3])).toBe(Number(m[1]) * Number(m[2]));
            }
        }
        // id 1: "__ × 6 = 54 and 7 × __ = 42" -> 9 and 6 complete both facts.
        expect(s[0].answer).toBe('9, 6');
        // id 3: the grid blanks are rows, cols and the total rows*cols.
        expect(s[2].rowsColumns).toEqual({ rows: 2, cols: 3 });
        expect(s[2].answer).toBe('2, 3, 6');
    });

    it('Grade 2 multiplication, 2 pages, continues the exact stream on page 2', () => {
        const doc = generateDocument(multiplicationSpec, g2, seedFrom([2, 'mult', 0]), 2);
        expect(doc.pages).toHaveLength(2);
        expect(doc.total).toBe(12);
        // Pinned head of the page-2 stream (ids 7, 8, 9 — page 2 now starts
        // at id 7 at the six-per-page density).
        expect(doc.pages[1].slice(0, 3)).toEqual([
            {"prompt":"2 × 5 = __ and 2 × 6 = __","answer":"10, 12","id":7,"type":"mult"},
            {"prompt":"8 × 2 = __ and 2 × 8 = __","answer":"16, 16","id":8,"type":"mult"},
            {"prompt":"True or false: 1 × 3 = 3. __; if it is wrong, fix it: 1 × 3 = __","answer":"Correct, 3","wideBlanks":true,"id":9,"type":"mult"},
        ]);
        // Page 1 still equals the single-page sheet (stream is one continuous run).
        expect(doc.pages[0]).toEqual(sheet(g2));
    });
});
