// Printable A4 worksheet page (framework layout component). This is the
// canonical "what gets printed" content — the UNION of the maths and english
// source sheets.
//
// It is rendered in TWO on-screen-identical places plus the hidden print
// tree:
//   1. Inline, scaled-down preview in the right-hand canvas (PageStack) —
//      this view doubles as the print preview (toolbar Print goes straight
//      to the browser-native dialog).
//   2. Inside the screen-hidden `.print-doc` tree that window.print()
//      actually prints (one <PrintableSheet> per A4 page, see worksheet-kit),
//      which is what makes the native dialog list every page (a 5-page
//      document => 5 pages in the dialog).
//
// The component receives one page's `problems` (problem ids are numbered
// across the whole document). When the document has more than one page,
// `pageLabel` (e.g. "Page 2 of 3") is shown in a small footer — both on
// screen (as the page badge) and in print.
//
// The sheet paints through the PAPER TOKENS (CSS custom properties declared
// in src/app.css): on screen the paper adapts to the Light/Dark theme (dark
// sheet + light ink in dark mode, so the preview is readable like the rest of
// the UI), and @media print FORCES the tokens back to white paper + near-black
// ink (`#1a1a1a` family) regardless of the theme — printed sheets stay
// colour-neutral for any printer (see app.css print colour-safety block).
// All CSS uses explicit px/mm STRING values (not numbers) on purpose: when a
// value is static or a function in @presource/react's styledComponent, numbers
// are converted to rem, which we do not want for print-accurate spacing.
//
// PROBLEM LAYOUT: a normal row is `<index> [picture cue?] [clock figure?]
// <prompt text with write-box/underlined blanks>` + optional payload after
// the prompt (word tiles, family figure diagrams, bottom writing line); a
// TRACING row (Problem.trace set — letter/word/number sheets) is
// `<index> [picture cue?] [model] [dashed copies on a dashed rule]` instead
// of prompt text: the model exemplar is solid grey, the three (or one, for
// words) faded dashed shapes are what the child traces, sharing one writing
// line.
//
// PICTURE CUES (Problem.visual / Problem.visualCount — framework/visuals.tsx,
// english families): a small inline-SVG pictogram prints beside the row as a
// learning cue. Cue-only: it never appears in prompt/answer text, and
// problems without the field render exactly the legacy markup.
//
// TILE SCAFFOLDS (Problem.tileBlanks / Problem.tileWords — framework/tiles.tsx,
// english early-years): bordered WRITE-BOX blanks and the scrambled word-tile
// bank. Set only inside the early cue band by the generators, so other rows
// keep the underline markup.
//
// MATHS FIGURES (Problem.clock/bond/compass/... — framework/*Diagram.tsx):
// each renderer draws ONLY the attached figure data; private answers never
// enter any SVG. A problem carrying any figure (clock excepted) switches the
// text column to the compact `illustrated` layout.
//
// DENSITY (per-subject capacity contracts): english pins 20px rows with
// 28/16px grid gaps and 38px blanks (plugins/print-capacity.test.ts and the
// family sheet tests); maths pins 22px rows with 32/24px gaps and 56px blanks
// (plugins/layout-capacity.test.ts). The `density` prop selects the exact
// legacy numbers — both models keep holding, one component.
//
// ANSWER KEY: two rendering models share this sheet. `answerKey` true prints
// the small italic answer note under each non-tracing row (english inline
// model, data-testid="answer-line"). The maths model passes answerKey=false
// and appends separate AnswerKeySheet pages instead (worksheet-kit) — the
// sheet itself NEVER prints answers for maths families.
import React, { Fragment } from 'react';
import { styledComponent } from '@presource/react';
import type { Problem } from './document';
import type { ClockFigure } from './types';
import { PictogramRow } from './visuals';
import { WriteBox, WordTileRun } from './tiles';
import { RowsColumnsDiagram } from './RowsColumnsDiagram';
import { ShapeTransformationDiagram } from './ShapeTransformationDiagram';
import { RectangleDiagram } from './RectangleDiagram';
// Family figure renderers (framework/*.tsx): each draws ONLY the problem's
// attached figure data — private answers never enter any SVG.
import { BondDiagram } from './BondDiagram';
import { ColumnDiagram } from './ColumnDiagram';
import { CompassDiagram } from './CompassDiagram';
import { DataDiagram } from './DataDiagram';
import { DivisionDiagram } from './DivisionDiagram';
import { MoneyDiagram } from './MoneyDiagram';
import { ShapeFigures } from './ShapeFigure';

