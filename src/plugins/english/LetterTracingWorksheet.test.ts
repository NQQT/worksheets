// Unit tests for the LETTER TRACING worksheet plugin.
//
// The tracing generators are SEEDED-DECK, not frozen: page 1 is the first
// 8 letters dealt from a shuffled alphabet, page 2 CONTINUES the same deck
// (a different group — the old sheet repeated a frozen A–Z page instead),
// and a new refresh seed re-rolls the whole grouping. Every pin below is the
// exact output of the pinned seed (seedFrom([grade, id, refresh])) — the
// deck order was captured by running the generator once, then hardcoded.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, type GradeConfig } from '../../framework';
import { letterTraceSpec } from './LetterTracingWorksheet';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(letterTraceSpec, grade, seedFrom([grade.id, letterTraceSpec.id, 0]));
}

describe('letterTrace plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(letterTraceSpec.id).toBe('letterTrace');
        expect(letterTraceSpec.label).toBe('Letter Tracing');
        expect(letterTraceSpec.icon).toBe('⌗');
        // 8 rows (4 per column) at the writable tracing scale — a small
        // grouped practice page, not the old frozen 26-row A–Z wall.
        expect(letterTraceSpec.perPage).toBe(8);
    });

    it('describes its scope (A–Z letter shapes)', () => {
        expect(letterTraceSpec.scope(g0)).toBe('A–Z letter shapes');
    });

    it('is offered for Prep only (Y1/Y2 get reading tasks instead)', () => {
        expect(letterTraceSpec.offered(g0)).toBe(true);
        expect(letterTraceSpec.offered(g1)).toBe(false);
        expect(letterTraceSpec.offered(g2)).toBe(false);
        expect(letterTraceSpec.offered(getEnglishGradeConfig(3))).toBe(false);
        // Unoffered type => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(letterTraceSpec, g1, seedFrom([1, 'letterTrace', 0]))).toEqual([]);
        expect(generateSheet(letterTraceSpec, g2, seedFrom([2, 'letterTrace', 0]))).toEqual([]);
    });
});

