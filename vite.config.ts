// Vite config for the Worksheets distribution.
// `base` is set to "./" so all asset paths are relative — works on any GitHub Pages subpath
// e.g. https://username.github.io/repo-name/ without needing to hardcode the repo name.
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Read the package version at config time (raw fs read instead of a JSON
// import so tsconfig does not need resolveJsonModule — same convention as
// every sibling distribution package). It is injected into the bundle via
// `define` below so the header can render "Worksheets v{version}" without
// bundling package.json into the client.
const pkg = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string };

export default defineConfig({
    plugins: [react()],
    // Relative base path so the build works on GitHub Pages subpaths
    base: './',
    define: {
        // Compile-time constant — replaced with the literal version string
        // (e.g. "1.0.2") in both dev and build output.
        __APP_VERSION__: JSON.stringify(pkg.version),
    },
    server: {
        // Never watch the service's shared writable data root: chokidar
        // holding files under temporary/database while the underload service
        // writes them surfaces as sporadic EPERM failures on Windows.
        watch: {
            ignored: ['**/temporary/**']
        }
    },
    build: {
        outDir: 'dist',
    },
});
