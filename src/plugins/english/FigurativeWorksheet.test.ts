// Unit tests for the FIGURATIVE LANGUAGE worksheet plugin (distribution
// quality pass).
//
// Strategy — deterministic generator, so sheet rows are pinned to exact
// expected values from the real generator with the framework seed
// (seedFrom([grade.id, spec.id, 0])). On top of the pins this suite
// INDEPENDENTLY verifies over a 20-page sample:
//   - CORRECTNESS: MC answers appear in the printed options; technique
//     answers are one of the four taught techniques; same/different answers
//     are consistent with the two printed examples' techniques; open-ended
//     rows carry a labeled "Example:" key;
//   - TASK VARIETY: all six families occur, none dominates;
//   - DENSITY: perPage 8 (was 18);
//   - SEMANTIC DIVERSITY: option-order-sorted uniqueness pinned exactly
//     (607 semantic questions at the 800-row ask; 100 pages repeat-free).
// Before/after: OLD 3 kinds (all MC/name) with 31 examples; NEW 6 families
// (interpret/apply/compare) with 40 examples + curated meanings + 12
// write-your-own topics.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig, type Problem } from '../../framework';
import { figurativeSpec, FIGURES } from './FigurativeWorksheet';

const g4 = getEnglishGradeConfig(4);
const g6 = getEnglishGradeConfig(6);

function sheet(grade: GradeConfig) {
    return generateSheet(figurativeSpec, grade, seedFrom([grade.id, figurativeSpec.id, 0]));
}

const TECHNIQUES = ['simile', 'metaphor', 'personification', 'alliteration'];

// The six family prefixes (one per task family) — used for variety checks.
const FAMILIES = [
    'Which technique is used:',
    'What does "',
    'Which example is',
    'Complete the figurative phrase:',
    'Do these two use',
    'Write your own'
];

function optionsOf(prompt: string): string[] | null {
    const m = prompt.match(/\(([^()]*)\)\s*$/);
    if (!m) return null;
    return m[1].split(m[1].includes(' / ') ? ' / ' : ', ');
}

// Semantic identity: prompt with the option list SORTED (option order is not
// a new question).
function semanticKey(p: Problem): string {
    const opts = optionsOf(p.prompt);
    if (!opts) return p.prompt;
    return p.prompt.replace(/\(([^()]*)\)\s*$/, `(${[...opts].sort().join(' | ')})`);
}

