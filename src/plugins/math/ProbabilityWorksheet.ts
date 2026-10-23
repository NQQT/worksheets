// ─────────────────────────────────────────────────────────────────────────────
// PROBABILITY WORKSHEET — self-contained plugin (T4 expansion).
//
// YEAR-TIERED STRAND (Australian Curriculum v9-informed, codes in readme.md):
//   Year 3  describing outcomes of chance experiments as certain / likely /
//           unlikely / impossible and comparing which bag is easier (AC9M3SP01-02).
//   Year 4  linking section counts to chance words and judging whether a
//           two-player game is fair (AC9M4SP02-03).
//   Year 5  expressing chance as a fraction, comparing two bags, and the
//           complement "not" (AC9M5SP01-03).
//   Year 6  equally-likely outcomes (dice), fractions in simplest form, and
//           chance as a percentage (AC9M6SP02).
//
// SCAFFOLDED LEARNING SEQUENCE (R4): printed "Starter:/Practice:/Challenge:"
// tier prefixes, 2+4+2 per page (sentence-style prompts, 8 to a sheet).
//
// EXACT BY CONSTRUCTION: every chance word is DERIVED from the drawn section
// counts (compare vs half), never asserted; fractions are built from real
// marble counts (favourable/total), and the Y6 simplest-form items are built
// by SCALING a reduced fraction up, so the printed counts and the reduced
// answer are two views of one exact ratio. Percentages only use totals that
// divide 100, so the percent answer is always a whole number.
//
// Self-contained: delete file + index line to remove the worksheet.
// ─────────────────────────────────────────────────────────────────────────────

import type { Caps, DashboardFramework, DashboardPlugin, GradeConfig, RawProblem, Rng, WorksheetSpec } from '../../framework';
import { createDeck, sampleUnique } from '../../framework';

// Eight chance sentences per A4, two columns (four grid rows).
const PER_PAGE = 8;
const S_COUNT = 2;
const P_COUNT = 4;
const C_COUNT = 2;

const COLOURS = ['red', 'blue', 'green', 'yellow'] as const;

// "1 marble" vs "3 marbles" — drawn counts of 1 must not print a plural.
function noun(n: number, singular: string): string {
    return n === 1 ? singular : `${singular}s`;
}

// Euclid's gcd — the Y6 simplest-form items reduce their drawn ratio with
// it, so the printed fraction answer is always coprime (T8: without this a
// drawn 2/4 scaled to "6 of 12" printed the non-reduced answer "2/4").
function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

// The chance word for s winning sections out of t (exact comparison, never a
// drawn guess): 0 → impossible, all → certain, vs half → unlikely/even/likely.
function chanceWord(s: number, t: number): string {
    if (s === 0) return 'impossible';
    if (s === t) return 'certain';
    if (s * 2 < t) return 'unlikely';
    if (s * 2 === t) return 'even';
    return 'likely';
}

// Draw a two-colour bag: winning colour count w out of total t (1..t-1).
function drawBag(rng: Rng, t: number): { colour: string; other: string; w: number } {
    const [c1, c2] = rng.int(0, COLOURS.length - 1) === 0 ? [COLOURS[0], COLOURS[1]] : [COLOURS[1], COLOURS[0]];
    return { colour: c1, other: c2, w: rng.int(1, t - 1) };
}

// ── Year 3 (AC9M3SP01-02): certain / likely / unlikely / impossible ─────────
function starterY3(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['certain', 'impossible'] as const);
    const form = deck.take();
    const [c1, c2] = [COLOURS[0], COLOURS[1]];
    if (form === 'certain') {
        const n = rng.int(3, 9);
        return {
            prompt: `Starter: A bag holds ${n} ${c1} marbles and no others. Picking a ${c1} marble is certain, possible or impossible? __`,
            answer: 'Certain',
            wideBlanks: true
        };
    }
    const n = rng.int(3, 9);
    return {
        prompt: `Starter: A bag holds ${n} ${c1} marbles and no ${c2} marbles. Picking a ${c2} marble is certain, possible or impossible? __`,
        answer: 'Impossible',
        wideBlanks: true
    };
}

function practiceY3(rng: Rng): RawProblem {
    // Strong majority (6-9 vs 4-1 style) so "likely" is unambiguous.
    const bag = drawBag(rng, 10);
    const w = rng.int(6, 9);
    return {
        prompt: `Practice: A bag has ${w} ${bag.colour} and ${10 - w} ${bag.other} marbles. Picking a ${bag.colour} marble is likely or unlikely? __`,
        answer: 'Likely',
        wideBlanks: true
    };
}

