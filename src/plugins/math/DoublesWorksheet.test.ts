// Unit tests for the DOUBLES & NEAR DOUBLES worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). DEPTH-FIRST SHEET: eight CONNECTED
// multi-part tasks per page; answers list the blank values IN PRINTED ORDER,
// comma separated. Prep does not offer the extension types.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet } from '../../framework';
import { doublesSpec } from './DoublesWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(doublesSpec, grade, seedFrom([grade.id, doublesSpec.id, 0]));
}

describe('doubles plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(doublesSpec.id).toBe('doubles');
        expect(doublesSpec.label).toBe('Doubles & Near Doubles');
        expect(doublesSpec.icon).toBe('=');
        // Depth-first: eight connected tasks per A4 page.
        expect(doublesSpec.perPage).toBe(8);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(doublesSpec.scope(g1)).toBe('doubles to 10');
        expect(doublesSpec.scope(g2)).toBe('doubles to 20');
    });
});

describe('doubles — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(8);
    });
});

describe('doubles — Year 1 (bases to 10)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"7 + __ = 15 and 7 + 7 = __","answer":"8, 14","id":1,"type":"doubles"},
            {"prompt":"8 + 8 = __ and 3 + 3 = __; the doubles differ by __","answer":"16, 6, 10","id":2,"type":"doubles"},
            {"prompt":"True or false: half of 8 is 3. __; double 4 is __","answer":"Wrong, 8","wideBlanks":true,"id":3,"type":"doubles"},
            {"prompt":"Double 8 is __ and half of 16 is __","answer":"16, 8","id":4,"type":"doubles"},
            {"prompt":"Double 1 is __ and double that number is __","answer":"2, 4","id":5,"type":"doubles"},
            {"prompt":"4 + 4 = __ and 4 + 5 = __","answer":"8, 9","id":6,"type":"doubles"},
            {"prompt":"Double 3 is __ and double that number is __","answer":"6, 12","id":7,"type":"doubles"},
            {"prompt":"True or false: half of 2 is 2. __; double 1 is __","answer":"Wrong, 2","wideBlanks":true,"id":8,"type":"doubles"},
        ]);
        // Cap check: every worded double base stays within doubleCap (10) and
        // every worded half value within 2 * doubleCap (the double of a base).
        for (const p of s) {
            for (const m of p.prompt.matchAll(/Double (\d+)/g)) {
                expect(Number(m[1])).toBeLessThanOrEqual(10);
            }
            for (const m of p.prompt.matchAll(/half of (\d+)/g)) {
                expect(Number(m[1])).toBeLessThanOrEqual(20);
            }
        }
    });
});

describe('doubles — Year 2 (bases to 20)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"Double 16 is __ and half of 32 is __","answer":"32, 16","id":1,"type":"doubles"},
            {"prompt":"10 + __ = 21 and 10 + 10 = __","answer":"11, 20","id":2,"type":"doubles"},
            {"prompt":"4 + 4 = __ and 4 + 5 = __","answer":"8, 9","id":3,"type":"doubles"},
            {"prompt":"True or false: half of 18 is 8. __; double 9 is __","answer":"Wrong, 18","wideBlanks":true,"id":4,"type":"doubles"},
            {"prompt":"11 + 11 = __ and 15 + 15 = __; the doubles differ by __","answer":"22, 30, 8","id":5,"type":"doubles"},
            {"prompt":"Double 10 is __ and double that number is __","answer":"20, 40","id":6,"type":"doubles"},
            {"prompt":"True or false: half of 32 is 16. __; double 16 is __","answer":"Correct, 32","wideBlanks":true,"id":7,"type":"doubles"},
            {"prompt":"17 + 17 = __ and 17 + 18 = __","answer":"34, 35","id":8,"type":"doubles"},
        ]);
        // Cap check: every worded double base stays within doubleCap (20) and
        // every worded half value within 2 * doubleCap (40).
        for (const p of s) {
            for (const m of p.prompt.matchAll(/Double (\d+)/g)) {
                expect(Number(m[1])).toBeLessThanOrEqual(20);
            }
            for (const m of p.prompt.matchAll(/half of (\d+)/g)) {
                expect(Number(m[1])).toBeLessThanOrEqual(40);
            }
        }
    });
});
