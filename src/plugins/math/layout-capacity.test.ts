// A4 PRINT-LAYOUT CAPACITY CONTRACT (T3M3)
//
// Every worksheet spec claims a `perPage` density; PrintableSheet lays the
// problems out in a CSS grid whose rows are `1fr` — a fixed height per row
// derived from the page chrome. If a prompt + figure is TALLER than its row,
// the printed page crowds/overlaps. This suite pins that contract with a
// conservative analytical model of the layout:
//
//   - for each spec x offered grade it generates the full 1000-question ask
//     (a superset of every spec.perPage x 100, seed seedFrom([grade.id,
//     spec.id, 0]) — same stream as unique-sampling.test.ts);
//   - it computes the WORST-CASE printed row content height from the actual
//     prompt text + figure data (glyph widths overestimated at 0.55em, hard
//     "\n" lines honoured because ProblemText is `white-space: pre-wrap`);
//   - it asserts the worst row still clears the spec's 1fr row height by at
//     least 4px, and pins the exact worst-case value so any future prompt or
//     figure that grows past the row fails HERE, not on a parent's printer.
//
// The px constants below mirror PrintableSheet.tsx CSS byte-for-byte (A4
// 794x1123px at 96dpi, 12mm padding, header/rule/footer chrome, 24px rowGap,
// 32px columnGap, 26px index + 12px row gap, 16px/1.35 illustrated vs
// 22px/1.5 plain prose, 66px inline blanks / 170px big blanks, 1.5em+2.5px+
// 14px answer lines) and the figure renderers' rendered heights (see the
// framework/*Diagram.tsx SIZE notes). If you change the sheet CSS, a figure,
// or a prompt template, update the model constants together with the pin —
// the margin assertion is the point, the exact numbers are the tripwire.

import { describe, it, expect } from 'vitest';
import {
    seedFrom, getMathGradeConfig, createRng,
    type RawProblem, type WorksheetSpec, type PerimeterAreaFigure
} from '../../framework';
import { additionSpec } from './AdditionWorksheet';
import { subtractionSpec } from './SubtractionWorksheet';
import { multiplicationSpec } from './MultiplicationWorksheet';
import { missingSpec } from './MissingNumberWorksheet';
import { comparisonSpec } from './CompareWorksheet';
import { skipSpec } from './SkipCountingWorksheet';
import { wordSpec } from './WordProblemsWorksheet';
import { countingSpec } from './CountingWorksheet';
import { rowsColumnsSpec } from './RowsColumnsWorksheet';
import { doublesSpec } from './DoublesWorksheet';
import { bondsSpec } from './NumberBondsWorksheet';
import { patternsSpec } from './PatternsWorksheet';
import { shapesSpec } from './ShapesWorksheet';
import { shapeTransformationsSpec } from './ShapeTransformationsWorksheet';
import { compassSpec } from './CompassWorksheet';
import { timeSpec } from './TimeWorksheet';
import { clockSpec } from './ClockWorksheet';
import { measureSpec } from './MeasurementWorksheet';
import { temperatureSpec } from './TemperatureWorksheet';
import { placeValueSpec } from './PlaceValueWorksheet';
import { dataSpec } from './DataWorksheet';
import { divisionSpec } from './DivisionWorksheet';
import { moneySpec } from './MoneyWorksheet';
// T4 expansion specs (nine upper-primary strands, Years 3..6).
import { fractionsSpec } from './FractionsWorksheet';
import { decimalsSpec } from './DecimalsWorksheet';
import { percentSpec } from './PercentWorksheet';
import { multiDivSpec } from './MultiplyDivideWorksheet';
import { perimeterAreaSpec } from './PerimeterAreaWorksheet';
import { metricConvSpec } from './MetricConversionWorksheet';
import { statisticsSpec } from './StatisticsWorksheet';
import { probabilitySpec } from './ProbabilityWorksheet';
import { algebraSpec } from './AlgebraReasoningWorksheet';
// T11 senior specs (Year 11 only; also imported directly by their own tests).
import { calculusSpec } from './CalculusWorksheet';
import { functionsSpec } from './FunctionsWorksheet';
import { polynomialsSpec } from './PolynomialsWorksheet';
import { trigonometrySpec } from './TrigonometryWorksheet';
import { expoLogSpec } from './ExpoLogWorksheet';
import { prob11Spec } from './Prob11Worksheet';

