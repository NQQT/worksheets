// ─────────────────────────────────────────────────────────────────────────────
// METRIC CONVERSION WORKSHEET — self-contained plugin (T4 expansion).
//
// YEAR-TIERED STRAND (Australian Curriculum v9-informed, codes in readme.md):
//   Year 3  choosing suitable metric units and the core equivalences
//           1 m = 100 cm, 1 km = 1000 m, 1 kg = 1000 g, 1 L = 1000 mL
//           (AC9M3M01-02).
//   Year 4  reading scales/instruments and converting between related units
//           (AC9M4M01).
//   Year 5  converting between common metric units with decimals, and
//           ordering mixed-unit measurements (AC9M5M01).
//   Year 6  conversions with larger numbers, map scales and simple dilations
//           (AC9M6M01).
//
// SCAFFOLDED LEARNING SEQUENCE (R4): printed "Starter:/Practice:/Challenge:"
// tier prefixes, 2+4+2 per page (sentence-style prompts, 8 to a sheet).
//
// EXACT BY CONSTRUCTION: every conversion is generated from the SMALL-unit
// value (e.g. 2300 m) and the big-unit side is FORMATTED from it
// (2300 at place 3 => "2.3 km"), so the printed decimal and the integer
// answer are two views of one exact number — never independently drawn.
//
// Self-contained: delete file + index line to remove the worksheet.
// ─────────────────────────────────────────────────────────────────────────────

import type { Caps, DashboardFramework, DashboardPlugin, GradeConfig, RawProblem, Rng, WorksheetSpec } from '../../framework';
import { createDeck, sampleUnique } from '../../framework';

// Eight measurement sentences per A4, two columns (four grid rows).
const PER_PAGE = 8;
const S_COUNT = 2;
const P_COUNT = 4;
const C_COUNT = 2;

// Shortest exact decimal display (2300 at place 3 => "2.3", 1600 at place 2
// => "16"). Shared rationale with DecimalsWorksheet.ts.
function fmtTrim(v: number, places: number): string {
    let val = v;
    let p = places;
    while (p > 0 && val % 10 === 0) {
        val /= 10;
        p -= 1;
    }
    if (p <= 0) return String(val);
    const s = String(val).padStart(p + 1, '0');
    return `${s.slice(0, -p)}.${s.slice(-p)}`;
}

// "a 2 km" vs "an 8 km" — the article follows the number's vowel sound
// (eight/eighty..., eleven, eighteen). Article() is the sentence-start form.
function an(n: number): string {
    const s = String(n);
    return s.startsWith('8') || s === '11' || s === '18' ? 'an' : 'a';
}
function Article(n: number): string {
    const a = an(n);
    return a.charAt(0).toUpperCase() + a.slice(1);
}

// Draw a small-unit value that is NOT a whole big-unit amount (so the
// conversion always shows real decimal work) within [min, max].
function drawNonWhole(rng: Rng, min: number, max: number, step: number): number {
    let v = rng.int(Math.ceil(min / step), Math.floor(max / step)) * step;
    if (v % (step * 10) === 0) v += step; // nudge off whole big units
    return v;
}

// Everyday unit-choice bank (own wording): thing → suitable unit vs distractor.
const Y3_CHOICES: readonly { thing: string; right: string; wrong: string }[] = [
    { thing: 'a pencil', right: 'cm', wrong: 'm' },
    { thing: 'the journey to school', right: 'km', wrong: 'm' },
    { thing: 'the water in a cup', right: 'mL', wrong: 'L' },
    { thing: 'a cat', right: 'kg', wrong: 'g' },
    { thing: 'the length of a classroom', right: 'm', wrong: 'km' },
    { thing: 'an exercise book', right: 'cm', wrong: 'mm' }
];

// The four core equivalences (Y3) and their whole-number multiples (Y3/Y4).
const CORE: readonly { small: string; big: string; factor: number }[] = [
    { small: 'cm', big: 'm', factor: 100 },
    { small: 'm', big: 'km', factor: 1000 },
    { small: 'g', big: 'kg', factor: 1000 },
    { small: 'mL', big: 'L', factor: 1000 }
];

// ── Year 3 (AC9M3M01-02): suitable units & the core equivalences ────────────
function starterY3(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['choose', 'core'] as const);
    const form = deck.take();
    if (form === 'choose') {
        const c = rng.pick(Y3_CHOICES);
        return { prompt: `Starter: Would you measure ${c.thing} in ${c.right} or ${c.wrong}? __`, answer: c.right };
    }
    const u = rng.pick(CORE);
    return { prompt: `Starter: 1 ${u.big} = __ ${u.small}`, answer: String(u.factor) };
}

function practiceY3(rng: Rng): RawProblem {
    // Whole-number multiples of the core equivalences: n big = n*factor small.
    const u = rng.pick(CORE);
    const n = rng.int(2, 9);
    return { prompt: `Practice: ${n} ${u.big} = __ ${u.small}`, answer: String(n * u.factor) };
}

