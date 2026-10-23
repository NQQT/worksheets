// NON-REPEATING SAMPLING — capacity contract for every sampling worksheet.
//
// Every generator collects its questions through the framework's sampleUnique
// (keyed on the printed prompt) over deck-dealt pools, so a worksheet never
// repeats a question until its whole question space has been dealt. This
// suite pins TWO complementary metrics at the 100-PAGE ask
// (seed seedFrom([grade.id, spec.id, 0]); ask = spec.perPage x 100):
//
//   1. PRINTED capacity — what the CHILD SEES (prompt text + displayed tile
//      order). T5E wave: every one of the 30 sampling specs now clears the
//      100-page bar at EVERY offered grade (printed capacity == ask): the
//      density drop (4-8 rows/page) plus the bank/pool expansions moved the
//      whole catalogue past a repeat-free 100 pages. A silent shrink of any
//      pool below the ask fails this test.
//
//   2. SEMANTIC capacity — the E3 "genuine variety" metric. Option ORDER is
//      cosmetic (same sentence, options shuffled = the same task), so the
//      semantic key sorts every trailing option group (and the tile order)
//      before counting. The curated finite-fact-space sheets (hand-written
//      sentence/idiom/punctuation banks) cannot reach thousands of distinct
//      TASKS, so their semantic numbers are pinned exactly: a bank edit that
//      shrinks real variety fails here even while the printed metric still
//      clears the bar. Reference (measured at the 100-page ask, post-T5E):
//      the old HEAD banks offered only 40-292 semantic tasks per 100 pages
//      on the weakest sheets (homophone 40-74, idiom 50, apostrophe 67,
//      advpunct 150, comma 180, wordgap 180-240); every pool now sits at
//      196+ with the worst curated sheet (apostrophe) at 196.
//
// QUESTION IDENTITY (printed): the prompt, plus the displayed tile order for
// early-band (Y1-Y3) Sentence Building rows — those prompts carry the bank
// in the `tileWords` scaffold metadata, not the text (see
// SentenceBuildingWorksheet.ts), so counting prompt text alone would collapse
// their space to the handful of blank-count patterns. `printedKey` mirrors
// the generators' sampleUnique keys exactly.
//
// TRACING SHEETS are deliberately NOT in this suite: their pools are finite
// by nature (26 letters, 26 words, 10 digits). They deal from seeded decks
// so repeats spread evenly and every page is a different group — long
// documents repeat shapes by design (repeated practice), and no capacity
// figure pretends otherwise.
//
// REGENERATION: run `scripts/measure-capacities.ts` (vite-node) to reprint
// the printed table after changing any generator or bank. KEEP ITS key
// IN SYNC with `printedKey` below.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, type WorksheetSpec } from '../../framework';
import { sightSpec } from './SightWordsWorksheet';
import { blendSpec } from './BlendingWorksheet';
import { soundsSpec } from './BeginningSoundsWorksheet';
import { vowelSpec } from './VowelsWorksheet';
import { oppositeSpec } from './OppositeWordsWorksheet';
import { rhymeSpec } from './RhymingWordsWorksheet';
import { sentenceSpec } from './SentenceBuildingWorksheet';
import { lettersSpec } from './AlphabetOrderWorksheet';
import { capitalSpec } from './CapitalLettersWorksheet';
import { punctSpec } from './PunctuationWorksheet';
import { homophoneSpec } from './TwinWordsWorksheet';
import { pluralSpec } from './PluralsWorksheet';
import { similarSpec } from './SimilarWordsWorksheet';
import { wordgapSpec } from './WordGapsWorksheet';
import { spellingSpec } from './SpellingWorksheet';
import { syllableSpec } from './SyllablesWorksheet';
import { grammarSpec } from './NounsVerbsWorksheet';
import { tenseSpec } from './PastTenseWorksheet';
import { conjunctionSpec } from './ConjunctionWorksheet';
import { apostropheSpec } from './ApostropheWorksheet';
import { commaSpec } from './CommaListWorksheet';
import { affixSpec } from './AffixWorksheet';
import { compoundSpec } from './CompoundWorksheet';
import { speechSpec } from './SpeechWorksheet';
import { homographSpec } from './HomographWorksheet';
import { pronounSpec } from './PronounWorksheet';
// T5: Editing is the only new family whose bank reaches the 100-page printed
// bar (500/500 at every offered grade — T12 reduced its perPage 6→5 for the
// keyed A4 height budget, so the ask is 500). Comprehension and Writing are
// finite banks BY DESIGN (6 passages / 6 projects per year, one per page —
// long documents re-deal whole tasks, like the tracing sheets), and
// Crafting's per-year pool is ~44 questions; all three are pinned in their
// own test files at their design bars instead.
import { editingSpec } from './EditingWorksheet';
import { figurativeSpec } from './FigurativeWorksheet';
import { idiomSpec } from './IdiomWorksheet';
import { advpunctSpec } from './AdvancedPunctuationWorksheet';
import { agreementSpec } from './AgreementWorksheet';

