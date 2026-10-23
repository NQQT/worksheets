// Unit tests for the SHAPES & ATTRIBUTES worksheet plugin (T2V redesign).
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Prep does not offer the extension types.
//
// T2V additions pinned below: six large single-column items (was sixteen
// two-column), the SHADE act ("Shade the {solid}." over three printed
// candidates), the JUSTIFY item (tick a true/false corner statement, then
// count a second printed shape's corners), an inline answer blank on every
// multiple-choice item, and answers that cover every printed blank.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, createRng } from '../../framework';
import { shapesSpec } from './ShapesWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);

// Independent copy of the attribute facts the answers must match (the
// generator's own catalogue is private; these are the V8 curriculum facts).
const CORNERS: Record<string, number> = { circle: 0, oval: 0, triangle: 3, square: 4, rectangle: 4, hexagon: 6 };
const SIDES: Record<string, number> = { circle: 0, oval: 0, triangle: 3, square: 4, rectangle: 4, hexagon: 6 };
const FLAT_FACES: Record<string, number> = { cube: 6, prism: 6, pyramid: 4, cylinder: 2, cone: 1, sphere: 0 };
const ALL_FLAT = ['cube', 'prism', 'pyramid'];

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(shapesSpec, grade, seedFrom([grade.id, shapesSpec.id, 0]));
}

const blanks = (prompt: string) => (prompt.match(/__/g) ?? []).length;

describe('shapes plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, reduced page size and roomy layout', () => {
        expect(shapesSpec.id).toBe('shapes');
        expect(shapesSpec.label).toBe('Shapes & Attributes');
        expect(shapesSpec.icon).toBe('△');
        // Five single-column items: three shape cards + wrapped prose need
        // the room (T3M3 — see plugins/layout-capacity.test.ts).
        expect(shapesSpec.perPage).toBe(5);
        expect(shapesSpec.singleColumn).toBe(true);
    });

    it('describes its numeric scope', () => {
        expect(shapesSpec.scope(g1)).toBe('2-D & 3-D shapes');
    });
});

describe('shapes — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(5);
    });
});

describe('shapes — Year 1 (everyday 2-D + 3-D set)', () => {
    it('matches the exact sheet (2-D sides/corners + 3-D flat faces)', () => {
        const s = sheet(g1);
        // Every problem carries its figure list (framework/ShapeFigure.tsx
        // draws each named 2-D/3-D shape; option order stays the prompt order).
        expect(s).toEqual([
            {"prompt":"Which of these 3-D objects has only flat faces? (cube, cylinder, sphere) __","answer":"cube","shapes":[{"name":"cube","kind":"3d"},{"name":"cylinder","kind":"3d"},{"name":"sphere","kind":"3d"}],"id":1,"type":"shapes"},
            {"prompt":"Which of these 3-D objects has only flat faces? (cube, sphere, cylinder) __","answer":"cube","shapes":[{"name":"cube","kind":"3d"},{"name":"sphere","kind":"3d"},{"name":"cylinder","kind":"3d"}],"id":2,"type":"shapes"},
            {"prompt":"Count the sides on the shape. How many sides does a triangle have? __","answer":"3","shapes":[{"name":"triangle","kind":"2d"}],"id":3,"type":"shapes"},
            {"prompt":"Count the corners. How many corners does a rectangle have? __","answer":"4","shapes":[{"name":"rectangle","kind":"2d"}],"id":4,"type":"shapes"},
            {"prompt":"Look at the solid. How many flat faces does a sphere have? __","answer":"0","shapes":[{"name":"sphere","kind":"3d"}],"id":5,"type":"shapes"},
        ]);
        // Year 1's shape set has exactly one all-flat 3-D object (the cube), so
        // every "only flat faces" answer in a Y1 sheet must be the cube.
        for (const p of s) {
            if (p.prompt.startsWith('Which of these 3-D')) expect(p.answer).toBe('cube');
        }
    });
});

describe('shapes — Year 2 (adds hexagon, prism, pyramid, cone)', () => {
    it('matches the exact sheet (including the shade act and the justify item)', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"Count the sides on the shape. How many sides does a rectangle have? __","answer":"4","shapes":[{"name":"rectangle","kind":"2d"}],"id":1,"type":"shapes"},
            {"prompt":"Which of these 3-D objects has only flat faces? (pyramid, cylinder, cone) __","answer":"pyramid","shapes":[{"name":"pyramid","kind":"3d"},{"name":"cylinder","kind":"3d"},{"name":"cone","kind":"3d"}],"id":2,"type":"shapes"},
            {"prompt":"Shade the sphere.","answer":"sphere","shapes":[{"name":"sphere","kind":"3d"},{"name":"cube","kind":"3d"},{"name":"cone","kind":"3d"}],"id":3,"type":"shapes"},
            {"prompt":"Tick Yes or No: \"Oval has 0 corners.\" __ Now count: how many corners does a rectangle have? __","answer":"Yes, 4","shapes":[{"name":"oval","kind":"2d"},{"name":"rectangle","kind":"2d"}],"id":4,"type":"shapes"},
            {"prompt":"Which 2-D shape has 0 corners? (triangle, oval, rectangle) __","answer":"oval","shapes":[{"name":"triangle","kind":"2d"},{"name":"oval","kind":"2d"},{"name":"rectangle","kind":"2d"}],"id":5,"type":"shapes"},
        ]);
        // "Only flat faces" answers are exactly the non-curved 3-D solids, and
        // the printed distractors never repeat the property: exactly ONE
        // shown candidate has only flat faces (the answer), so the question
        // is unambiguous on the sheet (the cube/prism/pyramid set needs a
        // curved-surface distractor pool — see ShapesWorksheet.ts).
        for (const p of s) {
            if (p.prompt.startsWith('Which of these 3-D')) {
                const allFlatShown = p.shapes!.filter((sh) => ALL_FLAT.includes(sh.name));
                expect(allFlatShown.map((sh) => sh.name)).toEqual([p.answer]);
            }
        }
    });
});

