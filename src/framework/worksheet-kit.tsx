// ─────────────────────────────────────────────────────────────────────────────
// WORKSHEET KIT — the framework's standard worksheet recipe (the union).
//
// `createWorksheet(spec, config)` builds a COMPLETE DashboardPlugin from a
// WorksheetSpec — this is what a worksheet plugin's factory function calls
// with the DashboardFramework it receives from the dashboard:
//
//   toolbar : title/subtitle + Level control (header) + Pages stepper +
//             Randomize + Answer-key toggle + Print
//   page    : the A4 preview stack + zoom dock + empty state
//   print   : the hidden .print-doc tree window.print() paginates
//
// Every worksheet plugin (AdditionWorksheet, SightWordsWorksheet, ...) is a
// factory function that receives the dashboard's configurations + layouts and
// returns dashboard.createWorksheet({ ...its own spec... }) — the plugin
// declares its picker label and its content; the framework renders it.
//
// STATE: worksheets keep NO state of their own. The dashboard SESSION
// (store.session: level, pageCount, zoom, refresh, answerKey) is the shared
// framework configuration — switching worksheets preserves it, exactly like a
// single dashboard-wide setting should.
//
// DIFFICULTY (R3): the session's `level` is resolved per worksheet through
// framework/difficulty.ts into a DifficultyPlan (effective level, saturation,
// legacy grade config). The SEED is derived from the EFFECTIVE level's legacy
// grade id — so two overshooting levels that saturate to the same effective
// level produce the SAME document (seed and caps) until Randomize is pressed.
//
// CONFIG: the framework instance's config (framework.ts) supplies the
// subject-specific bits this kit cannot know: the subject id, the print footer
// brand line, the empty-state glyph, the answer-key RENDERING MODEL
// ('inline' — english: answers under each question — or 'pages' — maths: the
// dedicated AnswerKeySheet pages appended after the worksheet pages) and the
// grid DENSITY each subject's capacity model pins ('compact' for english,
// 'roomy' for maths). The kit itself is subject-neutral.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
import { styledComponent } from '@presource/react';
import { definePlugin, type DashboardPlugin, type WorksheetSpec } from './types';
import { useDashboardStore } from './store';
import { seedFrom } from './rng';
import { buildDocument } from './document';
import {
    resolveDifficulty,
    type DifficultyPlan,
    type WorksheetSubjectId
} from './difficulty';
import { PageStack, type PageSpec } from './PageStack';
import { PrintableSheet, type SheetDensity } from './PrintableSheet';
import { AnswerKeySheet, KEY_PER_PAGE } from './AnswerKeySheet';
import { ZoomControl } from './ZoomControl';
import type { ZoomMode } from './page-scale';
import type { Problem, WorksheetDocument } from './document';

// The subject-specific chrome bits a dashboard instance configures (see
// framework.ts's createDashboardFramework). Defined here because this kit is
// what consumes it; framework.ts re-exports it as part of the bundle type.
export type DashboardFrameworkConfig = {
    // Which subject this bundle's plugins belong to (stamped onto every
    // DashboardPlugin the bundle builds).
    subject: WorksheetSubjectId;
    // Brand line printed in the multi-page sheet footer ("English Worksheets").
    printBrand: string;
    // Glyph for the framework empty-state icon chip ("Aa" / "∑").
    emptyGlyph: string;
    // How the teacher answer key prints (see module header): inline answer
    // lines under each question, or dedicated AnswerKeySheet pages appended
    // after the worksheet pages.
    answerKeyStyle: 'inline' | 'pages';
    // The problem-grid density (each subject's print-capacity model pins its
    // own): 'compact' = english (20px rows, 28/16 gaps), 'roomy' = maths
    // (22px rows, 32/24 gaps).
    density: SheetDensity;
    // The empty-state hint line (subject-aware copy).
    emptyHint: string;
};

// Minimum page count; there is intentionally NO maximum — the stepper can be
// incremented as far as the user wants ("infinite" page generation).
const MIN_PAGES = 1;

