// ─────────────────────────────────────────────────────────────────────────────
// FRACTIONS WORKSHEET — a self-contained dashboard plugin (T4 expansion).
//
// YEAR-TIERED STRAND (Australian Curriculum v9-informed, codes in readme.md):
//   Year 3  unit fractions 1/2,1/3,1/4,1/5,1/10 and multiples that complete
//           a whole (AC9M3N02) — identification, counting on, filling wholes.
//   Year 4  equivalent fractions and fraction↔decimal links, counting
//           fractions and mixed numerals (AC9M4N03-04).
//   Year 5  comparing AND adding/subtracting fractions with RELATED
//           denominators (AC9M5N03-05).
//   Year 6  ordering fractions with common denominators and related-denominator
//           +/− including mixed numerals (AC9M6N03-04).
//
// SCAFFOLDED LEARNING SEQUENCE (R4): every page prints its tasks in three
// labelled tiers — "Starter:" (scaffold, the year's core idea with friendly
// numbers), "Practice:" (core fluency) and "Challenge:" (reasoning/stretch:
// compare-justify, verify claims, worded parts). The tier is a printed prompt
// prefix, so the learning sequence is visible on paper with ZERO framework
// changes. Per page: 3 Starter + 4 Practice + 3 Challenge.
//
// ANSWER CANONICALISATION: every blank that takes a fraction states the
// expected denominator inline ("= __/12"), so the model answer is a single
// integer and no equivalent-form ambiguity can exist. Comparison answers are
// the exact fraction string as printed.
//
// Difficulty is driven ONLY by the grade catalogue (framework/grades.ts):
// caps.denSet (allowed denominators) and caps.yearLevel (which family set).
// Fully self-contained: delete this file + its plugins/index.ts line to
// remove the worksheet.
// ─────────────────────────────────────────────────────────────────────────────

import type { Caps, DashboardFramework, DashboardPlugin, GradeConfig, RawProblem, Rng, WorksheetSpec } from '../../framework';
import { createDeck, sampleUnique } from '../../framework';

// Ten compact fraction tasks per A4, printed in TWO columns (five grid rows).
// Prompts are short one-liners; the layout-capacity suite (plugins/
// layout-capacity.test.ts) pins that the longest Starter/Practice/Challenge
// line still clears its row.
const PER_PAGE = 8;
// Per-page tier split: 2 scaffold + 4 core + 2 stretch = PER_PAGE.
// (Density 8, not 10: the fraction sentences wrap to three 22px lines, and
// the layout-capacity model measures 165px worst rows — they only clear the
// 1fr row at the 8-per-page two-column height. See layout-capacity.test.ts.)
const S_COUNT = 2;
const P_COUNT = 4;
const C_COUNT = 2;

// Plural names for unit fractions ("how many thirds make a whole?").
const DEN_WORDS: Record<number, string> = {
    2: 'halves', 3: 'thirds', 4: 'quarters', 5: 'fifths', 6: 'sixths',
    8: 'eighths', 10: 'tenths', 12: 'twelfths'
};

// Draw a denominator from the grade's live denSet (never empty on an offered
// grade — the catalogue gates availability on the same list).
const drawDen = (rng: Rng, caps: Caps): number => rng.pick(caps.denSet);

// Safe pick: rng.pick THROWS on an empty pool, and several families filter
// their option lists (e.g. "scale by 2 or 3 only while the target denominator
// stays in denSet"). The fallback keeps those families printable on every year.
function pickSafe<T>(rng: Rng, arr: readonly T[], fallback: T): T {
    return arr.length ? rng.pick(arr) : fallback;
}

// Draw an ordered pair of RELATED denominators (one divides the other) from
// the grade's denSet — the Year 5/6 comparison and +/− families. Returns null
// when the set holds no related pair so the caller can fall back.
function drawRelatedPair(rng: Rng, caps: Caps): [number, number] | null {
    const options: [number, number][] = [];
    for (const small of caps.denSet) {
        for (const big of caps.denSet) {
            // small < big and big is a whole multiple of small (e.g. 2|8, 3|12).
            if (big > small && big % small === 0) options.push([small, big]);
        }
    }
    return options.length ? rng.pick(options) : null;
}