function challengeY3(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['sum', 'verify'] as const);
    const form = deck.take();
    if (form === 'sum') {
        // Two same-unit amounts added (mL, friendly hundreds).
        const a = rng.int(2, 9) * 100;
        const b = rng.int(2, 5) * 50;
        return { prompt: `Challenge: ${Article(a)} ${a} mL bottle and ${an(b)} ${b} mL cup hold __ mL together.`, answer: String(a + b) };
    }
    // Compare across units: is n*100 m more than 1 km? True iff n > 10.
    const n = rng.int(5, 12);
    const truth = n * 100 > 1000;
    return {
        prompt: `Challenge: True or false: ${n * 100} m is more than 1 km. __`,
        answer: truth ? 'Correct' : 'Wrong',
        wideBlanks: true
    };
}

// ── Year 4 (AC9M4M01): instruments & related-unit conversions ───────────────
function starterY4(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['jug', 'ruler'] as const);
    const form = deck.take();
    if (form === 'jug') {
        // Reading a 1 L jug: mL still needed to fill it.
        const n = rng.int(1, 9) * 100;
        return { prompt: `Starter: A 1 L jug already holds ${n} mL. It needs __ more mL to be full.`, answer: String(1000 - n) };
    }
    // cm + mm → total mm.
    const cm = rng.int(1, 9);
    const mm = rng.int(1, 9);
    return { prompt: `Starter: A pencil measures ${cm} cm and ${mm} mm. That is __ mm.`, answer: String(cm * 10 + mm) };
}

function practiceY4(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['big2small', 'small2big'] as const);
    const form = deck.take();
    const u = rng.pick(CORE);
    if (form === 'big2small') {
        const n = rng.int(2, 9);
        return { prompt: `Practice: ${n} ${u.big} = __ ${u.small}`, answer: String(n * u.factor) };
    }
    // small → big with a decimal display (generated from the small value).
    // T8: Year 4 stays within TWO decimal places — values are multiples of
    // 10 (110..990), so a factor-1000 unit yields 0.11..0.99. The old 5-step
    // draw produced 3-place answers like "105 m = 0.105 km", which is Year 5
    // decimal conversion work (AC9M5M01), not Year 4.
    const v = drawNonWhole(rng, 110, 990, 10);
    return { prompt: `Practice: ${v} ${u.small} = __ ${u.big}`, answer: fmtTrim(v, String(u.factor).length - 1) };
}

function challengeY4(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['half', 'which'] as const);
    const form = deck.take();
    if (form === 'half') {
        // Halfway along a km track, answered in m.
        const k = rng.int(2, 9);
        return { prompt: `Challenge: Halfway along ${an(k)} ${k} km track is __ m from the start.`, answer: String(k * 500) };
    }
    // Which is heavier: n g or 1 kg? (1000 g would be a tie, so skip it)
    let g = rng.int(2, 19) * 100;
    if (g === 1000) g += 100;
    const winner = g > 1000 ? `${g} g` : '1 kg';
    return { prompt: `Challenge: Which is heavier: ${g} g or 1 kg? __`, answer: winner };
}

// ── Year 5 (AC9M5M01): decimal conversions & mixed-unit ordering ────────────
function starterY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['big2small', 'whole2big'] as const);
    const form = deck.take();
    const u = rng.pick(CORE);
    if (form === 'big2small') {
        const n = rng.int(2, 9);
        return { prompt: `Starter: ${n} ${u.big} = __ ${u.small}`, answer: String(n * u.factor) };
    }
    // Whole small amounts back to one big unit (n*factor small = n big).
    const n = rng.int(2, 9);
    return { prompt: `Starter: ${n * u.factor} ${u.small} = __ ${u.big}`, answer: String(n) };
}

function practiceY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['dec2small', 'small2dec', 'order'] as const);
    const form = deck.take();
    const u = rng.pick(CORE);
    const places = String(u.factor).length - 1;
    if (form === 'dec2small') {
        // Decimal big → exact small (generated from the small value).
        const v = drawNonWhole(rng, 105, 9990, 10);
        return { prompt: `Practice: ${fmtTrim(v, places)} ${u.big} = __ ${u.small}`, answer: String(v) };
    }
    if (form === 'small2dec') {
        const v = drawNonWhole(rng, 105, 995, 5);
        return { prompt: `Practice: ${v} ${u.small} = __ ${u.big}`, answer: fmtTrim(v, places) };
    }
    // Order three same-unit measurements given in mixed big/small display.
    // Range spans one big unit (4..19 × factor/10) so at least one value is
    // shown in each unit — the ordering must convert before comparing.
    const base = u.factor;
    const vals = new Set<number>();
    while (vals.size < 3) vals.add(rng.int(4, 19) * Math.round(base / 10));
    const list = [...vals];
    const display = list.map((v) => (v >= base ? `${fmtTrim(v, places)} ${u.big}` : `${v} ${u.small}`));
    const sorted = [...list].sort((a, b) => a - b).map((v, i) => display[list.indexOf(v)]);
    return {
        prompt: `Practice: Write smallest first: ${display[0]}, ${display[1]}, ${display[2]} __`,
        answer: sorted.join(', '),
        wideBlanks: true
    };
}

