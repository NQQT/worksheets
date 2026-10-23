// ─────────────────────────────────────────────────────────────────────────────
// CALCULUS WORKSHEET — self-contained plugin (Year 11 senior expansion).
//
// SENIOR SCOPE (Year 11 introductory calculus — the first differentiation
// strand of the Australian senior methods/advanced-style courses; see
// readme.md "Year 11" for the coverage boundary):
//   Starter   average rate of change of a quadratic between two x-values
//             (the secant-slope / rates-of-change entry point) and power-rule
//             derivatives of quadratics.
//   Practice  differentiating cubics term by term (power rule), tangent
//             gradients at a point, first-principles derivatives of x^2
//             families, and the stationary point of a parabola.
//   Challenge equations of tangents (y = mx + c), stationary points of
//             cubics from f'(x) = 0, and a projectile maximum-height
//             application (stationary point as the maximum).
//
// DELIBERATELY EXCLUDED (typically Year 12 in every pathway): integration,
// exponential/logarithmic/trigonometric derivatives, chain/product/quotient
// rules, second derivatives and kinematics beyond the constant-acceleration
// parabola model.
//
// SCAFFOLDED LEARNING SEQUENCE: printed "Starter:/Practice:/Challenge:" tier
// prefixes, 2+4+2 per page (8 to a sheet, two columns) — the shared T4/T11
// page recipe.
//
// EXACT BY CONSTRUCTION (teacher answers are computed FROM the drawn
// coefficients, never asserted):
//   - quadratic average rate: [f(t2) − f(t1)] / (t2 − t1) factorises to
//     a(t1 + t2) + b, so the drawn integers give an exact integer rate.
//   - stationary x of ax^2 + bx + c is −b/(2a): b is DRAWN as −2a·x0 so x0
//     (and y0 = c − a·x0²) are exact integers.
//   - cubic stationary points: the printed cubic is BUILT from two same-
//     parity roots (x − r1)(x − r2) scaled so f'(x) = 3(x − r1)(x − r2) has
//     integer coefficients — r1, r2 are the exact stationary x-values.
//   - projectile: h(t) = −5(t − t*)² + H expanded; the maximum (t*, H) is
//     built in.
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
const PRACTICE_FORMS = ['cubic', 'tangent', 'principles', 'statquad'] as const;
// Intro practice: power-rule derivatives, tangent gradients (substitution)
// and parabola stationary points — the first-principles limit process waits.
const PRACTICE_INTRO = ['cubic', 'tangent', 'statquad'] as const;
const CHALLENGE_FORMS = ['tangentline', 'statcubic', 'maxheight'] as const;
// Developing challenges: tangent equations + projectile maxima — cubic
// stationary points (from the factored derivative form) wait for Full.
const CHALLENGE_EASY = ['tangentline', 'maxheight'] as const;

// Eight calculus items per A4, two columns (four grid rows) — same density
// as the T4 sentence sheets; prompts stay ≤ ~5 wrapped 22px lines (pinned by
// plugins/layout-capacity.test.ts).
const PER_PAGE = 8;
const S_COUNT = 2;
const P_COUNT = 4;
const C_COUNT = 2;

// ── Canonical polynomial text ────────────────────────────────────────────────
// One formatter for every printed polynomial AND derivative answer so prompts
// and key answers always agree: descending powers, "6x^2 - 10x + 7".
//   - zero coefficients are dropped (a fully zero list prints "0")
//   - ±1 on an x-term prints as "x" / "-x"; x^1 prints "x"; x^0 prints the
//     bare number; powers ≥ 2 print as x^2, x^3 (caret notation, printable)
//   - the first term carries its own sign; later joins print " + " / " - "
function polyText(coeffs: number[], v = 'x'): string {
    const top = coeffs.length - 1;
    let out = '';
    coeffs.forEach((c, i) => {
        if (c === 0) return;
        const p = top - i;
        const abs = Math.abs(c);
        const coef = abs === 1 && p >= 1 ? '' : String(abs);
        const body = p === 0 ? '' : p === 1 ? v : `${v}^${p}`;
        out += out === '' ? (c < 0 ? `-${coef}${body}` : `${coef}${body}`) : c < 0 ? ` - ${coef}${body}` : ` + ${coef}${body}`;
    });
    return out === '' ? '0' : out;
}

// ── Starter tier (2 per page) ────────────────────────────────────────────────