// ── Shared derivation (page + print use the SAME document) ──────────────────
// Resolves the difficulty plan + deterministic seed + document from the
// session. The seed is seedFrom([effective grade id, spec.id, refresh]) —
// fully deterministic, so the same inputs always yield the same document and
// preview/print can never disagree. The teacher answer key does NOT change
// the seed or the document — it only changes what renders (inline lines or
// appended key pages), and both surfaces read this one derivation so they can
// never disagree about whether the key exists.
function useWorksheetDocument(spec: WorksheetSpec, config: DashboardFrameworkConfig) {
    const store = useDashboardStore();
    const session = store.session;
    const refresh: number = session.refresh ?? 0;
    const pageCount: number = session.pageCount ?? 1;
    // Teacher answer key: framework session flag, default-off.
    const answerKey = session.answerKey === true;
    const level = session.level ?? 1;

    return useMemo(() => {
        const plan = resolveDifficulty(config.subject, spec.id, level);
        const seed = seedFrom([plan.grade.id, spec.id, refresh]);
        const doc = buildDocument(spec, plan.grade, seed, pageCount);
        // ONE TITLE FORMAT everywhere (revised presentation): "<Label> level
        // <requested>" — the REQUESTED level, shown even when it overshoots
        // the worksheet's own cap (the capped effective level only steers
        // generation, never the displayed number). No grade labels, no
        // tops-out/starts-at text anywhere; the toolbar title, every sheet,
        // the answer-key pages and the print tab title all share this string.
        const title = `${spec.label} level ${plan.level}`;
        // The scope line loses its legacy "<Label> — " prefix: the title now
        // carries the label itself, so the subtitle stays the pure scope.
        const subtitle = spec.scope(plan.grade);
        return {
            plan,
            offered: plan.grade.implemented && spec.offered(plan.grade),
            doc,
            title,
            subtitle,
            answerKey
        };
    }, [spec, config.subject, level, refresh, pageCount, answerKey]);
}

// ── Page assembly shared by preview AND print ────────────────────────────────
// 'pages' style (maths/T8): builds the full page list — worksheet pages
// first, then (when the teacher key is on) AnswerKeySheet pages chunked at
// KEY_PER_PAGE. 'inline' style (english/T5): the worksheet pages only (the
// answers print under each question inside PrintableSheet). Page labels count
// EVERY page of the print job ("Page i of n" with n = worksheet + key pages)
// so the physical sheets can be ordered. Both surfaces call this ONE helper,
// so preview and print can never disagree about whether the key exists.
function buildPageSpecs(doc: WorksheetDocument, answerKey: boolean, style: 'inline' | 'pages'): PageSpec[] {
    const worksheetPages = doc.pages;
    // 'pages' style: flatten document-wide ids and chunk answers onto key pages.
    const keyPages: Problem[][] = [];
    if (answerKey && style === 'pages') {
        const flat = worksheetPages.flat();
        for (let i = 0; i < flat.length; i += KEY_PER_PAGE) keyPages.push(flat.slice(i, i + KEY_PER_PAGE));
    }
    const total = worksheetPages.length + keyPages.length;
    const label = (i: number) => (total > 1 ? `Page ${i + 1} of ${total}` : undefined);
    return [
        ...worksheetPages.map((problems, i) => ({ problems, pageLabel: label(i) })),
        ...keyPages.map((problems, j) => ({
            problems,
            kind: 'key' as const,
            pageLabel: label(worksheetPages.length + j)
        }))
    ];
}

