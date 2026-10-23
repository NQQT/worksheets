// Unit tests for the SPELLING worksheet plugin (T4B rework).
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE sheet (all
// prompts + answers) is pinned to exact expected values produced from the real
// generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). If the algorithm, word set, or caps
// change, these exact assertions fail — which is what we want, so a silent
// change to the worksheet can't slip through.
//
// T4B additions: exact per-format counts (correct-spelling MCQ, fix-it,
// missing-letter, unscramble) and the exact unique-question capacity at the
// 100-page ask. The written formats are gated by real-word uniqueness checks
// (KNOWN_WORD_SET) — the pinned sheets show those gates firing (e.g. "le__"
// -> g is asked because no other real word fits, while "c_t" never is).

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, type GradeConfig } from '../../framework';
import { spellingSpec } from './SpellingWorksheet';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(spellingSpec, grade, seedFrom([grade.id, spellingSpec.id, 0]));
}

describe('spelling plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and T4B page size', () => {
        expect(spellingSpec.id).toBe('spelling');
        expect(spellingSpec.label).toBe('Spelling');
        expect(spellingSpec.icon).toBe('✎');
        // T4B density: 8 roomy rows (was 18).
        expect(spellingSpec.perPage).toBe(8);
    });

    it('describes its scope from the grade caps (short vs short & tricky)', () => {
        expect(spellingSpec.scope(g1)).toBe('short words');
        expect(spellingSpec.scope(g2)).toBe('short & tricky words');
    });

    it('is gated by the grade catalogue (Year 1..6 offer it, Year 7 does not)', () => {
        expect(spellingSpec.offered(g0)).toBe(false);
        expect(spellingSpec.offered(g1)).toBe(true);
        expect(spellingSpec.offered(g2)).toBe(true);
        expect(spellingSpec.offered(getEnglishGradeConfig(3))).toBe(true);
        expect(spellingSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(spellingSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered type => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(spellingSpec, g0, seedFrom([0, 'spelling', 0]))).toEqual([]);
    });
});

describe('spelling — Year 1 (tier-2 word set)', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g1)).toEqual([
        {"prompt":"Which word is spelled correctly? (cup, clup, cubp)","answer":"cup","id":1,"type":"spelling"},
        {"prompt":"Put the letters in the right order: rde","answer":"red","id":2,"type":"spelling"},
        {"prompt":"Fix this misspelled word: \"bhus\"","answer":"bus","id":3,"type":"spelling"},
        {"prompt":"Write the missing letter: le__","answer":"g","id":4,"type":"spelling"},
        {"prompt":"Which word is spelled correctly? (log, olg, lgo)","answer":"log","id":5,"type":"spelling"},
        {"prompt":"Write the missing letter: p__g","answer":"i","id":6,"type":"spelling"},
        {"prompt":"Write the missing letter: p__n","answer":"i","id":7,"type":"spelling"},
        {"prompt":"Fix this misspelled word: \"scun\"","answer":"sun","id":8,"type":"spelling"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(spellingSpec, g1, seedFrom([1, 'spelling', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Which word is spelled correctly? (ninght, night, ngiht)","answer":"night","id":9,"type":"spelling"},
        {"prompt":"Fix this misspelled word: \"grahss\"","answer":"grass","id":10,"type":"spelling"},
        {"prompt":"Fix this misspelled word: \"purlple\"","answer":"purple","id":11,"type":"spelling"}
        ]);
    });
});

describe('spelling — Year 2 (tier-3 word set)', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g2)).toEqual([
        {"prompt":"Which word is spelled correctly? (chicksen, chicken, chickehn)","answer":"chicken","id":1,"type":"spelling"},
        {"prompt":"Which word is spelled correctly? (lemno, lemzon, lemon)","answer":"lemon","id":2,"type":"spelling"},
        {"prompt":"Which word is spelled correctly? (czhocolate, chocbolate, chocolate)","answer":"chocolate","id":3,"type":"spelling"},
        {"prompt":"Put the letters in the right order: irths","answer":"shirt","id":4,"type":"spelling"},
        {"prompt":"Fix this misspelled word: \"sijp\"","answer":"sip","id":5,"type":"spelling"},
        {"prompt":"Which word is spelled correctly? (beautviful, beagutiful, beautiful)","answer":"beautiful","id":6,"type":"spelling"},
        {"prompt":"Put the letters in the right order: fna","answer":"fan","id":7,"type":"spelling"},
        {"prompt":"Which word is spelled correctly? (cup, cupp, curp)","answer":"cup","id":8,"type":"spelling"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(spellingSpec, g2, seedFrom([2, 'spelling', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Which word is spelled correctly? (lseg, leg, lge)","answer":"leg","id":9,"type":"spelling"},
        {"prompt":"Write the missing letter: gree__","answer":"n","id":10,"type":"spelling"},
        {"prompt":"Write the missing letter: cha__r","answer":"i","id":11,"type":"spelling"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(spellingSpec, getEnglishGradeConfig(7), seedFrom([7, 'spelling', 0]))).toEqual([]);
    });
});

describe('spelling — T4B format mix & capacity', () => {
    // Exact per-format counts over a deterministic 200-question Year-1 sheet
    // (measured from the real generator): MCQ, fix-it, missing-letter,
    // unscramble — every format fires.
    it('Year 1: exact format counts over 200 questions', () => {
        const problems = spellingSpec.generate(createRng(seedFrom([1, 'spelling', 0])), g1.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        expect(count('Which word is spelled correctly?')).toBe(89);
        expect(count('Fix this misspelled word:')).toBe(43);
        expect(count('Write the missing letter:')).toBe(42);
        expect(count('Put the letters in the right order:')).toBe(26);
    });

    it('Year 3: exact format counts over 200 questions', () => {
        const g3 = getEnglishGradeConfig(3);
        const problems = spellingSpec.generate(createRng(seedFrom([3, 'spelling', 0])), g3.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        expect(count('Which word is spelled correctly?')).toBe(103);
        expect(count('Fix this misspelled word:')).toBe(47);
        expect(count('Write the missing letter:')).toBe(24);
        expect(count('Put the letters in the right order:')).toBe(26);
    });

    // CAPACITY: the 100-page ask (8 x 100 = 800 questions) is fully unique.
    it('Year 1: 800-question (100-page) ask yields 800 unique questions', () => {
        const problems = spellingSpec.generate(createRng(seedFrom([1, 'spelling', 0])), g1.caps, 800);
        expect(new Set(problems.map((p) => p.prompt)).size).toBe(800);
    });
});
