// NON-REPEATING SAMPLING — capacity contract for every maths worksheet.
//
// Every generator now collects its questions through the framework's
// sampleUnique over deck-dealt pools, so a worksheet never repeats a question
// until its whole question space has been dealt. This suite pins that contract:
//
//   - for each plugin x grade: the exact UNIQUE-QUESTION CAPACITY measured by
//     generating 100 PAGES of questions (seed seedFrom([grade.id, spec.id, 0]);
//     the ask is spec.perPage x 100);
//   - the FIRST `capacity` questions are all distinct (duplicates may only
//     appear in the fallback tail once the space is exhausted);
//   - the deep-space types (the arithmetic ladder, word problems, counting
//     Year 2, patterns, data, division, temperature, measure, skip and
//     place value Year 2) clear the 100-PAGE BAR — their whole 100-page
//     document prints with ZERO repeated questions.
//   - The remaining types are FINITE-FACT-SPACE worksheets: within-10/20
//     counting runs, doubles/bonds facts, the curated shape/compass/clock/
//     measure/time/money banks. For these the capacity IS the whole space —
//     sampleUnique deals every distinct question once before the first
//     repeat, and the deck spreads the repeats evenly (no clumping) through
//     the fallback tail.
//
// QUESTION IDENTITY: a question is the printed prompt PLUS any figure data
// the prompt does not already carry. The Data, Clock, Time and Multiplication
// sheets print fixed sentences whose FIGURE (tally marks / clock face / array
// grid) carries the numbers — exactly why those generators key sampleUnique on
// prompt + figure (DataWorksheet.ts, ClockWorksheet.ts, TimeWorksheet.ts,
// MultiplicationWorksheet.ts). The key below mirrors the generators; for every
// other sheet the figure is prompt-determined and the key reduces to prompt.
//
// If a generator, range or bank changes, these exact capacities move — which
// is what we want: a silent shrink of a worksheet's question space can't
// slip through.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, createRng, type RawProblem, type WorksheetSpec } from '../../framework';
import { additionSpec } from './AdditionWorksheet';
import { subtractionSpec } from './SubtractionWorksheet';
import { multiplicationSpec } from './MultiplicationWorksheet';
import { missingSpec } from './MissingNumberWorksheet';
import { comparisonSpec } from './CompareWorksheet';
import { skipSpec } from './SkipCountingWorksheet';
import { wordSpec } from './WordProblemsWorksheet';
import { countingSpec } from './CountingWorksheet';
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
// T11 senior specs (Year 11 only).
import { calculusSpec } from './CalculusWorksheet';
import { functionsSpec } from './FunctionsWorksheet';
import { polynomialsSpec } from './PolynomialsWorksheet';
import { trigonometrySpec } from './TrigonometryWorksheet';
import { expoLogSpec } from './ExpoLogWorksheet';
import { prob11Spec } from './Prob11Worksheet';

// Question identity used by every measurement below — see the header note.
// The JSON triple mirrors the figure-carrying fields the generators key on
// (data / clock / rowsColumns); for all other sheets it is a constant suffix.
const questionKey = (p: RawProblem): string =>
    `${p.prompt}|${JSON.stringify([p.data ?? null, p.clock ?? null, p.rowsColumns ?? null])}`;

