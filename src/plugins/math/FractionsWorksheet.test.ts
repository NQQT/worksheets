// Unit tests for the FRACTIONS worksheet plugin (T4 expansion).
//
// Strategy (mirrors plugins/AdditionWorksheet.test.ts): the generator is
// DETERMINISTIC, so the ENTIRE first page per offered grade is pinned to the
// exact values produced with the framework seed seedFrom([grade.id, spec.id, 0]).
// The printed "Starter:/Practice:/Challenge:" prefixes carry the scaffold→
// core→stretch sequence (R4), so the per-page tier counts (2+4+2 on the
// 8-question sheet) are pinned too.
import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet } from '../../framework';
import { fractionsSpec } from './FractionsWorksheet';

const g2 = getMathGradeConfig(2);
const g3 = getMathGradeConfig(3);
const g4 = getMathGradeConfig(4);
const g5 = getMathGradeConfig(5);
const g6 = getMathGradeConfig(6);
const g7 = getMathGradeConfig(7);

// Helper: regenerate page 1 with the same seed the framework computes.
function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(fractionsSpec, grade, seedFrom([grade.id, fractionsSpec.id, 0]));
}

describe('fractions plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(fractionsSpec.id).toBe('fractions');
        expect(fractionsSpec.label).toBe('Fractions');
        expect(fractionsSpec.icon).toBe('½');
        // 8 per page two-column: the sentence prompts wrap to five 22px
        // lines, which only clear the 1fr row at this density (T3M3 model).
        expect(fractionsSpec.perPage).toBe(8);
        expect(fractionsSpec.singleColumn).toBeUndefined();
    });

    it('describes its year-tiered scope from the grade caps', () => {
        expect(fractionsSpec.scope(g3)).toBe('unit fractions, halves to tenths (AC9M3N02)');
        expect(fractionsSpec.scope(g4)).toBe('equivalent fractions & fraction-decimal links (AC9M4N01, N03-04)');
        expect(fractionsSpec.scope(g5)).toBe('compare & add/subtract related fractions (AC9M5N03-05)');
        expect(fractionsSpec.scope(g6)).toBe('ordering & related-fraction +/− incl. mixed numerals (AC9M6N03-04)');
    });

    it('is gated to Years 3..6 (denSet join; hidden on Y2 and Y7)', () => {
        expect(fractionsSpec.offered(g2)).toBe(false);
        expect(fractionsSpec.offered(g3)).toBe(true);
        expect(fractionsSpec.offered(g4)).toBe(true);
        expect(fractionsSpec.offered(g5)).toBe(true);
        expect(fractionsSpec.offered(g6)).toBe(true);
        expect(fractionsSpec.offered(g7)).toBe(false);
    });
});

describe('fractions — Year 3 (unit fractions, AC9M3N02)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g3)).toEqual([
            { prompt: 'Starter: Count in tenths: 1/10, 2/10, 3/10, __', answer: '4/10', id: 1, type: 'fractions' },
            { prompt: 'Starter: How many fifths make one whole? __', answer: '5', id: 2, type: 'fractions' },
            { prompt: 'Practice: __/4 + 1/4 = 4/4', answer: '3', id: 3, type: 'fractions' },
            { prompt: 'Practice: 2 of 3 equal parts are shaded. The fraction shaded is __', answer: '2/3', id: 4, type: 'fractions' },
            { prompt: 'Practice: __/10 + 6/10 = 10/10', answer: '4', id: 5, type: 'fractions' },
            { prompt: 'Practice: Which is bigger: 1/2 or 1/10? __', answer: '1/2', id: 6, type: 'fractions' },
            { prompt: 'Challenge: 5 people share one pizza equally. Each person gets __ of the pizza.', answer: '1/5', id: 7, type: 'fractions' },
            { prompt: 'Challenge: True or false: 1/2 is larger than 1/10. __', answer: 'Correct', wideBlanks: true, id: 8, type: 'fractions' }
        ]);
    });
});

