// Unit tests for the NOUNS & VERBS (grammar) worksheet plugin.
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE page-1 sheet
// (all prompts + answers + early-band visuals) is pinned to exact expected
// values produced from the real generator with the same seed the framework
// uses (seedFrom([grade.id, spec.id, 0])). Pins cover page 1 only; generator
// invariants (MC answer in options, no answer printed in compose prompts,
// open-ended answers marked, 100-page capacity) cover the whole stream.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig } from '../../framework';
import { grammarSpec } from './NounsVerbsWorksheet';

const g2 = getEnglishGradeConfig(2);
const g3 = getEnglishGradeConfig(3);
const g6 = getEnglishGradeConfig(6);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(grammarSpec, grade, seedFrom([grade.id, grammarSpec.id, 0]));
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

// Identify/check prompts legitimately print the answer (the child circles or
// judges it); compose prompts must NOT print it.
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

describe('grammar plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(grammarSpec.id).toBe('grammar');
        expect(grammarSpec.label).toBe('Nouns & Verbs');
        expect(grammarSpec.icon).toBe('&');
        // T4C: 8 roomy rows per page instead of 24 cramped ones.
        expect(grammarSpec.perPage).toBe(8);
    });

    it('describes its scope per band (nouns/verbs early, adjectives/adverbs later)', () => {
        expect(grammarSpec.scope(g2)).toBe('noun (thing) vs verb (action)');
        expect(grammarSpec.scope(g3)).toBe('adjectives vs adverbs');
        expect(grammarSpec.scope(g6)).toBe('adjectives vs adverbs');
    });

    it('is gated by the grade catalogue (Year 2..6 offer it, Year 7 does not)', () => {
        expect(grammarSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(grammarSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(grammarSpec.offered(g2)).toBe(true);
        expect(grammarSpec.offered(g3)).toBe(true);
        expect(grammarSpec.offered(g6)).toBe(true);
        expect(grammarSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(grammarSpec, getEnglishGradeConfig(1), seedFrom([1, 'grammar', 0]))).toEqual([]);
    });
});

describe('grammar — Year 2', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g2)).toEqual([
            {"prompt":"Which word is a noun (thing)? (cook, push, grass)","answer":"grass","id":1,"type":"grammar"},
            {"prompt":"Is the word \"swim\" a noun (thing) or a verb (action)?","answer":"verb","visual":"action","id":2,"type":"grammar"},
            {"prompt":"Write a sentence that uses the action word \"walk\".","answer":"Example: I walk every day. (any sensible sentence using \"walk\" is correct)","id":3,"type":"grammar"},
            {"prompt":"Write a sentence that uses the action word \"jump\".","answer":"Example: I jump every day. (any sensible sentence using \"jump\" is correct)","id":4,"type":"grammar"},
            {"prompt":"Find the verb: The kangaroo whistles.","answer":"whistles","id":5,"type":"grammar"},
            {"prompt":"Is the word \"telescope\" a noun (thing) or a verb (action)?","answer":"noun","id":6,"type":"grammar"},
            {"prompt":"Which word is a verb (action)? (swim, fish, kitten)","answer":"swim","id":7,"type":"grammar"},
            {"prompt":"Which word is a noun (thing)? (suitcase, drive, carry)","answer":"suitcase","id":8,"type":"grammar"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(grammarSpec, g2, seedFrom([2, 'grammar', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Which word is a noun (thing)? (walk, hammer, basket)","answer":"basket","id":9,"type":"grammar"},
            {"prompt":"Write a sentence that uses the action word \"clap\".","answer":"Example: I clap every day. (any sensible sentence using \"clap\" is correct)","id":10,"type":"grammar"},
            {"prompt":"Is the word \"dig\" a noun (thing) or a verb (action)?","answer":"verb","visual":"action","id":11,"type":"grammar"}
        ]);
    });
});

