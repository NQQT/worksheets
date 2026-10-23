// Unit tests for the SUBTRACTION worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])).
//
// DEPTH-FIRST SHEET: eight CONNECTED multi-part tasks per page (single
// column); answers list the blank values IN PRINTED ORDER, comma separated
// (partner / diff / verify / column / multi families).
//
// The DIFFICULTY LADDER is pinned here too: grades 0..6 each get their own
// sheet (operand cap scaling one digit per year — see framework/grades.ts,
// arithmeticLadderGrade, shared with the Addition plugin), multi-subtrahend
// questions join from Year 4, and grade 7 upwards offers no subtraction at
// all.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, generateDocument } from '../../framework';
import { subtractionSpec } from './SubtractionWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);
const g3 = getMathGradeConfig(3);
const g4 = getMathGradeConfig(4);
const g5 = getMathGradeConfig(5);
const g6 = getMathGradeConfig(6);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(subtractionSpec, grade, seedFrom([grade.id, subtractionSpec.id, 0]));
}

// Recompute every FULLY PRINTED "a - b" minuend/subtrahend pair in a prompt:
// the ladder guarantees a strictly positive difference (1 <= b < a), so each
// printed pair must satisfy a > b regardless of where the blanks sit.
function assertPositivePairs(prompt: string) {
    for (const m of prompt.matchAll(/(\d+) - (\d+)/g)) {
        expect(Number(m[1])).toBeGreaterThan(Number(m[2]));
    }
}

describe('subtraction plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(subtractionSpec.id).toBe('subtraction');
        expect(subtractionSpec.label).toBe('Subtraction');
        expect(subtractionSpec.icon).toBe('−');
        // Depth-first: seven connected tasks, one column, full-page rows
        // (T3M3: 8 rows clipped the column-figure worst case — see
        // plugins/layout-capacity.test.ts).
        expect(subtractionSpec.perPage).toBe(7);
        expect(subtractionSpec.singleColumn).toBe(true);
    });

    it('describes its numeric scope from the grade caps', () => {
        // Pair grades: plain "within N" (the multi-subtrahend suffix is
        // reserved for grades whose addendCap exceeds 2 — ladder pins below).
        expect(subtractionSpec.scope(g0)).toBe('within 10');
        expect(subtractionSpec.scope(g1)).toBe('within 20');
        expect(subtractionSpec.scope(g2)).toBe('within 100');
        expect(subtractionSpec.scope(g3)).toBe('within 1000');
        // Multi-subtrahend grades advertise the second difficulty axis (the
        // ladder's term cap minus the minuend = max subtrahends).
        expect(subtractionSpec.scope(g4)).toBe('within 10000 (up to 2 subtrahends)');
        expect(subtractionSpec.scope(g5)).toBe('within 100000 (up to 2 subtrahends)');
        expect(subtractionSpec.scope(g6)).toBe('within 1000000 (up to 3 subtrahends)');
    });

    it('is gated by the grade catalogue (offered 0..6, hidden from Year 7)', () => {
        expect(subtractionSpec.offered(g0)).toBe(true);
        expect(subtractionSpec.offered(g1)).toBe(true);
        expect(subtractionSpec.offered(g2)).toBe(true);
        expect(subtractionSpec.offered(g3)).toBe(true);
        expect(subtractionSpec.offered(g4)).toBe(true);
        expect(subtractionSpec.offered(g5)).toBe(true);
        expect(subtractionSpec.offered(g6)).toBe(true);
        // Grade 7+ leaves subtraction behind entirely.
        expect(subtractionSpec.offered(getMathGradeConfig(7))).toBe(false);
        expect(subtractionSpec.offered(getMathGradeConfig(12))).toBe(false);
    });
});

describe('subtraction — Prep (grade 0)', () => {
    it('never yields a negative answer (exact sheet)', () => {
        const s = sheet(g0);
        expect(s).toEqual([
            {"prompt":"4 - 2 = __ and 5 - 4 = __; the differences differ by __","answer":"2, 1, 1","id":1,"type":"subtraction"},
            {"prompt":"3 - 2 = __ and __ + 2 = 3","answer":"1, 1","id":2,"type":"subtraction"},
            {"prompt":"True or false: 3 - 1 = 2. __; if it is wrong, fix it: 3 - 1 = __","answer":"Correct, 2","wideBlanks":true,"id":3,"type":"subtraction"},
            {"prompt":"5 - 4 = __ and __ + 4 = 5","answer":"1, 1","id":4,"type":"subtraction"},
            {"prompt":"True or false: 7 - 5 = 1. __; if it is wrong, fix it: 7 - 5 = __","answer":"Wrong, 2","wideBlanks":true,"id":5,"type":"subtraction"},
            {"prompt":"4 - 2 = __ and 9 - 8 = __; the differences differ by __","answer":"2, 1, 1","id":6,"type":"subtraction"},
            {"prompt":"True or false: 10 - 2 = 9. __; if it is wrong, fix it: 10 - 2 = __","answer":"Wrong, 8","wideBlanks":true,"id":7,"type":"subtraction"},
        ]);
        // Every printed pair subtracts a strictly smaller subtrahend, so no
        // negative difference can appear anywhere on the Prep sheet.
        for (const p of s) assertPositivePairs(p.prompt);
    });
});

