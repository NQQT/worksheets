// Unit tests for the STATISTICS worksheet plugin (T4 expansion).
//
// Deterministic-generator strategy (see plugins/AdditionWorksheet.test.ts):
// the ENTIRE first page per offered grade is pinned exactly with the
// framework seed; tier counts are 2+4+2 on this 8-per-page sheet.
import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet } from '../../framework';
import { statisticsSpec } from './StatisticsWorksheet';

const g3 = getMathGradeConfig(3);
const g4 = getMathGradeConfig(4);
const g5 = getMathGradeConfig(5);
const g6 = getMathGradeConfig(6);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(statisticsSpec, grade, seedFrom([grade.id, statisticsSpec.id, 0]));
}

describe('statistics plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(statisticsSpec.id).toBe('statistics');
        expect(statisticsSpec.label).toBe('Statistics');
        expect(statisticsSpec.icon).toBe('▤');
        expect(statisticsSpec.perPage).toBe(8);
    });

    it('describes its year-tiered scope from the grade caps', () => {
        expect(statisticsSpec.scope(g3)).toBe('tallies & reading simple data (AC9M3ST01-02)');
        // T8 labelling: mean/median/range items are EXTENSIONS of the cited
        // codes at Y4/Y5/Y6 — the scope line must say so, not claim them as
        // required content.
        expect(statisticsSpec.scope(g4)).toBe('mode & tables; range extension (AC9M4ST01-03)');
        expect(statisticsSpec.scope(g5)).toBe('mode & frequency; mean/range extension (AC9M5ST01-03)');
        expect(statisticsSpec.scope(g6)).toBe('mode & range; mean/median extension (AC9M6ST01-03)');
    });

    it('is offered on every grade Y3..Y6 (statistics strand spans all four)', () => {
        expect(statisticsSpec.offered(g3)).toBe(true);
        expect(statisticsSpec.offered(g4)).toBe(true);
        expect(statisticsSpec.offered(g5)).toBe(true);
        expect(statisticsSpec.offered(g6)).toBe(true);
    });
});

describe('statistics — Year 3 (tallies & simple data, AC9M3ST01-02)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g3)).toEqual([
            { prompt: 'Starter: 5 votes for blue and 3 votes for yellow. The most popular colour is __', answer: 'blue', id: 1, type: 'statistics' },
            { prompt: 'Starter: Count the tallies below. There are __ in all.', answer: '4', data: { kind: 'tally', total: 4 }, id: 2, type: 'statistics' },
            { prompt: 'Practice: The scores are Sam 2, Mia 7 and Leo 6. The highest score belongs to __', answer: 'Mia', id: 3, type: 'statistics' },
            { prompt: 'Practice: The scores are Mia 3, Sam 4 and Leo 8. The highest score belongs to __', answer: 'Leo', id: 4, type: 'statistics' },
            { prompt: 'Practice: 5 children chose red and 3 chose blue. Red got __ more votes.', answer: '2', id: 5, type: 'statistics' },
            { prompt: 'Practice: The scores are Leo 9, Sam 4 and Mia 8. The highest score belongs to __', answer: 'Leo', id: 6, type: 'statistics' },
            { prompt: 'Challenge: A fruit table shows bananas 2, apples 9 and pears 8. There are __ pieces of fruit in all.', answer: '19', id: 7, type: 'statistics' },
            { prompt: 'Challenge: A fruit table shows bananas 5, pears 4 and apples 9. There are __ pieces of fruit in all.', answer: '18', id: 8, type: 'statistics' }
        ]);
    });

    it('the tally row carries its figure data so identical sentences stay distinct', () => {
        const tally = sheet(g3).find((p) => p.prompt.startsWith('Starter: Count'));
        expect(tally?.data).toEqual({ kind: 'tally', total: 4 });
    });
});

