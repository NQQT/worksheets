// Unit tests for the ALPHABET ORDER worksheet plugin (T4A rewrite).
//
// Strategy: exact pins lock the deterministic stream; the worksheet's REAL
// guarantees are DERIVED invariants over whole documents:
//   - CORRECTNESS (E4): every row's answer is recomputed independently from
//     the printed prompt using the a–z ordinal model — neighbour runs, skip
//     runs, positions from either end, UPPERCASE variants, between, yes/no
//     order judgements (letters AND words), and the full sorted-list answer
//     of the BUILD kind.
//   - DIVERSITY (E3): 100 pages fully unique at every grade, even at the OLD
//     24-per-page ask of 2400 questions.
//   - DENSITY (E2): perPage 8 (was 24); every page mixes >= 3 task kinds.
//   - TILES: sequence rows get the letter write-box scaffold ONLY inside the
//     early cue band (Years 1–3); Prep and Years 4+ keep legacy underlines.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, type GradeConfig } from '../../framework';
import { lettersSpec } from './AlphabetOrderWorksheet';
import { KNOWN_WORD_SET } from './words';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

function sheet(grade: GradeConfig) {
    return generateSheet(lettersSpec, grade, seedFrom([grade.id, lettersSpec.id, 0]));
}

// Independent a–z model (mirrors the plugin — the test checks the CONTRACT).
const A = 97;
const letter = (x: number) => String.fromCharCode(A + x);
const pos = (c: string) => c.charCodeAt(0) - A; // 'a' -> 0

// Parse a "x, y, __"-style sequence prompt into its shown letters.
function shownLetters(prompt: string): string[] {
    return prompt.split(',').map((t) => t.trim()).filter((t) => t !== '__');
}

