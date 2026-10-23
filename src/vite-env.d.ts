/// <reference types="vite/client" />

// Vite client types provide ambient module declarations for asset imports
// (e.g. import './app.css'), which the TypeScript compiler would otherwise
// reject during 	sc --noEmit.

// Compile-time constant injected by Vite define (vite.config.ts /
// vitest.config.ts → __APP_VERSION__: JSON.stringify(pkg.version), read from
// package.json via readFileSync). Ambient declaration keeps 	sc --noEmit
// happy; the runtime value only exists in Vite dev/build output and vitest.
declare const __APP_VERSION__: string;
