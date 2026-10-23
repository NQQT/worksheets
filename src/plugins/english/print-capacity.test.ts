// T15 CORRECTED ANALYTICAL PRINT-CAPACITY REGRESSION — the four Year 3–6
// literacy families (comprehension / craft / writing / editing).
//
// WHY: the A4 sheet clips (overflow: hidden on .print-page) — a page whose
// content exceeds the printable grid budget loses the bottom rows' teacher-
// key lines. jsdom cannot measure rendered height, so this test computes
// page heights ANALYTICALLY from the ACTUAL generated strings.
//
// T15 CORRECTIONS to the T12 model (found by independent review — the old
// whole-string ceil(len/45) model UNDERCOUNTED):
//   • PER-LINE wrapping: every forced '\n' break starts a new printed line
//     (a 29-char ruled line costs a full 30px row — the old model charged it
//     0.64 of a line); each source line wraps at 45 chars (conservative vs
//     the real ~52–57 chars/line for the 20px system-ui/Arial body in the
//     577px text column),
//   • 16px inter-row gaps (ProblemGrid rowGap) — omitted by T12,
//   • 4px answer-key margin per row (AnswerLine marginTop) — omitted by T12,
//   • answer lines wrapped at the SAME 45 chars (very conservative vs the
//     real ~85 chars/line at 13px),
//   • ruled WRITING lines: 10 blanks × 48px + spaces ≈ 525px ≤ 577px column
//     → exactly one 30px line each (blank height 0.8em+2px border sits
//     inside the 30px line box — no extra tallness),
//   • WRITE-BOX/visual accuracy: these four families emit no tileBlanks,
//     tileWords, trace or visual metadata (asserted below), so no tile or
//     pictogram heights are missing from the model.
// Line heights come from the REAL styles: ProblemRow 20px × lineHeight 1.5 =
// 30px; AnswerLine 13px × lineHeight 1.4 = 18.2px. Budget: A4 297mm = 1123px,
// minus 12mm×2 padding (181px), header stack (~90px) and the multi-page
// footer (~25px) → 915px printable grid (conservative: single-page docs have
// no footer).
//
// Every family × grade must fit with the key ON (worst case) AND the student
// default (key OFF), across FOUR seeds (T12 sampled seed 0 only). This is
// the regression net that Craft perPage 6→5→4 and Editing 6→5 were sized
// against. NOTE: analytical model only — real-browser print remains
// unverified (no headless browser in this environment).
import { describe, expect, it } from 'vitest';
import { createRng, seedFrom, getEnglishGradeConfig, type WorksheetSpec } from '../../framework';
import { comprehensionSpec, craftSpec, writingSpec, editingSpec } from './pins';

// Corrected conservative capacity model constants (see header for sources).
const CHARS_PER_LINE = 45;      // per wrapped line (real ~52–57 @20px, ~85 @13px)
const PROMPT_LINE_PX = 30;      // ProblemRow: 20px font x lineHeight 1.5
const ANSWER_LINE_PX = 18.2;    // AnswerLine: 13px font x lineHeight 1.4
const ANSWER_MARGIN_PX = 4;     // AnswerLine marginTop (key ON only)
const ROW_GAP_PX = 16;          // ProblemGrid rowGap between rows
const GRID_BUDGET_PX = 915;     // printable grid height per A4 page (see header)

// Seeds swept for the worst page (T12 used seed 0 only; T15 review found
// seed-dependent tail pages, so the pins below are worst-over-seeds).
const SEEDS = [0, 11, 23, 41];

// Printed line count of one string: each '\n' segment takes at least one
// line; '__' runs are fixed-width rules (counted as their literal text,
// trailing spaces trimmed) and always fit on ONE line (10 blanks ≈ 525px in
// the 577px column), so a ruled line costs exactly 1.
function printedLines(s: string): number {
    return s.split('\n').reduce(
        (n, line) => n + Math.max(1, Math.ceil(line.replace(/__/g, '').trimEnd().length / CHARS_PER_LINE)),
        0
    );
}

// Height of one printed page under the corrected model: per-row wrapped
// prompt lines (+ answer lines and their 4px margin when the key is on)
// plus the 16px gaps between rows.
function pageHeight(rows: { prompt: string; answer: string }[], keyOn: boolean): number {
    const content = rows.reduce(
        (h, r) =>
            h +
            printedLines(r.prompt) * PROMPT_LINE_PX +
            (keyOn ? printedLines(r.answer) * ANSWER_LINE_PX + ANSWER_MARGIN_PX : 0),
        0
    );
    return content + Math.max(0, rows.length - 1) * ROW_GAP_PX;
}

