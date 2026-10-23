// WorksheetsDashboard integration tests — the merged app's shell contract.
//
// Covers the T2/T4 acceptance behaviours end-to-end against the REAL plugin
// registrations (79 factories loading one by one):
//   1. SUBJECT RAIL: exactly Math / English / Chemistry / Physic (R2), with
//      live per-subject counts (38 + 37 + 2 + 2);
//   2. SUBJECT SWITCHING: the picker re-scopes, the selection stays valid
//      (nonempty), and the science subjects hold their own plugins (R5);
//   3. PICKER SEARCH: type-to-filter + select activates the worksheet;
//   4. LEVEL SCALING: level 1 vs level 2 generate genuinely different
//      content through the legacy caps;
//   5. INDEPENDENT ADVANCED SCALING: Calculus has its own Intro/Developing/
//      Full rungs from level 1 (no Year-11 requirement);
//   6. SATURATION + SEED (R3 revised presentation): an oversized level
//      clamps the worksheet to its own maximum — content AND seed identical
//      to the max level until Randomize — and the UI SAYS NOTHING: no
//      "Tops out" note, no grade labels, no "starts at" messaging; the title
//      keeps the REQUESTED level;
//   7. ONE TITLE FORMAT: "<Worksheet> level <requested>" for Math, English,
//      Science, at high levels, on every printed sheet and in the print
//      document/tab title;
//   8. RANDOMIZE: re-rolls the seed (new content), preserving page count;
//   9. THEME: the header selector writes data-theme + persists under
//      '@distribution/worksheets:theme';
//  10. PRINT + ANSWER KEY: Print opens window.print(); the answer-key toggle
//      renders answers INLINE for english/science and as separate key PAGES
//      for math, with both legacy toggle selectors kept working;
//  11. ZOOM + PAGES controls stay live.

import React from 'react';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { App } from '../App';
import { THEME_STORAGE_KEY, normalizeThemeChoice, readStoredThemeChoice } from '../framework';

afterEach(() => {
    cleanup();
    window.localStorage.clear();
});

// The full plugin load chain (79 factories, macrotask-yielded) needs more
// headroom than the workspace default under parallel load.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// Wait until the given subject's count chip shows `count` (all of that
// subject's plugins have loaded).
async function awaitSubjectCount(label: string, count: string) {
    await waitFor(
        () => {
            expect(screen.getByTestId(`subject-count-${label}`).textContent).toBe(count);
        },
        { timeout: 30_000 }
    );
}

// Set the level through the header stepper input.
function setLevel(value: string) {
    const level = screen.getByTestId('level-count') as HTMLInputElement;
    fireEvent.change(level, { target: { value } });
    fireEvent.blur(level);
}

// Sheet text WITHOUT the printed title: saturation-parity comparisons must
// ignore the title (it carries the REQUESTED level, which legitimately
// differs between two saturated levels — the content underneath is frozen).
function bodyText(pageText: string, title: string): string {
    return pageText.replace(title, '');
}

describe('subject rail (R2) — Math, English, Chemistry, Physic only', () => {
    it('lists exactly the four subject slots with live counts', async () => {
        render(<App />);
        await awaitSubjectCount('math', '38');
        await awaitSubjectCount('english', '37');
        await awaitSubjectCount('chemistry', '2');
        await awaitSubjectCount('physics', '2');
        // The rail buttons exist for all four subjects, nothing else.
        for (const id of ['math', 'english', 'chemistry', 'physics']) {
            expect(screen.getByTestId(`subject-${id}`)).toBeDefined();
        }
        expect(screen.queryByTestId('subject-french')).toBeNull();
    });
});

