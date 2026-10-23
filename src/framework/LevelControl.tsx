// ─────────────────────────────────────────────────────────────────────────────
// Level control — the FRAMEWORK header component that replaces the legacy
// grade selectors (R3: no grade selector anywhere).
//
// The difficulty level is DASHBOARD configuration, shared by every worksheet
// plugin: changing the level re-derives every plugin's caps (per worksheet,
// through framework/difficulty.ts). The control reads/writes the shared
// session state (store.session.level), so all subscribed framework components
// and plugin surfaces update synchronously.
//
// SEMANTICS (revised presentation):
//   * level is a positive integer, unbounded upward — the stepper and the
//     typed input accept any level ≥ 1 (MIN_LEVEL), even beyond every
//     worksheet's content cap.
//   * SATURATION IS SILENT: when the ACTIVE worksheet has less content than
//     the requested level, generation clamps to the worksheet's maximum
//     effective level (the seed derives from the effective level, so the
//     sheet is stable absent Randomize) — and the UI says NOTHING about it:
//     no "Tops out", no max-level note. The worksheet's title keeps showing
//     the requested level ("<Label> level <requested>").
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { styledComponent } from '@presource/react';
import { useDashboardStore } from './store';
import { MIN_LEVEL, normalizeLevel } from './difficulty';
import type { DashboardPlugin } from './types';

// Stepper pill: − / value input / +, mirroring the Pages stepper chrome.
const LevelStepper = styledComponent('div', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    padding: '3px',
    borderRadius: '10px',
    border: '1px solid var(--hairline)',
    background: 'var(--pill-bg)',
    flexShrink: 0
});

const LevelLabel = styledComponent('span', {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--faint)',
    padding: '0 6px'
});

const LevelStepButton = styledComponent('button', {
    width: '28px',
    height: '28px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 700,
    lineHeight: 1,
    flexShrink: 0,
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--control-fg)'
});

// The level value, editable by typing. styledComponent's typed surface is
// HTMLAttributes<HTMLElement>, so cast to the InputHTMLAttributes surface
// (same pattern as PageInput in framework/worksheet-kit.tsx).
const LevelInput = styledComponent('input', {
    width: '52px',
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

// The honest saturation note was REMOVED (revised presentation — saturation
// is silent), so the control cluster is just the stepper pill.
const LevelCluster = styledComponent('div', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0
});

export function LevelControl({ plugins }: { plugins: DashboardPlugin[] }) {
    const store = useDashboardStore();
    const level = store.session.level ?? MIN_LEVEL;

    // The `plugins` prop keeps the control's call-site contract (the
    // dashboard passes the loaded list); saturation is resolved silently at
    // generation time now, so the control reads only the session level.

    // Stepper handlers: decrement never drops below MIN_LEVEL; increment has
    // no upper bound (levels may grow indefinitely — every worksheet clamps
    // its own effective level at generation time).
    const decrease = () => {
        store.session.level = Math.max(MIN_LEVEL, normalizeLevel(level) - 1);
    };
    const increase = () => {
        store.session.level = normalizeLevel(level) + 1;
    };
    // Typing: empty tolerated while editing; invalid text snaps to MIN_LEVEL.
    const onInput = (raw: string) => {
        if (raw === '') return;
        const n = Number.parseInt(raw, 10);
        store.session.level = Number.isNaN(n) ? MIN_LEVEL : Math.max(MIN_LEVEL, n);
    };
    // Blur normalises a stripped field back to the minimum.
    const onBlur = () => {
        if (normalizeLevel(level) < MIN_LEVEL) store.session.level = MIN_LEVEL;
    };

    return (
        <LevelCluster>
            <LevelStepper role="group" aria-label="Difficulty level" data-testid="level-stepper">
                <LevelLabel>Level</LevelLabel>
                <LevelStepButton aria-label="Decrease level" data-testid="level-decrease" onClick={decrease}>
                    &minus;
                </LevelStepButton>
                <LevelInput
                    type="number"
                    min={MIN_LEVEL}
                    value={level}
                    aria-label="Difficulty level"
                    data-testid="level-count"
                    onChange={(e) => onInput(e.target.value)}
                    onBlur={onBlur}
                />
                <LevelStepButton aria-label="Increase level" data-testid="level-increase" onClick={increase}>
                    +
                </LevelStepButton>
            </LevelStepper>
        </LevelCluster>
    );
}
