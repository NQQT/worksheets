// Unit tests for the PAST TENSE worksheet plugin.
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE page-1 sheet
// (all prompts + answers) is pinned to exact expected values produced from the
// real generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Pins cover page 1 only; generator
// invariants (MC answer in options, no answer printed in compose prompts,
// open-ended answers marked, 100-page capacity) cover the whole stream.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig } from '../../framework';
import { tenseSpec } from './PastTenseWorksheet';

const g2 = getEnglishGradeConfig(2);
const g3 = getEnglishGradeConfig(3);
const g6 = getEnglishGradeConfig(6);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(tenseSpec, grade, seedFrom([grade.id, tenseSpec.id, 0]));
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

// Check prompts legitimately print the answer (true/false stems contain the
// verdict word); compose prompts must NOT print it.
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

describe('tense plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(tenseSpec.id).toBe('tense');
        expect(tenseSpec.label).toBe('Past Tense');
        expect(tenseSpec.icon).toBe('→');
        // T4C: 8 roomy rows per page instead of 24 cramped ones.
        expect(tenseSpec.perPage).toBe(8);
    });

    it('describes its scope (past forms)', () => {
        expect(tenseSpec.scope(g2)).toBe('past forms');
    });

    it('is gated by the grade catalogue (Year 2..6 offer it, Year 7 does not)', () => {
        expect(tenseSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(tenseSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(tenseSpec.offered(g2)).toBe(true);
        expect(tenseSpec.offered(g3)).toBe(true);
        expect(tenseSpec.offered(g6)).toBe(true);
        expect(tenseSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(tenseSpec, getEnglishGradeConfig(1), seedFrom([1, 'tense', 0]))).toEqual([]);
    });
});

describe('tense — Year 2', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g2)).toEqual([
            {"prompt":"True or false: the past tense of \"feel\" is \"felt\".","answer":"true","id":1,"type":"tense"},
            {"prompt":"True or false: the past tense of \"dance\" is \"danceed\".","answer":"false","id":2,"type":"tense"},
            {"prompt":"Write a sentence about something that happened yesterday. Use \"jumped\".","answer":"Example: The children jumped over the log. (any sensible sentence using \"jumped\" is correct)","id":3,"type":"tense"},
            {"prompt":"True or false: the past tense of \"clap\" is \"claped\".","answer":"false","id":4,"type":"tense"},
            {"prompt":"Write a sentence about something that happened yesterday. Use \"thought\".","answer":"Example: We thought about it. (any sensible sentence using \"thought\" is correct)","id":5,"type":"tense"},
            {"prompt":"What is the past tense of \"watch\"? (dropped, bought, watched)","answer":"watched","id":6,"type":"tense"},
            {"prompt":"Rewrite in the past tense: \"They start the game.\"","answer":"They started the game.","id":7,"type":"tense"},
            {"prompt":"What is the past tense of \"make\"?","answer":"made","id":8,"type":"tense"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(tenseSpec, g2, seedFrom([2, 'tense', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Write a sentence about something that happened yesterday. Use \"loved\".","answer":"Example: You loved ice cream. (any sensible sentence using \"loved\" is correct)","id":9,"type":"tense"},
            {"prompt":"Write a sentence about something that happened yesterday. Use \"smiled\".","answer":"Example: We smiled at the photo. (any sensible sentence using \"smiled\" is correct)","id":10,"type":"tense"},
            {"prompt":"What is the past tense of \"drop\"?","answer":"dropped","id":11,"type":"tense"}
        ]);
    });
});

describe('tense — Year 3', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g3)).toEqual([
            {"prompt":"What is the past tense of \"make\"?","answer":"made","id":1,"type":"tense"},
            {"prompt":"Rewrite in the past tense: \"You hop across the yard.\"","answer":"You hopped across the yard.","id":2,"type":"tense"},
            {"prompt":"What is the past tense of \"drink\"?","answer":"drank","id":3,"type":"tense"},
            {"prompt":"True or false: the past tense of \"kick\" is \"kicked\".","answer":"true","id":4,"type":"tense"},
            {"prompt":"What is the past tense of \"drive\"?","answer":"drove","id":5,"type":"tense"},
            {"prompt":"Write a sentence about something that happened yesterday. Use \"started\".","answer":"Example: I started the game. (any sensible sentence using \"started\" is correct)","id":6,"type":"tense"},
            {"prompt":"Write a sentence about something that happened yesterday. Use \"grabbed\".","answer":"Example: I grabbed the rope. (any sensible sentence using \"grabbed\" is correct)","id":7,"type":"tense"},
            {"prompt":"Write a sentence about something that happened yesterday. Use \"felt\".","answer":"Example: They felt happy. (any sensible sentence using \"felt\" is correct)","id":8,"type":"tense"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(tenseSpec, g3, seedFrom([3, 'tense', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Write a sentence about something that happened yesterday. Use \"ate\".","answer":"Example: The children ate a big lunch. (any sensible sentence using \"ate\" is correct)","id":9,"type":"tense"},
            {"prompt":"Rewrite in the past tense: \"The children find a lost coin.\"","answer":"The children found a lost coin.","id":10,"type":"tense"},
            {"prompt":"What is the past tense of \"write\"? (wrote, caught, went)","answer":"wrote","id":11,"type":"tense"}
        ]);
    });
});

describe('tense — Year 6', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g6)).toEqual([
            {"prompt":"What is the past tense of \"swim\"? (studied, swam, went)","answer":"swam","id":1,"type":"tense"},
            {"prompt":"True or false: the past tense of \"live\" is \"liveed\".","answer":"false","id":2,"type":"tense"},
            {"prompt":"True or false: the past tense of \"stop\" is \"stopped\".","answer":"true","id":3,"type":"tense"},
            {"prompt":"Rewrite in the past tense: \"My friends hop across the yard.\"","answer":"My friends hopped across the yard.","id":4,"type":"tense"},
            {"prompt":"What is the past tense of \"like\"?","answer":"liked","id":5,"type":"tense"},
            {"prompt":"True or false: the past tense of \"ask\" is \"asked\".","answer":"true","id":6,"type":"tense"},
            {"prompt":"Rewrite in the past tense: \"We love ice cream.\"","answer":"We loved ice cream.","id":7,"type":"tense"},
            {"prompt":"What is the past tense of \"see\"? (saw, studied, kept)","answer":"saw","id":8,"type":"tense"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(tenseSpec, g6, seedFrom([6, 'tense', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"What is the past tense of \"run\"? (called, studied, ran)","answer":"ran","id":9,"type":"tense"},
            {"prompt":"Write a sentence about something that happened yesterday. Use \"washed\".","answer":"Example: You washed the dishes. (any sensible sentence using \"washed\" is correct)","id":10,"type":"tense"},
            {"prompt":"What is the past tense of \"drive\"? (heard, drove, asked)","answer":"drove","id":11,"type":"tense"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(tenseSpec, getEnglishGradeConfig(7), seedFrom([7, 'tense', 0]))).toEqual([]);
    });
});

describe('tense — generator invariants', () => {
    // Invariants run over the full 100-page request for every offered grade.
    for (const grade of [g2, g3, g6]) {
        const ask = tenseSpec.perPage * 100;
        const problems = tenseSpec.generate(createRng(seedFrom([grade.id, tenseSpec.id, 0])), grade.caps, ask);

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
