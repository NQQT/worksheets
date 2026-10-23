// Unit tests for the MEASUREMENT worksheet plugin.
//
// Deterministic pins from seedFrom([grade.id, 'measure', 0]). Depth design:
// six connected items per page (was twelve) mixing direct comparisons with
// ratio, ordering-extremes, trips-reasoning, metre-gap and unit-sense items.
// The correctness suite re-derives every answer from the printed prompt
// against the item value table across a 10-page document.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, generateDocument, createRng } from '../../framework';
import { measureSpec } from './MeasurementWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(measureSpec, grade, seedFrom([grade.id, measureSpec.id, 0]));
}

// Item value table mirrored from the plugin (len cm / mass g / cap mL).
const ITEMS: Record<string, { len: number; mass: number; cap: number }> = {
    finger: { len: 5, mass: 0, cap: 0 },
    crayon: { len: 10, mass: 5, cap: 0 },
    pencil: { len: 15, mass: 10, cap: 0 },
    notebook: { len: 22, mass: 200, cap: 0 },
    ruler: { len: 30, mass: 25, cap: 0 },
    table: { len: 75, mass: 8000, cap: 0 },
    door: { len: 200, mass: 30000, cap: 0 },
    apple: { len: 0, mass: 150, cap: 0 },
    'water bottle': { len: 0, mass: 500, cap: 1000 },
    book: { len: 0, mass: 600, cap: 0 },
    cat: { len: 0, mass: 4000, cap: 0 },
    'bowling ball': { len: 0, mass: 6500, cap: 0 },
    spoon: { len: 0, mass: 8, cap: 15 },
    cup: { len: 0, mass: 50, cap: 250 },
    bucket: { len: 0, mass: 170, cap: 5000 },
    tank: { len: 0, mass: 0, cap: 100000 }
};
const FIELD: Record<string, 'len' | 'mass' | 'cap'> = { length: 'len', mass: 'mass', capacity: 'cap' };
const NAMES = Object.keys(ITEMS).join('|').replace(/ /g, '\\s');

type P = { prompt: string; answer: string };

// Re-derive the expected answer from the printed prompt alone.
function expectedAnswer(p: P): string | null {
    let m: RegExpMatchArray | null;
    // Direct comparison: the item with the BIGGER field value wins.
    if ((m = p.prompt.match(new RegExp(`^Which is longer: the (${NAMES}) or the (${NAMES})\\?$`)))) {
        return ITEMS[m[1]].len > ITEMS[m[2]].len ? m[1] : m[2];
    }
    if ((m = p.prompt.match(new RegExp(`^Which is heavier: the (${NAMES}) or the (${NAMES})\\?$`)))) {
        return ITEMS[m[1]].mass > ITEMS[m[2]].mass ? m[1] : m[2];
    }
    if ((m = p.prompt.match(new RegExp(`^Which holds more: the (${NAMES}) or the (${NAMES})\\?$`)))) {
        return ITEMS[m[1]].cap > ITEMS[m[2]].cap ? m[1] : m[2];
    }
    // Ratio: bigger name + integer iteration count (must divide exactly).
    if ((m = p.prompt.match(new RegExp(`^A (${NAMES}) is about (\\d+) cm long\\. A (${NAMES}) is about (\\d+) cm long\\.\\n\\(a\\) Which is longer: the \\3 or the \\1\\? __\\n\\(b\\) About how many \\3s long is a \\1\\? __$`)))) {
        const big = +m[2], small = +m[4];
        if (big % small !== 0) return null;
        return `${m[1]}, ${big / small}`;
    }
    // Ordering extremes: least AND greatest of three by the named attribute.
    if ((m = p.prompt.match(new RegExp(`^The (${NAMES}), the (${NAMES}) and the (${NAMES}) are compared by (length|mass|capacity)\\.\\n\\(a\\) Which .+\\? __\\n\\(b\\) Which .+\\? __$`)))) {
        const f = FIELD[m[4]];
        const sorted = [m[1], m[2], m[3]].sort((x, y) => ITEMS[x][f] - ITEMS[y][f]);
        return `${sorted[0]}, ${sorted[2]}`;
    }
    // Trips: the SMALLER carrying unit needs MORE trips; then holds-more.
    if ((m = p.prompt.match(new RegExp(`^You empty the full (${NAMES}) using a (${NAMES}) or a (${NAMES})\\.\\n\\(a\\) Which needs MORE trips: the \\2 or the \\3\\? __\\n\\(b\\) Which holds more: the \\3 or the \\2\\? __$`)))) {
        const a = m[2], b = m[3];
        if (ITEMS[a].cap === ITEMS[b].cap) return null;
        const smaller = ITEMS[a].cap < ITEMS[b].cap ? a : b;
        const bigger = smaller === a ? b : a;
        return `${smaller}, ${bigger}`;
    }
    // Metre gap (Y2): shorter/longer than 100 cm AND the cm gap.
    if ((m = p.prompt.match(new RegExp(`^A (${NAMES}) is about (\\d+) cm long\\.\\n\\(a\\) Is it longer or shorter than a metre\\? __\\n\\(b\\) How many cm (shorter|longer) than a metre is it\\? __$`)))) {
        const len = +m[2];
        const shorter = len < 100;
        if ((shorter ? 'shorter' : 'longer') !== m[3]) return null;
        return `${shorter ? 'shorter' : 'longer'}, ${Math.abs(100 - len)}`;
    }
    // Unit sense (Y2): the cm option is the sensible one.
    if ((m = p.prompt.match(new RegExp(`^Which is about right for the length of a (${NAMES}): (\\d+) cm, \\2 m or \\2 kg\\? __$`)))) {
        return `${m[2]} cm`;
    }
    return null;
}