describe('statistics — Year 4 (tables, mode & extremes, AC9M4ST01-03)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g4)).toEqual([
            { prompt: 'Starter: Sam chose red, Zoe chose red, Mia chose red, Tom chose green, Leo chose green. The most popular colour is __', answer: 'red', id: 1, type: 'statistics' },
            { prompt: 'Starter: Sam chose yellow, Mia chose blue, Tom chose blue, Leo chose yellow, Zoe chose blue. The most popular colour is __', answer: 'blue', id: 2, type: 'statistics' },
            { prompt: 'Practice: From 34, 24, 46, 45, the highest is __ and the lowest is __', answer: '46, 24', id: 3, type: 'statistics' },
            { prompt: 'Practice: A table shows bananas 40, apples 14 and pears 21. The table total is __', answer: '75', id: 4, type: 'statistics' },
            { prompt: 'Practice: From 43, 25, 42, 26, the highest is __ and the lowest is __', answer: '43, 25', id: 5, type: 'statistics' },
            { prompt: 'Practice: A table shows bananas 35, pears 16 and apples 16. The table total is __', answer: '67', id: 6, type: 'statistics' },
            { prompt: 'Challenge: The range of 24, 31, 48, 28 is __', answer: '24', id: 7, type: 'statistics' },
            { prompt: 'Challenge: The range of 42, 26, 40, 43 is __', answer: '17', id: 8, type: 'statistics' }
        ]);
    });

    it('the modal colour really appears most often in its vote list', () => {
        for (const p of sheet(g4)) {
            const m = p.prompt.match(/Starter: (.+)\. The most popular colour is __/);
            if (m) {
                const choices = [...m[1].matchAll(/chose (\w+)/g)].map((x) => x[1]);
                const counts = choices.reduce((acc, c) => ({ ...acc, [c]: (acc[c] ?? 0) + 1 }), {} as Record<string, number>);
                const best = Math.max(...Object.values(counts));
                expect(counts[p.answer]).toBe(best);
            }
        }
    });
});

describe('statistics — Year 5 (mean, mode & range, AC9M5ST01-03)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g5)).toEqual([
            { prompt: 'Starter: The mode of 10, 15, 10, 10, 36 is __', answer: '10', id: 1, type: 'statistics' },
            { prompt: 'Starter: The mode of 28, 28, 39, 12, 28 is __', answer: '28', id: 2, type: 'statistics' },
            { prompt: 'Practice: The range of 21, 20, 39, 34, 32 is __', answer: '19', id: 3, type: 'statistics' },
            { prompt: 'Practice: The mean of 16, 8, 16, 8 is __', answer: '12', id: 4, type: 'statistics' },
            { prompt: 'Practice: The range of 37, 12, 13, 47, 50 is __', answer: '38', id: 5, type: 'statistics' },
            { prompt: 'Practice: The mean of 15, 13, 12, 24 is __', answer: '16', id: 6, type: 'statistics' },
            { prompt: 'Challenge: For 38, 27, 36, 27, the mean is __ and the range is __', answer: '32, 11', id: 7, type: 'statistics' },
            { prompt: 'Challenge: For 26, 25, 20, 25, the mean is __ and the range is __', answer: '24, 6', id: 8, type: 'statistics' }
        ]);
    });

    it('every printed mean is exact (sum = count × mean by construction)', () => {
        for (const p of sheet(g5)) {
            const m = p.prompt.match(/(?:Practice: The mean of|Challenge: For) ([\d, ]+?)(?: is __|, the mean is __)/);
            if (m) {
                const vals = m[1].split(', ').map(Number);
                const mean = Number(p.answer.split(', ')[0]);
                expect(vals.reduce((s, v) => s + v, 0)).toBe(vals.length * mean);
            }
        }
    });
});

describe('statistics — Year 6 (mean/median/range & totals, AC9M6ST01-03)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g6)).toEqual([
            { prompt: 'Starter: The mean of 48, 46, 51, 57, 53 is __', answer: '51', id: 1, type: 'statistics' },
            { prompt: 'Starter: The mean of 38, 33, 26, 39, 34 is __', answer: '34', id: 2, type: 'statistics' },
            { prompt: 'Practice: The median of 54, 23, 67, 12, 83 is __', answer: '54', id: 3, type: 'statistics' },
            { prompt: 'Practice: The range of 96, 47, 13, 80, 16 is __', answer: '83', id: 4, type: 'statistics' },
            { prompt: 'Practice: The range of 43, 20, 41, 27, 19 is __', answer: '24', id: 5, type: 'statistics' },
            { prompt: 'Practice: The range of 21, 52, 43, 17, 35 is __', answer: '35', id: 6, type: 'statistics' },
            { prompt: 'Challenge: The mean of 4 scores is 19. The total of the 4 scores is __', answer: '76', id: 7, type: 'statistics' },
            { prompt: 'Challenge: The mean of 5 scores is 21. The total of the 5 scores is __', answer: '105', id: 8, type: 'statistics' }
        ]);
    });

    it('the median answer is the middle value of the sorted distinct set', () => {
        const median = sheet(g6).find((p) => p.prompt.includes('median'));
        const vals = median!.prompt.match(/median of ([\d, ]+)/)![1].split(', ').map(Number);
        expect(median!.answer).toBe(String([...vals].sort((a, b) => a - b)[2]));
    });
});

describe('statistics — scaffolded learning sequence', () => {
    it('every Year 3..6 page prints 2 scaffold + 4 core + 2 stretch rows', () => {
        for (const grade of [g3, g4, g5, g6]) {
            const s = sheet(grade);
            expect(s.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(2);
            expect(s.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(s.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(2);
        }
    });
});
