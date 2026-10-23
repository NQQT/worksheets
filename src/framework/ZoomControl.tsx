// Segmented zoom switcher (Fit / 50% / 75% / 100%) — framework layout
// component. Pins to the preview canvas (the zoom preference a teacher sets is
// exactly what they'll see when the browser-native print dialog shows the same
// A4 pages).
//
// THEME: the group pill sits on the --pill-bg token (app.css) and the selected
// segment lifts to the --chip-bg chip (white in light mode, slate in dark).
import React from 'react';
import { styledComponent } from '@presource/react';
import { ZOOM_OPTIONS, type ZoomMode } from './page-scale';

export type ZoomControlProps = {
    // Accessible group label, e.g. "Preview zoom".
    label: string;
    value: ZoomMode;
    onChange: (mode: ZoomMode) => void;
};

// Pill container holding the zoom segments.
const ZoomGroup = styledComponent('div', {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    padding: '3px',
    borderRadius: '10px',
    border: '1px solid var(--hairline)',
    flexShrink: 0,
    background: 'var(--pill-bg)'
});

// One zoom segment; the selected one lifts to a solid chip.
const ZoomSegment = styledComponent<{ active: boolean }>('button', {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1,
    cursor: 'pointer',
    flexShrink: 0,
    background: ({ active }) => (active ? 'var(--chip-bg)' : 'transparent'),
    color: ({ active }) => (active ? 'var(--chip-fg)' : 'var(--muted)'),
    // --shadow-chip is a COMPLETE shadow value (offset+blur+colour token),
    // unlike --primary-shadow which is a bare colour composed into a shadow.
    boxShadow: ({ active }) => (active ? 'var(--shadow-chip)' : 'none'),
    transition: 'background 0.12s ease, color 0.12s ease'
});

export function ZoomControl({ label, value, onChange }: ZoomControlProps) {
    return (
        // role/aria-label announce e.g. "Preview zoom: Fit" semantics per button.
        <ZoomGroup role="group" aria-label={label}>
            {ZOOM_OPTIONS.map((opt) => (
                <ZoomSegment
                    key={String(opt.id)}
                    active={value === opt.id}
                    aria-pressed={value === opt.id}
                    aria-label={`${label}: ${opt.label}`}
                    onClick={() => onChange(opt.id)}
                >
                    {opt.label}
                </ZoomSegment>
            ))}
        </ZoomGroup>
    );
}
