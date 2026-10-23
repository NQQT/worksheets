// ─────────────────────────────────────────────────────────────────────────────
// PROBABILITY (YEAR 11) WORKSHEET — self-contained plugin (senior expansion).
//
// SENIOR SCOPE (Year 11 probability strand — the Methods Units 1–2 / Advanced
// Y11 probability slice; see readme.md "Year 11" for the boundary):
//   Starter   the complement rule and mutually exclusive addition, plus a
//             from-counts probability in simplest form.
//   Practice  the general addition rule P(A ∪ B) = P(A) + P(B) − P(A ∩ B),
//             conditional probability from a sub-group count, the
//             independence test P(A ∩ B) =? P(A)P(B), and probabilities from
//             a simple discrete frequency table.
//   Challenge the expected value E(X) of a discrete random variable over a
//             tenths-probability table, and the multiplication rule
//             P(A ∩ B) = P(A) · P(B | A) in exact fractions.
//
// This is a SEPARATE plugin from the Years 3–6 'probability' strand: the id
// ('prob11') and availability key are unique, and the generator works in
// exact tenths/fractions instead of chance words.
//
// DELIBERATELY EXCLUDED: permutations/combinations and counting techniques,
// two-step experiments with replacement decisions, conditional probability
// with Bayes-style reversals, and continuous distributions (Year 12 work).
//
// SCAFFOLDED LEARNING SEQUENCE: "Starter:/Practice:/Challenge:" prefixes,
// 2+4+2 per page (8 to a sheet, two columns).
//
// EXACT BY CONSTRUCTION (no float arithmetic anywhere):
//   - all decimal probabilities are integer TENTHS (0.3 = 3/10), so sums,
//     differences and E(X) = (p1 + 2·p2)/10 are exact tenths, printed with
//     one decimal place.
//   - independence items use PERCENT integers (10..90 multiples of 10) so
//     P(A)P(B) = a·b/100 is an exact integer percent.
//   - fraction answers (P(B|A), P(A ∩ B), table probabilities) are reduced
//     with Euclid's gcd, so the printed counts and the reduced answer are
//     two views of one exact ratio.
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
const PRACTICE_FORMS = ['addition', 'conditional', 'independence', 'table'] as const;
// Intro practice: the addition rule and discrete-table reading — conditional
// probability and independence reasoning wait.
const PRACTICE_INTRO = ['addition', 'table'] as const;
const CHALLENGE_FORMS = ['expected', 'mult'] as const;
// Developing challenges: expected value — the multiplication rule waits for
// Full.
const CHALLENGE_EASY = ['expected'] as const;

const PER_PAGE = 8;
const S_COUNT = 2;
const P_COUNT = 4;
const C_COUNT = 2;

// Euclid's gcd — exact fraction reduction (same helper pattern as the
// Years 3–6 ProbabilityWorksheet; duplicated per plugin self-containment).
function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

// Integer tenths → canonical one-decimal string ("0.3", "1.0"). Every decimal
// probability in this plugin passes through here, so preview, key and tests
// share one formatting rule.
function tenth(n: number): string {
    return (n / 10).toFixed(1);
}

// ── Starter tier ─────────────────────────────────────────────────────────────

// Mutually exclusive addition: P(A ∪ B) = P(A) + P(B) for disjoint events
// (the drawn tenths always sum ≤ 1).
function starterDisjointAdd(rng: Rng): RawProblem {
    const pa = rng.int(1, 9);
    const pb = rng.int(1, 10 - pa);
    return {
        prompt: `Starter: P(A) = ${tenth(pa)}, P(B) = ${tenth(pb)} and A and B are mutually exclusive. P(A or B) = __`,
        answer: tenth(pa + pb)
    };
}