// The per-subject grid density (see module header). Each value is the exact
// legacy constant set pinned by that subject's capacity suite.
export type SheetDensity = 'compact' | 'roomy';

export type PrintableSheetProps = {
    // Large heading, e.g. "Addition level 7".
    title: string;
    // Small line under the title, e.g. "Addition — within 20".
    subtitle: string;
    // The problems to lay out on THIS page (one page of one worksheet).
    problems: Problem[];
    // Optional footer label — set to "Page i of n" for multi-page documents so
    // printed pages can be ordered physically. Omitted for single-page sheets.
    pageLabel?: string;
    // Prose-style sheets (sentence building, word gaps, word problems, number
    // tracing) render in a SINGLE column so every row has the full page
    // width. Default: two-column grid.
    single?: boolean;
    // Brand line printed in the multi-page footer ("English Worksheets"). Comes
    // from the dashboard framework's configuration, so the sheet component
    // itself stays subject-neutral. Defaults to "Worksheets" for direct use.
    brand?: string;
    // T5 inline teacher answer key (english model): when true, each
    // non-tracing row prints its model answer / marking guidance on a small
    // italic line under the question. Defaults to FALSE — student sheets stay
    // answer-free (every pre-existing row-text pin depends on this default).
    // The maths answer-key model ('pages') never sets this; its answers print
    // on the separate AnswerKeySheet pages.
    answerKey?: boolean;
    // Per-subject grid density (see module header). Default 'compact' (the
    // english numbers), which keeps every english sheet pixel-identical.
    density?: SheetDensity;
    // Stable test id for the root element.
    testId?: string;
};

// Page root: the paper sheet filling its A4 frame (794×1123px on screen,
// 210×297mm in the print tree). Flex column so the footer pins to the page
// bottom regardless of how much problem content is above it. Colours are the
// paper tokens (screen-adaptive, print-forced — see the file header).
const SheetRoot = styledComponent('div', {
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--paper-bg)',
    boxSizing: 'border-box',
    padding: '12mm 12mm 12mm 12mm',
    fontFamily: 'system-ui, "Segoe UI", Arial, sans-serif',
    color: 'var(--paper-ink)',
    display: 'flex',
    flexDirection: 'column'
});

const SheetTitle = styledComponent('h1', {
    fontSize: '30px',
    fontWeight: 700,
    margin: '0 0 4px 0',
    lineHeight: 1.1,
    letterSpacing: '-0.01em'
});

const SheetSubtitle = styledComponent('p', {
    fontSize: '15px',
    margin: '0',
    color: 'var(--paper-sub)'
});

// Header row: title + subtitle on the LEFT, the Name/Date fill-ins pinned to
// the TOP RIGHT (moved off their own left-aligned line under the subtitle).
// `gap` + `minWidth: 0` on the left stack keep the two halves from overlapping
// on narrow (small-zoom) previews: the title side shrinks/ellipses its box,
// the meta side never does.
const HeaderRow = styledComponent('div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    margin: '0 0 14px 0'
});

// Left half of the header row: the sheet heading stack.
const HeaderId = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0
});

// Right half of the header row: Name / Date stacked and right-aligned so a
// teacher's class can fill them in at the top corner of the sheet.
const MetaStack = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px',
    flexShrink: 0,
    fontSize: '16px',
    color: 'var(--paper-meta)',
    paddingTop: '2px'
});

