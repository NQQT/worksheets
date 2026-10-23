// Unit tests for the ADDITION worksheet plugin.
//
// Strategy: the plugin's generator is DETERMINISTIC, so the ENTIRE sheet (all
// prompts + answers) is pinned to exact expected values produced from the real
// generator with the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). If the algorithm, ranges, or caps change,
// these exact assertions fail — which is what we want, so a silent change to
// the worksheet can't slip through.
//
// DEPTH-FIRST SHEET: eight CONNECTED multi-part tasks per page (single column)
// — switch / diff / verify / bond / column / multi families. Answers list the
// blank values IN PRINTED ORDER, comma separated (RawProblem contract), so the
// numeric sanity helpers below parse EVERY part, not a single number.
//
// The DIFFICULTY LADDER is pinned here too: grades 0..6 each get their own
// sheet (operand cap scaling one digit per year — see framework/grades.ts,
// arithmeticLadderGrade), multi-addend questions join from Year 4, and grade 7
// upwards offers no addition at all.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, generateDocument } from '../../framework';
import { additionSpec } from './AdditionWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);
const g3 = getMathGradeConfig(3);
const g4 = getMathGradeConfig(4);
const g5 = getMathGradeConfig(5);
const g6 = getMathGradeConfig(6);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(additionSpec, grade, seedFrom([grade.id, additionSpec.id, 0]));
}

// Every NUMERIC part of a comma-separated multi-part answer (word parts like
// "Wrong"/"Correct" and sentence parts like "7 + 3 = 10" are skipped — the
// exact pins below already cover them).
function numericParts(answer: string): number[] {
    return answer
        .split(',')
        .map((part) => part.trim())
        .filter((part) => /^-?\d+$/.test(part))
        .map(Number);
}

describe('addition plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(additionSpec.id).toBe('addition');
        expect(additionSpec.label).toBe('Addition');
        expect(additionSpec.icon).toBe('+');
        // Depth-first: seven connected tasks, one column, full-page rows
        // (T3M3: 8 rows clipped the column-figure worst case — see
        // plugins/layout-capacity.test.ts).
        expect(additionSpec.perPage).toBe(7);
        expect(additionSpec.singleColumn).toBe(true);
    });

    it('describes its numeric scope from the grade caps', () => {
        // Pair grades: plain "within N" (the multi-addend suffix is reserved
        // for grades whose addendCap exceeds 2 — see the ladder pins below).
        expect(additionSpec.scope(g0)).toBe('within 10');
        expect(additionSpec.scope(g1)).toBe('within 20');
        expect(additionSpec.scope(g2)).toBe('within 100');
        expect(additionSpec.scope(g3)).toBe('within 1000');
        // Multi-addend grades advertise the second difficulty axis.
        expect(additionSpec.scope(g4)).toBe('within 10000 (up to 3 addends)');
        expect(additionSpec.scope(g5)).toBe('within 100000 (up to 3 addends)');
        expect(additionSpec.scope(g6)).toBe('within 1000000 (up to 4 addends)');
    });

    it('is gated by the grade catalogue (offered 0..6, hidden from Year 7)', () => {
        expect(additionSpec.offered(g0)).toBe(true);
        expect(additionSpec.offered(g1)).toBe(true);
        expect(additionSpec.offered(g2)).toBe(true);
        expect(additionSpec.offered(g3)).toBe(true);
        expect(additionSpec.offered(g4)).toBe(true);
        expect(additionSpec.offered(g5)).toBe(true);
        expect(additionSpec.offered(g6)).toBe(true);
        // Grade 7+ leaves addition behind entirely.
        expect(additionSpec.offered(getMathGradeConfig(7))).toBe(false);
        expect(additionSpec.offered(getMathGradeConfig(12))).toBe(false);
    });
});

