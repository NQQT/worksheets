// Vitest config scoped to the Worksheets distribution.
// Uses jsdom environment for React component testing with global APIs.
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Same define as vite.config.ts: vitest.config.ts takes precedence over
// vite.config.ts, so without this the __APP_VERSION__ constant (header
// version display) would be undefined inside tests.
const pkg = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string };

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
    },
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        passWithNoTests: true,
        // The dashboard loads its 75 worksheet plugins ONE BY ONE after mount
        // (chained macrotasks, framework/loader.ts). Tests that await the
        // FULL picker (all plugins loaded) sit on that whole chain — when the
        // monorepo test run goes wide (yarn runs every workspace in parallel)
        // the 5s default testTimeout is not enough headroom. 15s keeps a
        // margin without masking hangs.
        testTimeout: 15000,
    },
});
