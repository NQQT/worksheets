// ─────────────────────────────────────────────────────────────────────────────
// Dashboard plugin store — the reactive state shared by the framework and the
// worksheet plugins.
//
// WHY NOT @presource/react's localContextStore / @reloaded/design here?
//   - localContextStore flushes subscriber re-renders on a setTimeout
//     (macrotask). The dashboard's interactive tests (and the snappy UI feel
//     they pin) assert DOM state IMMEDIATELY after a click, so updates must
//     be synchronous. @reloaded/design additionally never unregisters controls
//     (documented limitation), which conflicts with the delete-a-plugin
//     isolation requirement.
//   - signalState refreshes synchronously but is MODULE-GLOBAL: every test
//     render would share/leak state with the previous one.
//
// So this store is a per-PROVIDER reactive cell built on React 18's
// useSyncExternalStore:
//   - one cell (target + version + listeners) per DashboardContextProvider
//     instance — each host mount (and each test render) starts pristine;
//   - the cell exposes a DEEP reactive proxy: ANY nested assignment
//     (store.session.pageCount = 3) bumps the version and notifies
//     subscribers synchronously, inside the current act()/event tick;
//   - the version number is the useSyncExternalStore snapshot, so React
//     re-renders exactly the subscribed components after each mutation.
//
// Store shape:
// {
//   active:  { pluginId, entryId },        // current selection
//   plugins: { [pluginId]: PluginStore },  // per-plugin scoped slices
//   session: DashboardSession,             // framework-level shared state
// }
//
// Plugin slices are namespaced by plugin id — one plugin can never read or
// write another's slice. forgetPlugin() deletes a slice (and clears the
// selection if it pointed at that plugin), which is what makes plugin deletion
// leave no trace. The SESSION is the framework's own shared configuration
// (difficulty level, page count, zoom, refresh, answer key): every worksheet
// plugin reads it, none of them owns it — that is what makes "takes in the
// dashboard's configurations" literal.
//
// SESSION USES DIFFICULTY, NOT GRADES (R3): `session.level` is the public
// difficulty level (1 = Foundation/Prep, 2 = Grade 1, ...; unbounded, each
// worksheet saturates at its own maximum). The legacy grade catalogue is a
// private adapter (framework/catalogue.ts) resolved per worksheet by
// framework/difficulty.ts.
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useRef, useSyncExternalStore } from 'react';
import { isObject } from '@presource/core';
import type { DashboardSession, PluginId, PluginStore } from './types';

// What lives in the shared store.
export type DashboardStoreStructure = {
    // The currently selected list entry (which plugin's page is showing).
    active: {
        pluginId: PluginId;
        entryId: string;
    };
    // Per-plugin scoped state, namespaced by plugin id.
    plugins: {
        [pluginId: string]: PluginStore;
    };
    // Framework-level shared session state (level, pages, zoom, refresh).
    session: DashboardSession;
};

// The pristine store every fresh provider mount starts from. The session
// defaults mirror the merged dashboard's configuration: level 2 (= Grade 1 /
// Year 1 — the same content both source apps opened on), one page, fit zoom,
// unrandomized, and the TEACHER ANSWER KEY OFF (student print is answer-free
// by default — see types.ts DashboardSession.answerKey).
const INITIAL_STORE: DashboardStoreStructure = {
    active: { pluginId: '', entryId: '' },
    plugins: {},
    session: { level: 2, pageCount: 1, zoom: 'fit', refresh: 0, answerKey: false }
};

// A reactive cell: the mutable target, its deep proxy, a version counter and
// the subscriber set. One cell exists per DashboardContextProvider instance.
type DashboardCell = {
    // Monotonic mutation counter — doubles as the useSyncExternalStore
    // snapshot (numbers are cheap and referentially stable between changes).
    version: number;
    // Registered re-render callbacks (one per subscribed component).
    listeners: Set<() => void>;
    // Proxy cache keyed by TARGET object identity, so repeated reads of the
    // same nested object return the SAME proxy (stable identity for memo
    // deps and === comparisons).
    cache: WeakMap<object, any>;
    // The actual mutable data. Only ever mutated through `proxy`.
    target: DashboardStoreStructure;
    // Deep reactive view of `target` — the value useDashboardStore returns.
    proxy: DashboardStoreStructure;
    // useSyncExternalStore wiring.
    subscribe: (listener: () => void) => () => void;
    getVersion: () => number;
};

