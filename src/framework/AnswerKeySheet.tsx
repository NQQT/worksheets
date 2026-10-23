// Teacher ANSWER KEY page (T8) — a dedicated A4 sheet appended AFTER the
// worksheet pages when the session answerKey flag is on (preview + print).
//
// WHY A SEPARATE PAGE (replaces the T4 inline "Answer: …" note): the inline
// note added ~20px to every problem row, but the row-budget model in
// plugins/layout-capacity.test.ts measures PROMPT content only — the worst
// statistics/probability rows (198px) sat inside 210.5px 1fr rows, so the
// key being ON pushed them past the row and risked print overflow. A
// separate key page keeps every worksheet page byte-identical to the pinned
// capacity model (no answer height enters the problem grid at all), and
// gives the teacher a spacious page they can print separately or pull from
// the job. This is the conservative option from the T8 brief.
//
// CAPACITY MODEL (pinned by AnswerKeySheet.test.tsx): rows are FIXED height
// (not 1fr), ONE column, KEY_ROWS_PER_PAGE rows per page. A single column is
// deliberate: the longest generated answer in the whole catalogue is the
// clock word answer "12:00 — hour hand on 12, minute hand on 12" (42 chars,
// ~416px at 18px/0.55em) — a two-column row (~300px text width) would wrap
// or clip it, while the single column (~667px) fits it on one line.
// Worst-case content height (header + rows + footer) stays well below the
// printable A4 height (both asserted in tests).
//
// Paper colours are hardcoded like PrintableSheet (the sheet IS the
// printout — white paper, dark ink, in every theme; app.css re-forces this
// under @media print).
import { styledComponent } from '@presource/react';
import type { Problem } from './document';

// One column × 25 fixed 30px rows = 750px of answer rows; with the ~69px
// header, 18px rule and ~27px footer that is ~864px inside the ~1032px
// printable height (1123px − 2×12mm padding) — a >150px safety margin, so
// the key page can never overflow at its maximum fill.
export const KEY_COLS = 1;
export const KEY_ROWS_PER_PAGE = 25;
export const KEY_PER_PAGE = KEY_COLS * KEY_ROWS_PER_PAGE;

export type AnswerKeyEntry = Pick<Problem, 'id' | 'answer'>;

export type AnswerKeySheetProps = {
    // The worksheet title this key belongs to, e.g. "Year 4 — Decimals".
    title: string;
    // The answers for THIS key page (at most KEY_PER_PAGE entries).
    entries: AnswerKeyEntry[];
    // Optional footer label — "Page i of n" when the document has more than
    // one page (mirrors PrintableSheet's pageLabel contract).
    pageLabel?: string;
    // Stable test id for the root element.
    testId?: string;
};

// Same paper root as PrintableSheet (A4-filling white sheet, 12mm padding,
// flex column so the footer pins to the bottom).
const KeyRoot = styledComponent('div', {
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

const KeyTitle = styledComponent('h1', {
    fontSize: '30px',
    fontWeight: 700,
    margin: '0 0 4px 0',
    lineHeight: 1.1,
    letterSpacing: '-0.01em'
});

const KeySubtitle = styledComponent('p', {
    fontSize: '15px',
    margin: '0',
    color: 'var(--paper-sub)'
});

const KeyHeader = styledComponent('div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    margin: '0 0 14px 0'
});

const KeyRule = styledComponent('hr', {
    border: 'none',
    borderTop: '2px solid var(--paper-ink)',
    margin: '0 0 16px 0'
});

// Fixed-height answer rows (NOT 1fr): the capacity model above depends on
// deterministic row geometry, and a key page is allowed to end early with
// whitespace at the bottom — the rows never stretch or crowd. Single column
// (KEY_COLS=1) so even the longest catalogue answer stays on one line.
const KeyGrid = styledComponent('div', {
    display: 'grid',
    gridTemplateColumns: '1fr',
    rowGap: '0px',
    gridAutoRows: '30px',
    alignItems: 'center',
    alignContent: 'start'
});

const KeyRow = styledComponent('div', {
    display: 'flex',
    gap: '10px',
    fontSize: '18px',
    lineHeight: '30px',
    height: '30px',
    color: 'var(--paper-ink)'
});

// Question number column — same gutter as the worksheet grid so key rows
// visually line up with the sheet they answer.
const KeyIndex = styledComponent('span', {
    color: 'var(--paper-index)',
    minWidth: '26px',
    textAlign: 'right',
    fontSize: '15px'
});

// Footer mirrors PrintableSheet's (brand left, page position right).
const KeyFooter = styledComponent('div', {
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

export function AnswerKeySheet({ title, entries, pageLabel, testId }: AnswerKeySheetProps) {
    return (
        <KeyRoot data-testid={testId}>
            <KeyHeader>
                <div>
                    <KeyTitle>Answer key</KeyTitle>
                    <KeySubtitle>{title}</KeySubtitle>
                </div>
            </KeyHeader>
            <KeyRule />
            <KeyGrid>
                {entries.map((entry) => (
                    <KeyRow key={entry.id}>
                        <KeyIndex>{entry.id}.</KeyIndex>
                        <span>{entry.answer}</span>
                    </KeyRow>
                ))}
            </KeyGrid>
            {pageLabel && (
                <KeyFooter>
                    <FooterText>Math Worksheets</FooterText>
                    <FooterText>{pageLabel}</FooterText>
                </KeyFooter>
            )}
        </KeyRoot>
    );
}
