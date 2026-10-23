// Unit tests for the WRITING PROJECTS worksheet plugin (T5 new family).
//
// Strategy: deterministic exact pins for Year 3 and Year 6 (page 1 + page 2
// head), then structural invariants over the whole stream: every project is
// ONE extended task per A4 page (plan scaffold + ruled composition space),
// the answer is success-criteria marking guidance (never a false single key),
// and the Y3/Y5/Y6 task banks are DISJOINT — the genres genuinely progress
// (Y3 paragraphs → Y5 viewpoint/dialogue → Y6 adapted structures), Y5 ≠ Y6.
// The bank is finite by design (6 projects per year, one per page); long
// documents re-deal whole projects, like the comprehension and tracing
// sheets.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig } from '../../framework';
import { writingSpec } from './WritingWorksheet';

const g3 = getEnglishGradeConfig(3);
const g5 = getEnglishGradeConfig(5);
const g6 = getEnglishGradeConfig(6);

function sheet(grade: GradeConfig) {
    return generateSheet(writingSpec, grade, seedFrom([grade.id, writingSpec.id, 0]));
}

// Ruled lines: the short blank after each plan question, and the full-width
// composition lines under "Now write." (see the '__' token convention).
const PLAN_RULE = '__ __ __ __ __ __';
const RULE = '__ __ __ __ __ __ __ __ __ __';

// Project titles = the first line of each multi-line prompt.
function titles(problems: { prompt: string }[]): string[] {
    return problems.map((p) => p.prompt.split('\n')[0]);
}

describe('writing plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, page size and single-column layout', () => {
        expect(writingSpec.id).toBe('writing');
        expect(writingSpec.label).toBe('Writing Projects');
        expect(writingSpec.icon).toBe('✎');
        // One extended project per A4 page: plan + a full page of lines.
        expect(writingSpec.perPage).toBe(1);
        expect(writingSpec.singleColumn).toBe(true);
    });

    it('describes its scope per level (the genre progression deepens each year)', () => {
        expect(writingSpec.scope(g3)).toBe('narrative, informative and persuasive paragraphs with a plan');
        expect(writingSpec.scope(getEnglishGradeConfig(4))).toBe('text stages, linked ideas, tension and description');
        expect(writingSpec.scope(g5)).toBe('purpose-specific structures, connectives, dialogue and viewpoint');
        expect(writingSpec.scope(g6)).toBe('adapted structures — review, letter, technical and formal tone');
    });

    it('is gated by the grade catalogue (Years 3..6 only)', () => {
        expect(writingSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(writingSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(writingSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(writingSpec.offered(g3)).toBe(true);
        expect(writingSpec.offered(g6)).toBe(true);
        expect(writingSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        expect(generateSheet(writingSpec, getEnglishGradeConfig(2), seedFrom([2, 'writing', 0]))).toEqual([]);
    });
});

describe('writing — Year 3', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g3)).toEqual([
            {
                prompt: 'Recount: Our Sports Carnival Day\nPurpose: to recount real events. Audience: your family.\n\nPlan first.\n1. Where and when did it happen? ' + PLAN_RULE + '\n2. What happened first, next, last? ' + PLAN_RULE + '\n3. What did you think about it? ' + PLAN_RULE + '\n\nNow write.\n' + Array(8).fill(RULE).join('\n'),
                answer: 'Success criteria: Events in time order; past tense kept consistent; at least one detail of what you saw or heard; a personal closing thought.\nSample ideas: the march-in; your race or event; the medal ceremony; the icy pole afterwards',
                id: 1,
                type: 'writing'
            }
        ]);
    });

    it('page 2 continues the exact stream (a DIFFERENT project)', () => {
        expect(generateDocument(writingSpec, g3, seedFrom([3, 'writing', 0]), 2).pages[1]).toEqual([
            {
                prompt: 'Informative: How to Make the Best Sandwich\nPurpose: to explain how to do something. Audience: someone who has never made one.\n\nPlan first.\n1. What is the first step? ' + PLAN_RULE + '\n2. What comes next, in order? ' + PLAN_RULE + '\n3. How do you finish? ' + PLAN_RULE + '\n\nNow write.\n' + Array(8).fill(RULE).join('\n'),
                answer: 'Success criteria: Steps in the right order; action verbs (spread, layer, cut); number words or a list to guide the reader.\nSample ideas: bread choices; spreading butter; layering salad; cutting diagonally',
                id: 2,
                type: 'writing'
            }
        ]);
    });
});

