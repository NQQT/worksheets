// Unit tests for the READING COMPREHENSION worksheet plugin (T5 new family).
//
// Strategy: the generator is DETERMINISTIC, so the exact page-1 sheet and the
// page-2 head are pinned for Year 3 and Year 6 (seedFrom([grade, 'comprehension',
// 0])). The bank is FINITE BY DESIGN — 6 original passages per year, one
// passage per A4 page (perPage 1): a 100-page document re-deals whole
// passages, which is the reading-task analogue of tracing sheets (a fresh
// passage each time, never the same passage stacked above every question).
// Invariants cover the whole 100-page stream: three scaffolded questions per
// passage (literal → infer → evidence), marking-guidance answers, and the
// Y3/Y5/Y6 banks being DISJOINT sets (genuine year progression, Y5 ≠ Y6).

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig } from '../../framework';
import { comprehensionSpec } from './ComprehensionWorksheet';

const g3 = getEnglishGradeConfig(3);
const g5 = getEnglishGradeConfig(5);
const g6 = getEnglishGradeConfig(6);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(comprehensionSpec, grade, seedFrom([grade.id, comprehensionSpec.id, 0]));
}

// The ruled writing line printed under every question (see the '__' token
// convention in framework/types.ts).
const RULE = '__ __ __ __ __ __ __ __ __ __';

// Passage titles = the first line of each multi-line prompt.
function titles(problems: { prompt: string }[]): string[] {
    return problems.map((p) => p.prompt.split('\n')[0]);
}

describe('comprehension plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, page size and single-column layout', () => {
        expect(comprehensionSpec.id).toBe('comprehension');
        expect(comprehensionSpec.label).toBe('Reading Comprehension');
        expect(comprehensionSpec.icon).toBe('☰');
        // One passage + three ruled questions per A4 page (the A4-safe budget).
        expect(comprehensionSpec.perPage).toBe(1);
        expect(comprehensionSpec.singleColumn).toBe(true);
    });

    it('describes its scope per level (the comprehension focus deepens each level)', () => {
        // NO curriculum labels: the scope describes the content focus only.
        expect(comprehensionSpec.scope(g3)).toBe('passages — find it, read between the lines, quote it');
        expect(comprehensionSpec.scope(getEnglishGradeConfig(4))).toBe('passages — visualise, predict, evaluate the evidence');
        expect(comprehensionSpec.scope(g5)).toBe('texts — scan, compare, evaluate the viewpoint');
        expect(comprehensionSpec.scope(g6)).toBe('texts — analyse style, tone and bias, compare sources');
    });

    it('is gated by the grade catalogue (Years 3..6 only)', () => {
        expect(comprehensionSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(comprehensionSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(comprehensionSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(comprehensionSpec.offered(g3)).toBe(true);
        expect(comprehensionSpec.offered(g6)).toBe(true);
        expect(comprehensionSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(comprehensionSpec, getEnglishGradeConfig(2), seedFrom([2, 'comprehension', 0]))).toEqual([]);
    });
});

describe('comprehension — Year 3', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g3)).toEqual([
            {
                prompt: 'Sam\'s Sandcastle\nSam dug a big hole in the sand at Broadbeach. He packed wet sand into a bucket and turned it over to make a tower. Just as he placed the last shell on top, a wave rushed in and knocked the tower down. Sam laughed and reached for his bucket again.\n\nAnswer the questions in full sentences.\na) Where did Sam build his sandcastle?\n' + RULE + '\nb) How did Sam feel when the wave knocked his tower down? How do you know?\n' + RULE + '\nc) Which words show the wave arrived suddenly?\n' + RULE,
                answer: 'a) At Broadbeach.\nb) Cheerful or undaunted — the text says he laughed and started again (any sensible answer supported by the text is accepted)\nc) "a wave rushed in and knocked the tower down" (other accurate quotes/details are accepted)',
                id: 1,
                type: 'comprehension'
            }
        ]);
    });

    it('page 2 continues the exact stream (a DIFFERENT passage, never a repeat)', () => {
        expect(generateDocument(comprehensionSpec, g3, seedFrom([3, 'comprehension', 0]), 2).pages[1]).toEqual([
            {
                prompt: 'The Class Hamster\nOur class hamster is called Peanut. Every Monday we fill her food bowl and change her water. On Fridays we let her run around the classroom for twenty minutes. She always hides under the reading-corner mat, where it is dark and quiet.\n\nAnswer the questions in full sentences.\na) On which day does Peanut run around the classroom?\n' + RULE + '\nb) Why do you think Peanut hides under the mat?\n' + RULE + '\nc) Which words tell you the class looks after Peanut every week?\n' + RULE,
                answer: 'a) On Fridays.\nb) It feels safe there — the mat is dark and quiet (any sensible answer supported by the text is accepted)\nc) "Every Monday" and "On Fridays" (other accurate quotes/details are accepted)',
                id: 2,
                type: 'comprehension'
            }
        ]);
    });
});

