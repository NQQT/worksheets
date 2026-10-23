// PrintableSheet owns layout and blanks, not answers or transformations.
// See types.ts for figure data, ShapeTransformationDiagram.test.tsx for exact
// vertices, and plugins/plugins.test.tsx for the existing clock integration.
import React from 'react';
import { arrayCreate, arrayEach } from '@presource/core';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PrintableSheet } from './PrintableSheet';
import type { Problem } from './document';
import type { ShapeTransformationFigure } from './types';

afterEach(cleanup);

const heading = {
    title: 'Year 3 - Shape Transformations',
    subtitle: 'Flips and quarter turns',
    testId: 'printed-sheet'
};

// A local rendering fixture keeps these tests independent of the plugin's RNG,
// grade gating and answer selection (ShapeTransformationsWorksheet.test.ts).
const figure: ShapeTransformationFigure = {
    name: 'triangle',
    original: [[-2, -2], [2, -2], [-2, 1]],
    options: [
        { label: 'A', points: [[2, -2], [-2, -2], [2, 1]] },
        { label: 'B', points: [[-2, -2], [2, -2], [-2, 1]] },
        { label: 'C', points: [[2, 2], [-2, 2], [2, -1]] },
        { label: 'D', points: [[-2, 2], [2, 2], [-2, -1]] }
    ],
    guide: 'vertical'
};

// jsdom does not evaluate styledComponent's min-width media rules. Reading
// matching declarations pins actual generated CSS without mocking the sheet;
// in particular, unitless line-height/flex must not become rem dimensions.
function declarations(element: Element, properties: string[]) {
    const values: Record<string, string> = {};
    arrayEach(properties, ({ value }) => { values[value] = ''; });
    function inspect(rules: CSSRuleList) {
        arrayEach([...rules], ({ value: rule }) => {
            const styleRule = rule as CSSStyleRule;
            if (styleRule.selectorText && element.matches(styleRule.selectorText)) {
                arrayEach(properties, ({ value }) => {
                    const declaration = styleRule.style.getPropertyValue(value);
                    if (declaration) values[value] = declaration;
                });
            } else if ('cssRules' in rule) {
                inspect((rule as CSSMediaRule).cssRules);
            }
        });
    }
    arrayEach([...document.styleSheets], ({ value }) => { inspect(value.cssRules); });
    return values;
}

// Text nodes and empty spans expose blank placement without depending on
// generated Emotion class names or mistaking diagram labels for prompt text.
function contentNodes(element: Element) {
    return arrayCreate(({ index }) => {
        const node = element.childNodes[index];
        return node && { name: node.nodeName, text: node.textContent };
    });
}

const textProperties = ['font-size', 'line-height', 'display', 'min-width', 'flex', 'white-space'];
const legacyText = {
    'font-size': '', 'line-height': '', display: '', 'min-width': '', flex: '', 'white-space': 'pre-wrap'
};
const illustratedText = {
    'font-size': '16px', 'line-height': '1.35', display: 'block', 'min-width': '0px', flex: '1 1 0%', 'white-space': 'pre-wrap'
};

