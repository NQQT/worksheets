// Unit tests for the METRIC MEASUREMENT worksheet plugin (T4 expansion; T8
// restricts the Year 4 small→big family to at most two decimal places).
//
// Deterministic-generator strategy (see plugins/AdditionWorksheet.test.ts):
// the ENTIRE first page per offered grade is pinned exactly with the
// framework seed; tier counts are 2+4+2 on this 8-per-page sheet.
import { describe, it, expect } from 'vitest';
import { createRng, seedFrom, getMathGradeConfig, generateSheet } from '../../framework';
import { metricConvSpec } from './MetricConversionWorksheet';

const g3 = getMathGradeConfig(3);
const g4 = getMathGradeConfig(4);
const g5 = getMathGradeConfig(5);
const g6 = getMathGradeConfig(6);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(metricConvSpec, grade, seedFrom([grade.id, metricConvSpec.id, 0]));
}

describe('metricconv plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(metricConvSpec.id).toBe('metricconv');
        expect(metricConvSpec.label).toBe('Metric Measurement');
        expect(metricConvSpec.icon).toBe('⚖');
        expect(metricConvSpec.perPage).toBe(8);
    });

    it('describes its year-tiered scope from the grade caps', () => {
        expect(metricConvSpec.scope(g3)).toBe('suitable units & core equivalences (AC9M3M01-02)');
        expect(metricConvSpec.scope(g4)).toBe('instruments & related-unit conversions (AC9M4M01)');
        expect(metricConvSpec.scope(g5)).toBe('decimal conversions & mixed-unit ordering (AC9M5M01)');
        expect(metricConvSpec.scope(g6)).toBe('larger conversions, scales & dilations (AC9M6M01)');
    });

    it('is gated to Years 3..6 (metric conversion strand joins at Y3)', () => {
        expect(metricConvSpec.offered(getMathGradeConfig(2))).toBe(false);
        expect(metricConvSpec.offered(g3)).toBe(true);
        expect(metricConvSpec.offered(g6)).toBe(true);
        expect(metricConvSpec.offered(getMathGradeConfig(7))).toBe(false);
    });
});

describe('metricconv — Year 3 (units & equivalences, AC9M3M01-02)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g3)).toEqual([
            { prompt: 'Starter: Would you measure the length of a classroom in m or km? __', answer: 'm', id: 1, type: 'metricconv' },
            { prompt: 'Starter: 1 m = __ cm', answer: '100', id: 2, type: 'metricconv' },
            { prompt: 'Practice: 6 km = __ m', answer: '6000', id: 3, type: 'metricconv' },
            { prompt: 'Practice: 9 kg = __ g', answer: '9000', id: 4, type: 'metricconv' },
            { prompt: 'Practice: 4 L = __ mL', answer: '4000', id: 5, type: 'metricconv' },
            { prompt: 'Practice: 9 km = __ m', answer: '9000', id: 6, type: 'metricconv' },
            { prompt: 'Challenge: A 300 mL bottle and a 200 mL cup hold __ mL together.', answer: '500', id: 7, type: 'metricconv' },
            { prompt: 'Challenge: True or false: 1000 m is more than 1 km. __', answer: 'Wrong', wideBlanks: true, id: 8, type: 'metricconv' }
        ]);
    });
});

