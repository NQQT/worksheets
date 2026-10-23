// Unit tests for the CONJUNCTIONS worksheet plugin.
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE page-1 sheet
// (all prompts + answers) is pinned to exact expected values produced from the
// real generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Pins cover page 1 only; generator
// invariants (MC answer in options, no answer printed in compose prompts,
// open-ended answers marked, 100-page capacity) cover the whole stream.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig } from '../../framework';
import { conjunctionSpec } from './ConjunctionWorksheet';

const g3 = getEnglishGradeConfig(3);
const g6 = getEnglishGradeConfig(6);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(conjunctionSpec, grade, seedFrom([grade.id, conjunctionSpec.id, 0]));
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

// Identify/check prompts legitimately print the answer; compose/join prompts
// must NOT print the fully joined sentence.
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

describe('conjunction plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, page size and single-column layout', () => {
        expect(conjunctionSpec.id).toBe('conjunction');
        expect(conjunctionSpec.label).toBe('Conjunctions');
        expect(conjunctionSpec.icon).toBe('+');
        // T4C: 6 roomy rows per page (was 16); prose lines run single-column.
        expect(conjunctionSpec.perPage).toBe(6);
        expect(conjunctionSpec.singleColumn).toBe(true);
    });

    it('describes its scope per level (coordinating at Y3, gated additions above)', () => {
        // T5: scope mirrors the caps.level gating in the generator; Year 3
        // keeps the original coordinating-conjunction line.
        expect(conjunctionSpec.scope(g3)).toBe('and, but, or, so, because');
        expect(conjunctionSpec.scope(getEnglishGradeConfig(4))).toBe('and, but, or, so, because + although, unless, so that');
        expect(conjunctionSpec.scope(getEnglishGradeConfig(5))).toBe('and, but, or, so, because + subordinate clauses');
        expect(conjunctionSpec.scope(g6)).toBe('and, but, or, so, because + subordinate + embedded clauses');
    });

    it('is gated by the grade catalogue (Years 3..6 only)', () => {
        expect(conjunctionSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(conjunctionSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(conjunctionSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(conjunctionSpec.offered(g3)).toBe(true);
        expect(conjunctionSpec.offered(g6)).toBe(true);
        expect(conjunctionSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(conjunctionSpec, getEnglishGradeConfig(2), seedFrom([2, 'conjunction', 0]))).toEqual([]);
    });
});

describe('conjunction — Year 3', () => {
    // T5E pool expansion re-pin: the banks grew to 24 pairs per family and
    // 28 when/if lines, so the dealt stream changed. Every row below was
    // eyeballed: the conjunction's logic holds for its clause pair.
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g3)).toEqual([
            {"prompt":"We stay inside __ it rains. (but, or, when)","answer":"when","id":1,"type":"conjunction"},
            {"prompt":"Join with the best conjunction: He wore his coat __ it was cold outside","answer":"because","id":2,"type":"conjunction"},
            {"prompt":"Write a sentence that uses the joining word \"but\".","answer":"Example: Grandma baked a pumpkin pie but it vanished in minutes. (any sensible sentence using \"but\" is correct)","id":3,"type":"conjunction"},
            {"prompt":"We go to the pool __ it is hot. (but, when, or)","answer":"when","id":4,"type":"conjunction"},
            {"prompt":"Join with the best conjunction: She could not read the board __ she moved to the front","answer":"so","id":5,"type":"conjunction"},
            {"prompt":"Write a sentence that uses the joining word \"when\".","answer":"Example: We stay inside when it rains. (any sensible sentence using \"when\" is correct)","id":6,"type":"conjunction"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(conjunctionSpec, g3, seedFrom([3, 'conjunction', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Which conjunction fits best: We waited in the sun __ the bus was late (and, because, but)","answer":"because","id":7,"type":"conjunction"},
            {"prompt":"Which conjunction fits best: I practised the song daily __ my friends practised theirs (but, so, and)","answer":"and","id":8,"type":"conjunction"},
            {"prompt":"__ the dog sees a cat, it runs. (when, but, or)","answer":"when","id":9,"type":"conjunction"}
        ]);
    });
});

describe('conjunction — Year 6', () => {
    // T5 re-pin: the level-gated kinds (SUB_FILL/SUB_JOIN/EMBED) join the
    // Year-6 draw, so the dealt stream changed. Rows eyeballed: the embedded
    // clause answer is exactly the two source sentences merged with who/which.
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g6)).toEqual([
            {"prompt":"Join with the best conjunction: The bell rang __ the students sang a song","answer":"and","id":1,"type":"conjunction"},
            {"prompt":"Write a sentence that uses the joining word \"but\".","answer":"Example: She forgot her glasses but the teacher helped her read. (any sensible sentence using \"but\" is correct)","id":2,"type":"conjunction"},
            {"prompt":"Join with the best conjunction: Sam told a funny joke __ the whole table laughed","answer":"so","id":3,"type":"conjunction"},
            {"prompt":"Combine into ONE sentence with an embedded clause (who/which): \"My cousin fixed the fence.\" + \"The fence had broken in the storm.\"","answer":"My cousin fixed the fence, which had broken in the storm.","id":4,"type":"conjunction"},
            {"prompt":"Join with the best conjunction: The garden needs water __ it has not rained for weeks","answer":"because","id":5,"type":"conjunction"},
            {"prompt":"We always visit Nanna __ Sunday. (but, when, or)","answer":"when","id":6,"type":"conjunction"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(conjunctionSpec, g6, seedFrom([6, 'conjunction', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Write a sentence that uses the joining word \"and\".","answer":"Example: She likes reading and her brother likes drawing. (any sensible sentence using \"and\" is correct)","id":7,"type":"conjunction"},
            {"prompt":"Join with the best conjunction: The storm was coming __ the kids ran inside","answer":"so","id":8,"type":"conjunction"},
            {"prompt":"Which conjunction fits best: She drank a big glass of water __ she was very thirsty (because, but, so)","answer":"because","id":9,"type":"conjunction"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(conjunctionSpec, getEnglishGradeConfig(7), seedFrom([7, 'conjunction', 0]))).toEqual([]);
    });
});

describe('conjunction — generator invariants', () => {
    // Invariants run over the full 100-page request for every offered grade.
    for (const grade of [g3, g6]) {
        const ask = conjunctionSpec.perPage * 100;
        const problems = conjunctionSpec.generate(createRng(seedFrom([grade.id, conjunctionSpec.id, 0])), grade.caps, ask);

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