// ── Year 3 (AC9M3N02): unit fractions and completing wholes ─────────────────
function starterY3(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['slice', 'make', 'counton'] as const);
    const form = deck.take();
    const d = drawDen(rng, caps);
    if (form === 'slice') {
        // Identify a unit fraction from an equal-parts story.
        return { prompt: `Starter: One slice of a pizza cut into ${d} equal slices is the fraction __ of the pizza.`, answer: `1/${d}` };
    }
    if (form === 'make') {
        // How many unit fractions complete one whole — the answer is d.
        return { prompt: `Starter: How many ${DEN_WORDS[d]} make one whole? __`, answer: String(d) };
    }
    // Count on in unit fractions: 1/d, 2/d, 3/d, __ (answer 4/d).
    return { prompt: `Starter: Count in ${DEN_WORDS[d]}: 1/${d}, 2/${d}, 3/${d}, __`, answer: `4/${d}` };
}

function practiceY3(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['complete', 'shade', 'bigger'] as const);
    const form = deck.take();
    const d = drawDen(rng, caps);
    if (form === 'complete') {
        // Fill the whole: __/d + k/d = d/d  →  d - k.
        const k = rng.int(1, d - 1);
        return { prompt: `Practice: __/${d} + ${k}/${d} = ${d}/${d}`, answer: String(d - k) };
    }
    if (form === 'shade') {
        // n out of d equal parts → n/d.
        const n = rng.int(1, d - 1);
        return { prompt: `Practice: ${n} of ${d} equal parts are shaded. The fraction shaded is __`, answer: `${n}/${d}` };
    }
    // Compare two UNIT fractions: the smaller denominator is bigger (same 1).
    const others = caps.denSet.filter((x) => x !== d);
    const d2 = rng.pick(others.length ? others : [d === 2 ? 3 : 2]);
    const winner = Math.min(d, d2);
    return { prompt: `Practice: Which is bigger: 1/${d} or 1/${d2}? __`, answer: `1/${winner}` };
}

function challengeY3(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['verify', 'share'] as const);
    const form = deck.take();
    const d = drawDen(rng, caps);
    if (form === 'verify') {
        // CHECK a claim about unit fractions; ~half the claims are true.
        const others = caps.denSet.filter((x) => x !== d);
        const d2 = rng.pick(others.length ? others : [d === 2 ? 3 : 2]);
        const claimBigger = rng.next() < 0.5 ? d : d2; // the claimed "bigger"
        const truth = Math.min(d, d2); // the actually bigger unit fraction
        return {
            prompt: `Challenge: True or false: 1/${claimBigger} is larger than 1/${claimBigger === d ? d2 : d}. __`,
            answer: claimBigger === truth ? 'Correct' : 'Wrong',
            wideBlanks: true
        };
    }
    // Sharing one whole between p people → 1/p (p from the year's set).
    const p = rng.pick([2, 4, 5]);
    return { prompt: `Challenge: ${p} people share one pizza equally. Each person gets __ of the pizza.`, answer: `1/${p}` };
}

// ── Year 4 (AC9M4N03-04): equivalence, fraction↔decimal, mixed numerals ─────
function starterY4(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['equiv', 'fdec'] as const);
    const form = deck.take();
    const b = drawDen(rng, caps);
    if (form === 'equiv') {
        // Equivalent fraction with a scaled denominator: a/b = __/(b*k).
        // Scale only while the target denominator stays inside the year's set.
        const kk = pickSafe(rng, [2, 3].filter((m) => caps.denSet.includes(b * m)), 2);
        const a = rng.int(1, b - 1);
        return { prompt: `Starter: ${a}/${b} = __/${b * kk}`, answer: String(a * kk) };
    }
    // Tenths/hundredths → decimal (AC9M4N01 link).
    const t = rng.int(1, 9);
    if (rng.next() < 0.5) {
        return { prompt: `Starter: ${t}/10 as a decimal: __`, answer: `0.${t}` };
    }
    const h = rng.int(1, 99);
    return { prompt: `Starter: ${h}/100 as a decimal: __`, answer: h < 10 ? `0.0${h}` : `0.${h}` };
}

