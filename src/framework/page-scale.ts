// A4 page geometry + zoom logic shared by the inline preview (PageStack) and
// the hidden print tree (worksheet-kit's print surface). Keeping both here
// means on-screen pages and printed pages can never disagree about page size.
import { useLayoutEffect, useState, type RefObject } from 'react';

// A4 in CSS pixels at 96dpi (210mm / 297mm ≈ 794 / 1123 px). On screen pages
// are rendered at exactly these pixel dimensions and then scaled, so the
// layout is byte-identical to what a 96dpi A4 printer produces — no reflow
// happens at preview sizes.
export const A4_W = 794;
export const A4_H = 1123;

// 'fit' sizes pages to the visible viewport width; the numeric modes are fixed
// percentage zooms (50 => 0.5x, etc.).
export type ZoomMode = 'fit' | 50 | 75 | 100;

// The zoom options rendered by <ZoomControl>, in display order.
export const ZOOM_OPTIONS: ReadonlyArray<{ id: ZoomMode; label: string }> = [
    { id: 'fit', label: 'Fit' },
    { id: 50, label: '50%' },
    { id: 75, label: '75%' },
    { id: 100, label: '100%' }
];

// Horizontal breathing room subtracted from the viewport width when fitting,
// and the sane clamp range so fit-zoom never becomes unreadably small or
// absurdly large on ultra-wide screens.
const PAD_X = 48;
const MIN_FIT = 0.2;
const MAX_FIT = 1.5;

// Fallback before the first measurement lands (one frame, corrected by the
// layout effect below — and the permanent value in jsdom, which has neither
// ResizeObserver nor real element geometry).
const INITIAL_FIT = 0.5;

function clampFit(scale: number): number {
    return Math.max(MIN_FIT, Math.min(MAX_FIT, scale));
}

// Measures the given page-field element (the preview canvas's stack wrapper,
// see PageStack) and returns the pixel scale for the current zoom mode:
//   - 'fit'  => (viewport width - PAD_X) / A4_W, recomputed live through a
//               ResizeObserver so window resizes re-fit automatically;
//   - number => number / 100 (fixed 50/75/100% zoom).
//
// jsdom has no ResizeObserver and reports 0 for clientWidth, so the hook
// degrades to INITIAL_FIT there — tests assert structure/text, never the
// computed pixel scale.
export function usePageScale(target: RefObject<HTMLDivElement>, mode: ZoomMode): number {
    const [fit, setFit] = useState(INITIAL_FIT);

    // useLayoutEffect so the first real measurement happens before paint —
    // no one-frame flash of the fallback scale in a real browser.
    useLayoutEffect(() => {
        const el = target.current;
        if (!el) return;
        // Environments without ResizeObserver (jsdom, very old browsers) keep
        // the fallback scale; nothing to observe.
        if (typeof ResizeObserver === 'undefined') return;
        const measure = () => setFit(clampFit((el.clientWidth - PAD_X) / A4_W));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [target]);

    return mode === 'fit' ? fit : mode / 100;
}
