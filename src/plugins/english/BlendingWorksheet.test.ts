// Unit tests for the BLENDING worksheet plugin (T4A rewrite).
//
// Strategy: a small exact pin locks the deterministic stream; the worksheet's
// REAL guarantees are asserted as DERIVED invariants over whole documents:
//   - CORRECTNESS (E4): every row reconstitutes from its prompt alone; blank
//     rows without a picture cue match EXACTLY ONE KNOWN_WORD_SET word (no
//     "s u __" -> sun/sum traps); unscramble rows are anagram-unique (no
//     "n t e" -> net/ten traps).
//   - DIVERSITY (E3): 100 pages fully unique at every grade, even at the OLD
//     24-per-page ask of 2400 questions.
//   - DENSITY (E2): perPage 8 (was 24); early-band write rows carry letter
//     write-boxes, one per blank.
//   - CUES: word-writing rows cue the TARGET word inside the band only; MC
//     match rows never cue (the picture would print the answer).

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, hasVisual, isEarlyCueBand, type GradeConfig } from '../../framework';
import { blendSpec } from './BlendingWorksheet';
import { KNOWN_WORD_SET } from './words';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

function sheet(grade: GradeConfig) {
    return generateSheet(blendSpec, grade, seedFrom([grade.id, blendSpec.id, 0]));
}

// Independent re-implementations of the generator's well-posedness guards —
// the tests verify the CONTRACT (unique solution), not the generator's code.
function patternMatches(shown: string, blanks: number[], word: string): boolean {
    if (word.length !== shown.length) return false;
    for (let i = 0; i < shown.length; i++) {
        if (!blanks.includes(i) && word[i] !== shown[i]) return false;
    }
    return true;
}
function knownMatches(shown: string, blanks: number[]): string[] {
    return [...KNOWN_WORD_SET].filter((w) => patternMatches(shown, blanks, w));
}
function anagramSiblings(word: string): string[] {
    const key = [...word].sort().join('');
    return [...KNOWN_WORD_SET].filter((w) => [...w].sort().join('') === key);
}

// Semantic invariant: every prompt falls into exactly one of the seven kinds
// and its answer is the unique solution of what is printed.
function checkBlendTruths(grade: GradeConfig) {
    for (const p of sheet(grade)) {
        const shown = p.prompt.match(/^What word is: ([a-z ]+)\?$/);
        const blanks = p.prompt.match(/^Finish the word: ((?:__|[a-z])(?: (?:__|[a-z]))*)$/);
        const scrambled = p.prompt.match(/^Unscramble the letters: ([a-z ]+)$/);
        const backwards = p.prompt.match(/^What word is "([a-z]+)" spelled backwards\?$/);
        const segment = p.prompt.match(/^Write the sounds in "([a-z]+)": ((?:__)(?: (?:__))*)$/);
        const match = p.prompt.match(/^Which word matches: ([a-z ]+)\? \(([^)]+)\)$/);
        if (shown) {
            expect(shown[1].split(' ').join('')).toBe(p.answer);
        } else if (blanks) {
            const parts = blanks[1].split(' ');
            const blankIdx = parts.map((t, i) => (t === '__' ? i : -1)).filter((i) => i >= 0);
            expect(p.answer.length).toBe(parts.length);
            for (let i = 0; i < parts.length; i++) expect(parts[i] === '__' || p.answer[i] === parts[i]).toBe(true);
            // E4: an UNCUEd blank row must have exactly one known solution.
            if (p.visual === undefined) {
                expect(knownMatches(p.answer, blankIdx)).toEqual([p.answer]);
            }
        } else if (scrambled) {
            const sort = (s: string) => s.split('').sort().join('');
            expect(sort(scrambled[1].split(' ').join(''))).toBe(sort(p.answer));
            // E4: the letters must belong to only ONE known word.
            expect(anagramSiblings(p.answer)).toEqual([p.answer]);
        } else if (backwards) {
            expect(backwards[1].split('').reverse().join('')).toBe(p.answer);
        } else if (segment) {
            // The reverse skill: the answer is the printed word stretched into
            // its letters, one per printed blank ("pig" -> "p i g").
            expect(p.answer).toBe(segment[1].split('').join(' '));
            expect(p.answer.split(' ')).toHaveLength((p.prompt.match(/__/g) || []).length);
        } else if (match) {
            const options = match[2].split(', ');
            expect(options).toHaveLength(3);
            expect(options.filter((o) => o === p.answer)).toEqual([p.answer]);
            expect(match[1].split(' ').join('')).toBe(p.answer);
            // MC rows never carry a cue (the picture would be the answer).
            expect(p.visual).toBeUndefined();
        } else {
            throw new Error(`unrecognised blend prompt: ${p.prompt}`);
        }
    }
}