// ── PrintableSheet.tsx chrome (px at 96dpi; 1mm = 96/25.4) ──────────────────
const MM = 96 / 25.4;
const A4_W = 794, A4_H = 1123;
const PAD = 12 * MM;                            // SheetRoot padding 12mm
const HEADER = 30 * 1.1 + 4 + 4 + 15 * 1.2 + 14; // title + h1 mb + gap + subtitle + HeaderRow mb
const RULE = 2 + 16;                            // Rule border + margin-bottom
const FOOTER = 14 + 11 * 1.2;                   // SheetFooter paddingTop + line
const AVAIL = A4_H - 2 * PAD - HEADER - RULE - FOOTER; // vertical space the grid gets
const ROW_GAP = 24;                             // ProblemGrid rowGap
const INDEX_W = 26, ROW_GAP_X = 12;             // ProblemIndex minWidth + ProblemRow gap
const COL_GAP = 32;                             // ProblemGrid columnGap

// Conservative average glyph advance: system-ui/Segoe UI averages ~0.50em,
// so 0.55em OVERestimates text width (=> overestimates wrapped lines).
const EM = 0.55;
const BLANK_PX = 56 + 10;                       // Blank minWidth + horizontal margins
const BLANK_BIG_PX = 160 + 10;                  // Blank big minWidth + margins
const ANSWER_LINE_EM = 1.5, ANSWER_LINE_BORDER = 2.5, ANSWER_LINE_MT = 14;

// Figure block heights (marginTop 6 + rendered svg/card height) per renderer;
// see the SIZE comments in framework/CompassDiagram.tsx, DataDiagram.tsx,
// ShapeTransformationDiagram.tsx, RowsColumnsDiagram.tsx, BondDiagram.tsx,
// MoneyDiagram.tsx, DivisionDiagram.tsx, ColumnDiagram.tsx, ShapeFigure.tsx.
// The perimeterarea figure is KIND-dependent (rectangle/lshape/path) — its
// geometry lives in perimeterAreaH() + the constants right below, mirroring
// framework/RectangleDiagram.tsx.
const FIG = {
    compass: 6 + 84,
    dataTally: 6 + 36,
    dataPicture: 6 + 28,
    dataColumn: 6 + 100,
    transformation: 6 + (17 + 3 + 88),
    bond: 6 + 85,
    money: 6 + 36,
    division: 6 + 26 * 1.5,
    shapeCard: 6 + (72 + 3 + 17)
};
const rowsColsH = (rows: number) => 6 + 20 * rows;
const columnH = (terms: number) => 6 + 1.5 * (10 + (terms - 1) * 12 + 10 + 18);
// Clock face is a FLEX SIBLING of the text (PrintableSheet ClockFace), so the
// row is as tall as the taller of the two.
const CLOCK_BOX = 120;

// ── RectangleDiagram.tsx geometry (perimeterarea figures) ────────────────────
// Every perimeter/area problem now attaches a `perimeterArea` figure, so that
// spec prints ILLUSTRATED typography (16px/1.35) and the figure height below.
// These constants and perimeterAreaH() are a VERBATIM mirror of
// framework/RectangleDiagram.tsx — the geometry lives THERE (header-comment
// constants + each kind's SIZE comment) and the two must change together or
// this pin lies. Only the height-relevant constants appear here: the
// renderer's drawn-WIDTH constants (LEFT_GUTTER 44, NULL_LENGTH 70,
// RIGHT_LABEL 40) never affect the svg height, so the model omits them.
const TOP_GUTTER = 18;    // px reserved ABOVE a top-labelled shape for its label
const MAX_SHAPE_W = 150;  // widest drawn shape, px (scale budget)
const MAX_SHAPE_H = 60;   // tallest drawn shape, px (scale budget)
const NULL_SQUARE = 48;   // drawn side px when BOTH sides are unknown
const NULL_WIDTH = 40;    // drawn height px when only the WIDTH is unknown
const GRID_MAX_PX = 100;  // tallest unit-square grid, px (cell shrinks to fit)
const GRID_CELL_MAX = 14; // largest unit-square cell, px (countable squares)
const BOTTOM_LABEL = 16;  // px label row BELOW a bottom-labelled shape
const SVG_PAD = 2;        // RectangleDiagram's PAD (right/bottom past the 2px stroke)