describe('subject switching — valid selection across subjects', () => {
    it('opens on Math/Addition, switches to English (Sight & Real Words), and back', async () => {
        render(<App />);
        await awaitSubjectCount('english', '37');

        // Default: Math subject, its first registered worksheet (Addition)
        // — a NONEMPTY valid selection with a real preview page. ONE TITLE
        // FORMAT: "<Label> level <requested>".
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Addition level 2');
        expect(screen.getByTestId('sheet-preview-page1')).toBeDefined();

        // Switch to English: the picker re-scopes and the selection
        // reconciles to english's first worksheet (Sight & Real Words).
        fireEvent.click(screen.getByTestId('subject-english'));
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Sight & Real Words level 2');
        });
        expect(screen.getByTestId('sheet-preview-page1')).toBeDefined();

        // And back to Math: Addition again (the reconciliation prefers the
        // subject's first worksheet offered at the current level).
        fireEvent.click(screen.getByTestId('subject-math'));
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Addition level 2');
        });
    });

    it('switches to the science subjects and their plugins generate (R5)', async () => {
        render(<App />);
        await awaitSubjectCount('chemistry', '2');
        await awaitSubjectCount('physics', '2');

        // Chemistry: the first chemistry worksheet (Elements) reconciles in,
        // generates at the default level 2, and the picker is live.
        fireEvent.click(screen.getByTestId('subject-chemistry'));
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Elements level 2');
        });
        expect(screen.getByTestId('sheet-preview-page1')).toBeDefined();
        expect((screen.getByTestId('worksheet-picker-input') as HTMLInputElement).disabled).toBe(false);
        // The level-2 element sheet draws from the FIRST 20 elements (e.g.
        // Sodium/Aluminium at level 2 — the pool widened past level 1).
        expect(screen.getByTestId('sheet-preview-page1').textContent).toContain('symbol');

        // Physic: the first physic worksheet (Speed, Distance & Time).
        fireEvent.click(screen.getByTestId('subject-physics'));
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Speed, Distance & Time level 2');
        });
        expect(screen.getByTestId('sheet-preview-page1').textContent).toContain('A vehicle travels');
    });

    it('reaches the second science worksheet through the picker search', async () => {
        render(<App />);
        await awaitSubjectCount('physics', '2');
        fireEvent.click(screen.getByTestId('subject-chemistry'));
        const input = screen.getByTestId('worksheet-picker-input');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'balanc' } });
        fireEvent.click(screen.getByTestId('worksheet-picker-option-balancing'));
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Balancing Equations level 2');
        // Every coefficient is a blank (the printed blank element follows
        // 'Balance:' — the answer-key side carries the vectors).
        expect(screen.getByTestId('sheet-preview-page1').textContent).toContain('Balance:');
    });
});

describe('worksheet picker search (R2) — through the real dashboard', () => {
    it('filters by text and selecting a suggestion activates its worksheet', async () => {
        render(<App />);
        await awaitSubjectCount('math', '38');
        const input = screen.getByTestId('worksheet-picker-input');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'frac' } });
        fireEvent.click(screen.getByTestId('worksheet-picker-option-fractions'));
        // Fractions join at level 4; the level-2 default shows the generic
        // empty state — with NO intro-level messaging (revised presentation).
        expect(screen.getByTestId('empty-state')).toBeDefined();
        expect(screen.getByTestId('empty-state').textContent).not.toContain('starts at level');
        expect(screen.getByTestId('empty-state').textContent).not.toContain('Grade');
        // Raising the level to 4 generates the fraction sheet.
        setLevel('4');
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Fractions level 4');
        });
        expect(screen.getByTestId('sheet-preview-page1')).toBeDefined();
    });
});

