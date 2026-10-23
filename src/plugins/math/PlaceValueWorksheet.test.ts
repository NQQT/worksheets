// Unit tests for the PLACE VALUE worksheet plugin.
//
// Deterministic pins from seedFrom([grade.id, 'placevalue', 0]). Depth
// design: eight CONNECTED two-part items per page (was sixteen one-blank
// recalls) — every item anchors one number and asks two linked questions.
// The correctness suite re-derives every answer from the printed prompt
// across a 10-page document and enforces the grade's pvCap.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, generateDocument, createRng } from '../../framework';
import { placeValueSpec } from './PlaceValueWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(placeValueSpec, grade, seedFrom([grade.id, placeValueSpec.id, 0]));
}

// "1 ten" / "4 tens", "1 one" / "5 ones" — same wording rule as the plugin.
const tensWord = (t: number) => (t === 1 ? 'ten' : 'tens');
const onesWord = (o: number) => (o === 1 ? 'one' : 'ones');

type P = { prompt: string; answer: string };

// Re-derive the expected answer from the printed prompt alone.
function expectedAnswer(p: P): string | null {
    let m: RegExpMatchArray | null;
    // Partition read apart: tens first, leftover ones second.
    if ((m = p.prompt.match(/^Look at the number (\d+)\.\n\(a\) How many tens are in \1\? __\n\(b\) How many ones are left over\? __$/))) {
        const n = +m[1];
        return `${Math.floor(n / 10)} ${tensWord(Math.floor(n / 10))}, ${n % 10} ${onesWord(n % 10)}`;
    }
    // Compose from tens+ones, then step by 1 (Y1) or 10 (Y2).
    if ((m = p.prompt.match(/^Write the number: (\d+) tens? and (\d+) ones?\.\n\(a\) What number is it\? __\n\(b\) What is (\d+) more than that number\? __$/))) {
        const n = +m[1] * 10 + +m[2];
        return `${n}, ${n + +m[3]}`;
    }
    // Decade crossing: 19 → 20, then count the new tens.
    if ((m = p.prompt.match(/^\(a\) What is 1 more than (\d+)\? __\n\(b\) How many tens are in your answer\? __$/))) {
        const next = +m[1] + 1;
        return `${next}, ${Math.floor(next / 10)}`;
    }
    // Comparison AND the gap.
    if ((m = p.prompt.match(/^\(a\) Which is greater, (\d+) or (\d+)\? __\n\(b\) How many more\? __$/))) {
        const a = +m[1], b = +m[2];
        return `${Math.max(a, b)}, ${Math.abs(a - b)}`;
    }
    // Riddle: ones digit relative to the tens digit, then assemble.
    if ((m = p.prompt.match(/^I am thinking of a 2-digit number\. Its tens digit is (\d+)\. Its ones digit is (\d+) more than its tens digit\.\n\(a\) What is my ones digit\? __\n\(b\) What is my number\? __$/))) {
        const t = +m[1], ones = t + +m[2];
        if (ones > 9) return null;
        return `${ones}, ${t * 10 + ones}`;
    }
    // Digit cards: greatest and smallest 2-digit numbers.
    if ((m = p.prompt.match(/^You have two digit cards: (\d) and (\d)\.\n\(a\) What is the greatest 2-digit number you can make\? __\n\(b\) What is the smallest 2-digit number you can make\? __$/))) {
        const hi = Math.max(+m[1], +m[2]), lo = Math.min(+m[1], +m[2]);
        return `${hi * 10 + lo}, ${lo * 10 + hi}`;
    }
    // Inverse pair: 10 more AND 10 less on one anchor.
    if ((m = p.prompt.match(/^Think about the number (\d+)\.\n\(a\) What is 10 more than \1\? __\n\(b\) What is 10 less than \1\? __$/))) {
        const n = +m[1];
        return `${n + 10}, ${n - 10}`;
    }
    return null;
}

describe('place value plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and reduced page size', () => {
        expect(placeValueSpec.id).toBe('placevalue');
        expect(placeValueSpec.label).toBe('Place Value');
        expect(placeValueSpec.icon).toBe('⊞');
        // Density regression: four connected items per page (was 16, then 8)
        // — multi-part stories print single-column (T3M3 — see
        // plugins/layout-capacity.test.ts).
        expect(placeValueSpec.perPage).toBe(4);
        expect(placeValueSpec.singleColumn).toBe(true);
    });

    it('describes its numeric scope', () => {
        expect(placeValueSpec.scope(g1)).toBe('tens & ones to 20');
        expect(placeValueSpec.scope(g2)).toBe('tens & ones to 99');
    });
});

