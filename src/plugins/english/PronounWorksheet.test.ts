// Unit tests for the PRONOUNS worksheet plugin.
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE page-1 sheet
// (all prompts + answers) is pinned to exact expected values produced from the
// real generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Pins cover page 1 only; generator
// invariants (MC answer in options, no answer printed in compose prompts,
// open-ended answers marked, 100-page capacity) cover the whole stream.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig } from '../../framework';
import { pronounSpec } from './PronounWorksheet';

const g3 = getEnglishGradeConfig(3);
const g6 = getEnglishGradeConfig(6);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(pronounSpec, grade, seedFrom([grade.id, pronounSpec.id, 0]));
}

// Extract the trailing "(a, b, c)" option list from an MC prompt; null for the
// bare "(noun)" hint parentheticals the possessive kind prints (no ', ').
function optionsOf(prompt: string): string[] | null {
    const m = prompt.match(/\(([^)]+)\)\s*$/);
    if (!m) return null;
    if (m[1].includes(' / ')) return m[1].split(' / ');
    if (m[1].includes(', ')) return m[1].split(', ');
    return null;
}

// Check prompts legitimately print the verdict word; compose prompts must NOT
// print the pronoun the child has to produce.
function isIdentifyOrCheck(prompt: string): boolean {
    return /^(True or false|Is the|Is this|Does this|Find the|Who is speaking)/.test(prompt);
}

// A compose prompt must not print the answer. Short pronoun answers use
// word-boundary matching ("it" is a substring of "with" but never a
// standalone word in a fill prompt); sentence answers use plain includes.
function leaks(prompt: string, answer: string): boolean {
    if (answer.includes(' ')) return prompt.includes(answer);
    const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(prompt);
}

describe('pronoun plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(pronounSpec.id).toBe('pronoun');
        expect(pronounSpec.label).toBe('Pronouns');
        expect(pronounSpec.icon).toBe('⊙');
        // T4C: 8 roomy rows per page (was 18).
        expect(pronounSpec.perPage).toBe(8);
    });

    it('describes its scope (pronouns replace nouns)', () => {
        expect(pronounSpec.scope(g3)).toBe('pronouns replace nouns');
        expect(pronounSpec.scope(g6)).toBe('pronouns replace nouns');
    });

    it('is gated by the grade catalogue (Years 3..6 only)', () => {
        expect(pronounSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(pronounSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(pronounSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(pronounSpec.offered(g3)).toBe(true);
        expect(pronounSpec.offered(g6)).toBe(true);
        expect(pronounSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(pronounSpec, getEnglishGradeConfig(2), seedFrom([2, 'pronoun', 0]))).toEqual([]);
    });
});

describe('pronoun — Year 3', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g3)).toEqual([
            {"prompt":"Replace \"the robot\" with a pronoun: The robot swept the floor.","answer":"It","id":1,"type":"pronoun"},
            {"prompt":"Fill in the missing word: __ bowl is empty. (my dog)","answer":"Its","id":2,"type":"pronoun"},
            {"prompt":"Does this sentence use the pronoun correctly? \"Us rode our bikes.\"","answer":"incorrect","id":3,"type":"pronoun"},
            {"prompt":"Which pronoun can replace \"Ava\"? (they, she, we)","answer":"she","id":4,"type":"pronoun"},
            {"prompt":"Replace \"Mum\" with a pronoun: Mum drove us to training.","answer":"She","id":5,"type":"pronoun"},
            {"prompt":"Fill in the missing word: __ bags are in the hall. (the children)","answer":"Their","id":6,"type":"pronoun"},
            {"prompt":"Write a sentence that starts with a pronoun.","answer":"Example: They rode their bikes after school. (any sensible sentence starting with a pronoun is correct)","id":7,"type":"pronoun"},
            {"prompt":"Fill in the missing pronoun for \"the twins\": __ sang in the choir. (he, she, they)","answer":"they","id":8,"type":"pronoun"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(pronounSpec, g3, seedFrom([3, 'pronoun', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Fill in the missing word: __ boots are muddy. (Ben)","answer":"His","id":9,"type":"pronoun"},
            {"prompt":"Which pronoun can replace \"Zoe and Ben\"? (he, they, we)","answer":"they","id":10,"type":"pronoun"},
            {"prompt":"Fill in the missing pronoun for \"Ella\": __ won the running race. (she, it, he)","answer":"she","id":11,"type":"pronoun"}
        ]);
    });
});

describe('pronoun — Year 6', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g6)).toEqual([
            {"prompt":"Replace \"Nanna\" with a pronoun: Ben hugged Nanna.","answer":"her","id":1,"type":"pronoun"},
            {"prompt":"Fill in the missing pronoun for \"Dad\": __ cooked dinner on Friday. (she, they, he)","answer":"he","id":2,"type":"pronoun"},
            {"prompt":"Fill in the missing word: __ bike is red. (Sam)","answer":"His","id":3,"type":"pronoun"},
            {"prompt":"Fill in the missing pronoun for \"my brother and I\": __ built a sandcastle. (we, it, they)","answer":"we","id":4,"type":"pronoun"},
            {"prompt":"Fill in the missing pronoun for \"my dog\": __ buried a bone in the yard. (we, they, it)","answer":"it","id":5,"type":"pronoun"},
            {"prompt":"Fill in the missing pronoun for \"Ella\": __ won the running race. (it, they, she)","answer":"she","id":6,"type":"pronoun"},
            {"prompt":"Does this sentence use the pronoun correctly? \"The class liked they.\"","answer":"incorrect","id":7,"type":"pronoun"},
            {"prompt":"Replace \"Dad\" with a pronoun: We watched Dad cook breakfast.","answer":"him","id":8,"type":"pronoun"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(pronounSpec, g6, seedFrom([6, 'pronoun', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Fill in the missing word: __ favourite spot is the windowsill. (the cat)","answer":"Its","id":9,"type":"pronoun"},
            {"prompt":"Replace \"Ava and Zoe\" with a pronoun: I invited Ava and Zoe to the party.","answer":"them","id":10,"type":"pronoun"},
            {"prompt":"Does this sentence use the pronoun correctly? \"Her gave him the book.\"","answer":"incorrect","id":11,"type":"pronoun"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(pronounSpec, getEnglishGradeConfig(7), seedFrom([7, 'pronoun', 0]))).toEqual([]);
    });
});

describe('pronoun — generator invariants', () => {
    // Invariants run over the full 100-page request for every offered grade.
    for (const grade of [g3, g6]) {
        const ask = pronounSpec.perPage * 100;
        const problems = pronounSpec.generate(createRng(seedFrom([grade.id, pronounSpec.id, 0])), grade.caps, ask);

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
