// Unit tests for the ALGEBRA & REASONING worksheet plugin (T4 expansion; T8
// adds the semantic equation verification across seeds and years).
//
// Deterministic-generator strategy (see plugins/AdditionWorksheet.test.ts):
// the ENTIRE first page per offered grade is pinned exactly with the
// framework seed; tier counts are 2+4+2 on this 8-per-page sheet.
import { describe, it, expect } from 'vitest';
import { createRng, seedFrom, getMathGradeConfig, generateSheet } from '../../framework';
import { algebraSpec } from './AlgebraReasoningWorksheet';

const g3 = getMathGradeConfig(3);
const g4 = getMathGradeConfig(4);
const g5 = getMathGradeConfig(5);
const g6 = getMathGradeConfig(6);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(algebraSpec, grade, seedFrom([grade.id, algebraSpec.id, 0]));
}

// Evaluate a printed arithmetic expression: the sheets use × ÷ − (U+00D7,
// U+00F7, U+2212); convert to JS operators. Every character comes from the
// generator's own templates, so Function is safe here (no user input).
function evalExpr(s: string): number {
    const js = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    return Function(`"use strict"; return (${js});`)() as number;
}

// Collect a big cross-seed sample per year (200 items × 15 refresh seeds) —
// the semantic checks below run over ALL of them.
function sample(grade: ReturnType<typeof getMathGradeConfig>): { prompt: string; answer: string }[] {
    const out: { prompt: string; answer: string }[] = [];
    for (let r = 0; r < 15; r++) {
        out.push(...algebraSpec.generate(createRng(seedFrom([grade.id, algebraSpec.id, r])), grade.caps, 200));
    }
    return out;
}

describe('algebra plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(algebraSpec.id).toBe('algebra');
        expect(algebraSpec.label).toBe('Algebra & Reasoning');
        expect(algebraSpec.icon).toBe('□');
        expect(algebraSpec.perPage).toBe(8);
    });

    it('describes its year-tiered scope from the grade caps', () => {
        expect(algebraSpec.scope(g3)).toBe('unknowns & equivalent expressions (AC9M3A01)');
        expect(algebraSpec.scope(g4)).toBe('fact unknowns & patterns (AC9M4A01-02)');
        expect(algebraSpec.scope(g5)).toBe('brackets, patterns & precedence (AC9M5A01-02)');
        expect(algebraSpec.scope(g6)).toBe('brackets, precedence & replacement (AC9M6A01-04)');
    });

    it('is gated to Years 3..6 (algebra joins at Y3, AC9M3A01)', () => {
        expect(algebraSpec.offered(getMathGradeConfig(2))).toBe(false);
        expect(algebraSpec.offered(g3)).toBe(true);
        expect(algebraSpec.offered(g6)).toBe(true);
        expect(algebraSpec.offered(getMathGradeConfig(7))).toBe(false);
    });
});

describe('algebra — Year 3 (unknowns, AC9M3A01)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g3)).toEqual([
            { prompt: 'Starter: □ + 11 = 20. □ stands for __', answer: '9', id: 1, type: 'algebra' },
            { prompt: 'Starter: □ + 10 = 19. □ stands for __', answer: '9', id: 2, type: 'algebra' },
            { prompt: 'Practice: 3 + 6 = 6 + □. □ stands for __', answer: '3', id: 3, type: 'algebra' },
            { prompt: 'Practice: 5 + 2 = 3 + □. □ stands for __', answer: '4', id: 4, type: 'algebra' },
            { prompt: 'Practice: 5 + 8 = 6 + □. □ stands for __', answer: '7', id: 5, type: 'algebra' },
            { prompt: 'Practice: 8 + 9 = 9 + □. □ stands for __', answer: '8', id: 6, type: 'algebra' },
            { prompt: 'Challenge: □ + 5 = 6 + 4. □ stands for __', answer: '5', id: 7, type: 'algebra' },
            { prompt: 'Challenge: □ + 3 = 4 + 3. □ stands for __', answer: '4', id: 8, type: 'algebra' }
        ]);
    });

    // T8 REGRESSION: the old independent draw let c exceed a + b and print a
    // NEGATIVE unknown ("3 + 2 = 7 + __" = −2). Across seeds every
    // "a + b = c + □" unknown must be a positive Year 3 number.
    it('equivalent-expression unknowns are always positive (T8, many seeds)', () => {
        let checked = 0;
        for (const p of sample(g3)) {
            const m = p.prompt.match(/^Practice: (\d+) \+ (\d+) = (\d+) \+ □/);
            if (!m) continue;
            checked += 1;
            const box = Number(p.answer);
            expect(box).toBe(Number(m[1]) + Number(m[2]) - Number(m[3]));
            expect(box).toBeGreaterThanOrEqual(2);
        }
        expect(checked).toBeGreaterThanOrEqual(30); // family actually exercised
    });
});