describe('level scaling (R3) — level 1 vs level 2 through the legacy caps', () => {
    it('generates different Addition content at level 1 and level 2', async () => {
        render(<App />);
        await awaitSubjectCount('math', '38');

        // Level 1 (legacy Prep): operands within 10.
        setLevel('1');
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Addition level 1');
        });
        const foundationText = screen.getByTestId('sheet-preview-page1').textContent!;
        expect(foundationText).toContain('Addition level 1');

        // Level 2 (legacy Year 1): operands within 20 — genuinely
        // different numbers (the level 2 default sheet pins "4 + 16 =").
        setLevel('2');
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Addition level 2');
        });
        const grade1Text = screen.getByTestId('sheet-preview-page1').textContent!;
        expect(grade1Text).toContain('4 + 16 =');
        expect(grade1Text).not.toBe(foundationText);
    });

    it('the level stepper accepts unbounded values and normalises garbage input', async () => {
        render(<App />);
        await awaitSubjectCount('math', '38');
        const level = screen.getByTestId('level-count') as HTMLInputElement;
        // A number input surfaces non-numeric text as '' (browser behaviour):
        // the empty field is tolerated while editing and the current value
        // survives until a valid one arrives.
        fireEvent.change(level, { target: { value: 'abc' } });
        expect((screen.getByTestId('level-count') as HTMLInputElement).value).toBe('2');
        // Zero (and any below-1 value) snaps to the minimum on entry.
        fireEvent.change(level, { target: { value: '0' } });
        expect((screen.getByTestId('level-count') as HTMLInputElement).value).toBe('1');
        // Big values are kept — levels may grow indefinitely; each worksheet
        // clamps its OWN effective level at generation time.
        fireEvent.change(level, { target: { value: '250' } });
        expect((screen.getByTestId('level-count') as HTMLInputElement).value).toBe('250');
        // The − stepper never drops below 1.
        fireEvent.click(screen.getByTestId('level-decrease'));
        expect((screen.getByTestId('level-count') as HTMLInputElement).value).toBe('249');
    });
});

describe('independent advanced scaling — Calculus on its own rungs', () => {
    async function openCalculus() {
        const input = screen.getByTestId('worksheet-picker-input');
        fireEvent.focus(input);
        fireEvent.change(input, { target: { value: 'calculus' } });
        fireEvent.click(screen.getByTestId('worksheet-picker-option-calculus'));
    }

    it('runs Intro → Developing → Full from level 1, with no Year-11 requirement', async () => {
        render(<App />);
        await awaitSubjectCount('math', '38');

        // Start at level 1 (the default session level is 2).
        setLevel('1');

        // Level 1: the INTRO rung — no Challenge-tier items at all.
        await openCalculus();
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Calculus level 1');
        const introText = screen.getByTestId('sheet-preview-page1').textContent!;
        expect(introText).toContain('Starter:');
        expect(introText).toContain('Practice:');
        expect(introText).not.toContain('Challenge:');

        // Level 2: the DEVELOPING rung — easy challenge families appear.
        setLevel('2');
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Calculus level 2');
        });
        const developingText = screen.getByTestId('sheet-preview-page1').textContent!;
        expect(developingText).toContain('Challenge:');
        expect(developingText).not.toBe(introText);
        // The hardest challenge family (cubic stationary points) waits for Full.
        expect(developingText).not.toContain('stationary points of y =');

        // Level 3: the FULL rung — the complete legacy scope, INCLUDING the
        // cubic-stationary challenge family.
        setLevel('3');
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Calculus level 3');
        });
        const fullText = screen.getByTestId('sheet-preview-page1').textContent!;
        expect(fullText).toContain('Challenge:');
        expect(fullText).toContain('stationary points of y =');
        expect(fullText).not.toBe(developingText);
    });

    it('saturates at level 3 silently — the title keeps the REQUESTED level', async () => {
        render(<App />);
        await awaitSubjectCount('math', '38');
        await openCalculus();
        setLevel('50');
        await waitFor(() => {
            // The requested level 50 stays on the title; generation clamps
            // to the FULL rung.
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Calculus level 50');
        });
        // No tops-out/max messaging anywhere (revised presentation).
        expect(screen.queryByTestId('level-note')).toBeNull();
        expect(document.body.textContent).not.toContain('Tops out');
        // The content is the FULL rung's content (same as level 3).
        expect(screen.getByTestId('sheet-preview-page1').textContent).toContain('stationary points of y =');
    });
});

