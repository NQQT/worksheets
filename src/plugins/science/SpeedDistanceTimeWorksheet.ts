// ─────────────────────────────────────────────────────────────────────────────
// SPEED DISTANCE TIME WORKSHEET (Physic, R5) — a self-contained plugin.
//
// PER-TOPIC LEVEL LADDER (cap 4, rung rides in caps.yearLevel):
//   level 1 — d = s × t. Speed 2..15 m/s, time 2..12 s; find the distance.
//   level 2 — the same m/s units, but ANY quantity may be hidden: the speed
//             or the time is found by EXACT construction (d = s × t is built
//             first, so d ÷ t and d ÷ s are always whole numbers).
//   level 3 — the same three forms in km/h, hours and km (speed 2..80 km/h,
//             time 1..12 h).
//   level 4 — WHOLE-JOURNEY AVERAGE SPEED = total distance ÷ total time
//             (never the unweighted average of the two speeds), constructed
//             integer-exact via bounded retries over a general two-leg
//             journey with a guaranteed same-parity fallback.
// UNITS ARE EXPLICIT: every given quantity carries its unit in the prompt and
// the unit of the blank is printed after it. No quantity is ever 0.
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

// ── Level 1/2/3 draw recipes (d = s × t, integer-exact by construction) ──────

// One leg: speed s over time t ⇒ distance d = s·t. Every quantity ≥ 2 (L1/L2
// ranges) or ≥ 1 hour (L3), so no zeros can reach the paper.
function drawLeg(rng: Rng, metric: boolean): { s: number; t: number; d: number } {
    if (metric) {
        const s = rng.int(2, 80);   // km/h
        const t = rng.int(1, 12);   // hours
        return { s, t, d: s * t };
    }
    const s = rng.int(2, 15);     // m/s
    const t = rng.int(2, 12);     // seconds
    return { s, t, d: s * t };
}

// The three question forms for a leg, parameterised by the unit triple.
function legForms(): readonly ('distance' | 'speed' | 'time')[] {
    return ['distance', 'speed', 'time'];
}

function printLegForm(
    form: 'distance' | 'speed' | 'time',
    leg: { s: number; t: number; d: number },
    units: { speed: string; time: string; distance: string }
): RawProblem {
    if (form === 'distance') {
        // GIVEN speed + time → find the distance (the d = s × t form).
        return {
            prompt: `A vehicle travels at ${leg.s} ${units.speed} for ${leg.t} ${units.time}. The distance travelled is __ ${units.distance}.`,
            answer: `${leg.d}`
        };
    }
    if (form === 'speed') {
        // GIVEN distance + time → find the speed. The leg was CONSTRUCTED as
        // d = s × t, so d ÷ t is exactly the hidden whole-number speed.
        return {
            prompt: `A vehicle travels ${leg.d} ${units.distance} in ${leg.t} ${units.time}. Its speed is __ ${units.speed}.`,
            answer: `${leg.s}`
        };
    }
    // GIVEN distance + speed → find the time (again exact by construction).
    return {
        prompt: `A vehicle travels ${leg.d} ${units.distance} at ${leg.s} ${units.speed}. The time taken is __ ${units.time}.`,
        answer: `${leg.t}`
    };
}

// ── Level 4: whole-journey average speed, integer-exact ─────────────────────
// Average = (d1 + d2) ÷ (t1 + t2) — total over total, NOT (s1 + s2) ÷ 2.
//
// Construction: pick the target integer average a, the two leg times, and a
// first-leg speed; the second-leg speed is then FORCED:
//   s2 = (a·(t1 + t2) − s1·t1) ÷ t2
// and the pair is accepted only when s2 is a whole number in range. If the
// bounded retries run out, the guaranteed fallback picks equal leg times and
// a second speed of the same parity as the first, which makes
// (s1 + s2)·t ÷ 2t = (s1 + s2) ÷ 2 a whole number by construction.
function drawJourney(rng: Rng): { d1: number; t1: number; d2: number; t2: number; average: number } {
    for (let attempt = 0; attempt < 80; attempt++) {
        const t1 = rng.int(2, 12);
        const t2 = rng.int(2, 12);
        const average = rng.int(2, 15);
        const s1 = rng.int(2, 15);
        const numerator = average * (t1 + t2) - s1 * t1;
        if (numerator <= 0 || numerator % t2 !== 0) continue;
        const s2 = numerator / t2;
        if (s2 < 2 || s2 > 15 || s2 === s1) continue;
        return { d1: s1 * t1, t1, d2: s2 * t2, t2, average };
    }
    // Guaranteed fallback: equal leg times + same-parity speeds ⇒ the average
    // (s1 + s2) ÷ 2 is a whole number ≥ 2 (both parity classes have plenty of
    // members in 2..15, so excluding s1 still leaves candidates).
    const t = rng.int(2, 12);
    const s1 = rng.int(2, 15);
    const candidates: number[] = [];
    for (let s = 2; s <= 15; s++) {
        if (s % 2 === s1 % 2 && s !== s1) candidates.push(s);
    }
    const s2 = rng.pick(candidates);
    const average = (s1 + s2) / 2;
    return { d1: s1 * t, t1: t, d2: s2 * t, t2: t, average };
}

function generateSpeed(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const rung = rungOf(caps);

    // Levels 1..3: deck over the question forms; a fresh leg per question is
    // exactly-constructed so hidden division always lands on a whole number.
    const metric = rung >= 3;
    const units = metric
        ? { speed: 'km/h', time: 'h', distance: 'km' }
        : { speed: 'm/s', time: 's', distance: 'm' };
    const legFormDeck = createDeck(rng, legForms());

    // Level 4 keeps no deck (each question is one constructed journey).
    return Array.from({ length: count }, () => {
        if (rung >= 4) {
            const journey = drawJourney(rng);
            return {
                prompt: `A bus travels ${journey.d1} m in ${journey.t1} s, then ${journey.d2} m in ${journey.t2} s. The average speed for the whole journey is __ m/s.`,
                // TOTAL distance ÷ TOTAL time — the printed key shows the
                // exact integer the two-leg construction guarantees.
                answer: `${journey.average}`
            };
        }
        const form = rung === 1 ? 'distance' : legFormDeck.take();
        return printLegForm(form, drawLeg(rng, metric), units);
    });
}

// The plugin's declarative spec (exported for its own tests).
export const speedSpec: WorksheetSpec = {
    id: 'speed',
    label: 'Speed, Distance & Time',
    icon: '⏱',
    // One-line prompts in the standard two-column grid.
    perPage: 8,
    offered: (grade: GradeConfig) => grade.available.includes('speed'),
    scope: (grade: GradeConfig) => {
        const rung = rungOf(grade.caps);
        if (rung === 1) return 'distance = speed × time (m/s)';
        if (rung === 2) return 'find any quantity (m/s)';
        if (rung === 3) return 'km/h journeys';
        return 'whole-journey average speed';
    },
    generate: generateSpeed
};

// The plugin: a function the dashboard calls with its framework bundle.
export function SpeedDistanceTimeWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(speedSpec);
}
