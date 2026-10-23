// Unit tests for the PROBABILITY (YEAR 11) worksheet plugin (senior
// expansion).
//
// Strategy (see plugins/CalculusWorksheet.test.ts): the ENTIRE first page is
// pinned exactly with the framework seed, and every answer family is then
// re-derived INDEPENDENTLY from the printed counts/probabilities across many
// seeds — all decimal work is integer tenths and all fraction answers are
// reduced with an independent Euclid gcd, so float rounding could never pass.
import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, generateDocument } from '../../framework';
import { prob11Spec } from './Prob11Worksheet';

const g11 = getMathGradeConfig(11);

function sheet(refresh = 0) {
    return generateSheet(prob11Spec, g11, seedFrom([g11.id, prob11Spec.id, refresh]));
}

// Euclid's gcd — independent fraction-reduction oracle.
function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

// "12/30" printed count-ratio → its exact simplest form via the oracle.
function reduce(num: number, den: number): string {
    const g = gcd(num, den);
    return `${num / g}/${den / g}`;
}

// One-decimal tenths string for an integer number of tenths.
function tenth(n: number): string {
    return (n / 10).toFixed(1);
}

describe('prob11 plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(prob11Spec.id).toBe('prob11');
        expect(prob11Spec.label).toBe('Probability');
        expect(prob11Spec.icon).toBe('𝑃');
        expect(prob11Spec.perPage).toBe(8);
    });

    it('describes its senior scope line', () => {
        expect(prob11Spec.scope(g11)).toBe('addition & conditional rules, independence, tables & E(X)');
    });

    it('is offered on Year 11 ONLY (the Years 3..6 probability strand keeps its own id)', () => {
        for (let id = 0; id <= 12; id++) {
            expect(prob11Spec.offered(getMathGradeConfig(id))).toBe(id === 11);
        }
    });
});

describe('prob11 — Year 11 first page (deterministic pin)', () => {
    it('matches the exact first page', () => {
        expect(sheet()).toEqual([
            { prompt: 'Starter: P(A) = 0.7. P(not A) = __', answer: '0.3', id: 1, type: 'prob11' },
            { prompt: 'Starter: A spinner lands red 4 times and blue 6 times. P(red) in simplest form is __', answer: '2/5', id: 2, type: 'prob11' },
            { prompt: 'Practice: Pets in a street: 10 homes have none, 8 have one and 10 have two. One home is chosen. P(exactly one pet) = __', answer: '2/7', id: 3, type: 'prob11' },
            { prompt: 'Practice: Pets in a street: 8 homes have none, 2 have one and 4 have two. One home is chosen. P(at least one pet) = __', answer: '3/7', id: 4, type: 'prob11' },
            { prompt: 'Practice: Pets in a street: 3 homes have none, 6 have one and 8 have two. One home is chosen. P(at least one pet) = __', answer: '14/17', id: 5, type: 'prob11' },
            { prompt: 'Practice: Pets in a street: 4 homes have none, 5 have one and 2 have two. One home is chosen. P(at least one pet) = __', answer: '7/11', id: 6, type: 'prob11' },
            { prompt: 'Challenge: P(A) = 2/3 and P(B | A) = 2/3. P(A and B) = __', answer: '4/9', id: 7, type: 'prob11' },
            { prompt: 'Challenge: P(A) = 2/5 and P(B | A) = 3/4. P(A and B) = __', answer: '3/10', id: 8, type: 'prob11' }
        ]);
    });

    it('the same seed regenerates the identical sheet; a re-roll changes it', () => {
        const again = generateSheet(prob11Spec, g11, seedFrom([g11.id, prob11Spec.id, 0]));
        expect(again).toEqual(sheet());
        const doc = generateDocument(prob11Spec, g11, seedFrom([g11.id, prob11Spec.id, 1]), 2);
        expect(doc.pages[0]).not.toEqual(sheet());
    });

    it('every page prints the 2 + 4 + 2 scaffolded tiers', () => {
        const doc = generateDocument(prob11Spec, g11, seedFrom([g11.id, prob11Spec.id, 3]), 5);
        for (const page of doc.pages) {
            expect(page.filter((p) => p.prompt.startsWith('Starter:'))).toHaveLength(2);
            expect(page.filter((p) => p.prompt.startsWith('Practice:'))).toHaveLength(4);
            expect(page.filter((p) => p.prompt.startsWith('Challenge:'))).toHaveLength(2);
        }
    });
});

