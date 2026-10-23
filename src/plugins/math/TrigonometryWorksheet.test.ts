// Unit tests for the TRIGONOMETRY worksheet plugin (Year 11 senior expansion).
//
// Strategy (see plugins/CalculusWorksheet.test.ts): the ENTIRE first page is
// pinned exactly with the framework seed, and every answer family is then
// re-derived INDEPENDENTLY from the printed prompt across many seeds — the
// exact-value tables here are REBUILT from first principles (√ values via
// Pythagorean identities, signs via quadrant coordinates), not copied from
// the plugin's own tables.
import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, generateDocument } from '../../framework';
import { trigonometrySpec } from './TrigonometryWorksheet';

const g11 = getMathGradeConfig(11);

function sheet(refresh = 0) {
    return generateSheet(trigonometrySpec, g11, seedFrom([g11.id, trigonometrySpec.id, refresh]));
}

// Euclid's gcd — independent fraction reduction oracle.
function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

// The printed canonical ratios as NUMERIC values (independent of the plugin's
// string tables) — the equation-root oracles compute their roots from these
// with asin/acos, so a wrong table can never verify itself.
const RATIO_VALUE: Record<string, number> = {
    '1/2': 0.5,
    '√2/2': Math.SQRT1_2,
    '√3/2': Math.sqrt(3) / 2
};

// ── Independent exact-value oracle (rebuilt from unit-circle geometry) ──────
// cos/sin of the special angles as exact scaled values: (cos, sin) =
// (√4/2, 0), (√3/2, 1/2), (√2/2, √2/2), (1/2, √3/2), (0, 1) for 0..90.
// Represented as (radicand, denominator) pairs: value = √radicand / den.
const REF: Record<number, [number, number]> = {
    0: [4, 2], 30: [3, 2], 45: [2, 2], 60: [1, 2], 90: [0, 2]
};
// Canonical string for √radicand/den (matching the school-table forms the
// sheets print: "0", "1", "1/2", "√2/2", "√3/2") — a numerator of 1 never
// prints and a radicand of 1 prints as "1/2" style.
function exactString(radicand: number, den: number, negative = false): string {
    if (radicand === 0) return '0';
    if (radicand === 4) return negative ? '-1' : '1';
    const body = radicand === 1 ? `1/${den}` : `√${radicand}/${den}`;
    return negative ? `-${body}` : body;
}

describe('trigonometry plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(trigonometrySpec.id).toBe('trigonometry');
        expect(trigonometrySpec.label).toBe('Trigonometry');
        expect(trigonometrySpec.icon).toBe('∠');
        expect(trigonometrySpec.perPage).toBe(8);
    });

    it('describes its senior scope line', () => {
        expect(trigonometrySpec.scope(g11)).toBe('radians, exact ratios, arc & sector measurement, simple equations');
    });

    it('is offered on Year 11 ONLY', () => {
        for (let id = 0; id <= 12; id++) {
            expect(trigonometrySpec.offered(getMathGradeConfig(id))).toBe(id === 11);
        }
    });
});

