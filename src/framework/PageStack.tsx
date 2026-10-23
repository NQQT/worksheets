// A4 page stack — the on-screen preview of a multi-page worksheet document
// (the union of the maths and english PageStacks).
//
// Each page renders at exactly A4 aspect ratio inside a "shell" div, scaled
// by usePageScale for the current zoom. This is a LAYOUT component only: the
// actual page content is a <PrintableSheet> (or the T8 AnswerKeySheet), so
// the preview is pixel-identical to what the browser's native print preview
// shows. The outer field box still provides the dot-grid backdrop and is what
// usePageScale measures (its width = the canvas width) for the 'fit' zoom.
//
// T8 (maths answer-key model): a PageSpec may be `kind: 'key'` — those pages
// render the AnswerKeySheet (id + answer only) instead of the worksheet grid.
// The english inline model passes answerKey to every PrintableSheet instead;
// worksheet-kit builds the page list for whichever model its config declares.
//
// THEME: the page field paints through the colour tokens in app.css
// (--canvas-bg / --canvas-dot); the PageShell uses the --paper-bg token so a
// dark-mode preview shows a dark sheet with light ink (print forces the light
// tokens back — app.css print colour-safety block).
import React, { useRef } from 'react';
import { styledComponent } from '@presource/react';
import { A4_H, A4_W, usePageScale, type ZoomMode } from './page-scale';
import { PrintableSheet, type SheetDensity } from './PrintableSheet';
import { AnswerKeySheet } from './AnswerKeySheet';
import type { Problem } from './document';

export type PageSpec = {
    // The problems printed on this page (already chunked by buildDocument).
    problems: Problem[];
    // Optional "Page i of n" label — drives BOTH the on-screen badge and the
    // in-sheet print footer. Omitted for single-page documents.
    pageLabel?: string;
    // T8 teacher answer key: 'key' pages render the AnswerKeySheet (id +
    // answer only) instead of the worksheet grid. Default = worksheet page.
    kind?: 'worksheet' | 'key';
};

export type PageStackProps = {
    // Sheet heading, e.g. "Addition level 7".
    title: string;
    // Small line under the heading.
    subtitle: string;
    // The chunked pages to preview.
    pages: PageSpec[];
    // 'fit' or a fixed percentage zoom (50/75/100).
    zoom: ZoomMode;
    // Prose-style sheets print one question per row (word problems etc.).
    single?: boolean;
    // Brand line for the in-sheet multi-page print footer (framework config).
    brand?: string;
    // T5 inline teacher answer key (english model): forwarded to every
    // worksheet page's PrintableSheet. Default false = student sheet. The
    // maths model ('pages') keeps this false and renders 'key' pages instead.
    answerKey?: boolean;
    // Per-subject grid density (see PrintableSheet).
    density?: SheetDensity;
    // Test id for the page field root (e.g. "sheet-preview").
    testId?: string;
    // Per-page test id prefix; page i+1 gets `${pageTestId}${i+1}`.
    pageTestId?: string;
};

// The scrollable field the pages stack into. `overflow: visible` is
// deliberate: pages are exactly the width of the field at 'fit' zoom, and
// clipping here would crop the box-shadows.
//
// Cast to ForwardRefExoticComponent so the ref used by usePageScale can be
// passed through (Emotion forwards refs at runtime; @presource/react's typed
// React.FC surface does not expose `ref`).
const StackViewport = styledComponent('div', {
    width: '100%',
    boxSizing: 'border-box',
    position: 'relative',
    // Match the canvas frame's corners (the canvas no longer clips its
    // content with overflow:hidden, so the grid background must round itself).
    borderRadius: 'inherit',
    // Pale teal (light) / deep slate (dark) with a subtle dot grid — the
    // canvas tokens adapt with the theme, the paper on top stays legible.
    background: 'var(--canvas-bg)',
    backgroundImage: 'radial-gradient(circle, var(--canvas-dot) 1px, transparent 1px)',
    backgroundSize: '22px 22px'
}) as unknown as React.ForwardRefExoticComponent<
    React.RefAttributes<HTMLDivElement> &
        React.HTMLAttributes<HTMLElement> & {
            children?: React.ReactNode;
            [breakpoint: string]: any;
        }
