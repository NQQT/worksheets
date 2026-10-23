// Unit tests for the ELEMENTS worksheet plugin (Chemistry, R5).
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0]) — the science seed rides the shared
// SCIENCE_GRADES catalogue, grade id = level − 1). Pinned here:
//   1. the declarative spec + scope ladder;
//   2. availability + the 4-level cap (levels beyond 4 saturate to the
//      level-4 caps; an unimplemented catalogue grade generates nothing);
//   3. exact sheets for every level (10/20/30-element pools, L4 advanced
//      Latin-name + atomic-number clues);
//   4. unambiguous symbol capitalisation ('Co', never 'CO') verified
//      against the element table;
//   5. pool caps per level + determinism/refresh + saturation seed parity.

import { describe, it, expect } from 'vitest';
import { seedFrom, getScienceGradeConfig, generateSheet, resolveDifficulty } from '../../framework';
import { elementsSpec } from './ElementsWorksheet';

// The grade rows of the shared science catalogue (level = id + 1, cap 4).
const g0 = getScienceGradeConfig(0); // level 1
const g1 = getScienceGradeConfig(1); // level 2
const g2 = getScienceGradeConfig(2); // level 3
const g3 = getScienceGradeConfig(3); // level 4
const g4 = getScienceGradeConfig(4); // beyond the cap (unimplemented row)

function sheet(grade: ReturnType<typeof getScienceGradeConfig>) {
    return generateSheet(elementsSpec, grade, seedFrom([grade.id, elementsSpec.id, 0]));
}

// The exact element table the plugin owns (duplicated here so the pin is an
// INDEPENDENT check, not a re-export of the plugin's data).
const TABLE: { number: number; symbol: string; name: string; latin?: string }[] = [
    { number: 1, symbol: 'H', name: 'Hydrogen' },
    { number: 2, symbol: 'He', name: 'Helium' },
    { number: 3, symbol: 'Li', name: 'Lithium' },
    { number: 4, symbol: 'Be', name: 'Beryllium' },
    { number: 5, symbol: 'B', name: 'Boron' },
    { number: 6, symbol: 'C', name: 'Carbon' },
    { number: 7, symbol: 'N', name: 'Nitrogen' },
    { number: 8, symbol: 'O', name: 'Oxygen' },
    { number: 9, symbol: 'F', name: 'Fluorine' },
    { number: 10, symbol: 'Ne', name: 'Neon' },
    { number: 11, symbol: 'Na', name: 'Sodium', latin: 'natrium' },
    { number: 12, symbol: 'Mg', name: 'Magnesium' },
    { number: 13, symbol: 'Al', name: 'Aluminium' },
    { number: 14, symbol: 'Si', name: 'Silicon' },
    { number: 15, symbol: 'P', name: 'Phosphorus' },
    { number: 16, symbol: 'S', name: 'Sulfur' },
    { number: 17, symbol: 'Cl', name: 'Chlorine' },
    { number: 18, symbol: 'Ar', name: 'Argon' },
    { number: 19, symbol: 'K', name: 'Potassium', latin: 'kalium' },
    { number: 20, symbol: 'Ca', name: 'Calcium' },
    { number: 21, symbol: 'Sc', name: 'Scandium' },
    { number: 22, symbol: 'Ti', name: 'Titanium' },
    { number: 23, symbol: 'V', name: 'Vanadium' },
    { number: 24, symbol: 'Cr', name: 'Chromium' },
    { number: 25, symbol: 'Mn', name: 'Manganese' },
    { number: 26, symbol: 'Fe', name: 'Iron', latin: 'ferrum' },
    { number: 27, symbol: 'Co', name: 'Cobalt' },
    { number: 28, symbol: 'Ni', name: 'Nickel' },
    { number: 29, symbol: 'Cu', name: 'Copper', latin: 'cuprum' },
    { number: 30, symbol: 'Zn', name: 'Zinc' }
];

