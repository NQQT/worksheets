// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// LEGACY SUBJECT CATALOGUES â€” the PRIVATE migration adapter.
//
// NOT user-facing: the dashboard has no grade selector and the public session
// carries a difficulty LEVEL (framework/difficulty.ts). This module keeps the
// two source distributions' grade catalogues verbatim so every migrated
// plugin keeps its exact legacy content semantics:
//
//   - the MATH catalogue is distribution/maths/src/framework/grades.ts
//     (grades 0..12; 0 = Prep, 1..12 = Year 1..12; Prep..6 + Year 11 have
//     content; caps drive the numeric generators);
//   - the ENGLISH catalogue is distribution/english/src/framework/grades.ts
//     (grades 0..6 implemented; caps drive the word-set generators).
//
// The Cap type is the UNION of both cap shapes: a maths grade config fills the
// english word knobs with neutral zeros (and vice versa), so a generator only
// ever reads the knobs its subject defines and the other subject's values are
// never touched. GradeConfig.id stays the LEGACY grade id â€” the difficulty
// adapter (difficulty.ts) is the only place that maps levels onto it.
//
// LEVEL SEMANTICS (user clarification): level 1 = Foundation/Prep = legacy
// grade 0, level 2 = Grade 1 = legacy grade 1, â€¦ level N = legacy grade Nâˆ’1
// for the curriculum-ladder subjects. Advanced topics (the six senior maths
// families) map onto their OWN ladder rungs instead (see difficulty.ts).
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€ Merged caps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Union of the maths numeric caps and the english word-set caps.
export type Caps = {
    // â”€â”€ Maths numeric caps (consumed by plugins/math generators) â”€â”€
    // Max operand value for addition/subtraction/comparison (grade 1 => 20).
    // For the grades 3..6 arithmetic ladder this IS the difficulty dial:
    // 10 (P) â†’ 20 (Y1) â†’ 100 (Y2) â†’ 1 000 (Y3) â†’ ... â†’ 1 000 000 (Y6).
    opCap: number;
    // Max number of terms in ONE +/- ladder question (2 = classic pairs;
    // 3+ enables multi-addend addition AND multi-subtrahend subtraction
    // from Year 4 upwards).
    addendCap: number;
    // Max value for counting / number-recognition items.
    numCap: number;
    // Max value inside word-problem sentences (kept small for one-line text).
    wordCap: number;
    // Max value reached by skip-counting sequences (also bounds patterns).
    skipCap: number;
    // Which skip intervals (count-by) are enabled for the grade.
    skipSet: readonly number[];
    // Max operand for times-tables (Years 2 and 3 => 10, products to 100);
    // also bounds division where that separate worksheet is offered (Year 2).
    multCap: number;
    // Max base `a` for doubles questions (a + a / a + a+1).
    doubleCap: number;
    // Part-part-whole target for number bonds (10; >= 20 enables 10 & 20).
    bondCap: number;
    // Step sizes for number patterns (repeating patterns are word-based).
    patSet: readonly number[];
    // Shape names offered to the shapes generator (2-D + 3-D).
    shapeSet: readonly string[];
    // Max clock hour (0 => Y1 has no clock items; 12 => Y2 hour & half-past).
    clockCap: number;
    // Max length in cm (0 => informal units only; 100 => Y2 cm + metre).
    metricCap: number;
    // Max number for place-value (tens & ones) items.
    pvCap: number;
    // Max count for tally / picture-graph / column-graph items.
    dataCap: number;
    // Max amount in cents for coins/money items (0 => no money items).
    coinCap: number;
    // Max temperature in Â°C for the temperature worksheet (0 => not offered).
    tempCap: number;
    // Year tier for the upper-primary strands: 0 = Prep..Year 2 or
    // unimplemented, 3..6 = Year 3..6, 11 = the legacy senior set. The
    // strand plugins branch their GENERATOR on this while grade gating stays
    // with `available`. The SIX SENIOR plugins (calculus, functions,
    // polynomials, trigonometry, expolog, prob11) read it as their OWN
    // independent ladder rung 1..3 (see difficulty.ts seniorRung).
    yearLevel: number;
    // Fraction denominators in scope (empty => fractions not offered).
    denSet: readonly number[];
    // Decimal places in scope (0 => decimals not offered).
    decPlaces: number;
    // Max rectangle side length for the perimeter & area worksheet.
    areaSideCap: number;

    // â”€â”€ English word-set caps (consumed by plugins/english generators) â”€â”€
    // Word bank tier: 1 = Prep starter set, 2 = Year 1 set, 3 = Year 2 set,
    // 4 = Year 3 set, 5 = Year 4 set, 6 = Years 5â€“6 set. Higher tiers
    // SUPERSEDE lower ones (a tier-6 sheet may also contain tier-1 words).
    wordTier: number;
    // Max words in a sentence-building line.
    sentenceLen: number;
    // Unlocks Year 2+ tricky forms (irregular plurals, tricky spelling,
    // extended homophone pairs).
    tricky: boolean;
    // EXPLICIT english year-level cap (T5): 0 = Prep, 3..6 = Years 3â€“6. The
    // T5 resource families and the level-gated kinds branch on this value â€”
    // never on fragile wordTier/sentenceLen inference.
    level: number;
};

