// Unit tests for the PLURALS worksheet plugin (T4B rework).
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE sheet (all
// prompts + answers) is pinned to exact expected values produced from the real
// generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). If the algorithm, pair bank, or caps
// change, these exact assertions fail — which is what we want, so a silent
// change to the worksheet can't slip through.
//
// T4B additions: exact per-format counts (written, MCQ, sentence cloze,
// ending rule, form spelling), the quantity-contrast cue contract, and the
// exact unique-question capacity at the 100-page ask.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, type GradeConfig } from '../../framework';
import { pluralSpec } from './PluralsWorksheet';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(pluralSpec, grade, seedFrom([grade.id, pluralSpec.id, 0]));
}

describe('plural plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and T4B page size', () => {
        expect(pluralSpec.id).toBe('plural');
        expect(pluralSpec.label).toBe('Plurals');
        expect(pluralSpec.icon).toBe('s');
        // T4B density: 8 roomy rows (was 24).
        expect(pluralSpec.perPage).toBe(8);
    });

    it('describes its scope from the grade caps (regular vs regular & irregular)', () => {
        expect(pluralSpec.scope(g1)).toBe('regular -s endings');
        expect(pluralSpec.scope(g2)).toBe('regular & irregular');
    });

    it('is gated by the grade catalogue (Year 1..6 offer it, Year 7 does not)', () => {
        expect(pluralSpec.offered(g0)).toBe(false);
        expect(pluralSpec.offered(g1)).toBe(true);
        expect(pluralSpec.offered(g2)).toBe(true);
        expect(pluralSpec.offered(getEnglishGradeConfig(3))).toBe(true);
        expect(pluralSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(pluralSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered type => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(pluralSpec, g0, seedFrom([0, 'plural', 0]))).toEqual([]);
    });
});

describe('plural — Year 1 (regular set only)', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g1)).toEqual([
        {"prompt":"What is the singular of \"maps\"? (dish, map, wigs)","answer":"map","visual":"map","visualCount":3,"id":1,"type":"plural"},
        {"prompt":"Choose the right word: The __ make honey in the hive. (bees, bee)","answer":"bees","visual":"bee","visualCount":1,"id":2,"type":"plural"},
        {"prompt":"Choose the right word: We saw six __ in the pond. (frogs, frog)","answer":"frogs","visual":"frog","visualCount":1,"id":3,"type":"plural"},
        {"prompt":"What is the plural of \"tree\"?","answer":"trees","visual":"tree","visualCount":1,"id":4,"type":"plural"},
        {"prompt":"Which is the plural of \"dish\" spelled correctly? (dishs, dishes, dishies)","answer":"dishes","id":5,"type":"plural"},
        {"prompt":"Choose the right word: A __ lives in a hive. (bees, bee)","answer":"bee","visual":"bee","visualCount":3,"id":6,"type":"plural"},
        {"prompt":"Which ending makes \"van\" plural? (-s, -es, -ies)","answer":"-s","id":7,"type":"plural"},
        {"prompt":"Choose the right word: We planted three __ in spring. (trees, tree)","answer":"trees","visual":"tree","visualCount":1,"id":8,"type":"plural"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(pluralSpec, g1, seedFrom([1, 'plural', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Choose the right word: Mum bought fresh __ at the market. (eggs, egg)","answer":"eggs","visualCount":1,"id":9,"type":"plural"},
        {"prompt":"Choose the right word: The farmer has ten __. (pigs, pig)","answer":"pigs","visual":"pig","visualCount":1,"id":10,"type":"plural"},
        {"prompt":"Which ending makes \"fan\" plural? (-s, -es, -ies)","answer":"-s","id":11,"type":"plural"}
        ]);
    });

    it('Year 1 never asks an irregular pair (tricky gate)', () => {
        const problems = pluralSpec.generate(createRng(seedFrom([1, 'plural', 0])), g1.caps, 200);
        const irregulars = ['child', 'children', 'man', 'men', 'woman', 'women', 'foot', 'feet', 'tooth', 'teeth', 'mouse', 'mice', 'goose', 'geese', 'ox', 'oxen', 'person', 'people', 'leaf', 'leaves', 'life', 'lives', 'knife', 'knives', 'half', 'halves', 'hero', 'heroes'];
        // No irregular word may appear as the PROMPT word of a plural/singular
        // ask or ending-rule item at Year 1.
        for (const p of problems) {
            const m = p.prompt.match(/"(?:([^"]+))"/);
            if (m && (p.prompt.startsWith('What is the') || p.prompt.startsWith('Which ending'))) {
                expect(irregulars).not.toContain(m[1]);
            }
        }
    });
});