// Worst single-page height across the 100-page ask for one spec × grade,
// swept over all SEEDS (deterministic 1dp pin, float-safe).
function worstPage(spec: WorksheetSpec, gradeId: number, keyOn: boolean): number {
    const grade = getEnglishGradeConfig(gradeId);
    let worst = 0;
    for (const seed of SEEDS) {
        const rows = spec.generate(createRng(seedFrom([gradeId, spec.id, seed])), grade.caps, spec.perPage * 100);
        for (let p = 0; p * spec.perPage < rows.length; p++) {
            const page = rows.slice(p * spec.perPage, (p + 1) * spec.perPage);
            if (page.length === 0) break;
            worst = Math.max(worst, pageHeight(page, keyOn));
        }
    }
    return Number(worst.toFixed(1));
}

// Exact worst-page values (px, 1dp) measured from the real strings — the
// regression net: they may only move if a bank/generator/layout changes, and
// the key-ON column must stay under the 915px grid budget.
const WORST: { spec: WorksheetSpec; gradeId: number; keyOn: number; keyOff: number }[] = [
    { spec: comprehensionSpec, gradeId: 3, keyOn: 653.2, keyOff: 540.0 },
    { spec: comprehensionSpec, gradeId: 4, keyOn: 761.4, keyOff: 630.0 },
    { spec: comprehensionSpec, gradeId: 5, keyOn: 827.8, keyOff: 660.0 },
    { spec: comprehensionSpec, gradeId: 6, keyOn: 809.6, keyOff: 660.0 },
    { spec: craftSpec, gradeId: 3, keyOn: 737.8, keyOff: 558.0 },
    { spec: craftSpec, gradeId: 4, keyOn: 804.2, keyOff: 618.0 },
    { spec: craftSpec, gradeId: 5, keyOn: 809.6, keyOff: 648.0 },
    { spec: craftSpec, gradeId: 6, keyOn: 888.8, keyOff: 618.0 },
    { spec: writingSpec, gradeId: 3, keyOn: 671.4, keyOff: 570.0 },
    { spec: writingSpec, gradeId: 4, keyOn: 713.2, keyOff: 600.0 },
    { spec: writingSpec, gradeId: 5, keyOn: 773.2, keyOff: 660.0 },
    { spec: writingSpec, gradeId: 6, keyOn: 821.4, keyOff: 690.0 },
    { spec: editingSpec, gradeId: 3, keyOn: 625.0, keyOff: 514.0 },
    { spec: editingSpec, gradeId: 4, keyOn: 715.0, keyOff: 604.0 },
    { spec: editingSpec, gradeId: 5, keyOn: 842.4, keyOff: 664.0 },
    { spec: editingSpec, gradeId: 6, keyOn: 890.6, keyOff: 664.0 }
];

describe('print capacity — corrected analytical A4 grid model (per-line 45ch, +16px gaps, +4px key margins, 915px budget)', () => {
    it('T15: density pins — Craft 4 rows/page, Editing 5, prose families 1', () => {
        // T12 cut craft/editing 6→5; T15's corrected model (gaps + margins +
        // forced newlines) showed keyed Craft Y5/Y6 pages at 5 rows had only
        // ~14px realistic headroom and clipped under the 45ch stress, so
        // Craft drops to 4. Editing's corrected worst (key ON) stays well
        // inside the budget at 5, so it stays.
        expect(craftSpec.perPage).toBe(4);
        expect(editingSpec.perPage).toBe(5);
        expect(comprehensionSpec.perPage).toBe(1);
        expect(writingSpec.perPage).toBe(1);
    });

    it('model accuracy: these families emit no write-box/trace/visual rows', () => {
        // The text-only height model is exact ONLY because no row carries
        // tileBlanks/tileWords (WriteBox tiles), trace (64px tracing) or
        // visual (pictogram) metadata — those render taller than one text
        // line. Pinned so a future generator adding tiles here must also
        // extend this model.
        for (const { spec, gradeId } of WORST) {
            const grade = getEnglishGradeConfig(gradeId);
            const rows = spec.generate(createRng(seedFrom([gradeId, spec.id, 0])), grade.caps, spec.perPage);
            for (const r of rows) {
                const meta = r as Record<string, unknown>;
                expect(meta.tileBlanks).toBeUndefined();
                expect(meta.tileWords).toBeUndefined();
                expect(meta.trace).toBeUndefined();
                expect(meta.visual).toBeUndefined();
            }
        }
    });

    for (const { spec, gradeId, keyOn, keyOff } of WORST) {
        it(`${spec.id} grade ${gradeId}: worst keyed page fits the budget (exact pins, worst over ${SEEDS.length} seeds)`, () => {
            const on = worstPage(spec, gradeId, true);
            const off = worstPage(spec, gradeId, false);
            expect(on).toBe(keyOn); // exact worst-page height, key ON
            expect(off).toBe(keyOff); // exact worst-page height, student default
            expect(on).toBeLessThanOrEqual(GRID_BUDGET_PX);
            expect(off).toBeLessThanOrEqual(GRID_BUDGET_PX);
        });
    }
});
