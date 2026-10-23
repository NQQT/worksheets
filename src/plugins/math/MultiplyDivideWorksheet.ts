// ─────────────────────────────────────────────────────────────────────────────
// MULTIPLICATION & DIVISION WORKSHEET — self-contained plugin (T4 expansion).
//
// YEAR-TIERED STRAND (Australian Curriculum v9-informed, codes in readme.md):
//   Year 4  multiplying and dividing by multiples of ten and powers of ten,
//           using known facts to shift by a factor of ten (AC9M4N05).
//   Year 5  two-digit × one-digit and two-digit × two-digit multiplication,
//           related division, and remainders in context (AC9M5N06-07).
//   Year 6  efficient whole-number algorithms plus decimal ×/÷ by powers of
//           ten and decimal products (AC9M6N06).
//
// This is the UPPER ladder above plugins/MultiplicationWorksheet.ts (the
// tables-to-10 sheet, retained for Years 2-3). The catalogue offers 'multidiv'
// for Years 4-6 only; its difficulty reads caps.multCap (100 = two-digit
// operands) and caps.yearLevel.
//
// SCAFFOLDED LEARNING SEQUENCE (R4): printed "Starter:/Practice:/Challenge:"
// tier prefixes, 3+4+3 per page (see plugins/FractionsWorksheet.ts).
//
// EXACT BY CONSTRUCTION: every division is built BACKWARDS from the quotient
// (dividend = divisor × quotient [+ remainder]), so no answer is ever a
// surprise decimal and "r __" remainders are always < divisor. Decimal items
// use scale-integer maths (0.31 = 31 at place 2).
//
// Self-contained: delete file + index line to remove the worksheet.
// ─────────────────────────────────────────────────────────────────────────────

import type { Caps, DashboardFramework, DashboardPlugin, GradeConfig, RawProblem, Rng, WorksheetSpec } from '../../framework';
import { createDeck, sampleUnique } from '../../framework';

// Ten tasks per A4, two columns (five grid rows).
const PER_PAGE = 8;
// Per-page tier split: 2 scaffold + 4 core + 2 stretch = PER_PAGE.
// (Density 8, not 10: the sentence-style prompts wrap to three 22px lines,
// and the layout-capacity model measures 165px worst rows — they only clear
// the 1fr row at the 8-per-page two-column height. See layout-capacity.test.ts.)
const S_COUNT = 2;
const P_COUNT = 4;
const C_COUNT = 2;

// Format a scale integer at `places` decimals (see DecimalsWorksheet.ts for
// the shared rationale; duplicated here because plugins never import each
// other — the self-containment rule in framework/types.ts).
function fmt(v: number, places: number): string {
    if (places <= 0) return String(v * 10 ** -places);
    const s = String(v).padStart(places + 1, '0');
    return `${s.slice(0, -places)}.${s.slice(-places)}`;
}

// Shortest exact display (trims trailing zeros: 110 at place 1 => "11").
// Used where a ×10/×20 product lands on a whole number.
function fmtTrim(v: number, places: number): string {
    let val = v;
    let p = places;
    while (p > 0 && val % 10 === 0) {
        val /= 10;
        p -= 1;
    }
    return fmt(val, p);
}

// ── Year 4 (AC9M4N05): multiples of ten & powers of ten ──────────────────────
function starterY4(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['pow', 'divpow'] as const);
    const form = deck.take();
    const n = rng.int(2, 9);
    if (form === 'pow') {
        const p = rng.pick([10, 100, 1000] as const);
        return { prompt: `Starter: ${n} × ${p} = __`, answer: String(n * p) };
    }
    const p = rng.pick([10, 100] as const);
    return { prompt: `Starter: ${n * p} ÷ ${p} = __`, answer: String(n) };
}

function practiceY4(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['tensmul', 'tensdiv', 'factlink'] as const);
    const form = deck.take();
    if (form === 'tensmul') {
        // Tens × fact: (10t) × f.
        const t = rng.int(2, 9);
        const f = rng.int(2, 9);
        return { prompt: `Practice: ${10 * t} × ${f} = __`, answer: String(10 * t * f) };
    }
    if (form === 'tensdiv') {
        // Built backwards: quotient is a multiple of ten.
        const t = rng.int(2, 9);
        const d = rng.int(2, 9);
        return { prompt: `Practice: ${10 * t * d} ÷ ${d} = __`, answer: String(10 * t) };
    }
    // Fact → shifted fact reasoning ("6 × 4 = 24, so 60 × 4 = __").
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    if (rng.next() < 0.5) {
        return {
            prompt: `Practice: ${a} × ${b} = ${a * b}, so ${a * 10} × ${b} = __`,
            answer: String(a * b * 10)
        };
    }
    return {
        prompt: `Practice: ${a * b} ÷ ${a} = ${b}, so ${a * b * 10} ÷ ${a} = __`,
        answer: String(b * 10)
    };
}

