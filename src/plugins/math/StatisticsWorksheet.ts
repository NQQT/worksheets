// ─────────────────────────────────────────────────────────────────────────────
// STATISTICS WORKSHEET — self-contained plugin (T4 expansion).
//
// YEAR-TIERED STRAND (Australian Curriculum v9-informed, codes in readme.md):
//   Year 3  counting tally marks and reading simple data (votes, tables) to
//           answer "most popular / how many more" questions (AC9M3ST01-02).
//   Year 4  reading tables and finding the mode and the highest/lowest of a
//           set (AC9M4ST01-02); the RANGE challenge items are an explicit
//           EXTENSION beyond the Year 4 requirement.
//   Year 5  mode & frequency as the age-appropriate core; the mean/range
//           items are an OPTIONAL EXTENSION — AC9M5ST01-03 does not require
//           mean or range at Year 5.
//   Year 6  mode & range as the core (accepted alignment); the mean/median
//           and mean↔total items are an OPTIONAL EXTENSION — not claimed as
//           required by AC9M6ST01-03 either.
//
// SCAFFOLDED LEARNING SEQUENCE (R4): printed "Starter:/Practice:/Challenge:"
// tier prefixes, 2+4+2 per page (sentence-style prompts, 8 to a sheet).
//
// EXACT BY CONSTRUCTION: means are generated FROM the mean (values are
// mean + deviations whose sum is forced to zero), so the printed data set
// always has the stated integer mean; modes appear exactly 3 times against
// singletons, so the modal value is unique; ranges compare drawn extremes.
//
// FIGURES: only the Year 3 tally items attach a DataFigure (the small 36px
// tally strip, framework/DataDiagram.tsx). Because several tally prompts are
// identical sentences, the sampling key includes the figure JSON — same
// rationale as plugins/DataWorksheet.ts.
//
// Self-contained: delete file + index line to remove the worksheet.
// ─────────────────────────────────────────────────────────────────────────────

import type { Caps, DashboardFramework, DashboardPlugin, GradeConfig, RawProblem, Rng, WorksheetSpec } from '../../framework';
import { createDeck, sampleUnique } from '../../framework';

// Eight data-reading sentences per A4, two columns (four grid rows).
const PER_PAGE = 8;
const S_COUNT = 2;
const P_COUNT = 4;
const C_COUNT = 2;

// Kid-friendly vocabulary (duplicated per plugin — plugins never import from
// each other; see plugins/DataWorksheet.ts).
const NAMES = ['Sam', 'Mia', 'Leo', 'Zoe', 'Tom', 'Max', 'Rae', 'Kai'] as const;
const COLOURS = ['red', 'blue', 'green', 'yellow', 'pink', 'orange'] as const;
const FRUITS = ['apples', 'pears', 'bananas', 'oranges', 'plums'] as const;

// Shuffle a copy (Fisher-Yates on the rng stream — deterministic per seed).
function shuffled<T>(rng: Rng, arr: readonly T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

// Draw n DISTINCT integers in [lo, hi].
function distinctValues(rng: Rng, n: number, lo: number, hi: number): number[] {
    const set = new Set<number>();
    while (set.size < n) set.add(rng.int(lo, hi));
    return [...set];
}

// A data set whose mean is EXACTLY m: n-1 free deviations, the last forced to
// cancel the sum, so sum(values) = n*m with no rounding anywhere.
function meanSet(rng: Rng, n: number, m: number, spread: number): number[] {
    const devs: number[] = [];
    let sum = 0;
    for (let i = 0; i < n - 1; i++) {
        const d = rng.int(-spread, spread);
        devs.push(d);
        sum += d;
    }
    devs.push(-sum);
    return shuffled(rng, devs.map((d) => m + d));
}

// ── Year 3 (AC9M3ST01-02): tallies & reading simple data ────────────────────
function starterY3(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['tally', 'popular'] as const);
    const form = deck.take();
    if (form === 'tally') {
        // The tally strip IS the data; the total stays the student's count.
        const total = rng.int(3, Math.max(5, caps.dataCap));
        return {
            prompt: 'Starter: Count the tallies below. There are __ in all.',
            answer: String(total),
            data: { kind: 'tally', total }
        };
    }
    // Two categories, a strictly bigger winner (never a tie trick).
    const c1 = rng.pick(COLOURS);
    let c2 = rng.pick(COLOURS);
    if (c2 === c1) c2 = COLOURS.find((c) => c !== c1)!;
    const cap = Math.max(5, caps.dataCap);
    const a = rng.int(4, cap);
    const b = rng.int(1, a - 1);
    return { prompt: `Starter: ${a} votes for ${c1} and ${b} votes for ${c2}. The most popular colour is __`, answer: c1 };
}

