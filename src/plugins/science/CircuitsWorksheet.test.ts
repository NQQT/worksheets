// Unit tests for the CIRCUITS & OHM'S LAW worksheet plugin (Physic, R5).
//
// Pinned here:
//   1. the declarative spec + the four-rung scope ladder;
//   2. availability + the 4-level cap;
//   3. exact sheets for every level (V=I×R → hidden I/R → series → parallel);
//   4. INDEPENDENT SOUNDNESS across many seeds — every answer re-derived
//      from the prompt's given quantities: V = I·R exact, series total =
//      the sum, parallel totals = product ÷ sum from a verified pair table,
//      parallel-current voltages an exact multiple of Rtotal; explicit units
//      (A / Ω / V), no zero quantities (no zero divisors);
//   5. determinism / refresh / saturation seed parity.

import { describe, it, expect } from 'vitest';
import { seedFrom, getScienceGradeConfig, generateSheet, generateDocument, resolveDifficulty } from '../../framework';
import { circuitsSpec } from './CircuitsWorksheet';

const g0 = getScienceGradeConfig(0); // level 1
const g1 = getScienceGradeConfig(1); // level 2
const g2 = getScienceGradeConfig(2); // level 3
const g3 = getScienceGradeConfig(3); // level 4
const g4 = getScienceGradeConfig(4); // beyond the cap (unimplemented row)

function sheet(grade: ReturnType<typeof getScienceGradeConfig>) {
    return generateSheet(circuitsSpec, grade, seedFrom([grade.id, circuitsSpec.id, 0]));
}

// The verified parallel-pair table (duplicated here so the pin is an
// INDEPENDENT check of the plugin's data): total = r1·r2 ÷ (r1 + r2).
const PARALLEL_PAIRS: { r1: number; r2: number; total: number }[] = [
    { r1: 6, r2: 3, total: 2 },
    { r1: 12, r2: 4, total: 3 },
    { r1: 12, r2: 6, total: 4 },
    { r1: 18, r2: 9, total: 6 },
    { r1: 20, r2: 5, total: 4 },
    { r1: 15, r2: 10, total: 6 },
    { r1: 24, r2: 8, total: 6 },
    { r1: 30, r2: 6, total: 5 }
];

describe('circuits plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(circuitsSpec.id).toBe('circuits');
        expect(circuitsSpec.label).toBe('Circuits & Ohm\u2019s Law');
        expect(circuitsSpec.icon).toBe('⚡');
        // One-line prompts in the standard two-column grid.
        expect(circuitsSpec.perPage).toBe(8);
        expect(circuitsSpec.singleColumn).toBeUndefined();
    });

    it('describes its scope from the four rungs', () => {
        expect(circuitsSpec.scope(g0)).toBe('V = I × R');
        expect(circuitsSpec.scope(g1)).toBe('find current or resistance');
        expect(circuitsSpec.scope(g2)).toBe('series circuits');
        expect(circuitsSpec.scope(g3)).toBe('parallel circuits');
    });

    it('resolves through the shared science catalogue with the 4-level cap', () => {
        const plan = resolveDifficulty('physics', 'circuits', 99);
        expect(plan.maxLevel).toBe(4);
        expect(plan.effectiveLevel).toBe(4);
        expect(plan.saturated).toBe(true);
        expect(resolveDifficulty('physics', 'circuits', 1).notYetOffered).toBe(false);
    });
});

describe('circuits — availability gating', () => {
    it('generates at every implemented level; an unimplemented grade gives an empty sheet', () => {
        expect(sheet(g0)).toHaveLength(8);
        expect(sheet(g1)).toHaveLength(8);
        expect(sheet(g2)).toHaveLength(8);
        expect(sheet(g3)).toHaveLength(8);
        expect(sheet(g4)).toEqual([]);
    });
});

