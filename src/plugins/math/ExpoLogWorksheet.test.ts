// Unit tests for the EXPONENTIALS & LOGARITHMS worksheet plugin (Year 11
// senior expansion).
//
// Strategy (see plugins/CalculusWorksheet.test.ts): the ENTIRE first page is
// pinned exactly with the framework seed, and every answer family is then
// re-derived INDEPENDENTLY from the printed prompt across many seeds — log
// answers are verified by exponentiating (b^answer must equal the printed
// value), index-law answers by the drawn exponent arithmetic, and fractional
// indices by answer^d === base^n.
import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, generateDocument } from '../../framework';
import { expoLogSpec } from './ExpoLogWorksheet';

const g11 = getMathGradeConfig(11);

function sheet(refresh = 0) {
    return generateSheet(expoLogSpec, g11, seedFrom([g11.id, expoLogSpec.id, refresh]));
}

describe('expolog plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(expoLogSpec.id).toBe('expolog');
        expect(expoLogSpec.label).toBe('Exponentials & Logarithms');
        expect(expoLogSpec.icon).toBe('㏒');
        expect(expoLogSpec.perPage).toBe(8);
    });

    it('describes its senior scope line', () => {
        expect(expoLogSpec.scope(g11)).toBe('index laws, fractional indices, logs & exponential equations');
    });

    it('is offered on Year 11 ONLY', () => {
        for (let id = 0; id <= 12; id++) {
            expect(expoLogSpec.offered(getMathGradeConfig(id))).toBe(id === 11);
        }
    });
});

