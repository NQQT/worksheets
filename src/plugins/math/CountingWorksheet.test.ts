// Unit tests for the COUNTING & NUMBERS worksheet plugin (T2V redesign).
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])).
//
// What the T2V redesign must keep true (pinned below):
//   - EIGHT connected tasks per page (was eighteen bare drills);
//   - every item is observe-then-justify: sequence gaps, a printed square
//     ARRAY to count (rowsColumns figure) plus its successor, and a bigger/
//     smaller comparison that also states the exact difference;
//   - multi-part answers are comma-separated and cover EVERY printed "__"
//     blank in printed order — no blank without an answer, no answer without
//     a blank;
//   - grid figures stay printable (2..5 rows × 2..10 cols) and every printed
//     value stays within [0, numCap].

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, createRng } from '../../framework';
import { countingSpec } from './CountingWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(countingSpec, grade, seedFrom([grade.id, countingSpec.id, 0]));
}

describe('counting plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and reduced page size', () => {
        expect(countingSpec.id).toBe('counting');
        expect(countingSpec.label).toBe('Counting & Numbers');
        expect(countingSpec.icon).toBe('#');
        // Eight connected tasks per page (quality over quantity).
        expect(countingSpec.perPage).toBe(8);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(countingSpec.scope(g1)).toBe('to 20');
    });
});

describe('counting — Prep (within 10)', () => {
    it('matches the exact sheet', () => {
        expect(sheet(g0)).toEqual([
            {"prompt":"4, __, 6","answer":"5","id":1,"type":"counting"},
            {"prompt":"Count the squares in this 3 × 2 grid. There are __ squares. The number just after it is __.","answer":"6, 7","rowsColumns":{"rows":3,"cols":2},"id":2,"type":"counting"},
            {"prompt":"0, __, 2","answer":"1","id":3,"type":"counting"},
            {"prompt":"Which is bigger: 1 or 10? __ It is __ more than the other.","answer":"10, 9","id":4,"type":"counting"},
            {"prompt":"1, __, __, 4","answer":"2, 3","id":5,"type":"counting"},
            {"prompt":"6, 7, __, 9","answer":"8","id":6,"type":"counting"},
            {"prompt":"8, 7, __, 5","answer":"6","id":7,"type":"counting"},
            {"prompt":"Count the squares in this 3 × 3 grid. There are __ squares. The number just after it is __.","answer":"9, 10","rowsColumns":{"rows":3,"cols":3},"id":8,"type":"counting"},
        ]);
    });
});

describe('counting — Year 1 (within 20)', () => {
    it('matches the exact sheet', () => {
        expect(sheet(g1)).toEqual([
            {"prompt":"15, __, 17","answer":"16","id":1,"type":"counting"},
            {"prompt":"0, 1, __, 3","answer":"2","id":2,"type":"counting"},
            {"prompt":"14, 15, __, 17","answer":"16","id":3,"type":"counting"},
            {"prompt":"Which is bigger: 10 or 8? __ It is __ more than the other.","answer":"10, 2","id":4,"type":"counting"},
            {"prompt":"Count the squares in this 5 × 3 grid. There are __ squares. The number just after it is __.","answer":"15, 16","rowsColumns":{"rows":5,"cols":3},"id":5,"type":"counting"},
            {"prompt":"16, 15, __, 13","answer":"14","id":6,"type":"counting"},
            {"prompt":"13, 14, __, 16","answer":"15","id":7,"type":"counting"},
            {"prompt":"18, 17, __, 15","answer":"16","id":8,"type":"counting"},
        ]);
    });
});

describe('counting — Year 2 (within 100)', () => {
    it('matches the exact sheet', () => {
        expect(sheet(g2)).toEqual([
            {"prompt":"Count the squares in this 2 × 8 grid. There are __ squares. The number just after it is __.","answer":"16, 17","rowsColumns":{"rows":2,"cols":8},"id":1,"type":"counting"},
            {"prompt":"Count the squares in this 5 × 7 grid. There are __ squares. The number just after it is __.","answer":"35, 36","rowsColumns":{"rows":5,"cols":7},"id":2,"type":"counting"},
            {"prompt":"83, 82, __, 80","answer":"81","id":3,"type":"counting"},
            {"prompt":"Count the squares in this 5 × 2 grid. There are __ squares. The number just after it is __.","answer":"10, 11","rowsColumns":{"rows":5,"cols":2},"id":4,"type":"counting"},
            {"prompt":"28, 29, __, 31","answer":"30","id":5,"type":"counting"},
            {"prompt":"19, __, __, 22","answer":"20, 21","id":6,"type":"counting"},
            {"prompt":"74, 73, __, 71","answer":"72","id":7,"type":"counting"},
            {"prompt":"Count the squares in this 4 × 6 grid. There are __ squares. The number just after it is __.","answer":"24, 25","rowsColumns":{"rows":4,"cols":6},"id":8,"type":"counting"},
        ]);
    });
});

