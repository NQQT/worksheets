// Unit tests for the TEMPERATURE worksheet plugin.
//
// Deterministic pins from seedFrom([grade.id, 'temperature', 0]). Depth
// design: four connected items per page (was twelve, then eight — T3M3
// layout capacity) — chained day stories,
// comparison-with-difference, error analysis, freezing-point reasoning,
// warmest-of-three with spread, an ordering write-on line, everyday contexts
// and thermometer facts. The correctness suite re-derives every answer from
// the printed prompt across a 10-page document and enforces the grade's
// tempCap on every printed reading.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, generateDocument, createRng } from '../../framework';
import { temperatureSpec } from './TemperatureWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(temperatureSpec, grade, seedFrom([grade.id, temperatureSpec.id, 0]));
}

// Fixed thermometer facts mirrored from the plugin.
const FACTS: Record<string, string> = {
    'What do we measure temperature with? __': 'a thermometer',
    'What does the °C on a weather chart stand for? __': 'Celsius',
    'At what temperature does water freeze? __': '0°C',
    'Which season has the coldest days in Australia? __': 'winter',
    'Which season has the hottest days in Australia? __': 'summer'
};
const HOT_CONTEXTS = ['a hot day at the beach', 'a sunny Christmas picnic', 'a summer day at the pool'];

type P = { prompt: string; answer: string };

// Re-derive the expected answer from the printed prompt alone.
function expectedAnswer(p: P): string | null {
    let m: RegExpMatchArray | null;
    // Chained Mon→Tue→Wed story: (b) continues from (a).
    if ((m = p.prompt.match(/^On Monday the temperature is (\d+)°C\. Tuesday is (\d+) degrees warmer than Monday\. Wednesday is (\d+) degrees colder than Tuesday\.\n\(a\)/))) {
        const t1 = +m[1], d1 = +m[2], d2 = +m[3];
        return `${t1 + d1}°C, ${t1 + d1 - d2}°C`;
    }
    if ((m = p.prompt.match(/^\(a\) Which is warmer: (\d+)°C or (\d+)°C\? __\n\(b\) How many degrees warmer is it\? __$/))) {
        const a = +m[1], b = +m[2];
        return `${Math.max(a, b)}°C, ${Math.abs(a - b)} degrees`;
    }
    if ((m = p.prompt.match(/^\(a\) Which is colder: (\d+)°C or (\d+)°C\? __\n\(b\) How many degrees colder is it\? __$/))) {
        const a = +m[1], b = +m[2];
        return `${Math.min(a, b)}°C, ${Math.abs(a - b)} degrees`;
    }
    // Error analysis: judge the claim, then give the true warmest.
    if ((m = p.prompt.match(/^(\w+) says the warmest of (\d+)°C, (\d+)°C and (\d+)°C is (\d+)°C\.\n\(a\) Is \1 correct\? __\n\(b\) What is the actual warmest temperature\? __$/))) {
        const temps = [+m[2], +m[3], +m[4]];
        const max = Math.max(...temps);
        const claimed = +m[5];
        if (!temps.includes(claimed)) return null;
        return `${claimed === max ? 'yes' : 'no'}, ${max}°C`;
    }
    // Rise/drop with the 0°C (freezing) distance reasoning.
    if ((m = p.prompt.match(/^It is (\d+)°C now\. The temperature rises by (\d+) degrees\.\n\(a\) What is the temperature now\? __\n\(b\) Is the new temperature closer to or further from freezing \(0°C\) than before\? __$/))) {
        return `${+m[1] + +m[2]}°C, further`;
    }
    if ((m = p.prompt.match(/^It is (\d+)°C now\. The temperature drops by (\d+) degrees\.\n\(a\) What is the temperature now\? __\n\(b\) Is the new temperature closer to or further from freezing \(0°C\) than before\? __$/))) {
        const t = +m[1], d = +m[2];
        if (t - d < 1) return null; // never crosses zero
        return `${t - d}°C, closer`;
    }
    if ((m = p.prompt.match(/^\(a\) Which is the warmest: (\d+)°C, (\d+)°C or (\d+)°C\? __\n\(b\) What is the difference between the warmest and the coldest\? __$/))) {
        const t = [+m[1], +m[2], +m[3]];
        return `${Math.max(...t)}°C, ${Math.max(...t) - Math.min(...t)} degrees`;
    }
    // Ordering write-on line: full coldest→warmest list.
    if ((m = p.prompt.match(/^Put these temperatures in order from coldest to warmest: (\d+)°C, (\d+)°C, (\d+)°C$/))) {
        const sorted = [+m[1], +m[2], +m[3]].sort((x, y) => x - y);
        return sorted.map((t) => `${t}°C`).join(', ');
    }
    // Everyday context: hot contexts take the HIGHER reading, cold the lower.
    if ((m = p.prompt.match(/^Is (.+) more likely to be (\d+)°C or (\d+)°C\? __$/))) {
        const isHot = HOT_CONTEXTS.includes(m[1]);
        if (!isHot && !['a snowy winter morning', 'an icy winter night', 'a cold day in the snow'].includes(m[1])) return null;
        return `${isHot ? Math.max(+m[2], +m[3]) : Math.min(+m[2], +m[3])}°C`;
    }
    if (p.prompt in FACTS) return FACTS[p.prompt];
    return null;
}

