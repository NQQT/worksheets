// ─────────────────────────────────────────────────────────────────────────────
// TRIGONOMETRY WORKSHEET — self-contained plugin (Year 11 senior expansion).
//
// SENIOR SCOPE (Year 11 trigonometry strand — radians, exact ratios on the
// unit circle, arc/sector measurement, simple exact equations; see readme.md
// "Year 11" for the boundary):
//   Starter   degrees → radians as aπ/b, and exact sin/cos values of the
//             special angles 0°..90°.
//   Practice  radians → degrees, arc length and sector area in exact π
//             form, and solving sin/cos/tan equations over 0°..180°.
//   Challenge exact ratios beyond 90° via the reference angle (ASTC sign
//             rules), and the same two-root equations in radians over
//             0..2π.
//
// NOTATION / CANONICAL FORMS (kept unambiguous on purpose):
//   - radians print as aπ/b with the fraction reduced; arc/sector answers as
//     "kπ" or "kπ/n".
//   - exact ratios use the school table: 1/2, √3/2, √2/2, 0, 1, √3 — tan 30°
//     (written as both √3/3 and 1/√3 in different states) is never asked, and
//     tan items outside the exact {0°, 45°, 60°} reference set are excluded.
//
// DELIBERATELY EXCLUDED: general angle solutions (± 360k°/2kπ families),
// bearings and non-right-triangle rules (sine/cosine rules are a separate
// senior application topic), graphs of trig functions, and t-formulas.
//
// SCAFFOLDED LEARNING SEQUENCE: "Starter:/Practice:/Challenge:" prefixes,
// 2+4+2 per page (8 to a sheet, two columns).
//
// EXACT BY CONSTRUCTION: every conversion/reduction runs on the drawn
// integer (gcd reduction for aπ/b; arc = r·θ and area = r²θ/2 with θ = dπ/180
// reduced exactly), and equation answers come from the fixed exact-value
// tables below — never from decimal rounding.
//
// Self-contained: delete file + index line to remove the worksheet.
// ─────────────────────────────────────────────────────────────────────────────

import type { Caps, DashboardFramework, DashboardPlugin, RawProblem, Rng, WorksheetSpec } from '../../framework';
import { createDeck, sampleUnique, seniorRung } from '../../framework';

// ── Independent difficulty ladder (see framework/difficulty.ts) ──────────────
// The senior families no longer sit behind a Year-11 selector: the difficulty
// adapter maps the user's level onto THESE rungs (1 = Intro, 2 = Developing,
// 3 = Full) and writes the rung into caps.yearLevel. Each rung widens the
// material honestly — nothing is re-skinned:
//   1 Intro      — Starter + the gentle practice families (no Challenge tier)
//   2 Developing — the full practice set + the easier Challenge families
//   3 Full       — the complete legacy scope, draw-for-draw identical
//                  (the pool tuples below keep the legacy order exactly).
const PRACTICE_FORMS = ['radtodeg', 'arc', 'sector', 'solve'] as const;
// Intro practice: conversions, arc length and sector area — solving simple
// trigonometric equations waits.
const PRACTICE_INTRO = ['radtodeg', 'arc', 'sector'] as const;
const CHALLENGE_FORMS = ['astc', 'solverad'] as const;
// Developing challenges: exact ASTC-ratio items — radian-measured equations
// wait for Full.
const CHALLENGE_EASY = ['astc'] as const;

const PER_PAGE = 8;
const S_COUNT = 2;
const P_COUNT = 4;
const C_COUNT = 2;

// Euclid's gcd — exact fraction reduction for degrees ↔ radians and arc/sector
// multiples of π.
function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

// ── Exact-value tables (the school special-angle set, canonical strings) ────
// sin/cos of 0°, 30°, 45°, 60°, 90° — mirrored by cos(angle) = sin(90 − angle).
const SIN_TABLE: Record<number, string> = { 0: '0', 30: '1/2', 45: '√2/2', 60: '√3/2', 90: '1' };
const COS_TABLE: Record<number, string> = { 0: '1', 30: '√3/2', 45: '√2/2', 60: '1/2', 90: '0' };
// tan is only asked where the value has ONE canonical school form.
const TAN_TABLE: Record<number, string> = { 0: '0', 45: '1', 60: '√3' };

