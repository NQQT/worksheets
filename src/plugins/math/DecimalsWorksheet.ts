// ─────────────────────────────────────────────────────────────────────────────
// DECIMALS WORKSHEET — a self-contained dashboard plugin (T4 expansion).
//
// YEAR-TIERED STRAND (Australian Curriculum v9-informed, codes in readme.md):
//   Year 4  decimals tenths & hundredths — place value, fraction↔decimal
//           links, comparison, friendly +/− and money (AC9M4N01, N03).
//   Year 5  decimals beyond two places — thousandths, place value, rounding
//           to whole/one place, estimation links (AC9M5N01, N08).
//   Year 6  +/− decimals to thousandths and ×/÷ by powers of ten, with
//           efficient decimal products (AC9M6N05-06).
//
// SCAFFOLDED LEARNING SEQUENCE (R4): printed tier prefixes — "Starter:"
// (scaffold), "Practice:" (core), "Challenge:" (stretch/reasoning) — 3+4+3
// per page on this 10-per-page two-column sheet (the compact decimal
// sentences stay within three wrapped 22px lines; see
// plugins/layout-capacity.test.ts).
//
// EXACT ARITHMETIC: every decimal is carried as a SCALE INTEGER (0.35 = 35 at
// place 2) and formatted only at print time, so no float rounding can ever
// touch a prompt or an answer. Rounding uses integer division on the scale
// value. Displayed decimals are written at the exact place count the problem
// needs (4.70 never appears as "4.7" unless the problem is a 1-place one).
//
// Difficulty comes from caps.decPlaces (0 = not offered; 2 = Y4; 3 = Y5/Y6)
// and caps.yearLevel. Self-contained: delete file + index line to remove.
// ─────────────────────────────────────────────────────────────────────────────

import type { Caps, DashboardFramework, DashboardPlugin, GradeConfig, RawProblem, Rng, WorksheetSpec } from '../../framework';
import { createDeck, sampleUnique } from '../../framework';

// Ten compact decimal tasks per A4, two columns (five grid rows).
const PER_PAGE = 10;
const S_COUNT = 3;
const P_COUNT = 4;
const C_COUNT = 3;

// Format a scale integer at `places` decimals. places <= 0 multiplies up
// (47 at place 1 × 10 => "47"). Exact string — no float ever involved.
function fmt(v: number, places: number): string {
    if (places <= 0) return String(v * 10 ** -places);
    const s = String(v).padStart(places + 1, '0');
    return `${s.slice(0, -places)}.${s.slice(-places)}`;
}

// Shortest exact display for comparison items: trims trailing zeros
// (40 at place 2 => "0.4", 100 at place 2 => "1") while staying exact.
function fmtTrim(v: number, places: number): string {
    let val = v;
    let p = places;
    while (p > 0 && val % 10 === 0) {
        val /= 10;
        p -= 1;
    }
    return fmt(val, p);
}

// Money is always two places: 345 cents => "3.45".
const fmtMoney = (cents: number): string => fmt(cents, 2);

// ── Year 4 (AC9M4N01, N03): tenths & hundredths ──────────────────────────────
function starterY4(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['decomp', 'df'] as const);
    const form = deck.take();
    if (form === 'decomp') {
        // Place-value decomposition: o.gh = o ones + t tenths + h hundredths.
        const o = rng.int(1, 9);
        const t = rng.int(0, 9);
        const h = rng.int(1, 9);
        return { prompt: `Starter: ${o}.${t}${h} = ${o} ones + ${t} tenths + __ hundredths`, answer: String(h) };
    }
    // Fraction → decimal (tenths or hundredths).
    if (rng.next() < 0.5) {
        const t = rng.int(1, 9);
        return { prompt: `Starter: ${t}/10 as a decimal: __`, answer: `0.${t}` };
    }
    const h = rng.int(1, 99);
    return { prompt: `Starter: ${h}/100 as a decimal: __`, answer: fmt(h, 2) };
}

