// Unit tests for the PROBABILITY worksheet plugin (T4 expansion; T8 adds the
// independent simplest-form checks for the Year 6 challenge family).
//
// Deterministic-generator strategy (see plugins/AdditionWorksheet.test.ts):
// the ENTIRE first page per offered grade is pinned exactly with the
// framework seed; tier counts are 2+4+2 on this 8-per-page sheet.
import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet } from '../../framework';
import { probabilitySpec } from './ProbabilityWorksheet';

const g3 = getMathGradeConfig(3);
const g4 = getMathGradeConfig(4);
const g5 = getMathGradeConfig(5);
const g6 = getMathGradeConfig(6);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(probabilitySpec, grade, seedFrom([grade.id, probabilitySpec.id, 0]));
}

// Euclid's gcd — independent reduction oracle for the simplest-form tests.
function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

describe('probability plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(probabilitySpec.id).toBe('probability');
        expect(probabilitySpec.label).toBe('Probability');
        expect(probabilitySpec.icon).toBe('⚂');
        expect(probabilitySpec.perPage).toBe(8);
    });

    it('describes its year-tiered scope from the grade caps', () => {
        expect(probabilitySpec.scope(g3)).toBe('certain, likely & unlikely (AC9M3SP01-02)');
        expect(probabilitySpec.scope(g4)).toBe('spinners & fair games (AC9M4SP02-03)');
        expect(probabilitySpec.scope(g5)).toBe('chance as fractions (AC9M5SP01-03)');
        expect(probabilitySpec.scope(g6)).toBe('fractions, simplest form & percent (AC9M6SP02)');
    });

    it('is gated to Years 3..6 (probability strand joins at Y3)', () => {
        expect(probabilitySpec.offered(getMathGradeConfig(2))).toBe(false);
        expect(probabilitySpec.offered(g3)).toBe(true);
        expect(probabilitySpec.offered(g4)).toBe(true);
        expect(probabilitySpec.offered(g5)).toBe(true);
        expect(probabilitySpec.offered(g6)).toBe(true);
        expect(probabilitySpec.offered(getMathGradeConfig(7))).toBe(false);
    });
});

describe('probability — Year 3 (certain/likely/impossible, AC9M3SP01-02)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g3)).toEqual([
            { prompt: 'Starter: A bag holds 9 red marbles and no blue marbles. Picking a blue marble is certain, possible or impossible? __', answer: 'Impossible', wideBlanks: true, id: 1, type: 'probability' },
            { prompt: 'Starter: A bag holds 4 red marbles and no others. Picking a red marble is certain, possible or impossible? __', answer: 'Certain', wideBlanks: true, id: 2, type: 'probability' },
            { prompt: 'Practice: A bag has 7 blue and 3 red marbles. Picking a blue marble is likely or unlikely? __', answer: 'Likely', wideBlanks: true, id: 3, type: 'probability' },
            { prompt: 'Practice: A bag has 9 red and 1 blue marbles. Picking a red marble is likely or unlikely? __', answer: 'Likely', wideBlanks: true, id: 4, type: 'probability' },
            { prompt: 'Practice: A bag has 8 blue and 2 red marbles. Picking a blue marble is likely or unlikely? __', answer: 'Likely', wideBlanks: true, id: 5, type: 'probability' },
            { prompt: 'Practice: A bag has 6 blue and 4 red marbles. Picking a blue marble is likely or unlikely? __', answer: 'Likely', wideBlanks: true, id: 6, type: 'probability' },
            { prompt: 'Challenge: Bag A has 8 green and 2 yellow. Bag B has 1 green and 9 yellow. Picking a green is easier from __', answer: 'Bag A', wideBlanks: true, id: 7, type: 'probability' },
            { prompt: 'Challenge: Bag A has 8 green and 2 yellow. Bag B has 2 green and 8 yellow. Picking a green is easier from __', answer: 'Bag A', wideBlanks: true, id: 8, type: 'probability' }
        ]);
    });
});

