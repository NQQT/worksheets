// Unit tests for the COMMA LISTS worksheet plugin.
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE page-1 sheet
// (all prompts + answers) is pinned to exact expected values produced from the
// real generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Pins cover page 1 only; generator
// invariants (MC answer in options, no answer printed in compose prompts,
// open-ended answers marked, 100-page capacity) cover the whole stream.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig } from '../../framework';
import { commaSpec } from './CommaListWorksheet';

const g3 = getEnglishGradeConfig(3);
const g6 = getEnglishGradeConfig(6);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(commaSpec, grade, seedFrom([grade.id, commaSpec.id, 0]));
}

// Extract the trailing "(a / b / c)" option list from an MC prompt (comma
// options themselves contain commas, so ' / ' is the separator); null when the
// prompt is not multiple-choice.
function optionsOf(prompt: string): string[] | null {
    const m = prompt.match(/\(([^)]+)\)\s*$/);
    if (!m) return null;
    if (m[1].includes(' / ')) return m[1].split(' / ');
    if (m[1].includes(', ')) return m[1].split(', ');
    return null;
}

// Check prompts legitimately print the verdict word ("correctly" contains
// "correct"); rewrite prompts must NOT print the comma-punctuated answer.
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

describe('comma plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, page size and single-column layout', () => {
        expect(commaSpec.id).toBe('comma');
        expect(commaSpec.label).toBe('Comma Lists');
        expect(commaSpec.icon).toBe(',');
        // T4C: 6 roomy rows per page (was 16); prose lines run single-column.
        expect(commaSpec.perPage).toBe(6);
        expect(commaSpec.singleColumn).toBe(true);
    });

    it('describes its scope (commas in lists)', () => {
        expect(commaSpec.scope(g3)).toBe('commas in lists');
        expect(commaSpec.scope(g6)).toBe('commas in lists');
    });

    it('is gated by the grade catalogue (Years 3..6 only)', () => {
        expect(commaSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(commaSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(commaSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(commaSpec.offered(g3)).toBe(true);
        expect(commaSpec.offered(g6)).toBe(true);
        expect(commaSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(commaSpec, getEnglishGradeConfig(2), seedFrom([2, 'comma', 0]))).toEqual([]);
    });
});

describe('comma — Year 3', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g3)).toEqual([
            {"prompt":"Rewrite with commas: At the zoo we saw koalas possums platypuses.","answer":"At the zoo we saw koalas, possums, platypuses.","id":1,"type":"comma"},
            {"prompt":"Is this list punctuated correctly? \"apples, bananas, pears, grapes and oranges\"","answer":"correct","id":2,"type":"comma"},
            {"prompt":"Rewrite with commas: For lunch I packed carrots pumpkins spinach peas.","answer":"For lunch I packed carrots, pumpkins, spinach, peas.","id":3,"type":"comma"},
            {"prompt":"Is this list punctuated correctly? \"potatoes spinach peas\"","answer":"incorrect","id":4,"type":"comma"},
            {"prompt":"Is this list punctuated correctly? \"carrots, potatoes, spinach, corn and peas\"","answer":"correct","id":5,"type":"comma"},
            {"prompt":"How many items are in this list? Sydney, Adelaide, Darwin, Hobart","answer":"4","id":6,"type":"comma"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(commaSpec, g3, seedFrom([3, 'comma', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Which list uses commas correctly? (Perth, Darwin and Hobart / Perth, and Darwin, and Hobart / Perth Darwin Hobart)","answer":"Perth, Darwin and Hobart","id":7,"type":"comma"},
            {"prompt":"How many items are in this list? pencils, erasers, scissors, gluesticks","answer":"4","id":8,"type":"comma"},
            {"prompt":"Is this list punctuated correctly? \"carrots, potatoes, pumpkins, corn and peas\"","answer":"correct","id":9,"type":"comma"}
        ]);
    });
});

describe('comma — Year 6', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g6)).toEqual([
            {"prompt":"Is this list punctuated correctly? \"guitars, pianos and violins\"","answer":"correct","id":1,"type":"comma"},
            {"prompt":"Which list uses commas correctly? (apples, bananas, grapes and oranges / apples, and bananas, and grapes, and oranges / apples bananas grapes oranges)","answer":"apples, bananas, grapes and oranges","id":2,"type":"comma"},
            {"prompt":"Which list uses commas correctly? (carrots, and pumpkins, and spinach, and corn, and peas / carrots, pumpkins, spinach, corn and peas / carrots pumpkins spinach corn peas)","answer":"carrots, pumpkins, spinach, corn and peas","id":3,"type":"comma"},
            {"prompt":"Which list uses commas correctly? (potatoes pumpkins spinach / potatoes, pumpkins and spinach / potatoes, and pumpkins, and spinach)","answer":"potatoes, pumpkins and spinach","id":4,"type":"comma"},
            {"prompt":"Rewrite with commas: My dream jobs are nurse teacher farmer chef pilot.","answer":"My dream jobs are nurse, teacher, farmer, chef, pilot.","id":5,"type":"comma"},
            {"prompt":"Is this list punctuated correctly? \"pears oranges mangoes\"","answer":"incorrect","id":6,"type":"comma"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(commaSpec, g6, seedFrom([6, 'comma', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Rewrite with commas: For lunch I packed carrots pumpkins spinach corn.","answer":"For lunch I packed carrots, pumpkins, spinach, corn.","id":7,"type":"comma"},
            {"prompt":"Rewrite with commas: In my school bag I keep rulers erasers paintbrushes scissors gluesticks.","answer":"In my school bag I keep rulers, erasers, paintbrushes, scissors, gluesticks.","id":8,"type":"comma"},
            {"prompt":"Write your own list of three colours separated by commas.","answer":"Example: blue, green and yellow (any sensible list is correct)","id":9,"type":"comma"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(commaSpec, getEnglishGradeConfig(7), seedFrom([7, 'comma', 0]))).toEqual([]);
    });
});

describe('comma — generator invariants', () => {
    // Invariants run over the full 100-page request for every offered grade.
    for (const grade of [g3, g6]) {
        const ask = commaSpec.perPage * 100;
        const problems = commaSpec.generate(createRng(seedFrom([grade.id, commaSpec.id, 0])), grade.caps, ask);

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
