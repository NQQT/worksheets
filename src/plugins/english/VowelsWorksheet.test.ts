// Unit tests for the VOWELS worksheet plugin (T4A rewrite).
//
// Strategy: exact pins lock the deterministic stream; the worksheet's REAL
// guarantees are DERIVED invariants over whole documents:
//   - CORRECTNESS (E4): every row's answer is the unique solution of the
//     printed question; multiple-choice rows always print THREE options
//     (the old tier-1 sheet degenerated to two because the starter bank has
//     one 2-vowel word); uncued write-the-vowel rows match exactly one
//     KNOWN_WORD_SET word.
//   - LOCAL BANK: every VOWEL_POOL_EXTRA word is already a KNOWN_WORD_SET
//     member — the extension curates the shared dictionary, it does not add
//     vocabulary (words.ts stays read-only and the non-word contract holds).
//   - DIVERSITY (E3): 100 pages fully unique at every grade, even at the OLD
//     24-per-page ask of 2400 questions.
//   - DENSITY (E2): perPage 8 (was 24); every page mixes >= 3 task kinds.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, hasVisual, type GradeConfig } from '../../framework';
import { vowelSpec } from './VowelsWorksheet';
import { KNOWN_WORD_SET } from './words';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

function sheet(grade: GradeConfig) {
    return generateSheet(vowelSpec, grade, seedFrom([grade.id, vowelSpec.id, 0]));
}

// Independent vowel model (mirrors the plugin — the test checks the
// CONTRACT, not the generator's code).
function vowelCount(word: string): number {
    let n = 0;
    for (const ch of word.toLowerCase()) if ('aeiou'.includes(ch)) n += 1;
    return n;
}
function knownMatches(shown: string, blanks: number[]): string[] {
    return [...KNOWN_WORD_SET].filter((w) => {
        if (w.length !== shown.length) return false;
        for (let i = 0; i < shown.length; i++) {
            if (!blanks.includes(i) && w[i] !== shown[i]) return false;
        }
        return true;
    });
}

function checkVowelTruths(grade: GradeConfig) {
    for (const p of sheet(grade)) {
        const count = p.prompt.match(/^How many vowels are in "([a-z]+)"\?$/);
        const letter = p.prompt.match(/^Which letter in "([a-z]+)" is the vowel\?$/);
        const mcCount = p.prompt.match(/^Which word has (\d) vowels?\? \(([^)]+)\)$/);
        const mcLetter = p.prompt.match(/^Which word has the vowel "([a-z])"\? \(([^)]+)\)$/);
        const writeVowel = p.prompt.match(/^Write the missing vowel: ((?:__|[a-z])(?: (?:__|[a-z]))*)$/);
        const isVowel = p.prompt.match(/^Which letter is a vowel\? \(([a-z, ]+)\)$/);
        const notVowel = p.prompt.match(/^Which letter is NOT a vowel\? \(([a-z, ]+)\)$/);
        const yesno = p.prompt.match(/^Does "([a-z]+)" start with a vowel\? \(yes \/ no\)$/);
        if (count) {
            expect(p.answer).toBe(String(vowelCount(count[1])));
        } else if (letter) {
            expect(vowelCount(letter[1])).toBe(1);
            expect(p.answer).toBe(letter[1].split('').find((c) => 'aeiou'.includes(c)));
        } else if (mcCount) {
            const n = Number(mcCount[1]);
            const options = mcCount[2].split(', ');
            // E3 fix: never a degenerate 2-option row.
            expect(options).toHaveLength(3);
            expect(options.filter((o) => vowelCount(o) === n)).toEqual([p.answer]);
        } else if (mcLetter) {
            const options = mcLetter[2].split(', ');
            expect(options).toHaveLength(3);
            expect(options.filter((o) => o.includes(mcLetter[1]))).toEqual([p.answer]);
        } else if (writeVowel) {
            const parts = writeVowel[1].split(' ');
            const blankIdx = parts.map((t, i) => (t === '__' ? i : -1)).filter((i) => i >= 0);
            expect(blankIdx).toHaveLength(1);
            // The answer is the vowel letter hidden at the single blank.
            expect('aeiou'.includes(p.answer)).toBe(true);
            const word = parts.map((t, i) => (t === '__' ? p.answer : t)).join('');
            expect(vowelCount(word)).toBeGreaterThanOrEqual(1);
            // E4: an UNCUEd pattern must have exactly one known solution.
            if (p.visual === undefined) {
                expect(knownMatches(word, blankIdx)).toEqual([word]);
            }
        } else if (isVowel) {
            const options = isVowel[1].split(', ');
            expect(options).toHaveLength(3);
            expect(options.filter((o) => 'aeiou'.includes(o))).toEqual([p.answer]);
        } else if (notVowel) {
            const options = notVowel[1].split(', ');
            expect(options).toHaveLength(3);
            expect(options.filter((o) => !'aeiou'.includes(o))).toEqual([p.answer]);
        } else if (yesno) {
            expect(p.answer).toBe('aeiou'.includes(yesno[1][0]) ? 'yes' : 'no');
        } else {
            throw new Error(`unrecognised vowel prompt: ${p.prompt}`);
        }
    }
}

