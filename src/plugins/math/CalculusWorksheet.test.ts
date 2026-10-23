// Unit tests for the CALCULUS worksheet plugin (Year 11 senior expansion).
//
// Strategy (see plugins/ProbabilityWorksheet.test.ts): the ENTIRE first page
// is pinned exactly with the framework seed (seedFrom([11, 'calculus', 0]);
// tiers are 2+4+2 on this 8-per-page sheet), and every answer family is then
// re-derived INDEPENDENTLY from the printed prompt text across many seeds —
// the tests parse the printed polynomial/coefficients and recompute the
// expected answer, so a construction bug cannot pass just because generator
// and key share one code path.
import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, createRng, generateSheet, generateDocument } from '../../framework';
import { calculusSpec } from './CalculusWorksheet';

const g11 = getMathGradeConfig(11);

function sheet(refresh = 0) {
    return generateSheet(calculusSpec, g11, seedFrom([g11.id, calculusSpec.id, refresh]));
}

// ── Independent polynomial toolkit (parses the PRINTED text) ────────────────
// Parse a canonical polynomial string ("3x^2 - 4x - 6", "x^3 + 8x", "-x^2",
// "5") into descending coefficients. Missing powers become 0 coefficients.
function parsePoly(text: string, v = 'x'): number[] {
    const clean = text.replace(/\s+/g, '');
    const term = new RegExp(`([+-]?)(\\d*)${v}\\^(\\d+)|([+-]?)()(\\d*)${v}(?!\\^)|([+-]?)(\\d+)(?![\\d${v}])`, 'g');
    const map = new Map<number, number>();
    let m: RegExpExecArray | null;
    while ((m = term.exec(clean)) !== null) {
        const sign = (m[1] || m[4] || m[7] || '') === '-' ? -1 : 1;
        const coef = Number(m[2] || m[6] || m[8] || '0') || 1;
        const power = m[3] !== undefined ? Number(m[3]) : m[5] !== undefined ? 1 : 0;
        // The constant branch must not swallow digits that belong to a term
        // the x-branches already matched (exec guarantees branch order).
        if (m[3] !== undefined || m[5] !== undefined || m[8] !== undefined) {
            map.set(power, (map.get(power) ?? 0) + sign * (power === 0 ? Number(m[8] ?? m[2] ?? '1') : coef));
        }
        if (term.lastIndex === m.index) term.lastIndex += 1; // guard against zero-length matches
    }
    const top = Math.max(...map.keys(), 0);
    const out: number[] = [];
    for (let p = top; p >= 0; p--) out.push(map.get(p) ?? 0);
    return out;
}

function evaluate(coeffs: number[], k: number): number {
    let value = 0;
    for (const c of coeffs) value = value * k + c; // Horner, descending
    return value;
}

function derivative(coeffs: number[]): number[] {
    // d/dx of descending coefficients: power n·coef, drop the constant.
    return coeffs.slice(0, -1).map((c, i) => c * (coeffs.length - 1 - i));
}

describe('calculus plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(calculusSpec.id).toBe('calculus');
        expect(calculusSpec.label).toBe('Calculus');
        expect(calculusSpec.icon).toBe('∂');
        expect(calculusSpec.perPage).toBe(8);
    });

    it('describes its senior scope line', () => {
        expect(calculusSpec.scope(g11)).toBe('rates of change, first principles, tangents & stationary points');
    });

    it('is offered on Year 11 ONLY (no lower or other senior grade lists it)', () => {
        for (let id = 0; id <= 12; id++) {
            expect(calculusSpec.offered(getMathGradeConfig(id))).toBe(id === 11);
        }
    });
});