function challengeY3(rng: Rng): RawProblem {
    // Which bag makes picking the colour easier — compare same-colour counts.
    // Wider draws (6..9 vs 1..4) keep the 100-page print run varied.
    const a = rng.int(6, 9);
    const b = rng.int(1, 4);
    const [c1, c2] = [COLOURS[2], COLOURS[3]];
    return {
        prompt: `Challenge: Bag A has ${a} ${c1} and ${10 - a} ${c2}. Bag B has ${b} ${c1} and ${10 - b} ${c2}. Picking a ${c1} is easier from __`,
        answer: 'Bag A',
        wideBlanks: true
    };
}

// ── Year 4 (AC9M4SP02-03): spinners & fairness ──────────────────────────────
function starterY4(rng: Rng): RawProblem {
    // Spinner sections → the matching chance word (derived, not drawn).
    // Four totals × six section choices keep the word families (unlikely /
    // even / likely / certain-adjacent) all reachable across the sheet.
    const t = rng.pick([6, 8, 10, 12] as const);
    const s = rng.pick([1, 2, 3, Math.floor(t / 2) - 1, Math.floor(t / 2) + 1, t - 1] as const);
    const word = chanceWord(s, t);
    const cap = word.charAt(0).toUpperCase() + word.slice(1);
    return {
        prompt: `Starter: A spinner has ${s} ${COLOURS[0]} ${noun(s, 'section')} out of ${t}. Stopping on ${COLOURS[0]} is __`,
        answer: cap,
        wideBlanks: true
    };
}

function practiceY4(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['fair', 'better'] as const);
    const form = deck.take();
    if (form === 'fair') {
        // Fair game: equal sections for two players → fair; unequal → unfair.
        // (Rng has no bool helper — int(0,1) is the coin flip.)
        const fair = rng.int(0, 1) === 0;
        const t = 8;
        const a = fair ? 4 : rng.pick([2, 3, 5, 6] as const);
        return {
            prompt: `Practice: A spinner with ${t} equal sections: ${a} win for Ava and ${t - a} win for Ben. Is this game fair or unfair? __`,
            answer: fair ? 'Fair' : 'Unfair',
            wideBlanks: true
        };
    }
    // Better chance: two spinners, unequal green fractions (exact compare —
    // cross-multiply with integers, never float division).
    const a = rng.int(1, 5);
    let b = rng.int(1, 7);
    if (a * 8 === b * 6) b += 1; // avoid the 3/6 = 4/8 tie
    const winner = a * 8 > b * 6 ? 'Spinner A' : 'Spinner B';
    return {
        prompt: `Practice: Spinner A has ${a} ${COLOURS[0]} ${noun(a, 'section')} of 6; spinner B has ${b} of 8. Better chance of ${COLOURS[0]}: __`,
        answer: winner,
        wideBlanks: true
    };
}

function challengeY4(rng: Rng): RawProblem {
    // Order three spinners by chance of green, lowest first (exact compare).
    const specs = [2, 4, 6].map((s) => ({ s, t: 8 }));
    const sorted = [...specs].sort((x, y) => x.s - y.s);
    const labels = shuffledLabels(rng);
    const shown = specs.map((sp, i) => `${labels[i]}: ${sp.s} of ${sp.t}`);
    const answer = sorted.map((sp) => labels[specs.indexOf(sp)]).join(', ');
    return {
        prompt: `Challenge: Smallest chance of green first: ${shown.join(', ')} __`,
        answer,
        wideBlanks: true
    };
}

// Three distinct spinner labels for the ordering item.
function shuffledLabels(rng: Rng): string[] {
    const labels = ['A', 'B', 'C'];
    for (let i = 2; i > 0; i--) {
        const j = rng.int(0, i);
        [labels[i], labels[j]] = [labels[j], labels[i]];
    }
    return labels;
}

// ── Year 5 (AC9M5SP01-03): chance as a fraction & complements ───────────────
function starterY5(rng: Rng): RawProblem {
    // Word from counts (same derivation as Y4, now as revision).
    const t = rng.pick([6, 10, 12] as const);
    const s = rng.pick([1, 2, Math.floor(t / 2) + 1, t - 1] as const);
    const word = chanceWord(s, t);
    return {
        prompt: `Starter: A bag has ${s} ${COLOURS[0]} ${noun(s, 'marble')} out of ${t}. Picking ${COLOURS[0]} is certain, likely, even, unlikely or impossible? __`,
        answer: word.charAt(0).toUpperCase() + word.slice(1),
        wideBlanks: true
    };
}