describe('subtraction — Year 1', () => {
    it('matches the exact sheet (no negative results)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"3 - 1 = __ and __ + 1 = 3","answer":"2, 2","id":1,"type":"subtraction"},
            {"prompt":"20 - 10 = __ and 9 - 6 = __; the differences differ by __","answer":"10, 3, 7","id":2,"type":"subtraction"},
            {"prompt":"True or false: 19 - 3 = 17. __; if it is wrong, fix it: 19 - 3 = __","answer":"Wrong, 16","wideBlanks":true,"id":3,"type":"subtraction"},
            {"prompt":"4 - 3 = __ and __ + 3 = 4","answer":"1, 1","id":4,"type":"subtraction"},
            {"prompt":"2 - 1 = __ and 6 - 4 = __; the differences differ by __","answer":"1, 2, 1","id":5,"type":"subtraction"},
            {"prompt":"True or false: 9 - 5 = 6. __; if it is wrong, fix it: 9 - 5 = __","answer":"Wrong, 4","wideBlanks":true,"id":6,"type":"subtraction"},
            {"prompt":"12 - 8 = __ and 8 - 5 = __; the differences differ by __","answer":"4, 3, 1","id":7,"type":"subtraction"},
        ]);
        for (const p of s) assertPositivePairs(p.prompt);
    });
});

describe('subtraction — Year 2', () => {
    it('matches the exact sheet (within 100)', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"16 - 10 = __ and 42 - 17 = __; the differences differ by __","answer":"6, 25, 19","id":1,"type":"subtraction"},
            {"prompt":"True or false: 9 - 7 = 4. __; if it is wrong, fix it: 9 - 7 = __","answer":"Wrong, 2","wideBlanks":true,"id":2,"type":"subtraction"},
            {"prompt":"27 - 13 = __ and __ + 13 = 27","answer":"14, 14","id":3,"type":"subtraction"},
            {"prompt":"94 - 76 = __ and 19 - 4 = __; the differences differ by __","answer":"18, 15, 3","id":4,"type":"subtraction"},
            {"prompt":"27 - 1 = __ and __ + 1 = 27","answer":"26, 26","id":5,"type":"subtraction"},
            {"prompt":"True or false: 16 - 8 = 8. __; if it is wrong, fix it: 16 - 8 = __","answer":"Correct, 8","wideBlanks":true,"id":6,"type":"subtraction"},
            {"prompt":"98 - 52 = __ and 19 - 11 = __; the differences differ by __","answer":"46, 8, 38","id":7,"type":"subtraction"},
        ]);
        for (const p of s) assertPositivePairs(p.prompt);
    });
});

// ── The arithmetic ladder (Years 3..6) ───────────────────────────────────────
// Each year below pins the exact refresh-0 sheet, so the difficulty scaling
// (one more digit per year, multi-subtrahend from Year 4) cannot drift.
describe('subtraction — Year 3 (three-digit pairs)', () => {
    it('matches the exact sheet (within 1000, column tasks carry the figure)', () => {
        const s = sheet(g3);
        // Year 3 is the vertical-column grade (caps.opCap === 1000): COLUMN-
        // family tasks print a right-aligned column figure
        // (framework/ColumnDiagram.tsx) with the "−" marker before the
        // subtrahend — the answer is never drawn — then ask for the add-back
        // check. The figure repeats the printed terms.
        expect(s).toEqual([
            {"prompt":"Subtract, then check: 149 - 141 = __; check: 8 + 141 = __","answer":"8, 149","column":{"terms":[149,141],"op":"-"},"id":1,"type":"subtraction"},
            {"prompt":"556 - 130 = __ and __ + 130 = 556","answer":"426, 426","id":2,"type":"subtraction"},
            {"prompt":"103 - 62 = __ and 475 - 251 = __; the differences differ by __","answer":"41, 224, 183","id":3,"type":"subtraction"},
            {"prompt":"True or false: 904 - 22 = 881. __; if it is wrong, fix it: 904 - 22 = __","answer":"Wrong, 882","wideBlanks":true,"id":4,"type":"subtraction"},
            {"prompt":"Subtract, then check: 605 - 477 = __; check: 128 + 477 = __","answer":"128, 605","column":{"terms":[605,477],"op":"-"},"id":5,"type":"subtraction"},
            {"prompt":"227 - 58 = __ and __ + 58 = 227","answer":"169, 169","id":6,"type":"subtraction"},
            {"prompt":"384 - 143 = __ and 290 - 139 = __; the differences differ by __","answer":"241, 151, 90","id":7,"type":"subtraction"},
        ]);
        // Sanity: within 1000, positive differences, and (the Year-3-only
        // gate) every "Subtract, then check" row carries its column figure
        // with the printed terms.
        for (const p of s) {
            assertPositivePairs(p.prompt);
            for (const part of p.answer.split(', ')) {
                if (/^\d+$/.test(part)) expect(Number(part)).toBeLessThanOrEqual(1000);
            }
            if (p.prompt.startsWith('Subtract, then check:')) {
                expect(p.column).toEqual({ terms: expect.any(Array), op: '-' });
            }
        }
        // The column family appears on the Year-3 sheet (deck deals it).
        expect(s.filter((p) => p.column).length).toBe(2);
    });
});

