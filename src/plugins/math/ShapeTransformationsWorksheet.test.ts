// Shape transformations are a separate Year-3 worksheet, not a change to the
// recognition bank in ShapesWorksheet.ts. Pin geometry AND answers: two
// different diagrams with the same prose must never collapse during sampling.
// Verification: npx vitest run <this file>; if the installed Windows shim
// resolves node_modules/node_modules/vitest, invoke the same runner directly:
// node ../../node_modules/vitest/vitest.mjs run <this file> (no shim edits).
import { arrayCreate, arrayEach, jsonStringify } from '@presource/core';
import { describe, expect, it } from 'vitest';
import {
    createRng, MATH_FRAMEWORK, generateDocument, generateSheet, getMathGradeConfig,
    seedFrom, type ShapePoint
} from '../../framework';
import {
    ShapeTransformationsWorksheet, shapeTransformationsSpec, transformShapePoints
} from './ShapeTransformationsWorksheet';

// This asymmetric outline includes the origin to pin negative-zero handling;
// SVG's y-axis points down, so clockwise turns use (-y, x), not (y, -x).
const INPUT: readonly ShapePoint[] = Object.freeze([
    Object.freeze([-3, -2] as const),
    Object.freeze([2, -2] as const),
    Object.freeze([-3, 1] as const),
    Object.freeze([0, 0] as const)
]);
const grade = getMathGradeConfig(3);
const seed = seedFrom([3, 'transformations', 0]);

describe('shape transformations — integer geometry', () => {
    it.each([
        { transform: 'original' as const, expected: [[-3, -2], [2, -2], [-3, 1], [0, 0]] },
        { transform: 'flip-vertical' as const, expected: [[3, -2], [-2, -2], [3, 1], [0, 0]] },
        { transform: 'flip-horizontal' as const, expected: [[-3, 2], [2, 2], [-3, -1], [0, 0]] },
        { transform: 'rotate-clockwise' as const, expected: [[2, -3], [2, 2], [-1, -3], [0, 0]] },
        { transform: 'rotate-anticlockwise' as const, expected: [[-2, 3], [-2, -2], [1, 3], [0, 0]] }
    ])('$transform preserves vertex order without mutating the source', ({ transform, expected }) => {
        expect(transformShapePoints(INPUT, transform)).toEqual(expected);
        expect(INPUT).toEqual([[-3, -2], [2, -2], [-3, 1], [0, 0]]);
    });

    it('four clockwise quarter turns restore the exact original outline', () => {
        // Initial variants are quarter-turns of the same base shape. Exact
        // integer coordinates avoid trig rounding and repeat-key drift.
        let points = INPUT;
        arrayEach(arrayCreate(4), () => {
            points = transformShapePoints(points, 'rotate-clockwise');
        });
        expect(points).toEqual(INPUT);
    });
});

describe('shape transformations — plugin contract and grade gate', () => {
    it('declares one spatial entry and five single-column diagram questions', () => {
        const plugin = ShapeTransformationsWorksheet(MATH_FRAMEWORK);
        expect({
            id: plugin.id,
            name: plugin.name,
            entries: plugin.entries,
            perPage: shapeTransformationsSpec.perPage,
            singleColumn: shapeTransformationsSpec.singleColumn,
            scope: shapeTransformationsSpec.scope(grade)
        }).toEqual({
            id: 'transformations',
            name: 'Shape Transformations Worksheet',
            entries: [{ id: 'transformations', label: 'Shape Transformations', icon: '↻', ariaLabel: 'Shape Transformations' }],
            perPage: 5,
            singleColumn: true,
            scope: 'flips & 90° turns'
        });
        const grades = arrayCreate(({ index }) => index <= 12 ? getMathGradeConfig(index) : undefined);
        expect(grades.map((config) => shapeTransformationsSpec.offered(config)))
            .toEqual([false, false, false, true, false, false, false, false, false, false, false, false, false]);
        expect(grades.map((config) => plugin.isOffered!(config)))
            .toEqual([false, false, false, true, false, false, false, false, false, false, false, false, false]);
    });

    it.each([0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12])('grade %i has no transformation document', (id) => {
        expect(generateDocument(shapeTransformationsSpec, getMathGradeConfig(id), seed, 2))
            .toEqual({ pages: [], total: 0 });
    });
});

