// ─────────────────────────────────────────────────────────────────────────────
// EXPONENTIALS & LOGARITHMS WORKSHEET — self-contained plugin (Year 11 senior
// expansion).
//
// SENIOR SCOPE (Year 11 index/log strand — index laws, negative & fractional
// indices, exponential functions and their inverse logs; see readme.md
// "Year 11" for the boundary):
//   Starter   index laws for products and powers of powers, and evaluating
//             positive and negative integer powers.
//   Practice  evaluating logarithms, solving b^x = v by inspection, solving
//             log_b x = e, and index laws with negative exponents and
//             quotients.
//   Challenge fractional indices a^(n/d) on perfect d-th-power bases, and
//             log-law sums/differences collapsed to one log.
//
// DELIBERATELY EXCLUDED: e and natural logs, log laws with arbitrary bases
// (change-of-base), exponential modelling/growth-decay worded contexts,
// logarithmic graphs, and equations requiring log algebra on both sides
// (typically Year 12).
//
// SCAFFOLDED LEARNING SEQUENCE: "Starter:/Practice:/Challenge:" prefixes,
// 2+4+2 per page (8 to a sheet, two columns).
//
// EXACT BY CONSTRUCTION: every value is a drawn base/exponent pair evaluated
// in integers (largest printed value 10^3), and every log/exponential answer
// is the drawn exponent itself — no decimal logs, no rounding. Fractional
// indices are built as base = m^d so a^(n/d) = m^n exactly.
//
// NOTATION: caret powers ("2^5", "3^x"), negative powers as "5^-2", logs as
// "log_2 32" (underscore subscript, plain-text printable), fractional indices
// as "16^(3/4)".
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
const PRACTICE_FORMS = ['logeval', 'expeq', 'logeq', 'indexmix'] as const;
// Intro practice: log/exponential evaluation and simple exponential
// equations — log equations and mixed-index manipulation wait.
const PRACTICE_INTRO = ['logeval', 'expeq'] as const;
const CHALLENGE_FORMS = ['fractional', 'loglaws'] as const;
// Developing challenges: fractional indices — the log-law manipulations wait
// for Full.
const CHALLENGE_EASY = ['fractional'] as const;

const PER_PAGE = 8;
const S_COUNT = 2;
const P_COUNT = 4;
const C_COUNT = 2;

// Bases used across the strand: small integer bases keep every printed value
// a clean integer (the set {2, 3, 4, 5, 6, 10}; the largest printed value is
// 10^3 = 1000 in the practice items).
const LOG_BASES = [2, 3, 4, 5, 6, 10] as const;

// Exponent ceiling per base so b^e stays ≤ 1000 (largest drawn value 10^3);
// smaller bases earn a longer exponent range this way.
function maxExponent(b: number): number {
    if (b === 2) return 5;      // 2^5 = 32
    if (b === 3) return 4;      // 3^4 = 81
    return 3;                   // 4^3 = 64, 5^3 = 125, 6^3 = 216, 10^3 = 1000
}

// ── Starter tier ─────────────────────────────────────────────────────────────

// Index laws: b^m × b^n = b^(m+n) and (b^m)^k = b^(mk); the answer is the
// drawn exponent sum/product (law applied, not evaluated).
function starterIndexLaws(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['product', 'power'] as const);
    const b = rng.int(2, 6);
    if (deck.take() === 'product') {
        const m = rng.int(1, 5);
        const n = rng.int(1, 5);
        return { prompt: `Starter: ${b}^${m} × ${b}^${n} = ${b}^__`, answer: String(m + n) };
    }
    const m = rng.int(2, 4);
    const k = rng.int(2, 3);
    return { prompt: `Starter: (${b}^${m})^${k} = ${b}^__`, answer: String(m * k) };
}

// Evaluating powers: positive exponent → the integer value; negative exponent
// → the unit fraction "1/b^e" (never a decimal).
function starterEvalPower(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['positive', 'negative'] as const);
    const b = rng.int(2, 5);
    if (deck.take() === 'positive') {
        const e = rng.int(2, 4);
        return { prompt: `Starter: ${b}^${e} = __`, answer: String(b ** e) };
    }
    const e = rng.int(1, 3);
    return { prompt: `Starter: ${b}^-${e} = __`, answer: `1/${b ** e}` };
}

// ── Practice tier ────────────────────────────────────────────────────────────

// Evaluate log_b(v) where v = b^e: the answer is the drawn exponent.
function practiceLogEval(rng: Rng): RawProblem {
    const b = rng.pick(LOG_BASES);
    const e = rng.int(2, maxExponent(b));
    return { prompt: `Practice: log_${b} ${b ** e} = __`, answer: String(e) };
}

// Solve b^x = v by inspection: v is built as b^x, so x is exact.
function practiceExpEquation(rng: Rng): RawProblem {
    const b = rng.pick(LOG_BASES);
    const x = rng.int(2, maxExponent(b));
    return { prompt: `Practice: Solve ${b}^x = ${b ** x}. x = __`, answer: String(x) };
}

