// Unit tests for the NUMBER TRACING worksheet plugin.
//
// The tracing generators are SEEDED-DECK, not frozen: page 1 is the first
// 5 digits dealt from a shuffled 0–9 deck, page 2 CONTINUES the same deck
// (the complementary five — the old sheet repeated a frozen 0–9 page), page
// 3 starts a fresh reshuffled cycle, and a new refresh seed re-rolls the
// grouping. Every pin below is the exact output of the pinned seed
// (seedFrom([grade, id, refresh])) — the deck order was captured by running
// the generator once, then hardcoded.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, type GradeConfig } from '../../framework';
import { numberTraceSpec } from './NumberTracingWorksheet';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(numberTraceSpec, grade, seedFrom([grade.id, numberTraceSpec.id, 0]));
}

describe('numberTrace plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, page size and single-column layout', () => {
        expect(numberTraceSpec.id).toBe('numberTrace');
        expect(numberTraceSpec.label).toBe('Number Tracing');
        expect(numberTraceSpec.icon).toBe('12');
        // 5 rows (half the digit set) on long full-width lines: big
        // writable numbers instead of a dense 0–9 list.
        expect(numberTraceSpec.perPage).toBe(5);
        // Number rows print on long full-width writing lines — single-column.
        expect(numberTraceSpec.singleColumn).toBe(true);
    });

    it('describes its scope (0–9 number shapes)', () => {
        expect(numberTraceSpec.scope(g0)).toBe('0–9 number shapes');
    });

    it('is offered for Prep only (Y1/Y2 get reading tasks instead)', () => {
        expect(numberTraceSpec.offered(g0)).toBe(true);
        expect(numberTraceSpec.offered(g1)).toBe(false);
        expect(numberTraceSpec.offered(g2)).toBe(false);
        expect(numberTraceSpec.offered(getEnglishGradeConfig(3))).toBe(false);
        // Unoffered type => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(numberTraceSpec, g1, seedFrom([1, 'numberTrace', 0]))).toEqual([]);
        expect(generateSheet(numberTraceSpec, g2, seedFrom([2, 'numberTrace', 0]))).toEqual([]);
    });
});

describe('numberTrace — Prep (seeded deck over 0–9, 5 digits per page)', () => {
    it('matches the exact page-1 sheet (seed 0 deck: 3 7 2 1 4)', () => {
        expect(sheet(g0)).toEqual([
        {"id":1,"type":"numberTrace","prompt":"Trace the number \"3\"","answer":"3","model":"3","trace":"3 3 3"},
        {"id":2,"type":"numberTrace","prompt":"Trace the number \"7\"","answer":"7","model":"7","trace":"7 7 7"},
        {"id":3,"type":"numberTrace","prompt":"Trace the number \"2\"","answer":"2","model":"2","trace":"2 2 2"},
        {"id":4,"type":"numberTrace","prompt":"Trace the number \"1\"","answer":"1","model":"1","trace":"1 1 1"},
        {"id":5,"type":"numberTrace","prompt":"Trace the number \"4\"","answer":"4","model":"4","trace":"4 4 4"}
]);
    });

    it('page 2 deals the COMPLEMENTARY five digits (ids 6..10)', () => {
        const d = generateDocument(numberTraceSpec, g0, seedFrom([0, 'numberTrace', 0]), 2);
        // Same cycle: together pages 1–2 cover every digit exactly once,
        // and the page-2 group differs from page 1 (no frozen repeat).
        expect(d.pages[1]).toEqual([
        {"id":6,"type":"numberTrace","prompt":"Trace the number \"5\"","answer":"5","model":"5","trace":"5 5 5"},
        {"id":7,"type":"numberTrace","prompt":"Trace the number \"8\"","answer":"8","model":"8","trace":"8 8 8"},
        {"id":8,"type":"numberTrace","prompt":"Trace the number \"9\"","answer":"9","model":"9","trace":"9 9 9"},
        {"id":9,"type":"numberTrace","prompt":"Trace the number \"6\"","answer":"6","model":"6","trace":"6 6 6"},
        {"id":10,"type":"numberTrace","prompt":"Trace the number \"0\"","answer":"0","model":"0","trace":"0 0 0"}
]);
        expect(d.pages[1].map((p) => p.answer)).not.toEqual(d.pages[0].map((p) => p.answer));
    });

    it('page 3 starts a fresh reshuffled cycle (ids 11..15, no back-to-back repeat)', () => {
        const d = generateDocument(numberTraceSpec, g0, seedFrom([0, 'numberTrace', 0]), 3);
        expect(d.pages).toHaveLength(3);
        expect(d.total).toBe(15);
        // New cycle: a DIFFERENT five-digit group, and its first card is
        // not the card dealt last (the deck's cycle-boundary guard).
        expect(d.pages[2]).toEqual([
        {"id":11,"type":"numberTrace","prompt":"Trace the number \"9\"","answer":"9","model":"9","trace":"9 9 9"},
        {"id":12,"type":"numberTrace","prompt":"Trace the number \"3\"","answer":"3","model":"3","trace":"3 3 3"},
        {"id":13,"type":"numberTrace","prompt":"Trace the number \"4\"","answer":"4","model":"4","trace":"4 4 4"},
        {"id":14,"type":"numberTrace","prompt":"Trace the number \"5\"","answer":"5","model":"5","trace":"5 5 5"},
        {"id":15,"type":"numberTrace","prompt":"Trace the number \"6\"","answer":"6","model":"6","trace":"6 6 6"}
]);
        expect(d.pages[2][0].answer).not.toBe(d.pages[1][4].answer);
    });

    it('Randomize re-rolls the grouping (refresh 1 deck: 8 5 9 2 7)', () => {
        expect(generateSheet(numberTraceSpec, g0, seedFrom([0, 'numberTrace', 1]))).toEqual([
        {"id":1,"type":"numberTrace","prompt":"Trace the number \"8\"","answer":"8","model":"8","trace":"8 8 8"},
        {"id":2,"type":"numberTrace","prompt":"Trace the number \"5\"","answer":"5","model":"5","trace":"5 5 5"},
        {"id":3,"type":"numberTrace","prompt":"Trace the number \"9\"","answer":"9","model":"9","trace":"9 9 9"},
        {"id":4,"type":"numberTrace","prompt":"Trace the number \"2\"","answer":"2","model":"2","trace":"2 2 2"},
        {"id":5,"type":"numberTrace","prompt":"Trace the number \"7\"","answer":"7","model":"7","trace":"7 7 7"}
]);
    });

    // Deck contract: the digit set is finite, so long documents repeat by
    // nature — but ONE full cycle (the first 10 deals) covers every digit
    // exactly once. Evenly spread practice, no fabricated capacity.
    it('one full deck cycle (first 10 rows) deals every digit exactly once', () => {
        const first10 = generateDocument(numberTraceSpec, g0, seedFrom([0, 'numberTrace', 0]), 2)
            .pages.flat()
            .slice(0, 10);
        expect(first10.map((p) => p.answer).sort()).toEqual(['0','1','2','3','4','5','6','7','8','9']);
    });

    // Semantic invariant: answer is a single digit; model = digit,
    // trace = 3 copies.
    it('every row is a single digit with model + 3 copies', () => {
        for (const p of sheet(g0)) {
            expect(/^[0-9]$/.test(p.answer)).toBe(true);
            expect(p.model).toBe(p.answer);
            expect(p.trace).toBe(`${p.answer} ${p.answer} ${p.answer}`);
        }
    });
});
