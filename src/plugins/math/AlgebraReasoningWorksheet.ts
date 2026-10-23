// ─────────────────────────────────────────────────────────────────────────────
// ALGEBRA & REASONING WORKSHEET — self-contained plugin (T4 expansion).
//
// YEAR-TIERED STRAND (Australian Curriculum v9-informed, codes in readme.md):
//   Year 3  finding the unknown in □ + a = b and stating equivalent
//           expressions (AC9M3A01).
//   Year 4  unknowns in multiplication/division facts and simple patterns
//           (AC9M4A01-02).
//   Year 5  unknowns with brackets, linear patterns and first order-of-
//           operations work (AC9M5A01-02).
//   Year 6  brackets, two-operation expressions, equal-difference and
//           multiplication patterns, and symbol replacement (AC9M6A01-04).
//
// SCAFFOLDED LEARNING SEQUENCE (R4): printed "Starter:/Practice:/Challenge:"
// tier prefixes, 2+4+2 per page (sentence-style prompts, 8 to a sheet).
//
// EXACT BY CONSTRUCTION: the unknown □ is DRAWN FIRST and the printed total
// computed from it, so every equation has the drawn value as its unique
// answer; patterns are generated forward from (start, difference/ratio) and
// the next term(s) are the continuation of that exact sequence.
//
// Self-contained: delete file + index line to remove the worksheet.
// ─────────────────────────────────────────────────────────────────────────────

import type { Caps, DashboardFramework, DashboardPlugin, GradeConfig, RawProblem, Rng, WorksheetSpec } from '../../framework';
import { createDeck, sampleUnique } from '../../framework';

// Eight reasoning sentences per A4, two columns (four grid rows).
const PER_PAGE = 8;
const S_COUNT = 2;
const P_COUNT = 4;
const C_COUNT = 2;

// ── Year 3 (AC9M3A01): the unknown in addition, equivalent expressions ──────
function starterY3(rng: Rng): RawProblem {
    // □ drawn first; the printed total is computed from it (exact answer).
    const box = rng.int(2, 12);
    const b = rng.int(2, 12);
    return { prompt: `Starter: □ + ${b} = ${box + b}. □ stands for __`, answer: String(box) };
}

function practiceY3(rng: Rng): RawProblem {
    // Equivalent expressions (AC9M3A01): a + b = c + □. The unknown □ is
    // DRAWN first, then c, and the printed addends a, b are a SPLIT of the
    // total c + □ — so □ = a + b − c is positive by construction. (T8: the
    // old independent draw let c exceed a + b and print a negative unknown,
    // e.g. "3 + 2 = 7 + __" = −2 — no negative numbers in Year 3 scope.)
    const box = rng.int(2, 9);
    const c = rng.int(2, 9);
    const sum = c + box; // 4..18 — always splittable into two 2..9 addends
    const a = rng.int(Math.max(2, sum - 9), Math.min(9, sum - 2));
    const b = sum - a; // stays within 2..9 by the a-bounds above
    return { prompt: `Practice: ${a} + ${b} = ${c} + □. □ stands for __`, answer: String(box) };
}

function challengeY3(rng: Rng): RawProblem {
    // Balance both sides: □ + a = r1 + r2. The RIGHT total is built to equal
    // box + a (r1 drawn, r2 = total − r1), so □ = box is the unique answer.
    const box = rng.int(2, 10);
    const a = rng.int(2, 9);
    const total = box + a;
    const r1 = rng.int(2, total - 2);
    const r2 = total - r1;
    return { prompt: `Challenge: □ + ${a} = ${r1} + ${r2}. □ stands for __`, answer: String(box) };
}

// ── Year 4 (AC9M4A01-02): unknowns in facts & patterns ──────────────────────
function starterY4(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['mul', 'sub'] as const);
    const form = deck.take();
    if (form === 'mul') {
        // □ × f = product, tables within the grade's multiplication cap.
        const f = rng.int(2, 10);
        const box = rng.int(2, Math.min(12, Math.floor(caps.multCap / f)));
        return { prompt: `Starter: □ × ${f} = ${box * f}. □ stands for __`, answer: String(box) };
    }
    const box = rng.int(20, 99);
    const b = rng.int(2, 19);
    return { prompt: `Starter: □ − ${b} = ${box - b}. □ stands for __`, answer: String(box) };
}

