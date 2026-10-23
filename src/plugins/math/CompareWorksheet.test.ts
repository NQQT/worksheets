// Unit tests for the COMPARE worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values, and every printed sign is verified against its operands.
// DEPTH-FIRST SHEET: eight CONNECTED multi-part tasks per page; answers list
// the blank values IN PRINTED ORDER, comma separated.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet } from '../../framework';
import { comparisonSpec } from './CompareWorksheet';

const g1 = getMathGradeConfig(1);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(comparisonSpec, grade, seedFrom([grade.id, comparisonSpec.id, 0]));
}

describe('compare plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(comparisonSpec.id).toBe('comparison');
        expect(comparisonSpec.label).toBe('Compare (>, <, =)');
        expect(comparisonSpec.icon).toBe('≟');
        // Depth-first: eight connected tasks per A4 page.
        expect(comparisonSpec.perPage).toBe(8);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(comparisonSpec.scope(g1)).toBe('within 20');
    });
});

describe('compare — Year 1', () => {
    it('matches the exact sheet (signs, differences and orders all correct)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"4 __ 14; the difference between them is __","answer":"<, 10","id":1,"type":"comparison"},
            {"prompt":"2 + 8 __ 13 + 6","answer":"<","id":2,"type":"comparison"},
            {"prompt":"Order 15, 9, 2 from greatest to least: __, __, __","answer":"15, 9, 2","id":3,"type":"comparison"},
            {"prompt":"14 + 0 __ 14 + 3","answer":"<","id":4,"type":"comparison"},
            {"prompt":"18 + 2 __ 14","answer":">","id":5,"type":"comparison"},
            {"prompt":"Order 13, 12, 2 from least to greatest: __, __, __","answer":"2, 12, 13","id":6,"type":"comparison"},
            {"prompt":"12 __ 15; the difference between them is __","answer":"<, 3","id":7,"type":"comparison"},
            {"prompt":"1 + 4 __ 1 + 3","answer":">","id":8,"type":"comparison"},
        ]);
        // Cross-check the sign families against their operands: bare pairs and
        // sum-vs-sum / sum-vs-number comparisons all evaluate to the printed sign.
        const sign = (a: number, b: number) => (a > b ? '>' : a < b ? '<' : '=');
        expect(s[0].answer).toBe(`${sign(4, 14)}, ${14 - 4}`);
        expect(s[1].answer).toBe(sign(2 + 8, 13 + 6));
        expect(s[3].answer).toBe(sign(14 + 0, 14 + 3));
        expect(s[4].answer).toBe(sign(18 + 2, 14));
        expect(s[6].answer).toBe(`${sign(12, 15)}, ${15 - 12}`);
        expect(s[7].answer).toBe(sign(1 + 4, 1 + 3));
        // Ordering rows: the answer is the shown numbers sorted as requested.
        expect(s[2].answer).toBe('15, 9, 2'); // greatest to least
        expect(s[5].answer).toBe('2, 12, 13'); // least to greatest
    });
});
