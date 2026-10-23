// Unit tests for the MULTIPLICATION & DIVISION worksheet plugin (T4 expansion).
//
// Deterministic-generator strategy (see plugins/AdditionWorksheet.test.ts):
// the ENTIRE first page per offered grade is pinned exactly with the
// framework seed; tier counts are 2+4+2 on this 8-per-page sheet (retuned
// from 10 because the sentence prompts wrap to five 22px lines — see
// plugins/layout-capacity.test.ts).
import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet } from '../../framework';
import { multiDivSpec } from './MultiplyDivideWorksheet';

const g3 = getMathGradeConfig(3);
const g4 = getMathGradeConfig(4);
const g5 = getMathGradeConfig(5);
const g6 = getMathGradeConfig(6);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(multiDivSpec, grade, seedFrom([grade.id, multiDivSpec.id, 0]));
}

describe('multidiv plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(multiDivSpec.id).toBe('multidiv');
        expect(multiDivSpec.label).toBe('Multiplication & Division');
        expect(multiDivSpec.icon).toBe('×÷');
        expect(multiDivSpec.perPage).toBe(8);
    });

    it('describes its year-tiered scope from the grade caps', () => {
        expect(multiDivSpec.scope(g4)).toBe('multiples of ten & powers of ten (AC9M4N05)');
        expect(multiDivSpec.scope(g5)).toBe('2-digit products & remainders (AC9M5N06-07)');
        expect(multiDivSpec.scope(g6)).toBe('efficient algorithms & decimal powers of ten (AC9M6N06)');
    });

    it('is gated to Years 4..6 (multCap 100 ceiling; hidden on Y3 and Y7)', () => {
        expect(multiDivSpec.offered(g3)).toBe(false);
        expect(multiDivSpec.offered(g4)).toBe(true);
        expect(multiDivSpec.offered(g5)).toBe(true);
        expect(multiDivSpec.offered(g6)).toBe(true);
        expect(multiDivSpec.offered(getMathGradeConfig(7))).toBe(false);
    });
});

describe('multidiv — Year 4 (multiples of ten, AC9M4N05)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g4)).toEqual([
            { prompt: 'Starter: 60 ÷ 10 = __', answer: '6', id: 1, type: 'multidiv' },
            { prompt: 'Starter: 500 ÷ 100 = __', answer: '5', id: 2, type: 'multidiv' },
            { prompt: 'Practice: 32 ÷ 4 = 8, so 320 ÷ 4 = __', answer: '80', id: 3, type: 'multidiv' },
            { prompt: 'Practice: 2 × 5 = 10, so 20 × 5 = __', answer: '100', id: 4, type: 'multidiv' },
            { prompt: 'Practice: 640 ÷ 8 = __', answer: '80', id: 5, type: 'multidiv' },
            { prompt: 'Practice: 250 ÷ 5 = __', answer: '50', id: 6, type: 'multidiv' },
            { prompt: 'Challenge: __ × 80 = 640', answer: '8', id: 7, type: 'multidiv' },
            { prompt: 'Challenge: True or false: 90 × 4 = 370. __', answer: 'Wrong', wideBlanks: true, id: 8, type: 'multidiv' }
        ]);
    });
});

describe('multidiv — Year 5 (2-digit products & remainders, AC9M5N06-07)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g5)).toEqual([
            { prompt: 'Starter: 35 × 3 = __', answer: '105', id: 1, type: 'multidiv' },
            { prompt: 'Starter: 54 ÷ 6 = __', answer: '9', id: 2, type: 'multidiv' },
            { prompt: 'Practice: 42 ÷ 3 = __', answer: '14', id: 3, type: 'multidiv' },
            { prompt: 'Practice: 119 ÷ 7 = __', answer: '17', id: 4, type: 'multidiv' },
            { prompt: 'Practice: 112 ÷ 7 = __', answer: '16', id: 5, type: 'multidiv' },
            { prompt: 'Practice: 29 × 14 = __', answer: '406', id: 6, type: 'multidiv' },
            { prompt: 'Challenge: 64 lollies are packed into bags of 5. That fills __ full bags and __ are left over.', answer: '12, 4', id: 7, type: 'multidiv' },
            { prompt: 'Challenge: 10 × 12 = 120, so 120 ÷ 12 = __', answer: '10', id: 8, type: 'multidiv' }
        ]);
    });

    it('the remainder story answers satisfy dividend = bags × size + remainder', () => {
        for (const p of sheet(g5)) {
            const m = p.prompt.match(/(\d+) lollies are packed into bags of (\d+)/);
            if (m) {
                const [bags, rest] = p.answer.split(', ').map(Number);
                expect(bags * Number(m[2]) + rest).toBe(Number(m[1]));
                expect(rest).toBeLessThan(Number(m[2]));
            }
        }
    });
});

describe('multidiv — Year 6 (algorithms & decimal powers of ten, AC9M6N06)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g6)).toEqual([
            { prompt: 'Starter: 0.87 × 10 = __', answer: '8.7', id: 1, type: 'multidiv' },
            { prompt: 'Starter: 9.3 ÷ 100 = __', answer: '0.093', id: 2, type: 'multidiv' },
            { prompt: 'Practice: 15.6 ÷ 4 = __', answer: '3.9', id: 3, type: 'multidiv' },
            { prompt: 'Practice: 45 × 15 = __', answer: '675', id: 4, type: 'multidiv' },
            { prompt: 'Practice: 56.4 ÷ 6 = __', answer: '9.4', id: 5, type: 'multidiv' },
            { prompt: 'Practice: 874 ÷ 23 = __', answer: '38', id: 6, type: 'multidiv' },
            { prompt: 'Challenge: A 10.5 m rope is cut into 5 equal pieces. Each piece is __ m.', answer: '2.1', id: 7, type: 'multidiv' },
            { prompt: 'Challenge: A 40.5 m rope is cut into 5 equal pieces. Each piece is __ m.', answer: '8.1', id: 8, type: 'multidiv' }
        ]);
    });
});

describe('multidiv — scaffolded learning sequence', () => {
    it('every Year 4..6 page prints 2 scaffold + 4 core + 2 stretch rows', () => {
        for (const grade of [g4, g5, g6]) {
            const s = sheet(grade);
            expect(s.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(2);
            expect(s.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(s.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(2);
        }
    });
});