// ── Independent mathematical validation across seeds ────────────────────────
describe('prob11 — answers re-derived from the printed prompts (many seeds)', () => {
    const all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((refresh) =>
        generateDocument(prob11Spec, g11, seedFrom([g11.id, prob11Spec.id, refresh]), 4).pages.flat()
    );

    it('complement and mutually-exclusive addition answers are exact tenths', () => {
        let compChecked = 0;
        let addChecked = 0;
        for (const p of all) {
            const comp = p.prompt.match(/^Starter: P\(A\) = (0\.\d)\. P\(not A\) = __$/);
            if (comp) {
                compChecked += 1;
                expect(p.answer).toBe(tenth(10 - Math.round(Number(comp[1]) * 10)));
            }
            const add = p.prompt.match(/^Starter: P\(A\) = (0\.\d), P\(B\) = (0\.\d) and A and B are mutually exclusive\. P\(A or B\) = __$/);
            if (add) {
                addChecked += 1;
                const pa = Math.round(Number(add[1]) * 10);
                const pb = Math.round(Number(add[2]) * 10);
                expect(pa + pb).toBeLessThanOrEqual(10); // disjoint by design
                expect(p.answer).toBe(tenth(pa + pb));
            }
        }
        expect(compChecked).toBeGreaterThanOrEqual(10);
        expect(addChecked).toBeGreaterThanOrEqual(10);
    });

    it('from-counts starter answers are the reduced count ratio', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Starter: A spinner lands red (\d+) times and blue (\d+) times\. P\(red\) in simplest form is __$/);
            if (!m) continue;
            checked += 1;
            expect(p.answer).toBe(reduce(Number(m[1]), Number(m[1]) + Number(m[2])));
        }
        expect(checked).toBeGreaterThanOrEqual(10);
    });

    it('general addition-rule answers equal P(A) + P(B) − P(A ∩ B) in exact tenths', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Practice: P\(A\) = (0\.\d), P\(B\) = (0\.\d) and P\(A and B\) = (0\.\d)\. P\(A or B\) = __$/);
            if (!m) continue;
            checked += 1;
            const pa = Math.round(Number(m[1]) * 10);
            const pb = Math.round(Number(m[2]) * 10);
            const both = Math.round(Number(m[3]) * 10);
            expect(both).toBeLessThanOrEqual(Math.min(pa, pb)); // valid overlap
            expect(pa + pb - both).toBeLessThanOrEqual(10); // union ≤ 1
            expect(p.answer).toBe(tenth(pa + pb - both));
        }
        expect(checked).toBeGreaterThanOrEqual(15);
    });

    it('conditional answers are the reduced sub-group ratio over the condition', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Practice: Of the (\d+) students who play sport, (\d+) are in Year 11\. One sport player is chosen at random\. P\(Year 11\) = __$/);
            if (!m) continue;
            checked += 1;
            const s = Number(m[1]);
            const k = Number(m[2]);
            expect(k).toBeLessThan(s);
            expect(p.answer).toBe(reduce(k, s));
        }
        expect(checked).toBeGreaterThanOrEqual(15);
    });

    it('independence verdicts follow exactly from P(A)·P(B) vs the printed P(A ∩ B)', () => {
        let yesChecked = 0;
        let noChecked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Practice: P\(A\) = (\d+)%, P\(B\) = (\d+)% and P\(A and B\) = (\d+)%. Are A and B independent\? \(yes\/no\) __$/);
            if (!m) continue;
            const product = (Number(m[1]) * Number(m[2])) / 100; // exact percent
            const both = Number(m[3]);
            if (product === both) {
                yesChecked += 1;
                expect(p.answer).toBe('Yes');
            } else {
                noChecked += 1;
                expect(p.answer).toBe('No');
                // The printed joint probability is still a valid probability.
                expect(both).toBeGreaterThan(0);
                expect(both).toBeLessThanOrEqual(100);
            }
        }
        expect(yesChecked).toBeGreaterThanOrEqual(5);
        expect(noChecked).toBeGreaterThanOrEqual(5);
    });

    it('frequency-table answers are the exact reduced count ratios (both ask forms)', () => {
        let oneChecked = 0;
        let leastChecked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Practice: Pets in a street: (\d+) homes have none, (\d+) have one and (\d+) have two\. One home is chosen\. P\((exactly|at least) one pet\) = __$/);
            if (!m) continue;
            const total = Number(m[1]) + Number(m[2]) + Number(m[3]);
            const count = m[4] === 'exactly' ? Number(m[2]) : Number(m[2]) + Number(m[3]);
            if (m[4] === 'exactly') oneChecked += 1; else leastChecked += 1;
            expect(p.answer).toBe(reduce(count, total));
        }
        expect(oneChecked).toBeGreaterThanOrEqual(10);
        expect(leastChecked).toBeGreaterThanOrEqual(10);
    });

    it('discrete-table probabilities sum to 1 and E(X) is the exact tenths expectation', () => {
        let evChecked = 0;
        let leastChecked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Challenge: A random variable X has P\(X = 0\) = (0\.\d), P\(X = 1\) = (0\.\d) and P\(X = 2\) = (0\.\d)\. (E\(X\)|P\(X ≥ 1\)) = __$/);
            if (!m) continue;
            const p0 = Math.round(Number(m[1]) * 10);
            const p1 = Math.round(Number(m[2]) * 10);
            const p2 = Math.round(Number(m[3]) * 10);
            expect(p0 + p1 + p2).toBe(10); // the printed table is a distribution
            if (m[4] === 'E(X)') {
                evChecked += 1;
                // E(X) = 0·p0 + 1·p1 + 2·p2 = (p1 + 2·p2)/10 — exact tenths.
                expect(p.answer).toBe(tenth(p1 + 2 * p2));
            } else {
                leastChecked += 1;
                expect(p.answer).toBe(reduce(p1 + p2, 10));
            }
        }
        expect(evChecked).toBeGreaterThanOrEqual(10);
        expect(leastChecked).toBeGreaterThanOrEqual(10);
    });

    it('multiplication-rule answers equal the reduced product P(A)·P(B|A)', () => {
        let checked = 0;
        for (const p of all) {
            const m = p.prompt.match(/^Challenge: P\(A\) = (\d+)\/(\d+) and P\(B \| A\) = (\d+)\/(\d+)\. P\(A and B\) = __$/);
            if (!m) continue;
            checked += 1;
            const [, a, b, c, d] = m.map(Number);
            expect(a).toBeLessThan(b);
            expect(c).toBeLessThan(d);
            expect(p.answer).toBe(reduce(a * c, b * d));
        }
        expect(checked).toBeGreaterThanOrEqual(10);
    });
});