// sin x = ratio → the two solutions in 0°..180°: θ and 180° − θ (sine is
// symmetric about 90°, so both supplements carry the SAME positive value).
const SIN_EQN_DEG: Record<string, [number, number]> = {
    '1/2': [30, 150],
    '√2/2': [45, 135],
    '√3/2': [60, 120]
};
// cos x = ratio → the two solutions in 0°..360°: θ and 360° − θ. Cosine is
// ONE-TO-ONE on 0°..180° (it falls strictly from 1 to −1), so no second root
// exists there — the earlier supplement pairs (e.g. cos x = 1/2 → "60, 120")
// were WRONG: cos 120° = −1/2. The mirror-about-360° pair is the correct
// two-root family (T5 review fix; numerically verified in the plugin tests).
const COS_EQN_DEG: Record<string, [number, number]> = {
    '1/2': [60, 300],
    '√2/2': [45, 315],
    '√3/2': [30, 330]
};
// Single-solution tan equations over 0°..180°.
const TAN_EQN_DEG: Record<string, number> = { '1': 45, '√3': 60 };

// The same equation families in radians over 0..2π.
const SIN_EQN_RAD: Record<string, [string, string]> = {
    '1/2': ['π/6', '5π/6'],
    '√2/2': ['π/4', '3π/4'],
    '√3/2': ['π/3', '2π/3']
};
const COS_EQN_RAD: Record<string, [string, string]> = {
    '1/2': ['π/3', '5π/3'],
    '√2/2': ['π/4', '7π/4'],
    '√3/2': ['π/6', '11π/6']
};

// Degrees with exact reduced aπ/b radian form, and the reverse table.
const DEG_TO_RAD: Record<number, [number, number]> = {
    30: [1, 6], 45: [1, 4], 60: [1, 3], 90: [1, 2], 120: [2, 3],
    135: [3, 4], 150: [5, 6], 180: [1, 1], 270: [3, 2], 360: [2, 1]
};
const RAD_TO_DEG: Record<string, number> = {
    'π/6': 30, 'π/4': 45, 'π/3': 60, 'π/2': 90, '2π/3': 120,
    '3π/4': 135, '5π/6': 150, 'π': 180, '3π/2': 270, '2π': 360
};

// "π" vs "kπ" vs "kπ/n" — the canonical exact-π answer string for arc/sector
// work (a numerator of 1 never prints, and a denominator of 1 is dropped).
function piText(num: number, den: number): string {
    if (den === 1) return num === 1 ? 'π' : `${num}π`;
    return num === 1 ? `π/${den}` : `${num}π/${den}`;
}

// ── Starter tier ─────────────────────────────────────────────────────────────

// Degrees → radians: d° = aπ/b with a/b the exact reduction of d/180.
function starterDegToRad(rng: Rng): RawProblem {
    const d = rng.pick(Object.keys(DEG_TO_RAD).map(Number));
    const [a, b] = DEG_TO_RAD[d];
    return {
        prompt: `Starter: ${d}° = aπ/b radians. a = __ and b = __`,
        answer: `${a}, ${b}`
    };
}

// Exact sin/cos of a special angle (tan excluded here — tan 90° is undefined
// and the starter keeps to the defined table).
function starterExactRatio(rng: Rng): RawProblem {
    const fn = rng.pick(['sin', 'cos'] as const);
    const angle = rng.pick([0, 30, 45, 60, 90] as const);
    const value = fn === 'sin' ? SIN_TABLE[angle] : COS_TABLE[angle];
    return { prompt: `Starter: ${fn} ${angle}° = __`, answer: value };
}

// ── Practice tier ────────────────────────────────────────────────────────────

// Radians → degrees from the fixed exact table.
function practiceRadToDeg(rng: Rng): RawProblem {
    const keys = Object.keys(RAD_TO_DEG);
    const frac = rng.pick(keys);
    return { prompt: `Practice: ${frac} radians = __°`, answer: String(RAD_TO_DEG[frac]) };
}