function practiceY4(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['cmp', 'add', 'money'] as const);
    const form = deck.take();
    if (form === 'cmp') {
        // Compare two hundredths-scale decimals (display trimmed).
        const a = rng.int(1, 99);
        let b = rng.int(1, 99);
        if (b === a) b = a === 99 ? a - 1 : a + 1;
        const winner = Math.max(a, b);
        return { prompt: `Practice: Which is larger: ${fmtTrim(a, 2)} or ${fmtTrim(b, 2)}? __`, answer: fmtTrim(winner, 2) };
    }
    if (form === 'add') {
        // Tenths addition, sum under 2.0.
        const a = rng.int(1, 9);
        const b = rng.int(1, 10 - a);
        return { prompt: `Practice: 0.${a} + 0.${b} = __`, answer: fmt(a + b, 1) };
    }
    // Money addition (cents arithmetic, always two places).
    const a = rng.int(100, 999);
    const b = rng.int(10, 99);
    return { prompt: `Practice: $${fmtMoney(a)} + $0.${String(b).padStart(2, '0')} = $__`, answer: `$${fmtMoney(a + b)}` };
}

function challengeY4(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['make1', 'closest'] as const);
    const form = deck.take();
    if (form === 'make1') {
        // 0.t + __ = 1 — the complements-to-one core reasoning.
        const t = rng.int(1, 9);
        return { prompt: `Challenge: 0.${t} + __ = 1`, answer: `0.${10 - t}` };
    }
    // Which is closer to 1? (distance comparison on tenths/hundredths).
    const a = rng.int(5, 9); // 0.a
    const b = rng.int(a * 10 + 1, 99); // 0.bc strictly closer to 1 than 0.a
    return {
        prompt: `Challenge: Which is closer to 1: 0.${a} or ${fmt(b, 2)}? __`,
        answer: fmt(b, 2)
    };
}

// ── Year 5 (AC9M5N01, N08): thousandths, rounding, estimation ───────────────
function starterY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['place', 'thou'] as const);
    const form = deck.take();
    if (form === 'place') {
        // Name the place of the last digit of a 3-place decimal.
        const o = rng.int(1, 9);
        const t = rng.int(0, 9);
        const h = rng.int(0, 9);
        const th = rng.int(1, 9);
        return {
            prompt: `Starter: In ${o}.${t}${h}${th}, the digit ${th} is in the __ place.`,
            answer: 'thousandths',
            wideBlanks: true
        };
    }
    const n = rng.int(1, 999);
    return { prompt: `Starter: ${n}/1000 as a decimal: __`, answer: fmt(n, 3) };
}

function practiceY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['round1', 'round0', 'cmp'] as const);
    const form = deck.take();
    if (form === 'round1') {
        // Round a 2-place value to one decimal place (integer maths).
        const v = rng.int(105, 994); // avoid .x0 (already 1-place) and ties
        const r = Math.round(v / 10);
        return { prompt: `Practice: Round ${fmt(v, 2)} to one decimal place: __`, answer: fmt(r, 1) };
    }
    if (form === 'round0') {
        // Round a 3-place value to the nearest whole number.
        const v = rng.int(1001, 9998);
        const r = Math.round(v / 1000);
        return { prompt: `Practice: Round ${fmt(v, 3)} to the nearest whole number: __`, answer: fmt(r, 0) };
    }
    // Compare two 3-place decimals.
    const a = rng.int(100, 9998);
    let b = rng.int(100, 9998);
    if (b === a) b = a === 9998 ? a - 1 : a + 1;
    return {
        prompt: `Practice: Which is larger: ${fmtTrim(a, 3)} or ${fmtTrim(b, 3)}? __`,
        answer: fmtTrim(Math.max(a, b), 3)
    };
}

function challengeY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['est', 'change'] as const);
    const form = deck.take();
    if (form === 'est') {
        // Estimation link: round each 1-place addend, state the estimate.
        const a = rng.int(11, 99);
        const b = rng.int(11, 99);
        const est = Math.round(a / 10) + Math.round(b / 10);
        return {
            prompt: `Challenge: ${fmt(a, 1)} + ${fmt(b, 1)} is about __`,
            answer: String(est)
        };
    }
    // Change from $10 (cents arithmetic, exact).
    const cost = rng.int(100, 999); // $1.00..$9.99
    return { prompt: `Challenge: A toy costs $${fmtMoney(cost)}. Change from $10 is $__`, answer: `$${fmtMoney(1000 - cost)}` };
}

