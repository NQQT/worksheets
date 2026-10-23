// Plugin composition / isolation / real-registration integration tests —
// adapted from the maths distribution's plugins.test.tsx to the merged
// framework:
//
//   * plugins carry a `subject` stamp (from their bundle) — the picker lists
//     by subject; the level system replaced the grade selector, so every
//     legacy grade N is exercised as level N+1 (framework/difficulty.ts maps
//     level → legacy grade id; the generation seed uses the legacy grade id,
//     so the pinned sheet CONTENT is unchanged);
//   * the sidebar rail became the subject rail + worksheet picker; this
//     harness renders the picker's option list directly (all plugins of the
//     subject, in registration order — the picker does not filter by level;
//     level gating renders as the page's empty state instead);
//   * the teacher answer key flag is part of the default session (false).

import React from 'react';
import { arrayCreate } from '@presource/core';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import {
    DashboardContextProvider,
    useDashboardStore,
    usePluginRegistry,
    PluginHeaderHost,
    PluginToolbarHost,
    PluginPageHost,
    ensurePluginSlice,
    forgetPlugin,
    selectEntry,
    buildContext,
    MATH_FRAMEWORK,
    definePlugin,
    type DashboardPlugin,
    type DashboardStoreStructure
} from '../../framework';
import { MATH_WORKSHEETS } from './index';
import { AdditionWorksheet } from './AdditionWorksheet';

afterEach(() => {
    cleanup();
});

// ── Test harness ─────────────────────────────────────────────────────────────
// A minimal host, identical in shape to WorksheetsDashboard, PLUS a store
// probe that captures the live store object for direct helper-level
// assertions (the store is only reachable through the provider's context).
let probeStore: DashboardStoreStructure | null = null;
function StoreProbe() {
    probeStore = useDashboardStore();
    return null;
}

// Local stand-in for the worksheet picker's option list: every plugin's
// entries rendered as buttons in registration order (the real picker filters
// by subject and search text; both are subject-agnostic for this suite).
function WorksheetListHost({ plugins }: { plugins: DashboardPlugin[] }) {
    const store = useDashboardStore();
    return (
        <>
            {plugins.flatMap((plugin) =>
                plugin.entries.map((entry) => {
                    const context = buildContext(store, plugin);
                    const active =
                        store.active.pluginId === plugin.id && store.active.entryId === entry.id;
                    return (
                        <button
                            key={`${plugin.id}:${entry.id}`}
                            aria-label={entry.ariaLabel ?? entry.label}
                            data-active={active || undefined}
                            onClick={() => selectEntry(store, plugin.id, entry.id)}
                        >
                            {entry.label}
                        </button>
                    );
                })
            )}
        </>
    );
}

function TestHost({ plugins }: { plugins: DashboardPlugin[] }) {
    const { plugins: mounted } = usePluginRegistry(plugins);
    return (
        <div>
            {/* Captures the live store for direct assertions below. */}
            <StoreProbe />
            {/* Header slot (worksheet plugins declare none; the framework's
                own level control + picker live in the real host). */}
            <PluginHeaderHost plugins={mounted} />
            <div data-testid="rail-slot">
                <WorksheetListHost plugins={mounted} />
            </div>
            <div data-testid="toolbar-slot">
                <PluginToolbarHost plugins={mounted} />
            </div>
            <div data-testid="page-slot">
                <PluginPageHost plugins={mounted} />
            </div>
        </div>
    );
}

// A throwaway plugin factory: N entries; the page prints pluginId:entryId so
// assertions can see WHO is rendering; the toolbar bumps a slice counter.
function makePlugin(id: string, entryIds: string[]): DashboardPlugin {
    return definePlugin({
        id,
        name: `Test ${id}`,
        subject: 'math',
        entries: entryIds.map((e) => ({ id: e, label: `${id}-${e}`, icon: '*' })),
        initialStore: { counter: 0 },
        toolbar: ({ context }) => (
            <button
                data-testid={`${id}-bump`}
                onClick={() => {
                    context.store.counter = (context.store.counter ?? 0) + 1;
                }}
            >
                {`${id} toolbar (${context.store.counter ?? 0})`}
            </button>
        ),
        page: ({ context }) => (
            <div data-testid={`${id}-page`}>{`${context.pluginId}:${context.entryId}`}</div>
        )
    });
}