describe('letterTrace — Prep (seeded deck over A–Z, 8 letters per page)', () => {
    it('matches the exact page-1 sheet (seed 0 deck deals G W T I J U R Y)', () => {
        expect(sheet(g0)).toEqual([
        {"id":1,"type":"letterTrace","prompt":"Trace the letter \"G\"","answer":"G","model":"G","trace":"G G G"},
        {"id":2,"type":"letterTrace","prompt":"Trace the letter \"W\"","answer":"W","model":"W","trace":"W W W"},
        {"id":3,"type":"letterTrace","prompt":"Trace the letter \"T\"","answer":"T","model":"T","trace":"T T T"},
        {"id":4,"type":"letterTrace","prompt":"Trace the letter \"I\"","answer":"I","model":"I","trace":"I I I"},
        {"id":5,"type":"letterTrace","prompt":"Trace the letter \"J\"","answer":"J","model":"J","trace":"J J J"},
        {"id":6,"type":"letterTrace","prompt":"Trace the letter \"U\"","answer":"U","model":"U","trace":"U U U"},
        {"id":7,"type":"letterTrace","prompt":"Trace the letter \"R\"","answer":"R","model":"R","trace":"R R R"},
        {"id":8,"type":"letterTrace","prompt":"Trace the letter \"Y\"","answer":"Y","model":"Y","trace":"Y Y Y"}
]);
    });

    it('page 2 continues the SAME deck with a different group (ids 9..16)', () => {
        const d = generateDocument(letterTraceSpec, g0, seedFrom([0, 'letterTrace', 0]), 2);
        // Same cycle, next eight cards — no letter repeats across the page
        // boundary, and the group/order differs from page 1 (the old frozen
        // sheet re-printed A–Z on every page).
        expect(d.pages[1]).toEqual([
        {"id":9,"type":"letterTrace","prompt":"Trace the letter \"N\"","answer":"N","model":"N","trace":"N N N"},
        {"id":10,"type":"letterTrace","prompt":"Trace the letter \"S\"","answer":"S","model":"S","trace":"S S S"},
        {"id":11,"type":"letterTrace","prompt":"Trace the letter \"M\"","answer":"M","model":"M","trace":"M M M"},
        {"id":12,"type":"letterTrace","prompt":"Trace the letter \"H\"","answer":"H","model":"H","trace":"H H H"},
        {"id":13,"type":"letterTrace","prompt":"Trace the letter \"F\"","answer":"F","model":"F","trace":"F F F"},
        {"id":14,"type":"letterTrace","prompt":"Trace the letter \"B\"","answer":"B","model":"B","trace":"B B B"},
        {"id":15,"type":"letterTrace","prompt":"Trace the letter \"A\"","answer":"A","model":"A","trace":"A A A"},
        {"id":16,"type":"letterTrace","prompt":"Trace the letter \"E\"","answer":"E","model":"E","trace":"E E E"}
]);
        expect(d.pages[1].map((p) => p.answer)).not.toEqual(d.pages[0].map((p) => p.answer));
    });

    it('documents chunk per page with continuous ids (2 pages = 16 rows)', () => {
        const d = generateDocument(letterTraceSpec, g0, seedFrom([0, 'letterTrace', 0]), 2);
        expect(d.pages).toHaveLength(2);
        expect(d.total).toBe(16);
        // Page 1 is byte-identical to the single-page sheet (one seeded
        // stream, so re-rolls and re-splits can never drift).
        expect(d.pages[0]).toEqual(sheet(g0));
        expect(d.pages.flat().map((p) => p.id)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    });

    it('Randomize re-rolls the grouping (refresh 1 deck deals Y A E Q F K P Z)', () => {
        expect(generateSheet(letterTraceSpec, g0, seedFrom([0, 'letterTrace', 1]))).toEqual([
        {"id":1,"type":"letterTrace","prompt":"Trace the letter \"Y\"","answer":"Y","model":"Y","trace":"Y Y Y"},
        {"id":2,"type":"letterTrace","prompt":"Trace the letter \"A\"","answer":"A","model":"A","trace":"A A A"},
        {"id":3,"type":"letterTrace","prompt":"Trace the letter \"E\"","answer":"E","model":"E","trace":"E E E"},
        {"id":4,"type":"letterTrace","prompt":"Trace the letter \"Q\"","answer":"Q","model":"Q","trace":"Q Q Q"},
        {"id":5,"type":"letterTrace","prompt":"Trace the letter \"F\"","answer":"F","model":"F","trace":"F F F"},
        {"id":6,"type":"letterTrace","prompt":"Trace the letter \"K\"","answer":"K","model":"K","trace":"K K K"},
        {"id":7,"type":"letterTrace","prompt":"Trace the letter \"P\"","answer":"P","model":"P","trace":"P P P"},
        {"id":8,"type":"letterTrace","prompt":"Trace the letter \"Z\"","answer":"Z","model":"Z","trace":"Z Z Z"}
]);
    });

    // Deck contract: the alphabet is finite, so long documents repeat by
    // nature — but ONE full cycle (the first 26 deals) covers every letter
    // exactly once. Evenly spread practice, no fabricated capacity.
    it('one full deck cycle (first 26 rows) deals every letter exactly once', () => {
        const first26 = generateDocument(letterTraceSpec, g0, seedFrom([0, 'letterTrace', 0]), 4)
            .pages.flat()
            .slice(0, 26);
        expect(first26.map((p) => p.answer).sort()).toEqual(
            'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
        );
    });

    // Semantic invariant: answer is a single uppercase letter; the model
    // repeats it and the trace target is that model in three faded copies.
    it('every row is a single uppercase letter with model + 3 copies', () => {
        for (const p of sheet(g0)) {
            expect(/^[A-Z]$/.test(p.answer)).toBe(true);
            expect(p.model).toBe(p.answer);
            expect(p.trace).toBe(`${p.answer} ${p.answer} ${p.answer}`);
        }
    });
});