function checkLetterTruths(grade: GradeConfig) {
    for (const p of sheet(grade)) {
        const after = p.prompt.match(/^Which letter comes after "([a-z])"\?$/);
        const before = p.prompt.match(/^Which letter comes before "([a-z])"\?$/);
        const upAfter = p.prompt.match(/^Which UPPERCASE letter comes after "([A-Z])"\?$/);
        const upBefore = p.prompt.match(/^Which UPPERCASE letter comes before "([A-Z])"\?$/);
        const between = p.prompt.match(/^Which letter comes between "([a-z])" and "([a-z])"\?$/);
        const nth = p.prompt.match(/^Which is the (\d+)(?:st|nd|rd|th) letter of the alphabet\?$/);
        const nthEnd = p.prompt.match(/^Which is the (\d+)(?:st|nd|rd|th) letter from the end of the alphabet\?$/);
        const nthUp = p.prompt.match(/^Which is the (\d+)(?:st|nd|rd|th) UPPERCASE letter of the alphabet\?$/);
        const seq = /^([a-z]), ([a-z])(?:, ([a-z]))?, __$/;
        const midGap = p.prompt.match(/^([a-z]), __, ([a-z])$/);
        const wordFirst = p.prompt.match(/^Which word comes (first|last) in the alphabet\? \(([a-z, ]+)\)$/);
        const wordYesNo = p.prompt.match(/^Do the words "([a-z]+)" and "([a-z]+)" come in alphabetical order\? \(yes \/ no\)$/);
        const letterYesNo = p.prompt.match(/^Do the letters "([a-z])" and "([a-z])" come in alphabetical order\? \(yes \/ no\)$/);
        const build = p.prompt.match(/^Write in alphabetical order: \(([a-z, ]+)\)$/);
        const m = p.prompt.match(seq);
        if (midGap) {
            // Middle gap of a three-letter run: "a, __, c" -> b.
            expect(pos(midGap[2]) - pos(midGap[1])).toBe(2);
            expect(p.answer).toBe(letter(pos(midGap[1]) + 1));
        } else if (after) {
            expect(p.answer).toBe(letter(pos(after[1]) + 1));
        } else if (before) {
            expect(p.answer).toBe(letter(pos(before[1]) - 1));
        } else if (upAfter) {
            expect(p.answer).toBe(letter(pos(upAfter[1].toLowerCase()) + 1).toUpperCase());
        } else if (upBefore) {
            expect(p.answer).toBe(letter(pos(upBefore[1].toLowerCase()) - 1).toUpperCase());
        } else if (between) {
            // The two shown letters must be exactly two apart, answer between.
            expect(pos(between[2]) - pos(between[1])).toBe(2);
            expect(p.answer).toBe(letter(pos(between[1]) + 1));
        } else if (nth) {
            expect(p.answer).toBe(letter(Number(nth[1]) - 1));
        } else if (nthEnd) {
            expect(p.answer).toBe(letter(26 - Number(nthEnd[1])));
        } else if (nthUp) {
            expect(p.answer).toBe(letter(Number(nthUp[1]) - 1).toUpperCase());
        } else if (m) {
            // Sequence run: recover the constant step from the shown letters.
            const shown = shownLetters(p.prompt).map(pos);
            const step = shown.length === 3 ? shown[1] - shown[0] : 0;
            if (shown.length === 3) {
                expect(shown[2] - shown[1]).toBe(step);
                expect(p.answer).toBe(letter(shown[2] + step));
            } else {
                // Two shown letters: consecutive (step ±1) or skip-one (±2).
                const d = shown[1] - shown[0];
                expect([1, -1, 2, -2]).toContain(d);
                expect(p.answer).toBe(letter(shown[1] + d));
            }
            // The answer must stay inside a..z.
            expect(p.answer).toMatch(/^[a-z]$/);
        } else if (wordFirst) {
            const options = wordFirst[2].split(', ');
            expect(options).toHaveLength(3);
            expect(new Set(options).size).toBe(3);
            const sorted = [...options].sort();
            expect(p.answer).toBe(wordFirst[1] === 'first' ? sorted[0] : sorted[2]);
            for (const w of options) expect(KNOWN_WORD_SET.has(w)).toBe(true);
        } else if (wordYesNo) {
            expect(p.answer).toBe(wordYesNo[1] < wordYesNo[2] ? 'yes' : 'no');
            expect(KNOWN_WORD_SET.has(wordYesNo[1])).toBe(true);
            expect(KNOWN_WORD_SET.has(wordYesNo[2])).toBe(true);
        } else if (letterYesNo) {
            expect(letterYesNo[1]).not.toBe(letterYesNo[2]);
            expect(p.answer).toBe(letterYesNo[1] < letterYesNo[2] ? 'yes' : 'no');
        } else if (build) {
            const options = build[1].split(', ');
            expect(options).toHaveLength(3);
            expect(new Set(options).size).toBe(3);
            // The model answer is the FULL sorted list (multi-value form).
            expect(p.answer).toBe([...options].sort().join(', '));
            for (const w of options) expect(KNOWN_WORD_SET.has(w)).toBe(true);
        } else {
            throw new Error(`unrecognised letters prompt: ${p.prompt}`);
        }
    }
}

describe('letters plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and REDUCED page size (E2)', () => {
        expect(lettersSpec.id).toBe('letters');
        expect(lettersSpec.label).toBe('Alphabet Order');
        expect(lettersSpec.icon).toBe('Az');
        expect(lettersSpec.perPage).toBe(8);
    });

    it('describes its a–z scope at every grade', () => {
        expect(lettersSpec.scope(g0)).toBe('a–z order');
        expect(lettersSpec.scope(g2)).toBe('a–z order');
    });

    it('is gated by the grade catalogue (Years 0..6 offer it, Year 7 does not)', () => {
        expect(lettersSpec.offered(g0)).toBe(true);
        expect(lettersSpec.offered(g1)).toBe(true);
        expect(lettersSpec.offered(g2)).toBe(true);
        expect(lettersSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(lettersSpec.offered(getEnglishGradeConfig(7))).toBe(false);
    });
});

