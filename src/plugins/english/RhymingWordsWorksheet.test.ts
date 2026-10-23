// Unit tests for the RHYMING WORDS worksheet plugin (T4A rewrite).
//
// Strategy: exact pins lock the deterministic stream; the worksheet's REAL
// guarantees are DERIVED invariants over whole documents, verified against
// the plugin's exported authoritative family data (RHIME_BANK / rhymes()):
//   - CORRECTNESS (E4): the answer of every MC row is the ONLY option that
//     rhymes with the base; "does NOT rhyme" rows have exactly one option
//     that fails to rhyme with the other two; yes/no judgements match the
//     family truth; gap-fill rows are curated (frame, answer) pairs whose
//     answer rhymes with a word in the frame and whose wrong options rhyme
//     with NOTHING in the frame; every printed word is a KNOWN_WORD_SET
//     member.
//   - DIVERSITY (E3): 100 pages fully unique at every grade, even at the OLD
//     18-per-page ask of 1800 questions — with ~60 families (was 15) the
//     semantic space grew several-fold.
//   - DENSITY (E2): perPage 8 (was 18); every page mixes >= 3 task kinds.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, hasVisual, type GradeConfig } from '../../framework';
import { rhymeSpec, RHIME_BANK, RHYME_FRAMES, rhymes } from './RhymingWordsWorksheet';
import { KNOWN_WORD_SET } from './words';

const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

function sheet(grade: GradeConfig) {
    return generateSheet(rhymeSpec, grade, seedFrom([grade.id, rhymeSpec.id, 0]));
}

function checkRhymeTruths(grade: GradeConfig) {
    for (const p of sheet(grade)) {
        const mc = p.prompt.match(/^Which word rhymes with "([a-z]+)"\? \(([^)]+)\)$/);
        const build = p.prompt.match(/^Write a word that rhymes with "([a-z]+)"\.$/);
        const yesno = p.prompt.match(/^Do "([a-z]+)" and "([a-z]+)" rhyme\? \(yes \/ no\)$/);
        const odd = p.prompt.match(/^Which word does NOT rhyme\? \(([^)]+)\)$/);
        const cloze = p.prompt.match(/^Choose the word that rhymes to fill the gap: (.+) \(([^)]+)\)$/);
        const picture = p.prompt.match(/^Which word rhymes with the picture\? \(([^)]+)\)$/);
        if (mc) {
            const options = mc[2].split(', ');
            expect(options).toHaveLength(3);
            // Exactly one option rhymes with the base — the answer.
            expect(options.filter((o) => rhymes(o, mc[1]))).toEqual([p.answer]);
        } else if (build) {
            // The model answer lists the whole family; every value rhymes.
            const values = p.answer.split(', ');
            expect(values.length).toBeGreaterThanOrEqual(1);
            for (const v of values) expect(rhymes(v, build[1])).toBe(true);
            expect(values).toEqual(RHIME_BANK[build[1]]);
        } else if (yesno) {
            expect(p.answer).toBe(rhymes(yesno[1], yesno[2]) ? 'yes' : 'no');
        } else if (odd) {
            const options = odd[1].split(', ');
            expect(options).toHaveLength(3);
            // The two non-answer options rhyme with EACH OTHER; the answer
            // rhymes with neither (the unique odd one out).
            const others = options.filter((o) => o !== p.answer);
            expect(others).toHaveLength(2);
            expect(rhymes(others[0], others[1])).toBe(true);
            expect(rhymes(p.answer, others[0])).toBe(false);
            expect(rhymes(p.answer, others[1])).toBe(false);
        } else if (cloze) {
            const text = cloze[1];
            const options = cloze[2].split(', ');
            const frame = RHYME_FRAMES.find((f) => f.text === text);
            expect(frame, `uncurated rhyme frame: ${text}`).toBeDefined();
            expect(frame!.answer).toBe(p.answer);
            // The answer rhymes with some word of the frame; no wrong option
            // rhymes with anything in the frame.
            const frameWords = text.replace(/__/g, '').split(/\s+/).filter(Boolean);
            expect(frameWords.some((w) => rhymes(p.answer, w))).toBe(true);
            for (const o of options.filter((o) => o !== p.answer)) {
                expect(frameWords.some((w) => rhymes(o, w))).toBe(false);
            }
        } else if (picture) {
            const options = picture[1].split(', ');
            expect(options).toHaveLength(3);
            expect(options).toContain(p.answer);
            // The cue is the unprinted base: registered, not an option, and
            // the answer rhymes with it.
            expect(typeof p.visual).toBe('string');
            expect(hasVisual(p.visual)).toBe(true);
            expect(options).not.toContain(p.visual as string);
            expect(rhymes(p.answer, p.visual as string)).toBe(true);
        } else {
            throw new Error(`unrecognised rhyme prompt: ${p.prompt}`);
        }
        // Every vocabulary word the child must read: quoted words + option
        // tokens (instruction wording and frame function words are exempt —
        // frames are separately pinned to the curated RHYME_FRAMES).
        const quoted = p.prompt.match(/"([a-z]+)"/g)?.map((s) => s.slice(1, -1)) ?? [];
        const optText = p.prompt.match(/\(([^)]+)\)$/)?.[1];
        const options = optText && optText !== 'yes / no' ? optText.split(', ') : [];
        for (const w of [...quoted, ...options]) {
            expect(KNOWN_WORD_SET.has(w), `unknown word printed: ${w} in ${p.prompt}`).toBe(true);
        }
    }
}

