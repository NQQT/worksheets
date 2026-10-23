// ─────────────────────────────────────────────────────────────────────────────
// FRAMEWORK — learning-visual pictogram library (early-years picture cues).
//
// WHY THIS EXISTS
// Years 1–3 (and Prep tracing) sheets print small PICTURE CUES next to their
// words: a child seeing "Which letter does <sun> start with?" gets the sun
// pictogram, "plural of <cat>" gets ONE cat, "singular of <cats>" gets THREE.
// Years 4–6 sheets carry NO pictograms (the generators gate the `visual` field
// on word tier ≤ 4), so their output and printed markup are unchanged.
//
// WHY INLINE SVG (and not emoji / image assets)
//   - DETERMINISTIC + OFFLINE: pure vector math, no network, no font/emoji
//     coverage differences — the same bytes on every machine.
//   - PRINT-RELIABLE: the preview canvas (PageStack) and the hidden
//     .print-doc tree (worksheet-kit's print surface) both render
//     PrintableSheet, and inline SVG is vector DOM that any browser prints
//     crisply; emoji glyphs, by contrast, differ across platforms and often
//     drop out of black-and-white print.
//   - ACCESSIBLE: each svg carries role="img" + an aria-label (no <title>
//     child on purpose — a title's text would leak into textContent and break
//     the exact row-text pins in components/EnglishDashboard.test.tsx).
//   - MONOCHROME-SAFE PALETTE: one dark-ink stroke (#3f4c63) plus a few pale
//     tint fills, so a greyscale printer keeps every shape readable.
//
// CUE-ONLY CONTRACT
// A pictogram is a LEARNING CUE, never the answer: prompt/answer strings
// never contain pictogram keys, generators attach a picture only where it
// cannot reveal the answer (a "which is a real word?" row must not show the
// real word's picture; a "pick the noun" MC row must not picture the noun),
// and answers stay pure text. The same rule is pinned by tests.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { styledComponent } from '@presource/react';

// The pictogram svg frame: fixed size, never shrinks inside a problem row.
// (styledComponent per the repo convention — no inline style objects.) The
// styledComponent's typed surface is plain HTMLAttributes (no svg
// attributes), so cast to the SVGProps surface (the PageInput pattern in
// worksheet-kit.tsx).
const PictoSvg = styledComponent('svg', {
    flexShrink: 0,
    verticalAlign: 'middle',
    // The ink colour of every cue flows from the paper token (see the palette
    // note below): the svg strokes/fills use `currentColor`, so the pictogram
    // stays legible on the themed worksheet paper (dark ink on white in light
    // mode, light ink on the dark sheet in dark mode, print-forced dark ink).
    color: 'var(--picto-ink)'
}) as unknown as React.ForwardRefExoticComponent<
    React.SVGProps<SVGSVGElement> & {
        theme?: any;
        [breakpoint: string]: any;
    }
>;

// A quantity-contrast row: up to three inline pictograms (e.g. ONE cat vs
// THREE cats on the Plurals worksheet).
const PictoRow = styledComponent('span', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    verticalAlign: 'middle'
});

// ── Palette ──────────────────────────────────────────────────────────────────
// Dark slate ink for outlines (reads well on screen AND in greyscale print);
// pale tints for fills only (a tint prints as a light grey - shapes stay
// distinguishable without colour).
//
// THEME-AWARE INK (R5): INK is `currentColor`, inherited from PictoSvg's
// `color: var(--picto-ink)` token — #3f4c63 on light paper, a light slate on
// the dark sheet, and forced back to #3f4c63 under @media print (app.css).
// SVG presentation ATTRIBUTES cannot evaluate var() directly, so the cues
// ride the CSS `color` cascade instead. SOFT/TINT are mid/pale values that
// stay legible on both papers, so they remain literal.
const INK = 'currentColor';
const SOFT = '#93a3ba'; // secondary strokes (details, motion lines)
const TINT = '#e9eef5'; // pale fill

// All art lives in a fixed 32×32 viewBox and is a static JSX fragment
// rendered inside a shared <g> that carries the stroke defaults.
type PictDef = {
    // Human name used in the aria-label ("Picture of a cat").
    label: string;
    // The shapes (coordinates in 0..32 space).
    art: React.ReactNode;
};

