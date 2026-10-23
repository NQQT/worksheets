// Unit tests for the BALANCING EQUATIONS worksheet plugin (Chemistry, R5).
//
// Pinned here:
//   1. the declarative spec (long prompts ⇒ one per row);
//   2. availability + the 4-level cap;
//   3. exact sheets for every level (cumulative pools, deck dealing);
//   4. INDEPENDENT POOL SOUNDNESS — every generated equation is re-parsed
//      and re-verified: atom equality on both sides (parentheses included —
//      Ca(OH)2) AND gcd(coefficients) = 1 with every coefficient ≥ 1, so a
//      pool edit that unbalances or non-minimalises an equation fails here;
//   5. the printed contract: every coefficient is a blank (including 1s)
//      and answers list the coefficients in printed order;
//   6. determinism / refresh / saturation seed parity.
//
// KMnO4 note (design-review fix): the correct minimal vector for
// KMnO4 → K2MnO4 + MnO2 + O2 is 2, 1, 1, 1 — the non-minimal 4, 2, 2, 2
// proposed in an earlier draft would fail the gcd check below.

import { describe, it, expect } from 'vitest';
import { seedFrom, getScienceGradeConfig, generateSheet, generateDocument, resolveDifficulty } from '../../framework';
import { balancingSpec } from './BalancingWorksheet';

const g0 = getScienceGradeConfig(0); // level 1
const g1 = getScienceGradeConfig(1); // level 2
const g2 = getScienceGradeConfig(2); // level 3
const g3 = getScienceGradeConfig(3); // level 4
const g4 = getScienceGradeConfig(4); // beyond the cap (unimplemented row)

function sheet(grade: ReturnType<typeof getScienceGradeConfig>) {
    return generateSheet(balancingSpec, grade, seedFrom([grade.id, balancingSpec.id, 0]));
}

// ── Independent chemistry verifier (test-local, not the plugin's data) ───────

// Parse a chemical formula (including ONE level of parentheses, e.g.
// 'Ca(OH)2', 'Fe2O3', 'C6H12O6') into element → count.
function countAtoms(formula: string): Record<string, number> {
    const counts: Record<string, number> = {};
    let i = 0;
    while (i < formula.length) {
        if (formula[i] === '(') {
            const close = formula.indexOf(')', i);
            if (close < 0) throw new Error(`unbalanced brackets in ${formula}`);
            const inner = countAtoms(formula.slice(i + 1, close));
            let j = close + 1;
            let digits = '';
            while (j < formula.length && /\d/.test(formula[j])) {
                digits += formula[j];
                j++;
            }
            const multiplier = digits ? Number(digits) : 1;
            for (const [element, n] of Object.entries(inner)) {
                counts[element] = (counts[element] ?? 0) + n * multiplier;
            }
            i = j;
        } else {
            const m = /^([A-Z][a-z]?)(\d*)/.exec(formula.slice(i));
            if (!m || m[0].length === 0) throw new Error(`cannot parse ${formula} at ${i}`);
            const multiplier = m[2] ? Number(m[2]) : 1;
            counts[m[1]] = (counts[m[1]] ?? 0) + multiplier;
            i += m[0].length;
        }
    }
    return counts;
}

// greatest common divisor of a whole vector.
function gcd(...values: number[]): number {
    const g = values.map((v) => Math.abs(v)).reduce((a, b) => {
        while (b) {
            [a, b] = [b, a % b];
        }
        return a;
    }, 0);
    return g;
}

// Split the printed equation (after 'Balance: ') into its species tokens in
// printed order: 'Balance: __ Mg + __ O2 → __ MgO' → ['Mg', 'O2', 'MgO'].
function parseSpecies(prompt: string): string[] {
    const body = prompt.replace(/^Balance: /, '');
    return body
        .split(' → ')
        .flatMap((side) => side.split(' + '))
        .map((term) => {
            const m = /^__ (\S+)$/.exec(term.trim());
            if (!m) throw new Error(`coefficient is not a single blank: "${term}" in ${prompt}`);
            return m[1];
        });
}

describe('balancing plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(balancingSpec.id).toBe('balancing');
        expect(balancingSpec.label).toBe('Balancing Equations');
        expect(balancingSpec.icon).toBe('⇌');
        // Long multi-term prompts print one per row, full width.
        expect(balancingSpec.perPage).toBe(6);
        expect(balancingSpec.singleColumn).toBe(true);
    });

    it('describes its scope from the cumulative pool sizes', () => {
        expect(balancingSpec.scope(g0)).toBe('7 reaction types');
        expect(balancingSpec.scope(g1)).toBe('12 reaction types');
        expect(balancingSpec.scope(g2)).toBe('17 reaction types');
        expect(balancingSpec.scope(g3)).toBe('22 reaction types');
    });

    it('resolves through the shared science catalogue with the 4-level cap', () => {
        const plan = resolveDifficulty('chemistry', 'balancing', 99);
        expect(plan.maxLevel).toBe(4);
        expect(plan.effectiveLevel).toBe(4);
        expect(plan.saturated).toBe(true);
        expect(resolveDifficulty('chemistry', 'balancing', 1).notYetOffered).toBe(false);
    });
});

