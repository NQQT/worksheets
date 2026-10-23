// Unit tests for the EDITING & PROOFREADING worksheet plugin (T5 new family).
//
// Strategy: deterministic exact pins for Year 3 and Year 6 (page 1 + page 2
// head), then generator invariants over the full 100-page stream (this bank
// IS big enough for the unique-sampling bar — 600/600 printed-unique at every
// offered grade): every MC answer is one of its printed options, deterministic
// FIX answers actually differ from the buggy source, open-ended corrections
// carry acceptance notes, the IMPROVE kind is level-gated (absent at Y3/Y4,
// present at Y6), and the Y3/Y5/Y6 banks are DISJOINT (Y5 ≠ Y6).

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig } from '../../framework';
import { editingSpec } from './EditingWorksheet';

const g3 = getEnglishGradeConfig(3);
const g5 = getEnglishGradeConfig(5);
const g6 = getEnglishGradeConfig(6);

function sheet(grade: GradeConfig) {
    return generateSheet(editingSpec, grade, seedFrom([grade.id, editingSpec.id, 0]));
}

// Ruled writing line printed under "Correct this sentence:" / "Rewrite ..." rows.
const RULE = '__ __ __ __ __ __ __ __ __ __';

// Extract the trailing "(a, b, c)" / "(a / b / c)" option list from an MC
// prompt; null when the prompt is not multiple-choice.
function optionsOf(prompt: string): string[] | null {
    const m = prompt.match(/\(([^)]+)\)\s*$/);
    if (!m) return null;
    if (m[1].includes(' / ')) return m[1].split(' / ');
    if (m[1].includes(', ')) return m[1].split(', ');
    return null;
}