describe('comprehension — Year 6', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g6)).toEqual([
            {
                prompt: 'Should Advertising Be Banned at School?\nSchools are for learning, so advertisers have no business on school grounds. This argument sounds tidy but ignores reality: sponsorships fund sports gear and laptops that budgets no longer cover. The honest answer is regulation, not bans — no junk-food logos, no collection of student data, and every contract published for parents to read. Principles are easy to shout; trade-offs are harder to manage.\n\nAnswer the questions in full sentences.\na) What does the writer suggest instead of a ban?\n' + RULE + '\nb) What "trade-off" is the writer describing?\n' + RULE + '\nc) Which sentence shows the writer rejects a too-simple argument?\n' + RULE,
                answer: 'a) Regulation: no junk-food logos, no student data collection, published contracts.\nb) Sponsorship money schools need versus commercial pressure on students (any sensible answer supported by the text is accepted)\nc) "This argument sounds tidy but ignores reality" (other accurate quotes/details are accepted)',
                id: 1,
                type: 'comprehension'
            }
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(comprehensionSpec, g6, seedFrom([6, 'comprehension', 0]), 2).pages[1]).toEqual([
            {
                prompt: 'The Price of a Reef Visit\nTour operators on the Great Barrier Reef insist that every visitor dollar funds conservation. That claim deserves scrutiny. Monitoring fees do reach research programs, yet marketing budgets often grow faster than restoration grants. The fairer question is not whether tourists should pay, but how their money is spent — and whether the companies charging the most are the ones giving the reef the best chance.\n\nAnswer the questions in full sentences.\na) What claim is the writer examining?\n' + RULE + '\nb) What bias might a tour operator have about visitor spending?\n' + RULE + '\nc) Which words show the writer\'s measured, careful tone?\n' + RULE,
                answer: 'a) The operators\' claim that every visitor dollar funds conservation.\nb) Operators profit from high visitor numbers, so they may overstate how much goes to conservation (any sensible answer supported by the text is accepted)\nc) "deserves scrutiny" and "The fairer question is not... but..." (other accurate quotes/details are accepted)',
                id: 2,
                type: 'comprehension'
            }
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(comprehensionSpec, getEnglishGradeConfig(7), seedFrom([7, 'comprehension', 0]))).toEqual([]);
    });
});