describe('elements plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(elementsSpec.id).toBe('elements');
        expect(elementsSpec.label).toBe('Elements');
        expect(elementsSpec.icon).toBe('⚗');
        // Ten short recall rows per A4 page.
        expect(elementsSpec.perPage).toBe(10);
    });

    it('describes its scope from the level ladder', () => {
        expect(elementsSpec.scope(g0)).toBe('first 10 elements');
        expect(elementsSpec.scope(g1)).toBe('first 20 elements');
        expect(elementsSpec.scope(g2)).toBe('first 30 elements');
        expect(elementsSpec.scope(g3)).toBe('first 30 elements, advanced clues');
    });

    it('resolves through the shared science catalogue with the 4-level cap', () => {
        const plan = resolveDifficulty('chemistry', 'elements', 99);
        expect(plan.maxLevel).toBe(4);
        expect(plan.effectiveLevel).toBe(4);
        expect(plan.saturated).toBe(true);
        // Offered from level 1 — no intro gating.
        expect(resolveDifficulty('chemistry', 'elements', 1).notYetOffered).toBe(false);
    });
});

describe('elements — availability gating', () => {
    it('generates at every implemented level; an unimplemented grade gives an empty sheet', () => {
        expect(sheet(g0)).toHaveLength(10);
        expect(sheet(g1)).toHaveLength(10);
        expect(sheet(g2)).toHaveLength(10);
        expect(sheet(g3)).toHaveLength(10);
        // The catalogue row beyond the cap is unimplemented → empty sheet
        // (the effective level can never reach it through resolveDifficulty).
        expect(sheet(g4)).toEqual([]);
    });
});

describe('elements — level 1 (first 10 elements)', () => {
    it('matches the exact sheet', () => {
        expect(sheet(g0)).toEqual([
            { prompt: 'The element with the symbol He is __', answer: 'Helium', id: 1, type: 'elements' },
            { prompt: 'The symbol for Carbon is __', answer: 'C', id: 2, type: 'elements' },
            { prompt: 'The element with the symbol B is __', answer: 'Boron', id: 3, type: 'elements' },
            { prompt: 'The symbol for Neon is __', answer: 'Ne', id: 4, type: 'elements' },
            { prompt: 'The element with the symbol F is __', answer: 'Fluorine', id: 5, type: 'elements' },
            { prompt: 'The symbol for Beryllium is __', answer: 'Be', id: 6, type: 'elements' },
            { prompt: 'The element with the symbol O is __', answer: 'Oxygen', id: 7, type: 'elements' },
            { prompt: 'The symbol for Hydrogen is __', answer: 'H', id: 8, type: 'elements' },
            { prompt: 'The element with the symbol Li is __', answer: 'Lithium', id: 9, type: 'elements' },
            { prompt: 'The symbol for Nitrogen is __', answer: 'N', id: 10, type: 'elements' }
        ]);
    });
});

describe('elements — level 2 (first 20 elements)', () => {
    it('matches the exact sheet', () => {
        expect(sheet(g1)).toEqual([
            { prompt: 'The element with the symbol K is __', answer: 'Potassium', id: 1, type: 'elements' },
            { prompt: 'The symbol for Sulfur is __', answer: 'S', id: 2, type: 'elements' },
            { prompt: 'The element with the symbol O is __', answer: 'Oxygen', id: 3, type: 'elements' },
            { prompt: 'The symbol for Sodium is __', answer: 'Na', id: 4, type: 'elements' },
            { prompt: 'The element with the symbol Ne is __', answer: 'Neon', id: 5, type: 'elements' },
            { prompt: 'The symbol for Phosphorus is __', answer: 'P', id: 6, type: 'elements' },
            { prompt: 'The element with the symbol Mg is __', answer: 'Magnesium', id: 7, type: 'elements' },
            { prompt: 'The symbol for Argon is __', answer: 'Ar', id: 8, type: 'elements' },
            { prompt: 'The element with the symbol He is __', answer: 'Helium', id: 9, type: 'elements' },
            { prompt: 'The symbol for Hydrogen is __', answer: 'H', id: 10, type: 'elements' }
        ]);
    });
});

