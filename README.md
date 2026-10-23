# @distribution/worksheets

Printable worksheet generator app — the merged maths + english distribution.
Vite + React, deployable to GitHub Pages (`base: './'`), 79 self-contained
worksheet plugins (38 Math + 37 English + 2 Chemistry + 2 Physic), a
subject-only sidebar (Math, English, Chemistry, Physic), a searchable
worksheet picker, an unbounded difficulty level system, teacher answer keys,
Randomize, print-exact A4 sheets and a Light/Dark/System theme.

## Scripts

| Command | What it does |
|---|---|
| `yarn dev` | Vite dev server |
| `yarn build` | Production build (`dist/`) |
| `yarn test` | Full vitest suite (jsdom) |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn deploy` | Build + push `dist/` to GitHub Pages |

## Architecture in one paragraph

The app is a FRAMEWORK with PLUGINS. `src/framework/` owns the app shell
mount points, the reactive store (`store.tsx`), the difficulty model
(`difficulty.ts`) over the private legacy catalogues (`catalogue.ts`), the
deterministic PRNG (`rng.ts`) + unique-sampling primitives (`sampling.ts`),
document assembly (`document.ts`), the A4 layout components
(`PageStack` / `PrintableSheet` / `ZoomControl` / `AnswerKeySheet`), the
figure renderers (`*Diagram.tsx`, `visuals.tsx`, `tiles.tsx`), the standard
worksheet recipe (`worksheet-kit.tsx`), the level control + worksheet picker
(`LevelControl.tsx` / `WorksheetPicker.tsx`), the theme (`theme.ts` /
`ThemeSelector.tsx`) and the per-subject bundles (`framework.ts`). Every
WORKSHEET is a PLUGIN under `src/plugins/<subject>/` — a factory function
`(dashboard) => dashboard.createWorksheet(spec)`; the registration lists
(`src/plugins/*/index.ts`) are the single integration point.

## Difficulty semantics (read this before adding a worksheet)

The public model is a **level** — a positive, unbounded integer
(`session.level`):

- **Level 1 is the first level of every ladder; level N = legacy grade N−1**
  for every worksheet that sits on a curriculum ladder. There is NO grade
  selector and NO grade labels anywhere in the UI.
- **One title format everywhere**: `"<Label> level <requested>"` (e.g.
  "Addition level 7") — the REQUESTED level, shown even when it overshoots
  the worksheet's own cap. The toolbar, every printed sheet, the answer-key
  pages and the print tab title share this one string.
- **Every worksheet has an INDEPENDENT maximum actual difficulty**
  (`maxLevel`, derived from the catalogue extent: the highest grade whose
  `available` list contains the worksheet id, +1). Levels above it
  **saturate SILENTLY**: the worksheet's *effective* level clamps to
  `maxLevel` — content does not change and the UI announces nothing
  (no "Tops out", no "starts at level N").
- **The generation seed derives from the effective level**
  (`seedFrom([legacyGradeId, specId, refresh])`), so an oversized level can
  never change the printed content — the sheet stays put until Randomize is
  pressed.
- **Advanced topics scale independently**: the six legacy Year-11 senior
  families (calculus, functions, polynomials, trigonometry, expolog, prob11)
  are on their own three-rung ladder (gentle practice → full practice + easy
  challenges → the complete legacy scope), saturating at level 3; they never
  "require Year 11".
- **Science (Chemistry / Physic)** resolves through the shared
  `SCIENCE_GRADES` catalogue: every science plugin is offered from level 1 on
  its own 4-level ladder (the rung rides in `caps.yearLevel`) and saturates
  at level 4.
- Worksheets below their intro level simply render the generic empty state
  (the legacy `offered(grade)` gating runs against the effective grade).

Implementation: `src/framework/difficulty.ts` (`resolveDifficulty`) is the
ONLY translator between the public level and the private legacy
`GradeConfig`/`Caps` in `src/framework/catalogue.ts`.

## Adding a worksheet plugin

1. Create `src/plugins/<subject>/<Name>Worksheet.ts`:

```ts
import type { Caps, DashboardFramework, DashboardPlugin, RawProblem, Rng, WorksheetSpec } from '../../framework';
import { createDeck, sampleUnique } from '../../framework';

function generateStates(rng: Rng, caps: Caps, count: number): RawProblem[] {
    // DETERMINISTIC: same rng stream => same problems. Read the difficulty
    // from caps exactly like every other plugin; the framework clamps the
    // caps at the worksheet's own maximum before calling you.
    return Array.from({ length: count }, () => ({
        prompt: 'Water turning into ice is called __',
        answer: 'freezing'
    }));
}

export const statesSpec: WorksheetSpec = {
    id: 'statesOfMatter',              // unique registry/seed id
    label: 'States of Matter',
    icon: '⚗',
    perPage: 8,
    offered: (grade) => grade.available.includes('statesOfMatter'),
    scope: () => 'solids, liquids & gases',
    generate: generateStates
};

export function StatesOfMatterWorksheet(dashboard: DashboardFramework): DashboardPlugin {
    return dashboard.createWorksheet(statesSpec);
}
```

2. Add ONE entry to the subject's registration list
   (`src/plugins/<subject>/index.ts`):
   `{ factory: StatesOfMatterWorksheet, framework: <SUBJECT>_FRAMEWORK }`.

That is the whole integration: the picker, level control, answer key,
theme, print and difficulty plumbing pick it up automatically. Deleting the
file + the entry removes the worksheet with no other change. A plugin module
must only import from `../../framework` — never from another plugin.

## The science plugins (Chemistry / Physic)

Chemistry and Physic hold four self-contained plugins
(`src/plugins/science/`) over the shared `SCIENCE_GRADES` catalogue
(`src/framework/catalogue.ts`) and the two science bundles
(`CHEMISTRY_FRAMEWORK` / `PHYSIC_FRAMEWORK` in `framework/framework.ts` —
⚗/⚛ glyphs, inline answer keys, compact grid). Each plugin is offered from
level 1 on its own 4-level ladder and saturates silently at level 4:

| Subject | Worksheet | id | Ladder |
|---|---|---|---|
| Chemistry | Elements | `elements` | first 10 → 20 → 30 elements, then Latin-name (natrium/kalium/ferrum/cuprum) + atomic-number clue forms |
| Chemistry | Balancing Equations | `balancing` | cumulative verified pools; every coefficient blank, answers are smallest whole-number vectors in printed order |
| Physic | Speed, Distance & Time | `speed` | d = s×t → hidden speed/time (exact construction) → km/h journeys → whole-journey average speed (total ÷ total, integer-exact) |
| Physic | Circuits & Ohm's Law | `circuits` | V = I×R → hidden current/resistance → series sums → verified parallel pairs (voltage a multiple of Rtotal for current forms) |

Add another science worksheet the same way as any other plugin (factory +
one entry in `src/plugins/science/index.ts`); ids must stay unique across
ALL subjects (they are registry keys and seed parts).

## Answer-key models (both preserved)

- **Math bundle** (`answerKeyStyle: 'pages'`): the teacher key prints as
  dedicated spacious `AnswerKeySheet` PAGES appended after the worksheet
  pages (preview + print). Toggle: `data-testid="toolbar-answers"`.
- **English bundle** (`answerKeyStyle: 'inline'`): the key prints as small
  italic answer lines UNDER each question (T5 marking-guidance model).
  Toggle: `data-testid="toolbar-answer-key"`.
- Both toggles also carry `data-answer-toggle="true"`.

## Print pipeline

The on-screen preview IS the print preview. Print opens the browser-native
dialog (`window.print()`); `@media print` hides `.app-chrome` and reveals the
hidden `.print-doc` tree — one exact 210mm × 297mm block per page. Sheets
paint through the `--paper-*` tokens (theme-adaptive on screen; `@media
print` forces white paper + dark ink for colour-neutral printing). The grid
density per subject ('compact' english / 'roomy' maths) preserves both
source apps' pinned print-capacity budgets.

## Theme

System / Light / Dark selector in the header. The CHOICE persists under the
package-specific localStorage key **`@distribution/worksheets:theme`** (this
app never touches another distribution's stored choice). 'system' follows the
OS live; every environment access is guarded so blocked storage/APIs degrade
gracefully.

## Legacy notes (for the next agent)

- The legacy grade catalogues in `catalogue.ts` are a PRIVATE migration
  adapter: `GradeConfig.id` is the legacy grade id (0 = Prep). The seed
  formula `[grade.id, spec.id, refresh]` is byte-compatible with both source
  apps, which is why every migrated plugin test holds unchanged.
- The six senior plugins read their ladder rung from `caps.yearLevel`
  (1..3) via `seniorRung`; the legacy catalogue's Year-11 row carries
  `yearLevel: 3` (= Full).
- `Caps` is the UNION of both subjects' knobs; a grade config leaves the
  other subject's knobs at neutral zeros. Never read a knob your subject
  does not define.