function practiceY4(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['mixed', 'counton', 'decf'] as const);
    const form = deck.take();
    const d = drawDen(rng, caps);
    if (form === 'mixed') {
        // Improper → mixed: n/d with d < n < 2d so the whole part is exactly 1.
        const n = rng.int(d + 1, 2 * d - 1);
        return { prompt: `Practice: ${n}/${d} as a mixed number: __`, answer: `1 ${n - d}/${d}` };
    }
    if (form === 'counton') {
        // Counting fractions past one whole: a/d, (a+d)/d, __ → (a+2d)/d.
        const a = rng.int(1, d);
        return {
            prompt: `Practice: Count in ${DEN_WORDS[d]}: ${a}/${d}, ${a + d}/${d}, __`,
            answer: `${a + 2 * d}/${d}`
        };
    }
    // Decimal → fraction: 0.t = __/10 or 0.xy = __/100.
    const t = rng.int(1, 9);
    if (rng.next() < 0.5) {
        return { prompt: `Practice: 0.${t} = __/10`, answer: String(t) };
    }
    const h = rng.int(11, 99);
    return { prompt: `Practice: 0.${h} = __/100`, answer: String(h) };
}

function challengeY4(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['compare', 'verify'] as const);
    const form = deck.take();
    if (form === 'compare') {
        // Compare with a related denominator: a/d vs b/e where e = d*k.
        const pair = drawRelatedPair(rng, caps) ?? [2, 4];
        const [d, e] = pair;
        const k = e / d;
        const a = rng.int(1, d - 1);
        const b = rng.int(1, e - 1);
        // Convert to the common denominator e to know the truth.
        const winner = a * k === b ? 'equal' : a * k > b ? `${a}/${d}` : `${b}/${e}`;
        return {
            prompt: `Challenge: Who ate more: ${a}/${d} or ${b}/${e}? __`,
            answer: winner === 'equal' ? 'They are equal' : winner
        };
    }
    // Verify an equivalence claim: a/b = (a*k)/(b*k) is true; a perturbed
    // numerator makes it false (~half the time).
    const b = drawDen(rng, caps);
    const kk = pickSafe(rng, [2, 3].filter((m) => caps.denSet.includes(b * m)), 2);
    const a = rng.int(1, b - 1);
    const claim = rng.next() < 0.5 ? a * kk : a * kk + 1;
    return {
        prompt: `Challenge: True or false: ${a}/${b} = ${claim}/${b * kk}. __`,
        answer: claim === a * kk ? 'Correct' : 'Wrong',
        wideBlanks: true
    };
}

// ── Year 5 (AC9M5N03-05): compare + add/subtract related denominators ───────
function starterY5(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['likeadd', 'likeSub', 'equiv'] as const);
    const form = deck.take();
    const d = drawDen(rng, caps);
    if (form === 'likeadd') {
        // Like-denominator addition, answer stated over d: a/d + b/d = __/d.
        const a = rng.int(1, d - 2);
        const b = rng.int(1, d - 1 - a);
        return { prompt: `Starter: ${a}/${d} + ${b}/${d} = __/${d}`, answer: String(a + b) };
    }
    if (form === 'likeSub') {
        const a = rng.int(2, d - 1);
        const b = rng.int(1, a - 1);
        return { prompt: `Starter: ${a}/${d} - ${b}/${d} = __/${d}`, answer: String(a - b) };
    }
    const kk = pickSafe(rng, [2, 3].filter((m) => caps.denSet.includes(d * m)), 2);
    const a = rng.int(1, d - 1);
    return { prompt: `Starter: ${a}/${d} = __/${d * kk}`, answer: String(a * kk) };
}