describe('balancing — availability gating', () => {
    it('generates at every implemented level; an unimplemented grade gives an empty sheet', () => {
        expect(sheet(g0)).toHaveLength(6);
        expect(sheet(g1)).toHaveLength(6);
        expect(sheet(g2)).toHaveLength(6);
        expect(sheet(g3)).toHaveLength(6);
        expect(sheet(g4)).toEqual([]);
    });
});

describe('balancing — exact sheets per level', () => {
    it('level 1 matches the exact sheet', () => {
        expect(sheet(g0)).toEqual([
            { prompt: 'Balance: __ Mg + __ O2 → __ MgO', answer: '2, 1, 2', id: 1, type: 'balancing' },
            { prompt: 'Balance: __ H2 + __ O2 → __ H2O', answer: '2, 1, 2', id: 2, type: 'balancing' },
            { prompt: 'Balance: __ N2 + __ H2 → __ NH3', answer: '1, 3, 2', id: 3, type: 'balancing' },
            { prompt: 'Balance: __ Na + __ Cl2 → __ NaCl', answer: '2, 1, 2', id: 4, type: 'balancing' },
            { prompt: 'Balance: __ H2 + __ Cl2 → __ HCl', answer: '1, 1, 2', id: 5, type: 'balancing' },
            { prompt: 'Balance: __ H2O2 → __ H2O + __ O2', answer: '2, 2, 1', id: 6, type: 'balancing' }
        ]);
    });

    it('level 2 matches the exact sheet (metal oxides + hydrocarbon/halide)', () => {
        expect(sheet(g1)).toEqual([
            { prompt: 'Balance: __ H2O → __ H2 + __ O2', answer: '2, 2, 1', id: 1, type: 'balancing' },
            { prompt: 'Balance: __ Fe + __ O2 → __ Fe2O3', answer: '4, 3, 2', id: 2, type: 'balancing' },
            { prompt: 'Balance: __ Na + __ Cl2 → __ NaCl', answer: '2, 1, 2', id: 3, type: 'balancing' },
            { prompt: 'Balance: __ C3H8 + __ O2 → __ CO2 + __ H2O', answer: '1, 5, 3, 4', id: 4, type: 'balancing' },
            { prompt: 'Balance: __ CH4 + __ O2 → __ CO2 + __ H2O', answer: '1, 2, 1, 2', id: 5, type: 'balancing' },
            { prompt: 'Balance: __ N2 + __ H2 → __ NH3', answer: '1, 3, 2', id: 6, type: 'balancing' }
        ]);
    });

    it('level 3 matches the exact sheet (decomposition/neutralisation + Ca(OH)2)', () => {
        expect(sheet(g2)).toEqual([
            { prompt: 'Balance: __ Al + __ HCl → __ AlCl3 + __ H2', answer: '2, 6, 2, 3', id: 1, type: 'balancing' },
            { prompt: 'Balance: __ Fe2O3 + __ CO → __ Fe + __ CO2', answer: '1, 3, 2, 3', id: 2, type: 'balancing' },
            { prompt: 'Balance: __ Zn + __ HCl → __ ZnCl2 + __ H2', answer: '1, 2, 1, 1', id: 3, type: 'balancing' },
            { prompt: 'Balance: __ H2O → __ H2 + __ O2', answer: '2, 2, 1', id: 4, type: 'balancing' },
            { prompt: 'Balance: __ N2 + __ H2 → __ NH3', answer: '1, 3, 2', id: 5, type: 'balancing' },
            { prompt: 'Balance: __ H2 + __ O2 → __ H2O', answer: '2, 1, 2', id: 6, type: 'balancing' }
        ]);
    });

    it('level 4 matches the exact sheet (combustion + the minimal 2,1,1,1 KMnO4 vector)', () => {
        expect(sheet(g3)).toEqual([
            { prompt: 'Balance: __ Zn + __ HCl → __ ZnCl2 + __ H2', answer: '1, 2, 1, 1', id: 1, type: 'balancing' },
            { prompt: 'Balance: __ CaCO3 → __ CaO + __ CO2', answer: '1, 1, 1', id: 2, type: 'balancing' },
            { prompt: 'Balance: __ NaOH + __ H2SO4 → __ Na2SO4 + __ H2O', answer: '2, 1, 1, 2', id: 3, type: 'balancing' },
            { prompt: 'Balance: __ CH4 + __ O2 → __ CO2 + __ H2O', answer: '1, 2, 1, 2', id: 4, type: 'balancing' },
            { prompt: 'Balance: __ Ca + __ H2O → __ Ca(OH)2 + __ H2', answer: '1, 2, 1, 1', id: 5, type: 'balancing' },
            { prompt: 'Balance: __ N2 + __ H2 → __ NH3', answer: '1, 3, 2', id: 6, type: 'balancing' }
        ]);
    });
});

