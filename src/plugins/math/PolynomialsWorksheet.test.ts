// Unit tests for the POLYNOMIALS worksheet plugin (Year 11 senior expansion).
//
// Strategy (see plugins/CalculusWorksheet.test.ts): the ENTIRE first page is
// pinned exactly with the framework seed, and every answer family is then
// re-derived INDEPENDENTLY from the printed prompt text across many seeds —
// factor-chain cubics must re-expand from the printed factors, divisions must
// multiply back exactly, remainder answers must equal the evaluated P(k).
import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, generateDocument } from '../../framework';
import { polynomialsSpec } from './PolynomialsWorksheet';

const g11 = getMathGradeConfig(11);

function sheet(refresh = 0) {
    return generateSheet(polynomialsSpec, g11, seedFrom([g11.id, polynomialsSpec.id, refresh]));
}

// ── Independent polynomial toolkit (parses the PRINTED text) ────────────────
function parsePoly(text: string): number[] {
    const clean = text.replace(/\s+/g, '');
    const term = /([+-]?)(\d*)x\^(\d+)|([+-]?)()(\d*)x(?!\^)|([+-]?)(\d+)(?![\dx])/g;
    const map = new Map<number, number>();
    let m: RegExpExecArray | null;
    while ((m = term.exec(clean)) !== null) {
        const sign = (m[1] || m[4] || m[7] || '') === '-' ? -1 : 1;
        const coef = Number(m[2] || m[6] || m[8] || '0') || 1;
        const power = m[3] !== undefined ? Number(m[3]) : m[5] !== undefined ? 1 : 0;
        map.set(power, (map.get(power) ?? 0) + sign * (power === 0 ? Number(m[8] ?? m[2] ?? '1') : coef));
        if (term.lastIndex === m.index) term.lastIndex += 1;
    }
    const top = Math.max(...map.keys(), 0);
    const out: number[] = [];
    for (let p = top; p >= 0; p--) out.push(map.get(p) ?? 0);
    return out;
}

function evaluate(coeffs: number[], k: number): number {
    let value = 0;
    for (const c of coeffs) value = value * k + c;
    return value;
}

// Multiply two polynomials (descending coefficient arrays) — the independent
// expansion oracle for factor/division rebuilds.
function multiply(a: number[], b: number[]): number[] {
    const out = new Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++) {
        for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
    }
    return out;
}

describe('polynomials plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(polynomialsSpec.id).toBe('polynomials');
        expect(polynomialsSpec.label).toBe('Polynomials');
        expect(polynomialsSpec.icon).toBe('x³');
        expect(polynomialsSpec.perPage).toBe(8);
    });

    it('describes its senior scope line', () => {
        expect(polynomialsSpec.scope(g11)).toBe('expansion, remainder & factor theorems, cubes & exact division');
    });

    it('is offered on Year 11 ONLY', () => {
        for (let id = 0; id <= 12; id++) {
            expect(polynomialsSpec.offered(getMathGradeConfig(id))).toBe(id === 11);
        }
    });
});