// ── Toolbar surface ──────────────────────────────────────────────────────────
//   - title/subtitle from the effective difficulty plan + label + scope;
//   - unbounded −/n/+ Pages stepper (typed or incremented, min 1, no max);
//   - Randomize re-rolls the seed in place (page count preserved);
//   - Print opens the browser-NATIVE print dialog via window.print(), with
//     the tab retitled to the worksheet title while it is open;
//   - the teacher answer-key toggle flips the session flag (inline style
//     prints answers under each question; pages style appends key pages).
function createToolbar(spec: WorksheetSpec, config: DashboardFrameworkConfig) {
    function WorksheetToolbar() {
        const store = useDashboardStore();
        const { session } = store;

        const { plan, offered, title, subtitle } = useWorksheetDocument(spec, config);
        // Empty-page-count sentinel: when the current selection produces no
        // document (level below the worksheet's intro level), the controls
        // are dimmed and inert.
        const hasProblems = offered;
        const pageCount: number = session.pageCount ?? 1;

        // "Randomize": re-roll the seed. The document is regenerated IN PLACE —
        // the page count is preserved, so it can randomly become as many pages
        // as the stepper currently says (1..n), not "one new sheet".
        const randomize = () => {
            if (!hasProblems) return;
            session.refresh = (session.refresh ?? 0) + 1;
        };

        // Print: open the browser-NATIVE print dialog immediately from the
        // normal content view. The hidden .print-doc tree (rendered by the
        // print surface) is what the browser paginates: one A4 block per page.
        // While the dialog is open the tab is retitled to the worksheet title
        // so a PDF saved from it is named after the sheet; window.print()
        // blocks until the dialog closes, which is when the previous title is
        // restored.
        const doPrint = () => {
            if (!hasProblems) return;
            const previous = document.title;
            document.title = title;
            window.print(); // native print dialog
            document.title = previous;
        };

        // Teacher answer-key toggle: flips session.answerKey — a VIEW setting
        // (it stays live even when the current selection has no document).
        // data-testid differs per rendering model so both source suites'
        // selectors keep working: pages style → "toolbar-answers" (maths
        // tests), inline style → "toolbar-answer-key" (english tests).
        const answerKeyOn = session.answerKey === true;
        const toggleAnswers = () => {
            session.answerKey = !answerKeyOn;
        };

        // Stepper handlers: decrement never drops below MIN_PAGES; increment
        // has no upper bound, so the page count can keep growing.
        const decreasePages = () => {
            if (hasProblems) session.pageCount = Math.max(MIN_PAGES, pageCount - 1);
        };
        const increasePages = () => {
            if (hasProblems) session.pageCount = pageCount + 1;
        };
        // Typing a new page count: empty input is tolerated (cleared while
        // editing) and invalid text snaps back to MIN_PAGES on the next change.
        const onPagesInput = (raw: string) => {
            if (!hasProblems) return;
            if (raw === '') return;
            const n = Number.parseInt(raw, 10);
            if (!Number.isNaN(n)) session.pageCount = Math.max(MIN_PAGES, n);
            else session.pageCount = MIN_PAGES;
        };
        // If the field was left empty / invalid on blur, normalise to MIN_PAGES.
        const onPagesBlur = () => {
            if (hasProblems && pageCount < MIN_PAGES) session.pageCount = MIN_PAGES;
        };

        return (
            <>
                {/* Identity block: title + subtitle. data-testid on the title
                    lets tests target it specifically, since the same title
                    string also appears on every A4 preview. */}
                <ToolbarId>
                    <ToolbarTitle data-testid="toolbar-title">{title}</ToolbarTitle>
                    {hasProblems && <ToolbarSub>{subtitle}</ToolbarSub>}
                </ToolbarId>
                {/* Controls block: the framework card frames these two blocks
                    with justify-content: space-between (title left, controls
                    right). */}
                <ToolbarControls>
                    <PagesLabel>Pages</PagesLabel>
                    {/* Unbounded −/n/+ stepper: page count is a number that
                        increments, not a fixed set of toggle options. */}
                    <PageStepper role="group" aria-label="Number of pages" data-testid="page-stepper">
                        <PageStepButton
                            aria-label="Decrease pages"
                            dimmed={!hasProblems}
                            atMin={pageCount <= MIN_PAGES}
                            aria-disabled={!hasProblems || pageCount <= MIN_PAGES || undefined}
                            onClick={decreasePages}
                        >
                            &minus;
                        </PageStepButton>
                        <PageInput
                            type="number"
                            min={MIN_PAGES}
                            value={pageCount}
                            aria-label="Page count"
                            data-testid="page-count"
                            onChange={(e) => onPagesInput(e.target.value)}
                            onBlur={onPagesBlur}
                        />
                        <PageStepButton
                            aria-label="Increase pages"
                            dimmed={!hasProblems}
                            atMin={false}
                            aria-disabled={!hasProblems || undefined}
                            onClick={increasePages}
                        >
                            +
                        </PageStepButton>
                    </PageStepper>
                    <GhostButton
                        dimmed={!hasProblems}
                        aria-disabled={!hasProblems || undefined}
                        data-testid="toolbar-randomize"
                        onClick={randomize}
                    >
                        Randomize
                    </GhostButton>
                    {/* Teacher answer-key toggle: aria-pressed mirrors the
                        session flag. Both source test selectors keep working
                        (data-testid + data-answer-toggle). */}
                    <GhostButton
                        dimmed={false}
                        aria-pressed={answerKeyOn}
                        data-testid={config.answerKeyStyle === 'pages' ? 'toolbar-answers' : 'toolbar-answer-key'}
                        data-answer-toggle="true"
                        onClick={toggleAnswers}
                    >
                        {config.answerKeyStyle === 'pages' ? (answerKeyOn ? 'Answers: On' : 'Answers: Off') : 'Answer key'}
                    </GhostButton>
                    <PrimaryButton
                        dimmed={!hasProblems}
                        aria-disabled={!hasProblems || undefined}
                        data-testid="toolbar-print"
                        onClick={doPrint}
                    >
                        Print
                    </PrimaryButton>
                </ToolbarControls>
            </>
        );
    }
    return WorksheetToolbar;
}