describe('algebra — Year 4 (fact unknowns & patterns, AC9M4A01-02)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g4)).toEqual([
            { prompt: 'Starter: □ × 2 = 8. □ stands for __', answer: '4', id: 1, type: 'algebra' },
            { prompt: 'Starter: □ − 3 = 25. □ stands for __', answer: '28', id: 2, type: 'algebra' },
            { prompt: 'Practice: 33 ÷ □ = 3. □ stands for __', answer: '11', id: 3, type: 'algebra' },
            { prompt: 'Practice: □ × 5 + 4 = 49. □ stands for __', answer: '9', id: 4, type: 'algebra' },
            { prompt: 'Practice: 36 ÷ □ = 4. □ stands for __', answer: '9', id: 5, type: 'algebra' },
            { prompt: 'Practice: □ × 3 + 6 = 12. □ stands for __', answer: '2', id: 6, type: 'algebra' },
            { prompt: 'Challenge: Pattern: 6, 11, 16, 21, __ and __ (counting by 5s)', answer: '26, 31', id: 7, type: 'algebra' },
            { prompt: 'Challenge: Pattern: 6, 12, 18, 24, __ and __ (counting by 6s)', answer: '30, 36', id: 8, type: 'algebra' }
        ]);
    });
});

describe('algebra — Year 5 (brackets & precedence, AC9M5A01-02)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g5)).toEqual([
            { prompt: 'Starter: □ × 5 = 50. □ stands for __', answer: '10', id: 1, type: 'algebra' },
            { prompt: 'Starter: □ × 2 − 5 = 3. □ stands for __', answer: '4', id: 2, type: 'algebra' },
            { prompt: 'Practice: Pattern: 12, 16, 20, 24, __', answer: '28', id: 3, type: 'algebra' },
            { prompt: 'Practice: Pattern: 14, 18, 22, 26, __', answer: '30', id: 4, type: 'algebra' },
            { prompt: 'Practice: (2 + 4) × 7 = __', answer: '42', id: 5, type: 'algebra' },
            { prompt: 'Practice: Pattern: 6, 9, 12, 15, __', answer: '18', id: 6, type: 'algebra' },
            { prompt: 'Challenge: 7 + 2 × 3 = __', answer: '13', id: 7, type: 'algebra' },
            { prompt: 'Challenge: 2 + 8 × 7 = __', answer: '58', id: 8, type: 'algebra' }
        ]);
    });

    // T8 REGRESSION: the old draw could print a NEGATIVE total
    // ("□ × 4 − 9 = −1"). Across seeds every "□ × a − b = T" total is ≥ 1.
    it('two-operation subtraction totals are never negative (T8, many seeds)', () => {
        let checked = 0;
        for (const p of sample(g5)) {
            const m = p.prompt.match(/^Starter: □ × (\d+) − (\d+) = (\d+)\./);
            if (!m) continue;
            checked += 1;
            const total = Number(m[3]);
            expect(total).toBeGreaterThanOrEqual(1);
            expect(Number(p.answer) * Number(m[1]) - Number(m[2])).toBe(total);
        }
        expect(checked).toBeGreaterThanOrEqual(10);
    });
});

