// Unit tests for the CAPITAL LETTERS worksheet plugin (T4B rework).
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE sheet (all
// prompts + answers) is pinned to exact expected values produced from the real
// generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). If the algorithm, banks, or caps change,
// these exact assertions fail — which is what we want, so a silent change to
// the worksheet can't slip through.
//
// T4B additions: the "which word needs a capital letter?" rows now print the
// sentence start CORRECTLY capitalised, so exactly ONE word (the name) needs a
// capital — the old all-lower-case lines were ambiguous (start AND name).
// Two new formats join: proper-noun MCQ and full rewrite-with-capitals.
// Exact per-format counts and the 100-page capacity are pinned below.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, createRng, generateSheet, generateDocument, type GradeConfig } from '../../framework';
import { capitalSpec } from './CapitalLettersWorksheet';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(capitalSpec, grade, seedFrom([grade.id, capitalSpec.id, 0]));
}

describe('capital plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and T4B page size', () => {
        expect(capitalSpec.id).toBe('capital');
        expect(capitalSpec.label).toBe('Capital Letters');
        expect(capitalSpec.icon).toBe('A!');
        // T4B density: 8 roomy rows (was 24).
        expect(capitalSpec.perPage).toBe(8);
    });

    it('describes its scope', () => {
        expect(capitalSpec.scope(g1)).toBe('word starts');
    });

    it('is gated by the grade catalogue (Year 1..6 offer it, Year 7 does not)', () => {
        expect(capitalSpec.offered(g0)).toBe(false);
        expect(capitalSpec.offered(g1)).toBe(true);
        expect(capitalSpec.offered(g2)).toBe(true);
        expect(capitalSpec.offered(getEnglishGradeConfig(3))).toBe(true);
        expect(capitalSpec.offered(getEnglishGradeConfig(6))).toBe(true);
        expect(capitalSpec.offered(getEnglishGradeConfig(7))).toBe(false);
        // Unoffered type => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(capitalSpec, g0, seedFrom([0, 'capital', 0]))).toEqual([]);
    });
});

describe('capital — Year 1', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g1)).toEqual([
        {"prompt":"Rewrite with the correct capital letters: we live in canberra in october.","answer":"We live in Canberra in October.","id":1,"type":"capital"},
        {"prompt":"Which sentence is written correctly? (The baby and Ben sang a song. / the baby and Ben sang a song.)","answer":"The baby and Ben sang a song.","id":2,"type":"capital"},
        {"prompt":"Which word needs a capital letter? The horse and ivy made a mess.","answer":"ivy","id":3,"type":"capital"},
        {"prompt":"Which word needs a capital letter? My mom and mia ran fast.","answer":"mia","id":4,"type":"capital"},
        {"prompt":"Write it with a capital letter: elf","answer":"Elf","id":5,"type":"capital"},
        {"prompt":"Which word needs a capital letter? The teacher and sue ate lunch.","answer":"sue","id":6,"type":"capital"},
        {"prompt":"Rewrite with the correct capital letters: nana flew to darwin in march.","answer":"Nana flew to Darwin in March.","id":7,"type":"capital"},
        {"prompt":"Write it with a capital letter: they","answer":"They","id":8,"type":"capital"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(capitalSpec, g1, seedFrom([1, 'capital', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Which is written correctly? (September, SEPTEMBER, september)","answer":"September","id":9,"type":"capital"},
        {"prompt":"Which is written correctly? (april, APRIL, April)","answer":"April","id":10,"type":"capital"},
        {"prompt":"Which word needs a capital letter? The girl and ruby played outside.","answer":"ruby","id":11,"type":"capital"}
        ]);
    });

    // T4B AMBIGUITY FIX: every "which word needs a capital letter?" line
    // prints the sentence start already capitalised, so the single-word
    // answer is the ONLY word needing a capital.
    it('Year 1: needs-capital lines have exactly one lower-case word', () => {
        const problems = capitalSpec.generate(createRng(seedFrom([1, 'capital', 0])), g1.caps, 200);
        const rows = problems.filter((p) => p.prompt.startsWith('Which word needs a capital letter?'));
        expect(rows).toHaveLength(36);
        for (const p of rows) {
            const line = p.prompt.slice('Which word needs a capital letter? '.length);
            const words = line.split(' ');
            // The sentence start is already capitalised (the old rows printed
            // it lower-case, making the answer ambiguous with the name).
            expect(/^[A-Z]/.test(words[0])).toBe(true);
            // The answer (the name) appears lower-case exactly once; its
            // capitalised form appears nowhere.
            const lowerCount = words.filter((w) => w.replace(/\.$/, '') === p.answer).length;
            const upperCount = words.filter((w) => w.replace(/\.$/, '') === `${p.answer[0].toUpperCase()}${p.answer.slice(1)}`).length;
            expect(lowerCount).toBe(1);
            expect(upperCount).toBe(0);
        }
    });
});

