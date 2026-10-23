// Unit tests for the framework's PRIVATE legacy catalogues (the migration
// adapters behind the difficulty model).
//
// The catalogue is the generator-facing configuration: labels, implemented
// flags, per-grade caps and which worksheet ids each grade offers. Every
// worksheet plugin's gating and generator caps read these lists, so they are
// pinned EXACTLY here (including available-list ORDER — the picker keeps
// catalogue order, so a re-sorted list would silently re-order the dropdown).
//
// UNION NOTES (vs the two source apps' grades.test.ts):
//   - the caps objects now carry BOTH subjects' knobs; a grade config pins
//     the other subject's knobs at their neutral zeros (the generators never
//     read them);
//   - the legacy Year-11 senior entry keeps its six ids in `available` but
//     its yearLevel is the FULL ladder rung (3) — the difficulty adapter
//     derives per-rung configs from it (framework/difficulty.ts).

import { describe, it, expect } from 'vitest';
import {
    ENGLISH_GRADES,
    getEnglishGradeConfig,
    getMathGradeConfig,
    getScienceGradeConfig,
    MATH_GRADES,
    SCIENCE_GRADES
} from './catalogue';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);
const g3 = getMathGradeConfig(3);

// Neutral caps shared by every maths grade config (the english knobs, all
// inert) — spread into each toEqual pin below.
const NEUTRAL_ENGLISH_KNOBS = { wordTier: 0, sentenceLen: 0, tricky: false, level: 0 };