describe('grammar — Year 3', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g3)).toEqual([
            {"prompt":"Find the adjective: The rude tiger crawls.","answer":"rude","id":1,"type":"grammar"},
            {"prompt":"Find the adjective: The clever cat sings.","answer":"clever","id":2,"type":"grammar"},
            {"prompt":"Find the adverb: The kitten sleeps grumpily.","answer":"grumpily","id":3,"type":"grammar"},
            {"prompt":"Is the word \"wealthy\" an adjective (describes a thing) or an adverb (tells how)?","answer":"adjective","visual":"sparkle","id":4,"type":"grammar"},
            {"prompt":"Is the word \"helpful\" an adjective (describes a thing) or an adverb (tells how)?","answer":"adjective","visual":"sparkle","id":5,"type":"grammar"},
            {"prompt":"Find the adjective: The polite bird shivers.","answer":"polite","id":6,"type":"grammar"},
            {"prompt":"Which word is an adverb (tells how)? (wisely, friendly, grumpy)","answer":"wisely","id":7,"type":"grammar"},
            {"prompt":"Which word is an adverb (tells how)? (lazy, proudly, thirsty)","answer":"proudly","id":8,"type":"grammar"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(grammarSpec, g3, seedFrom([3, 'grammar', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Write a sentence that uses the describing word \"patient\".","answer":"Example: The patient boy runs. (any sensible sentence using \"patient\" is correct)","id":9,"type":"grammar"},
            {"prompt":"Which word is an adjective (describes a thing)? (thankfully, gloomy, firmly)","answer":"gloomy","id":10,"type":"grammar"},
            {"prompt":"Which word is an adverb (tells how)? (bright, rudely, silly)","answer":"rudely","id":11,"type":"grammar"}
        ]);
    });
});

describe('grammar — Year 6', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g6)).toEqual([
            {"prompt":"Find the adjective: The quiet dog claps.","answer":"quiet","id":1,"type":"grammar"},
            {"prompt":"Find the adjective: The nervous rabbit dances.","answer":"nervous","id":2,"type":"grammar"},
            {"prompt":"Find the adverb: The mum hops softly.","answer":"softly","id":3,"type":"grammar"},
            {"prompt":"Which word is an adverb (tells how)? (honest, wealthy, tiredly)","answer":"tiredly","id":4,"type":"grammar"},
            {"prompt":"Which word is an adjective (describes a thing)? (tidy, politely, quickly)","answer":"tidy","id":5,"type":"grammar"},
            {"prompt":"Which word is an adverb (tells how)? (clever, wisely, proud)","answer":"wisely","id":6,"type":"grammar"},
            {"prompt":"Is the word \"gentle\" an adjective (describes a thing) or an adverb (tells how)?","answer":"adjective","id":7,"type":"grammar"},
            {"prompt":"Is the word \"grumpily\" an adjective (describes a thing) or an adverb (tells how)?","answer":"adverb","id":8,"type":"grammar"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(grammarSpec, g6, seedFrom([6, 'grammar', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Is the word \"helpful\" an adjective (describes a thing) or an adverb (tells how)?","answer":"adjective","id":9,"type":"grammar"},
            {"prompt":"Which word is an adverb (tells how)? (wise, thirsty, sweetly)","answer":"sweetly","id":10,"type":"grammar"},
            {"prompt":"Which word is an adjective (describes a thing)? (neatly, loyal, loudly)","answer":"loyal","id":11,"type":"grammar"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(grammarSpec, getEnglishGradeConfig(7), seedFrom([7, 'grammar', 0]))).toEqual([]);
    });
});

describe('grammar — generator invariants', () => {
    // Invariants run over the full 100-page request for every offered grade.
    for (const grade of [g2, g3, g6]) {
        const ask = grammarSpec.perPage * 100;
        const problems = grammarSpec.generate(createRng(seedFrom([grade.id, grammarSpec.id, 0])), grade.caps, ask);

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
