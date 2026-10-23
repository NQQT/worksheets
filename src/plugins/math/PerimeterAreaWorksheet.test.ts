// Unit tests for the PERIMETER & AREA worksheet plugin (T4 expansion).
//
// Deterministic-generator strategy (see plugins/AdditionWorksheet.test.ts):
// the ENTIRE first page per offered grade is pinned exactly with the
// framework seed; tier counts are 2+4+2 on this 8-per-page sheet. Each row
// also pins its answer-privacy perimeterArea figure (types.ts
// PerimeterAreaFigure, drawn by framework/RectangleDiagram.tsx): given sides
// carry their printed number, the ASKED side is null (prints "?") and no
// answer is ever drawn into a figure.
//
// The figure-contract block re-derives every figure rule from the printed
// prompt across the WHOLE 100-page document per grade (same seed/ask as
// unique-sampling.test.ts), so a figure can never disagree with its question
// or leak an answer anywhere in the generated space.
import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, createRng } from '../../framework';
import { perimeterAreaSpec } from './PerimeterAreaWorksheet';

const g3 = getMathGradeConfig(3);
const g4 = getMathGradeConfig(4);
const g5 = getMathGradeConfig(5);
const g6 = getMathGradeConfig(6);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(perimeterAreaSpec, grade, seedFrom([grade.id, perimeterAreaSpec.id, 0]));
}

// The full 100-page document per offered grade (the unique-sampling ask),
// generated once at module scope from the same seed/inputs the capacity
// suite measures, so both suites observe identical documents.
const ASK = perimeterAreaSpec.perPage * 100; // 800 questions
const doc4 = perimeterAreaSpec.generate(createRng(seedFrom([g4.id, perimeterAreaSpec.id, 0])), g4.caps, ASK);
const doc5 = perimeterAreaSpec.generate(createRng(seedFrom([g5.id, perimeterAreaSpec.id, 0])), g5.caps, ASK);
const doc6 = perimeterAreaSpec.generate(createRng(seedFrom([g6.id, perimeterAreaSpec.id, 0])), g6.caps, ASK);

describe('perimeterarea plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(perimeterAreaSpec.id).toBe('perimeterarea');
        expect(perimeterAreaSpec.label).toBe('Perimeter & Area');
        expect(perimeterAreaSpec.icon).toBe('▭');
        expect(perimeterAreaSpec.perPage).toBe(8);
    });

    it('describes its year-tiered scope from the grade caps', () => {
        expect(perimeterAreaSpec.scope(g4)).toBe('perimeter & area by counting units (AC9M4M02)');
        expect(perimeterAreaSpec.scope(g5)).toBe('rectangle formulas & reverse problems (AC9M5M02)');
        expect(perimeterAreaSpec.scope(g6)).toBe('area formulas & metric links (AC9M6M01-02)');
    });

    it('is gated to Years 4..6 (areaSideCap join; hidden on Y3 and Y7)', () => {
        expect(perimeterAreaSpec.offered(g3)).toBe(false);
        expect(perimeterAreaSpec.offered(g4)).toBe(true);
        expect(perimeterAreaSpec.offered(g5)).toBe(true);
        expect(perimeterAreaSpec.offered(g6)).toBe(true);
        expect(perimeterAreaSpec.offered(getMathGradeConfig(7))).toBe(false);
    });
});