describe('addition — Prep (grade 0)', () => {
    it('matches the exact sheet', () => {
        expect(sheet(g0)).toEqual([
            {"prompt":"3 + 5 = __ and 5 + 3 = __","answer":"8, 8","id":1,"type":"addition"},
            {"prompt":"True or false: 3 + 7 = 9. __; if it is wrong, fix it: 3 + 7 = __","answer":"Wrong, 10","wideBlanks":true,"id":2,"type":"addition"},
            {"prompt":"The whole is 10 and one part is 7. The other part is __; the addition sentence is __","answer":"3, 7 + 3 = 10","wideBlanks":true,"id":3,"type":"addition"},
            {"prompt":"4 + 3 = __ and 4 + 5 = __; the sums differ by __","answer":"7, 9, 2","id":4,"type":"addition"},
            {"prompt":"True or false: 9 + 1 = 9. __; if it is wrong, fix it: 9 + 1 = __","answer":"Wrong, 10","wideBlanks":true,"id":5,"type":"addition"},
            {"prompt":"The whole is 10 and one part is 8. The other part is __; the addition sentence is __","answer":"2, 8 + 2 = 10","wideBlanks":true,"id":6,"type":"addition"},
            {"prompt":"6 + 1 = __ and 1 + 6 = __","answer":"7, 7","id":7,"type":"addition"},
        ]);
    });
});

describe('addition — Year 1', () => {
    it('matches the exact sheet (within 20, every sum stays within the cap)', () => {
        const s = sheet(g1);
        expect(s).toEqual([
            {"prompt":"4 + 16 = __ and 16 + 4 = __; the sums differ by __","answer":"20, 20, 0","id":1,"type":"addition"},
            {"prompt":"True or false: 17 + 1 = 17. __; if it is wrong, fix it: 17 + 1 = __","answer":"Wrong, 18","wideBlanks":true,"id":2,"type":"addition"},
            {"prompt":"The whole is 10 and one part is 5. The other part is __; the addition sentence is __","answer":"5, 5 + 5 = 10","wideBlanks":true,"id":3,"type":"addition"},
            {"prompt":"7 + 12 = __ and 12 + 7 = __","answer":"19, 19","id":4,"type":"addition"},
            {"prompt":"9 + 8 = __ and 16 + 2 = __; the sums differ by __","answer":"17, 18, 1","id":5,"type":"addition"},
            {"prompt":"5 + 11 = __ and 11 + 5 = __","answer":"16, 16","id":6,"type":"addition"},
            {"prompt":"True or false: 2 + 7 = 9. __; if it is wrong, fix it: 2 + 7 = __","answer":"Correct, 9","wideBlanks":true,"id":7,"type":"addition"},
        ]);
        // Sanity: no numeric answer part exceeds the within-20 cap (the bond
        // family's sentence parts are covered by the exact pins above).
        for (const p of s) for (const n of numericParts(p.answer)) expect(n).toBeLessThanOrEqual(20);
    });
});

describe('addition — Year 2 (bigger numbers)', () => {
    it('stays within the within-100 cap', () => {
        const s = sheet(g2);
        expect(s).toHaveLength(7);
        for (const p of s) for (const n of numericParts(p.answer)) expect(n).toBeLessThanOrEqual(100);
        expect(s[0]).toEqual({ id: 1, type: "addition", prompt: "99 + 1 = __ and 97 + 2 = __; the sums differ by __", answer: "100, 99, 1" });
    });

    it('returns an empty sheet for an unimplemented grade (Year 7+)', () => {
        expect(generateSheet(additionSpec, getMathGradeConfig(7), seedFrom([7, 'addition', 0]))).toEqual([]);
    });
});

