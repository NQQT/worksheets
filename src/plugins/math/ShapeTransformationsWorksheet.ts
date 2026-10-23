// SHAPE TRANSFORMATIONS — self-contained Year-3 spatial worksheet. Existing
// ShapesWorksheet.ts keeps its Years-1/2 recognition questions unchanged;
// framework/grades.ts explicitly offers this separate 'transformations' id.
// The plugin calculates geometry/answers; framework/ShapeTransformationDiagram.tsx
// only draws the supplied original and lettered choices in preview AND print.
import { arrayCreate, arrayEach, stringSwitch } from '@presource/core';
import {
    createDeck, sampleUnique,
    type Caps, type DashboardFramework, type DashboardPlugin, type RawProblem,
    type Rng, type ShapePoint, type ShapeTransformationFigure, type WorksheetSpec
} from '../../framework';

// Reflection axes and quarter-turn directions are explicit so "flip" and
// "rotate 90°" never depend on an unstated convention. Identity is a distractor
// only, not an extra exercise kind requested by the curriculum.
type ShapeTransform = 'original' | 'flip-vertical' | 'flip-horizontal' | 'rotate-clockwise' | 'rotate-anticlockwise';
type ExerciseTransform = Exclude<ShapeTransform, 'original'>;
const EXERCISES: ExerciseTransform[] = ['flip-vertical', 'flip-horizontal', 'rotate-clockwise', 'rotate-anticlockwise'];
const CANDIDATES: ShapeTransform[] = ['original', ...EXERCISES];
const LETTERS = ['A', 'B', 'C', 'D'] as const;

// Coordinates stay on an integer grid centred at (0,0); y increases DOWN in
// SVG (types.ts ShapePoint). Quarter turns therefore use (-y,x) clockwise and
// (y,-x) anticlockwise. No trig rounding, mutation or negative-zero vertices;
// ShapeTransformationsWorksheet.test.ts pins all operations and the origin.
export function transformShapePoints(points: readonly ShapePoint[], transform: ShapeTransform): ShapePoint[] {
    const result: ShapePoint[] = [];
    arrayEach([...points], ({ value: [x, y] }) => {
        const oppositeX = x === 0 ? 0 : -x;
        const oppositeY = y === 0 ? 0 : -y;
        result.push(stringSwitch(transform, {
            original: [x, y],
            'flip-vertical': [oppositeX, y],
            'flip-horizontal': [x, oppositeY],
            'rotate-clockwise': [oppositeY, x],
            'rotate-anticlockwise': [y, oppositeX]
        }));
    });
    return result;
}

// Asymmetric outlines distinguish reflections from turns, unlike a square or
// circle. Unequal triangle legs and L-shape arms also prevent a flip from
// accidentally matching a quarter turn; the full bank's options are tested
// by unordered vertex sets, not merely polygon winding or answer letters.
const SHAPES: { name: string; points: readonly ShapePoint[] }[] = [
    { name: 'triangle', points: [[-3, -2], [2, -2], [-3, 1]] },
    { name: 'L-shape', points: [[-2, -3], [0, -3], [0, 1], [2, 1], [2, 3], [-2, 3]] },
    { name: 'pentagon', points: [[-3, -2], [1, -2], [3, 0], [1, 3], [-3, 1]] }
];

// Each task pairs its prose with the same axis/centre guide the SVG prints.
// A 90° turn is also described as a quarter turn to avoid requiring angle
// vocabulary before a student can solve the pictured task.
const TASKS: Record<ExerciseTransform, { instruction: string; guide: ShapeTransformationFigure['guide'] }> = {
    'flip-vertical': { instruction: 'left to right across the dashed vertical line', guide: 'vertical' },
    'flip-horizontal': { instruction: 'top to bottom across the dashed horizontal line', guide: 'horizontal' },
    'rotate-clockwise': { instruction: '90° clockwise (a quarter turn right) around the dot', guide: 'centre' },
    'rotate-anticlockwise': { instruction: '90° anticlockwise (a quarter turn left) around the dot', guide: 'centre' }
};