describe('polynomials — Year 11 first page (deterministic pin)', () => {
    it('matches the exact first page', () => {
        expect(sheet()).toEqual([
            { prompt: 'Starter: If P(x) = 2x^3 - 5x^2 - 5x + 3, then P(2) = __', answer: '-11', id: 1, type: 'polynomials' },
            { prompt: 'Starter: If P(x) = 3x^3 + 4x^2 + x + 1, then P(3) = __', answer: '121', id: 2, type: 'polynomials' },
            { prompt: 'Practice: (x + 4)^3 = x^3 + 12x^2 + 48x + __', answer: '64', id: 3, type: 'polynomials' },
            { prompt: 'Practice: x^3 + x^2 - 26x + 24 = (x + 6)(x - 1)(x - __)', answer: '4', id: 4, type: 'polynomials' },
            { prompt: 'Practice: The remainder when P(x) = 3x^3 + 3x + 6 is divided by (x + 3) is __', answer: '-84', id: 5, type: 'polynomials' },
            { prompt: 'Practice: (x + 6)^3 = x^3 + 18x^2 + 108x + __', answer: '216', id: 6, type: 'polynomials' },
            { prompt: 'Challenge: P(x) = x^3 - x + q has (x - 1) as a factor. q = __', answer: '0', id: 7, type: 'polynomials' },
            { prompt: 'Challenge: (x^3 - 5x - 12) ÷ (x - 3) = x^2 + __x + 4', answer: '3', id: 8, type: 'polynomials' }
        ]);
    });

    it('the same seed regenerates the identical sheet; a re-roll changes it', () => {
        const again = generateSheet(polynomialsSpec, g11, seedFrom([g11.id, polynomialsSpec.id, 0]));
        expect(again).toEqual(sheet());
        const doc = generateDocument(polynomialsSpec, g11, seedFrom([g11.id, polynomialsSpec.id, 1]), 2);
        expect(doc.pages[0]).not.toEqual(sheet());
    });

    it('every page prints the 2 + 4 + 2 scaffolded tiers', () => {
        const doc = generateDocument(polynomialsSpec, g11, seedFrom([g11.id, polynomialsSpec.id, 3]), 5);
        for (const page of doc.pages) {
            expect(page.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(2);
            expect(page.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(page.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(2);
        }
    });
});

// ── Independent mathematical validation across seeds ────────────────────────
describe('polynomials — answers re-derived from the printed prompts (many seeds)', () => {
    const all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((refresh) =>
        generateDocument(polynomialsSpec, g11, seedFrom([g11.id, polynomialsSpec.id, refresh]), 4).pages.flat()
    );

    it('binomial products expand exactly (both blank shapes)', () => {
        let constChecked = 0;
        let coefChecked = 0;
        for (const p of all) {
            const constant = p.prompt.match(/^Starter: \(x - (\d+)\)\(x - (\d+)\) = x\^2 - (\d+)x \+ __$/);
            if (constant) {
                constChecked += 1;
                const [, r1, r2, b] = constant.map(Number);
                expect(b).toBe(r1 + r2);
                expect(Number(p.answer)).toBe(r1 * r2);
            }
            const xcoef = p.prompt.match(/^Starter: \(x \+ (\d+)\)\(x - (\d+)\) = x\^2 \+ __x - (\d+)$/);
            if (xcoef) {
                coefChecked += 1;
                const [, m, n, c] = xcoef.map(Number);
                expect(c).toBe(m * n);
                // (x + m)(x − n) = x² + (m − n)x − mn.
                expect(Number(p.answer)).toBe(m - n);
            }
        }
        expect(constChecked).toBeGreaterThanOrEqual(10);
        expect(coefChecked).toBeGreaterThanOrEqual(10);
    });

    it('cubic evaluations and remainder-theorem answers equal P(k) (k from the printed divisor sign)', () => {
        let evalChecked = 0;
        let remChecked = 0;
        for (const p of all) {
            const evalM = p.prompt.match(/^Starter: If P\(x\) = (.+), then P\((-?\d+)\) = __$/);
            if (evalM) {
                evalChecked += 1;
                expect(Number(p.answer)).toBe(evaluate(parsePoly(evalM[1]), Number(evalM[2])));
                expect(Number(evalM[2])).not.toBe(0);
            }
            const remM = p.prompt.match(/^Practice: The remainder when P\(x\) = (.+) is divided by \(x ([+-]) (\d+)\) is __$/);
            if (remM) {
                remChecked += 1;
                // The printed "(x + n)" divisor means k = −n (and "(x − n)"
                // means k = +n) — the divisor sign IS the printed sign.
                const k = remM[2] === '-' ? Number(remM[3]) : -Number(remM[3]);
                expect(Number(p.answer)).toBe(evaluate(parsePoly(remM[1]), k));
            }
        }
        expect(evalChecked).toBeGreaterThanOrEqual(10);
        expect(remChecked).toBeGreaterThanOrEqual(10);
    });

    it('factor chains re-expand from the printed factors to the printed cubic', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Practice: (.+) = \(x ([+-]) (\d+)\)\(x ([+-]) (\d+)\)\(x - __\)$/);
            if (!m) continue;
            checked += 1;
            // Rebuild the three factors (the blank third is (x − answer)).
            const f1 = [1, (m[2] === '-' ? -1 : 1) * Number(m[3])];
            const f2 = [1, (m[4] === '-' ? -1 : 1) * Number(m[5])];
            const f3 = [1, -Number(p.answer)];
            expect(multiply(multiply(f1, f2), f3)).toEqual(parsePoly(m[1]));
        }
        expect(checked).toBeGreaterThanOrEqual(15);
    });

    it('difference/sum of cubes identities hold with the printed values', () => {
        let diffChecked = 0;
        let sumChecked = 0;
        for (const p of all) {
            const diff = p.prompt.match(/^Practice: x\^3 - (\d+) = \(x - (\d+)\)\(x\^2 \+ __x \+ (\d+)\)$/);
            if (diff) {
                diffChecked += 1;
                const a = Number(diff[2]);
                expect(Number(diff[1])).toBe(a ** 3);
                expect(Number(diff[3])).toBe(a ** 2);
                expect(Number(p.answer)).toBe(a);
            }
            const sum = p.prompt.match(/^Practice: x\^3 \+ (\d+) = \(x \+ (\d+)\)\(x\^2 - __x \+ (\d+)\)$/);
            if (sum) {
                sumChecked += 1;
                const a = Number(sum[2]);
                expect(Number(sum[1])).toBe(a ** 3);
                expect(Number(sum[3])).toBe(a ** 2);
                expect(Number(p.answer)).toBe(a);
            }
        }
        expect(diffChecked).toBeGreaterThanOrEqual(10);
        expect(sumChecked).toBeGreaterThanOrEqual(10);
    });

    it('perfect-cube expansions equal the independent expansion of the printed binomial', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Practice: \(x ([+-]) (\d+)\)\^3 = (.+) \+ __$/);
            if (!m) continue;
            checked += 1;
            const binomial = [1, (m[1] === '-' ? -1 : 1) * Number(m[2])];
            const expanded = multiply(multiply(binomial, binomial), binomial);
            // The printed first-three-terms text is the expansion sans
            // constant; parsePoly pads the implicit 0 constant, so compare
            // the three printed coefficients directly.
            expect(parsePoly(m[3]).slice(0, 3)).toEqual(expanded.slice(0, 3));
            expect(Number(p.answer)).toBe(expanded[3]);
        }
        expect(checked).toBeGreaterThanOrEqual(10);
    });

    it('missing constants q make P(r) = 0 exactly (factor theorem)', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Challenge: P\(x\) = x\^3( [+-] \d+x)? \+ q has \(x - (\d+)\) as a factor\. q = __$/);
            if (!m) continue;
            checked += 1;
            const r = Number(m[2]);
            const b = m[1] ? Number(m[1].replace(/[^0-9-]/g, '')) : 0;
            const q = Number(p.answer);
            // Independent check: the printed cubic with the answer substituted
            // zeroes at the printed factor root.
            expect(evaluate([1, 0, b, q], r)).toBe(0);
        }
        expect(checked).toBeGreaterThanOrEqual(10);
    });

    it('division quotients multiply back to the printed dividend exactly', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Challenge: \((.+)\) ÷ \(x - (\d+)\) = x\^2 \+ __x((?: [+-] \d+))?$/);
            if (!m) continue;
            checked += 1;
            const r = Number(m[2]);
            const q = Number(p.answer);
            // The printed tail already carries the sign (" - 4" → −4); the
            // digit-stripping replace must not negate it a second time.
            const s = m[3] ? Number(m[3].replace(/[^0-9-]/g, '')) : 0;
            // (x − r)(x² + qx + s) must equal the printed dividend.
            expect(multiply([1, -r], [1, q, s])).toEqual(parsePoly(m[1]));
        }
        expect(checked).toBeGreaterThanOrEqual(10);
    });
});
