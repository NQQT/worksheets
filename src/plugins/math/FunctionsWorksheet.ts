// ─────────────────────────────────────────────────────────────────────────────
// FUNCTIONS & QUADRATICS WORKSHEET — self-contained plugin (Year 11 senior
// expansion).
//
// SENIOR SCOPE (Year 11 functions/quadratics strand — the Methods Units 1–2 /
// Advanced Y11 "functions" slice; see readme.md "Year 11" for the boundary):
//   Starter   evaluating f(k) for quadratics, and the two natural-domain
//             guards (√ needs a non-negative radicand, 1/(x−a) is undefined
//             at x = a).
//   Practice  reading the vertex from completed-square form, the
//             discriminant b² − 4ac, completing the square (q, k blanks),
//             and factorising monic quadratics over the integers.
//   Challenge solving x^2 + bx + c = 0 exactly from integer roots, and the
//             double-root condition (discriminant zero → find k).
//
// DELIBERATELY EXCLUDED: polynomial division of functions, composite/inverse
// functions, quadratic inequalities, and the general quadratic formula with
// surd answers (the app prints exact integers only).
//
// SCAFFOLDED LEARNING SEQUENCE: "Starter:/Practice:/Challenge:" prefixes,
// 2+4+2 per page (8 to a sheet, two columns).
//
// EXACT BY CONSTRUCTION (answers computed FROM the drawn values):
//   - completed-square items DRAW h, k first and expand to integer b, c, so
//     the (q, k) blanks reverse the build exactly.
//   - factorise/solve items DRAW the integer roots and expand (x − r1)(x − r2),
//     so the missing factor/root is the drawn value.
//   - the double-root k is b²/4 with b drawn even, so k is a whole number.
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
const PRACTICE_FORMS = ['vertex', 'discriminant', 'completing', 'factorise'] as const;
// Intro practice: vertex read-off and discriminant evaluation — completing
// the square and factorising (procedural transformations) wait.
const PRACTICE_INTRO = ['vertex', 'discriminant'] as const;
const CHALLENGE_FORMS = ['solve', 'doubleroot'] as const;
// Developing challenges: exact solving from integer roots — the double-root
// (discriminant-zero) reasoning waits for Full.
const CHALLENGE_EASY = ['solve'] as const;

const PER_PAGE = 8;
const S_COUNT = 2;
const P_COUNT = 4;
const C_COUNT = 2;

// Canonical polynomial text — same contract as CalculusWorksheet (each plugin
// stays self-contained, so this helper is duplicated by design): descending
// powers, "x^2 - 7x + 12", zero terms dropped, ±1 coeficits omitted.
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

// ── Starter tier ─────────────────────────────────────────────────────────────

// Function evaluation at a small nonzero integer.
function starterEvaluate(rng: Rng): RawProblem {
    const a = rng.int(-3, 3);
    const b = rng.int(-6, 6);
    const c = rng.int(-8, 8);
    let k = rng.int(-3, 3);
    while (k === 0) k = rng.int(-3, 3);
    return {
        prompt: `Starter: If f(x) = ${polyText([a, b, c])}, then f(${k}) = __`,
        answer: String(a * k * k + b * k + c)
    };
}

// Domain guards: √(x − n) is defined for x ≥ n; 1/(x − n) is undefined at
// x = n. Both answers are the drawn cut-off n itself.
function starterDomain(rng: Rng): RawProblem {
    const n = rng.int(2, 12);
    return createDeck(rng, ['sqrt', 'reciprocal'] as const).take() === 'sqrt'
        ? { prompt: `Starter: f(x) = √(x - ${n}) is defined for x ≥ __`, answer: String(n) }
        : { prompt: `Starter: g(x) = 1/(x - ${n}) is undefined at x = __`, answer: String(n) };
}

// ── Practice tier ────────────────────────────────────────────────────────────

// Vertex of completed-square form: y = (x − h)² + k has vertex (h, k). The
// printed equation is built from the drawn vertex, so the answer is exact.
// Formatting keeps "x^2" readable when h = 0 and drops k = 0.
function practiceVertex(rng: Rng): RawProblem {
    const h = rng.int(-5, 5);
    const k = rng.int(-5, 5);
    const square = h === 0 ? 'x^2' : h > 0 ? `(x - ${h})^2` : `(x + ${-h})^2`;
    const lift = k === 0 ? '' : k > 0 ? ` + ${k}` : ` - ${-k}`;
    return {
        prompt: `Practice: The parabola y = ${square}${lift} has vertex (__, __)`,
        answer: `${h}, ${k}`
    };
}

// The discriminant of a monic-or-not quadratic: Δ = b² − 4ac, computed from
// the drawn coefficients (integer by construction).
function practiceDiscriminant(rng: Rng): RawProblem {
    const a = rng.int(1, 3);
    const b = rng.int(-9, 9);
    const c = rng.int(-9, 9);
    return {
        prompt: `Practice: For y = ${polyText([a, b, c])}, the discriminant b^2 - 4ac = __`,
        answer: String(b * b - 4 * a * c)
    };
}

// Complete the square: y = x² + bx + c with (q, k) blanks. The item is built
// BACKWARDS from the square (x + q)² + k — expand to b = −2h, c = h² + k —
// so q = −h and k are exact integers (q is negative when h > 0, matching the
// printed "(x + q)^2" form). h is redrawn deterministically to stay nonzero
// (h = 0 makes the q blank degenerate).
function practiceCompleteSquare(rng: Rng): RawProblem {
    let h = rng.int(-5, 5);
    while (h === 0) h = rng.int(-5, 5);
    const k = rng.int(-6, 6);
    return {
        prompt: `Practice: Complete the square: y = ${polyText([1, -2 * h, h * h + k])} = (x + q)^2 + k. q = __ and k = __`,
        answer: `${-h}, ${k}`
    };
}