describe('fractions — Year 4 (equivalence & decimal links, AC9M4N01/N03-04)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g4)).toEqual([
            { prompt: 'Starter: 8/10 as a decimal: __', answer: '0.8', id: 1, type: 'fractions' },
            { prompt: 'Starter: 3/10 as a decimal: __', answer: '0.3', id: 2, type: 'fractions' },
            { prompt: 'Practice: 0.49 = __/100', answer: '49', id: 3, type: 'fractions' },
            { prompt: 'Practice: 15/10 as a mixed number: __', answer: '1 5/10', id: 4, type: 'fractions' },
            { prompt: 'Practice: 5/3 as a mixed number: __', answer: '1 2/3', id: 5, type: 'fractions' },
            { prompt: 'Practice: Count in fifths: 5/5, 10/5, __', answer: '15/5', id: 6, type: 'fractions' },
            { prompt: 'Challenge: Who ate more: 1/2 or 8/12? __', answer: '8/12', id: 7, type: 'fractions' },
            { prompt: 'Challenge: Who ate more: 1/2 or 1/8? __', answer: '1/2', id: 8, type: 'fractions' }
        ]);
    });
});

describe('fractions — Year 5 (related-denominator +/−, AC9M5N03-05)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g5)).toEqual([
            { prompt: 'Starter: 3/4 - 2/4 = __/4', answer: '1', id: 1, type: 'fractions' },
            { prompt: 'Starter: 3/6 = __/12', answer: '6', id: 2, type: 'fractions' },
            { prompt: 'Practice: 9/12 - 1/3 = __/12', answer: '5', id: 3, type: 'fractions' },
            { prompt: 'Practice: Which is bigger: 1/6 or 7/12? __', answer: '7/12', id: 4, type: 'fractions' },
            { prompt: 'Practice: 1/5 + 1/10 = __/10', answer: '3', id: 5, type: 'fractions' },
            { prompt: 'Practice: 1/5 + 3/10 = __/10', answer: '5', id: 6, type: 'fractions' },
            { prompt: 'Challenge: A recipe needs 1/2 cup of milk and 3/6 cup of cocoa. The recipe needs __/6 cup in all.', answer: '6', id: 7, type: 'fractions' },
            { prompt: 'Challenge: 1 - 1/5 = __/5', answer: '4', id: 8, type: 'fractions' }
        ]);
    });
});

describe('fractions — Year 6 (ordering & mixed numerals, AC9M6N03-04)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g6)).toEqual([
            { prompt: 'Starter: 1/2 + 2/4 = __/4', answer: '4', id: 1, type: 'fractions' },
            { prompt: 'Starter: 1/3 + 2/6 = __/6', answer: '4', id: 2, type: 'fractions' },
            { prompt: 'Practice: Write smallest first: 4/8, 7/8, 6/8 __', answer: '4/8, 6/8, 7/8', wideBlanks: true, id: 3, type: 'fractions' },
            { prompt: 'Practice: Write smallest first: 3/4, 2/4, 1/4 __', answer: '1/4, 2/4, 3/4', wideBlanks: true, id: 4, type: 'fractions' },
            { prompt: 'Practice: Write smallest first: 2/5, 1/5, 3/5 __', answer: '1/5, 2/5, 3/5', wideBlanks: true, id: 5, type: 'fractions' },
            { prompt: 'Practice: Write smallest first: 8/12, 6/12, 10/12 __', answer: '6/12, 8/12, 10/12', wideBlanks: true, id: 6, type: 'fractions' },
            { prompt: 'Challenge: 2 3/4 + 2 1/8 = __', answer: '4 7/8', id: 7, type: 'fractions' },
            { prompt: 'Challenge: 1 1/2 + 3 5/12 = __', answer: '4 11/12', id: 8, type: 'fractions' }
        ]);
    });
});

describe('fractions — scaffolded learning sequence', () => {
    it('every Year 3..6 page prints 2 scaffold + 4 core + 2 stretch rows', () => {
        for (const grade of [g3, g4, g5, g6]) {
            const s = sheet(grade);
            expect(s.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(2);
            expect(s.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(s.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(2);
        }
    });
});
