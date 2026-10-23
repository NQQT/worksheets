// Unit tests for the DIVISION worksheet plugin.
//
// Deterministic pins from seedFrom([grade.id, 'division', 0]). Depth design:
// five connected items per page (was twelve) — fact families, missing
// divisors, sharing/grouping stories (with the framework equal-group model
// where it fits A4), remainder reasoning, two-quantity shares and reverse
// sharing. The correctness suite re-derives every answer from the printed
// prompt across a 10-page document and pins the diagram fit gates.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, generateDocument, createRng } from '../../framework';
import { divisionSpec } from './DivisionWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(divisionSpec, grade, seedFrom([grade.id, divisionSpec.id, 0]));
}

type P = { prompt: string; answer: string; division?: { kind: string; friends?: number; size?: number; total: number } };

// Re-derive the expected answer from the printed prompt alone.
function expectedAnswer(p: P): string | null {
    let m: RegExpMatchArray | null;
    // Fact family: one product unlocks both division facts.
    if ((m = p.prompt.match(/^(\d+) × (\d+) = (\d+)\.\n\(a\) \3 ÷ \1 = __\n\(b\) \3 ÷ \2 = __$/))) {
        const a = +m[1], b = +m[2];
        if (a * b !== +m[3]) return null;
        return `${b}, ${a}`;
    }
    // Missing divisor: p ÷ __ = q → d = p / q (must divide exactly).
    if ((m = p.prompt.match(/^(\d+) ÷ __ = (\d+)$/))) {
        const p2 = +m[1], q = +m[2];
        if (p2 % q !== 0) return null;
        return `${p2 / q}`;
    }
    // Two quantities shared between the SAME d friends.
    if ((m = p.prompt.match(/^There are (\d+) \w+ and (\d+) \w+\. They are shared equally between (\d+) friends\.\n\(a\)/))) {
        const c1 = +m[1], c2 = +m[2], d = +m[3];
        if (c1 % d !== 0 || c2 % d !== 0) return null;
        return `${c1 / d}, ${c2 / d}`;
    }
    // Reverse sharing: recover the total, then re-share with d2 children.
    if ((m = p.prompt.match(/^(\w+) gives (\d+) \w+ to each of (\d+) children, and there are none left over\.\n\(a\) How many \w+ are there altogether\? __\n\(b\) If they were shared equally between (\d+) children instead, how many would each child get\? __$/))) {
        const q = +m[2], d = +m[3], d2 = +m[4];
        const total = q * d;
        if (total % d2 !== 0) return null;
        return `${total}, ${total / d2}`;
    }
    // Grouping with leftovers: full groups AND the remainder.
    if ((m = p.prompt.match(/^There are (\d+) \w+\. They are put into groups of (\d+)\.\n\(a\) How many FULL groups can be made\? __\n\(b\) How many \w+ are left over\? __$/))) {
        const total = +m[1], d = +m[2];
        return `${Math.floor(total / d)}, ${total % d}`;
    }
    // Sharing story (single answer).
    if ((m = p.prompt.match(/^(\w+) had (\d+) \w+\. \1 shared them equally between (\d+) friends\. How many \w+ does each friend get\? __$/))) {
        const total = +m[2], d = +m[3];
        if (total % d !== 0) return null;
        return `${total / d}`;
    }
    // Grouping story (single answer).
    if ((m = p.prompt.match(/^There are (\d+) \w+\. They are put into groups of (\d+)\. How many groups are there\? __$/))) {
        const total = +m[1], d = +m[2];
        if (total % d !== 0) return null;
        return `${total / d}`;
    }
    return null;
}

describe('division plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, prose layout and reduced page size', () => {
        expect(divisionSpec.id).toBe('division');
        expect(divisionSpec.label).toBe('Division');
        expect(divisionSpec.icon).toBe('÷');
        expect(divisionSpec.singleColumn).toBe(true);
        // Density regression: four items per page (was 12, then 5) — diagrams
        // and multi-part stories need the working space (T3M3 — see
        // plugins/layout-capacity.test.ts).
        expect(divisionSpec.perPage).toBe(4);
    });

    it('describes its numeric scope', () => {
        expect(divisionSpec.scope(g2)).toBe('equal sharing within 100');
    });
});

describe('division — availability gating', () => {
    it('Prep and Year 1 do not offer division (equal sharing starts in Y2)', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toEqual([]);
    });
});

describe('division — Year 2', () => {
    it('matches the exact sheet (fact-family and reverse answers re-checkable)', () => {
        expect(sheet(g2)).toEqual([
            {"prompt":"Kai gives 4 balloons to each of 6 children, and there are none left over.\n(a) How many balloons are there altogether? __\n(b) If they were shared equally between 4 children instead, how many would each child get? __","answer":"24, 6","id":1,"type":"division"},
            {"prompt":"Max had 90 flowers. Max shared them equally between 9 friends. How many flowers does each friend get? __","answer":"10","id":2,"type":"division"},
            {"prompt":"32 ÷ __ = 4","answer":"8","id":3,"type":"division"},
            {"prompt":"Sam gives 3 cars to each of 4 children, and there are none left over.\n(a) How many cars are there altogether? __\n(b) If they were shared equally between 3 children instead, how many would each child get? __","answer":"12, 4","id":4,"type":"division"},
        ]);
    });
});

describe('division — correctness, diagrams and determinism regression (10 pages)', () => {
    const problems = generateDocument(divisionSpec, g2, seedFrom([2, 'division', 0]), 10).pages.flat() as unknown as P[];
    it('every answer re-derived from its prompt', () => {
        for (const p of problems) {
            const exp = expectedAnswer(p);
            expect(exp, `unrecognised prompt: ${p.prompt}`).not.toBeNull();
            expect(p.answer).toBe(exp);
        }
    });
    it('≥50% of items are connected multi-part tasks', () => {
        const multi = problems.filter((p) => p.prompt.includes('(a)') && p.prompt.includes('(b)')).length;
        expect(multi / problems.length).toBeGreaterThanOrEqual(0.5);
    });
    it('equal-group diagrams only attach when they fit A4 (≤6 buckets, ≤36 dots)', () => {
        for (const p of problems) {
            if (!p.division) continue;
            const buckets = p.division.kind === 'share' ? p.division.friends : p.division.size;
            expect(buckets).toBeGreaterThanOrEqual(2);
            expect(buckets).toBeLessThanOrEqual(6);
            expect(p.division.total).toBeLessThanOrEqual(36);
            expect(p.division.total % (buckets as number)).toBe(0);
            expect(p.division.total / (buckets as number)).toBeLessThanOrEqual(6);
        }
    });
    it('dividends stay within multCap² (100) and divisors ≥ 2', () => {
        for (const p of problems) {
            for (const m of p.prompt.matchAll(/(\d+) ÷/g)) expect(+m[1]).toBeLessThanOrEqual(100);
            for (const m of p.prompt.matchAll(/between (\d+) (?:friends|children)/g)) expect(+m[1]).toBeGreaterThanOrEqual(2);
        }
    });
    it('page 1 never repeats; only × ÷ ° beyond ASCII; deterministic', () => {
        const page1 = generateSheet(divisionSpec, g2, seedFrom([2, 'division', 0]));
        expect(new Set(page1.map((p) => p.prompt)).size).toBe(page1.length);
        for (const p of problems) expect(p.prompt).toMatch(/^[ -~×÷\n]+$/);
        const seed = seedFrom([2, 'division', 0]);
        expect(divisionSpec.generate(createRng(seed), g2.caps, 40)).toEqual(divisionSpec.generate(createRng(seed), g2.caps, 40));
    });
});