describe('probability — Year 4 (spinners & fairness, AC9M4SP02-03)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g4)).toEqual([
            { prompt: 'Starter: A spinner has 7 red sections out of 12. Stopping on red is __', answer: 'Likely', wideBlanks: true, id: 1, type: 'probability' },
            { prompt: 'Starter: A spinner has 5 red sections out of 8. Stopping on red is __', answer: 'Likely', wideBlanks: true, id: 2, type: 'probability' },
            { prompt: 'Practice: A spinner with 8 equal sections: 4 win for Ava and 4 win for Ben. Is this game fair or unfair? __', answer: 'Fair', wideBlanks: true, id: 3, type: 'probability' },
            { prompt: 'Practice: Spinner A has 1 red section of 6; spinner B has 5 of 8. Better chance of red: __', answer: 'Spinner B', wideBlanks: true, id: 4, type: 'probability' },
            { prompt: 'Practice: A spinner with 8 equal sections: 3 win for Ava and 5 win for Ben. Is this game fair or unfair? __', answer: 'Unfair', wideBlanks: true, id: 5, type: 'probability' },
            { prompt: 'Practice: A spinner with 8 equal sections: 5 win for Ava and 3 win for Ben. Is this game fair or unfair? __', answer: 'Unfair', wideBlanks: true, id: 6, type: 'probability' },
            { prompt: 'Challenge: Smallest chance of green first: B: 2 of 8, C: 4 of 8, A: 6 of 8 __', answer: 'B, C, A', wideBlanks: true, id: 7, type: 'probability' },
            { prompt: 'Challenge: Smallest chance of green first: C: 2 of 8, A: 4 of 8, B: 6 of 8 __', answer: 'C, A, B', wideBlanks: true, id: 8, type: 'probability' }
        ]);
    });

    it('the chance word is DERIVED from the counts (never a drawn guess)', () => {
        // 1000 items across refresh seeds: every "s of t" spinner/bag starter
        // answer must match the exact comparison against half.
        for (let refresh = 0; refresh < 20; refresh++) {
            const s = generateSheet(probabilitySpec, g4, seedFrom([g4.id, probabilitySpec.id, refresh]));
            for (const p of s) {
                const m = p.prompt.match(/has (\d+) red \w+ out of (\d+)/);
                if (m) {
                    const w = Number(m[1]), t = Number(m[2]);
                    const expected = w === 0 ? 'Impossible' : w === t ? 'Certain' : w * 2 < t ? 'Unlikely' : w * 2 === t ? 'Even' : 'Likely';
                    expect(p.answer).toBe(expected);
                }
            }
        }
    });
});

describe('probability — Year 5 (fractions & complements, AC9M5SP01-03)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g5)).toEqual([
            { prompt: 'Starter: A bag has 2 red marbles out of 6. Picking red is certain, likely, even, unlikely or impossible? __', answer: 'Unlikely', wideBlanks: true, id: 1, type: 'probability' },
            { prompt: 'Starter: A bag has 1 red marble out of 10. Picking red is certain, likely, even, unlikely or impossible? __', answer: 'Unlikely', wideBlanks: true, id: 2, type: 'probability' },
            { prompt: 'Practice: A bag has 2 red and 4 blue marbles. P(red) = __', answer: '2/6', id: 3, type: 'probability' },
            { prompt: 'Practice: A bag has 3 red and 9 blue marbles. P(red) = __', answer: '3/12', id: 4, type: 'probability' },
            { prompt: 'Practice: A bag has 10 red and 2 blue marbles. P(red) = __', answer: '10/12', id: 5, type: 'probability' },
            { prompt: 'Practice: A bag has 7 red and 1 blue marbles. P(red) = __', answer: '7/8', id: 6, type: 'probability' },
            { prompt: 'Challenge: A bag has 1 red and 7 blue marbles. P(NOT red) = __', answer: '7/8', id: 7, type: 'probability' },
            { prompt: 'Challenge: A bag has 5 red and 3 blue marbles. P(NOT red) = __', answer: '3/8', id: 8, type: 'probability' }
        ]);
    });

    it('P(red) and P(NOT red) answers equal the exact counts / complement', () => {
        for (const p of sheet(g5)) {
            const pm = p.prompt.match(/has (\d+) red and (\d+) blue marbles\. P\(red\) = __/);
            if (pm) expect(p.answer).toBe(`${pm[1]}/${Number(pm[1]) + Number(pm[2])}`);
            const cm = p.prompt.match(/has (\d+) red and (\d+) blue marbles\. P\(NOT red\) = __/);
            if (cm) expect(p.answer).toBe(`${cm[2]}/${Number(cm[1]) + Number(cm[2])}`);
        }
    });
});