// ── The addition ladder (Years 3..6) ─────────────────────────────────────────
// Each year below pins the exact refresh-0 sheet, so the difficulty scaling
// (one more digit per year, multi-addend from Year 4) cannot silently drift.
describe('addition — Year 3 (three-digit pairs)', () => {
    it('matches the exact sheet (within 1000, column tasks carry the figure)', () => {
        const s = sheet(g3);
        // Year 3 is the vertical-column grade (caps.opCap === 1000): its
        // COLUMN-family tasks print a right-aligned column figure
        // (framework/ColumnDiagram.tsx) so kids line up digits. The figure
        // repeats the printed terms — the answer is never drawn. The other
        // families (switch/diff/verify) print plain inline prompts.
        expect(s).toEqual([
            {"prompt":"152 + 212 = __ and 212 + 152 = __","answer":"364, 364","id":1,"type":"addition"},
            {"prompt":"True or false: 863 + 115 = 979. __; if it is wrong, fix it: 863 + 115 = __","answer":"Wrong, 978","wideBlanks":true,"id":2,"type":"addition"},
            {"prompt":"Add, then check: 707 + 28 = __; check: 735 - 28 = __","answer":"735, 707","column":{"terms":[707,28],"op":"+"},"id":3,"type":"addition"},
            {"prompt":"713 + 41 = __ and 950 + 37 = __; the sums differ by __","answer":"754, 987, 233","id":4,"type":"addition"},
            {"prompt":"True or false: 418 + 554 = 971. __; if it is wrong, fix it: 418 + 554 = __","answer":"Wrong, 972","wideBlanks":true,"id":5,"type":"addition"},
            {"prompt":"Add, then check: 717 + 4 = __; check: 721 - 4 = __","answer":"721, 717","column":{"terms":[717,4],"op":"+"},"id":6,"type":"addition"},
            {"prompt":"619 + 367 = __ and 367 + 619 = __","answer":"986, 986","id":7,"type":"addition"},
        ]);
        // Sanity: within 1000, and (the Year-3-only gate) every "Add, then
        // check" row carries its column figure with the printed terms.
        for (const p of s) {
            for (const n of numericParts(p.answer)) expect(n).toBeLessThanOrEqual(1000);
            if (p.prompt.startsWith('Add, then check:')) {
                expect(p.column).toEqual({ terms: expect.any(Array), op: '+' });
            }
        }
        // The column family appears on the Year-3 sheet (deck deals it).
        expect(s.filter((p) => p.column).length).toBeGreaterThan(0);
    });
});

describe('addition — Year 4 (four digits + multi-addend joins)', () => {
    it('matches the exact sheet (within 10000, 2-3 addends)', () => {
        const s = sheet(g4);
        expect(s).toEqual([
            {"prompt":"7123 + 1057 = __; check: 8180 - 1057 = __","answer":"8180, 7123","id":1,"type":"addition"},
            {"prompt":"666 + 4895 = __ and 4404 + 1745 = __; the sums differ by __","answer":"5561, 6149, 588","id":2,"type":"addition"},
            {"prompt":"9789 + 129 = __ and 129 + 9789 = __","answer":"9918, 9918","id":3,"type":"addition"},
            {"prompt":"True or false: 5830 + 679 = 6507. __; if it is wrong, fix it: 5830 + 679 = __","answer":"Wrong, 6509","wideBlanks":true,"id":4,"type":"addition"},
            {"prompt":"2411 + 1462 = __; check: 3873 - 1462 = __","answer":"3873, 2411","id":5,"type":"addition"},
            {"prompt":"True or false: 2501 + 6692 = 9191. __; if it is wrong, fix it: 2501 + 6692 = __","answer":"Wrong, 9193","wideBlanks":true,"id":6,"type":"addition"},
            {"prompt":"7227 + 993 = __ and 993 + 7227 = __","answer":"8220, 8220","id":7,"type":"addition"},
        ]);
        // Sanity: within 10000 and addend counts stay inside [2, 3] (the
        // check clause never adds an addend to the printed sum).
        for (const p of s) {
            for (const n of numericParts(p.answer)) expect(n).toBeLessThanOrEqual(10000);
            const sumSide = p.prompt.split(';')[0];
            expect(sumSide.match(/\+/g)!.length + 1).toBeGreaterThanOrEqual(2);
            expect(sumSide.match(/\+/g)!.length + 1).toBeLessThanOrEqual(3);
        }
    });
});

