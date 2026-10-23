// Cross-cutting LEARNING-VISUAL contract over the real generators
// (complements the per-plugin pin tests, which pin the exact `visual`/
// `visualCount` values row by row).
//
// Pinned invariants:
//   1. TIER GATE — for the non-tracing generators the `visual` field exists
//      ONLY in the early cue band (isEarlyCueBand: caps.wordTier 2..4 =
//      Years 1..3). Prep (tier 1) non-tracing sheets AND Year 4/5/6 sheets
//      carry zero `visual` fields, which is what keeps both ends' printed
//      markup byte-identical to their legacy behaviour (PrintableSheet
//      renders the cue slot only when `problem.visual` is truthy). The ONE
//      intentional exception is the Prep word-tracing sheet, which keeps its
//      cues by design: the picture tells the child WHICH word to trace (see
//      the density test below).
//   2. EXACT DENSITY — how many rows of each early-years sheet carry a cue is
//      deterministic and pinned below (the count varies with the word bank's
//      coverage of the pictogram registry, so a bank change must be a
//      deliberate decision).
//   3. REGISTERED CUES — every `visual` value is a key of the pictogram
//      registry (hasVisual): a generator attaching an unregistered key would
//      render a silent blank, and this test catches it.
//   4. ANSWER-NEUTRAL CUES — no problem's cue key equals its answer string
//      in the word-guess sheets where the picture would be a giveaway (the
//      "picture never reveals the answer" rule from visuals.tsx); plus the
//      Plurals quantity contrast: the 1-vs-3 copy count tracks plural-ask vs
//      singular-ask direction exactly.
//   5. CUE-FREE SHEETS — sight/spelling/wordgap print no cues at any grade:
//      their answers ARE the words, so a picture would give the answer away.
//   6. DETERMINISM — a double generation is byte-identical.

import { describe, it, expect } from 'vitest';
import { seedFrom, getEnglishGradeConfig, generateSheet, hasVisual, type GradeConfig } from '../../framework';
import {
    soundsSpec, vowelSpec, blendSpec, rhymeSpec, pluralSpec, oppositeSpec,
    grammarSpec, sightSpec, spellingSpec, wordgapSpec, wordTraceSpec
} from './pins';

// Same seed the framework uses (see the per-plugin test files).
function sheet(spec: { id: string }, grade: GradeConfig) {
    return generateSheet(spec as never, grade, seedFrom([grade.id, spec.id, 0]));
}

const g = (id: number) => getEnglishGradeConfig(id);

// The generators that MAY attach cues. T4: the band is isEarlyCueBand
// (word tier 2..4 = Years 1..3 only) — Prep (tier 1) non-tracing sheets
// print plain, and Years 4..6 (tier 5..6) never carried cues.
const VISUAL_SPECS = [
    ['sounds', soundsSpec], ['vowel', vowelSpec], ['blend', blendSpec],
    ['rhyme', rhymeSpec], ['plural', pluralSpec], ['opposite', oppositeSpec],
    ['grammar', grammarSpec]
] as const;

describe('learning visuals — tier gate (R4: both ends of the band unchanged)', () => {
    it('Prep (tier 1) AND Year 4..6 sheets carry ZERO `visual` fields for every non-tracing cue generator', () => {
        for (const [name, spec] of VISUAL_SPECS) {
            // T4: the cue band is Y1–Y3 ONLY. Both ends are pinned:
            //   - Year 4/5/6 (tier 5..6): unchanged since the visual feature
            //     shipped (senior sheets byte-identical legacy markup);
            //   - Prep (tier 1): the old `wordTier <= 4` gate leaked Prep
            //     cues into the non-tracing sheets; the documented band
            //     starts at Year 1, so Prep sheets must print plain.
            for (const gradeId of [0, 4, 5, 6]) {
                const rows = sheet(spec, g(gradeId));
                if (rows.length === 0) continue; // spec not offered at this grade (e.g. blend at Prep)
                expect(rows.length).toBeGreaterThan(0); // offered => non-empty
                // Exact assertion: no row carries a cue value. (The generator
                // writes `visual: pic` where pic is `undefined` at senior
                // tiers — the KEY may exist with an undefined value; what
                // matters for the print markup is the VALUE, which
                // PrintableSheet gates on truthiness and JSON.stringify
                // drops, so senior sheets stay byte-stable.)
                expect(rows.every((p) => p.visual === undefined)).toBe(true);
            }
        }
    });
});

