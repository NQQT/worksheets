// ─────────────────────────────────────────────────────────────────────────────
// The Worksheets dashboard — a THIN framework HOST over the merged framework.
//
// The dashboard is the FRAMEWORK: it contains no exercise logic. It owns:
//   - the app shell (header bar, body layout, sticky positioning, canvas);
//   - the SUBJECT rail (Math, English, Chemistry, Physic — the four slots,
//     driven by the SUBJECTS metadata, never a hardcoded worksheet switch);
//   - the header controls: theme selector, LEVEL control (the difficulty
//     stepper that replaced both grade selectors) and the searchable
//     worksheet picker (R2) on the right;
//   - mounting points for the worksheet plugins (header / toolbar / page /
//     print), fed from the registration lists in ../plugins.
//
// Every worksheet is a self-contained plugin under src/plugins/<subject>/ —
// a factory function the dashboard LOADS with its subject's framework bundle.
// Deleting a plugin's file and its line in the subject's index removes the
// worksheet without affecting this framework or any other plugin.
//
// SUBJECT SWITCHING (R2): the active SUBJECT is dashboard-local UI state.
// Switching it reconciles the worksheet selection: the first worksheet of the
// new subject that is OFFERED at the current level becomes active (fallback:
// the subject's first worksheet). The defensive no-plugins empty state
// (toolbar placeholder + slot card) renders only if a subject ever has no
// registered worksheets.
//
// LOADING ORDER: the dashboard renders FIRST (this shell + the first plugin
// — the default worksheet — in the very first paint); the remaining plugins
// are then loaded ONE BY ONE after mount by usePluginLoader
// (framework/loader.ts). The registration list holds factories UNINVOKED.
//
// PRINTING: the normal content view IS the print preview — a worksheet's
// Print button fires the browser-NATIVE print dialog (window.print()); under
// @media print (app.css) this shell (.app-chrome) is hidden and the active
// plugin's hidden .print-doc tree is revealed.
//
// THEME (R4): every colour is a CSS custom property token declared in
// src/app.css (light + dark palettes); framework/ThemeSelector.tsx in the
// header resolves the user's System/Light/Dark choice and flips the
// data-theme attribute that swaps them. The choice persists under the
// package-specific localStorage key '@distribution/worksheets:theme'.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useLayoutEffect, useState } from 'react';
import { styledComponent } from '@presource/react';
import { WORKSHEET_REGISTRATIONS } from '../plugins';
import {
    DASHBOARD_FRAMEWORK,
    DashboardContextProvider,
    usePluginLoader,
    usePluginRegistry,
    LevelControl,
    WorksheetPicker,
    ThemeSelector,
    PluginHeaderHost,
    PluginToolbarHost,
    PluginPageHost,
    PluginPrintHost,
    SUBJECTS,
    getSubject,
    resolveDifficulty,
    selectEntry,
    useDashboardStore,
    type WorksheetSubjectId
} from '../framework';

// ──────────────────────────────────────────────────────────────────────────────
// Framework shell chrome
// ──────────────────────────────────────────────────────────────────────────────

// App root: a normal document box that grows with its content (see app.css).
// The `app-root` class exists so the @media print rules in app.css can target
// exactly this box (defensive un-clip on print).
const AppRoot = styledComponent('div', {
    position: 'relative',
    width: '100%',
    height: 'auto',
    overflow: 'visible',
    background: 'var(--app-bg)',
    color: 'var(--app-fg)'
});

// Top bar: brand mark + title on the left; theme selector, level control and
// the worksheet picker on the right. On xs the bar WRAPS onto stacked rows
// (same mobile-fit contract as the source dashboards); sm+ restores the
// single 64px row the sticky toolbar's top:64px anchor assumes.
const HeaderBar = styledComponent('div', {
    position: 'sticky',
    top: 0,
    zIndex: 30,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: () => ({ xs: 'wrap', sm: 'nowrap' }),
    height: () => ({ xs: 'auto', sm: '64px' }),
    padding: () => ({ xs: '10px 20px', sm: '0 20px' }),
    boxSizing: 'border-box',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--hairline)'
});

// Brand mark: teal gradient chip holding the app glyph.
const BrandMark = styledComponent('div', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    flexShrink: 0,
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #2dd4bf, #0f766e)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 700,
    userSelect: 'none'
});

