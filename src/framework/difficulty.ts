// ─────────────────────────────────────────────────────────────────────────────
// DIFFICULTY MODEL — the public level system over the private grade catalogue.
//
// THE USER-FACING CONTRACT (R3, revised presentation):
//
//   * `level` is a positive, unbounded integer. Level 1 is the first level of
//     every ladder, level N = legacy grade N−1 for every worksheet that sits
//     on a curriculum ladder ("where applicable").
//   * There are NO grade labels and NO grade selector anywhere in the UI.
//     Every worksheet title is "<Label> level <requested level>" (e.g.
//     "Addition level 7") — the REQUESTED level, shown even when it overshoots
//     the worksheet's own cap. Screen, print, answer keys, document/tab titles
//     and every worksheet share this one format.
//   * Every worksheet has an INDEPENDENT MAXIMUM actual difficulty
//     (`maxLevel`). Requesting a level beyond it saturates SILENTLY: the
//     worksheet's EFFECTIVE level clamps to maxLevel, so content does NOT
//     change when the level overshoots (and the generation seed is derived
//     from the effective level, so the numbers stay put absent Randomize).
//     The UI announces neither the cap nor the clamp — saturation is honest
//     behaviour, not a message.
//   * ADVANCED TOPICS SCALE INDEPENDENTLY: the six legacy Year-11 senior
//     maths families (calculus, functions, polynomials, trigonometry,
//     expolog, prob11) no longer require a grade-11 selector position. They
//     start at level 1 on their own three-rung ladder — Intro (gentle
//     families), Developing (full practice + easy challenges), Full (the
//     complete legacy scope) — saturating at level 3.
//   * Worksheets not yet introduced at a level (e.g. fractions before
//     level 4) simply report `offered: false` at that level — the framework
//     shows the generic empty state (no intro-level messaging).
//   * The SCIENCE subjects (chemistry / physics, R5) resolve through the
//     shared SCIENCE_GRADES catalogue: every science plugin is offered from
//     level 1 on its own 4-level ladder (caps.yearLevel = the level), so
//     they saturate at level 4.
//
// The legacy catalogue (framework/catalogue.ts) stays the private source of
// generator caps and availability lists; this module is the only translator
// between the public level and those private grades.
// ─────────────────────────────────────────────────────────────────────────────

import {
    ENGLISH_GRADES,
    getEnglishGradeConfig,
    getMathGradeConfig,
    getScienceGradeConfig,
    MATH_GRADES,
    SCIENCE_GRADES,
    type Caps,
    type GradeConfig
} from './catalogue';

// ── Subjects ─────────────────────────────────────────────────────────────────
// The sidebar lists exactly these (user labels: Math, English, Chemistry,
// Physic). Chemistry/Physic hold the R5 science plugins — registrations in
// src/plugins/science/ resolve through the shared SCIENCE_GRADES catalogue.
export type WorksheetSubjectId = 'math' | 'english' | 'chemistry' | 'physics';

export type WorksheetSubject = {
    id: WorksheetSubjectId;
    // Sidebar label (verbatim per the T2 brief — 'Physic' is the user's
    // spelling; the subject id stays 'physics').
    label: string;
    // Glyph for the rail icon chip.
    icon: string;
    // One-line description shown under the picker / in empty states.
    description: string;
};

export const SUBJECTS: readonly WorksheetSubject[] = [
    { id: 'math', label: 'Math', icon: '∑', description: 'Numbers, operations, measurement & senior strands' },
    { id: 'english', label: 'English', icon: 'Aa', description: 'Reading, phonics, grammar & writing' },
    { id: 'chemistry', label: 'Chemistry', icon: '⚗', description: 'Elements, equations & reactions' },
    { id: 'physics', label: 'Physic', icon: '⚛', description: 'Motion, forces & circuits' }
];

export function getSubject(id: WorksheetSubjectId): WorksheetSubject {
    return SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[0];
}

// ── Level normalisation ──────────────────────────────────────────────────────
// The smallest selectable level.
export const MIN_LEVEL = 1;

// Normalise ANY user/stored/session value into a safe positive integer level:
// non-finite numbers, negatives, zero and non-numbers all fall back to
// MIN_LEVEL; valid positive non-integers round down to their integer part.
export function normalizeLevel(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) return MIN_LEVEL;
    const floor = Math.floor(value);
    return floor < MIN_LEVEL ? MIN_LEVEL : floor;
}

// Clamp a raw (already-typed) level into the selectable range: >= MIN_LEVEL,
// finite. Used by the stepper handlers (which can still STORE larger raw
// values — clamping happens at generation time via effectiveLevel).
export function clampLevel(value: unknown): number {
    return normalizeLevel(value);
}

// ── Legacy senior ladder (advanced topics scale independently) ───────────────
// The six senior maths families key their generators on caps.yearLevel as
// their ladder RUNG 1..3 (see each plugin's header). Rung 3 reproduces the
// legacy Year-11 scope draw-for-draw; rungs 1..2 are gentler subsets.
export const SENIOR_WORKSHEET_IDS: readonly string[] = [
    'calculus', 'functions', 'polynomials', 'trigonometry', 'expolog', 'prob11'
];

// The senior ladder's top rung (= each senior worksheet's maxLevel).
export const SENIOR_MAX_LEVEL = 3;

