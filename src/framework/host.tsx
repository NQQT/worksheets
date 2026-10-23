// ─────────────────────────────────────────────────────────────────────────────
// Dashboard plugin HOST components (framework-side mounting surfaces).
//
// Every worksheet plugin automatically gets access to these slots once
// registered (see plugins/index.ts and registry.ts):
//
//   <PluginHeaderHost>   — renders the ACTIVE plugin's optional header
//                          component into the dashboard top bar (the
//                          framework's own level control, worksheet picker
//                          and theme selector live there too).
//   <PluginToolbarHost>  — renders the ACTIVE plugin's toolbar component.
//   <PluginPageHost>     — renders the ACTIVE plugin's page component.
//   <PluginPrintHost>    — mounts the ACTIVE plugin's print surface.
//
// The old plugin SIDEBAR host is gone: the merged dashboard's left rail lists
// SUBJECTS (Math, English, Chemistry, Physic) and the right side hosts the
// searchable worksheet picker (components/WorksheetsDashboard.tsx) — the
// registration registry drives both, with no hardcoded worksheet switch.
//
// All hosts subscribe to the shared store (useDashboardStore), so selection
// changes, session changes and plugin mutations re-render exactly the hosts
// that care. Plugins NEVER import these — the framework host
// (WorksheetsDashboard) does. This keeps the dependency direction one-way:
// framework → plugin contract ← plugin.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { useDashboardStore } from './store';
import { buildContext } from './registry';
import type { DashboardPlugin } from './types';

// Shared props for all hosts: the ordered plugin list from the registry.
export type PluginHostProps = {
    plugins: DashboardPlugin[];
};

// ── Header host ────────────────────────────────────────────────────────────────
export function PluginHeaderHost({ plugins }: PluginHostProps) {
    const store = useDashboardStore();
    // The active plugin (selected, falling back to the first registered) —
    // mirrors usePluginRegistry's resolution so the header shows the same
    // plugin's controls as the toolbar/page.
    const active = plugins.find((p) => p.id === store.active.pluginId) ?? plugins[0];
    if (!active?.header) return null;
    const Header = active.header;
    return <Header context={buildContext(store, active)} />;
}

// ── Toolbar host ──────────────────────────────────────────────────────────────
export function PluginToolbarHost({ plugins }: PluginHostProps) {
    const store = useDashboardStore();
    // Same resolution as usePluginRegistry: the selected plugin, falling
    // back to the first registered one (e.g. first frame before the
    // reconcile layout-effect has fired).
    const active = plugins.find((p) => p.id === store.active.pluginId) ?? plugins[0];
    if (!active?.toolbar) return null;
    const Toolbar = active.toolbar;
    return <Toolbar context={buildContext(store, active)} />;
}

// ── Page host ─────────────────────────────────────────────────────────────────
export function PluginPageHost({ plugins }: PluginHostProps) {
    const store = useDashboardStore();
    const active = plugins.find((p) => p.id === store.active.pluginId) ?? plugins[0];
    if (!active) return null;
    const Page = active.page;
    return <Page context={buildContext(store, active)} />;
}

// ── Print host ────────────────────────────────────────────────────────────────
// Mounts the ACTIVE plugin's print surface. The framework renders this OUTSIDE
// .app-chrome: print media hides the interactive shell wholesale (app.css),
// so the .print-doc tree a plugin emits here is exactly what window.print()
// paginates — one A4 block per page.
export function PluginPrintHost({ plugins }: PluginHostProps) {
    const store = useDashboardStore();
    const active = plugins.find((p) => p.id === store.active.pluginId) ?? plugins[0];
    if (!active?.print) return null;
    const Print = active.print;
    return <Print context={buildContext(store, active)} />;
}