describe('perimeterarea — Year 4 (counting units, AC9M4M02)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g4)).toEqual([
            { prompt: 'Starter: A rectangle is 10 cm long and 7 cm wide. Its perimeter is __ cm', answer: '34', perimeterArea: { kind: 'rectangle', length: 10, width: 7, unit: 'cm' }, id: 1, type: 'perimeterarea' },
            { prompt: 'Starter: A rectangle is 13 cm long and 4 cm wide. Its perimeter is __ cm', answer: '34', perimeterArea: { kind: 'rectangle', length: 13, width: 4, unit: 'cm' }, id: 2, type: 'perimeterarea' },
            { prompt: 'Practice: A 5 cm by 3 cm rectangle is covered with 1 cm² squares. It needs __ squares', answer: '15', perimeterArea: { kind: 'rectangle', length: 5, width: 3, unit: 'cm', grid: true }, id: 3, type: 'perimeterarea' },
            { prompt: 'Practice: A square has sides of 3 cm. Its perimeter is __ cm and its area is __ cm²', answer: '12, 9', perimeterArea: { kind: 'rectangle', length: 3, width: 3, unit: 'cm' }, id: 4, type: 'perimeterarea' },
            { prompt: 'Practice: A 6 cm by 3 cm rectangle is covered with 1 cm² squares. It needs __ squares', answer: '18', perimeterArea: { kind: 'rectangle', length: 6, width: 3, unit: 'cm', grid: true }, id: 5, type: 'perimeterarea' },
            { prompt: 'Practice: A square has sides of 7 cm. Its perimeter is __ cm and its area is __ cm²', answer: '28, 49', perimeterArea: { kind: 'rectangle', length: 7, width: 7, unit: 'cm' }, id: 6, type: 'perimeterarea' },
            { prompt: "Challenge: A rectangle's perimeter is 20 cm and its length is 8 cm. Its width is __ cm", answer: '2', perimeterArea: { kind: 'rectangle', length: 8, width: null, unit: 'cm' }, id: 7, type: 'perimeterarea' },
            { prompt: "Challenge: A rectangle's area is 63 cm² and its width is 7 cm. Its length is __ cm", answer: '9', perimeterArea: { kind: 'rectangle', length: null, width: 7, unit: 'cm' }, id: 8, type: 'perimeterarea' }
        ]);
    });
});

describe('perimeterarea — Year 5 (formulas & reverse work, AC9M5M02)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g5)).toEqual([
            { prompt: 'Starter: A 92 m by 60 m rectangle has perimeter __ m', answer: '304', perimeterArea: { kind: 'rectangle', length: 92, width: 60, unit: 'm' }, id: 1, type: 'perimeterarea' },
            { prompt: 'Starter: An 89 m by 63 m rectangle has area __ m²', answer: '5607', perimeterArea: { kind: 'rectangle', length: 89, width: 63, unit: 'm' }, id: 2, type: 'perimeterarea' },
            { prompt: "Practice: A rectangle's area is 198 m² and its width is 6 m. Its length is __ m", answer: '33', perimeterArea: { kind: 'rectangle', length: null, width: 6, unit: 'm' }, id: 3, type: 'perimeterarea' },
            { prompt: "Practice: A rectangle's perimeter is 256 m and its length is 79 m. Its width is __ m", answer: '49', perimeterArea: { kind: 'rectangle', length: 79, width: null, unit: 'm' }, id: 4, type: 'perimeterarea' },
            { prompt: "Practice: A rectangle's area is 1071 m² and its width is 21 m. Its length is __ m", answer: '51', perimeterArea: { kind: 'rectangle', length: null, width: 21, unit: 'm' }, id: 5, type: 'perimeterarea' },
            { prompt: "Practice: A rectangle's perimeter is 378 m and its length is 95 m. Its width is __ m", answer: '94', perimeterArea: { kind: 'rectangle', length: 95, width: null, unit: 'm' }, id: 6, type: 'perimeterarea' },
            { prompt: 'Challenge: An L-shape is made from two rectangles: one 6 cm by 5 cm and one 4 cm by 2 cm. Its total area is __ cm²', answer: '38', perimeterArea: { kind: 'lshape', first: { length: 6, width: 5 }, second: { length: 4, width: 2 }, unit: 'cm' }, id: 7, type: 'perimeterarea' },
            { prompt: 'Challenge: An L-shape is made from two rectangles: one 5 cm by 3 cm and one 5 cm by 4 cm. Its total area is __ cm²', answer: '35', perimeterArea: { kind: 'lshape', first: { length: 5, width: 3 }, second: { length: 5, width: 4 }, unit: 'cm' }, id: 8, type: 'perimeterarea' }
        ]);
    });

    it('reverse items are exact: perimeter = 2(l+w) and area = l×w by construction', () => {
        for (const p of sheet(g5)) {
            const pm = p.prompt.match(/perimeter is (\d+) m and its length is (\d+) m\. Its width is __ m/);
            if (pm) {
                const w = Number(p.answer);
                expect(2 * (Number(pm[2]) + w)).toBe(Number(pm[1]));
            }
            const am = p.prompt.match(/area is (\d+) m² and its width is (\d+) m\. Its length is __ m/);
            if (am) expect(Number(p.answer) * Number(am[2])).toBe(Number(am[1]));
        }
    });
});

