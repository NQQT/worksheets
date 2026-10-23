// Unit tests for the CLOCK FACES worksheet plugin (T2V density pass).
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Only grades that list 'clock' in their
// catalogue AND have clockCap > 0 offer the sheet (currently Year 2).
//
// Every clock item carries a `clock` figure (framework/types.ts ClockFigure):
// hands drawn for reading items, `hands: false` (blank face) for drawing
// items, and NO figure for the pure-text conversion items.
//
// T2V pass pinned below: SIX single-column items per page (was ten
// two-column) so each 100px face and its wide blank/answer line get real
// room; the five exercise kinds and the 48-face × mode space (capacity 146)
// are deliberately unchanged.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, createRng } from '../../framework';
import { clockSpec } from './ClockWorksheet';

const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(clockSpec, grade, seedFrom([grade.id, clockSpec.id, 0]));
}

// Independent word/digital forms for the quarter scale (the answers must
// match these EXACT strings — the student-facing convention).
function words(h: number, m: number): string {
    if (m === 0) return `${h} o'clock`;
    if (m === 15) return `quarter past ${h}`;
    if (m === 30) return `half past ${h}`;
    return `quarter to ${(h % 12) + 1}`;
}
function digital(h: number, m: number): string {
    return `${h}:${m === 0 ? '00' : m}`;
}

describe('clock plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, reduced page size and roomy layout', () => {
        expect(clockSpec.id).toBe('clock');
        expect(clockSpec.label).toBe('Clock Faces');
        expect(clockSpec.icon).toBe('⏱');
        // Six single-column items: full face + prose + writing space each.
        expect(clockSpec.perPage).toBe(6);
        expect(clockSpec.singleColumn).toBe(true);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(clockSpec.scope(g1)).toBe("o'clock & half past");
        expect(clockSpec.scope(g2)).toBe("o'clock, half past, quarter past & to");
    });
});

describe('clock — availability gating', () => {
    it('Year 1 does not offer the sheet (empty); Year 2 does', () => {
        expect(sheet(g1)).toEqual([]);
        expect(sheet(g2)).toHaveLength(6);
    });
});

