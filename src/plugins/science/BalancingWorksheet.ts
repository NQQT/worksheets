// ─────────────────────────────────────────────────────────────────────────────
// BALANCING EQUATIONS WORKSHEET (Chemistry, R5) — a self-contained plugin.
//
// PER-TOPIC LEVEL LADDER (cap 4, rung rides in caps.yearLevel):
//   level 1 — everyday one/two-product reactions (small whole-number
//             coefficients).
//   level 2 — metal oxides + hydrocarbon/halide reactions (larger
//             coefficients).
//   level 3 — decomposition, neutralisation, displacement + bracketed
//             formula Ca(OH)2.
//   level 4 — combustion/organic + permanganate decomposition (hardest).
// Pools are CUMULATIVE: each level adds its batch to every earlier one, so a
// level-4 sheet mixes the hardest equations with earlier ones.
//
// THE PRINTED CONTRACT: EVERY coefficient is a blank ("__ H2 + __ O2 →
// __ H2O") — even coefficient 1 gets a blank the student writes '1' into.
// The answer records the smallest whole-number coefficients IN PRINTED
// ORDER, comma separated ("2, 1, 2").
//
// POOL SOUNDNESS: every pool entry below is a verified MINIMAL vector — atom
// counts balance and gcd(coefficients) = 1 (including the bracketed
// Ca(OH)2). The plugin's test suite re-derives the balance independently
// (atom equality + gcd, parentheses included) so a data edit that unbalances
// a pool fails loudly. NOTE (design-review fix): KMnO4 → K2MnO4 + MnO2 + O2
// is 2,1,1,1 — the non-minimal 4,2,2,2 proposed in an earlier draft is
// invalid and NOT used.
//
// SAMPLING: small pools (7..22 equations) — dealt from createDeck so every
// equation appears once per cycle before any repeats. Deterministic.
// ─────────────────────────────────────────────────────────────────────────────

import type { Caps, DashboardFramework, DashboardPlugin, GradeConfig, RawProblem, Rng, WorksheetSpec } from '../../framework';
import { createDeck } from '../../framework';

// One balanced equation: the species in PRINTED order (reactants then
// products), the index where the arrow sits, and the minimal integer
// coefficient for each species (same length as species).
type EquationSpec = {
    species: readonly string[];
    arrowAt: number;
    coefficients: readonly number[];
};

// Level batches — every entry hand-verified balanced + minimal (see header).
const LEVEL_1: readonly EquationSpec[] = [
    { species: ['H2', 'O2', 'H2O'], arrowAt: 2, coefficients: [2, 1, 2] },
    { species: ['N2', 'H2', 'NH3'], arrowAt: 2, coefficients: [1, 3, 2] },
    { species: ['Mg', 'O2', 'MgO'], arrowAt: 2, coefficients: [2, 1, 2] },
    { species: ['Na', 'Cl2', 'NaCl'], arrowAt: 2, coefficients: [2, 1, 2] },
    { species: ['H2', 'Cl2', 'HCl'], arrowAt: 2, coefficients: [1, 1, 2] },
    { species: ['H2O', 'H2', 'O2'], arrowAt: 1, coefficients: [2, 2, 1] },
    { species: ['H2O2', 'H2O', 'O2'], arrowAt: 1, coefficients: [2, 2, 1] }
];

const LEVEL_2: readonly EquationSpec[] = [
    { species: ['Fe', 'O2', 'Fe2O3'], arrowAt: 2, coefficients: [4, 3, 2] },
    { species: ['Al', 'O2', 'Al2O3'], coefficients: [4, 3, 2], arrowAt: 2 },
    { species: ['Zn', 'HCl', 'ZnCl2', 'H2'], arrowAt: 2, coefficients: [1, 2, 1, 1] },
    { species: ['CH4', 'O2', 'CO2', 'H2O'], arrowAt: 2, coefficients: [1, 2, 1, 2] },
    { species: ['C3H8', 'O2', 'CO2', 'H2O'], arrowAt: 2, coefficients: [1, 5, 3, 4] }
];