describe('perimeterarea — Year 6 (larger measurements & unit links, AC9M6M01-02)', () => {
    it('matches the exact first page', () => {
        expect(sheet(g6)).toEqual([
            { prompt: 'Starter: A field is 219 m by 188 m. Its area is __ m²', answer: '41172', perimeterArea: { kind: 'rectangle', length: 219, width: 188, unit: 'm' }, id: 1, type: 'perimeterarea' },
            { prompt: 'Starter: A field is 367 m by 184 m. Its area is __ m²', answer: '67528', perimeterArea: { kind: 'rectangle', length: 367, width: 184, unit: 'm' }, id: 2, type: 'perimeterarea' },
            { prompt: 'Practice: A paddock is 4 km by 2 km. Its area is __ km²', answer: '8', perimeterArea: { kind: 'rectangle', length: 4, width: 2, unit: 'km' }, id: 3, type: 'perimeterarea' },
            { prompt: 'Practice: A paddock is 3 km by 1 km. Its area is __ km²', answer: '3', perimeterArea: { kind: 'rectangle', length: 3, width: 1, unit: 'km' }, id: 4, type: 'perimeterarea' },
            { prompt: 'Practice: A table top is 300 cm by 200 cm. Its area is __ m²', answer: '6', perimeterArea: { kind: 'rectangle', length: 300, width: 200, unit: 'cm' }, id: 5, type: 'perimeterarea' },
            { prompt: 'Practice: A table top is 700 cm by 700 cm. Its area is __ m²', answer: '49', perimeterArea: { kind: 'rectangle', length: 700, width: 700, unit: 'cm' }, id: 6, type: 'perimeterarea' },
            { prompt: "Challenge: An 18 m by 17 m garden has a 1 m wide path all around it. The path's OUTER perimeter is __ m", answer: '78', perimeterArea: { kind: 'path', length: 18, width: 17, path: 1, unit: 'm' }, id: 7, type: 'perimeterarea' },
            { prompt: "Challenge: A rectangle's area is 580338 m² and its width is 594 m. Its length is __ m", answer: '977', perimeterArea: { kind: 'rectangle', length: null, width: 594, unit: 'm' }, id: 8, type: 'perimeterarea' }
        ]);
    });
});

