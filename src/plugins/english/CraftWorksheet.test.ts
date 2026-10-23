// Unit tests for the CRAFTING SENTENCES worksheet plugin (T5 new family).
//
// Strategy: deterministic exact pins for Year 3 and Year 6 (page 1 + page 2
// head), then generator invariants over the whole stream: every MC answer is
// one of its printed options, open-ended answers carry acceptance notes, the
// 6-page window is fully unique, and the Y3/Y5/Y6 banks are DISJOINT prompt
// sets (genuine sentence-craft progression, Y5 ≠ Y6). The per-year pool is
// ~44-46 printed questions (measured, pinned below): roomy for a class set of
// six-page booklets, deliberately NOT in the 100-page unique-sampling suite.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig } from '../../framework';
import { craftSpec } from './CraftWorksheet';

const g3 = getEnglishGradeConfig(3);
const g5 = getEnglishGradeConfig(5);
const g6 = getEnglishGradeConfig(6);

function sheet(grade: GradeConfig) {
    return generateSheet(craftSpec, grade, seedFrom([grade.id, craftSpec.id, 0]));
}

// Ruled writing line printed under open-ended tasks.
const RULE = '__ __ __ __ __ __ __ __ __ __';

// Extract the trailing "(a, b, c)" / "(a / b / c)" option list from an MC
// prompt; null when the prompt is not multiple-choice (same contract as the
// conjunction suite's helper — craft MC options may contain commas, so the
// ' / ' separator takes priority).
function optionsOf(prompt: string): string[] | null {
    const m = prompt.match(/\(([^)]+)\)\s*$/);
    if (!m) return null;
    if (m[1].includes(' / ')) return m[1].split(' / ');
    if (m[1].includes(', ')) return m[1].split(', ');
    return null;
}

