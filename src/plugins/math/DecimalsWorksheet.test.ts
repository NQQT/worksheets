// Unit tests for the DECIMALS worksheet plugin (T4 expansion).
//
// Deterministic-generator strategy (see plugins/AdditionWorksheet.test.ts):
// the ENTIRE first page per offered grade is pinned exactly with the
// framework seed; tier counts are 3+4+3 on this 10-per-page sheet.
import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet } from '../../framework';
import { decimalsSpec } from './DecimalsWorksheet';

const g3 = getMathGradeConfig(3);
const g4 = getMathGradeConfig(4);
const g5 = getMathGradeConfig(5);
const g6 = getMathGradeConfig(6);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(decimalsSpec, grade, seedFrom([grade.id, decimalsSpec.id, 0]));
}

describe('decimals plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(decimalsSpec.id).toBe('decimals');
        expect(decimalsSpec.label).toBe('Decimals');
        expect(decimalsSpec.icon).toBe('.5');
        // 10 per page two-column: the compact decimal sentences stay within
        // three wrapped 22px lines (layout-capacity.test.ts model).
        expect(decimalsSpec.perPage).toBe(10);
    });

    it('describes its year-tiered scope from the grade caps', () => {
        expect(decimalsSpec.scope(g4)).toBe('tenths & hundredths, fraction links (AC9M4N01)');
        expect(decimalsSpec.scope(g5)).toBe('thousandths, rounding & estimation (AC9M5N01, N08)');
        expect(decimalsSpec.scope(g6)).toBe('+/− to thousandths & powers of ten (AC9M6N05-06)');
    });

    it('is gated to Years 4..6 (decPlaces join; hidden on Y3 and Y7)', () => {
        expect(decimalsSpec.offered(g3)).toBe(false);
        expect(decimalsSpec.offered(g4)).toBe(true);
        expect(decimalsSpec.offered(g5)).toBe(true);
        expect(decimalsSpec.offered(g6)).toBe(true);
        expect(decimalsSpec.offered(getMathGradeConfig(7))).toBe(false);
    });
});

describe('decimals — Year 4 (tenths & hundredths, AC9M4N01)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g4)).toEqual([
            { prompt: 'Starter: 6/10 as a decimal: __', answer: '0.6', id: 1, type: 'decimals' },
            { prompt: 'Starter: 2.47 = 2 ones + 4 tenths + __ hundredths', answer: '7', id: 2, type: 'decimals' },
            { prompt: 'Starter: 4.58 = 4 ones + 5 tenths + __ hundredths', answer: '8', id: 3, type: 'decimals' },
            { prompt: 'Practice: $9.20 + $0.54 = $__', answer: '$9.74', id: 4, type: 'decimals' },
            { prompt: 'Practice: 0.5 + 0.3 = __', answer: '0.8', id: 5, type: 'decimals' },
            { prompt: 'Practice: $9.21 + $0.45 = $__', answer: '$9.66', id: 6, type: 'decimals' },
            { prompt: 'Practice: Which is larger: 0.16 or 0.83? __', answer: '0.83', id: 7, type: 'decimals' },
            { prompt: 'Challenge: 0.2 + __ = 1', answer: '0.8', id: 8, type: 'decimals' },
            { prompt: 'Challenge: 0.7 + __ = 1', answer: '0.3', id: 9, type: 'decimals' },
            { prompt: 'Challenge: Which is closer to 1: 0.7 or 0.79? __', answer: '0.79', id: 10, type: 'decimals' }
        ]);
    });
});