describe('metricconv — Year 4 (instruments & conversions, AC9M4M01)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g4)).toEqual([
            { prompt: 'Starter: A 1 L jug already holds 200 mL. It needs __ more mL to be full.', answer: '800', id: 1, type: 'metricconv' },
            { prompt: 'Starter: A 1 L jug already holds 400 mL. It needs __ more mL to be full.', answer: '600', id: 2, type: 'metricconv' },
            { prompt: 'Practice: 640 mL = __ L', answer: '0.64', id: 3, type: 'metricconv' },
            { prompt: 'Practice: 250 m = __ km', answer: '0.25', id: 4, type: 'metricconv' },
            { prompt: 'Practice: 390 cm = __ m', answer: '3.9', id: 5, type: 'metricconv' },
            { prompt: 'Practice: 330 mL = __ L', answer: '0.33', id: 6, type: 'metricconv' },
            { prompt: 'Challenge: Which is heavier: 1900 g or 1 kg? __', answer: '1900 g', id: 7, type: 'metricconv' },
            { prompt: 'Challenge: Which is heavier: 700 g or 1 kg? __', answer: '1 kg', id: 8, type: 'metricconv' }
        ]);
    });

    // T8 REGRESSION: the old 5-step draw produced 3-place answers like
    // "105 m = 0.105 km" — Year 5 decimal work. Year 4 small→big values are
    // now multiples of 10, so across many seeds the answer NEVER exceeds two
    // decimal places, and it always equals the exact v/factor conversion.
    it('small→big answers stay within two decimal places (T8, many seeds)', () => {
        let checked = 0;
        const FACTOR: Record<string, number> = { 'm': 100, 'km': 1000, 'kg': 1000, 'L': 1000 };
        for (let r = 0; r < 30; r++) {
            const items = metricConvSpec.generate(createRng(seedFrom([g4.id, metricConvSpec.id, r])), g4.caps, 200);
            for (const p of items) {
                const m = p.prompt.match(/^Practice: (\d+) (cm|m|g|mL) = __ (m|km|kg|L)$/);
                if (!m) continue;
                checked += 1;
                const decimals = (p.answer.split('.')[1] ?? '').length;
                expect(decimals).toBeLessThanOrEqual(2);
                // Exact: answer === small / factor. Division by a power of 10
                // and decimal-string parsing both round to the nearest double,
                // so this is exact (multiplying back would hit fp drift).
                expect(Number(p.answer)).toBe(Number(m[1]) / FACTOR[m[3]]);
            }
        }
        expect(checked).toBeGreaterThanOrEqual(30); // family actually exercised
    });
});

describe('metricconv — Year 5 (decimal conversions, AC9M5M01)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g5)).toEqual([
            { prompt: 'Starter: 3 kg = __ g', answer: '3000', id: 1, type: 'metricconv' },
            { prompt: 'Starter: 3000 mL = __ L', answer: '3', id: 2, type: 'metricconv' },
            { prompt: 'Practice: 53.6 m = __ cm', answer: '5360', id: 3, type: 'metricconv' },
            { prompt: 'Practice: 0.81 km = __ m', answer: '810', id: 4, type: 'metricconv' },
            { prompt: 'Practice: Write smallest first: 600 g, 1.6 kg, 400 g __', answer: '400 g, 600 g, 1.6 kg', wideBlanks: true, id: 5, type: 'metricconv' },
            { prompt: 'Practice: 0.17 km = __ m', answer: '170', id: 6, type: 'metricconv' },
            { prompt: 'Challenge: A 1.8 km run done twice is __ km in all.', answer: '3.6', id: 7, type: 'metricconv' },
            { prompt: 'Challenge: A recipe needs a quarter a litre of milk. That is __ mL.', answer: '250', id: 8, type: 'metricconv' }
        ]);
    });
});

describe('metricconv — Year 6 (larger conversions & scales, AC9M6M01)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g6)).toEqual([
            { prompt: 'Starter: 0.609 km = __ m', answer: '6090', id: 1, type: 'metricconv' },
            { prompt: 'Starter: 0.319 kg = __ g', answer: '3190', id: 2, type: 'metricconv' },
            { prompt: 'Practice: On a map, 1 cm stands for 5 km. 7 cm stands for __ km', answer: '35', id: 3, type: 'metricconv' },
            { prompt: 'Practice: On a map, 1 cm stands for 2 km. 7 cm stands for __ km', answer: '14', id: 4, type: 'metricconv' },
            { prompt: 'Practice: On a map, 1 cm stands for 5 km. 6 cm stands for __ km', answer: '30', id: 5, type: 'metricconv' },
            { prompt: 'Practice: 8990 g = __ kg', answer: '8.99', id: 6, type: 'metricconv' },
            { prompt: 'Challenge: 4600 m = __ km', answer: '4.6', id: 7, type: 'metricconv' },
            { prompt: 'Challenge: A 4 cm by 4 cm photo is enlarged so every side is 3 times as long. The new area is __ cm²', answer: '144', id: 8, type: 'metricconv' }
        ]);
    });
});

describe('metricconv — scaffolded learning sequence', () => {
    it('every Year 3..6 page prints 2 scaffold + 4 core + 2 stretch rows', () => {
        for (const grade of [g3, g4, g5, g6]) {
            const s = sheet(grade);
            expect(s.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(2);
            expect(s.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(s.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(2);
        }
    });
});
