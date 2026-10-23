// Unit tests for the OPPOSITE WORDS worksheet plugin (T4B rework).
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE sheet (all
// prompts + answers) is pinned to exact expected values produced from the real
// generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). If the algorithm, pair bank, or caps
// change, these exact assertions fail — which is what we want, so a silent
// change to the worksheet can't slip through.
//
// T4B additions: exact per-format counts (the four genuine task formats all
// fire) and the exact unique-question capacity at the 100-page ask.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, type GradeConfig } from '../../framework';
import { oppositeSpec } from './OppositeWordsWorksheet';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(oppositeSpec, grade, seedFrom([grade.id, oppositeSpec.id, 0]));
}

describe('opposite plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and T4B page size', () => {
        expect(oppositeSpec.id).toBe('opposite');
        expect(oppositeSpec.label).toBe('Opposite Words');
        expect(oppositeSpec.icon).toBe('⇄');
        // T4B density: 8 roomy rows (was 24).
        expect(oppositeSpec.perPage).toBe(8);
    });

    it('describes its pair scope from the grade caps (starter vs common vs antonyms)', () => {
        expect(oppositeSpec.scope(g0)).toBe('starter opposites');
        expect(oppositeSpec.scope(g1)).toBe('common opposites');
        expect(oppositeSpec.scope(g2)).toBe('common opposites');
        // Year 3+ (wordTier 4) unlocks the upper-primary antonym set.
        expect(oppositeSpec.scope(getEnglishGradeConfig(3))).toBe('antonyms');
    });

    it('is gated by the grade catalogue (Year 1..6 offer it, Year 7 does not)', () => {
        expect(oppositeSpec.offered(g0)).toBe(false);
        expect(oppositeSpec.offered(g1)).toBe(true);
        expect(oppositeSpec.offered(g2)).toBe(true);
        expect(oppositeSpec.offered(getEnglishGradeConfig(3))).toBe(true);
        expect(oppositeSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(oppositeSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered type => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(oppositeSpec, g0, seedFrom([0, 'opposite', 0]))).toEqual([]);
    });
});

describe('opposite — Year 1 (tier-2 common word set)', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g1)).toEqual([
        {"prompt":"Complete the sentence: The sun shines by day; the moon shines by __ .","answer":"night","id":1,"type":"opposite"},
        {"prompt":"What is the opposite of \"fast\"?","answer":"slow","visual":"bolt","id":2,"type":"opposite"},
        {"prompt":"Complete the sentence: The kettle is hot; the ice cream is __ .","answer":"cold","id":3,"type":"opposite"},
        {"prompt":"Which two words are opposites? (over, under, early)","answer":"under, over","id":4,"type":"opposite"},
        {"prompt":"What is the opposite of \"always\"?","answer":"never","id":5,"type":"opposite"},
        {"prompt":"Which two words are opposites? (bottom, laugh, top)","answer":"top, bottom","id":6,"type":"opposite"},
        {"prompt":"Complete the sentence: The gate is near; the hill is __ .","answer":"far","id":7,"type":"opposite"},
        {"prompt":"What is the opposite of \"dangerous\"?","answer":"safe","id":8,"type":"opposite"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(oppositeSpec, g1, seedFrom([1, 'opposite', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Complete the sentence: A cheetah runs fast; a snail moves __ .","answer":"slow","id":9,"type":"opposite"},
        {"prompt":"Which word means the opposite of \"laugh\"? (cry, sell, over)","answer":"cry","id":10,"type":"opposite"},
        {"prompt":"Which word means the opposite of \"push\"? (inside, sweet, pull)","answer":"pull","id":11,"type":"opposite"}
        ]);
    });
});

describe('opposite — Year 2 (same pair bank, different seed)', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g2)).toEqual([
        {"prompt":"What is the opposite of \"quiet\"?","answer":"loud","visual":"zzz","id":1,"type":"opposite"},
        {"prompt":"What is the opposite of \"give\"?","answer":"take","id":2,"type":"opposite"},
        {"prompt":"Complete the sentence: The gate is near; the hill is __ .","answer":"far","id":3,"type":"opposite"},
        {"prompt":"Complete the sentence: Tom finished first; Ben finished __ .","answer":"last","id":4,"type":"opposite"},
        {"prompt":"Which word means the opposite of \"before\"? (hard, after, back)","answer":"after","id":5,"type":"opposite"},
        {"prompt":"Which word means the opposite of \"laugh\"? (cry, inside, sell)","answer":"cry","id":6,"type":"opposite"},
        {"prompt":"Which word means the opposite of \"buy\"? (sell, go, short)","answer":"sell","id":7,"type":"opposite"},
        {"prompt":"Complete the sentence: The sun shines by day; the moon shines by __ .","answer":"night","id":8,"type":"opposite"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(oppositeSpec, g2, seedFrom([2, 'opposite', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Which word means the opposite of \"back\"? (front, heavy, out)","answer":"front","id":9,"type":"opposite"},
        {"prompt":"Which word means the opposite of \"begin\"? (end, push, out)","answer":"end","id":10,"type":"opposite"},
        {"prompt":"What is the opposite of \"out\"?","answer":"in","id":11,"type":"opposite"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(oppositeSpec, getEnglishGradeConfig(7), seedFrom([7, 'opposite', 0]))).toEqual([]);
    });
});

describe('opposite — T4B format mix & capacity', () => {
    // Exact per-format counts over a deterministic 200-question Year-1 sheet
    // (measured from the real generator): written antonym, MCQ, context
    // cloze, pair-find — every format fires, none dominates.
    it('Year 1: exact format counts over 200 questions', () => {
        const problems = oppositeSpec.generate(createRng(seedFrom([1, 'opposite', 0])), g1.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        expect(count('What is the opposite of')).toBe(62);
        expect(count('Which word means the opposite of')).toBe(78);
        expect(count('Complete the sentence:')).toBe(20);
        expect(count('Which two words are opposites?')).toBe(40);
    });

    // Year 3+ (wordTier 4) adds the upper antonym bank; exact counts show the
    // same four formats still fire on the wider pool.
    it('Year 3: exact format counts over 200 questions', () => {
        const g3 = getEnglishGradeConfig(3);
        const problems = oppositeSpec.generate(createRng(seedFrom([3, 'opposite', 0])), g3.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        expect(count('What is the opposite of')).toBe(65);
        expect(count('Which word means the opposite of')).toBe(72);
        expect(count('Complete the sentence:')).toBe(28);
        expect(count('Which two words are opposites?')).toBe(35);
    });

    // CAPACITY: the 100-page ask (8 x 100 = 800 questions) is fully unique —
    // the sheet clears the 100-page bar at Year 1.
    it('Year 1: 800-question (100-page) ask yields 800 unique questions', () => {
        const problems = oppositeSpec.generate(createRng(seedFrom([1, 'opposite', 0])), g1.caps, 800);
        expect(new Set(problems.map((p) => p.prompt)).size).toBe(800);
    });
});