>;

// The vertical stack of pages. `width: max-content` + `min-width: 100%` +
// centered margin: pages center when narrower than the viewport and scroll
// horizontally once they are wider.
const Stack = styledComponent('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    padding: '28px 24px',
    width: 'max-content',
    minWidth: '100%',
    margin: '0 auto',
    boxSizing: 'border-box'
});

// Scaled page shell: its box is exactly the SCALED A4 footprint so flex
// layout (gaps, centering) sees the right size; the full-size sheet lives
// inside, scaled and top-left anchored.
const PageShell = styledComponent<{ scale: number }>('div', {
    position: 'relative',
    flexShrink: 0,
    width: ({ scale }) => `${A4_W * scale}px`,
    height: ({ scale }) => `${A4_H * scale}px`,
    // Paper token: matches the sheet inside (white light / dark slate dark)
    // so the shell never flashes a white edge around a dark sheet.
    background: 'var(--paper-bg)',
    overflow: 'hidden',
    borderRadius: '10px',
    boxShadow: 'var(--shadow-page)'
});

// Full-size A4 box scaled down inside the shell (anchored top-left so the
// scaled content lands exactly within the shell's box).
const PageScaleBox = styledComponent<{ scale: number }>('div', {
    width: `${A4_W}px`,
    height: `${A4_H}px`,
    transform: ({ scale }) => `scale(${scale})`,
    transformOrigin: 'top left'
});

// Screen-only "Page i of n" badge pinned to the page's bottom-right corner.
// Never printed (it lives outside PrintableSheet, so the .print-doc tree has
// no such element — the print footer inside the sheet carries the same text).
const PageBadge = styledComponent('div', {
    position: 'absolute',
    right: '10px',
    bottom: '10px',
    padding: '3px 10px',
    borderRadius: '999px',
    border: '1px solid var(--hairline)',
    background: 'var(--badge-bg)',
    color: 'var(--badge-fg)',
    fontSize: '11px',
    fontWeight: 600
});

export function PageStack({ title, subtitle, pages, zoom, single, brand, answerKey, density, testId, pageTestId }: PageStackProps) {
    // Ref to the page field — measured live (its width) for the 'fit' zoom.
    const viewportRef = useRef<HTMLDivElement>(null);
    const scale = usePageScale(viewportRef, zoom);

    return (
        <StackViewport ref={viewportRef} data-testid={testId}>
            <Stack>
                {pages.map((page, i) => (
                    <PageShell
                        key={i}
                        scale={scale}
                        data-testid={pageTestId ? `${pageTestId}${i + 1}` : undefined}
                    >
                        {/* Full A4 sheet, scaled to fit the shell above. T8:
                            'key' pages render the AnswerKeySheet (answers
                            only) instead of the worksheet grid. */}
                        <PageScaleBox scale={scale}>
                            {page.kind === 'key' ? (
                                <AnswerKeySheet
                                    title={title}
                                    entries={page.problems}
                                    pageLabel={page.pageLabel}
                                />
                            ) : (
                                <PrintableSheet
                                    title={title}
                                    subtitle={subtitle}
                                    problems={page.problems}
                                    pageLabel={page.pageLabel}
                                    single={single}
                                    brand={brand}
                                    answerKey={answerKey}
                                    density={density}
                                />
                            )}
                        </PageScaleBox>
                        {/* On-screen multi-page position badge. */}
                        {page.pageLabel && (
                            <PageBadge aria-hidden="true">
                                {page.pageLabel}
                            </PageBadge>
                        )}
                    </PageShell>
                ))}
            </Stack>
        </StackViewport>
    );
}
