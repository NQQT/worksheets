// Unit tests for the FUNCTIONS & QUADRATICS worksheet plugin (Year 11 senior
// expansion).
//
// Strategy (see plugins/CalculusWorksheet.test.ts): the ENTIRE first page is
// pinned exactly with the framework seed, and every answer family is then
// re-derived INDEPENDENTLY from the printed prompt text across many seeds —
// completed-square answers must re-expand to the printed quadratic, solved
// roots must satisfy the printed equation AND re-expand to it, etc.
import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, generateDocument } from '../../framework';
import { functionsSpec } from './FunctionsWorksheet';

const g11 = getMathGradeConfig(11);

function sheet(refresh = 0) {
    return generateSheet(functionsSpec, g11, seedFrom([g11.id, functionsSpec.id, refresh]));
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

describe('functions plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(functionsSpec.id).toBe('functions');
        expect(functionsSpec.label).toBe('Functions & Quadratics');
        expect(functionsSpec.icon).toBe('ƒ');
        expect(functionsSpec.perPage).toBe(8);
    });

    it('describes its senior scope line', () => {
        expect(functionsSpec.scope(g11)).toBe('evaluation, domain, discriminant, completing the square & roots');
    });

    it('is offered on Year 11 ONLY', () => {
        for (let id = 0; id <= 12; id++) {
            expect(functionsSpec.offered(getMathGradeConfig(id))).toBe(id === 11);
        }
    });
});

