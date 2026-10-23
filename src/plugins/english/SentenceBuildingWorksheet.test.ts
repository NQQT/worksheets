// Unit tests for the SENTENCE BUILDING worksheet plugin (T4B rework).
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE sheet (all
// prompts + answers) is pinned to exact expected values produced from the real
// generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). If the algorithm, slot banks, shapes or
// caps change, these exact assertions fail — which is what we want, so a
// silent change to the worksheet can't slip through.
//
// T4B additions: perPage 12 -> 4; line shapes now cover the whole grade
// ladder (2..10 words); a second task format (reorder MCQ) joins the classic
// scramble-and-build. Capacity: the 100-page ask (400 questions) is fully
// unique at every grade, and the true printed space exceeds 3 000.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, type GradeConfig } from '../../framework';
import { sentenceSpec } from './SentenceBuildingWorksheet';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(sentenceSpec, grade, seedFrom([grade.id, sentenceSpec.id, 0]));
}

describe('sentence plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, T4B page size and single-column layout', () => {
        expect(sentenceSpec.id).toBe('sentence');
        expect(sentenceSpec.label).toBe('Sentence Building');
        expect(sentenceSpec.icon).toBe('¶');
        // T4B density: 4 roomy tile rows (was 12).
        expect(sentenceSpec.perPage).toBe(4);
        // Prose lines run one per row, full page width.
        expect(sentenceSpec.singleColumn).toBe(true);
    });

    it('describes its length scope from the grade caps', () => {
        expect(sentenceSpec.scope(g1)).toBe('up to 4 words');
        expect(sentenceSpec.scope(g2)).toBe('up to 5 words');
        // T4B: the shape ladder now reaches the Y4-Y6 caps too.
        expect(sentenceSpec.scope(getEnglishGradeConfig(4))).toBe('up to 8 words');
        expect(sentenceSpec.scope(getEnglishGradeConfig(6))).toBe('up to 10 words');
    });

    it('is gated by the grade catalogue (Year 1..6 offer it, Year 7 does not)', () => {
        expect(sentenceSpec.offered(g0)).toBe(false);
        expect(sentenceSpec.offered(g1)).toBe(true);
        expect(sentenceSpec.offered(g2)).toBe(true);
        expect(sentenceSpec.offered(getEnglishGradeConfig(3))).toBe(true);
        expect(sentenceSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(sentenceSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered type => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(sentenceSpec, g0, seedFrom([0, 'sentence', 0]))).toEqual([]);
    });
});

// Semantic invariant for the BUILD format: the printed scramble is a
// PERMUTATION of the answer's word units (the child can always rebuild the
// pinned answer from the line). The word units themselves may contain spaces
// (e.g. the two-word actor "My cousin" or object "a cat"), so the unit
// boundaries cannot be recovered from the answer string alone — instead the
// comparison folds both sides down to a sorted character multiset, which is
// exactly preserved by any permutation of the units.
//
// THREE ROW SHAPES (T4B): early-band build rows carry the bank in the
// `tileWords` metadata (word tiles); legacy build rows (Prep, Y4+) print it
// in the prompt's parenthesised tail; reorder-MCQ rows print three candidate
// ORDERS — for those the invariant is instead "the answer is one of the
// three options and all three are distinct".
function checkPermutation(grade: GradeConfig) {
    for (const p of sheet(grade)) {
        if (p.prompt.startsWith('Which sentence is in the correct order?')) {
            // MCQ shape: answer among three DISTINCT candidate orders.
            const m = p.prompt.match(/\(([^)]+)\)\s*$/);
            expect(m).not.toBeNull();
            const options = m![1].split(' / ');
            expect(options).toHaveLength(3);
            expect(new Set(options).size).toBe(3);
            expect(options).toContain(p.answer);
            continue;
        }
        let shown: string[];
        if (Array.isArray(p.tileWords)) {
            // Tile shape: the bank lives in the metadata (not in the prompt).
            shown = p.tileWords;
        } else {
            // Legacy shape: the bank is the prompt's parenthesised tail.
            const m = p.prompt.match(/\(([^)]+)\)\s*$/);
            expect(m).not.toBeNull();
            shown = m![1].split(', ').map((s) => s.trim());
        }
        const letters = (s: string) => [...s.replace(/ /g, '')].sort().join('');
        expect(letters(shown.join(''))).toBe(letters(p.answer));
    }
}

describe('sentence — Year 1 (2..4-word lines)', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g1)).toEqual([
        {"prompt":"Put the words in the correct order: __, __.","answer":"Leo sings","tileBlanks":"word","tileWords":["sings","Leo"],"id":1,"type":"sentence"},
        {"prompt":"Put the words in the correct order: __, __.","answer":"The baby sings","tileBlanks":"word","tileWords":["sings","The baby"],"id":2,"type":"sentence"},
        {"prompt":"Put the words in the correct order: __, __.","answer":"The rabbit shouts","tileBlanks":"word","tileWords":["shouts","The rabbit"],"id":3,"type":"sentence"},
        {"prompt":"Put the words in the correct order: __, __.","answer":"Zoe skips","tileBlanks":"word","tileWords":["skips","Zoe"],"id":4,"type":"sentence"}
        ]);
        checkPermutation(g1);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(sentenceSpec, g1, seedFrom([1, 'sentence', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Which sentence is in the correct order? (Ben sees a rainbow / a rainbow Ben sees / Ben a rainbow sees)","answer":"Ben sees a rainbow","id":5,"type":"sentence"},
        {"prompt":"Put the words in the correct order: __, __.","answer":"The horse naps","tileBlanks":"word","tileWords":["naps","The horse"],"id":6,"type":"sentence"},
        {"prompt":"Put the words in the correct order: __, __.","answer":"Sam dances","tileBlanks":"word","tileWords":["dances","Sam"],"id":7,"type":"sentence"}
        ]);
    });
});