describe('math catalogue', () => {
    it('lists grades 0..12 with Prep / Year N labels', () => {
        const labels = getMathGradeConfig(0).label + '|' + getMathGradeConfig(12).label;
        expect(labels).toBe('Prep|Year 12');
        // Grades 0..6 have real content (0..2 full catalogue, Year 3's
        // extensions and the 3..6 arithmetic ladder); the legacy Year 11
        // entry backs the senior ladder; 7/8/9/10/12 remain placeholders.
        expect(g0.implemented).toBe(true);
        expect(g1.implemented).toBe(true);
        expect(g2.implemented).toBe(true);
        expect(getMathGradeConfig(3).implemented).toBe(true);
        expect(getMathGradeConfig(6).implemented).toBe(true);
        expect(getMathGradeConfig(7).implemented).toBe(false);
        expect(getMathGradeConfig(11).implemented).toBe(true);
        expect(getMathGradeConfig(12).implemented).toBe(false);
    });

    it('grade 3 offers the exact ordered arithmetic, spatial and T4-strand catalogue', () => {
        // 'transformations' is the separate shape-flip / 90-degree rotation
        // plugin, not 'shapes'. T4 expansion: five upper-primary strands
        // append AFTER the original five-entry rail.
        expect(g3).toEqual({
            id: 3,
            short: '3',
            label: 'Year 3',
            implemented: true,
            available: ['addition', 'subtraction', 'mult', 'transformations', 'compass',
                'fractions', 'metricconv', 'statistics', 'probability', 'algebra'],
            caps: {
                opCap: 1000,
                addendCap: 2,
                numCap: 0,
                wordCap: 0,
                skipCap: 0,
                skipSet: [],
                multCap: 10,
                doubleCap: 0,
                bondCap: 0,
                patSet: [],
                shapeSet: [],
                clockCap: 0,
                metricCap: 0,
                pvCap: 0,
                dataCap: 0,
                coinCap: 0,
                tempCap: 0,
                // T4 upper-primary caps: Y3 gets unit fractions halves..tenths
                // and no decimals/area work yet (plugins/math/FractionsWorksheet).
                yearLevel: 3,
                denSet: [2, 3, 4, 5, 10],
                decPlaces: 0,
                areaSideCap: 0,
                ...NEUTRAL_ENGLISH_KNOBS
            }
        });
    });

    it.each([
        // [id, opCap, addendCap, available, decPlaces, areaSideCap]
        [4, 10000, 3, ['addition', 'subtraction', 'fractions', 'decimals', 'multidiv',
            'perimeterarea', 'metricconv', 'statistics', 'probability', 'algebra'], 2, 20],
        [5, 100000, 3, ['addition', 'subtraction', 'fractions', 'decimals', 'percent',
            'multidiv', 'perimeterarea', 'metricconv', 'statistics', 'probability', 'algebra'], 3, 100],
        [6, 1000000, 4, ['addition', 'subtraction', 'fractions', 'decimals', 'percent',
            'multidiv', 'perimeterarea', 'metricconv', 'statistics', 'probability', 'algebra'], 3, 1000]
    ])('grade %i preserves its complete T4-expanded configuration', (id, opCap, addendCap, available, decPlaces, areaSideCap) => {
        // Year 3's extra ids (mult/transformations/compass) must not leak
        // through the shared arithmeticLadderGrade helper; percent joins at
        // Year 5 (AC9M5N04). multCap 100 is the MULTIDIV operand ceiling for
        // Years 4..6 (plugins/math/MultiplyDivideWorksheet.ts).
        expect(getMathGradeConfig(id)).toEqual({
            id,
            short: String(id),
            label: `Year ${id}`,
            implemented: true,
            available,
            caps: {
                opCap,
                addendCap,
                numCap: 0,
                wordCap: 0,
                skipCap: 0,
                skipSet: [],
                multCap: 100,
                doubleCap: 0,
                bondCap: 0,
                patSet: [],
                shapeSet: [],
                clockCap: 0,
                metricCap: 0,
                pvCap: 0,
                dataCap: 0,
                coinCap: 0,
                tempCap: 0,
                yearLevel: id,
                denSet: [2, 3, 4, 5, 6, 8, 10, 12],
                decPlaces,
                areaSideCap,
                ...NEUTRAL_ENGLISH_KNOBS
            }
        });
    });

    it('grade 7 and above (except the legacy senior entry) still offer nothing', () => {
        // Years 7..10 and 12 remain placeholders; the legacy Year 11 config
        // backs the senior ladder and is pinned by the next test.
        for (const id of [7, 8, 9, 10, 12]) {
            const grade = getMathGradeConfig(id);
            expect(grade.implemented).toBe(false);
            expect(grade.available).toEqual([]);
            expect(grade.caps.opCap).toBe(0);
        }
    });

    it('the legacy senior entry lists the six independent families with the FULL rung marker', () => {
        // In the merged app the six senior families scale on their OWN
        // ladder: resolveDifficulty derives a per-rung config from this one,
        // overwriting yearLevel (1..3). The catalogue row itself keeps the
        // FULL rung (3) and the complete available list, so the plugins'
        // offered() checks keep working at every rung.
        expect(getMathGradeConfig(11)).toEqual({
            id: 11,
            short: '11',
            label: 'Year 11',
            implemented: true,
            available: ['calculus', 'functions', 'polynomials', 'trigonometry', 'expolog', 'prob11'],
            caps: {
                opCap: 0,
                addendCap: 0,
                numCap: 0,
                wordCap: 0,
                skipCap: 0,
                skipSet: [],
                multCap: 0,
                doubleCap: 0,
                bondCap: 0,
                patSet: [],
                shapeSet: [],
                clockCap: 0,
                metricCap: 0,
                pvCap: 0,
                dataCap: 0,
                coinCap: 0,
                tempCap: 0,
                yearLevel: 3,
                denSet: [],
                decPlaces: 0,
                areaSideCap: 0,
                ...NEUTRAL_ENGLISH_KNOBS
            }
        });
    });

    it('MATH_GRADES lists P then Years 1..12 in ascending legacy order', () => {
        // The catalogue array must stay in ascending id order (the difficulty
        // adapter scans it; the legacy header rail mapped it in array order).
        expect(MATH_GRADES.map((g) => g.id)).toEqual(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        );
        expect(MATH_GRADES.map((g) => g.short)).toEqual(
            ['P', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
        );
        expect(MATH_GRADES.map((g) => g.label)).toEqual(
            ['Prep', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
                'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12']
        );
    });

    it('Prep offers the four foundation worksheets only', () => {
        expect([...g0.available].sort()).toEqual(
            ['addition', 'comparison', 'counting', 'subtraction'].sort()
        );
    });

    it('grade 1 offers the full original catalogue plus the eleven extension types', () => {
        expect([...g1.available].sort()).toEqual(
            [
                'addition',
                'bonds',
                'compass',
                'comparison',
                'counting',
                'data',
                'doubles',
                'measure',
                'missing',
                'patterns',
                'placevalue',
                'rowscolumns',
                'shapes',
                'skip',
                'subtraction',
                'temperature',
                'time',
                'word'
            ].sort()
        );
    });

    it('grade 2 adds times tables, division and Australian coins (22 types total)', () => {
        // Year 2 is the first grade with times tables AND the only grade with
        // division / coins & money. It is also the only grade with clock
        // faces (reading + drawing hands) and the only counting-bridge grade
        // with the rows-columns multiplication form.
        expect([...g2.available].sort()).toEqual(
            [
                'addition',
                'bonds',
                'clock',
                'compass',
                'comparison',
                'counting',
                'data',
                'division',
                'doubles',
                'measure',
                'missing',
                'money',
                'mult',
                'patterns',
                'placevalue',
                'rowscolumns',
                'shapes',
                'skip',
                'subtraction',
                'temperature',
                'time',
                'word'
            ].sort()
        );
        expect(g2.available).toContain('mult');
        expect(g1.available).not.toContain('mult');
        expect(g0.available).not.toContain('mult');
        expect(g1.available).not.toContain('division');
        expect(g1.available).not.toContain('money');
        // Years 2 and 3 retain the same tables to 10; the other extension
        // caps are grade-specific (Y2 doubles to 20, coins to 100c,
        // temperature to 40°C while Year 1 keeps its within-20 sheet).
        expect(g2.caps.multCap).toBe(10);
        expect(g3.caps.multCap).toBe(10);
        expect(g1.caps.multCap).toBe(0);
        expect(g2.caps.doubleCap).toBe(20);
        expect(g1.caps.doubleCap).toBe(10);
        expect(g2.caps.clockCap).toBe(12);
        expect(g1.caps.clockCap).toBe(0);
        expect(g2.caps.coinCap).toBe(100);
        expect(g1.caps.coinCap).toBe(0);
        expect(g2.caps.tempCap).toBe(40);
        expect(g1.caps.tempCap).toBe(20);
        expect(g0.caps.tempCap).toBe(0);
    });

    it('falls back to the legacy Year 1 for unknown ids (the source fallback contract)', () => {
        expect(getMathGradeConfig(99).label).toBe('Year 1');
    });
});

// ── English catalogue ────────────────────────────────────────────────────────

// The staged catalogue (cumulative): early-reading ids (shared by Y1..Y6
// lists), the Y2+ additions, then the STAGED upper-primary ladder — the
// introductory Y3 grammar set, the Y4 advanced-vocabulary pair, the
// remaining Y5 advanced trio.
const EARLY_READING = [
    'sight', 'blend', 'sounds', 'vowel', 'opposite', 'rhyme', 'sentence',
    'letters', 'capital', 'punct', 'homophone', 'plural', 'similar', 'wordgap', 'spelling'
];
const Y2_EXTRA = ['syllable', 'grammar', 'tense'];
// Year 3 — the introductory grammar set (clause joiners, apostrophes, comma
// lists, word building, quoted speech, pronouns).
const Y3_INTRO = ['conjunction', 'apostrophe', 'comma', 'affix', 'compound', 'speech', 'pronoun'];
// Year 3 — T5's four literacy families (reading comprehension, sentence
// crafting, writing planning/composing, editing/proofreading).
const Y3_LITERACY = ['comprehension', 'craft', 'writing', 'editing'];
// Year 4 — the first advanced vocabulary types.
const Y4_ADVANCED = ['figurative', 'homograph'];
// Year 5 — the remaining advanced set (Y6 adds no new ids).
const Y5_ADVANCED = ['idiom', 'advpunct', 'agreement'];

// Neutral caps shared by every english grade config (the maths knobs, all
// inert).
const NEUTRAL_MATH_KNOBS = {
    opCap: 0, addendCap: 0, numCap: 0, wordCap: 0, skipCap: 0, skipSet: [],
    multCap: 0, doubleCap: 0, bondCap: 0, patSet: [], shapeSet: [], clockCap: 0,
    metricCap: 0, pvCap: 0, dataCap: 0, coinCap: 0, tempCap: 0, yearLevel: 0,
    denSet: [], decPlaces: 0, areaSideCap: 0
};

describe('english catalogue', () => {
    it('covers legacy grades 0..12 (0..6 implemented, 7..12 coming-soon placeholders)', () => {
        expect(ENGLISH_GRADES.map((g) => g.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        expect(getEnglishGradeConfig(0).implemented).toBe(true);
        expect(getEnglishGradeConfig(6).implemented).toBe(true);
        expect(getEnglishGradeConfig(7).implemented).toBe(false);
        expect(getEnglishGradeConfig(12).implemented).toBe(false);
    });

    it('Prep offers the letter-awareness scope + handwriting tracing (tier-1 word set)', () => {
        // Tracing (letter/word/number) is Prep-only — Y1+ get reading/writing
        // tasks instead.
        expect(getEnglishGradeConfig(0).available).toEqual([
            'letters', 'sounds', 'vowel', 'sight', 'letterTrace', 'wordTrace', 'numberTrace'
        ]);
        expect(getEnglishGradeConfig(0).caps).toEqual({
            ...NEUTRAL_MATH_KNOBS, wordTier: 1, sentenceLen: 2, tricky: false, level: 0
        });
    });

    it('Year 1 offers the full early-reading catalogue (15 types)', () => {
        expect(getEnglishGradeConfig(1).available).toEqual([...EARLY_READING]);
        expect(getEnglishGradeConfig(1).caps).toEqual({
            ...NEUTRAL_MATH_KNOBS, wordTier: 2, sentenceLen: 4, tricky: false, level: 1
        });
    });

    it('Year 2 adds syllables, nouns/verbs and past tense (18 types, tricky set)', () => {
        expect(getEnglishGradeConfig(2).available).toEqual([...EARLY_READING, ...Y2_EXTRA]);
        expect(getEnglishGradeConfig(2).caps).toEqual({
            ...NEUTRAL_MATH_KNOBS, wordTier: 3, sentenceLen: 5, tricky: true, level: 2
        });
        // The Y2-only types are gated out of Y1 and Prep.
        expect(getEnglishGradeConfig(1).available).not.toContain('syllable');
        expect(getEnglishGradeConfig(1).available).not.toContain('grammar');
        expect(getEnglishGradeConfig(1).available).not.toContain('tense');
        expect(getEnglishGradeConfig(0).available).not.toContain('sentence');
    });

    it('Year 3 opens the introductory upper-primary set (29 types: intro Y3 grammar + T5 literacy)', () => {
        const expected = [...EARLY_READING, ...Y2_EXTRA, ...Y3_INTRO, ...Y3_LITERACY];
        expect(getEnglishGradeConfig(3).available).toEqual(expected);
        expect(getEnglishGradeConfig(3).caps).toEqual({
            ...NEUTRAL_MATH_KNOBS, wordTier: 4, sentenceLen: 7, tricky: true, level: 3
        });
        // Year 3 keeps the intro set but NOT the advanced Y4/Y5 types.
        expect(getEnglishGradeConfig(3).available).not.toContain('figurative');
        expect(getEnglishGradeConfig(3).available).not.toContain('homograph');
        expect(getEnglishGradeConfig(3).available).not.toContain('idiom');
        expect(getEnglishGradeConfig(3).available).not.toContain('advpunct');
        expect(getEnglishGradeConfig(3).available).not.toContain('agreement');
    });

    it('Year 4 adds the first advanced vocabulary types (31 types: +figurative +homograph)', () => {
        const expected = [...EARLY_READING, ...Y2_EXTRA, ...Y3_INTRO, ...Y3_LITERACY, ...Y4_ADVANCED];
        expect(getEnglishGradeConfig(4).available).toEqual(expected);
        expect(getEnglishGradeConfig(4).caps).toEqual({
            ...NEUTRAL_MATH_KNOBS, wordTier: 5, sentenceLen: 8, tricky: true, level: 4
        });
        expect(getEnglishGradeConfig(4).available).not.toContain('idiom');
        expect(getEnglishGradeConfig(4).available).not.toContain('advpunct');
        expect(getEnglishGradeConfig(4).available).not.toContain('agreement');
    });

    it('Year 5 completes the catalogue (34 types: +idiom +advpunct +agreement)', () => {
        const expected = [
            ...EARLY_READING, ...Y2_EXTRA, ...Y3_INTRO, ...Y3_LITERACY, ...Y4_ADVANCED, ...Y5_ADVANCED
        ];
        expect(getEnglishGradeConfig(5).available).toEqual(expected);
        expect(getEnglishGradeConfig(5).caps).toEqual({
            ...NEUTRAL_MATH_KNOBS, wordTier: 6, sentenceLen: 9, tricky: true, level: 5
        });
    });

    it('Year 6 keeps the full cumulative catalogue at its deepest caps', () => {
        const expected = [
            ...EARLY_READING, ...Y2_EXTRA, ...Y3_INTRO, ...Y3_LITERACY, ...Y4_ADVANCED, ...Y5_ADVANCED
        ];
        expect(getEnglishGradeConfig(6).available).toEqual(expected);
        expect(getEnglishGradeConfig(6).caps).toEqual({
            ...NEUTRAL_MATH_KNOBS, wordTier: 6, sentenceLen: 10, tricky: true, level: 6
        });
        // The advanced types never leak below their introduction year.
        expect(getEnglishGradeConfig(2).available).not.toContain('conjunction');
        expect(getEnglishGradeConfig(2).available).not.toContain('idiom');
        expect(getEnglishGradeConfig(2).available).not.toContain('agreement');
    });

    it('falls back to the legacy Year 1 for unknown ids (the source fallback contract)', () => {
        expect(getEnglishGradeConfig(99).label).toBe('Year 1');
    });
});

// ── Science catalogue (R5 — built for this target, not migrated) ─────────────

// Neutral caps shared by every science grade config: every subject knob
// inert except the single difficulty dial (yearLevel = the level rung).
const NEUTRAL_SCIENCE_KNOBS = {
    opCap: 0, addendCap: 0, numCap: 0, wordCap: 0, skipCap: 0, skipSet: [],
    multCap: 0, doubleCap: 0, bondCap: 0, patSet: [], shapeSet: [], clockCap: 0,
    metricCap: 0, pvCap: 0, dataCap: 0, coinCap: 0, tempCap: 0,
    denSet: [], decPlaces: 0, areaSideCap: 0,
    wordTier: 0, sentenceLen: 0, tricky: false, level: 0
};

// The four science worksheet ids, shared by every implemented row (ids are
// globally unique, so one shared `available` list is safe: the chemistry
// registration list only ever registers the chemistry ids).
const SCIENCE_IDS = ['elements', 'balancing', 'speed', 'circuits'];

describe('science catalogue', () => {
    it('lists grades 0..12 with exactly the 4-level implemented extent', () => {
        expect(SCIENCE_GRADES.map((g) => g.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        for (const id of [0, 1, 2, 3]) expect(getScienceGradeConfig(id).implemented).toBe(true);
        // Grades 4..12 are unimplemented selector rows — levels beyond 4
        // saturate at the level-4 caps (difficulty.ts derives maxLevel = 4).
        for (const id of [4, 5, 6, 7, 8, 9, 10, 11, 12]) {
            expect(getScienceGradeConfig(id).implemented).toBe(false);
            expect(getScienceGradeConfig(id).available).toEqual([]);
        }
    });

    it('every implemented row offers all four science ids with the rung as the dial', () => {
        for (const id of [0, 1, 2, 3]) {
            const row = getScienceGradeConfig(id);
            expect(row.available).toEqual([...SCIENCE_IDS]);
            // The generators read their difficulty from caps.yearLevel = the
            // level (= id + 1); every other knob stays neutral.
            expect(row.caps).toEqual({ ...NEUTRAL_SCIENCE_KNOBS, yearLevel: id + 1 });
        }
    });

    it('falls back to the science Year-1 row for unknown ids (the getter contract)', () => {
        expect(getScienceGradeConfig(99)).toBe(getScienceGradeConfig(1));
    });
});
