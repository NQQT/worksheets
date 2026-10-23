// ─────────────────────────────────────────────────────────────────────────────
// POLYNOMIALS WORKSHEET — self-contained plugin (Year 11 senior expansion).
//
// SENIOR SCOPE (Year 11 polynomials strand — binomial products, cubic
// evaluation, remainder/factor theorems, difference of cubes, exact division;
// see readme.md "Year 11" for the boundary):
//   Starter   expanding (x ± a)(x ± b) with one missing coefficient, and
//             evaluating P(k) for a cubic.
//   Practice  the remainder theorem (P(k) as the remainder on division by
//             (x − k)), factor-theorem factor chains for cubics with three
//             integer roots, difference/sum of cubes, and (x ± m)^3 expansion.
//   Challenge finding the constant q that makes (x − r) a factor of
//             x^3 + px + q, and reading the missing quotient coefficient of
//             an exact (x − r) division.
//
// DELIBERATELY EXCLUDED: polynomials beyond degree 3, irreducible quadratics
// over the rationals, long division with a nonzero remainder, multiplicity
// language, and rational-root-theorem proofs.
//
// SCAFFOLDED LEARNING SEQUENCE: "Starter:/Practice:/Challenge:" prefixes,
// 2+4+2 per page (8 to a sheet, two columns).
//
// EXACT BY CONSTRUCTION (answers computed FROM the drawn values):
//   - factor-chain cubics are EXPANDED from three drawn integer roots, so the
//     printed cubic equals the printed factorisation identically (the factor
//     theorem holds by construction, never by rounding).
//   - remainder items evaluate the drawn polynomial at the drawn k (integer
//     arithmetic only).
//   - division items are built as dividend = (x − r) × (x² + qx + s), so the
//     missing quotient coefficient is the drawn q and the division is exact.
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
const PRACTICE_FORMS = ['remainder', 'factors', 'cubes', 'cubeexp'] as const;
// Intro practice: remainder evaluation + the factor-theorem chain — the cube
// special products (difference of cubes / cube expansion) wait.
const PRACTICE_INTRO = ['remainder', 'factors'] as const;
const CHALLENGE_FORMS = ['findq', 'division'] as const;
// Developing challenges: finding the unknown coefficient — exact (x − r)
// division waits for Full.
const CHALLENGE_EASY = ['findq'] as const;

const PER_PAGE = 8;
const S_COUNT = 2;
const P_COUNT = 4;
const C_COUNT = 2;

// Canonical polynomial text — duplicated per plugin self-containment (same
// contract as CalculusWorksheet / FunctionsWorksheet): descending powers,
// "x^3 - 9x^2 + 26x - 24", zero terms dropped, ±1 coefficients omitted.
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

// Expand (x − r1)(x − r2) with ONE blank: either the constant (both-positive
// shape) or the x-coefficient (mixed-sign shape, answer may be negative).
function starterExpandPair(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['constant', 'xcoef'] as const);
    if (deck.take() === 'constant') {
        const r1 = rng.int(1, 9);
        let r2 = rng.int(1, 9);
        while (r1 === r2) r2 = rng.int(1, 9);
        const lo = Math.min(r1, r2);
        const hi = Math.max(r1, r2);
        return {
            prompt: `Starter: (x - ${lo})(x - ${hi}) = x^2 - ${lo + hi}x + __`,
            answer: String(lo * hi)
        };
    }
    const m = rng.int(1, 9);
    let n = rng.int(1, 9);
    while (n === m) n = rng.int(1, 9);
    // (x + m)(x − n) = x² + (m − n)x − mn; the m < n case answers negative.
    const lo = Math.min(m, n);
    const hi = Math.max(m, n);
    return {
        prompt: `Starter: (x + ${lo})(x - ${hi}) = x^2 + __x - ${lo * hi}`,
        answer: String(lo - hi)
    };
}

// Evaluate a cubic at a small nonzero integer (integer arithmetic only).
function starterEvaluateCubic(rng: Rng): RawProblem {
    const a = rng.int(1, 3);
    const b = rng.int(-5, 5);
    const c = rng.int(-5, 5);
    const d = rng.int(-9, 9);
    let k = rng.int(-3, 3);
    while (k === 0) k = rng.int(-3, 3);
    return {
        prompt: `Starter: If P(x) = ${polyText([a, b, c, d])}, then P(${k}) = __`,
        answer: String(a * k ** 3 + b * k * k + c * k + d)
    };
}