describe('calculus — Year 11 first page (deterministic pin)', () => {
    it('matches the exact first page', () => {
        expect(sheet()).toEqual([
            { prompt: 'Starter: f(x) = 3x^2 + x - 1. The average rate of change between x = 3 and x = 6 is __', answer: '28', id: 1, type: 'calculus' },
            { prompt: 'Starter: f(x) = x^2 - 2x + 6. The average rate of change between x = 4 and x = 7 is __', answer: '9', id: 2, type: 'calculus' },
            { prompt: 'Practice: Differentiate f(x) = x^3 - 2x^2 - 6x - 3. f\'(x) = __', answer: '3x^2 - 4x - 6', id: 3, type: 'calculus' },
            { prompt: 'Practice: The parabola y = 3x^2 - 12x has one stationary point at (__, __)', answer: '2, -12', id: 4, type: 'calculus' },
            { prompt: 'Practice: Using first principles, f(x) = x^2 - 5x has derivative f\'(x) = __', answer: '2x - 5', id: 5, type: 'calculus' },
            { prompt: 'Practice: Differentiate f(x) = x^3 + 8x + 4. f\'(x) = __', answer: '3x^2 + 8', id: 6, type: 'calculus' },
            { prompt: 'Challenge: The stationary points of y = x^3 - 15x^2 + 72x (where f\'(x) = 0) are at x = __ and x = __', answer: '4, 6', id: 7, type: 'calculus' },
            { prompt: 'Challenge: The stationary points of y = x^3 - 15x^2 + 63x + 6 (where f\'(x) = 0) are at x = __ and x = __', answer: '3, 7', id: 8, type: 'calculus' }
        ]);
    });

    it('the same seed regenerates the identical sheet; a re-roll changes it', () => {
        const again = generateSheet(calculusSpec, g11, seedFrom([g11.id, calculusSpec.id, 0]));
        expect(again).toEqual(sheet());
        // refresh 1 lands on a different stream (multi-page pipeline too).
        const doc = generateDocument(calculusSpec, g11, seedFrom([g11.id, calculusSpec.id, 1]), 2);
        expect(doc.pages).toHaveLength(2);
        expect(doc.pages[0]).not.toEqual(sheet());
    });

    it('every page prints the 2 + 4 + 2 scaffolded tiers', () => {
        const doc = generateDocument(calculusSpec, g11, seedFrom([g11.id, calculusSpec.id, 3]), 5);
        for (const page of doc.pages) {
            expect(page.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(2);
            expect(page.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(page.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(2);
        }
    });
});

// ── Independent mathematical validation across seeds ────────────────────────
describe('calculus — answers re-derived from the printed prompts (many seeds)', () => {
    const all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((refresh) =>
        generateDocument(calculusSpec, g11, seedFrom([g11.id, calculusSpec.id, refresh]), 4).pages.flat()
    );

    it('average rate of change equals [f(x2) − f(x1)] / (x2 − x1), evaluated from the printed polynomial', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Starter: f\(x\) = (.+)\. The average rate of change between x = (-?\d+) and x = (-?\d+) is __$/);
            if (!m) continue;
            checked += 1;
            const coeffs = parsePoly(m[1]);
            const x1 = Number(m[2]);
            const x2 = Number(m[3]);
            // Independent secant computation (no use of the a(x1+x2)+b shortcut).
            expect(Number(p.answer)).toBe((evaluate(coeffs, x2) - evaluate(coeffs, x1)) / (x2 - x1));
        }
        expect(checked).toBeGreaterThanOrEqual(20);
    });

    it('power-rule derivatives (quadratic starter, cubic practice, first principles) equal the independent derivative', () => {
        let checked = 0;
        for (const p of all) {
            const starter = p.prompt.match(/^Starter: If f\(x\) = (.+), then f'\(x\) = __$/);
            const cubic = p.prompt.match(/^Practice: Differentiate f\(x\) = (.+)\. f'\(x\) = __$/);
            const principles = p.prompt.match(/^Practice: Using first principles, f\(x\) = (.+) has derivative f'\(x\) = __$/);
            const which = starter ?? cubic ?? principles;
            if (!which) continue;
            checked += 1;
            // The printed answer parses to EXACTLY the independent derivative
            // (canonical-form compare, not a string compare).
            expect(parsePoly(p.answer)).toEqual(derivative(parsePoly(which[1])));
        }
        expect(checked).toBeGreaterThanOrEqual(20);
    });

    it('tangent gradients equal f\'(k) from the printed polynomial', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Practice: The gradient of the tangent to y = (.+) at x = (-?\d+) is __$/);
            if (!m) continue;
            checked += 1;
            expect(Number(p.answer)).toBe(evaluate(derivative(parsePoly(m[1])), Number(m[2])));
            // The generator never prints the degenerate flat tangent here.
            expect(Number(p.answer)).not.toBe(0);
        }
        expect(checked).toBeGreaterThanOrEqual(20);
    });

    it('parabola stationary points equal the exact vertex of the printed quadratic', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Practice: The parabola y = (.+) has one stationary point at \(__, __\)$/);
            if (!m) continue;
            checked += 1;
            const [a, b, c] = parsePoly(m[1]);
            const x0 = -b / (2 * a);
            // The x-coordinate is the vertex formula; the y-coordinate is the
            // printed polynomial EVALUATED there (independent of the
            // c − a·x0² construction shortcut).
            const [ax, ay] = p.answer.split(', ').map(Number);
            // (=== treats −0 and +0 as equal, unlike Object.is in toBe.)
            expect(ax === x0).toBe(true);
            expect(ay).toBe(evaluate([a, b, c], x0));
        }
        expect(checked).toBeGreaterThanOrEqual(20);
    });

    it('tangent equations are y = f\'(k)·x + (f(k) − f\'(k)·k), parsed from the printed line', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Challenge: The tangent to y = (.+) at x = (-?\d+) has equation y = mx \+ c: __$/);
            if (!m) continue;
            checked += 1;
            const coeffs = parsePoly(m[1]);
            const k = Number(m[2]);
            const grad = evaluate(derivative(coeffs), k);
            const intercept = evaluate(coeffs, k) - grad * k;
            // The printed line parses back to exactly those two numbers.
            expect(p.answer.startsWith('y = ')).toBe(true);
            expect(parsePoly(p.answer.slice(4))).toEqual([grad, intercept]);
        }
        expect(checked).toBeGreaterThanOrEqual(20);
    });

    it('cubic stationary x-values are the exact integer roots of the printed derivative', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Challenge: The stationary points of y = (.+) \(where f'\(x\) = 0\) are at x = __ and x = __$/);
            if (!m) continue;
            checked += 1;
            const [a, b, c] = derivative(parsePoly(m[1])); // 3x^2 + 2bx + c
            // Independent quadratic solution on the printed derivative.
            const disc = b * b - 4 * a * c;
            expect(Math.sqrt(disc) % 1).toBe(0); // exact integer roots by design
            const r1 = (-b - Math.sqrt(disc)) / (2 * a);
            const r2 = (-b + Math.sqrt(disc)) / (2 * a);
            expect(p.answer).toBe(`${r1}, ${r2}`);
        }
        expect(checked).toBeGreaterThanOrEqual(20);
    });

    it('projectile maximum heights equal h(t*) where t* zeroes the printed derivative', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Challenge: A ball's height is h\(t\) = (.+) metres after t seconds\. Its maximum height is __ metres$/);
            if (!m) continue;
            checked += 1;
            const coeffs = parsePoly(m[1], 't');
            const [a, b] = coeffs;
            const tstar = -b / (2 * a);
            expect(Number(p.answer)).toBe(evaluate(coeffs, tstar));
            // The printed polynomial really is the t-variable one (no x leak).
            expect(m[1]).toContain('t^2');
            // T5 regression: the launch height h(0) is the constant term and
            // must be NONNEGATIVE (the old construction could print
            // h(t) = −5t² + 40t − 55, i.e. the ball starting underground).
            expect(coeffs[2]).toBeGreaterThanOrEqual(0);
            // And the peak is above the launch point (the maximum is real).
            expect(Number(p.answer)).toBeGreaterThanOrEqual(coeffs[2]);
        }
        expect(checked).toBeGreaterThanOrEqual(20);
    });
});