describe('shape transformations — deterministic worksheets', () => {
    it('pins every prompt, answer, guide and option vertex on the first sheet', () => {
        // The full snapshot is intentional: a correct answer letter paired
        // with the wrong diagram is still a broken worksheet.
        const sheet = generateSheet(shapeTransformationsSpec, grade, seed);
        expect(sheet).toMatchSnapshot();
        expect(generateSheet(shapeTransformationsSpec, grade, seed)).toEqual(sheet);
    });

    it('continues one seeded stream across pages and preserves the first page', () => {
        const doc = generateDocument(shapeTransformationsSpec, grade, seed, 2);
        expect(doc.total).toBe(10);
        expect(doc.pages.map((page) => page.length)).toEqual([5, 5]);
        expect(doc.pages[0]).toEqual(generateSheet(shapeTransformationsSpec, grade, seed));
        expect(doc.pages.flat().map((problem) => problem.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(doc.pages[1]).toMatchSnapshot();
        expect(generateDocument(shapeTransformationsSpec, grade, seed, 3).pages.slice(0, 2)).toEqual(doc.pages);
    });

    it('preserves earlier pages even when an extended document exhausts the finite bank', () => {
        // Forty-eight questions fit nine pages (45) plus three of page ten;
        // page ten is the repeat tail.
        // A count-dependent sampling budget must not consume extra RNG draws
        // and change already-previewed repeats when a teacher adds page ten.
        // document.ts promises one continuous stream, not just a unique prefix.
        const nine = generateDocument(shapeTransformationsSpec, grade, seed, 9);
        const ten = generateDocument(shapeTransformationsSpec, grade, seed, 10);
        expect(nine.total).toBe(45);
        expect(ten.total).toBe(50);
        expect(ten.pages.slice(0, 9)).toEqual(nine.pages);
    });

    it('pins correct outlines for both mirror axes and both 90-degree directions', () => {
        // Assert independently specified vertices, not transformShapePoints
        // applied to the same input as the implementation under test. The
        // T2V prompt adds a second blank ("Is this a flip or a turn?") whose
        // answer part is pinned alongside the letter.
        const problems = shapeTransformationsSpec.generate(createRng(seed), grade.caps, 48);
        const prompts = [
            'Flip triangle 1 left to right across the dashed vertical line. Which option matches? __ Is this a flip or a turn? __',
            'Flip triangle 1 top to bottom across the dashed horizontal line. Which option matches? __ Is this a flip or a turn? __',
            'Rotate triangle 1 90° clockwise (a quarter turn right) around the dot. Which option matches? __ Is this a flip or a turn? __',
            'Rotate triangle 1 90° anticlockwise (a quarter turn left) around the dot. Which option matches? __ Is this a flip or a turn? __'
        ];
        expect(prompts.map((prompt) => {
            const problem = problems.find((item) => item.prompt === prompt)!;
            const figure = problem.shapeTransformation!;
            // The comma-separated answer covers BOTH blanks: letter, move type.
            const [letter, moveType] = problem.answer.split(', ');
            expect(moveType).toBe(figure.guide === 'centre' ? 'turn' : 'flip');
            return {
                prompt: problem.prompt,
                original: figure.original,
                guide: figure.guide,
                correct: figure.options.find((option) => option.label === letter)!.points
            };
        })).toEqual([
            { prompt: prompts[0], original: [[-3, -2], [2, -2], [-3, 1]], guide: 'vertical', correct: [[3, -2], [-2, -2], [3, 1]] },
            { prompt: prompts[1], original: [[-3, -2], [2, -2], [-3, 1]], guide: 'horizontal', correct: [[-3, 2], [2, 2], [-3, -1]] },
            { prompt: prompts[2], original: [[-3, -2], [2, -2], [-3, 1]], guide: 'centre', correct: [[2, -3], [2, 2], [-1, -3]] },
            { prompt: prompts[3], original: [[-3, -2], [2, -2], [-3, 1]], guide: 'centre', correct: [[-2, 3], [-2, -2], [1, 3]] }
        ]);
    });

    it('every answer names a real option letter AND the correct move type', () => {
        // The connected-task answer is "letter, flip|turn": the letter must
        // be one of the printed A-D options and the move type must match the
        // printed guide (dashed line = flip, dot = turn) for EVERY question.
        const problems = shapeTransformationsSpec.generate(createRng(seed), grade.caps, 60);
        for (const problem of problems) {
            const [letter, moveType] = problem.answer.split(', ');
            const figure = problem.shapeTransformation!;
            expect(['A', 'B', 'C', 'D']).toContain(letter);
            expect(moveType).toBe(figure.guide === 'centre' ? 'turn' : 'flip');
            expect(problem.prompt.endsWith('Which option matches? __ Is this a flip or a turn? __')).toBe(true);
        }
    });

    it('deals all 48 distinct questions before repeating and never offers identical outlines', () => {
        // Compare unordered vertex sets so a reflected polygon with reversed
        // winding cannot masquerade as a different candidate. The curated
        // asymmetric shapes must give four visually distinct A–D choices.
        const problems = shapeTransformationsSpec.generate(createRng(seed), grade.caps, 60);
        expect(problems.length).toBe(60);
        expect(new Set(problems.map((problem) => problem.prompt)).size).toBe(48);
        expect(new Set(problems.slice(0, 48).map((problem) => problem.prompt)).size).toBe(48);
        const fourPerQuestion = arrayCreate(({ index }) => index < 60 ? 4 : undefined);
        expect(problems.map((problem) => new Set(problem.shapeTransformation!.options.map((option) =>
            jsonStringify(option.points.map((point) => jsonStringify(point)).sort())
        )).size)).toEqual(fourPerQuestion);
        expect(problems.map((problem) => problem.shapeTransformation!.options.map((option) => option.label)))
            .toEqual(arrayCreate(({ index }) => index < 60 ? ['A', 'B', 'C', 'D'] : undefined));
    });

    it('pins a new refresh while leaving count and zero-count behavior deterministic', () => {
        const refreshed = generateSheet(shapeTransformationsSpec, grade, seedFrom([3, 'transformations', 1]));
        expect(refreshed).toMatchSnapshot();
        expect(refreshed).not.toEqual(generateSheet(shapeTransformationsSpec, grade, seed));
        expect(shapeTransformationsSpec.generate(createRng(seed), grade.caps, 0)).toEqual([]);
    });
});
