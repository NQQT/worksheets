// Unit tests for the framework's UNIQUE SAMPLING primitives (createDeck /
// sampleUnique) — the machinery that lets worksheet generators emit long
// documents (a thousand+ questions) without repeats.
//
// Strategy: fully deterministic — a fixed seed produces a fixed stream, so
// every assertion below is an exact-value check (no ranges, no "at least").

import { describe, it, expect } from 'vitest';
import { createRng } from './rng';
import { createDeck, sampleUnique } from './sampling';

describe('createDeck — deal without replacement', () => {
    it('deals every element exactly once per cycle (order is seeded and exact)', () => {
        const rng = createRng(42);
        const deck = createDeck(rng, ['a', 'b', 'c', 'd', 'e']);
        const dealt: string[] = [];
        for (let i = 0; i < 5; i++) dealt.push(deck.take());
        // One full cycle: a permutation of the pool — pinned exactly.
        expect(dealt).toEqual(['d', 'b', 'c', 'e', 'a']);
        expect([...dealt].sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('reshuffles after exhaustion and covers the whole pool again', () => {
        const rng = createRng(7);
        const deck = createDeck(rng, [1, 2, 3]);
        const dealt: number[] = [];
        for (let i = 0; i < 9; i++) dealt.push(deck.take());
        // Three complete cycles: each cycle is a full permutation.
        expect([...dealt.slice(0, 3)].sort()).toEqual([1, 2, 3]);
        expect([...dealt.slice(3, 6)].sort()).toEqual([1, 2, 3]);
        expect([...dealt.slice(6, 9)].sort()).toEqual([1, 2, 3]);
        // And the cycles themselves are seeded — pinned exactly.
        expect(dealt).toEqual([1, 3, 2, 3, 2, 1, 2, 1, 3]);
    });

    it('never deals the same element twice in a row across a cycle boundary', () => {
        const rng = createRng(123);
        const pool = ['x', 'y'];
        const deck = createDeck(rng, pool);
        const dealt: string[] = [];
        for (let i = 0; i < 200; i++) dealt.push(deck.take());
        for (let i = 1; i < dealt.length; i++) {
            expect(dealt[i]).not.toBe(dealt[i - 1]);
        }
    });

    it('is deterministic — same seed, same deal order', () => {
        const deal = () => {
            const deck = createDeck(createRng(999), [10, 20, 30, 40]);
            return Array.from({ length: 4 }, () => deck.take());
        };
        expect(deal()).toEqual(deal());
        expect(deal()).toEqual([40, 20, 10, 30]);
    });

    it('throws on an empty pool', () => {
        expect(() => createDeck(createRng(1), [])).toThrow('createDeck() called on an empty pool');
    });

    it('never mutates the source pool', () => {
        const pool = [1, 2, 3];
        const deck = createDeck(createRng(5), pool);
        deck.take();
        deck.take();
        expect(pool).toEqual([1, 2, 3]);
    });
});

describe('sampleUnique — collect distinct-keyed items', () => {
    it('keeps exactly the distinct values in first-appearance order', () => {
        const rng = createRng(11);
        const pool = ['a', 'b', 'a', 'c', 'b', 'a'];
        const out = sampleUnique(
            3,
            () => rng.pick(pool),
            (s) => s
        );
        expect(out).toEqual(['c', 'a', 'b']);
    });

    it('returns an empty array for a zero ask', () => {
        const out = sampleUnique(0, () => 'x', (s) => s);
        expect(out).toEqual([]);
    });

    it('passes the running output length to the producer', () => {
        const seen: number[] = [];
        sampleUnique(
            4,
            (index) => {
                seen.push(index);
                return `item-${index}`;
            },
            (s) => s
        );
        expect(seen).toEqual([0, 1, 2, 3]);
    });

    it('fills the tail with repeats when the question space is smaller than the ask', () => {
        // Space of 3 distinct keys, asked of 8: the first 3 are unique, the
        // tail repeats (spread evenly by the producer's rng).
        const rng = createRng(3);
        const pool = ['p', 'q', 'r'];
        const out = sampleUnique(
            8,
            () => rng.pick(pool),
            (s) => s
        );
        expect(out).toHaveLength(8);
        expect(new Set(out.slice(0, 3))).toEqual(new Set(['p', 'q', 'r']));
        expect(out.slice(0, 3)).toEqual(['r', 'p', 'q']);
    });

    it('scales to a thousand unique draws keyed on generated prompts', () => {
        // Stand-in for a worksheet generator: prompt space = index itself, so
        // 1000 asks must yield 1000 distinct prompts, zero repeats.
        const rng = createRng(2024);
        const out = sampleUnique(
            1000,
            () => ({ prompt: `q-${rng.int(0, 999999)}` }),
            (p) => p.prompt
        );
        expect(out).toHaveLength(1000);
        expect(new Set(out.map((p) => p.prompt))).toHaveLength(1000);
    });
});