// A legacy grade configuration (per-subject). `available` lists the worksheet
// plugin ids the grade offers; an unimplemented grade offers nothing.
export type GradeConfig = {
    id: number;
    // Short pill label (P, 1..12) â€” legacy selector chrome, no longer
    // user-facing (the level stepper replaced it); kept for the catalogue
    // tests and the level descriptor mapping.
    short: string;
    // Full label ("Prep", "Year 1", ...). Used only as the private
    // curriculum descriptor behind a level label ("Level 2 (Grade 1)").
    label: string;
    // Whether any sheet content is implemented for this grade at all.
    implemented: boolean;
    // Which worksheet plugin ids are selectable for this grade.
    available: string[];
    // Generator-facing knobs (see Caps).
    caps: Caps;
};

// â”€â”€ Learning-visual cue band (english) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Years 1â€“3 (word tiers 2..4) are the documented band for the picture cues
// (and tile scaffolds) printed beside early-years words. Tier 1 is Prep â€” its
// NON-TRACING sheets stay plain (the Prep word-tracing sheet keeps its word
// pictures by design). Tiers 5..6 (Years 4â€“6) never carry cue metadata. Every
// generator that may attach a cue/uses tile scaffolding funnels through this
// one band check.
export function isEarlyCueBand(caps: Caps): boolean {
    return caps.wordTier >= 2 && caps.wordTier <= 4;
}

// â”€â”€ English catalogue (verbatim from distribution/english grades.ts) â”€â”€â”€â”€â”€â”€â”€â”€â”€

// The catalogue order for the early-reading types (shared by Y1/Y2 lists).
const EARLY_READING = [
    'sight', 'blend', 'sounds', 'vowel', 'opposite', 'rhyme', 'sentence',
    'letters', 'capital', 'punct', 'homophone', 'plural', 'similar', 'wordgap', 'spelling'
] as const;

// The Year-2-only extensions of the early-reading set (in rail order).
const Y2_EXTRA = ['syllable', 'grammar', 'tense'] as const;

// The STAGED upper-primary ladder. Each rung adds a small, coherent batch of
// types on top of every earlier rung â€” cumulative, so Y6 offers the whole
// catalogue and no type ever disappears from a later year:
const Y3_INTRO = [
    // Introductory Year-3 grammar: clause joiners, apostrophes, comma lists,
    // word building (prefixes/suffixes + compounds), quoted speech, pronouns.
    'conjunction', 'apostrophe', 'comma', 'affix', 'compound', 'speech', 'pronoun'
] as const;
// T5 upper-primary resource families (join at Year 3, deepen EVERY year via
// the explicit caps.level â€” Year 5 and Year 6 carry their own variants):
// original-passage reading comprehension, scaffolded sentence/paragraph
// crafting, plan-and-compose writing projects, and editing/proofreading.
const Y3_LITERACY = ['comprehension', 'craft', 'writing', 'editing'] as const;
const Y4_ADVANCED = [
    // First advanced vocabulary types (Y4â€“6 material): figurative language +
    // same-spelling/different-meaning words.
    'figurative', 'homograph'
] as const;
const Y5_ADVANCED = [
    // The remaining advanced set (Y5â€“6 material): idioms, dialogue
    // punctuation and subjectâ€“verb agreement.
    'idiom', 'advpunct', 'agreement'
] as const;

