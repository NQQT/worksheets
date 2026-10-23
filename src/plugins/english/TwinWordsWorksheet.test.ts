// Unit tests for the TWIN WORDS (homophones) worksheet plugin (T4B rework).
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE sheet (all
// prompts + answers) is pinned to exact expected values produced from the real
// generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). If the algorithm, sentence bank, or caps
// change, these exact assertions fail — which is what we want, so a silent
// change to the worksheet can't slip through.
//
// T4B context: this was the WORST capacity case before the rework (40/52/74
// unique questions at grades 1/2/3 — long documents repeated sentences within
// pages). The curated banks roughly tripled and three new task formats joined,
// so the sheet now clears the 100-page bar (600 unique questions) at EVERY
// grade. These tests pin the new capacity and the exact format mix.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, type GradeConfig } from '../../framework';
import { homophoneSpec } from './TwinWordsWorksheet';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(homophoneSpec, grade, seedFrom([grade.id, homophoneSpec.id, 0]));
}

describe('homophone plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, T4B page size and single-column layout', () => {
        expect(homophoneSpec.id).toBe('homophone');
        expect(homophoneSpec.label).toBe('Twin Words');
        expect(homophoneSpec.icon).toBe('2');
        // T4B density: 6 roomy prose rows (was 16).
        expect(homophoneSpec.perPage).toBe(6);
        expect(homophoneSpec.singleColumn).toBe(true);
    });

    it('describes its pair scope from the grade caps', () => {
        expect(homophoneSpec.scope(g1)).toBe('basic pairs');
        expect(homophoneSpec.scope(g2)).toBe('basic & tricky pairs');
        expect(homophoneSpec.scope(getEnglishGradeConfig(3))).toBe('basic, tricky & senior pairs');
    });

    it('is gated by the grade catalogue (Year 1..6 offer it, Year 7 does not)', () => {
        expect(homophoneSpec.offered(g0)).toBe(false);
        expect(homophoneSpec.offered(g1)).toBe(true);
        expect(homophoneSpec.offered(g2)).toBe(true);
        expect(homophoneSpec.offered(getEnglishGradeConfig(3))).toBe(true);
        expect(homophoneSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(homophoneSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered type => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(homophoneSpec, g0, seedFrom([0, 'homophone', 0]))).toEqual([]);
    });
});

describe('homophone — Year 1 (basic pairs)', () => {
    // T5E review fix re-pin: the recognition pair pool is now gated to TRUE
    // homophones (case-folded dedupe + sound-cluster distractor exclusion),
    // so the dealt stream changed. Every pinned recognition row below is a
    // verified true-homophone pair with a non-colliding distractor.
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g1)).toEqual([
        {"prompt":"I like __ rice with my dinner. (plain or plane)","answer":"plain","id":1,"type":"homophone"},
        {"prompt":"Find the mistake and write the correct word: \"The boat sails on the see.\"","answer":"sea","id":2,"type":"homophone"},
        {"prompt":"Put the pencil __ . (their or there)","answer":"there","id":3,"type":"homophone"},
        {"prompt":"Which two words sound the same? (to, no, know)","answer":"no, know","id":4,"type":"homophone"},
        {"prompt":"I want __ go to the park. (too or to)","answer":"to","id":5,"type":"homophone"},
        {"prompt":"Which two words sound the same? (bee, four, be)","answer":"bee, be","id":6,"type":"homophone"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(homophoneSpec, g1, seedFrom([1, 'homophone', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Find the mistake and write the correct word: \"This bag is to heavy.\"","answer":"too","id":7,"type":"homophone"},
        {"prompt":"Write both words in the blanks: We __ at noon and ate __ for lunch. (meat, meet)","answer":"meet, meat","id":8,"type":"homophone"},
        {"prompt":"I __ books every day. (red or read)","answer":"read","id":9,"type":"homophone"}
        ]);
    });
});

describe('homophone — Year 2 (tricky pairs join)', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g2)).toEqual([
        {"prompt":"Where __ you going? (our or are)","answer":"are","id":1,"type":"homophone"},
        {"prompt":"__ went to the shop yesterday. (Their or They)","answer":"They","id":2,"type":"homophone"},
        {"prompt":"The dog is over __ . (their or there)","answer":"there","id":3,"type":"homophone"},
        {"prompt":"Which two words sound the same? (two, for, to)","answer":"two, to","id":4,"type":"homophone"},
        {"prompt":"This gift is __ you. (for or four)","answer":"for","id":5,"type":"homophone"},
        {"prompt":"Write both words in the blanks: She __ __ cookies: more than seven! (eight, ate)","answer":"ate, eight","id":6,"type":"homophone"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(homophoneSpec, g2, seedFrom([2, 'homophone', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Close your __ . (I or eye)","answer":"eye","id":7,"type":"homophone"},
        {"prompt":"Find the mistake and write the correct word: \"Its going to rain today.\"","answer":"It's","id":8,"type":"homophone"},
        {"prompt":"I do not eat __ . (meat or meet)","answer":"meat","id":9,"type":"homophone"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(homophoneSpec, getEnglishGradeConfig(7), seedFrom([7, 'homophone', 0]))).toEqual([]);
    });
});

describe('homophone — T4B format mix & capacity', () => {
    // Exact per-format counts over a deterministic 200-question Year-1 sheet
    // (measured from the real generator): blank+options, error spot, double
    // blank, twin recognition. The blank format has no fixed stem, so its
    // count is the exact remainder of the 200.
    it('Year 1: exact format counts over 200 questions', () => {
        const problems = homophoneSpec.generate(createRng(seedFrom([1, 'homophone', 0])), g1.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        const error = count('Find the mistake and write the correct word:');
        const double = count('Write both words in the blanks:');
        const recogn = count('Which two words sound the same?');
        expect(error).toBe(39);
        expect(double).toBe(12);
        expect(recogn).toBe(97);
        // Format 1 (blank + two options) is the exact remainder.
        expect(200 - error - double - recogn).toBe(52);
    });

    it('Year 3: exact format counts over 200 questions', () => {
        const g3 = getEnglishGradeConfig(3);
        const problems = homophoneSpec.generate(createRng(seedFrom([3, 'homophone', 0])), g3.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        const error = count('Find the mistake and write the correct word:');
        const double = count('Write both words in the blanks:');
        const recogn = count('Which two words sound the same?');
        // T5E re-pin: the recognition pool gate (true homophones only)
        // re-drew the Year-3 stream; counts moved accordingly.
        expect(error).toBe(32);
        expect(double).toBe(12);
        expect(recogn).toBe(43);
        expect(200 - error - double - recogn).toBe(113);
    });

    // CAPACITY (the core T4B fix): the 100-page ask (6 x 100 = 600 questions)
    // is fully unique at EVERY offering grade — the old banks yielded only
    // 40/52/74 unique questions at grades 1/2/3.
    it('grades 1-6: 600-question (100-page) ask yields 600 unique questions', () => {
        for (const gradeId of [1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const problems = homophoneSpec.generate(createRng(seedFrom([grade.id, 'homophone', 0])), grade.caps, 600);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(600);
        }
    });
});