describe('elements — level 3 (first 30 elements)', () => {
    it('matches the exact sheet', () => {
        expect(sheet(g2)).toEqual([
            { prompt: 'The symbol for Aluminium is __', answer: 'Al', id: 1, type: 'elements' },
            { prompt: 'The element with the symbol Li is __', answer: 'Lithium', id: 2, type: 'elements' },
            { prompt: 'The symbol for Nitrogen is __', answer: 'N', id: 3, type: 'elements' },
            { prompt: 'The element with the symbol Ni is __', answer: 'Nickel', id: 4, type: 'elements' },
            { prompt: 'The symbol for Silicon is __', answer: 'Si', id: 5, type: 'elements' },
            { prompt: 'The element with the symbol O is __', answer: 'Oxygen', id: 6, type: 'elements' },
            { prompt: 'The symbol for Zinc is __', answer: 'Zn', id: 7, type: 'elements' },
            { prompt: 'The element with the symbol Co is __', answer: 'Cobalt', id: 8, type: 'elements' },
            { prompt: 'The symbol for Calcium is __', answer: 'Ca', id: 9, type: 'elements' },
            { prompt: 'The element with the symbol K is __', answer: 'Potassium', id: 10, type: 'elements' }
        ]);
    });
});

describe('elements — level 4 (advanced clue forms)', () => {
    it('matches the exact sheet (Latin names + atomic numbers mixed with recall)', () => {
        expect(sheet(g3)).toEqual([
            { prompt: 'The element with atomic number 5 is __', answer: 'Boron', id: 1, type: 'elements' },
            { prompt: 'The element once called cuprum has the symbol __', answer: 'Cu', id: 2, type: 'elements' },
            { prompt: 'The element with atomic number 2 is __', answer: 'Helium', id: 3, type: 'elements' },
            { prompt: 'The symbol for Iron is __', answer: 'Fe', id: 4, type: 'elements' },
            { prompt: 'The element once called kalium has the symbol __', answer: 'K', id: 5, type: 'elements' },
            { prompt: 'The element with atomic number 22 is __', answer: 'Titanium', id: 6, type: 'elements' },
            { prompt: 'The element once called natrium has the symbol __', answer: 'Na', id: 7, type: 'elements' },
            { prompt: 'The element with atomic number 28 is __', answer: 'Nickel', id: 8, type: 'elements' },
            { prompt: 'The element once called ferrum has the symbol __', answer: 'Fe', id: 9, type: 'elements' },
            { prompt: 'The element with the symbol Be is __', answer: 'Beryllium', id: 10, type: 'elements' }
        ]);
    });

    it('carries every advanced clue form on the level-4 sheet', () => {
        const prompts = sheet(g3).map((p) => p.prompt);
        expect(prompts.filter((p) => p.startsWith('The element once called '))).toHaveLength(4);
        expect(prompts.filter((p) => p.startsWith('The element with atomic number '))).toHaveLength(4);
    });
});