function practiceY5(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['reladd', 'relsub', 'cmp'] as const);
    const form = deck.take();
    const pair = drawRelatedPair(rng, caps) ?? [2, 4];
    const [d, e] = pair;
    const k = e / d;
    if (form === 'reladd') {
        // 1/d + a/e = (k + a)/e — the related-denominator addition step.
        const a = rng.int(1, e - k);
        return { prompt: `Practice: 1/${d} + ${a}/${e} = __/${e}`, answer: String(k + a) };
    }
    if (form === 'relsub') {
        // a/e - 1/d = (a - k)/e with a > k so the result is positive.
        const a = rng.int(k + 1, e - 1);
        return { prompt: `Practice: ${a}/${e} - 1/${d} = __/${e}`, answer: String(a - k) };
    }
    // Compare related-denominator fractions by converting to the common one.
    const a = rng.int(1, d - 1);
    const b = rng.int(1, e - 1);
    const winner = a * k === b ? 'equal' : a * k > b ? `${a}/${d}` : `${b}/${e}`;
    return { prompt: `Practice: Which is bigger: ${a}/${d} or ${b}/${e}? __`, answer: winner === 'equal' ? 'They are equal' : winner };
}

function challengeY5(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['wholeminus', 'word'] as const);
    const form = deck.take();
    const d = drawDen(rng, caps);
    if (form === 'wholeminus') {
        // Whole minus a fraction: 1 - a/d = (d-a)/d.
        const a = rng.int(1, d - 1);
        return { prompt: `Challenge: 1 - ${a}/${d} = __/${d}`, answer: String(d - a) };
    }
    // Worded related-denominator sum over the larger denominator.
    const pair = drawRelatedPair(rng, caps) ?? [2, 4];
    const [d2, e] = pair;
    const k = e / d2;
    const a = rng.int(1, e - k);
    return {
        prompt: `Challenge: A recipe needs 1/${d2} cup of milk and ${a}/${e} cup of cocoa. The recipe needs __/${e} cup in all.`,
        answer: String(k + a)
    };
}

// ── Year 6 (AC9M6N03-04): ordering + related +/− with mixed numerals ────────
function starterY6(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['reladd', 'relsub'] as const);
    const form = deck.take();
    const pair = drawRelatedPair(rng, caps) ?? [2, 4];
    const [d, e] = pair;
    const k = e / d;
    if (form === 'reladd') {
        const a = rng.int(1, d - 1);
        const b = rng.int(1, e - a * k);
        return { prompt: `Starter: ${a}/${d} + ${b}/${e} = __/${e}`, answer: String(a * k + b) };
    }
    // a/e - b/d must stay positive: b is drawn so b*k < a (b*k is the value
    // of b/d expressed over e).
    const a = rng.int(Math.max(k + 1, 2), e - 1);
    const b = rng.int(1, Math.max(1, Math.floor((a - 1) / k)));
    return { prompt: `Starter: ${a}/${e} - ${b}/${d} = __/${e}`, answer: String(a - b * k) };
}

function practiceY6(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['order', 'mixedadd'] as const);
    const form = deck.take();
    if (form === 'order') {
        // Order three fractions over one common denominator c ≤ 12; the
        // printed order is shuffled, the answer is smallest-first.
        const cc = pickSafe(rng, caps.denSet.filter((x) => x >= 4), 4);
        const nums = new Set<number>();
        while (nums.size < 3) nums.add(rng.int(1, cc - 1));
        const list = [...nums];
        const sorted = [...list].sort((x, y) => x - y);
        return {
            prompt: `Practice: Write smallest first: ${list[0]}/${cc}, ${list[1]}/${cc}, ${list[2]}/${cc} __`,
            answer: `${sorted[0]}/${cc}, ${sorted[1]}/${cc}, ${sorted[2]}/${cc}`,
            wideBlanks: true
        };
    }
    // Mixed-numeral addition with like denominators (no regrouping).
    const d = drawDen(rng, caps);
    const a = rng.int(1, d - 2);
    const b = rng.int(1, d - 1 - a);
    const m1 = rng.int(1, 3);
    const m2 = rng.int(1, 3);
    return {
        prompt: `Practice: ${m1} ${a}/${d} + ${m2} ${b}/${d} = __`,
        answer: `${m1 + m2} ${a + b}/${d}`
    };
}

