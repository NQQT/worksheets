// Barrel export for the Worksheets distribution.
//
// The app is a plugin host: the DASHBOARD FRAMEWORK lives in ./framework
// (difficulty model, store, per-subject catalogues, A4 layouts, worksheet
// recipe), and every worksheet is a self-contained plugin under ./plugins
// (the registration lists are the single registration point).
export { App } from './App';
export * from './components';
export * from './framework';
// The worksheet plugins ship too, so external consumers can load the same
// factories (or build dashboard-compatible plugins against the framework).
export * from './plugins';