describe('capital — Year 2', () => {
    it('matches the exact page-1 sheet', () => {
        expect(sheet(g2)).toEqual([
        {"prompt":"Which sentence is written correctly? (My dad and Ruby ran fast. / My dad and ruby ran fast.)","answer":"My dad and Ruby ran fast.","id":1,"type":"capital"},
        {"prompt":"Write it with a capital letter: watch","answer":"Watch","id":2,"type":"capital"},
        {"prompt":"Which word needs a capital letter? The cat and zoe found a coin.","answer":"zoe","id":3,"type":"capital"},
        {"prompt":"Which sentence is written correctly? (The baby and Mia went home. / the baby and Mia went home.)","answer":"The baby and Mia went home.","id":4,"type":"capital"},
        {"prompt":"Which word needs a capital letter? The frog and eli played outside.","answer":"eli","id":5,"type":"capital"},
        {"prompt":"Write it with a capital letter: seat","answer":"Seat","id":6,"type":"capital"},
        {"prompt":"Which sentence is written correctly? (The horse and Sam rode a bike. / The horse and sam rode a bike.)","answer":"The horse and Sam rode a bike.","id":7,"type":"capital"},
        {"prompt":"Which word needs a capital letter? The boy and leo drew a picture.","answer":"leo","id":8,"type":"capital"}
        ]);
    });

    it('page 2 continues the exact stream', () => {
        expect(generateDocument(capitalSpec, g2, seedFrom([2, 'capital', 0]), 2).pages[1].slice(0, 3)).toEqual([
        {"prompt":"Which word needs a capital letter? My friend and sue helped mum.","answer":"sue","id":9,"type":"capital"},
        {"prompt":"Rewrite with the correct capital letters: gran travelled to hobart in august.","answer":"Gran travelled to Hobart in August.","id":10,"type":"capital"},
        {"prompt":"Which sentence is written correctly? (The dog and Jack won the race. / The dog and jack won the race.)","answer":"The dog and Jack won the race.","id":11,"type":"capital"}
        ]);
    });

    it('returns an empty sheet for an unimplemented grade', () => {
        expect(generateSheet(capitalSpec, getEnglishGradeConfig(7), seedFrom([7, 'capital', 0]))).toEqual([]);
    });
});

describe('capital — T4B format mix & capacity', () => {
    // Exact per-format counts over a deterministic 200-question Year-1 sheet
    // (measured from the real generator): word capitalise, needs-capital,
    // proper-noun MCQ, correct-sentence, rewrite.
    it('Year 1: exact format counts over 200 questions', () => {
        const problems = capitalSpec.generate(createRng(seedFrom([1, 'capital', 0])), g1.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        expect(count('Write it with a capital letter:')).toBe(45);
        expect(count('Which word needs a capital letter?')).toBe(36);
        expect(count('Which is written correctly?')).toBe(39);
        expect(count('Which sentence is written correctly?')).toBe(32);
        expect(count('Rewrite with the correct capital letters:')).toBe(48);
    });

    it('Year 3: exact format counts over 200 questions', () => {
        const g3 = getEnglishGradeConfig(3);
        const problems = capitalSpec.generate(createRng(seedFrom([3, 'capital', 0])), g3.caps, 200);
        const count = (stem: string) => problems.filter((p) => p.prompt.includes(stem)).length;
        expect(count('Write it with a capital letter:')).toBe(46);
        expect(count('Which word needs a capital letter?')).toBe(40);
        expect(count('Which is written correctly?')).toBe(39);
        expect(count('Which sentence is written correctly?')).toBe(37);
        expect(count('Rewrite with the correct capital letters:')).toBe(38);
    });

    // CAPACITY: the 100-page ask (8 x 100 = 800 questions) is fully unique.
    it('Year 1: 800-question (100-page) ask yields 800 unique questions', () => {
        const problems = capitalSpec.generate(createRng(seedFrom([1, 'capital', 0])), g1.caps, 800);
        expect(new Set(problems.map((p) => p.prompt)).size).toBe(800);
    });
});