describe('comprehension — generator invariants', () => {
    for (const grade of [g3, g5, g6]) {
        const ask = comprehensionSpec.perPage * 100;
        const problems = comprehensionSpec.generate(createRng(seedFrom([grade.id, comprehensionSpec.id, 0])), grade.caps, ask);

        it(`year ${grade.id}: fills the ask and the bank is exactly 6 passages`, () => {
            expect(problems.length).toBe(ask);
            // Finite by design: 6 distinct passages per year; a 100-page
            // document re-deals whole passages (reading-practice analogue of
            // the tracing sheets' deliberate repeats).
            expect(new Set(titles(problems)).size).toBe(6);
        });

        it(`year ${grade.id}: every passage prints once with three ruled questions`, () => {
            for (const p of problems) {
                const lines = p.prompt.split('\n');
                // Y6 passages may carry extra paragraphs, so anchor on the
                // instruction line: title + passage (1..n) + blank +
                // instruction + 3x (question + rule).
                const i = lines.indexOf('Answer the questions in full sentences.');
                expect(i).toBeGreaterThanOrEqual(3);
                expect(lines[i - 1]).toBe(''); // blank separator
                expect(lines[i + 1][0]).toBe('a');
                expect(lines[i + 2]).toBe(RULE);
                expect(lines[i + 3][0]).toBe('b');
                expect(lines[i + 4]).toBe(RULE);
                expect(lines[i + 5][0]).toBe('c');
                expect(lines[i + 6]).toBe(RULE);
                expect(lines.length).toBe(i + 7);
                // The passage title is NOT repeated above each question.
                expect(lines.filter((l) => l === lines[0]).length).toBe(1);
            }
        });

        it(`year ${grade.id}: answers are marking guidance, never false single keys`, () => {
            for (const p of problems) {
                const lines = p.answer.split('\n');
                expect(lines.length).toBe(3);
                expect(lines[0].startsWith('a) ')).toBe(true);
                // b) inferential and c) evidence answers state acceptance.
                expect(lines[1]).toContain('(any sensible answer supported by the text is accepted)');
                expect(lines[2]).toContain('(other accurate quotes/details are accepted)');
            }
        });
    }

    it('the year banks are disjoint (genuine Y3/Y5/Y6 progression, Y5 ≠ Y6)', () => {
        const t3 = new Set(titles(comprehensionSpec.generate(createRng(seedFrom([3, 'comprehension', 0])), g3.caps, 100)));
        const t5 = new Set(titles(comprehensionSpec.generate(createRng(seedFrom([5, 'comprehension', 0])), g5.caps, 100)));
        const t6 = new Set(titles(comprehensionSpec.generate(createRng(seedFrom([6, 'comprehension', 0])), g6.caps, 100)));
        expect(t3.size).toBe(6);
        expect(t5.size).toBe(6);
        expect(t6.size).toBe(6);
        for (const t of t3) expect(t5.has(t)).toBe(false);
        for (const t of t5) expect(t6.has(t)).toBe(false);
        for (const t of t3) expect(t6.has(t)).toBe(false);
    });

    it('T9 regressions: the flagged passages now carry unambiguous/coherent items', () => {
        const stream = (grade: GradeConfig) =>
            comprehensionSpec.generate(createRng(seedFrom([grade.id, 'comprehension', 0])), grade.caps, 100);
        const find = (problems: { prompt: string; answer: string }[], title: string) =>
            problems.find((p) => p.prompt.startsWith(title))!;

        // (3) Silver Balloon: the price is an explicit literal fact — the old
        // "One more dollar.../exactly enough" key was ambiguous.
        const balloon = find(stream(getEnglishGradeConfig(4)), 'The Silver Balloon');
        expect(balloon.prompt).toContain('"Two dollars and it\'s yours," said the stallholder.');
        expect(balloon.prompt).toContain('he had exactly two dollars');
        expect(balloon.prompt).toContain('a) How much did the stallholder ask for the balloon?');
        expect(balloon.answer.split('\n')[0]).toBe('a) Two dollars.');

        // (5) Longer Recess: b) is now genuinely INFERENTIAL (trial-vs-
        // permanent reasoning), not a second findable fact.
        const recess = find(stream(g5), 'Should Students Have a Longer Recess?');
        expect(recess.prompt).toContain('b) Why does the writer suggest a TRIAL rather than changing recess permanently right away?');
        expect(recess.answer.split('\n')[1]).toContain('(any sensible answer supported by the text is accepted)');

        // (5) Platypus Puzzle: c) is now an EVIDENCE (quote-the-words)
        // question, not a third literal listing.
        const platypus = find(stream(g5), 'The Platypus Puzzle');
        expect(platypus.prompt).toContain('c) Which words show the platypus looked so strange that experts doubted it was real?');
        expect(platypus.answer.split('\n')[2]).toContain('"naturalists suspected a hoax');
        expect(platypus.answer.split('\n')[2]).toContain('(other accurate quotes/details are accepted)');
    });

    it('is deterministic: the same seed yields the same sheet', () => {
        expect(sheet(g6)).toEqual(sheet(g6));
    });
});