const Rule = styledComponent('hr', {
    border: 'none',
    borderTop: '2px solid var(--paper-ink)',
    margin: '0 0 16px 0'
});

// Two-column grid for compact sheets; single column for long prose (sentence
// building, word gaps, twin-word sentences, word problems). `single` is a
// custom prop read by the function value for gridTemplateColumns.
//
// FILLING THE WHOLE PAGE: SheetRoot is a flex column on a fixed A4 height, so
// `flex: 1` grows this grid to exactly the space left below the header row
// (and above the footer). `gridAutoRows: 1fr` divides that space into EVEN
// rows and `alignItems: center` vertically centres each question in its row —
// so no matter how many problems a worksheet generates, the LAST question row
// always lands at the bottom of the page: there is never a blank band between
// the questions and the page foot (screen preview and print share this layout).
//
// The gaps are DENSITY-driven (see module header): english 28/16, maths 32/24
// — the exact legacy constants each subject's capacity model pins.
const ProblemGrid = styledComponent<{ single: boolean; density: SheetDensity }>('div', {
    display: 'grid',
    gridTemplateColumns: ({ single }) => (single ? '1fr' : '1fr 1fr'),
    columnGap: ({ density }) => (density === 'roomy' ? '32px' : '28px'),
    rowGap: ({ density }) => (density === 'roomy' ? '24px' : '16px'),
    alignItems: 'center',
    flex: 1,
    minHeight: '0',
    gridAutoRows: '1fr'
});

// The problem row: flex with the row index, the optional cue/figure slots and
// the prompt text. Density picks the exact legacy row font (english 20px,
// maths 22px) and gap (10px / 12px).
const ProblemRow = styledComponent<{ density: SheetDensity }>('div', {
    display: 'flex',
    gap: ({ density }) => (density === 'roomy' ? '12px' : '10px'),
    fontSize: ({ density }) => (density === 'roomy' ? '22px' : '20px'),
    lineHeight: 1.5
});

// Question number, right-aligned in a narrow column.
const ProblemIndex = styledComponent('span', {
    color: 'var(--paper-index)',
    minWidth: '26px',
    textAlign: 'right',
    fontSize: '15px',
    paddingTop: '3px'
});

// Illustrated worksheets (ShapeTransformationsWorksheet's six shape rows,
// RowsColumnsWorksheet's six grid rows, and the family figures below — data /
// shapes / bonds / compass / money / division / column / perimeter-area
// rectangles) need compact prose and the full remaining row width. A problem
// carrying ANY figure (clock excepted) switches the text column to that
// compact layout. Undefined overrides preserve the inherited font/layout of
// existing text and clocks; strings also avoid styledComponent converting
// unitless values into rem.
const ProblemText = styledComponent<{ illustrated: boolean }>('span', {
    whiteSpace: 'pre-wrap',
    fontSize: ({ illustrated }) => (illustrated ? '16px' : undefined),
    lineHeight: ({ illustrated }) => (illustrated ? '1.35' : undefined),
    display: ({ illustrated }) => (illustrated ? 'block' : undefined),
    minWidth: ({ illustrated }) => (illustrated ? '0px' : undefined),
    flex: ({ illustrated }) => (illustrated ? '1' : undefined)
});

// The learning-visual cue slot: sits between the row index and the prompt
// (or before the tracing model). Renders only when the problem carries a
// `visual` key that exists in the pictogram registry — problems without the
// field print the legacy markup unchanged. `alignSelf: flex-start` + one line
// of vertical centre keeps the picture aligned to the FIRST line of a
// wrapping prompt (single-line rows stay perfectly centred).
const ProblemVisual = styledComponent('span', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
    alignSelf: 'flex-start',
    paddingTop: '3px'
});