describe('blend plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and REDUCED page size (E2)', () => {
        expect(blendSpec.id).toBe('blend');
        expect(blendSpec.label).toBe('Blending');
        expect(blendSpec.icon).toBe('ab');
        expect(blendSpec.perPage).toBe(8);
    });

    it('describes its word-set scope from the grade caps', () => {
        expect(blendSpec.scope(g1)).toBe('letters, word set 2');
        expect(blendSpec.scope(g2)).toBe('letters, word set 3');
    });

    it('is gated by the grade catalogue (Year 1..6 offer it, Year 7 does not)', () => {
        expect(blendSpec.offered(g0)).toBe(false);
        expect(blendSpec.offered(g1)).toBe(true);
        expect(blendSpec.offered(g2)).toBe(true);
        expect(blendSpec.offered(getEnglishGradeConfig(3))).toBe(true);
        expect(blendSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(blendSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        expect(generateSheet(blendSpec, g0, seedFrom([0, 'blend', 0]))).toEqual([]);
    });
});

describe('blend — exact pinned rows (determinism lock)', () => {
    it('pins the first rows of the pinned-seed page 1 per grade', () => {
        expect(sheet(g1).slice(0, 2)).toEqual([
            { prompt: 'Unscramble the letters: e l g', answer: 'leg', id: 1, type: 'blend' },
            { prompt: 'Finish the word: l e m __ n', answer: 'lemon', visual: 'lemon', tileBlanks: 'letter', id: 2, type: 'blend' }
        ]);
        expect(sheet(g2).slice(0, 2)).toEqual([
            { prompt: 'What word is: l e m o n?', answer: 'lemon', visual: 'lemon', id: 1, type: 'blend' },
            { prompt: 'What word is "gip" spelled backwards?', answer: 'pig', visual: 'pig', id: 2, type: 'blend' }
        ]);
    });
});

describe('blend — semantic truth (every grade)', () => {
    for (const gradeId of [1, 2, 3, 4, 5, 6]) {
        it(`grade ${gradeId}: every row reconstitutes and guarded forms are unique`, () => {
            checkBlendTruths(getEnglishGradeConfig(gradeId));
        });
    }
});

describe('blend — cue + tile band contract', () => {
    it('Prep and Year 4+ rows carry NO cue/tile metadata (legacy markup)', () => {
        for (const gradeId of [4, 5, 6]) {
            for (const p of sheet(getEnglishGradeConfig(gradeId))) {
                expect(p.visual).toBeUndefined();
                expect(p.tileBlanks).toBeUndefined();
            }
        }
    });

    it('inside the band, cued rows picture the ANSWER word with a registered key', () => {
        for (const gradeId of [1, 2, 3]) {
            const grade = getEnglishGradeConfig(gradeId);
            expect(isEarlyCueBand(grade.caps)).toBe(true);
            for (const p of sheet(grade)) {
                if (p.visual !== undefined) {
                    expect(hasVisual(p.visual)).toBe(true);
                    // Word-writing rows cue the target word itself (the
                    // segment kind's answer is the spaced letters).
                    expect(p.visual).toBe(p.answer.replace(/ /g, ''));
                }
            }
        }
    });

    it('write rows in the band box every blank; non-write rows box nothing', () => {
        for (const gradeId of [1, 2, 3]) {
            for (const p of sheet(getEnglishGradeConfig(gradeId))) {
                const isWriteRow = /^(Finish the word|Write the sounds)/.test(p.prompt);
                if (isWriteRow) {
                    expect(p.tileBlanks).toBe('letter');
                    expect((p.prompt.match(/__/g) || []).length).toBeGreaterThanOrEqual(1);
                } else {
                    expect(p.tileBlanks).toBeUndefined();
                }
            }
        }
    });
});

describe('blend — density + kind mix (E2/E1)', () => {
    it('pages hold exactly perPage rows and mix at least 4 task kinds', () => {
        for (const gradeId of [1, 2, 3, 6]) {
            const rows = sheet(getEnglishGradeConfig(gradeId));
            expect(rows).toHaveLength(8);
            const kinds = new Set(
                rows.map((r) => (r.prompt.match(/^(What word is:|Finish the word|Unscramble|What word is "|Write the sounds|Which word matches)/) ?? ['?'])[1])
            );
            expect(kinds.size).toBeGreaterThanOrEqual(4);
        }
    });
});

describe('blend — non-repeating capacity (E3)', () => {
    it('the new 100-page ask (800 questions) is fully unique at every grade', () => {
        for (const gradeId of [1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const ask = blendSpec.perPage * 100;
            const problems = blendSpec.generate(createRng(seedFrom([grade.id, 'blend', 0])), grade.caps, ask);
            expect(problems).toHaveLength(ask);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ask);
        }
    });

    it('even the OLD 24-per-page ask (2400 questions) stays fully unique', () => {
        for (const gradeId of [1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const ask = 2400;
            const problems = blendSpec.generate(createRng(seedFrom([grade.id, 'blend', 0])), grade.caps, ask);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ask);
        }
    });
});

describe('blend — document assembly', () => {
    it('page 2 continues the exact stream (ids continuous)', () => {
        const d = generateDocument(blendSpec, g1, seedFrom([1, 'blend', 0]), 2);
        expect(d.pages[1][0].id).toBe(9);
        expect(d.total).toBe(16);
    });

    it('a double generation is byte-identical (determinism)', () => {
        expect(JSON.stringify(sheet(g2))).toBe(JSON.stringify(sheet(g2)));
    });
});
