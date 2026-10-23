// Unit tests for the SUBJECT–VERB AGREEMENT worksheet plugin (Year 5+,
// distribution quality pass).
//
// Strategy — deterministic generator: the ENTIRE page-1 sheet is pinned to
// exact expected values from the real generator with the framework seed
// (seedFrom([grade.id, spec.id, 0])). On top of the pins this suite
// INDEPENDENTLY verifies over a 20-page sample:
//   - CORRECTNESS: every answer is re-derived from the exported pair bank —
//     the verb printed for a subject must match that subject's number
//     (is/was/has = singular, are/were/have = plural), the "fix the verb"
//     answer must differ from the wrong verb printed, and MC answers appear
//     in the options with EXACTLY ONE option agreeing;
//   - TASK VARIETY: all six families occur, none dominates;
//   - DENSITY: perPage 8 (was 18);
//   - SEMANTIC DIVERSITY: option-order-sorted uniqueness pinned exactly
//     (570 semantic questions at the 800-row ask; 100 pages repeat-free).
// Before/after (measured at a 3000-row ask): OLD raw pool 1296 / semantic
// 336 — and the old subject-fit family printed NONSENSE ("__ a happy",
// "__ r happy": it indexed a verb PAIR's letters instead of taking a verb).
// NEW raw pool 3000 / semantic 1279, 24 pairs, six families, curated
// never-fits distractor verbs.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig, type Problem } from '../../framework';
import { agreementSpec, AGREEMENT_PAIRS } from './AgreementWorksheet';

const g5 = getEnglishGradeConfig(5);
const g6 = getEnglishGradeConfig(6);

function sheet(grade: GradeConfig) {
    return generateSheet(agreementSpec, grade, seedFrom([grade.id, agreementSpec.id, 0]));
}