// Tracing rows (letterTrace / wordTrace / numberTrace): a solid grey model
// exemplar plus faded dashed copies the child traces over, all riding on one
// dashed "stay-on-the-line" rule. `flex: 1` stretches the line to the rest of
// the problem row so the rule reads as a full writing line (wide full-width
// lines on the single-column word/number sheets, half-page lines on the
// letter two-column sheet).
//
// WRITABLE SCALE: the tracing sheets print only a small dealt group per page
// (8 letters / 6 words / 5 digits), so the grid's `gridAutoRows: 1fr` gives
// every trace row ~150–210px of height. The row uses that room: a wide gap
// between model and target and deep padding under the glyphs put the child's
// pencil ON a real writing line instead of a cramped mini-row.
const TraceLine = styledComponent('div', {
    display: 'flex',
    alignItems: 'baseline',
    gap: '26px',
    flex: 1,
    minWidth: '0',
    paddingBottom: '12px',
    borderBottom: '2px dashed var(--trace-rule)',
    whiteSpace: 'nowrap'
});

// The solid model shape to copy from: mid-grey so it is clearly readable
// yet distinct from the child's own (dashed) work. Same 64px face as the
// trace target so the two share one baseline in TraceLine — a Prep-sized
// exemplar (~17mm tall), not a body-text glyph.
const ModelText = styledComponent('span', {
    display: 'inline-block',
    fontSize: '64px',
    fontWeight: 600,
    lineHeight: '1.1',
    color: 'var(--trace-model)',
    userSelect: 'none'
});

// The faded trace target. The glyphs print as pale-outlined shapes via
// -webkit-text-stroke (supported by all evergreen engines, screen AND print —
// the preview tree and the hidden print tree share this exact markup). The
// almost-invisible pale fill is the graceful fallback: an engine without
// text-stroke still paints a light solid shape a child can trace, never an
// empty gap. The stroke scales with the 64px face so the outlined shapes
// stay bold at writable size (vector text — crisp at any print DPI, never a
// decorative raster).
const TraceText = styledComponent('span', {
    display: 'inline-block',
    fontSize: '64px',
    fontWeight: 600,
    lineHeight: '1.1',
    letterSpacing: '0.05em',
    color: 'var(--trace-fill)',
    WebkitTextStroke: '3px var(--trace-stroke)',
    userSelect: 'none'
});

// A fill-in blank. Big blanks (name/date, and problems flagged `wideBlanks` —
// handwritten answers too long for the short line, e.g. the clock sheets'
// "quarter past 11") are wide; default question blanks fit a written
// digit/word. Density picks the legacy widths (english 38/140px, maths 56/
// 160px) and rule weight (2px / 2.5px — the heavier maths rule keeps the line
// visible once a pencil has been dragged across it).
const Blank = styledComponent<{ big?: boolean; density: SheetDensity }>('span', {
    display: 'inline-block',
    minWidth: ({ big, density }) => (big ? (density === 'roomy' ? '160px' : '140px') : density === 'roomy' ? '56px' : '38px'),
    borderBottom: ({ density }) => (density === 'roomy' ? '2.5px solid var(--paper-ink)' : '2px solid var(--paper-ink)'),
    height: ({ density }) => (density === 'roomy' ? '0.9em' : '0.8em'),
    verticalAlign: 'baseline',
    margin: '0 5px'
});

// The scrambled word-tile line (Sentence Building, early years): a second,
// full-width line under the prompt row carrying the WordTileRun bank.
const TileLine = styledComponent('span', {
    display: 'block',
    marginTop: '6px',
    whiteSpace: 'pre-wrap'
});

// T5 TEACHER ANSWER KEY note (english inline model): a small italic
// answer/guidance line printed under a question ONLY when the sheet is
// mounted with answerKey (teacher mode). Student print keeps the default
// (false) and never sees these. display:block on a span keeps the DOM nesting
// valid (it lives inside the ProblemText span); pre-wrap lets multi-part
// answers (comprehension a/b/c) print one per line. 13px keeps it clearly
// subordinate to the question text.
const AnswerNote = styledComponent('span', {
    display: 'block',
    marginTop: '4px',
    fontSize: '13px',
    fontStyle: 'italic',
    lineHeight: 1.4,
    color: 'var(--paper-sub)',
    whiteSpace: 'pre-wrap'
});

