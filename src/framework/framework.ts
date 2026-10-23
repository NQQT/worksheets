// ─────────────────────────────────────────────────────────────────────────────
// The DashboardFramework — the bundle of configurations + layouts the
// dashboard hands to EVERY worksheet plugin factory when it loads it.
//
// A worksheet plugin is a function like AdditionWorksheet(dashboard):
//
//   export function AdditionWorksheet(dashboard: DashboardFramework): DashboardPlugin {
//       return dashboard.createWorksheet({ id: 'addition', label: 'Addition', ... });
//   }
//
// Within the function the plugin describes its picker label and what happens
// when it is selected — using the framework's standard worksheet recipe, the
// difficulty model, deterministic seeding and A4 layouts provided here.
//
// The framework is created through createDashboardFramework(config): the
// config carries the SUBJECT-specific chrome (the subject id stamped onto
// every plugin the bundle builds, print footer brand line, empty-state glyph,
// answer-key rendering model, grid density). The kit/layout components
// themselves stay subject-neutral. The merged app ships TWO bundles — the
// math bundle (answers on separate key pages, roomy grid) and the english
// bundle (inline answer lines, compact grid) — so every migrated plugin keeps
// its exact legacy print semantics.
// ─────────────────────────────────────────────────────────────────────────────

import { createRng, seedFrom } from './rng';
import { PageStack } from './PageStack';
import { PrintableSheet } from './PrintableSheet';
import { ZoomControl } from './ZoomControl';
import { createWorksheet, type DashboardFrameworkConfig } from './worksheet-kit';
import { useDashboardSession } from './store';
import { definePlugin, type DashboardPlugin, type DashboardSession, type WorksheetSpec } from './types';

export type { DashboardFrameworkConfig } from './worksheet-kit';

// A plugin FACTORY — the uninvoked function a plugin module exports. The
// plugin list (plugins/index.ts) stores factories UNINVOKED so the dashboard
// can render first and then load them ONE BY ONE after mount (loader.ts);
// loading = calling the factory with the framework bundle.
export type PluginFactory = (dashboard: DashboardFramework) => DashboardPlugin;

export type DashboardFramework = {
    // This instance's subject-specific chrome configuration.
    config: DashboardFrameworkConfig;
    // The framework's standard worksheet recipe: builds the full plugin
    // (picker entry + toolbar + page + print + level gating) from a spec.
    createWorksheet: (spec: WorksheetSpec) => DashboardPlugin;
    // The shared dashboard session state (level, pages, zoom, refresh) —
    // reactive: mutations re-render subscribed components synchronously.
    useSession: () => DashboardSession;
    // Deterministic seeding + PRNG for plugin generators.
    seedFrom: typeof seedFrom;
    createRng: typeof createRng;
    // A4 layout components a custom plugin can compose its own surfaces from.
    PageStack: typeof PageStack;
    PrintableSheet: typeof PrintableSheet;
    ZoomControl: typeof ZoomControl;
    // Plugin factory helper (single injection point for future concerns).
    definePlugin: typeof definePlugin;
};

// Build a framework bundle for a dashboard instance.
export function createDashboardFramework(config: DashboardFrameworkConfig): DashboardFramework {
    return {
        config,
        // Bind this instance's config into the standard worksheet recipe.
        createWorksheet: (spec) => createWorksheet(spec, config),
        useSession: useDashboardSession,
        seedFrom,
        createRng,
        PageStack,
        PrintableSheet,
        ZoomControl,
        definePlugin
    };
}

// ── Subject bundles ──────────────────────────────────────────────────────────
// One bundle per implemented subject, passed to every factory of that subject
// in the registration lists (src/plugins/*/index.ts).

// Math bundle chrome: "Math Worksheets" print footer, ∑ glyph, the T8
// separate-page answer key and the roomy maths grid (legacy maths semantics).
export const MATH_FRAMEWORK: DashboardFramework = createDashboardFramework({
    subject: 'math',
    printBrand: 'Math Worksheets',
    emptyGlyph: '∑',
    answerKeyStyle: 'pages',
    density: 'roomy',
    emptyHint: 'Choose a level from 1 upward to generate a printable sheet.'
});

// English bundle chrome: "English Worksheets" print footer, Aa glyph, the T5
// inline answer lines and the compact english grid (legacy english semantics).
export const DASHBOARD_FRAMEWORK: DashboardFramework = createDashboardFramework({
    subject: 'english',
    printBrand: 'English Worksheets',
    emptyGlyph: 'Aa',
    answerKeyStyle: 'inline',
    density: 'compact',
    emptyHint: 'Choose a level from 1 upward to generate a printable sheet.'
});

// Chemistry bundle chrome (R5 science): "Chemistry Worksheets" print footer,
// ⚗ glyph, the T5-style INLINE answer key (science answers are short words /
// numbers — they fit under each question) and the compact grid. Plugins
// resolve through the shared SCIENCE_GRADES catalogue (cap level 4).
export const CHEMISTRY_FRAMEWORK: DashboardFramework = createDashboardFramework({
    subject: 'chemistry',
    printBrand: 'Chemistry Worksheets',
    emptyGlyph: '⚗',
    answerKeyStyle: 'inline',
    density: 'compact',
    emptyHint: 'Choose a level from 1 upward to generate a printable sheet.'
});

// Physic bundle chrome (R5 science — the user's spelling; the subject id
// stays 'physics'): same science model with the ⚛ glyph.
export const PHYSIC_FRAMEWORK: DashboardFramework = createDashboardFramework({
    subject: 'physics',
    printBrand: 'Physic Worksheets',
    emptyGlyph: '⚛',
    answerKeyStyle: 'inline',
    density: 'compact',
    emptyHint: 'Choose a level from 1 upward to generate a printable sheet.'
});