// Average rate of change of a quadratic — the "rates of change" entry point.
// [f(x2) − f(x1)]/(x2 − x1) = a(x1 + x2) + b for f = ax^2 + bx + c, so the
// drawn values make the answer an exact integer (never a rounded decimal).
function starterAvgRate(rng: Rng): RawProblem {
    const a = rng.int(1, 3);
    const b = rng.int(-9, 9);
    const c = rng.int(-9, 9);
    const x1 = rng.int(0, 4);
    const x2 = x1 + rng.int(1, 4);
    const rate = a * (x1 + x2) + b;
    return {
        prompt: `Starter: f(x) = ${polyText([a, b, c])}. The average rate of change between x = ${x1} and x = ${x2} is __`,
        answer: String(rate)
    };
}

// Power rule on a quadratic: d/dx(ax^2 + bx + c) = 2ax + b.
function starterPowerQuad(rng: Rng): RawProblem {
    const a = rng.int(1, 4);
    const b = rng.int(-9, 9);
    const c = rng.int(-9, 9);
    return {
        prompt: `Starter: If f(x) = ${polyText([a, b, c])}, then f'(x) = __`,
        answer: polyText([2 * a, b])
    };
}

// ── Practice tier (4 per page, one of each family) ──────────────────────────

// Term-by-term derivative of a cubic: d/dx(ax^3 + bx^2 + cx + d).
function practiceCubic(rng: Rng): RawProblem {
    const a = rng.int(1, 4);
    const b = rng.int(-9, 9);
    const c = rng.int(-9, 9);
    const d = rng.int(-9, 9);
    return {
        prompt: `Practice: Differentiate f(x) = ${polyText([a, b, c, d])}. f'(x) = __`,
        answer: polyText([3 * a, 2 * b, c])
    };
}

// Gradient of the tangent at x = k: f'(k) = 2ak + b. k is redrawn in the
// (deterministic) rng stream until the gradient is nonzero, so the answer is
// never the degenerate flat-tangent case.
function practiceTangentGrad(rng: Rng): RawProblem {
    const a = rng.int(1, 3);
    const b = rng.int(-9, 9);
    const c = rng.int(-9, 9);
    let k = rng.int(1, 5);
    while (2 * a * k + b === 0) k = rng.int(1, 5);
    return {
        prompt: `Practice: The gradient of the tangent to y = ${polyText([a, b, c])} at x = ${k} is __`,
        answer: String(2 * a * k + b)
    };
}

// First principles on the x^2 family: the (f(x+h) − f(x))/h expansion
// collapses to 2ax + b — the exact derivative. Two shapes: pure multiple of
// x^2 and x^2 + bx.
function practiceFirstPrinciples(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['multiple', 'linear'] as const);
    if (deck.take() === 'multiple') {
        const a = rng.int(2, 4);
        return {
            prompt: `Practice: Using first principles, f(x) = ${polyText([a, 0, 0])} has derivative f'(x) = __`,
            answer: polyText([2 * a, 0])
        };
    }
    const b = rng.int(-9, 9);
    return {
        prompt: `Practice: Using first principles, f(x) = ${polyText([1, b, 0])} has derivative f'(x) = __`,
        answer: polyText([2, b])
    };
}

// Stationary point of a parabola: b is DRAWN as −2a·x0 so the vertex
// (−b/2a, c − a·x0²) = (x0, y0) is exact by construction.
function practiceStatQuad(rng: Rng): RawProblem {
    const a = rng.int(1, 3);
    const x0 = rng.int(-4, 4);
    const c = rng.int(-9, 9);
    const b = -2 * a * x0;
    return {
        prompt: `Practice: The parabola y = ${polyText([a, b, c])} has one stationary point at (__, __)`,
        answer: `${x0}, ${c - a * x0 * x0}`
    };
}

// ── Challenge tier (2 per page) ─────────────────────────────────────────────

// Equation of the tangent at x = k: m = f'(k) ≠ 0 (redrawn), and the tangent
// line y = m(x − k) + f(k) has integer m and intercept by construction. The
// answer is the canonical "y = mx + c" string (polyText drops c = 0).
function challengeTangentEqn(rng: Rng): RawProblem {
    const a = rng.int(1, 3);
    const b = rng.int(-9, 9);
    const c = rng.int(-9, 9);
    let k = rng.int(1, 5);
    while (2 * a * k + b === 0) k = rng.int(1, 5);
    const m = 2 * a * k + b;
    const y0 = a * k * k + b * k + c;
    return {
        prompt: `Challenge: The tangent to y = ${polyText([a, b, c])} at x = ${k} has equation y = mx + c: __`,
        answer: `y = ${polyText([m, y0 - m * k])}`
    };
}

