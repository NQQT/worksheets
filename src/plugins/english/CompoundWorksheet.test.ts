// Unit tests for the COMPOUND WORDS worksheet plugin.
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE page-1 sheet
// (all prompts + answers) is pinned to exact expected values produced from the
// real generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Pins cover page 1 only; generator
// invariants (MC answer in options, no answer printed in compose prompts,
// open-ended answers marked, 100-page capacity) cover the whole stream.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig } from '../../framework';
import { compoundSpec } from './CompoundWorksheet';

const g3 = getEnglishGradeConfig(3);
const g6 = getEnglishGradeConfig(6);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(compoundSpec, grade, seedFrom([grade.id, compoundSpec.id, 0]));
}

// Extract the trailing "(a, b, c)" option list from an MC prompt; null when
// the prompt is not multiple-choice.
function optionsOf(prompt: string): string[] | null {
    const m = prompt.match(/\(([^)]+)\)\s*$/);
    if (!m) return null;
    if (m[1].includes(' / ')) return m[1].split(' / ');
    if (m[1].includes(', ')) return m[1].split(', ');
    return null;
}

// A compose prompt must not print the answer. Single-word answers use
// word-boundary matching; "x + y" split answers use plain includes.
function leaks(prompt: string, answer: string): boolean {
    if (answer.includes(' ')) return prompt.includes(answer);
    const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(prompt);
}

describe('compound plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(compoundSpec.id).toBe('compound');
        expect(compoundSpec.label).toBe('Compound Words');
        expect(compoundSpec.icon).toBe('⚓');
        // T4C: 8 roomy rows per page (was 18).
        expect(compoundSpec.perPage).toBe(8);
    });

    it('describes its scope (two words, one word)', () => {
        expect(compoundSpec.scope(g3)).toBe('two words, one word');
        expect(compoundSpec.scope(g6)).toBe('two words, one word');
    });

    it('is gated by the grade catalogue (Years 3..6 only)', () => {
        expect(compoundSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(compoundSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(compoundSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(compoundSpec.offered(g3)).toBe(true);
        expect(compoundSpec.offered(g6)).toBe(true);
        expect(compoundSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(compoundSpec, getEnglishGradeConfig(2), seedFrom([2, 'compound', 0]))).toEqual([]);
    });
});

describe('compound — Year 3', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g3)).toEqual([
            {"prompt":"Join into one word: every + one","answer":"everyone","id":1,"type":"compound"},
            {"prompt":"Which word is made from \"under\" and \"ground\"? (bowroom, hairflower, underground)","answer":"underground","id":2,"type":"compound"},
            {"prompt":"Which compound word fits: Dad pushed the __ across the lawn. (mailbox, lawnmower, toothbrush)","answer":"lawnmower","id":3,"type":"compound"},
            {"prompt":"Join into one word: key + board","answer":"keyboard","id":4,"type":"compound"},
            {"prompt":"Write your own compound word (two words joined into one).","answer":"Example: bedtime (any real compound word is correct)","id":5,"type":"compound"},
            {"prompt":"Which one is a real compound word? (lamppost, brushshop, pastebirth)","answer":"lamppost","id":6,"type":"compound"},
            {"prompt":"Which word is made from \"dish\" and \"washer\"? (buttertree, flydish, dishwasher)","answer":"dishwasher","id":7,"type":"compound"},
            {"prompt":"Which one is a real compound word? (boardpan, sunrain, watermelon)","answer":"watermelon","id":8,"type":"compound"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(compoundSpec, g3, seedFrom([3, 'compound', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Which two words make up \"treehouse\"?","answer":"tree + house","id":9,"type":"compound"},
            {"prompt":"Which two words make up \"anyone\"?","answer":"any + one","id":10,"type":"compound"},
            {"prompt":"Which one is a real compound word? (underrain, bookworm, parentdream)","answer":"bookworm","id":11,"type":"compound"}
        ]);
    });
});

describe('compound — Year 6', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g6)).toEqual([
            {"prompt":"Which word is made from \"air\" and \"port\"? (airrain, footside, airport)","answer":"airport","id":1,"type":"compound"},
            {"prompt":"Join into one word: rain + coat","answer":"raincoat","id":2,"type":"compound"},
            {"prompt":"Which two words make up \"backpack\"?","answer":"back + pack","id":3,"type":"compound"},
            {"prompt":"Write your own compound word (two words joined into one).","answer":"Example: underground (any real compound word is correct)","id":4,"type":"compound"},
            {"prompt":"Join into one word: post + man","answer":"postman","id":5,"type":"compound"},
            {"prompt":"Which word is made from \"every\" and \"one\"? (everyone, fishcoat, bedone)","answer":"everyone","id":6,"type":"compound"},
            {"prompt":"Join into one word: sea + shell","answer":"seashell","id":7,"type":"compound"},
            {"prompt":"Which compound word fits: She combed the tangles out with a __. (windmill, hairbrush, starfish)","answer":"hairbrush","id":8,"type":"compound"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(compoundSpec, g6, seedFrom([6, 'compound', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Which word is made from \"pan\" and \"cake\"? (pastewind, coatport, pancake)","answer":"pancake","id":9,"type":"compound"},
            {"prompt":"Which word is made from \"lawn\" and \"mower\"? (onebook, sunwater, lawnmower)","answer":"lawnmower","id":10,"type":"compound"},
            {"prompt":"Which one is a real compound word? (flowerbrush, bookshop, boxpaste)","answer":"bookshop","id":11,"type":"compound"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(compoundSpec, getEnglishGradeConfig(7), seedFrom([7, 'compound', 0]))).toEqual([]);
    });
});

describe('compound — generator invariants', () => {
    // Invariants run over the full 100-page request for every offered grade.
    for (const grade of [g3, g6]) {
        const ask = compoundSpec.perPage * 100;
        const problems = compoundSpec.generate(createRng(seedFrom([grade.id, compoundSpec.id, 0])), grade.caps, ask);

        it(`year ${grade.id}: fills ${ask} unique prompts (capacity floor)`, () => {
            expect(problems.length).toBe(ask);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ask);
        });

        it(`year ${grade.id}: every MC answer is one of its printed options`, () => {
            for (const p of problems) {
                const options = optionsOf(p.prompt);
                if (options) expect(options).toContain(p.answer);
            }
        });

        it(`year ${grade.id}: compose answers are never printed in their prompt`, () => {
            for (const p of problems) {
                if (p.answer.startsWith('Example:') || optionsOf(p.prompt)) continue;
                expect(leaks(p.prompt, p.answer)).toBe(false);
            }
        });

        it(`year ${grade.id}: open-ended answers are explicitly marked`, () => {
            for (const p of problems) {
                if (p.answer.startsWith('Example:')) expect(p.answer).toContain('(any');
            }
        });
    }
});