const LEVEL_3: readonly EquationSpec[] = [
    { species: ['CaCO3', 'CaO', 'CO2'], arrowAt: 1, coefficients: [1, 1, 1] },
    { species: ['NaOH', 'H2SO4', 'Na2SO4', 'H2O'], arrowAt: 2, coefficients: [2, 1, 1, 2] },
    { species: ['Fe2O3', 'CO', 'Fe', 'CO2'], arrowAt: 2, coefficients: [1, 3, 2, 3] },
    { species: ['Al', 'HCl', 'AlCl3', 'H2'], arrowAt: 2, coefficients: [2, 6, 2, 3] },
    { species: ['Ca', 'H2O', 'Ca(OH)2', 'H2'], arrowAt: 2, coefficients: [1, 2, 1, 1] }
];

const LEVEL_4: readonly EquationSpec[] = [
    { species: ['C2H5OH', 'O2', 'CO2', 'H2O'], arrowAt: 2, coefficients: [1, 3, 2, 3] },
    { species: ['C2H4', 'O2', 'CO2', 'H2O'], arrowAt: 2, coefficients: [1, 3, 2, 2] },
    { species: ['C6H12O6', 'O2', 'CO2', 'H2O'], arrowAt: 2, coefficients: [1, 6, 6, 6] },
    // 2KMnO4 → K2MnO4 + MnO2 + O2 (minimal — see the header note).
    { species: ['KMnO4', 'K2MnO4', 'MnO2', 'O2'], arrowAt: 1, coefficients: [2, 1, 1, 1] },
    { species: ['Fe', 'H2O', 'Fe3O4', 'H2'], arrowAt: 2, coefficients: [3, 4, 1, 4] }
];

// Cumulative pool per rung (1..4): each level adds its batch.
function poolForRung(rung: number): readonly EquationSpec[] {
    const pool: EquationSpec[] = [];
    const batches = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4].slice(0, Math.min(Math.max(rung, 1), 4));
    for (const batch of batches) pool.push(...batch);
    return pool;
}

// Clamp a hand-built caps object into the supported 1..4 rung band.
function rungOf(caps: Caps): number {
    const rung = Math.floor(caps.yearLevel);
    if (!Number.isFinite(rung) || rung < 1) return 1;
    return Math.min(rung, 4);
}

// Print one equation with EVERY coefficient blanked: "__ H2 + __ O2 → __ H2O".
// The arrow sits before the species at `arrowAt`; species keep their printed
// spelling verbatim (parentheses included — Ca(OH)2 has no spaces, so the
// blanking is a plain per-species prefix).
function printEquation(equation: EquationSpec): string {
    return equation.species
        .map((species) => `__ ${species}`)
        .reduce((text, term, i) => {
            if (i === 0) return term;
            // The arrow goes right before the first product (index arrowAt).
            return `${text}${i === equation.arrowAt ? ' → ' : ' + '}${term}`;
        }, '');
}

// The generator: one deck over the level's cumulative pool, one equation per
// take. Deck cycling guarantees every pool equation appears before repeats.
function generateBalancing(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const pool = poolForRung(rungOf(caps));
    const deck = createDeck(rng, pool);
    return Array.from({ length: count }, () => {
        const equation = deck.take();
        return {
            prompt: `Balance: ${printEquation(equation)}`,
            // Smallest whole-number coefficients IN PRINTED ORDER (1s kept —
            // every blank is a real blank, so the key covers them all).
            answer: equation.coefficients.join(', ')
        };
    });
}

// The plugin's declarative spec (exported for its own tests).
export const balancingSpec: WorksheetSpec = {
    id: 'balancing',
    label: 'Balancing Equations',
    icon: '⇌',
    // Long multi-term prompts print one per row, full page width.
    perPage: 6,
    singleColumn: true,
    offered: (grade: GradeConfig) => grade.available.includes('balancing'),
    scope: (grade: GradeConfig) => `${poolForRung(rungOf(grade.caps)).length} reaction types`,
    generate: generateBalancing
};

// The plugin: a function the dashboard calls with its framework bundle.
export function BalancingWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(balancingSpec);
}