describe('plural — Year 2 (irregular set joins via tricky)', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g2)).toEqual([
        {"prompt":"What is the plural of \"fan\"? (fans, wig, children)","answer":"fans","visual":"fan","visualCount":1,"id":1,"type":"plural"},
        {"prompt":"What is the singular of \"trees\"?","answer":"tree","visual":"tree","visualCount":3,"id":2,"type":"plural"},
        {"prompt":"What is the plural of \"pen\"? (top, pens, boat)","answer":"pens","visual":"pen","visualCount":1,"id":3,"type":"plural"},
        {"prompt":"What is the singular of \"knives\"?","answer":"knife","visualCount":3,"id":4,"type":"plural"},
        {"prompt":"Choose the right word: The story has three __. (heroes, hero)","answer":"heroes","visualCount":1,"id":5,"type":"plural"},
        {"prompt":"Choose the right word: The __ flew south for winter. (geese, goose)","answer":"geese","visualCount":1,"id":6,"type":"plural"},
        {"prompt":"What is the plural of \"boat\"?","answer":"boats","visual":"boat","visualCount":1,"id":7,"type":"plural"},
        {"prompt":"What is the singular of \"nets\"? (net, foot, sandwich)","answer":"net","visual":"net","visualCount":3,"id":8,"type":"plural"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(pluralSpec, g2, seedFrom([2, 'plural', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"What is the plural of \"watch\"?","answer":"watches","visual":"watch","visualCount":1,"id":9,"type":"plural"},
        {"prompt":"Which ending makes \"flower\" plural? (-s, -es, -ies)","answer":"-s","id":10,"type":"plural"},
        {"prompt":"What is the plural of \"woman\"?","answer":"women","visualCount":1,"id":11,"type":"plural"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(pluralSpec, getEnglishGradeConfig(7), seedFrom([7, 'plural', 0]))).toEqual([]);
    });
});

describe('plural — T4B format mix & capacity', () => {
    // Exact per-format counts over a deterministic 200-question Year-1 sheet
    // (measured from the real generator). The sentence-cloze count is capped
    // at 10 because the Year-1 sentence pool holds exactly 10 regular items
    // (each prints in both option orders, but this seed dealt these 10).
    it('Year 1: exact format counts over 200 questions', () => {
        const problems = pluralSpec.generate(createRng(seedFrom([1, 'plural', 0])), g1.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        expect(count('What is the plural of')).toBe(69);
        expect(count('What is the singular of')).toBe(75);
        expect(count('Choose the right word:')).toBe(10);
        expect(count('Which ending makes')).toBe(22);
        expect(count('Which is the plural of')).toBe(24);
    });

    it('Year 3: exact format counts over 200 questions', () => {
        const g3 = getEnglishGradeConfig(3);
        const problems = pluralSpec.generate(createRng(seedFrom([3, 'plural', 0])), g3.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        expect(count('What is the plural of')).toBe(71);
        expect(count('What is the singular of')).toBe(73);
        expect(count('Choose the right word:')).toBe(19);
        expect(count('Which ending makes')).toBe(14);
        expect(count('Which is the plural of')).toBe(23);
    });

    // QUANTITY-CONTRAST CUE: a pluralised answer prints ONE picture of the
    // singular concept; a singularised answer prints THREE.
    it('Year 1: cue count follows the quantity contrast', () => {
        const problems = pluralSpec.generate(createRng(seedFrom([1, 'plural', 0])), g1.caps, 200);
        for (const p of problems) {
            if (p.visual === undefined) continue;
            if (p.prompt.startsWith('What is the plural of') || p.prompt.startsWith('Choose the right word')) {
                // Answer is the plural form (or the cloze answer is plural) —
                // one picture when the answer is the plural, three when it is
                // the singular; the pinned rule is answer===plural ? 1 : 3.
                const cloze = p.prompt.startsWith('Choose the right word');
                const answerIsPlural = cloze ? p.answer.endsWith('s') : true;
                expect(p.visualCount).toBe(answerIsPlural ? 1 : 3);
            } else if (p.prompt.startsWith('What is the singular of')) {
                expect(p.visualCount).toBe(3);
            }
        }
    });

    // CAPACITY: the 100-page ask (8 x 100 = 800 questions) is fully unique.
    it('Year 1: 800-question (100-page) ask yields 800 unique questions', () => {
        const problems = pluralSpec.generate(createRng(seedFrom([1, 'plural', 0])), g1.caps, 800);
        expect(new Set(problems.map((p) => p.prompt)).size).toBe(800);
    });
});
