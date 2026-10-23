// ─────────────────────────────────────────────────────────────────────────────
// PERCENTAGES WORKSHEET — a self-contained dashboard plugin (T4 expansion).
//
// YEAR-TIERED STRAND (Australian Curriculum v9-informed, codes in readme.md):
//   Year 5  percentages as "out of 100" linked to fraction/decimal
//           benchmarks 50% = 1/2, 25% = 1/4, 10% = 1/10 (AC9M5N04).
//   Year 6  calculating a percentage of a quantity and applying discounts,
//           including the 5% and 75% benchmarks (AC9M6N07).
//
// SCAFFOLDED LEARNING SEQUENCE (R4): printed "Starter:/Practice:/Challenge:"
// tier prefixes, 3+4+3 per page (see plugins/FractionsWorksheet.ts).
//
// INTEGER-EXACT BY CONSTRUCTION: every "x% of N" problem is BUILT from the
// answer backwards — the base N is drawn as a multiple that makes x% of N an
// integer (50% → even, 25% → multiple of 4, 10% → multiple of 10, 20% →
// multiple of 5, 5% → multiple of 20, 75% → multiple of 4). No problem can
// ever print a ragged decimal answer, and the model answer is one integer.
//
// Offered Years 5-6 only (the catalogue's `available` list gates it).
// Self-contained: delete file + index line to remove the worksheet.
// ─────────────────────────────────────────────────────────────────────────────

import type { Caps, DashboardFramework, DashboardPlugin, GradeConfig, RawProblem, Rng, WorksheetSpec } from '../../framework';
import { createDeck, sampleUnique } from '../../framework';

// Ten percentage tasks per A4, two columns (five grid rows).
const PER_PAGE = 10;
const S_COUNT = 3;
const P_COUNT = 4;
const C_COUNT = 3;

// ── Year 5 (AC9M5N04): benchmark percentages & fraction/decimal links ───────
// Draw a benchmark and a base that makes its percentage exact:
//   50% of 10k = 5k | 25% of 4m = m | 10% of 10k = k.
function drawBenchmarkY5(rng: Rng): { pct: number; base: number; part: number } {
    const pct = rng.pick([50, 25, 10] as const);
    if (pct === 50) {
        const k = rng.int(2, 9);
        return { pct, base: 10 * k, part: 5 * k };
    }
    if (pct === 25) {
        const m = rng.int(2, 9);
        return { pct, base: 4 * m, part: m };
    }
    const k = rng.int(2, 9);
    return { pct, base: 10 * k, part: k };
}

// Exact benchmark conversions used by the link families (own wording).
const Y5_LINKS: readonly { from: string; pct: number }[] = [
    { from: '0.5', pct: 50 }, { from: '0.25', pct: 25 }, { from: '0.1', pct: 10 },
    { from: '0.75', pct: 75 }, { from: '0.3', pct: 30 }, { from: '0.6', pct: 60 },
    { from: '1/2', pct: 50 }, { from: '1/4', pct: 25 }, { from: '3/4', pct: 75 },
    { from: '1/10', pct: 10 }, { from: '3/10', pct: 30 }, { from: '1/5', pct: 20 },
    { from: '2/5', pct: 40 }, { from: '3/5', pct: 60 }, { from: '4/5', pct: 80 }
];

function starterY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['pof', 'outof'] as const);
    const form = deck.take();
    const { pct, base, part } = drawBenchmarkY5(rng);
    if (form === 'pof') {
        return { prompt: `Starter: ${pct}% of ${base} = __`, answer: String(part) };
    }
    // "out of 100" meaning: 50% = __/2, 25% = __/4, 10% = __/100.
    if (pct === 50) return { prompt: `Starter: 50% = __/2`, answer: '1' };
    if (pct === 25) return { prompt: `Starter: 25% = __/4`, answer: '1' };
    return { prompt: `Starter: 10% = __/100`, answer: '10' };
}

function practiceY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['whatpct', 'link'] as const);
    const form = deck.take();
    if (form === 'whatpct') {
        // Reverse the benchmark: "What % of base is part?" → pct.
        const { pct, base, part } = drawBenchmarkY5(rng);
        return { prompt: `Practice: What % of ${base} is ${part}? __`, answer: String(pct) };
    }
    const link = rng.pick(Y5_LINKS);
    return { prompt: `Practice: ${link.from} as a %: __`, answer: String(link.pct) };
}

function challengeY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['chain', 'half'] as const);
    const form = deck.take();
    if (form === 'chain') {
        // Double the benchmark: 10% of 10k = k, so 20% of 10k = 2k.
        const k = rng.int(2, 9);
        return {
            prompt: `Challenge: 10% of ${10 * k} is __, so 20% of ${10 * k} is __`,
            answer: `${k}, ${2 * k}`
        };
    }
    // Halving a benchmark percentage.
    const pct = rng.pick([50, 20] as const);
    return { prompt: `Challenge: Half of ${pct}% is __%`, answer: String(pct / 2) };
}

