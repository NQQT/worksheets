// Difficulty model tests — the public level system's contract (R3, revised
// presentation).
//
// Pinned here:
//   1. level normalisation (any garbage → a safe positive integer);
//   2. the level → legacy grade mapping (level N = grade N−1) with per-
//      worksheet independent maxima derived from the legacy catalogues;
//   3. saturation: an oversized level clamps to the worksheet's own maximum
//      WITHOUT changing the derived caps or the seed — silently, with the
//      REQUESTED level still carried on the plan (no grade labels anywhere:
//      the plan exposes no levelLabel and the UI titles show "<Label> level
//      <requested>");
//   4. the independent senior ladder (calculus & friends: Intro/Developing/
//      Full, saturating at level 3 — never "requires Year 11");
//   5. "not yet offered" (levels below a worksheet's intro level);
//   6. the SHARED science ladder (chemistry/physics: every science plugin
//      offered from level 1, cap 4, rung rides in caps.yearLevel).

import { describe, expect, it } from 'vitest';
import {
    MIN_LEVEL,
    SENIOR_MAX_LEVEL,
    SENIOR_WORKSHEET_IDS,
    clampLevel,
    difficultySeedParts,
    isSeniorWorksheet,
    normalizeLevel,
    resolveDifficulty,
    seniorRung
} from './difficulty';
import { getEnglishGradeConfig, getMathGradeConfig } from './catalogue';

describe('normalizeLevel — any input becomes a safe positive integer', () => {
    it('passes valid positive integers through', () => {
        expect(normalizeLevel(1)).toBe(1);
        expect(normalizeLevel(2)).toBe(2);
        expect(normalizeLevel(99)).toBe(99);
    });

    it('falls back to the minimum for garbage inputs', () => {
        expect(normalizeLevel(undefined)).toBe(MIN_LEVEL);
        expect(normalizeLevel(null)).toBe(MIN_LEVEL);
        expect(normalizeLevel('3' as unknown as number)).toBe(MIN_LEVEL);
        expect(normalizeLevel(NaN)).toBe(MIN_LEVEL);
        expect(normalizeLevel(Infinity)).toBe(MIN_LEVEL);
        expect(normalizeLevel(-Infinity)).toBe(MIN_LEVEL);
    });

    it('clamps zero and negatives up to the minimum', () => {
        expect(normalizeLevel(0)).toBe(MIN_LEVEL);
        expect(normalizeLevel(-5)).toBe(MIN_LEVEL);
    });

    it('floors positive non-integers', () => {
        expect(normalizeLevel(3.9)).toBe(3);
        expect(normalizeLevel(1.1)).toBe(1);
    });

    it('clampLevel mirrors normalizeLevel for typed stepper values', () => {
        expect(clampLevel(4)).toBe(4);
        expect(clampLevel(0)).toBe(MIN_LEVEL);
        expect(clampLevel(Number.NaN)).toBe(MIN_LEVEL);
    });
});

