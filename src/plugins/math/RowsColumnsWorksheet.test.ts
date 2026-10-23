// Unit tests for the ROWS & COLUMNS worksheet plugin (the multiplication
// foundation sheet for Years 1–2, T2V redesign).
//
// The generator is DETERMINISTIC: the whole sheet is pinned here to exact
// expected values from the same seed the framework uses (seedFrom([grade.id,
// spec.id, 0])). Answers are PRIVATE problem data — the pins pair every
// answer with its figure so a re-rolled sheet or a mismatched grid is caught.
//
// T2V additions pinned below: the 'look' form (report rows, columns AND the
// total from the printed grid — three blanks, three answer parts), EVERY
// item carrying its grid figure (six SVGs on a six-item page), and the
// composite sampling key that keeps identical 'look' sentences over
// different grids distinct.
//
// Verification: npx vitest run <this file>; if the installed Windows npm shim
// resolves the hoisted runner at the wrong depth, invoke it directly:
// node ../../node_modules/vitest/vitest.mjs run <this file>.
import { describe, it, expect } from 'vitest';
import {
    createRng, generateDocument, generateSheet, getMathGradeConfig, seedFrom
} from '../../framework';
import { rowsColumnsSpec } from './RowsColumnsWorksheet';

const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);
const seed1 = seedFrom([1, rowsColumnsSpec.id, 0]);
const seed2 = seedFrom([2, rowsColumnsSpec.id, 0]);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(rowsColumnsSpec, grade, seedFrom([grade.id, rowsColumnsSpec.id, 0]));
}

// The sheet's answers are checkable against each figure INDEPENDENTLY of the
// generator: the relational "how many rows?" / "how many columns?" forms
// answer the missing DIMENSION, the 'look' form answers rows, columns AND
// the total (comma-separated), and every other form answers r × c.
function expectedAnswer(problem: { prompt: string; answer: string; rowsColumns: { rows: number; cols: number } }) {
    const { rows, cols } = problem.rowsColumns;
    if (problem.prompt.startsWith('Look at the grid.')) return `${rows}, ${cols}, ${rows * cols}`;
    if (problem.prompt.includes('How many rows?')) return `${rows}`;
    if (problem.prompt.includes('How many columns?')) return `${cols}`;
    return `${rows * cols}`;
}

// Number of printed "__" blanks.
const blanks = (prompt: string) => (prompt.match(/__/g) ?? []).length;

describe('rows & columns — declarative spec', () => {
    it('declares its sidebar entry, page size and single-column layout', () => {
        expect(rowsColumnsSpec.id).toBe('rowscolumns');
        expect(rowsColumnsSpec.label).toBe('Rows & Columns');
        expect(rowsColumnsSpec.icon).toBe('▦');
        expect(rowsColumnsSpec.perPage).toBe(6);
        expect(rowsColumnsSpec.singleColumn).toBe(true);
    });

    it('offers the counting-bridge years only (Y1 and Y2) and scopes them apart', () => {
        const offered = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            .map((id) => getMathGradeConfig(id))
            .map((grade) => rowsColumnsSpec.offered(grade));
        expect(offered).toEqual([false, true, true, false, false, false, false, false, false, false, false, false, false]);
        // Year 1 stays below multiplication (repeated addition); Year 2's
        // multCap > 0 switches the scope line to the product form.
        expect(rowsColumnsSpec.scope(g1)).toBe('rows, columns & repeated addition');
        expect(rowsColumnsSpec.scope(g2)).toBe('rows, columns & multiplication');
    });
});