// Full-width fill-in line printed BELOW a prompt flagged `answerLine` (maths
// clock sheets) — the student writes the answer on its own line at the
// bottom, not squeezed inline. Extra height above the rule leaves real
// pen-on-paper room: 1.5em of clear space under the baseline is a full
// handwritten word/phrase for a young learner.
const WriteLine = styledComponent('span', {
    display: 'block',
    height: '1.5em',
    marginTop: '14px',
    borderBottom: '2.5px solid var(--paper-ink)'
});

// Footer shown only for multi-page documents: brand line on the left,
// "Page i of n" on the right, pinned to the page bottom.
const SheetFooter = styledComponent('div', {
    marginTop: 'auto',
    paddingTop: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '16px'
});

const FooterText = styledComponent('span', {
    fontSize: '11px',
    color: 'var(--paper-index)'
});

// ── Analog clock figure (optional problem.clock — maths families) ────────────
// When a problem carries a `clock` figure (types.ts ClockFigure) an SVG analog
// clock is printed before the prompt text: hands drawn for reading items, a
// BLANK face for "draw the hands" items. Pure geometry — hand angles are
// measured clockwise from 12 o'clock, so a hand tip sits at
// (cx + r·sin θ, cy − r·cos θ) with θ = (fraction of the dial) × 360°.
//
// SIZE (maths R2): 120px — a draw-the-hands face must be big enough for a
// child to rule two hands and still read the numerals; the 64-unit viewBox
// keeps every stroke/numeral resolution-independent (the rim stroke renders
// ~3.8px here). The hour hand's 3.5-unit stroke is a pinned contract
// (plugins tests distinguish drawn vs blank faces by it) — do not renumber it.
const ClockBox = styledComponent('span', {
    display: 'inline-block',
    width: '120px',
    height: '120px',
    flexShrink: 0,
    alignSelf: 'center'
});

function ClockFace({ clock }: { clock: ClockFigure }) {
    // 64-unit viewBox scaled up to a 120px box: all geometry below is defined
    // in the 64-unit space (centre 32) and scales with the svg size, keeping
    // the numbers, ticks and hands crisp at any print size.
    const c = 32;
    const SIZE = 120;
    const showHands = clock.hands !== false;
    // Hour hand moves 30° per hour PLUS 0.5° per minute (so a half-past hand
    // points halfway between two numbers); minute hand moves 6° per minute.
    const hourDeg = (clock.hour % 12) * 30 + clock.minute * 0.5;
    const minuteDeg = clock.minute * 6;
    // Endpoint of a hand/tick `len` px from the centre at `deg` from 12.
    const point = (deg: number, len: number) => {
        const rad = (deg * Math.PI) / 180;
        return { x: c + len * Math.sin(rad), y: c - len * Math.cos(rad) };
    };
    return (
        <ClockBox>
            <svg
                width={SIZE}
                height={SIZE}
                viewBox="0 0 64 64"
                role="img"
                aria-label={
                    showHands
                        ? `clock showing ${clock.hour}:${String(clock.minute).padStart(2, '0')}`
                        : 'blank clock face'
                }
            >
                {/* Rim — paper-token colours keep the figure theme-adaptive on
                    screen and print-forced white/dark-ink (app.css). */}
                <circle cx={c} cy={c} r="30" fill="var(--paper-bg)" stroke="var(--paper-ink)" strokeWidth="2" />
                {/* Hour ticks: 12 short marks on the rim */}
                {[...Array(12)].map((_, i) => {
                    const a = point(i * 30, 28);
                    const b = point(i * 30, 25);
                    return (
                        <line
                            key={`tick-${i}`}
                            x1={a.x}
                            y1={a.y}
                            x2={b.x}
                            y2={b.y}
                            stroke="var(--paper-ink)"
                            strokeWidth="1.5"
                        />
                    );
                })}
                {/* Hour numbers 1-12 on an inner ring */}
                {[...Array(12)].map((_, i) => {
                    const n = i + 1;
                    const p = point(n * 30, 20);
                    return (
                        <text
                            key={`num-${n}`}
                            x={p.x}
                            y={p.y}
                            fontSize="9"
                            fontWeight="700"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="var(--paper-ink)"
                        >
                            {n}
                        </text>
                    );
                })}
                {/* Hands + centre pin — omitted entirely on blank (draw-it)
                    faces so the student draws both hands themselves. */}
                {showHands && (
                    <>
                        <line
                            x1={c}
                            y1={c}
                            x2={point(hourDeg, 13).x}
                            y2={point(hourDeg, 13).y}
                            stroke="var(--paper-ink)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                        />
                        <line
                            x1={c}
                            y1={c}
                            x2={point(minuteDeg, 22).x}
                            y2={point(minuteDeg, 22).y}
                            stroke="var(--paper-ink)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                        <circle cx={c} cy={c} r="2" fill="var(--paper-ink)" />
                    </>
                )}
            </svg>
        </ClockBox>
    );
}