describe('addition — Year 5 (five digits)', () => {
    it('matches the exact sheet (within 100000, 2-3 addends)', () => {
        const s = sheet(g5);
        expect(s).toEqual([
            {"prompt":"3370 + 1240 + 10833 = __; check: 15443 - 10833 = __","answer":"15443, 4610","id":1,"type":"addition"},
            {"prompt":"True or false: 26092 + 3417 = 29509. __; if it is wrong, fix it: 26092 + 3417 = __","answer":"Correct, 29509","wideBlanks":true,"id":2,"type":"addition"},
            {"prompt":"37452 + 392 = __ and 392 + 37452 = __","answer":"37844, 37844","id":3,"type":"addition"},
            {"prompt":"69195 + 13578 = __ and 92464 + 4408 = __; the sums differ by __","answer":"82773, 96872, 14099","id":4,"type":"addition"},
            {"prompt":"23715 + 13879 = __; check: 37594 - 13879 = __","answer":"37594, 23715","id":5,"type":"addition"},
            {"prompt":"True or false: 36733 + 27752 = 64487. __; if it is wrong, fix it: 36733 + 27752 = __","answer":"Wrong, 64485","wideBlanks":true,"id":6,"type":"addition"},
            {"prompt":"90927 + 8266 = __ and 8266 + 90927 = __","answer":"99193, 99193","id":7,"type":"addition"},
        ]);
        for (const p of s) for (const n of numericParts(p.answer)) expect(n).toBeLessThanOrEqual(100000);
    });
});

describe('addition — Year 6 (six digits, up to 4 addends)', () => {
    it('matches the exact sheet (within 1000000, 2-4 addends)', () => {
        const s = sheet(g6);
        expect(s).toEqual([
            {"prompt":"543082 + 101316 = __ and 101316 + 543082 = __","answer":"644398, 644398","id":1,"type":"addition"},
            {"prompt":"574826 + 414491 = __ and 128334 + 115784 = __; the sums differ by __","answer":"989317, 244118, 745199","id":2,"type":"addition"},
            {"prompt":"12544 + 2056 + 474 + 83245 = __; check: 98319 - 83245 = __","answer":"98319, 15074","id":3,"type":"addition"},
            {"prompt":"True or false: 11781 + 321932 = 333715. __; if it is wrong, fix it: 11781 + 321932 = __","answer":"Wrong, 333713","wideBlanks":true,"id":4,"type":"addition"},
            {"prompt":"243088 + 54081 = __ and 787413 + 177506 = __; the sums differ by __","answer":"297169, 964919, 667750","id":5,"type":"addition"},
            {"prompt":"1489 + 784942 = __ and 784942 + 1489 = __","answer":"786431, 786431","id":6,"type":"addition"},
            {"prompt":"True or false: 361838 + 154744 = 516583. __; if it is wrong, fix it: 361838 + 154744 = __","answer":"Wrong, 516582","wideBlanks":true,"id":7,"type":"addition"},
        ]);
        // Sanity: within one million and addend counts stay inside [2, 4].
        for (const p of s) {
            for (const n of numericParts(p.answer)) expect(n).toBeLessThanOrEqual(1000000);
            const sumSide = p.prompt.split(';')[0];
            expect(sumSide.match(/\+/g)!.length + 1).toBeGreaterThanOrEqual(2);
            expect(sumSide.match(/\+/g)!.length + 1).toBeLessThanOrEqual(4);
        }
    });
});

