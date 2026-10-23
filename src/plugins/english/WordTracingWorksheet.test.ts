// Unit tests for the WORD TRACING worksheet plugin.
//
// The tracing generators are SEEDED-DECK, not frozen: page 1 is the first
// 6 [letter, word] pairs dealt from a shuffled A–Z word set, page 2
// CONTINUES the same deck (a different group — the old sheet repeated a
// frozen A–Z page instead), and a new refresh seed re-rolls the grouping.
// Every pin below is the exact output of the pinned seed
// (seedFrom([grade, id, refresh])) — the deck order was captured by running
// the generator once, then hardcoded.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, generateDocument, type GradeConfig } from '../../framework';
import { wordTraceSpec } from './WordTracingWorksheet';
import { KNOWN_WORD_SET } from './words';

const g0 = getEnglishGradeConfig(0);
const g1 = getEnglishGradeConfig(1);
const g2 = getEnglishGradeConfig(2);

// Helper: regenerate a sheet using the same seed the framework computes.
function sheet(grade: GradeConfig) {
    return generateSheet(wordTraceSpec, grade, seedFrom([grade.id, wordTraceSpec.id, 0]));
}

describe('wordTrace plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, page size and single-column layout', () => {
        expect(wordTraceSpec.id).toBe('wordTrace');
        expect(wordTraceSpec.label).toBe('Word Tracing');
        expect(wordTraceSpec.icon).toBe('a');
        // 6 rows on long full-width writing lines: a traced word needs the
        // whole page width at the writable tracing scale, not a cramped
        // half-column (the old sheet flooded 26 rows in two columns).
        expect(wordTraceSpec.perPage).toBe(6);
        expect(wordTraceSpec.singleColumn).toBe(true);
    });

    it('describes its scope (A–Z beginning words)', () => {
        expect(wordTraceSpec.scope(g0)).toBe('A–Z beginning words');
    });

    it('is offered for Prep only (Y1/Y2 get reading tasks instead)', () => {
        expect(wordTraceSpec.offered(g0)).toBe(true);
        expect(wordTraceSpec.offered(g1)).toBe(false);
        expect(wordTraceSpec.offered(g2)).toBe(false);
        expect(wordTraceSpec.offered(getEnglishGradeConfig(3))).toBe(false);
        // Unoffered type => empty sheet even with a dashboard-shaped seed.
        expect(generateSheet(wordTraceSpec, g1, seedFrom([1, 'wordTrace', 0]))).toEqual([]);
        expect(generateSheet(wordTraceSpec, g2, seedFrom([2, 'wordTrace', 0]))).toEqual([]);
    });
});