describe('resolveDifficulty — the curriculum ladder with independent maxima', () => {
    it('maps level 1 to Prep and level 2 to Grade 1 for both subjects', () => {
        const math = resolveDifficulty('math', 'addition', 1);
        expect(math.effectiveLevel).toBe(1);
        expect(math.grade.id).toBe(0); // legacy Prep
        expect(math.grade.caps.opCap).toBe(10); // Prep addition scope

        const english = resolveDifficulty('english', 'sight', 2);
        expect(english.effectiveLevel).toBe(2);
        expect(english.grade.id).toBe(1); // legacy Year 1
        expect(english.grade.caps.wordTier).toBe(2); // Year 1 word set
    });

    it('derives each worksheet\'s maxLevel from its own catalogue extent', () => {
        // Addition is offered across the whole primary ladder (legacy grades
        // 0..6) → max level 7. Rows & Columns only at grades 1..2 → max 3.
        // The senior-independent families are excluded (next test).
        expect(resolveDifficulty('math', 'addition', 1).maxLevel).toBe(7);
        expect(resolveDifficulty('math', 'rowscolumns', 1).maxLevel).toBe(3);
        expect(resolveDifficulty('math', 'calculus', 1).maxLevel).toBe(SENIOR_MAX_LEVEL);
        // Every english worksheet is offered to legacy Year 6 → max level 7.
        expect(resolveDifficulty('english', 'sight', 1).maxLevel).toBe(7);
        // The Prep-only tracing set tops out at level 1.
        expect(resolveDifficulty('english', 'letterTrace', 1).maxLevel).toBe(1);
    });

    it('saturates oversized levels without changing caps or the seed', () => {
        // Level 99 on Addition clamps to level 7 (legacy grade 6): the caps
        // are the grade-6 caps and the seed parts are the grade-6 parts.
        const saturated = resolveDifficulty('math', 'addition', 99);
        expect(saturated.effectiveLevel).toBe(7);
        expect(saturated.saturated).toBe(true);
        expect(saturated.grade.id).toBe(6);
        expect(saturated.grade.caps.opCap).toBe(getMathGradeConfig(6).caps.opCap);

        // Level 7 (exactly at the max) is NOT saturated and is identical.
        const exact = resolveDifficulty('math', 'addition', 7);
        expect(exact.saturated).toBe(false);
        expect(exact.effectiveLevel).toBe(7);
        expect(exact.grade.caps).toEqual(saturated.grade.caps);

        // Overshooting english tracing (max level 1) saturates to Prep caps.
        const tracing = resolveDifficulty('english', 'letterTrace', 50);
        expect(tracing.effectiveLevel).toBe(1);
        expect(tracing.saturated).toBe(true);
        expect(tracing.grade.caps.wordTier).toBe(1);
    });

    it('carries the REQUESTED level on the plan (titles use it verbatim; no grade labels)', () => {
        // The plan exposes NO levelLabel: every title is built as
        // "<Label> level <plan.level>" — the requested level, grade-free.
        const at = resolveDifficulty('math', 'addition', 7);
        expect(at.level).toBe(7);
        expect(at.effectiveLevel).toBe(7);
        const over = resolveDifficulty('math', 'addition', 99);
        expect(over.level).toBe(99); // the requested level survives the cap
        expect(over.effectiveLevel).toBe(7); // only GENERATION clamps
        expect(over).not.toHaveProperty('levelLabel');
    });

    it('marks levels below a worksheet\'s intro level as not yet offered', () => {
        // Fractions join at legacy Year 3 (grade 3) → intro level 4.
        const before = resolveDifficulty('math', 'fractions', 3);
        expect(before.notYetOffered).toBe(true);
        expect(before.introLevel).toBe(4);
        const at = resolveDifficulty('math', 'fractions', 4);
        expect(at.notYetOffered).toBe(false);
        expect(at.grade.caps.denSet).toEqual([2, 3, 4, 5, 10]);
        // The T5 english literacy families join at legacy Year 3 → level 4.
        expect(resolveDifficulty('english', 'comprehension', 3).notYetOffered).toBe(true);
        expect(resolveDifficulty('english', 'comprehension', 4).notYetOffered).toBe(false);
    });

    it('normalises garbage levels through the plan', () => {
        const plan = resolveDifficulty('math', 'addition', Number.NaN);
        expect(plan.level).toBe(MIN_LEVEL);
        expect(plan.effectiveLevel).toBe(1);
    });
});

describe('the independent senior ladder — advanced topics never require Year 11', () => {
    it('recognises exactly the six senior families', () => {
        expect(SENIOR_WORKSHEET_IDS).toEqual([
            'calculus', 'functions', 'polynomials', 'trigonometry', 'expolog', 'prob11'
        ]);
        for (const id of SENIOR_WORKSHEET_IDS) expect(isSeniorWorksheet(id)).toBe(true);
        expect(isSeniorWorksheet('addition')).toBe(false);
        expect(isSeniorWorksheet('fractions')).toBe(false);
    });

    it('introduces the senior families at level 1 on their own rungs', () => {
        const intro = resolveDifficulty('math', 'calculus', 1);
        expect(intro.notYetOffered).toBe(false);
        expect(intro.effectiveLevel).toBe(1);
        expect(intro.maxLevel).toBe(SENIOR_MAX_LEVEL);
        // The rung rides in caps.yearLevel — what the senior generators read.
        expect(intro.grade.caps.yearLevel).toBe(1);
        // The synthetic config keeps the legacy available list, so the
        // plugins' own offered() checks keep working at every rung.
        expect(intro.grade.available).toContain('calculus');
        expect(intro.grade.implemented).toBe(true);
    });

    it('progresses Intro → Developing → Full and saturates at the full rung', () => {
        expect(resolveDifficulty('math', 'calculus', 1).grade.caps.yearLevel).toBe(1);
        expect(resolveDifficulty('math', 'calculus', 2).grade.caps.yearLevel).toBe(2);
        expect(resolveDifficulty('math', 'calculus', 3).grade.caps.yearLevel).toBe(3);
        // Overshooting clamps to the FULL rung, saturated.
        const overshoot = resolveDifficulty('math', 'calculus', 12);
        expect(overshoot.effectiveLevel).toBe(3);
        expect(overshoot.saturated).toBe(true);
        expect(overshoot.grade.caps.yearLevel).toBe(3);
    });

    it('seniorRung clamps caps into the supported 1..3 band', () => {
        expect(seniorRung({ yearLevel: 0 } as never)).toBe(MIN_LEVEL);
        expect(seniorRung({ yearLevel: 1 } as never)).toBe(1);
        expect(seniorRung({ yearLevel: 3 } as never)).toBe(3);
        expect(seniorRung({ yearLevel: 11 } as never)).toBe(3);
        expect(seniorRung({ yearLevel: Number.NaN } as never)).toBe(MIN_LEVEL);
    });
});

