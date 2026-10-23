// ─────────────────────────────────────────────────────────────────────────────
// CIRCUITS & OHM'S LAW WORKSHEET (Physic, R5) — a self-contained plugin.
//
// PER-TOPIC LEVEL LADDER (cap 4, rung rides in caps.yearLevel):
//   level 1 — V = I × R. Given an integer current (A) and resistance (Ω),
//             find the voltage. I 1..12 A, R 2..12 Ω ⇒ V 2..144 V.
//   level 2 — the SAME circuit quantities, but the current or the resistance
//             is hidden: V = I × R is CONSTRUCTED first, so V ÷ R and V ÷ I
//             are always whole numbers (exact construction, no rounding).
//   level 3 — SERIES circuits: two or three resistors, total resistance is
//             the sum (every resistor 2..12 Ω).
//   level 4 — PARALLEL PAIRS from a verified table — (6,3)→2, (12,4)→3,
//             (12,6)→4, (18,9)→6, (20,5)→4, (15,10)→6, (24,8)→6, (30,6)→5
//             (product ÷ sum) — plus a current form whose battery voltage is
//             an exact MULTIPLE of the pair's total resistance, so the total
//             current I = V ÷ Rtotal is a whole number of amps.
// UNITS ARE EXPLICIT: amperes (A), ohms (Ω), volts (V) print in the prompt
// (and after each blank). No zero currents/resistances/voltages — no zero
// divisors anywhere.
//
// Deterministic: same rng stream ⇒ same sheet.
// ─────────────────────────────────────────────────────────────────────────────

import type { Caps, DashboardFramework, DashboardPlugin, GradeConfig, RawProblem, Rng, WorksheetSpec } from '../../framework';
import { createDeck } from '../../framework';

// Clamp a hand-built caps object into the supported 1..4 rung band.
function rungOf(caps: Caps): number {
    const rung = Math.floor(caps.yearLevel);
    if (!Number.isFinite(rung) || rung < 1) return 1;
    return Math.min(rung, 4);
}

// ── Verified parallel-pair table (R1·R2 ÷ (R1 + R2), all whole ohms) ─────────
const PARALLEL_PAIRS: readonly { r1: number; r2: number; total: number }[] = [
    { r1: 6, r2: 3, total: 2 },
    { r1: 12, r2: 4, total: 3 },
    { r1: 12, r2: 6, total: 4 },
    { r1: 18, r2: 9, total: 6 },
    { r1: 20, r2: 5, total: 4 },
    { r1: 15, r2: 10, total: 6 },
    { r1: 24, r2: 8, total: 6 },
    { r1: 30, r2: 6, total: 5 }
];

function generateCircuits(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const rung = rungOf(caps);

    // Level 1/2 machinery: the SAME construction (V = I × R built first) —
    // level 1 asks only for the voltage, level 2 deals all three forms from a
    // deck so the hidden quantity varies.
    const ohmDeck = createDeck(rng, ['voltage', 'current', 'resistance'] as const);

    // Level 3 machinery: two- vs three-resistor series circuits, dealt evenly.
    const seriesDeck = createDeck(rng, [2, 3] as const);

    // Level 4 machinery: the parallel pair and the two question forms.
    const pairDeck = createDeck(rng, PARALLEL_PAIRS);
    const parallelFormDeck = createDeck(rng, ['total', 'current'] as const);

    return Array.from({ length: count }, () => {
        if (rung >= 4) {
            const pair = pairDeck.take();
            const form = parallelFormDeck.take();
            if (form === 'total') {
                // Given the pair → the parallel total (product ÷ sum, exact).
                return {
                    prompt: `A ${pair.r1} Ω resistor and a ${pair.r2} Ω resistor are connected in parallel. The total resistance of the pair is __ Ω.`,
                    answer: `${pair.total}`
                };
            }
            // Battery voltage is an exact MULTIPLE of the pair's total
            // resistance: V = m × Rtotal ⇒ the total current is m amps.
            const multiple = rng.int(2, 12);
            const voltage = multiple * pair.total;
            return {
                prompt: `A ${voltage} V battery is connected across a ${pair.r1} Ω and a ${pair.r2} Ω resistor in parallel. The total current drawn from the battery is __ A.`,
                answer: `${multiple}`
            };
        }
        if (rung === 3) {
            // SERIES: 2 or 3 resistors, total = sum (integer, no division).
            // Listing helper: "6 Ω and 4 Ω" / "6 Ω, 4 Ω and 3 Ω".
            const listResistors = (values: readonly number[]) =>
                values.length === 2
                    ? `${values[0]} Ω and ${values[1]} Ω`
                    : `${values.slice(0, -1).map((r) => `${r} Ω`).join(', ')} and ${values[values.length - 1]} Ω`;
            const count3 = seriesDeck.take();
            const resistors = Array.from({ length: count3 }, () => rng.int(2, 12));
            const total = resistors.reduce((sum, r) => sum + r, 0);
            return {
                prompt: `${listResistors(resistors)} resistors are connected in series. The total resistance is __ Ω.`,
                answer: `${total}`
            };
        }
        // OHM'S LAW circuit, constructed exactly: I (A) and R (Ω) first,
        // V = I × R after — so every hidden quotient is a whole number.
        const current = rng.int(1, 12);
        const resistance = rng.int(2, 12);
        const voltage = current * resistance;
        const form = rung === 1 ? 'voltage' : ohmDeck.take();
        if (form === 'current') {
            return {
                prompt: `A ${voltage} V battery drives a current through a ${resistance} Ω resistor. The current is __ A.`,
                answer: `${current}`
            };
        }
        if (form === 'resistance') {
            return {
                prompt: `A ${voltage} V battery drives ${current} A through a resistor. The resistance of that resistor is __ Ω.`,
                answer: `${resistance}`
            };
        }
        return {
            prompt: `A circuit carries ${current} A through a ${resistance} Ω resistor. The voltage across the resistor is __ V.`,
            answer: `${voltage}`
        };
    });
}

// The plugin's declarative spec (exported for its own tests).
export const circuitsSpec: WorksheetSpec = {
    id: 'circuits',
    label: 'Circuits & Ohm\u2019s Law',
    icon: '⚡',
    // One-line prompts in the standard two-column grid.
    perPage: 8,
    offered: (grade: GradeConfig) => grade.available.includes('circuits'),
    scope: (grade: GradeConfig) => {
        const rung = rungOf(grade.caps);
        if (rung === 1) return 'V = I × R';
        if (rung === 2) return 'find current or resistance';
        if (rung === 3) return 'series circuits';
        return 'parallel circuits';
    },
    generate: generateCircuits
};

// The plugin: a function the dashboard calls with its framework bundle.
export function CircuitsWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(circuitsSpec);
}