// ── Year 6 (AC9M6N05-06): +/− to thousandths, powers of ten ─────────────────
function starterY6(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['add', 'sub'] as const);
    const form = deck.take();
    if (form === 'add') {
        // Addition at mixed 1/2-place addends, answer at 2 places.
        const a = rng.int(101, 999);
        const b = rng.int(11, 99);
        return { prompt: `Starter: ${fmt(a, 2)} + ${fmt(b, 1)} = __`, answer: fmt(a + b * 10, 2) };
    }
    // Whole minus a 2-place decimal.
    const o = rng.int(5, 20);
    const v = rng.int(1, o * 100 - 1);
    return { prompt: `Starter: ${o} - ${fmtTrim(v, 2)} = __`, answer: fmt(o * 100 - v, 2) };
}

function practiceY6(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['mul10', 'div10', 'dmul'] as const);
    const form = deck.take();
    if (form === 'mul10') {
        // × 10 or × 100: shift the place count (scale value unchanged).
        const v = rng.int(101, 999);
        const p = rng.next() < 0.5 ? 1 : 2;
        return {
            prompt: `Practice: ${fmt(v, 2)} × ${10 ** p} = __`,
            answer: fmt(v, 2 - p)
        };
    }
    if (form === 'div10') {
        const v = rng.int(11, 99);
        const p = rng.next() < 0.5 ? 1 : 2;
        return {
            prompt: `Practice: 0.${String(v).padStart(2, '0')} ÷ ${10 ** p} = __`,
            answer: fmt(v, 2 + p)
        };
    }
    // Decimal × whole number, built from the quotient so it is always exact.
    const q = rng.int(11, 99); // quotient at 1 place
    const f = rng.int(2, 5);
    return { prompt: `Practice: ${fmt(q, 1)} × ${f} = __`, answer: fmt(q * f, 1) };
}

function challengeY6(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['word', 'verify'] as const);
    const form = deck.take();
    if (form === 'word') {
        // Worded 2-place sum (km). The article belongs to the noun "run"
        // (always "A") — the old vowel check attached "An" to the NUMBER,
        // but the number sits after "of", so it printed "An run of 8.19 km"
        // (T8); its av === '11' / av === '18' equality checks were dead
        // anyway for values formatted as 1.01..9.99.
        const a = rng.int(101, 999);
        const b = rng.int(101, 999);
        return {
            prompt: `Challenge: A run of ${fmt(a, 2)} km plus a walk of ${fmt(b, 2)} km is __ km in all.`,
            answer: fmt(a + b, 2)
        };
    }
    // Verify a power-of-ten claim; ~half are perturbed (wrong).
    const v = rng.int(11, 99);
    const truth = fmt(v, 0); // 0.v × 100 = v
    const claim = rng.next() < 0.5 ? truth : String(v * 10);
    return {
        prompt: `Challenge: True or false: 0.${String(v).padStart(2, '0')} × 100 = ${claim}. __`,
        answer: claim === truth ? 'Correct' : 'Wrong',
        wideBlanks: true
    };
}

// Tier dispatch by yearLevel (4..6 — the catalogue never offers this plugin
// below Year 4).
function tierItem(rng: Rng, caps: Caps, tier: 'starter' | 'practice' | 'challenge'): RawProblem {
    const level = caps.yearLevel;
    if (tier === 'starter') return level === 4 ? starterY4(rng) : level === 5 ? starterY5(rng) : starterY6(rng);
    if (tier === 'practice') return level === 4 ? practiceY4(rng) : level === 5 ? practiceY5(rng) : practiceY6(rng);
    return level === 4 ? challengeY4(rng) : level === 5 ? challengeY5(rng) : challengeY6(rng);
}

// Page-by-page scaffold→core→stretch assembly (see FractionsWorksheet.ts for
// the shared rationale: per-tier sampleUnique, then interleave by page).
function generateDecimals(rng: Rng, caps: Caps, count: number): RawProblem[] {
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

export const decimalsSpec: WorksheetSpec = {
    id: 'decimals',
    label: 'Decimals',
    icon: '.5',
    perPage: PER_PAGE,
    offered: (grade: GradeConfig) => grade.available.includes('decimals'),
    scope: (grade: GradeConfig) => {
        const level = grade.caps.yearLevel;
        if (level === 4) return 'tenths & hundredths, fraction links (AC9M4N01)';
        if (level === 5) return 'thousandths, rounding & estimation (AC9M5N01, N08)';
        return '+/− to thousandths & powers of ten (AC9M6N05-06)';
    },
    generate: generateDecimals
};

export function DecimalsWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(decimalsSpec);
}