// Render helper: mounts the harness with the given plugin list and returns
// the RTL rerender function (for simulating plugin-list changes).
function mountHost(plugins: DashboardPlugin[]) {
    return render(
        <DashboardContextProvider>
            <TestHost plugins={plugins} />
        </DashboardContextProvider>
    );
}

describe('plugin composition — multiple plugins merge into one dashboard', () => {
    it('lists entries of ALL plugins in registration order and activates the first', () => {
        const alpha = makePlugin('alpha', ['a1', 'a2']);
        const beta = makePlugin('beta', ['b1']);

        mountHost([alpha, beta]);

        // The picker option list: alpha's entries, then beta's, in order.
        const rail = screen.getByTestId('rail-slot');
        const labels = Array.from(rail.querySelectorAll('button')).map(
            (b) => b.textContent ?? ''
        );
        expect(labels).toEqual(['alpha-a1', 'alpha-a2', 'beta-b1']);

        // Default selection: the FIRST plugin's FIRST entry; its page shows.
        expect(screen.getByTestId('alpha-page').textContent).toBe('alpha:a1');
        expect(screen.queryByTestId('beta-page')).toBeNull();
    });

    it("selecting another plugin's entry swaps the page and toolbar slots", () => {
        const alpha = makePlugin('alpha', ['a1', 'a2']);
        const beta = makePlugin('beta', ['b1']);

        mountHost([alpha, beta]);

        // Click beta's entry: beta's page takes over, alpha's unmounts.
        fireEvent.click(screen.getByRole('button', { name: 'beta-b1' }));
        expect(screen.getByTestId('beta-page').textContent).toBe('beta:b1');
        expect(screen.queryByTestId('alpha-page')).toBeNull();
        // The toolbar swaps to beta's toolbar too.
        expect(screen.getByTestId('beta-bump')).toBeDefined();

        // And back: alpha's first entry restores alpha's page.
        fireEvent.click(screen.getByRole('button', { name: 'alpha-a1' }));
        expect(screen.getByTestId('alpha-page').textContent).toBe('alpha:a1');
    });
});