// The full Year-3 catalogue: early-reading + Y2 extensions + Y3 intro set +
// the T5 literacy resource families.
const YEAR_3 = [...EARLY_READING, ...Y2_EXTRA, ...Y3_INTRO, ...Y3_LITERACY] as const;
// Year 4 adds the first advanced vocabulary types on top of the Y3 set.
const YEAR_4 = [...YEAR_3, ...Y4_ADVANCED] as const;
// Year 5 adds the remaining advanced set; Year 6 = the complete catalogue.
const YEAR_5 = [...YEAR_4, ...Y5_ADVANCED] as const;
const UPPER_PRIMARY: readonly string[] = YEAR_5;

// Neutral caps: every knob zero/empty/false. Used as the base for BOTH
// subjects' configs â€” a grade config fills in the knobs its subject needs and
// leaves the other subject's knobs inert (their generators never read them,
// and zero/empty values are no-ops by construction in every generator).
const NEUTRAL_CAPS: Caps = {
    opCap: 0,
    addendCap: 0,
    numCap: 0,
    wordCap: 0,
    skipCap: 0,
    skipSet: [],
    multCap: 0,
    doubleCap: 0,
    bondCap: 0,
    patSet: [],
    shapeSet: [],
    clockCap: 0,
    metricCap: 0,
    pvCap: 0,
    dataCap: 0,
    coinCap: 0,
    tempCap: 0,
    yearLevel: 0,
    denSet: [],
    decPlaces: 0,
    areaSideCap: 0,
    wordTier: 0,
    sentenceLen: 0,
    tricky: false,
    level: 0
};

// Build an english grade's caps: the four word knobs over the neutral base.
function englishCaps(caps: Pick<Caps, 'wordTier' | 'sentenceLen' | 'tricky' | 'level'>): Caps {
    return { ...NEUTRAL_CAPS, ...caps };
}

// Grade 0 (Prep) through 6 are fully covered (the english catalogue's full
// extent). Configs verbatim from the english distribution:
// Grades 7..10 and 12 share the same "no content yet" shape (Year 11 is the
// legacy senior set â€” in the merged app its six families are re-levelled onto
// their own ladder by difficulty.ts, so it stays `implemented` for the
// adapter but is never offered as a user-facing grade).
const unimplementedGrade = (id: number): GradeConfig => ({
    id,
    short: String(id),
    label: `Year ${id}`,
    implemented: false,
    available: [],
    caps: { ...NEUTRAL_CAPS }
});

const ENGLISH_CONFIGS: GradeConfig[] = [
    {
        id: 0,
        short: 'P',
        label: 'Prep',
        implemented: true,
        // Prep keeps the narrow letter-awareness scope: alphabet order,
        // beginning sounds, vowels in short words, real-word recognition â€”
        // plus the handwriting-tracing set (letter/word/number shape
        // practice). Tracing is a Prep skill: Y1+ get reading/writing
        // tasks instead, so the trace types are NOT listed for them.
        available: ['letters', 'sounds', 'vowel', 'sight', 'letterTrace', 'wordTrace', 'numberTrace'],
        caps: englishCaps({ wordTier: 1, sentenceLen: 2, tricky: false, level: 0 }),
    },
    {
        id: 1,
        short: '1',
        label: 'Year 1',
        implemented: true,
        // Year 1 gets the full early-reading catalogue (common word set).
        available: [...EARLY_READING],
        caps: englishCaps({ wordTier: 2, sentenceLen: 4, tricky: false, level: 1 }),
    },
    {
        id: 2,
        short: '2',
        label: 'Year 2',
        implemented: true,
        // Year 2 adds the extended set: syllables, noun/verb recognition,
        // past tense and tricky spelling, plus irregular plurals and the
        // extended homophone pairs.
        available: [...EARLY_READING, ...Y2_EXTRA],
        caps: englishCaps({ wordTier: 3, sentenceLen: 5, tricky: true, level: 2 }),
    },
    {
        id: 3,
        short: '3',
        label: 'Year 3',
        implemented: true,
        // Year 3 (word set 4, sentences up to 7 words) introduces the
        // INTRODUCTORY grammar set PLUS the four T5 resource families on
        // their Year-3 (level 3) variants. The advanced Y4â€“Y6 vocabulary
        // types are NOT yet offered here.
        available: [...YEAR_3],
        caps: englishCaps({ wordTier: 4, sentenceLen: 7, tricky: true, level: 3 }),
    },
    {
        id: 4,
        short: '4',
        label: 'Year 4',
        implemented: true,
        // Year 4 keeps everything Y3 offers and adds the first advanced
        // vocabulary types â€” figurative language and homographs â€” on the
        // harder word set 5.
        available: [...YEAR_4],
        caps: englishCaps({ wordTier: 5, sentenceLen: 8, tricky: true, level: 4 }),
    },
    {
        id: 5,
        short: '5',
        label: 'Year 5',
        implemented: true,
        // Year 5 completes the catalogue: idioms, dialogue punctuation and
        // subjectâ€“verb agreement join the rotation at word set 6. The T5
        // resource families run their Year-5 (level 5) variants here.
        available: [...YEAR_5],
        caps: englishCaps({ wordTier: 6, sentenceLen: 9, tricky: true, level: 5 }),
    },
    {
        id: 6,
        short: '6',
        label: 'Year 6',
        implemented: true,
        // Year 6 â€” the full cumulative catalogue at its deepest (tier 6,
        // 10-word sentences): the culmination before high school. The id
        // list matches Year 5, but the T5 resource families branch on
        // caps.level 6 into their OWN Year-6 variants, so Y5 and Y6 sheets
        // are genuinely different, not a caps-only re-skin.
        available: [...UPPER_PRIMARY],
        caps: englishCaps({ wordTier: 6, sentenceLen: 10, tricky: true, level: 6 }),
    },
    // Legacy grades 7..12 - selector entries only (coming soon); no content
    // generated (kept verbatim so the unimplemented-grade gating in the
    // plugin tests holds: an unimplemented grade offers nothing).
    ...[7, 8, 9, 10, 11, 12].map(unimplementedGrade)
];

