// Unit tests for the SIMILAR WORDS (synonyms) worksheet plugin (T4B rework).
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE sheet (all
// prompts + answers) is pinned to exact expected values produced from the real
// generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). If the algorithm, tuple bank, or caps
// change, these exact assertions fail — which is what we want, so a silent
// change to the worksheet can't slip through.
//
// T4B additions: exact per-format counts (synonym MCQ, odd-one-out,
// same-meaning yes/no, context cloze) and the exact unique-question capacity
// at the 100-page ask.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, type GradeConfig } from '../../framework';
import { similarSpec } from './SimilarWordsWorksheet';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(similarSpec, grade, seedFrom([grade.id, similarSpec.id, 0]));
}

describe('similar plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and T4B page size', () => {
        expect(similarSpec.id).toBe('similar');
        expect(similarSpec.label).toBe('Similar Words');
        expect(similarSpec.icon).toBe('≡');
        // T4B density: 8 roomy rows (was 18).
        expect(similarSpec.perPage).toBe(8);
    });

    it('describes its scope from the grade caps (meanings vs synonyms)', () => {
        expect(similarSpec.scope(g1)).toBe('word meanings');
        expect(similarSpec.scope(g2)).toBe('word meanings');
        // Year 3+ (wordTier 4) unlocks the upper-primary synonym set.
        expect(similarSpec.scope(getEnglishGradeConfig(3))).toBe('synonyms');
    });

    it('is gated by the grade catalogue (Year 1..6 offer it, Year 7 does not)', () => {
        expect(similarSpec.offered(g0)).toBe(false);
        expect(similarSpec.offered(g1)).toBe(true);
        expect(similarSpec.offered(g2)).toBe(true);
        expect(similarSpec.offered(getEnglishGradeConfig(3))).toBe(true);
        expect(similarSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(similarSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered type => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(similarSpec, g0, seedFrom([0, 'similar', 0]))).toEqual([]);
    });
});

describe('similar — Year 1 (tier-2 tuple bank)', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g1)).toEqual([
        {"prompt":"Which word means the same as \"talk\"? (speak, small, cry)","answer":"speak","id":1,"type":"similar"},
        {"prompt":"Do \"hot\" and \"sad\" mean the same thing? (yes / no)","answer":"no","id":2,"type":"similar"},
        {"prompt":"Which word fits: A __ child shares toys with everyone. (selfish, generous)","answer":"generous","id":3,"type":"similar"},
        {"prompt":"Which word means the same as \"fast\"? (quick, cold, big)","answer":"quick","id":4,"type":"similar"},
        {"prompt":"Which word fits: A lion is __ ; it lifted the log. (weak, mighty)","answer":"mighty","id":5,"type":"similar"},
        {"prompt":"Which word means the same as \"end\"? (cold, finish, little)","answer":"finish","id":6,"type":"similar"},
        {"prompt":"Which word fits: The library was __ : not a single sound. (noisy, silent)","answer":"silent","id":7,"type":"similar"},
        {"prompt":"Which word means the same as \"sad\"? (sleep, unhappy, river)","answer":"unhappy","id":8,"type":"similar"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(similarSpec, g1, seedFrom([1, 'similar', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Do \"small\" and \"happy\" mean the same thing? (yes / no)","answer":"no","id":9,"type":"similar"},
        {"prompt":"Which word does NOT mean the same as the other two? (huge, big, glad)","answer":"glad","id":10,"type":"similar"},
        {"prompt":"Which word does NOT mean the same as the other two? (store, shop, finish)","answer":"finish","id":11,"type":"similar"}
        ]);
    });
});

describe('similar — Year 2 (tier-3 tuples join via tricky)', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g2)).toEqual([
        {"prompt":"Which word fits: The puppy is __ like a mouse. (huge, tiny)","answer":"tiny","id":1,"type":"similar"},
        {"prompt":"Which word means the same as \"noise\"? (cold, pretty, sound)","answer":"sound","id":2,"type":"similar"},
        {"prompt":"Which word does NOT mean the same as the other two? (tiny, small, hot)","answer":"hot","id":3,"type":"similar"},
        {"prompt":"Which word does NOT mean the same as the other two? (happy, laugh, glad)","answer":"laugh","id":4,"type":"similar"},
        {"prompt":"Which word does NOT mean the same as the other two? (angry, sleep, mad)","answer":"sleep","id":5,"type":"similar"},
        {"prompt":"Do \"run\" and \"cold\" mean the same thing? (yes / no)","answer":"no","id":6,"type":"similar"},
        {"prompt":"Which word does NOT mean the same as the other two? (calm, shine, glow)","answer":"calm","id":7,"type":"similar"},
        {"prompt":"Which word means the same as \"big\"? (large, angry, sleepy)","answer":"large","id":8,"type":"similar"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(similarSpec, g2, seedFrom([2, 'similar', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Which word does NOT mean the same as the other two? (tiny, frightened, scared)","answer":"tiny","id":9,"type":"similar"},
        {"prompt":"Which word means the same as \"look\"? (big, see, start)","answer":"see","id":10,"type":"similar"},
        {"prompt":"Which word fits: Dad was __ after the long day. (awake, sleepy)","answer":"sleepy","id":11,"type":"similar"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(similarSpec, getEnglishGradeConfig(7), seedFrom([7, 'similar', 0]))).toEqual([]);
    });
});

describe('similar — T4B format mix & capacity', () => {
    // Exact per-format counts over a deterministic 200-question Year-1 sheet
    // (measured from the real generator): synonym MCQ, odd-one-out,
    // same-meaning yes/no, context cloze — every format fires.
    it('Year 1: exact format counts over 200 questions', () => {
        const problems = similarSpec.generate(createRng(seedFrom([1, 'similar', 0])), g1.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        expect(count('Which word means the same as')).toBe(98);
        expect(count('Which word does NOT mean the same as the other two?')).toBe(55);
        expect(count('Do "')).toBe(37);
        expect(count('Which word fits:')).toBe(10);
    });

    it('Year 3: exact format counts over 200 questions', () => {
        const g3 = getEnglishGradeConfig(3);
        const problems = similarSpec.generate(createRng(seedFrom([3, 'similar', 0])), g3.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        expect(count('Which word means the same as')).toBe(94);
        expect(count('Which word does NOT mean the same as the other two?')).toBe(58);
        expect(count('Do "')).toBe(38);
        expect(count('Which word fits:')).toBe(10);
    });

    // CAPACITY: the 100-page ask (8 x 100 = 800 questions) is fully unique.
    it('Year 1: 800-question (100-page) ask yields 800 unique questions', () => {
        const problems = similarSpec.generate(createRng(seedFrom([1, 'similar', 0])), g1.caps, 800);
        expect(new Set(problems.map((p) => p.prompt)).size).toBe(800);
    });
});
