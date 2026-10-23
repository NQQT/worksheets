// Unit tests for the PATTERNS worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). DEPTH-FIRST SHEET: eight CONNECTED
// multi-part tasks per page; answers list the blank values IN PRINTED ORDER,
// comma separated. Prep does not offer the extension types.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet } from '../../framework';
import { patternsSpec } from './PatternsWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(patternsSpec, grade, seedFrom([grade.id, patternsSpec.id, 0]));
}

describe('patterns plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(patternsSpec.id).toBe('patterns');
        expect(patternsSpec.label).toBe('Patterns');
        expect(patternsSpec.icon).toBe('↻');
        // Depth-first: eight connected tasks per A4 page.
        expect(patternsSpec.perPage).toBe(8);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(patternsSpec.scope(g1)).toBe('steps of 1, 2, 5, 10');
        expect(patternsSpec.scope(g2)).toBe('steps of 1, 2, 3, 4, 5, 10');
    });
});

describe('patterns — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(8);
    });
});

describe('patterns — Year 1 (steps 1/2/5/10)', () => {
    it('matches the exact sheet (count-on with gaps + repeating word cycles)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"7, 17, 27, __, __","answer":"37, 47","id":1,"type":"patterns"},
            {"prompt":"triangle, cross, triangle, cross, triangle, __; the pattern repeats every __ shapes","answer":"cross, 2","id":2,"type":"patterns"},
            {"prompt":"cat, frog, bee, cat, __, __","answer":"frog, bee","id":3,"type":"patterns"},
            {"prompt":"Counting on by 5 from 11 gives 11, 16, 21, 26. __ (Correct or Wrong)","answer":"Correct","wideBlanks":true,"id":4,"type":"patterns"},
            {"prompt":"5, 7, __, 11, __","answer":"9, 13","id":5,"type":"patterns"},
            {"prompt":"29, 30, 31, 32, __; the rule is add __","answer":"33, 1","id":6,"type":"patterns"},
            {"prompt":"14, 16, 18, __, __","answer":"20, 22","id":7,"type":"patterns"},
            {"prompt":"5, 15, __, 35, __","answer":"25, 45","id":8,"type":"patterns"},
        ]);
        // Numeric rows keep a constant step; each blank resolves to the term at
        // its position, and a trailing "the rule is add __" blank takes the
        // step itself ('__' maps to NaN so its index can be located).
        for (const p of s) {
            if (!/^\d/.test(p.prompt)) continue;
            const [run, tail] = p.prompt.split('; ');
            expect(tail === undefined || tail === 'the rule is add __').toBe(true);
            const terms = run.split(', ').map((t) => (t === '__' ? NaN : Number(t)));
            const step = terms[1] - terms[0];
            // `shown` tracks the run's value AT index i before advancing.
            let shown = terms[0];
            const answers = p.answer.split(', ').map(Number);
            let ai = 0;
            for (let i = 0; i < terms.length; i++) {
                if (Number.isNaN(terms[i])) expect(answers[ai++]).toBe(shown);
                else expect(terms[i]).toBe(shown);
                shown += step;
            }
            if (tail) expect(answers[ai]).toBe(step);
        }
        // Word cycles: "triangle, cross" repeats every 2 shapes (blank takes
        // "cross"), and the "cat, frog, bee" 3-cycle continues "frog, bee".
        expect(s[1].answer).toBe('cross, 2');
        expect(s[2].answer).toBe('frog, bee');
    });
});

describe('patterns — Year 2 (steps 1,2,3,4,5,10 up to 100)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"cross, star, square, cross, star, __; the pattern repeats every __ shapes","answer":"square, 3","id":1,"type":"patterns"},
            {"prompt":"50, 54, 58, __, __","answer":"62, 66","id":2,"type":"patterns"},
            {"prompt":"5, 15, __, 35, __","answer":"25, 45","id":3,"type":"patterns"},
            {"prompt":"Counting on by 1 from 94 gives 94, 95, 96, 97. __ (Correct or Wrong)","answer":"Correct","wideBlanks":true,"id":4,"type":"patterns"},
            {"prompt":"pink, green, blue, pink, __, __","answer":"green, blue","id":5,"type":"patterns"},
            {"prompt":"7, 10, 13, 16, __; the rule is add __","answer":"19, 3","id":6,"type":"patterns"},
            {"prompt":"duck, bee, duck, bee, duck, __; the pattern repeats every __ shapes","answer":"bee, 2","id":7,"type":"patterns"},
            {"prompt":"75, 80, __, 90, __","answer":"85, 95","id":8,"type":"patterns"},
        ]);
        // Numeric rows keep a constant step; the blank resolves exactly to the
        // previous term plus the step (mirrors the Year 1 check within skipCap 100).
        for (const p of s) {
            if (!/^\d/.test(p.prompt)) continue;
            const [run, tail] = p.prompt.split('; ');
            expect(tail === undefined || tail === 'the rule is add __').toBe(true);
            const terms = run.split(', ').map((t) => (t === '__' ? NaN : Number(t)));
            const step = terms[1] - terms[0];
            // `shown` tracks the run's value AT index i before advancing.
            let shown = terms[0];
            const answers = p.answer.split(', ').map(Number);
            let ai = 0;
            for (let i = 0; i < terms.length; i++) {
                if (Number.isNaN(terms[i])) expect(answers[ai++]).toBe(shown);
                else expect(terms[i]).toBe(shown);
                shown += step;
            }
            if (tail) expect(answers[ai]).toBe(step);
        }
    });
});
