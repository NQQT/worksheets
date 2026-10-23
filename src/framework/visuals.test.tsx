// Framework pictogram registry + component tests (see framework/visuals.tsx).
//
// Strategy: the registry is the single source of truth for the picture cues
// printed on early-years sheets. We pin (a) the exact key inventory, (b) the
// graceful-degradation behaviour of hasVisual/visualLabel, and (c) the
// rendering contract of Pictogram/PictogramRow — accessible names, no
// <title> (a title's text would leak into row textContent and break the
// exact row-text pins in components/EnglishDashboard.test.tsx), quantity
// clamping, and byte-deterministic output (the same art on every render and
// every machine — no emoji, no network).

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import {
    Pictogram,
    PictogramRow,
    hasVisual,
    visualLabel,
    visualKeys
} from './visuals';

afterEach(() => {
    cleanup();
});

describe('visuals registry', () => {
    it('exposes the exact key inventory (94 cues: animals, foods, objects, concepts, colours)', () => {
        expect(visualKeys()).toEqual([
            'ant', 'bird', 'bee', 'butterfly', 'cat', 'cow', 'dog', 'duck',
            'elephant', 'fish', 'frog', 'horse', 'kangaroo', 'koala', 'lion',
            'monkey', 'mouse', 'pig', 'rabbit', 'rat', 'sheep', 'snake',
            'spider', 'tiger', 'snail',
            'apple', 'banana', 'cake', 'bread', 'cookie', 'honey', 'lemon',
            'orange',
            'bag', 'ball', 'bed', 'boat', 'box', 'bus', 'chair', 'clock',
            'cloud', 'cup', 'door', 'fan', 'flower', 'hat', 'house', 'key',
            'light', 'map', 'moon', 'net', 'night', 'pencil', 'pen', 'plane',
            'pot', 'rain', 'river', 'snow', 'star', 'sun', 'top', 'train',
            'tree', 'umbrella', 'water', 'window', 'watch', 'school',
            'fire', 'ice', 'feather', 'weight', 'bolt', 'smile', 'cry',
            'sparkle', 'action', 'zzz', 'speaker', 'drop', 'cupFull',
            'cupEmpty', 'trophy', 'arrowUp', 'arrowDown', 'barLong',
            'barShort', 'xmark',
            'red', 'green', 'purple'
        ]);
    });

    it('hasVisual: true exactly for registered keys, false for unknown/empty keys', () => {
        expect(hasVisual('cat')).toBe(true);
        expect(hasVisual('fire')).toBe(true);
        expect(hasVisual('noSuchCue')).toBe(false);
        expect(hasVisual('')).toBe(false);
        expect(hasVisual(undefined)).toBe(false);
    });

    it('visualLabel: the registered human name, and the key itself when unregistered', () => {
        expect(visualLabel('cat')).toBe('a cat');
        expect(visualLabel('apple')).toBe('an apple');
        expect(visualLabel('action')).toBe('an action');
        expect(visualLabel('red')).toBe('the colour red');
        // Graceful degradation: an unknown key returns itself (no crash).
        expect(visualLabel('noSuchCue')).toBe('noSuchCue');
    });
});

describe('Pictogram component', () => {
    it('renders a known cue as an inline svg with role=img and an accessible name', () => {
        render(<Pictogram icon="cat" />);
        const svg = screen.getByRole('img');
        // jsdom reports html/SVG element tagNames in lower case.
        expect(svg.tagName).toBe('svg');
        expect(svg.getAttribute('aria-label')).toBe('Picture of a cat');
        // Print-safe defaults from the frame (see visuals.tsx PictoSvg).
        expect(svg.getAttribute('width')).toBe('26');
        expect(svg.getAttribute('height')).toBe('26');
        expect(svg.getAttribute('viewBox')).toBe('0 0 32 32');
        // NO <title> child: a title's text would leak into textContent and
        // break the exact row-text pins. The svg must contribute zero text.
        expect(svg.querySelectorAll('title').length).toBe(0);
        expect(svg.textContent).toBe('');
    });

    it('renders nothing for an unregistered key (graceful degradation)', () => {
        const { container } = render(<Pictogram icon="noSuchCue" />);
        expect(container.innerHTML).toBe('');
    });

    it('respects a custom size and the announce flag', () => {
        render(<Pictogram icon="sun" size={40} />);
        expect(screen.getByRole('img').getAttribute('width')).toBe('40');
        cleanup();

        // announce={false}: purely-decorative repeat — aria-hidden, no role.
        const { container } = render(<Pictogram icon="sun" announce={false} />);
        const svg = container.querySelector('svg')!;
        expect(svg.getAttribute('aria-hidden')).toBe('true');
        expect(svg.getAttribute('role')).toBe(null);
        expect(svg.getAttribute('aria-label')).toBe(null);
    });

    it('is byte-deterministic: the same cue renders identical svg markup', () => {
        const first = render(<Pictogram icon="sun" />);
        const markup1 = first.container.querySelector('svg')!.outerHTML;
        first.unmount();
        const second = render(<Pictogram icon="sun" />);
        expect(second.container.querySelector('svg')!.outerHTML).toBe(markup1);
    });

    it('snapshots the sun cue (pin the exact svg byte stream)', () => {
        const { container } = render(<Pictogram icon="sun" />);
        expect(container.querySelector('svg')!.outerHTML).toMatchSnapshot();
    });
});