// ── Practice tier ────────────────────────────────────────────────────────────

// Remainder theorem: the remainder on division by (x − k) equals P(k),
// evaluated exactly from the drawn coefficients.
function practiceRemainder(rng: Rng): RawProblem {
    const a = rng.int(1, 3);
    const b = rng.int(-5, 5);
    const c = rng.int(-5, 5);
    const d = rng.int(-9, 9);
    let k = rng.int(-3, 3);
    while (k === 0) k = rng.int(-3, 3);
    const divisor = k > 0 ? `(x - ${k})` : `(x + ${-k})`;
    return {
        prompt: `Practice: The remainder when P(x) = ${polyText([a, b, c, d])} is divided by ${divisor} is __`,
        answer: String(a * k ** 3 + b * k * k + c * k + d)
    };
}

// Factor theorem chains: the cubic IS the expansion of three drawn integer
// roots; two factors print, the third is the blank. The asked (third) root is
// always positive so its factor prints "(x - n)"; the mixed-sign shape puts
// the negative root first as "(x + m)".
function practiceFactorChain(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['allPositive', 'mixed'] as const);
    let roots: [number, number, number];
    if (deck.take() === 'allPositive') {
        const r1 = rng.int(1, 6);
        let r2 = rng.int(1, 6);
        let r3 = rng.int(1, 6);
        while (r2 === r1) r2 = rng.int(1, 6);
        while (r3 === r1 || r3 === r2) r3 = rng.int(1, 6);
        roots = [r1, r2, r3];
    } else {
        const m = rng.int(1, 6);
        let n = rng.int(1, 6);
        let p = rng.int(1, 6);
        while (n === m) n = rng.int(1, 6);
        while (p === m || p === n) p = rng.int(1, 6);
        roots = [-m, n, p];
    }
    const [f1, f2, answerRoot] = roots;
    // Expand (x − f1)(x − f2)(x − f3): x³ − ΣR x² + Σpair x − ΠR.
    const sum = f1 + f2 + answerRoot;
    const pair = f1 * f2 + f1 * answerRoot + f2 * answerRoot;
    const prod = f1 * f2 * answerRoot;
    const factor = (r: number) => (r > 0 ? `(x - ${r})` : `(x + ${-r})`);
    return {
        prompt: `Practice: ${polyText([1, -sum, pair, -prod])} = ${factor(f1)}${factor(f2)}(x - __)`,
        answer: String(answerRoot)
    };
}

// Difference/sum of cubes: x³ ∓ a³ = (x ∓ a)(x² ± ax + a²) with the middle
// coefficient blank. a ≤ 6 keeps a³ ≤ 216.
function practiceDiffCubes(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['difference', 'sum'] as const);
    const a = rng.int(2, 6);
    return deck.take() === 'difference'
        ? { prompt: `Practice: x^3 - ${a ** 3} = (x - ${a})(x^2 + __x + ${a ** 2})`, answer: String(a) }
        : { prompt: `Practice: x^3 + ${a ** 3} = (x + ${a})(x^2 - __x + ${a ** 2})`, answer: String(a) };
}

// Perfect cube expansion: (x ± m)³ = x³ ± 3mx² + 3m²x ∓ m³; the first three
// terms print via polyText (dropping the zero constant) and the constant is
// the blank (negative for the (x − m)³ shape).
function practiceCubeExpand(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['plus', 'minus'] as const);
    const m = rng.int(2, 6);
    const sgn = deck.take() === 'plus' ? 1 : -1;
    return {
        prompt: `Practice: (x ${sgn > 0 ? '+' : '-'} ${m})^3 = ${polyText([1, 3 * m * sgn, 3 * m * m, 0])} + __`,
        answer: String(sgn * m ** 3)
    };
}

// ── Challenge tier ───────────────────────────────────────────────────────────

