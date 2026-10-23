// Unit tests for the HOMOGRAPHS worksheet plugin (distribution quality pass).
//
// Strategy — the plugin's generator is DETERMINISTIC, so sheet rows are
// pinned to exact expected values produced from the real generator with the
// same seed the framework uses (seedFrom([grade.id, spec.id, 0])). On top of
// the pins, this suite INDEPENDENTLY verifies (over a 20-page sample):
//   - CORRECTNESS: every MC answer appears in the printed option list; every
//     answer is non-empty; open-ended rows carry a labeled "Example:" key;
//   - TASK VARIETY: all six families occur and no family dominates a page
//     run (the kind deck spreads them);
//   - DENSITY: perPage 8 (was 18) — low density, writing room;
//   - SEMANTIC DIVERSITY: uniqueness measured with the option list SORTED
//     (option-order churn does NOT count as a new question) — pinned exact
//     pool numbers, plus the 100-page ask is repeat-free.
// Before/after (measured with scripts/measure-capacities.ts identity at the
// 100-page ask): OLD capacity 1800 raw but only 3 task kinds with uncurated
// (validity-unguaranteed) distractors; NEW 800/800 raw unique at perPage 8
// with 6 families and curated distractors, 474 semantic-unique questions.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig, type Problem } from '../../framework';
import { homographSpec, HOMOGRAPH_ITEMS } from './HomographWorksheet';

const g4 = getEnglishGradeConfig(4);
const g6 = getEnglishGradeConfig(6);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(homographSpec, grade, seedFrom([grade.id, homographSpec.id, 0]));
}

// The six family prefixes (one per task family) — used for variety checks.
const FAMILIES = [
    'Which word fits the gap:',
    'What does "',
    'Which meaning fits "',
    'Mia wrote:',
    'Write your own sentence using "',
    'Which word fits both sentences:'
];

// Extract the printed option list from a prompt's trailing parentheses
// (mirrors the generator's option rendering: ", " or " / " joined).
function optionsOf(prompt: string): string[] | null {
    const m = prompt.match(/\(([^()]*)\)\s*$/);
    if (!m) return null;
    return m[1].split(m[1].includes(' / ') ? ' / ' : ', ');
}

// Semantic identity: the prompt with its option list SORTED — so two rows
// that differ only in option ORDER collapse to one question.
function semanticKey(p: Problem): string {
    const opts = optionsOf(p.prompt);
    if (!opts) return p.prompt;
    return p.prompt.replace(/\(([^()]*)\)\s*$/, `(${[...opts].sort().join(' | ')})`);
}