describe('trigonometry — Year 11 first page (deterministic pin)', () => {
    it('matches the exact first page', () => {
        expect(sheet()).toEqual([
            { prompt: 'Starter: 120° = aπ/b radians. a = __ and b = __', answer: '2, 3', id: 1, type: 'trigonometry' },
            { prompt: 'Starter: sin 45° = __', answer: '√2/2', id: 2, type: 'trigonometry' },
            { prompt: 'Practice: A sector has radius 2 cm and angle 90°. Its area is __ cm^2 (in terms of π)', answer: 'π', id: 3, type: 'trigonometry' },
            { prompt: 'Practice: A sector has radius 8 cm and angle 30°. Its area is __ cm^2 (in terms of π)', answer: '16π/3', id: 4, type: 'trigonometry' },
            { prompt: 'Practice: π/6 radians = __°', answer: '30', id: 5, type: 'trigonometry' },
            { prompt: 'Practice: π/4 radians = __°', answer: '45', id: 6, type: 'trigonometry' },
            { prompt: 'Challenge: cos 315° = __', answer: '√2/2', id: 7, type: 'trigonometry' },
            { prompt: 'Challenge: Solve cos x = √3/2 for 0 ≤ x ≤ 2π: x = __ or x = __ (smaller first)', answer: 'π/6, 11π/6', id: 8, type: 'trigonometry' }
        ]);
    });

    it('the same seed regenerates the identical sheet; a re-roll changes it', () => {
        const again = generateSheet(trigonometrySpec, g11, seedFrom([g11.id, trigonometrySpec.id, 0]));
        expect(again).toEqual(sheet());
        const doc = generateDocument(trigonometrySpec, g11, seedFrom([g11.id, trigonometrySpec.id, 1]), 2);
        expect(doc.pages[0]).not.toEqual(sheet());
    });

    it('every page prints the 2 + 4 + 2 scaffolded tiers', () => {
        const doc = generateDocument(trigonometrySpec, g11, seedFrom([g11.id, trigonometrySpec.id, 3]), 5);
        for (const page of doc.pages) {
            expect(page.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(2);
            expect(page.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(page.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(2);
        }
    });
});

// ── Independent mathematical validation across seeds ────────────────────────
describe('trigonometry — answers re-derived from the printed prompts (many seeds)', () => {
    const all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((refresh) =>
        generateDocument(trigonometrySpec, g11, seedFrom([g11.id, trigonometrySpec.id, refresh]), 4).pages.flat()
    );

    it('degrees → radians reduce d/180 exactly (a/b in lowest terms)', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Starter: (\d+)° = aπ\/b radians\. a = __ and b = __$/);
            if (!m) continue;
            checked += 1;
            const d = Number(m[1]);
            const g = gcd(d, 180);
            expect(p.answer).toBe(`${d / g}, ${180 / g}`);
        }
        expect(checked).toBeGreaterThanOrEqual(15);
    });

    it('starter sin/cos values match the unit-circle table rebuilt from scratch', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Starter: (sin|cos) (\d+)° = __$/);
            if (!m) continue;
            checked += 1;
            const angle = Number(m[2]);
            // Rebuild from ONE mapping: REF holds cos values per angle
            // (cos 0 = 1, cos 30 = √3/2, ...). sin θ = cos(90° − θ) — the
            // identity makes the check independent of the plugin's tables.
            const ref = m[1] === 'cos' ? angle : 90 - angle;
            expect(p.answer).toBe(exactString(REF[ref][0], REF[ref][1]));
        }
        expect(checked).toBeGreaterThanOrEqual(15);
    });

    it('radians → degrees answers come from the printed fraction reduced against π', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Practice: (π(?:\/\d+)?|2π|3π\/2) radians = __°$/);
            if (!m) continue;
            checked += 1;
            // Independent conversion: multiple of π = a/b → degrees = a·180/b.
            const frac = m[1];
            const mult = frac === 'π' ? [1, 1]
                : frac === '2π' ? [2, 1]
                    : frac === '3π/2' ? [3, 2]
                        : [1, Number(frac.split('/')[1])];
            expect(Number(p.answer)).toBe((mult[0] * 180) / mult[1]);
        }
        expect(checked).toBeGreaterThanOrEqual(10);
    });

    it('arc lengths equal r·(d/180)π reduced; sector areas equal r²·(d/360)π reduced', () => {
        let arcChecked = 0;
        let areaChecked = 0;
        for (const p of all) {
            const arc = p.prompt.match(/^Practice: A sector has radius (\d+) cm and angle (\d+)°\. Its arc length is __ cm \(in terms of π\)$/);
            if (arc) {
                arcChecked += 1;
                const r = Number(arc[1]);
                const d = Number(arc[2]);
                const g = gcd(r * d, 180);
                const num = (r * d) / g;
                const den = 180 / g;
                // Canonical π form: a numerator of 1 never prints ("π/3").
                const expected = den === 1 ? (num === 1 ? 'π' : `${num}π`)
                    : num === 1 ? `π/${den}` : `${num}π/${den}`;
                expect(p.answer).toBe(expected);
            }
            const area = p.prompt.match(/^Practice: A sector has radius (\d+) cm and angle (\d+)°\. Its area is __ cm\^2 \(in terms of π\)$/);
            if (area) {
                areaChecked += 1;
                const r = Number(area[1]);
                const d = Number(area[2]);
                const g = gcd(r * r * d, 360);
                const num = (r * r * d) / g;
                const den = 360 / g;
                const expected = den === 1 ? (num === 1 ? 'π' : `${num}π`)
                    : num === 1 ? `π/${den}` : `${num}π/${den}`;
                expect(p.answer).toBe(expected);
            }
        }
        expect(arcChecked).toBeGreaterThanOrEqual(10);
        expect(areaChecked).toBeGreaterThanOrEqual(10);
    });

    it('0°..180° equation roots: sine supplements and single-root tan (numeric oracle)', () => {
        let sinChecked = 0;
        let tanChecked = 0;
        for (const p of all) {
            const sin = p.prompt.match(/^Practice: Solve sin x = (.+) for 0° ≤ x ≤ 180°: x = __ or x = __ \(smaller first\)$/);
            if (sin) {
                sinChecked += 1;
                // Numeric oracle, independent of any table: sin θ = c (0<c<1)
                // has exactly the roots θ = asin(c) and 180° − θ in 0..180.
                const value = RATIO_VALUE[sin[1]];
                const theta = Math.round(Math.asin(value) * 180 / Math.PI);
                const [lo, hi] = p.answer.split(', ').map(Number);
                expect([lo, hi]).toEqual([theta, 180 - theta]);
                // Both printed roots verify numerically against sin.
                expect(Math.sin(lo * Math.PI / 180)).toBeCloseTo(value, 9);
                expect(Math.sin(hi * Math.PI / 180)).toBeCloseTo(value, 9);
            }
            const tan = p.prompt.match(/^Practice: Solve tan x = (.+) for 0° ≤ x ≤ 180°: x = __$/);
            if (tan) {
                tanChecked += 1;
                // tan x = 1 → 45°; tan x = √3 → 60° (the only canonical tan
                // values with a single 0..180 solution), verified numerically.
                const expected = tan[1] === '1' ? 45 : 60;
                expect(Number(p.answer)).toBe(expected);
                expect(Math.tan(Number(p.answer) * Math.PI / 180)).toBeCloseTo(tan[1] === '1' ? 1 : Math.sqrt(3), 9);
            }
        }
        expect(sinChecked).toBeGreaterThanOrEqual(10);
        expect(tanChecked).toBeGreaterThanOrEqual(5);
    });

    it('cosine-degree roots mirror about 360° (REGRESSION: cos 60/300 valid, cos 120 invalid)', () => {
        // T5 review fix: cosine is ONE-TO-ONE on 0°..180°, so the old
        // supplement pairs (cos x = 1/2 → "60, 120") printed cos 120° = −1/2
        // as a root. The family now prints 0° ≤ x ≤ 360° with the θ / 360°−θ
        // mirror pair; this oracle is NUMERIC (acos of the ratio value), so a
        // wrong table can never mask itself again.
        let checked = 0;
        let halfChecked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Practice: Solve cos x = (.+) for 0° ≤ x ≤ 360°: x = __ or x = __ \(smaller first\)$/);
            if (!m) continue;
            checked += 1;
            const value = RATIO_VALUE[m[1]];
            // Numeric oracle: cos θ = c (0<c<1) has exactly the two roots
            // θ = acos(c) and 360° − θ in 0..360.
            const theta = Math.round(Math.acos(value) * 180 / Math.PI);
            const [lo, hi] = p.answer.split(', ').map(Number);
            expect([lo, hi]).toEqual([theta, 360 - theta]);
            // Both printed roots verify numerically against cos.
            expect(Math.cos(lo * Math.PI / 180)).toBeCloseTo(value, 9);
            expect(Math.cos(hi * Math.PI / 180)).toBeCloseTo(value, 9);
            // The stated interval is respected and the pair is the mirror one.
            expect(lo).toBeGreaterThan(0);
            expect(hi).toBeLessThanOrEqual(360);
            expect(lo + hi).toBe(360);
            // The supplement (the old wrong second root) is NOT a root: its
            // cosine is −value — numerically distinct from +value.
            expect(Math.cos((180 - lo) * Math.PI / 180)).toBeCloseTo(-value, 9);
            // Explicit regression pin on cos x = 1/2: roots are 60°/300°, and
            // 120° (the old printed pair's second root) is INVALID — its
            // cosine is −1/2, not 1/2.
            if (m[1] === '1/2') {
                halfChecked += 1;
                expect(p.answer).toBe('60, 300');
                expect(Math.cos(60 * Math.PI / 180)).toBeCloseTo(0.5, 9);
                expect(Math.cos(300 * Math.PI / 180)).toBeCloseTo(0.5, 9);
                expect(Math.cos(120 * Math.PI / 180)).toBeCloseTo(-0.5, 9);
                expect(p.answer).not.toBe('60, 120');
            }
        }
        expect(checked).toBeGreaterThanOrEqual(10);
        expect(halfChecked).toBeGreaterThanOrEqual(3);
    });

    it('ASTC exact values equal the reference-angle value with the quadrant sign', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Challenge: (sin|cos|tan) (\d+)° = __$/);
            if (!m) continue;
            const angle = Number(m[2]);
            if (angle < 120) continue; // starter table items matched above
            checked += 1;
            const fn = m[1];
            // Independent quadrant geometry: the reference angle maps the
            // angle into 0..90, and the quadrant fixes each sign. REF holds
            // COS values, so the sin magnitude is REF's mirror at 90 − ref.
            const ref = angle <= 180 ? 180 - angle : angle <= 270 ? angle - 180 : 360 - angle;
            const q = angle <= 180 ? 2 : angle <= 270 ? 3 : 4;
            if (fn === 'tan') {
                // tan magnitude is √3 only for the 60-family references and 1
                // for 45; the plugin excludes the ambiguous √3/3 angles —
                // verify the angle is one of the allowed set.
                expect([120, 135, 225, 240, 300, 315]).toContain(angle);
                const mag = ref === 45 ? '1' : '√3';
                const positive = q === 3;
                expect(p.answer).toBe(positive ? mag : `-${mag}`);
            } else {
                const sinPositive = q === 2;
                const cosPositive = q === 4;
                const positive = fn === 'sin' ? sinPositive : cosPositive;
                const [radicand, den] = fn === 'sin' ? REF[90 - ref] : REF[ref];
                expect(p.answer).toBe(exactString(radicand, den, !positive && radicand !== 0));
            }
        }
        expect(checked).toBeGreaterThanOrEqual(15);
    });

    it('0..2π equation roots are the radian pair matching the printed ratio', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Challenge: Solve (sin|cos) x = (.+) for 0 ≤ x ≤ 2π: x = __ or x = __/);
            if (!m) continue;
            checked += 1;
            const fn = m[1];
            const ratio = m[2];
            const [lo, hi] = p.answer.split(', ');
            // Independent rebuild from the reference angle: the printed ratio
            // fixes the reference (sin: 1/2 → π/6, √2/2 → π/4, √3/2 → π/3;
            // cos mirrors it: 1/2 → π/3, √3/2 → π/6); sin roots mirror about
            // π (second = (den − num)π/den), cos roots mirror about 2π
            // (second = (2·den − num)π/den).
            const ref = fn === 'sin'
                ? (ratio === '1/2' ? [1, 6] : ratio === '√2/2' ? [1, 4] : [1, 3])
                : (ratio === '1/2' ? [1, 3] : ratio === '√2/2' ? [1, 4] : [1, 6]);
            const [num, den] = ref;
            const second = fn === 'sin' ? den - num : 2 * den - num;
            // Canonical π form: a numerator of 1 never prints ("π/3").
            const fmt = (n: number) => (n === 1 ? `π/${den}` : `${n}π/${den}`);
            expect([lo, hi]).toEqual([fmt(num), fmt(second)]);
        }
        expect(checked).toBeGreaterThanOrEqual(10);
    });
});
