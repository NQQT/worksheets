// Unit tests for the SYLLABLES worksheet plugin.
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE page-1 sheet
// (all prompts + answers) is pinned to exact expected values produced from the
// real generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). If the algorithm or word banks change,
// these exact assertions fail — which is what we want, so a silent change to
// the worksheet can't slip through. On top of the pins, generator invariants
// (MC answer present in options, no answer printed in fill prompts, open-ended
// answers marked as such, 100-page capacity) are asserted exactly.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig } from '../../framework';
import { syllableSpec } from './SyllablesWorksheet';

const g2 = getEnglishGradeConfig(2);
const g3 = getEnglishGradeConfig(3);
const g6 = getEnglishGradeConfig(6);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(syllableSpec, grade, seedFrom([grade.id, syllableSpec.id, 0]));
}

// Extract the trailing "(a, b, c)" / "(a / b / c)" option list from an MC
// prompt; null when the prompt is not multiple-choice.
function optionsOf(prompt: string): string[] | null {
    const m = prompt.match(/\(([^)]+)\)\s*$/);
    if (!m) return null;
    if (m[1].includes(' / ')) return m[1].split(' / ');
    if (m[1].includes(', ')) return m[1].split(', ');
    return null; // e.g. a bare "(hint)" parenthetical — not an option list
}

// Identify/check prompts legitimately print the answer (the child judges or
// circles it); compose/fill prompts must NOT print it.
function isIdentifyOrCheck(prompt: string): boolean {
    return /^(True or false|Is the|Is this|Does this|Find the|Who is speaking)/.test(prompt);
}

// A compose prompt must not print the answer. Single-word answers use
// word-boundary matching ("it" is a substring of "with" but never a
// standalone word in a fill prompt); sentence answers use plain includes.
function leaks(prompt: string, answer: string): boolean {
    if (answer.includes(' ')) return prompt.includes(answer);
    const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(prompt);
}

describe('syllable plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(syllableSpec.id).toBe('syllable');
        expect(syllableSpec.label).toBe('Syllables');
        expect(syllableSpec.icon).toBe('∿');
        // T4C: 8 roomy rows per page instead of 18 cramped ones.
        expect(syllableSpec.perPage).toBe(8);
    });

    it('describes its scope (count the beats)', () => {
        expect(syllableSpec.scope(g2)).toBe('count the beats');
    });

    it('is gated by the grade catalogue (Year 2..6 offer it, Year 7 does not)', () => {
        expect(syllableSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(syllableSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(syllableSpec.offered(g2)).toBe(true);
        expect(syllableSpec.offered(g3)).toBe(true);
        expect(syllableSpec.offered(g6)).toBe(true);
        expect(syllableSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(syllableSpec, getEnglishGradeConfig(1), seedFrom([1, 'syllable', 0]))).toEqual([]);
    });
});

describe('syllable — Year 2', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g2)).toEqual([
            {"prompt":"Can you think of a word with 3 syllables? Write it here.","answer":"Example: pajamas (any 3-syllable word is correct)","id":1,"type":"syllable"},
            {"prompt":"Can you think of a word with 2 syllables? Write it here.","answer":"Example: marble (any 2-syllable word is correct)","id":2,"type":"syllable"},
            {"prompt":"True or false: \"balloon\" has 2 syllables.","answer":"true","id":3,"type":"syllable"},
            {"prompt":"How many syllables are in \"popcorn\"?","answer":"2","id":4,"type":"syllable"},
            {"prompt":"True or false: \"superhero\" has 3 syllables.","answer":"false","id":5,"type":"syllable"},
            {"prompt":"Which word has 3 syllables? (pickle, ladybird, vegetable)","answer":"ladybird","id":6,"type":"syllable"},
            {"prompt":"Which word has 3 syllables? (unicycle, asparagus, beautiful)","answer":"beautiful","id":7,"type":"syllable"},
            {"prompt":"Which word has 2 syllables? (vanilla, popsicle, castle)","answer":"castle","id":8,"type":"syllable"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(syllableSpec, g2, seedFrom([2, 'syllable', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"How many syllables are in \"music\"?","answer":"2","id":9,"type":"syllable"},
            {"prompt":"Which word does NOT have the same number of syllables as the other two? (firefly, interesting, eagle)","answer":"interesting","id":10,"type":"syllable"},
            {"prompt":"Which word has 2 syllables? (holiday, kangaroo, winter)","answer":"winter","id":11,"type":"syllable"}
        ]);
    });
});

