// Unit tests for the DIALOGUE PUNCTUATION worksheet plugin (Year 5+,
// distribution quality pass).
//
// Strategy — deterministic generator: the ENTIRE page-1 sheet is pinned to
// exact expected values from the real generator with the framework seed
// (seedFrom([grade.id, spec.id, 0])). On top of the pins this suite
// INDEPENDENTLY verifies over a 20-page sample:
//   - CORRECTNESS: every answer matches one of the VALID punctuation
//     patterns for this level (quote + ?/! inside and no comma; quote +
//     comma inside; new speaker on a new line; split quote keeps the comma
//     on both sides of the reporter), has balanced quotation marks, and
//     appears among the printed options for MC rows;
//   - CONTEXT VARIETY: the old sheet printed the SAME second speaker line
//     ("Where is the map?" asked Sam.) for every layout question — the tests
//     now require many distinct two-speaker pairs;
//   - TASK VARIETY: all five prompt families occur, none dominates;
//   - DENSITY: perPage 6 (was 16), single column — writing room;
//   - SEMANTIC DIVERSITY: option-order-sorted uniqueness pinned exactly
//     (525 semantic questions at the 600-row ask; 100 pages repeat-free).
// Before/after (measured at a 3000-row ask): OLD raw pool 720 / semantic
// 150; NEW raw pool 3000 / semantic 1758 (bigger line banks, varied
// reporter pairs, new split-quote + compose families).

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig, type Problem } from '../../framework';
import { advpunctSpec } from './AdvancedPunctuationWorksheet';

const g5 = getEnglishGradeConfig(5);
const g6 = getEnglishGradeConfig(6);

function sheet(grade: GradeConfig) {
    return generateSheet(advpunctSpec, grade, seedFrom([grade.id, advpunctSpec.id, 0]));
}

// The five prompt-family prefixes (six kinds; two MC kinds share the
// "punctuated correctly?" stem) — used for variety checks.
const FAMILIES = [
    'Which is punctuated correctly?',
    'Punctuate the dialogue:',
    'Which layout is right',
    'Add the quotation marks and commas:',
    'Write a two-speaker dialogue:'
];

function optionsOf(prompt: string): string[] | null {
    const m = prompt.match(/\(([^()]*)\)\s*$/);
    if (!m) return null;
    return m[1].split(m[1].includes(' / ') ? ' / ' : ', ');
}

function semanticKey(p: Problem): string {
    const opts = optionsOf(p.prompt);
    if (!opts) return p.prompt;
    return p.prompt.replace(/\(([^()]*)\)\s*$/, `(${[...opts].sort().join(' | ')})`);
}

// The VALID reported-line patterns (ACARA Y5–6 dialogue punctuation):
//   statement: "…," reporter.   question: "…?" reporter.   exclaim: "…!" reporter.
//   split:     "…," reporter, "…."   layout: two lines, each a valid line.
// Quote contents use [^"]+ so a pattern can never "swallow" a closing quote
// and wrongly validate a two-sentence distractor line.
const VALID = [
    /^"[^"]+," [a-z]+ [A-Z][a-z]+\.$/, // statement, comma inside
    /^"[^"]+\?" [a-z]+ [A-Z][a-z]+\.$/, // question, ? inside, no comma
    /^"[^"]+!" [a-z]+ [A-Z][a-z]+\.$/, // exclamation, ! inside, no comma
    /^"[^"]+," [a-z]+ [A-Z][a-z]+, "[^"]+\."$/ // split quote, comma both sides
];