describe('elements — unambiguous symbols, pool caps and soundness', () => {
    it('every symbol answer is the table\u2019s exact capitalisation', () => {
        // Several refreshes to exercise the deck cycles across the pool.
        for (let refresh = 0; refresh < 6; refresh++) {
            for (const grade of [g0, g1, g2, g3]) {
                const s = generateSheet(elementsSpec, grade, seedFrom([grade.id, elementsSpec.id, refresh]));
                for (const p of s) {
                    // Symbol ANSWERS: symbol-recall prompts ('The symbol for
                    // X is __') and Latin-name prompts ('The element once
                    // called X has the symbol __'). Name answers (name
                    // recall, atomic-number recall) are skipped here.
                    if (!p.prompt.startsWith('The symbol for ') && !p.prompt.startsWith('The element once called ')) continue;
                    // Exact capitalisation: one uppercase + at most one
                    // lowercase ('Co' — never 'CO' or 'co').
                    expect(p.answer).toMatch(/^[A-Z][a-z]?$/);
                    expect(TABLE.find((e) => e.symbol === p.answer)).toBeDefined();
                }
            }
        }
    });

    it('every question\u2019s answer is the table\u2019s exact pair for that clue', () => {
        for (let refresh = 0; refresh < 4; refresh++) {
            for (const grade of [g0, g1, g2, g3]) {
                const s = generateSheet(elementsSpec, grade, seedFrom([grade.id, elementsSpec.id, refresh]));
                for (const p of s) {
                    const symbolRecall = /^The symbol for (.+) is __$/.exec(p.prompt);
                    const nameRecall = /^The element with the symbol (.+) is __$/.exec(p.prompt);
                    const latinClue = /^The element once called (.+) has the symbol __$/.exec(p.prompt);
                    const numberClue = /^The element with atomic number (\d+) is __$/.exec(p.prompt);
                    if (symbolRecall) {
                        const clue = TABLE.find((e) => e.name === symbolRecall[1]);
                        expect(clue).toBeDefined();
                        expect(p.answer).toBe(clue!.symbol);
                    } else if (nameRecall) {
                        const clue = TABLE.find((e) => e.symbol === nameRecall[1]);
                        expect(clue).toBeDefined();
                        expect(p.answer).toBe(clue!.name);
                    } else if (latinClue) {
                        const clue = TABLE.find((e) => e.latin === latinClue[1]);
                        expect(clue).toBeDefined();
                        expect(p.answer).toBe(clue!.symbol);
                    } else if (numberClue) {
                        const clue = TABLE.find((e) => e.number === Number(numberClue[1]));
                        expect(clue).toBeDefined();
                        expect(p.answer).toBe(clue!.name);
                    } else {
                        throw new Error(`unrecognised prompt: ${p.prompt}`);
                    }
                }
            }
        }
    });

    it('stays inside the level pool: level 1 never leaves the first 10 elements', () => {
        const names = new Set(TABLE.slice(0, 10).map((e) => e.name));
        const symbols = new Set(TABLE.slice(0, 10).map((e) => e.symbol));
        const numbers = new Set(TABLE.slice(0, 10).map((e) => e.number));
        for (let refresh = 0; refresh < 6; refresh++) {
            const s = generateSheet(elementsSpec, g0, seedFrom([g0.id, elementsSpec.id, refresh]));
            for (const p of s) {
                // Every name that appears (asked or answered) is a pool name…
                const askedName = /^The symbol for (.+) is __$/.exec(p.prompt);
                if (askedName) expect(names.has(askedName[1])).toBe(true);
                // …every symbol that appears is a pool symbol…
                const askedSymbol = /^The element with the symbol (.+) is __$/.exec(p.prompt);
                if (askedSymbol) expect(symbols.has(askedSymbol[1])).toBe(true);
                if (p.prompt.startsWith('The symbol for ') || p.prompt.startsWith('The element once called ')) {
                    expect(symbols.has(p.answer)).toBe(true);
                }
                // …and NAME answers (name recall, atomic-number recall) are
                // pool names.
                if (p.prompt.startsWith('The element with the symbol ') || p.prompt.startsWith('The element with atomic number ')) {
                    expect(names.has(p.answer)).toBe(true);
                }
                // …and any atomic-number clue stays within the pool band.
                const askedNumber = /^The element with atomic number (\d+) is __$/.exec(p.prompt);
                if (askedNumber) expect(numbers.has(Number(askedNumber[1]))).toBe(true);
            }
        }
    });
});

describe('elements — determinism, refresh and saturation', () => {
    it('same seed ⇒ identical sheet; a new refresh ⇒ different sheet', () => {
        const a = sheet(g3);
        const b = generateSheet(elementsSpec, g3, seedFrom([g3.id, elementsSpec.id, 0]));
        expect(b).toEqual(a);
        const rerolled = generateSheet(elementsSpec, g3, seedFrom([g3.id, elementsSpec.id, 1]));
        expect(rerolled).not.toEqual(a);
    });

    it('level 99 saturates to the level-4 sheet (same seed parts, same content)', () => {
        // The seed derives from the EFFECTIVE level's grade id (3 at the cap),
        // so an oversized level reproduces the level-4 sheet exactly.
        const atCap = sheet(g3);
        const overshot = generateSheet(elementsSpec, g3, seedFrom([3, elementsSpec.id, 0]));
        expect(overshot).toEqual(atCap);
        // And the difficulty plan agrees: silent saturation at level 4.
        expect(resolveDifficulty('chemistry', 'elements', 99)).toMatchObject({
            level: 99,
            effectiveLevel: 4,
            maxLevel: 4,
            saturated: true
        });
    });
});