describe('editing plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, page size and single-column layout', () => {
        expect(editingSpec.id).toBe('editing');
        expect(editingSpec.label).toBe('Editing & Proofreading');
        expect(editingSpec.icon).toBe('✓');
        expect(editingSpec.perPage).toBe(5);
        expect(editingSpec.singleColumn).toBe(true);
    });

    it('describes its scope per level (the error classes deepen each year)', () => {
        expect(editingSpec.scope(g3)).toBe('capital letters and end punctuation');
        expect(editingSpec.scope(getEnglishGradeConfig(4))).toBe('speech marks, spelling and commonly confused words');
        expect(editingSpec.scope(g5)).toBe('commas and subject–verb agreement');
        expect(editingSpec.scope(g6)).toBe('formality, precision and bias');
    });

    it('is gated by the grade catalogue (Years 3..6 only)', () => {
        expect(editingSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(editingSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(editingSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(editingSpec.offered(g3)).toBe(true);
        expect(editingSpec.offered(g6)).toBe(true);
        expect(editingSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        expect(generateSheet(editingSpec, getEnglishGradeConfig(2), seedFrom([2, 'editing', 0]))).toEqual([]);
    });
});

describe('editing — Year 3', () => {
    // T9 re-pin: the two ambiguous SPOT items were made single-category and
    // CHOOSE was restructured to a closed-item deck, so the dealt stream
    // changed. Every SPOT sentence below carries EXACTLY one error kind.
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g3)).toEqual([
            {"prompt":"What kind of mistake is in this sentence?\n\"Look out for the steps\" (grammar, word choice, punctuation)","answer":"punctuation","id":1,"type":"editing"},
            {"prompt":"Correct this sentence:\n\"mum drove us to the show.\"\n" + RULE,"answer":"Mum drove us to the show.","id":2,"type":"editing"},
            {"prompt":"Correct this sentence:\n\"Did you pack your lunchbox\"\n" + RULE,"answer":"Did you pack your lunchbox?","id":3,"type":"editing"},
            {"prompt":"What kind of mistake is in this sentence?\n\"What a goal that was\" (punctuation, grammar, capitalisation)","answer":"punctuation","id":4,"type":"editing"},
            {"prompt":"Correct this sentence:\n\"my sister and i rode our bikes.\"\n" + RULE,"answer":"My sister and I rode our bikes.","id":5,"type":"editing"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(editingSpec, g3, seedFrom([3, 'editing', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Which sentence is correct? (we ate pancakes on sunday. / Look out for the steps. / my sister and i rode our bikes.)","answer":"Look out for the steps.","id":6,"type":"editing"},
            {"prompt":"Which sentence is correct? (What a goal that was! / mum drove us to the show. / Look out for the steps)","answer":"What a goal that was!","id":7,"type":"editing"},
            {"prompt":"What kind of mistake is in this sentence?\n\"the dog ran home.\" (capitalisation, spelling, punctuation)","answer":"capitalisation","id":8,"type":"editing"}
        ]);
    });

    it('T9 repro regression (seed refresh 7): row 11 SPOT is single-category', () => {
        // The reviewer's repro seed surfaced the ambiguity at row 11; the
        // fixed bank's row 11 names ONE unambiguous error kind. T12: perPage
        // 5, so row 11 (id 11) is the FIRST row of page 3 (pages[2][0]).
        const page3 = generateDocument(editingSpec, g3, seedFrom([3, 'editing', 7]), 3).pages[2];
        expect(page3[0]).toEqual({
            prompt: 'What kind of mistake is in this sentence?\n"the dog ran home." (capitalisation, grammar, word choice)',
            answer: 'capitalisation',
            id: 11,
            type: 'editing'
        });
    });

    it('the old ambiguous buggy forms never print in the Year 3 stream', () => {
        // 'did you pack your lunchbox' / 'what a goal that was' (lowercase
        // openers) carried BOTH a capitalisation and a punctuation error —
        // they are gone from the bank entirely.
        const problems = editingSpec.generate(createRng(seedFrom([3, 'editing', 0])), g3.caps, editingSpec.perPage * 100);
        for (const p of problems) {
            expect(p.prompt).not.toContain('"did you pack your lunchbox"');
            expect(p.prompt).not.toContain('"what a goal that was"');
            expect(p.prompt).not.toContain('(did you pack your lunchbox');
            expect(p.prompt).not.toContain('what a goal that was /');
            expect(p.prompt).not.toContain('/ what a goal that was');
        }
    });
});

describe('editing — Year 6', () => {
    // T9 re-pin: CHOOSE now deals ONLY closed single-correct items (the open
    // style/bias rewrites left multiple choice), and three closed comma items
    // joined the bank, so the dealt stream changed. T12 re-pin: perPage 5,
    // and the two collective-noun comma items were re-worded to singular
    // personal subjects ('Aisha was…', 'The principal released…').
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g6)).toEqual([
            {"prompt":"What kind of mistake is in this sentence?\n\"Everyone knows the footy finals are the best event ever.\" (punctuation, word choice, spelling)","answer":"word choice","id":1,"type":"editing"},
            {"prompt":"Which sentence is correct? (We was late because the train broke down. / The research shows, that the reef is warming. / Neither of the answers is correct.)","answer":"Neither of the answers is correct.","id":2,"type":"editing"},
            {"prompt":"Correct this sentence:\n\"The principal released, the final report.\"\n" + RULE,"answer":"The principal released the final report.","id":3,"type":"editing"},
            {"prompt":"Correct this sentence:\n\"Aisha was excited, when the bus arrived.\"\n" + RULE,"answer":"Aisha was excited when the bus arrived.","id":4,"type":"editing"},
            {"prompt":"Correct this sentence:\n\"We was late because the train broke down.\"\n" + RULE,"answer":"We were late because the train broke down.","id":5,"type":"editing"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(editingSpec, g6, seedFrom([6, 'editing', 0]), 2).pages[1].slice(0, 3)).toEqual([
            {"prompt":"Rewrite in a FORMAL, objective register:\n\"The councillor's plan is a total joke, end of story.\"\n" + RULE,"answer":"Example: The councillor's plan has significant weaknesses that require further debate. (any sensible formal, objective wording is accepted)","id":6,"type":"editing"},
            {"prompt":"Which sentence is correct? (The report which was twelve pages long arrived late. / The principal released, the final report. / Aisha was excited when the bus arrived.)","answer":"Aisha was excited when the bus arrived.","id":7,"type":"editing"},
            {"prompt":"What kind of mistake is in this sentence?\n\"The old man, who was super old, crossed the road.\" (capitalisation, word choice, punctuation)","answer":"word choice","id":8,"type":"editing"}
        ]);
    });

    it('T9 repro regression (seed refresh 7): rows 2, 7, 8 are unambiguous', () => {
        // The reviewer's repro seed hit CHOOSE rows whose distractors were
        // merely informal/biased (not wrong). Fixed: row 2 is a deterministic
        // FIX, row 7 a single-category SPOT, row 8 an open IMPROVE with
        // guidance — no "Which sentence is correct?" over style twins.
        // T12: perPage 5 re-indexes the pages (id 7/8 now sit on pages[1]).
        const doc = generateDocument(editingSpec, g6, seedFrom([6, 'editing', 7]), 2);
        expect(doc.pages[0][1]).toEqual({
            prompt: 'Correct this sentence:\n"The report which was twelve pages long arrived late."\n' + RULE,
            answer: 'The report, which was twelve pages long, arrived late.',
            id: 2,
            type: 'editing'
        });
        expect(doc.pages[1][1]).toEqual({
            prompt: 'What kind of mistake is in this sentence?\n"The study proves, without any doubt, that recess should be longer." (word choice, grammar, capitalisation)',
            answer: 'word choice',
            id: 7,
            type: 'editing'
        });
        expect(doc.pages[1][2]).toEqual({
            prompt: 'Rewrite PRECISELY (replace vague language):\n"The project cost a lot but it is doing good things for the area."\n' + RULE,
            answer: 'Example: The project was expensive, but it has benefited the local community. (any sensible precise wording is accepted)',
            id: 8,
            type: 'editing'
        });
    });

    it('T12: the optional-style / collective-agreement forms never print', () => {
        // Australian English: a comma after a fronted adverbial is optional,
        // a defining relative needs no commas ("My uncle who fixes bikes…"),
        // and a collective noun may take plural agreement by meaning ("the
        // class were", "the committee have"). None of these may appear as a
        // keyed error anywhere in the Y5/Y6 streams.
        const banned = [
            'My uncle who fixes bikes',
            'After the storm passed',
            'The class were',
            'The committee have'
        ];
        for (const grade of [getEnglishGradeConfig(5), g6]) {
            const problems = editingSpec.generate(
                createRng(seedFrom([grade.id, editingSpec.id, 0])), grade.caps, editingSpec.perPage * 100
            );
            for (const p of problems) {
                for (const b of banned) {
                    expect(p.prompt).not.toContain(b);
                    expect(p.answer).not.toContain(b);
                }
            }
        }
    });

    it('every CHOOSE row is closed single-correct (no style-model answers)', () => {
        // The open items' "corrections" are rewordings — none may appear as
        // a CHOOSE answer or option, so exactly one option is ever correct.
        const openModels = [
            'The council expects the new pool to be a great addition.',
            'Many people consider the football finals the highlight of the year.',
            'The elderly man crossed the road.',
            'The new policy has several serious drawbacks.',
            'The study suggests that recess could be longer.'
        ];
        const problems = editingSpec.generate(createRng(seedFrom([6, 'editing', 0])), g6.caps, editingSpec.perPage * 100);
        for (const p of problems) {
            if (!p.prompt.startsWith('Which sentence is correct?')) continue;
            expect(openModels).not.toContain(p.answer);
            for (const m of openModels) expect(p.prompt).not.toContain(m);
        }
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(editingSpec, getEnglishGradeConfig(7), seedFrom([7, 'editing', 0]))).toEqual([]);
    });
});