describe('writing — Year 6', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g6)).toEqual([
            {
                prompt: 'Literary Adaptation: A Familiar Tale in a New Setting\nPurpose: to adapt a story you know well. Audience: your classmates. Choose a tale or legend you know and move it to a new Australian setting.\n\nPlan first.\n1. Which tale, and what stays the same? ' + PLAN_RULE + '\n2. What changes in the new setting? ' + PLAN_RULE + '\n3. What mood will you create, and how? ' + PLAN_RULE + '\n\nNow write.\n' + Array(10).fill(RULE).join('\n'),
                answer: 'Success criteria: Recognisable borrowed structure with deliberate changes; setting described with vivid verbs and imagery; a maintained point of view.\nSample ideas: a bush town instead of a castle; a cyclone instead of a storm; a clever stockwoman',
                id: 1,
                type: 'writing'
            }
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(writingSpec, g6, seedFrom([6, 'writing', 0]), 2).pages[1]).toEqual([
            {
                prompt: 'Two Sides: The Same Event, Two Texts\nPurpose: to compare forms. Audience: yourself as editor. Write ONE news-style paragraph about a school event, then ONE opinion sentence about it.\n\nPlan first.\n1. The facts of the event (who/what/when). ' + PLAN_RULE + '\n2. One quoted or attributed detail. ' + PLAN_RULE + '\n3. Your opinion sentence — mark it "Opinion:". ' + PLAN_RULE + '\n\nNow write.\n' + Array(10).fill(RULE).join('\n'),
                answer: 'Success criteria: Objective report conventions (facts, third person, attribution) clearly separated from a subjective opinion sentence; formality controlled.\nSample ideas: the athletics carnival; the science fair; the fundraising concert',
                id: 2,
                type: 'writing'
            }
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(writingSpec, getEnglishGradeConfig(7), seedFrom([7, 'writing', 0]))).toEqual([]);
    });
});

describe('writing — generator invariants', () => {
    for (const grade of [g3, g5, g6]) {
        const ask = writingSpec.perPage * 100;
        const problems = writingSpec.generate(createRng(seedFrom([grade.id, writingSpec.id, 0])), grade.caps, ask);

        it(`year ${grade.id}: fills the ask and the bank is exactly 6 projects`, () => {
            expect(problems.length).toBe(ask);
            expect(new Set(titles(problems)).size).toBe(6);
        });

        it(`year ${grade.id}: every project is plan scaffold + ruled composition space`, () => {
            for (const p of problems) {
                const lines = p.prompt.split('\n');
                // title + purpose/audience + blank + "Plan first." + 3 plan
                // lines + blank + "Now write." + composition rules
                expect(lines[3]).toBe('Plan first.');
                expect(lines[4].endsWith(PLAN_RULE)).toBe(true);
                expect(lines[5].endsWith(PLAN_RULE)).toBe(true);
                expect(lines[6].endsWith(PLAN_RULE)).toBe(true);
                expect(lines[8]).toBe('Now write.');
                const compose = lines.slice(9);
                // A full page of writing space: at least 8 ruled lines, all
                // identical full-width rules.
                expect(compose.length).toBeGreaterThanOrEqual(8);
                for (const c of compose) expect(c).toBe(RULE);
            }
        });

        it(`year ${grade.id}: answers are success criteria + sample ideas (open tasks)`, () => {
            for (const p of problems) {
                expect(p.answer.startsWith('Success criteria: ')).toBe(true);
                expect(p.answer).toContain('\nSample ideas: ');
            }
        });
    }

    it('the year banks are disjoint (genuine Y3/Y5/Y6 genre progression, Y5 ≠ Y6)', () => {
        const t3 = new Set(titles(writingSpec.generate(createRng(seedFrom([3, 'writing', 0])), g3.caps, 100)));
        const t5 = new Set(titles(writingSpec.generate(createRng(seedFrom([5, 'writing', 0])), g5.caps, 100)));
        const t6 = new Set(titles(writingSpec.generate(createRng(seedFrom([6, 'writing', 0])), g6.caps, 100)));
        for (const t of t3) expect(t5.has(t)).toBe(false);
        for (const t of t5) expect(t6.has(t)).toBe(false);
        for (const t of t3) expect(t6.has(t)).toBe(false);
    });

    it('is deterministic: the same seed yields the same sheet', () => {
        expect(sheet(g6)).toEqual(sheet(g6));
    });
});
