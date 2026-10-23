// Unit tests for the WORD GAPS worksheet plugin (T4B rework).
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE sheet (all
// prompts + answers) is pinned to exact expected values produced from the real
// generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). If the algorithm, context bank, or caps
// change, these exact assertions fail — which is what we want, so a silent
// change to the worksheet can't slip through.
//
// T4B additions: exact per-format counts (best-word MCQ, written gap,
// does-not-fit, riddle) and the exact unique-question capacity — the printed
// space grew from 1 080 (Y1) / 1 440 (Y2+) to 2 669 (Y1) / 3 000+ (Y2+).

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, type GradeConfig } from '../../framework';
import { wordgapSpec } from './WordGapsWorksheet';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(wordgapSpec, grade, seedFrom([grade.id, wordgapSpec.id, 0]));
}

describe('wordgap plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, T4B page size and single-column layout', () => {
        expect(wordgapSpec.id).toBe('wordgap');
        expect(wordgapSpec.label).toBe('Word Gaps');
        expect(wordgapSpec.icon).toBe('§');
        // T4B density: 6 roomy prose rows (was 16).
        expect(wordgapSpec.perPage).toBe(6);
        expect(wordgapSpec.singleColumn).toBe(true);
    });

    it('describes its scope', () => {
        expect(wordgapSpec.scope(g1)).toBe('best word in the gap');
    });

    it('is gated by the grade catalogue (Year 1..6 offer it, Year 7 does not)', () => {
        expect(wordgapSpec.offered(g0)).toBe(false);
        expect(wordgapSpec.offered(g1)).toBe(true);
        expect(wordgapSpec.offered(g2)).toBe(true);
        expect(wordgapSpec.offered(getEnglishGradeConfig(3))).toBe(true);
        expect(wordgapSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(wordgapSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered type => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(wordgapSpec, g0, seedFrom([0, 'wordgap', 0]))).toEqual([]);
    });
});

describe('wordgap — Year 1 (basic context bank)', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g1)).toEqual([
        {"prompt":"Fill in the gap: The farmer drives a __ .","answer":"tractor","id":1,"type":"wordgap"},
        {"prompt":"Choose the best word: A __ has a hard shell. (frog, turtle, hen)","answer":"turtle","id":2,"type":"wordgap"},
        {"prompt":"Choose the best word: The __ says moo. (hen, soap, cow)","answer":"cow","id":3,"type":"wordgap"},
        {"prompt":"Fill in the gap: The baby drinks from her __ .","answer":"bottle","id":4,"type":"wordgap"},
        {"prompt":"Which word is the riddle about? I lay eggs on the beach and carry my house. Who am I? (turtle, fish, snake, bird)","answer":"turtle","id":5,"type":"wordgap"},
        {"prompt":"Choose the best word: I brush my __ every morning. (shoe, hair, moon)","answer":"hair","id":6,"type":"wordgap"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(wordgapSpec, g1, seedFrom([1, 'wordgap', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Which word does NOT fit: The __ gives us wool. (llama, train, sheep)","answer":"train","id":7,"type":"wordgap"},
        {"prompt":"Fill in the gap: A __ has a long trunk.","answer":"elephant","id":8,"type":"wordgap"},
        {"prompt":"Choose the best word: Grandpa sits in his __ . (chair, moon, cake)","answer":"chair","id":9,"type":"wordgap"}
        ]);
    });
});

describe('wordgap — Year 2 (extended vocabulary joins)', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g2)).toEqual([
        {"prompt":"Choose the best word: The baby drinks from her __ . (kitten, shoe, bottle)","answer":"bottle","id":1,"type":"wordgap"},
        {"prompt":"Which word does NOT fit: I cut paper with __ . (cloud, knife, scissors)","answer":"cloud","id":2,"type":"wordgap"},
        {"prompt":"Choose the best word: The __ flies from flower to flower. (ant, butterfly, spider)","answer":"butterfly","id":3,"type":"wordgap"},
        {"prompt":"Choose the best word: I brush my __ every morning. (bus, moon, hair)","answer":"hair","id":4,"type":"wordgap"},
        {"prompt":"Which word does NOT fit: I write with a __ . (pencil, pen, moon)","answer":"moon","id":5,"type":"wordgap"},
        {"prompt":"Fill in the gap: The baby drinks from her __ .","answer":"bottle","id":6,"type":"wordgap"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(wordgapSpec, g2, seedFrom([2, 'wordgap', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Which word does NOT fit: Bees make sweet __ . (rock, syrup, honey)","answer":"rock","id":7,"type":"wordgap"},
        {"prompt":"Choose the best word: A __ has a pouch. (kangaroo, emu, cat)","answer":"kangaroo","id":8,"type":"wordgap"},
        {"prompt":"Choose the best word: The __ cares for sick animals. (vet, pilot, chef)","answer":"vet","id":9,"type":"wordgap"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(wordgapSpec, getEnglishGradeConfig(7), seedFrom([7, 'wordgap', 0]))).toEqual([]);
    });
});

describe('wordgap — T4B format mix & capacity', () => {
    // Exact per-format counts over a deterministic 200-question Year-1 sheet
    // (measured from the real generator): best-word MCQ, written gap,
    // does-not-fit, riddle — every format fires.
    it('Year 1: exact format counts over 200 questions', () => {
        const problems = wordgapSpec.generate(createRng(seedFrom([1, 'wordgap', 0])), g1.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        expect(count('Choose the best word:')).toBe(122);
        expect(count('Fill in the gap:')).toBe(14);
        expect(count('Which word does NOT fit:')).toBe(33);
        expect(count('Which word is the riddle about?')).toBe(31);
    });

    it('Year 3: exact format counts over 200 questions', () => {
        const g3 = getEnglishGradeConfig(3);
        const problems = wordgapSpec.generate(createRng(seedFrom([3, 'wordgap', 0])), g3.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        expect(count('Choose the best word:')).toBe(118);
        expect(count('Fill in the gap:')).toBe(14);
        expect(count('Which word does NOT fit:')).toBe(29);
        expect(count('Which word is the riddle about?')).toBe(39);
    });

    // CAPACITY: the 100-page ask (6 x 100 = 600 questions) is fully unique at
    // every offering grade (the old banks cleared only 1 080/1 440 at the
    // 1 600-question ask). The TRUE printed space is pinned too: a 3 000
    // Year-1 question ask yields exactly 2 669 unique questions (Y1 bank is
    // basic-only), up from the old 1 080.
    it('grades 1-6: 600-question (100-page) ask yields 600 unique questions', () => {
        for (const gradeId of [1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const problems = wordgapSpec.generate(createRng(seedFrom([grade.id, 'wordgap', 0])), grade.caps, 600);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(600);
        }
    });

    it('Year 1: true printed space is 2 669 unique questions (3 000-question ask)', () => {
        const problems = wordgapSpec.generate(createRng(seedFrom([1, 'wordgap', 0])), g1.caps, 3000);
        expect(new Set(problems.map((p) => p.prompt)).size).toBe(2669);
    });
});
