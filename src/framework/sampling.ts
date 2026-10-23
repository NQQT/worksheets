// ─────────────────────────────────────────────────────────────────────────────
// FRAMEWORK — unique sampling primitives.
//
// The worksheet generators used to sample with plain `rng.pick(pool)` inside a
// `for` loop, so questions repeated freely the moment a document grew past its
// pool (an 18-question spelling sheet built from 8 triples MUST repeat). These
// two utilities are the shared fix, and every sampling generator builds on
// them:
//
//   - `createDeck(rng, pool)`  — deal WITHOUT replacement. Every element is
//     dealt exactly once per "cycle"; when the deck runs dry it reshuffles and
//     continues, with a guard so the first card of a fresh cycle can never be
//     the last card just dealt. Decks spread pool coverage evenly across a
//     long document instead of clustering on lucky picks.
//
//   - `sampleUnique(count, produce, keyOf)` — collect `count` items whose
//     `keyOf` fingerprints (the printed prompt) are all DISTINCT. Duplicates
//     are discarded and redrawn until the target is met, so a generator can
//     emit a thousand questions without a single repeat as long as its
//     question space is big enough. When the space IS smaller than the ask,
//     the fallback tail fills with (evenly spread) repeats rather than
//     failing — a sheet is always complete.
//
// Both are deterministic: same seeded Rng stream => same output.
// ─────────────────────────────────────────────────────────────────────────────

import type { Rng } from './rng';

// Fisher–Yates over a COPY (never mutates the source pool), driven by the
// shared Rng so deck order is reproducible from the document seed.
function shuffled<T>(rng: Rng, items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

// A deck over `pool`: `take()` deals each element once per cycle, reshuffling
// between cycles. Comparison is by identity for objects and by value for the
// strings the word banks deal in — both fine here (pools hold no duplicates).
export type Deck<T> = { take: () => T };

export function createDeck<T>(rng: Rng, pool: readonly T[]): Deck<T> {
    if (pool.length === 0) throw new Error('createDeck() called on an empty pool');
    let queue: T[] = shuffled(rng, pool);
    let last: T | undefined;
    return {
        take: () => {
            if (queue.length === 0) {
                // Fresh cycle: reshuffle, then make sure the card about to be
                // dealt is not the one dealt last (no back-to-back repeats at
                // the cycle boundary). Swapping it with the front card keeps
                // the order otherwise intact.
                queue = shuffled(rng, pool);
                if (queue.length > 1 && queue[queue.length - 1] === last) {
                    [queue[queue.length - 1], queue[0]] = [queue[0], queue[queue.length - 1]];
                }
            }
            const item = queue.pop() as T;
            last = item;
            return item;
        }
    };
}

// Collect `count` items with distinct `keyOf` fingerprints. `produce` is a
// closure (it closes over the generator's own rng/decks) that may return
// duplicates; those are thrown away and redrawn.
//
// Attempt budget: 60 sweeps over the ask plus a fixed reserve — enough for
// producers whose space is a large fraction of the ask, while a tiny space
// (e.g. 20 homophone sentences asked of 1000) gives up quickly and lets the
// fallback fill the tail. The fallback keeps calling produce, so deck-driven
// producers keep spreading repeats evenly instead of clumping them.
export function sampleUnique<T>(
    count: number,
    produce: (index: number) => T,
    keyOf: (item: T) => string
): T[] {
    const seen = new Set<string>();
    const out: T[] = [];
    const maxAttempts = count * 60 + 1000;
    let attempts = 0;
    while (out.length < count && attempts < maxAttempts) {
        attempts += 1;
        const item = produce(out.length);
        const key = keyOf(item);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(item);
    }
    // Question space exhausted: complete the sheet with repeats (spread by
    // the producer's own decks) rather than returning a short document.
    while (out.length < count) out.push(produce(out.length));
    return out;
}
