// Unit tests for the APOSTROPHES worksheet plugin.
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE page-1 sheet
// (all prompts + answers) is pinned to exact expected values produced from the
// real generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Pins cover page 1 only; generator
// invariants (MC answer in options, no answer printed in compose prompts,
// open-ended answers marked, 100-page capacity) cover the whole stream.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig } from '../../framework';
import { apostropheSpec } from './ApostropheWorksheet';

const g3 = getEnglishGradeConfig(3);
const g6 = getEnglishGradeConfig(6);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(apostropheSpec, grade, seedFrom([grade.id, apostropheSpec.id, 0]));
}

// Extract the trailing "(a, b, c)" option list from an MC prompt; null when
// the prompt is not multiple-choice (a bare "(owner)" hint has no ', ').
function optionsOf(prompt: string): string[] | null {
    const m = prompt.match(/\(([^)]+)\)\s*$/);
    if (!m) return null;
    if (m[1].includes(' / ')) return m[1].split(' / ');
    if (m[1].includes(', ')) return m[1].split(', ');
    return null;
}

// Check prompts legitimately print the verdict word; compose prompts must NOT
// print the apostrophe form the child has to produce.
function isIdentifyOrCheck(prompt: string): boolean {
    return /^(True or false|Is the|Is this|Does this|Find the|Who is speaking)/.test(prompt);
}

// A compose prompt must not print the answer. Single-word answers use
// word-boundary matching; sentence answers use plain includes.
function leaks(prompt: string, answer: string): boolean {
    if (answer.includes(' ')) return prompt.includes(answer);
    const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(prompt);
}

describe('apostrophe plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, page size and single-column layout', () => {
        expect(apostropheSpec.id).toBe('apostrophe');
        expect(apostropheSpec.label).toBe('Apostrophes');
        expect(apostropheSpec.icon).toBe("'");
        // T4C: 6 roomy rows per page (was 16); prose lines run single-column.
        expect(apostropheSpec.perPage).toBe(6);
        expect(apostropheSpec.singleColumn).toBe(true);
    });

    it('describes its scope (possessives & contractions)', () => {
        expect(apostropheSpec.scope(g3)).toBe('possessives & contractions');
        expect(apostropheSpec.scope(g6)).toBe('possessives & contractions');
    });

    it('is gated by the grade catalogue (Years 3..6 only)', () => {
        expect(apostropheSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(apostropheSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(apostropheSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(apostropheSpec.offered(g3)).toBe(true);
        expect(apostropheSpec.offered(g6)).toBe(true);
        expect(apostropheSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(apostropheSpec, getEnglishGradeConfig(2), seedFrom([2, 'apostrophe', 0]))).toEqual([]);
    });
});

describe('apostrophe — Year 3', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g3)).toEqual([
            {"prompt":"Which shows that Ella owns something? (Ellas, Ella's, Ellas')","answer":"Ella's","id":1,"type":"apostrophe"},
            {"prompt":"Which contraction fits: You __ believe this! (won't, wont, wont')","answer":"won't","id":2,"type":"apostrophe"},
            {"prompt":"Which contraction fits: __ are my friends. (you're, youre, youre')","answer":"you're","id":3,"type":"apostrophe"},
            {"prompt":"Which shows that My aunt owns something? (My aunts, My aunts', My aunt's)","answer":"My aunt's","id":4,"type":"apostrophe"},
            {"prompt":"Write the two words for \"won't\".","answer":"will not","id":5,"type":"apostrophe"},
            {"prompt":"Fill in the missing word: __ pen leans over the creek. (the goats)","answer":"the goats'","id":6,"type":"apostrophe"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(apostropheSpec, g3, seedFrom([3, 'apostrophe', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Write the two words for \"hasn't\".","answer":"has not","id":7,"type":"apostrophe"},
            {"prompt":"Fill in the missing word: __ garden is full of sunflowers. (the neighbours)","answer":"the neighbours'","id":8,"type":"apostrophe"},
            {"prompt":"Which shows that Ben owns something? (Ben's, Bens', Bens)","answer":"Ben's","id":9,"type":"apostrophe"}
        ]);
    });
});

describe('apostrophe — Year 6', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g6)).toEqual([
            {"prompt":"Which shows that The baby owns something? (The baby's, The babys, The babys')","answer":"The baby's","id":1,"type":"apostrophe"},
            {"prompt":"Which shows that My cousin owns something? (My cousin's, My cousins', My cousins)","answer":"My cousin's","id":2,"type":"apostrophe"},
            {"prompt":"Write the contraction for \"I have\".","answer":"I've","id":3,"type":"apostrophe"},
            {"prompt":"Write the two words for \"hasn't\".","answer":"has not","id":4,"type":"apostrophe"},
            {"prompt":"Which shows that Our club owns something? (Our clubs, Our club's, Our clubs')","answer":"Our club's","id":5,"type":"apostrophe"},
            {"prompt":"Write the contraction for \"does not\".","answer":"doesn't","id":6,"type":"apostrophe"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(apostropheSpec, g6, seedFrom([6, 'apostrophe', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Write the two words for \"it's\".","answer":"it is","id":7,"type":"apostrophe"},
            {"prompt":"Fill in the missing word: __ lunchbox is on the shelf. (Zoe)","answer":"Zoe's","id":8,"type":"apostrophe"},
            {"prompt":"Which contraction fits: She __ sing at the concert. (wont', wont, won't)","answer":"won't","id":9,"type":"apostrophe"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(apostropheSpec, getEnglishGradeConfig(7), seedFrom([7, 'apostrophe', 0]))).toEqual([]);
    });
});

describe('apostrophe — generator invariants', () => {
    // Invariants run over the full 100-page request for every offered grade.
    for (const grade of [g3, g6]) {
        const ask = apostropheSpec.perPage * 100;
        const problems = apostropheSpec.generate(createRng(seedFrom([grade.id, apostropheSpec.id, 0])), grade.caps, ask);

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
                if (p.answer.startsWith('Example:') || optionsOf(p.prompt) || isIdentifyOrCheck(p.prompt)) continue;
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