describe('decimals — Year 5 (thousandths & rounding, AC9M5N01/N08)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g5)).toEqual([
            { prompt: 'Starter: In 1.643, the digit 3 is in the __ place.', answer: 'thousandths', wideBlanks: true, id: 1, type: 'decimals' },
            { prompt: 'Starter: 87/1000 as a decimal: __', answer: '0.087', id: 2, type: 'decimals' },
            { prompt: 'Starter: 331/1000 as a decimal: __', answer: '0.331', id: 3, type: 'decimals' },
            { prompt: 'Practice: Round 9.149 to the nearest whole number: __', answer: '9', id: 4, type: 'decimals' },
            { prompt: 'Practice: Round 4.525 to the nearest whole number: __', answer: '5', id: 5, type: 'decimals' },
            { prompt: 'Practice: Which is larger: 6.947 or 3.568? __', answer: '6.947', id: 6, type: 'decimals' },
            { prompt: 'Practice: Round 4.240 to the nearest whole number: __', answer: '4', id: 7, type: 'decimals' },
            { prompt: 'Challenge: 2.1 + 7.1 is about __', answer: '9', id: 8, type: 'decimals' },
            { prompt: 'Challenge: A toy costs $2.32. Change from $10 is $__', answer: '$7.68', id: 9, type: 'decimals' },
            { prompt: 'Challenge: A toy costs $6.70. Change from $10 is $__', answer: '$3.30', id: 10, type: 'decimals' }
        ]);
    });
});

describe('decimals — Year 6 (+/− & powers of ten, AC9M6N05-06)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g6)).toEqual([
            { prompt: 'Starter: 14 - 1.26 = __', answer: '12.74', id: 1, type: 'decimals' },
            { prompt: 'Starter: 2.15 + 9.5 = __', answer: '11.65', id: 2, type: 'decimals' },
            { prompt: 'Starter: 7.17 + 2.6 = __', answer: '9.77', id: 3, type: 'decimals' },
            { prompt: 'Practice: 4.48 × 100 = __', answer: '448', id: 4, type: 'decimals' },
            { prompt: 'Practice: 7.0 × 3 = __', answer: '21.0', id: 5, type: 'decimals' },
            { prompt: 'Practice: 7.5 × 3 = __', answer: '22.5', id: 6, type: 'decimals' },
            { prompt: 'Practice: 9.69 × 100 = __', answer: '969', id: 7, type: 'decimals' },
            { prompt: 'Challenge: True or false: 0.48 × 100 = 48. __', answer: 'Correct', wideBlanks: true, id: 8, type: 'decimals' },
            { prompt: 'Challenge: A run of 7.42 km plus a walk of 1.92 km is __ km in all.', answer: '9.34', id: 9, type: 'decimals' },
            { prompt: 'Challenge: A run of 9.50 km plus a walk of 9.91 km is __ km in all.', answer: '19.41', id: 10, type: 'decimals' }
        ]);
    });
});

describe('decimals — scaffolded learning sequence', () => {
    it('every Year 4..6 page prints 3 scaffold + 4 core + 3 stretch rows', () => {
        for (const grade of [g4, g5, g6]) {
            const s = sheet(grade);
            expect(s.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(3);
            expect(s.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(s.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(3);
        }
    });
});

describe('decimals — grammar regression (T8)', () => {
    // The old vowel check attached "An" to the NUMBER, but the number sits
    // after "of" — it printed "An run of 8.19 km". Across many seeds every
    // run-of-km sentence must read "A run of …" (the article belongs to
    // "run"), and no prompt may contain the ungrammatical "An run".
    it('the run/walk sentence always uses "A run of" (never "An run")', () => {
        let checked = 0;
        for (let refresh = 0; refresh < 40; refresh++) {
            const s = generateSheet(decimalsSpec, g6, seedFrom([g6.id, decimalsSpec.id, refresh]));
            for (const p of s) {
                if (!p.prompt.includes(' run of ')) continue;
                checked += 1;
                expect(p.prompt).toMatch(/^Challenge: A run of \d+\.\d{2} km plus a walk of \d+\.\d{2} km is __ km in all\.$/);
                expect(p.prompt).not.toMatch(/An run/);
            }
        }
        expect(checked).toBeGreaterThanOrEqual(20); // family actually exercised
    });
});