// ── Page surface (the canvas) ────────────────────────────────────────────────
// Resolves the difficulty plan + document from the shared session, renders
// the continuous A4 preview stack (PageStack) + zoom dock, or the empty state
// when the selection has no content at this level.
//
// The empty state is GENERIC for every empty case: the canvas cannot know
// whether the level or the selection is at fault, so it renders one honest
// card (the plan's intro level is announced in the hint when the level is
// below the worksheet's first offered level).
//
// NOTE: the PRINT tree is deliberately NOT rendered here. The canvas lives
// inside .app-chrome, which @media print hides wholesale (app.css) — the
// framework mounts the plugin's print surface OUTSIDE that shell instead.
function createPage(spec: WorksheetSpec, config: DashboardFrameworkConfig) {
    function WorksheetPage() {
        const { plan, offered, doc, title, subtitle, answerKey } = useWorksheetDocument(spec, config);
        const session = useDashboardStore().session;

        // Page list annotated with "Page i of n" labels (multi-page only),
        // plus the teacher-key pages when the style is 'pages' and the flag
        // is on. One PageSpec list is consumed by every rendering surface.
        const pageSpecs = buildPageSpecs(doc, answerKey, config.answerKeyStyle);
        const hasProblems = doc.pages.length > 0;
        const zoom: ZoomMode = session.zoom ?? 'fit';

        return (
            <>
                {!hasProblems ? (
                    <EmptyState data-testid="empty-state">
                        <EmptyCard>
                            <EmptyIcon aria-hidden="true">{config.emptyGlyph}</EmptyIcon>
                            {/* One GENERIC empty message for every empty case
                                (revised presentation: no intro-level /
                                starts-at messaging — the plan's notYetOffered
                                state renders the same honest card). */}
                            <EmptyTitle>No worksheets for this selection yet</EmptyTitle>
                            <EmptyHint>{config.emptyHint}</EmptyHint>
                        </EmptyCard>
                    </EmptyState>
                ) : (
                    <PageStack
                        title={title}
                        subtitle={subtitle}
                        pages={pageSpecs}
                        zoom={zoom}
                        single={spec.singleColumn}
                        brand={config.printBrand}
                        answerKey={config.answerKeyStyle === 'inline' ? answerKey : false}
                        density={config.density}
                        testId="sheet-preview"
                        pageTestId="sheet-preview-page"
                    />
                )}
                {/* The floating zoom dock belongs to the preview canvas (its
                    pages are what the native print dialog will show), so it
                    stays up whenever a sheet exists. */}
                {hasProblems && (
                    <ZoomDock>
                        <ZoomControl
                            label="Preview zoom"
                            value={zoom}
                            onChange={(m) => {
                                session.zoom = m;
                            }}
                        />
                    </ZoomDock>
                )}
            </>
        );
    }
    return WorksheetPage;
}