// ── The registry ─────────────────────────────────────────────────────────────
// Every key a generator may set on RawProblem.visual. Add a word's picture by
// adding its bank word here; a bank word with no entry simply prints without
// a cue (graceful degradation — see hasVisual).
const PICS: Record<string, PictDef> = {
    // ── Animals ──────────────────────────────────────────────────────────
    ant: {
        label: 'an ant',
        art: (
            <>
                <circle cx={7} cy={18} r={3.5} />
                <circle cx={15} cy={17} r={4} />
                <circle cx={23.5} cy={16} r={4.5} />
                <path d="M25 12 L28 8 M27 15 L31 12 M5 21 L3 24 M13 21 L12 25 M17 21 L18 25 M22 21 L21 25 M26 20 L28 24" />
                <path d="M26 12 L28 6 M28 6 L30 8" />
            </>
        ),
    },
    bird: {
        label: 'a bird',
        art: (
            <>
                <ellipse cx={15} cy={17} rx={10} ry={7} />
                <circle cx={24.5} cy={11} r={4} />
                <path d="M28.5 11 L31.5 12 L28.5 13 Z" fill={INK} />
                <circle cx={25.5} cy={10} r={0.8} fill={INK} />
                <path d="M10 17 Q15 13 20 17" />
                <path d="M12 24 L12 27 M17 24 L17 27" />
            </>
        ),
    },
    bee: {
        label: 'a bee',
        art: (
            <>
                <ellipse cx={17} cy={18} rx={9} ry={6} />
                <path d="M12 12.5 L12 23.5 M19 12.5 L19 23.5" />
                <circle cx={10} cy={9} r={4} fill={TINT} />
                <circle cx={20} cy={8} r={4} fill={TINT} />
                <path d="M6 21 L3 19" />
            </>
        ),
    },
    butterfly: {
        label: 'a butterfly',
        art: (
            <>
                <ellipse cx={9} cy={13} rx={6} ry={7} />
                <ellipse cx={23} cy={13} rx={6} ry={7} />
                <ellipse cx={10} cy={22} rx={4.5} ry={5} />
                <ellipse cx={22} cy={22} rx={4.5} ry={5} />
                <path d="M16 10 L16 26" strokeWidth={3} />
                <path d="M15 8 L12 4 M17 8 L20 4" />
            </>
        ),
    },
    cat: {
        label: 'a cat',
        art: (
            <>
                <path d="M8 12 L6 4 L13 8 Z" />
                <path d="M24 12 L26 4 L19 8 Z" />
                <circle cx={16} cy={18} r={9} />
                <path d="M6 17 L11 18 M6 21 L11 20 M26 17 L21 18 M26 21 L21 20" strokeWidth={1.2} />
                <path d="M12 16 L14 16 M18 16 L20 16" strokeWidth={1.4} />
                <path d="M14.5 20 L17.5 20" strokeWidth={1.4} />
            </>
        ),
    },
    cow: {
        label: 'a cow',
        art: (
            <>
                <circle cx={16} cy={18} r={9.5} />
                <path d="M8 10 L4 5 M24 10 L28 5" />
                <ellipse cx={16} cy={23} rx={6} ry={3.5} fill={TINT} />
                <circle cx={13} cy={23} r={0.8} fill={INK} />
                <circle cx={19} cy={23} r={0.8} fill={INK} />
                <path d="M10 15 Q12 13 14 15 M18 15 Q20 13 22 15" strokeWidth={1.4} />
            </>
        ),
    },
    dog: {
        label: 'a dog',
        art: (
            <>
                <path d="M7 8 Q3 14 8 16 L10 10 Z" fill={TINT} />
                <path d="M25 8 Q29 14 24 16 L22 10 Z" fill={TINT} />
                <circle cx={16} cy={17} r={9} />
                <ellipse cx={16} cy={21} rx={2.5} ry={1.8} fill={INK} />
                <path d="M13 15 L15 15 M17 15 L19 15" strokeWidth={1.4} />
                <path d="M16 22.8 L16 25 M14 25 L18 25" strokeWidth={1.2} />
            </>
        ),
    },
    duck: {
        label: 'a duck',
        art: (
            <>
                <ellipse cx={15} cy={20} rx={10} ry={7} />
                <circle cx={24} cy={10} r={4.5} />
                <path d="M28.5 9 L32 10.5 L28.5 12 Z" fill={INK} />
                <circle cx={25} cy={8.8} r={0.8} fill={INK} />
            </>
        ),
    },
    elephant: {
        label: 'an elephant',
        art: (
            <>
                <circle cx={15} cy={16} r={10} />
                <path d="M24 12 Q30 16 28 24 Q27 27 24 27" />
                <path d="M8 9 Q14 4 20 9 L19 12 Q13 8 9 12 Z" fill={TINT} />
                <circle cx={14} cy={14} r={0.9} fill={INK} />
                <path d="M11 20 L14 20" strokeWidth={1.4} />
            </>
        ),
    },
    fish: {
        label: 'a fish',
        art: (
            <>
                <ellipse cx={14} cy={16} rx={9} ry={6.5} />
                <path d="M23 16 L30 11 L30 21 Z" />
                <circle cx={10} cy={14} r={0.9} fill={INK} />
                <path d="M16 10 Q18 16 16 22" strokeWidth={1.4} />
            </>
        ),
    },
    frog: {
        label: 'a frog',
        art: (
            <>
                <circle cx={9.5} cy={10} r={3} />
                <circle cx={22.5} cy={10} r={3} />
                <circle cx={9.5} cy={9.4} r={0.8} fill={INK} />
                <circle cx={22.5} cy={9.4} r={0.8} fill={INK} />
                <path d="M5 20 Q16 9 27 20 Q16 27 5 20 Z" />
                <path d="M6 21 Q3 24 5 27 M26 21 Q29 24 27 27" />
                <path d="M12 19 Q16 21 20 19" strokeWidth={1.4} />
            </>
        ),
    },
    horse: {
        label: 'a horse',
        art: (
            <>
                <path d="M10 28 L10 18 Q10 8 18 6 L24 4 L24 10 Q24 14 26 16 L26 28" />
                <path d="M18 6 L12 8" />
                <circle cx={21} cy={9} r={0.8} fill={INK} />
                <path d="M10 24 L14 24 M22 24 L26 24" strokeWidth={1.4} />
            </>
        ),
    },
    kangaroo: {
        label: 'a kangaroo',
        art: (
            <>
                <path d="M12 26 Q9 18 12 12 Q14 8 18 8 L18 4 L21 6 L24 4 L24 9 Q28 11 27 17 Q26 24 20 26 Z" />
                <circle cx={20} cy={11} r={0.8} fill={INK} />
                <path d="M27 20 Q31 22 29 26" />
            </>
        ),
    },
    koala: {
        label: 'a koala',
        art: (
            <>
                <circle cx={7} cy={9} r={4} fill={TINT} />
                <circle cx={25} cy={9} r={4} fill={TINT} />
                <circle cx={16} cy={18} r={9} />
                <ellipse cx={16} cy={17} rx={3} ry={2.2} fill={INK} />
                <path d="M12 21 L14 21 M18 21 L20 21" strokeWidth={1.4} />
            </>
        ),
    },
    lion: {
        label: 'a lion',
        art: (
            <>
                <circle cx={16} cy={17} r={10} strokeDasharray="3 2.4" />
                <circle cx={16} cy={18} r={6.5} />
                <path d="M13 16 L15 16 M17 16 L19 16" strokeWidth={1.4} />
                <path d="M14.5 20 L17.5 20" strokeWidth={1.4} />
            </>
        ),
    },
    monkey: {
        label: 'a monkey',
        art: (
            <>
                <circle cx={16} cy={16} r={10} />
                <ellipse cx={16} cy={19} rx={6} ry={5} fill={TINT} />
                <circle cx={12.5} cy={14} r={0.9} fill={INK} />
                <circle cx={19.5} cy={14} r={0.9} fill={INK} />
                <path d="M13 20 Q16 22 19 20" strokeWidth={1.4} />
            </>
        ),
    },
    mouse: {
        label: 'a mouse',
        art: (
            <>
                <circle cx={9} cy={11} r={4} />
                <circle cx={23} cy={11} r={4} />
                <circle cx={16} cy={18} r={8} />
                <circle cx={13} cy={16} r={0.8} fill={INK} />
                <circle cx={19} cy={16} r={0.8} fill={INK} />
                <circle cx={16} cy={19.5} r={1} fill={INK} />
                <path d="M17 20 Q22 24 28 22" />
            </>
        ),
    },
    pig: {
        label: 'a pig',
        art: (
            <>
                <path d="M8 11 L6 3 L13 8 Z" />
                <path d="M24 11 L26 3 L19 8 Z" />
                <circle cx={16} cy={18} r={9.5} />
                <ellipse cx={16} cy={20} rx={4.5} ry={3} fill={TINT} />
                <circle cx={14} cy={19.5} r={0.8} fill={INK} />
                <circle cx={18} cy={19.5} r={0.8} fill={INK} />
                <circle cx={10.5} cy={14} r={0.8} fill={INK} />
                <circle cx={21.5} cy={14} r={0.8} fill={INK} />
            </>
        ),
    },
    rabbit: {
        label: 'a rabbit',
        art: (
            <>
                <ellipse cx={10} cy={6} rx={3} ry={6} />
                <ellipse cx={22} cy={6} rx={3} ry={6} />
                <circle cx={16} cy={19} r={9} />
                <circle cx={13} cy={17} r={0.9} fill={INK} />
                <circle cx={19} cy={17} r={0.9} fill={INK} />
                <path d="M14 21.5 L18 21.5" strokeWidth={1.4} />
            </>
        ),
    },
    rat: {
        label: 'a rat',
        art: (
            <>
                <ellipse cx={13} cy={19} rx={9} ry={6} />
                <circle cx={24} cy={14} r={4} />
                <circle cx={25.5} cy={12} r={0.8} fill={INK} />
                <path d="M4 21 Q0 24 3 26" />
                <circle cx={21} cy={16.5} r={0.9} fill={INK} />
            </>
        ),
    },
    sheep: {
        label: 'a sheep',
        art: (
            <>
                <circle cx={11} cy={14} r={5} />
                <circle cx={18} cy={11} r={5.5} />
                <circle cx={25} cy={14} r={5} />
                <circle cx={14} cy={19} r={5} />
                <circle cx={22} cy={18} r={5.5} />
                <circle cx={8} cy={21} r={4.5} />
                <ellipse cx={27} cy={22} rx={3.5} ry={2.5} fill={INK} />
                <path d="M10 26 L10 29 M20 27 L20 30" />
            </>
        ),
    },
    snake: {
        label: 'a snake',
        art: (
            <>
                <path d="M6 26 Q10 20 15 22 Q21 25 16 17 Q12 11 19 8 Q26 6 27 12" />
                <circle cx={27} cy={13} r={3} />
                <circle cx={28} cy={12} r={0.7} fill={INK} />
                <path d="M30 15 L32 16 M29 16.5 L31 18" strokeWidth={1.2} />
            </>
        ),
    },
    spider: {
        label: 'a spider',
        art: (
            <>
                <circle cx={16} cy={18} r={5} />
                <path d="M12 14 L6 8 M16 13 L16 4 M20 14 L26 8 M11 18 L3 16 M11 21 L4 26 M21 18 L29 16 M21 21 L28 26" />
                <circle cx={14.5} cy={17} r={0.7} fill={INK} />
                <circle cx={17.5} cy={17} r={0.7} fill={INK} />
            </>
        ),
    },
    tiger: {
        label: 'a tiger',
        art: (
            <>
                <circle cx={16} cy={18} r={9.5} />
                <path d="M9 10 Q16 4 23 10" />
                <circle cx={7.5} cy={13} r={3} fill={TINT} />
                <circle cx={24.5} cy={13} r={3} fill={TINT} />
                <path d="M12 10 L12 13 M16 9 L16 13 M20 10 L20 13" strokeWidth={1.4} />
                <circle cx={13} cy={16} r={0.9} fill={INK} />
                <circle cx={19} cy={16} r={0.9} fill={INK} />
                <path d="M14 20 L18 20" strokeWidth={1.4} />
            </>
        ),
    },
    snail: {
        label: 'a snail',
        art: (
            <>
                <circle cx={16} cy={15} r={6} />
                <path d="M16 15 Q19 15 18.5 12.5 Q18 11 16.5 11.5" strokeWidth={1.4} />
                <path d="M7 22 Q6 27 16 27 L26 27 Q30 27 29 23 Q27 21 24 21 L9 22 Z" fill={TINT} />
                <path d="M26 20 L28 12 M28 12 L30 13 M28 12 L26.5 11" />
                <circle cx={30} cy={13} r={0.7} fill={INK} />
                <circle cx={26.5} cy={11} r={0.7} fill={INK} />
            </>
        ),
    },

    // ── Foods ────────────────────────────────────────────────────────────
    apple: {
        label: 'an apple',
        art: (
            <>
                <path d="M16 11 Q16 7 19 6" strokeWidth={1.6} />
                <path d="M17 8 Q22 5 24 8 Q21 10 17 8 Z" fill={TINT} />
                <path d="M10 14 Q8 17 9 21 Q10 27 15 27 Q16 26 16 26 Q16 26 17 27 Q22 27 23 21 Q24 17 22 14 Q19 11 16 13 Q13 11 10 14 Z" fill={TINT} />
            </>
        ),
    },
    banana: {
        label: 'a banana',
        art: (
            <>
                <path d="M7 8 Q6 22 17 26 Q26 28 29 22 Q30 12 22 8 Q19 7 7 8 Z" fill={TINT} />
                <path d="M7 8 L5 5 M29 22 L31 24" />
            </>
        ),
    },
    cake: {
        label: 'a cake',
        art: (
            <>
                <rect x={5} y={14} width={22} height={13} rx={2} />
                <path d="M9 14 Q10 9 11 14 M15 14 Q16 9 17 14 M21 14 Q22 9 23 14" />
                <circle cx={16} cy={7} r={2} fill={INK} />
                <path d="M16 9 L16 14" />
            </>
        ),
    },
    bread: {
        label: 'bread',
        art: (
            <>
                <path d="M6 18 Q5 12 12 11 Q16 8 20 11 Q27 12 26 18 L26 25 L6 25 Z" fill={TINT} />
                <path d="M12 13 L11 19 M18 12 L17 18" strokeWidth={1.2} />
            </>
        ),
    },
    cookie: {
        label: 'a cookie',
        art: (
            <>
                <circle cx={16} cy={16} r={10} />
                <circle cx={12} cy={13} r={1} fill={INK} />
                <circle cx={19} cy={11} r={1} fill={INK} />
                <circle cx={14} cy={19} r={1} fill={INK} />
                <circle cx={20} cy={18} r={1} fill={INK} />
            </>
        ),
    },
    honey: {
        label: 'a honey jar',
        art: (
            <>
                <rect x={9} y={8} width={14} height={4} rx={1} />
                <path d="M10 12 Q8 15 8 19 Q8 27 16 27 Q24 27 24 19 Q24 15 22 12 Z" fill={TINT} />
                <path d="M12 18 L20 18" strokeWidth={1.4} />
            </>
        ),
    },
    lemon: {
        label: 'a lemon',
        art: (
            <>
                <ellipse cx={16} cy={17} rx={10} ry={7.5} />
                <path d="M6 17 L3 16 M26 17 L29 16" />
                <path d="M16 10 Q16 7 18 6" strokeWidth={1.4} />
            </>
        ),
    },
    orange: {
        label: 'an orange',
        art: (
            <>
                <circle cx={16} cy={17} r={10} />
                <circle cx={16} cy={17} r={7} strokeDasharray="2.5 2.5" strokeWidth={1.2} />
                <path d="M16 7 Q16 4 19 3" strokeWidth={1.6} />
                <path d="M17 5 Q23 2 26 6 Q21 8 17 5 Z" fill={TINT} />
            </>
        ),
    },

    // ── Objects, places & nature ────────────────────────────────────────
    bag: {
        label: 'a bag',
        art: (
            <>
                <rect x={7} y={11} width={18} height={16} rx={2} fill={TINT} />
                <path d="M11 11 Q11 4 16 4 Q21 4 21 11" />
                <path d="M12 17 L20 17" strokeWidth={1.4} />
            </>
        ),
    },
    ball: {
        label: 'a ball',
        art: (
            <>
                <circle cx={16} cy={17} r={10} />
                <path d="M7 13 Q16 18 25 13 M6.5 21 Q16 16 25.5 21" strokeWidth={1.4} />
            </>
        ),
    },
    bed: {
        label: 'a bed',
        art: (
            <>
                <path d="M5 13 L5 26 L27 26 L27 13" />
                <rect x={8} y={15} width={8} height={4} rx={1.5} fill={TINT} />
                <path d="M8 19 L24 19" />
                <path d="M7 26 L7 28 M25 26 L25 28" />
            </>
        ),
    },
    boat: {
        label: 'a boat',
        art: (
            <>
                <path d="M5 20 L27 20 L24 26 L8 26 Z" />
                <path d="M16 20 L16 5" />
                <path d="M16 6 Q24 12 16 20 Z" fill={TINT} />
            </>
        ),
    },
    box: {
        label: 'a box',
        art: (
            <>
                <path d="M6 12 L16 7 L26 12 L26 24 L16 29 L6 24 Z" />
                <path d="M6 12 L16 17 L26 12 M16 17 L16 29" />
            </>
        ),
    },
    bus: {
        label: 'a bus',
        art: (
            <>
                <rect x={4} y={8} width={24} height={15} rx={3} />
                <rect x={8} y={12} width={5} height={4} fill={TINT} />
                <rect x={19} y={12} width={5} height={4} fill={TINT} />
                <circle cx={10} cy={25} r={3} />
                <circle cx={22} cy={25} r={3} />
            </>
        ),
    },
    chair: {
        label: 'a chair',
        art: (
            <>
                <path d="M10 4 L10 18" stroke={SOFT} />
                <path d="M8 18 L22 18" strokeWidth={2.4} />
                <path d="M9 18 L9 27 M23 18 L23 27" />
                <path d="M10 4 L10 12 L14 12" />
            </>
        ),
    },
    clock: {
        label: 'a clock',
        art: (
            <>
                <circle cx={16} cy={17} r={10} />
                <path d="M16 17 L16 9 M16 17 L22 17" />
                <path d="M16 5 L16 4 M28 17 L29 17" strokeWidth={1.6} />
            </>
        ),
    },
    cloud: {
        label: 'a cloud',
        art: (
            <>
                <path d="M9 22 Q4 22 4 17.5 Q4 13 8.5 12.8 Q9 7 15 7 Q20 7 21.5 11 Q27 11 27 17 Q27 22 22 22 Z" fill={TINT} />
            </>
        ),
    },
    cup: {
        label: 'a cup',
        art: (
            <>
                <path d="M8 9 L10 25 Q10 27 12 27 L20 27 Q22 27 22 25 L24 9 Z" fill={TINT} />
                <path d="M24 12 Q29 13 27 18 Q25 21 23 19" />
            </>
        ),
    },
    door: {
        label: 'a door',
        art: (
            <>
                <rect x={9} y={4} width={14} height={24} rx={1} />
                <circle cx={20} cy={17} r={1} fill={INK} />
                <path d="M5 28 L27 28" />
            </>
        ),
    },
    fan: {
        label: 'a fan',
        art: (
            <>
                <path d="M16 26 L16 14" strokeWidth={2.4} />
                <path d="M16 14 L5 7 Q5 14 10 16 L16 14 Z" fill={TINT} />
                <path d="M16 14 L27 7 Q27 14 22 16 L16 14 Z" fill={TINT} />
            </>
        ),
    },
    flower: {
        label: 'a flower',
        art: (
            <>
                <circle cx={16} cy={14} r={3.5} fill={TINT} />
                <circle cx={16} cy={6} r={4} />
                <circle cx={24} cy={12} r={4} />
                <circle cx={21} cy={21} r={4} />
                <circle cx={11} cy={21} r={4} />
                <circle cx={8} cy={12} r={4} />
                <path d="M16 25 L16 31" />
            </>
        ),
    },
    hat: {
        label: 'a hat',
        art: (
            <>
                <path d="M7 19 Q7 8 16 8 Q25 8 25 19 Z" fill={TINT} />
                <path d="M4 19 L28 19" strokeWidth={2.6} />
                <path d="M14 8 L14 12 M18 8 L18 12" strokeWidth={1.2} />
            </>
        ),
    },
    house: {
        label: 'a house',
        art: (
            <>
                <path d="M6 14 L16 5 L26 14" />
                <rect x={8} y={14} width={16} height={14} fill={TINT} />
                <rect x={13} y={19} width={6} height={9} />
            </>
        ),
    },
    key: {
        label: 'a key',
        art: (
            <>
                <circle cx={9} cy={16} r={4.5} />
                <path d="M13 16 L27 16 M23 16 L23 21 M27 16 L27 20" />
            </>
        ),
    },
    light: {
        label: 'a light bulb',
        art: (
            <>
                <circle cx={16} cy={13} r={7.5} fill={TINT} />
                <path d="M12 21 L20 21 L19 26 L13 26 Z" />
                <path d="M16 3 L16 5 M7 9 L5.5 7.5 M25 9 L26.5 7.5" />
            </>
        ),
    },
    map: {
        label: 'a map',
        art: (
            <>
                <path d="M4 9 L12 6 L20 9 L28 6 L28 25 L20 28 L12 25 L4 28 Z" fill={TINT} />
                <path d="M12 6 L12 25 M20 9 L20 28" />
                <path d="M6 15 L10 14 M22 14 L26 13" strokeWidth={1.2} stroke={SOFT} />
            </>
        ),
    },
    moon: {
        label: 'the moon',
        art: (
            <>
                <path d="M19 4 Q11 6 10 15 Q9 25 18 28 Q13 24 14 16 Q14 8 22 6 Z" fill={TINT} />
            </>
        ),
    },
    net: {
        label: 'a net',
        art: (
            <>
                <circle cx={16} cy={13} r={9} />
                <path d="M16 22 L16 30" />
                <path d="M8 9 L24 9 M6 13 L26 13 M8 17 L24 17 M12 5 L12 21 M20 5 L20 21 M3 13 L29 13" strokeWidth={1} stroke={SOFT} />
            </>
        ),
    },
    night: {
        label: 'the night',
        art: (
            <>
                <path d="M20 6 Q12 8 11.5 16 Q11 26 19 28 Q15 24 15.5 16 Q16 9 23 7.5 Z" fill={TINT} />
                <path d="M26 12 L26 18 M23 15 L29 15" strokeWidth={1.4} />
                <circle cx={27} cy={22} r={0.9} fill={INK} />
            </>
        ),
    },
    pencil: {
        label: 'a pencil',
        art: (
            <>
                <path d="M8 24 L22 10 L26 14 L12 28 L7 28 Z" />
                <path d="M22 10 L26 14 L24 12 Z" fill={INK} />
                <path d="M5.5 26 L4 29.5 L8 28.5 Z" strokeLinecap="round" />
            </>
        ),
    },
    pen: {
        label: 'a pen',
        art: (
            <>
                <path d="M7 25 L20 6 L26 10 L13 27 L6 27 Z" />
                <path d="M20 6 L26 10" strokeWidth={1.2} />
                <path d="M6 27 L4 29 L7 28" fill={INK} />
            </>
        ),
    },
    plane: {
        label: 'an aeroplane',
        art: (
            <>
                <path d="M4 16 L26 10 L27 14 L6 19 Z" fill={TINT} />
                <path d="M14 14 L11 5 L15 5 L18 13 Z" />
                <path d="M13 19 L11 26 L15 26 L17 19 Z" />
                <path d="M26 10 L30 8 L29 13 Z" />
            </>
        ),
    },
    pot: {
        label: 'a pot',
        art: (
            <>
                <path d="M8 12 Q8 27 16 27 Q24 27 24 12 Z" fill={TINT} />
                <path d="M6 12 L26 12" strokeWidth={2.4} />
                <circle cx={16} cy={8} r={2} />
            </>
        ),
    },
    rain: {
        label: 'rain',
        art: (
            <>
                <path d="M9 15 Q4.5 15 4.5 11.5 Q4.5 7.5 8.5 7.5 Q9 3 14.5 3 Q19.5 3 21 6.5 Q26 6.5 26 11.5 Q26 15 22 15 Z" fill={TINT} />
                <path d="M9 19 L7.5 23 M16 19 L14.5 24 M23 19 L21.5 23" stroke={SOFT} />
            </>
        ),
    },
    river: {
        label: 'a river',
        art: (
            <>
                <path d="M5 10 Q11 8 16 10 Q21 12 27 10" />
                <path d="M5 16 Q11 14 16 16 Q21 18 27 16" stroke={SOFT} />
                <path d="M5 22 Q11 20 16 22 Q21 24 27 22" stroke={SOFT} />
            </>
        ),
    },
    snow: {
        label: 'snow',
        art: (
            <>
                <path d="M16 4 L16 28 M6 9 L26 23 M26 9 L6 23" />
                <path d="M16 7 L13 5 M16 7 L19 5 M16 25 L13 27 M16 25 L19 27" strokeWidth={1.2} />
            </>
        ),
    },
    star: {
        label: 'a star',
        art: (
            <path
                d="M16 3 L19.6 12.2 L29 12.8 L21.6 18.8 L24 28 L16 23 L8 28 L10.4 18.8 L3 12.8 L12.4 12.2 Z"
                fill={TINT}
            />
        ),
    },
    sun: {
        label: 'the sun',
        art: (
            <>
                <circle cx={16} cy={16} r={7} fill={TINT} />
                <path d="M16 3 L16 6 M16 26 L16 29 M3 16 L6 16 M26 16 L29 16 M6.8 6.8 L8.9 8.9 M23.1 23.1 L25.2 25.2 M25.2 6.8 L23.1 8.9 M8.9 23.1 L6.8 25.2" />
            </>
        ),
    },
    top: {
        label: 'a spinning top',
        art: (
            <>
                <path d="M10 12 Q16 6 22 12 L20 22 Q16 25 12 22 Z" fill={TINT} />
                <path d="M16 25 L16 29" strokeWidth={2.2} />
                <path d="M22 12 Q27 14 26 18" stroke={SOFT} strokeWidth={1.2} />
            </>
        ),
    },
    train: {
        label: 'a train',
        art: (
            <>
                <rect x={5} y={8} width={20} height={14} rx={2} fill={TINT} />
                <path d="M25 12 L28 16 L28 22 L25 22 Z" />
                <rect x={9} y={12} width={5} height={5} />
                <circle cx={10} cy={25} r={2.6} />
                <circle cx={20} cy={25} r={2.6} />
            </>
        ),
    },
    tree: {
        label: 'a tree',
        art: (
            <>
                <circle cx={16} cy={11} r={7} fill={TINT} />
                <circle cx={9} cy={15} r={5} fill={TINT} />
                <circle cx={23} cy={15} r={5} fill={TINT} />
                <path d="M16 20 L16 30 M16 24 L12 21 M16 24 L20 21" />
            </>
        ),
    },
    umbrella: {
        label: 'an umbrella',
        art: (
            <>
                <path d="M5 14 Q16 3 27 14 Q23 11 20.5 14 Q18 11 16 14 Q14 11 11.5 14 Q9 11 5 14 Z" />
                <path d="M16 14 L16 24 Q16 27 13 27" />
            </>
        ),
    },
    water: {
        label: 'water',
        art: (
            <>
                <path d="M10 6 L9 24 Q9 28 13 28 L19 28 Q23 28 23 24 L22 6 Z" fill={TINT} />
                <path d="M10.5 14 L21.5 14" stroke={SOFT} />
                <path d="M27 12 Q29 16 27 18 Q25 16 27 12 Z" />
            </>
        ),
    },
    window: {
        label: 'a window',
        art: (
            <>
                <rect x={6} y={5} width={20} height={22} rx={1} />
                <path d="M16 5 L16 27 M6 16 L26 16" />
            </>
        ),
    },
    watch: {
        label: 'a watch',
        art: (
            <>
                <rect x={11} y={2} width={10} height={6} rx={1} />
                <rect x={11} y={24} width={10} height={6} rx={1} />
                <circle cx={16} cy={16} r={8} />
                <path d="M16 16 L16 11 M16 16 L20 16" />
            </>
        ),
    },
    school: {
        label: 'a school',
        art: (
            <>
                <rect x={5} y={13} width={22} height={15} fill={TINT} />
                <path d="M5 13 L16 5 L27 13" />
                <rect x={13} y={19} width={6} height={9} />
                <path d="M24 5 L24 1 M24 1 L29 2.5 L24 4" />
                <path d="M8 16 L11 16 M21 16 L24 16" stroke={SOFT} />
            </>
        ),
    },

    // ── Conceptual scaffolds (opposites, grammar, quantities) ─────────
    fire: {
        label: 'a fire',
        art: (
            <>
                <path d="M16 4 Q20 10 19 14 Q24 12 25 18 Q25 27 16 28 Q7 27 7 18 Q7 11 12 9 Q12 13 15 13 Q14 8 16 4 Z" />
                <path d="M16 27 Q12 26 12 21 Q12 18 14 16 Q14 19 16 19 Q15 15 17 13 Q18 17 17 20 Q19 19 19 22 Q19 26 16 27 Z" fill={TINT} />
            </>
        ),
    },
    ice: {
        label: 'ice',
        art: (
            <>
                <path d="M8 11 L16 6 L24 11 L24 21 L16 26 L8 21 Z" fill={TINT} />
                <path d="M8 11 L16 16 L24 11 M16 16 L16 26" stroke={SOFT} />
            </>
        ),
    },
    feather: {
        label: 'a feather',
        art: (
            <>
                <path d="M27 5 Q15 7 9 17 Q6 22 6 27 Q11 27 16 24 Q26 18 27 5 Z" fill={TINT} />
                <path d="M6 27 L20 13" stroke={SOFT} />
            </>
        ),
    },
    weight: {
        label: 'a weight',
        art: (
            <>
                <rect x={4} y={12} width={5} height={10} rx={1} fill={TINT} />
                <rect x={23} y={12} width={5} height={10} rx={1} fill={TINT} />
                <path d="M9 16 L23 16 M9 18 L23 18" stroke={SOFT} />
                <circle cx={16} cy={12} r={2.5} />
            </>
        ),
    },
    bolt: {
        label: 'a lightning bolt',
        art: <path d="M18 3 L9 17 L15 17 L13 29 L23 14 L17 14 Z" fill={TINT} />,
    },
    smile: {
        label: 'a happy face',
        art: (
            <>
                <circle cx={16} cy={16} r={10} />
                <path d="M11 18 Q16 23 21 18" />
                <circle cx={12.5} cy={13} r={1} fill={INK} />
                <circle cx={19.5} cy={13} r={1} fill={INK} />
            </>
        ),
    },
    cry: {
        label: 'a sad face',
        art: (
            <>
                <circle cx={16} cy={15} r={10} />
                <path d="M11 20 Q16 16 21 20" />
                <circle cx={12.5} cy={12} r={1} fill={INK} />
                <circle cx={19.5} cy={12} r={1} fill={INK} />
                <path d="M24 17 Q27 22 24 25 Q21 22 24 17 Z" fill={TINT} />
            </>
        ),
    },
    sparkle: {
        label: 'sparkles',
        art: (
            <>
                <path d="M14 6 L16 13 L23 15 L16 17 L14 24 L12 17 L5 15 L12 13 Z" fill={TINT} />
                <path d="M24 21 L25 24 L28 25 L25 26 L24 29 L23 26 L20 25 L23 24 Z" />
            </>
        ),
    },
    action: {
        label: 'an action',
        art: (
            <>
                <path d="M4 10 L14 10 M2 16 L14 16 M4 22 L14 22" stroke={SOFT} />
                <path d="M14 16 L28 16 M28 16 L23 11 M28 16 L23 21" />
            </>
        ),
    },
    zzz: {
        label: 'quiet',
        art: (
            <>
                <path d="M10 6 L18 6 L10 14 L18 14" />
                <path d="M15 16 L22 16 L15 23 L22 23" stroke={SOFT} />
                <path d="M20 25 L25 25 L20 30 L25 30" stroke={SOFT} strokeWidth={1.4} />
            </>
        ),
    },
    speaker: {
        label: 'loud sound',
        art: (
            <>
                <rect x={5} y={11} width={8} height={10} rx={1} />
                <path d="M13 13 L20 8 L20 24 L13 19 Z" fill={TINT} />
                <path d="M23 12 Q27 16 23 20 M26 9 Q31 16 26 23" stroke={SOFT} />
            </>
        ),
    },
    drop: {
        label: 'a water drop',
        art: <path d="M16 4 Q24 15 24 21 Q24 28 16 28 Q8 28 8 21 Q8 15 16 4 Z" fill={TINT} />,
    },
    cupFull: {
        label: 'a full cup',
        art: (
            <>
                <path d="M8 9 L10 25 Q10 27 12 27 L20 27 Q22 27 22 25 L24 9 Z" />
                <path d="M9.5 12 L22.5 12" stroke={SOFT} />
                <path d="M24 12 Q29 13 27 18 Q25 21 23 19" />
            </>
        ),
    },
    cupEmpty: {
        label: 'an empty cup',
        art: (
            <>
                <path d="M8 9 L10 25 Q10 27 12 27 L20 27 Q22 27 22 25 L24 9 Z" />
                <path d="M8 9 L24 9" stroke={SOFT} />
                <path d="M24 12 Q29 13 27 18 Q25 21 23 19" />
            </>
        ),
    },
    trophy: {
        label: 'a trophy',
        art: (
            <>
                <path d="M10 6 L22 6 L22 13 Q22 19 16 19 Q10 19 10 13 Z" fill={TINT} />
                <path d="M10 7 Q5 7 5 11 Q5 15 10 15 M22 7 Q27 7 27 11 Q27 15 22 15" />
                <path d="M16 19 L16 23 M11 27 L21 27 M13 23 L19 23" />
            </>
        ),
    },
    arrowUp: {
        label: 'up',
        art: (
            <>
                <path d="M16 27 L16 6 M16 6 L9 13 M16 6 L23 13" />
            </>
        ),
    },
    arrowDown: {
        label: 'down',
        art: (
            <>
                <path d="M16 5 L16 26 M16 26 L9 19 M16 26 L23 19" />
            </>
        ),
    },
    barLong: {
        label: 'long',
        art: (
            <>
                <path d="M3 16 L29 16" strokeWidth={4} />
            </>
        ),
    },
    barShort: {
        label: 'short',
        art: (
            <>
                <path d="M11 16 L21 16" strokeWidth={4} />
            </>
        ),
    },
    xmark: {
        label: 'a cross mark',
        art: (
            <>
                <path d="M8 8 L24 24 M24 8 L8 24" />
            </>
        ),
    },

    // ── Colour swatches (red / green / purple words) ───────────────────
    red: {
        label: 'the colour red',
        art: (
            <rect x={7} y={7} width={18} height={18} rx={4} fill="#d95757" stroke="#a83f3f" />
        ),
    },
    green: {
        label: 'the colour green',
        art: (
            <rect x={7} y={7} width={18} height={18} rx={4} fill="#6f9e6b" stroke="#4c7a48" />
        ),
    },
    purple: {
        label: 'the colour purple',
        art: (
            <rect x={7} y={7} width={18} height={18} rx={4} fill="#8e7bb5" stroke="#6a5892" />
        ),
    },
};