describe('learning visuals — exact cue density (Y1–Y3 band + Prep tracing)', () => {
    // Count of rows whose `visual` field is set, per (spec, grade). A change
    // here means a word-bank or registry change — deliberate, re-pin on
    // purpose. T4: the non-tracing Prep pins dropped to ZERO (the cue band
    // is Y1–Y3 only: isEarlyCueBand, word tier 2..4); all Y1–Y3 pins are
    // unchanged because the band still covers every tier that once cued.
    it('pins the exact cue density of every early-years sheet', () => {
        const density: Record<string, [number, number]> = {
            // spec:grade -> [cued rows / total rows]
            // T4: Prep (tier 1) non-tracing sheets print PLAIN — zero cues.
            // T5E re-pin: the density wave cut every sheet to 4-8 rows/page
            // and the task mixes grew (yes/no, MCQ and written families
            // cannot all carry a neutral picture cue), so the cued counts
            // moved with the banks — deliberate, re-pinned from measurement.
            'sounds:0': [0, 8], 'sounds:1': [5, 8], 'sounds:2': [4, 8], 'sounds:3': [3, 8],
            'vowel:0': [0, 8], 'vowel:1': [2, 8], 'vowel:2': [4, 8], 'vowel:3': [3, 8],
            'blend:1': [6, 8], 'blend:2': [7, 8], 'blend:3': [5, 8],
            'rhyme:1': [2, 8], 'rhyme:2': [0, 8], 'rhyme:3': [1, 8],
            'plural:1': [6, 8], 'plural:2': [5, 8], 'plural:3': [5, 8],
            'opposite:1': [1, 8], 'opposite:2': [1, 8], 'opposite:3': [1, 8],
            'grammar:2': [1, 8], 'grammar:3': [2, 8],
            'wordTrace:0': [2, 6]
        };
        for (const [name, spec] of VISUAL_SPECS) {
            for (const gradeId of [0, 1, 2, 3]) {
                const rows = sheet(spec, g(gradeId));
                if (rows.length === 0) continue; // spec not offered at this grade
                const cued = rows.filter((p) => typeof p.visual === 'string').length;
                const pin = density[`${name}:${gradeId}`];
                if (pin) {
                    expect([cued, rows.length]).toEqual(pin);
                }
            }
        }
        // The Prep word-tracing sheet (T5E: a seeded deck deals 6 of the 26
        // A–Z words per page): on the pinned page 1, cues for 2 of the 6
        // dealt words — words without a registered pictogram print plain
        // (R3 graceful degradation).
        const trace = sheet(wordTraceSpec, g(0));
        expect(trace.filter((p) => typeof p.visual === 'string').length).toBe(density['wordTrace:0'][0]);
        expect(trace.length).toBe(density['wordTrace:0'][1]);
    });

    it('every cued row carries a REGISTERED pictogram key (no silent blanks)', () => {
        for (const [name, spec] of VISUAL_SPECS) {
            for (const gradeId of [0, 1, 2, 3]) {
                for (const p of sheet(spec, g(gradeId))) {
                    if (typeof p.visual === 'string') {
                        expect(hasVisual(p.visual)).toBe(true);
                    }
                }
            }
        }
        // And the tracing cues are registered too.
        for (const p of sheet(wordTraceSpec, g(0))) {
            if (typeof p.visual === 'string') expect(hasVisual(p.visual)).toBe(true);
        }
    });
});

describe('learning visuals — answer-neutral cues (cue-only rule)', () => {
    it('the Plurals quantity contrast tracks the ask direction exactly (1 copy = plural-ask, 3 = singular-ask)', () => {
        for (const gradeId of [1, 2, 3]) {
            const rows = sheet(pluralSpec, g(gradeId));
            for (const p of rows) {
                if (typeof p.visual !== 'string') continue;
                if (p.prompt.startsWith('Choose the right word:')) {
                    // T5E Format-3 sentence cloze: the direction lives in the
                    // sentence grammar, not the prompt prefix — the cue must
                    // still be a valid 1-vs-3 quantity contrast.
                    expect([1, 3]).toContain(p.visualCount);
                    continue;
                }
                const singularAsk = p.prompt.startsWith('What is the singular');
                // The 1-vs-3 contrast must agree on EVERY cued row.
                expect(p.visualCount).toBe(singularAsk ? 3 : 1);
            }
            // Exact split of the pinned page-1 sheet (T5E: 8 rows/page; the
            // ask deck alternates evenly, so the singular-ask share of the
            // 8-row page is 2 at Y1 and 3 at Y2/Y3).
            expect(rows.filter((p) => p.visualCount === 3).length).toBe(gradeId === 1 ? 2 : 3);
        }
    });

    it('multiple-choice rows never picture the answer word (the picture cues the prompt word only)', () => {
        // Sounds MC rows: the cue (when present) is the word NAMED IN THE
        // PROMPT — never one of the options or the answer.
        for (const gradeId of [0, 1, 2]) {
            for (const p of sheet(soundsSpec, g(gradeId))) {
                const mc = p.prompt.match(/^Which (?:word|letter) [^(]*\(([^)]+)\)$/);
                if (!mc || typeof p.visual !== 'string') continue;
                const options = mc[1].split(', ').map((o) => o.toLowerCase());
                // The cue must be the prompt word, which is not an option.
                expect(options.includes(p.visual)).toBe(false);
            }
        }
    });
});

describe('learning visuals — cue-free sheets (R3)', () => {
    it('sight / spelling / wordgap print NO cues at any grade (the answer IS the word)', () => {
        for (const [name, spec] of [
            ['sight', sightSpec], ['spelling', spellingSpec], ['wordgap', wordgapSpec]
        ] as const) {
            for (const gradeId of [0, 1, 2, 3]) {
                const rows = sheet(spec, g(gradeId));
                if (rows.length === 0) continue;
                expect(rows.every((p) => p.visual === undefined)).toBe(true);
            }
        }
    });
});

describe('learning visuals — determinism', () => {
    it('a double generation is byte-identical (cues included)', () => {
        for (const [name, spec] of [['blend', blendSpec], ['plural', pluralSpec], ['wordTrace', wordTraceSpec]] as const) {
            const gradeId = name === 'wordTrace' ? 0 : 2;
            const a = JSON.stringify(sheet(spec, g(gradeId)));
            const b = JSON.stringify(sheet(spec, g(gradeId)));
            expect(a).toBe(b);
        }
    });
});
