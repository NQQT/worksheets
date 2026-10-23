// ─────────────────────────────────────────────────────────────────────────────
// Framework barrel — everything a worksheet plugin may import, in one place.
//
// The framework is everything the worksheet plugins USE but none of them OWN:
// the plugin contract (types), the reactive store + session state (store),
// the registry + slot hosts (registry / host), the progressive plugin loader
// (loader), the difficulty model over the private per-subject catalogues
// (difficulty / catalogue), the deterministic PRNG (rng) + unique-sampling
// primitives (sampling), document assembly (document), the A4 layout
// components (PageStack / PrintableSheet / ZoomControl / page-scale), the
// figure renderers, the standard worksheet recipe (worksheet-kit), the
// level control + worksheet picker (LevelControl / WorksheetPicker), the
// DASHBOARD_FRAMEWORK bundles handed to every plugin factory (framework.ts)
// and the distribution palette (theme).
// ─────────────────────────────────────────────────────────────────────────────
export * from './types';
// The difficulty model (public level system + subjects) and the private
// legacy catalogues (migration adapters — tests may import the per-subject
// getters by name; there is deliberately no getGradeConfig export).
export * from './difficulty';
export * from './catalogue';
export * from './rng';
export * from './sampling';
export * from './document';
export * from './page-scale';
export * from './theme';
// The early-years learning-visual pictogram library (inline-SVG cues).
export * from './visuals';
// The early-years tile scaffolds (write-box blanks + scrambled word tiles).
export * from './tiles';
export * from './PageStack';
export * from './PrintableSheet';
// T8 teacher answer key: the separate spacious key page appended when the
// session answerKey flag is on with the 'pages' answer-key model (capacity
// constants exported for its tests).
export * from './AnswerKeySheet';
// Data-only shape figures are shared by preview/print, not coupled to a plugin.
export * from './ShapeTransformationDiagram';
// The rows/columns grid figure is data the generators own (dimensions only);
// this renderer never computes totals or answers.
export * from './RowsColumnsDiagram';
// The remaining family figure renderers share the same contract: draw the
// plugin-supplied data only; answers stay private problem data (PrintableSheet).
export * from './DataDiagram';
export * from './ShapeFigure';
export * from './BondDiagram';
export * from './CompassDiagram';
export * from './MoneyDiagram';
export * from './DivisionDiagram';
export * from './ColumnDiagram';
// Perimeter/area measurement shapes (PerimeterAreaWorksheet): the renderer
// draws the labelled rectangle/L-shape/path only — unknown sides print "?"
// and answers stay private problem data.
export * from './RectangleDiagram';
export * from './ZoomControl';
// R3 controls: the level stepper (replaces the grade selectors) and the
// accessible searchable worksheet picker (replaces the plugin rail).
export * from './LevelControl';
export * from './WorksheetPicker';
// R5 theme-mode control (System/Light/Dark selector + controller hook).
export * from './ThemeSelector';
export * from './store';
export * from './registry';
export * from './loader';
export * from './host';
export * from './worksheet-kit';
export * from './framework';
