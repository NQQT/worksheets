// Science plugin composition / registration / real-mount integration tests
// (R5) — the science analogue of plugins/math/plugins.test.tsx.
//
// Pinned here:
//   1. the two science registration lists (2 chemistry + 2 physic plugins)
//      and their framework-bundle chrome;
//   2. the subject stamps line up with REGISTRATION_SUBJECT (the rail's
//      count chips + picker scoping derive from them);
//   3. the science ids join WORKSHEET_REGISTRATIONS at the END, after the
//      75 migrated math/english plugins, with GLOBALLY unique ids (registry
//      keys + seed parts);
//   4. a real mount through the framework pipeline: the picker lists the
//      science worksheets, the toolbar title uses the one-title format
//      '<Label> level <requested>' (even over the level-4 cap) and the
//      inline answer key model is the science bundle's;
//   5. the difficulty system resolves the science plugins from level 1 with
//      the shared 4-level cap.

import React from 'react';
import { render, screen, cleanup, act } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import {
    DashboardContextProvider,
    useDashboardStore,
    usePluginRegistry,
    PluginToolbarHost,
    PluginPageHost,
    selectEntry,
    MATH_FRAMEWORK,
    CHEMISTRY_FRAMEWORK,
    PHYSIC_FRAMEWORK,
    resolveDifficulty,
    type DashboardPlugin,
    type DashboardStoreStructure
} from '../../framework';
import { WORKSHEET_REGISTRATIONS, REGISTRATION_SUBJECT, MATH_WORKSHEETS, ENGLISH_WORKSHEETS } from '../index';
import { CHEMISTRY_WORKSHEETS, PHYSICS_WORKSHEETS } from './index';
import { ElementsWorksheet } from './ElementsWorksheet';
import { SpeedDistanceTimeWorksheet } from './SpeedDistanceTimeWorksheet';

afterEach(() => {
    cleanup();
});

// ── Test harness (the math/english plugins.test.tsx pattern) ─────────────────
let probeStore: DashboardStoreStructure | null = null;
function StoreProbe() {
    probeStore = useDashboardStore();
    return null;
}

function TestHost({ plugins }: { plugins: DashboardPlugin[] }) {
    const { plugins: mounted } = usePluginRegistry(plugins);
    return (
        <div>
            <StoreProbe />
            <PluginToolbarHost plugins={mounted} />
            <PluginPageHost plugins={mounted} />
        </div>
    );
}

function mountHost(plugins: DashboardPlugin[]) {
    return render(
        <DashboardContextProvider>
            <TestHost plugins={plugins} />
        </DashboardContextProvider>
    );
}

// The science plugins, built through the same pipeline usePluginLoader uses.
const CHEMISTRY_PLUGINS: DashboardPlugin[] = CHEMISTRY_WORKSHEETS.map((r) => r.factory(r.framework));
const PHYSICS_PLUGINS: DashboardPlugin[] = PHYSICS_WORKSHEETS.map((r) => r.factory(r.framework));

describe('science registration lists — per-subject bundles and stamps', () => {
    it('pairs the two chemistry factories with the CHEMISTRY_FRAMEWORK bundle', () => {
        expect(CHEMISTRY_WORKSHEETS).toHaveLength(2);
        expect(CHEMISTRY_WORKSHEETS.map((r) => r.factory.name)).toEqual(['ElementsWorksheet', 'BalancingWorksheet']);
        for (const reg of CHEMISTRY_WORKSHEETS) {
            expect(reg.framework).toBe(CHEMISTRY_FRAMEWORK);
            expect(reg.framework.config.subject).toBe('chemistry');
        }
        // The chemistry bundle chrome: ⚗ glyph, inline answer key, compact
        // grid, its own print brand.
        expect(CHEMISTRY_FRAMEWORK.config).toMatchObject({
            subject: 'chemistry',
            printBrand: 'Chemistry Worksheets',
            emptyGlyph: '⚗',
            answerKeyStyle: 'inline',
            density: 'compact'
        });
    });

    it('pairs the two physic factories with the PHYSIC_FRAMEWORK bundle', () => {
        expect(PHYSICS_WORKSHEETS).toHaveLength(2);
        expect(PHYSICS_WORKSHEETS.map((r) => r.factory.name)).toEqual(['SpeedDistanceTimeWorksheet', 'CircuitsWorksheet']);
        for (const reg of PHYSICS_WORKSHEETS) {
            expect(reg.framework).toBe(PHYSIC_FRAMEWORK);
            expect(reg.framework.config.subject).toBe('physics');
        }
        // The physic bundle chrome (the user's spelling in the brand line;
        // the subject id stays 'physics').
        expect(PHYSIC_FRAMEWORK.config).toMatchObject({
            subject: 'physics',
            printBrand: 'Physic Worksheets',
            emptyGlyph: '⚛',
            answerKeyStyle: 'inline',
            density: 'compact'
        });
    });

    it('stamps every loaded plugin with its bundle\u2019s subject (REGISTRATION_SUBJECT lines up)', () => {
        expect(CHEMISTRY_PLUGINS.map((p) => p.subject)).toEqual(['chemistry', 'chemistry']);
        expect(PHYSICS_PLUGINS.map((p) => p.subject)).toEqual(['physics', 'physics']);
        expect(REGISTRATION_SUBJECT.chemistry).toBe(CHEMISTRY_WORKSHEETS);
        expect(REGISTRATION_SUBJECT.physics).toBe(PHYSICS_WORKSHEETS);
        expect(REGISTRATION_SUBJECT.math).toBe(MATH_WORKSHEETS);
        expect(REGISTRATION_SUBJECT.english).toBe(ENGLISH_WORKSHEETS);
    });

    it('declares the science ids as one-entry worksheets with their picker labels', () => {
        expect(CHEMISTRY_PLUGINS.map((p) => p.id)).toEqual(['elements', 'balancing']);
        expect(PHYSICS_PLUGINS.map((p) => p.id)).toEqual(['speed', 'circuits']);
        expect(CHEMISTRY_PLUGINS.map((p) => p.entries[0].label)).toEqual(['Elements', 'Balancing Equations']);
        expect(PHYSICS_PLUGINS.map((p) => p.entries[0].label)).toEqual(['Speed, Distance & Time', 'Circuits & Ohm\u2019s Law']);
        for (const plugin of [...CHEMISTRY_PLUGINS, ...PHYSICS_PLUGINS]) {
            expect(plugin.entries).toHaveLength(1);
            expect(plugin.entries[0].id).toBe(plugin.id);
            expect(plugin.toolbar).toBeDefined();
            expect(plugin.page).toBeDefined();
            expect(plugin.print).toBeDefined();
        }
    });
});