function practiceY4(rng: Rng, caps: Caps): RawProblem {
    const deck = createDeck(rng, ['div', 'twoop'] as const);
    const form = deck.take();
    if (form === 'div') {
        // Division unknown: product ÷ □ = f (exact by construction).
        const f = rng.int(2, 10);
        const box = rng.int(2, Math.min(12, Math.floor(caps.multCap / f)));
        return { prompt: `Practice: ${box * f} ÷ □ = ${f}. □ stands for __`, answer: String(box) };
    }
    // Two-operation back-track: □ × a + b = total (draw □, a, b).
    const a = rng.int(2, 9);
    const b = rng.int(1, 9);
    const box = rng.int(2, 9);
    return { prompt: `Practice: □ × ${a} + ${b} = ${box * a + b}. □ stands for __`, answer: String(box) };
}

function challengeY4(rng: Rng): RawProblem {
    // Equal-difference pattern, next two terms (sequence built forward).
    const start = rng.int(2, 9);
    const d = rng.int(2, 9);
    const t = [start, start + d, start + 2 * d, start + 3 * d];
    return {
        prompt: `Challenge: Pattern: ${t.join(', ')}, __ and __ (counting by ${d}s)`,
        answer: `${start + 4 * d}, ${start + 5 * d}`
    };
}

// ── Year 5 (AC9M5A01-02): brackets, patterns & first precedence ─────────────
function starterY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['mul', 'twoop'] as const);
    const form = deck.take();
    const box = rng.int(2, 12);
    if (form === 'mul') {
        const f = rng.int(3, 9);
        return { prompt: `Starter: □ × ${f} = ${box * f}. □ stands for __`, answer: String(box) };
    }
    const a = rng.int(2, 9);
    // b is capped BELOW □ × a so the printed total never goes negative
    // (T8: the old draw could print "□ × 4 − 9 = −1" — negative totals are
    // outside the Year 5 primary scope).
    const b = rng.int(1, Math.min(9, box * a - 1));
    return { prompt: `Starter: □ × ${a} − ${b} = ${box * a - b}. □ stands for __`, answer: String(box) };
}

function practiceY5(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['brackets', 'pattern'] as const);
    const form = deck.take();
    const box = rng.int(2, 12);
    if (form === 'brackets') {
        const a = rng.int(2, 9);
        const b = rng.int(1, 9);
        return {
            prompt: `Practice: (${box} + ${a}) × ${b} = __`,
            answer: String((box + a) * b)
        };
    }
    // Linear pattern: next term of an arithmetic sequence (built forward).
    const start = rng.int(2, 15);
    const d = rng.int(2, 12);
    const t = [start, start + d, start + 2 * d, start + 3 * d];
    return { prompt: `Practice: Pattern: ${t.join(', ')}, __`, answer: String(start + 4 * d) };
}

function challengeY5(rng: Rng): RawProblem {
    // Order of operations: a + b × c (multiply first — AC9M5A02).
    const a = rng.int(2, 12);
    const b = rng.int(2, 9);
    const c = rng.int(2, 9);
    return { prompt: `Challenge: ${a} + ${b} × ${c} = __`, answer: String(a + b * c) };
}

// ── Year 6 (AC9M6A01-04): brackets, precedence & replacement ────────────────
function starterY6(rng: Rng): RawProblem {
    // Bracket unknown: a × (□ + b) = total (total computed from drawn □).
    const box = rng.int(2, 12);
    const a = rng.int(2, 9);
    const b = rng.int(1, 9);
    return { prompt: `Starter: ${a} × (□ + ${b}) = ${a * (box + b)}. □ stands for __`, answer: String(box) };
}