describe('vowel plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and REDUCED page size (E2)', () => {
        expect(vowelSpec.id).toBe('vowel');
        expect(vowelSpec.label).toBe('Vowels');
        expect(vowelSpec.icon).toBe('e');
        expect(vowelSpec.perPage).toBe(8);
    });

    it('describes its word-set scope from the grade caps', () => {
        expect(vowelSpec.scope(g0)).toBe('vowels, word set 1');
        expect(vowelSpec.scope(g1)).toBe('vowels, word set 2');
        expect(vowelSpec.scope(g2)).toBe('vowels, word set 3');
    });

    it('is gated by the grade catalogue (Years 0..6 offer it, Year 7 does not)', () => {
        expect(vowelSpec.offered(g0)).toBe(true);
        expect(vowelSpec.offered(g1)).toBe(true);
        expect(vowelSpec.offered(g2)).toBe(true);
        expect(vowelSpec.offered(getEnglishGradeConfig(3))).toBe(true);
        expect(vowelSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(vowelSpec.offered(getEnglishGradeConfig(7))).toBe(false);
    });
});

describe('vowel — exact pinned rows (determinism lock)', () => {
    it('pins the first rows of the pinned-seed page 1 per grade', () => {
        expect(sheet(g0).slice(0, 2)).toEqual([
            { prompt: 'Which word has the vowel "e"? (top, team, moon)', answer: 'team', id: 1, type: 'vowel' },
            { prompt: 'How many vowels are in "hat"?', answer: '1', id: 2, type: 'vowel' }
        ]);
        expect(sheet(g1).slice(0, 2)).toEqual([
            { prompt: 'Which letter is a vowel? (a, s, w)', answer: 'a', id: 1, type: 'vowel' },
            { prompt: 'How many vowels are in "apple"?', answer: '2', visual: 'apple', id: 2, type: 'vowel' }
        ]);
        expect(sheet(g2).slice(0, 2)).toEqual([
            { prompt: 'Which letter is NOT a vowel? (a, u, m)', answer: 'm', id: 1, type: 'vowel' },
            { prompt: 'How many vowels are in "apple"?', answer: '2', visual: 'apple', id: 2, type: 'vowel' }
        ]);
    });
});

describe('vowel — semantic truth (every grade)', () => {
    for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
        it(`grade ${gradeId}: every row's answer is the unique solution`, () => {
            checkVowelTruths(getEnglishGradeConfig(gradeId));
        });
    }
});

describe('vowel — cue + tile band contract', () => {
    it('Prep and Year 4+ rows carry NO cue/tile metadata (legacy markup)', () => {
        for (const gradeId of [0, 4, 5, 6]) {
            for (const p of sheet(getEnglishGradeConfig(gradeId))) {
                expect(p.visual).toBeUndefined();
                expect(p.tileBlanks).toBeUndefined();
            }
        }
    });

    it('inside the band, cues are registered and never reveal the answer', () => {
        for (const gradeId of [1, 2, 3]) {
            for (const p of sheet(getEnglishGradeConfig(gradeId))) {
                if (p.visual !== undefined) {
                    expect(hasVisual(p.visual)).toBe(true);
                    // The cue pictures the WORD, the answer is a number or a
                    // single letter — never equal to the cue key.
                    expect(p.visual).not.toBe(p.answer);
                }
                if (/^Write the missing vowel/.test(p.prompt)) {
                    expect(p.tileBlanks).toBe('letter');
                } else {
                    expect(p.tileBlanks).toBeUndefined();
                }
            }
        }
    });
});

describe('vowel — density + kind mix (E2/E1)', () => {
    it('pages hold exactly perPage rows and mix at least 3 task kinds', () => {
        for (const gradeId of [0, 1, 2, 6]) {
            const rows = sheet(getEnglishGradeConfig(gradeId));
            expect(rows).toHaveLength(8);
            const kinds = new Set(
                rows.map((r) => (r.prompt.match(/^(How many vowels|Which letter in|Which word has \d|Which word has the vowel|Write the missing vowel|Which letter is a vowel|Which letter is NOT a vowel|Does ")/) ?? ['?'])[1])
            );
            expect(kinds.size).toBeGreaterThanOrEqual(3);
        }
    });
});

describe('vowel — non-repeating capacity (E3)', () => {
    it('the new 100-page ask (800 questions) is fully unique at every grade', () => {
        for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const ask = vowelSpec.perPage * 100;
            const problems = vowelSpec.generate(createRng(seedFrom([grade.id, 'vowel', 0])), grade.caps, ask);
            expect(problems).toHaveLength(ask);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ask);
        }
    });

    it('even the OLD 24-per-page ask (2400 questions) stays fully unique', () => {
        for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const ask = 2400;
            const problems = vowelSpec.generate(createRng(seedFrom([grade.id, 'vowel', 0])), grade.caps, ask);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ask);
        }
    });
});

describe('vowel — document assembly', () => {
    it('page 2 continues the exact stream (ids continuous)', () => {
        const d = generateDocument(vowelSpec, g1, seedFrom([1, 'vowel', 0]), 2);
        expect(d.pages[1][0].id).toBe(9);
        expect(d.total).toBe(16);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(vowelSpec, getEnglishGradeConfig(7), seedFrom([7, 'vowel', 0]))).toEqual([]);
    });

    it('a double generation is byte-identical (determinism)', () => {
        expect(JSON.stringify(sheet(g2))).toBe(JSON.stringify(sheet(g2)));
    });
});
