// Unit tests for the WORD PROBLEMS worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])), plus the exact page-2 continuation row.
// Word problems are TWO-PART connected stories (a)/(b); Prep does not offer
// them. Beyond the pins this suite re-derives EVERY part answer from the
// printed prompt across a 10-page document (answer-correctness regression),
// and pins the depth (100% two-part), density (4 per page) and range
// (everything within the grade's wordCap) contracts.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, generateDocument, createRng } from '../../framework';
import { wordSpec } from './WordProblemsWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(wordSpec, grade, seedFrom([grade.id, wordSpec.id, 0]));
}

// Re-derive the expected answer string from the printed prompt alone — the
// test never trusts the generator's own arithmetic. Returns null when a
// prompt matches none of the six story templates (a generator regression).
function expectedAnswer(p: { prompt: string; answer: string }): string | null {
    let m: RegExpMatchArray | null;
    // more-then-total: "X has a <thing>. Y has b more <thing> than X."
    if ((m = p.prompt.match(/^(\w+) has (\d+) \w+\. (\w+) has (\d+) more \w+ than \w+\.\n\(a\)/))) {
        const a = +m[2], b = +m[4];
        return `${a + b}, ${2 * a + b}`;
    }
    // two-gives: "X had a. X gave b to P and c to Q."
    if ((m = p.prompt.match(/^(\w+) had (\d+) \w+\. (\w+) gave (\d+) \w+ to (\w+) and (\d+) \w+ to (\w+)\.\n\(a\)/))) {
        const a = +m[2], giver = m[3], b = +m[4], n2 = m[5], c = +m[6], n3 = m[7];
        if (new Set([giver, n2, n3]).size !== 3) return null; // names must differ
        return `${b + c}, ${a - b - c}`;
    }
    // compare-total: "X has a. Y has b." (difference AND sum)
    if ((m = p.prompt.match(/^(\w+) has (\d+) \w+\. (\w+) has (\d+) \w+\.\n\(a\) How many more/))) {
        const a = +m[2], b = +m[4];
        return `${Math.abs(a - b)}, ${a + b}`;
    }
    // reverse-start: "b taken out, n left" → start n+b, then +c more
    if ((m = p.prompt.match(/^Some \w+ were in a box\. (\d+) of them were taken out\. Now there are (\d+) \w+\.\n\(a\)/))) {
        const b = +m[1], n = +m[2];
        const c = +(p.prompt.match(/adding (\d+) more/) || [])[1];
        return `${n + b}, ${n + b + c}`;
    }
    // true-or-fix: "N says a op b = stated" → judge, then correct
    if ((m = p.prompt.match(/^(\w+) says (\d+) ([+-]) (\d+) = (\d+)\.\n\(a\)/))) {
        const a = +m[2], op = m[3], b = +m[4], stated = +m[5];
        const correct = op === '+' ? a + b : a - b;
        return `${stated === correct ? 'yes' : 'no'}, ${correct}`;
    }
    // estimate-first: closer ten, then the exact sum
    if ((m = p.prompt.match(/^Do not work it out exactly yet: (\d+) \+ (\d+)\.\n\(a\) Is the sum closer to (\d+) or (\d+)\?/))) {
        const s = +m[1] + +m[2], lo = +m[3], hi = +m[4];
        if (s < lo || s > hi) return null;
        const closer = s - lo < hi - s ? lo : hi;
        return `${closer}, ${s}`;
    }
    return null;
}

describe('word problems plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, prose layout and reduced page size', () => {
        expect(wordSpec.id).toBe('word');
        expect(wordSpec.label).toBe('Word Problems');
        expect(wordSpec.icon).toBe('¶');
        expect(wordSpec.singleColumn).toBe(true);
        // Density regression: four deep two-part stories per A4 (was 10).
        expect(wordSpec.perPage).toBe(4);
    });

    it('describes its numeric scope', () => {
        expect(wordSpec.scope(g1)).toBe('two-part stories within 20');
        expect(wordSpec.scope(g2)).toBe('two-part stories within 30');
    });
});

describe('word problems — availability gating', () => {
    it('Prep does not offer word problems (empty sheet)', () => {
        expect(sheet(g0)).toEqual([]);
    });
});