function practiceY3(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['score', 'diff'] as const);
    const form = deck.take();
    const [n1, n2, n3] = shuffled(rng, NAMES.slice(0, 3));
    if (form === 'score') {
        const [a, b, c] = distinctValues(rng, 3, 2, 9);
        const top = Math.max(a, b, c);
        const who = top === a ? n1 : top === b ? n2 : n3;
        return {
            prompt: `Practice: The scores are ${n1} ${a}, ${n2} ${b} and ${n3} ${c}. The highest score belongs to __`,
            answer: who
        };
    }
    const cap = Math.max(5, caps.dataCap);
    const a = rng.int(5, cap);
    const b = rng.int(1, a - 1);
    // Capitalise the colour that starts the second sentence.
    const winner = COLOURS[0].charAt(0).toUpperCase() + COLOURS[0].slice(1);
    return { prompt: `Practice: ${a} children chose ${COLOURS[0]} and ${b} chose ${COLOURS[1]}. ${winner} got __ more votes.`, answer: String(a - b) };
}

function challengeY3(rng: Rng): RawProblem {
    // Three-row fruit table: total by column addition (values ≤ 9, sum ≤ 27).
    const [f1, f2, f3] = shuffled(rng, FRUITS.slice(0, 3));
    const [a, b, c] = [rng.int(2, 9), rng.int(2, 9), rng.int(2, 9)];
    return {
        prompt: `Challenge: A fruit table shows ${f1} ${a}, ${f2} ${b} and ${f3} ${c}. There are __ pieces of fruit in all.`,
        answer: String(a + b + c)
    };
}

// ── Year 4 (AC9M4ST01-02 core + ST03-adjacent range extension) ──────────────
function starterY4(rng: Rng): RawProblem {
    // Mode of a class vote: the modal colour appears 3 times, others once.
    const [c1, c2] = shuffled(rng, COLOURS.slice(0, 4)).slice(0, 2);
    const votes = shuffled(rng, [c1, c1, c1, c2, c2]);
    const names = shuffled(rng, NAMES.slice(0, 5));
    return {
        prompt: `Starter: ${names.map((n, i) => `${n} chose ${votes[i]}`).join(', ')}. The most popular colour is __`,
        answer: c1
    };
}

function practiceY4(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['tabletotal', 'maxmin'] as const);
    const form = deck.take();
    if (form === 'tabletotal') {
        const [f1, f2, f3] = shuffled(rng, FRUITS.slice(0, 3));
        const [a, b, c] = [rng.int(10, 40), rng.int(10, 40), rng.int(10, 40)];
        return {
            prompt: `Practice: A table shows ${f1} ${a}, ${f2} ${b} and ${f3} ${c}. The table total is __`,
            answer: String(a + b + c)
        };
    }
    const vals = distinctValues(rng, 4, 12, 48);
    return {
        prompt: `Practice: From ${vals.join(', ')}, the highest is __ and the lowest is __`,
        answer: `${Math.max(...vals)}, ${Math.min(...vals)}`
    };
}

function challengeY4(rng: Rng): RawProblem {
    // Range as "how much the data spreads" (highest − lowest, exact).
    const vals = distinctValues(rng, 4, 10, 60);
    return {
        prompt: `Challenge: The range of ${vals.join(', ')} is __`,
        answer: String(Math.max(...vals) - Math.min(...vals))
    };
}

// ── Year 5 (mode core; mean & range as optional extension) ──────────────────
function starterY5(rng: Rng): RawProblem {
    // Unique mode: one value appears 3 times, two singletons (distinct).
    const [v, s1, s2] = distinctValues(rng, 3, 10, 40);
    const data = shuffled(rng, [v, v, v, s1, s2]);
    return { prompt: `Starter: The mode of ${data.join(', ')} is __`, answer: String(v) };
}