describe('temperature plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, prose layout and reduced page size', () => {
        expect(temperatureSpec.id).toBe('temperature');
        expect(temperatureSpec.label).toBe('Temperature');
        expect(temperatureSpec.icon).toBe('♨');
        expect(temperatureSpec.singleColumn).toBe(true);
        // Density regression: four connected items per page (was 12, then 8)
        // — five wrapped prompt lines clip an 8-row page (T3M3 — see
        // plugins/layout-capacity.test.ts).
        expect(temperatureSpec.perPage).toBe(4);
    });

    it('describes its scope from the grade temperature cap', () => {
        expect(temperatureSpec.scope(g1)).toBe('temperatures to 20°C');
        expect(temperatureSpec.scope(g2)).toBe('temperatures to 40°C');
    });
});

describe('temperature — availability gating', () => {
    it('Prep does not offer temperature (empty sheet)', () => {
        expect(sheet(g0)).toEqual([]);
    });
});

describe('temperature — Year 1', () => {
    it('matches the exact sheet (chained, compared and ordered readings)', () => {
        expect(sheet(g1)).toEqual([
            { prompt: 'It is 9°C now. The temperature rises by 2 degrees.\n(a) What is the temperature now? __\n(b) Is the new temperature closer to or further from freezing (0°C) than before? __', answer: '11°C, further', id: 1, type: 'temperature' },
            { prompt: 'Is an icy winter night more likely to be 14°C or 3°C? __', answer: '3°C', id: 2, type: 'temperature' },
            { prompt: 'Which season has the hottest days in Australia? __', answer: 'summer', id: 3, type: 'temperature' },
            { prompt: '(a) Which is the warmest: 12°C, 8°C or 18°C? __\n(b) What is the difference between the warmest and the coldest? __', answer: '18°C, 10 degrees', id: 4, type: 'temperature' },
        ]);
    });
});

describe('temperature — Year 2', () => {
    it('matches the exact sheet', () => {
        expect(sheet(g2)).toEqual([
            { prompt: '(a) Which is the warmest: 5°C, 2°C or 39°C? __\n(b) What is the difference between the warmest and the coldest? __', answer: '39°C, 37 degrees', id: 1, type: 'temperature' },
            { prompt: '(a) Which is colder: 31°C or 6°C? __\n(b) How many degrees colder is it? __', answer: '6°C, 25 degrees', id: 2, type: 'temperature' },
            { prompt: 'It is 6°C now. The temperature rises by 2 degrees.\n(a) What is the temperature now? __\n(b) Is the new temperature closer to or further from freezing (0°C) than before? __', answer: '8°C, further', id: 3, type: 'temperature' },
            { prompt: '(a) Which is colder: 4°C or 29°C? __\n(b) How many degrees colder is it? __', answer: '4°C, 25 degrees', id: 4, type: 'temperature' },
        ]);
    });
});

describe('temperature — correctness, range and determinism regression (10 pages)', () => {
    for (const grade of [g1, g2]) {
        const cap = grade.caps.tempCap;
        const problems = generateDocument(temperatureSpec, grade, seedFrom([grade.id, 'temperature', 0]), 10).pages.flat();
        it(`Year ${grade.id}: every answer re-derived from its prompt`, () => {
            for (const p of problems) {
                const exp = expectedAnswer(p);
                expect(exp, `unrecognised prompt: ${p.prompt}`).not.toBeNull();
                expect(p.answer).toBe(exp);
            }
        });
        it(`Year ${grade.id}: every printed reading stays within ${cap}°C`, () => {
            for (const p of problems) {
                for (const m of p.prompt.matchAll(/(\d+)°C/g)) expect(+m[1]).toBeLessThanOrEqual(cap);
                for (const m of p.answer.matchAll(/(\d+)°C/g)) expect(+m[1]).toBeLessThanOrEqual(cap);
            }
        });
        it(`Year ${grade.id}: ≥60% connected multi-part items; ordering uses the write-on line`, () => {
            const multi = problems.filter((p) => p.prompt.includes('(a)') && p.prompt.includes('(b)')).length;
            expect(multi / problems.length).toBeGreaterThanOrEqual(0.6);
            for (const p of problems) {
                if (p.prompt.startsWith('Put these temperatures')) expect(p.answerLine).toBe(true);
                else expect(p.answerLine).toBeUndefined();
            }
        });
        it(`Year ${grade.id}: page 1 never repeats; only °C beyond ASCII; deterministic`, () => {
            const page1 = generateSheet(temperatureSpec, grade, seedFrom([grade.id, 'temperature', 0]));
            expect(new Set(page1.map((p) => p.prompt)).size).toBe(page1.length);
            for (const p of problems) expect(p.prompt).toMatch(/^[ -~°\n]+$/);
            const seed = seedFrom([grade.id, 'temperature', 0]);
            expect(temperatureSpec.generate(createRng(seed), grade.caps, 40)).toEqual(temperatureSpec.generate(createRng(seed), grade.caps, 40));
        });
    }
});