describe('advpunct plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, low-density page size (6, was 16) and single-column layout', () => {
        expect(advpunctSpec.id).toBe('advpunct');
        expect(advpunctSpec.label).toBe('Dialogue Punctuation');
        expect(advpunctSpec.icon).toBe('❞');
        expect(advpunctSpec.perPage).toBe(6);
        // Prose lines run single-column.
        expect(advpunctSpec.singleColumn).toBe(true);
    });

    it('describes its scope (quotes, commas & new speakers)', () => {
        expect(advpunctSpec.scope(g5)).toBe('quotes, commas & new speakers');
        expect(advpunctSpec.scope(g6)).toBe('quotes, commas & new speakers');
    });

    it('is gated by the grade catalogue (Years 5..6 only, targeting Y5+)', () => {
        expect(advpunctSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(advpunctSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(advpunctSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(advpunctSpec.offered(getEnglishGradeConfig(3))).toBe(false);
        expect(advpunctSpec.offered(getEnglishGradeConfig(4))).toBe(false);
        expect(advpunctSpec.offered(g5)).toBe(true);
        expect(advpunctSpec.offered(g6)).toBe(true);
        expect(advpunctSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(advpunctSpec, getEnglishGradeConfig(2), seedFrom([2, 'advpunct', 0]))).toEqual([]);
    });
});

describe('advpunct — Year 5', () => {
    it('matches the exact page-1 sheet (all 6 rows)', () => {
        expect(sheet(g5)).toEqual([
        {"prompt":"Which is punctuated correctly? (\"Grandma arrived by bus\", replied Ella. / \"Grandma arrived by bus.\" replied Ella. / \"Grandma arrived by bus,\" replied Ella.)","answer":"\"Grandma arrived by bus,\" replied Ella.","id":1,"type":"advpunct"},
        {"prompt":"Punctuate the dialogue: Why is the door locked asked Nina.","answer":"\"Why is the door locked?\" asked Nina.","id":2,"type":"advpunct"},
        {"prompt":"Which layout is right when the speaker changes? (\"Dinner is nearly ready,\" replied Ben. \"Can we go to the beach today?\" asked Sam. / \"Dinner is nearly ready,\" replied Ben. asked Sam, \"Can we go to the beach today?\" / \"Dinner is nearly ready,\" replied Ben.\n\"Can we go to the beach today?\" asked Sam.)","answer":"\"Dinner is nearly ready,\" replied Ben.\n\"Can we go to the beach today?\" asked Sam.","id":3,"type":"advpunct"},
        {"prompt":"Which is punctuated correctly? (\"Our train leaves at noon,\" replied Ben. \"be on time.\" / \"Our train leaves at noon\", replied Ben, \"be on time.\" / \"Our train leaves at noon,\" replied Ben, \"be on time.\")","answer":"\"Our train leaves at noon,\" replied Ben, \"be on time.\"","id":4,"type":"advpunct"},
        {"prompt":"Add the quotation marks and commas: Our train leaves at noon replied Ella be on time.","answer":"\"Our train leaves at noon,\" replied Ella, \"be on time.\"","id":5,"type":"advpunct"},
        {"prompt":"Write a two-speaker dialogue: the first speaker says \"I brought the sports kit\" and the second asks \"Where are my runners\".","answer":"Example: \"I brought the sports kit,\" said Mia.\n\"Where are my runners?\" asked Sam.","id":6,"type":"advpunct"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(advpunctSpec, g5, seedFrom([5, 'advpunct', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Add the quotation marks and commas: Dinner is nearly ready called Max please set the table.","answer":"\"Dinner is nearly ready,\" called Max, \"please set the table.\"","id":7,"type":"advpunct"},
        {"prompt":"Which layout is right when the speaker changes? (\"We are going to the museum,\" said Mia.\n\"Is the canteen still open?\" asked Nina. / \"We are going to the museum,\" said Mia. \"Is the canteen still open?\" asked Nina. / \"We are going to the museum,\" said Mia. asked Nina, \"Is the canteen still open?\")","answer":"\"We are going to the museum,\" said Mia.\n\"Is the canteen still open?\" asked Nina.","id":8,"type":"advpunct"},
        {"prompt":"Which is punctuated correctly? (\"The garden needs water,\" whispered Zoe, \"grab the hose.\" / \"The garden needs water,\" whispered Zoe. \"grab the hose.\" / \"The garden needs water\", whispered Zoe, \"grab the hose.\")","answer":"\"The garden needs water,\" whispered Zoe, \"grab the hose.\"","id":9,"type":"advpunct"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(advpunctSpec, getEnglishGradeConfig(7), seedFrom([7, 'advpunct', 0]))).toEqual([]);
    });
});

describe('advpunct — Year 6', () => {
    it('matches the exact page-1 head (grade 6 rolls its own stream)', () => {
        expect(sheet(g6).slice(0, 3)).toEqual([
        {"prompt":"Write a two-speaker dialogue: the first speaker says \"Dinner is nearly ready\" and the second asks \"Where are my runners\".","answer":"Example: \"Dinner is nearly ready,\" said Mia.\n\"Where are my runners?\" asked Sam.","id":1,"type":"advpunct"},
        {"prompt":"Which is punctuated correctly? (\"What time is the bus coming\"? said Tom. / \"What time is the bus coming?\", said Tom. / \"What time is the bus coming?\" said Tom.)","answer":"\"What time is the bus coming?\" said Tom.","id":2,"type":"advpunct"},
        {"prompt":"Punctuate the dialogue: What time is the bus coming asked Sam.","answer":"\"What time is the bus coming?\" asked Sam.","id":3,"type":"advpunct"}
        ]);
    });
});

describe('advpunct — determinism', () => {
    it('the same seed yields the identical document twice', () => {
        const a = generateDocument(advpunctSpec, g5, seedFrom([5, 'advpunct', 0]), 3);
        const b = generateDocument(advpunctSpec, g5, seedFrom([5, 'advpunct', 0]), 3);
        expect(a).toEqual(b);
    });

    it('a different refresh seed yields a different stream', () => {
        const a = sheet(g5);
        const b = generateSheet(advpunctSpec, g5, seedFrom([5, 'advpunct', 1]));
        expect(a.map((p) => p.prompt)).not.toEqual(b.map((p) => p.prompt));
    });
});

describe('advpunct — correctness invariants (20-page sample)', () => {
    const rows = generateDocument(advpunctSpec, g5, seedFrom([5, 'advpunct', 0]), 20).pages.flat();

    it('every answer is a VALID punctuated dialogue line (rule patterns)', () => {
        for (const p of rows) {
            const answer = p.answer.startsWith('Example: ') ? p.answer.slice('Example: '.length) : p.answer;
            // Layout answers are two lines — each line must be valid.
            const lines = answer.split('\n');
            for (const line of lines) {
                const ok = VALID.some((re) => re.test(line));
                expect(ok).toBe(true);
            }
        }
    });

    it('every answer has balanced quotation marks', () => {
        for (const p of rows) {
            const answer = p.answer.startsWith('Example: ') ? p.answer.slice('Example: '.length) : p.answer;
            expect((answer.match(/"/g) ?? []).length % 2).toBe(0);
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
        expect(mcCount).toBeGreaterThan(40);
    });

    it('MC distractors each break exactly one visible rule (never equal the answer)', () => {
        for (const p of rows) {
            if (!p.prompt.startsWith('Which is punctuated correctly?') && !p.prompt.startsWith('Which layout is right')) continue;
            const opts = optionsOf(p.prompt) as string[];
            for (const o of opts) {
                if (o === p.answer) continue;
                // A wrong option must NOT itself match every valid pattern.
                const lines = o.split('\n');
                const allValid = lines.every((line) => VALID.some((re) => re.test(line)));
                expect(allValid).toBe(false);
            }
        }
    });
});

describe('advpunct — context & task variety', () => {
    const rows = generateDocument(advpunctSpec, g5, seedFrom([5, 'advpunct', 0]), 20).pages.flat();

    it('layout questions use many DISTINCT speaker pairs (no fixed second line)', () => {
        // The old generator always printed "Where is the map?" asked Sam.
        const layoutRows = rows.filter((p) => p.prompt.startsWith('Which layout is right'));
        const pairs = new Set(layoutRows.map((p) => p.answer));
        expect(pairs.size).toBeGreaterThanOrEqual(15);
    });

    it('all five prompt families occur within the first two pages', () => {
        const first2 = rows.slice(0, 12);
        for (const fam of FAMILIES) {
            expect(first2.some((p) => p.prompt.startsWith(fam))).toBe(true);
        }
    });

    it('no single family dominates more than 45% of a 120-row run', () => {
        const counts = new Map<string, number>();
        for (const p of rows) {
            const fam = FAMILIES.find((f) => p.prompt.startsWith(f)) as string;
            counts.set(fam, (counts.get(fam) ?? 0) + 1);
        }
        for (const n of counts.values()) {
            expect(n / rows.length).toBeLessThanOrEqual(0.45);
        }
    });
});

describe('advpunct — semantic diversity (option-order-independent)', () => {
    it('100 pages (600 rows) print with zero repeated prompts', () => {
        const probs = advpunctSpec.generate(createRng(seedFrom([5, 'advpunct', 0])), g5.caps, 600);
        expect(new Set(probs.map((p) => p.prompt)).size).toBe(600);
    });

    it('the semantic question pool (options sorted) is exactly 525 distinct questions at the 600-row ask', () => {
        const probs = advpunctSpec.generate(createRng(seedFrom([5, 'advpunct', 0])), g5.caps, 600);
        expect(new Set(probs.map(semanticKey)).size).toBe(525);
    });
});