// Complement rule P(not A) = 1 − P(A), or a from-counts probability in
// simplest form (the drawn counts and the reduced answer are the same ratio).
function starterComplement(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['complement', 'counts'] as const);
    if (deck.take() === 'complement') {
        const pa = rng.int(1, 9);
        return { prompt: `Starter: P(A) = ${tenth(pa)}. P(not A) = __`, answer: tenth(10 - pa) };
    }
    const red = rng.int(2, 8);
    const blue = rng.int(2, 8);
    const g = gcd(red, red + blue);
    return {
        prompt: `Starter: A spinner lands red ${red} times and blue ${blue} times. P(red) in simplest form is __`,
        answer: `${red / g}/${(red + blue) / g}`
    };
}

// ── Practice tier ────────────────────────────────────────────────────────────

// General addition rule with an overlap: P(A ∪ B) = P(A) + P(B) − P(A ∩ B),
// all drawn tenths. The overlap both satisfies both ≤ min(P(A), P(B)) AND
// keeps the union ≤ 1 (both ≥ P(A) + P(B) − 10); that interval is never
// empty because the drawn pair never exceeds 9 + 9.
function practiceAdditionRule(rng: Rng): RawProblem {
    const pa = rng.int(2, 9);
    const pb = rng.int(2, 9);
    const lo = Math.max(1, pa + pb - 10);
    const both = rng.int(lo, Math.min(pa, pb));
    return {
        prompt: `Practice: P(A) = ${tenth(pa)}, P(B) = ${tenth(pb)} and P(A and B) = ${tenth(both)}. P(A or B) = __`,
        answer: tenth(pa + pb - both)
    };
}

// Conditional probability from a sub-group count: P(Year 11 | plays sport)
// = K/S reduced — the condition shrinks the sample space to the drawn S.
function practiceConditional(rng: Rng): RawProblem {
    const s = rng.int(12, 30);
    const k = rng.int(1, s - 1);
    const g = gcd(k, s);
    return {
        prompt: `Practice: Of the ${s} students who play sport, ${k} are in Year 11. One sport player is chosen at random. P(Year 11) = __`,
        answer: `${k / g}/${s / g}`
    };
}

// Independence test in integer percents: P(A ∩ B) is BUILT as either the
// exact product a·b/100 (independent) or the product shifted by ±10 points
// (not independent, still inside 0..100). The answer is derived by comparing
// the printed numbers, never asserted.
function practiceIndependence(rng: Rng): RawProblem {
    const a = 10 * rng.int(1, 9);
    const b = 10 * rng.int(1, 9);
    const product = (a * b) / 100; // exact integer percent (multiples of 10)
    const independent = rng.int(0, 1) === 0;
    let both = product;
    if (!independent) {
        // Shift by ±10 but keep the percent a valid probability (0..100).
        both = product + (product <= 50 ? 10 : -10);
    }
    return {
        prompt: `Practice: P(A) = ${a}%, P(B) = ${b}% and P(A and B) = ${both}%. Are A and B independent? (yes/no) __`,
        answer: independent ? 'Yes' : 'No'
    };
}

// Discrete frequency table: pets per household. The asked probability
// (exactly one / at least one) is the exact count ratio over the total,
// reduced.
function practicePetTable(rng: Rng): RawProblem {
    const n0 = rng.int(2, 10);
    const n1 = rng.int(2, 10);
    const n2 = rng.int(2, 10);
    const total = n0 + n1 + n2;
    const deck = createDeck(rng, ['exactlyOne', 'atLeastOne'] as const);
    const ask = deck.take();
    const count = ask === 'exactlyOne' ? n1 : n1 + n2;
    const g = gcd(count, total);
    return {
        prompt: `Practice: Pets in a street: ${n0} homes have none, ${n1} have one and ${n2} have two. One home is chosen. P(${ask === 'exactlyOne' ? 'exactly one pet' : 'at least one pet'}) = __`,
        answer: `${count / g}/${total / g}`
    };
}

// ── Challenge tier ───────────────────────────────────────────────────────────

