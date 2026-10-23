// ─────────────────────────────────────────────────────────────────────────────
// MATH WORKSHEET REGISTRATIONS — the per-subject registration point.
//
// All 38 maths plugins migrated verbatim from distribution/maths (R1). Each
// entry pairs the UNINVOKED factory with the subject bundle it loads against
// (MATH_FRAMEWORK — the T8 separate-page answer key + roomy grid). The loader
// (framework/loader.ts) invokes them one by one after the dashboard renders.
//
// ADD     a worksheet:  create src/plugins/math/<Name>Worksheet.ts exporting
//                       the factory function and add one entry to the list
//                       below.
// DELETE  a worksheet:  delete its file and remove its entry. Nothing else in
//                       the app references it — the framework falls back to
//                       the remaining plugins automatically.
//
// The array ORDER is the loading order AND the picker's listing order, and it
// mirrors the legacy maths catalogue (Addition first, Coins & Money last; the
// T4 expansion cluster appends after Money; the six senior families append
// after the T4 cluster). The order is pinned by plugins.test.tsx.
// ─────────────────────────────────────────────────────────────────────────────

import { MATH_FRAMEWORK } from '../../framework';
import type { WorksheetRegistration } from '../registry';
import { AdditionWorksheet } from './AdditionWorksheet';
import { SubtractionWorksheet } from './SubtractionWorksheet';
import { MultiplicationWorksheet } from './MultiplicationWorksheet';
import { MissingNumberWorksheet } from './MissingNumberWorksheet';
import { CompareWorksheet } from './CompareWorksheet';
import { SkipCountingWorksheet } from './SkipCountingWorksheet';
import { WordProblemsWorksheet } from './WordProblemsWorksheet';
import { CountingWorksheet } from './CountingWorksheet';
import { RowsColumnsWorksheet } from './RowsColumnsWorksheet';
import { DoublesWorksheet } from './DoublesWorksheet';
import { NumberBondsWorksheet } from './NumberBondsWorksheet';
import { PatternsWorksheet } from './PatternsWorksheet';
import { ShapesWorksheet } from './ShapesWorksheet';
import { ShapeTransformationsWorksheet } from './ShapeTransformationsWorksheet';
import { CompassWorksheet } from './CompassWorksheet';
import { TimeWorksheet } from './TimeWorksheet';
import { ClockWorksheet } from './ClockWorksheet';
import { MeasurementWorksheet } from './MeasurementWorksheet';
import { TemperatureWorksheet } from './TemperatureWorksheet';
import { PlaceValueWorksheet } from './PlaceValueWorksheet';
import { DataWorksheet } from './DataWorksheet';
import { DivisionWorksheet } from './DivisionWorksheet';
import { MoneyWorksheet } from './MoneyWorksheet';
import { FractionsWorksheet } from './FractionsWorksheet';
import { DecimalsWorksheet } from './DecimalsWorksheet';
import { PercentWorksheet } from './PercentWorksheet';
import { MultiplyDivideWorksheet } from './MultiplyDivideWorksheet';
import { PerimeterAreaWorksheet } from './PerimeterAreaWorksheet';
import { MetricConversionWorksheet } from './MetricConversionWorksheet';
import { StatisticsWorksheet } from './StatisticsWorksheet';
import { ProbabilityWorksheet } from './ProbabilityWorksheet';
import { AlgebraReasoningWorksheet } from './AlgebraReasoningWorksheet';
import { CalculusWorksheet } from './CalculusWorksheet';
import { FunctionsWorksheet } from './FunctionsWorksheet';
import { PolynomialsWorksheet } from './PolynomialsWorksheet';
import { TrigonometryWorksheet } from './TrigonometryWorksheet';
import { ExpoLogWorksheet } from './ExpoLogWorksheet';
import { Prob11Worksheet } from './Prob11Worksheet';

// All math worksheet registrations, in display/loading order (legacy
// catalogue order — pinned by plugins.test.tsx).
export const MATH_WORKSHEETS: WorksheetRegistration[] = [
    { factory: AdditionWorksheet, framework: MATH_FRAMEWORK },
    { factory: SubtractionWorksheet, framework: MATH_FRAMEWORK },
    { factory: MultiplicationWorksheet, framework: MATH_FRAMEWORK },
    { factory: MissingNumberWorksheet, framework: MATH_FRAMEWORK },
    { factory: CompareWorksheet, framework: MATH_FRAMEWORK },
    { factory: SkipCountingWorksheet, framework: MATH_FRAMEWORK },
    { factory: WordProblemsWorksheet, framework: MATH_FRAMEWORK },
    { factory: CountingWorksheet, framework: MATH_FRAMEWORK },
    { factory: RowsColumnsWorksheet, framework: MATH_FRAMEWORK },
    { factory: DoublesWorksheet, framework: MATH_FRAMEWORK },
    { factory: NumberBondsWorksheet, framework: MATH_FRAMEWORK },
    { factory: PatternsWorksheet, framework: MATH_FRAMEWORK },
    { factory: ShapesWorksheet, framework: MATH_FRAMEWORK },
    { factory: ShapeTransformationsWorksheet, framework: MATH_FRAMEWORK },
    { factory: CompassWorksheet, framework: MATH_FRAMEWORK },
    { factory: TimeWorksheet, framework: MATH_FRAMEWORK },
    { factory: ClockWorksheet, framework: MATH_FRAMEWORK },
    { factory: MeasurementWorksheet, framework: MATH_FRAMEWORK },
    { factory: TemperatureWorksheet, framework: MATH_FRAMEWORK },
    { factory: PlaceValueWorksheet, framework: MATH_FRAMEWORK },
    { factory: DataWorksheet, framework: MATH_FRAMEWORK },
    { factory: DivisionWorksheet, framework: MATH_FRAMEWORK },
    { factory: MoneyWorksheet, framework: MATH_FRAMEWORK },
    { factory: FractionsWorksheet, framework: MATH_FRAMEWORK },
    { factory: DecimalsWorksheet, framework: MATH_FRAMEWORK },
    { factory: PercentWorksheet, framework: MATH_FRAMEWORK },
    { factory: MultiplyDivideWorksheet, framework: MATH_FRAMEWORK },
    { factory: PerimeterAreaWorksheet, framework: MATH_FRAMEWORK },
    { factory: MetricConversionWorksheet, framework: MATH_FRAMEWORK },
    { factory: StatisticsWorksheet, framework: MATH_FRAMEWORK },
    { factory: ProbabilityWorksheet, framework: MATH_FRAMEWORK },
    { factory: AlgebraReasoningWorksheet, framework: MATH_FRAMEWORK },
    { factory: CalculusWorksheet, framework: MATH_FRAMEWORK },
    { factory: FunctionsWorksheet, framework: MATH_FRAMEWORK },
    { factory: PolynomialsWorksheet, framework: MATH_FRAMEWORK },
    { factory: TrigonometryWorksheet, framework: MATH_FRAMEWORK },
    { factory: ExpoLogWorksheet, framework: MATH_FRAMEWORK },
    { factory: Prob11Worksheet, framework: MATH_FRAMEWORK }
];