describe('PrintableSheet', () => {
    // Legacy text sheets keep two columns, inherited typography, short/wide
    // blanks, continuous numbering and the optional multi-page footer.
    it('prints exact text, blanks and page metadata without a diagram', () => {
        const problems: Problem[] = [
            { id: 7, type: 'text', prompt: 'Choose __, then __.', answer: 'PRIVATE ANSWER' },
            { id: 8, type: 'text', prompt: 'Write the time in words: __.', answer: 'PRIVATE ANSWER', wideBlanks: true },
            { id: 9, type: 'text', prompt: 'Explain your answer:', answer: 'PRIVATE ANSWER', answerLine: true }
        ];
        render(<PrintableSheet {...heading} problems={problems} density="roomy" brand="Math Worksheets" pageLabel="Page 2 of 3" />);
        const page = screen.getByTestId('printed-sheet');
        const grid = page.children[2];
        const firstText = grid.children[0].lastElementChild!;
        const secondText = grid.children[1].lastElementChild!;
        const thirdText = grid.children[2].lastElementChild!;

        expect(page.textContent).toBe(
            'Year 3 - Shape TransformationsFlips and quarter turnsName: Date: ' +
            '7.Choose , then .8.Write the time in words: .9.Explain your answer:Math WorksheetsPage 2 of 3'
        );
        // PAPER SAFEGUARD (R5): the sheet paints paper + ink through the paper TOKENS (see below)
        // colours (not theme vars) so the on-screen preview equals the print
        // under every theme; app.css @media print re-forces them (pinned in
        // src/theme/theme.test.ts source pins). jsdom's CSSOM serialises the
        // source hex (var(--paper-bg) / var(--paper-ink) in PrintableSheet.tsx) back as rgb(),
        // so the pin asserts that exact serialisation — a var(--...) value
        // would come through verbatim and fail this pin.
        expect(declarations(page, ['background-color', 'color'])).toEqual({
            'background-color': 'var(--paper-bg)', color: 'var(--paper-ink)'
        });
        expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(heading.title);
        expect(screen.getByText(heading.subtitle).tagName).toBe('P');
        expect(arrayCreate(({ index }) => grid.children[index]?.firstElementChild?.textContent)).toEqual(['7.', '8.', '9.']);
        expect(declarations(grid, ['grid-template-columns'])).toEqual({ 'grid-template-columns': '1fr 1fr' });
        expect(page.querySelectorAll('svg').length).toBe(0);
        expect(contentNodes(firstText)).toEqual([
            { name: '#text', text: 'Choose ' },
            { name: 'SPAN', text: '' },
            { name: '#text', text: ', then ' },
            { name: 'SPAN', text: '' },
            { name: '#text', text: '.' }
        ]);
        expect(contentNodes(secondText)).toEqual([
            { name: '#text', text: 'Write the time in words: ' },
            { name: 'SPAN', text: '' },
            { name: '#text', text: '.' }
        ]);
        expect(contentNodes(thirdText)).toEqual([
            { name: '#text', text: 'Explain your answer:' },
            { name: 'SPAN', text: '' }
        ]);
        expect(declarations(firstText.children[0], ['min-width'])).toEqual({ 'min-width': '56px' });
        expect(declarations(firstText.children[1], ['min-width'])).toEqual({ 'min-width': '56px' });
        expect(declarations(secondText.children[0], ['min-width'])).toEqual({ 'min-width': '160px' });
        expect(declarations(screen.getByText('Name:').children[0], ['min-width'])).toEqual({ 'min-width': '160px' });
        expect(declarations(screen.getByText('Date:').children[0], ['min-width'])).toEqual({ 'min-width': '160px' });
        expect(declarations(thirdText.children[0], ['display', 'height', 'margin-top'])).toEqual({
            display: 'block', height: '1.5em', 'margin-top': '14px'
        });
        // jsdom cannot resolve var() inside the border shorthand, so the width
        // pin reads the raw declaration instead of getComputedStyle.
        expect(declarations(thirdText.children[0], ['border-bottom'])).toEqual({ 'border-bottom': '2.5px solid var(--paper-ink)' });
        arrayEach([...grid.children], ({ value: row }) => {
            expect(declarations(row, ['font-size', 'line-height'])).toEqual({ 'font-size': '22px', 'line-height': '1.5' });
            expect(declarations(row.lastElementChild!, textProperties)).toEqual(legacyText);
        });
    });

    // ShapeTransformationsWorksheet requests six rows and singleColumn. All
    // guides use the same sheet path; letter blanks stay before the figures.
    it('prints six illustrated questions in one column with their numbers, header and footer', () => {
        const questions: { prompt: string; guide: ShapeTransformationFigure['guide'] }[] = [
            { prompt: 'Flip the triangle across the vertical mirror line. Letter: __.', guide: 'vertical' },
            { prompt: 'Flip the triangle across the horizontal mirror line. Letter: __.', guide: 'horizontal' },
            { prompt: 'Turn the triangle 90 degrees clockwise about the dot. Letter: __.', guide: 'centre' },
            { prompt: 'Turn the triangle 90 degrees anticlockwise about the dot. Letter: __.', guide: 'centre' },
            { prompt: 'Flip the triangle from left to right. Letter: __.', guide: 'vertical' },
            { prompt: 'Flip the triangle from top to bottom. Letter: __.', guide: 'horizontal' }
        ];
        const problems: Problem[] = arrayCreate(({ index }) => {
            const question = questions[index];
            return question && {
                id: index + 7,
                type: 'shape-fixture',
                prompt: question.prompt,
                answer: 'PRIVATE SHAPE ANSWER',
                shapeTransformation: { ...figure, guide: question.guide }
            };
        });
        render(<PrintableSheet {...heading} problems={problems} single density="roomy" brand="Math Worksheets" pageLabel="Page 2 of 3" />);
        const page = screen.getByTestId('printed-sheet');
        const grid = page.children[2];

        expect(page.children[0].textContent).toBe('Year 3 - Shape TransformationsFlips and quarter turnsName: Date: ');
        expect(page.lastElementChild!.textContent).toBe('Math WorksheetsPage 2 of 3');
        expect(declarations(grid, ['grid-template-columns'])).toEqual({ 'grid-template-columns': '1fr' });
        expect(arrayCreate(({ index }) => grid.children[index]?.firstElementChild?.textContent)).toEqual([
            '7.', '8.', '9.', '10.', '11.', '12.'
        ]);
        expect(arrayCreate(({ index }) => grid.children[index]?.lastElementChild?.textContent)).toEqual([
            'Flip the triangle across the vertical mirror line. Letter: .OriginalABCD',
            'Flip the triangle across the horizontal mirror line. Letter: .OriginalABCD',
            'Turn the triangle 90 degrees clockwise about the dot. Letter: .OriginalABCD',
            'Turn the triangle 90 degrees anticlockwise about the dot. Letter: .OriginalABCD',
            'Flip the triangle from left to right. Letter: .OriginalABCD',
            'Flip the triangle from top to bottom. Letter: .OriginalABCD'
        ]);
        expect(page.querySelectorAll('svg').length).toBe(30);
        arrayEach([...grid.children], ({ value: row }) => {
            const text = row.lastElementChild!;
            expect(text.tagName).toBe('SPAN');
            expect(declarations(text, textProperties)).toEqual(illustratedText);
            expect(declarations(text.children[0], ['min-width'])).toEqual({ 'min-width': '56px' });
            expect(text.children[1].textContent).toBe('OriginalABCD');
            expect(text.children[1].tagName).toBe('SPAN');
            expect(text.childNodes[2].textContent).toBe('.');
        });
        expect(page.querySelector('[style]')).toBe(null);
    });

    // RowsColumnsWorksheet requests six single-column rows and a dimensions-only
    // grid figure. Pin the shared sheet path: one neutral SVG grid per item,
    // exact 12-unit cell lattice, illustrated typography — answers never enter
    // the DOM.
    it('prints six rows/columns grid questions with neutral figures and private answers', () => {
        const grids = [
            { rows: 3, cols: 4 },
            { rows: 2, cols: 3 },
            { rows: 4, cols: 5 },
            { rows: 1, cols: 5 },
            { rows: 5, cols: 2 },
            { rows: 2, cols: 2 }
        ];
        const problems: Problem[] = arrayCreate(({ index }) => {
            const grid = grids[index];
            return grid && {
                id: index + 13,
                type: 'rowscolumns',
                prompt: `How many squares are in a grid of ${grid.rows} rows and ${grid.cols} columns? __`,
                answer: 'PRIVATE GRID ANSWER',
                rowsColumns: grid
            };
        });
        render(<PrintableSheet {...heading} problems={problems} single density="roomy" />);
        const page = screen.getByTestId('printed-sheet');
        const grid = page.children[2];

        expect(arrayCreate(({ index }) => grid.children[index]?.firstElementChild?.textContent)).toEqual([
            '13.', '14.', '15.', '16.', '17.', '18.'
        ]);
        // One square-lattice SVG per question, dimensions only:
        const svgs = page.querySelectorAll('svg');
        expect(svgs).toHaveLength(6);
        const first = svgs[0];
        expect(first.getAttribute('aria-label')).toBe('grid of squares');
        expect(first.getAttribute('viewBox')).toBe('0 0 48 36');
        expect(first.getAttribute('width')).toBe('80px');
        expect(first.getAttribute('height')).toBe('60px');
        expect(arrayCreate(({ index }) => first.querySelectorAll('rect')[index]?.outerHTML)).toEqual([
            '<rect x="1" y="1" width="10" height="10" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="1"></rect>',
            '<rect x="13" y="1" width="10" height="10" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="1"></rect>',
            '<rect x="25" y="1" width="10" height="10" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="1"></rect>',
            '<rect x="37" y="1" width="10" height="10" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="1"></rect>',
            '<rect x="1" y="13" width="10" height="10" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="1"></rect>',
            '<rect x="13" y="13" width="10" height="10" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="1"></rect>',
            '<rect x="25" y="13" width="10" height="10" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="1"></rect>',
            '<rect x="37" y="13" width="10" height="10" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="1"></rect>',
            '<rect x="1" y="25" width="10" height="10" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="1"></rect>',
            '<rect x="13" y="25" width="10" height="10" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="1"></rect>',
            '<rect x="25" y="25" width="10" height="10" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="1"></rect>',
            '<rect x="37" y="25" width="10" height="10" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="1"></rect>'
        ]);
        // 5 × 2 grid (item 17: 5 rows, 2 columns): viewBox width comes from
        // columns and height from rows, following the same 12-unit cell rule.
        expect(svgs[4].getAttribute('viewBox')).toBe('0 0 24 60');
        expect(svgs[4].querySelectorAll('rect').length).toBe(10);
        // Illustrated typography (compact block layout, full row width) and
        // no private answer text anywhere in the sheet.
        arrayEach([...grid.children], ({ value: row }) => {
            expect(declarations(row.lastElementChild!, textProperties)).toEqual(illustratedText);
        });
        expect(page.textContent).not.toContain('PRIVATE');
        expect(page.querySelector('[style]')).toBe(null);
    });

    // Optional illustration and answerLine are independent. A wide inline
    // blank must survive too, and changing private answers cannot alter DOM.
    it.each([false, true])('preserves blanks and bottom answer space without a footer (illustrated: %s)', (illustrated) => {
        const problem: Problem = {
            id: 25,
            type: 'fixture',
            prompt: 'Choose __, then explain.',
            answer: 'PRIVATE ANSWER ONE',
            wideBlanks: true,
            answerLine: true,
            ...(illustrated ? { shapeTransformation: figure } : {})
        };
        const { rerender } = render(<PrintableSheet {...heading} problems={[problem]} single density="roomy" />);
        const page = screen.getByTestId('printed-sheet');
        const text = page.children[2].children[0].lastElementChild!;
        expect(page.children.length).toBe(3);
        expect(page.textContent).toBe(
            'Year 3 - Shape TransformationsFlips and quarter turnsName: Date: 25.Choose , then explain.' +
            (illustrated ? 'OriginalABCD' : '')
        );
        expect(contentNodes(text)).toEqual([
            { name: '#text', text: 'Choose ' },
            { name: 'SPAN', text: '' },
            { name: '#text', text: ', then explain.' },
            ...(illustrated ? [{ name: 'SPAN', text: 'OriginalABCD' }] : []),
            { name: 'SPAN', text: '' }
        ]);
        expect(declarations(text, textProperties)).toEqual(illustrated ? illustratedText : legacyText);
        expect(declarations(text.children[0], ['min-width'])).toEqual({ 'min-width': '160px' });
        expect(declarations(text.lastElementChild!, ['display', 'height', 'margin-top'])).toEqual({
            display: 'block', height: '1.5em', 'margin-top': '14px'
        });
        // jsdom cannot resolve var() inside the border shorthand (see above).
        expect(declarations(text.lastElementChild!, ['border-bottom'])).toEqual({ 'border-bottom': '2.5px solid var(--paper-ink)' });
        const originalMarkup = page.outerHTML;
        rerender(<PrintableSheet {...heading} problems={[{ ...problem, answer: 'PRIVATE ANSWER TWO' }]} single density="roomy" />);
        expect(page.outerHTML).toBe(originalMarkup);
    });

    // The clock section of plugins/plugins.test.tsx covers the real worksheet.
    // Pin the legacy drawn/blank face geometry and prompt order here so shape
    // integration cannot restyle clocks or replace pure-text conversion rows.
    it('keeps reading clocks, blank drawing faces and text-only clock questions unchanged', () => {
        const problems: Problem[] = [
            { id: 1, type: 'clock', prompt: 'Write the digital time: __.', answer: '3:00', clock: { hour: 3, minute: 0 }, wideBlanks: true },
            { id: 2, type: 'clock', prompt: "Draw the hands to show 3 o'clock.", answer: 'PRIVATE ANSWER', clock: { hour: 3, minute: 0, hands: false } },
            { id: 3, type: 'clock', prompt: 'Write 3:00 in words:', answer: 'PRIVATE ANSWER', answerLine: true }
        ];
        render(<PrintableSheet title="Year 2 - Clock Faces" subtitle="Reading and drawing clocks" testId="printed-sheet" problems={problems} density="roomy" />);
        const page = screen.getByTestId('printed-sheet');
        const grid = page.children[2];
        const images = screen.getAllByRole('img');
        const numerals = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

        expect(page.textContent).toBe(
            'Year 2 - Clock FacesReading and drawing clocksName: Date: ' +
            "1.123456789101112Write the digital time: .2.123456789101112Draw the hands to show 3 o'clock.3.Write 3:00 in words:"
        );
        expect(arrayCreate(({ index }) => {
            const image = images[index];
            if (!image) return undefined;
            const circles = image.querySelectorAll('circle');
            const numbers = image.querySelectorAll('text');
            return {
                name: image.getAttribute('aria-label'),
                viewBox: image.getAttribute('viewBox'),
                width: image.getAttribute('width'),
                height: image.getAttribute('height'),
                lines: image.querySelectorAll('line').length,
                circles: arrayCreate(({ index: circleIndex }) => circles[circleIndex]?.outerHTML),
                numbers: arrayCreate(({ index: numberIndex }) => numbers[numberIndex]?.textContent)
            };
        })).toEqual([
            {
                name: 'clock showing 3:00', viewBox: '0 0 64 64', width: '120', height: '120', lines: 14,
                circles: [
                    '<circle cx="32" cy="32" r="30" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="2"></circle>',
                    '<circle cx="32" cy="32" r="2" fill="var(--paper-ink)"></circle>'
                ],
                numbers: numerals
            },
            {
                name: 'blank clock face', viewBox: '0 0 64 64', width: '120', height: '120', lines: 12,
                circles: ['<circle cx="32" cy="32" r="30" fill="var(--paper-bg)" stroke="var(--paper-ink)" stroke-width="2"></circle>'],
                numbers: numerals
            }
        ]);
        const hands = images[0].querySelectorAll('line[stroke-width="3.5"], line[stroke-width="2.5"]');
        expect(arrayCreate(({ index }) => hands[index]?.outerHTML)).toEqual([
            '<line x1="32" y1="32" x2="45" y2="32" stroke="var(--paper-ink)" stroke-width="3.5" stroke-linecap="round"></line>',
            '<line x1="32" y1="32" x2="32" y2="10" stroke="var(--paper-ink)" stroke-width="2.5" stroke-linecap="round"></line>'
        ]);
        expect(contentNodes(grid.children[0])).toEqual([
            { name: 'SPAN', text: '1.' },
            { name: 'SPAN', text: '123456789101112' },
            { name: 'SPAN', text: 'Write the digital time: .' }
        ]);
        expect(contentNodes(grid.children[1])).toEqual([
            { name: 'SPAN', text: '2.' },
            { name: 'SPAN', text: '123456789101112' },
            { name: 'SPAN', text: "Draw the hands to show 3 o'clock." }
        ]);
        expect(contentNodes(grid.children[2])).toEqual([
            { name: 'SPAN', text: '3.' },
            { name: 'SPAN', text: 'Write 3:00 in words:' }
        ]);
        arrayEach([...grid.children], ({ value: row }) => {
            expect(declarations(row.lastElementChild!, textProperties)).toEqual(legacyText);
        });
        expect(page.querySelectorAll('polygon').length).toBe(0);
    });

    // Every figure family (types.ts) shares one sheet path: the figure renders
    // after the prompt, illustrated typography applies, the private answer
    // stays out of the DOM and no inline style attributes are introduced.
    it('prints all figure families with neutral figures and private answers', () => {
        const problems: Problem[] = [
            { id: 1, type: 'data', prompt: 'Count the tallies: __.', answer: 'PRIVATE TALLY TOTAL', data: { kind: 'tally', total: 13 } },
            { id: 2, type: 'shapes', prompt: 'How many sides does a triangle have? __', answer: 'PRIVATE SIDE COUNT', shapes: [{ name: 'triangle', kind: '2d' }, { name: 'cube', kind: '3d' }] },
            { id: 3, type: 'bonds', prompt: '4 + __ = 10', answer: 'PRIVATE BOND PART', bond: { whole: 10, left: 4, right: null } },
            { id: 4, type: 'compass', prompt: 'You are facing North. What direction is on your left? __', answer: 'PRIVATE DIRECTION', compass: { map: false, facing: 'North' } },
            { id: 5, type: 'money', prompt: 'You have one $1 note and one ten-cent coin. How much money is there in all? __', answer: 'PRIVATE TOTAL', money: { given: [100, 10] } },
            { id: 6, type: 'division', prompt: 'Max had 12 crayons. Max shared them equally between 2 friends. How many crayons does each friend get? __', answer: 'PRIVATE QUOTIENT', division: { kind: 'share', friends: 2, total: 12 } },
            { id: 7, type: 'column', prompt: '53 + 942 = __', answer: 'PRIVATE SUM', column: { terms: [53, 942], op: '+' } },
            // Perimeter/area family (PerimeterAreaWorksheet): the garden's
            // GIVEN sides ride in the figure; the OUTER perimeter is the
            // private answer and must never enter the DOM (RectangleDiagram
            // draws only the labelled garden + shaded path band).
            { id: 8, type: 'perimeterarea', prompt: 'The garden has a 1 m path all around it. The outer perimeter is __ m', answer: 'PRIVATE OUTER PERIMETER', perimeterArea: { kind: 'path', length: 18, width: 17, path: 1, unit: 'm' } }
        ];
        render(<PrintableSheet {...heading} problems={problems} single density="roomy" />);
        const page = screen.getByTestId('printed-sheet');
        const grid = page.children[2];

        // One figure SVG per family (the shapes row carries two cards).
        const svgs = page.querySelectorAll('svg');
        expect(arrayCreate(({ index }) => svgs[index]?.getAttribute('aria-label'))).toEqual([
            'tally marks', 'shape triangle', 'shape cube', 'part-part-whole bond',
            'compass rose', 'coins and notes', 'equal groups of objects', 'vertical sum layout',
            'garden with a path around it'
        ]);
        // The shapes row draws its option cards in prompt order (triangle, cube).
        // (the "__" blank renders as an empty span, so no visible punctuation
        // follows the question mark)
        expect(grid.children[1].textContent).toBe(
            '2.How many sides does a triangle have? trianglecube'
        );
        // Illustrated typography on every row (compact block layout), and the
        // PRIVATE answers never enter the sheet's text.
        arrayEach([...grid.children], ({ value: row }) => {
            expect(declarations(row.lastElementChild!, textProperties)).toEqual(illustratedText);
        });
        expect(page.textContent).not.toContain('PRIVATE');
        expect(page.textContent).not.toContain('PRIVATE OUTER PERIMETER');
        expect(page.textContent).not.toContain('815');
        expect(page.textContent).not.toContain('995');
        // Figures introduce no inline style attributes (styledComponent only).
        expect(page.querySelector('[style]')).toBe(null);
    });
});