// â”€â”€ Maths catalogue (verbatim from distribution/maths grades.ts) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Shape sets per grade (V8-aligned 2-D + 3-D recognition): Year 1 knows the
// everyday set (circles, ovals, triangles, quadrilaterals + cube/cylinder/
// sphere); Year 2 adds hexagons, prisms, pyramids and cones.
const Y1_SHAPES = ['circle', 'oval', 'triangle', 'square', 'rectangle', 'cube', 'cylinder', 'sphere'];
const Y2_SHAPES = [...Y1_SHAPES, 'hexagon', 'prism', 'pyramid', 'cone'];


// Grades 3..6 - the ARITHMETIC LADDER plus the UPPER-PRIMARY STRANDS
// (verbatim caps from the maths distribution).
const arithmeticLadderGrade = (id: number): GradeConfig => ({
    id,
    short: String(id),
    label: `Year ${id}`,
    implemented: true,
    available: id === 3
        ? ['addition', 'subtraction', 'mult', 'transformations', 'compass',
            'fractions', 'metricconv', 'statistics', 'probability', 'algebra']
        : id === 4
            ? ['addition', 'subtraction', 'fractions', 'decimals', 'multidiv',
                'perimeterarea', 'metricconv', 'statistics', 'probability', 'algebra']
            : ['addition', 'subtraction', 'fractions', 'decimals', 'percent',
                'multidiv', 'perimeterarea', 'metricconv', 'statistics',
                'probability', 'algebra'],
    caps: {
        ...NEUTRAL_CAPS,
        // One more digit each year: 10^3 (Y3) ... 10^6 (Y6).
        opCap: 10 ** id,
        // Pairs through Year 3; 3 terms from Year 4; 4 terms in Year 6.
        addendCap: id >= 6 ? 4 : id >= 4 ? 3 : 2,
        // Retain Year 2's tables to 10 in Year 3; do not scale with opCap.
        // Years 4..6 use multCap as the MULTIDIV operand ceiling.
        multCap: id === 3 ? 10 : id >= 4 ? 100 : 0,
        // Upper-primary strand tiering: the new plugins branch on this.
        yearLevel: id,
        // Y3 = unit fractions halves..tenths; Y4..Y6 add the
        // related-denominator partners 6/8/12 for equivalence, comparison
        // and +/âˆ’.
        denSet: id === 3 ? [2, 3, 4, 5, 10] : [2, 3, 4, 5, 6, 8, 10, 12],
        // Decimals start in Year 4 (tenths/hundredths), widen to thousandths
        // in Year 5 and stay there for Year 6's +/- to thousandths.
        decPlaces: id === 3 ? 0 : id === 4 ? 2 : 3,
        // Perimeter/area sides: Y4 counts small squares, Y5 works in cm/m
        // with formulas, Y6 in m/km-scale numbers with unit links.
        areaSideCap: id === 4 ? 20 : id === 5 ? 100 : id === 6 ? 1000 : 0
    }
});