function practiceY6(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['order', 'pattern'] as const);
    const form = deck.take();
    if (form === 'order') {
        // Two-operation subtraction with precedence (AC9M6A02). The first
        // term is drawn ABOVE the product so the answer never goes negative
        // (no negative numbers in the Year 6 primary scope).
        const b = rng.int(2, 9);
        const c = rng.int(2, 5);
        const a = rng.int(b * c + 1, b * c + 20);
        return {
            prompt: `Practice: ${a} − ${b} × ${c} = __`,
            answer: String(a - b * c)
        };
    }
    // Multiplication (geometric) pattern: built forward from ratio 2 or 3.
    const start = rng.int(2, 6);
    const r = rng.pick([2, 3] as const);
    const t = [start, start * r, start * r * r, start * r * r * r];
    return { prompt: `Practice: Pattern: ${t.join(', ')}, __`, answer: String(start * r * r * r * r) };
}

function challengeY6(rng: Rng): RawProblem {
    const deck = createDeck(rng, ['square', 'replace'] as const);
    const form = deck.take();
    if (form === 'square') {
        // Perfect-square unknown: □ × □ = n², □ drawn first (exact root).
        const box = rng.int(4, 12);
        return { prompt: `Challenge: □ × □ = ${box * box} and □ is positive. □ stands for __`, answer: String(box) };
    }
    // Symbol replacement: if a = n, find ka + b (AC9M6A04).
    const n = rng.int(3, 12);
    const k = rng.int(2, 5);
    const b = rng.int(1, 9);
    return { prompt: `Challenge: If a = ${n}, then ${k}a + ${b} = __`, answer: String(k * n + b) };
}

function tierItem(rng: Rng, caps: Caps, tier: 'starter' | 'practice' | 'challenge'): RawProblem {
    const level = caps.yearLevel;
    if (tier === 'starter') return level === 3 ? starterY3(rng) : level === 4 ? starterY4(rng, caps) : level === 5 ? starterY5(rng) : starterY6(rng);
    if (tier === 'practice') return level === 3 ? practiceY3(rng) : level === 4 ? practiceY4(rng, caps) : level === 5 ? practiceY5(rng) : practiceY6(rng);
    return level === 3 ? challengeY3(rng) : level === 4 ? challengeY4(rng) : level === 5 ? challengeY5(rng) : challengeY6(rng);
}

// Page-by-page scaffold→core→stretch assembly (shared T4 rationale).
function generateAlgebra(rng: Rng, caps: Caps, count: number): RawProblem[] {
    const pages = Math.ceil(count / PER_PAGE);
    const starter = sampleUnique(pages * S_COUNT, () => tierItem(rng, caps, 'starter'), (p) => p.prompt);
    const practice = sampleUnique(pages * P_COUNT, () => tierItem(rng, caps, 'practice'), (p) => p.prompt);
    const challenge = sampleUnique(pages * C_COUNT, () => tierItem(rng, caps, 'challenge'), (p) => p.prompt);
    const out: RawProblem[] = [];
    for (let pg = 0; pg < pages; pg++) {
        out.push(
            ...starter.slice(pg * S_COUNT, pg * S_COUNT + S_COUNT),
            ...practice.slice(pg * P_COUNT, pg * P_COUNT + P_COUNT),
            ...challenge.slice(pg * C_COUNT, pg * C_COUNT + C_COUNT)
        );
    }
    return out.slice(0, count);
}

export const algebraSpec: WorksheetSpec = {
    id: 'algebra',
    label: 'Algebra & Reasoning',
    icon: '□',
    perPage: PER_PAGE,
    offered: (grade: GradeConfig) => grade.available.includes('algebra'),
    scope: (grade: GradeConfig) => {
        const level = grade.caps.yearLevel;
        if (level === 3) return 'unknowns & equivalent expressions (AC9M3A01)';
        if (level === 4) return 'fact unknowns & patterns (AC9M4A01-02)';
        if (level === 5) return 'brackets, patterns & precedence (AC9M5A01-02)';
        return 'brackets, precedence & replacement (AC9M6A01-04)';
    },
    generate: generateAlgebra
};

export function AlgebraReasoningWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(algebraSpec);
}