describe('WORKSHEET_REGISTRATIONS — the science lists join the merged registry', () => {
    it('appends the science registrations after the 75 migrated plugins, in rail order', () => {
        expect(WORKSHEET_REGISTRATIONS).toHaveLength(79);
        const scienceStart = WORKSHEET_REGISTRATIONS.length - 4;
        const scienceIds = WORKSHEET_REGISTRATIONS.slice(scienceStart).map((r) => r.factory(r.framework).id);
        expect(scienceIds).toEqual(['elements', 'balancing', 'speed', 'circuits']);
        // The 75 migrated registrations stay ahead, unchanged.
        expect(WORKSHEET_REGISTRATIONS.slice(0, scienceStart)).toEqual([
            ...MATH_WORKSHEETS,
            ...ENGLISH_WORKSHEETS
        ]);
    });

    it('keeps every registry id globally unique (registry keys + seed parts)', () => {
        const ids = WORKSHEET_REGISTRATIONS.map((r) => r.factory(r.framework).id);
        expect(new Set(ids).size).toBe(ids.length);
    });
});

describe('real mount — the science plugins through the framework pipeline', () => {
    it('mounts chemistry with Elements active and the one-title format; level shown even over the cap', () => {
        mountHost([...CHEMISTRY_PLUGINS, ...PHYSICS_PLUGINS]);

        // Default selection: the first chemistry plugin (Elements) at the
        // session's default level 2.
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Elements level 2');
        expect(screen.getByTestId('sheet-preview-page1')).toBeDefined();

        // Level 4 (the cap): the title keeps the requested level. The level
        // stepper lives in the real dashboard header (not this minimal
        // host), so the session is mutated directly here — wrapped in act()
        // so React flushes the re-render before the assertion.
        act(() => {
            probeStore!.session.level = 4;
        });
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Elements level 4');

        // ...and an oversized level KEEPS showing the requested level while
        // the content silently saturates (pinned at unit level in
        // ElementsWorksheet.test.ts — here the title contract).
        act(() => {
            probeStore!.session.level = 99;
        });
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Elements level 99');
        expect(screen.queryByTestId('level-note')).toBeNull();
    });

    it('activates the physic plugins through the shared session', () => {
        mountHost([...CHEMISTRY_PLUGINS, ...PHYSICS_PLUGINS]);
        act(() => {
            selectEntry(probeStore!, 'speed', 'speed');
        });
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Speed, Distance & Time level 2');
        expect(screen.getByTestId('sheet-preview-page1')).toBeDefined();
        act(() => {
            selectEntry(probeStore!, 'circuits', 'circuits');
        });
        expect(screen.getByTestId('toolbar-title').textContent).toBe('Circuits & Ohm\u2019s Law level 2');
    });
});

describe('science difficulty — the shared 4-level ladder', () => {
    it('every science plugin is offered from level 1 and saturates silently at level 4', () => {
        for (const subject of ['chemistry', 'physics'] as const) {
            for (const specId of ['elements', 'balancing', 'speed', 'circuits']) {
                for (const level of [1, 2, 3, 4]) {
                    const plan = resolveDifficulty(subject, specId, level);
                    expect(plan.notYetOffered).toBe(false);
                    expect(plan.effectiveLevel).toBe(level);
                    expect(plan.maxLevel).toBe(4);
                    expect(plan.saturated).toBe(false);
                    // The generation caps carry the rung (level) — the dial
                    // the science generators read.
                    expect(plan.grade.caps.yearLevel).toBe(level);
                }
                for (const level of [5, 99]) {
                    const plan = resolveDifficulty(subject, specId, level);
                    expect(plan.effectiveLevel).toBe(4);
                    expect(plan.saturated).toBe(true);
                    expect(plan.grade.caps.yearLevel).toBe(4);
                }
            }
        }
    });
});