describe('plugin state isolation — slices are namespaced and independent', () => {
    it("mutating one plugin's store never touches another plugin's slice", () => {
        const alpha = makePlugin('alpha', ['a1']);
        const beta = makePlugin('beta', ['b1']);

        mountHost([alpha, beta]);

        // Both plugins mounted with pristine slices (probe saw the store).
        expect(probeStore!.plugins.alpha).toEqual({ counter: 0 });
        expect(probeStore!.plugins.beta).toEqual({ counter: 0 });

        // Bump alpha's counter 3 times via its own toolbar.
        fireEvent.click(screen.getByTestId('alpha-bump'));
        fireEvent.click(screen.getByTestId('alpha-bump'));
        fireEvent.click(screen.getByTestId('alpha-bump'));
        expect(screen.getByTestId('alpha-bump').textContent).toBe('alpha toolbar (3)');

        // Switch to beta: its counter is still its own initial 0 — alpha's
        // mutations never leaked across the namespace boundary.
        fireEvent.click(screen.getByRole('button', { name: 'beta-b1' }));
        expect(screen.getByTestId('beta-bump').textContent).toBe('beta toolbar (0)');
        // Switch back: alpha's counter survived the round trip (unmounting
        // its PAGE does not unmount its SLICE).
        fireEvent.click(screen.getByRole('button', { name: 'alpha-a1' }));
        expect(screen.getByTestId('alpha-bump').textContent).toBe('alpha toolbar (3)');
    });

    it('the dashboard session is framework-level state, separate from plugin slices', () => {
        mountHost([]);

        const store = probeStore!;

        // The framework session starts at level 2 (= Grade 1 — the content
        // both source apps opened on), with the answer key OFF.
        expect(store.session).toEqual({ level: 2, pageCount: 1, zoom: 'fit', refresh: 0, answerKey: false });

        // Session mutations never touch plugin slices...
        store.session.level = 3;
        store.session.pageCount = 3;
        expect(store.plugins).toEqual({});

        // ...and plugin slices never touch the session.
        ensurePluginSlice(store, 'alpha', { counter: 0 });
        store.plugins.alpha.counter = 7;
        expect(store.session).toEqual({ level: 3, pageCount: 3, zoom: 'fit', refresh: 0, answerKey: false });
    });

    it('store helpers namespace slices by plugin id and delete cleanly', () => {
        mountHost([]);

        const store = probeStore!;

        // Register two slices, mutate one, verify the other is untouched.
        ensurePluginSlice(store, 'alpha', { counter: 0 });
        ensurePluginSlice(store, 'beta', { counter: 0 });
        store.plugins.alpha.counter = 7;
        expect(store.plugins.beta.counter).toBe(0);
        expect(store.plugins.alpha.counter).toBe(7);

        // ensurePluginSlice is idempotent and NEVER clobbers live state.
        ensurePluginSlice(store, 'alpha', { counter: 99 });
        expect(store.plugins.alpha.counter).toBe(7);

        // Deleting alpha leaves beta fully intact — no residue.
        forgetPlugin(store, 'alpha');
        expect(store.plugins.alpha).toBeUndefined();
        expect(store.plugins.beta.counter).toBe(0);

        // Deleting the ACTIVE plugin clears the selection with it.
        selectEntry(store, 'beta', 'b1');
        expect(store.active).toEqual({ pluginId: 'beta', entryId: 'b1' });
        forgetPlugin(store, 'beta');
        expect(store.active).toEqual({ pluginId: '', entryId: '' });
        expect(store.plugins.beta).toBeUndefined();
    });
});

describe('plugin deletion — the dashboard survives and falls back', () => {
    it('a stale selection pointing at a removed plugin snaps to the first remaining one', async () => {
        const alpha = makePlugin('alpha', ['a1']);
        const beta = makePlugin('beta', ['b1']);

        // Mount with BOTH plugins, select beta, then re-render the host with
        // ONLY alpha (simulating "beta was deleted from the plugin list").
        const { rerender } = mountHost([alpha, beta]);
        fireEvent.click(screen.getByRole('button', { name: 'beta-b1' }));
        expect(screen.getByTestId('beta-page')).toBeDefined();

        rerender(
            <DashboardContextProvider>
                <TestHost plugins={[alpha]} />
            </DashboardContextProvider>
        );

        // The registry fallback selects alpha's first entry — no crash, no
        // blank canvas, no reference to beta anywhere in the DOM.
        await waitFor(() => {
            expect(screen.getByTestId('alpha-page').textContent).toBe('alpha:a1');
        });
        expect(screen.queryByTestId('beta-page')).toBeNull();
        expect(screen.queryByTestId('beta-bump')).toBeNull();
        expect(screen.queryByRole('button', { name: 'beta-b1' })).toBeNull();
        // And beta's slice is GONE from the store (forgetPlugin on teardown).
        expect(probeStore!.plugins.beta).toBeUndefined();
    });

    it('an empty plugin list renders nothing in any slot (all plugins deleted)', () => {
        mountHost([]);

        // No picker options, no toolbar content, no page content.
        expect(screen.getByTestId('rail-slot').querySelectorAll('button')).toHaveLength(0);
        expect(screen.getByTestId('toolbar-slot').textContent).toBe('');
        expect(screen.getByTestId('page-slot').textContent).toBe('');
    });
});

// ── The real worksheet plugins ───────────────────────────────────────────────
// One plugin per worksheet type. MATH_WORKSHEETS stores UNINVOKED
// registrations (the dashboard loads them one by one AFTER it has rendered —
// framework/loader.ts), so this suite builds the list the same way the loader
// does: by calling each factory with its bundle.

