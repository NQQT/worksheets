// Unit tests for the IDIOMS worksheet plugin (Year 5+, distribution quality
// pass).
//
// Strategy — deterministic generator: the ENTIRE page-1 sheet is pinned to
// exact expected values from the real generator with the framework seed
// (seedFrom([grade.id, spec.id, 0])). On top of the pins this suite
// INDEPENDENTLY verifies over a 20-page sample:
//   - CORRECTNESS: every answer is re-derived from the exported curated bank
//     (meaning rows match the idiom's bank meaning; usage rows match its
//     curated correct sentence; completion masks match the bank idiom;
//     justify rows name the bank meaning) and appears in the printed options;
//   - CONTEXT VARIETY: the old sheet built every usage question from ONE
//     fixed frame ("When the party was cancelled, Sam was ...") — the tests
//     now require many distinct usage contexts;
//   - TASK VARIETY: all six families occur, none dominates;
//   - DENSITY: perPage 6 (was 16), single column — writing room;
//   - SEMANTIC DIVERSITY: option-order-sorted uniqueness pinned exactly
//     (391 semantic questions at the 600-row ask; 100 pages repeat-free).
// Before/after (measured at a 3000-row ask): OLD raw pool 230 / semantic 50;
// NEW raw pool 3000 / semantic 2322 (24 idioms x 6 families, curated
// per-idiom sentences).

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, createRng, type GradeConfig, type Problem } from '../../framework';
import { idiomSpec, IDIOM_ITEMS } from './IdiomWorksheet';

const g5 = getEnglishGradeConfig(5);
const g6 = getEnglishGradeConfig(6);

function sheet(grade: GradeConfig) {
    return generateSheet(idiomSpec, grade, seedFrom([grade.id, idiomSpec.id, 0]));
}

// The six family prefixes (one per task family) — used for variety checks.
const FAMILIES = [
    'What does the idiom "',
    'Which sentence uses "',
    'Complete the idiom:',
    'Which idiom means "',
    'Write your own sentence using the idiom "',
    'This sentence misuses "'
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

// Bank lookups used by the correctness re-derivations below.
const BY_IDIOM = new Map(IDIOM_ITEMS.map((it) => [it[0], it]));

describe('idiom plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, low-density page size (6, was 16) and single-column layout', () => {
        expect(idiomSpec.id).toBe('idiom');
        expect(idiomSpec.label).toBe('Idioms');
        expect(idiomSpec.icon).toBe('☁');
        expect(idiomSpec.perPage).toBe(6);
        // Prose lines run single-column.
        expect(idiomSpec.singleColumn).toBe(true);
    });

    it('describes its scope (sayings & their meanings)', () => {
        expect(idiomSpec.scope(g5)).toBe('sayings & their meanings');
        expect(idiomSpec.scope(g6)).toBe('sayings & their meanings');
    });

    it('is gated by the grade catalogue (Years 5..6 only, targeting Y5+)', () => {
        expect(idiomSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(idiomSpec.offered(getEnglishGradeConfig(1))).toBe(false);
        expect(idiomSpec.offered(getEnglishGradeConfig(2))).toBe(false);
        expect(idiomSpec.offered(getEnglishGradeConfig(3))).toBe(false);
        expect(idiomSpec.offered(getEnglishGradeConfig(4))).toBe(false);
        expect(idiomSpec.offered(g5)).toBe(true);
        expect(idiomSpec.offered(g6)).toBe(true);
        expect(idiomSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered grades => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(idiomSpec, getEnglishGradeConfig(2), seedFrom([2, 'idiom', 0]))).toEqual([]);
    });
});