function challengeY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['double', 'word'] as const);
    const form = deck.take();
    if (form === 'double') {
        // Doubling a 1-place km distance (scale maths: k*5 hundreds of m).
        const k = rng.int(11, 49);
        return { prompt: `Challenge: A ${fmtTrim(k, 1)} km run done twice is __ km in all.`, answer: fmtTrim(k * 2, 1) };
    }
    // Recipe word item: a fraction of a litre in mL (quarter/half, exact).
    const q = rng.pick([2, 4] as const);
    return {
        prompt: `Challenge: A recipe needs ${q === 2 ? 'half' : 'a quarter'} a litre of milk. That is __ mL.`,
        answer: String(1000 / q)
    };
}

// ── Year 6 (AC9M6M01): larger conversions, scales & dilations ───────────────
function starterY6(rng: Rng): RawProblem {
    const u = rng.pick(CORE);
    const places = String(u.factor).length - 1;
    // 2-place decimal big → small (e.g. 3.75 km = 3750 m).
    const v = drawNonWhole(rng, 1050, 9990, 10);
    return { prompt: `Starter: ${fmtTrim(v, places + 1)} ${u.big} = __ ${u.small}`, answer: String(v) };
}

function practiceY6(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['small2dec', 'scale'] as const);
    const form = deck.take();
    if (form === 'small2dec') {
        const u = rng.pick(CORE);
        const places = String(u.factor).length - 1;
        const v = drawNonWhole(rng, 105, 9990, 10);
        return { prompt: `Practice: ${v} ${u.small} = __ ${u.big}`, answer: fmtTrim(v, places) };
    }
    // Map scale: 1 cm stands for s km; c cm stands for c*s km.
    const s = rng.pick([2, 5, 10] as const);
    const c = rng.int(3, 9);
    return { prompt: `Practice: On a map, 1 cm stands for ${s} km. ${c} cm stands for __ km`, answer: String(c * s) };
}

function challengeY6(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['dilate', 'big'] as const);
    const form = deck.take();
    if (form === 'dilate') {
        // Simple dilation: sides ×k, new area = (k·l)(k·w) (AC9M6M01 dilations).
        const l = rng.int(3, 9);
        const w = rng.int(2, l);
        const k = rng.pick([2, 3] as const);
        return {
            prompt: `Challenge: ${Article(l)} ${l} cm by ${w} cm photo is enlarged so every side is ${k} times as long. The new area is __ cm²`,
            answer: String(l * k * w * k)
        };
    }
    // Larger-number conversion: n*100 m → km (exact, may be whole).
    const n = rng.int(11, 99);
    return { prompt: `Challenge: ${n * 100} m = __ km`, answer: fmtTrim(n * 100, 3) };
}

function tierItem(rng: Rng, caps: Caps, tier: 'starter' | 'practice' | 'challenge'): RawProblem {
    const level = caps.yearLevel;
    if (tier === 'starter') return level === 3 ? starterY3(rng) : level === 4 ? starterY4(rng) : level === 5 ? starterY5(rng) : starterY6(rng);
    if (tier === 'practice') return level === 3 ? practiceY3(rng) : level === 4 ? practiceY4(rng) : level === 5 ? practiceY5(rng) : practiceY6(rng);
    return level === 3 ? challengeY3(rng) : level === 4 ? challengeY4(rng) : level === 5 ? challengeY5(rng) : challengeY6(rng);
}

// Page-by-page scaffold→core→stretch assembly (shared T4 rationale).
function generateMetricConv(rng: Rng, caps: Caps, count: number): RawProblem[] {
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

export const metricConvSpec: WorksheetSpec = {
    id: 'metricconv',
    label: 'Metric Measurement',
    icon: '⚖',
    perPage: PER_PAGE,
    offered: (grade: GradeConfig) => grade.available.includes('metricconv'),
    scope: (grade: GradeConfig) => {
        const level = grade.caps.yearLevel;
        if (level === 3) return 'suitable units & core equivalences (AC9M3M01-02)';
        if (level === 4) return 'instruments & related-unit conversions (AC9M4M01)';
        if (level === 5) return 'decimal conversions & mixed-unit ordering (AC9M5M01)';
        return 'larger conversions, scales & dilations (AC9M6M01)';
    },
    generate: generateMetricConv
};

export function MetricConversionWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(metricConvSpec);
}
