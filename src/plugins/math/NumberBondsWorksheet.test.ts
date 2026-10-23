// Unit tests for the NUMBER BONDS worksheet plugin.
//
// The plugin's generator is DETERMINISTIC: entire sheets pinned to exact
// expected values from the same seed the framework uses
// (seedFrom([grade.id, spec.id, 0])). DEPTH-FIRST SHEET: six CONNECTED
// multi-part tasks per page (part-part-whole diagrams and cube towers need
// more room); answers list the blank values IN PRINTED ORDER, comma
// separated. Prep does not offer the extension types.

import { describe, it, expect } from 'vitest';
import { seedFrom, getMathGradeConfig, generateSheet } from '../../framework';
import { bondsSpec } from './NumberBondsWorksheet';

const g0 = getMathGradeConfig(0);
const g1 = getMathGradeConfig(1);
const g2 = getMathGradeConfig(2);

function sheet(grade: ReturnType<typeof getMathGradeConfig>) {
    return generateSheet(bondsSpec, grade, seedFrom([grade.id, bondsSpec.id, 0]));
}

describe('number bonds plugin — declarative spec', () => {
    it('declares its sidebar label, glyph and page size', () => {
        expect(bondsSpec.id).toBe('bonds');
        expect(bondsSpec.label).toBe('Number Bonds');
        expect(bondsSpec.icon).toBe('∨');
        // Five connected tasks per page carries one part-part-whole diagram
        // per item (framework/BondDiagram.tsx) on a fixed A4 sheet (T3M3:
        // 6 rows clipped the worst case — see plugins/layout-capacity.test.ts).
        expect(bondsSpec.perPage).toBe(5);
    });

    it('describes its numeric scope from the grade caps', () => {
        expect(bondsSpec.scope(g1)).toBe('bonds to 10');
        expect(bondsSpec.scope(g2)).toBe('bonds to 10 & 20');
    });
});

describe('number bonds — availability gating', () => {
    it('Prep does not offer the extension type (empty sheet); Year 1 does', () => {
        expect(sheet(g0)).toEqual([]);
        expect(sheet(g1)).toHaveLength(5);
    });
});

describe('number bonds — Year 1 (part-part-whole to 10)', () => {
    it('matches the exact sheet (no zero parts)', () => {
        const s = sheet(g1);
        // Figure-backed rows pin their bond: `whole` with the GIVEN part and
        // the missing part null (framework/BondDiagram.tsx leaves it blank).
        expect(s).toEqual([
            {"prompt":"__ - 4 = 6 and 6 + 4 = __","answer":"10, 10","id":1,"type":"bonds"},
            {"prompt":"5 + __ = 10 and 10 - 5 = __","answer":"5, 5","bond":{"whole":10,"left":5,"right":null},"id":2,"type":"bonds"},
            {"prompt":"The whole is 10. Write its two parts: __ and __","answer":"9, 1","bond":{"whole":10,"left":null,"right":null},"id":3,"type":"bonds"},
            {"prompt":"A tower of 10 cubes has 2 showing. The hidden part is __; the bond is __ + __ = 10","answer":"8, 2, 8","bond":{"whole":10,"left":2,"right":null},"id":4,"type":"bonds"},
            {"prompt":"__ - 7 = 3 and 3 + 7 = __","answer":"10, 10","id":5,"type":"bonds"},
        ]);
        // Every Year 1 bond whole is exactly 10, and any GIVEN part is a
        // non-zero part of it (the missing part is always null in the figure).
        for (const p of s) {
            if (!p.bond) continue;
            expect(p.bond.whole).toBe(10);
            for (const part of [p.bond.left, p.bond.right]) {
                if (part !== null) expect(part).toBeGreaterThanOrEqual(1);
            }
        }
    });
});

describe('number bonds — Year 2 (10 & 20)', () => {
    it('matches the exact sheet', () => {
        const s = sheet(g2);
        expect(s).toEqual([
            {"prompt":"A tower of 20 cubes has 5 showing. The hidden part is __; the bond is __ + __ = 20","answer":"15, 5, 15","bond":{"whole":20,"left":5,"right":null},"id":1,"type":"bonds"},
            {"prompt":"The whole is 20. Write its two parts: __ and __","answer":"4, 16","bond":{"whole":20,"left":null,"right":null},"id":2,"type":"bonds"},
            {"prompt":"6 + 13 = 10 + __ = __","answer":"9, 19","id":3,"type":"bonds"},
            {"prompt":"13 + __ = 20 and 20 - 13 = __","answer":"7, 7","bond":{"whole":20,"left":13,"right":null},"id":4,"type":"bonds"},
            {"prompt":"__ - 13 = 7 and 7 + 13 = __","answer":"20, 20","id":5,"type":"bonds"},
        ]);
        // Year 2 bond wholes target 10 or 20, with non-zero given parts.
        for (const p of s) {
            if (!p.bond) continue;
            expect([10, 20]).toContain(p.bond.whole);
            for (const part of [p.bond.left, p.bond.right]) {
                if (part !== null) expect(part).toBeGreaterThanOrEqual(1);
            }
        }
        // The "make ten" bridging row: 6 + 13 = 19 = 10 + 9 (pinned exactly
        // above). The second bridging row (7 + 11 = 18 = 10 + 8) now falls on
        // page 2 at the T3M3 5-per-page density — the stream pin in the
        // shared capacity suite keeps it deterministic.
        expect(s[2].answer).toBe('9, 19');
    });
});
