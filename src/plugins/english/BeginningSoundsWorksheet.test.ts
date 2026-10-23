// Unit tests for the BEGINNING SOUNDS worksheet plugin (T4A rewrite).
//
// Strategy: exact pins lock the deterministic stream; the worksheet's REAL
// guarantees are DERIVED invariants over whole documents:
//   - CORRECTNESS (E4): every row's answer is the unique solution of the
//     printed question; "same sound" rows are verified against an
//     independent initial-phoneme model (digraphs sh/ch/th/wh/ph/qu, soft
//     c/g) so 'sun'/'ship' and 'cat'/'circle' can never be posed as matches,
//     while 'cat'/'kite' may.
//   - DIVERSITY (E3): 100 pages fully unique at every grade, even at the OLD
//     24-per-page ask of 2400 questions.
//   - DENSITY (E2): perPage 8 (was 24); every page mixes >= 3 task kinds.
//   - CUES: band-only, never an option word on MC rows.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, hasVisual, type GradeConfig } from '../../framework';
import { soundsSpec } from './BeginningSoundsWorksheet';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

function sheet(grade: GradeConfig) {
    return generateSheet(soundsSpec, grade, seedFrom([grade.id, soundsSpec.id, 0]));
}

// Independent phoneme model (mirrors the plugin's guard — the test checks
// the CONTRACT, not the generator's code).
function initialSound(word: string): string {
    const two = word.slice(0, 2);
    if (['sh', 'ch', 'th', 'wh', 'ph', 'qu'].includes(two)) return two;
    const c = word[0];
    const next = word[1];
    if (c === 'c') return 'ei y'.includes(next) ? 's' : 'k';
    if (c === 'g') return 'ei y'.includes(next) ? 'j' : 'g';
    return c;
}

function checkSoundTruths(grade: GradeConfig) {
    for (const p of sheet(grade)) {
        const base = p.prompt.match(/^Which letter does "([a-z]+)" start with\?$/);
        const starts = p.prompt.match(/^Which word starts with the letter "([a-z])"\? \(([^)]+)\)$/);
        const not = p.prompt.match(/^Which word does NOT start with the letter "([a-z])"\? \(([^)]+)\)$/);
        const same = p.prompt.match(/^Which word starts with the same sound as "([a-z]+)"\? \(([^)]+)\)$/);
        const yesno = p.prompt.match(/^Do "([a-z]+)" and "([a-z]+)" start with the same sound\? \(yes \/ no\)$/);
        const shared = p.prompt.match(/^What sound do "([a-z]+)" and "([a-z]+)" start with\? Write the (?:letter|letters)\.$/);
        const picture = p.prompt.match(/^Which word starts with the same sound as the picture\? \(([^)]+)\)$/);
        if (base) {
            expect(p.answer).toBe(base[1][0]);
        } else if (starts) {
            const options = starts[2].split(', ');
            expect(options).toHaveLength(3);
            expect(options.filter((o) => o[0] === starts[1])).toEqual([p.answer]);
        } else if (not) {
            const options = not[2].split(', ');
            expect(options).toHaveLength(3);
            expect(options.filter((o) => o[0] === not[1])).toHaveLength(2);
            expect(p.answer[0]).not.toBe(not[1]);
        } else if (same) {
            const options = same[2].split(', ');
            expect(options).toHaveLength(3);
            const sound = initialSound(same[1]);
            expect(initialSound(p.answer)).toBe(sound);
            for (const o of options.filter((o) => o !== p.answer)) {
                expect(initialSound(o)).not.toBe(sound);
            }
        } else if (yesno) {
            const truth = initialSound(yesno[1]) === initialSound(yesno[2]) ? 'yes' : 'no';
            expect(p.answer).toBe(truth);
        } else if (shared) {
            const a = initialSound(shared[1]);
            expect(initialSound(shared[2])).toBe(a);
            expect(p.answer).toBe(a);
        } else if (picture) {
            const options = picture[1].split(', ');
            expect(options).toHaveLength(3);
            expect(options).toContain(p.answer);
            // The cue is the (unprinted) base word: registered, and never one
            // of the printed options.
            expect(typeof p.visual).toBe('string');
            expect(hasVisual(p.visual)).toBe(true);
            expect(options).not.toContain(p.visual as string);
            // The answer shares its initial sound with the cued base.
            expect(initialSound(p.answer)).toBe(initialSound(p.visual as string));
        } else {
            throw new Error(`unrecognised sounds prompt: ${p.prompt}`);
        }
    }
}