// ── Year 6 (AC9M6N07): percentages of quantities & discounts ────────────────
// Draw a Year-6 benchmark with an exact base:
//   20% of 5m = m | 5% of 20m = m | 75% of 4m = 3m | 10% of 10k = k.
function drawBenchmarkY6(rng: Rng): { pct: number; base: number; part: number } {
    const pct = rng.pick([20, 5, 75, 10] as const);
    if (pct === 20) {
        const m = rng.int(6, 40);
        return { pct, base: 5 * m, part: m };
    }
    if (pct === 5) {
        const m = rng.int(3, 12);
        return { pct, base: 20 * m, part: m };
    }
    if (pct === 75) {
        const m = rng.int(5, 25);
        return { pct, base: 4 * m, part: 3 * m };
    }
    const k = rng.int(5, 20);
    return { pct, base: 10 * k, part: k };
}

// Discount prices are drawn so the percent-off is whole-dollar exact.
function drawDiscount(rng: Rng): { pct: number; price: number; pay: number } {
    const pct = rng.pick([10, 25, 50] as const);
    if (pct === 10) {
        const k = rng.int(2, 10); // $20..$100
        return { pct, price: 10 * k, pay: 9 * k };
    }
    if (pct === 25) {
        const m = rng.int(5, 25); // $20..$100
        return { pct, price: 4 * m, pay: 3 * m };
    }
    const h = rng.int(5, 50); // $10..$100 even
    return { pct, price: 2 * h, pay: h };
}

function starterY6(rng: Rng): RawProblem {
    const { pct, base, part } = drawBenchmarkY6(rng);
    return { prompt: `Starter: ${pct}% of ${base} = __`, answer: String(part) };
}

function practiceY6(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['discount', 'conv'] as const);
    const form = deck.take();
    if (form === 'discount') {
        const { pct, price, pay } = drawDiscount(rng);
        return { prompt: `Practice: A $${price} book is ${pct}% off. You pay $__`, answer: `$${pay}` };
    }
    // Decimal/fraction → % and % → "out of 100" (Y6 widens the Y5 links).
    if (rng.next() < 0.5) {
        const link = rng.pick(Y5_LINKS);
        return { prompt: `Practice: ${link.from} as a %: __`, answer: String(link.pct) };
    }
    const pct = rng.pick([20, 40, 60, 80] as const);
    return { prompt: `Practice: ${pct}% = __/100`, answer: String(pct) };
}

function challengeY6(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['findpct', 'pof5'] as const);
    const form = deck.take();
    if (form === 'findpct') {
        // Find the discount percent from the saved amount (reverse work).
        const { pct, price, pay } = drawDiscount(rng);
        return {
            prompt: `Challenge: You save $${price - pay} on a $${price} jacket. The discount is __%`,
            answer: String(pct)
        };
    }
    // The 5% benchmark on a larger base.
    const m = rng.int(3, 12);
    return { prompt: `Challenge: 5% of ${20 * m} = __`, answer: String(m) };
}

function tierItem(rng: Rng, caps: Caps, tier: 'starter' | 'practice' | 'challenge'): RawProblem {
    const y6 = caps.yearLevel === 6;
    if (tier === 'starter') return y6 ? starterY6(rng) : starterY5(rng);
    if (tier === 'practice') return y6 ? practiceY6(rng) : practiceY5(rng);
    return y6 ? challengeY6(rng) : challengeY5(rng);
}

// Page-by-page scaffold→core→stretch assembly (shared T4 rationale).
function generatePercent(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const pages = Math.ceil(count / PER_PAGE);
    const starter = sampleUnique(pages * S_COUNT, () => tierItem(rng, caps, 'starter'), (p) => p.prompt);
    const practice = sampleUnique(pages * P_COUNT, () => tierItem(rng, caps, 'practice'), (p) => p.prompt);
    const challenge = sampleUnique(pages * C_COUNT, () => tierItem(rng, caps, 'challenge'), (p) => p.prompt);
    const out: RawProblem[] = [];
    for (let pg = 0; pg < pages; pg++) {
        out.push(
            ...starter.slice(pg * S_COUNT, pg * S_COUNT + S_COUNT),
            ...practice.slice(pg * P_COUNT, pg * P_COUNT + P_COUNT),
            ...challenge.slice(pg * C_COUNT, pg * C_COUNT + C_COUNT)
        );
    }
    return out.slice(0, count);
}

export const percentSpec: WorksheetSpec = {
    id: 'percent',
    label: 'Percentages',
    icon: '%',
    perPage: PER_PAGE,
    offered: (grade: GradeConfig) => grade.available.includes('percent'),
    scope: (grade: GradeConfig) =>
        grade.caps.yearLevel === 5
            ? 'benchmark % & fraction/decimal links (AC9M5N04)'
            : '% of quantities & discounts (AC9M6N07)',
    generate: generatePercent
};

export function PercentWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(percentSpec);
}