const AppTitle = styledComponent('h1', {
    fontSize: '17px',
    fontWeight: 800,
    margin: 0,
    color: 'var(--app-fg)',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.01em',
    // On xs the (never-wrapping) title may SHRINK below its text width and
    // clip with an ellipsis instead of pushing the header row past the
    // viewport; sm+ restores the original auto-width title.
    minWidth: () => ({ xs: 0, sm: 'auto' }),
    overflow: () => ({ xs: 'hidden', sm: 'visible' }),
    textOverflow: () => ({ xs: 'ellipsis', sm: 'clip' })
});

const HeaderSpacer = styledComponent('div', {
    flex: 1,
    minWidth: 0
});

// Right-hand header cluster: theme + level + picker, wrapping on xs.
const HeaderControls = styledComponent('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: () => ({ xs: 'wrap', sm: 'nowrap' }),
    minWidth: 0
});

// Body: subject rail (left) + main column (right). Stacks vertically on xs
// (rail becomes a chip strip above the canvas); row layout from sm up.
const Body = styledComponent('div', {
    display: 'flex',
    flexDirection: () => ({ xs: 'column', sm: 'row' }),
    minWidth: 0
});

// Right-hand column: toolbar card, then the canvas. Content-height driven.
const Main = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    boxSizing: 'border-box',
    flex: 1,
    minWidth: 0
});

// Toolbar card frame. position:sticky under the pinned header (sm+) so
// worksheet controls stay reachable while the window scrolls long page stacks.
const ToolbarCard = styledComponent('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    position: () => ({ xs: 'static', sm: 'sticky' }),
    top: '64px',
    zIndex: 20,
    padding: '10px 14px',
    flexShrink: 0,
    boxSizing: 'border-box',
    background: 'var(--surface)',
    border: '1px solid var(--hairline)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-card)'
});

// Left rail frame: the SUBJECT list. From sm up it is position:sticky so it
// pins under the sticky header while the WINDOW scrolls the continuous page
// stack. xs: collapses to a static horizontal chip strip above the canvas.
const Sidebar = styledComponent('div', {
    display: 'flex',
    gap: '6px',
    padding: '16px',
    boxSizing: 'border-box',
    background: 'var(--surface)',
    flexDirection: () => ({ xs: 'row', sm: 'column' }),
    flexWrap: () => ({ xs: 'wrap', sm: 'nowrap' }),
    width: () => ({ xs: '100%', sm: '224px' }),
    alignSelf: 'flex-start',
    position: () => ({ xs: 'static', sm: 'sticky' }),
    top: () => ({ xs: '0px', sm: '64px' }),
    zIndex: 10,
    flexShrink: 0,
    borderRight: () => ({ xs: 'none', sm: '1px solid var(--hairline)' }),
    borderBottom: () => ({ xs: '1px solid var(--hairline)', sm: 'none' })
});

const SidebarHeading = styledComponent('h2', {
    width: () => ({ xs: '100%', sm: 'auto' }),
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--faint)',
    margin: '0 0 6px 0',
    flexShrink: 0
});

// Subject rail button: icon chip + label + worksheet count, tinted when
// active. Mirrors the source rail chrome (theme tokens, theme-aware). The
// ACTIVE chip pairs the --primary fill with its --on-primary glyph token
// (white light / deep teal-black dark — see the theme-contrast regression).
const SubjectButton = styledComponent<{ active: boolean }>('button', {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    flexShrink: 0,
    width: () => ({ xs: 'auto', sm: '100%' }),
    border: ({ active }) => (active ? '1px solid var(--active-ring)' : '1px solid transparent'),
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: ({ active }) => (active ? 600 : 500),
    textAlign: 'left',
    whiteSpace: 'nowrap',
    background: ({ active }) => (active ? 'var(--active-fill)' : 'var(--rail-idle-bg)'),
    color: ({ active }) => (active ? 'var(--active-rail-text)' : 'var(--control-fg)'),
    transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease'
});

const SubjectIcon = styledComponent<{ active: boolean }>('span', {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    flexShrink: 0,
    borderRadius: '9px',
    fontSize: '15px',
    userSelect: 'none',
    background: ({ active }) => (active ? 'var(--primary)' : 'var(--active-fill)'),
    color: ({ active }) => (active ? 'var(--on-primary)' : 'var(--primary)')
});

const SubjectLabel = styledComponent('span', {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis'
});