describe('rows & columns — Year 1 (within 20, no product form)', () => {
    it('matches the exact seeded sheet (prompts, private answers and grids)', () => {
        expect(sheet(g1)).toEqual([
            { "prompt": "This grid has 2 columns and 8 squares in all. How many rows? __", "answer": "4", "rowsColumns": { "rows": 4, "cols": 2 }, "id": 1, "type": "rowscolumns" },
            { "prompt": "This grid has 3 columns and 3 squares in all. How many rows? __", "answer": "1", "rowsColumns": { "rows": 1, "cols": 3 }, "id": 2, "type": "rowscolumns" },
            { "prompt": "How many squares are in a grid of 3 rows and 2 columns? __", "answer": "6", "rowsColumns": { "rows": 3, "cols": 2 }, "id": 3, "type": "rowscolumns" },
            { "prompt": "A grid of 2 rows and 1 column: 1 + 1 = __", "answer": "2", "rowsColumns": { "rows": 2, "cols": 1 }, "id": 4, "type": "rowscolumns" },
            { "prompt": "Look at the grid. __ rows, __ columns, __ squares in all.", "answer": "1, 5, 5", "rowsColumns": { "rows": 1, "cols": 5 }, "id": 5, "type": "rowscolumns" },
            { "prompt": "Look at the grid. __ rows, __ columns, __ squares in all.", "answer": "1, 3, 3", "rowsColumns": { "rows": 1, "cols": 3 }, "id": 6, "type": "rowscolumns" }
        ]);
        // Every printed answer agrees with its grid (independent check — the
        // pins above could drift if a figure were changed under a prompt).
        expect(sheet(g1).map(expectedAnswer)).toEqual(
            sheet(g1).map(({ answer }) => answer)
        );
    });

    it('every item prints its grid and covers every blank', () => {
        // Six illustrated items = six grid SVGs on the single-column page
        // (the shared RowsColumnsDiagram draws one <svg> per figure).
        const s = sheet(g1);
        expect(s.every((p) => p.rowsColumns !== undefined)).toBe(true);
        expect(s.every((p) => blanks(p.prompt) === p.answer.split(', ').length)).toBe(true);
    });

    it('continues one seeded stream across pages with stable earlier pages', () => {
        const doc = generateDocument(rowsColumnsSpec, g1, seed1, 2);
        expect(doc.total).toBe(12);
        expect(doc.pages.map((page) => page.length)).toEqual([6, 6]);
        // Page 1 of a 2-page run is byte-identical to the single-page sheet.
        expect(doc.pages[0]).toEqual(sheet(g1));
        expect(doc.pages[1]).toEqual([
            { "prompt": "How many squares are in a grid of 2 rows and 1 column? __", "answer": "2", "rowsColumns": { "rows": 2, "cols": 1 }, "id": 7, "type": "rowscolumns" },
            { "prompt": "Look at the grid. __ rows, __ columns, __ squares in all.", "answer": "3, 4, 12", "rowsColumns": { "rows": 3, "cols": 4 }, "id": 8, "type": "rowscolumns" },
            { "prompt": "Look at the grid. __ rows, __ columns, __ squares in all.", "answer": "4, 1, 4", "rowsColumns": { "rows": 4, "cols": 1 }, "id": 9, "type": "rowscolumns" },
            { "prompt": "This grid has 1 row and 4 squares in all. How many columns? __", "answer": "4", "rowsColumns": { "rows": 1, "cols": 4 }, "id": 10, "type": "rowscolumns" },
            { "prompt": "Look at the grid. __ rows, __ columns, __ squares in all.", "answer": "4, 4, 16", "rowsColumns": { "rows": 4, "cols": 4 }, "id": 11, "type": "rowscolumns" },
            { "prompt": "Look at the grid. __ rows, __ columns, __ squares in all.", "answer": "1, 4, 4", "rowsColumns": { "rows": 1, "cols": 4 }, "id": 12, "type": "rowscolumns" }
        ]);
        expect(doc.pages.flat().map((problem) => problem.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        // Adding a third page must not re-roll the first two (document.ts
        // promises one continuous stream, not just a unique prefix).
        expect(generateDocument(rowsColumnsSpec, g1, seed1, 3).pages.slice(0, 2)).toEqual(doc.pages);
        expect(generateSheet(rowsColumnsSpec, g1, seed1)).toEqual(sheet(g1));
    });

    it('deals all 91 distinct Year-1 questions before repeating', () => {
        // Bank = 19 look + 19 count + 19 missing-row + 19 missing-column
        // (4×5 grids minus the trivial 1×1) + 15 repeated-addition forms
        // (rows ≥ 2); Y1 has no product form (multCap 0). 91 < 100, so the
        // 100th question repeats. Distinctness is keyed on prompt + grid
        // (the 'look' sentence repeats across grids by design).
        const keyOf = (p: { prompt: string; rowsColumns?: { rows: number; cols: number } }) =>
            `${p.prompt}|${p.rowsColumns!.rows}x${p.rowsColumns!.cols}`;
        const problems = rowsColumnsSpec.generate(createRng(seed1), g1.caps, 100);
        expect(problems.length).toBe(100);
        expect(new Set(problems.slice(0, 91).map(keyOf)).size).toBe(91);
        expect(new Set(problems.map(keyOf)).size).toBe(91);
        // Every relational form answers its OWN missing dimension and every
        // form's answer matches its figure independently.
        expect(problems.map(expectedAnswer)).toEqual(problems.map((p) => p.answer));
        // Grids stay modest: at most 4 rows × 5 columns, totals inside 20.
        expect(problems.every((p) => p.rowsColumns!.rows * p.rowsColumns!.cols <= 20)).toBe(true);
        expect(problems.every((p) => p.rowsColumns!.rows <= 4)).toBe(true);
    });

    it('pins a refreshed seed and the zero-count guard', () => {
        const refreshed = generateSheet(rowsColumnsSpec, g1, seedFrom([1, rowsColumnsSpec.id, 1]));
        expect(refreshed).toEqual([
            { "prompt": "This grid has 3 columns and 3 squares in all. How many rows? __", "answer": "1", "rowsColumns": { "rows": 1, "cols": 3 }, "id": 1, "type": "rowscolumns" },
            { "prompt": "How many squares are in a grid of 3 rows and 3 columns? __", "answer": "9", "rowsColumns": { "rows": 3, "cols": 3 }, "id": 2, "type": "rowscolumns" },
            { "prompt": "This grid has 3 columns and 12 squares in all. How many rows? __", "answer": "4", "rowsColumns": { "rows": 4, "cols": 3 }, "id": 3, "type": "rowscolumns" },
            { "prompt": "Look at the grid. __ rows, __ columns, __ squares in all.", "answer": "1, 3, 3", "rowsColumns": { "rows": 1, "cols": 3 }, "id": 4, "type": "rowscolumns" },
            { "prompt": "This grid has 5 columns and 20 squares in all. How many rows? __", "answer": "4", "rowsColumns": { "rows": 4, "cols": 5 }, "id": 5, "type": "rowscolumns" },
            { "prompt": "This grid has 2 columns and 2 squares in all. How many rows? __", "answer": "1", "rowsColumns": { "rows": 1, "cols": 2 }, "id": 6, "type": "rowscolumns" }
        ]);
        expect(refreshed).not.toEqual(sheet(g1));
        expect(rowsColumnsSpec.generate(createRng(seed1), g1.caps, 0)).toEqual([]);
        // Unoffered grades (Prep, Year 3+) build empty documents.
        for (const id of [0, 3, 7]) {
            expect(generateDocument(rowsColumnsSpec, getMathGradeConfig(id), seed1, 1)).toEqual({ pages: [], total: 0 });
        }
    });
});

describe('rows & columns — Year 2 (5 × 5 grids + the multiplication bridge)', () => {
    it('matches the exact seeded sheet including product and repeated forms', () => {
        expect(sheet(g2)).toEqual([
            { "prompt": "This grid has 2 columns and 10 squares in all. How many rows? __", "answer": "5", "rowsColumns": { "rows": 5, "cols": 2 }, "id": 1, "type": "rowscolumns" },
            { "prompt": "This grid has 2 columns and 8 squares in all. How many rows? __", "answer": "4", "rowsColumns": { "rows": 4, "cols": 2 }, "id": 2, "type": "rowscolumns" },
            { "prompt": "Look at the grid. __ rows, __ columns, __ squares in all.", "answer": "5, 3, 15", "rowsColumns": { "rows": 5, "cols": 3 }, "id": 3, "type": "rowscolumns" },
            { "prompt": "This grid has 2 columns and 2 squares in all. How many rows? __", "answer": "1", "rowsColumns": { "rows": 1, "cols": 2 }, "id": 4, "type": "rowscolumns" },
            { "prompt": "1 × 5 = __", "answer": "5", "rowsColumns": { "rows": 1, "cols": 5 }, "id": 5, "type": "rowscolumns" },
            { "prompt": "This grid has 4 rows and 4 squares in all. How many columns? __", "answer": "1", "rowsColumns": { "rows": 4, "cols": 1 }, "id": 6, "type": "rowscolumns" }
        ]);
        expect(sheet(g2).map(expectedAnswer)).toEqual(sheet(g2).map(({ answer }) => answer));
    });

    it('deals all 140 distinct Year-2 questions before repeating, inside the 10 operand table', () => {
        // Bank = 24×4 (look / count / missing-row / missing-column, 5×5
        // minus 1×1) + 20 repeated (rows ≥ 2) + 24 product (cols ≤ multCap
        // 10, always true) = 140. A 9×9-style grid is impossible: cols never
        // exceed 5.
        const keyOf = (p: { prompt: string; rowsColumns?: { rows: number; cols: number } }) =>
            `${p.prompt}|${p.rowsColumns!.rows}x${p.rowsColumns!.cols}`;
        const problems = rowsColumnsSpec.generate(createRng(seed2), g2.caps, 145);
        expect(problems.length).toBe(145);
        expect(new Set(problems.slice(0, 140).map(keyOf)).size).toBe(140);
        expect(new Set(problems.map(keyOf)).size).toBe(140);
        expect(problems.every((p) => p.rowsColumns!.cols <= 5 && p.rowsColumns!.rows <= 5)).toBe(true);
        // The bridge form prints simple products only (operands ≤ 10, the
        // grade's times-tables scope).
        expect(problems
            .filter((problem) => problem.prompt.includes('×'))
            .every((problem) => problem.rowsColumns!.rows * problem.rowsColumns!.cols <= 100)).toBe(true);
        expect(problems.map(expectedAnswer)).toEqual(problems.map((p) => p.answer));
    });

    it('continues page 2 from the same seeded stream', () => {
        const doc = generateDocument(rowsColumnsSpec, g2, seed2, 2);
        expect(doc.total).toBe(12);
        expect(doc.pages[0]).toEqual(sheet(g2));
        expect(doc.pages[1].slice(0, 3)).toEqual([
            { "prompt": "A grid of 5 rows and 1 column: 1 + 1 + 1 + 1 + 1 = __", "answer": "5", "rowsColumns": { "rows": 5, "cols": 1 }, "id": 7, "type": "rowscolumns" },
            { "prompt": "3 × 1 = __", "answer": "3", "rowsColumns": { "rows": 3, "cols": 1 }, "id": 8, "type": "rowscolumns" },
            { "prompt": "5 × 1 = __", "answer": "5", "rowsColumns": { "rows": 5, "cols": 1 }, "id": 9, "type": "rowscolumns" }
        ]);
    });
});
