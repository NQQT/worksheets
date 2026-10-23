// Unit tests for the DATA & TALLY worksheet plugin (T2V redesign).
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Prep does not offer the extension types.
//
// T2V additions pinned below: SIX single-column items (was ten two-column);
// CONNECTED tasks (count the tally THEN split into tens/ones; scale the
// picture graph THEN compare with 10; name the column-graph winner THEN the
// difference); the pictorial ASCII runs ("||||/", "★★★★") are GONE from the
// prompts — the SVG figure is the only picture; and every multi-part answer
// covers every printed blank.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, createRng } from '../../framework';
import { dataSpec } from './DataWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(dataSpec, grade, seedFrom([grade.id, dataSpec.id, 0]));
}

const blanks = (prompt: string) => (prompt.match(/__/g) ?? []).length;

describe('data plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, reduced page size and roomy layout', () => {
        expect(dataSpec.id).toBe('data');
        expect(dataSpec.label).toBe('Data & Tally');
        expect(dataSpec.icon).toBe('▥');
        // Four single-column items: full-size diagram + two-part question
        // (T3M3 — see plugins/layout-capacity.test.ts).
        expect(dataSpec.perPage).toBe(4);
        expect(dataSpec.singleColumn).toBe(true);
    });

    it('describes its numeric scope', () => {
        expect(dataSpec.scope(g1)).toBe('tallies & simple graphs');
    });
});

describe('data — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(4);
    });
});

describe('data — Year 1 (tallies, picture & column graphs)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g1);
        // Every problem carries its figure data (framework/DataDiagram.tsx
        // draws the marks/stars/bars; the prompts only refer to them).
        expect(s).toEqual([
            {"prompt":"Count the tallies below. There are __ in all. That is __ tens and __ ones.","answer":"20, 2 tens and 0 ones","data":{"kind":"tally","total":20},"id":1,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Kai's bar is 9 squares tall and Mia's bar is 8 squares tall. Who got MORE votes? __ How many more votes did Kai get? __","answer":"Kai, 1","data":{"kind":"column","leftName":"Kai","rightName":"Mia","left":9,"right":8},"id":2,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 2 cookies. Count the stars below. How many cookies do they show? __ Is that more than 10 cookies? Yes or No: __","answer":"12, Yes","data":{"kind":"picture","stars":6},"id":3,"type":"data"},
            {"prompt":"In a picture graph, 1 star = 1 crayon. Count the stars below. How many crayons do they show? __ Is that more than 10 crayons? Yes or No: __","answer":"6, No","data":{"kind":"picture","stars":6},"id":4,"type":"data"},
        ]);
    });
});

describe('data — Year 2 (bigger counts to 40)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"In a picture graph, 1 star = 1 car. Count the stars below. How many cars do they show? __ Is that more than 10 cars? Yes or No: __","answer":"4, No","data":{"kind":"picture","stars":4},"id":1,"type":"data"},
            {"prompt":"Count the tallies below. There are __ in all. That is __ tens and __ ones.","answer":"7, 0 tens and 7 ones","data":{"kind":"tally","total":7},"id":2,"type":"data"},
            {"prompt":"In a column graph, each square is 1 vote. Mia's bar is 6 squares tall and Leo's bar is 5 squares tall. Who got MORE votes? __ How many more votes did Mia get? __","answer":"Mia, 1","data":{"kind":"column","leftName":"Mia","rightName":"Leo","left":6,"right":5},"id":3,"type":"data"},
            {"prompt":"Count the tallies below. There are __ in all. That is __ tens and __ ones.","answer":"39, 3 tens and 9 ones","data":{"kind":"tally","total":39},"id":4,"type":"data"},
        ]);
    });
});

describe('data — task soundness across a long stream', () => {
    const problems = dataSpec.generate(createRng(seedFrom([2, 'data', 0])), g2.caps, 200);

    it('every item carries a figure, an answer for every blank, and no pictorial ASCII', () => {
        for (const p of problems) {
            expect(p.data).toBeDefined();
            // Every printed blank is covered by the answer. Tally answers
            // pack three values into two comma parts ("20, 2 tens and 0
            // ones"), so count values across ", " AND " and " separators.
            expect(p.answer.split(/,\s|\s+and\s+/).length).toBe(blanks(p.prompt));
            // R2: the SVG figure is the ONLY picture — no tally bars or star
            // glyphs leak back into the printed prose.
            expect(p.prompt).not.toMatch(/[|★]/);
        }
    });

    it('tally answers equal the figure total and split into exact tens/ones', () => {
        const tallies = problems.filter((p) => p.data!.kind === 'tally');
        expect(tallies.length).toBeGreaterThan(0);
        for (const p of tallies) {
            const total = (p.data as { kind: 'tally'; total: number }).total;
            const [counted, split] = p.answer.split(', ');
            expect(Number(counted)).toBe(total);
            expect(total).toBeGreaterThanOrEqual(3);
            expect(total).toBeLessThanOrEqual(g2.caps.dataCap);
            expect(split).toBe(
                `${Math.floor(total / 10) === 1 ? '1 ten' : `${Math.floor(total / 10)} tens`} and ${total % 10 === 1 ? '1 one' : `${total % 10} ones`}`
            );
        }
    });

    it('picture answers scale the printed stars exactly and judge >10 correctly', () => {
        const pictures = problems.filter((p) => p.data!.kind === 'picture');
        expect(pictures.length).toBeGreaterThan(0);
        for (const p of pictures) {
            const stars = (p.data as { kind: 'picture'; stars: number }).stars;
            const u = Number(p.prompt.match(/1 star = (?:1 \w+|(\d+) \w+)\./)![1] ?? 1);
            const [shown, more] = p.answer.split(', ');
            expect(Number(shown)).toBe(stars * u);
            expect(more).toBe(Number(shown) > 10 ? 'Yes' : 'No');
        }
    });

    it('column answers name the taller bar and the exact positive difference', () => {
        const columns = problems.filter((p) => p.data!.kind === 'column');
        expect(columns.length).toBeGreaterThan(0);
        for (const p of columns) {
            const fig = p.data as { kind: 'column'; leftName: string; rightName: string; left: number; right: number };
            const [winner, difference] = p.answer.split(', ');
            expect(fig.left).toBeGreaterThan(fig.right); // prompt names n1 as taller
            expect(winner).toBe(fig.leftName);
            expect(Number(difference)).toBe(fig.left - fig.right);
            expect(Number(difference)).toBeGreaterThan(0);
        }
    });

    it('stays deterministic', () => {
        const again = dataSpec.generate(createRng(seedFrom([2, 'data', 0])), g2.caps, 200);
        expect(again).toEqual(problems);
    });
});