function challengeY4(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['unknown', 'word', 'verify'] as const);
    const form = deck.take();
    if (form === 'unknown') {
        // __ × (10t) = product, built from the answer.
        const q = rng.int(2, 9);
        const t = rng.int(2, 9);
        return { prompt: `Challenge: __ × ${10 * t} = ${q * 10 * t}`, answer: String(q) };
    }
    if (form === 'word') {
        const g = rng.int(4, 8);
        const s = rng.pick([10, 20] as const);
        return { prompt: `Challenge: ${g} groups of ${s} make __ in total.`, answer: String(g * s) };
    }
    // Verify a tens-multiplication claim; ~half perturbed.
    const t = rng.int(2, 9);
    const f = rng.int(2, 9);
    const truth = t * 10 * f;
    const claim = rng.next() < 0.5 ? truth : truth + 10;
    return {
        prompt: `Challenge: True or false: ${10 * t} × ${f} = ${claim}. __`,
        answer: claim === truth ? 'Correct' : 'Wrong',
        wideBlanks: true
    };
}

// ── Year 5 (AC9M5N06-07): 2-digit work & remainders ─────────────────────────
function starterY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['m1', 'dtable'] as const);
    const form = deck.take();
    if (form === 'm1') {
        // Two-digit × one-digit.
        const a = rng.int(12, 49);
        const b = rng.int(2, 4);
        return { prompt: `Starter: ${a} × ${b} = __`, answer: String(a * b) };
    }
    // Table division built from the quotient.
    const d = rng.int(3, 9);
    const q = rng.int(3, 9);
    return { prompt: `Starter: ${d * q} ÷ ${d} = __`, answer: String(q) };
}

function practiceY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['m2', 'd2', 'remainder'] as const);
    const form = deck.take();
    if (form === 'm2') {
        // Two-digit × two-digit (products stay well inside the Y5 cap).
        const a = rng.int(12, 39);
        const b = rng.int(11, 29);
        return { prompt: `Practice: ${a} × ${b} = __`, answer: String(a * b) };
    }
    if (form === 'd2') {
        // Division with a two-digit quotient, built backwards.
        const d = rng.int(3, 9);
        const q = rng.int(11, 29);
        return { prompt: `Practice: ${d * q} ÷ ${d} = __`, answer: String(q) };
    }
    // Remainder form: dividend = d*q + r with 1 <= r < d.
    const d = rng.int(4, 9);
    const q = rng.int(5, 19);
    const r = rng.int(1, d - 1);
    return { prompt: `Practice: ${d * q + r} ÷ ${d} = __ r __`, answer: `${q}, ${r}` };
}

function challengeY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['wordrem', 'check'] as const);
    const form = deck.take();
    if (form === 'wordrem') {
        // The same remainder arithmetic in a sharing story (AC9M5N07).
        const d = rng.int(4, 9);
        const q = rng.int(4, 12);
        const r = rng.int(1, d - 1);
        return {
            prompt: `Challenge: ${d * q + r} lollies are packed into bags of ${d}. That fills __ full bags and __ are left over.`,
            answer: `${q}, ${r}`
        };
    }
    // Inverse check: a known product re-states the division (AC9M5A01).
    const a = rng.int(3, 12);
    const b = rng.int(3, 12);
    return {
        prompt: `Challenge: ${a} × ${b} = ${a * b}, so ${a * b} ÷ ${b} = __`,
        answer: String(a)
    };
}