// Splits a prompt on "__" and renders each blank as a styled fill-in line, so
// the printed sheet shows real blanks instead of literal underscores.
//   - tileBlanks set (english early-years) → bordered WRITE-BOX tiles (the
//     writing scaffold, see tiles.tsx) instead of the plain underline;
//   - wide set (maths clock sheets) → the wide name/date-sized blanks;
//   - otherwise → the density's default underline.
function PromptText({
    prompt,
    tileBlanks,
    wide,
    density
}: {
    prompt: string;
    tileBlanks?: 'letter' | 'word';
    wide?: boolean;
    density: SheetDensity;
}) {
    const parts = prompt.split('__');
    return (
        <>
            {parts.map((part, i) => (
                <Fragment key={i}>
                    {part}
                    {i < parts.length - 1 &&
                        (tileBlanks ? <WriteBox kind={tileBlanks} /> : <Blank big={wide} density={density} />)}
                </Fragment>
            ))}
        </>
    );
}

// A problem is "illustrated" when it carries ANY figure (the compact block
// typography + full row width in ProblemText). All figure fields are
// renderer-owned data — their presence, not their content, drives layout.
// The clock figure does NOT switch the typography (its slot sits before the
// text and inline math prompts stay 20/22px, per the maths sheet's legacy
// contract).
function hasFigure(problem: Problem): boolean {
    return (
        problem.shapeTransformation !== undefined ||
        problem.rowsColumns !== undefined ||
        problem.data !== undefined ||
        problem.shapes !== undefined ||
        problem.bond !== undefined ||
        problem.compass !== undefined ||
        problem.money !== undefined ||
        problem.division !== undefined ||
        problem.column !== undefined ||
        problem.perimeterArea !== undefined
    );
}