describe('craft plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, page size and single-column layout', () => {
        expect(craftSpec.id).toBe('craft');
        expect(craftSpec.label).toBe('Crafting Sentences');
        expect(craftSpec.icon).toBe('⤴');
        expect(craftSpec.perPage).toBe(4);
        expect(craftSpec.singleColumn).toBe(true);
    });

    it('describes its scope per level (the crafting focus deepens each year)', () => {
        expect(craftSpec.scope(g3)).toBe('reorder, add detail, join with and/but/or/so/because');
        expect(craftSpec.scope(getEnglishGradeConfig(4))).toBe('combine with when/while/although, add adverbial detail');
        expect(craftSpec.scope(g5)).toBe('complex sentences — reason, purpose, condition, concession');
        expect(craftSpec.scope(g6)).toBe('embedded clauses, varied openers, formal and objective tone');
    });

    it('is gated by the grade catalogue (Years 3..6 only)', () => {
        expect(craftSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(craftSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(craftSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(craftSpec.offered(g3)).toBe(true);
        expect(craftSpec.offered(g6)).toBe(true);
        expect(craftSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        expect(generateSheet(craftSpec, getEnglishGradeConfig(2), seedFrom([2, 'craft', 0]))).toEqual([]);
    });
});

describe('craft — Year 3', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g3)).toEqual([
            {"prompt":"Join the two sentences with \"and\" to make one sentence:\n\"Dad grilled the sausages.\"  \"mum set the table.\"\n" + RULE,"answer":"Dad grilled the sausages and mum set the table.","id":1,"type":"craft"},
            {"prompt":"Which detail best tells HOW? \"The bus rumbled on.\" (slowly / yesterday / three)","answer":"slowly","id":2,"type":"craft"},
            {"prompt":"Which detail best tells WHERE? \"We found the lost kite.\" (quickly / then / in the tree)","answer":"in the tree","id":3,"type":"craft"},
            {"prompt":"Add the detail \"loudly\" to the sentence. Write your new sentence:\n\"The kookaburra laughed\"\n" + RULE,"answer":"Example: The kookaburra laughed loudly. (any sensible placement of \"loudly\" is correct)","id":4,"type":"craft"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        // perPage 4 (T15): page 2 starts at stream row 5 ("or" join).
        expect(generateDocument(craftSpec, g3, seedFrom([3, 'craft', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Join the two sentences with \"or\" to make one sentence:\n\"We can ride bikes.\"  \"we can walk.\"\n" + RULE,"answer":"We can ride bikes or we can walk.","id":5,"type":"craft"},
            {"prompt":"Write a sentence using \"and\" to add two actions.\n" + RULE,"answer":"Example: The wind rose and the kite soared. (any sensible sentence meeting the task is correct)","id":6,"type":"craft"},
            {"prompt":"Write a sentence that tells WHERE you saw a bird.\n" + RULE,"answer":"Example: A rosella perched on the school fence. (any sensible sentence meeting the task is correct)","id":7,"type":"craft"}
        ]);
    });
});

describe('craft — Year 6', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g6)).toEqual([
            {"prompt":"Which sentence is the most FORMAL? (The council really messed up. / The council made an error. / The council stuff-ups were bad.)","answer":"The council made an error.","id":1,"type":"craft"},
            {"prompt":"Which sentence uses a comma correctly after a fronted clause? (After the rain stopped we, set off. / After the rain stopped, we set off. / After the rain, stopped we set off.)","answer":"After the rain stopped, we set off.","id":2,"type":"craft"},
            {"prompt":"Write a complex sentence with an EMBEDDED clause (who/which/that) about a person or place you know.\n" + RULE,"answer":"Example: The librarian, who remembers every student's name, recommended the book. (any sensible sentence meeting the task is correct)","id":3,"type":"craft"},
            {"prompt":"Which sentence shows BIAS? (Our team played the best game ever. / Both teams scored early. / The match finished 10 to 8.)","answer":"Our team played the best game ever.","id":4,"type":"craft"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        // perPage 4 (T15): page 2 starts at stream row 5 (remove-the-bias).
        expect(generateDocument(craftSpec, g6, seedFrom([6, 'craft', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Remove the BIAS:\n\"Nobody in their right mind supports the new rule.\"\n" + RULE,"answer":"Example: Some community members oppose the new rule. (any sensible neutral wording is correct)","id":5,"type":"craft"},
            {"prompt":"Add the detail \"the sign had faded in the sun\" to the sentence. Write your new sentence:\n\"The sign warned swimmers.\"\n" + RULE,"answer":"Example: The sign, which had faded in the sun, warned swimmers. (any sensible placement of \"the sign had faded in the sun\" is correct)","id":6,"type":"craft"},
            {"prompt":"Rewrite PRECISELY (replace vague words):\n\"A lot of people reckoned the show was pretty good.\"\n" + RULE,"answer":"Example: Many reviewers considered the show a success. (any sensible precise wording is correct)","id":7,"type":"craft"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(craftSpec, getEnglishGradeConfig(7), seedFrom([7, 'craft', 0]))).toEqual([]);
    });
});

describe('craft — generator invariants', () => {
    for (const grade of [g3, g5, g6]) {
        const ask = craftSpec.perPage * 100;
        const problems = craftSpec.generate(createRng(seedFrom([grade.id, craftSpec.id, 0])), grade.caps, ask);

        it(`year ${grade.id}: fills the ask; the per-year pool is exactly the pinned capacity`, () => {
            expect(problems.length).toBe(ask);
            // Measured printed-question capacity (option order counted): the
            // pool is bank-sized, NOT 100-page-unique — six-page booklets are
            // the design target, and the 6-page window below is fully unique.
            const expected = grade.id === 3 ? 46 : 44;
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(expected);
        });

        it(`year ${grade.id}: the 6-page window (24 rows) is fully unique`, () => {
            const six = craftSpec.generate(createRng(seedFrom([grade.id, craftSpec.id, 0])), grade.caps, craftSpec.perPage * 6);
            expect(new Set(six.map((p) => p.prompt)).size).toBe(craftSpec.perPage * 6);
        });

        it(`year ${grade.id}: every MC answer is one of its printed options`, () => {
            for (const p of problems) {
                const options = optionsOf(p.prompt);
                if (options) expect(options).toContain(p.answer);
            }
        });

        it(`year ${grade.id}: open-ended answers carry acceptance notes`, () => {
            for (const p of problems) {
                if (p.answer.startsWith('Example:')) expect(p.answer).toContain('(any');
            }
        });
    }

    it('the year banks are disjoint (genuine Y3/Y5/Y6 progression, Y5 ≠ Y6)', () => {
        const six = (grade: GradeConfig) =>
            new Set(craftSpec.generate(createRng(seedFrom([grade.id, craftSpec.id, 0])), grade.caps, craftSpec.perPage * 6).map((p) => p.prompt));
        const p3 = six(g3);
        const p5 = six(g5);
        const p6 = six(g6);
        for (const p of p3) expect(p5.has(p)).toBe(false);
        for (const p of p5) expect(p6.has(p)).toBe(false);
        for (const p of p3) expect(p6.has(p)).toBe(false);
    });

    it('T9: Year 5 EXPAND prints a descriptive-rewrite stem/rubric', () => {
        // Y5 "details" are WRITING INSTRUCTIONS ("which teacher and how they
        // spoke"), not literal phrases — the old "Add the detail .../
        // placement of ..." form was nonsensical. Instruction-style items
        // now print the descriptive stem + descriptive acceptance, and the
        // literal-phrase form never appears at Y5.
        const problems = craftSpec.generate(createRng(seedFrom([5, 'craft', 0])), g5.caps, craftSpec.perPage * 100);
        const expands = problems.filter((p) => p.prompt.startsWith('Make the sentence more descriptive'));
        expect(expands.length).toBeGreaterThan(0);
        for (const p of expands) {
            expect(p.answer).toContain('(any sensible descriptive wording that covers the instruction is correct)');
            expect(p.answer).not.toContain('placement of');
        }
        // Exact first EXPAND row printed by the Y5 seed-0 stream (pinned from
        // the generator output, not guessed; generator rows carry only
        // prompt+answer — id/type are added by the pins layer).
        expect(expands).toContainEqual({
            prompt: 'Make the sentence more descriptive — add what kind of clouds and where:\n"Storm clouds gathered."\n' + RULE,
            answer: 'Example: Dark storm clouds gathered over the ranges. (any sensible descriptive wording that covers the instruction is correct)',
        });
        for (const p of problems) {
            expect(p.prompt).not.toContain('Add the detail "which');
            expect(p.prompt).not.toContain('Add the detail "what');
            expect(p.prompt).not.toContain('Add the detail "a detail');
        }
    });

    it('is deterministic: the same seed yields the same sheet', () => {
        expect(sheet(g6)).toEqual(sheet(g6));
    });
});