function challengeY6(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['mixedrel', 'halfof'] as const);
    const form = deck.take();
    if (form === 'mixedrel') {
        // Mixed numerals with related fractional parts: m1 a/d + m2 b/e over e.
        const pair = drawRelatedPair(rng, caps) ?? [2, 4];
        const [d, e] = pair;
        const k = e / d;
        const a = rng.int(1, d - 1);
        const b = rng.int(1, e - a * k - 1);
        const m1 = rng.int(1, 3);
        const m2 = rng.int(1, 3);
        const frac = a * k + b;
        // Carry into the whole part when the fractional sum reaches e.
        const whole = m1 + m2 + Math.floor(frac / e);
        const rest = frac % e;
        return {
            prompt: `Challenge: ${m1} ${a}/${d} + ${m2} ${b}/${e} = __`,
            answer: rest === 0 ? String(whole) : `${whole} ${rest}/${e}`
        };
    }
    // "Half of a/d" — the fraction-of-a-fraction stretch (answer over 2d).
    const d = drawDen(rng, caps);
    const a = rng.int(1, d - 1);
    return { prompt: `Challenge: Half of ${a}/${d} of a cake is __/${2 * d} of the cake.`, answer: String(a) };
}

// Dispatch one tier item by the grade's year tier (3..6). The catalogue only
// offers this plugin on Years 3..6, so yearLevel is always in range here.
function tierItem(rng: Rng, caps: Caps, tier: 'starter' | 'practice' | 'challenge'): RawProblem {
    const level = caps.yearLevel;
    if (tier === 'starter') return level === 3 ? starterY3(rng, caps) : level === 4 ? starterY4(rng, caps) : level === 5 ? starterY5(rng, caps) : starterY6(rng, caps);
    if (tier === 'practice') return level === 3 ? practiceY3(rng, caps) : level === 4 ? practiceY4(rng, caps) : level === 5 ? practiceY5(rng, caps) : practiceY6(rng, caps);
    return level === 3 ? challengeY3(rng, caps) : level === 4 ? challengeY4(rng, caps) : level === 5 ? challengeY5(rng, caps) : challengeY6(rng, caps);
}

// The generator: each tier block is collected through sampleUnique (distinct
// printed prompts per tier; the tier prefixes keep blocks non-colliding), then
// the document is assembled PAGE BY PAGE so every page opens with Scaffold
// work and closes with Stretch work.
function generateFractions(rng: Rng, caps: Caps, count: number): RawProblem[] {
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

// Declarative spec (exported for tests + the pins barrel).
export const fractionsSpec: WorksheetSpec = {
    id: 'fractions',
    label: 'Fractions',
    icon: '½',
    perPage: PER_PAGE,
    offered: (grade: GradeConfig) => grade.available.includes('fractions'),
    // Scope doubles as the in-app curriculum pointer (T4): the AC9 code band
    // for the CURRENT year rides in the toolbar/sheet subtitle.
    scope: (grade: GradeConfig) => {
        const level = grade.caps.yearLevel;
        if (level === 3) return 'unit fractions, halves to tenths (AC9M3N02)';
        if (level === 4) return 'equivalent fractions & fraction-decimal links (AC9M4N01, N03-04)';
        if (level === 5) return 'compare & add/subtract related fractions (AC9M5N03-05)';
        return 'ordering & related-fraction +/− incl. mixed numerals (AC9M6N03-04)';
    },
    generate: generateFractions
};

// The plugin factory the dashboard loads.
export function FractionsWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(fractionsSpec);
}