// Printed-question identity: prompt text + displayed tile order (see header).
// The '|' separator cannot occur in a word, so the key is unambiguous; for
// specs without tile metadata it degrades to the bare prompt.
function printedKey(p: { prompt: string; tileWords?: string[] }): string {
    return p.tileWords ? `${p.prompt} | ${p.tileWords.join('|')}` : p.prompt;
}

// Semantic identity: the printed key with every trailing option group
// SORTED (option order is cosmetic) and the tile order sorted (same puzzle,
// tiles dealt in another display order = same task). This is the E3 metric:
// it cannot be inflated by shuffling the same words.
function semanticKey(p: { prompt: string; tileWords?: string[] }): string {
    let prompt = p.prompt;
    const m = prompt.match(/\(([^()]*)\)\s*$/);
    if (m) {
        const toks = m[1].split(/,| or | \/ /).map((t) => t.trim()).sort();
        prompt = prompt.slice(0, m.index) + '(' + toks.join(',') + ')';
    }
    return p.tileWords ? `${prompt} | ${[...p.tileWords].sort().join('|')}` : prompt;
}

// Every sampling spec with the grades that OFFER it (the grade catalogue in
// framework/grades.ts gates the senior set: homograph/figurative join at
// Year 4, idiom/advpunct/agreement at Year 5).
const SPECS: { spec: WorksheetSpec; grades: number[] }[] = [
    { spec: sightSpec, grades: [0, 1, 2, 3, 4, 5, 6] },
    { spec: blendSpec, grades: [1, 2, 3, 4, 5, 6] },
    { spec: soundsSpec, grades: [0, 1, 2, 3, 4, 5, 6] },
    { spec: vowelSpec, grades: [0, 1, 2, 3, 4, 5, 6] },
    { spec: oppositeSpec, grades: [1, 2, 3, 4, 5, 6] },
    { spec: rhymeSpec, grades: [1, 2, 3, 4, 5, 6] },
    { spec: sentenceSpec, grades: [1, 2, 3, 4, 5, 6] },
    { spec: lettersSpec, grades: [0, 1, 2, 3, 4, 5, 6] },
    { spec: capitalSpec, grades: [1, 2, 3, 4, 5, 6] },
    { spec: punctSpec, grades: [1, 2, 3, 4, 5, 6] },
    { spec: homophoneSpec, grades: [1, 2, 3, 4, 5, 6] },
    { spec: pluralSpec, grades: [1, 2, 3, 4, 5, 6] },
    { spec: similarSpec, grades: [1, 2, 3, 4, 5, 6] },
    { spec: wordgapSpec, grades: [1, 2, 3, 4, 5, 6] },
    { spec: spellingSpec, grades: [1, 2, 3, 4, 5, 6] },
    { spec: syllableSpec, grades: [2, 3, 4, 5, 6] },
    { spec: grammarSpec, grades: [2, 3, 4, 5, 6] },
    { spec: tenseSpec, grades: [2, 3, 4, 5, 6] },
    { spec: conjunctionSpec, grades: [3, 4, 5, 6] },
    { spec: apostropheSpec, grades: [3, 4, 5, 6] },
    { spec: commaSpec, grades: [3, 4, 5, 6] },
    { spec: affixSpec, grades: [3, 4, 5, 6] },
    { spec: compoundSpec, grades: [3, 4, 5, 6] },
    { spec: speechSpec, grades: [3, 4, 5, 6] },
    { spec: homographSpec, grades: [4, 5, 6] },
    { spec: pronounSpec, grades: [3, 4, 5, 6] },
    { spec: editingSpec, grades: [3, 4, 5, 6] },
    { spec: figurativeSpec, grades: [4, 5, 6] },
    { spec: idiomSpec, grades: [5, 6] },
    { spec: advpunctSpec, grades: [5, 6] },
    { spec: agreementSpec, grades: [5, 6] }
];

