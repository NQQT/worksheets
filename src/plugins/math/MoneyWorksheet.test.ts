// Unit tests for the COINS & MONEY worksheet plugin (T2V density pass).
//
// The plugin's generator is DETERMINISTIC: the entire sheet is pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). Australian coins are V8 Year 2 content —
// Prep and Year 1 must produce empty sheets.
//
// T2V pass pinned below: SIX worded items per page (was twelve) because every
// item now prints its given-coins figure AND a full-width handwritten ANSWER
// LINE (answerLine: true) — twelve of those never fit A4 legibly. The five
// forms and the 76-question space are deliberately unchanged.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet, createRng } from '../../framework';
import { moneySpec } from './MoneyWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(moneySpec, grade, seedFrom([grade.id, moneySpec.id, 0]));
}

describe('money plugin — declarative spec', () => {
    it('declares its sidebar label, glyph, prose layout and reduced page size', () => {
        expect(moneySpec.id).toBe('money');
        expect(moneySpec.label).toBe('Coins & Money');
        expect(moneySpec.icon).toBe('$');
        expect(moneySpec.singleColumn).toBe(true);
        // Six worded items: figure + full-width answer line each.
        expect(moneySpec.perPage).toBe(6);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(moneySpec.scope(g2)).toBe('coins up to $1');
    });
});

describe('money — availability gating', () => {
    it('Prep and Year 1 do not offer money (empty sheets); Year 2 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toEqual([]);
        expect(sheet(g2)).toHaveLength(6);
    });
});