describe('algebra — Year 6 (precedence & replacement, AC9M6A01-04)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g6)).toEqual([
            { prompt: 'Starter: 7 × (□ + 8) = 91. □ stands for __', answer: '5', id: 1, type: 'algebra' },
            { prompt: 'Starter: 4 × (□ + 7) = 48. □ stands for __', answer: '5', id: 2, type: 'algebra' },
            { prompt: 'Practice: Pattern: 4, 8, 16, 32, __', answer: '64', id: 3, type: 'algebra' },
            { prompt: 'Practice: Pattern: 5, 15, 45, 135, __', answer: '405', id: 4, type: 'algebra' },
            { prompt: 'Practice: 28 − 4 × 4 = __', answer: '12', id: 5, type: 'algebra' },
            { prompt: 'Practice: 36 − 9 × 3 = __', answer: '9', id: 6, type: 'algebra' },
            { prompt: 'Challenge: If a = 3, then 2a + 1 = __', answer: '7', id: 7, type: 'algebra' },
            { prompt: 'Challenge: If a = 10, then 2a + 8 = __', answer: '28', id: 8, type: 'algebra' }
        ]);
    });
});

describe('algebra — semantic verification across seeds and years (T8)', () => {
    // Every "□ stands for" equation must be TRUE when the answer replaces □,
    // every "= __" evaluation must equal the answer, and NO prompt may print
    // a negative number (no negative numbers in the Years 3..6 scope).
    it('all equations hold with the printed answer; no negatives printed', () => {
        for (const grade of [g3, g4, g5, g6]) {
            for (const p of sample(grade)) {
                // No negative literal anywhere after an "=" (e.g. "= −5").
                expect(p.prompt).not.toMatch(/= −\d/);

                const box = p.prompt.match(/^(.+?)\. □ stands for __$/);
                if (box) {
                    const ans = Number(p.answer);
                    expect(Number.isInteger(ans)).toBe(true);
                    expect(ans).toBeGreaterThanOrEqual(2);
                    // Substitute □ into the equation and check both sides.
                    const eq = box[1].replace(/^Starter: |^Practice: |^Challenge: /, '');
                    const [lhs, rhsRaw] = eq.split('=');
                    const rhs = rhsRaw.replace(/\s+and.*$/, ''); // "□ is positive" tail
                    expect(evalExpr(lhs.replaceAll('□', `(${ans})`))).toBe(evalExpr(rhs.replaceAll('□', `(${ans})`)));
                    continue;
                }
                if (p.prompt.includes('Pattern:')) continue; // sequence items checked by their own exact pins
                // Symbol replacement ("If a = n, then ka + b = __") is not a
                // plain expression — verify the substitution arithmetically.
                const repl = p.prompt.match(/^Challenge: If a = (\d+), then (\d+)a \+ (\d+) = __$/);
                if (repl) {
                    expect(Number(p.answer)).toBe(Number(repl[2]) * Number(repl[1]) + Number(repl[3]));
                    continue;
                }
                const ev = p.prompt.match(/^(?:Starter|Practice|Challenge): (.+) = __$/);
                if (ev) {
                    const ans = Number(p.answer);
                    expect(Number.isInteger(ans)).toBe(true);
                    expect(ans).toBeGreaterThanOrEqual(1);
                    expect(evalExpr(ev[1])).toBe(ans);
                }
            }
        }
    });
});

describe('algebra — scaffolded learning sequence', () => {
    it('every Year 3..6 page prints 2 scaffold + 4 core + 2 stretch rows', () => {
        for (const grade of [g3, g4, g5, g6]) {
            const s = sheet(grade);
            expect(s.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(2);
            expect(s.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(s.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(2);
        }
    });
});