// Arc length l = rθ with θ = dπ/180: l = (r·d/180)π reduced exactly by gcd,
// so the answer is always a clean multiple-of-π string.
function practiceArcLength(rng: Rng): RawProblem {
    const r = rng.int(2, 9);
    const d = rng.pick([30, 45, 60, 90, 120, 180, 270] as const);
    // θ = dπ/180; l = r·θ = r·d·π/180 → reduce the integer pair (r·d, 180).
    const num = (r * d) / gcd(r * d, 180);
    const den = 180 / gcd(r * d, 180);
    return {
        prompt: `Practice: A sector has radius ${r} cm and angle ${d}°. Its arc length is __ cm (in terms of π)`,
        answer: piText(num, den)
    };
}

// Sector area A = r²θ/2 with θ = dπ/180: A = r²dπ/360 reduced exactly.
function practiceSectorArea(rng: Rng): RawProblem {
    const r = rng.int(2, 9);
    const d = rng.pick([30, 45, 60, 90, 120] as const);
    const whole = r * r * d;
    const g = gcd(whole, 360);
    return {
        prompt: `Practice: A sector has radius ${r} cm and angle ${d}°. Its area is __ cm^2 (in terms of π)`,
        answer: piText(whole / g, 360 / g)
    };
}

// Solve an exact trig equation: sine (0°..180°, two supplements), cosine
// (0°..360°, the θ / 360° − θ mirror pair — T5 review fix) and the
// single-root tan family (0°..180°), all from the tables above.
function practiceSolveDeg(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['sin', 'cos', 'tan'] as const);
    const fn = deck.take();
    if (fn === 'tan') {
        const ratio = rng.pick(Object.keys(TAN_EQN_DEG));
        return { prompt: `Practice: Solve tan x = ${ratio} for 0° ≤ x ≤ 180°: x = __`, answer: String(TAN_EQN_DEG[ratio]) };
    }
    // Per-family interval (T5 review fix): sine keeps 0°..180° (its two roots
    // θ / 180° − θ both live there); cosine prints 0°..360° because its two
    // roots θ / 360° − θ only both exist there (cos is one-to-one on 0..180).
    const table = fn === 'sin' ? SIN_EQN_DEG : COS_EQN_DEG;
    const interval = fn === 'sin' ? '0° ≤ x ≤ 180°' : '0° ≤ x ≤ 360°';
    const ratio = rng.pick(Object.keys(table));
    const [lo, hi] = table[ratio];
    return {
        prompt: `Practice: Solve ${fn} x = ${ratio} for ${interval}: x = __ or x = __ (smaller first)`,
        answer: `${lo}, ${hi}`
    };
}

// ── Challenge tier ───────────────────────────────────────────────────────────

// Exact ratios beyond 90°: the value is the reference-angle table value with
// the ASTC quadrant sign applied — computed here from the tables (never a
// drawn guess), so the answer string is canonical.
// Angles where tan has an ambiguous school form (√3/3 vs 1/√3) are excluded
// from the tan family by the angle list itself.
const ASTC_ANGLES = [120, 135, 150, 210, 225, 240, 300, 315, 330] as const;
const REF_ANGLE: Record<number, number> = {
    120: 60, 135: 45, 150: 30, 210: 30, 225: 45, 240: 60,
    300: 60, 315: 45, 330: 30
};
const ASTC_SIGN: Record<number, Record<'sin' | 'cos' | 'tan', number>> = {
    120: { sin: 1, cos: -1, tan: -1 },   // QII: sin +, cos −, tan −
    135: { sin: 1, cos: -1, tan: -1 },
    150: { sin: 1, cos: -1, tan: -1 },
    210: { sin: -1, cos: -1, tan: 1 },   // QIII: sin −, cos −, tan +
    225: { sin: -1, cos: -1, tan: 1 },
    240: { sin: -1, cos: -1, tan: 1 },
    300: { sin: -1, cos: 1, tan: -1 },   // QIV: sin −, cos +, tan −
    315: { sin: -1, cos: 1, tan: -1 },
    330: { sin: -1, cos: 1, tan: -1 }
};