// Semantic capacity pins (exact, measured at the 100-page ask). Only the
// sheets whose space is a curated FACT SPACE need pinning — for the fully
// procedural sheets the printed bar already forces >= ask distinct printed
// questions and their semantic counts sit at 700+/800. These numbers are
// the E3 regression net: they may only move UP unless a bank is deliberately
// shrunk. Worst pool: apostrophe 196 (hand-curated possessive bank).
const SEMANTIC: { spec: WorksheetSpec; gradeId: number; capacity: number }[] = [
    { spec: sightSpec, gradeId: 0, capacity: 538 },
    { spec: sightSpec, gradeId: 1, capacity: 539 },
    { spec: sightSpec, gradeId: 3, capacity: 547 },
    { spec: sightSpec, gradeId: 5, capacity: 550 },
    { spec: punctSpec, gradeId: 1, capacity: 750 },
    { spec: punctSpec, gradeId: 3, capacity: 761 },
    { spec: punctSpec, gradeId: 5, capacity: 755 },
    { spec: homophoneSpec, gradeId: 1, capacity: 395 },
    { spec: homophoneSpec, gradeId: 3, capacity: 579 },
    { spec: homophoneSpec, gradeId: 5, capacity: 583 },
    { spec: wordgapSpec, gradeId: 1, capacity: 325 },
    { spec: wordgapSpec, gradeId: 3, capacity: 352 },
    { spec: wordgapSpec, gradeId: 5, capacity: 363 },
    { spec: conjunctionSpec, gradeId: 3, capacity: 410 },
    // T5 re-pin: the level-gated kinds (SUB_FILL/SUB_JOIN) split the 600-row
    // ask across 7 kinds, so the OLD space is sampled at a lower share and
    // the measured semantic count at this fixed ask dips (406 -> 394) even
    // though the underlying pool grew. Year 3 is untouched (no gated kinds).
    { spec: conjunctionSpec, gradeId: 5, capacity: 394 },
    { spec: apostropheSpec, gradeId: 3, capacity: 196 },
    { spec: apostropheSpec, gradeId: 5, capacity: 196 },
    { spec: commaSpec, gradeId: 3, capacity: 578 },
    { spec: commaSpec, gradeId: 5, capacity: 567 },
    { spec: speechSpec, gradeId: 3, capacity: 579 },
    { spec: speechSpec, gradeId: 5, capacity: 579 },
    { spec: pronounSpec, gradeId: 3, capacity: 403 },
    { spec: pronounSpec, gradeId: 5, capacity: 416 },
    { spec: homographSpec, gradeId: 5, capacity: 472 },
    { spec: idiomSpec, gradeId: 5, capacity: 391 },
    { spec: advpunctSpec, gradeId: 5, capacity: 525 },
    { spec: agreementSpec, gradeId: 5, capacity: 570 }
];

describe('unique sampling — printed 100-page bar (every spec x offered grade)', () => {
    for (const { spec, grades } of SPECS) {
        for (const gradeId of grades) {
            const grade = getEnglishGradeConfig(gradeId);
            const ask = spec.perPage * 100; // 100 pages of questions
            it(`${spec.id} grade ${gradeId}: ${ask}-question (100-page) ask is fully unique (printed)`, () => {
                const seed = seedFrom([grade.id, spec.id, 0]);
                const problems = spec.generate(createRng(seed), grade.caps, ask);
                expect(problems).toHaveLength(ask);
                const keys = problems.map(printedKey);
                // Exact bar: every printed question distinct — capacity ==
                // ask. A pool shrink below the ask drops this number.
                expect(new Set(keys).size).toBe(ask);
                // Stronger prefix property: sampleUnique only releases a
                // question after checking its key, so ALL ask questions are
                // pairwise distinct (no fallback tail exists at this size).
                expect(new Set(keys.slice(0, ask)).size).toBe(ask);
            });
        }
    }
});

describe('unique sampling — semantic capacity (option-order-free variety, E3)', () => {
    for (const { spec, gradeId, capacity } of SEMANTIC) {
        const grade = getEnglishGradeConfig(gradeId);
        const ask = spec.perPage * 100;
        it(`${spec.id} grade ${gradeId}: ${ask}-question ask yields exactly ${capacity} semantic tasks`, () => {
            const seed = seedFrom([grade.id, spec.id, 0]);
            const problems = spec.generate(createRng(seed), grade.caps, ask);
            const unique = new Set(problems.map(semanticKey));
            expect(unique.size).toBe(capacity);
        });
    }

    it('no curated pool has collapsed: every semantic pin is >= 3x the worst OLD bank (67)', () => {
        // HEAD reference: apostrophe 67, idiom 50, homophone 40-74, comma
        // 180, advpunct 150 semantic tasks per 100 pages. The floor keeps a
        // future bank edit from quietly gutting real variety.
        for (const { capacity } of SEMANTIC) expect(capacity).toBeGreaterThanOrEqual(196);
    });

    it('semantic variety never exceeds the printed count (key sanity)', () => {
        // Sanity on the normalizer itself: sorting option groups can only
        // MERGE printed questions, never split them.
        for (const { spec, grades } of SPECS.slice(0, 6)) {
            const grade = getEnglishGradeConfig(grades[0]);
            const problems = spec.generate(createRng(seedFrom([grade.id, spec.id, 0])), grade.caps, spec.perPage * 20);
            const printed = new Set(problems.map(printedKey)).size;
            const semantic = new Set(problems.map(semanticKey)).size;
            expect(semantic).toBeLessThanOrEqual(printed);
        }
    });
});