// Inverse direction: log_b x = e ⇒ x = b^e (exact integer).
function practiceLogEquation(rng: Rng): RawProblem {
    const b = rng.pick(LOG_BASES);
    const e = rng.int(2, maxExponent(b));
    return { prompt: `Practice: If log_${b} x = ${e}, then x = __`, answer: String(b ** e) };
}

// Index laws with negative exponents: quotients b^m ÷ b^n and products where
// one exponent is negative; the answer is the drawn exponent result and MAY
// be zero or negative ("3^-2 × 3^5 = 3^3"; "5^4 ÷ 5^6 = 5^-2").
function practiceIndexMix(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['quotient', 'negativeProduct'] as const);
    const b = rng.int(2, 6);
    if (deck.take() === 'quotient') {
        const m = rng.int(4, 7);
        const n = rng.int(1, 3);
        return { prompt: `Practice: ${b}^${m} ÷ ${b}^${n} = ${b}^__`, answer: String(m - n) };
    }
    const a = -rng.int(1, 3);
    const c = rng.int(1, 5);
    return { prompt: `Practice: ${b}^${a} × ${b}^${c} = ${b}^__`, answer: String(a + c) };
}

// ── Challenge tier ───────────────────────────────────────────────────────────

// Fractional index: base is BUILT as m^d, so base^(n/d) = m^n exactly
// (16^(3/4) = 2^3 = 8). The n/d pair is drawn already in lowest terms — an
// unreduced "625^(2/4)" would read as incomplete working. Answers stay
// ≤ 6^3 = 216 (the d = 2/3 shapes draw m up to 6; the d = 4 shape draws
// m up to 5, so 5^3 = 125 there).
function challengeFractionalIndex(rng: Rng): RawProblem {
    const [n, d] = rng.pick([[2, 3], [3, 2], [3, 4]] as const);
    const m = d === 4 ? rng.int(2, 5) : rng.int(2, 6);
    return { prompt: `Challenge: ${m ** d}^(${n}/${d}) = __`, answer: String(m ** n) };
}

// Log laws: log_b(u) ± log_b(w) collapses to one log — the answer is the
// drawn exponent result (e1 + e2 for the sum law, e1 − e2 ≥ 1 for the
// difference law), exactly the exponent of the combined value.
function challengeLogLaws(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['sum', 'difference'] as const);
    const b = rng.pick([2, 3, 5] as const);
    if (deck.take() === 'sum') {
        const e1 = rng.int(1, 3);
        const e2 = rng.int(1, 3);
        return {
            prompt: `Challenge: log_${b} ${b ** e1} + log_${b} ${b ** e2} = __`,
            answer: String(e1 + e2)
        };
    }
    const e1 = rng.int(3, 5);
    const e2 = rng.int(1, 2);
    return {
        prompt: `Challenge: log_${b} ${b ** e1} - log_${b} ${b ** e2} = __`,
        answer: String(e1 - e2)
    };
}

// ── Tier dispatch + page assembly (shared T4/T11 recipe) ────────────────────
function starterItem(rng: Rng): RawProblem {
    return createDeck(rng, ['laws', 'evaluate'] as const).take() === 'laws'
        ? starterIndexLaws(rng)
        : starterEvalPower(rng);
}

function practiceItem(rng: Rng, rung: number): RawProblem {
    // The practice pool widens with the rung (Intro deals a subset — the
    // pool tuples above keep the Full rung's order identical to the legacy
    // deck, so rung 3 output is draw-for-draw the legacy Year-11 sheet).
    const deck = createDeck(rng, rung === 1 ? PRACTICE_INTRO : PRACTICE_FORMS);
    const form = deck.take();
    if (form === 'logeval') return practiceLogEval(rng);
    if (form === 'expeq') return practiceExpEquation(rng);
    if (form === 'logeq') return practiceLogEquation(rng);
    return practiceIndexMix(rng);
}

function challengeItem(rng: Rng, rung: number): RawProblem {
    // The challenge pool exists only from Developing upward (Intro pages fill
    // with extra practice items instead — see the rung counts in
    // generateExpoLog).
    const deck = createDeck(rng, rung === 3 ? CHALLENGE_FORMS : CHALLENGE_EASY);
    return deck.take() === 'fractional'
        ? challengeFractionalIndex(rng)
        : challengeLogLaws(rng);
}

// Page-by-page scaffold→core→stretch assembly: each tier is sampled with its
// own sampleUnique call (distinct prompts within the tier) and the blocks are
// interleaved per page (Starter ×2, Practice ×4, Challenge ×2). The Intro
// rung swaps two Challenge slots for extra practice (2+6+0) so an
// introductory index/log sheet stays a full 8-item page without any
// challenge-tier item.
function generateExpoLog(rng: Rng, caps: Caps, count: number): RawProblem[] {
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

export const expoLogSpec: WorksheetSpec = {
    id: 'expolog',
    label: 'Exponentials & Logarithms',
    icon: '㏒',
    perPage: PER_PAGE,
    offered: (grade) => grade.available.includes('expolog'),
    scope: () => 'index laws, fractional indices, logs & exponential equations',
    generate: generateExpoLog
};

export function ExpoLogWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(expoLogSpec);
}