describe('place value — availability gating', () => {
    it('Prep does not offer place value (empty sheet)', () => {
        expect(sheet(g0)).toEqual([]);
    });

    it('Year 1 never sees the wide-space forms (cards / 10-more)', () => {
        const doc = generateDocument(placeValueSpec, g1, seedFrom([1, 'placevalue', 0]), 10);
        for (const p of doc.pages.flat()) {
            expect(p.prompt).not.toContain('digit cards');
            expect(p.prompt).not.toContain('10 more');
        }
    });
});

describe('place value — Year 1', () => {
    it('matches the exact sheet (two-part items, both answers correct)', () => {
        expect(sheet(g1)).toEqual([
            {"prompt":"(a) What is 1 more than 9? __\n(b) How many tens are in your answer? __","answer":"10, 1","id":1,"type":"placevalue"},
            {"prompt":"I am thinking of a 2-digit number. Its tens digit is 1. Its ones digit is 1 more than its tens digit.\n(a) What is my ones digit? __\n(b) What is my number? __","answer":"2, 12","id":2,"type":"placevalue"},
            {"prompt":"(a) Which is greater, 10 or 19? __\n(b) How many more? __","answer":"19, 9","id":3,"type":"placevalue"},
            {"prompt":"(a) Which is greater, 19 or 14? __\n(b) How many more? __","answer":"19, 5","id":4,"type":"placevalue"},
        ]);
    });
});

describe('place value — Year 2', () => {
    it('matches the exact sheet', () => {
        expect(sheet(g2)).toEqual([
            {"prompt":"Look at the number 45.\n(a) How many tens are in 45? __\n(b) How many ones are left over? __","answer":"4 tens, 5 ones","id":1,"type":"placevalue"},
            {"prompt":"Think about the number 42.\n(a) What is 10 more than 42? __\n(b) What is 10 less than 42? __","answer":"52, 32","id":2,"type":"placevalue"},
            {"prompt":"(a) What is 1 more than 59? __\n(b) How many tens are in your answer? __","answer":"60, 6","id":3,"type":"placevalue"},
            {"prompt":"(a) What is 1 more than 69? __\n(b) How many tens are in your answer? __","answer":"70, 7","id":4,"type":"placevalue"},
        ]);
    });
});

describe('place value — correctness, depth and range regression (10 pages)', () => {
    for (const grade of [g1, g2]) {
        const cap = Math.max(10, grade.caps.pvCap);
        const problems = generateDocument(placeValueSpec, grade, seedFrom([grade.id, 'placevalue', 0]), 10).pages.flat();
        it(`Year ${grade.id}: every answer re-derived from its prompt`, () => {
            for (const p of problems) {
                const exp = expectedAnswer(p);
                expect(exp, `unrecognised prompt: ${p.prompt}`).not.toBeNull();
                expect(p.answer).toBe(exp);
            }
        });
        it(`Year ${grade.id}: 100% two-part items, both parts answered`, () => {
            for (const p of problems) {
                expect(p.prompt).toContain('(a)');
                expect(p.prompt).toContain('(b)');
                expect(p.answer.split(', ')).toHaveLength(2);
            }
        });
        it(`Year ${grade.id}: every printed number stays within the pvCap (${cap})`, () => {
            for (const p of problems) {
                for (const m of p.prompt.matchAll(/\b\d+\b/g)) expect(+m[0]).toBeLessThanOrEqual(cap);
                for (const part of p.answer.split(', ')) {
                    const n = Number(part.replace(/ (tens?|ones?)$/, ''));
                    if (!Number.isNaN(n)) expect(n).toBeLessThanOrEqual(cap);
                }
            }
        });
        it(`Year ${grade.id}: page 1 never repeats; ASCII-only; deterministic`, () => {
            const page1 = generateSheet(placeValueSpec, grade, seedFrom([grade.id, 'placevalue', 0]));
            expect(new Set(page1.map((p) => p.prompt)).size).toBe(page1.length);
            for (const p of problems) expect(p.prompt).toMatch(/^[ -~\n]+$/);
            const seed = seedFrom([grade.id, 'placevalue', 0]);
            expect(placeValueSpec.generate(createRng(seed), grade.caps, 40)).toEqual(placeValueSpec.generate(createRng(seed), grade.caps, 40));
        });
    }
});