// Printed figure block height (6px DiagramRoot marginTop + svg height) for one
// PerimeterAreaFigure — same kind split as RectangleDiagram's
// RectangleFigure/LShapeFigure/PathFigure, expressions copied verbatim:
//   rectangle (grid):    6 + 18 + width*cell + 2, cell = min(14, floor(100/width))
//   rectangle (no grid): 6 + 18 + floor(width*scale) + 2, unknown sides draw
//                        the fixed NULL_* stand-ins (never a scaled value)
//   lshape:              6 + 18 + floor(max(first.length, second.width)*scale)
//                        + 16 (the foot's bottom label row)
//   path:                6 + floor((width + 2*path)*scale) + 2 (garden labels
//                        sit INSIDE the shape, so no gutter/label row)
function perimeterAreaH(f: PerimeterAreaFigure): number {
    if (f.kind === 'rectangle') {
        if (f.grid) {
            // Unit-square lattice: the cell shrinks so gridH stays ≤ 100px.
            const cell = Math.min(GRID_CELL_MAX, Math.floor(GRID_MAX_PX / (f.width ?? 0)));
            return 6 + TOP_GUTTER + (f.width ?? 0) * cell + SVG_PAD;
        }
        const scale = Math.min(
            f.length !== null ? MAX_SHAPE_W / f.length : Infinity,
            f.width !== null ? MAX_SHAPE_H / f.width : Infinity
        );
        const drawnH = Math.floor(f.width !== null ? f.width * scale : f.length !== null ? NULL_WIDTH : NULL_SQUARE);
        return 6 + TOP_GUTTER + drawnH + SVG_PAD;
    }
    if (f.kind === 'lshape') {
        const scale = Math.min(MAX_SHAPE_W / (f.first.width + f.second.length), MAX_SHAPE_H / Math.max(f.first.length, f.second.width));
        const shapeH = Math.floor(Math.max(f.first.length, f.second.width) * scale);
        return 6 + TOP_GUTTER + shapeH + BOTTOM_LABEL;
    }
    const scale = Math.min(MAX_SHAPE_W / (f.length + 2 * f.path), MAX_SHAPE_H / (f.width + 2 * f.path));
    const outerH = Math.floor((f.width + 2 * f.path) * scale);
    return 6 + outerH + SVG_PAD;
}

// Does the problem print any block-level figure (illustrated ProblemText)?
function hasFigure(p: RawProblem): boolean {
    return !!(p.shapeTransformation || p.rowsColumns || p.data || p.shapes || p.bond ||
        p.compass || p.money || p.division || p.column || p.perimeterArea);
}

function figureHeight(p: RawProblem): number {
    let h = 0;
    if (p.shapeTransformation) h += FIG.transformation;
    if (p.rowsColumns) h += rowsColsH(p.rowsColumns.rows);
    if (p.data) h += p.data.kind === 'tally' ? FIG.dataTally : p.data.kind === 'picture' ? FIG.dataPicture : FIG.dataColumn;
    if (p.shapes) h += FIG.shapeCard;
    if (p.bond) h += FIG.bond;
    if (p.compass) h += FIG.compass;
    if (p.money) h += FIG.money;
    if (p.division) h += FIG.division;
    if (p.column) h += columnH(p.column.terms.length);
    if (p.perimeterArea) h += perimeterAreaH(p.perimeterArea);
    return h;
}

// Worst-case content height of one problem inside a row of the given width.
function contentHeight(p: RawProblem, textW: number): number {
    const illustrated = hasFigure(p);
    const font = illustrated ? 16 : 22;
    const lineH = illustrated ? 16 * 1.35 : 22 * 1.5;
    const charW = font * EM;
    // ProblemText is whiteSpace: pre-wrap, so an explicit "\n" in a
    // multi-part prompt ALWAYS starts a new line; each hard line then
    // soft-wraps on its own. Inline blanks render wider than their "__".
    const hardLines = p.prompt.split('\n');
    let lines = 0;
    for (const hard of hardLines) {
        const segs = hard.split('__');
        let px = 0;
        segs.forEach((s, i) => {
            px += s.length * charW;
            if (i < segs.length - 1) px += (p.wideBlanks ? BLANK_BIG_PX : BLANK_PX);
        });
        lines += Math.max(1, Math.ceil(px / textW));
    }
    let h = lines * lineH;
    if (illustrated) h += figureHeight(p);
    if (p.answerLine) h += font * ANSWER_LINE_EM + ANSWER_LINE_BORDER + ANSWER_LINE_MT;
    if (p.clock) h = Math.max(h, CLOCK_BOX);
    return h;
}