export function PrintableSheet({
    title,
    subtitle,
    problems,
    pageLabel,
    single,
    brand,
    answerKey,
    density = 'compact',
    testId
}: PrintableSheetProps) {
    return (
        <SheetRoot data-testid={testId}>
            {/* Header: title/subtitle left, Name/Date top right. */}
            <HeaderRow>
                <HeaderId>
                    <SheetTitle>{title}</SheetTitle>
                    <SheetSubtitle>{subtitle}</SheetSubtitle>
                </HeaderId>
                <MetaStack>
                    <div>
                        Name: <Blank big density={density} />
                    </div>
                    <div>
                        Date: <Blank big density={density} />
                    </div>
                </MetaStack>
            </HeaderRow>
            <Rule />
            <ProblemGrid single={single ?? false} density={density}>
                {problems.map((p) => (
                    <ProblemRow key={p.id} density={density}>
                        <ProblemIndex>{p.id}.</ProblemIndex>
                        {/* Learning-visual cue (english early-years sheets
                            only): the pictogram for p.visual, printed
                            `visualCount` times (quantity contrast). No visual
                            field => nothing renders. TRACING rows pass the
                            enlarged uniform `size` so the picture matches the
                            writable scale of the 64px trace target; normal
                            rows keep the compact default ladder. */}
                        {p.visual && <ProblemVisual>{<PictogramRow icon={p.visual} count={p.visualCount ?? 1} size={p.trace ? 44 : undefined} />}</ProblemVisual>}
                        {/* Optional analog-clock figure printed before the
                            question text (maths reading / draw-the-hands
                            items). */}
                        {p.clock && <ClockFace clock={p.clock} />}
                        {p.trace ? (
                            // Tracing row: [cue] solid model + faded dashed
                            // target on a dashed writing rule (see
                            // TraceLine/ModelText/TraceText above). The row
                            // announces the printed prompt to screen readers.
                            <TraceLine aria-label={p.prompt}>
                                {p.model && (
                                    <ModelText aria-hidden="true">{p.model}</ModelText>
                                )}
                                <TraceText>{p.trace}</TraceText>
                            </TraceLine>
                        ) : (
                            <ProblemText illustrated={hasFigure(p)}>
                                <PromptText
                                    prompt={p.prompt}
                                    tileBlanks={p.tileBlanks}
                                    wide={p.wideBlanks ?? false}
                                    density={density}
                                />
                                {/* Scrambled word tiles (english early-years
                                    Sentence Building only): the word bank
                                    prints as a row of bordered word tiles on
                                    its own line — in the SHOWN (scrambled)
                                    order from problem.tileWords, so the answer
                                    order never appears. */}
                                {p.tileWords && (
                                    <TileLine>
                                        <WordTileRun words={p.tileWords} />
                                    </TileLine>
                                )}
                                {/* Maths figures follow the prompt in a fixed
                                    order; each renderer draws ONLY the
                                    attached figure data (private answers stay
                                    out of the DOM). */}
                                {p.shapeTransformation && <ShapeTransformationDiagram figure={p.shapeTransformation} />}
                                {p.rowsColumns && <RowsColumnsDiagram figure={p.rowsColumns} />}
                                {p.data && <DataDiagram figure={p.data} />}
                                {p.shapes && <ShapeFigures shapes={p.shapes} />}
                                {p.bond && <BondDiagram figure={p.bond} />}
                                {p.compass && <CompassDiagram figure={p.compass} />}
                                {p.money && <MoneyDiagram figure={p.money} />}
                                {p.division && <DivisionDiagram figure={p.division} />}
                                {p.column && <ColumnDiagram figure={p.column} />}
                                {/* Perimeter/area measurement shapes: the
                                    renderer draws only the labelled shape
                                    (unknown sides print "?") and never prints
                                    a perimeter, area or missing side. */}
                                {p.perimeterArea && <RectangleDiagram figure={p.perimeterArea} />}
                                {/* Bottom writing space for answerLine prompts
                                    (maths clock sheets; their prompts carry no
                                    inline "__" blanks). */}
                                {p.answerLine && <WriteLine />}
                                {/* T5 inline teacher answer key (english
                                    model): the model answer / marking guidance
                                    under the question. Off by default (student
                                    sheets answer-free); tracing rows never
                                    reach this branch (the trace target IS the
                                    answer, already printed). The maths model
                                    ('pages') passes answerKey=false and prints
                                    answers on the separate key pages. */}
                                {answerKey && (
                                    <AnswerNote data-testid="answer-line">
                                        Answer: {p.answer}
                                    </AnswerNote>
                                )}
                            </ProblemText>
                        )}
                    </ProblemRow>
                ))}
            </ProblemGrid>
            {/* Multi-page documents get a page-position footer in print so a
                class set of copies can be reordered physically. The brand line
                comes from the dashboard configuration (framework.config). */}
            {pageLabel && (
                <SheetFooter>
                    <FooterText>{brand ?? 'Worksheets'}</FooterText>
                    <FooterText>{pageLabel}</FooterText>
                </SheetFooter>
            )}
        </SheetRoot>
    );
}