// Expected value of a discrete random variable over a tenths table that sums
// to one: E(X) = 0·p0 + 1·p1 + 2·p2 = (p1 + 2·p2)/10 — exact tenths. A deck
// variant asks the table-completion complement P(X ≥ 1) instead.
function challengeExpectedValue(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['ex', 'atleast'] as const);
    const p2 = rng.int(1, 8);
    const p1 = rng.int(1, 10 - p2 - 1);
    const p0 = 10 - p1 - p2; // the table always sums to exactly 1
    if (deck.take() === 'atleast') {
        const g = gcd(p1 + p2, 10);
        return {
            prompt: `Challenge: A random variable X has P(X = 0) = ${tenth(p0)}, P(X = 1) = ${tenth(p1)} and P(X = 2) = ${tenth(p2)}. P(X ≥ 1) = __`,
            answer: `${(p1 + p2) / g}/${10 / g}`
        };
    }
    return {
        prompt: `Challenge: A random variable X has P(X = 0) = ${tenth(p0)}, P(X = 1) = ${tenth(p1)} and P(X = 2) = ${tenth(p2)}. E(X) = __`,
        answer: tenth(p1 + 2 * p2)
    };
}

// Multiplication rule in exact fractions: P(A ∩ B) = P(A) · P(B | A) = ac/bd,
// reduced — the two drawn factors multiply exactly.
function challengeMultRule(rng: Rng): RawProblem {
    const b = rng.int(2, 5);
    const a = rng.int(1, b - 1);
    const d = rng.int(2, 4);
    const c = rng.int(1, d - 1);
    const num = a * c;
    const den = b * d;
    const g = gcd(num, den);
    return {
        prompt: `Challenge: P(A) = ${a}/${b} and P(B | A) = ${c}/${d}. P(A and B) = __`,
        answer: `${num / g}/${den / g}`
    };
}

// ── Tier dispatch + page assembly (shared T4/T11 recipe) ────────────────────
function starterItem(rng: Rng): RawProblem {
    return createDeck(rng, ['add', 'complement'] as const).take() === 'add'
        ? starterDisjointAdd(rng)
        : starterComplement(rng);
}

function practiceItem(rng: Rng, rung: number): RawProblem {
    // The practice pool widens with the rung (Intro deals a subset — the
    // pool tuples above keep the Full rung's order identical to the legacy
    // deck, so rung 3 output is draw-for-draw the legacy Year-11 sheet).
    const deck = createDeck(rng, rung === 1 ? PRACTICE_INTRO : PRACTICE_FORMS);
    const form = deck.take();
    if (form === 'addition') return practiceAdditionRule(rng);
    if (form === 'conditional') return practiceConditional(rng);
    if (form === 'independence') return practiceIndependence(rng);
    return practicePetTable(rng);
}

function challengeItem(rng: Rng, rung: number): RawProblem {
    // The challenge pool exists only from Developing upward (Intro pages fill
    // with extra practice items instead — see the rung counts in
    // generateProb11).
    const deck = createDeck(rng, rung === 3 ? CHALLENGE_FORMS : CHALLENGE_EASY);
    return deck.take() === 'expected'
        ? challengeExpectedValue(rng)
        : challengeMultRule(rng);
}

// Page-by-page scaffold→core→stretch assembly: each tier is sampled with its
// own sampleUnique call (distinct prompts within the tier) and the blocks are
// interleaved per page (Starter ×2, Practice ×4, Challenge ×2). The Intro
// rung swaps two Challenge slots for extra practice (2+6+0) so an
// introductory probability sheet stays a full 8-item page without any
// challenge-tier item.
function generateProb11(rng: Rng, caps: Caps, count: number): RawProblem[] {
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

export const prob11Spec: WorksheetSpec = {
    id: 'prob11',
    label: 'Probability',
    icon: '𝑃',
    perPage: PER_PAGE,
    offered: (grade) => grade.available.includes('prob11'),
    scope: () => 'addition & conditional rules, independence, tables & E(X)',
    generate: generateProb11
};

export function Prob11Worksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(prob11Spec);
}
