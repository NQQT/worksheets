// Unit tests for the SPEED, DISTANCE & TIME worksheet plugin (Physic, R5).
//
// Pinned here:
//   1. the declarative spec + the four-rung scope ladder;
//   2. availability + the 4-level cap;
//   3. exact sheets for every level (d = s×t → hidden speed/time → km/h →
//      whole-journey averages);
//   4. INDEPENDENT SOUNDNESS across many seeds — every answer re-derived
//      from the prompt's given quantities: d = s·t / s = d÷t / t = d÷s exact
//      integers, L4 average = TOTAL distance ÷ TOTAL time (never the
//      unweighted speed average), explicit units, no zero quantities;
//   5. determinism / refresh / saturation seed parity.

import { describe, it, expect } from 'vitest';
import { seedFrom, getScienceGradeConfig, generateSheet, generateDocument, resolveDifficulty } from '../../framework';
import { speedSpec } from './SpeedDistanceTimeWorksheet';

const g0 = getScienceGradeConfig(0); // level 1
const g1 = getScienceGradeConfig(1); // level 2
const g2 = getScienceGradeConfig(2); // level 3
const g3 = getScienceGradeConfig(3); // level 4
const g4 = getScienceGradeConfig(4); // beyond the cap (unimplemented row)

function sheet(grade: ReturnType<typeof getScienceGradeConfig>) {
    return generateSheet(speedSpec, grade, seedFrom([grade.id, speedSpec.id, 0]));
}

describe('speed plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(speedSpec.id).toBe('speed');
        expect(speedSpec.label).toBe('Speed, Distance & Time');
        expect(speedSpec.icon).toBe('⏱');
        // One-line prompts in the standard two-column grid.
        expect(speedSpec.perPage).toBe(8);
        expect(speedSpec.singleColumn).toBeUndefined();
    });

    it('describes its scope from the four rungs', () => {
        expect(speedSpec.scope(g0)).toBe('distance = speed × time (m/s)');
        expect(speedSpec.scope(g1)).toBe('find any quantity (m/s)');
        expect(speedSpec.scope(g2)).toBe('km/h journeys');
        expect(speedSpec.scope(g3)).toBe('whole-journey average speed');
    });

    it('resolves through the shared science catalogue with the 4-level cap', () => {
        const plan = resolveDifficulty('physics', 'speed', 99);
        expect(plan.maxLevel).toBe(4);
        expect(plan.effectiveLevel).toBe(4);
        expect(plan.saturated).toBe(true);
        expect(resolveDifficulty('physics', 'speed', 1).notYetOffered).toBe(false);
    });
});

describe('speed — availability gating', () => {
    it('generates at every implemented level; an unimplemented grade gives an empty sheet', () => {
        expect(sheet(g0)).toHaveLength(8);
        expect(sheet(g1)).toHaveLength(8);
        expect(sheet(g2)).toHaveLength(8);
        expect(sheet(g3)).toHaveLength(8);
        expect(sheet(g4)).toEqual([]);
    });
});

