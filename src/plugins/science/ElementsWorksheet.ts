// ─────────────────────────────────────────────────────────────────────────────
// ELEMENTS WORKSHEET (Chemistry, R5) — a self-contained dashboard plugin.
//
// The dashboard loads this plugin by calling `ElementsWorksheet(dashboard)`
// with its configurations + layouts (see plugins/science/index.ts). Within
// this function the plugin describes its picker label and what happens when
// it is selected — using the framework's standard worksheet recipe.
//
// PER-TOPIC LEVEL LADDER (cap 4, from the shared SCIENCE_GRADES catalogue —
// the rung rides in caps.yearLevel exactly like the senior maths ladder):
//   level 1 — the FIRST 10 elements (H … Ne): symbol ⇄ name recall.
//   level 2 — the first 20 (adds Na … Ca).
//   level 3 — the first 30 (adds Sc … Zn).
//   level 4 — the full 30 with ADVANCED clue forms: Latin names
//             (natrium → Na, kalium → K, ferrum → Fe, cuprum → Cu) and
//             atomic-number matching.
// Every question is UNAMBIGUOUS about what to write: symbol questions ask
// "The symbol for X is __" (exact capitalisation, e.g. 'Co' — never 'CO'),
// name questions ask "The element with the symbol X is __".
//
// SAMPLING: small pools (10/20/30) — dealt from createDeck so every element
// appears once per cycle before any repeats (never infinite uniqueness
// sampling). Fully deterministic: same rng stream ⇒ same sheet.
//
// Australian spellings: 'Aluminium', 'Sulfur'.
// ─────────────────────────────────────────────────────────────────────────────

import type { Caps, DashboardFramework, DashboardPlugin, GradeConfig, RawProblem, Rng, WorksheetSpec } from '../../framework';
import { createDeck } from '../../framework';

// One element clue: atomic number, exact SYMBOL (the printed capitalisation
// contract), English name, and the Latin name where a level-4 clue exists.
type ElementClue = {
    number: number;
    symbol: string;
    name: string;
    latin?: string;
};

// The first 30 elements in atomic-number order. Level pools are cumulative
// prefixes of this list (10 / 20 / 30).
const ELEMENTS: readonly ElementClue[] = [
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

// The per-level pool: cumulative prefixes (rungs 1..3 = 10/20/30 elements;
// rung 4 stays at the full 30 but switches on the advanced clue forms).
function poolForRung(rung: number): readonly ElementClue[] {
    return ELEMENTS.slice(0, Math.min(rung, 3) * 10);
}

// Clamp a hand-built caps object into the supported 1..4 rung band.
function rungOf(caps: Caps): number {
    const rung = Math.floor(caps.yearLevel);
    if (!Number.isFinite(rung) || rung < 1) return 1;
    return Math.min(rung, 4);
}

// The question FORMS. Basic pair (every level): symbol recall + name recall.
// Level 4 adds the Latin-name and atomic-number clue forms.
function generateElements(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const rung = rungOf(caps);
    const pool = poolForRung(rung);
    // Element deck: every pool element dealt once per cycle (no clustering).
    const elementDeck = createDeck(rng, pool);
    // Basic form deck alternates the two recall directions.
    const basicFormDeck = createDeck(rng, ['symbolOf', 'nameOf'] as const);
    // Advanced clue machinery (rung 4 only): the four Latin-name elements
    // have their own deck, and the two advanced forms alternate.
    const latinPool = ELEMENTS.filter((e) => e.latin !== undefined);
    const latinDeck = createDeck(rng, latinPool);
    const advancedFormDeck = createDeck(rng, ['latin', 'atomicNumber'] as const);
    // Roughly half of a level-4 sheet carries advanced clues.
    const advancedChance = rung >= 4 ? 0.5 : 0;

    return Array.from({ length: count }, () => {
        if (rung >= 4 && rng.next() < advancedChance) {
            const form = advancedFormDeck.take();
            if (form === 'latin') {
                // LATIN NAME → SYMBOL: "The element once called natrium has
                // the symbol __" → 'Na'. The latinDeck spreads the four
                // Latin elements evenly.
                const clue = latinDeck.take();
                return {
                    prompt: `The element once called ${clue.latin} has the symbol __`,
                    answer: clue.symbol
                };
            }
            // ATOMIC NUMBER → NAME: "The element with atomic number 11 is __"
            // → 'Sodium'. Number matching rides the full pool deck.
            const clue = elementDeck.take();
            return {
                prompt: `The element with atomic number ${clue.number} is __`,
                answer: clue.name
            };
        }
        const clue = elementDeck.take();
        const form = basicFormDeck.take();
        if (form === 'symbolOf') {
            // SYMBOL RECALL: the answer is the exact capitalised symbol.
            return {
                prompt: `The symbol for ${clue.name} is __`,
                answer: clue.symbol
            };
        }
        // NAME RECALL: given the symbol, write the element's name.
        return {
            prompt: `The element with the symbol ${clue.symbol} is __`,
            answer: clue.name
        };
    });
}

// The plugin's declarative spec (exported for its own tests).
export const elementsSpec: WorksheetSpec = {
    id: 'elements',
    label: 'Elements',
    icon: '⚗',
    // Ten short recall rows per A4 page in the standard two-column grid.
    perPage: 10,
    offered: (grade: GradeConfig) => grade.available.includes('elements'),
    scope: (grade: GradeConfig) => {
        const rung = rungOf(grade.caps);
        return rung >= 4 ? 'first 30 elements, advanced clues' : `first ${rung * 10} elements`;
    },
    generate: generateElements
};

// The plugin: a function the dashboard calls with its framework bundle.
export function ElementsWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(elementsSpec);
}