// Missing constant for a factor: P(x) = x³ + px + q has (x − r) as a factor
// ⇔ P(r) = r³ + pr + q = 0 ⇔ q = −(r³ + pr) — exact integers.
function challengeFindQ(rng: Rng): RawProblem {
    const r = rng.int(1, 3);
    const p = rng.int(-6, 6);
    const q = -(r ** 3 + p * r);
    // The printed polynomial keeps the literal "q" (it is the unknown):
    // "x^3 + 5x + q", "x^3 - x + q" (±1 coefficients omitted), or "x^3 + q"
    // when p = 0.
    const px = p === 0
        ? 'x^3'
        : `x^3 ${p > 0 ? '+' : '-'} ${Math.abs(p) === 1 ? '' : Math.abs(p)}x`;
    return {
        prompt: `Challenge: P(x) = ${px} + q has (x - ${r}) as a factor. q = __`,
        answer: String(q)
    };
}

// Exact division: dividend = (x − r)(x² + qx + s) expands to integer
// coefficients; the printed dividend is that expansion and the missing
// quotient coefficient is the drawn q (kept positive so "+ __x" reads clean).
function challengeDivision(rng: Rng): RawProblem {
    const r = rng.int(1, 4);
    const q = rng.int(1, 5);
    const s = rng.int(-9, 9);
    // (x − r)(x² + qx + s) = x³ + (q − r)x² + (s − qr)x − sr.
    const dividend = polyText([1, q - r, s - q * r, -s * r]);
    const tail = s === 0 ? '' : s > 0 ? ` + ${s}` : ` - ${-s}`;
    return {
        prompt: `Challenge: (${dividend}) ÷ (x - ${r}) = x^2 + __x${tail}`,
        answer: String(q)
    };
}

// ── Tier dispatch + page assembly (shared T4/T11 recipe) ────────────────────
function starterItem(rng: Rng): RawProblem {
    return createDeck(rng, ['expand', 'evaluate'] as const).take() === 'expand'
        ? starterExpandPair(rng)
        : starterEvaluateCubic(rng);
}

function practiceItem(rng: Rng, rung: number): RawProblem {
    // The practice pool widens with the rung (Intro deals a subset — the
    // pool tuples above keep the Full rung's order identical to the legacy
    // deck, so rung 3 output is draw-for-draw the legacy Year-11 sheet).
    const deck = createDeck(rng, rung === 1 ? PRACTICE_INTRO : PRACTICE_FORMS);
    const form = deck.take();
    if (form === 'remainder') return practiceRemainder(rng);
    if (form === 'factors') return practiceFactorChain(rng);
    if (form === 'cubes') return practiceDiffCubes(rng);
    return practiceCubeExpand(rng);
}

function challengeItem(rng: Rng, rung: number): RawProblem {
    // The challenge pool exists only from Developing upward (Intro pages fill
    // with extra practice items instead — see the rung counts in
    // generatePolynomials).
    const deck = createDeck(rng, rung === 3 ? CHALLENGE_FORMS : CHALLENGE_EASY);
    return deck.take() === 'findq'
        ? challengeFindQ(rng)
        : challengeDivision(rng);
}

// Page-by-page scaffold→core→stretch assembly: each tier is sampled with its
// own sampleUnique call (distinct prompts within the tier) and the blocks are
// interleaved per page (Starter ×2, Practice ×4, Challenge ×2).
// Page-by-page scaffold→core→stretch assembly: each tier is sampled with its
// own sampleUnique call (distinct prompts within the tier) and the blocks are
// interleaved per page (Starter ×2, Practice ×4, Challenge ×2). The Intro
// rung swaps two Challenge slots for extra practice (2+6+0) so an
// introductory polynomials sheet stays a full 8-item page without any
// challenge-tier item.
function generatePolynomials(rng: Rng, caps: Caps, count: number): RawProblem[] {
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

export const polynomialsSpec: WorksheetSpec = {
    id: 'polynomials',
    label: 'Polynomials',
    icon: 'x³',
    perPage: PER_PAGE,
    offered: (grade) => grade.available.includes('polynomials'),
    scope: () => 'expansion, remainder & factor theorems, cubes & exact division',
    generate: generatePolynomials
};

export function PolynomialsWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(polynomialsSpec);
}