describe('balancing — independent pool soundness (atom equality + gcd)', () => {
    // LONG stream: 60 draws at level 4 cover the whole cumulative pool (22
    // equations) at least twice through the deck cycles.
    const stream = generateDocument(balancingSpec, g3, seedFrom([g3.id, balancingSpec.id, 0]), 10).pages.flat();

    it('every equation balances atom-for-atom, parentheses included', () => {
        expect(stream.length).toBeGreaterThanOrEqual(22);
        const seen = new Set<string>();
        for (const problem of stream) {
            const species = parseSpecies(problem.prompt);
            const coefficients = problem.answer.split(', ').map(Number);
            // The printed equation carries a blank for EVERY coefficient…
            expect(problem.prompt.match(/__/g)).toHaveLength(species.length);
            // …the answer vector has one entry per species, in printed order.
            expect(coefficients).toHaveLength(species.length);
            // LEFT side × coefficients = RIGHT side × coefficients.
            const body = problem.prompt.replace(/^Balance: /, '');
            const [left, right] = body.split(' → ');
            const tally = (side: string): Record<string, number> => {
                const totals: Record<string, number> = {};
                for (const term of side.split(' + ')) {
                    const m = /^__ (\S+)$/.exec(term.trim());
                    const coefficient = coefficients[species.indexOf(m![1])];
                    for (const [element, n] of Object.entries(countAtoms(m![1]))) {
                        totals[element] = (totals[element] ?? 0) + n * coefficient;
                    }
                }
                return totals;
            };
            const leftTally = tally(left);
            const rightTally = tally(right);
            expect(Object.keys(leftTally).sort()).toEqual(Object.keys(rightTally).sort());
            for (const element of Object.keys(leftTally)) {
                expect(leftTally[element]).toBe(rightTally[element]);
            }
            seen.add(species.join('+'));
        }
        // The whole cumulative pool (22 distinct equations) is covered.
        expect(seen.size).toBe(22);
    });

    it('every coefficient vector is whole, ≥ 1 and MINIMAL (gcd 1)', () => {
        for (const problem of stream) {
            const coefficients = problem.answer.split(', ').map(Number);
            for (const coefficient of coefficients) {
                expect(Number.isInteger(coefficient)).toBe(true);
                expect(coefficient).toBeGreaterThanOrEqual(1);
            }
            expect(gcd(...coefficients)).toBe(1);
        }
    });

    it('prints the bracketed formula verbatim (Ca(OH)2) and balances it', () => {
        const bracketed = stream.filter((p) => p.prompt.includes('Ca(OH)2'));
        expect(bracketed.length).toBeGreaterThan(0);
        for (const problem of bracketed) {
            const coefficients = problem.answer.split(', ').map(Number);
            const species = parseSpecies(problem.prompt);
            // The printed equation keeps the bracketed spelling verbatim.
            expect(species).toEqual(['Ca', 'H2O', 'Ca(OH)2', 'H2']);
            expect(problem.prompt).toContain('__ Ca(OH)2');
            expect(coefficients).toEqual([1, 2, 1, 1]);
            // Ca: left coefficients[0] × 1 = right coefficients[2] × 1 (the
            // bracketed unit carries 1 Ca).
            expect(coefficients[0] * 1).toBe(coefficients[2] * countAtoms('Ca(OH)2').Ca);
            // H: left coefficients[1] × 2 = right coefficients[2] × 2 +
            // coefficients[3] × 2.
            expect(coefficients[1] * 2).toBe(coefficients[2] * countAtoms('Ca(OH)2').H + coefficients[3] * 2);
        }
    });
});

describe('balancing — determinism, refresh and saturation', () => {
    it('same seed ⇒ identical sheet; a new refresh ⇒ different sheet', () => {
        const a = sheet(g3);
        const b = generateSheet(balancingSpec, g3, seedFrom([g3.id, balancingSpec.id, 0]));
        expect(b).toEqual(a);
        const rerolled = generateSheet(balancingSpec, g3, seedFrom([g3.id, balancingSpec.id, 1]));
        expect(rerolled).not.toEqual(a);
    });

    it('level 99 saturates to the level-4 sheet (same seed parts, same content)', () => {
        const atCap = sheet(g3);
        const overshot = generateSheet(balancingSpec, g3, seedFrom([3, balancingSpec.id, 0]));
        expect(overshot).toEqual(atCap);
    });
});