// The six family prefixes (one per task family) — used for variety checks.
const FAMILIES = [
    'Choose the correct verb:',
    'Which verb agrees:',
    'Which subject fits:',
    'Which subject agrees with',
    'Fix the verb:',
    'Write a sentence using'
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

// Bank re-derivation helpers: subject -> its pair entry, and the number of
// each verb form.
type Pair = [string, string, string, string, string, string];
const BY_SUBJECT = new Map<string, Pair>();
for (const p of AGREEMENT_PAIRS) {
    BY_SUBJECT.set(p[0], p);
    BY_SUBJECT.set(p[1], p);
}
const SINGULAR = new Set(['is', 'was', 'has']);
const PLURAL = new Set(['are', 'were', 'have']);
const verbIsSing = (v: string) => SINGULAR.has(v);

describe('agreement plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and low-density page size (8, was 18)', () => {
        expect(agreementSpec.id).toBe('agreement');
        expect(agreementSpec.label).toBe('Verb Agreement');
        expect(agreementSpec.icon).toBe('=');
        expect(agreementSpec.perPage).toBe(8);
    });

    it('describes its scope (subjects & verbs that match)', () => {
        expect(agreementSpec.scope(g5)).toBe('subjects & verbs that match');
        expect(agreementSpec.scope(g6)).toBe('subjects & verbs that match');
    });

    it('is gated by the grade catalogue (Years 5..6 only, targeting Y5+)', () => {
        expect(agreementSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(agreementSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(agreementSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(agreementSpec.offered(getEnglishGradeConfig(3))).toBe(false);
        expect(agreementSpec.offered(getEnglishGradeConfig(4))).toBe(false);
        expect(agreementSpec.offered(g5)).toBe(true);
        expect(agreementSpec.offered(g6)).toBe(true);
        expect(agreementSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(agreementSpec, getEnglishGradeConfig(2), seedFrom([2, 'agreement', 0]))).toEqual([]);
    });
});

describe('agreement — Year 5', () => {
    it('matches the exact page-1 sheet (all 8 rows)', () => {
        expect(sheet(g5)).toEqual([
        {"prompt":"Which verb agrees: The teacher __ a new planner? (does, has, have)","answer":"has","id":1,"type":"agreement"},
        {"prompt":"Which subject fits: __ were mending the fence? (The man or The men)","answer":"The men","id":2,"type":"agreement"},
        {"prompt":"Write a sentence using \"The farmer\" and \"was\".","answer":"Example: The farmer was harvesting wheat.","id":3,"type":"agreement"},
        {"prompt":"Which subject agrees with \"is barking at the mailman\"? (The cities, The dog, The dogs)","answer":"The dog","id":4,"type":"agreement"},
        {"prompt":"Fix the verb: \"My friend are coming over.\"","answer":"is","id":5,"type":"agreement"},
        {"prompt":"Choose the correct verb: The players __ tired after training.","answer":"were","id":6,"type":"agreement"},
        {"prompt":"Which subject agrees with \"have finished the test\"? (The students, The student, The tomato)","answer":"The students","id":7,"type":"agreement"},
        {"prompt":"Which verb agrees: My cousin __ arrived early? (have, has, is)","answer":"has","id":8,"type":"agreement"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(agreementSpec, g5, seedFrom([5, 'agreement', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Write a sentence using \"The boxes\" and \"were\".","answer":"Example: The boxes were stacked in the shed.","id":9,"type":"agreement"},
        {"prompt":"Fix the verb: \"The teeth is aching after sweets.\"","answer":"are","id":10,"type":"agreement"},
        {"prompt":"Which subject fits: __ is watching TV? (My brother or My brothers)","answer":"My brother","id":11,"type":"agreement"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(agreementSpec, getEnglishGradeConfig(7), seedFrom([7, 'agreement', 0]))).toEqual([]);
    });
});

describe('agreement — Year 6', () => {
    it('matches the exact page-1 head (grade 6 rolls its own stream)', () => {
        expect(sheet(g6).slice(0, 3)).toEqual([
        {"prompt":"Write a sentence using \"The players\" and \"were\".","answer":"Example: The players were tired after training.","id":1,"type":"agreement"},
        {"prompt":"Fix the verb: \"The children is reading quietly.\"","answer":"are","id":2,"type":"agreement"},
        {"prompt":"Which subject fits: __ has saved the day? (The hero or The heroes)","answer":"The hero","id":3,"type":"agreement"}
        ]);
    });
});

describe('agreement — determinism', () => {
    it('the same seed yields the identical document twice', () => {
        const a = generateDocument(agreementSpec, g5, seedFrom([5, 'agreement', 0]), 3);
        const b = generateDocument(agreementSpec, g5, seedFrom([5, 'agreement', 0]), 3);
        expect(a).toEqual(b);
    });

    it('a different refresh seed yields a different stream', () => {
        const a = sheet(g5);
        const b = generateSheet(agreementSpec, g5, seedFrom([5, 'agreement', 1]));
        expect(a.map((p) => p.prompt)).not.toEqual(b.map((p) => p.prompt));
    });
});

describe('agreement — correctness invariants (20-page sample, bank re-derivation)', () => {
    const rows = generateDocument(agreementSpec, g5, seedFrom([5, 'agreement', 0]), 20).pages.flat();

    it('every row has a non-empty prompt and answer', () => {
        for (const p of rows) {
            expect(p.prompt.length).toBeGreaterThan(0);
            expect(p.answer.length).toBeGreaterThan(0);
        }
    });

    it('verb-choice answers agree in number with the printed subject', () => {
        const verbRows = rows.filter((p) => p.prompt.startsWith('Choose the correct verb:') || p.prompt.startsWith('Which verb agrees:'));
        expect(verbRows.length).toBeGreaterThan(20);
        for (const p of verbRows) {
            const subject = (p.prompt.match(/(?:verb|agrees): (.+?) __/) as RegExpMatchArray)[1];
            const pair = BY_SUBJECT.get(subject);
            expect(pair).toBeDefined();
            const expected = subject === pair?.[0] ? pair[2] : pair[3];
            expect(p.answer).toBe(expected);
            // The answer's number must match the subject's number.
            expect(verbIsSing(p.answer)).toBe(subject === pair?.[0]);
        }
    });

    it('MC verb options contain exactly one verb from the pair\'s own family agreeing in number', () => {
        const mcRows = rows.filter((p) => p.prompt.startsWith('Which verb agrees:'));
        for (const p of mcRows) {
            const subject = (p.prompt.match(/agrees: (.+?) __/) as RegExpMatchArray)[1];
            const pair = BY_SUBJECT.get(subject);
            const wantSing = subject === pair?.[0];
            const opts = optionsOf(p.prompt) as string[];
            // Only the pair's OWN verb family can complete the tail; the
            // curated extra (a different family) may match number but never
            // the form, so within the family exactly one option agrees.
            const family = [pair?.[2], pair?.[3]];
            const agreeing = opts.filter((o) => family.includes(o) && verbIsSing(o) === wantSing);
            expect(agreeing).toEqual([p.answer]);
        }
    });

    it('subject-fit answers agree with the printed verb (the old "__ a happy" bug stays fixed)', () => {
        const subjectRows = rows.filter((p) => p.prompt.startsWith('Which subject fits:'));
        expect(subjectRows.length).toBeGreaterThan(10);
        for (const p of subjectRows) {
            const m = p.prompt.match(/^Which subject fits: __ (\w+) (.+)\? \((.+) or (.+)\)$/);
            expect(m).not.toBeNull();
            const [, verb, , sing, plur] = m as unknown as RegExpMatchArray;
            // The printed verb must be a real agreement form (never a stray
            // letter from the old destructuring bug).
            expect([...SINGULAR, ...PLURAL]).toContain(verb);
            expect(p.answer).toBe(verbIsSing(verb) ? sing : plur);
        }
    });

    it('MC subject options contain exactly one subject agreeing with the printed verb', () => {
        const mcRows = rows.filter((p) => p.prompt.startsWith('Which subject agrees with'));
        expect(mcRows.length).toBeGreaterThan(10);
        for (const p of mcRows) {
            const m = p.prompt.match(/^Which subject agrees with "(\w+) /) as RegExpMatchArray;
            const wantSing = verbIsSing(m[1]);
            const opts = optionsOf(p.prompt) as string[];
            const agreeing = opts.filter((o) => {
                const pair = BY_SUBJECT.get(o);
                return pair ? (o === pair[0]) === wantSing : false;
            });
            expect(agreeing).toEqual([p.answer]);
        }
    });

    it('fix-the-verb answers correct the mismatch printed in the sentence', () => {
        const fixRows = rows.filter((p) => p.prompt.startsWith('Fix the verb:'));
        expect(fixRows.length).toBeGreaterThan(10);
        for (const p of fixRows) {
            // Verb matched from the known bank set so multi-word subjects
            // ("My friend are coming over.") split correctly; no bank
            // subject contains a verb-set token, so the lazy subject is safe.
            const m = p.prompt.match(/^Fix the verb: "(.+?) (is|are|was|were|has|have) (.+)\."$/) as RegExpMatchArray;
            const [, subject, wrongVerb] = m;
            const pair = BY_SUBJECT.get(subject);
            expect(pair).toBeDefined();
            const expected = subject === pair?.[0] ? pair[2] : pair[3];
            expect(p.answer).toBe(expected);
            expect(p.answer).not.toBe(wrongVerb);
        }
    });

    it('apply rows carry a labeled Example built from the pair bank', () => {
        const applyRows = rows.filter((p) => p.prompt.startsWith('Write a sentence using'));
        expect(applyRows.length).toBeGreaterThan(10);
        for (const p of applyRows) {
            const m = p.prompt.match(/using "(.+?)" and "(.+?)"\./) as RegExpMatchArray;
            const [, subject, verb] = m;
            const pair = BY_SUBJECT.get(subject);
            expect(p.answer).toBe(`Example: ${subject} ${verb} ${pair?.[4]}.`);
        }
    });
});

describe('agreement — task variety & density', () => {
    const rows = generateDocument(agreementSpec, g5, seedFrom([5, 'agreement', 0]), 20).pages.flat();

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

describe('agreement — semantic diversity (option-order-independent)', () => {
    it('100 pages (800 rows) print with zero repeated prompts', () => {
        const probs = agreementSpec.generate(createRng(seedFrom([5, 'agreement', 0])), g5.caps, 800);
        expect(new Set(probs.map((p) => p.prompt)).size).toBe(800);
    });

    it('the semantic question pool (options sorted) is exactly 570 distinct questions at the 800-row ask', () => {
        const probs = agreementSpec.generate(createRng(seedFrom([5, 'agreement', 0])), g5.caps, 800);
        expect(new Set(probs.map(semanticKey)).size).toBe(570);
    });
});
