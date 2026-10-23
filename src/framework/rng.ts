// Deterministic seeded PRNG for worksheet generation (framework utility).
//
// Why deterministic: the SAME seed must always produce the SAME sequence of
// numbers. A worksheet is generated once and that exact problem list is reused
// for both the inline preview and the hidden print tree, so the preview always
// matches what prints. Determinism also makes every worksheet generator
// unit-testable with exact expected values (a fixed seed => a fixed sheet).
//
// Algorithm: mulberry32 — a tiny, fast, seedable 32-bit generator.
// `createRng(seed)` returns an object with:
//   - `next()`  -> float in [0, 1)
//   - `int(min, max)` -> integer in [min, max] INCLUSIVE
//   - `pick(arr)` -> a uniformly random element of arr
export type Rng = {
    next: () => number;
    int: (min: number, max: number) => number;
    pick: <T>(arr: readonly T[]) => T;
};

export function createRng(seed: number): Rng {
    // Keep the seed as an unsigned 32-bit int so negative inputs still work.
    let a = seed >>> 0;

    const next = () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    // Inclusive integer in [min, max]. Guards against invalid ranges.
    const int = (min: number, max: number) => {
        if (max < min) [min, max] = [max, min];
        // Use next() to avoid modulo bias being visible at these small scales.
        return min + Math.floor(next() * (max - min + 1));
    };

    const pick = <T,>(arr: readonly T[]): T => {
        if (arr.length === 0) throw new Error('pick() called on empty array');
        return arr[int(0, arr.length - 1)];
    };

    return { next, int, pick };
}

// Build a stable 32-bit seed from a set of integer/string parts (grade id,
// worksheet id, refresh counter). FNV-1a over the packed string keeps
// collisions low while remaining fully deterministic and platform-independent.
//
// The separator is the NUL character ('\0') — a pinned part of the seed
// contract. Historical worksheet seeds (and every pinned sheet in the plugin
// tests) were produced with this exact packing; changing the separator would
// silently re-roll every worksheet.
export function seedFrom(parts: readonly (number | string)[]): number {
    let h = 0x811c9dc5;
    const str = parts.join('\0');
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    // FNV final XOR step, returned as unsigned.
    return (h ^ (h >>> 16)) >>> 0;
}