const EXPECTED_WORKSHEET_IDS = [
    'addition',
    'subtraction',
    'mult',
    'missing',
    'comparison',
    'skip',
    'word',
    'counting',
    // Rows & Columns (the level-2/3 multiplication-foundation grid sheet) sits
    // with the counting cluster and stays ahead of Data (the level-2 picker
    // listing's last sheet).
    'rowscolumns',
    'doubles',
    'bonds',
    'patterns',
    'shapes',
    'transformations',
    'compass',
    'time',
    'clock',
    'measure',
    'temperature',
    'placevalue',
    'data',
    'division',
    'money',
    // T4 expansion cluster — appended after Money so every earlier position
    // is unchanged.
    'fractions',
    'decimals',
    'percent',
    'multidiv',
    'perimeterarea',
    'metricconv',
    'statistics',
    'probability',
    'algebra',
    // The six senior families (independent difficulty ladders) — appended
    // after the T4 cluster; listing order = catalogue order.
    'calculus',
    'functions',
    'polynomials',
    'trigonometry',
    'expolog',
    'prob11'
];

// The plugin list, built through the same pipeline usePluginLoader uses.
const WORKSHEETS: DashboardPlugin[] = MATH_WORKSHEETS.map((r) => r.factory(r.framework));

describe('the real worksheet plugins — register through the same pipeline', () => {
    it('is the installed plugin list: one plugin per worksheet type, in catalogue order', () => {
        // MATH_WORKSHEETS is the ordered list of UNINVOKED registrations...
        expect(MATH_WORKSHEETS).toHaveLength(EXPECTED_WORKSHEET_IDS.length);
        for (const reg of MATH_WORKSHEETS) {
            expect(typeof reg.factory).toBe('function');
            expect(reg.framework.config.subject).toBe('math');
        }
        // ...which produce the plugins in catalogue order when loaded.
        expect(WORKSHEETS.map((p) => p.id)).toEqual(EXPECTED_WORKSHEET_IDS);
        // Every registration loads against the math bundle, so every plugin
        // carries the math subject stamp (the picker groups by it).
        for (const plugin of WORKSHEETS) {
            expect(plugin.subject).toBe('math');
            expect(plugin.entries).toHaveLength(1);
            expect(plugin.entries[0].id).toBe(plugin.id);
        }
    });

    it('mounts with the shared dashboard session and previews Addition by default', () => {
        mountHost(WORKSHEETS);

        // The framework session starts on level 2 (Grade 1), 1 page, fit zoom.
        expect(probeStore!.session).toEqual({ level: 2, pageCount: 1, zoom: 'fit', refresh: 0, answerKey: false });

        // Default selection: the first plugin (Addition) — its page renders
        // the level-2 addition preview (pinned first row "4 + 16 ="; the
        // level→grade seed mapping keeps the legacy Year-1 content).
        expect(screen.getByTestId('sheet-preview-page1').textContent).toContain('1.4 + 16 =');
    });

    it('level-gates the page: level 2 shows the empty state for Multiplication, level 3 generates', () => {
        mountHost(WORKSHEETS);

        // Level 2 (= legacy Year 1): Multiplication is listed in the picker
        // but NOT offered — selecting it shows the GENERIC empty state
        // (revised presentation: no intro-level / starts-at messaging).
        fireEvent.click(screen.getByRole('button', { name: 'Multiplication' }));
        expect(screen.getByTestId('empty-state')).toBeDefined();
        expect(screen.getByTestId('empty-state').textContent).not.toContain('starts at level');
        expect(screen.queryByTestId('sheet-preview-page1')).toBeNull();

        // The level stepper writes store.session.level; the same write path
        // re-derives every plugin's caps. (The store mutation is wrapped in
        // act() so React flushes the re-render before the assertion.)
        act(() => {
            probeStore!.session.level = 3;
        });
        // Level 3 (= legacy Year 2): the SAME selection now generates.
        expect(screen.getByTestId('sheet-preview-page1')).toBeDefined();
        expect(screen.queryByTestId('empty-state')).toBeNull();
    });

    it('the senior families scale independently: full content at level 3 with the honest level label', () => {
        mountHost(WORKSHEETS);
        // Level 12 far overshoots the senior ladder — the difficulty adapter
        // clamps to the FULL rung (3), so the sheet is the complete legacy
        // Year-11 scope. The TITLE keeps the requested level (no grade or
        // rung labels anywhere).
        act(() => {
            probeStore!.session.level = 12;
        });
        fireEvent.click(screen.getByRole('button', { name: 'Calculus' }));
        expect(probeStore!.active).toEqual({ pluginId: 'calculus', entryId: 'calculus' });
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Calculus level 12');
        // The preview renders the deterministic senior sheet (pinned content
        // lives in CalculusWorksheet.test.ts; here we pin the composed page).
        expect(screen.getByTestId('sheet-preview-page1').textContent).toContain('average rate of change');
    });

    it('level 4 offers the arithmetic ladder plus five T4 strands; level 5 gets its own ten', () => {
        mountHost(WORKSHEETS);
        act(() => {
            probeStore!.session.level = 4;
        });
        // Level 4 = legacy Year 3: the transformations diagram sheet is
        // offered here (its only rung).
        fireEvent.click(screen.getByRole('button', { name: 'Shape Transformations' }));
        expect(probeStore!.active).toEqual({ pluginId: 'transformations', entryId: 'transformations' });
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Shape Transformations level 4');

        // Level 5 = legacy Year 4: Addition stays offered (ladder sheet).
        act(() => {
            probeStore!.session.level = 5;
        });
        fireEvent.click(screen.getByRole('button', { name: 'Addition' }));
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Addition level 5');
    });

    it('Shape Transformations renders one original and four neutral lettered choices per item', () => {
        mountHost(WORKSHEETS);
        act(() => {
            probeStore!.session.level = 4;
        });
        fireEvent.click(screen.getByRole('button', { name: 'Shape Transformations' }));
        const page = screen.getByTestId('sheet-preview-page1');
        const images = page.querySelectorAll('svg');
        // Exact names identify geometry, not which letter is correct. The
        // plugin's full vertex/answer pins live in its adjacent unit tests.
        expect(images.length).toBe(25);
        expect(arrayCreate(({ index }) => images[index]?.getAttribute('aria-label'))).toEqual([
            'Original pentagon 4', 'Option A', 'Option B', 'Option C', 'Option D',
            'Original triangle 1', 'Option A', 'Option B', 'Option C', 'Option D',
            'Original L-shape 1', 'Option A', 'Option B', 'Option C', 'Option D',
            'Original pentagon 1', 'Option A', 'Option B', 'Option C', 'Option D',
            'Original L-shape 4', 'Option A', 'Option B', 'Option C', 'Option D'
        ]);
        const guides = page.querySelectorAll('line, circle');
        expect(arrayCreate(({ index }) => guides[index]?.tagName)).toEqual(['line', 'line', 'circle', 'line', 'line']);
    });

    it('worksheet plugins share the dashboard session (page count persists across worksheets)', () => {
        mountHost(WORKSHEETS);

        // Set 3 pages while Addition is active, then switch to Subtraction:
        // the page count lives in the framework session, not in either plugin.
        fireEvent.change(screen.getByTestId('page-count'), { target: { value: '3' } });
        fireEvent.click(screen.getByRole('button', { name: 'Subtraction' }));
        expect((screen.getByTestId('page-count') as HTMLInputElement).value).toBe('3');
        expect(screen.getByTestId('sheet-preview-page3')).toBeDefined();
    });

    it('Rows & Columns joins the level-2/3 counting list, renders six grids, and saturates above level 3', () => {
        mountHost(WORKSHEETS);
        const rail = screen.getByTestId('rail-slot');
        const railLabels = () =>
            arrayCreate(({ index }) => rail.querySelectorAll('button')[index]?.getAttribute('aria-label'));

        // The default level 2: the entry sits right after Counting & Numbers
        // (counting cluster) — the picker keeps catalogue order.
        expect(railLabels().indexOf('Rows & Columns')).toBe(railLabels().indexOf('Counting & Numbers') + 1);
        fireEvent.click(screen.getByRole('button', { name: 'Rows & Columns' }));
        expect(probeStore!.active).toEqual({ pluginId: 'rowscolumns', entryId: 'rowscolumns' });
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Rows & Columns level 2');
        // Six illustrated items: one neutral grid SVG per question, no
        // printed answers (the prompts alone carry the question text).
        expect(screen.getByTestId('sheet-preview-page1').querySelectorAll('svg')).toHaveLength(6);

        // Level 3 (= legacy Year 2) widens the same entry to 5 × 5 grids +
        // product forms: the seed at grade 2 produces DIFFERENT content.
        const level2Text = screen.getByTestId('sheet-preview-page1').textContent;
        act(() => {
            probeStore!.session.level = 3;
        });
        const level3Text = screen.getByTestId('sheet-preview-page1').textContent;
        expect(level3Text).not.toBe(level2Text);

        // Level 4+ SATURATES (rowscolumns tops out at level 3): the content
        // returns to the level-3 sheet — an oversized level never changes it
        // (the printed title legitimately differs: it keeps the REQUESTED
        // level; saturation is silent). The title shows the requested 99.
        act(() => {
            probeStore!.session.level = 99;
        });
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Rows & Columns level 99');
        expect(
            screen.getByTestId('sheet-preview-page1').textContent!.replace('Rows & Columns level 99', '')
        ).toBe(level3Text.replace('Rows & Columns level 3', ''));
    });

    it('Clock Faces renders an SVG analog clock per clock item on the preview (level 3)', () => {
        mountHost(WORKSHEETS);

        // The Clock Faces entry is level-3-only (clockCap gate at legacy
        // Year 2) — at level 2 it shows the empty state, at level 3 it
        // generates.
        fireEvent.click(screen.getByRole('button', { name: 'Clock Faces' }));
        expect(screen.getByTestId('empty-state')).toBeDefined();
        act(() => {
            probeStore!.session.level = 3;
        });

        // The pinned level-3 sheet has 6 problems, 2 of which carry a clock
        // figure (both READING items — the seed deals no draw item on page 1;
        // the 4 conversions are pure text). Every face carries 12 tick
        // <line>s; hands add 2 more (hour hand strokeWidth 3.5) — so exactly
        // 2 drawn faces and no blank faces.
        const page = screen.getByTestId('sheet-preview-page1');
        const svgs = Array.from(page.querySelectorAll('svg'));
        expect(svgs).toHaveLength(2);
        const hasHourHand = (svg: Element) =>
            Array.from(svg.querySelectorAll('line')).some((l) => l.getAttribute('stroke-width') === '3.5');
        expect(svgs.filter((svg) => !hasHourHand(svg))).toHaveLength(0);
        expect(svgs.filter(hasHourHand)).toHaveLength(2);
    });
});

// The AdditionWorksheet factory itself satisfies the full contract shape (the
// framework pipeline above exercises it; this pins the declarative surface).
describe('worksheet plugin factory — declarative contract', () => {
    it('AdditionWorksheet takes the math bundle and describes its own picker entry', () => {
        const plugin = AdditionWorksheet(MATH_FRAMEWORK);
        expect(plugin.id).toBe('addition');
        expect(plugin.name).toBe('Addition Worksheet');
        expect(plugin.subject).toBe('math');
        expect(plugin.entries).toEqual([
            { id: 'addition', label: 'Addition', icon: '+', ariaLabel: 'Addition' }
        ]);
        // Its content surfaces are wired (toolbar/page/print) and it is
        // offered on level 2 (the framework's default level).
        expect(plugin.toolbar).toBeDefined();
        expect(plugin.page).toBeDefined();
        expect(plugin.print).toBeDefined();
        expect(plugin.isOffered).toBeDefined();
    });
});