// ── Year 6 (AC9M6N06): efficient algorithms & decimal powers of ten ─────────
function starterY6(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['dmul10', 'ddiv10'] as const);
    const form = deck.take();
    if (form === 'dmul10') {
        // Decimal × 10/100: shift the place count (scale value unchanged).
        const v = rng.int(11, 99);
        if (rng.next() < 0.5) {
            return { prompt: `Starter: 0.${String(v).padStart(2, '0')} × 10 = __`, answer: fmt(v, 1) };
        }
        return { prompt: `Starter: 0.${String(v).padStart(2, '0')} × 100 = __`, answer: fmt(v, 0) };
    }
    const v = rng.int(11, 99);
    const p = rng.next() < 0.5 ? 1 : 2;
    return { prompt: `Starter: ${fmt(v, 1)} ÷ ${10 ** p} = __`, answer: fmt(v, 1 + p) };
}

function practiceY6(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['m2', 'd2', 'ddiv'] as const);
    const form = deck.take();
    if (form === 'm2') {
        const a = rng.int(16, 49);
        const b = rng.int(13, 29);
        return { prompt: `Practice: ${a} × ${b} = __`, answer: String(a * b) };
    }
    if (form === 'd2') {
        // Two-digit divisor, built backwards (exact by construction).
        const d = rng.int(11, 25);
        const q = rng.int(11, 49);
        return { prompt: `Practice: ${d * q} ÷ ${d} = __`, answer: String(q) };
    }
    // Decimal ÷ whole number: quotient drawn first, dividend = q × divisor.
    const f = rng.int(3, 9);
    const q = rng.int(11, 99);
    return { prompt: `Practice: ${fmt(q * f, 1)} ÷ ${f} = __`, answer: fmt(q, 1) };
}

function challengeY6(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['word', 'verify', 'bigmul'] as const);
    const form = deck.take();
    if (form === 'word') {
        // Equal-parts decimal division in a story (built from the answer).
        const f = rng.int(4, 8);
        const q = rng.int(11, 99);
        // Article follows the length's vowel sound ("An 8.5 m", "An 11.5 m").
        const len = fmt(q * f, 1);
        const art = len.startsWith('8') || len.startsWith('11') ? 'An' : 'A';
        return {
            prompt: `Challenge: ${art} ${len} m rope is cut into ${f} equal pieces. Each piece is __ m.`,
            answer: fmt(q, 1)
        };
    }
    if (form === 'verify') {
        const v = rng.int(11, 99);
        const truth = fmt(v, 0); // 0.vv × 100 = vv
        const claim = rng.next() < 0.5 ? truth : fmt(v, 1);
        return {
            prompt: `Challenge: True or false: 0.${String(v).padStart(2, '0')} × 100 = ${claim}. __`,
            answer: claim === truth ? 'Correct' : 'Wrong',
            wideBlanks: true
        };
    }
    // 1-place decimal × tens: 1.5 × 20 = 30 (scale maths, exact; the product
    // lands on a whole number so it is displayed trimmed).
    const q = rng.int(11, 29);
    const t = rng.pick([10, 20] as const);
    return { prompt: `Challenge: ${fmt(q, 1)} × ${t} = __`, answer: fmtTrim(q * t, 1) };
}

function tierItem(rng: Rng, caps: Caps, tier: 'starter' | 'practice' | 'challenge'): RawProblem {
    const level = caps.yearLevel;
    if (tier === 'starter') return level === 4 ? starterY4(rng) : level === 5 ? starterY5(rng) : starterY6(rng);
    if (tier === 'practice') return level === 4 ? practiceY4(rng) : level === 5 ? practiceY5(rng) : practiceY6(rng);
    return level === 4 ? challengeY4(rng) : level === 5 ? challengeY5(rng) : challengeY6(rng);
}

// Page-by-page scaffold→core→stretch assembly (shared T4 rationale).
function generateMultiDiv(rng: Rng, caps: Caps, count: number): RawProblem[] {
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

export const multiDivSpec: WorksheetSpec = {
    id: 'multidiv',
    label: 'Multiplication & Division',
    icon: '×÷',
    perPage: PER_PAGE,
    offered: (grade: GradeConfig) => grade.available.includes('multidiv'),
    scope: (grade: GradeConfig) => {
        const level = grade.caps.yearLevel;
        if (level === 4) return 'multiples of ten & powers of ten (AC9M4N05)';
        if (level === 5) return '2-digit products & remainders (AC9M5N06-07)';
        return 'efficient algorithms & decimal powers of ten (AC9M6N06)';
    },
    generate: generateMultiDiv
};

export function MultiplyDivideWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(multiDivSpec);
}