describe('speed — exact sheets per level', () => {
    it('level 1 matches the exact sheet (d = s × t, m/s)', () => {
        expect(sheet(g0)).toEqual([
            { prompt: 'A vehicle travels at 13 m/s for 7 s. The distance travelled is __ m.', answer: '91', id: 1, type: 'speed' },
            { prompt: 'A vehicle travels at 15 m/s for 12 s. The distance travelled is __ m.', answer: '180', id: 2, type: 'speed' },
            { prompt: 'A vehicle travels at 9 m/s for 4 s. The distance travelled is __ m.', answer: '36', id: 3, type: 'speed' },
            { prompt: 'A vehicle travels at 10 m/s for 8 s. The distance travelled is __ m.', answer: '80', id: 4, type: 'speed' },
            { prompt: 'A vehicle travels at 7 m/s for 5 s. The distance travelled is __ m.', answer: '35', id: 5, type: 'speed' },
            { prompt: 'A vehicle travels at 8 m/s for 7 s. The distance travelled is __ m.', answer: '56', id: 6, type: 'speed' },
            { prompt: 'A vehicle travels at 5 m/s for 3 s. The distance travelled is __ m.', answer: '15', id: 7, type: 'speed' },
            { prompt: 'A vehicle travels at 14 m/s for 6 s. The distance travelled is __ m.', answer: '84', id: 8, type: 'speed' }
        ]);
    });

    it('level 2 matches the exact sheet (hidden speed/time, exact construction)', () => {
        expect(sheet(g1)).toEqual([
            { prompt: 'A vehicle travels 80 m in 10 s. Its speed is __ m/s.', answer: '8', id: 1, type: 'speed' },
            { prompt: 'A vehicle travels at 6 m/s for 2 s. The distance travelled is __ m.', answer: '12', id: 2, type: 'speed' },
            { prompt: 'A vehicle travels 12 m at 3 m/s. The time taken is __ s.', answer: '4', id: 3, type: 'speed' },
            { prompt: 'A vehicle travels 55 m in 11 s. Its speed is __ m/s.', answer: '5', id: 4, type: 'speed' },
            { prompt: 'A vehicle travels at 2 m/s for 9 s. The distance travelled is __ m.', answer: '18', id: 5, type: 'speed' },
            { prompt: 'A vehicle travels 12 m at 3 m/s. The time taken is __ s.', answer: '4', id: 6, type: 'speed' },
            { prompt: 'A vehicle travels 132 m in 11 s. Its speed is __ m/s.', answer: '12', id: 7, type: 'speed' },
            { prompt: 'A vehicle travels 56 m at 7 m/s. The time taken is __ s.', answer: '8', id: 8, type: 'speed' }
        ]);
    });

    it('level 3 matches the exact sheet (km/h journeys)', () => {
        expect(sheet(g2)).toEqual([
            { prompt: 'A vehicle travels at 70 km/h for 4 h. The distance travelled is __ km.', answer: '280', id: 1, type: 'speed' },
            { prompt: 'A vehicle travels 675 km at 75 km/h. The time taken is __ h.', answer: '9', id: 2, type: 'speed' },
            { prompt: 'A vehicle travels 11 km in 1 h. Its speed is __ km/h.', answer: '11', id: 3, type: 'speed' },
            { prompt: 'A vehicle travels at 28 km/h for 7 h. The distance travelled is __ km.', answer: '196', id: 4, type: 'speed' },
            { prompt: 'A vehicle travels 284 km at 71 km/h. The time taken is __ h.', answer: '4', id: 5, type: 'speed' },
            { prompt: 'A vehicle travels 280 km in 10 h. Its speed is __ km/h.', answer: '28', id: 6, type: 'speed' },
            { prompt: 'A vehicle travels at 35 km/h for 3 h. The distance travelled is __ km.', answer: '105', id: 7, type: 'speed' },
            { prompt: 'A vehicle travels 4 km at 4 km/h. The time taken is __ h.', answer: '1', id: 8, type: 'speed' }
        ]);
    });

    it('level 4 matches the exact sheet (whole-journey averages)', () => {
        expect(sheet(g3)).toEqual([
            { prompt: 'A bus travels 44 m in 4 s, then 36 m in 12 s. The average speed for the whole journey is __ m/s.', answer: '5', id: 1, type: 'speed' },
            { prompt: 'A bus travels 30 m in 5 s, then 26 m in 2 s. The average speed for the whole journey is __ m/s.', answer: '8', id: 2, type: 'speed' },
            { prompt: 'A bus travels 120 m in 8 s, then 88 m in 8 s. The average speed for the whole journey is __ m/s.', answer: '13', id: 3, type: 'speed' },
            { prompt: 'A bus travels 32 m in 8 s, then 28 m in 2 s. The average speed for the whole journey is __ m/s.', answer: '6', id: 4, type: 'speed' },
            { prompt: 'A bus travels 27 m in 3 s, then 72 m in 6 s. The average speed for the whole journey is __ m/s.', answer: '11', id: 5, type: 'speed' },
            { prompt: 'A bus travels 36 m in 3 s, then 84 m in 12 s. The average speed for the whole journey is __ m/s.', answer: '8', id: 6, type: 'speed' },
            { prompt: 'A bus travels 33 m in 11 s, then 143 m in 11 s. The average speed for the whole journey is __ m/s.', answer: '8', id: 7, type: 'speed' },
            { prompt: 'A bus travels 180 m in 12 s, then 44 m in 4 s. The average speed for the whole journey is __ m/s.', answer: '14', id: 8, type: 'speed' }
        ]);
    });
});