// Per-subject worksheet count chip (updates as plugins load one by one).
const SubjectCount = styledComponent('span', {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--muted)',
    background: 'var(--pill-bg)',
    borderRadius: '999px',
    padding: '2px 8px',
    flexShrink: 0
});

// The canvas frame: a plain, content-height wrapper (no overflow — plugin
// pages extend the document and the window scrollbar scrolls them).
const Canvas = styledComponent('div', {
    position: 'relative',
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '12px',
    border: '1px solid var(--hairline)',
    background: 'var(--canvas-bg)'
});

// Subject-level empty state (DEFENSIVE): renders only if a subject ever has
// no registered worksheets — every subject ships plugins today (R5).
const SlotEmptyState = styledComponent('div', {
    width: '100%',
    minHeight: '50vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    boxSizing: 'border-box'
});

const SlotEmptyCard = styledComponent('div', {
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

const SlotEmptyIcon = styledComponent('div', {
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

const SlotEmptyTitle = styledComponent('div', {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--app-fg)'
});

const SlotEmptyHint = styledComponent('div', {
    fontSize: '13px',
    color: 'var(--muted)'
});

// ──────────────────────────────────────────────────────────────────────────────
// Framework body — subscribes to the store INSIDE the provider
// ──────────────────────────────────────────────────────────────────────────────

// The dashboard body must render INSIDE DashboardContextProvider to use the
// store hooks, so the outer component is a two-part shell: provider here,
// body (a child component) below.
export function WorksheetsDashboard() {
    return (
        <DashboardContextProvider>
            <WorksheetsDashboardBody />
        </DashboardContextProvider>
    );
}

// The actual framework chrome. All worksheet content comes from the plugin
// slots.
function WorksheetsDashboardBody() {
    // The active SUBJECT — dashboard-local UI state (the rail's selection).
    const [subject, setSubject] = useState<WorksheetSubjectId>('math');

    // PLUGIN LOADING ORDER — the dashboard loads FIRST, its plugins SECOND.
    // The registration list holds (factory, framework) pairs UNINVOKED; this
    // shell renders with the FIRST plugin immediately, then the remaining
    // plugins load ONE BY ONE after mount (framework/loader.ts).
    const { plugins: loadedPlugins, done: pluginsDone } = usePluginLoader(
        WORKSHEET_REGISTRATIONS
    );

    // Registry hook: mounts each LOADED plugin's store slice (diff-based),
    // reconciles the selection (global fallback) and hands back the ordered
    // list.
    const { plugins, activePlugin } = usePluginRegistry(loadedPlugins);
    const store = useDashboardStore();

    // Per-subject plugin views (registration order preserved).
    const subjectPlugins = plugins.filter((p) => p.subject === subject);

    // SUBJECT SWITCHING reconciliation: when the active worksheet does not
    // belong to the active subject (rail switch, stale selection, empty
    // subject), select the first subject worksheet that is OFFERED at the
    // current level — falling back to the subject's first worksheet so a
    // level below every intro level still shows the (empty-state) worksheet.
    // Runs in a LAYOUT effect so the corrected selection applies before the
    // browser paints.
    useLayoutEffect(() => {
        const activeOk = activePlugin && activePlugin.subject === subject;
        if (activeOk) return;
        const candidate =
            subjectPlugins.find(
                (p) =>
                    !p.isOffered ||
                    p.isOffered(resolveDifficulty(subject, p.id, store.session.level).grade)
            ) ?? subjectPlugins[0];
        if (candidate) {
            selectEntry(store, candidate.id, candidate.entries[0]?.id ?? '');
        }
    }, [subject, plugins, activePlugin, store, subjectPlugins]);

    return (
        <AppRoot className="app-root">
            {/* Everything inside .app-chrome is hidden when printing — the
                @media print rules in app.css swap it for .print-doc (which
                the active plugin renders outside this shell). */}
            <div className="app-chrome">
                <HeaderBar data-testid="header-bar">
                    <BrandMark aria-hidden="true">W</BrandMark>
                    {/* R4 brand: "Worksheets v{version}" — the version is the
                        compile-time __APP_VERSION__ global injected from this
                        package's package.json (vite.config.ts define), never
                        a hardcoded string. */}
                    <AppTitle>Worksheets v{__APP_VERSION__}</AppTitle>
                    <HeaderSpacer />
                    <HeaderControls>
                        {/* R5 theme control: System (default) / Light / Dark,
                            persisted, applied via the data-theme token flip. */}
                        <ThemeSelector />
                        {/* R3 difficulty level control (replaces both legacy
                            grade selectors): unbounded positive stepper —
                            saturation is silent (generation clamps to each
                            worksheet's own cap; titles keep the requested
                            level). */}
                        <LevelControl plugins={plugins} />
                        {/* R2 searchable/autosuggest worksheet picker for the
                            ACTIVE subject (disabled only if a subject ever
                            has no worksheets). */}
                        <WorksheetPicker plugins={subjectPlugins} disabled={subjectPlugins.length === 0} />
                        {/* Plugin header slot (unused by the worksheet
                            plugins; any plugin may still contribute header
                            UI here). */}
                        <PluginHeaderHost plugins={plugins} />
                    </HeaderControls>
                </HeaderBar>

                <Body>
                    <Sidebar className="scrollbar-hidden">
                        <SidebarHeading>Subject</SidebarHeading>
                        {/* The four subject slots (Math, English, Chemistry,
                            Physic) — metadata-driven; every subject carries
                            its own plugins (R5 science included). */}
                        {SUBJECTS.map((s) => {
                            const count = plugins.filter((p) => p.subject === s.id).length;
                            return (
                                <SubjectButton
                                    key={s.id}
                                    active={s.id === subject}
                                    data-testid={`subject-${s.id}`}
                                    aria-label={`${s.label} subject`}
                                    onClick={() => setSubject(s.id)}
                                >
                                    <SubjectIcon active={s.id === subject} aria-hidden="true">
                                        {s.icon}
                                    </SubjectIcon>
                                    <SubjectLabel>{s.label}</SubjectLabel>
                                    <SubjectCount data-testid={`subject-count-${s.id}`}>{count}</SubjectCount>
                                </SubjectButton>
                            );
                        })}
                        {/* Progressive loading: factories still pending —
                            hint under the subject list. */}
                        {!pluginsDone && <SidebarLoading>Loading…</SidebarLoading>}
                    </Sidebar>

                    <Main>
                        {/* Toolbar card frame with the ACTIVE plugin's toolbar
                            slot inside. */}
                        <ToolbarCard data-testid="toolbar-card">
                            {activePlugin && activePlugin.subject === subject ? (
                                <PluginToolbarHost plugins={plugins} />
                            ) : (
                                <ToolbarPlaceholder>
                                    {getSubject(subject).label} worksheets coming soon
                                </ToolbarPlaceholder>
                            )}
                        </ToolbarCard>

                        {/* Canvas / content area: the ACTIVE plugin's page
                            slot, or the prepared-slot empty state for the
                            subjects without plugins yet. */}
                        <Canvas data-testid="canvas">
                            {activePlugin && activePlugin.subject === subject ? (
                                <PluginPageHost plugins={plugins} />
                            ) : (
                                <SlotEmptyState data-testid="subject-empty-state">
                                    <SlotEmptyCard>
                                        <SlotEmptyIcon aria-hidden="true">{getSubject(subject).icon}</SlotEmptyIcon>
                                        <SlotEmptyTitle>
                                            {getSubject(subject).label} worksheets are coming soon
                                        </SlotEmptyTitle>
                                        <SlotEmptyHint>{getSubject(subject).description}</SlotEmptyHint>
                                    </SlotEmptyCard>
                                </SlotEmptyState>
                            )}
                        </Canvas>
                    </Main>
                </Body>
            </div>

            {/* Screen-hidden print tree of the ACTIVE plugin, mounted as a
                SIBLING of .app-chrome: print media hides the shell wholesale
                and reveals .print-doc (app.css), so this is exactly what
                window.print() emits — one A4 block per worksheet page. */}
            <PluginPrintHost plugins={plugins} />
        </AppRoot>
    );
}

// Toolbar placeholder for the plugin-less subjects (keeps the sticky card
// height stable while the canvas shows the slot notice).
const ToolbarPlaceholder = styledComponent('div', {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--muted)',
    padding: '6px 0'
});

// Progressive-load hint: shown under the subject list while the remaining
// plugin factories are still being loaded one by one (framework/loader.ts).
const SidebarLoading = styledComponent('div', {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--faint)',
    padding: '6px 2px',
    flexShrink: 0,
    width: () => ({ xs: '100%', sm: 'auto' })
});