// ── Print surface ────────────────────────────────────────────────────────────
// Renders the screen-hidden .print-doc tree: one exact A4 block per worksheet
// page, which @media print (app.css) reveals and window.print() paginates —
// a 3-page document prints as 3 physical sheets, each page breaking via the
// .print-page rules.
//
// WHY A SEPARATE SURFACE (not part of the page): the framework mounts the
// print surface OUTSIDE the interactive shell (.app-chrome), because print
// media hides that shell wholesale. It intentionally derives from the SAME
// session + seed + buildDocument as the page, so the printed pages are
// byte-identical to the preview.
function createPrint(spec: WorksheetSpec, config: DashboardFrameworkConfig) {
    function WorksheetPrint() {
        const { doc, title, subtitle, answerKey } = useWorksheetDocument(spec, config);

        // The SAME page list the preview shows — worksheet pages plus the
        // teacher-key pages when the style is 'pages' and the flag is on —
        // so the native dialog emits exactly what is on screen (one
        // .print-page block per sheet).
        const pageSpecs = buildPageSpecs(doc, answerKey, config.answerKeyStyle);

        // Empty selection => nothing to print (the preview shows the empty
        // state; the toolbar's Print button is dimmed and inert for the same
        // reason).
        if (pageSpecs.length === 0) return null;

        return (
            // Screen-hidden print tree: the ONLY thing window.print() emits
            // (@media print hides .app-chrome, reveals this — app.css).
            <div className="print-doc" aria-hidden="true">
                {pageSpecs.map((page, i) => (
                    <div className="print-page" key={i}>
                        {page.kind === 'key' ? (
                            <AnswerKeySheet title={title} entries={page.problems} pageLabel={page.pageLabel} />
                        ) : (
                            <PrintableSheet
                                title={title}
                                subtitle={subtitle}
                                problems={page.problems}
                                pageLabel={page.pageLabel}
                                single={spec.singleColumn}
                                brand={config.printBrand}
                                answerKey={config.answerKeyStyle === 'inline' ? answerKey : false}
                                density={config.density}
                            />
                        )}
                    </div>
                ))}
            </div>
        );
    }
    return WorksheetPrint;
}

// ── The recipe ───────────────────────────────────────────────────────────────
// Assemble the full plugin from a worksheet spec: one picker entry (the
// plugin's own label), the subject stamp, level gating, and the three
// surfaces. The framework instance's config supplies the subject-specific
// chrome bits.
export function createWorksheet(spec: WorksheetSpec, config: DashboardFrameworkConfig): DashboardPlugin {
    return definePlugin({
        id: spec.id,
        name: `${spec.label} Worksheet`,
        // THE PICKER LABEL: one entry, the plugin's own.
        entries: [{ id: spec.id, label: spec.label, icon: spec.icon, ariaLabel: spec.label }],
        // The subject stamp drives the picker's per-subject listing and the
        // subject reconciliation when the rail switches subjects.
        subject: config.subject,
        // Level gating straight from the spec — the framework dims/hides the
        // worksheet (and shows the empty state) for levels that don't offer it.
        isOffered: spec.offered,
        toolbar: createToolbar(spec, config),
        page: createPage(spec, config),
        print: createPrint(spec, config)
    });
}

// ── Styled components (framework chrome, shared by all worksheets) ──────────

// Toolbar identity block (title + subtitle).
const ToolbarId = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0
});

const ToolbarTitle = styledComponent('div', {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--app-fg)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
});

const ToolbarSub = styledComponent('div', {
    fontSize: '12px',
    color: 'var(--muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
});

// Right-hand controls cluster.
const ToolbarControls = styledComponent('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
});

const PagesLabel = styledComponent('span', {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--faint)'
});