function practiceY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['mean', 'range'] as const);
    const form = deck.take();
    if (form === 'mean') {
        // Mean generated FROM the mean (meanSet) — the answer is exact.
        const m = rng.int(12, 30);
        const data = meanSet(rng, 4, m, 4);
        return { prompt: `Practice: The mean of ${data.join(', ')} is __`, answer: String(m) };
    }
    const vals = distinctValues(rng, 5, 8, 60);
    return { prompt: `Practice: The range of ${vals.join(', ')} is __`, answer: String(Math.max(...vals) - Math.min(...vals)) };
}

function challengeY5(rng: Rng): RawProblem {
    // Mean AND range of one set (mean exact by construction, range exact).
    const m = rng.int(15, 35);
    const data = meanSet(rng, 4, m, 5);
    return {
        prompt: `Challenge: For ${data.join(', ')}, the mean is __ and the range is __`,
        answer: `${m}, ${Math.max(...data) - Math.min(...data)}`
    };
}

// ── Year 6 (mode & range core; mean/median & total link as extension) ───────
function starterY6(rng: Rng): RawProblem {
    // Five-value mean, exact by construction (larger spread than Y5).
    const m = rng.int(20, 60);
    const data = meanSet(rng, 5, m, 6);
    return { prompt: `Starter: The mean of ${data.join(', ')} is __`, answer: String(m) };
}

function practiceY6(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['median', 'range'] as const);
    const form = deck.take();
    const vals = distinctValues(rng, 5, 10, 99);
    if (form === 'median') {
        // Odd count of DISTINCT values → the median is one of them exactly.
        const sorted = [...vals].sort((a, b) => a - b);
        return { prompt: `Practice: The median of ${vals.join(', ')} is __`, answer: String(sorted[2]) };
    }
    return { prompt: `Practice: The range of ${vals.join(', ')} is __`, answer: String(Math.max(...vals) - Math.min(...vals)) };
}

function challengeY6(rng: Rng): RawProblem {
    // The mean↔total link: total = mean × count (reverse of the mean).
    const n = rng.pick([4, 5] as const);
    const m = rng.int(12, 24);
    return {
        prompt: `Challenge: The mean of ${n} scores is ${m}. The total of the ${n} scores is __`,
        answer: String(n * m)
    };
}

function tierItem(rng: Rng, caps: Caps, tier: 'starter' | 'practice' | 'challenge'): RawProblem {
    const level = caps.yearLevel;
    if (tier === 'starter') return level === 3 ? starterY3(rng, caps) : level === 4 ? starterY4(rng) : level === 5 ? starterY5(rng) : starterY6(rng);
    if (tier === 'practice') return level === 3 ? practiceY3(rng, caps) : level === 4 ? practiceY4(rng) : level === 5 ? practiceY5(rng) : practiceY6(rng);
    return level === 3 ? challengeY3(rng) : level === 4 ? challengeY4(rng) : level === 5 ? challengeY5(rng) : challengeY6(rng);
}

// Page-by-page scaffold→core→stretch assembly (shared T4 rationale).
function generateStatistics(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const pages = Math.ceil(count / PER_PAGE);
    const key = (p: RawProblem) => `${p.prompt}|${JSON.stringify(p.data ?? '')}`;
    const starter = sampleUnique(pages * S_COUNT, () => tierItem(rng, caps, 'starter'), key);
    const practice = sampleUnique(pages * P_COUNT, () => tierItem(rng, caps, 'practice'), key);
    const challenge = sampleUnique(pages * C_COUNT, () => tierItem(rng, caps, 'challenge'), key);
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

export const statisticsSpec: WorksheetSpec = {
    id: 'statistics',
    label: 'Statistics',
    icon: '▤',
    perPage: PER_PAGE,
    offered: (grade: GradeConfig) => grade.available.includes('statistics'),
    scope: (grade: GradeConfig) => {
        const level = grade.caps.yearLevel;
        if (level === 3) return 'tallies & reading simple data (AC9M3ST01-02)';
        // T8 labelling: range (Y4) and mean/median (Y5/Y6) are EXTENSIONS,
        // not requirements of the cited codes — the scope line says so.
        if (level === 4) return 'mode & tables; range extension (AC9M4ST01-03)';
        if (level === 5) return 'mode & frequency; mean/range extension (AC9M5ST01-03)';
        return 'mode & range; mean/median extension (AC9M6ST01-03)';
    },
    generate: generateStatistics
};

export function StatisticsWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(statisticsSpec);
}
