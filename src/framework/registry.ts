// ─────────────────────────────────────────────────────────────────────────────
// Dashboard plugin registry — framework-side wiring.
//
// REGISTRATION FLOW (the heart of the plugin architecture):
//
//   1. `plugins/index.ts` exports the ordered list of UNINVOKED plugin
//      factories (one worksheet plugin per english type). Add a worksheet by
//      creating its plugin file and adding one line there; delete the file +
//      its line to remove it — nothing else changes.
//   1b. `usePluginLoader` (loader.ts) runs FIRST in the dashboard host: the
//      dashboard renders, then the factories are invoked one by one (the
//      first with the first render, the rest after mount).
//   2. The framework host (EnglishDashboard) then calls
//      `usePluginRegistry(loadedPlugins)`:
//        - mounts every LOADED plugin's scoped store slice
//          (ensurePluginSlice — diff-based, so a growing list never resets
//          live state; see the effect below);
//        - resolves the ACTIVE plugin with fallback: if the selection is
//          empty or stale (deleted plugin), the first registered plugin's
//          first entry is selected — the dashboard never crashes;
//        - on host teardown, forgetPlugin wipes every slice so the store
//          returns to pristine state (state does not survive unmount).
//   3. `usePluginRegistration(plugin)` is the per-plugin equivalent for
//      plugin mounts OUTSIDE the host's list (storybook stories, test
//      harnesses that mount a plugin directly).
//   4. `buildContext(store, plugin)` resolves a plugin's LIVE runtime
//      context: its scoped slice, its entries and the active entryId
//      (falling back to its first entry when the selection lives elsewhere).
//
// SELECTION RECONCILIATION runs inside a useLayoutEffect (not during render)
// so the first meaningful paint happens one frame later but without any
// render-phase mutation; the context builder ALSO falls back eagerly, so the
// page still renders the right thing on the very first frame.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useDashboardStore, ensurePluginSlice, forgetPlugin, selectEntry, type DashboardStoreStructure } from './store';
import type { DashboardPlugin, PluginId, PluginRuntimeContext } from './types';

// ── Host registry hook ────────────────────────────────────────────────────────
// Mounts every plugin's store slice and returns the ordered list plus the
// active plugin. The framework renders toolbar/page slots from this.
export function usePluginRegistry(plugins: DashboardPlugin[]) {
    const store = useDashboardStore();

    // Slice mounting, DIFF-BASED so a GROWING plugin list is safe. The list
    // fed here grows one entry at a time (usePluginLoader loads plugins one
    // by one AFTER the dashboard has rendered), so this effect re-runs once
    // per newly loaded plugin. The old all-or-nothing cleanup (forget ALL on
    // every list change) would wipe the ACTIVE plugin's slice on every load
    // and reset the user's selection to the first plugin mid-load. Instead:
    //   - ensure every currently listed plugin's slice (idempotent);
    //   - forget ONLY plugins that LEFT the list (deleted mid-session);
    //   - a separate unmount-only effect wipes every slice this mount
    //     created when the HOST goes away (state does not survive unmount).
    const mountedRef = useRef<PluginId[]>([]);
    useEffect(() => {
        const ids = plugins.map((p) => p.id);
        plugins.forEach((p) => ensurePluginSlice(store, p.id, p.initialStore ?? {}));
        mountedRef.current
            .filter((id) => !ids.includes(id))
            .forEach((id) => forgetPlugin(store, id));
        mountedRef.current = ids;
    }, [plugins, store]);

    // Unmount-only wipe: on host teardown every slice this mount created is
    // forgotten so the store returns to pristine state (each provider mount
    // starts clean — see store.tsx). Runs once per mount, NOT per list
    // change, precisely so appending a newly loaded plugin above never
    // touches live slices.
    useEffect(() => {
        const mounted = mountedRef;
        return () => {
            mounted.current.forEach((id) => forgetPlugin(store, id));
            mounted.current = [];
        };
    }, [store]);

    // Reconcile the selection: nothing selected yet, or the selected plugin
    // is no longer registered (deleted mid-session / stale test state) →
    // select the first plugin's first entry. useLayoutEffect so the
    // corrected selection is applied before the browser paints.
    const needsFallback =
        !store.active.pluginId || !plugins.some((p) => p.id === store.active.pluginId);
    useLayoutEffect(() => {
        if (needsFallback && plugins.length > 0) {
            selectEntry(store, plugins[0].id, plugins[0].entries[0]?.id ?? '');
        }
    }, [needsFallback, plugins, store]);

    // Stable ordered view for the framework to render. The eager ?? fallback
    // means even on the very first frame (before the layout effect above
    // fires) the host shows the first plugin rather than an empty canvas.
    return useMemo(() => {
        const activePlugin =
            plugins.find((p) => p.id === store.active.pluginId) ?? plugins[0];
        return {
            plugins,
            activePlugin,
            activeContext: activePlugin ? buildContext(store, activePlugin) : undefined
        };
    }, [plugins, store.active.pluginId, store.active.entryId, store]);
}

// ── Single-plugin registration hook ──────────────────────────────────────────
// For plugin mounts OUTSIDE the host's registry list (stories/tests): mounts
// + tears down that plugin's slice around its own lifecycle.
export function usePluginRegistration(plugin: DashboardPlugin) {
    const store = useDashboardStore();
    useEffect(() => {
        ensurePluginSlice(store, plugin.id, plugin.initialStore ?? {});
        return () => forgetPlugin(store, plugin.id);
    }, [plugin, store]);
}

// ── Runtime context builder ──────────────────────────────────────────────────
// Resolves the live runtime context for a plugin: its scoped slice, its
// entries, and the entryId. Falls back to the plugin's FIRST entry when the
// store's selection points elsewhere (buildContext is also used to render
// inactive plugins' header slots, which must show sensible defaults).
export function buildContext(
    store: DashboardStoreStructure,
    plugin: DashboardPlugin
): PluginRuntimeContext {
    const slice = store.plugins[plugin.id] ?? plugin.initialStore ?? {};
    const fallbackEntry = plugin.entries[0]?.id ?? '';
    const entryId =
        store.active.pluginId === plugin.id
            ? store.active.entryId || fallbackEntry
            : fallbackEntry;
    return {
        pluginId: plugin.id,
        entryId,
        store: slice,
        entries: plugin.entries
    };
}

// Convenience hook for plugin components that need their own runtime context
// without receiving it via props (deep children that only know their plugin).
export function usePluginRuntime(plugin: DashboardPlugin): PluginRuntimeContext {
    const store = useDashboardStore();
    return useMemo(() => buildContext(store, plugin), [store, plugin]);
}