describe('syllable — Year 3', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g3)).toEqual([
            {"prompt":"True or false: \"kitten\" has 2 syllables.","answer":"true","id":1,"type":"syllable"},
            {"prompt":"Which word does NOT have the same number of syllables as the other two? (button, helmet, interesting)","answer":"interesting","id":2,"type":"syllable"},
            {"prompt":"True or false: \"seashell\" has 1 syllable.","answer":"false","id":3,"type":"syllable"},
            {"prompt":"Which word has 2 syllables? (cucumber, hamster, beautiful)","answer":"hamster","id":4,"type":"syllable"},
            {"prompt":"True or false: \"asparagus\" has 3 syllables.","answer":"false","id":5,"type":"syllable"},
            {"prompt":"How many syllables are in \"pajamas\"?","answer":"3","id":6,"type":"syllable"},
            {"prompt":"Which word has 4 syllables? (lady, interesting, carrot)","answer":"interesting","id":7,"type":"syllable"},
            {"prompt":"How many syllables are in \"firefly\"?","answer":"2","id":8,"type":"syllable"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(syllableSpec, g3, seedFrom([3, 'syllable', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Which word has the same number of syllables as \"parrot\"? (grandfather, lemon, celebration)","answer":"lemon","id":9,"type":"syllable"},
            {"prompt":"True or false: \"window\" has 2 syllables.","answer":"true","id":10,"type":"syllable"},
            {"prompt":"True or false: \"trombone\" has 3 syllables.","answer":"false","id":11,"type":"syllable"}
        ]);
    });
});

describe('syllable — Year 6', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g6)).toEqual([
            {"prompt":"Which word has 2 syllables? (animal, city, pineapple)","answer":"city","id":1,"type":"syllable"},
            {"prompt":"True or false: \"water\" has 2 syllables.","answer":"true","id":2,"type":"syllable"},
            {"prompt":"True or false: \"wonderful\" has 3 syllables.","answer":"true","id":3,"type":"syllable"},
            {"prompt":"How many syllables are in \"carnival\"?","answer":"3","id":4,"type":"syllable"},
            {"prompt":"Which word has 2 syllables? (telescope, macaroni, music)","answer":"music","id":5,"type":"syllable"},
            {"prompt":"Which word has 2 syllables? (hamburger, family, cherry)","answer":"cherry","id":6,"type":"syllable"},
            {"prompt":"Which word has 2 syllables? (spaghetti, bicycle, cupcake)","answer":"cupcake","id":7,"type":"syllable"},
            {"prompt":"Which word does NOT have the same number of syllables as the other two? (excellent, asparagus, alligator)","answer":"excellent","id":8,"type":"syllable"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(syllableSpec, g6, seedFrom([6, 'syllable', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Which word has 2 syllables? (adventure, pancake, potato)","answer":"pancake","id":9,"type":"syllable"},
            {"prompt":"Which word has 2 syllables? (camel, ladybird, excellent)","answer":"camel","id":10,"type":"syllable"},
            {"prompt":"Which word has 4 syllables? (pencil, helicopter, together)","answer":"helicopter","id":11,"type":"syllable"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(syllableSpec, getEnglishGradeConfig(7), seedFrom([7, 'syllable', 0]))).toEqual([]);
    });
});

describe('syllable — generator invariants', () => {
    // Run the invariants over the full 100-page request for every offered
    // grade: pins only cover page 1, these cover the whole stream.
    for (const grade of [g2, g3, g6]) {
        const ask = syllableSpec.perPage * 100;
        const problems = syllableSpec.generate(createRng(seedFrom([grade.id, syllableSpec.id, 0])), grade.caps, ask);

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