describe('sentence — Year 2 (adds the 5-word shapes)', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g2)).toEqual([
        {"prompt":"Which sentence is in the correct order? (Max a rock again paints / Max paints a rock again / paints a rock Max again)","answer":"Max paints a rock again","id":1,"type":"sentence"},
        {"prompt":"Which sentence is in the correct order? (Mia paints a rock loudly / a rock loudly Mia paints / a rock Mia loudly paints)","answer":"Mia paints a rock loudly","id":2,"type":"sentence"},
        {"prompt":"Which sentence is in the correct order? (loudly draws Ben a cat / draws loudly Ben a cat / Ben draws a cat loudly)","answer":"Ben draws a cat loudly","id":3,"type":"sentence"},
        {"prompt":"Put the words in the correct order: __, __, __.","answer":"The horse carries the box","tileBlanks":"word","tileWords":["The horse","the box","carries"],"id":4,"type":"sentence"}
        ]);
        checkPermutation(g2);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(sentenceSpec, g2, seedFrom([2, 'sentence', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Put the words in the correct order: __, __.","answer":"Max skips","tileBlanks":"word","tileWords":["skips","Max"],"id":5,"type":"sentence"},
        {"prompt":"Which sentence is in the correct order? (a bag carries My cousin / My cousin carries a bag / My cousin a bag carries)","answer":"My cousin carries a bag","id":6,"type":"sentence"},
        {"prompt":"Put the words in the correct order: __, __, __, __.","answer":"Max rides a bike outside","tileBlanks":"word","tileWords":["rides","Max","a bike","outside"],"id":7,"type":"sentence"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(sentenceSpec, getEnglishGradeConfig(7), seedFrom([7, 'sentence', 0]))).toEqual([]);
    });
});

describe('sentence — T4B shape ladder, format mix & capacity', () => {
    // T4B: Year 6 (sentenceLen cap 10) now actually gets long lines — the
    // old generator stopped at 5 words. Exact tile-count check over a 100
    // question Year-6 sheet: every answer's word units match its shape.
    it('Year 6: lines reach the 8..10-word shapes', () => {
        const g6 = getEnglishGradeConfig(6);
        const problems = sentenceSpec.generate(createRng(seedFrom([6, 'sentence', 0])), g6.caps, 100);
        // Longest answer (by tile count in the build rows) reaches 10 units.
        const tileCounts = problems
            .filter((p) => Array.isArray(p.tileWords))
            .map((p) => p.tileWords!.length);
        // Year 6 is tier 6 — NOT in the early cue band, so build rows are
        // legacy (no tiles); measure the MCQ answers instead.
        const answers = problems.map((p) => p.answer.split(' ').length);
        expect(Math.max(...answers)).toBe(10);
        expect(Math.min(...answers)).toBe(2);
        expect(tileCounts).toEqual([]);
    });

    // Year 4+ (tier 5/6) leaves the early cue band: build rows keep the
    // legacy parenthesised prompt and carry NO tile metadata.
    it('Year 4: legacy prompt shape, no tile metadata', () => {
        const g4 = getEnglishGradeConfig(4);
        const problems = sentenceSpec.generate(createRng(seedFrom([4, 'sentence', 0])), g4.caps, 50);
        for (const p of problems) {
            expect(p.tileWords).toBeUndefined();
            expect(p.tileBlanks).toBeUndefined();
        }
    });

    // Exact per-format counts over a deterministic 200-question sheet:
    // build rows vs reorder-MCQ rows.
    it('Year 1: exact format counts over 200 questions', () => {
        const problems = sentenceSpec.generate(createRng(seedFrom([1, 'sentence', 0])), g1.caps, 200);
        const mcq = problems.filter((p) => p.prompt.startsWith('Which sentence is in the correct order?')).length;
        expect(mcq).toBe(27);
        expect(200 - mcq).toBe(173);
    });

    it('Year 3: exact format counts over 200 questions', () => {
        const g3 = getEnglishGradeConfig(3);
        const problems = sentenceSpec.generate(createRng(seedFrom([3, 'sentence', 0])), g3.caps, 200);
        const mcq = problems.filter((p) => p.prompt.startsWith('Which sentence is in the correct order?')).length;
        expect(mcq).toBe(58);
        expect(200 - mcq).toBe(142);
    });

    // CAPACITY: the 100-page ask (4 x 100 = 400 questions) is fully unique at
    // every offering grade, keyed on prompt + displayed tile order (the
    // printed-question identity for early-band rows).
    it('grades 1-6: 400-question (100-page) ask yields 400 unique questions', () => {
        for (const gradeId of [1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const problems = sentenceSpec.generate(createRng(seedFrom([grade.id, 'sentence', 0])), grade.caps, 400);
            const keys = problems.map((p) => (p.tileWords ? `${p.prompt} | ${p.tileWords.join('|')}` : p.prompt));
            expect(new Set(keys).size).toBe(400);
        }
    });

    // TRUE printed space: a 3 000-question Year-1 ask still yields 3 000
    // unique questions (the old bank topped out at 1 200).
    it('Year 1: 3 000-question ask yields 3 000 unique questions', () => {
        const problems = sentenceSpec.generate(createRng(seedFrom([1, 'sentence', 0])), g1.caps, 3000);
        const keys = problems.map((p) => (p.tileWords ? `${p.prompt} | ${p.tileWords.join('|')}` : p.prompt));
        expect(new Set(keys).size).toBe(3000);
    });
});
