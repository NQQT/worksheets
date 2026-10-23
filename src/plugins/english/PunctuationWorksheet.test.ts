// Unit tests for the PUNCTUATION worksheet plugin (T4B rework).
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE sheet (all
// prompts + answers) is pinned to exact expected values produced from the real
// generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). If the algorithm, pools, or caps change,
// these exact assertions fail — which is what we want, so a silent change to
// the worksheet can't slip through.
//
// T4B additions: perPage 24 -> 8; slot banks expanded (statements 28x30,
// questions 14x26, exclamations 50); two new formats join the written mark
// and mark-choice: full REWRITE (start capital + end mark) and sentence-kind
// MCQ. Capacity: the 100-page ask (800 questions) is fully unique — the old
// space was 1 076 at a 2 400-question ask.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, type GradeConfig } from '../../framework';
import { punctSpec } from './PunctuationWorksheet';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(punctSpec, grade, seedFrom([grade.id, punctSpec.id, 0]));
}

describe('punct plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and T4B page size', () => {
        expect(punctSpec.id).toBe('punct');
        expect(punctSpec.label).toBe('Punctuation');
        expect(punctSpec.icon).toBe('?');
        // T4B density: 8 roomy rows (was 24).
        expect(punctSpec.perPage).toBe(8);
    });

    it('describes its scope', () => {
        expect(punctSpec.scope(g1)).toBe('. ? ! marks');
    });

    it('is gated by the grade catalogue (Year 1..6 offer it, Year 7 does not)', () => {
        expect(punctSpec.offered(g0)).toBe(false);
        expect(punctSpec.offered(g1)).toBe(true);
        expect(punctSpec.offered(g2)).toBe(true);
        expect(punctSpec.offered(getEnglishGradeConfig(3))).toBe(true);
        expect(punctSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(punctSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered type => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(punctSpec, g0, seedFrom([0, 'punct', 0]))).toEqual([]);
    });
});

describe('punct — Year 1', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g1)).toEqual([
        {"prompt":"Rewrite this sentence with the correct start letter and end mark: what a fast car","answer":"What a fast car!","id":1,"type":"punct"},
        {"prompt":"Add the right punctuation: The moon waits for the bell __","answer":".","id":2,"type":"punct"},
        {"prompt":"Which end mark fits: What is your book __ (. ? !)","answer":"?","id":3,"type":"punct"},
        {"prompt":"Rewrite this sentence with the correct start letter and end mark: the train is happy","answer":"The train is happy.","id":4,"type":"punct"},
        {"prompt":"Which end mark fits: The class eats lunch __ (. ? !)","answer":".","id":5,"type":"punct"},
        {"prompt":"What kind of sentence is this: \"Would you like my hat?\" (a question, an exclamation, a statement)","answer":"a question","id":6,"type":"punct"},
        {"prompt":"Add the right punctuation: Look at the moon __","answer":"!","id":7,"type":"punct"},
        {"prompt":"Which end mark fits: What a fun game __ (. ? !)","answer":"!","id":8,"type":"punct"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(punctSpec, g1, seedFrom([1, 'punct', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Which end mark fits: My brother helps my dad __ (. ? !)","answer":".","id":9,"type":"punct"},
        {"prompt":"Rewrite this sentence with the correct start letter and end mark: i love my grandma","answer":"I love my grandma!","id":10,"type":"punct"},
        {"prompt":"Rewrite this sentence with the correct start letter and end mark: is that my coat","answer":"Is that my coat?","id":11,"type":"punct"}
        ]);
    });
});

describe('punct — Year 2', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g2)).toEqual([
        {"prompt":"Add the right punctuation: Will we visit the star __","answer":"?","id":1,"type":"punct"},
        {"prompt":"Add the right punctuation: Can you see my lunch __","answer":"?","id":2,"type":"punct"},
        {"prompt":"Which end mark fits: Who is the moon __ (. ? !)","answer":"?","id":3,"type":"punct"},
        {"prompt":"Rewrite this sentence with the correct start letter and end mark: the moon likes school","answer":"The moon likes school.","id":4,"type":"punct"},
        {"prompt":"Which end mark fits: Where is a flower __ (. ? !)","answer":"?","id":5,"type":"punct"},
        {"prompt":"Rewrite this sentence with the correct start letter and end mark: we finished the puzzle","answer":"We finished the puzzle!","id":6,"type":"punct"},
        {"prompt":"What kind of sentence is this: \"What a shiny bell!\" (an exclamation, a question, a statement)","answer":"an exclamation","id":7,"type":"punct"},
        {"prompt":"What kind of sentence is this: \"I love my puppy!\" (an exclamation, a question, a statement)","answer":"an exclamation","id":8,"type":"punct"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(punctSpec, g2, seedFrom([2, 'punct', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Rewrite this sentence with the correct start letter and end mark: what a fast car","answer":"What a fast car!","id":9,"type":"punct"},
        {"prompt":"Which end mark fits: When does a map __ (. ? !)","answer":"?","id":10,"type":"punct"},
        {"prompt":"Add the right punctuation: The horse brings the mail __","answer":".","id":11,"type":"punct"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(punctSpec, getEnglishGradeConfig(7), seedFrom([7, 'punct', 0]))).toEqual([]);
    });
});

describe('punct — T4B format mix & capacity', () => {
    // Exact per-format counts over a deterministic 200-question Year-1 sheet
    // (measured from the real generator): written mark, mark choice, rewrite,
    // sentence-kind MCQ — every format fires.
    it('Year 1: exact format counts over 200 questions', () => {
        const problems = punctSpec.generate(createRng(seedFrom([1, 'punct', 0])), g1.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        expect(count('Add the right punctuation:')).toBe(45);
        expect(count('Which end mark fits:')).toBe(43);
        expect(count('Rewrite this sentence with the correct start letter and end mark:')).toBe(50);
        expect(count('What kind of sentence is this:')).toBe(62);
    });

    it('Year 3: exact format counts over 200 questions', () => {
        const g3 = getEnglishGradeConfig(3);
        const problems = punctSpec.generate(createRng(seedFrom([3, 'punct', 0])), g3.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        expect(count('Add the right punctuation:')).toBe(55);
        expect(count('Which end mark fits:')).toBe(50);
        expect(count('Rewrite this sentence with the correct start letter and end mark:')).toBe(49);
        expect(count('What kind of sentence is this:')).toBe(46);
    });

    // CAPACITY: the 100-page ask (8 x 100 = 800 questions) is fully unique
    // (the old space was 1 076 at a 2 400-question ask — repeats from page
    // 45). The true printed space clears 3 000 at every grade.
    it('Year 1: 800-question (100-page) ask yields 800 unique questions', () => {
        const problems = punctSpec.generate(createRng(seedFrom([1, 'punct', 0])), g1.caps, 800);
        expect(new Set(problems.map((p) => p.prompt)).size).toBe(800);
    });

    it('Year 1: 3 000-question ask yields 3 000 unique questions', () => {
        const problems = punctSpec.generate(createRng(seedFrom([1, 'punct', 0])), g1.caps, 3000);
        expect(new Set(problems.map((p) => p.prompt)).size).toBe(3000);
    });
});