// Factorise a monic quadratic from its drawn integer roots. Two shapes:
// both roots positive → "(x - r)(x - __)", or one negative root → the printed
// factor is "(x + m)" and the missing one is "(x - n)". The printed quadratic
// is the exact expansion of the drawn factorisation.
function practiceFactorise(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['bothPositive', 'mixed'] as const);
    if (deck.take() === 'bothPositive') {
        const r1 = rng.int(1, 9);
        let r2 = rng.int(1, 9);
        while (r1 === r2) r2 = rng.int(1, 9);
        return {
            prompt: `Practice: ${polyText([1, -(r1 + r2), r1 * r2])} = (x - ${Math.min(r1, r2)})(x - __)`,
            answer: String(Math.max(r1, r2))
        };
    }
    const m = rng.int(1, 9);
    let n = rng.int(1, 9);
    while (n === m) n = rng.int(1, 9);
    // Roots are −m and n: (x + m)(x − n) = x² + (m − n)x − mn. The PRINTED
    // factor must be the actual drawn (x + m) — normalising to min/max would
    // print a factor that is not a factor of the printed quadratic.
    return {
        prompt: `Practice: ${polyText([1, m - n, -m * n])} = (x + ${m})(x - __)`,
        answer: String(n)
    };
}

// ── Challenge tier ───────────────────────────────────────────────────────────

// Solve x² + bx + c = 0 exactly: the equation is expanded from two drawn
// integer roots, answers printed ascending ("smaller, larger") so the key is
// one unambiguous string.
function challengeSolve(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['positive', 'mixed'] as const);
    let r1: number;
    let r2: number;
    if (deck.take() === 'positive') {
        r1 = rng.int(1, 9);
        r2 = rng.int(1, 9);
        while (r1 === r2) r2 = rng.int(1, 9);
    } else {
        // One negative, one positive root → answers straddle zero.
        r1 = -rng.int(1, 6);
        r2 = rng.int(1, 6);
    }
    const lo = Math.min(r1, r2);
    const hi = Math.max(r1, r2);
    return {
        prompt: `Challenge: Solve ${polyText([1, -(r1 + r2), r1 * r2])} = 0. x = __ or x = __ (smaller first)`,
        answer: `${lo}, ${hi}`
    };
}

// Double-root condition: x² + bx + k = 0 has Δ = 0 ⇔ k = b²/4. b is drawn
// as ±2, ±4, ±6, ±8 so k = b²/4 is a whole number (1, 4, 9 or 16).
function challengeDoubleRoot(rng: Rng): RawProblem {
    const b = 2 * rng.pick([1, 2, 3, 4] as const) * (rng.int(0, 1) === 0 ? 1 : -1);
    const k = (b * b) / 4;
    const bx = b > 0 ? ` + ${b}x` : ` - ${-b}x`;
    return {
        prompt: `Challenge: The equation x^2${bx} + k = 0 has exactly one (double) root. k = __`,
        answer: String(k)
    };
}

// ── Tier dispatch + page assembly (shared T4/T11 recipe) ────────────────────
function starterItem(rng: Rng): RawProblem {
    return createDeck(rng, ['evaluate', 'domain'] as const).take() === 'evaluate'
        ? starterEvaluate(rng)
        : starterDomain(rng);
}

function practiceItem(rng: Rng, rung: number): RawProblem {
    // The practice pool widens with the rung (Intro deals a subset — the
    // pool tuples above keep the Full rung's order identical to the legacy
    // deck, so rung 3 output is draw-for-draw the legacy Year-11 sheet).
    const deck = createDeck(rng, rung === 1 ? PRACTICE_INTRO : PRACTICE_FORMS);
    const form = deck.take();
    if (form === 'vertex') return practiceVertex(rng);
    if (form === 'discriminant') return practiceDiscriminant(rng);
    if (form === 'completing') return practiceCompleteSquare(rng);
    return practiceFactorise(rng);
}

function challengeItem(rng: Rng, rung: number): RawProblem {
    // The challenge pool exists only from Developing upward (Intro pages fill
    // with extra practice items instead — see the rung counts in
    // generateFunctions).
    const deck = createDeck(rng, rung === 3 ? CHALLENGE_FORMS : CHALLENGE_EASY);
    return deck.take() === 'solve'
        ? challengeSolve(rng)
        : challengeDoubleRoot(rng);
}

// Page-by-page scaffold→core→stretch assembly: each tier is sampled with its
// own sampleUnique call (distinct prompts within the tier) and the blocks are
// interleaved per page (Starter ×2, Practice ×4, Challenge ×2). The Intro
// rung swaps two Challenge slots for extra practice (2+6+0) so an
// introductory functions sheet stays a full 8-item page without any
// challenge-tier item.
function generateFunctions(rng: Rng, caps: Caps, count: number): RawProblem[] {
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

export const functionsSpec: WorksheetSpec = {
    id: 'functions',
    label: 'Functions & Quadratics',
    icon: 'ƒ',
    perPage: PER_PAGE,
    offered: (grade) => grade.available.includes('functions'),
    scope: () => 'evaluation, domain, discriminant, completing the square & roots',
    generate: generateFunctions
};

export function FunctionsWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(functionsSpec);
}