// ── Public API ───────────────────────────────────────────────────────────────

// Does a pictogram exist for this key? Generators use this to decide whether
// a problem may carry a cue (bank words without an entry print plain).
export function hasVisual(key: string | undefined): boolean {
    return !!key && Object.prototype.hasOwnProperty.call(PICS, key);
}

// Accessible name for a pictogram key ("a cat") — used in aria-labels.
export function visualLabel(key: string): string {
    return PICS[key]?.label ?? key;
}

// Every registered key, in registry order (tests pin the inventory).
export function visualKeys(): string[] {
    return Object.keys(PICS);
}

export type PictogramProps = {
    // A PICS key (see the registry above). Unknown keys render nothing.
    icon: string;
    // Pixel size of the square svg (26px fits the 20px sheet typeface).
    size?: number;
    // Announce to screen readers (default true). Pass false for purely
    // decorative repeats.
    announce?: boolean;
};

// A single pictogram: inline SVG (deterministic, offline, print-safe). The
// svg carries role="img" + aria-label — and NO <title> child, because a
// title's text would leak into textContent and break the exact row-text pins
// in components/EnglishDashboard.test.tsx.
export function Pictogram({ icon, size = 26, announce = true }: PictogramProps) {
    const def = PICS[icon];
    if (!def) return null; // unknown key => no cue (graceful degradation)
    return (
        <PictoSvg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            role={announce ? 'img' : undefined}
            aria-label={announce ? `Picture of ${def.label}` : undefined}
            aria-hidden={announce ? undefined : 'true'}
        >
            <g stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round">
                {def.art}
            </g>
        </PictoSvg>
    );
}

