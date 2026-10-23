// Unit tests for the MISSING NUMBER worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). DEPTH-FIRST SHEET: eight CONNECTED
// multi-part tasks per page; answers list the blank values IN PRINTED ORDER,
// comma separated. Missing numbers start at Year 1, so Prep must produce an
// empty sheet.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet } from '../../framework';
import { missingSpec } from './MissingNumberWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(missingSpec, grade, seedFrom([grade.id, missingSpec.id, 0]));
}

describe('missing number plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(missingSpec.id).toBe('missing');
        expect(missingSpec.label).toBe('Missing Number');
        expect(missingSpec.icon).toBe('?');
        // Depth-first: eight connected tasks per A4 page.
        expect(missingSpec.perPage).toBe(8);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(missingSpec.scope(g1)).toBe('within 20');
    });
});

describe('missing number — availability gating', () => {
    it('Prep does not offer missing numbers (empty sheet)', () => {
        expect(sheet(g0)).toEqual([]);
    });
});

describe('missing number — Year 1', () => {
    it('matches the exact sheet (hidden addends always within the cap)', () => {
        expect(sheet(g1)).toEqual([
            {"prompt":"14 + 3 = 17, so 17 - 14 = __ and 17 - 3 = __","answer":"3, 14","id":1,"type":"missing"},
            {"prompt":"7 - __ = 4 and __ + 4 = 7","answer":"3, 3","id":2,"type":"missing"},
            {"prompt":"13 + 7 = 10 + __","answer":"10","id":3,"type":"missing"},
            {"prompt":"2 + __ = 3 and 3 + __ = 18","answer":"1, 15","id":4,"type":"missing"},
            {"prompt":"The same number goes in both blanks: __ + __ = 20","answer":"10, 10","id":5,"type":"missing"},
            {"prompt":"11 - __ = 6 and __ + 6 = 11","answer":"5, 5","id":6,"type":"missing"},
            {"prompt":"The same number goes in both blanks: __ + __ = 12","answer":"6, 6","id":7,"type":"missing"},
            {"prompt":"1 + __ = 4 and 4 + __ = 9","answer":"3, 5","id":8,"type":"missing"},
        ]);
    });
});