describe('money — Year 2 (AU 5/10/20/50c coins + $ notes, V8-aligned)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        // Every problem EXCEPT the "what coins make X?" form pins the GIVEN
        // pieces only (framework/MoneyDiagram.tsx draws coins <100c as coins,
        // >=100c as notes); the "make X" answer set is never drawn because it
        // IS the answer. Every item answers on a full-width line.
        expect(s).toEqual([
            {"prompt":"How many five-cent coins are the same as one ten-cent coin?","answer":"2","answerLine":true,"money":{"given":[10]},"id":1,"type":"money"},
            {"prompt":"How many five-cent coins are the same as one fifty-cent coin?","answer":"10","answerLine":true,"money":{"given":[50]},"id":2,"type":"money"},
            {"prompt":"What coins make 60c?","answer":"50c + 10c","answerLine":true,"id":3,"type":"money"},
            {"prompt":"How many five-cent coins are the same as one twenty-cent coin?","answer":"4","answerLine":true,"money":{"given":[20]},"id":4,"type":"money"},
            {"prompt":"What coins make 25c?","answer":"20c + 5c","answerLine":true,"id":5,"type":"money"},
            {"prompt":"How many twenty-cent coins make 40c?","answer":"2","answerLine":true,"money":{"given":[20]},"id":6,"type":"money"},
        ]);
    });

    it('every item answers on a full-width line (no inline blanks in prose)', () => {
        const s = moneySpec.generate(createRng(seedFrom([2, 'money', 0])), g2.caps, 60);
        for (const p of s) {
            expect(p.answerLine).toBe(true);
            expect(p.prompt).not.toContain('__');
        }
    });

    it('the given-only figure rule holds: no figure ever prints the answer', () => {
        const s = moneySpec.generate(createRng(seedFrom([2, 'money', 0])), g2.caps, 200);
        // The "make" form has a figureless answer by design.
        for (const p of s.filter((p) => p.prompt.startsWith('What coins make'))) {
            expect(p.money).toBeUndefined();
        }
        // Swap questions draw the single GIVEN big coin, never the smalls.
        for (const p of s.filter((p) => p.prompt.includes('are the same as one'))) {
            expect(p.money!.given).toHaveLength(1);
            expect(p.money!.given[0]).toBeGreaterThanOrEqual(10);
        }
        // "How many X coins make Y?" draws ONE coin of the asked type —
        // drawing Y/X of them would print the answer.
        for (const p of s.filter((p) => /^How many \w+-cent coins make /.test(p.prompt))) {
            expect(p.money!.given).toHaveLength(1);
        }
    });

    it('every answer is arithmetically correct against its own prompt', () => {
        const s = moneySpec.generate(createRng(seedFrom([2, 'money', 3])), g2.caps, 200);
        for (const p of s) {
            // "What coins make X?" — the canonical coin list sums back to X.
            const make = p.prompt.match(/^What coins make (\$[\d.]+|\d+c)\?$/);
            if (make) {
                const target = make[1];
                const cents = target.startsWith('$')
                    ? Math.round(parseFloat(target.slice(1)) * 100)
                    : Number(target.replace('c', ''));
                const used = p.answer.split(' + ').reduce((sum, c) => sum + Number(c.replace('c', '')), 0);
                expect(used).toBe(cents);
                // Canonical = fewest coins (greedy 50/20/10/5) and every
                // piece is a real AU coin.
                const greedy = greedyCoins(cents);
                expect(p.answer.split(' + ')).toEqual(greedy);
                continue;
            }
            const jar = p.prompt.match(/^A jar holds (\d+) (\w+)-cent coins\. How much money is in the jar\?$/);
            if (jar) {
                const n = Number(jar[1]);
                const c = wordCents(jar[2]);
                expect(p.answer).toBe(c * n >= 100 ? `$${Math.floor((c * n) / 100)}.${String((c * n) % 100).padStart(2, '0')}` : `${c * n}c`);
                expect(p.money).toEqual({ given: Array(n).fill(c) });
                continue;
            }
            const howMany = p.prompt.match(/^How many (\w+)-cent coins make (\$[\d.]+|\d+c)\?$/);
            if (howMany) {
                const c = wordCents(howMany[1]);
                const target = howMany[2];
                const cents = target.startsWith('$')
                    ? Math.round(parseFloat(target.slice(1)) * 100)
                    : Number(target.replace('c', ''));
                expect(cents % c).toBe(0);
                expect(p.answer).toBe(String(cents / c));
                continue;
            }
            const note = p.prompt.match(/^You have one \$(\d) note and one (\w+)-cent coin\. How much money is there in all\?$/);
            if (note) {
                const total = Number(note[1]) * 100 + wordCents(note[2]);
                expect(p.answer).toBe(`$${Math.floor(total / 100)}.${String(total % 100).padStart(2, '0')}`);
                expect(p.money).toEqual({ given: [Number(note[1]) * 100, wordCents(note[2])] });
                continue;
            }
            const swap = p.prompt.match(/^How many (\w+)-cent coins are the same as one (\w+)-cent coin\?$/);
            if (swap) {
                const small = wordCents(swap[1]);
                const big = wordCents(swap[2]);
                expect(big % small).toBe(0);
                expect(p.answer).toBe(String(big / small));
                continue;
            }
            throw new Error(`unexpected money prompt: ${p.prompt}`);
        }
    });

    it('the curated coin space stays at 76 distinct questions', () => {
        // Five forms over the multiples-of-5c amounts + jar/swap/note fact
        // sets — the whole space deals once before any repeat.
        const s = moneySpec.generate(createRng(seedFrom([2, 'money', 0])), g2.caps, 400);
        expect(new Set(s.map((p) => p.prompt)).size).toBe(76);
        expect(new Set(s.slice(0, 76).map((p) => p.prompt)).size).toBe(76);
    });
});

// Independent AU-cent word form ("five" → 5) for answer re-derivation.
function wordCents(word: string): number {
    return { five: 5, ten: 10, twenty: 20, fifty: 50 }[word]!;
}

// Canonical fewest-coin set for an amount (greedy 50/20/10/5), printed form.
function greedyCoins(cents: number): string[] {
    const out: string[] = [];
    for (const c of [50, 20, 10, 5]) {
        const n = Math.floor(cents / c);
        for (let k = 0; k < n; k++) out.push(`${c}c`);
        cents -= n * c;
    }
    return out;
}