// Pinned capacities, measured by this suite's generator run at the 100-page
// ask (spec.perPage x 100 questions). A capacity EQUAL to the ask means the
// whole 100-page document is repeat-free.
const CAPACITIES: { spec: WorksheetSpec; gradeId: number; capacity: number }[] = [
    // ── The arithmetic ladder ───────────────────────────────────────────────
    // The depth-first redesign prints MULTI-PART connected tasks (switch /
    // compare / verify / bond / column / multi forms), so even the Prep
    // within-10 space exceeds the 700-question ask: every grade clears the
    // 100-page bar.
    { spec: additionSpec, gradeId: 0, capacity: 700 },
    { spec: additionSpec, gradeId: 1, capacity: 700 },
    { spec: additionSpec, gradeId: 2, capacity: 700 },
    { spec: additionSpec, gradeId: 3, capacity: 700 },
    { spec: additionSpec, gradeId: 4, capacity: 700 },
    { spec: additionSpec, gradeId: 5, capacity: 700 },
    { spec: additionSpec, gradeId: 6, capacity: 700 },
    { spec: subtractionSpec, gradeId: 0, capacity: 700 },
    { spec: subtractionSpec, gradeId: 1, capacity: 700 },
    { spec: subtractionSpec, gradeId: 2, capacity: 700 },
    { spec: subtractionSpec, gradeId: 3, capacity: 700 },
    { spec: subtractionSpec, gradeId: 4, capacity: 700 },
    { spec: subtractionSpec, gradeId: 5, capacity: 700 },
    { spec: subtractionSpec, gradeId: 6, capacity: 700 },
    // ── Multiplication / division / word problems / data ───────────────────
    // Times tables to 10 x SIX connected families (switch, step, missing
    // pair, ARRAY figure, same-table difference, verify) — the space far
    // exceeds the 600-question ask at both offered grades.
    { spec: multiplicationSpec, gradeId: 2, capacity: 600 },
    { spec: multiplicationSpec, gradeId: 3, capacity: 600 },
    { spec: wordSpec, gradeId: 1, capacity: 400 },
    { spec: wordSpec, gradeId: 2, capacity: 400 },
    // Four per page (each row carries a DataDiagram) makes the 100-page ask
    // 400 — the tally/graph prompt+figure space is deeper, so a full 100-page
    // document stays repeat-free.
    { spec: dataSpec, gradeId: 1, capacity: 400 },
    { spec: dataSpec, gradeId: 2, capacity: 400 },
    { spec: divisionSpec, gradeId: 2, capacity: 400 },
    // ── Missing number / comparison / skip / counting / patterns ──────────
    { spec: missingSpec, gradeId: 1, capacity: 800 },
    { spec: missingSpec, gradeId: 2, capacity: 800 },
    { spec: comparisonSpec, gradeId: 0, capacity: 800 },
    { spec: comparisonSpec, gradeId: 1, capacity: 800 },
    { spec: comparisonSpec, gradeId: 2, capacity: 800 },
    { spec: skipSpec, gradeId: 1, capacity: 800 },
    { spec: skipSpec, gradeId: 2, capacity: 800 },
    // Counting's sequence runs live inside the grade's numCap (10/20/100):
    // the connected two-blank forms keep the space finite for Prep/Y1 and
    // deep enough for Y2 to clear the bar.
    { spec: countingSpec, gradeId: 0, capacity: 149 },
    { spec: countingSpec, gradeId: 1, capacity: 511 },
    { spec: countingSpec, gradeId: 2, capacity: 800 },
    { spec: patternsSpec, gradeId: 1, capacity: 800 },
    { spec: patternsSpec, gradeId: 2, capacity: 800 },
    // Temperature: procedural comparisons/orderings over the tempCap range —
    // deep enough to print 100 pages repeat-free at both offered grades.
    { spec: temperatureSpec, gradeId: 1, capacity: 400 },
    { spec: temperatureSpec, gradeId: 2, capacity: 400 },
    // ── Finite-fact-space types (doubles, bonds, shapes, time, clock, ──────
    // measure, compass, place value, money): the capacity IS the curated
    // space — every distinct question prints once before the first repeat.
    // Compass = 62 prompts (6 turn/side kinds x 4 facings + 3 map edges +
    // 8 walk names x 4 facings + 3 facts), identical through Year 3.
    { spec: doublesSpec, gradeId: 1, capacity: 152 },
    { spec: doublesSpec, gradeId: 2, capacity: 507 },
    // Bonds to 10 is a 9-bond fact space; the bothParts form prints ONE open
    // split sentence per whole (the parts are the private answer), so Y1 =
    // 1 + 3 forms x 9 bonds = 28.
    { spec: bondsSpec, gradeId: 1, capacity: 28 },
    { spec: bondsSpec, gradeId: 2, capacity: 126 },
    { spec: shapesSpec, gradeId: 1, capacity: 128 },
    { spec: shapesSpec, gradeId: 2, capacity: 276 },
    // 3 asymmetric outlines × 4 orientations × 4 flips/quarter-turns; names
    // distinguish diagrams so prompt-keyed uniqueness keeps the full bank.
    { spec: shapeTransformationsSpec, gradeId: 3, capacity: 48 },
    { spec: compassSpec, gradeId: 1, capacity: 62 },
    { spec: compassSpec, gradeId: 2, capacity: 62 },
    { spec: compassSpec, gradeId: 3, capacity: 62 },
    // Time: 65 connected calendar items (Y1); Year 2 adds the 12-face x
    // offset clock kinds keyed on the drawn face (65 + 24 + 24 + 12 = 125).
    { spec: timeSpec, gradeId: 1, capacity: 65 },
    { spec: timeSpec, gradeId: 2, capacity: 125 },
    // Clock = the full 48-face grid x 5 modes (the reading kinds' fixed
    // sentences are keyed on the drawn face — see ClockWorksheet.ts).
    { spec: clockSpec, gradeId: 2, capacity: 240 },
    { spec: measureSpec, gradeId: 1, capacity: 400 },
    { spec: measureSpec, gradeId: 2, capacity: 400 },
    { spec: placeValueSpec, gradeId: 1, capacity: 141 },
    { spec: placeValueSpec, gradeId: 2, capacity: 400 },
    { spec: moneySpec, gradeId: 2, capacity: 76 },
    // ── T4 upper-primary strands (Years 3..6) ───────────────────────────────
    // Procedural generators (drawn operands/counts), so the spaces are large
    // but finite; none reaches the 100-page bar at EVERY offered grade (the
    // scaffold/core/stretch tier blocks cap each tier's space per page ask).
    { spec: fractionsSpec, gradeId: 3, capacity: 96 },
    { spec: fractionsSpec, gradeId: 4, capacity: 544 },
    { spec: fractionsSpec, gradeId: 5, capacity: 638 },
    { spec: fractionsSpec, gradeId: 6, capacity: 800 },
    { spec: decimalsSpec, gradeId: 4, capacity: 854 },
    { spec: decimalsSpec, gradeId: 5, capacity: 1000 },
    { spec: decimalsSpec, gradeId: 6, capacity: 1000 },
    // Percentages: benchmark/flip families over a small exact-percent space —
    // Year 5 is the narrowest (76), Year 6 widens with the fraction forms.
    { spec: percentSpec, gradeId: 5, capacity: 76 },
    { spec: percentSpec, gradeId: 6, capacity: 263 },
    { spec: multiDivSpec, gradeId: 4, capacity: 496 },
    { spec: multiDivSpec, gradeId: 5, capacity: 763 },
    { spec: multiDivSpec, gradeId: 6, capacity: 800 },
    // The Y4 counting forms draw inside the countable 9-unit grid cap (GRID_SIDE_CAP), deliberately shrinking the count/area space: 527 -> 375.
    { spec: perimeterAreaSpec, gradeId: 4, capacity: 375 },
    { spec: perimeterAreaSpec, gradeId: 5, capacity: 800 },
    { spec: perimeterAreaSpec, gradeId: 6, capacity: 577 },
    { spec: metricConvSpec, gradeId: 3, capacity: 82 },
    // T8: Year 4 small→big values are restricted to multiples of 10 (answers
    // must stay within two decimal places — Year 5 level), shrinking this
    // space from 515 to 471. Still ~59× the 8-per-page sheet.
    { spec: metricConvSpec, gradeId: 4, capacity: 471 },
    { spec: metricConvSpec, gradeId: 5, capacity: 505 },
    { spec: metricConvSpec, gradeId: 6, capacity: 759 },
    { spec: statisticsSpec, gradeId: 3, capacity: 800 },
    { spec: statisticsSpec, gradeId: 4, capacity: 800 },
    { spec: statisticsSpec, gradeId: 5, capacity: 800 },
    // Year 6 statistics' challenge tier is the 26-item mean↔total family,
    // capping the whole document below the 800-question ask.
    { spec: statisticsSpec, gradeId: 6, capacity: 626 },
    // Probability: word/compare families are deliberately small (the chance
    // vocabulary is fixed); every space still beats a page many times over.
    { spec: probabilitySpec, gradeId: 3, capacity: 38 },
    { spec: probabilitySpec, gradeId: 4, capacity: 67 },
    { spec: probabilitySpec, gradeId: 5, capacity: 76 },
    // T8: the drawn ratio is reduced to simplest form before scaling, so
    // scaled duplicates ("2/4" vs "1/2") collapse — 143 -> 141.
    { spec: probabilitySpec, gradeId: 6, capacity: 141 },
    // T8: Year 3 equivalent-expression practice now SPLITS the drawn sum
    // (a + b = c + □ with a,b >= 2), instead of freely drawing a and c —
    // fewer distinct combinations, 721 -> 665 (still 83× the page).
    { spec: algebraSpec, gradeId: 3, capacity: 665 },
    { spec: algebraSpec, gradeId: 4, capacity: 664 },
    { spec: algebraSpec, gradeId: 5, capacity: 800 },
    { spec: algebraSpec, gradeId: 6, capacity: 800 },
    // ── T11 senior strands (Year 11 only) ───────────────────────────────────
    // Calculus and polynomials draw wide coefficient ranges, so both clear
    // the 100-page bar; functions (vertex/double-root finite spaces) and
    // prob11 (chance-vocabulary tables) sit just under it. Trigonometry and
    // expolog are FINITE-FACT-SPACE worksheets by design — the exact-value
    // tables (special angles, index/log pairs) ARE the whole space, so the
    // deck spreads the repeats evenly after every distinct item has printed
    // once (the same behaviour as the curated shape/compass banks above).
    { spec: calculusSpec, gradeId: 11, capacity: 800 },
    { spec: functionsSpec, gradeId: 11, capacity: 680 },
    { spec: polynomialsSpec, gradeId: 11, capacity: 800 },
    { spec: trigonometrySpec, gradeId: 11, capacity: 164 },
    { spec: expoLogSpec, gradeId: 11, capacity: 418 },
    { spec: prob11Spec, gradeId: 11, capacity: 635 }
];