describe('the shared science ladder — chemistry/physics resolve through SCIENCE_GRADES', () => {
    it('offers every science plugin from level 1 with the rung riding caps.yearLevel', () => {
        for (const subject of ['chemistry', 'physics'] as const) {
            for (const specId of ['elements', 'balancing', 'speed', 'circuits']) {
                const plan = resolveDifficulty(subject, specId, 1);
                expect(plan.notYetOffered).toBe(false);
                expect(plan.effectiveLevel).toBe(1);
                expect(plan.grade.id).toBe(0);
                expect(plan.grade.implemented).toBe(true);
                // The rung = the level: the dial the science generators read.
                expect(plan.grade.caps.yearLevel).toBe(1);
                // The science rows list all four ids, so offered() gates pass.
                expect(plan.grade.available).toContain(specId);
            }
        }
    });

    it('caps every science plugin at level 4 with silent saturation beyond', () => {
        for (const subject of ['chemistry', 'physics'] as const) {
            for (const specId of ['elements', 'balancing', 'speed', 'circuits']) {
                // Level 4 is the top: implemented, not saturated.
                const top = resolveDifficulty(subject, specId, 4);
                expect(top.maxLevel).toBe(4);
                expect(top.effectiveLevel).toBe(4);
                expect(top.saturated).toBe(false);
                expect(top.grade.caps.yearLevel).toBe(4);
                // Level 5 and beyond saturate SILENTLY to the level-4 caps.
                for (const requested of [5, 42, 99]) {
                    const over = resolveDifficulty(subject, specId, requested);
                    expect(over.level).toBe(requested);
                    expect(over.effectiveLevel).toBe(4);
                    expect(over.maxLevel).toBe(4);
                    expect(over.saturated).toBe(true);
                    expect(over.grade.caps.yearLevel).toBe(4);
                }
            }
        }
    });

    it('keeps the saturation seed parity: the same effective grade id seeds level 4 and level 99', () => {
        const atCap = resolveDifficulty('chemistry', 'elements', 4);
        const overshot = resolveDifficulty('chemistry', 'elements', 99);
        expect(difficultySeedParts(atCap, 'elements', 0)).toEqual(difficultySeedParts(overshot, 'elements', 0));
    });

    it('treats chemistry and physics as distinct subjects over the shared rows', () => {
        // The two subjects resolve the SAME science rows (ids are unique, so
        // a physics id never registers against the chemistry bundle).
        const chemistryPlan = resolveDifficulty('chemistry', 'speed', 2);
        const physicsPlan = resolveDifficulty('physics', 'speed', 2);
        expect(chemistryPlan.grade).toEqual(physicsPlan.grade);
        // ...but the senior-maths branch stays math-only (science ids are
        // never senior).
        expect(isSeniorWorksheet('elements')).toBe(false);
        expect(isSeniorWorksheet('circuits')).toBe(false);
    });

    it('normalises garbage levels through the science plan', () => {
        const plan = resolveDifficulty('physics', 'speed', Number.NaN);
        expect(plan.level).toBe(MIN_LEVEL);
        expect(plan.effectiveLevel).toBe(1);
        expect(plan.grade.caps.yearLevel).toBe(1);
    });
});