// Bump the version and synchronously notify every subscriber. Synchronous is
// the whole point: mutations from inside a fireEvent/act tick are applied to
// the DOM before the next assertion.
function createCell(initial: DashboardStoreStructure): DashboardCell {
    const cell: DashboardCell = {
        version: 0,
        listeners: new Set(),
        cache: new WeakMap(),
        // Shallow-copy the initial shape so no two cells ever share target
        // objects (each provider mount is fully isolated).
        target: {
            active: { ...initial.active },
            plugins: { ...initial.plugins },
            session: { ...initial.session }
        }
    } as DashboardCell;

    const notify = () => {
        cell.version++;
        cell.listeners.forEach((listener) => listener());
    };

    // Wrap a plain object in a reactive proxy. Nested plain objects are
    // wrapped lazily on READ (recursion on get), cached by target identity.
    // Non-plain values (primitives, arrays, functions, React elements) pass
    // through untouched — the store is only meant to hold framework/plugin data.
    const wrap = (value: object): any => {
        if (!isObject(value)) return value;
        const cached = cell.cache.get(value);
        if (cached) return cached;
        const proxy = new Proxy(value, {
            get(target: any, key: string | symbol) {
                const current = target[key];
                // React devtools/internal symbol reads and method calls flow
                // through untouched; only plain-object values get re-wrapped.
                return typeof key === 'symbol' ? current : isObject(current) ? wrap(current) : current;
            },
            set(target: any, key: string | symbol, value: any) {
                if (typeof key === 'symbol') {
                    target[key] = value;
                    return true;
                }
                // No-op writes (same value) do not notify — keeps renders
                // stable when a component "syncs" state it already has.
                if (target[key] === value) return true;
                target[key] = value;
                notify();
                return true;
            },
            deleteProperty(target: any, key: string | symbol) {
                if (typeof key === 'symbol') {
                    delete target[key];
                    return true;
                }
                delete target[key];
                notify();
                return true;
            }
        });
        cell.cache.set(value, proxy);
        return proxy;
    };

    cell.proxy = wrap(cell.target) as DashboardStoreStructure;
    cell.subscribe = (listener) => {
        cell.listeners.add(listener);
        // Returning an unsubscribe fn is required by useSyncExternalStore.
        return () => {
            cell.listeners.delete(listener);
        };
    };
    cell.getVersion = () => cell.version;
    return cell;
}

// One cell per provider instance. The provider creates it via a ref so
// React StrictMode's double render (and any re-render) keeps the SAME cell.
const CellContext = createContext<DashboardCell | null>(null);

// The framework mounts this exactly once, wrapping every plugin slot.
export const DashboardContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const cellRef = useRef<DashboardCell | null>(null);
    if (cellRef.current === null) {
        cellRef.current = createCell(INITIAL_STORE);
    }
    return <CellContext.Provider value={cellRef.current}>{children}</CellContext.Provider>;
};

// Hook for framework components and plugin slots: subscribes to the cell's
// version and returns the deep reactive proxy. Any assignment through the
// returned object re-renders every subscribed component synchronously.
export function useDashboardStore(): DashboardStoreStructure {
    const cell = useContext(CellContext);
    if (!cell) {
        // Guard: using the store outside a provider is always a bug — fail
        // loudly instead of silently rendering stale defaults.
        throw new Error('useDashboardStore must be used inside <DashboardContextProvider>');
    }
    // Snapshot = the version number; subscribe with the same listener set
    // for client and SSR (SSR never mutates, so getVersion is safe there).
    useSyncExternalStore(cell.subscribe, cell.getVersion, cell.getVersion);
    return cell.proxy;
}

// Framework hook: the shared dashboard session (level, pages, zoom, refresh).
// Every worksheet plugin reads its configuration from here — mutations by any
// component (level stepper, stepper, randomize, zoom) re-render all
// subscribers synchronously.
export function useDashboardSession(): DashboardSession {
    return useDashboardStore().session;
}

// ── Store helpers (plain functions over the reactive proxy) ─────────────────
// Deliberately NOT hooks — they take the store as an argument so they are
// usable from effects, event handlers and tests alike.

// Mount a plugin's slice under its own namespace (idempotent: an existing
// slice is LEFT AS-IS so a plugin's state survives host re-renders — a
// re-ensure must never clobber live state).
export function ensurePluginSlice(store: DashboardStoreStructure, pluginId: PluginId, initialStore: PluginStore) {
    if (!store.plugins[pluginId]) {
        // Fresh object per mount: a deleted plugin's previous state never
        // leaks into a NEW registration with the same id.
        store.plugins[pluginId] = { ...initialStore };
    }
}

// Remove a plugin's slice entirely — the deletion story. After this NO trace
// of the plugin remains in the store; if it was active, the selection is
// cleared and the framework's resolver falls back to another plugin. The
// session is intentionally untouched: it belongs to the framework, not to any
// single plugin.
export function forgetPlugin(store: DashboardStoreStructure, pluginId: PluginId) {
    delete store.plugins[pluginId];
    if (store.active.pluginId === pluginId) {
        store.active.pluginId = '';
        store.active.entryId = '';
    }
}

// Select a list entry (activates the owning plugin's page). Only ever called
// from event handlers (picker/rail clicks), never during render.
export function selectEntry(store: DashboardStoreStructure, pluginId: PluginId, entryId: string) {
    store.active.pluginId = pluginId;
    store.active.entryId = entryId;
}