// TIERED GENERATORS (T4 strands): the nine upper-primary worksheets sample
// EACH tier (starter / practice / challenge) with its own sampleUnique call
// and interleave the blocks page by page (scaffold→core→stretch per page).
// The document-level PREFIX property therefore only holds PER TIER BLOCK:
// once one tier's finite space runs dry, its repeats spread across later
// pages while the other tiers are still fresh. The per-tier prefix check
// below is the equivalent guarantee for these generators; single-call
// generators keep the stronger document-level prefix pin.
const TIERED = new Set([
    'fractions', 'decimals', 'percent', 'multidiv', 'perimeterarea',
    'metricconv', 'statistics', 'probability', 'algebra',
    // T11 senior generators use the same per-tier sampleUnique assembly.
    'calculus', 'functions', 'polynomials', 'trigonometry', 'expolog', 'prob11'
]);

describe('unique sampling — per-worksheet question capacity', () => {
    for (const { spec, gradeId, capacity } of CAPACITIES) {
        const grade = getMathGradeConfig(gradeId);
        const ask = spec.perPage * 100; // 100 pages of questions
        it(`${spec.id} grade ${gradeId}: ${ask}-question (100-page) ask yields exactly ${capacity} unique questions`, () => {
            const seed = seedFrom([grade.id, spec.id, 0]);
            const problems = spec.generate(createRng(seed), grade.caps, ask);
            expect(problems).toHaveLength(ask);
            const keys = problems.map(questionKey);
            const unique = new Set(keys);
            expect(unique.size).toBe(capacity);
            if (!TIERED.has(spec.id)) {
                // Uniqueness is a PREFIX property: sampleUnique only releases a
                // question after checking its key, so the first `capacity`
                // questions are pairwise distinct — repeats can only sit in the
                // fallback tail after the space was fully dealt.
                expect(new Set(keys.slice(0, capacity)).size).toBe(capacity);
            } else {
                // Tiered generator: the same guarantee per tier block (the
                // printed "Starter:/Practice:/Challenge:" prefix identifies the
                // block; the key's figure JSON follows the first '|').
                for (const tier of ['Starter:', 'Practice:', 'Challenge:']) {
                    const block = keys.filter((k) => (k.split('|')[0] as string).startsWith(tier));
                    const uniq = new Set(block).size;
                    expect(new Set(block.slice(0, uniq)).size).toBe(uniq);
                }
            }
        });
    }

    it('the 100-page bar: every big-space type prints 100 pages with zero repeats', () => {
        // A spec clears the bar when its capacity equals the 100-page ask at
        // EVERY grade that offers it. Dedupe to the distinct worksheet ids.
        const cleared = Array.from(
            new Set(CAPACITIES.filter((c) => c.capacity === c.spec.perPage * 100).map((c) => c.spec.id))
        );
        expect(cleared.sort()).toEqual(
            [
                'addition', 'subtraction', 'comparison', 'counting', 'data',
                'division', 'measure', 'missing', 'mult', 'patterns',
                'placevalue', 'skip', 'temperature', 'word',
                // T4 strands that print a full 100-page repeat-free document
                // at least at one offered grade (fractions/decimals/multidiv
                // in Y6, perimeterarea/statistics/algebra in Y5).
                'algebra', 'decimals', 'fractions', 'multidiv', 'perimeterarea', 'statistics',
                // T11 senior strands: calculus and polynomials draw wide
                // coefficient ranges and clear the bar at Year 11.
                'calculus', 'polynomials'
            ].sort()
        );
        // The depth-first arithmetic ladder clears the bar at EVERY grade
        // (multi-part connected tasks make even the within-10 space deeper
        // than a 700-question document), and word problems / data / division
        // / measure clear it at every offered grade.
        for (const gradeId of [0, 1, 2, 3, 4, 5, 6]) {
            expect(CAPACITIES.find((c) => c.spec === additionSpec && c.gradeId === gradeId)?.capacity).toBe(700);
            expect(CAPACITIES.find((c) => c.spec === subtractionSpec && c.gradeId === gradeId)?.capacity).toBe(700);
        }
    });

    it('the first page of every worksheet is always repeat-free', () => {
        // The PREFIX guarantee applied at the page level: a sheet of
        // `perPage` questions can only contain a repeat when the whole
        // question space is SMALLER than a page. Every maths type's space
        // is bigger than its per-page ask (the smallest is Year 1 bonds:
        // 28 questions for a 5-row page), so single-page printouts NEVER
        // repeat a question — at any grade, any refresh.
        for (const { spec, gradeId, capacity } of CAPACITIES) {
            expect(capacity).toBeGreaterThan(spec.perPage);
            const grade = getMathGradeConfig(gradeId);
            const problems = spec.generate(createRng(seedFrom([gradeId, spec.id, 0])), grade.caps, spec.perPage);
            expect(new Set(problems.map(questionKey)).size).toBe(spec.perPage);
        }
    });

    it('multi-page documents for big-space types stay repeat-free past 10 pages', () => {
        // Spot-check the longest realistic print run: a 10-page document of
        // every type whose capacity is at least 10 pages deep holds ALL
        // distinct questions (the capacity table guarantees more; this pins
        // the pipeline end-to-end at the document level).
        for (const { spec, gradeId, capacity } of CAPACITIES) {
            const ten = spec.perPage * 10;
            if (capacity < ten) continue;
            // Tiered generators may repeat within a tier block before 10
            // pages (see the TIERED note above) — the per-tier prefix check
            // in the capacity loop is their guarantee.
            if (TIERED.has(spec.id)) continue;
            const grade = getMathGradeConfig(gradeId);
            const problems = spec.generate(createRng(seedFrom([gradeId, spec.id, 0])), grade.caps, ten);
            expect(new Set(problems.map(questionKey)).size).toBe(ten);
        }
    });
});
