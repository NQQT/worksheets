// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH WORKSHEET REGISTRATIONS — the per-subject registration point.
//
// All 37 english plugins migrated verbatim from distribution/english (R1).
// Each entry pairs the UNINVOKED factory with the subject bundle it loads
// against (DASHBOARD_FRAMEWORK — the english bundle: inline answer lines +
// compact grid). The loader (framework/loader.ts) invokes them one by one
// after the dashboard renders.
//
// ADD     a worksheet:  create src/plugins/english/<Name>Worksheet.ts
//                       exporting the factory function and add one entry to
//                       the list below.
// DELETE  a worksheet:  delete its file and remove its entry. Nothing else in
//                       the app references it — the framework falls back to
//                       the remaining plugins automatically.
//
// The array ORDER is the loading order AND the picker's listing order, and it
// mirrors the legacy english catalogue (early reading first, the upper-
// primary senior set after tense, the Prep-only tracing set last). The order
// is pinned by plugins.test.tsx.
// ─────────────────────────────────────────────────────────────────────────────

import { DASHBOARD_FRAMEWORK } from '../../framework';
import type { WorksheetRegistration } from '../registry';
import { SightWordsWorksheet } from './SightWordsWorksheet';
import { BlendingWorksheet } from './BlendingWorksheet';
import { BeginningSoundsWorksheet } from './BeginningSoundsWorksheet';
import { VowelsWorksheet } from './VowelsWorksheet';
import { OppositeWordsWorksheet } from './OppositeWordsWorksheet';
import { RhymingWordsWorksheet } from './RhymingWordsWorksheet';
import { SentenceBuildingWorksheet } from './SentenceBuildingWorksheet';
import { AlphabetOrderWorksheet } from './AlphabetOrderWorksheet';
import { CapitalLettersWorksheet } from './CapitalLettersWorksheet';
import { PunctuationWorksheet } from './PunctuationWorksheet';
import { TwinWordsWorksheet } from './TwinWordsWorksheet';
import { PluralsWorksheet } from './PluralsWorksheet';
import { SimilarWordsWorksheet } from './SimilarWordsWorksheet';
import { WordGapsWorksheet } from './WordGapsWorksheet';
import { SpellingWorksheet } from './SpellingWorksheet';
import { SyllablesWorksheet } from './SyllablesWorksheet';
import { NounsVerbsWorksheet } from './NounsVerbsWorksheet';
import { PastTenseWorksheet } from './PastTenseWorksheet';
import { ConjunctionWorksheet } from './ConjunctionWorksheet';
import { ApostropheWorksheet } from './ApostropheWorksheet';
import { CommaListWorksheet } from './CommaListWorksheet';
import { AffixWorksheet } from './AffixWorksheet';
import { CompoundWorksheet } from './CompoundWorksheet';
import { SpeechWorksheet } from './SpeechWorksheet';
import { HomographWorksheet } from './HomographWorksheet';
import { PronounWorksheet } from './PronounWorksheet';
import { ComprehensionWorksheet } from './ComprehensionWorksheet';
import { CraftWorksheet } from './CraftWorksheet';
import { WritingWorksheet } from './WritingWorksheet';
import { EditingWorksheet } from './EditingWorksheet';
import { FigurativeWorksheet } from './FigurativeWorksheet';
import { IdiomWorksheet } from './IdiomWorksheet';
import { AdvancedPunctuationWorksheet } from './AdvancedPunctuationWorksheet';
import { AgreementWorksheet } from './AgreementWorksheet';
import { LetterTracingWorksheet } from './LetterTracingWorksheet';
import { WordTracingWorksheet } from './WordTracingWorksheet';
import { NumberTracingWorksheet } from './NumberTracingWorksheet';

// All english worksheet registrations, in display/loading order (legacy
// catalogue order — pinned by plugins.test.tsx).
export const ENGLISH_WORKSHEETS: WorksheetRegistration[] = [
    { factory: SightWordsWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: BlendingWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: BeginningSoundsWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: VowelsWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: OppositeWordsWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: RhymingWordsWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: SentenceBuildingWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: AlphabetOrderWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: CapitalLettersWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: PunctuationWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: TwinWordsWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: PluralsWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: SimilarWordsWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: WordGapsWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: SpellingWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: SyllablesWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: NounsVerbsWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: PastTenseWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: ConjunctionWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: ApostropheWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: CommaListWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: AffixWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: CompoundWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: SpeechWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: HomographWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: PronounWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: ComprehensionWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: CraftWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: WritingWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: EditingWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: FigurativeWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: IdiomWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: AdvancedPunctuationWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: AgreementWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: LetterTracingWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: WordTracingWorksheet, framework: DASHBOARD_FRAMEWORK },
    { factory: NumberTracingWorksheet, framework: DASHBOARD_FRAMEWORK }
];