describe('word problems — Year 1', () => {
    it('matches the exact sheet (two-part connected stories, both answers correct)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"Tom has 2 toys. Kai has 16 more toys than Tom.\n(a) How many toys does Kai have? __\n(b) How many toys do they have in total? __","answer":"18, 20","id":1,"type":"word"},
            {"prompt":"Leo had 20 cookies. Leo gave 1 cookie to Sam and 13 cookies to Rae.\n(a) How many cookies did Leo give away? __\n(b) How many cookies does Leo have left? __","answer":"14, 6","id":2,"type":"word"},
            {"prompt":"Zoe had 10 apples. Zoe gave 1 apple to Mia and 4 apples to Max.\n(a) How many apples did Zoe give away? __\n(b) How many apples does Zoe have left? __","answer":"5, 5","id":3,"type":"word"},
            {"prompt":"Kai has 18 flowers. Tom has 1 flower.\n(a) How many more flowers does Kai have than Tom? __\n(b) How many flowers do they have in total? __","answer":"17, 19","id":4,"type":"word"},
        ]);
    });

    it('page 2 continues the exact stream', () => {
        const doc = generateDocument(wordSpec, g1, seedFrom([1, 'word', 0]), 2);
        expect(doc.pages[1][0]).toEqual({ id: 5, type: "word", prompt: "Zoe has 6 balloons. Rae has 8 balloons.\n(a) How many more balloons does Rae have than Zoe? __\n(b) How many balloons do they have in total? __", answer: "2, 14" });
    });
});

describe('word problems — Year 2', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"Sam says 7 - 5 = 1.\n(a) Is Sam correct? __\n(b) What is the correct answer? __","answer":"no, 2","id":1,"type":"word"},
            {"prompt":"Tom says 14 + 6 = 19.\n(a) Is Tom correct? __\n(b) What is the correct answer? __","answer":"no, 20","id":2,"type":"word"},
            {"prompt":"Some cars were in a box. 4 of them were taken out. Now there are 16 cars.\n(a) How many cars were in the box at first? __\n(b) How many will there be after adding 7 more cars? __","answer":"20, 27","id":3,"type":"word"},
            {"prompt":"Kai has 8 flowers. Zoe has 8 more flowers than Kai.\n(a) How many flowers does Zoe have? __\n(b) How many flowers do they have in total? __","answer":"16, 24","id":4,"type":"word"},
        ]);
    });
});

describe('word problems — depth, correctness and range regression (10 pages)', () => {
    for (const grade of [g1, g2]) {
        const cap = grade.caps.wordCap;
        const problems = generateSheet(wordSpec, grade, seedFrom([grade.id, 'word', 0]))
            .concat(generateDocument(wordSpec, grade, seedFrom([grade.id, 'word', 0]), 10).pages[9]);
        it(`Year ${grade.id}: every answer is re-derived correct from its own prompt`, () => {
            for (const p of problems) {
                const exp = expectedAnswer(p);
                expect(exp, `unrecognised prompt: ${p.prompt}`).not.toBeNull();
                expect(p.answer).toBe(exp);
            }
        });
        it(`Year ${grade.id}: 100% two-part stories, both parts answered`, () => {
            for (const p of problems) {
                expect(p.prompt).toContain('(a)');
                expect(p.prompt).toContain('(b)');
                expect(p.answer.split(', ')).toHaveLength(2);
            }
        });
        it(`Year ${grade.id}: every printed number stays within the wordCap (${cap})`, () => {
            for (const p of problems) {
                for (const m of p.prompt.matchAll(/\d+/g)) expect(+m[0]).toBeLessThanOrEqual(cap);
                for (const part of p.answer.split(', ')) {
                    const n = Number(part);
                    if (!Number.isNaN(n)) expect(n).toBeLessThanOrEqual(cap);
                }
            }
        });
        it(`Year ${grade.id}: prose only — no pictorial glyphs, deterministic stream`, () => {
            for (const p of problems) expect(p.prompt).toMatch(/^[ -~\n]+$/);
            const seed = seedFrom([grade.id, 'word', 0]);
            const a = wordSpec.generate(createRng(seed), grade.caps, 40);
            const b = wordSpec.generate(createRng(seed), grade.caps, 40);
            expect(a).toEqual(b);
        });
    }
});
