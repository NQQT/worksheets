// Unit tests for the SIGHT & REAL WORDS worksheet plugin (T4A rewrite).
//
// Strategy: the generator is DETERMINISTIC, so a small exact pin locks the
// stream, while the REAL guarantees of this worksheet are asserted as
// DERIVED invariants over whole multi-page documents:
//   - CORRECTNESS (E4): every "real word" row prints exactly one
//     KNOWN_WORD_SET member (the answer); every "NOT real" row prints
//     exactly one non-word (the answer); "exactly X" rows contain X once;
//     gap-fill rows are curated (frame, answer) pairs from CLOZE_FRAMES.
//   - DIVERSITY (E3): 100 pages of questions contain ZERO repeated prompts,
//     at every offered grade, even at the OLD (pre-T4A) 18-per-page ask of
//     1800 questions — the question space never shrank.
//   - DENSITY (E2): perPage is 6 (was 18).
//   - KIND MIX (E1): every page carries at least 3 of the 4 task kinds.
//   - CUE-FREE: sight rows never carry picture cues (the answers ARE words).

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, type GradeConfig } from '../../framework';
import { sightSpec, CLOZE_FRAMES } from './SightWordsWorksheet';
import { KNOWN_WORD_SET } from './words';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(sightSpec, grade, seedFrom([grade.id, sightSpec.id, 0]));
}

// The four task kinds a printed line can be (mirrors the generator).
function kindOf(prompt: string): 'real' | 'notreal' | 'exact' | 'cloze' | null {
    if (/^Which is a real word\? \(/.test(prompt)) return 'real';
    if (/^Which is NOT a real word\? \(/.test(prompt)) return 'notreal';
    if (/^Which one is exactly the word "/.test(prompt)) return 'exact';
    if (/^Fill the gap: /.test(prompt)) return 'cloze';
    return null;
}
const optionsOf = (prompt: string) => (prompt.match(/\(([^)]+)\)\s*$/)?.[1] ?? '').split(', ');

describe('sight plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and REDUCED page size (E2)', () => {
        expect(sightSpec.id).toBe('sight');
        expect(sightSpec.label).toBe('Sight & Real Words');
        expect(sightSpec.icon).toBe('A');
        // T4A density: 18 -> 6 four-option rows per A4 page.
        expect(sightSpec.perPage).toBe(6);
    });

    it('describes its word-set scope from the grade caps', () => {
        expect(sightSpec.scope(g0)).toBe('word set 1');
        expect(sightSpec.scope(g1)).toBe('word set 2');
        expect(sightSpec.scope(g2)).toBe('word set 3');
    });

    it('is gated by the grade catalogue (Prep..Year 6 offer it, Year 7 does not)', () => {
        expect(sightSpec.offered(g0)).toBe(true);
        expect(sightSpec.offered(g1)).toBe(true);
        expect(sightSpec.offered(g2)).toBe(true);
        expect(sightSpec.offered(getEnglishGradeConfig(3))).toBe(true);
        expect(sightSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(sightSpec.offered(getEnglishGradeConfig(7))).toBe(false);
    });
});

// Exact stream pin (locks determinism; the derived checks below carry the
// semantic guarantees).
describe('sight — exact pinned rows (determinism lock)', () => {
    it('pins the first rows of the pinned-seed page 1 per grade', () => {
        expect(sheet(g0).slice(0, 2)).toEqual([
            { prompt: 'Which is NOT a real word? (pig, top, wam, box)', answer: 'wam', id: 1, type: 'sight' },
            { prompt: 'Which one is exactly the word "pen"? (pep, pen, pea, hen)', answer: 'pen', id: 2, type: 'sight' }
        ]);
        expect(sheet(g1).slice(0, 2)).toEqual([
            { prompt: 'Fill the gap: You sleep in a __. (hat, bed, cup)', answer: 'bed', id: 1, type: 'sight' },
            { prompt: 'Which one is exactly the word "table"? (toble, tjble, teble, table)', answer: 'table', id: 2, type: 'sight' }
        ]);
        expect(sheet(g2).slice(0, 2)).toEqual([
            { prompt: 'Which is NOT a real word? (green, butterfly, bird, eouse)', answer: 'eouse', id: 1, type: 'sight' },
            { prompt: 'Which is a real word? (family, chhicken, dag, rebbit)', answer: 'family', id: 2, type: 'sight' }
        ]);
    });
});

// Semantic invariant (E4): every line is answerable and its answer is the
// UNIQUE word satisfying the printed predicate.
function checkSightTruths(grade: GradeConfig) {
    for (const p of sheet(grade)) {
        const kind = kindOf(p.prompt);
        expect(kind, `unrecognised sight prompt: ${p.prompt}`).not.toBeNull();
        const options = optionsOf(p.prompt);
        if (kind === 'real') {
            // Exactly one option is a known real word — and it is the answer.
            expect(options).toHaveLength(4);
            expect(options.filter((o) => KNOWN_WORD_SET.has(o))).toEqual([p.answer]);
        } else if (kind === 'notreal') {
            // Exactly one option is a NON-word — and it is the answer.
            expect(options).toHaveLength(4);
            expect(options.filter((o) => !KNOWN_WORD_SET.has(o))).toEqual([p.answer]);
        } else if (kind === 'exact') {
            const target = p.prompt.match(/exactly the word "([a-z]+)"/)![1];
            expect(options).toHaveLength(4);
            expect(p.answer).toBe(target);
            expect(options.filter((o) => o === target)).toEqual([target]);
        } else if (kind === 'cloze') {
            // Gap-fill rows come from the curated frame bank with its answer.
            const text = p.prompt.match(/^Fill the gap: (.+) \(/)![1];
            const frame = CLOZE_FRAMES.find((f) => f.text === text);
            expect(frame, `uncurated cloze frame: ${text}`).toBeDefined();
            expect(frame!.answer).toBe(p.answer);
            // Every cloze option is a REAL known word (meaning task, not form).
            for (const o of options) expect(KNOWN_WORD_SET.has(o)).toBe(true);
        }
    }
}

describe('sight — semantic truth (every grade)', () => {
    for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
        it(`grade ${gradeId}: one-real-word / one-fake / exact / curated-frame contracts hold`, () => {
            checkSightTruths(getEnglishGradeConfig(gradeId));
        });
    }
});

describe('sight — cue-free contract', () => {
    it('no row carries a picture cue at any grade (the answers ARE words)', () => {
        for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
            for (const p of sheet(getEnglishGradeConfig(gradeId))) {
                expect(p.visual).toBeUndefined();
            }
        }
    });
});

