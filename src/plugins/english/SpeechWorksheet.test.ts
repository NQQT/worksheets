// Unit tests for the DIRECT SPEECH worksheet plugin.
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE page-1 sheet
// (all prompts + answers) is pinned to exact expected values produced from the
// real generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Pins cover page 1 only; generator
// invariants (MC answer in options, no fully-punctuated answer printed in the
// bare prompt, open-ended answers marked, 100-page capacity) cover the stream.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig } from '../../framework';
import { speechSpec } from './SpeechWorksheet';

const g3 = getEnglishGradeConfig(3);
const g6 = getEnglishGradeConfig(6);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(speechSpec, grade, seedFrom([grade.id, speechSpec.id, 0]));
}

// Extract the trailing "(a / b / c)" option list from an MC prompt (speech
// options themselves contain commas, so ' / ' is the separator); null when the
// prompt is not multiple-choice.
function optionsOf(prompt: string): string[] | null {
    const m = prompt.match(/\(([^)]+)\)\s*$/);
    if (!m) return null;
    if (m[1].includes(' / ')) return m[1].split(' / ');
    if (m[1].includes(', ')) return m[1].split(', ');
    return null;
}

// Identify/check prompts legitimately print the answer (the child judges or
// reads it); "add the speech marks" prompts must NOT print the quoted form.
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

describe('speech plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, page size and single-column layout', () => {
        expect(speechSpec.id).toBe('speech');
        expect(speechSpec.label).toBe('Direct Speech');
        expect(speechSpec.icon).toBe('❝');
        // T4C: 6 roomy rows per page (was 16); prose lines run single-column.
        expect(speechSpec.perPage).toBe(6);
        expect(speechSpec.singleColumn).toBe(true);
    });

    it('describes its scope (speech marks & reporting)', () => {
        expect(speechSpec.scope(g3)).toBe('speech marks & reporting');
        expect(speechSpec.scope(g6)).toBe('speech marks & reporting');
    });

    it('is gated by the grade catalogue (Years 3..6 only)', () => {
        expect(speechSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(speechSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(speechSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(speechSpec.offered(g3)).toBe(true);
        expect(speechSpec.offered(g6)).toBe(true);
        expect(speechSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(speechSpec, getEnglishGradeConfig(2), seedFrom([2, 'speech', 0]))).toEqual([]);
    });
});

describe('speech — Year 3', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g3)).toEqual([
            {"prompt":"Add the speech marks and commas: Ava asked Which way did the comet go?","answer":"\"Which way did the comet go?\" Ava asked.","id":1,"type":"speech"},
            {"prompt":"Is the speech punctuation correct? \"Which way did the comet go?\" Leo asked.","answer":"correct","id":2,"type":"speech"},
            {"prompt":"Which sentence shows the speech correctly? (\"Whose turn is it to set the table?\", Ava asked. / \"Whose turn is it to set the table?\" Ava asked. / \"Whose turn is it to set the table\"? Ava asked.)","answer":"\"Whose turn is it to set the table?\" Ava asked.","id":3,"type":"speech"},
            {"prompt":"Who is speaking in: \"Why is the sky orange?\" Ava asked.","answer":"Ava","id":4,"type":"speech"},
            {"prompt":"Write a sentence of direct speech that uses \"Ben said\".","answer":"Example: \"The library closes at five,\" Ben said. (any correctly punctuated direct-speech sentence is correct)","id":5,"type":"speech"},
            {"prompt":"Add the speech marks and commas: Ella said The canteen sells pineapple slices.","answer":"\"The canteen sells pineapple slices,\" Ella said.","id":6,"type":"speech"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(speechSpec, g3, seedFrom([3, 'speech', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Who is speaking in: \"The canteen sells pineapple slices,\" Ben said.","answer":"Ben","id":7,"type":"speech"},
            {"prompt":"Is this direct speech (someone speaking) or plain writing? \"Shall we enter the carnival?\" Ava asked.","answer":"direct speech","id":8,"type":"speech"},
            {"prompt":"Add the speech marks and commas: My plane actually flew! Ben said.","answer":"\"My plane actually flew!\" Ben said.","id":9,"type":"speech"}
        ]);
    });
});

describe('speech — Year 6', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g6)).toEqual([
            {"prompt":"Is the speech punctuation correct? \"Help, a spider!\" Ben said.","answer":"correct","id":1,"type":"speech"},
            {"prompt":"Is this direct speech (someone speaking) or plain writing? \"Grandma brought seedlings,\" Mrs Chen said.","answer":"direct speech","id":2,"type":"speech"},
            {"prompt":"Add the speech marks and commas: Sam said Training is cancelled today.","answer":"\"Training is cancelled today,\" Sam said.","id":3,"type":"speech"},
            {"prompt":"Is this direct speech (someone speaking) or plain writing? The class lined up quietly.","answer":"plain writing","id":4,"type":"speech"},
            {"prompt":"Add the speech marks and commas: The movie starts at six. Mrs Chen said.","answer":"\"The movie starts at six,\" Mrs Chen said.","id":5,"type":"speech"},
            {"prompt":"Is the speech punctuation correct? \"We made it to the top!\" Zoe said.","answer":"correct","id":6,"type":"speech"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(speechSpec, g6, seedFrom([6, 'speech', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Add the speech marks and commas: Mia said I lost a tooth at lunch.","answer":"\"I lost a tooth at lunch,\" Mia said.","id":7,"type":"speech"},
            {"prompt":"Add the speech marks and commas: The movie starts at six. Leo said.","answer":"\"The movie starts at six,\" Leo said.","id":8,"type":"speech"},
            {"prompt":"Add the speech marks and commas: Dad said I brought the sports kit.","answer":"\"I brought the sports kit,\" Dad said.","id":9,"type":"speech"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(speechSpec, getEnglishGradeConfig(7), seedFrom([7, 'speech', 0]))).toEqual([]);
    });
});

describe('speech — generator invariants', () => {
    // Invariants run over the full 100-page request for every offered grade.
    for (const grade of [g3, g6]) {
        const ask = speechSpec.perPage * 100;
        const problems = speechSpec.generate(createRng(seedFrom([grade.id, speechSpec.id, 0])), grade.caps, ask);

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
