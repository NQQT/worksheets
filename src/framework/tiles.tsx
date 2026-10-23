// ─────────────────────────────────────────────────────────────────────────────
// FRAMEWORK — tile scaffolds (write-boxes + word-tile runs).
//
// WHY THIS EXISTS
// Pictograms tell an early reader WHAT a word is; tile scaffolds show HOW to
// put it down. Two shapes, one shared box style, both Y1–Y3 only (the
// generators set the `tileBlanks` / `tileWords` metadata — see types.ts —
// while inside the early cue band, isEarlyCueBand):
//
//   1. WRITE-BOX BLANKS (PrintableSheet renders these in place of the plain
//      underline blanks when `problem.tileBlanks` is set): the answer slot in
//      an Alphabet Order sequence ("a, b, ▢") or a Sentence Building word
//      gap ("…: ▢ ▢ ▢ ▢") is a bordered box the child writes into. The box
//      size matches the unit (letter box vs word box).
//
//   2. WORD-TILE RUNS (WordTileRun below, rendered by PrintableSheet when
//      `problem.tileWords` is set): the scrambled word bank of a
//      Sentence Building line prints as a run of bordered word tiles — the
//      "word cards" of a classic cut-and-order activity. The tiles carry the
//      DISPLAYED (scrambled) order only; the correct order is never printed.
//
// WHY BORDERED BOXES (and not pictograms / emoji)
//   - MONOCHROME + PRINT: a 2px dark-ink border on a square/rounded box
//     survives any greyscale printer and reads at worksheet size; no colour
//     or glyph coverage is involved.
//   - MODERATE DENSITY: at most ~5 small tiles per row (sentence shapes top
//     out at 5 words), so a 12-row single-column page stays uncrowded.
//   - ACCESSIBLE: the write-box is a pure writing slot (its text value would
//     BE the answer, so nothing is announced); the word tiles are an
//     `role="list"` of `role="listitem"`s — the tiles ARE the words (earlier
//     years no longer print the parenthesised list as text), so the list
//     must stay readable to screen readers and text selection.
//
// THE box style is exported so PrintableSheet's blank rendering and this
// file's tiles share ONE visual vocabulary (the preview canvas and the
// hidden print tree both render PrintableSheet, so screen and print agree).
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { styledComponent } from '@presource/react';

// The tile ink is the LIGHT reference value of the pictogram palette
// (framework/visuals.tsx INK) so tiles and pictures sit in one print-safe
// visual family; at runtime both paint through the --tile-ink / --picto-ink
// tokens (app.css), which @media print forces back to this dark-ink value.
// Strings (not numbers) on purpose: styledComponent function values pass
// numbers through styleStructure (→ rem), and print spacing wants explicit px
// (see PrintableSheet.tsx header notes).
export const TILE_INK = '#3f4c63';

// The shared box vocabulary. `bordered` boxes are the write-slot / word-card
// tiles; the legacy plain blank has no border (PrintableSheet's underlined
// Blank is unchanged legacy markup).
const Box = styledComponent<{ kind: 'letter' | 'word' }>('span', {
    display: 'inline-block',
    boxSizing: 'border-box',
    border: '2px solid var(--tile-ink)',
    borderRadius: ({ kind }) => (kind === 'letter' ? '4px' : '6px'),
    // A letter box fits one written letter; a word box fits a short word.
    width: ({ kind }) => (kind === 'letter' ? '24px' : '46px'),
    minWidth: 'auto',
    height: '0.85em',
    verticalAlign: 'baseline',
    margin: '0 5px',
    backgroundColor: 'var(--tile-bg)'
});

// A bordered answer slot the child writes into (write-box blank). `kind`
// sizes the box to the written unit (see RawProblem.tileBlanks).
export function WriteBox({ kind }: { kind: 'letter' | 'word' }) {
    return <Box kind={kind} data-testid="write-box" />;
}

// A row of word tiles: the scrambled word bank of a Sentence Building line
// (see RawProblem.tileWords). Each word prints in its own bordered tile —
// like a cut-out word card — in the SHOWN order. Accessible: the list and
// items carry real list roles (the tiles hold the words themselves; a screen
// reader must read them), while the visual boxes stay pure CSS.
const TileList = styledComponent('span', {
    display: 'inline-flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: '4px',
    verticalAlign: 'middle'
});

const WordTile = styledComponent('span', {
    display: 'inline-block',
    boxSizing: 'border-box',
    border: '2px solid var(--tile-ink)',
    borderRadius: '6px',
    padding: '1px 7px',
    margin: '0 5px',
    fontSize: '17px',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    // Tile text inherits the paper ink (--paper-ink) from PrintableSheet's
    // SheetRoot, so words stay legible on the themed paper.
    backgroundColor: 'var(--tile-bg)'
});

export function WordTileRun({ words }: { words: string[] }) {
    // Keys by index: a line can contain a repeated word (e.g. "the ... the"),
    // and the index is what the child sees (position in the shuffled bank).
    return (
        <TileList role="list" aria-label="The words to put in order" data-testid="word-tiles">
            {words.map((word, i) => (
                <WordTile role="listitem" key={i}>
                    {word}
                </WordTile>
            ))}
        </TileList>
    );
}