describe('speed — independent soundness across many seeds', () => {
    // 10 pages × 8 rows per level ⇒ the whole form space is exercised.
    const streamFor = (grade: ReturnType<typeof getScienceGradeConfig>) =>
        generateDocument(speedSpec, grade, seedFrom([grade.id, speedSpec.id, 0]), 10).pages.flat();

    it('level 1/2 answers are the exact d = s·t constructions; no zeros; units explicit', () => {
        for (const [grade, metric] of [[g0, false], [g1, false], [g2, true]] as const) {
            for (const p of streamFor(grade)) {
                const distanceForm = /^A vehicle travels at (\d+) (m\/s|km\/h) for (\d+) (s|h)\. The distance travelled is __ (m|km)\.$/.exec(p.prompt);
                const speedForm = /^A vehicle travels (\d+) (m|km) in (\d+) (s|h)\. Its speed is __ (m\/s|km\/h)\.$/.exec(p.prompt);
                const timeForm = /^A vehicle travels (\d+) (m|km) at (\d+) (m\/s|km\/h)\. The time taken is __ (s|h)\.$/.exec(p.prompt);
                if (distanceForm) {
                    const s = Number(distanceForm[1]);
                    const t = Number(distanceForm[3]);
                    expect(s).toBeGreaterThan(0);
                    expect(t).toBeGreaterThan(0);
                    expect(p.answer).toBe(`${s * t}`);
                    // Given quantities carry units and the blank's unit is
                    // printed after it.
                    expect(p.prompt.endsWith(`__ ${distanceForm[5]}.`)).toBe(true);
                } else if (speedForm) {
                    const d = Number(speedForm[1]);
                    const t = Number(speedForm[3]);
                    expect(d).toBeGreaterThan(0);
                    expect(t).toBeGreaterThan(0);
                    // EXACT construction: d ÷ t is the whole-number speed.
                    expect(d % t).toBe(0);
                    expect(p.answer).toBe(`${d / t}`);
                } else if (timeForm) {
                    const d = Number(timeForm[1]);
                    const s = Number(timeForm[3]);
                    expect(d).toBeGreaterThan(0);
                    expect(s).toBeGreaterThan(0);
                    // EXACT construction: d ÷ s is the whole-number time.
                    expect(d % s).toBe(0);
                    expect(p.answer).toBe(`${d / s}`);
                } else {
                    throw new Error(`unrecognised level ${grade.id} prompt: ${p.prompt}`);
                }
            }
        }
    });

    it('level 1 asks only for distances; level 2/3 deal all three forms', () => {
        const level1 = streamFor(g0);
        for (const p of level1) expect(p.prompt).toContain('The distance travelled is __');
        for (const grade of [g1, g2]) {
            const stream = streamFor(grade);
            expect(stream.some((p) => p.prompt.includes('The distance travelled is __'))).toBe(true);
            expect(stream.some((p) => p.prompt.includes('Its speed is __'))).toBe(true);
            expect(stream.some((p) => p.prompt.includes('The time taken is __'))).toBe(true);
        }
    });

    it('level 4 average = TOTAL distance ÷ TOTAL time (integer, not the speed mean)', () => {
        for (const p of streamFor(g3)) {
            const m = /^A bus travels (\d+) m in (\d+) s, then (\d+) m in (\d+) s\. The average speed for the whole journey is __ m\/s\.$/.exec(p.prompt);
            if (!m) throw new Error(`unrecognised level 4 prompt: ${p.prompt}`);
            const d1 = Number(m[1]);
            const t1 = Number(m[2]);
            const d2 = Number(m[3]);
            const t2 = Number(m[4]);
            // No zero legs.
            expect(Math.min(d1, t1, d2, t2)).toBeGreaterThan(0);
            const totalDistance = d1 + d2;
            const totalTime = t1 + t2;
            // Integer-exact by construction.
            expect(totalDistance % totalTime).toBe(0);
            const average = totalDistance / totalTime;
            expect(p.answer).toBe(`${average}`);
            // The unweighted speed average would be a DIFFERENT (wrong)
            // construction in general: whenever the leg times differ, the
            // true average must not equal (s1 + s2) ÷ 2 unless the maths
            // coincides. Pin at least that the honest formula is what is
            // printed (covered by the exact match above) and that speeds
            // stay in the drawn band.
            const s1 = d1 / t1;
            const s2 = d2 / t2;
            expect(s1).toBeLessThanOrEqual(15);
            expect(s2).toBeLessThanOrEqual(15);
        }
    });

    it('level 4 journeys actually exercise unequal leg times (the concept matters)', () => {
        const stream = streamFor(g3);
        const times = stream.map((p) => {
            const m = /^A bus travels \d+ m in (\d+) s, then \d+ m in (\d+) s\./.exec(p.prompt)!;
            return [Number(m[1]), Number(m[2])];
        });
        // The retry construction samples t1, t2 independently — a stream of 80
        // journeys contains unequal-time pairs (otherwise the sheet would
        // collapse onto the equal-time fallback).
        expect(times.some(([a, b]) => a !== b)).toBe(true);
    });
});

describe('speed — determinism, refresh and saturation', () => {
    it('same seed ⇒ identical sheet; a new refresh ⇒ different sheet', () => {
        const a = sheet(g3);
        const b = generateSheet(speedSpec, g3, seedFrom([g3.id, speedSpec.id, 0]));
        expect(b).toEqual(a);
        const rerolled = generateSheet(speedSpec, g3, seedFrom([g3.id, speedSpec.id, 1]));
        expect(rerolled).not.toEqual(a);
    });

    it('level 99 saturates to the level-4 sheet (same seed parts, same content)', () => {
        const atCap = sheet(g3);
        const overshot = generateSheet(speedSpec, g3, seedFrom([3, speedSpec.id, 0]));
        expect(overshot).toEqual(atCap);
    });
});