function practiceY5(rng: Rng): RawProblem {
    // P(event) as a fraction straight from the counts.
    const t = rng.pick([6, 8, 10, 12] as const);
    const w = rng.int(1, t - 1);
    return { prompt: `Practice: A bag has ${w} ${COLOURS[0]} and ${t - w} ${COLOURS[1]} marbles. P(${COLOURS[0]}) = __`, answer: `${w}/${t}` };
}

function challengeY5(rng: Rng): RawProblem {
    // Complement: P(not colour) from the same counts.
    const t = rng.pick([6, 8, 10, 12] as const);
    const w = rng.int(1, t - 1);
    return {
        prompt: `Challenge: A bag has ${w} ${COLOURS[0]} and ${t - w} ${COLOURS[1]} marbles. P(NOT ${COLOURS[0]}) = __`,
        answer: `${t - w}/${t}`
    };
}

// ── Year 6 (AC9M6SP02): equally likely outcomes, simplest form, percent ─────
function starterY6(rng: Rng): RawProblem {
    // Fair die: equally likely outcomes → fraction favourable/sides.
    // Sides stay 4 or 6 (a "2-sided die" would be nonsense prose).
    const faces = rng.pick([2, 3] as const);
    const kind = rng.pick(['exact', 'under'] as const);
    if (kind === 'exact') {
        return { prompt: `Starter: A fair ${faces * 2}-sided die is rolled. P(rolling a ${faces}) = __`, answer: `1/${faces * 2}` };
    }
    const low = rng.int(1, 3);
    return {
        prompt: `Starter: A fair 6-sided die is rolled. P(rolling less than ${low + 1}) = __`,
        answer: `${low}/6`
    };
}

function practiceY6(rng: Rng): RawProblem {
    // Percent chance: totals that divide 100 keep the answer whole.
    const t = rng.pick([2, 4, 5, 10, 20, 25, 50] as const);
    const w = rng.int(1, t - 1);
    return {
        prompt: `Practice: A spinner has ${w} ${COLOURS[0]} ${noun(w, 'section')} out of ${t}. P(${COLOURS[0]}) as a percentage is __`,
        answer: `${(w * 100) / t}%`
    };
}

function challengeY6(rng: Rng): RawProblem {
    // Simplest form: draw a ratio, REDUCE it by its gcd, THEN scale the
    // reduced parts up into real counts — printed counts and reduced answer
    // are one exact ratio, and the answer is coprime by construction (T8:
    // the old draw could print "6 out of 12" with answer "2/4").
    const g0 = rng.pick([2, 3, 4, 5] as const);
    let n = rng.int(1, g0 - 1);
    let g = g0;
    const d = gcd(n, g);
    n /= d;
    g /= d;
    const k = rng.int(2, 4);
    const w = n * k;
    const t = g * k;
    return {
        prompt: `Challenge: A bag has ${w} ${COLOURS[0]} marbles out of ${t}. P(${COLOURS[0]}) in simplest form is __`,
        answer: `${n}/${g}`
    };
}

function tierItem(rng: Rng, caps: Caps, tier: 'starter' | 'practice' | 'challenge'): RawProblem {
    const level = caps.yearLevel;
    if (tier === 'starter') return level === 3 ? starterY3(rng) : level === 4 ? starterY4(rng) : level === 5 ? starterY5(rng) : starterY6(rng);
    if (tier === 'practice') return level === 3 ? practiceY3(rng) : level === 4 ? practiceY4(rng) : level === 5 ? practiceY5(rng) : practiceY6(rng);
    return level === 3 ? challengeY3(rng) : level === 4 ? challengeY4(rng) : level === 5 ? challengeY5(rng) : challengeY6(rng);
}

// Page-by-page scaffold→core→stretch assembly (shared T4 rationale).
function generateProbability(rng: Rng, caps: Caps, count: number): RawProblem[] {
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

export const probabilitySpec: WorksheetSpec = {
    id: 'probability',
    label: 'Probability',
    icon: '⚂',
    perPage: PER_PAGE,
    offered: (grade: GradeConfig) => grade.available.includes('probability'),
    scope: (grade: GradeConfig) => {
        const level = grade.caps.yearLevel;
        if (level === 3) return 'certain, likely & unlikely (AC9M3SP01-02)';
        if (level === 4) return 'spinners & fair games (AC9M4SP02-03)';
        if (level === 5) return 'chance as fractions (AC9M5SP01-03)';
        return 'fractions, simplest form & percent (AC9M6SP02)';
    },
    generate: generateProbability
};

export function ProbabilityWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(probabilitySpec);
}
