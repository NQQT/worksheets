// Unit tests for the TIME & CALENDAR worksheet plugin.
//
// Deterministic pins: the whole sheet is pinned from seedFrom([grade.id,
// 'time', 0]). The generator now emits EIGHT connected two-part items per
// page (was sixteen one-word answers) — the density pin below is the
// regression guard. The correctness suite re-derives every answer from the
// printed prompt (plus the drawn clock face) across a 10-page document.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, generateDocument, createRng } from '../../framework';
import { timeSpec } from './TimeWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(timeSpec, grade, seedFrom([grade.id, timeSpec.id, 0]));
}

// Calendar vocabulary mirrored from the plugin (tests stay self-contained —
// plugins and their tests never import from each other).
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const AU_SEASON = ['summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter', 'winter', 'winter', 'spring', 'spring', 'spring', 'summer'];
const COLD_RANK: Record<string, number> = { winter: 0, autumn: 1, spring: 2, summer: 3 };

type P = { prompt: string; answer: string; clock?: { hour: number; minute: number } };

// Re-derive the expected answer from the printed prompt (and the drawn clock
// face for clock items). null = prompt matched no known template.
function expectedAnswer(p: P): string | null {
    let m: RegExpMatchArray | null;
    if ((m = p.prompt.match(/^Today is (\w+)\.\n\(a\) What day was yesterday\? __\n\(b\) What day will it be tomorrow\? __$/))) {
        const j = DAYS.indexOf(m[1]);
        return `${DAYS[(j + 6) % 7]}, ${DAYS[(j + 1) % 7]}`;
    }
    if ((m = p.prompt.match(/^Today is (\w+)\.\n\(a\) What day was yesterday\? __\n\(b\) Was yesterday a weekday or a weekend day\? __$/))) {
        const y = DAYS[(DAYS.indexOf(m[1]) + 6) % 7];
        return `${y}, ${y === 'Saturday' || y === 'Sunday' ? 'weekend' : 'weekday'}`;
    }
    if ((m = p.prompt.match(/^Today is (\w+)\. Grandma arrives on (\w+)\.\n\(a\) How many days is it until Grandma arrives\? __\n\(b\) What day is the day BEFORE she arrives\? __$/))) {
        const i1 = DAYS.indexOf(m[1]), i2 = DAYS.indexOf(m[2]);
        return `${i2 - i1}, ${DAYS[i2 - 1]}`;
    }
    if ((m = p.prompt.match(/^My birthday is in (\w+)\.\n\(a\) What month comes just BEFORE \1\? __\n\(b\) What month comes just AFTER \1\? __$/))) {
        const mi = MONTHS.indexOf(m[1]);
        return `${MONTHS[(mi + 11) % 12]}, ${MONTHS[(mi + 1) % 12]}`;
    }
    if ((m = p.prompt.match(/^We are in (\w+) now\.\n\(a\) What month comes after \1\? __\n\(b\) What season is (\w+) in Australia\? __$/))) {
        const next = (MONTHS.indexOf(m[1]) + 1) % 12;
        if (MONTHS[next] !== m[2]) return null;
        return `${MONTHS[next]}, ${AU_SEASON[next]}`;
    }
    if ((m = p.prompt.match(/^It is (\w+) in Australia\.\n\(a\) What season comes after \1\? __\n\(b\) Which is colder there, \1 or (\w+)\? __$/))) {
        const next = SEASONS[(SEASONS.indexOf(m[1]) + 1) % 4];
        if (next !== m[2]) return null;
        const colder = COLD_RANK[m[1]] < COLD_RANK[next] ? m[1] : next;
        return `${next}, ${colder}`;
    }
    if (p.prompt === '(a) How many days are in a week? __\n(b) How many days are in 2 weeks? __') return '7, 14';
    if (p.prompt === '(a) How many months are in a year? __\n(b) How many months are in HALF a year? __') return '12, 6';
    if (p.prompt === 'How many days are in a year? __') return '365';
    // Clock items: the answer must follow from the DRAWN face + the offset.
    if (p.clock && (m = p.prompt.match(/^\(a\) What time is showing on the clock\? __\n\(b\) What time will it be (\d+) hours? later\? __$/))) {
        const h = p.clock.hour, k = +m[1];
        if (p.clock.minute !== 0) return null;
        return `${h} o'clock, ${((h - 1 + k) % 12) + 1} o'clock`;
    }
    if (p.clock && (m = p.prompt.match(/^\(a\) What time is showing on the clock\? __\n\(b\) What time was it (\d+) hours? ago\? __$/))) {
        const h = p.clock.hour, k = +m[1];
        if (p.clock.minute !== 0) return null;
        return `${h} o'clock, ${(((h - 1 - k) % 12) + 12) % 12 + 1} o'clock`;
    }
    if (p.clock && p.prompt === '(a) What time is showing on the clock? __\n(b) What time will it be one hour later? __') {
        if (p.clock.minute !== 30) return null;
        const h = p.clock.hour;
        return `half past ${h}, half past ${(h % 12) + 1}`;
    }
    return null;
}

