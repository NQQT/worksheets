// ─────────────────────────────────────────────────────────────────────────────
// THE WORKSHEET REGISTRY — the single registration point of the dashboard.
//
// A REGISTRATION pairs an UNINVOKED plugin factory with the SUBJECT framework
// bundle it loads against. The dashboard's loader (framework/loader.ts)
// invokes them one by one after the shell renders; the invoked plugins carry
// their subject stamp (from the bundle's config) which drives:
//   - the subject rail's per-subject count chips,
//   - the searchable picker's listing (active subject only),
//   - the subject-switch reconciliation (components/WorksheetsDashboard.tsx),
//   - the difficulty resolution (framework/difficulty.ts).
//
// There is NO hardcoded worksheet switch anywhere in the shell — adding a
// worksheet to a subject's index list is the whole integration.
//
// ADD A SUBJECT: create src/plugins/<subject>/index.ts exporting a
// WorksheetRegistration[] (see science/index.ts for the science lists), add
// the subject id to SUBJECTS (framework/difficulty.ts) and a framework bundle
// (framework/framework.ts), then concat its list below.
// ─────────────────────────────────────────────────────────────────────────────

import type { WorksheetSubjectId } from '../framework';
import type { WorksheetRegistration } from './registry';
import { MATH_WORKSHEETS } from './math';
import { ENGLISH_WORKSHEETS } from './english';
import { CHEMISTRY_WORKSHEETS, PHYSICS_WORKSHEETS } from './science';

// Re-export the per-subject lists so tests/consumers can assert per-subject
// inventory without reaching into the directories.
export { MATH_WORKSHEETS, ENGLISH_WORKSHEETS, CHEMISTRY_WORKSHEETS, PHYSICS_WORKSHEETS };

// Which subject each registration list belongs to (used by the inventory
// tests to prove the subject stamps line up with the intended bundles). The
// science lists split per subject — each registration carries its own
// bundle's stamp, so the rail's count chips stay per-subject.
export const REGISTRATION_SUBJECT: Record<WorksheetSubjectId, WorksheetRegistration[]> = {
    math: MATH_WORKSHEETS,
    english: ENGLISH_WORKSHEETS,
    chemistry: CHEMISTRY_WORKSHEETS,
    physics: PHYSICS_WORKSHEETS
};

// ALL worksheet registrations, in loading order (math catalogue first, then
// english, then the two science subjects appended in rail order).
export const WORKSHEET_REGISTRATIONS: WorksheetRegistration[] = [
    ...MATH_WORKSHEETS,
    ...ENGLISH_WORKSHEETS,
    ...CHEMISTRY_WORKSHEETS,
    ...PHYSICS_WORKSHEETS
];
