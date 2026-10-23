// App tests live in components/WorksheetsDashboard.test.tsx (the full shell
// contract) and framework/* (the model + picker contracts). This file pins
// the App entry: versioned document title + the dashboard host mount.
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { App } from './App';

afterEach(cleanup);

// The full plugin load chain (75 factories) needs generous headroom under
// parallel workspace load.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

describe('App', () => {
    it('publishes the versioned document title from the compile-time __APP_VERSION__', () => {
        render(<App />);
        expect(document.title).toBe(`Worksheets v${__APP_VERSION__}`);
    });

    it('mounts the worksheets dashboard shell (subject rail + picker + preview)', async () => {
        render(<App />);
        // The shell chrome appears in the first paint...
        expect(screen.getByTestId('header-bar')).toBeDefined();
        expect(screen.getByTestId('worksheet-picker-input')).toBeDefined();
        // ...and the default worksheet's preview lands once the first plugin
        // has been loaded (the loader mounts it WITH the first render).
        await waitFor(() => {
            expect(screen.getByTestId('toolbar-title').textContent).toContain('Addition');
        });
    });
});