// The fixed 1fr row height the grid gives at this density (rows = perPage,
// or ceil(perPage/2) when the sheet prints two-column).
function rowHeight(spec: WorksheetSpec): number {
    const rows = spec.singleColumn ? spec.perPage : Math.ceil(spec.perPage / 2);
    return (AVAIL - (rows - 1) * ROW_GAP) / rows;
}

// Text column width inside a row (index gutter + row gap removed).
function textWidth(spec: WorksheetSpec): number {
    const inner = A4_W - 2 * PAD;
    const colW = spec.singleColumn ? inner : (inner - COL_GAP) / 2;
    return colW - INDEX_W - ROW_GAP_X;
}

// Worst-case row content height across every grade that offers the spec,
// measured at the spec's CURRENT layout (ask 1000 = superset of perPage x 100).
// The senior grade 11 joins the loop for the six T11 specs — every F–10 spec
// skips it through its own offered() gate.
function worstRowHeight(spec: WorksheetSpec): number {
    let worst = 0;
    for (const gradeId of [0, 1, 2, 3, 4, 5, 6, 11]) {
        const grade = getMathGradeConfig(gradeId);
        if (!grade.implemented || !spec.offered(grade)) continue;
        const problems = spec.generate(createRng(seedFrom([grade.id, spec.id, 0])), grade.caps, 1000);
        for (const p of problems) worst = Math.max(worst, contentHeight(p, textWidth(spec)));
    }
    return worst;
}

const SPECS: WorksheetSpec[] = [
    additionSpec, subtractionSpec, multiplicationSpec, missingSpec, comparisonSpec,
    skipSpec, wordSpec, countingSpec, rowsColumnsSpec, doublesSpec, bondsSpec, patternsSpec,
    shapesSpec, shapeTransformationsSpec, compassSpec, timeSpec, clockSpec, measureSpec,
    temperatureSpec, placeValueSpec, dataSpec, divisionSpec, moneySpec,
    // T4 expansion cluster (Years 3..6 only — worstRowHeight skips grades
    // where the spec is not offered).
    fractionsSpec, decimalsSpec, percentSpec, multiDivSpec, perimeterAreaSpec,
    metricConvSpec, statisticsSpec, probabilitySpec, algebraSpec,
    // T11 senior cluster (Year 11 only — the loop above includes grade 11).
    calculusSpec, functionsSpec, polynomialsSpec, trigonometrySpec, expoLogSpec, prob11Spec
];