describe('addition — multi-page documents', () => {
    // The EXACT continuation rows of page 2 for (Year 1, addition, refresh 0),
    // captured from the deterministic generator — any change to the generator,
    // caps, or chunking fails these pins.
    it('Year 1 addition, 2 pages, matches the exact page-2 sheet', () => {
        const doc = generateDocument(additionSpec, g1, seedFrom([1, 'addition', 0]), 2);
        expect(doc.pages[0][0]).toEqual({ id: 1, type: "addition", prompt: "4 + 16 = __ and 16 + 4 = __; the sums differ by __", answer: "20, 20, 0" });
        expect(doc.pages[1]).toEqual([
            {"prompt":"The whole is 10 and one part is 6. The other part is __; the addition sentence is __","answer":"4, 6 + 4 = 10","wideBlanks":true,"id":8,"type":"addition"},
            {"prompt":"18 + 2 = __ and 1 + 18 = __; the sums differ by __","answer":"20, 19, 1","id":9,"type":"addition"},
            {"prompt":"True or false: 19 + 1 = 18. __; if it is wrong, fix it: 19 + 1 = __","answer":"Wrong, 20","wideBlanks":true,"id":10,"type":"addition"},
            {"prompt":"9 + 5 = __ and 5 + 9 = __","answer":"14, 14","id":11,"type":"addition"},
            {"prompt":"The whole is 10 and one part is 2. The other part is __; the addition sentence is __","answer":"8, 2 + 8 = 10","wideBlanks":true,"id":12,"type":"addition"},
            {"prompt":"7 + 13 = __ and 13 + 7 = __","answer":"20, 20","id":13,"type":"addition"},
            {"prompt":"12 + 2 = __ and 7 + 11 = __; the sums differ by __","answer":"14, 18, 4","id":14,"type":"addition"},
        ]);
    });

    it('Year 2 addition page 2 stays within the within-100 cap', () => {
        const doc = generateDocument(additionSpec, g2, seedFrom([2, 'addition', 0]), 2);
        // Pinned head of the page-2 stream.
        expect(doc.pages[1].slice(0, 3)).toEqual([
            {"prompt":"The whole is 20 and one part is 6. The other part is __; the addition sentence is __","answer":"14, 6 + 14 = 20","wideBlanks":true,"id":8,"type":"addition"},
            {"prompt":"84 + 11 = __ and 19 + 11 = __; the sums differ by __","answer":"95, 30, 65","id":9,"type":"addition"},
            {"prompt":"True or false: 48 + 50 = 100. __; if it is wrong, fix it: 48 + 50 = __","answer":"Wrong, 98","wideBlanks":true,"id":10,"type":"addition"},
        ]);
        for (const p of doc.pages.flat()) for (const n of numericParts(p.answer)) expect(n).toBeLessThanOrEqual(100);
    });

    // The ladder's top grade also paginates: page 2 continues the SAME stream
    // (multi-addend included) with continuous ids — the full 7-row page at the
    // T3M3 density.
    it('Year 6 addition page 2 continues the exact stream', () => {
        const doc = generateDocument(additionSpec, g6, seedFrom([6, 'addition', 0]), 2);
        expect(doc.pages[1]).toEqual([
            {"prompt":"120045 + 569435 = __; check: 689480 - 569435 = __","answer":"689480, 120045","id":8,"type":"addition"},
            {"prompt":"614372 + 183031 = __ and 183031 + 614372 = __","answer":"797403, 797403","id":9,"type":"addition"},
            {"prompt":"306605 + 13374 = __ and 855963 + 45945 = __; the sums differ by __","answer":"319979, 901908, 581929","id":10,"type":"addition"},
            {"prompt":"63872 + 30563 + 60619 + 165114 = __; check: 320168 - 165114 = __","answer":"320168, 155054","id":11,"type":"addition"},
            {"prompt":"True or false: 248749 + 399252 = 648002. __; if it is wrong, fix it: 248749 + 399252 = __","answer":"Wrong, 648001","wideBlanks":true,"id":12,"type":"addition"},
            {"prompt":"156760 + 33082 = __ and 854212 + 46573 = __; the sums differ by __","answer":"189842, 900785, 710943","id":13,"type":"addition"},
            {"prompt":"True or false: 821058 + 107022 = 928082. __; if it is wrong, fix it: 821058 + 107022 = __","answer":"Wrong, 928080","wideBlanks":true,"id":14,"type":"addition"},
        ]);
    });
});