describe('shapes — task soundness across a long stream', () => {
    const problems = shapesSpec.generate(createRng(seedFrom([2, 'shapes', 0])), g2.caps, 300);

    it('every answer covers exactly the printed blanks', () => {
        // The shade act has no inline blank (the student shades the printed
        // candidate itself), so its single answer part pairs with 0 blanks;
        // everything else pairs 1:1 or 2:2.
        const bad = problems.filter((p) => {
            const parts = p.answer.split(', ').length;
            const n = blanks(p.prompt);
            return p.prompt.startsWith('Shade the') ? parts !== 1 : parts !== n;
        });
        expect(bad.map((p) => p.prompt)).toEqual([]);
    });

    it('attribute counts match the curriculum facts of the printed shape', () => {
        for (const p of problems) {
            const sides = p.prompt.match(/How many sides does a[n]? (\w+) have\?/);
            if (sides) { expect(p.answer).toBe(`${SIDES[sides[1]]}`); expect(p.shapes![0].name).toBe(sides[1]); continue; }
            const corners = p.prompt.match(/^Count the corners\. How many corners does a[n]? (\w+) have\?/);
            if (corners) { expect(p.answer).toBe(`${CORNERS[corners[1]]}`); continue; }
            const faces = p.prompt.match(/How many flat faces does a[n]? (\w+) have\?/);
            if (faces) { expect(p.answer).toBe(`${FLAT_FACES[faces[1]]}`); }
        }
    });

    it('shade acts name a printed candidate and nothing else', () => {
        const shades = problems.filter((p) => p.prompt.startsWith('Shade the'));
        expect(shades.length).toBeGreaterThan(0);
        for (const p of shades) {
            const name = p.prompt.match(/Shade the (\w+)\./)![1];
            expect(p.answer).toBe(name);
            expect(p.shapes!.map((sh) => sh.name)).toContain(name);
            expect(p.shapes!.length).toBe(3);
        }
    });

    it('justify items tick the statement correctly and count the second shape', () => {
        const justifies = problems.filter((p) => p.prompt.startsWith('Tick Yes or No'));
        expect(justifies.length).toBeGreaterThan(0);
        for (const p of justifies) {
            const m = p.prompt.match(/"(\w+) has (\d+) corners\." __ Now count: how many corners does a[n]? (\w+) have\?/)!;
            const [, named, stated, other] = m;
            const truth = CORNERS[named.toLowerCase()] === Number(stated) ? 'Yes' : 'No';
            const [tick, corners] = p.answer.split(', ');
            expect(tick).toBe(truth);
            expect(corners).toBe(`${CORNERS[other]}`);
            // Both printed shapes appear in the figure list.
            expect(p.shapes!.map((sh) => sh.name)).toEqual([named.toLowerCase(), other]);
        }
    });

    it('multiple-choice questions have exactly one correct printed candidate', () => {
        for (const p of problems) {
            const mc2d = p.prompt.match(/^Which 2-D shape has (\d+) corners\? \(([^)]+)\) __$/);
            if (mc2d) {
                const names = mc2d[2].split(', ');
                const correct = names.filter((n) => CORNERS[n] === Number(mc2d[1]));
                expect(correct).toEqual([p.answer]);
                expect(p.shapes!.map((sh) => sh.name)).toEqual(names);
            }
            const mc3d = p.prompt.match(/^Which of these 3-D objects has only flat faces\? \(([^)]+)\) __$/);
            if (mc3d) {
                const names = mc3d[1].split(', ');
                expect(names.filter((n) => ALL_FLAT.includes(n))).toEqual([p.answer]);
                expect(p.shapes!.map((sh) => sh.name)).toEqual(names);
            }
        }
    });

    it('pins the finite question-space capacities (128 Y1 / 276 Y2)', () => {
        // The shared capacity suite measures at perPage × 100; these are the
        // T2V space sizes (they moved with the redesign — reported upward).
        const y1 = shapesSpec.generate(createRng(seedFrom([1, 'shapes', 0])), g1.caps, 600);
        expect(new Set(y1.map((p) => p.prompt)).size).toBe(128);
        expect(new Set(y1.slice(0, 128).map((p) => p.prompt)).size).toBe(128);
        expect(new Set(problems.map((p) => p.prompt)).size).toBeLessThanOrEqual(276);
        const y2 = shapesSpec.generate(createRng(seedFrom([2, 'shapes', 0])), g2.caps, 600);
        expect(new Set(y2.map((p) => p.prompt)).size).toBe(276);
    });
});