describe('editing — generator invariants', () => {
    for (const grade of [g3, g5, g6]) {
        const ask = editingSpec.perPage * 100;
        const problems = editingSpec.generate(createRng(seedFrom([grade.id, editingSpec.id, 0])), grade.caps, ask);

        it(`year ${grade.id}: fills the full 100-page ask with unique printed prompts`, () => {
            expect(problems.length).toBe(ask);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ask);
        });

        it(`year ${grade.id}: every MC answer is one of its printed options`, () => {
            for (const p of problems) {
                const options = optionsOf(p.prompt);
                if (options) expect(options).toContain(p.answer);
            }
        });

        it(`year ${grade.id}: deterministic FIX answers actually change the source`, () => {
            for (const p of problems) {
                if (!p.prompt.startsWith('Correct this sentence:\n')) continue;
                if (p.answer.startsWith('Example:')) continue; // open correction
                const source = p.prompt.split('\n')[1].replace(/^"|"$/g, '');
                // The model correction differs from the buggy source line —
                // a FIX row whose answer equals the prompt would be a no-op.
                expect(p.answer).not.toBe(source);
            }
        });

        it(`year ${grade.id}: open-ended corrections carry acceptance notes`, () => {
            for (const p of problems) {
                if (p.answer.startsWith('Example:')) expect(p.answer).toContain('(any');
            }
        });
    }

    it('the IMPROVE kind is level-gated: absent at Y3/Y4, present at Y6', () => {
        // caps.level knob (T5): "Rewrite in a FORMAL" rows only join the
        // Year 5+ draw — the Year 3/4 streams never contain one.
        const has = (grade: GradeConfig) =>
            editingSpec.generate(createRng(seedFrom([grade.id, editingSpec.id, 0])), grade.caps, editingSpec.perPage * 100)
                .some((p) => p.prompt.startsWith('Rewrite in a FORMAL'));
        expect(has(g3)).toBe(false);
        expect(has(getEnglishGradeConfig(4))).toBe(false);
        expect(has(g6)).toBe(true);
    });

    it('the year banks are disjoint (genuine Y3/Y5/Y6 progression, Y5 ≠ Y6)', () => {
        const six = (grade: GradeConfig) =>
            new Set(editingSpec.generate(createRng(seedFrom([grade.id, editingSpec.id, 0])), grade.caps, editingSpec.perPage * 6).map((p) => p.prompt));
        const p3 = six(g3);
        const p5 = six(g5);
        const p6 = six(g6);
        for (const p of p3) expect(p5.has(p)).toBe(false);
        for (const p of p5) expect(p6.has(p)).toBe(false);
        for (const p of p3) expect(p6.has(p)).toBe(false);
    });

    it('is deterministic: the same seed yields the same sheet', () => {
        expect(sheet(g6)).toEqual(sheet(g6));
    });
});