describe('rhyme plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and REDUCED page size (E2)', () => {
        expect(rhymeSpec.id).toBe('rhyme');
        expect(rhymeSpec.label).toBe('Rhyming Words');
        expect(rhymeSpec.icon).toBe('≈');
        expect(rhymeSpec.perPage).toBe(8);
    });

    it('describes its scope (rhyme families at every grade)', () => {
        expect(rhymeSpec.scope(g1)).toBe('rhyme families');
        expect(rhymeSpec.scope(g2)).toBe('rhyme families');
    });

    it('is gated by the grade catalogue (Year 1..6 offer it, Year 7 does not)', () => {
        expect(rhymeSpec.offered(getEnglishGradeConfig(0))).toBe(false);
        expect(rhymeSpec.offered(g1)).toBe(true);
        expect(rhymeSpec.offered(g2)).toBe(true);
        expect(rhymeSpec.offered(getEnglishGradeConfig(3))).toBe(true);
        expect(rhymeSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(rhymeSpec.offered(getEnglishGradeConfig(7))).toBe(false);
    });
});

describe('rhyme — family bank integrity (E1/E3/E4)', () => {
    it('every family member is a KNOWN_WORD_SET word', () => {
        for (const [base, family] of Object.entries(RHIME_BANK)) {
            expect(KNOWN_WORD_SET.has(base)).toBe(true);
            for (const w of family) expect(KNOWN_WORD_SET.has(w)).toBe(true);
        }
    });

    it('the bank is symmetric: a rhymes with b implies b lists a', () => {
        for (const [base, family] of Object.entries(RHIME_BANK)) {
            for (const w of family) {
                expect(RHIME_BANK[w]?.includes(base), `${w} must list ${base}`).toBe(true);
            }
        }
    });

    it('the bank grew past 50 bases (was 15) — deeper family coverage', () => {
        expect(Object.keys(RHIME_BANK).length).toBeGreaterThan(50);
    });

    it('every gap-fill frame word is a KNOWN word or a function word', () => {
        const FUNCTION = ['the', 'a', 'an', 'on', 'in', 'is', 'was', 'to', 'and'];
        for (const f of RHYME_FRAMES) {
            // Tokenize case-insensitively so "The" -> "the", not "he".
            for (const t of (f.text.match(/[A-Za-z]+/g) ?? []).map((s) => s.toLowerCase())) {
                expect(KNOWN_WORD_SET.has(t) || FUNCTION.includes(t), `frame word ${t} in ${f.text}`).toBe(true);
            }
            expect(KNOWN_WORD_SET.has(f.answer)).toBe(true);
            for (const w of f.wrong) expect(KNOWN_WORD_SET.has(w)).toBe(true);
        }
    });
});