const MATH_CONFIGS: GradeConfig[] = [
    {
        id: 0,
        short: 'P',
        label: 'Prep',
        implemented: true,
        available: ['counting', 'comparison', 'addition', 'subtraction'],
        caps: {
            ...NEUTRAL_CAPS,
            opCap: 10,
            // Prep practices classic pairs only (within 10).
            addendCap: 2,
            numCap: 10,
            wordCap: 10,
            skipCap: 50,
            skipSet: [10],
            // Prep keeps the original narrow scope: the extension types are
            // not offered (zero/empty caps would be harmless anyway).
            doubleCap: 10,
            bondCap: 10,
            pvCap: 10,
            dataCap: 10,
            yearLevel: 0
        },
    },
    {
        id: 1,
        short: '1',
        label: 'Year 1',
        implemented: true,
        // Year 1 gets the full extension catalogue (within 20): number bonds
        // to 10, doubles to 10, patterns (steps 1/2/5/10), 2-D & 3-D shapes,
        // compass directions N/S/E/W, days/months/seasons (no clocks),
        // informal measurement (no cm), temperatures within 20Â°C, tens &
        // ones to 20, tallies/picture & column graphs, and the rows &
        // columns counting sheet (4 Ã— 5 grids at most).
        available: [
            'counting',
            'rowscolumns',
            'comparison',
            'missing',
            'addition',
            'subtraction',
            'skip',
            'word',
            'doubles',
            'bonds',
            'patterns',
            'shapes',
            'compass',
            'time',
            'measure',
            'temperature',
            'placevalue',
            'data'
        ],
        caps: {
            ...NEUTRAL_CAPS,
            opCap: 20,
            addendCap: 2,
            numCap: 20,
            wordCap: 20,
            skipCap: 50,
            skipSet: [2, 5, 10],
            doubleCap: 10,
            bondCap: 10,
            patSet: [1, 2, 5, 10],
            shapeSet: Y1_SHAPES,
            pvCap: 20,
            dataCap: 20,
            // Grade-1 temperature: friendly 1..20Â°C read/compare range.
            tempCap: 20,
            yearLevel: 1
        },
    },
    {
        id: 2,
        short: '2',
        label: 'Year 2',
        implemented: true,
        // Year 2 adds times tables (mult, operands to 10), division by equal
        // sharing, Australian coins & money, clock time to the hour &
        // half-past plus the dedicated clock-faces sheet, cm measurement up
        // to a metre, bonds to 10 & 20, doubles to 20, patterns with 3s &
        // 4s steps, hexagons & extra 3-D shapes, tens & ones to 99, and
        // bigger data counts. The rows-columns sheet widens to 5 Ã— 5 grids
        // AND gains the r Ã— c product form.
        available: [
            'counting',
            'rowscolumns',
            'comparison',
            'missing',
            'addition',
            'subtraction',
            'mult',
            'skip',
            'word',
            'doubles',
            'bonds',
            'patterns',
            'shapes',
            'compass',
            'time',
            'clock',
            'measure',
            'temperature',
            'placevalue',
            'data',
            'division',
            'money'
        ],
        caps: {
            ...NEUTRAL_CAPS,
            opCap: 100,
            addendCap: 2,
            numCap: 100,
            wordCap: 30,
            skipCap: 100,
            skipSet: [2, 5, 10],
            multCap: 10,
            doubleCap: 20,
            bondCap: 20,
            patSet: [1, 2, 3, 4, 5, 10],
            shapeSet: Y2_SHAPES,
            clockCap: 12,
            metricCap: 100,
            pvCap: 99,
            dataCap: 40,
            coinCap: 100,
            // Year-2 temperature reaches the full everyday weather range.
            tempCap: 40,
            yearLevel: 2
        },
    },
    // Grades 3..6 â€” arithmetic ladder, plus Year 3's explicit extensions above.
    ...[3, 4, 5, 6].map(arithmeticLadderGrade),
    ...[7, 8, 9, 10].map(unimplementedGrade),
    // â”€â”€ Legacy Year 11 â€” the senior set (T11 expansion) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Six generic senior practice families: calculus, functions & quadratics,
    // polynomials, trigonometry, exponentials & logs, and senior probability.
    // In the merged app these are NO LONGER gated behind a grade-11 selector:
    // difficulty.ts maps each onto its own independent ladder (rungs 1..3)
    // and synthesises per-rung grade configs FROM this one, keeping
    // `available` so the plugins' own offered() checks keep working.
    {
        id: 11,
        short: '11',
        label: 'Year 11',
        implemented: true,
        available: ['calculus', 'functions', 'polynomials', 'trigonometry', 'expolog', 'prob11'],
        caps: {
            ...NEUTRAL_CAPS,
            // Senior tier marker: the six senior generators key their scope
            // on the ladder rung the difficulty adapter writes into
            // yearLevel (1 = Intro, 2 = Developing, 3 = Full â€” the legacy
            // full scope). All other caps stay zero: senior scopes are
            // bounded by their own drawn-value ranges.
            yearLevel: 3
        }
    },
    // Grades 7..10 and 12 â€” no content (kept so the catalogue lookup stays
    // total over the legacy id space).

    unimplementedGrade(12)
];