describe('expolog — Year 11 first page (deterministic pin)', () => {
    it('matches the exact first page', () => {
        expect(sheet()).toEqual([
            { prompt: 'Starter: 5^2 = __', answer: '25', id: 1, type: 'expolog' },
            { prompt: 'Starter: 2^3 = __', answer: '8', id: 2, type: 'expolog' },
            { prompt: 'Practice: If log_4 x = 3, then x = __', answer: '64', id: 3, type: 'expolog' },
            { prompt: 'Practice: 2^4 ÷ 2^2 = 2^__', answer: '2', id: 4, type: 'expolog' },
            { prompt: 'Practice: 5^-1 × 5^5 = 5^__', answer: '4', id: 5, type: 'expolog' },
            { prompt: 'Practice: If log_2 x = 3, then x = __', answer: '8', id: 6, type: 'expolog' },
            { prompt: 'Challenge: log_5 5 + log_5 5 = __', answer: '2', id: 7, type: 'expolog' },
            { prompt: 'Challenge: 625^(3/4) = __', answer: '125', id: 8, type: 'expolog' }
        ]);
    });

    it('the same seed regenerates the identical sheet; a re-roll changes it', () => {
        const again = generateSheet(expoLogSpec, g11, seedFrom([g11.id, expoLogSpec.id, 0]));
        expect(again).toEqual(sheet());
        const doc = generateDocument(expoLogSpec, g11, seedFrom([g11.id, expoLogSpec.id, 1]), 2);
        expect(doc.pages[0]).not.toEqual(sheet());
    });

    it('every page prints the 2 + 4 + 2 scaffolded tiers', () => {
        const doc = generateDocument(expoLogSpec, g11, seedFrom([g11.id, expoLogSpec.id, 3]), 5);
        for (const page of doc.pages) {
            expect(page.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(2);
            expect(page.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(page.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(2);
        }
    });
});

// ── Independent mathematical validation across seeds ────────────────────────
describe('expolog — answers re-derived from the printed prompts (many seeds)', () => {
    const all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((refresh) =>
        generateDocument(expoLogSpec, g11, seedFrom([g11.id, expoLogSpec.id, refresh]), 4).pages.flat()
    );

    it('index-law answers equal the exponent sum/product/quotient read from the printed statement', () => {
        let prodChecked = 0;
        let powChecked = 0;
        let quotChecked = 0;
        let negProdChecked = 0;
        for (const p of all) {
            const prod = p.prompt.match(/^Starter: (\d+)\^(\d+) × (\d+)\^(\d+) = (\d+)\^__$/);
            if (prod) {
                prodChecked += 1;
                expect(prod[1]).toBe(prod[5]); // one common base throughout
                expect(Number(p.answer)).toBe(Number(prod[2]) + Number(prod[4]));
            }
            const pow = p.prompt.match(/^Starter: \((\d+)\^(\d+)\)\^(\d+) = (\d+)\^__$/);
            if (pow) {
                powChecked += 1;
                expect(pow[1]).toBe(pow[4]);
                expect(Number(p.answer)).toBe(Number(pow[2]) * Number(pow[3]));
            }
            const quot = p.prompt.match(/^Practice: (\d+)\^(\d+) ÷ (\d+)\^(\d+) = (\d+)\^__$/);
            if (quot) {
                quotChecked += 1;
                expect(quot[1]).toBe(quot[5]);
                expect(Number(p.answer)).toBe(Number(quot[2]) - Number(quot[4]));
            }
            const negProd = p.prompt.match(/^Practice: (\d+)\^-(\d+) × (\d+)\^(\d+) = (\d+)\^__$/);
            if (negProd) {
                negProdChecked += 1;
                expect(negProd[1]).toBe(negProd[5]);
                expect(Number(p.answer)).toBe(-Number(negProd[2]) + Number(negProd[4]));
            }
        }
        expect(prodChecked).toBeGreaterThanOrEqual(10);
        expect(powChecked).toBeGreaterThanOrEqual(10);
        expect(quotChecked).toBeGreaterThanOrEqual(10);
        expect(negProdChecked).toBeGreaterThanOrEqual(10);
    });

    it('power evaluations (positive and negative) equal the printed base/exponent', () => {
        let posChecked = 0;
        let negChecked = 0;
        for (const p of all) {
            const pos = p.prompt.match(/^Starter: (\d+)\^(\d+) = __$/);
            if (pos) {
                posChecked += 1;
                expect(Number(p.answer)).toBe(Number(pos[1]) ** Number(pos[2]));
            }
            const neg = p.prompt.match(/^Starter: (\d+)\^-(\d+) = __$/);
            if (neg) {
                negChecked += 1;
                // Negative powers print as the exact unit fraction "1/b^e".
                expect(p.answer).toBe(`1/${Number(neg[1]) ** Number(neg[2])}`);
            }
        }
        expect(posChecked).toBeGreaterThanOrEqual(10);
        expect(negChecked).toBeGreaterThanOrEqual(10);
    });

    it('log evaluations, log equations and exponential equations close under b^answer', () => {
        let evalChecked = 0;
        let eqnChecked = 0;
        let inverseChecked = 0;
        for (const p of all) {
            const logEval = p.prompt.match(/^Practice: log_(\d+) (\d+) = __$/);
            if (logEval) {
                evalChecked += 1;
                // b^answer must equal the printed value exactly.
                expect(Number(logEval[1]) ** Number(p.answer)).toBe(Number(logEval[2]));
            }
            const expEq = p.prompt.match(/^Practice: Solve (\d+)\^x = (\d+)\. x = __$/);
            if (expEq) {
                eqnChecked += 1;
                expect(Number(expEq[1]) ** Number(p.answer)).toBe(Number(expEq[2]));
            }
            const logEq = p.prompt.match(/^Practice: If log_(\d+) x = (\d+), then x = __$/);
            if (logEq) {
                inverseChecked += 1;
                expect(Number(logEq[1]) ** Number(p.answer)).toBeGreaterThan(1);
                // The equation log_b x = e is answered by x = b^e exactly.
                expect(p.answer).toBe(String(Number(logEq[1]) ** Number(logEq[2])));
            }
        }
        expect(evalChecked).toBeGreaterThanOrEqual(15);
        expect(eqnChecked).toBeGreaterThanOrEqual(15);
        expect(inverseChecked).toBeGreaterThanOrEqual(15);
    });

    it('fractional-index answers satisfy answer^d === base^n (exact rational power)', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Challenge: (\d+)\^\((\d+)\/(\d+)\) = __$/);
            if (!m) continue;
            checked += 1;
            const base = Number(m[1]);
            const n = Number(m[2]);
            const d = Number(m[3]);
            const answer = Number(p.answer);
            // a^(n/d) = m^n where a = m^d: (m^n)^d = m^(n·d) = a^n.
            expect(answer ** d).toBe(base ** n);
            // The printed fraction is already in lowest terms.
            const g = (a: number, b: number): number => (b === 0 ? a : g(b, a % b));
            expect(g(n, d)).toBe(1);
        }
        expect(checked).toBeGreaterThanOrEqual(10);
    });

    it('log-law answers equal the combined exponent (sum or difference of the printed logs)', () => {
        let sumChecked = 0;
        let diffChecked = 0;
        for (const p of all) {
            const sum = p.prompt.match(/^Challenge: log_(\d+) (\d+) \+ log_(\d+) (\d+) = __$/);
            if (sum) {
                sumChecked += 1;
                expect(sum[1]).toBe(sum[3]); // one common base throughout
                // log_b(u) + log_b(w) = log_b(uw): the answer's exponent must
                // satisfy b^answer === u·w.
                expect(Number(sum[1]) ** Number(p.answer)).toBe(Number(sum[2]) * Number(sum[4]));
            }
            const diff = p.prompt.match(/^Challenge: log_(\d+) (\d+) - log_(\d+) (\d+) = __$/);
            if (diff) {
                diffChecked += 1;
                expect(diff[1]).toBe(diff[3]);
                expect(Number(diff[1]) ** Number(p.answer)).toBe(Number(diff[2]) / Number(diff[4]));
            }
        }
        expect(sumChecked).toBeGreaterThanOrEqual(10);
        expect(diffChecked).toBeGreaterThanOrEqual(10);
    });
});