// A row of up-to-three pictograms (quantity contrast for plural/singular
// questions: ONE cat vs THREE cats). Extra copies are slightly smaller so a
// page row stays one line tall.
//
// WRITABLE SCALE (`size`): an explicit px size renders EVERY copy at that
// size — the tracing sheets pass a large size so the picture cue matches the
// 64px trace target it scaffolds (a 26px cue beside a 17mm word is a
// footnote, not a learning picture). Omitted => the compact one-line ladder
// below, byte-identical to the legacy markup for every normal row.
//
// ACCESSIBLE QUANTITY: the row is ONE conceptual image, so the WRAPPER
// announces the whole quantity ("Picture of a cat, 3 copies") and the
// individual svgs are aria-hidden. Announcing only the first copy (the old
// behaviour) meant assistive tech could not tell ONE cat from THREE — the
// very distinction the quantity contrast exists to teach.
export function PictogramRow({
    icon,
    count = 1,
    size
}: {
    icon: string;
    count?: number;
    // Uniform copy size in px (writable-scale rows); default = the ladder.
    size?: number;
}) {
    if (!hasVisual(icon)) return null;
    // Cap at 3 copies — a printing row has no room for more, and the
    // generators only ever ask for 1 or 3.
    const n = Math.max(1, Math.min(3, Math.floor(count)));
    // Explicit size => every copy at that px size; otherwise the compact
    // quantity-contrast ladder (pinned by visuals.test.tsx).
    const sizes = size !== undefined
        ? Array.from<number>({ length: n }).fill(size)
        : n === 3 ? [18, 22, 18] : n === 2 ? [20, 20] : [26];
    const name = visualLabel(icon);
    const quantity = n === 1 ? `Picture of ${name}` : `Picture of ${name}, ${n} copies`;
    return (
        <PictoRow role="img" aria-label={quantity} data-testid="pictogram-row">
            {sizes.map((s, i) => (
                <Pictogram key={i} icon={icon} size={s} announce={false} />
            ))}
        </PictoRow>
    );
}