describe('probability — Year 6 (dice, simplest form & percent, AC9M6SP02)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g6)).toEqual([
            { prompt: 'Starter: A fair 4-sided die is rolled. P(rolling a 2) = __', answer: '1/4', id: 1, type: 'probability' },
            { prompt: 'Starter: A fair 6-sided die is rolled. P(rolling less than 4) = __', answer: '3/6', id: 2, type: 'probability' },
            { prompt: 'Practice: A spinner has 1 red section out of 10. P(red) as a percentage is __', answer: '10%', id: 3, type: 'probability' },
            { prompt: 'Practice: A spinner has 9 red sections out of 20. P(red) as a percentage is __', answer: '45%', id: 4, type: 'probability' },
            { prompt: 'Practice: A spinner has 1 red section out of 2. P(red) as a percentage is __', answer: '50%', id: 5, type: 'probability' },
            { prompt: 'Practice: A spinner has 2 red sections out of 5. P(red) as a percentage is __', answer: '40%', id: 6, type: 'probability' },
            { prompt: 'Challenge: A bag has 3 red marbles out of 6. P(red) in simplest form is __', answer: '1/2', id: 7, type: 'probability' },
            { prompt: 'Challenge: A bag has 3 red marbles out of 9. P(red) in simplest form is __', answer: '1/3', id: 8, type: 'probability' }
        ]);
    });

    // T8 REGRESSION: the old draw could print "6 out of 12" with the answer
    // "2/4" — NOT simplest form. The generator now reduces the ratio by its
    // gcd before scaling, so across many seeds every simplest-form answer is
    // coprime AND equals the exact reduction of the printed counts.
    it('simplest-form answers are coprime and match the printed counts (T8, many seeds)', () => {
        let checked = 0;
        for (let refresh = 0; refresh < 40; refresh++) {
            const s = generateSheet(probabilitySpec, g6, seedFrom([g6.id, probabilitySpec.id, refresh]));
            for (const p of s) {
                const m = p.prompt.match(/has (\d+) red marbles out of (\d+)\. P\(red\) in simplest form/);
                if (!m) continue;
                checked += 1;
                const w = Number(m[1]), t = Number(m[2]);
                const [n, g] = p.answer.split('/').map(Number);
                // Coprime: the answer itself is in simplest form.
                expect(gcd(n, g)).toBe(1);
                // Exact: n/g is the same ratio as the printed w/t (integer
                // cross-multiplication, no floats).
                expect(n * t).toBe(g * w);
                // And it IS the full reduction: g === t / gcd(w, t).
                expect(g).toBe(t / gcd(w, t));
            }
        }
        // The family must actually have been exercised (not vacuously true).
        expect(checked).toBeGreaterThanOrEqual(40);
    });

    it('percent answers are whole numbers matching w×100/t exactly (totals divide 100)', () => {
        for (let refresh = 0; refresh < 20; refresh++) {
            const s = generateSheet(probabilitySpec, g6, seedFrom([g6.id, probabilitySpec.id, refresh]));
            for (const p of s) {
                const m = p.prompt.match(/has (\d+) red \w+ out of (\d+)\. P\(red\) as a percentage/);
                if (m) {
                    const pct = Number(p.answer.replace('%', ''));
                    expect(Number.isInteger(pct)).toBe(true);
                    expect(pct).toBe((Number(m[1]) * 100) / Number(m[2]));
                }
            }
        }
    });
});

describe('probability — scaffolded learning sequence', () => {
    it('every Year 3..6 page prints 2 scaffold + 4 core + 2 stretch rows', () => {
        for (const grade of [g3, g4, g5, g6]) {
            const s = sheet(grade);
            expect(s.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(2);
            expect(s.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(s.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(2);
        }
    });
});