// Exact worst-case row heights (px, 1dp) measured by the model above at each
// spec's current perPage/singleColumn. These are the TRIPWIRE: a longer
// prompt template or a taller figure moves a number here and must be a
// deliberate decision, not a silent print-overflow regression.
const WORST_PX: Record<string, number> = {
    addition: 102.6,          // column figure + one wrapped 16px prompt line
    subtraction: 102.6,       // column figure + one wrapped 16px prompt line
    mult: 127.6,              // 5-row array figure + one wrapped prompt line
    missing: 66.0,            // plain prose, two wrapped 22px lines
    comparison: 66.0,         // plain prose, two wrapped 22px lines
    skip: 66.0,               // plain prose, two wrapped 22px lines
    word: 165.0,              // three-part story, five wrapped 22px lines
    counting: 192.4,          // array figure + wrapped prompt, two-column row
    rowscolumns: 127.6,       // 5-row array figure + one wrapped prompt line
    doubles: 66.0,            // plain prose, two wrapped 22px lines
    bonds: 134.2,             // bond figure + two wrapped prompt lines
    patterns: 66.0,           // plain prose, two wrapped 22px lines
    shapes: 141.2,            // three shape cards + two wrapped prompt lines
    transformations: 157.2,   // before/after figure + two wrapped prompt lines
    compass: 173.7,           // rose + two wrapped lines + full answer line
    time: 120.0,              // three-part day story (single-column layout)
    clock: 120.0,             // the 120px clock face box itself
    measure: 198.0,           // three-part story, six wrapped 22px lines
    temperature: 165.0,       // Mon/Tue/Wed story, five wrapped 22px lines
    placevalue: 165.0,        // "thinking of a number" story, five wrapped lines
    data: 170.8,              // column graph + three wrapped prompt lines
    division: 165.0,          // three-part story, five wrapped 22px lines
    money: 125.7,             // money figure + two wrapped lines + answer line
    // T4 expansion — measured by the model at each spec's current density
    // (decimals/percent/algebra: 10 per page two-column; the other five:
    // 8 per page two-column — fractions/multidiv were retuned 10→8 because
    // their 165px sentence rows only clear the 1fr row at that density;
    // the figure-bearing ones are statistics (Y3 tally rows) and
    // perimeterarea (a RectangleDiagram figure on EVERY row)).
    fractions: 165,           // five wrapped 22px lines (8/page two-column)
    decimals: 99,             // three wrapped 22px lines
    percent: 99,              // three wrapped 22px lines
    multidiv: 165,            // five wrapped 22px lines (8/page two-column)
    perimeterarea: 189.8,     // Year-4 count form: 9x9 grid lattice (125px) + three wrapped 16px lines
    metricconv: 165,          // five wrapped 22px lines (ordering items, wide blanks)
    statistics: 198,          // six wrapped 22px lines (table-in-sentence items)
    probability: 198,         // six wrapped 22px lines (two-bag comparisons)
    algebra: 99,              // three wrapped 22px lines
    // T11 senior cluster — measured by the model at each spec's density
    // (all six: 8 per page two-column, so 210.5px 1fr rows).
    calculus: 165,            // five wrapped 22px lines (cubic/projector prose)
    functions: 132,           // four wrapped 22px lines (completing the square)
    polynomials: 132,         // four wrapped 22px lines (remainder prose)
    trigonometry: 132,        // four wrapped 22px lines (arc/sector prose)
    expolog: 66,              // two wrapped 22px lines (compact notation)
    prob11: 198               // six wrapped 22px lines (E(X) table prose)
};

describe('A4 print-layout capacity — worst row must fit its 1fr row', () => {
    it('every spec x grade worst-case row clears its row height by >= 4px', () => {
        for (const spec of SPECS) {
            const rowH = rowHeight(spec);
            const worst = worstRowHeight(spec);
            // 4px is the minimum breathing room: gridAutoRows 1fr + centered
            // items mean anything tighter than this crowds the next row.
            expect(worst, `${spec.id}: worst row ${worst.toFixed(1)}px vs row ${rowH.toFixed(1)}px`).toBeLessThanOrEqual(rowH - 4);
        }
    });

    it('worst-case row heights are exactly the pinned values', () => {
        const measured: Record<string, number> = {};
        for (const spec of SPECS) measured[spec.id] = Math.round(worstRowHeight(spec) * 10) / 10;
        expect(measured).toEqual(WORST_PX);
    });

    it('the retuned densities are the model-derived maxima (no slack to add a row)', () => {
        // For every spec T3M3 retuned, perPage+1 would BREACH the 4px margin —
        // the density is the largest that fits, so a future "just add one
        // more" change has to shrink a figure or shorten a prompt first.
        // (The specs left untouched — missing/comparison/skip/doubles/
        // patterns/counting/word/clock/money/rowscolumns — keep their
        // pedagogical densities; they fit with room to spare.)
        const retuned = SPECS.filter((s) =>
            ['addition', 'subtraction', 'mult', 'bonds', 'shapes', 'transformations',
                'compass', 'time', 'measure', 'temperature', 'placevalue', 'data', 'division']
                .includes(s.id));
        expect(retuned.map((s) => s.id).sort()).toEqual(
            ['addition', 'bonds', 'compass', 'data', 'division', 'measure', 'mult',
                'placevalue', 'shapes', 'subtraction', 'temperature', 'time', 'transformations']
        );
        for (const spec of retuned) {
            const worst = worstRowHeight(spec);
            const rows = spec.singleColumn ? spec.perPage + 1 : Math.ceil((spec.perPage + 1) / 2);
            const rowH = (AVAIL - (rows - 1) * ROW_GAP) / rows;
            expect(rowH - 4, `${spec.id}: perPage ${spec.perPage} is maximal`).toBeLessThan(worst);
        }
    });
});