describe('saturation + seed stability (R3) — oversized levels never change content', () => {
    it('Addition at level 7 vs level 99 renders the identical sheet; the title shows the requested level', async () => {
        render(<App />);
        await awaitSubjectCount('math', '38');
        // Switch to Addition (the default) and go to its exact maximum.
        setLevel('7');
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Addition level 7');
        });
        const maxText = screen.getByTestId('sheet-preview-page1').textContent!;

        // Overshoot to level 99: the effective level clamps to 7 — the SAME
        // seed and caps, so the sheet content is IDENTICAL (this is the
        // "seed uses the effective level" guarantee; only the printed title
        // legitimately differs, carrying the requested level). No saturation
        // note appears.
        setLevel('99');
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Addition level 99');
        });
        expect(screen.queryByTestId('level-note')).toBeNull();
        expect(
            bodyText(screen.getByTestId('sheet-preview-page1').textContent!, 'Addition level 99')
        ).toBe(bodyText(maxText, 'Addition level 7'));

        // Randomize re-rolls the seed: content CHANGES (page count preserved).
        fireEvent.click(screen.getByTestId('toolbar-randomize'));
        await waitFor(() => {
            expect(screen.getByTestId('sheet-preview-page1').textContent).not.toBe(maxText);
        });
    });

    it('a science worksheet saturates the same way (Elements caps at level 4)', async () => {
        render(<App />);
        await awaitSubjectCount('chemistry', '2');
        fireEvent.click(screen.getByTestId('subject-chemistry'));
        setLevel('4');
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Elements level 4');
        });
        const capText = screen.getByTestId('sheet-preview-page1').textContent!;
        setLevel('250');
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Elements level 250');
        });
        // Content frozen at the cap (title aside — it carries the requested
        // level); no max/grade messaging anywhere.
        expect(
            bodyText(screen.getByTestId('sheet-preview-page1').textContent!, 'Elements level 250')
        ).toBe(bodyText(capText, 'Elements level 4'));
        expect(screen.queryByTestId('level-note')).toBeNull();
        expect(screen.getByTestId('sheet-preview-page1').textContent).not.toContain('Grade');
    });
});

describe('one title format — high levels across all four subjects, no grade/max/starts-at text', () => {
    it('titles use "<Worksheet> level <requested>" for Math, English and Science at high levels', async () => {
        render(<App />);
        await awaitSubjectCount('physics', '2');

        // Math: far beyond Addition's cap (7).
        setLevel('250');
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Addition level 250');
        });

        // English: far beyond the english ladder (7) — the reconciled first
        // english worksheet keeps the same format.
        fireEvent.click(screen.getByTestId('subject-english'));
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Sight & Real Words level 250');
        });

        // Science (physic): far beyond the science cap (4).
        fireEvent.click(screen.getByTestId('subject-physics'));
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Speed, Distance & Time level 250');
        });

        // NONE of the banned messaging exists anywhere in the document:
        // no grade labels, no tops-out note, no starts-at intro text.
        const body = document.body.textContent ?? '';
        expect(body).not.toContain('Grade ');
        expect(body).not.toContain('Tops out');
        expect(body).not.toContain('starts at level');
        expect(screen.queryByTestId('level-note')).toBeNull();
    });
});

describe('randomise — re-rolls the seed in place', () => {
    it('generates new content while keeping the page count', async () => {
        render(<App />);
        await awaitSubjectCount('math', '38');
        // Two pages first, so the pin covers multi-page regeneration.
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '2' } });
        fireEvent.blur(screen.getByTestId('page-count'));
        const before = screen.getByTestId('sheet-preview-page1').textContent!;
        fireEvent.click(screen.getByTestId('toolbar-randomize'));
        await waitFor(() => {
            expect(screen.getByTestId('sheet-preview-page1').textContent).not.toBe(before);
        });
        // The page count survived (session-level, not re-rolled).
        expect(screen.getByTestId('sheet-preview-page2')).toBeDefined();
    });
});