// Build one question with exactly one correct candidate and three distinct
// distractors. Both distractor selection and letter order use the framework's
// seeded deck, never Math.random/arrayShuffle, so native print matches preview
// and the same seed yields byte-identical answers (worksheet-kit.tsx).
function makeQuestion(rng: Rng, name: string, original: readonly ShapePoint[], exercise: ExerciseTransform): RawProblem {
    const alternatives: ShapeTransform[] = [];
    arrayEach(CANDIDATES, ({ value }) => {
        if (value !== exercise) alternatives.push(value);
    });
    const distractors = createDeck(rng, alternatives);
    const choices: ShapeTransform[] = [exercise, ...arrayCreate(({ index }) => index < 3 ? distractors.take() : undefined)];
    const optionDeck = createDeck(rng, choices);
    let answer = '';
    const options = arrayCreate(({ index }) => {
        if (index === LETTERS.length) return undefined;
        const transform = optionDeck.take();
        const label = LETTERS[index];
        if (transform === exercise) answer = label;
        return { label, points: transformShapePoints(original, transform) };
    });
    const task = TASKS[exercise];
    const verb = task.guide === 'centre' ? 'Rotate' : 'Flip';
    // CONNECTED task (T2V): the letter answer PLUS naming the move type —
    // "flip" for the mirror-line items, "turn" for the around-the-dot items.
    // Both printed blanks are covered by the comma-separated answer, in
    // printed order. The geometry, options and RNG stream are untouched.
    const moveType = task.guide === 'centre' ? 'turn' : 'flip';
    return {
        prompt: `${verb} ${name} ${task.instruction}. Which option matches? __ Is this a flip or a turn? __`,
        answer: `${answer}, ${moveType}`,
        shapeTransformation: { name, original, options, guide: task.guide }
    };
}

// Three shapes × four starting orientations × four requested operations =
// exactly 48 questions. Numbered variants identify different printed originals
// in the prompt, so sampleUnique(prompt) cannot discard distinct diagrams
// (compare the constant reading prompts in ClockWorksheet.ts).
// Build the finite bank once, independently of count, then deal it: six-/
// twelve-question documents share their prefix and long worksheets repeat
// only after all 48 questions. Bound sampleUnique to the KNOWN finite capacity:
// its count-dependent exhaustion budget would otherwise discard RNG draws
// and change page nine's repeats when page ten is added (adjacent test file).
function generateShapeTransformations(rng: Rng, _caps: Caps, count: number): RawProblem[] {
    const bank: RawProblem[] = [];
    arrayEach(SHAPES, ({ value: shape }) => {
        let original = shape.points;
        arrayEach(arrayCreate(4), ({ index }) => {
            const name = `${shape.name} ${index + 1}`;
            arrayEach(EXERCISES, ({ value: exercise }) => {
                bank.push(makeQuestion(rng, name, original, exercise));
            });
            // Return a new outline: previous bank entries keep their exact
            // original vertices when the next starting orientation is made.
            original = transformShapePoints(original, 'rotate-clockwise');
        });
    });
    const questions = createDeck(rng, bank);
    const firstPass = sampleUnique(Math.min(count, bank.length), () => questions.take(), (problem) => problem.prompt);
    // Continue the SAME deck directly after exhaustion: no skipped cycles,
    // geometry recomputation or adjacent cycle-boundary repeats (sampling.ts).
    return [...firstPass, ...arrayCreate(({ index }) => index < count - firstPass.length ? questions.take() : undefined)];
}

// Five single-column items leave space for prose, an original, four options and
// a handwriting blank on fixed A4 pages (PrintableSheet.tsx / PageStack.tsx).
// LAYOUT CAPACITY (T3M3): worst row = two prompt lines (2×21.6px) + the five
// 88px cards block (6+17+3+88px) = 157.2px; at 6/page the 1fr row is 132.4px
// (overflow), at 5/page 163.6px (margin 6.4). layout-capacity.test.ts.
// Grade gating remains catalogue-owned; no numeric/shape-recognition cap is
// needed for this fixed spatial bank and later grades stay unchanged.
export const shapeTransformationsSpec: WorksheetSpec = {
    id: 'transformations',
    label: 'Shape Transformations',
    icon: '↻',
    perPage: 5,
    singleColumn: true,
    offered: (grade) => grade.available.includes('transformations'),
    scope: () => 'flips & 90° turns',
    generate: generateShapeTransformations
};

// Use the standard plugin recipe for toolbar, preview and native printing;
// this factory is registered, uninvoked, beside Shapes in plugins/index.ts.
export function ShapeTransformationsWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(shapeTransformationsSpec);
}