describe('sight — density + kind mix (E2/E1)', () => {
    it('pages hold exactly perPage rows and mix at least 3 of the 4 kinds', () => {
        for (const gradeId of [0, 1, 2, 3, 6]) {
            const rows = sheet(getEnglishGradeConfig(gradeId));
            expect(rows).toHaveLength(6);
            const kinds = new Set(rows.map((r) => kindOf(r.prompt)));
            expect(kinds.size).toBeGreaterThanOrEqual(3);
        }
    });
});

describe('sight — non-repeating capacity (E3)', () => {
    it('the new 100-page ask (600 questions) is fully unique at every grade', () => {
        for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const ask = sightSpec.perPage * 100;
            const problems = sightSpec.generate(createRng(seedFrom([grade.id, 'sight', 0])), grade.caps, ask);
            expect(problems).toHaveLength(ask);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ask);
        }
    });

    it('even the OLD 18-per-page ask (1800 questions) stays fully unique', () => {
        for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const ask = 1800;
            const problems = sightSpec.generate(createRng(seedFrom([grade.id, 'sight', 0])), grade.caps, ask);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ask);
        }
    });
});

describe('sight — document assembly', () => {
    it('3-page documents number ids continuously', () => {
        const d = generateDocument(sightSpec, g1, seedFrom([1, 'sight', 0]), 3);
        expect(d.pages).toHaveLength(3);
        expect(d.total).toBe(18);
        expect(d.pages.flat().map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(sightSpec, getEnglishGradeConfig(7), seedFrom([7, 'sight', 0]))).toEqual([]);
    });

    it('a double generation is byte-identical (determinism)', () => {
        expect(JSON.stringify(sheet(g2))).toBe(JSON.stringify(sheet(g2)));
    });
});