describe('time plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and reduced page size', () => {
        expect(timeSpec.id).toBe('time');
        expect(timeSpec.label).toBe('Time & Calendar');
        expect(timeSpec.icon).toBe('◷');
        // Density regression: six connected items per page (was 16, then 8)
        // — day stories print single-column (T3M3 — see
        // plugins/layout-capacity.test.ts).
        expect(timeSpec.perPage).toBe(6);
        expect(timeSpec.singleColumn).toBe(true);
    });

    it('describes its scope from the clock capability', () => {
        expect(timeSpec.scope(g1)).toBe('days, months & seasons');
        expect(timeSpec.scope(g2)).toBe('calendar & time to the half hour');
    });
});

describe('time — availability gating', () => {
    it('Prep does not offer time (empty sheet)', () => {
        expect(sheet(g0)).toEqual([]);
    });

    it('Year 1 has no clock items (clockCap = 0)', () => {
        const doc = generateDocument(timeSpec, g1, seedFrom([1, 'time', 0]), 10);
        for (const page of doc.pages) {
            for (const p of page) {
                expect(p.clock).toBeUndefined();
                expect(p.prompt).not.toContain('clock');
            }
        }
    });
});

describe('time — Year 1', () => {
    it('matches the exact sheet (two-part calendar reasoning, answers correct)', () => {
        expect(sheet(g1)).toEqual([
            {"prompt":"Today is Wednesday.\n(a) What day was yesterday? __\n(b) Was yesterday a weekday or a weekend day? __","answer":"Tuesday, weekday","id":1,"type":"time"},
            {"prompt":"It is autumn in Australia.\n(a) What season comes after autumn? __\n(b) Which is colder there, autumn or winter? __","answer":"winter, winter","id":2,"type":"time"},
            {"prompt":"Today is Tuesday.\n(a) What day was yesterday? __\n(b) Was yesterday a weekday or a weekend day? __","answer":"Monday, weekday","id":3,"type":"time"},
            {"prompt":"My birthday is in May.\n(a) What month comes just BEFORE May? __\n(b) What month comes just AFTER May? __","answer":"April, June","id":4,"type":"time"},
            {"prompt":"How many days are in a year? __","answer":"365","id":5,"type":"time"},
            {"prompt":"Today is Monday.\n(a) What day was yesterday? __\n(b) What day will it be tomorrow? __","answer":"Sunday, Tuesday","id":6,"type":"time"},
        ]);
    });
});

describe('time — Year 2', () => {
    it('matches the exact sheet (clock answers follow the drawn face)', () => {
        expect(sheet(g2)).toEqual([
            {"prompt":"How many days are in a year? __","answer":"365","id":1,"type":"time"},
            {"prompt":"(a) What time is showing on the clock? __\n(b) What time will it be 2 hours later? __","answer":"9 o'clock, 11 o'clock","clock":{"hour":9,"minute":0},"id":2,"type":"time"},
            {"prompt":"It is summer in Australia.\n(a) What season comes after summer? __\n(b) Which is colder there, summer or autumn? __","answer":"autumn, autumn","id":3,"type":"time"},
            {"prompt":"Today is Monday. Grandma arrives on Thursday.\n(a) How many days is it until Grandma arrives? __\n(b) What day is the day BEFORE she arrives? __","answer":"3, Wednesday","id":4,"type":"time"},
            {"prompt":"My birthday is in January.\n(a) What month comes just BEFORE January? __\n(b) What month comes just AFTER January? __","answer":"December, February","id":5,"type":"time"},
            {"prompt":"We are in July now.\n(a) What month comes after July? __\n(b) What season is August in Australia? __","answer":"August, winter","id":6,"type":"time"},
        ]);
    });
});

describe('time — correctness, depth and determinism regression (10 pages)', () => {
    for (const grade of [g1, g2]) {
        const problems = generateDocument(timeSpec, grade, seedFrom([grade.id, 'time', 0]), 10).pages.flat() as unknown as P[];
        it(`Year ${grade.id}: every answer re-derived from its prompt (and clock face)`, () => {
            for (const p of problems) {
                const exp = expectedAnswer(p);
                expect(exp, `unrecognised prompt: ${p.prompt}`).not.toBeNull();
                expect(p.answer).toBe(exp);
            }
        });
        it(`Year ${grade.id}: ≥75% of items are connected two-part situations`, () => {
            const multi = problems.filter((p) => p.prompt.includes('(a)') && p.prompt.includes('(b)')).length;
            expect(multi / problems.length).toBeGreaterThanOrEqual(0.75);
        });
        it(`Year ${grade.id}: page 1 never repeats a prompt; ASCII-only prose`, () => {
            const page1 = generateSheet(timeSpec, grade, seedFrom([grade.id, 'time', 0]));
            expect(new Set(page1.map((p) => p.prompt)).size).toBe(page1.length);
            for (const p of problems) expect(p.prompt).toMatch(/^[ -~\n]+$/);
        });
        it(`Year ${grade.id}: deterministic stream`, () => {
            const seed = seedFrom([grade.id, 'time', 0]);
            expect(timeSpec.generate(createRng(seed), grade.caps, 40)).toEqual(timeSpec.generate(createRng(seed), grade.caps, 40));
        });
    }
});