describe('subtraction — Year 4 (four digits + multi-subtrahend joins)', () => {
    it('matches the exact sheet (within 10000, 1-2 subtrahends)', () => {
        const s = sheet(g4);
        expect(s).toEqual([
            {"prompt":"2667 - 2206 = __ and 4902 - 1667 = __; the differences differ by __","answer":"461, 3235, 2774","id":1,"type":"subtraction"},
            {"prompt":"1245 - 252 = __; check: 993 + 252 = __","answer":"993, 1245","id":2,"type":"subtraction"},
            {"prompt":"True or false: 3225 - 1272 = 1953. __; if it is wrong, fix it: 3225 - 1272 = __","answer":"Correct, 1953","wideBlanks":true,"id":3,"type":"subtraction"},
            {"prompt":"5439 - 4467 = __ and __ + 4467 = 5439","answer":"972, 972","id":4,"type":"subtraction"},
            {"prompt":"7323 - 5673 - 1573 = __; check: 77 + 1573 + 5673 = __","answer":"77, 7323","id":5,"type":"subtraction"},
            {"prompt":"True or false: 11 - 6 = 5. __; if it is wrong, fix it: 11 - 6 = __","answer":"Correct, 5","wideBlanks":true,"id":6,"type":"subtraction"},
            {"prompt":"7342 - 1800 = __ and __ + 1800 = 7342","answer":"5542, 5542","id":7,"type":"subtraction"},
        ]);
        // Sanity: within 10000, positive differences, and subtrahend counts
        // stay inside [1, 2] on the calculation side (before "; check:").
        for (const p of s) {
            assertPositivePairs(p.prompt);
            for (const part of p.answer.split(', ')) {
                if (/^\d+$/.test(part)) expect(Number(part)).toBeLessThanOrEqual(10000);
            }
            const calcSide = p.prompt.split(';')[0];
            expect(calcSide.match(/-/g)!.length).toBeGreaterThanOrEqual(1);
            expect(calcSide.match(/-/g)!.length).toBeLessThanOrEqual(2);
        }
    });
});

describe('subtraction — Year 5 (five digits)', () => {
    it('matches the exact sheet (within 100000, 1-2 subtrahends)', () => {
        const s = sheet(g5);
        expect(s).toEqual([
            {"prompt":"48561 - 42395 = __ and __ + 42395 = 48561","answer":"6166, 6166","id":1,"type":"subtraction"},
            {"prompt":"True or false: 62491 - 45760 = 16731. __; if it is wrong, fix it: 62491 - 45760 = __","answer":"Correct, 16731","wideBlanks":true,"id":2,"type":"subtraction"},
            {"prompt":"4345 - 2719 = __ and 35165 - 4918 = __; the differences differ by __","answer":"1626, 30247, 28621","id":3,"type":"subtraction"},
            {"prompt":"69219 - 35905 - 31352 = __; check: 1962 + 31352 + 35905 = __","answer":"1962, 69219","id":4,"type":"subtraction"},
            {"prompt":"True or false: 81799 - 56509 = 25290. __; if it is wrong, fix it: 81799 - 56509 = __","answer":"Correct, 25290","wideBlanks":true,"id":5,"type":"subtraction"},
            {"prompt":"92106 - 12453 = __; check: 79653 + 12453 = __","answer":"79653, 92106","id":6,"type":"subtraction"},
            {"prompt":"70223 - 27705 = __ and __ + 27705 = 70223","answer":"42518, 42518","id":7,"type":"subtraction"},
        ]);
        for (const p of s) {
            assertPositivePairs(p.prompt);
            for (const part of p.answer.split(', ')) {
                if (/^\d+$/.test(part)) expect(Number(part)).toBeLessThanOrEqual(100000);
            }
        }
    });
});