// Read the ladder rung a senior generator should use from its caps. Clamped
// into 1..SENIOR_MAX_LEVEL so a hand-built caps object can never push a
// generator out of its supported band.
export function seniorRung(caps: Caps): number {
    const rung = normalizeLevel(caps.yearLevel);
    return Math.min(rung, SENIOR_MAX_LEVEL);
}

// Is this worksheet one of the senior (independently-levelled) families?
export function isSeniorWorksheet(specId: string): boolean {
    return SENIOR_WORKSHEET_IDS.includes(specId);
}

// The synthetic per-rung grade config for a senior worksheet: the legacy
// grade-11 config (whose `available` lists all six ids, so the plugins' own
// offered() checks keep working) with yearLevel overwritten by the rung.
// Legacy caps yearLevel 3 = the full scope (see catalogue.ts), which is why
// the FULL rung is 3 and the catalogue constant matches.
function seniorGradeForLevel(level: number): GradeConfig {
    const rung = Math.min(normalizeLevel(level), SENIOR_MAX_LEVEL);
    const legacy = getMathGradeConfig(11);
    return { ...legacy, caps: { ...legacy.caps, yearLevel: rung } };
}

// ── The difficulty plan (what the worksheet kit renders from) ────────────────
export type DifficultyPlan = {
    // The requested (normalised) level as the user set it. Displayed verbatim
    // in every worksheet title ("<Label> level <requested>") — even when it
    // overshoots maxLevel.
    level: number;
    // The level whose content is actually generated: min(level, maxLevel).
    // Seeding uses THIS, so overshooting levels cannot change content.
    effectiveLevel: number;
    // The worksheet's own top level (independent per worksheet). Never shown —
    // saturation is silent.
    maxLevel: number;
    // The first level where the worksheet is offered at all (private plan
    // data; the UI renders a generic empty state without it).
    introLevel: number;
    // True when the requested level overshoots maxLevel (silent saturation).
    saturated: boolean;
    // True when the requested level is below introLevel (not yet offered).
    notYetOffered: boolean;
    // The legacy grade config providing the generator caps (private adapter).
    grade: GradeConfig;
};

// Resolve the FULL difficulty plan for a worksheet at a requested level.
//
// maxLevel derivation (independent per worksheet): the highest legacy grade
// whose `available` list contains the worksheet id, +1 (level = grade + 1).
// Senior worksheets override this with their own 3-rung ladder. The caps
// always come from the grade at the EFFECTIVE level, so content is capped
// exactly where the worksheet's catalogue presence ends.
export function resolveDifficulty(
    subject: WorksheetSubjectId,
    specId: string,
    requestedLevel: unknown
): DifficultyPlan {
    const level = normalizeLevel(requestedLevel);

    // ── Senior worksheets: the independent advanced ladder ──
    if (subject === 'math' && isSeniorWorksheet(specId)) {
        const effectiveLevel = Math.min(level, SENIOR_MAX_LEVEL);
        return {
            level,
            effectiveLevel,
            maxLevel: SENIOR_MAX_LEVEL,
            introLevel: MIN_LEVEL,
            saturated: level > SENIOR_MAX_LEVEL,
            notYetOffered: false,
            grade: seniorGradeForLevel(effectiveLevel)
        };
    }

    // ── Standard worksheets: the curriculum ladder (level = legacy grade + 1) ──
    // Find the worksheet's catalogue extent from the subject's legacy grades.
    // The science subjects share one catalogue (SCIENCE_GRADES): each science
    // plugin is offered at levels 1..4 and saturates at level 4.
    const catalogue = subject === 'english'
        ? ENGLISH_GRADES
        : subject === 'math'
            ? MATH_GRADES
            : SCIENCE_GRADES;
    let maxGradeId = -1;
    let introGradeId = Number.POSITIVE_INFINITY;
    catalogue.forEach((grade) => {
        if (grade.available.includes(specId)) {
            maxGradeId = Math.max(maxGradeId, grade.id);
            introGradeId = Math.min(introGradeId, grade.id);
        }
    });
    // No catalogue presence at all → the worksheet can never generate content
    // (defensive: offered() would already say no everywhere). Treat level 1 as
    // both intro and cap so the UI still renders a coherent empty state.
    if (maxGradeId < 0) {
        maxGradeId = 0;
        introGradeId = 0;
    }
    const maxLevel = maxGradeId + 1;
    const introLevel = introGradeId + 1;
    const effectiveLevel = Math.min(level, maxLevel);
    return {
        level,
        effectiveLevel,
        maxLevel,
        introLevel,
        saturated: level > maxLevel,
        notYetOffered: level < introLevel,
        grade: subject === 'english'
            ? getEnglishGradeConfig(effectiveLevel - 1)
            : subject === 'math'
                ? getMathGradeConfig(effectiveLevel - 1)
                : getScienceGradeConfig(effectiveLevel - 1)
    };
}

// ── Deterministic seed ───────────────────────────────────────────────────────
// The seed contract stays byte-compatible with both source apps:
// seedFrom([legacyGradeId, specId, refresh]). Because the grade id is derived
// from the EFFECTIVE level, two requests that saturate to the same effective
// level share the same seed — and therefore the same document — which is the
// "oversized level never changes content absent Randomize" guarantee. The
// senior rungs change CONTENT (different caps) under the same seed: still
// fully deterministic per rung.
export function difficultySeedParts(plan: DifficultyPlan, specId: string, refresh: number): [number, string, number] {
    return [plan.grade.id, specId, refresh];
}
