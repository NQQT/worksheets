// App root — mounts the merged worksheets dashboard.
//
// The app hosts ALL worksheet subjects (Math, English today; Chemistry /
// Physic as prepared slots): subject rail on the left, searchable worksheet
// picker + difficulty level control + theme selector in the header, printable
// sheet preview + print on the right. See src/components/WorksheetsDashboard.tsx
// for the shell and src/framework/ for the plugin contract.
//
// DOCUMENT TITLE (R4): the tab/PDF default name is "Worksheets
// v{package.version}" — the version is the compile-time __APP_VERSION__
// define (vite.config.ts / vitest.config.ts read package.json via
// readFileSync; ambient declaration in src/vite-env.d.ts), so nothing here
// hardcodes it. index.html carries the unversioned fallback for the first
// paint. worksheet-kit's Print still retitles to the worksheet title while
// the dialog is open and restores THIS title afterwards.

import React from 'react';
import { WorksheetsDashboard } from './components';

export function App() {
    // Publish the versioned document title once the app mounts.
    React.useEffect(() => {
        document.title = `Worksheets v${__APP_VERSION__}`;
    }, []);

    return <WorksheetsDashboard />;
}