describe('functions — Year 11 first page (deterministic pin)', () => {
    it('matches the exact first page', () => {
        expect(sheet()).toEqual([
            { prompt: 'Starter: If f(x) = -x^2 - 5x - 8, then f(-1) = __', answer: '-4', id: 1, type: 'functions' },
            { prompt: 'Starter: If f(x) = -3x^2 - 6x + 2, then f(2) = __', answer: '-22', id: 2, type: 'functions' },
            { prompt: 'Practice: Complete the square: y = x^2 + 10x + 23 = (x + q)^2 + k. q = __ and k = __', answer: '5, -2', id: 3, type: 'functions' },
            { prompt: 'Practice: Complete the square: y = x^2 + 8x + 22 = (x + q)^2 + k. q = __ and k = __', answer: '4, 6', id: 4, type: 'functions' },
            { prompt: 'Practice: For y = x^2 + 7x + 5, the discriminant b^2 - 4ac = __', answer: '29', id: 5, type: 'functions' },
            { prompt: 'Practice: The parabola y = (x - 2)^2 - 4 has vertex (__, __)', answer: '2, -4', id: 6, type: 'functions' },
            { prompt: 'Challenge: The equation x^2 - 2x + k = 0 has exactly one (double) root. k = __', answer: '1', id: 7, type: 'functions' },
            { prompt: 'Challenge: Solve x^2 - 36 = 0. x = __ or x = __ (smaller first)', answer: '-6, 6', id: 8, type: 'functions' }
        ]);
    });

    it('the same seed regenerates the identical sheet; a re-roll changes it', () => {
        const again = generateSheet(functionsSpec, g11, seedFrom([g11.id, functionsSpec.id, 0]));
        expect(again).toEqual(sheet());
        const doc = generateDocument(functionsSpec, g11, seedFrom([g11.id, functionsSpec.id, 1]), 2);
        expect(doc.pages[0]).not.toEqual(sheet());
    });

    it('every page prints the 2 + 4 + 2 scaffolded tiers', () => {
        const doc = generateDocument(functionsSpec, g11, seedFrom([g11.id, functionsSpec.id, 3]), 5);
        for (const page of doc.pages) {
            expect(page.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(2);
            expect(page.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(page.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(2);
        }
    });
});

// ── Independent mathematical validation across seeds ────────────────────────
describe('functions — answers re-derived from the printed prompts (many seeds)', () => {
    const all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((refresh) =>
        generateDocument(functionsSpec, g11, seedFrom([g11.id, functionsSpec.id, refresh]), 4).pages.flat()
    );

    it('f(k) evaluations equal the printed polynomial evaluated at the printed input', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Starter: If f\(x\) = (.+), then f\((-?\d+)\) = __$/);
            if (!m) continue;
            checked += 1;
            expect(Number(p.answer)).toBe(evaluate(parsePoly(m[1]), Number(m[2])));
            expect(Number(m[2])).not.toBe(0); // f(0) never asked (trivial)
        }
        expect(checked).toBeGreaterThanOrEqual(20);
    });

    it('domain guards: √ needs x ≥ n; 1/(x − n) is undefined at x = n', () => {
        let sqrtChecked = 0;
        let recipChecked = 0;
        for (const p of all) {
            const sqrt = p.prompt.match(/^Starter: f\(x\) = √\(x - (\d+)\) is defined for x ≥ __$/);
            if (sqrt) {
                sqrtChecked += 1;
                expect(p.answer).toBe(sqrt[1]);
            }
            const recip = p.prompt.match(/^Starter: g\(x\) = 1\/\(x - (\d+)\) is undefined at x = __$/);
            if (recip) {
                recipChecked += 1;
                expect(p.answer).toBe(recip[1]);
            }
        }
        expect(sqrtChecked).toBeGreaterThanOrEqual(5);
        expect(recipChecked).toBeGreaterThanOrEqual(5);
    });

    it('completed-square answers re-expand to EXACTLY the printed quadratic', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Practice: Complete the square: y = (.+) = \(x \+ q\)\^2 \+ k\. q = __ and k = __$/);
            if (!m) continue;
            checked += 1;
            const [a, b, c] = parsePoly(m[1]);
            expect(a).toBe(1); // monic by design
            const [q, k] = p.answer.split(', ').map(Number);
            // (x + q)² + k = x² + 2q·x + (q² + k) — compared coefficient-wise.
            expect([1, 2 * q, q * q + k]).toEqual([a, b, c]);
        }
        expect(checked).toBeGreaterThanOrEqual(20);
    });

    it('discriminants equal b² − 4ac of the printed quadratic', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Practice: For y = (.+), the discriminant b\^2 - 4ac = __$/);
            if (!m) continue;
            checked += 1;
            const [a, b, c] = parsePoly(m[1]);
            expect(Number(p.answer)).toBe(b * b - 4 * a * c);
            expect(a).toBeGreaterThanOrEqual(1); // a is drawn in 1..3
        }
        expect(checked).toBeGreaterThanOrEqual(20);
    });

    it('completed-square vertices equal (h, k) rebuilt from the printed square', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Practice: The parabola y = (.+) has vertex \(__, __\)$/);
            if (!m) continue;
            checked += 1;
            // Parse the printed completed-square form directly: "(x - h)^2"
            // prints h POSITIVE (the sign in the equation is the minus), and
            // "(x + m)^2" means h = −m. The bare "x^2" branch (h = 0) can
            // still carry a lift term ("x^2 - 5" → vertex (0, −5)).
            const sq = m[1].match(/^x\^2(?: ([+-]) (\d+))?$|^\(x ([+-]) (\d+)\)\^2(?: ([+-]) (\d+))?$/);
            expect(sq).not.toBeNull();
            const h = sq![3] ? (sq![3] === '-' ? Number(sq![4]) : -Number(sq![4])) : 0;
            const k = sq![5] ? (sq![5] === '-' ? -Number(sq![6]) : Number(sq![6])) : sq![1] ? (sq![1] === '-' ? -Number(sq![2]) : Number(sq![2])) : 0;
            const [ax, ay] = p.answer.split(', ').map(Number);
            expect(ax).toBe(h);
            expect(ay).toBe(k);
        }
        expect(checked).toBeGreaterThanOrEqual(20);
    });

    it('factorisation blanks complete the printed expansion exactly (both shapes)', () => {
        let bothChecked = 0;
        let mixedChecked = 0;
        for (const p of all) {
            const both = p.prompt.match(/^Practice: (.+) = \(x - (\d+)\)\(x - __\)$/);
            const mixed = p.prompt.match(/^Practice: (.+) = \(x \+ (\d+)\)\(x - __\)$/);
            if (both) {
                bothChecked += 1;
                const [a, b, c] = parsePoly(both[1]);
                const r = Number(both[2]);
                expect(a).toBe(1);
                // (x − r)(x − answer) must reproduce the printed quadratic.
                const n = Number(p.answer);
                expect([1, -(r + n), r * n]).toEqual([a, b, c]);
            }
            if (mixed) {
                mixedChecked += 1;
                const [a, b, c] = parsePoly(mixed[1]);
                const m2 = Number(mixed[2]);
                const n = Number(p.answer);
                expect(a).toBe(1);
                // (x + m)(x − n) = x² + (m − n)x − mn.
                expect([1, m2 - n, -m2 * n]).toEqual([a, b, c]);
            }
        }
        expect(bothChecked).toBeGreaterThanOrEqual(10);
        expect(mixedChecked).toBeGreaterThanOrEqual(10);
    });

    it('solved roots satisfy the printed equation and re-expand to it, smaller first', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Challenge: Solve (.+) = 0\. x = __ or x = __ \(smaller first\)$/);
            if (!m) continue;
            checked += 1;
            const [lo, hi] = p.answer.split(', ').map(Number);
            expect(lo).toBeLessThan(hi);
            // Each printed root really zeroes the printed quadratic…
            const coeffs = parsePoly(m[1]);
            expect(evaluate(coeffs, lo)).toBe(0);
            expect(evaluate(coeffs, hi)).toBe(0);
            // …and the pair re-expands to the printed coefficients (the +0
            // normalises −(0) so −0 vs +0 never trips the deep-equality).
            expect([1, -(lo + hi) + 0, lo * hi]).toEqual(coeffs);
        }
        expect(checked).toBeGreaterThanOrEqual(20);
    });

    it('double-root k values satisfy b² − 4k = 0 exactly', () => {
        let checked = 0;
        for (const p of all) {
            // The printed x-term is "± n x" (the generator always prints one,
            // b is drawn from ±2..±8), so the sign is captured separately.
            const m = p.prompt.match(/^Challenge: The equation x\^2 ([+-]) (\d+)x \+ k = 0 has exactly one \(double\) root\. k = __$/);
            if (!m) continue;
            checked += 1;
            const b = (m[1] === '-' ? -1 : 1) * Number(m[2]);
            const k = Number(p.answer);
            expect(b * b - 4 * k).toBe(0);
            expect(Number.isInteger(k)).toBe(true);
        }
        expect(checked).toBeGreaterThanOrEqual(10);
    });
});