describe('subtraction — Year 6 (six digits, up to 3 subtrahends)', () => {
    it('matches the exact sheet (within 1000000, 1-3 subtrahends)', () => {
        const s = sheet(g6);
        expect(s).toEqual([
            {"prompt":"647562 - 424160 = __ and __ + 424160 = 647562","answer":"223402, 223402","id":1,"type":"subtraction"},
            {"prompt":"101768 - 48713 = __; check: 53055 + 48713 = __","answer":"53055, 101768","id":2,"type":"subtraction"},
            {"prompt":"True or false: 397155 - 151454 = 245700. __; if it is wrong, fix it: 397155 - 151454 = __","answer":"Wrong, 245701","wideBlanks":true,"id":3,"type":"subtraction"},
            {"prompt":"266531 - 30490 = __ and 532770 - 269129 = __; the differences differ by __","answer":"236041, 263641, 27600","id":4,"type":"subtraction"},
            {"prompt":"910528 - 87163 = __ and __ + 87163 = 910528","answer":"823365, 823365","id":5,"type":"subtraction"},
            {"prompt":"495846 - 451232 = __ and 396313 - 263034 = __; the differences differ by __","answer":"44614, 133279, 88665","id":6,"type":"subtraction"},
            {"prompt":"119922 - 100031 - 4470 = __; check: 15421 + 4470 + 100031 = __","answer":"15421, 119922","id":7,"type":"subtraction"},
        ]);
        // Sanity: within one million, positive differences, and subtrahend
        // counts stay inside [1, 3] on the calculation side.
        for (const p of s) {
            assertPositivePairs(p.prompt);
            for (const part of p.answer.split(', ')) {
                if (/^\d+$/.test(part)) expect(Number(part)).toBeLessThanOrEqual(1000000);
            }
            const calcSide = p.prompt.split(';')[0];
            expect(calcSide.match(/-/g)!.length).toBeGreaterThanOrEqual(1);
            expect(calcSide.match(/-/g)!.length).toBeLessThanOrEqual(3);
        }
    });
});

describe('subtraction — multi-page documents', () => {
    // The ladder's top grade also paginates: page 2 continues the SAME stream
    // (multi-subtrahend included) with continuous ids — the full 7 rows are
    // pinned, so any generator/cap/chunking change fails here too.
    it('Year 6 subtraction, 2 pages, matches the exact page-2 sheet', () => {
        const doc = generateDocument(subtractionSpec, g6, seedFrom([6, subtractionSpec.id, 0]), 2);
        expect(doc.total).toBe(14);
        expect(doc.pages.map((page) => page.length)).toEqual([7, 7]);
        expect(doc.pages[0][0]).toEqual({
            id: 1, type: "subtraction",
            prompt: "647562 - 424160 = __ and __ + 424160 = 647562",
            answer: "223402, 223402"
        });
        expect(doc.pages[1]).toEqual([
            {"prompt":"True or false: 643871 - 375696 = 268175. __; if it is wrong, fix it: 643871 - 375696 = __","answer":"Correct, 268175","wideBlanks":true,"id":8,"type":"subtraction"},
            {"prompt":"905120 - 335649 - 128391 = __; check: 441080 + 128391 + 335649 = __","answer":"441080, 905120","id":9,"type":"subtraction"},
            {"prompt":"310752 - 242716 = __ and 768731 - 27951 = __; the differences differ by __","answer":"68036, 740780, 672744","id":10,"type":"subtraction"},
            {"prompt":"817476 - 205555 = __ and __ + 205555 = 817476","answer":"611921, 611921","id":11,"type":"subtraction"},
            {"prompt":"True or false: 452556 - 38290 = 414266. __; if it is wrong, fix it: 452556 - 38290 = __","answer":"Correct, 414266","wideBlanks":true,"id":12,"type":"subtraction"},
            {"prompt":"527739 - 385865 - 32788 - 25790 = __; check: 83296 + 25790 + 32788 + 385865 = __","answer":"83296, 527739","id":13,"type":"subtraction"},
            {"prompt":"369964 - 243493 = __ and __ + 243493 = 369964","answer":"126471, 126471","id":14,"type":"subtraction"},
        ]);
    });

    it('returns an empty sheet for an unimplemented grade (Year 7+)', () => {
        expect(generateSheet(subtractionSpec, getMathGradeConfig(7), seedFrom([7, 'subtraction', 0]))).toEqual([]);
    });
});
