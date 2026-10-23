// Unit tests for the PERCENTAGES worksheet plugin (T4 expansion).
//
// Deterministic-generator strategy (see plugins/AdditionWorksheet.test.ts):
// the ENTIRE first page per offered grade is pinned exactly with the
// framework seed; tier counts are 3+4+3 on this 10-per-page sheet.
import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet } from '../../framework';
import { percentSpec } from './PercentWorksheet';

const g4 = getMathGradeConfig(4);
const g5 = getMathGradeConfig(5);
const g6 = getMathGradeConfig(6);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(percentSpec, grade, seedFrom([grade.id, percentSpec.id, 0]));
}

describe('percent plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(percentSpec.id).toBe('percent');
        expect(percentSpec.label).toBe('Percentages');
        expect(percentSpec.icon).toBe('%');
        expect(percentSpec.perPage).toBe(10);
    });

    it('describes its year-tiered scope from the grade caps', () => {
        expect(percentSpec.scope(g5)).toBe('benchmark % & fraction/decimal links (AC9M5N04)');
        expect(percentSpec.scope(g6)).toBe('% of quantities & discounts (AC9M6N07)');
    });

    it('is gated to Years 5..6 (percent joins at Y5, AC9M5N04)', () => {
        expect(percentSpec.offered(g4)).toBe(false);
        expect(percentSpec.offered(g5)).toBe(true);
        expect(percentSpec.offered(g6)).toBe(true);
        expect(percentSpec.offered(getMathGradeConfig(7))).toBe(false);
    });
});

describe('percent — Year 5 (benchmarks & links, AC9M5N04)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g5)).toEqual([
            { prompt: 'Starter: 10% = __/100', answer: '10', id: 1, type: 'percent' },
            { prompt: 'Starter: 50% of 60 = __', answer: '30', id: 2, type: 'percent' },
            { prompt: 'Starter: 10% of 60 = __', answer: '6', id: 3, type: 'percent' },
            { prompt: 'Practice: 1/5 as a %: __', answer: '20', id: 4, type: 'percent' },
            { prompt: 'Practice: What % of 32 is 8? __', answer: '25', id: 5, type: 'percent' },
            { prompt: 'Practice: 1/10 as a %: __', answer: '10', id: 6, type: 'percent' },
            { prompt: 'Practice: 3/4 as a %: __', answer: '75', id: 7, type: 'percent' },
            { prompt: 'Challenge: Half of 50% is __%', answer: '25', id: 8, type: 'percent' },
            { prompt: 'Challenge: 10% of 70 is __, so 20% of 70 is __', answer: '7, 14', id: 9, type: 'percent' },
            { prompt: 'Challenge: 10% of 80 is __, so 20% of 80 is __', answer: '8, 16', id: 10, type: 'percent' }
        ]);
    });

    it('every % answer is an exact whole number (integer-exact construction)', () => {
        for (const p of sheet(g5)) {
            for (const part of p.answer.split(', ')) {
                const n = parseInt(part, 10);
                if (!Number.isNaN(n)) expect(String(n)).toBe(part.replace('%', ''));
            }
        }
    });
});

describe('percent — Year 6 (% of quantities & discounts, AC9M6N07)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g6)).toEqual([
            { prompt: 'Starter: 10% of 60 = __', answer: '6', id: 1, type: 'percent' },
            { prompt: 'Starter: 75% of 96 = __', answer: '72', id: 2, type: 'percent' },
            { prompt: 'Starter: 75% of 92 = __', answer: '69', id: 3, type: 'percent' },
            { prompt: 'Practice: A $50 book is 10% off. You pay $__', answer: '$45', id: 4, type: 'percent' },
            { prompt: 'Practice: 20% = __/100', answer: '20', id: 5, type: 'percent' },
            { prompt: 'Practice: 2/5 as a %: __', answer: '40', id: 6, type: 'percent' },
            { prompt: 'Practice: 0.1 as a %: __', answer: '10', id: 7, type: 'percent' },
            { prompt: 'Challenge: You save $14 on a $56 jacket. The discount is __%', answer: '25', id: 8, type: 'percent' },
            { prompt: 'Challenge: 5% of 220 = __', answer: '11', id: 9, type: 'percent' },
            { prompt: 'Challenge: 5% of 100 = __', answer: '5', id: 10, type: 'percent' }
        ]);
    });
});

describe('percent — scaffolded learning sequence', () => {
    it('every Year 5..6 page prints 3 scaffold + 4 core + 3 stretch rows', () => {
        for (const grade of [g5, g6]) {
            const s = sheet(grade);
            expect(s.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(3);
            expect(s.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(s.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(3);
        }
    });
});