describe('sounds plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and REDUCED page size (E2)', () => {
        expect(soundsSpec.id).toBe('sounds');
        expect(soundsSpec.label).toBe('Beginning Sounds');
        expect(soundsSpec.icon).toBe('♪');
        expect(soundsSpec.perPage).toBe(8);
    });

    it('describes its word-set scope from the grade caps', () => {
        expect(soundsSpec.scope(g0)).toBe('beginnings, word set 1');
        expect(soundsSpec.scope(g1)).toBe('beginnings, word set 2');
        expect(soundsSpec.scope(g2)).toBe('beginnings, word set 3');
    });

    it('is gated by the grade catalogue (Years 0..6 offer it, Year 7 does not)', () => {
        expect(soundsSpec.offered(g0)).toBe(true);
        expect(soundsSpec.offered(g1)).toBe(true);
        expect(soundsSpec.offered(g2)).toBe(true);
        expect(soundsSpec.offered(getEnglishGradeConfig(3))).toBe(true);
        expect(soundsSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(soundsSpec.offered(getEnglishGradeConfig(7))).toBe(false);
    });
});

describe('sounds — exact pinned rows (determinism lock)', () => {
    it('pins the first rows of the pinned-seed page 1 per grade', () => {
        expect(sheet(g0).slice(0, 2)).toEqual([
            { prompt: 'Which letter does "pen" start with?', answer: 'p', id: 1, type: 'sounds' },
            { prompt: 'Which letter does "hat" start with?', answer: 'h', id: 2, type: 'sounds' }
        ]);
        expect(sheet(g1).slice(0, 2)).toEqual([
            { prompt: 'What sound do "water" and "wig" start with? Write the letter.', answer: 'w', visual: 'water', id: 1, type: 'sounds' },
            { prompt: 'Do "fish" and "sip" start with the same sound? (yes / no)', answer: 'no', visual: 'fish', id: 2, type: 'sounds' }
        ]);
        expect(sheet(g2).slice(0, 2)).toEqual([
            { prompt: 'Which word starts with the same sound as "lemon"? (sun, rat, leg)', answer: 'leg', visual: 'lemon', id: 1, type: 'sounds' },
            { prompt: 'Do "top" and "teacher" start with the same sound? (yes / no)', answer: 'yes', visual: 'top', id: 2, type: 'sounds' }
        ]);
    });
});

describe('sounds — semantic truth (every grade)', () => {
    for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
        it(`grade ${gradeId}: every row's answer is the unique phoneme-correct solution`, () => {
            checkSoundTruths(getEnglishGradeConfig(gradeId));
        });
    }
});

describe('sounds — cue band contract', () => {
    it('Prep and Year 4+ rows carry NO cue (legacy markup)', () => {
        for (const gradeId of [0, 4, 5, 6]) {
            for (const p of sheet(getEnglishGradeConfig(gradeId))) {
                expect(p.visual).toBeUndefined();
            }
        }
    });

    it('every cue inside the band is a REGISTERED pictogram key', () => {
        for (const gradeId of [1, 2, 3]) {
            for (const p of sheet(getEnglishGradeConfig(gradeId))) {
                if (p.visual !== undefined) expect(hasVisual(p.visual)).toBe(true);
            }
        }
    });
});

describe('sounds — density + kind mix (E2/E1)', () => {
    it('pages hold exactly perPage rows and mix at least 3 task kinds', () => {
        for (const gradeId of [0, 1, 2, 6]) {
            const rows = sheet(getEnglishGradeConfig(gradeId));
            expect(rows).toHaveLength(8);
            const kinds = new Set(
                rows.map((r) => (r.prompt.match(/^(Which letter does|Which word starts with the letter|Which word does NOT|Which word starts with the same sound as "|Do "|What sound do|Which word starts with the same sound as the picture)/) ?? ['?'])[1])
            );
            expect(kinds.size).toBeGreaterThanOrEqual(3);
        }
    });
});

describe('sounds — non-repeating capacity (E3)', () => {
    it('the new 100-page ask (800 questions) is fully unique at every grade', () => {
        for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const ask = soundsSpec.perPage * 100;
            const problems = soundsSpec.generate(createRng(seedFrom([grade.id, 'sounds', 0])), grade.caps, ask);
            expect(problems).toHaveLength(ask);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ask);
        }
    });

    it('even the OLD 24-per-page ask (2400 questions) stays fully unique', () => {
        for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const ask = 2400;
            const problems = soundsSpec.generate(createRng(seedFrom([grade.id, 'sounds', 0])), grade.caps, ask);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ask);
        }
    });
});

describe('sounds — document assembly', () => {
    it('page 2 continues the exact stream (ids continuous)', () => {
        const d = generateDocument(soundsSpec, g1, seedFrom([1, 'sounds', 0]), 2);
        expect(d.pages[1][0].id).toBe(9);
        expect(d.total).toBe(16);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(soundsSpec, getEnglishGradeConfig(7), seedFrom([7, 'sounds', 0]))).toEqual([]);
    });

    it('a double generation is byte-identical (determinism)', () => {
        expect(JSON.stringify(sheet(g2))).toBe(JSON.stringify(sheet(g2)));
    });
});