function challengeAstcExact(rng: Rng): RawProblem {
    const fn = rng.pick(['sin', 'cos', 'tan'] as const);
    // tan is restricted to angles whose reference value is in TAN_TABLE.
    const angle = fn === 'tan'
        ? rng.pick([120, 135, 225, 240, 300, 315] as const)
        : rng.pick(ASTC_ANGLES);
    const refTable = fn === 'sin' ? SIN_TABLE : fn === 'cos' ? COS_TABLE : TAN_TABLE;
    const magnitude = refTable[REF_ANGLE[angle]];
    const sign = ASTC_SIGN[angle][fn];
    // "0" never needs a sign; negative magnitudes prefix the canonical string.
    const value = magnitude === '0' ? '0' : sign > 0 ? magnitude : `-${magnitude}`;
    return { prompt: `Challenge: ${fn} ${angle}° = __`, answer: value };
}

// Solve the two-root exact equations in radians over 0..2π.
function challengeSolveRad(rng: Rng): RawProblem {
    const fn = rng.pick(['sin', 'cos'] as const);
    const table = fn === 'sin' ? SIN_EQN_RAD : COS_EQN_RAD;
    const ratio = rng.pick(Object.keys(table));
    const [lo, hi] = table[ratio];
    return {
        prompt: `Challenge: Solve ${fn} x = ${ratio} for 0 ≤ x ≤ 2π: x = __ or x = __ (smaller first)`,
        answer: `${lo}, ${hi}`
    };
}

// ── Tier dispatch + page assembly (shared T4/T11 recipe) ────────────────────
function starterItem(rng: Rng): RawProblem {
    return createDeck(rng, ['convert', 'exact'] as const).take() === 'convert'
        ? starterDegToRad(rng)
        : starterExactRatio(rng);
}

function practiceItem(rng: Rng, rung: number): RawProblem {
    // The practice pool widens with the rung (Intro deals a subset — the
    // pool tuples above keep the Full rung's order identical to the legacy
    // deck, so rung 3 output is draw-for-draw the legacy Year-11 sheet).
    const deck = createDeck(rng, rung === 1 ? PRACTICE_INTRO : PRACTICE_FORMS);
    const form = deck.take();
    if (form === 'radtodeg') return practiceRadToDeg(rng);
    if (form === 'arc') return practiceArcLength(rng);
    if (form === 'sector') return practiceSectorArea(rng);
    return practiceSolveDeg(rng);
}

function challengeItem(rng: Rng, rung: number): RawProblem {
    // The challenge pool exists only from Developing upward (Intro pages fill
    // with extra practice items instead — see the rung counts in
    // generateTrigonometry).
    const deck = createDeck(rng, rung === 3 ? CHALLENGE_FORMS : CHALLENGE_EASY);
    return deck.take() === 'astc'
        ? challengeAstcExact(rng)
        : challengeSolveRad(rng);
}

// Page-by-page scaffold→core→stretch assembly: each tier is sampled with its
// own sampleUnique call (distinct prompts within the tier) and the blocks are
// interleaved per page (Starter ×2, Practice ×4, Challenge ×2). The Intro
// rung swaps two Challenge slots for extra practice (2+6+0) so an
// introductory trigonometry sheet stays a full 8-item page without any
// challenge-tier item.
function generateTrigonometry(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const rung = seniorRung(caps);
    const pages = Math.ceil(count / PER_PAGE);
    const sCount = S_COUNT;
    const pCount = rung === 1 ? S_COUNT + P_COUNT : P_COUNT;
    const cCount = rung === 1 ? 0 : C_COUNT;
    const starter = sampleUnique(pages * sCount, () => starterItem(rng), (p) => p.prompt);
    const practice = sampleUnique(pages * pCount, () => practiceItem(rng, rung), (p) => p.prompt);
    const challenge = sampleUnique(pages * cCount, () => challengeItem(rng, rung), (p) => p.prompt);
    const out: RawProblem[] = [];
    for (let pg = 0; pg < pages; pg++) {
        out.push(
            ...starter.slice(pg * sCount, pg * sCount + sCount),
            ...practice.slice(pg * pCount, pg * pCount + pCount),
            ...challenge.slice(pg * cCount, pg * cCount + cCount)
        );
    }
    return out.slice(0, count);
}

export const trigonometrySpec: WorksheetSpec = {
    id: 'trigonometry',
    label: 'Trigonometry',
    icon: '∠',
    perPage: PER_PAGE,
    offered: (grade) => grade.available.includes('trigonometry'),
    scope: () => 'radians, exact ratios, arc & sector measurement, simple equations',
    generate: generateTrigonometry
};

export function TrigonometryWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(trigonometrySpec);
}