describe('counting — task soundness across a long stream', () => {
    // 300 questions over the Year-2 stream exercise every kind many times.
    const problems = countingSpec.generate(createRng(seedFrom([2, 'counting', 0])), g2.caps, 300);

    it('every answer covers exactly the printed blanks (comma-separated parts)', () => {
        expect(problems.map((p) => `${p.prompt} :: ${p.answer}`).filter((line) => {
            const [prompt, answer] = line.split(' :: ');
            return (prompt.match(/__/g) ?? []).length !== answer.split(', ').length;
        })).toEqual([]);
    });

    it('sequence answers continue the printed run exactly', () => {
        const sequences = problems.filter((p) => /^\d/.test(p.prompt));
        expect(sequences.length).toBeGreaterThan(0);
        for (const p of sequences) {
            // Fill every "__" with its answer part IN ORDER, then the whole
            // printed run must step by exactly +1 or -1 between neighbours.
            const parts = p.answer.split(', ');
            let i = 0;
            const filled = p.prompt.split(', ').map((token) => (token === '__' ? parts[i++] : token));
            expect(i).toBe(parts.length);
            const numbers = filled.map(Number);
            expect(numbers.every(Number.isInteger)).toBe(true);
            const step = numbers[numbers.length - 1] > numbers[0] ? 1 : -1;
            for (let k = 1; k < numbers.length; k++) {
                expect(numbers[k] - numbers[k - 1]).toBe(step);
            }
        }
    });

    it('grid items: printable dimensions, in-scope totals, exact successor', () => {
        const grids = problems.filter((p) => p.rowsColumns);
        expect(grids.length).toBeGreaterThan(0);
        for (const p of grids) {
            const { rows, cols } = p.rowsColumns!;
            // Printable: 2..5 rows and 2..10 columns (16px cells fit a column).
            expect(rows >= 2 && rows <= 5).toBe(true);
            expect(cols >= 2 && cols <= 10).toBe(true);
            const [total, next] = p.answer.split(', ').map(Number);
            expect(total).toBe(rows * cols);
            expect(next).toBe(total + 1);
            // Whole item stays inside the grade's number scope.
            expect(next).toBeLessThanOrEqual(g2.caps.numCap);
            // The prompt never prints the total (the count is the task).
            expect(p.prompt).not.toContain(`${total}`);
        }
    });

    it('comparison items name the bigger number AND its exact difference', () => {
        const compares = problems.filter((p) => p.prompt.startsWith('Which is bigger'));
        expect(compares.length).toBeGreaterThan(0);
        for (const p of compares) {
            const m = p.prompt.match(/bigger: (\d+) or (\d+)/)!;
            const a = Number(m[1]);
            const b = Number(m[2]);
            const [bigger, difference] = p.answer.split(', ').map(Number);
            expect(bigger).toBe(Math.max(a, b));
            expect(difference).toBe(Math.abs(a - b));
            expect(a).not.toBe(b);
        }
    });

    it('stays deterministic and never exceeds the number scope', () => {
        const again = countingSpec.generate(createRng(seedFrom([2, 'counting', 0])), g2.caps, 300);
        expect(again).toEqual(problems);
        for (const p of problems) {
            for (const value of p.prompt.match(/\d+/g) ?? []) {
                expect(Number(value)).toBeLessThanOrEqual(g2.caps.numCap);
            }
        }
    });

    it('the zero-count guard and unoffered grades produce nothing', () => {
        expect(countingSpec.generate(createRng(seedFrom([1, 'counting', 0])), g1.caps, 0)).toEqual([]);
        expect(generateSheet(countingSpec, getMathGradeConfig(3), seedFrom([3, 'counting', 0]))).toEqual([]);
    });
});