describe('measurement plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, prose layout and reduced page size', () => {
        expect(measureSpec.id).toBe('measure');
        expect(measureSpec.label).toBe('Measurement');
        expect(measureSpec.icon).toBe('↔');
        expect(measureSpec.singleColumn).toBe(true);
        // Density regression: four connected items per page (was 12, then 6)
        // — six wrapped prompt lines clip a 6-row page (T3M3 — see
        // plugins/layout-capacity.test.ts).
        expect(measureSpec.perPage).toBe(4);
    });

    it('describes its scope from the metric capability', () => {
        expect(measureSpec.scope(g1)).toBe('informal units');
        expect(measureSpec.scope(g2)).toBe('informal & metric units');
    });
});

describe('measurement — availability gating', () => {
    it('Prep does not offer measurement (empty sheet)', () => {
        expect(sheet(g0)).toEqual([]);
    });

    it('Year 1 never sees the metric-only items', () => {
        const doc = generateDocument(measureSpec, g1, seedFrom([1, 'measure', 0]), 10);
        for (const p of doc.pages.flat()) {
            expect(p.prompt).not.toContain('metre');
            expect(p.prompt).not.toContain('kg');
        }
    });
});

describe('measurement — Year 1', () => {
    it('matches the exact sheet (answers correct against the value table)', () => {
        expect(sheet(g1)).toEqual([
            {"prompt":"Which is longer: the notebook or the door?","answer":"door","id":1,"type":"measure"},
            {"prompt":"You empty the full tank using a bucket or a cup.\n(a) Which needs MORE trips: the bucket or the cup? __\n(b) Which holds more: the cup or the bucket? __","answer":"cup, bucket","id":2,"type":"measure"},
            {"prompt":"Which is heavier: the apple or the door?","answer":"door","id":3,"type":"measure"},
            {"prompt":"A ruler is about 30 cm long. A crayon is about 10 cm long.\n(a) Which is longer: the crayon or the ruler? __\n(b) About how many crayons long is a ruler? __","answer":"ruler, 3","id":4,"type":"measure"},
        ]);
    });
});

describe('measurement — Year 2', () => {
    it('matches the exact sheet (ordering grammar is complete)', () => {
        expect(sheet(g2)).toEqual([
            {"prompt":"Which is heavier: the door or the crayon?","answer":"door","id":1,"type":"measure"},
            {"prompt":"A pencil is about 15 cm long. A finger is about 5 cm long.\n(a) Which is longer: the finger or the pencil? __\n(b) About how many fingers long is a pencil? __","answer":"pencil, 3","id":2,"type":"measure"},
            {"prompt":"Which holds more: the tank or the cup?","answer":"tank","id":3,"type":"measure"},
            {"prompt":"The pencil, the notebook and the crayon are compared by length.\n(a) Which is the shortest? __\n(b) Which is the longest? __","answer":"crayon, notebook","id":4,"type":"measure"},
        ]);
    });
});

describe('measurement — correctness, depth and determinism regression (10 pages)', () => {
    for (const grade of [g1, g2]) {
        const problems = generateDocument(measureSpec, grade, seedFrom([grade.id, 'measure', 0]), 10).pages.flat();
        it(`Year ${grade.id}: every answer re-derived from its prompt`, () => {
            for (const p of problems) {
                const exp = expectedAnswer(p);
                expect(exp, `unrecognised prompt: ${p.prompt}`).not.toBeNull();
                expect(p.answer).toBe(exp);
            }
        });
        it(`Year ${grade.id}: ≥40% of items are connected multi-part tasks`, () => {
            const multi = problems.filter((p) => p.prompt.includes('(a)') && p.prompt.includes('(b)')).length;
            expect(multi / problems.length).toBeGreaterThanOrEqual(0.4);
        });
        it(`Year ${grade.id}: ordering prompts are grammatical ("Which is the …?"/"Which holds …?")`, () => {
            for (const p of problems) {
                if (p.prompt.includes('are compared by')) {
                    const [a, b] = p.prompt.split('\n').slice(1);
                    expect(a).toMatch(/^\(a\) Which (is the \w+|holds the \w+)\? __$/);
                    expect(b).toMatch(/^\(b\) Which (is the \w+|holds the \w+)\? __$/);
                }
            }
        });
        it(`Year ${grade.id}: page 1 never repeats; ASCII-only; deterministic`, () => {
            const page1 = generateSheet(measureSpec, grade, seedFrom([grade.id, 'measure', 0]));
            expect(new Set(page1.map((p) => p.prompt)).size).toBe(page1.length);
            for (const p of problems) expect(p.prompt).toMatch(/^[ -~\n]+$/);
            const seed = seedFrom([grade.id, 'measure', 0]);
            expect(measureSpec.generate(createRng(seed), grade.caps, 40)).toEqual(measureSpec.generate(createRng(seed), grade.caps, 40));
        });
    }
});
