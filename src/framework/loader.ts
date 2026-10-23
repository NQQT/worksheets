// ─────────────────────────────────────────────────────────────────────────────
// Plugin LOADER — progressive, post-render plugin loading.
//
// LOADING ORDER (the fix for "plugins loaded before the dashboard renders"):
//
//   BEFORE: plugins/index.ts invoked every factory at MODULE LOAD time
//           (`AdditionWorksheet(MATH_FRAMEWORK)` inside the PLUGINS
//           array literal) — all 75 plugins were fully constructed before
//           the dashboard ever rendered.
//
//   NOW:    the registration list stores the factories UNINVOKED, each with
//           its SUBJECT bundle. The dashboard renders FIRST and then loads
//           plugins in two stages:
//
//     1. WITH the first render: the first factory runs inside this hook's
//        useState initializer, so the shell chrome + the default worksheet
//        (Addition) are on screen in the very first paint.
//     2. AFTER mount (useEffect): the remaining factories run ONE BY ONE —
//        each load commits to state, then the loader yields to the browser
//        (macrotask via @presource/core's scriptPause) before constructing
//        the next plugin, so each one lands in its own frame and the picker
//        visibly grows.
//
// The loaded list is fed to usePluginRegistry (registry.ts), which mounts
// each plugin's store slice and resolves the active selection. That hook's
// slice mounting is DIFF-BASED precisely so this growing list never tears
// down live slices or resets the user's selection mid-load.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { scriptPause } from '@presource/core';
import type { DashboardPlugin } from './types';
import type { DashboardFramework, PluginFactory } from './framework';

// One registration entry: the UNINVOKED factory + the SUBJECT bundle it is
// loaded with (plugins/index.ts builds these — see WorksheetRegistration).
export type PluginLoaderEntry = {
    factory: PluginFactory;
    framework: DashboardFramework;
};

// What the loader hands back to the dashboard host.
export type PluginLoaderResult = {
    // Plugins loaded SO FAR (grows one entry at a time until `done`).
    plugins: DashboardPlugin[];
    // True once every factory in the list has been loaded.
    done: boolean;
};

// Load the plugin factories one by one, AFTER the dashboard has rendered.
//
// `entries` — the UNINVOKED registrations (plugins/index.ts WORKSHEET_LIST),
// each pairing a factory with its subject's framework bundle.
export function usePluginLoader(entries: PluginLoaderEntry[]): PluginLoaderResult {
    // STAGE 1 — first plugin loads WITH the dashboard: the useState
    // initializer runs during the dashboard's very first render, so the
    // default worksheet is on screen immediately (no empty first frame).
    // StrictMode double-invokes initializers in dev — the factory is a pure
    // description builder, so the discarded duplicate is harmless.
    const [plugins, setPlugins] = useState<DashboardPlugin[]>(() =>
        entries.length > 0 ? [entries[0].factory(entries[0].framework)] : []
    );

    // Mirror of the loaded count. WHY A REF: the load chain must know how
    // many factories are already loaded WITHOUT reading live state inside
    // setPlugins — and the FACTORY CALL must stay OUTSIDE the state updater,
    // because updaters must be pure (React StrictMode double-invokes them,
    // which would run a factory twice). The ref is re-synced from committed
    // state on every render.
    const loadedCountRef = useRef(plugins.length);
    loadedCountRef.current = plugins.length;

    // STAGE 2 — after mount, load the remaining plugins ONE BY ONE.
    useEffect(() => {
        // Cancellation flag: stops the chain when the host unmounts (RTL
        // cleanup, route change) or StrictMode simulates the unmount — the
        // re-run below restarts the chain from scratch.
        let stopped = false;

        // Load the entry at `index`, then yield to the browser before the
        // next one. The macrotask yield (scriptPause(0)) lets the browser
        // paint the newly loaded plugin between loads — that paint IS the
        // "one by one" behaviour.
        const loadFrom = (index: number) => {
            if (stopped || index >= entries.length) return;
            if (index < loadedCountRef.current) {
                // Already loaded (StrictMode remount re-walks the chain) —
                // skip forward without re-invoking the factory.
                scriptPause(0).then(() => loadFrom(index + 1));
                return;
            }
            // Build the plugin OUTSIDE the updater (updaters must stay
            // pure — see loadedCountRef above).
            const entry = entries[index];
            const plugin = entry.factory(entry.framework);
            if (stopped) return;
            // Claim the index BEFORE committing, so a parallel chain
            // (StrictMode remount) that reaches this index later skips it.
            loadedCountRef.current = index + 1;
            setPlugins((prev) => (prev.length > index ? prev : [...prev, plugin]));
            scriptPause(0).then(() => loadFrom(index + 1));
        };

        // Index 0 is preloaded by the initializer above — start at 1.
        loadFrom(1);

        return () => {
            stopped = true;
        };
    }, [entries]);

    return { plugins, done: plugins.length >= entries.length };
}