describe('perimeterarea — answer-privacy figure contract (PerimeterAreaFigure)', () => {
    it('every generated problem on every offered grade carries its perimeterArea figure', () => {
        for (const doc of [doc4, doc5, doc6]) {
            expect(doc).toHaveLength(ASK);
            expect(doc.filter((p) => !p.perimeterArea)).toHaveLength(0);
        }
    });

    it("every figure's unit equals the side unit printed in its prompt (cm/m/km per form)", () => {
        // The first "<number> <unit>" occurrence in every prompt is a printed
        // side — all eight forms print at least one given side with its unit
        // before the answer blank — and the figure must repeat that unit.
        for (const doc of [doc4, doc5, doc6]) {
            expect(doc.map((p) => p.perimeterArea!.unit)).toEqual(
                doc.map((p) => p.prompt.match(/(\d+) (cm|m|km)\b/)![2])
            );
        }
        // Form coverage per grade: Y4 prints only cm; Y5 mixes m (formula
        // forms) with cm (tray + L-shape); Y6 spans m, cm (table tops) and km
        // (paddocks).
        expect(Array.from(new Set(doc4.map((p) => p.perimeterArea!.unit))).sort()).toEqual(['cm']);
        expect(Array.from(new Set(doc5.map((p) => p.perimeterArea!.unit))).sort()).toEqual(['cm', 'm']);
        expect(Array.from(new Set(doc6.map((p) => p.perimeterArea!.unit))).sort()).toEqual(['cm', 'km', 'm']);
    });

    it('Year 4 counting rows draw a 1 cm² grid whose sides stay countable (at most 9)', () => {
        // The grid rows are the two counting forms (area starter + count
        // practice). The printed lattice must stay countable, so both drawn
        // sides come from the 9-unit grid range (GRID_SIDE_CAP,
        // PerimeterAreaWorksheet.ts) even though the grade cap allows 20.
        const gridRows = doc4.filter(
            (p) => p.perimeterArea?.kind === 'rectangle' && p.perimeterArea.grid === true
        );
        expect(gridRows).toHaveLength(253);
        // The prompt prints both sides ("L cm by W cm" on both forms); the
        // figure repeats exactly those numbers plus the grid flag.
        const gridSides = gridRows.map((p) => {
            const m = p.prompt.match(/(\d+) cm by (\d+) cm/)!;
            return [Number(m[1]), Number(m[2])];
        });
        expect(gridRows.map((p) => p.perimeterArea)).toEqual(
            gridSides.map(([l, w]) => ({ kind: 'rectangle', length: l, width: w, unit: 'cm', grid: true }))
        );
        // No grid row may exceed 9-unit sides on either axis — zero violations.
        expect(gridSides.filter(([l, w]) => l > 9 || w > 9)).toHaveLength(0);
    });

    it('Year 4 non-counting rows draw plain labelled rectangles (no grid) matching their prompts', () => {
        // Perimeter starters: "A rectangle is L cm long and W cm wide" — a
        // plain labelled rectangle (counting squares is the AREA method, so
        // the grid flag belongs to the counting forms only).
        const perimRows = doc4.filter((p) => p.prompt.includes('long and'));
        expect(perimRows).toHaveLength(165);
        expect(perimRows.map((p) => p.perimeterArea)).toEqual(
            perimRows.map((p) => {
                const m = p.prompt.match(/A rectangle is (\d+) cm long and (\d+) cm wide\./)!;
                return { kind: 'rectangle', length: Number(m[1]), width: Number(m[2]), unit: 'cm' };
            })
        );
        // Square practice: a square is the equal-sided rectangle — the figure
        // repeats the prompt's side for BOTH axes, never a grid.
        const squareRows = doc4.filter((p) => p.prompt.includes('A square has sides of'));
        expect(squareRows).toHaveLength(182);
        expect(squareRows.map((p) => p.perimeterArea)).toEqual(
            squareRows.map((p) => {
                const s = Number(p.prompt.match(/A square has sides of (\d+) cm\./)![1]);
                return { kind: 'rectangle', length: s, width: s, unit: 'cm' };
            })
        );
    });

    it('Year 4 challenge rows ask one side: given side labelled, asked side prints "?"', () => {
        // "Its width is __" asks the width: the figure labels the GIVEN
        // length and prints "?" (null) on the width — exactly one null side.
        const widthAsked = doc4.filter((p) => p.prompt.includes('Its width is __'));
        expect(widthAsked).toHaveLength(102);
        expect(widthAsked.map((p) => p.perimeterArea)).toEqual(
            widthAsked.map((p) => {
                const m = p.prompt.match(/perimeter is (\d+) (cm|m) and its length is (\d+) (cm|m)\./)!;
                return { kind: 'rectangle', length: Number(m[3]), width: null, unit: m[4] };
            })
        );
        // "Its length is __" asks the length: the GIVEN width is labelled,
        // the asked length prints "?" (null).
        const lengthAsked = doc4.filter((p) => p.prompt.includes('Its length is __'));
        expect(lengthAsked).toHaveLength(98);
        expect(lengthAsked.map((p) => p.perimeterArea)).toEqual(
            lengthAsked.map((p) => {
                const m = p.prompt.match(/area is (\d+) (cm|m)² and its width is (\d+) (cm|m)\./)!;
                return { kind: 'rectangle', length: null, width: Number(m[3]), unit: m[4] };
            })
        );
    });

    it('Year 5 reverse rows ask one side: given side labelled, asked side prints "?"', () => {
        const widthAsked = doc5.filter((p) => p.prompt.includes('Its width is __'));
        expect(widthAsked).toHaveLength(134);
        expect(widthAsked.map((p) => p.perimeterArea)).toEqual(
            widthAsked.map((p) => {
                const m = p.prompt.match(/perimeter is (\d+) (cm|m) and its length is (\d+) (cm|m)\./)!;
                return { kind: 'rectangle', length: Number(m[3]), width: null, unit: m[4] };
            })
        );
        const lengthAsked = doc5.filter((p) => p.prompt.includes('Its length is __'));
        expect(lengthAsked).toHaveLength(119);
        expect(lengthAsked.map((p) => p.perimeterArea)).toEqual(
            lengthAsked.map((p) => {
                const m = p.prompt.match(/area is (\d+) (cm|m)² and its width is (\d+) (cm|m)\./)!;
                return { kind: 'rectangle', length: null, width: Number(m[3]), unit: m[4] };
            })
        );
    });

    it('Year 5 L-shape rows draw the two prompt rectangles in order (first = A/B, second = C/D)', () => {
        const lshapeRows = doc5.filter((p) => p.prompt.includes('L-shape is made from two rectangles'));
        expect(lshapeRows).toHaveLength(200);
        expect(lshapeRows.map((p) => p.perimeterArea)).toEqual(
            lshapeRows.map((p) => {
                const m = p.prompt.match(/one (\d+) cm by (\d+) cm and one (\d+) cm by (\d+) cm\./)!;
                return {
                    kind: 'lshape',
                    first: { length: Number(m[1]), width: Number(m[2]) },
                    second: { length: Number(m[3]), width: Number(m[4]) },
                    unit: 'cm'
                };
            })
        );
    });

    it('Year 6 square-perimeter rows draw "?" sides and path rows draw the labelled garden ring', () => {
        // The side IS the unknown on the square-from-perimeter form: both
        // sides print "?" (null) and the perimeter number stays in the prompt.
        const squareRows = doc6.filter((p) => p.prompt.includes('A square has perimeter'));
        expect(squareRows).toHaveLength(150);
        expect(squareRows.map((p) => p.perimeterArea)).toEqual(
            squareRows.map(() => ({ kind: 'rectangle', length: null, width: null, unit: 'm' }))
        );
        // Path rows: the garden's given sides label the inner rectangle and
        // the ring is exactly the 1 m band (path: 1); the OUTER sides stay
        // unlabelled — the outer perimeter is that form's private answer.
        const pathRows = doc6.filter((p) => p.prompt.includes('path all around it'));
        expect(pathRows).toHaveLength(92);
        expect(pathRows.map((p) => p.perimeterArea)).toEqual(
            pathRows.map((p) => {
                const m = p.prompt.match(/(\d+) m by (\d+) m garden has a 1 m wide path/)!;
                return { kind: 'path', length: Number(m[1]), width: Number(m[2]), path: 1, unit: 'm' };
            })
        );
    });

    it('Year 6 reverse rows ask the length only: given width labelled, asked length "?"', () => {
        // Year 6 never asks the width (the challenge deck deals path /
        // reverse-area only) — zero width-asked rows in the whole document.
        expect(doc6.filter((p) => p.prompt.includes('Its width is __'))).toHaveLength(0);
        const lengthAsked = doc6.filter((p) => p.prompt.includes('Its length is __'));
        expect(lengthAsked).toHaveLength(108);
        expect(lengthAsked.map((p) => p.perimeterArea)).toEqual(
            lengthAsked.map((p) => {
                const m = p.prompt.match(/area is (\d+) (cm|m)² and its width is (\d+) (cm|m)\./)!;
                return { kind: 'rectangle', length: null, width: Number(m[3]), unit: m[4] };
            })
        );
    });
});

describe('perimeterarea — scaffolded learning sequence', () => {
    it('every Year 4..6 page prints 2 scaffold + 4 core + 2 stretch rows', () => {
        for (const grade of [g4, g5, g6]) {
            const s = sheet(grade);
            expect(s.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(2);
            expect(s.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(s.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(2);
        }
    });
});