describe('theme (R4) — System/Light/Dark persisted under the app key', () => {
    it('defaults to System, applies Light/Dark via data-theme, and persists', async () => {
        render(<App />);
        await awaitSubjectCount('math', '38');
        const select = screen.getByLabelText('Theme') as HTMLSelectElement;
        expect(select.value).toBe('system');
        // Pick Dark: the document root flips its theme attribute and the
        // choice persists under the package-specific key.
        fireEvent.change(select, { target: { value: 'dark' } });
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
        // Pick Light, then reload-simulate: the stored choice is honoured.
        fireEvent.change(select, { target: { value: 'light' } });
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        expect(normalizeThemeChoice(readStoredThemeChoice())).toBe('light');
    });
});

describe('print + answer key (R4) — both legacy models preserved', () => {
    it('Math: Print opens the native dialog, the key appends AnswerKeySheet PAGES, and the print tree carries the level title', async () => {
        const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
        render(<App />);
        await awaitSubjectCount('math', '38');
        // The maths bundle's toggle keeps its legacy selector and label.
        const toggle = screen.getByTestId('toolbar-answers');
        expect(toggle.textContent).toBe('Answers: Off');
        fireEvent.click(toggle);
        expect(toggle.textContent).toBe('Answers: On');
        // Key pages render in the preview after the worksheet pages (T8):
        // page 1 of the key is page 2 of the preview.
        await waitFor(() => {
            expect(screen.getByTestId('sheet-preview-page2').textContent).toContain('Answer key');
        });
        // The hidden print tree (what window.print() emits) carries the same
        // one-title format — the document/tab title at print time.
        expect(document.querySelector('.print-doc')!.textContent).toContain('Addition level 2');
        // Print: the native dialog fires (the print tree is mounted outside
        // the shell — window.print() emits exactly those .print-page blocks).
        fireEvent.click(screen.getByTestId('toolbar-print'));
        expect(printSpy).toHaveBeenCalled();
        // The inline english answer-line markup never appears on a math sheet.
        expect(screen.queryByTestId('answer-line')).toBeNull();
        printSpy.mockRestore();
    });

    it('English: the key prints INLINE answer lines under each question', async () => {
        render(<App />);
        await awaitSubjectCount('english', '37');
        fireEvent.click(screen.getByTestId('subject-english'));
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toContain('Sight & Real Words');
        });
        // The english bundle's toggle keeps ITS legacy selector.
        fireEvent.click(screen.getByTestId('toolbar-answer-key'));
        // Inline answers: every row gains an answer line (english T5 model).
        await waitFor(() => {
            expect(screen.getAllByTestId('answer-line').length).toBeGreaterThan(0);
        });
        // No key PAGES were appended (the english model is inline-only).
        expect(screen.getByTestId('sheet-preview-page1').textContent).toContain('Answer:');
    });

    it('Science: the inline answer key prints under each chemistry question', async () => {
        render(<App />);
        await awaitSubjectCount('chemistry', '2');
        fireEvent.click(screen.getByTestId('subject-chemistry'));
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toBe('Elements level 2');
        });
        // The science bundles share the english inline answer-key model
        // (data-testid="toolbar-answer-key").
        fireEvent.click(screen.getByTestId('toolbar-answer-key'));
        await waitFor(() => {
            expect(screen.getAllByTestId('answer-line').length).toBeGreaterThan(0);
        });
        expect(screen.getByTestId('sheet-preview-page1').textContent).toContain('Answer:');
    });
});

describe('zoom + pages controls (R4) — stay live', () => {
    it('zoom segments and the pages stepper mutate the session', async () => {
        render(<App />);
        await awaitSubjectCount('math', '38');
        // Zoom: pick 100% (a fixed percentage segment; the control announces
        // "Preview zoom: <label>" per segment).
        fireEvent.click(screen.getByRole('button', { name: 'Preview zoom: 100%' }));
        // Pages: + stepper grows the preview by one page.
        fireEvent.click(screen.getByRole('button', { name: 'Increase pages' }));
        expect(screen.getByTestId('sheet-preview-page2')).toBeDefined();
    });
});