describe('wordTrace — Prep (seeded deck over the A–Z word set, 6 per page)', () => {
    it('matches the exact page-1 sheet (seed 0 deck: apple hat yellow open in leg)', () => {
        expect(sheet(g0)).toEqual([
        {"prompt":"Trace the word \"apple\" (begins with \"A\")","answer":"apple","model":"A","trace":"apple","visual":"apple","id":1,"type":"wordTrace"},
        {"prompt":"Trace the word \"hat\" (begins with \"H\")","answer":"hat","model":"H","trace":"hat","visual":"hat","id":2,"type":"wordTrace"},
        {"prompt":"Trace the word \"yellow\" (begins with \"Y\")","answer":"yellow","model":"Y","trace":"yellow","id":3,"type":"wordTrace"},
        {"prompt":"Trace the word \"open\" (begins with \"O\")","answer":"open","model":"O","trace":"open","id":4,"type":"wordTrace"},
        {"prompt":"Trace the word \"in\" (begins with \"I\")","answer":"in","model":"I","trace":"in","id":5,"type":"wordTrace"},
        {"prompt":"Trace the word \"leg\" (begins with \"L\")","answer":"leg","model":"L","trace":"leg","id":6,"type":"wordTrace"}
]);
    });

    it('page 2 continues the SAME deck with a different group (ids 7..12)', () => {
        const d = generateDocument(wordTraceSpec, g0, seedFrom([0, 'wordTrace', 0]), 2);
        // Same cycle, next six pairs — no word repeats across the page
        // boundary, and the group/order differs from page 1.
        expect(d.pages[1]).toEqual([
        {"prompt":"Trace the word \"map\" (begins with \"M\")","answer":"map","model":"M","trace":"map","visual":"map","id":7,"type":"wordTrace"},
        {"prompt":"Trace the word \"dog\" (begins with \"D\")","answer":"dog","model":"D","trace":"dog","visual":"dog","id":8,"type":"wordTrace"},
        {"prompt":"Trace the word \"queen\" (begins with \"Q\")","answer":"queen","model":"Q","trace":"queen","id":9,"type":"wordTrace"},
        {"prompt":"Trace the word \"go\" (begins with \"G\")","answer":"go","model":"G","trace":"go","id":10,"type":"wordTrace"},
        {"prompt":"Trace the word \"van\" (begins with \"V\")","answer":"van","model":"V","trace":"van","id":11,"type":"wordTrace"},
        {"prompt":"Trace the word \"jam\" (begins with \"J\")","answer":"jam","model":"J","trace":"jam","id":12,"type":"wordTrace"}
]);
        expect(d.pages[1].map((p) => p.answer)).not.toEqual(d.pages[0].map((p) => p.answer));
    });

    it('Randomize re-rolls the grouping (refresh 1 deck: zoo yellow sun net cat rat)', () => {
        expect(generateSheet(wordTraceSpec, g0, seedFrom([0, 'wordTrace', 1]))).toEqual([
        {"prompt":"Trace the word \"zoo\" (begins with \"Z\")","answer":"zoo","model":"Z","trace":"zoo","id":1,"type":"wordTrace"},
        {"prompt":"Trace the word \"yellow\" (begins with \"Y\")","answer":"yellow","model":"Y","trace":"yellow","id":2,"type":"wordTrace"},
        {"prompt":"Trace the word \"sun\" (begins with \"S\")","answer":"sun","model":"S","trace":"sun","visual":"sun","id":3,"type":"wordTrace"},
        {"prompt":"Trace the word \"net\" (begins with \"N\")","answer":"net","model":"N","trace":"net","visual":"net","id":4,"type":"wordTrace"},
        {"prompt":"Trace the word \"cat\" (begins with \"C\")","answer":"cat","model":"C","trace":"cat","visual":"cat","id":5,"type":"wordTrace"},
        {"prompt":"Trace the word \"rat\" (begins with \"R\")","answer":"rat","model":"R","trace":"rat","visual":"rat","id":6,"type":"wordTrace"}
]);
    });

    // Exact cue density for the pinned seed: 2 of the 6 dealt words
    // (apple, hat) have a registered pictogram; the rest print plain
    // (graceful degradation — see framework/visuals.tsx hasVisual).
    it('page 1 carries cues for exactly the 2 registered words of the dealt group', () => {
        const rows = sheet(g0);
        expect(rows.filter((p) => typeof p.visual === 'string').length).toBe(2);
        expect(rows.filter((p) => typeof p.visual === 'string').map((p) => p.visual)).toEqual(['apple', 'hat']);
    });

    // Deck contract: the 26-word set is finite, so long documents repeat by
    // nature — but ONE full cycle (the first 26 deals) covers every word
    // exactly once. Evenly spread practice, no fabricated capacity.
    it('one full deck cycle (first 26 rows) deals every word exactly once', () => {
        const first26 = generateDocument(wordTraceSpec, g0, seedFrom([0, 'wordTrace', 0]), 5)
            .pages.flat()
            .slice(0, 26);
        expect(first26.map((p) => p.answer).sort()).toEqual(
            ['apple','bird','cat','dog','eat','fish','go','hat','in','jam','kick','leg','map','net','open','pen','queen','rat','sun','top','up','van','water','xylophone','yellow','zoo']
        );
    });

    // Semantic invariants: the trace target IS the word (the answer), the
    // model is its capital first letter, and every traced word is a real,
    // known word (Prep bank — see KNOWN_WORD_SET in words.ts).
    it('every row traces a real word with the right model letter', () => {
        for (const p of sheet(g0)) {
            expect(p.trace).toBe(p.answer);
            expect(p.model).toBe(p.answer[0].toUpperCase());
            expect(KNOWN_WORD_SET.has(p.answer)).toBe(true);
        }
    });
});