describe('clock — Year 2 (reading, drawing and conversions, quarter scale)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"Quarter to 9 is the same time in digital:","answer":"8:45","answerLine":true,"id":1,"type":"clock"},
            {"prompt":"3:30 is the same time in words:","answer":"half past 3","answerLine":true,"id":2,"type":"clock"},
            {"prompt":"Write the digital time the clock shows:__","answer":"11:45","clock":{"hour":11,"minute":45},"wideBlanks":true,"id":3,"type":"clock"},
            {"prompt":"Quarter to 2 is the same time in digital:","answer":"1:45","answerLine":true,"id":4,"type":"clock"},
            {"prompt":"Quarter past 12 is the same time in digital:","answer":"12:15","answerLine":true,"id":5,"type":"clock"},
            {"prompt":"Write the digital time the clock shows:__","answer":"5:45","clock":{"hour":5,"minute":45},"wideBlanks":true,"id":6,"type":"clock"},
        ]);
    });

    it('fill-in items use wide inline blanks; conversion items use the bottom answer line', () => {
        // A longer stream exercises all five kinds; the pinned page above is
        // conversion-heavy by seed, so the contract is checked over 60 items.
        const s = clockSpec.generate(createRng(seedFrom([2, 'clock', 0])), g2.caps, 60);
        // Reading items keep an inline wide "__" blank after the question.
        const inline = s.filter((p) => p.prompt.includes('__'));
        expect(inline.length).toBeGreaterThan(0);
        for (const p of inline) {
            expect(p.wideBlanks).toBe(true);
            expect(p.answerLine).toBeUndefined();
        }
        // Conversion items end with ":" and answer on a full-width line BELOW
        // the prompt — no inline blank at all.
        const conversions = s.filter((p) => p.prompt.includes('is the same time in'));
        expect(conversions.length).toBeGreaterThan(0);
        for (const p of conversions) {
            expect(p.prompt.endsWith(':')).toBe(true);
            expect(p.answerLine).toBe(true);
            expect(p.wideBlanks).toBeUndefined();
        }
        // The draw items have neither (the student draws on the blank face).
        const draws = s.filter((p) => p.prompt.startsWith('Draw the hands'));
        expect(draws.length).toBeGreaterThan(0);
        for (const p of draws) {
            expect(p.wideBlanks).toBeUndefined();
            expect(p.answerLine).toBeUndefined();
        }
    });

    it('only draw items get a blank face; reading items get drawn hands; conversions get no figure', () => {
        const s = clockSpec.generate(createRng(seedFrom([2, 'clock', 0])), g2.caps, 60);
        const draws = s.filter((p) => p.prompt.startsWith('Draw the hands'));
        for (const p of draws) {
            expect(p.clock).toBeDefined();
            expect(p.clock!.hands).toBe(false);
        }
        const reads = s.filter((p) => p.prompt.includes('the clock shows') || p.prompt.includes('shown on the clock'));
        expect(reads.length).toBeGreaterThan(0);
        for (const p of reads) {
            expect(p.clock).toBeDefined();
            expect(p.clock!.hands).toBeUndefined();
        }
        const conversions = s.filter((p) => p.prompt.includes('is the same'));
        for (const p of conversions) {
            expect(p.clock).toBeUndefined();
        }
    });

    it('every answer matches the printed time exactly (independent word/digital forms)', () => {
        const s = clockSpec.generate(createRng(seedFrom([2, 'clock', 3])), g2.caps, 120);
        for (const p of s) {
            if (p.prompt.startsWith('Draw the hands to show ')) {
                // "Draw the hands to show {words}." + answer
                // "{digital} — hour hand on {h}, minute hand on {mark}".
                const want = p.prompt.match(/show (.+)\.$/)![1];
                const [dig, hands] = p.answer.split(' — ');
                const [h, m] = dig.split(':').map(Number);
                expect(words(h, m)).toBe(want);
                expect(hands).toBe(`hour hand on ${h}, minute hand on ${m === 0 ? 12 : (m / 15) * 3}`);
                expect(p.clock).toEqual({ hour: h, minute: m, hands: false });
            } else if (p.prompt.includes('is the same time in digital:')) {
                const want = p.prompt.replace(/ is the same time in digital:$/, '');
                // word → digital: find the (h, m) whose word form is the
                // (sentence-capitalised) prompt phrase, check it exactly.
                const found = findTime(want.toLowerCase());
                expect(p.answer).toBe(digital(found.h, found.m));
            } else if (p.prompt.includes('is the same time in words:')) {
                const [h, m] = p.prompt.match(/^(\d+):(\d+)/)!.slice(1).map(Number);
                expect(p.answer).toBe(words(h, m));
            } else if (p.prompt.startsWith('What time is shown') || p.prompt.startsWith('Write the digital')) {
                const { hour, minute } = p.clock!;
                expect(p.answer).toBe(p.prompt.startsWith('What time') ? words(hour, minute) : digital(hour, minute));
            }
        }
    });

    it('keeps every clock figure within the 1-12 hour / quarter-scale minutes', () => {
        const s = generateSheet(clockSpec, g2, seedFrom([g2.id, clockSpec.id, 7]));
        for (const p of s) {
            if (!p.clock) continue;
            expect(p.clock.hour).toBeGreaterThanOrEqual(1);
            expect(p.clock.hour).toBeLessThanOrEqual(12);
            expect([0, 15, 30, 45]).toContain(p.clock.minute);
        }
    });

    it('the 48-face × 5-mode space stays at 146 distinct prompts', () => {
        // read-words and read-digital each print ONE fixed sentence whose
        // question is the drawn face; draw / words→digital / digital→words
        // carry 48 distinct prompts each: 1 + 1 + 48 + 48 + 48 = 146.
        const s = clockSpec.generate(createRng(seedFrom([2, 'clock', 0])), g2.caps, 600);
        expect(new Set(s.map((p) => p.prompt)).size).toBe(146);
        // The sampling key is prompt + figure, so the first 146 DEALS are 146
        // distinct tasks (the two read-mode sentences repeat only because
        // their faces differ — the old prompt-only coverage claim no longer
        // holds and is replaced by the key it actually samples on).
        expect(new Set(s.slice(0, 146).map((p) => `${p.prompt}|${JSON.stringify(p.clock ?? null)}`)).size).toBe(146);
    });
});

// Locate the unique (hour, minute) whose word form is the given lower-case
// phrase (used to check words→digital conversions independently).
function findTime(phrase: string): { h: number; m: number } {
    for (let h = 1; h <= 12; h++) {
        for (const m of [0, 15, 30, 45]) {
            if (words(h, m) === phrase) return { h, m };
        }
    }
    throw new Error(`no clock time matches "${phrase}"`);
}