describe('letters — exact pinned rows (determinism lock)', () => {
    it('pins the first rows of the pinned-seed page 1 per grade', () => {
        expect(sheet(g0).slice(0, 2)).toEqual([
            { prompt: 'Which is the 5th UPPERCASE letter of the alphabet?', answer: 'E', id: 1, type: 'letters' },
            { prompt: 'Which UPPERCASE letter comes before "E"?', answer: 'D', id: 2, type: 'letters' }
        ]);
        expect(sheet(g1).slice(0, 2)).toEqual([
            { prompt: 'Which is the 23rd letter from the end of the alphabet?', answer: 'd', id: 1, type: 'letters' },
            { prompt: 'n, __, p', answer: 'o', tileBlanks: 'letter', id: 2, type: 'letters' }
        ]);
        expect(sheet(g2).slice(0, 2)).toEqual([
            { prompt: 'Write in alphabetical order: (light, cat, shirt)', answer: 'cat, light, shirt', id: 1, type: 'letters' },
            { prompt: 'Which UPPERCASE letter comes before "C"?', answer: 'B', id: 2, type: 'letters' }
        ]);
    });
});

describe('letters — semantic truth (every grade)', () => {
    for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
        it(`grade ${gradeId}: every row's answer follows from the a–z model`, () => {
            checkLetterTruths(getEnglishGradeConfig(gradeId));
        });
    }

    it('both yes/no polarities appear (the child cannot learn to always say yes)', () => {
        const rows = sheet(g1);
        const yesNo = rows.filter((r) => /\(yes \/ no\)$/.test(r.prompt));
        if (yesNo.length >= 2) {
            expect(new Set(yesNo.map((r) => r.answer))).toEqual(new Set(['yes', 'no']));
        }
    });
});

describe('letters — tile scaffold band contract', () => {
    it('Prep and Year 4+ rows carry NO tile metadata (legacy underlines)', () => {
        for (const gradeId of [0, 4, 5, 6]) {
            for (const p of sheet(getEnglishGradeConfig(gradeId))) {
                expect(p.tileBlanks).toBeUndefined();
                expect(p.visual).toBeUndefined();
            }
        }
    });

    it('inside the band, ONLY sequence rows get the letter write-box', () => {
        for (const gradeId of [1, 2, 3]) {
            for (const p of sheet(getEnglishGradeConfig(gradeId))) {
                if (p.tileBlanks !== undefined) {
                    expect(p.tileBlanks).toBe('letter');
                    // Sequence rows print the slot as `__` (trailing or middle).
                    expect(p.prompt).toMatch(/__/);
                } else if (/__/.test(p.prompt)) {
                    // A sequence row inside the band must be boxed.
                    throw new Error(`unboxed sequence row: ${p.prompt}`);
                }
            }
        }
    });
});

describe('letters — density + kind mix (E2/E1)', () => {
    it('pages hold exactly perPage rows and mix at least 3 task kinds', () => {
        for (const gradeId of [0, 1, 2, 6]) {
            const rows = sheet(getEnglishGradeConfig(gradeId));
            expect(rows).toHaveLength(8);
            const kinds = new Set(
                rows.map((r) => (r.prompt.match(/^(Which letter comes (?:after|before|between)|Which UPPERCASE|Which is the|Which word comes|Do the (?:letters|words)|Write in alphabetical|^[a-z], )/) ?? ['?'])[1])
            );
            expect(kinds.size).toBeGreaterThanOrEqual(3);
        }
    });
});

describe('letters — non-repeating capacity (E3)', () => {
    it('the new 100-page ask (800 questions) is fully unique at every grade', () => {
        for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const ask = lettersSpec.perPage * 100;
            const problems = lettersSpec.generate(createRng(seedFrom([grade.id, 'letters', 0])), grade.caps, ask);
            expect(problems).toHaveLength(ask);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ask);
        }
    });

    it('even the OLD 24-per-page ask (2400 questions) stays fully unique', () => {
        for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const ask = 2400;
            const problems = lettersSpec.generate(createRng(seedFrom([grade.id, 'letters', 0])), grade.caps, ask);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ask);
        }
    });
});

describe('letters — document assembly', () => {
    it('page 2 continues the exact stream (ids continuous)', () => {
        const d = generateDocument(lettersSpec, g1, seedFrom([1, 'letters', 0]), 2);
        expect(d.pages[1][0].id).toBe(9);
        expect(d.total).toBe(16);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(lettersSpec, getEnglishGradeConfig(7), seedFrom([7, 'letters', 0]))).toEqual([]);
    });

    it('a double generation is byte-identical (determinism)', () => {
        expect(JSON.stringify(sheet(g2))).toBe(JSON.stringify(sheet(g2)));
    });
});