describe('idiom — Year 5', () => {
    it('matches the exact page-1 sheet (all 6 rows)', () => {
        expect(sheet(g5)).toEqual([
        {"prompt":"Which idiom means \"the person in charge\"? (hold your horses, let the cat out of the bag, big cheese)","answer":"big cheese","id":1,"type":"idiom"},
        {"prompt":"Which sentence uses \"on cloud nine\" correctly? (On a cloudy night, the baby slept on cloud nine. / The pilot flew the plane up on cloud nine. / Winning the award left her on cloud nine.)","answer":"Winning the award left her on cloud nine.","id":2,"type":"idiom"},
        {"prompt":"Complete the idiom: __ hot __","answer":"in hot water","id":3,"type":"idiom"},
        {"prompt":"What does the idiom \"break the ice\" really mean? (crack frozen water / start a conversation / chill the drinks)","answer":"start a conversation","id":4,"type":"idiom"},
        {"prompt":"This sentence misuses \"in a pickle\": \"The veggie was stored in a pickle for winter.\" Explain in your own words what the idiom really means.","answer":"Example: it reads \"in a pickle\" literally — it really means in a tricky situation.","id":5,"type":"idiom"},
        {"prompt":"Write your own sentence using the idiom \"pull your socks up\".","answer":"Example: Mr Lee told the team to pull their socks up before the final.","id":6,"type":"idiom"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(idiomSpec, g5, seedFrom([5, 'idiom', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Write your own sentence using the idiom \"under the weather\".","answer":"Example: Ari stayed home because he was feeling under the weather.","id":7,"type":"idiom"},
        {"prompt":"Which sentence uses \"once in a blue moon\" correctly? (The baker baked a cake called once in a blue moon. / The astronomer photographed once in a blue moon hanging in the sky. / Uncle Ray visits us once in a blue moon.)","answer":"Uncle Ray visits us once in a blue moon.","id":8,"type":"idiom"},
        {"prompt":"Which idiom means \"the final problem that breaks patience\"? (under the weather, the last straw, the ball is in your court)","answer":"the last straw","id":9,"type":"idiom"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(idiomSpec, getEnglishGradeConfig(7), seedFrom([7, 'idiom', 0]))).toEqual([]);
    });
});

describe('idiom — Year 6', () => {
    it('matches the exact page-1 head (grade 6 rolls its own stream)', () => {
        expect(sheet(g6).slice(0, 3)).toEqual([
        {"prompt":"Complete the idiom: __ an __ and __ leg","answer":"cost an arm and a leg","id":1,"type":"idiom"},
        {"prompt":"Which sentence uses \"head in the clouds\" correctly? (Pay attention — you have your head in the clouds again. / The pilot kept his head in the clouds during the flight. / The giraffe walked with its head in the clouds.)","answer":"Pay attention — you have your head in the clouds again.","id":2,"type":"idiom"},
        {"prompt":"What does the idiom \"piece of cake\" really mean? (a slice of dessert / very easy / a small part of a cake)","answer":"very easy","id":3,"type":"idiom"}
        ]);
    });
});

describe('idiom — determinism', () => {
    it('the same seed yields the identical document twice', () => {
        const a = generateDocument(idiomSpec, g5, seedFrom([5, 'idiom', 0]), 3);
        const b = generateDocument(idiomSpec, g5, seedFrom([5, 'idiom', 0]), 3);
        expect(a).toEqual(b);
    });

    it('a different refresh seed yields a different stream', () => {
        const a = sheet(g5);
        const b = generateSheet(idiomSpec, g5, seedFrom([5, 'idiom', 1]));
        expect(a.map((p) => p.prompt)).not.toEqual(b.map((p) => p.prompt));
    });
});

describe('idiom — correctness invariants (20-page sample, bank re-derivation)', () => {
    const rows = generateDocument(idiomSpec, g5, seedFrom([5, 'idiom', 0]), 20).pages.flat();

    it('every row has a non-empty prompt and answer', () => {
        for (const p of rows) {
            expect(p.prompt.length).toBeGreaterThan(0);
            expect(p.answer.length).toBeGreaterThan(0);
        }
    });

    it('meaning rows answer with the bank meaning and print it among the options', () => {
        const meaningRows = rows.filter((p) => p.prompt.startsWith('What does the idiom "'));
        expect(meaningRows.length).toBeGreaterThan(10);
        for (const p of meaningRows) {
            const idiom = (p.prompt.match(/idiom "([^"]+)"/) as RegExpMatchArray)[1];
            expect(p.answer).toBe(BY_IDIOM.get(idiom)?.[1]);
            expect(optionsOf(p.prompt)?.includes(p.answer)).toBe(true);
        }
    });

    it('usage rows answer with the bank correct-usage sentence (in the options)', () => {
        const useRows = rows.filter((p) => p.prompt.startsWith('Which sentence uses "'));
        expect(useRows.length).toBeGreaterThan(10);
        for (const p of useRows) {
            const idiom = (p.prompt.match(/uses "([^"]+)"/) as RegExpMatchArray)[1];
            expect(p.answer).toBe(BY_IDIOM.get(idiom)?.[4]);
            expect(optionsOf(p.prompt)?.includes(p.answer)).toBe(true);
        }
    });

    it('completion rows mask exactly the bank idiom (alternating words)', () => {
        const completeRows = rows.filter((p) => p.prompt.startsWith('Complete the idiom:'));
        expect(completeRows.length).toBeGreaterThan(5);
        for (const p of completeRows) {
            const shown = p.prompt.slice('Complete the idiom: '.length);
            const expected = (BY_IDIOM.get(p.answer)?.[0] as string)
                .split(' ')
                .map((w, i) => (i % 2 === 0 ? '__' : w))
                .join(' ');
            expect(shown).toBe(expected);
        }
    });

    it('idiom-for-meaning rows answer with the idiom whose bank meaning is printed', () => {
        const reverseRows = rows.filter((p) => p.prompt.startsWith('Which idiom means "'));
        expect(reverseRows.length).toBeGreaterThan(10);
        for (const p of reverseRows) {
            const meaning = (p.prompt.match(/means "([^"]+)"/) as RegExpMatchArray)[1];
            const entry = IDIOM_ITEMS.find((it) => it[1] === meaning);
            expect(p.answer).toBe(entry?.[0]);
            expect(optionsOf(p.prompt)?.includes(p.answer)).toBe(true);
        }
    });

    it('apply rows carry the bank usage sentence as a labeled Example', () => {
        const applyRows = rows.filter((p) => p.prompt.startsWith('Write your own sentence using the idiom "'));
        expect(applyRows.length).toBeGreaterThan(10);
        for (const p of applyRows) {
            const idiom = (p.prompt.match(/idiom "([^"]+)"/) as RegExpMatchArray)[1];
            expect(p.answer).toBe(`Example: ${BY_IDIOM.get(idiom)?.[4]}`);
        }
    });

    it('justify rows name the bank meaning in a labeled Example', () => {
        const justifyRows = rows.filter((p) => p.prompt.startsWith('This sentence misuses "'));
        expect(justifyRows.length).toBeGreaterThan(10);
        for (const p of justifyRows) {
            const idiom = (p.prompt.match(/misuses "([^"]+)"/) as RegExpMatchArray)[1];
            const entry = BY_IDIOM.get(idiom);
            expect(p.answer).toBe(`Example: it reads "${idiom}" literally — it really means ${entry?.[1]}.`);
            // The quoted misuse sentence is one of the bank's literal readings.
            const quoted = (p.prompt.match(/: "([^"]+)" Explain/) as RegExpMatchArray)[1];
            expect([entry?.[5], entry?.[6]]).toContain(quoted);
        }
    });
});

describe('idiom — context & task variety', () => {
    const rows = generateDocument(idiomSpec, g5, seedFrom([5, 'idiom', 0]), 20).pages.flat();

    it('usage questions use many DISTINCT sentence contexts (no fixed frame)', () => {
        // The old generator reused ONE frame for every idiom; the curated
        // bank now yields a wide spread of correct-usage sentences (the
        // answer IS the correct-usage sentence). Deterministic: 18 distinct
        // contexts across the 20-page sample (~20 usage rows).
        const useRows = rows.filter((p) => p.prompt.startsWith('Which sentence uses "'));
        const contexts = new Set(useRows.map((p) => p.answer));
        expect(contexts.size).toBe(18);
    });

    it('all six task families occur within the first two pages', () => {
        const first2 = rows.slice(0, 12);
        for (const fam of FAMILIES) {
            expect(first2.some((p) => p.prompt.startsWith(fam))).toBe(true);
        }
    });

    it('no single family dominates more than 40% of a 120-row run', () => {
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

describe('idiom — semantic diversity (option-order-independent)', () => {
    it('100 pages (600 rows) print with zero repeated prompts', () => {
        const probs = idiomSpec.generate(createRng(seedFrom([5, 'idiom', 0])), g5.caps, 600);
        expect(new Set(probs.map((p) => p.prompt)).size).toBe(600);
    });

    it('the semantic question pool (options sorted) is exactly 391 distinct questions at the 600-row ask', () => {
        const probs = idiomSpec.generate(createRng(seedFrom([5, 'idiom', 0])), g5.caps, 600);
        expect(new Set(probs.map(semanticKey)).size).toBe(391);
    });
});