describe('homograph plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and low-density page size (8, was 18)', () => {
        expect(homographSpec.id).toBe('homograph');
        expect(homographSpec.label).toBe('Homographs');
        expect(homographSpec.icon).toBe('⚭');
        expect(homographSpec.perPage).toBe(8);
    });

    it('describes its scope (same spelling, new meaning)', () => {
        expect(homographSpec.scope(g4)).toBe('same spelling, new meaning');
        expect(homographSpec.scope(g6)).toBe('same spelling, new meaning');
    });

    it('is gated by the grade catalogue (Years 4..6 only — staged after Y3 intro grammar)', () => {
        expect(homographSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(homographSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(homographSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(homographSpec.offered(getEnglishGradeConfig(3))).toBe(false);
        expect(homographSpec.offered(g4)).toBe(true);
        expect(homographSpec.offered(g6)).toBe(true);
        expect(homographSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(homographSpec, getEnglishGradeConfig(2), seedFrom([2, 'homograph', 0]))).toEqual([]);
    });
});

describe('homograph — Year 4', () => {
    it('matches the exact page-1 sheet (all 8 rows)', () => {
        expect(sheet(g4)).toEqual([
        {"prompt":"Which meaning fits \"wave\" in \"Give your friend a friendly __ goodbye.\"? (a sweet brown fruit / a greeting with your hand / a moving ridge of sea water)","answer":"a greeting with your hand","id":1,"type":"homograph"},
        {"prompt":"Write your own sentence using \"crane\" to mean a machine that lifts heavy loads.","answer":"Example: The building crane lifted the steel beams.","id":2,"type":"homograph"},
        {"prompt":"Which word fits the gap: We packed the __ in the car boot for the trip. (seal, light, trunk)","answer":"trunk","id":3,"type":"homograph"},
        {"prompt":"What does \"head\" mean in this sentence? The __ of the line waved at the teacher.","answer":"the person in charge","id":4,"type":"homograph"},
        {"prompt":"Which word fits both sentences: \"A __ flopped onto the rocks.\" and \"She pressed a wax __ on the envelope.\"? (seal, match, light)","answer":"seal","id":5,"type":"homograph"},
        {"prompt":"Mia wrote: \"Every bank of the alphabet has a shape.\" Which word should replace \"bank\"? (bank, letter, wave)","answer":"letter","id":6,"type":"homograph"},
        {"prompt":"What does \"palm\" mean in this sentence? The __ of my hand itched.","answer":"the middle of your hand","id":7,"type":"homograph"},
        {"prompt":"Write your own sentence using \"tail\" to mean the tail end of an animal.","answer":"Example: The dog wagged its tail happily.","id":8,"type":"homograph"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(homographSpec, g4, seedFrom([4, 'homograph', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Which word fits both sentences: \"We had a picnic on the river __ .\" and \"I keep my savings in the __ .\"? (bank, bat, wave)","answer":"bank","id":9,"type":"homograph"},
        {"prompt":"Which meaning fits \"match\" in \"Strike a __ to light the candle.\"? (a game between two sides / a group of musicians / a small stick that makes fire)","answer":"a small stick that makes fire","id":10,"type":"homograph"},
        {"prompt":"Mia wrote: \"Pick up the ring and hit the ball.\" Which word should replace \"ring\"? (bat, ring, seal)","answer":"bat","id":11,"type":"homograph"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(homographSpec, getEnglishGradeConfig(7), seedFrom([7, 'homograph', 0]))).toEqual([]);
    });
});

describe('homograph — Year 6', () => {
    it('matches the exact page-1 head (grade 6 rolls its own stream)', () => {
        expect(sheet(g6).slice(0, 3)).toEqual([
        {"prompt":"Write your own sentence using \"head\" to mean the top part of a body.","answer":"Example: The boy bumped his head on the low branch.","id":1,"type":"homograph"},
        {"prompt":"Which word fits both sentences: \"A __ flew out of the cave at dusk.\" and \"Pick up the __ and hit the ball.\"? (bat, ring, seal)","answer":"bat","id":2,"type":"homograph"},
        {"prompt":"Which word fits the gap: I posted a __ to my cousin. (bank, wave, letter)","answer":"letter","id":3,"type":"homograph"}
        ]);
    });
});

describe('homograph — determinism', () => {
    it('the same seed yields the identical document twice', () => {
        const a = generateDocument(homographSpec, g4, seedFrom([4, 'homograph', 0]), 3);
        const b = generateDocument(homographSpec, g4, seedFrom([4, 'homograph', 0]), 3);
        expect(a).toEqual(b);
    });

    it('a different refresh seed yields a different stream', () => {
        const a = sheet(g4);
        const b = generateSheet(homographSpec, g4, seedFrom([4, 'homograph', 1]));
        expect(a.map((p) => p.prompt)).not.toEqual(b.map((p) => p.prompt));
    });
});

describe('homograph — correctness invariants (20-page sample)', () => {
    const rows = generateDocument(homographSpec, g4, seedFrom([4, 'homograph', 0]), 20).pages.flat();

    it('every row has a non-empty prompt and answer', () => {
        for (const p of rows) {
            expect(p.prompt.length).toBeGreaterThan(0);
            expect(p.answer.length).toBeGreaterThan(0);
        }
    });

    it('every multiple-choice answer appears in the printed option list', () => {
        let mcCount = 0;
        for (const p of rows) {
            const opts = optionsOf(p.prompt);
            if (!opts) continue;
            mcCount++;
            // Exact membership: the answer is one of the options verbatim.
            expect(opts.includes(p.answer)).toBe(true);
            // And the options are pairwise distinct (no duplicate choices).
            expect(new Set(opts).size).toBe(opts.length);
        }
        // MC families are dealt, so a 160-row sample must contain many.
        expect(mcCount).toBeGreaterThan(60);
    });

    it('open-ended rows carry a labeled "Example:" model answer', () => {
        const open = rows.filter((p) => p.prompt.startsWith('Write your own sentence using "'));
        expect(open.length).toBeGreaterThan(10);
        for (const p of open) {
            expect(p.answer.startsWith('Example: ')).toBe(true);
        }
    });

    it('written sense answers equal the curated gloss for the printed word + sentence (bank re-derivation)', () => {
        // Independent check: look the sense up in the exported bank and
        // require the generator's answer to match its gloss exactly.
        const glossOf = new Map<string, string>();
        for (const [w, sA, gA, sB, gB] of HOMOGRAPH_ITEMS) {
            glossOf.set(`${w}|${sA}`, gA);
            glossOf.set(`${w}|${sB}`, gB);
        }
        const senseRows = rows.filter((p) => p.prompt.startsWith('What does "'));
        expect(senseRows.length).toBeGreaterThan(10);
        for (const p of senseRows) {
            const m = p.prompt.match(/^What does "([^"]+)" mean in this sentence\? (.+)$/);
            expect(m).not.toBeNull();
            const [, word, sentence] = m as unknown as RegExpMatchArray;
            expect(p.answer).toBe(glossOf.get(`${word}|${sentence}`));
        }
    });

    it('the edit family prints the misused word and asks for its replacement', () => {
        const edits = rows.filter((p) => p.prompt.startsWith('Mia wrote:'));
        expect(edits.length).toBeGreaterThan(10);
        for (const p of edits) {
            // The answer (the correct word) is among the options, and the
            // misused word quoted after 'replace' is a DIFFERENT bank word.
            const opts = optionsOf(p.prompt) as string[];
            expect(opts.includes(p.answer)).toBe(true);
            const wrong = p.prompt.match(/replace "([^"]+)"\?/)?.[1] as string;
            expect(wrong).not.toBe(p.answer);
            expect(opts.includes(wrong)).toBe(true);
        }
    });
});

describe('homograph — task variety & density', () => {
    const rows = generateDocument(homographSpec, g4, seedFrom([4, 'homograph', 0]), 20).pages.flat();

    it('all six task families occur within the first two pages', () => {
        const first2 = rows.slice(0, 16);
        for (const fam of FAMILIES) {
            expect(first2.some((p) => p.prompt.startsWith(fam))).toBe(true);
        }
    });

    it('no single family dominates more than 40% of a 160-row run', () => {
        const counts = new Map<string, number>();
        for (const p of rows) {
            const fam = FAMILIES.find((f) => p.prompt.startsWith(f)) as string;
            counts.set(fam, (counts.get(fam) ?? 0) + 1);
        }
        for (const n of counts.values()) {
            expect(n / rows.length).toBeLessThanOrEqual(0.4);
        }
    });
});

describe('homograph — semantic diversity (option-order-independent)', () => {
    it('100 pages (800 rows) print with zero repeated prompts', () => {
        const probs = homographSpec.generate(createRng(seedFrom([4, 'homograph', 0])), g4.caps, 800);
        expect(new Set(probs.map((p) => p.prompt)).size).toBe(800);
    });

    it('the semantic question pool (options sorted) is exactly 474 distinct questions at the 800-row ask', () => {
        const probs = homographSpec.generate(createRng(seedFrom([4, 'homograph', 0])), g4.caps, 800);
        expect(new Set(probs.map(semanticKey)).size).toBe(474);
    });
});