// Stationary points of a cubic BUILT from two same-parity roots r1 < r2:
// f(x) = x^3 − (3/2)(r1+r2)x^2 + 3r1r2x + d has integer coefficients and
// f'(x) = 3(x − r1)(x − r2), so the stationary x-values are exactly r1, r2.
function challengeStatCubic(rng: Rng): RawProblem {
    const deck = createDeck(rng, [[1, 3], [1, 5], [1, 7], [2, 4], [2, 6], [3, 5], [3, 7], [4, 6]] as const);
    const [r1, r2] = deck.take();
    const d = rng.int(-9, 9);
    const b = -(3 * (r1 + r2)) / 2;
    const c = 3 * r1 * r2;
    return {
        prompt: `Challenge: The stationary points of y = ${polyText([1, b, c, d])} (where f'(x) = 0) are at x = __ and x = __`,
        answer: `${r1}, ${r2}`
    };
}

// Projectile maximum (T5 review fix): the INITIAL height h(0) is drawn
// directly in 0..40 and the peak is built on top of it —
//   h(t) = −5t² + 10t*·t + h(0),  h'(t) = −10t + 10t*  (zeroes at t*),
//   h(0) = h(0) ≥ 0 (a valid launch height),  h(t*) = 5t*² + h(0) ≤ 120.
// The old construction drew the PEAK first (10..40) and subtracted 5t*²,
// which produced negative launch heights like h(0) = −55 for h(t) =
// −5t² + 40t − 55 — physically awkward (the ball starts underground).
// polyText is called with 't' so the printed polynomial matches the prompt's
// time variable (h(t), t seconds) — never a mixed x/t sentence.
function challengeMaxHeight(rng: Rng): RawProblem {
    const tstar = rng.int(1, 4);
    const h0 = rng.int(0, 40);
    const h = 5 * tstar * tstar + h0;
    return {
        prompt: `Challenge: A ball's height is h(t) = ${polyText([-5, 10 * tstar, h0], 't')} metres after t seconds. Its maximum height is __ metres`,
        answer: String(h)
    };
}

// ── Tier dispatch + page assembly (shared T4/T11 recipe) ────────────────────
function starterItem(rng: Rng): RawProblem {
    return createDeck(rng, ['rate', 'power'] as const).take() === 'rate'
        ? starterAvgRate(rng)
        : starterPowerQuad(rng);
}

function practiceItem(rng: Rng, rung: number): RawProblem {
    // The practice pool widens with the rung (Intro deals a subset — the
    // pool tuples above keep the Full rung's order identical to the legacy
    // deck, so rung 3 output is draw-for-draw the legacy Year-11 sheet).
    const deck = createDeck(rng, rung === 1 ? PRACTICE_INTRO : PRACTICE_FORMS);
    const form = deck.take();
    if (form === 'cubic') return practiceCubic(rng);
    if (form === 'tangent') return practiceTangentGrad(rng);
    if (form === 'principles') return practiceFirstPrinciples(rng);
    return practiceStatQuad(rng);
}

function challengeItem(rng: Rng, rung: number): RawProblem {
    // The challenge pool exists only from Developing upward (Intro pages fill
    // with extra practice items instead — see the rung counts in
    // generateCalculus).
    const deck = createDeck(rng, rung === 3 ? CHALLENGE_FORMS : CHALLENGE_EASY);
    const form = deck.take();
    if (form === 'tangentline') return challengeTangentEqn(rng);
    if (form === 'statcubic') return challengeStatCubic(rng);
    return challengeMaxHeight(rng);
}

// Page-by-page scaffold→core→stretch assembly: each tier is sampled with its
// own sampleUnique call (distinct prompts within the tier) and the blocks are
// interleaved per page, so one sheet reads Starter, Starter, Practice ×4,
// Challenge ×2.
// Page-by-page scaffold→core→stretch assembly: each tier is sampled with its
// own sampleUnique call (distinct prompts within the tier) and the blocks are
// interleaved per page, so one sheet reads Starter, Starter, Practice ×4,
// Challenge ×2. The Intro rung swaps two Challenge slots for extra practice
// (2+6+0) so an introductory calculus sheet stays a full 8-item page without
// any challenge-tier item.
function generateCalculus(rng: Rng, caps: Caps, count: number): RawProblem[] {
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

export const calculusSpec: WorksheetSpec = {
    id: 'calculus',
    label: 'Calculus',
    icon: '∂',
    perPage: PER_PAGE,
    offered: (grade) => grade.available.includes('calculus'),
    scope: () => 'rates of change, first principles, tangents & stationary points',
    generate: generateCalculus
};

export function CalculusWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(calculusSpec);
}
