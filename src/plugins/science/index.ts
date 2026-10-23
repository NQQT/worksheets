// ─────────────────────────────────────────────────────────────────────────────
// SCIENCE WORKSHEET REGISTRATIONS — the per-subject registration point (R5).
//
// Four self-contained science plugins over the shared SCIENCE_GRADES
// catalogue (framework/catalogue.ts): every plugin is offered from level 1 on
// its own 4-level ladder (the rung rides in caps.yearLevel) and saturates
// silently at level 4. Each entry pairs the UNINVOKED factory with the
// SUBJECT bundle it loads against:
//
//   CHEMISTRY (bundle CHEMISTRY_FRAMEWORK — ⚗ glyph, inline answer key):
//     - ElementsWorksheet       ('elements')  — symbols/names, L4 Latin +
//                                               atomic-number clues
//     - BalancingWorksheet      ('balancing') — every coefficient blank,
//                                               smallest whole-number vectors
//
//   PHYSIC (bundle PHYSIC_FRAMEWORK — ⚛ glyph, inline answer key; the user's
//   spelling — the subject id stays 'physics'):
//     - SpeedDistanceTimeWorksheet ('speed')    — d = s×t → whole-journey
//                                                averages
//     - CircuitsWorksheet          ('circuits') — Ohm's law → series/parallel
//
// The loader (framework/loader.ts) invokes them one by one after the
// dashboard renders. ADD a worksheet: create
// src/plugins/science/<Name>Worksheet.ts exporting the factory and add one
// entry to the matching list below. DELETE: remove the file + entry.
// ─────────────────────────────────────────────────────────────────────────────

import { CHEMISTRY_FRAMEWORK, PHYSIC_FRAMEWORK } from '../../framework';
import type { WorksheetRegistration } from '../registry';
import { ElementsWorksheet } from './ElementsWorksheet';
import { BalancingWorksheet } from './BalancingWorksheet';
import { SpeedDistanceTimeWorksheet } from './SpeedDistanceTimeWorksheet';
import { CircuitsWorksheet } from './CircuitsWorksheet';

// Chemistry registrations, in display/loading order (pinned by
// science/plugins.test.tsx).
export const CHEMISTRY_WORKSHEETS: WorksheetRegistration[] = [
    { factory: ElementsWorksheet, framework: CHEMISTRY_FRAMEWORK },
    { factory: BalancingWorksheet, framework: CHEMISTRY_FRAMEWORK }
];

// Physic registrations, in display/loading order.
export const PHYSICS_WORKSHEETS: WorksheetRegistration[] = [
    { factory: SpeedDistanceTimeWorksheet, framework: PHYSIC_FRAMEWORK },
    { factory: CircuitsWorksheet, framework: PHYSIC_FRAMEWORK }
];