export const ENGLISH_GRADES: readonly GradeConfig[] = ENGLISH_CONFIGS;
export const MATH_GRADES: readonly GradeConfig[] = MATH_CONFIGS;

// ─── Science catalogue (Chemistry + Physic — R5) ──────────────────────────────
// NOT legacy: built for this target (no source distribution carried science).
// Four worksheet plugins, each on its own 4-LEVEL ladder (per-topic cap 4):
//   'elements'  (Chemistry — element symbols/names, advanced clue forms)
//   'balancing' (Chemistry — balancing equations, hardest pools)
//   'speed'     (Physic — speed / distance / time)
//   'circuits'  (Physic — Ohm's law, series & parallel circuits)
// Every science plugin is offered from level 1 and tops out at level 4: the
// implemented rows are legacy ids 0..3 (level = id + 1) and each lists ALL
// four ids (ids are globally unique, so the chemistry list never registers
// the physics ids — only their own registration lists decide that). The
// generators read their difficulty dial from caps.yearLevel (= level 1..4),
// the same knob the senior maths ladder uses; every other Caps knob stays
// neutral-zero (science defines no other knobs). Levels beyond 4 saturate at
// the level-4 caps (difficulty.ts derives maxLevel = 4 from this extent) and
// the ids 4..12 stay unimplemented selector rows for the getter contract.
const SCIENCE_IDS = ['elements', 'balancing', 'speed', 'circuits'] as const;

// Science caps: the single difficulty dial (the rung the generators read).
function scienceCaps(rung: number): Caps {
    return { ...NEUTRAL_CAPS, yearLevel: rung };
}

const SCIENCE_CONFIGS: GradeConfig[] = [
    ...[0, 1, 2, 3].map<GradeConfig>((id) => ({
        id,
        short: 'S',
        label: 'Science',
        implemented: true,
        available: [...SCIENCE_IDS],
        caps: scienceCaps(id + 1)
    })),
    ...[4, 5, 6, 7, 8, 9, 10, 11, 12].map(unimplementedGrade)
];

export const SCIENCE_GRADES: readonly GradeConfig[] = SCIENCE_CONFIGS;

// Look up a legacy grade config by subject + id. Falls back to the source
// apps' legacy fallback (index 1 = Year 1) for unknown ids so a bad mapping
// can never crash the dashboard (same contract as both getGradeConfig). The
// science getter falls back to its own row 1 for the same reason.
export function getEnglishGradeConfig(id: number): GradeConfig {
    return ENGLISH_CONFIGS.find((g) => g.id === id) ?? ENGLISH_CONFIGS[1];
}

export function getMathGradeConfig(id: number): GradeConfig {
    return MATH_CONFIGS.find((g) => g.id === id) ?? MATH_CONFIGS[1];
}

export function getScienceGradeConfig(id: number): GradeConfig {
    return SCIENCE_CONFIGS.find((g) => g.id === id) ?? SCIENCE_CONFIGS[1];
}