describe('figurative plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and low-density page size (8, was 18)', () => {
        expect(figurativeSpec.id).toBe('figurative');
        expect(figurativeSpec.label).toBe('Figurative Language');
        expect(figurativeSpec.icon).toBe('≋');
        expect(figurativeSpec.perPage).toBe(8);
    });

    it('describes its scope (the four taught techniques)', () => {
        expect(figurativeSpec.scope(g4)).toBe('simile, metaphor, personification, alliteration');
        expect(figurativeSpec.scope(g6)).toBe('simile, metaphor, personification, alliteration');
    });

    it('is gated by the grade catalogue (Years 4..6 only — staged after Y3 intro grammar)', () => {
        expect(figurativeSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(figurativeSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(figurativeSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(figurativeSpec.offered(getEnglishGradeConfig(3))).toBe(false);
        expect(figurativeSpec.offered(g4)).toBe(true);
        expect(figurativeSpec.offered(g6)).toBe(true);
        expect(figurativeSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(figurativeSpec, getEnglishGradeConfig(2), seedFrom([2, 'figurative', 0]))).toEqual([]);
    });
});

describe('figurative — Year 4', () => {
    it('matches the exact page-1 sheet (all 8 rows)', () => {
        expect(sheet(g4)).toEqual([
        {"prompt":"Write your own personification about a sunny morning.","answer":"Example: the sun smiled down on us","id":1,"type":"figurative"},
        {"prompt":"Complete the figurative phrase: \"the big brown __\"","answer":"bear","id":2,"type":"figurative"},
        {"prompt":"What does \"the clock glared at me\" mean? Write it in your own words.","answer":"Example: the clock seemed to stare warningly","id":3,"type":"figurative"},
        {"prompt":"Which example is a personification? (the old car groaned up the hill / wild and windy weather / the playground was a magnet)","answer":"the old car groaned up the hill","id":4,"type":"figurative"},
        {"prompt":"Which technique is used: \"time is a thief\"? (alliteration, metaphor, simile, personification)","answer":"metaphor","id":5,"type":"figurative"},
        {"prompt":"Do these two use the same technique or different techniques: \"shines like a torch\" and \"the clock glared at me\"? (different techniques / the same technique)","answer":"different techniques","id":6,"type":"figurative"},
        {"prompt":"Which example is an alliteration? (the classroom was a zoo / the big brown bear / my room is a disaster zone)","answer":"the big brown bear","id":7,"type":"figurative"},
        {"prompt":"Which technique is used: \"my room is a disaster zone\"? (simile, personification, metaphor, alliteration)","answer":"metaphor","id":8,"type":"figurative"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(figurativeSpec, g4, seedFrom([4, 'figurative', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Write your own personification about an old, noisy car.","answer":"Example: the old car groaned up the hill","id":9,"type":"figurative"},
        {"prompt":"What does \"the sun smiled down on us\" mean? Write it in your own words.","answer":"Example: the sun felt warm and friendly","id":10,"type":"figurative"},
        {"prompt":"Complete the figurative phrase: \"the test was a __\"","answer":"breeze","id":11,"type":"figurative"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(figurativeSpec, getEnglishGradeConfig(7), seedFrom([7, 'figurative', 0]))).toEqual([]);
    });
});

describe('figurative — Year 6', () => {
    it('matches the exact page-1 head (grade 6 rolls its own stream)', () => {
        expect(sheet(g6).slice(0, 3)).toEqual([
        {"prompt":"Which technique is used: \"wild and windy weather\"? (alliteration, simile, personification, metaphor)","answer":"alliteration","id":1,"type":"figurative"},
        {"prompt":"Write your own personification about a stormy night.","answer":"Example: the thunder growled all night","id":2,"type":"figurative"},
        {"prompt":"Which example is a personification? (sings like an angel / smooth as glass / the waves clapped on the shore)","answer":"the waves clapped on the shore","id":3,"type":"figurative"}
        ]);
    });
});

describe('figurative — determinism', () => {
    it('the same seed yields the identical document twice', () => {
        const a = generateDocument(figurativeSpec, g4, seedFrom([4, 'figurative', 0]), 3);
        const b = generateDocument(figurativeSpec, g4, seedFrom([4, 'figurative', 0]), 3);
        expect(a).toEqual(b);
    });

    it('a different refresh seed yields a different stream', () => {
        const a = sheet(g4);
        const b = generateSheet(figurativeSpec, g4, seedFrom([4, 'figurative', 1]));
        expect(a.map((p) => p.prompt)).not.toEqual(b.map((p) => p.prompt));
    });
});

describe('figurative — correctness invariants (20-page sample)', () => {
    const rows = generateDocument(figurativeSpec, g4, seedFrom([4, 'figurative', 0]), 20).pages.flat();

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
            expect(opts.includes(p.answer)).toBe(true);
            expect(new Set(opts).size).toBe(opts.length);
        }
        expect(mcCount).toBeGreaterThan(50);
    });

    it('technique answers are always one of the four taught techniques', () => {
        const techRows = rows.filter((p) => p.prompt.startsWith('Which technique is used:'));
        expect(techRows.length).toBeGreaterThan(10);
        for (const p of techRows) {
            expect(TECHNIQUES).toContain(p.answer);
        }
    });

    it('same/different answers are consistent with the two printed examples', () => {
        // Independent re-derivation from the exported bank: the answer must
        // match whether the two printed examples share a technique.
        const TECH_OF: Record<string, string> = Object.fromEntries(FIGURES.map(([ex, t]) => [ex, t]));
        const pairs = rows.filter((p) => p.prompt.startsWith('Do these two use'));
        expect(pairs.length).toBeGreaterThan(10);
        for (const p of pairs) {
            const m = p.prompt.match(/techniques: "([^"]+)" and "([^"]+)"/);
            expect(m).not.toBeNull();
            const [, a, b] = m as unknown as RegExpMatchArray;
            const expected = TECH_OF[a] === TECH_OF[b] ? 'the same technique' : 'different techniques';
            expect(p.answer).toBe(expected);
        }
    });

    it('completion rows mask a blank and the key word is not printed', () => {
        const completes = rows.filter((p) => p.prompt.startsWith('Complete the figurative phrase:'));
        expect(completes.length).toBeGreaterThan(10);
        for (const p of completes) {
            expect(p.prompt).toContain('__');
            // The quoted phrase shown to the child must NOT already contain
            // the answer word (the blank is genuinely blank).
            const shown = p.prompt.match(/"([^"]*)"/)?.[1] ?? '';
            expect(shown.split(' ')).not.toContain(p.answer);
        }
    });

    it('open-ended rows carry a labeled "Example:" model answer', () => {
        const open = rows.filter((p) => p.prompt.startsWith('Write your own') || p.prompt.startsWith('What does "'));
        expect(open.length).toBeGreaterThan(20);
        for (const p of open) {
            expect(p.answer.startsWith('Example: ')).toBe(true);
        }
    });
});

describe('figurative — task variety & density', () => {
    const rows = generateDocument(figurativeSpec, g4, seedFrom([4, 'figurative', 0]), 20).pages.flat();

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

describe('figurative — semantic diversity (option-order-independent)', () => {
    it('100 pages (800 rows) print with zero repeated prompts', () => {
        const probs = figurativeSpec.generate(createRng(seedFrom([4, 'figurative', 0])), g4.caps, 800);
        expect(new Set(probs.map((p) => p.prompt)).size).toBe(800);
    });

    it('the semantic question pool (options sorted) is exactly 607 distinct questions at the 800-row ask', () => {
        const probs = figurativeSpec.generate(createRng(seedFrom([4, 'figurative', 0])), g4.caps, 800);
        expect(new Set(probs.map(semanticKey)).size).toBe(607);
    });
});