describe('circuits — exact sheets per level', () => {
    it('level 1 matches the exact sheet (V = I × R)', () => {
        expect(sheet(g0)).toEqual([
            { prompt: 'A circuit carries 1 A through a 2 Ω resistor. The voltage across the resistor is __ V.', answer: '2', id: 1, type: 'circuits' },
            { prompt: 'A circuit carries 5 A through a 10 Ω resistor. The voltage across the resistor is __ V.', answer: '50', id: 2, type: 'circuits' },
            { prompt: 'A circuit carries 5 A through a 4 Ω resistor. The voltage across the resistor is __ V.', answer: '20', id: 3, type: 'circuits' },
            { prompt: 'A circuit carries 8 A through a 8 Ω resistor. The voltage across the resistor is __ V.', answer: '64', id: 4, type: 'circuits' },
            { prompt: 'A circuit carries 12 A through a 10 Ω resistor. The voltage across the resistor is __ V.', answer: '120', id: 5, type: 'circuits' },
            { prompt: 'A circuit carries 4 A through a 11 Ω resistor. The voltage across the resistor is __ V.', answer: '44', id: 6, type: 'circuits' },
            { prompt: 'A circuit carries 11 A through a 5 Ω resistor. The voltage across the resistor is __ V.', answer: '55', id: 7, type: 'circuits' },
            { prompt: 'A circuit carries 8 A through a 9 Ω resistor. The voltage across the resistor is __ V.', answer: '72', id: 8, type: 'circuits' }
        ]);
    });

    it('level 2 matches the exact sheet (hidden current/resistance, exact construction)', () => {
        expect(sheet(g1)).toEqual([
            { prompt: 'A 27 V battery drives 3 A through a resistor. The resistance of that resistor is __ Ω.', answer: '9', id: 1, type: 'circuits' },
            { prompt: 'A circuit carries 1 A through a 12 Ω resistor. The voltage across the resistor is __ V.', answer: '12', id: 2, type: 'circuits' },
            { prompt: 'A 44 V battery drives a current through a 11 Ω resistor. The current is __ A.', answer: '4', id: 3, type: 'circuits' },
            { prompt: 'A 60 V battery drives 6 A through a resistor. The resistance of that resistor is __ Ω.', answer: '10', id: 4, type: 'circuits' },
            { prompt: 'A circuit carries 1 A through a 9 Ω resistor. The voltage across the resistor is __ V.', answer: '9', id: 5, type: 'circuits' },
            { prompt: 'A 96 V battery drives a current through a 8 Ω resistor. The current is __ A.', answer: '12', id: 6, type: 'circuits' },
            { prompt: 'A circuit carries 6 A through a 11 Ω resistor. The voltage across the resistor is __ V.', answer: '66', id: 7, type: 'circuits' },
            { prompt: 'A 56 V battery drives a current through a 8 Ω resistor. The current is __ A.', answer: '7', id: 8, type: 'circuits' }
        ]);
    });

    it('level 3 matches the exact sheet (series sums)', () => {
        expect(sheet(g2)).toEqual([
            { prompt: '12 Ω and 3 Ω resistors are connected in series. The total resistance is __ Ω.', answer: '15', id: 1, type: 'circuits' },
            { prompt: '8 Ω, 2 Ω and 7 Ω resistors are connected in series. The total resistance is __ Ω.', answer: '17', id: 2, type: 'circuits' },
            { prompt: '6 Ω and 4 Ω resistors are connected in series. The total resistance is __ Ω.', answer: '10', id: 3, type: 'circuits' },
            { prompt: '12 Ω, 7 Ω and 9 Ω resistors are connected in series. The total resistance is __ Ω.', answer: '28', id: 4, type: 'circuits' },
            { prompt: '12 Ω and 6 Ω resistors are connected in series. The total resistance is __ Ω.', answer: '18', id: 5, type: 'circuits' },
            { prompt: '3 Ω, 12 Ω and 9 Ω resistors are connected in series. The total resistance is __ Ω.', answer: '24', id: 6, type: 'circuits' },
            { prompt: '11 Ω and 2 Ω resistors are connected in series. The total resistance is __ Ω.', answer: '13', id: 7, type: 'circuits' },
            { prompt: '3 Ω, 5 Ω and 4 Ω resistors are connected in series. The total resistance is __ Ω.', answer: '12', id: 8, type: 'circuits' }
        ]);
    });

    it('level 4 matches the exact sheet (verified parallel pairs + multiple-voltage currents)', () => {
        expect(sheet(g3)).toEqual([
            { prompt: 'A 15 Ω resistor and a 10 Ω resistor are connected in parallel. The total resistance of the pair is __ Ω.', answer: '6', id: 1, type: 'circuits' },
            { prompt: 'A 24 V battery is connected across a 12 Ω and a 4 Ω resistor in parallel. The total current drawn from the battery is __ A.', answer: '8', id: 2, type: 'circuits' },
            { prompt: 'A 30 Ω resistor and a 6 Ω resistor are connected in parallel. The total resistance of the pair is __ Ω.', answer: '5', id: 3, type: 'circuits' },
            { prompt: 'A 30 V battery is connected across a 18 Ω and a 9 Ω resistor in parallel. The total current drawn from the battery is __ A.', answer: '5', id: 4, type: 'circuits' },
            { prompt: 'A 12 Ω resistor and a 6 Ω resistor are connected in parallel. The total resistance of the pair is __ Ω.', answer: '4', id: 5, type: 'circuits' },
            { prompt: 'A 18 V battery is connected across a 6 Ω and a 3 Ω resistor in parallel. The total current drawn from the battery is __ A.', answer: '9', id: 6, type: 'circuits' },
            { prompt: 'A 24 Ω resistor and a 8 Ω resistor are connected in parallel. The total resistance of the pair is __ Ω.', answer: '6', id: 7, type: 'circuits' },
            { prompt: 'A 8 V battery is connected across a 20 Ω and a 5 Ω resistor in parallel. The total current drawn from the battery is __ A.', answer: '2', id: 8, type: 'circuits' }
        ]);
    });
});