// − / + stepper pill holding the two arrows and the value between them.
const PageStepper = styledComponent('div', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    padding: '3px',
    borderRadius: '10px',
    background: 'var(--pill-bg)',
    border: '1px solid var(--hairline)',
    flexShrink: 0
});

// `dimmed` is a styledComponent custom prop (HTMLAttributes has no
// `disabled`), mirrored onto aria-disabled + a guarded onClick.
const PageStepButton = styledComponent<{ dimmed: boolean; atMin: boolean }>('button', {
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 700,
    lineHeight: 1,
    flexShrink: 0,
    cursor: ({ dimmed, atMin }) => (dimmed || atMin ? 'default' : 'pointer'),
    background: 'transparent',
    color: ({ dimmed }) => (dimmed ? 'var(--dim-fg)' : 'var(--control-fg)'),
    opacity: ({ dimmed, atMin }) => (dimmed || atMin ? 0.5 : 1)
});

// The page count, editable by typing. styledComponent's typed surface is
// HTMLAttributes<HTMLElement> (no `type`/input-event props), so cast to the
// InputHTMLAttributes surface (TwoColumnDashboard pattern in @reloaded/headless).
const PageInput = styledComponent('input', {
    width: '48px',
    height: '28px',
    border: 'none',
    borderRadius: '8px',
    background: 'var(--surface-input)',
    color: 'var(--app-fg)',
    fontSize: '13px',
    fontWeight: 700,
    textAlign: 'center',
    boxSizing: 'border-box',
    padding: '0 4px',
    outline: 'none',
    boxShadow: 'var(--shadow-input)'
}) as unknown as React.ForwardRefExoticComponent<
    React.InputHTMLAttributes<HTMLInputElement> & {
        theme?: any;
        [breakpoint: string]: any;
    }
>;

const GhostButton = styledComponent<{ dimmed: boolean }>('button', {
    padding: '7px 14px',
    borderRadius: '9px',
    border: '1px solid var(--hairline)',
    background: 'var(--surface)',
    color: 'var(--control-fg)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: ({ dimmed }) => (dimmed ? 'default' : 'pointer'),
    flexShrink: 0,
    opacity: ({ dimmed }) => (dimmed ? 0.55 : 1),
    transition: 'background 0.12s ease, border-color 0.12s ease'
});

const PrimaryButton = styledComponent<{ dimmed: boolean }>('button', {
    padding: '7px 18px',
    borderRadius: '9px',
    border: 'none',
    background: 'var(--primary)',
    // The PAIRED label token: white on the light teal, deep teal-black on the
    // dark bright turquoise (white-on-turquoise was ~1.9:1 in dark mode).
    color: 'var(--on-primary)',
    fontSize: '13px',
    fontWeight: 700,
    cursor: ({ dimmed }) => (dimmed ? 'default' : 'pointer'),
    flexShrink: 0,
    boxShadow: ({ dimmed }) => (dimmed ? 'none' : '0 2px 8px var(--primary-shadow)'),
    opacity: ({ dimmed }) => (dimmed ? 0.55 : 1)
});

// Empty state reserves real space with min-height so the placeholder is
// comfortably visible inside the canvas.
const EmptyState = styledComponent('div', {
    width: '100%',
    minHeight: '50vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    boxSizing: 'border-box'
});

const EmptyCard = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '32px 40px',
    background: 'var(--surface)',
    border: '1px solid var(--hairline)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-card-lg)',
    textAlign: 'center'
});

const EmptyIcon = styledComponent('div', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'var(--active-fill)',
    color: 'var(--primary)',
    fontSize: '24px',
    marginBottom: '6px'
});

const EmptyTitle = styledComponent('div', {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--app-fg)'
});

const EmptyHint = styledComponent('div', {
    fontSize: '13px',
    color: 'var(--muted)'
});

// The zoom dock is pinned to the WINDOW (position:fixed), not to the canvas:
// with continuous document scrolling a canvas-anchored dock would scroll away
// off-screen after a few pages, but a fixed dock stays reachable at any
// scroll position.
const ZoomDock = styledComponent('div', {
    position: 'fixed',
    right: '14px',
    bottom: '14px',
    zIndex: 50
});