// T4 a11y contract: the row is ONE conceptual image, so the WRAPPER span
// carries the sole role="img" + aria-label (the full quantity: "Picture of a
// cat" / "Picture of a cat, 3 copies") and EVERY inner svg is aria-hidden
// with no role/label of its own. Announcing only the first copy (the old
// behaviour) hid the 1-vs-3 quantity from assistive tech — the exact
// distinction the quantity contrast exists to teach (see visuals.tsx).
describe('PictogramRow component (quantity contrast)', () => {
    it('count 1 (default): one full-size (26px) svg; the wrapper announces "Picture of a cat"', () => {
        const { container } = render(<PictogramRow icon="cat" count={1} />);
        const svgs = container.querySelectorAll('svg');
        expect(svgs.length).toBe(1);
        expect(svgs[0].getAttribute('width')).toBe('26');
        // The single accessible name sits on the wrapper span, NOT the svg.
        const row = container.querySelector('[data-testid="pictogram-row"]')!;
        expect(row.getAttribute('role')).toBe('img');
        expect(row.getAttribute('aria-label')).toBe('Picture of a cat');
        // The copy is decorative: hidden from assistive tech, no role/label.
        expect(svgs[0].getAttribute('aria-hidden')).toBe('true');
        expect(svgs[0].getAttribute('role')).toBe(null);
        expect(svgs[0].getAttribute('aria-label')).toBe(null);
    });

    it('count 3: three svgs sized [18, 22, 18]; the wrapper announces the whole quantity', () => {
        const { container } = render(<PictogramRow icon="cat" count={3} />);
        const svgs = container.querySelectorAll('svg');
        expect(svgs.length).toBe(3);
        expect([svgs[0], svgs[1], svgs[2]].map((s) => s.getAttribute('width'))).toEqual(['18', '22', '18']);
        // Exactly ONE accessible name for the whole quantity row — the
        // wrapper — and it names the QUANTITY (not just the first copy).
        expect(container.querySelectorAll('[role="img"]').length).toBe(1);
        const row = container.querySelector('[data-testid="pictogram-row"]')!;
        expect(row.getAttribute('role')).toBe('img');
        expect(row.getAttribute('aria-label')).toBe('Picture of a cat, 3 copies');
        // ALL copies are decorative: hidden, no role, no label.
        for (const svg of [svgs[0], svgs[1], svgs[2]]) {
            expect(svg.getAttribute('aria-hidden')).toBe('true');
            expect(svg.getAttribute('role')).toBe(null);
            expect(svg.getAttribute('aria-label')).toBe(null);
        }
        expect(container.querySelector('[data-testid="pictogram-row"]')).not.toBeNull();
    });

    it('clamps the count into 1..3 (0 → 1, 99 → 3, and the count never renders a 4th svg)', () => {
        const zero = render(<PictogramRow icon="cat" count={0} />);
        expect(zero.container.querySelectorAll('svg').length).toBe(1);
        zero.unmount();
        const big = render(<PictogramRow icon="cat" count={99} />);
        expect(big.container.querySelectorAll('svg').length).toBe(3);
        big.unmount();
        const undefinedCount = render(<PictogramRow icon="cat" />);
        expect(undefinedCount.container.querySelectorAll('svg').length).toBe(1);
    });

    it('renders nothing for an unregistered key (no partial rows)', () => {
        const { container } = render(<PictogramRow icon="noSuchCue" count={3} />);
        expect(container.innerHTML).toBe('');
    });
});