describe('circuits — independent soundness across many seeds', () => {
    // 10 pages × 8 rows per level ⇒ every form and (level 4) every pair of
    // the verified table is exercised.
    const streamFor = (grade: ReturnType<typeof getScienceGradeConfig>) =>
        generateDocument(circuitsSpec, grade, seedFrom([grade.id, circuitsSpec.id, 0]), 10).pages.flat();

    it('level 1 asks only for voltages; every answer is I × R exactly', () => {
        for (const p of streamFor(g0)) {
            const m = /^A circuit carries (\d+) A through a (\d+) Ω resistor\. The voltage across the resistor is __ V\.$/.exec(p.prompt);
            if (!m) throw new Error(`unrecognised level 1 prompt: ${p.prompt}`);
            const current = Number(m[1]);
            const resistance = Number(m[2]);
            // No zero currents/resistances (no zero divisors downstream).
            expect(Math.min(current, resistance)).toBeGreaterThan(0);
            expect(p.answer).toBe(`${current * resistance}`);
        }
    });

    it('level 2 deals all three forms and every hidden quotient is exact', () => {
        const stream = streamFor(g1);
        expect(stream.some((p) => p.prompt.includes('The voltage across the resistor is __ V.'))).toBe(true);
        expect(stream.some((p) => p.prompt.includes('The current is __ A.'))).toBe(true);
        expect(stream.some((p) => p.prompt.includes('The resistance of that resistor is __ Ω.'))).toBe(true);
        for (const p of stream) {
            const voltageForm = /^A circuit carries (\d+) A through a (\d+) Ω resistor\. The voltage across the resistor is __ V\.$/.exec(p.prompt);
            const currentForm = /^A (\d+) V battery drives a current through a (\d+) Ω resistor\. The current is __ A\.$/.exec(p.prompt);
            const resistanceForm = /^A (\d+) V battery drives (\d+) A through a resistor\. The resistance of that resistor is __ Ω\.$/.exec(p.prompt);
            if (voltageForm) {
                expect(p.answer).toBe(`${Number(voltageForm[1]) * Number(voltageForm[2])}`);
            } else if (currentForm) {
                const voltage = Number(currentForm[1]);
                const resistance = Number(currentForm[2]);
                // EXACT construction: V ÷ R is the whole-number current.
                expect(voltage % resistance).toBe(0);
                expect(p.answer).toBe(`${voltage / resistance}`);
            } else if (resistanceForm) {
                const voltage = Number(resistanceForm[1]);
                const current = Number(resistanceForm[2]);
                // EXACT construction: V ÷ I is the whole-number resistance.
                expect(voltage % current).toBe(0);
                expect(p.answer).toBe(`${voltage / current}`);
            } else {
                throw new Error(`unrecognised level 2 prompt: ${p.prompt}`);
            }
        }
    });

    it('level 3 totals are the exact series sums (2- and 3-resistor circuits)', () => {
        const stream = streamFor(g2);
        expect(stream.some((p) => p.prompt.includes(', ') && p.prompt.includes(' and '))).toBe(true);
        expect(stream.some((p) => !p.prompt.includes(', '))).toBe(true);
        for (const p of stream) {
            const m = /^(.+) resistors are connected in series\. The total resistance is __ Ω\.$/.exec(p.prompt);
            if (!m) throw new Error(`unrecognised level 3 prompt: ${p.prompt}`);
            const resistors = m[1].split(/, | and /).map((token) => Number(token.replace(' Ω', '')));
            expect([2, 3]).toContain(resistors.length);
            for (const r of resistors) expect(r).toBeGreaterThan(0);
            expect(p.answer).toBe(`${resistors.reduce((sum, r) => sum + r, 0)}`);
        }
    });

    it('level 4 totals come from the verified pair table; current forms divide exactly', () => {
        const stream = streamFor(g3);
        expect(stream.some((p) => p.prompt.includes('The total resistance of the pair is __ Ω.'))).toBe(true);
        expect(stream.some((p) => p.prompt.includes('The total current drawn from the battery is __ A.'))).toBe(true);
        for (const p of stream) {
            const totalForm = /^A (\d+) Ω resistor and a (\d+) Ω resistor are connected in parallel\. The total resistance of the pair is __ Ω\.$/.exec(p.prompt);
            const currentForm = /^A (\d+) V battery is connected across a (\d+) Ω and a (\d+) Ω resistor in parallel\. The total current drawn from the battery is __ A\.$/.exec(p.prompt);
            if (totalForm) {
                const r1 = Number(totalForm[1]);
                const r2 = Number(totalForm[2]);
                // The pair must be one of the verified table rows AND the
                // product ÷ sum must equal the printed answer exactly.
                const row = PARALLEL_PAIRS.find((pair) => pair.r1 === r1 && pair.r2 === r2);
                expect(row).toBeDefined();
                expect((r1 * r2) % (r1 + r2)).toBe(0);
                expect(p.answer).toBe(`${(r1 * r2) / (r1 + r2)}`);
            } else if (currentForm) {
                const voltage = Number(currentForm[1]);
                const r1 = Number(currentForm[2]);
                const r2 = Number(currentForm[3]);
                const row = PARALLEL_PAIRS.find((pair) => pair.r1 === r1 && pair.r2 === r2);
                expect(row).toBeDefined();
                const total = (r1 * r2) / (r1 + r2);
                // The battery voltage is an exact MULTIPLE of the pair's
                // total resistance — the current is a whole number of amps.
                expect(voltage % total).toBe(0);
                expect(p.answer).toBe(`${voltage / total}`);
            } else {
                throw new Error(`unrecognised level 4 prompt: ${p.prompt}`);
            }
        }
    });
});

describe('circuits — determinism, refresh and saturation', () => {
    it('same seed ⇒ identical sheet; a new refresh ⇒ different sheet', () => {
        const a = sheet(g3);
        const b = generateSheet(circuitsSpec, g3, seedFrom([g3.id, circuitsSpec.id, 0]));
        expect(b).toEqual(a);
        const rerolled = generateSheet(circuitsSpec, g3, seedFrom([g3.id, circuitsSpec.id, 1]));
        expect(rerolled).not.toEqual(a);
    });

    it('level 99 saturates to the level-4 sheet (same seed parts, same content)', () => {
        const atCap = sheet(g3);
        const overshot = generateSheet(circuitsSpec, g3, seedFrom([3, circuitsSpec.id, 0]));
        expect(overshot).toEqual(atCap);
    });
});
