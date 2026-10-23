// Unit tests for the SKIP COUNTING worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])), plus the exact page-2 continuation.
// DEPTH-FIRST SHEET: eight CONNECTED multi-part tasks per page; answers list
// the blank values IN PRINTED ORDER, comma separated.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, generateDocument } from '../../framework';
import { skipSpec } from './SkipCountingWorksheet';

const g1 = getMathGradeConfig(1);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(skipSpec, grade, seedFrom([grade.id, skipSpec.id, 0]));
}

describe('skip counting plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(skipSpec.id).toBe('skip');
        expect(skipSpec.label).toBe('Skip Counting');
        expect(skipSpec.icon).toBe('»');
        // Depth-first: eight connected tasks per A4 page.
        expect(skipSpec.perPage).toBe(8);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(skipSpec.scope(g1)).toBe('count by 2, 5, 10');
    });
});

describe('skip counting — Year 1', () => {
    it('matches the exact sheet (every run is a consistent skip)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"Start at 2 and count on by 10: 2, __, __","answer":"12, 22","id":1,"type":"skip"},
            {"prompt":"27, 22, 17, __, __","answer":"12, 7","id":2,"type":"skip"},
            {"prompt":"32, 34, 36, 38, __; it counts by __","answer":"40, 2","id":3,"type":"skip"},
            {"prompt":"Does counting by 5 from 32 land on 42? __","answer":"Correct","wideBlanks":true,"id":4,"type":"skip"},
            {"prompt":"17, 19, __, 23, __","answer":"21, 25","id":5,"type":"skip"},
            {"prompt":"Does counting by 10 from 47 land on 50? __","answer":"Wrong","wideBlanks":true,"id":6,"type":"skip"},
            {"prompt":"20, 22, 24, 26, __; it counts by __","answer":"28, 2","id":7,"type":"skip"},
            {"prompt":"Start at 24 and count on by 10: 24, __, __","answer":"34, 44","id":8,"type":"skip"},
        ]);
        // Semantic check across the plain numeric run rows (those starting with
        // a digit): the run keeps a constant step; each blank resolves to the
        // term at its position, and a trailing "it counts by __" blank takes
        // the step itself.
        for (const p of s) {
            if (!/^\d/.test(p.prompt)) continue;
            // Only the "; it counts by __" suffix may follow the run.
            const [run, tail] = p.prompt.split('; ');
            expect(tail === undefined || tail === 'it counts by __').toBe(true);
            const terms = run.split(', ').map((t) => (t === '__' ? NaN : Number(t)));
            const step = terms[1] - terms[0];
            // Every shown term sits on the same arithmetic run.
            // `shown` tracks the run's value AT index i before advancing.
            let shown = terms[0];
            const answers = p.answer.split(', ').map(Number);
            let ai = 0;
            for (let i = 0; i < terms.length; i++) {
                if (Number.isNaN(terms[i])) expect(answers[ai++]).toBe(shown);
                else expect(terms[i]).toBe(shown);
                shown += step;
            }
            // "it counts by __" rows carry the step as the final answer part.
            if (p.prompt.includes('it counts by')) expect(answers[ai]).toBe(step);
        }
        // Land-on claims: counting by 5 from 32 hits 37, 42 — Correct; by 10
        // from 47 hits 57 — never 50, so Wrong (both pinned above).
        expect(s[3].answer).toBe('Correct');
        expect(s[5].answer).toBe('Wrong');
    });

    it('page 2 continues the exact stream', () => {
        const doc = generateDocument(skipSpec, g1, seedFrom([1, 'skip', 0]), 2);
        expect(doc.total).toBe(16);
        expect(doc.pages[1]).toEqual([
            {"prompt":"46, 41, 36, __, __","answer":"31, 26","id":9,"type":"skip"},
            {"prompt":"1, 3, __, 7, __","answer":"5, 9","id":10,"type":"skip"},
            {"prompt":"Start at 29 and count on by 10: 29, __, __","answer":"39, 49","id":11,"type":"skip"},
            {"prompt":"20, 25, __, 35, __","answer":"30, 40","id":12,"type":"skip"},
            {"prompt":"18, 16, 14, __, __","answer":"12, 10","id":13,"type":"skip"},
            {"prompt":"18, 23, 28, 33, __; it counts by __","answer":"38, 5","id":14,"type":"skip"},
            {"prompt":"Does counting by 10 from 4 land on 35? __","answer":"Wrong","wideBlanks":true,"id":15,"type":"skip"},
            {"prompt":"30, 35, 40, 45, __; it counts by __","answer":"50, 5","id":16,"type":"skip"},
        ]);
    });
});
