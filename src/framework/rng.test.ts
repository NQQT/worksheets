// Unit tests for the framework's deterministic PRNG.
//
// The generator must be fully deterministic: a fixed seed always yields the
// same sequence. These tests pin exact sequences (not ranges) so any change to
// the algorithm is caught immediately.

import { describe, it, expect } from 'vitest';
import { createRng, seedFrom } from './rng';

describe('createRng', () => {
    // A fixed seed produces a fixed, reproducible integer sequence.
    it('is deterministic for a given seed', () => {
        const r = createRng(12345);
        const seq = Array.from({ length: 8 }, () => r.int(0, 20));
        expect(seq).toEqual([20, 6, 10, 17, 10, 7, 1, 16]);
    });

    // Two rngs with the same seed produce identical sequences.
    it('reproduces the same sequence across separate instances', () => {
        const a = createRng(999);
        const b = createRng(999);
        const sa = Array.from({ length: 5 }, () => a.int(0, 100));
        const sb = Array.from({ length: 5 }, () => b.int(0, 100));
        expect(sa).toEqual(sb);
    });

    // Different seeds produce different sequences (no accidental correlation).
    it('different seeds yield different sequences', () => {
        const a = createRng(1).int(0, 1000);
        const b = createRng(2).int(0, 1000);
        expect(a).not.toEqual(b);
    });

    // `int(min, max)` always lands inside the inclusive bounds across many draws.
    it('never leaves the requested bounds', () => {
        const r = createRng(7);
        for (let i = 0; i < 200; i++) {
            const v = r.int(3, 9);
            expect(v).toBeGreaterThanOrEqual(3);
            expect(v).toBeLessThanOrEqual(9);
            expect(Number.isInteger(v)).toBe(true);
        }
    });

    // `pick` returns only members of the array and covers the distribution over draws.
    it('pick returns only array members', () => {
        const r = createRng(5);
        const arr = ['a', 'b', 'c'];
        for (let i = 0; i < 50; i++) {
            expect(arr).toContain(r.pick(arr));
        }
    });
});

describe('seedFrom', () => {
    // Exact stable seeds for the inputs the dashboard actually uses.
    it('produces stable seeds for known inputs', () => {
        expect(seedFrom([1, 'addition', 0])).toBe(174816151);
        expect(seedFrom([1, 'skip', 0])).toBe(1657156533);
        expect(seedFrom([1, 'word', 0])).toBe(2553457886);
        expect(seedFrom([2, 'addition', 0])).toBe(3173937301);
    });

    // Distinct inputs produce distinct seeds (low collision risk).
    it('distinct inputs produce distinct seeds', () => {
        const seeds = [
            seedFrom([1, 'addition', 0]),
            seedFrom([1, 'subtraction', 0]),
            seedFrom([1, 'addition', 1]),
            seedFrom([2, 'addition', 0])
        ];
        // All four must be unique.
        expect(new Set(seeds).size).toBe(4);
    });

    // Returned seeds are unsigned 32-bit integers.
    it('returns an unsigned integer', () => {
        const s = seedFrom([12, 'word', 99]);
        expect(Number.isInteger(s)).toBe(true);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(0xffffffff);
    });
});
