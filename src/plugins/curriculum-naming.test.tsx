// CURRICULUM-NAMING REGRESSION (T6) — the revised presentation contract.
//
// The user requirement: silent per-plugin saturation, one title format
// "<Worksheet> level <requested>" and NO curriculum-year labels anywhere.
// An independent review caught Reading Comprehension printing "Year 3
// passages …" scopes — a violation no existing test covered (they only
// banned the literal word 'Grade').
//
// This suite sweeps EVERY registered plugin through its REAL toolbar (the
// same worksheet-kit path the screen, print sheets and answer keys render
// from) across ALL levels 1..12, and asserts that every user-facing TITLE
// and every OFFERED-LEVEL SCOPE subtitle is free of Year/Grade curriculum
// labels — word-boundary matched, plural-aware, NOT merely the string
// 'Grade'. The bundle chrome (print brand, empty hints) and the subject
// rail descriptions are pinned too.
//
// jsdom caveat: the toolbar renders the subtitle only when the level
// actually offers the worksheet (hasProblems), so "across offered plugin
// levels" falls out of the DOM itself.

import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WORKSHEET_REGISTRATIONS } from './index';
import {
    CHEMISTRY_FRAMEWORK,
    DASHBOARD_FRAMEWORK,
    DashboardContextProvider,
    MATH_FRAMEWORK,
    PHYSIC_FRAMEWORK,
    SUBJECTS,
    useDashboardStore,
    type DashboardPlugin,
    type DashboardStoreStructure
} from '../framework';

afterEach(cleanup);

// ANY curriculum label word — Year or Grade, singular or plural,
// case-insensitive, on word boundaries (so "payments"/"downgrade" never
// trip). This is the FULL banned set, not merely 'Grade'.
const CURRICULUM_LABEL = /\b(year|grade)s?\b/i;

// The whole catalogue span: level 1..12 (the highest legacy grade id is 12).
const LEVELS = Array.from({ length: 12 }, (_, i) => i + 1);

// Store probe: the toolbar reads the shared session; the sweep rewrites
// session.level between assertions (synchronous re-render, see store.tsx).
let probeStore: DashboardStoreStructure | null = null;
function StoreProbe() {
    probeStore = useDashboardStore();
    return null;
}

// Mount ONE plugin's toolbar through the provider (the worksheet toolbar
// ignores its context prop; CompassWorksheet.test.ts mounts it the same way).
function mountToolbar(plugin: DashboardPlugin) {
    const Toolbar = plugin.toolbar!;
    return render(
        <DashboardContextProvider>
            <StoreProbe />
            {React.createElement(Toolbar, {
                context: { pluginId: plugin.id, entryId: plugin.id, store: {}, entries: plugin.entries }
            })}
        </DashboardContextProvider>
    );
}

describe('every registered worksheet — titles and offered scopes are curriculum-label-free', () => {
    // One sweep per plugin: 79 registrations × 12 levels through the REAL
    // toolbar. Collected violations assert as an exact empty array, so a
    // failure names the plugin, level and offending string.
    for (const reg of WORKSHEET_REGISTRATIONS) {
        const plugin = reg.factory(reg.framework);
        it(`${plugin.subject} / ${plugin.id}: no Year/Grade label in any title or offered scope`, () => {
            mountToolbar(plugin);
            const violations: string[] = [];
            for (const level of LEVELS) {
                act(() => {
                    probeStore!.session.level = level;
                });
                // The title ALWAYS renders ("<Label> level <requested>").
                const title = screen.getByTestId('toolbar-title').textContent ?? '';
                if (CURRICULUM_LABEL.test(title)) {
                    violations.push(`level ${level} title: "${title}"`);
                }
                // The scope subtitle renders only when the level OFFERS the
                // worksheet — exactly the "offered plugin levels" sweep.
                const subtitleElement = screen.queryByTestId('toolbar-sub');
                if (subtitleElement) {
                    const subtitle = subtitleElement.textContent ?? '';
                    if (CURRICULUM_LABEL.test(subtitle)) {
                        violations.push(`level ${level} scope: "${subtitle}"`);
                    }
                }
            }
            expect(violations).toEqual([]);
        });
    }
});

describe('user-facing chrome strings — grade-free by pin', () => {
    it('the four bundle print brands + empty hints carry no Year/Grade label', () => {
        for (const bundle of [MATH_FRAMEWORK, DASHBOARD_FRAMEWORK, CHEMISTRY_FRAMEWORK, PHYSIC_FRAMEWORK]) {
            expect(bundle.config.printBrand).not.toMatch(CURRICULUM_LABEL);
            expect(bundle.config.emptyHint).not.toMatch(CURRICULUM_LABEL);
        }
        // Exact hints: the level system is announced, never a curriculum year.
        expect(MATH_FRAMEWORK.config.emptyHint).toBe('Choose a level from 1 upward to generate a printable sheet.');
        expect(DASHBOARD_FRAMEWORK.config.emptyHint).toBe('Choose a level from 1 upward to generate a printable sheet.');
        expect(CHEMISTRY_FRAMEWORK.config.emptyHint).toBe('Choose a level from 1 upward to generate a printable sheet.');
        expect(PHYSIC_FRAMEWORK.config.emptyHint).toBe('Choose a level from 1 upward to generate a printable sheet.');
    });

    it('the subject rail descriptions carry no Year/Grade label', () => {
        for (const subject of SUBJECTS) {
            expect(subject.description).not.toMatch(CURRICULUM_LABEL);
        }
        // Exact pins (the four rail entries).
        expect(SUBJECTS.map((s) => s.description)).toEqual([
            'Numbers, operations, measurement & senior strands',
            'Reading, phonics, grammar & writing',
            'Elements, equations & reactions',
            'Motion, forces & circuits'
        ]);
    });
});