describe('rhyme — exact pinned rows (determinism lock)', () => {
    it('pins the first rows of the pinned-seed page 1 per grade', () => {
        expect(sheet(g1).slice(0, 2)).toEqual([
            { prompt: 'Do "nap" and "lap" rhyme? (yes / no)', answer: 'yes', id: 1, type: 'rhyme' },
            { prompt: 'Which word does NOT rhyme? (duck, dig, pig)', answer: 'duck', id: 2, type: 'rhyme' }
        ]);
        expect(sheet(g2).slice(0, 2)).toEqual([
            { prompt: 'Which word rhymes with "sunny"? (funny, corn, moon)', answer: 'funny', id: 1, type: 'rhyme' },
            { prompt: 'Write a word that rhymes with "clean".', answer: 'green, mean, screen', id: 2, type: 'rhyme' }
        ]);
    });
});

describe('rhyme — semantic truth (every grade)', () => {
    for (const gradeId of [1, 2, 3, 4, 5, 6]) {
        it(`grade ${gradeId}: every row's answer is the unique rhyme-correct solution`, () => {
            checkRhymeTruths(getEnglishGradeConfig(gradeId));
        });
    }
});

describe('rhyme — cue band contract', () => {
    it('Prep and Year 4+ rows carry NO cue (legacy markup)', () => {
        for (const gradeId of [4, 5, 6]) {
            for (const p of sheet(getEnglishGradeConfig(gradeId))) {
                expect(p.visual).toBeUndefined();
            }
        }
    });

    it('inside the band, cues are registered and never an option word', () => {
        for (const gradeId of [1, 2, 3]) {
            for (const p of sheet(getEnglishGradeConfig(gradeId))) {
                if (p.visual !== undefined) {
                    expect(hasVisual(p.visual)).toBe(true);
                    const opts = p.prompt.match(/\(([^)]+)\)/)?.[1].split(', ') ?? [];
                    expect(opts).not.toContain(p.visual);
                }
            }
        }
    });
});

describe('rhyme — density + kind mix (E2/E1)', () => {
    it('pages hold exactly perPage rows and mix at least 3 task kinds', () => {
        for (const gradeId of [1, 2, 3, 6]) {
            const rows = sheet(getEnglishGradeConfig(gradeId));
            expect(rows).toHaveLength(8);
            const kinds = new Set(
                rows.map((r) => (r.prompt.match(/^(Which word rhymes|Write a word|Do "|Which word does NOT|Choose the word|Which word rhymes with the picture)/) ?? ['?'])[1])
            );
            expect(kinds.size).toBeGreaterThanOrEqual(3);
        }
    });
});

describe('rhyme — non-repeating capacity (E3)', () => {
    it('the new 100-page ask (800 questions) is fully unique at every grade', () => {
        for (const gradeId of [1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const ask = rhymeSpec.perPage * 100;
            const problems = rhymeSpec.generate(createRng(seedFrom([grade.id, 'rhyme', 0])), grade.caps, ask);
            expect(problems).toHaveLength(ask);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ask);
        }
    });

    it('even the OLD 18-per-page ask (1800 questions) stays fully unique', () => {
        for (const gradeId of [1, 2, 3, 4, 5, 6]) {
            const grade = getEnglishGradeConfig(gradeId);
            const ask = 1800;
            const problems = rhymeSpec.generate(createRng(seedFrom([grade.id, 'rhyme', 0])), grade.caps, ask);
            expect(new Set(problems.map((p) => p.prompt)).size).toBe(ask);
        }
    });
});

describe('rhyme — document assembly', () => {
    it('page 2 continues the exact stream (ids continuous)', () => {
        const d = generateDocument(rhymeSpec, g1, seedFrom([1, 'rhyme', 0]), 2);
        expect(d.pages[1][0].id).toBe(9);
        expect(d.total).toBe(16);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(rhymeSpec, getEnglishGradeConfig(7), seedFrom([7, 'rhyme', 0]))).toEqual([]);
    });

    it('a double generation is byte-identical (determinism)', () => {
        expect(JSON.stringify(sheet(g2))).toBe(JSON.stringify(sheet(g2)));
    });
});
