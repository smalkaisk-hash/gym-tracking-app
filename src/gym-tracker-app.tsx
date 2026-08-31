import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { X, Plus, Trash2, TrendingUp, Dumbbell, Calendar, FileText, Edit2, Save, ChevronRight, ChevronDown, ChevronUp, Sun, Moon, Settings, ChevronLeft, Timer, Download, Upload, Pause, Play, LogOut, LogIn, Mail, Loader2, Eye, EyeOff, KeyRound, CloudOff } from 'lucide-react';
import { supabase, supabaseEnabled, rowToWorkout, workoutToRow, rowToBW, bwToRow } from './supabase';
import { reportError } from './monitoring';

// The recharts drawing layer is lazy-loaded — it is ~105 kB gzipped and nothing on
// the critical path (auth, onboarding, logging a workout, History, Settings) draws
// a chart. `Chart` resolves the recharts chunk only when a chart first renders; the
// callers compute the data/palette/formatters and pass primitives in (see charts.tsx).
const Chart = lazy(() => import('./charts'));
const ChartFallback = ({ h }: any) => (
  <div style={{ height: h }} className="w-full rounded-ctl bg-raised animate-pulse" aria-hidden="true" />
);
// A chart chunk that fails to load (offline, first visit) or throws while drawing
// must not reach the root ErrorBoundary — that blanks the whole app over a missing
// card. This local boundary keeps the failure to the one slot.
class ChartArea extends React.Component<{ h: number; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: any) { reportError(err, { at: 'chartLazyLoad' }); }
  render() {
    if (this.state.failed) return <ChartFallback h={this.props.h} />;
    return <Suspense fallback={<ChartFallback h={this.props.h} />}>{this.props.children}</Suspense>;
  }
}

// No image imports. The day tiles used to carry stock photographs; they were
// dropped on 2026-08-05 — see Assets/CREDITS.md for what was there and why it
// went. Re-adding a photograph of an identifiable person to a health product
// re-opens the personality-rights decision that removal closed.

// ═════════════════════════════════════════════════════════════════════════════
// MODULE MAP — this is the whole app in one file (see CLAUDE.md for the "why").
// Search the SYMBOL names below to jump; they don't rot the way line numbers do.
//
// CONSTANTS & HELPERS (top of file)
//   • Exercise catalogue ........ CORE, CARDIO, EXERCISES, ALL_GROUPS
//   • Exercise identity ......... slug, idForName, exerciseIdOf, EXERCISE_ID_OVERRIDES
//   • Muscle grouping ........... groupForExercise, GROUP_TO_MUSCLE, MUSCLE_BY_ID
//   • Storage keys .............. STORAGE_KEY, BW_LOG_KEY, GOAL_KEY, PREFS_KEY, ACTIVE_KEY,
//                                 CACHE_OWNER_KEY, THEME_KEY, THEME_VARS_KEY
//                                 (the full set is published in PRIVACY.md § 5 and a fuzz
//                                  guard fails if the two lists diverge — keep this in step)
//   • Prefs schema .............. DEFAULT_PREFS, Prefs
//   • Consent & versions ........ POLICY_VERSION, TERMS_VERSION, POLICIES_EFFECTIVE_FROM,
//                                 consentRowsFor, needsReconsentFor, reconsentDue, MIN_AGE
//   • Design tokens ............. card, input, btnPrimary/Secondary/Danger, label, readout
//   • Type & theme config ....... SPLITS, TYPE_CONFIG, CHART, ACCENTS, BASES, SEMANTICS
//   • Units ..................... LB_PER_KG, KG_PER_LB
//
// HOOKS & UI PRIMITIVES
//   • useTheme .................. resolves light/dark → tokens
//   • Toggle .................... shared switch
//
// SCREENS / COMPONENTS (in file order)
//   • SetRow, ExerciseCard ...... a set's inputs; one exercise's card
//   • WorkoutScreen ............. the live logging session
//   • HistoryScreen ............. past workouts (edit / delete / sync chip)
//   • ProgressScreen ............ per-exercise strength + body-weight charts
//   • SettingsScreen ............ prefs, theme, account (change pw / delete / export)
//   • LoginScreen, ResetPasswordScreen, OnboardingScreen ... auth + first-run gates
//
// ROOT
//   • GymTrackerApp ............. default export at the bottom — ALL state lives here
//     (workouts, bodyWeightLog, prefs, session) and flows down as props. Holds the
//     load/hydrate/write-back effects and the `currentScreen` string router.
// ═════════════════════════════════════════════════════════════════════════════

// The catalogue, grouped by muscle. The groups are the picker's structure — a
// flat 80-item alphabetical list buries Box Squat between Barbell Row and
// Bulgarian Split Squat.
//
// Grouped by what the muscle actually does, not by where a given listicle files
// it — chest flyes are pressing (push); pullovers are lat-driven (pull).
// Adding a name is always free; RENAMING is safe if you pin the id — see the
// "Stable exercise identity" section below (the id, not the name, is the identity).
type ExerciseGroup = { group: string; items: string[] };

// Core and cardio belong to no single day — they get bolted onto whatever you're
// training, so they're shared across all three rather than filed under one.
// ALL_GROUPS dedupes by name so Custom lists each once. Both go last on every
// day, in the order you'd actually reach for them.
const CORE: ExerciseGroup = {
  group: 'Abs & Core',
  items: [
    // Holds & anti-movement
    'Plank', 'Side Plank', 'Plank Up-Down', 'Hollow Hold', 'L-Sit',
    'Dead Bug', 'Bird Dog', 'Dragon Flag',
    // Crunches
    'Crunches', 'Weighted Crunch', 'Cable Crunch', 'Machine Crunch',
    'Bicycle Crunch', 'Reverse Crunch',
    // Sit-ups
    'Sit-ups', 'Decline Sit-ups', 'V-ups',
    // Raises
    'Hanging Leg Raise', 'Hanging Knee Raise', 'Lying Leg Raise',
    'Captains Chair Leg Raise', 'Toes to Bar', 'Hanging Windshield Wiper',
    'Flutter Kicks', 'Scissor Kicks', 'Mountain Climbers',
    // Loaded & rotational
    'Ab Wheel Rollout', 'Russian Twist', 'Pallof Press', 'Woodchopper',
    'Landmine Twist', 'Side Bend', 'Suitcase Carry',
  ],
};

// Abs are done both loaded and unloaded, so weight is optional for them: reps
// alone is a complete set. A set logged that way stores weight: null — which
// reads as bodyweight everywhere, and contributes nothing to volume, because no
// external load moved.
const BODYWEIGHT_OPTIONAL = new Set<string>(CORE.items);

const CARDIO: ExerciseGroup = {
  group: 'Cardio',
  items: [
    // Running & walking
    'Treadmill Run', 'Treadmill Walk', 'Incline Walk', 'Outdoor Run',
    'Sprints', 'Hill Sprints',
    // Bikes
    'Stationary Bike', 'Spin Bike', 'Assault Bike', 'Cycling',
    // Ergs & machines
    'Rowing Machine', 'Ski Erg', 'Elliptical', 'Stair Climber', 'Versaclimber',
    // Bodyweight conditioning
    'Swimming', 'Jump Rope', 'Jumping Jacks', 'High Knees', 'Box Jumps',
    'Burpees', 'Shadow Boxing',
    // Loaded conditioning
    'Sled Push', 'Sled Pull', 'Prowler Push', 'Battle Ropes',
    'Farmers Walk', 'Yoke Carry',
  ],
};

const EXERCISES: Record<string, ExerciseGroup[]> = {
  push: [
    { group: 'Chest', items: [
      // Barbell
      'Bench Press', 'Incline Bench Press', 'Decline Bench Press',
      'Smith Machine Bench Press', 'Floor Press',
      // Dumbbell
      'Dumbbell Press', 'Incline Dumbbell Press', 'Decline Dumbbell Press',
      'Squeeze Press',
      // Machine
      'Machine Chest Press', 'Hammer Strength Chest Press', 'Landmine Chest Press',
      // Flyes
      'Dumbbell Fly', 'Incline Dumbbell Fly', 'Machine Fly', 'Pec Deck',
      'Cable Crossover', 'Low-to-High Cable Fly', 'High-to-Low Cable Fly',
      // Bodyweight
      'Chest Dips', 'Push-ups', 'Incline Push-ups', 'Decline Push-ups',
      'Wide Grip Push-ups', 'Plyometric Push-ups',   // Diamond Push-ups are triceps — filed there
    ] },
    { group: 'Shoulders', items: [
      // Presses
      'Shoulder Press', 'Overhead Press', 'Military Press',
      'Seated Dumbbell Press', 'Standing Dumbbell Press',
      'Machine Shoulder Press', 'Smith Machine Shoulder Press',
      'Arnold Press', 'Push Press', 'Z Press', 'Behind the Neck Press',
      'Landmine Press', 'Seesaw Press',
      // Lateral
      'Lateral Raises', 'Cable Lateral Raise', 'Machine Lateral Raise',
      'Leaning Lateral Raise',
      // Front
      'Front Raises', 'Cable Front Raise', 'Plate Front Raise',
      // Bodyweight
      'Pike Push-ups', 'Handstand Push-ups',
    ] },
    { group: 'Triceps', items: [
      // Compound
      'Close Grip Bench Press', 'JM Press', 'Tricep Dips', 'Bench Dips',
      'Diamond Push-ups',
      // Pushdowns
      'Tricep Pushdowns', 'Rope Pushdown', 'V-Bar Pushdown',
      'Reverse Grip Pushdown', 'Single Arm Pushdown',
      // Overhead
      'Overhead Tricep Extension', 'Overhead Rope Extension', 'French Press',
      // Extensions
      'Skull Crushers', 'EZ Bar Skull Crusher', 'Dumbbell Skull Crusher',
      'Tricep Kickback', 'Cable Kickback',
    ] },
    CORE,
    CARDIO,
  ],
  pull: [
    { group: 'Lats & Deadlifts', items: [
      // Deadlifts (hip hinge from the floor lives here; RDLs are hamstrings)
      'Deadlift', 'Trap Bar Deadlift', 'Deficit Deadlift', 'Snatch Grip Deadlift',
      'Rack Pull', 'Block Pull',
      // Vertical — bodyweight
      'Pull-ups', 'Wide Grip Pull-ups', 'Neutral Grip Pull-ups',
      'Weighted Pull-ups', 'Assisted Pull-ups', 'Chin-ups', 'Weighted Chin-ups',
      // Vertical — cable
      'Lat Pulldown', 'Wide Grip Lat Pulldown', 'Close Grip Lat Pulldown',
      'Reverse Grip Lat Pulldown', 'Neutral Grip Lat Pulldown',
      'Single Arm Lat Pulldown',
      // Pullovers
      'Straight Arm Pulldown', 'Cable Pullover', 'Dumbbell Pullover',
      'Machine Pullover',
    ] },
    { group: 'Rows', items: [
      // Barbell
      'Barbell Row', 'Pendlay Row', 'Yates Row', 'T-Bar Row', 'Landmine Row',
      // Dumbbell
      'Dumbbell Row', 'Kroc Row', 'Meadows Row', 'Seal Row',
      'Chest Supported Row',
      // Machine & cable
      'Machine Row', 'Hammer Strength Row', 'Seated Cable Row',
      'Wide Grip Cable Row', 'Single Arm Cable Row',
      // Bodyweight
      'Inverted Row',
    ] },
    { group: 'Rear Delts & Traps', items: [
      // Rear delts
      'Face Pulls', 'Rear Delt Fly', 'Reverse Pec Deck', 'Cable Rear Delt Fly',
      'Bent Over Rear Delt Raise', 'Y Raise',
      // Traps
      'Shrugs', 'Barbell Shrugs', 'Dumbbell Shrugs', 'Trap Bar Shrugs',
      'Cable Shrugs', 'Upright Row', 'Cable Upright Row', 'High Pull',
    ] },
    { group: 'Biceps', items: [
      // Barbell
      'Barbell Curl', 'EZ Bar Curl', '21s', 'Drag Curl',
      // Dumbbell
      'Dumbbell Curl', 'Incline Dumbbell Curl', 'Concentration Curl',
      'Spider Curl',
      // Hammer / neutral
      'Hammer Curl', 'Rope Hammer Curl', 'Cross Body Hammer Curl',
      // Machine & cable
      'Preacher Curl', 'Machine Curl', 'Cable Curl', 'Bayesian Curl',
      // Forearms
      'Reverse Curl', 'Zottman Curl', 'Wrist Curl', 'Reverse Wrist Curl',
    ] },
    CORE,
    CARDIO,
  ],
  legs: [
    { group: 'Quads', items: [
      // Barbell squats
      'Squat', 'High Bar Squat', 'Low Bar Squat', 'Front Squat', 'Box Squat',
      'Pause Squat', 'Zercher Squat', 'Landmine Squat', 'Goblet Squat',
      // Machine squats
      'Smith Machine Squat', 'Safety Bar Squat', 'Hack Squat',
      'Pendulum Squat', 'Belt Squat',
      // Press & extension
      'Leg Press', 'Single Leg Press', 'Leg Extension', 'Single Leg Extension',
      // Bodyweight
      'Sissy Squat', 'Wall Sit',
    ] },
    { group: 'Hamstrings & Glutes', items: [
      // Hinges
      'Romanian Deadlift', 'Dumbbell Romanian Deadlift', 'Stiff Leg Deadlift',
      'Sumo Deadlift', 'Single Leg Deadlift', 'Good Mornings',
      'Kettlebell Swing', 'Cable Pull Through',
      // Curls
      'Leg Curl', 'Seated Leg Curl', 'Lying Leg Curl', 'Standing Leg Curl',
      'Nordic Curl', 'Glute Ham Raise',
      // Extensions
      'Back Extension', 'Reverse Hyperextension',
      // Thrusts & bridges
      'Hip Thrust', 'Barbell Hip Thrust', 'Single Leg Hip Thrust',
      'Machine Hip Thrust', 'Glute Bridge', 'Frog Pump', 'Glute Kickback',
    ] },
    { group: 'Lunges & Split Squats', items: [
      'Lunges', 'Forward Lunges', 'Reverse Lunges', 'Walking Lunges',
      'Lateral Lunges', 'Curtsy Lunges',
      'Split Squat', 'Bulgarian Split Squat', 'Front Foot Elevated Split Squat',
      'Step-ups', 'Lateral Step-ups', 'Pistol Squat', 'Cossack Squat',
    ] },
    { group: 'Calves & Hips', items: [
      // Calves
      'Calf Raises', 'Standing Calf Raises', 'Seated Calf Raises',
      'Single Leg Calf Raise', 'Leg Press Calf Raise',
      'Smith Machine Calf Raise', 'Donkey Calf Raise', 'Tibialis Raise',
      // Hips
      'Hip Adduction', 'Hip Abduction', 'Cable Hip Abduction',
      'Clamshell', 'Monster Walk',
    ] },
    CORE,
    CARDIO,
  ],
};

// Custom sessions can pick anything, so they get every group in PPL order. The
// shared groups are pulled out and re-appended rather than deduped in place —
// otherwise they'd inherit push's position and land mid-list instead of last.
const isShared = (g: ExerciseGroup) => g === CORE || g === CARDIO;

const ALL_GROUPS: ExerciseGroup[] = [
  ...EXERCISES.push.filter(g => !isShared(g)),
  ...EXERCISES.pull.filter(g => !isShared(g)),
  ...EXERCISES.legs.filter(g => !isShared(g)),
  CORE,
  CARDIO,
];

// ── Day types beyond push/pull/legs ──────────────────────────────────────────
// The other splits (upper/lower, full body, bro, Arnold — see SPLITS) train the
// same muscles in different combinations, so their picker lists are COMPOSED from
// the groups above rather than re-declared. Re-declaring would duplicate exercise
// names, and names must stay unique (they're React keys, and ALL_GROUPS flattens
// them). CORE and CARDIO are stripped and re-appended last, same as ALL_GROUPS.
const groupsOf = (type: string, ...names: string[]): ExerciseGroup[] =>
  names.map(n => EXERCISES[type].find(g => g.group === n)!);

const dayFrom = (...groups: ExerciseGroup[]): ExerciseGroup[] =>
  [...groups.filter(g => !isShared(g)), CORE, CARDIO];

const PUSH_GROUPS = groupsOf('push', 'Chest', 'Shoulders', 'Triceps');
const PULL_GROUPS = groupsOf('pull', 'Lats & Deadlifts', 'Rows', 'Rear Delts & Traps', 'Biceps');
const BACK_GROUPS = groupsOf('pull', 'Lats & Deadlifts', 'Rows', 'Rear Delts & Traps');
const [CHEST_G, SHOULDER_G, TRICEP_G] = PUSH_GROUPS;
const REAR_DELT_G = groupsOf('pull', 'Rear Delts & Traps')[0];
const BICEP_G     = groupsOf('pull', 'Biceps')[0];

Object.assign(EXERCISES, {
  // Upper / lower
  upper:    dayFrom(...PUSH_GROUPS, ...PULL_GROUPS),
  lower:    EXERCISES.legs,
  // Full body — everything, in the same order Custom gets it
  fullbody: ALL_GROUPS,
  // Bro split (legs reuses EXERCISES.legs via the shared 'legs' day type)
  chest:     dayFrom(CHEST_G),
  back:      dayFrom(...BACK_GROUPS),
  shoulders: dayFrom(SHOULDER_G, REAR_DELT_G),
  arms:      dayFrom(BICEP_G, TRICEP_G),
  // Arnold split
  chestback:     dayFrom(CHEST_G, ...BACK_GROUPS),
  shouldersarms: dayFrom(SHOULDER_G, REAR_DELT_G, BICEP_G, TRICEP_G),
});

// A free-text exercise the user typed isn't in the catalogue — it lands here.
const OTHER_GROUP = 'Other';

// ── Safe map lookups ──────────────────────────────────────────────────────────
// Every table below (TYPE_CONFIG, EXERCISES, BASES, ACCENTS, STARTER_TEMPLATES…)
// is an object literal used as a dictionary, and their keys come from user data:
// a workout `type` in an imported backup, a `prefs.base` id, a typed exercise name.
// A plain `MAP[key]` walks the prototype chain, so a key of '__proto__',
// 'constructor' or 'toString' returns a truthy Object.prototype member — which
// then defeats every `?? fallback` and `? :` whitelist guarding these reads, and
// hands a function to code expecting a string. `pick` returns undefined for
// anything that isn't an OWN key, so the fallbacks actually fire.
const own = (o: any, k: any) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const pick = <T,>(o: Record<string, T> | undefined | null, k: any): T | undefined =>
  own(o, k) ? (o as Record<string, T>)[k] : undefined;
// The same idea for maps we BUILD from user-supplied keys: a null-prototype object
// has no inherited members to collide with, so `map[userKey] = v` is always a plain
// data write (`map['__proto__'] = v` would otherwise re-point the prototype).
const bareMap = <T,>(): Record<string, T> => Object.create(null);

// ── Stable exercise identity (roadmap Phase 1, option A) ──────────────────────
// The display name is no longer the identity. Each exercise has a stable `id` — the
// slug of its ORIGINAL name — stamped onto every logged exercise. Because the slug is
// deterministic, sessions logged before ids existed unify for free: their id is
// recomputed as slug(name), the same value the write path stores now, so no backfill
// is needed. Verified: the catalogue's 267 names slug to 267 distinct ids (see
// tests/exercise-identity.test.mjs).
// Non-string names reach this from a corrupt cache or a hand-edited backup, so it
// coerces rather than throwing — a nameless exercise must degrade to "Other" in the
// stats, not white-screen the dashboard.
const slug = (name: any) =>
  String(name ?? '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// To RENAME an exercise safely, change its name string in the catalogue AND pin its
// id here to the slug of its ORIGINAL name — old and new sessions then share one
// identity. e.g. after renaming 'Lateral Raises' -> 'Side Lateral Raise':
//   { 'Side Lateral Raise': 'lateral-raises' }
// This replaces the old "never rename an exercise" rule.
const EXERCISE_ID_OVERRIDES: Record<string, string> = {};

// Stable id for a catalogue/typed name. Falls back to the name itself if it somehow
// slugs to empty (an all-symbol custom), so an id is never blank.
const idForName = (name: string) => {
  // Non-string names reach here from a hand-edited cache or backup; coerce rather
  // than throw inside `slug`. `pick` keeps a name of '__proto__' from resolving to
  // an inherited object instead of an id string.
  const n = typeof name === 'string' ? name : String(name ?? '');
  return pick(EXERCISE_ID_OVERRIDES, n) || slug(n) || n;
};

// The stable id of a LOGGED exercise: its stored id, or derived from its name for
// rows written before ids existed (the same value the write path would have stored).
const exerciseIdOf = (ex: any) => ex.exerciseId ?? idForName(ex.name);

// Catalogue name lookup keyed by stable id (for display of legacy id-only reads).
const EXERCISE_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  ALL_GROUPS.flatMap(g => g.items.map(name => [idForName(name), name]))
);

// ── Per-muscle taxonomy for the balance views (decoupled from the picker) ─────
// The catalogue `group` is the picker's structure — day-oriented buckets, some
// compound ('Lats & Deadlifts'). The Muscle-group-balance donut and the Progress
// "all exercises" list want the single primary mover of each lift, at real-muscle
// granularity (front/side/rear delt split, lats vs upper-back vs traps vs lower
// back, ab/adductors, obliques…), grounded in the standard ExRx muscle taxonomy.
// So they read this parallel map, never the picker group. Each picker group has a
// DEFAULT muscle (its dominant mover); every exercise whose prime mover differs is
// listed in the overrides below. Primary-mover only — assisting muscles aren't
// counted (a bench press is Chest, not also front delts / triceps). Editing this
// never touches the picker. Full slice set: Chest, Front/Side/Rear Delts, Triceps,
// Biceps, Forearms, Lats, Upper Back, Traps, Lower Back, Abs, Obliques, Quads,
// Hamstrings, Glutes, Calves, Adductors, Abductors, Cardio.
const GROUP_TO_MUSCLE: Record<string, string> = {
  'Chest': 'Chest',
  'Shoulders': 'Front Delts',            // presses/front raises; laterals → Side Delts (below)
  'Triceps': 'Triceps',
  'Lats & Deadlifts': 'Lats',            // pulldowns/pull-ups; floor deadlifts → Lower Back (below)
  'Rows': 'Upper Back',                  // horizontal rows = rhomboids / mid-traps
  'Rear Delts & Traps': 'Rear Delts',    // shrugs / upright rows / high pull → Traps (below)
  'Biceps': 'Biceps',                    // wrist/forearm work → Forearms (below)
  'Quads': 'Quads',
  'Hamstrings & Glutes': 'Hamstrings',   // glute-dominant work → Glutes (below)
  'Lunges & Split Squats': 'Quads',
  'Calves & Hips': 'Calves',             // ab/adduction accessories → Abductors/Adductors (below)
  'Abs & Core': 'Abs',                   // rotation / lateral flexion → Obliques (below)
  'Cardio': 'Cardio',
};

// Exercises whose primary mover isn't their catalogue group's default (above).
const MUSCLE_OVERRIDES_BY_NAME: Record<string, string> = {
  // Shoulders — the lateral-raise family isolates the side (lateral) deltoid
  'Lateral Raises': 'Side Delts', 'Cable Lateral Raise': 'Side Delts',
  'Machine Lateral Raise': 'Side Delts', 'Leaning Lateral Raise': 'Side Delts',
  // Pull day — shrugs, upright rows and high pulls are trapezius-dominant
  'Shrugs': 'Traps', 'Barbell Shrugs': 'Traps', 'Dumbbell Shrugs': 'Traps',
  'Trap Bar Shrugs': 'Traps', 'Cable Shrugs': 'Traps',
  'High Pull': 'Traps',
  // …but the upright row is a lateral-delt movement with the traps assisting (ExRx),
  // and the Y raise is lower-trap work the group's rear-delt default would miss.
  'Upright Row': 'Side Delts', 'Cable Upright Row': 'Side Delts', 'Y Raise': 'Traps',
  // Loaded carries score as the traps holding them, not as conditioning — the same
  // call already made for Suitcase Carry (obliques). They stay in the Cardio list so
  // they're pickable on any day; only the muscle they credit changes.
  'Farmers Walk': 'Traps', 'Yoke Carry': 'Traps',
  // Pressing behind the neck shifts the emphasis off the front delt
  'Behind the Neck Press': 'Side Delts',
  // The dumbbell pullover is a sternal-pec movement (lats assist); the cable versions
  // above it really are lat work, so only this one is overridden.
  'Dumbbell Pullover': 'Chest',
  // Floor deadlifts load the spinal erectors; the pure hip-hinges live in legs
  'Deadlift': 'Lower Back', 'Trap Bar Deadlift': 'Lower Back', 'Deficit Deadlift': 'Lower Back',
  'Snatch Grip Deadlift': 'Lower Back', 'Rack Pull': 'Lower Back', 'Block Pull': 'Lower Back',
  'Back Extension': 'Lower Back',
  // Wrist/forearm work catalogued at the tail of the Biceps list
  'Reverse Curl': 'Forearms', 'Zottman Curl': 'Forearms', 'Wrist Curl': 'Forearms', 'Reverse Wrist Curl': 'Forearms',
  // Glute-dominant bridges, thrusts, swings and pulls (grouped with the hamstrings)
  'Hip Thrust': 'Glutes', 'Barbell Hip Thrust': 'Glutes', 'Single Leg Hip Thrust': 'Glutes',
  'Machine Hip Thrust': 'Glutes', 'Glute Bridge': 'Glutes', 'Frog Pump': 'Glutes',
  'Glute Kickback': 'Glutes', 'Cable Pull Through': 'Glutes', 'Kettlebell Swing': 'Glutes',
  'Sumo Deadlift': 'Glutes', 'Reverse Hyperextension': 'Glutes',
  'Single Leg Deadlift': 'Glutes',        // unilateral hinge is glute-dominant
  // Lunges & Split Squats defaults to Quads, but the hip-dominant single-leg
  // patterns are glute work — without these no lunge could ever score as glutes.
  'Curtsy Lunges': 'Glutes', 'Reverse Lunges': 'Glutes', 'Walking Lunges': 'Glutes',
  'Step-ups': 'Glutes', 'Lateral Step-ups': 'Glutes', 'Bulgarian Split Squat': 'Glutes',
  // Frontal-plane lunges are loaded-stretch adductor work, not quads
  'Lateral Lunges': 'Adductors', 'Cossack Squat': 'Adductors',
  // Calves & Hips — split the hip accessories out of the calf default
  'Hip Adduction': 'Adductors',
  'Hip Abduction': 'Abductors', 'Cable Hip Abduction': 'Abductors',
  'Clamshell': 'Abductors', 'Monster Walk': 'Abductors',
  // Core — rotation, anti-rotation and lateral flexion work the obliques
  'Side Plank': 'Obliques', 'Bicycle Crunch': 'Obliques', 'Russian Twist': 'Obliques',
  'Woodchopper': 'Obliques', 'Landmine Twist': 'Obliques', 'Side Bend': 'Obliques',
  'Pallof Press': 'Obliques', 'Suitcase Carry': 'Obliques', 'Hanging Windshield Wiper': 'Obliques',
  // Bird dog is spinal-stability work — the erectors and glutes do it, not the abs
  'Bird Dog': 'Lower Back',
};

// The primary muscle for a catalogue name (override first, else the group default).
const muscleForCatalogueName = (name: string, group: string) =>
  pick(MUSCLE_OVERRIDES_BY_NAME, name) ?? pick(GROUP_TO_MUSCLE, group) ?? group;

// id → muscle and name → muscle, built once for logged-id and legacy-name reads.
const MUSCLE_BY_ID: Record<string, string> = Object.fromEntries(
  ALL_GROUPS.flatMap(g => g.items.map(name => [idForName(name), muscleForCatalogueName(name, g.group)]))
);
const MUSCLE_BY_NAME: Record<string, string> = Object.fromEntries(
  ALL_GROUPS.flatMap(g => g.items.map(name => [name, muscleForCatalogueName(name, g.group)]))
);

// Muscle for a logged exercise: by id, then legacy name, then Other (free-text).
const groupForExercise = (ex: any) =>
  pick(MUSCLE_BY_ID, exerciseIdOf(ex)) ?? pick(MUSCLE_BY_NAME, ex?.name) ?? OTHER_GROUP;

// The muscle-group breakdown, by whichever metric the user picked, sorted
// most-trained first. Pure and takes an already date-filtered list, so both the
// Progress and Home cards reuse it — the caller decides the window.
//   sets     — a plank set counts like a squat set; the even-handed default.
//   volume   — reps × weight; heavy but zeroes bodyweight/cardio (no load logged).
//   sessions — how many separate workouts touched the group (once each).
type MuscleMetric = 'sets' | 'volume' | 'sessions';

// Every read of a workout's exercise list goes through here. A row out of the
// localStorage cache can lack the array entirely — hand-edited, or truncated by a
// quota abort mid-write — and `for…of`/`.some` on undefined throws. On any path that
// runs over EVERY stored workout (the dashboard donut, History search, the Progress
// exercise list) that one bad row white-screens the app instead of being skipped.
// The server and import paths both default it to [], so this is the cache's guard.
const exercisesOf = (w: any): any[] => (Array.isArray(w?.exercises) ? w.exercises : []);

const muscleGroupBreakdown = (workouts: any[], metric: MuscleMetric): { group: string; value: number; pct: number }[] => {
  const totals: Record<string, number> = bareMap();
  for (const w of workouts) {
    const seen = new Set<string>();
    for (const ex of exercisesOf(w)) {
      const g = groupForExercise(ex);
      if (metric === 'sets')        totals[g] = (totals[g] ?? 0) + (ex.sets?.length ?? 0);
      else if (metric === 'volume') totals[g] = (totals[g] ?? 0) + volumeOf(ex);
      else                          seen.add(g); // sessions: tally once per workout, below
    }
    if (metric === 'sessions') for (const g of seen) totals[g] = (totals[g] ?? 0) + 1;
  }
  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  return Object.entries(totals)
    .filter(([, value]) => value > 0)
    .map(([group, value]) => ({ group, value, pct: sum ? (value / sum) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
};

const STORAGE_KEY = 'gym-workouts';
const BW_LOG_KEY  = 'gym-bw-log';
const GOAL_KEY    = 'gym-weekly-goal';
const PREFS_KEY   = 'gym-prefs';
const ACTIVE_KEY  = 'gym-active-session';   // in-progress workout, so a refresh can't lose it

// Which user the cached rows above belong to. localStorage is per-ORIGIN, not
// per-user, so without this the next account to sign in on a shared browser paints
// the previous one's dashboard (and could file their sessions under its own id).
// Recording the owner lets a session end WITHOUT deleting the cache — which matters
// because an involuntary sign-out (expired refresh token) usually happens offline,
// exactly when the cache holds the only copy of unsynced rows.
const CACHE_OWNER_KEY = 'gym-cache-owner';

// How old a persisted in-progress session can be and still be resumed. The session
// clock is wall-clock derived from the start time, so a session restored days later
// resumes reading 48:00:00 and logs that as its duration — a permanent bogus record,
// with no way out of the screen but Finish or Discard. Past this, drop it instead.
const MAX_RESUME_MS = 12 * 60 * 60 * 1000;   // 12h — longer than any real session

// Seven days in a week, and almost nobody trains twice in one.
const GOAL_MIN = 1;
const GOAL_MAX = 7;
const GOAL_DEFAULT = 4;
// Math.min/max PROPAGATE NaN rather than clamping it, so an unparsable stored goal
// (a corrupt cache value, a hand-edited backup) used to land in state as NaN and
// render the whole goal tile as "NaN%". Lives at module scope beside the bounds it
// reads — it's a pure function, and nesting it in the component put it out of reach
// of the tests, which could then only exercise it without these constants in scope.
const clampGoal = (g: number) => {
  if (!Number.isFinite(g)) return GOAL_DEFAULT;
  return Math.min(GOAL_MAX, Math.max(GOAL_MIN, g));
};
const THEME_KEY   = 'gym-theme';
// Resolved palette for both themes, stamped by index.html before first paint.
// Named here rather than written as a literal at each use because PRIVACY.md § 5
// publishes this list and `tests/qa/fuzz.test.mjs` checks the two agree — a key
// that exists only as an inline string can drift out of the policy unnoticed.
const THEME_VARS_KEY = 'gym-theme-vars';

// User-chosen view settings, all set from the Settings screen. Persisted as one
// JSON blob and merged over DEFAULT_PREFS on load, so adding a field later never
// breaks data saved by an older build.
type Units = 'kg' | 'lb';
type Gender = 'male' | 'female' | 'other' | '';   // '' = not set / left blank
// How the home "This week" tile draws goal progress. All seven ship; the user picks
// one in Settings (see WeekGoalTile). New value is safe on old caches — prefs merges
// over DEFAULT_PREFS, so a missing field falls back to 'liquid'.
type GoalCardStyle = 'liquid' | 'bubbles' | 'mosaic' | 'glow' | 'ring' | 'plates' | 'liquidNumber';
type Prefs = {
  name: string;                  // display name, '' = not set (collected at onboarding)
  gender: Gender;                // '' = not set / left blank
  units: Units;
  hidden: string[];              // widget keys the user hid (see WIDGET_LABELS)
  muscleMetric: MuscleMetric;
  bwChart: 'line' | 'bar';
  accent: string;                // ACCENTS id
  base: string;                  // BASES id (neutral palette)
  semantics: string;             // SEMANTICS id (good/warn/crit set)
  restTimer: boolean;            // start a rest countdown after each set
  restSeconds: number;           // its default duration
  workoutTimer: boolean;         // time the whole session and log its duration
  goalCardStyle: GoalCardStyle;  // how the "This week" tile visualises goal progress
  split: string;                 // SPLITS id — '' = not chosen yet (home shows the chooser)
  dayNames: Record<string, string>;  // type id → the user's own name for that day (display only)
};
const DEFAULT_PREFS: Prefs = {
  name: '', gender: '',
  units: 'kg', hidden: [], muscleMetric: 'sets', bwChart: 'line',
  accent: 'blue', base: 'graphite', semantics: 'plates', restTimer: true, restSeconds: 90,
  workoutTimer: true, goalCardStyle: 'liquid', split: '', dayNames: {},
};

// Hideable stat widgets, keyed per screen so the same kind can be hidden on one
// screen and shown on the other. Start-a-session and the Progress filter card are
// not hideable. Labels drive the Settings checkboxes.
const WIDGET_LABELS: Record<string, string> = {
  'dash.stats':      'Stat tiles',
  'dash.muscle':     'Muscle focus',
  'dash.bodyweight': 'Body weight',
  'dash.log':        'Log',
  'prog.muscle':     'Muscle group balance',
  'prog.bodyweight': 'Body weight chart',
  'prog.exercise':   'Exercise progress',
};

// ─── Style constants ───────────────────────────────────────────────────────────
// Colours come from tokens in index.css; nothing here names a raw hex.

const card         = 'bg-surface border border-line rounded-card';
const input        = 'bg-raised border border-line rounded-ctl p-3 text-ink placeholder-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors';
const btnPrimary   = 'bg-accent hover:brightness-110 text-accent-ink font-semibold rounded-ctl transition-all';
const btnSecondary = 'bg-raised hover:bg-line border border-line text-ink font-semibold rounded-ctl transition-colors';
const btnDanger    = 'bg-crit hover:brightness-110 text-white font-semibold rounded-ctl transition-all';

// Small uppercase caption. Used for every label in the app.
const label = 'font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-muted';

// A number that is meant to be read at arm's length, mid-set. Colour is left to
// inherit (body is `text-ink`) so a call-site `text-accent`/`text-good` override
// actually wins — Tailwind emits `.text-ink` after them alphabetically, so baking
// `text-ink` in here would silently beat every same-property override layered on it.
const readout = 'font-display font-bold tabular-nums leading-none';

// ─── Weekly-goal progress tile ──────────────────────────────────────────────────
// The home "This week" stat tile can visualise goal progress seven ways, chosen in
// Settings (prefs.goalCardStyle). Colour is driven by `tone` (a text-colour class:
// always text-accent — the user's chosen accent, at every fill level) and SVG fills
// use currentColor, so themes come from the token system — no raw hex here. Each fill
// animates up from empty on mount; the global reduced-motion rule in index.css
// collapses every animation/transition to a static fill.

// Two sine waves drifting horizontally, translated up to the fill level. Drawn from
// x=-60 to 180 (wider than the 0..120 viewBox) so the -60 drift loops without a gap.
const WAVE_FRONT = 'M-60,10 C-45,3 -30,17 0,10 C15,3 30,17 60,10 C75,3 90,17 120,10 C135,3 150,17 180,10 L180,120 L-60,120 Z';
const WAVE_BACK  = 'M-60,10 C-45,17 -30,3 0,10 C15,17 30,3 60,10 C75,17 90,3 120,10 C135,17 150,3 180,10 L180,120 L-60,120 Z';
// The front wave's top edge only (no fill), used as a bright waterline crest.
const WAVE_CREST = 'M-60,10 C-45,3 -30,17 0,10 C15,3 30,17 60,10 C75,3 90,17 120,10 C135,3 150,17 180,10';
const RISE = 'cubic-bezier(.22,1,.36,1)';
const clampPct = (n: number) => Math.max(0, Math.min(100, n));

// Carbonation for the Bubbles fill: fixed x/size/timing so the render is stable.
const BUBBLES = [
  { x: 24, r: 2.4, delay: 0,   dur: 3.2 },
  { x: 52, r: 1.7, delay: 1.1, dur: 3.9 },
  { x: 78, r: 2.9, delay: 0.5, dur: 3.0 },
  { x: 98, r: 1.5, delay: 1.9, dur: 4.3 },
  { x: 40, r: 1.5, delay: 2.4, dur: 3.6 },
  { x: 66, r: 2.1, delay: 1.5, dur: 3.4 },
];

// True after the first paint. Fills read `empty` until then, real value after, so the
// CSS transition animates them up from empty on mount.
const useMounted = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
};

// Liquid wave filling the whole tile from the bottom to `pct`. A gentle wash (low
// opacity) so the number stays legible on top even when submerged. With `bubbles`, it
// grows a brighter crest line and carbonation rising through the body (the Bubbles style).
const LiquidWave = ({ pct, tone, bubbles }: any) => {
  const shown = useMounted() ? 100 - clampPct(pct) : 100;
  return (
    <div aria-hidden className={`absolute inset-0 pointer-events-none ${tone}`}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 120 100" preserveAspectRatio="none">
        <g style={{ transform: `translateY(${shown}px)`, transition: `transform 900ms ${RISE}` }}>
          <g className="animate-wave-slow">
            <path d={WAVE_BACK} fill="currentColor" fillOpacity="0.14" />
          </g>
          <g className="animate-wave">
            <path d={WAVE_FRONT} fill="currentColor" fillOpacity="0.26" />
            {bubbles && (
              <path d={WAVE_CREST} fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
            )}
          </g>
          {bubbles && BUBBLES.map((b, i) => (
            <circle
              key={i} cx={b.x} cy="110" r={b.r} fill="currentColor" fillOpacity="0.5" className="animate-bubble"
              style={{ animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s` }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

// A grid of small tiles behind the number that light up bottom-up until the filled
// share matches `pct`. Nods to the "small blocks" idea; kept a translucent wash so the
// number reads over it.
const MOSAIC_COLS = 6;
const MOSAIC_ROWS = 5;
const MosaicFill = ({ pct, tone }: any) => {
  const total = MOSAIC_COLS * MOSAIC_ROWS;
  const filled = useMounted() ? Math.round((clampPct(pct) / 100) * total) : 0;
  return (
    <div
      aria-hidden
      className={`absolute inset-2 grid gap-1 ${tone}`}
      style={{ gridTemplateColumns: `repeat(${MOSAIC_COLS}, 1fr)`, gridTemplateRows: `repeat(${MOSAIC_ROWS}, 1fr)` }}
    >
      {Array.from({ length: total }).map((_, idx) => {
        const r = Math.floor(idx / MOSAIC_COLS);
        const c = idx % MOSAIC_COLS;
        const bottomUp = (MOSAIC_ROWS - 1 - r) * MOSAIC_COLS + c;   // 0 = bottom-left, fills first
        const on = bottomUp < filled;
        return (
          <div
            key={idx}
            className={`rounded-[2px] ${on ? 'bg-current animate-tile' : 'bg-line'}`}
            style={{ opacity: on ? 0.32 : 0.12, animationDelay: on ? `${bottomUp * 26}ms` : undefined }}
          />
        );
      })}
    </div>
  );
};

// A soft radial glow behind the number whose radius grows with `pct` and gently
// pulses. Ambient rather than a hard fill line; tinted by `tone` (the accent).
const RadialGlow = ({ pct, tone }: any) => {
  const size = useMounted() ? 32 + clampPct(pct) * 0.9 : 32;   // % of tile width, up to ~122%
  return (
    <div aria-hidden className={`absolute inset-0 flex items-center justify-center overflow-hidden ${tone}`}>
      <div
        className="aspect-square rounded-full animate-glow"
        style={{
          width: `${size}%`,
          background: 'radial-gradient(circle, currentColor 0%, transparent 68%)',
          opacity: 0.4,
          transition: `width 900ms ${RISE}`,
        }}
      />
    </div>
  );
};

// A ring that sweeps from the top (12 o'clock) to `pct`. Sits behind the number.
const ProgressRing = ({ pct, tone }: any) => {
  const p = Math.max(0, Math.min(100, pct));
  const offset = useMounted() ? 100 - p : 100;   // pre-paint: empty ring, then sweep to p
  return (
    <svg aria-hidden viewBox="0 0 100 100" className="h-[104px] w-[104px] -rotate-90 sm:h-[120px] sm:w-[120px]">
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="7" className="text-line" />
      <circle
        cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round"
        pathLength={100} strokeDasharray="100" strokeDashoffset={offset} className={tone}
        style={{ transition: `stroke-dashoffset 900ms ${RISE}` }}
      />
    </svg>
  );
};

// A row of pips = the weekly goal; the first `count` are filled. Big goals (> 8) would
// overflow the small tile, so they fall back to a slim bar with the same fill logic.
const PlatePips = ({ count, goal, tone }: any) => {
  if (goal > 8) {
    const p = goal > 0 ? Math.min(count / goal, 1) * 100 : 0;
    return (
      <div className="h-2 w-full max-w-[92px] overflow-hidden rounded-chip bg-line">
        <div className={`h-full rounded-chip bg-current ${tone}`} style={{ width: `${p}%`, transition: `width 800ms ${RISE}` }} />
      </div>
    );
  }
  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-1">
      {Array.from({ length: Math.max(goal, 0) }).map((_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${i < count ? `bg-current ${tone} animate-fade-rise` : 'bg-line'}`}
          style={i < count ? { animationDelay: `${i * 80}ms` } : undefined}
        />
      ))}
    </div>
  );
};

// The unique one: the number glyph itself is the vessel. The numerals clip a rising
// liquid; the un-filled part shows as a faint outline of the same digits.
const LiquidNumber = ({ value, pct, tone }: any) => {
  const shown = useMounted() ? 100 - Math.max(0, Math.min(100, pct)) : 100;
  const digitProps = {
    x: 60, y: 62, textAnchor: 'middle' as const, fontSize: 72, fontWeight: 700,
    fontFamily: "'Barlow Condensed', sans-serif",
  };
  return (
    <svg aria-hidden viewBox="0 0 120 80" className={`h-[76px] w-auto sm:h-[92px] ${tone}`}>
      <defs>
        <clipPath id="liquidNumberClip">
          <text {...digitProps}>{value}</text>
        </clipPath>
      </defs>
      {/* the empty vessel */}
      <text {...digitProps} fill="currentColor" fillOpacity="0.16">{value}</text>
      {/* the liquid, clipped to the digits */}
      <g clipPath="url(#liquidNumberClip)">
        <g style={{ transform: `translateY(${shown}px)`, transition: `transform 1000ms ${RISE}` }}>
          <g className="animate-wave">
            <path d={WAVE_FRONT} fill="currentColor" fillOpacity="0.92" />
          </g>
        </g>
      </g>
    </svg>
  );
};

// The tile itself. Kept the same size as its Streak/Sessions siblings so the row stays
// aligned; only the interior changes per style.
const WeekGoalTile = ({ style, pct, met, count, goal }: any) => {
  const tone = 'text-accent';   // always the chosen accent — no met-state green
  const rounded = Math.round(pct);
  const wrap = `${card} p-3 sm:p-4 relative overflow-hidden flex flex-col items-center text-center min-h-[132px] sm:min-h-[148px]`;

  if (style === 'ring') {
    return (
      <div className={wrap}>
        <span className={`${label} text-[10px] relative z-10`}>This week</span>
        <div className="relative my-auto flex items-center justify-center">
          <ProgressRing pct={pct} tone={tone} />
          <span className={`${readout} absolute text-4xl leading-none sm:text-5xl ${tone}`}>{rounded}</span>
        </div>
        <p className="relative z-10 text-[11px] text-faint">% of goal</p>
      </div>
    );
  }

  if (style === 'plates') {
    const filled = Math.min(count, goal);
    return (
      <div className={wrap}>
        <span className={`${label} text-[10px]`}>This week</span>
        <p className={`${readout} my-2 text-4xl leading-none sm:text-5xl ${tone}`}>
          {filled}<span className="text-2xl text-faint">/{goal}</span>
        </p>
        <PlatePips count={filled} goal={goal} tone={tone} />
        <p className="mt-auto pt-2 text-[11px] text-faint">sessions done</p>
      </div>
    );
  }

  if (style === 'liquidNumber') {
    return (
      <div className={wrap}>
        <span className={`${label} text-[10px]`}>This week</span>
        <div className="my-auto"><LiquidNumber value={rounded} pct={pct} tone={tone} /></div>
        <p className="text-[11px] text-faint">% of goal</p>
      </div>
    );
  }

  // Background-fill styles (liquid / bubbles / mosaic / glow): an animated fill behind
  // the number. `liquid` is the default fall-through.
  const fill =
    style === 'mosaic' ? <MosaicFill pct={pct} tone={tone} /> :
    style === 'glow'   ? <RadialGlow pct={pct} tone={tone} /> :
    <LiquidWave pct={pct} tone={tone} bubbles={style === 'bubbles'} />;
  return (
    <div className={wrap}>
      {fill}
      <span className={`${label} text-[10px] relative z-10`}>This week</span>
      <p className={`${readout} my-auto text-5xl leading-none sm:text-6xl relative z-10 ${tone}`}>{rounded}</p>
      <p className="relative z-10 text-[11px] text-faint">% of goal</p>
    </div>
  );
};

// ── Import sanitisation ──────────────────────────────────────────────────────
// A backup file is user-supplied and may be hand-edited or corrupt. Coerce every
// imported record into a known-good shape before it reaches the DB, so a malformed
// file can't poison the account with NaN weights, blank ids or an unknown type
// (which would then break the stats and charts that read them). Bad rows drop out
// rather than propagate; unknown workout types fold to 'custom'.
// A date is the row's correlation key AND what every chart, streak and calendar
// bucket parses. An unparseable string survives `text` storage happily and then
// poisons all of them: NaN sorts unpredictably, the streak head-check `NaN > 2` is
// false so a dead streak reads as alive, and the calendar buckets it out of sight.
// So the string must be a date the platform can actually parse, not merely non-empty.
const isValidDateString = (v: any): v is string =>
  typeof v === 'string' && v.trim() !== '' && Number.isFinite(new Date(v).getTime());

// Postgres `real` (float4) tops out near 3.4e38, and both weight columns are `real`.
// A value the client accepts but the column can't hold inserts-errors forever with
// no retry, so the ceiling belongs on this side too. 100 t is far past any lift or
// body weight while staying comfortably inside float4.
const MAX_WEIGHT_KG = 100000;
const cleanWeight = (raw: any): number | null | undefined => {
  if (raw == null || raw === '') return null;                     // null = bodyweight
  // Only a number or a numeric string is a weight. Number() would otherwise coerce
  // `true`→1, `[]`→0 and `[5]`→5, inventing loads that were never logged — and 0 is
  // NOT the same as bodyweight (null), so a coerced 0 is a silent data change.
  if (typeof raw !== 'number' && typeof raw !== 'string') return undefined;
  // A whitespace-only string is a blank field, not zero — Number(' ') is 0, which
  // would silently record "0 kg" where the user logged bodyweight.
  if (typeof raw === 'string' && raw.trim() === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > MAX_WEIGHT_KG) return undefined;   // undefined = reject the row
  return n;
};

const MAX_REPS = 10000;
const cleanImportedSet = (s: any) => {
  const reps = Math.trunc(Number(s?.reps));
  if (!Number.isFinite(reps) || reps <= 0 || reps > MAX_REPS) return null;   // a set needs real reps
  const weight = cleanWeight(s?.weight);
  if (weight === undefined) return null;
  return { reps, weight };
};

const cleanImportedExercise = (e: any) => {
  const name = typeof e?.name === 'string' ? e.name.trim() : '';
  if (!name) return null;
  return {
    name,
    exerciseId: typeof e?.exerciseId === 'string' && e.exerciseId ? e.exerciseId : idForName(name),
    sets: Array.isArray(e?.sets) ? e.sets.map(cleanImportedSet).filter(Boolean) : [],
    notes: typeof e?.notes === 'string' ? e.notes : '',
  };
};

// A session longer than a day is a stale restored timer, not a real workout.
const MAX_DURATION_S = 86400;

const cleanImportedWorkout = (w: any) => {
  if (!w || typeof w !== 'object') return null;
  if (!isValidDateString(w.date)) return null;                    // date is the row's correlation key
  const date = w.date;
  const bw  = cleanWeight(w.bodyWeight);
  const dur = Math.trunc(Number(w.duration));
  return {
    type: pick(TYPE_CONFIG, w.type) ? w.type : 'custom',         // unknown type folds to custom
    bodyWeight: bw === undefined ? null : bw,                     // out-of-range → skipped weigh-in
    exercises: Array.isArray(w.exercises) ? w.exercises.map(cleanImportedExercise).filter(Boolean) : [],
    date,
    notes: typeof w.notes === 'string' ? w.notes : '',
    ...(Number.isFinite(dur) && dur > 0 ? { duration: Math.min(dur, MAX_DURATION_S) } : {}),
  };
};

const cleanImportedBW = (e: any) => {
  if (!e || typeof e !== 'object') return null;
  if (!isValidDateString(e.date)) return null;
  const weight = Number(e.weight);
  if (!Number.isFinite(weight) || weight <= 0 || weight > MAX_WEIGHT_KG) return null;
  return { date: e.date, weight };
};

// Home-screen session picker. Every tile is a flat surface: the three PPL days
// and Custom used to render a stock photograph full-bleed, and no longer do.
//
// The fields that drove that (`img`, and `pos` for the per-photo crop) are gone
// rather than left optional-and-unused, so re-introducing a photo has to be a
// deliberate edit that passes back through the image-rights decision in
// compliance/launch-decisions.json rather than a one-line addition to a tile.
type SessionType = { name: string; label: string; sub: string };

// The session tiles are the user's SPLIT, not a fixed PPL assumption. `prefs.split`
// picks one; the home card renders its days (plus Custom, which every split gets).
//
// `name` IS the stored `workout.type`, so the ids must be stable and shared wherever
// the day is the same — 'legs' is one id across PPL, bro and Arnold, and history
// logged under a split you've since left keeps rendering (TYPE_CONFIG holds every
// label, forever).
type Split = { id: string; label: string; sub: string; days: SessionType[] };

const CUSTOM_DAY: SessionType = { name: 'custom', label: 'Custom', sub: 'Build your own' };

const SPLITS: Split[] = [
  { id: 'ppl', label: 'Push / Pull / Legs', sub: 'Three days, by movement', days: [
    { name: 'push', label: 'Push Day', sub: 'Chest · Shoulders · Triceps' },
    { name: 'pull', label: 'Pull Day', sub: 'Back · Biceps · Deadlifts'   },
    { name: 'legs', label: 'Leg Day',  sub: 'Quads · Hamstrings · Glutes' },
  ] },
  { id: 'upperLower', label: 'Upper / Lower', sub: 'Two days, alternating', days: [
    { name: 'upper', label: 'Upper Body', sub: 'Chest · Back · Shoulders · Arms' },
    { name: 'lower', label: 'Lower Body', sub: 'Quads · Hamstrings · Glutes' },
  ] },
  { id: 'fullBody', label: 'Full Body', sub: 'Everything, every session', days: [
    { name: 'fullbody', label: 'Full Body', sub: 'Whole body in one' },
  ] },
  { id: 'bro', label: 'Bro Split', sub: 'Five days, one muscle each', days: [
    { name: 'chest',     label: 'Chest',     sub: 'Press · Fly · Dips' },
    { name: 'back',      label: 'Back',      sub: 'Pulls · Rows · Deadlifts' },
    { name: 'shoulders', label: 'Shoulders', sub: 'Press · Laterals · Rear delts' },
    { name: 'arms',      label: 'Arms',      sub: 'Biceps · Triceps' },
    { name: 'legs',      label: 'Legs',      sub: 'Quads · Hamstrings · Glutes' },
  ] },
  { id: 'arnold', label: 'Arnold Split', sub: 'Antagonist pairs', days: [
    { name: 'chestback',     label: 'Chest & Back',     sub: 'Press · Pull · Row' },
    { name: 'shouldersarms', label: 'Shoulders & Arms', sub: 'Delts · Biceps · Triceps' },
    { name: 'legs',          label: 'Legs',             sub: 'Quads · Hamstrings · Glutes' },
  ] },
  // No fixed days — daysOfSplit still appends CUSTOM_DAY, so this split is exactly
  // the one Custom tile: build every session from the full catalogue.
  { id: 'custom', label: 'Custom', sub: 'No fixed days', days: [] },
];

const SPLIT_BY_ID: Record<string, Split> = Object.fromEntries(SPLITS.map(s => [s.id, s]));

// A session starts with its day's exercises already on screen, so logging is
// "type reps and weight", not "go find the exercise first". They're plain cards —
// reorder or bin any you're not doing, add anything missing from the picker, and
// finishWorkout drops the ones that never got a set, so an untouched card costs
// nothing. Names must match the catalogue exactly or the card is a one-off with a
// different id and its history won't join up (tests/exercise-identity.test.mjs
// checks every name here against EXERCISES). Custom is deliberately empty.
// A fresh exercise card. `_uid` is a per-CARD identity: client-only, and stripped
// before the session is saved (see finishWorkout). Cards used to be keyed by array
// index, so React bound each card's un-committed reps/weight draft to a POSITION —
// reorder or delete a card and the draft stayed behind on that slot, now belonging
// to a different exercise, and pressing Add Set logged it against the wrong lift.
const newExerciseCard = (name: string) => ({
  _uid: crypto.randomUUID(), name, exerciseId: idForName(name), sets: [], notes: '',
});

const STARTER_TEMPLATES: Record<string, string[]> = {
  push:  ['Bench Press', 'Incline Dumbbell Press', 'Shoulder Press', 'Lateral Raises', 'Tricep Pushdowns'],
  pull:  ['Deadlift', 'Pull-ups', 'Barbell Row', 'Face Pulls', 'Barbell Curl'],
  legs:  ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raises'],

  upper: ['Bench Press', 'Barbell Row', 'Shoulder Press', 'Lat Pulldown', 'Barbell Curl', 'Tricep Pushdowns'],
  lower: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Calf Raises'],

  fullbody: ['Squat', 'Bench Press', 'Barbell Row', 'Shoulder Press', 'Romanian Deadlift'],

  chest:     ['Bench Press', 'Incline Dumbbell Press', 'Cable Crossover', 'Chest Dips'],
  back:      ['Deadlift', 'Pull-ups', 'Barbell Row', 'Seated Cable Row', 'Face Pulls'],
  shoulders: ['Overhead Press', 'Lateral Raises', 'Front Raises', 'Rear Delt Fly', 'Shrugs'],
  arms:      ['Barbell Curl', 'Hammer Curl', 'Preacher Curl', 'Close Grip Bench Press', 'Tricep Pushdowns'],

  chestback:     ['Bench Press', 'Barbell Row', 'Incline Dumbbell Press', 'Lat Pulldown', 'Cable Crossover'],
  shouldersarms: ['Overhead Press', 'Lateral Raises', 'Barbell Curl', 'Hammer Curl', 'Skull Crushers'],

  custom: [],
};

// The exercise cards a session opens with. Ids are stamped here, same as addExercise.
const starterExercises = (type: string) => (pick(STARTER_TEMPLATES, type) ?? []).map(newExerciseCard);

// ── Local dev: walk past the login gate ─────────────────────────────────────────
// Set VITE_DEV_AUTH_BYPASS=1 in .env.local (gitignored — never present in a real
// build) to skip LoginScreen and land on a dashboard painted from seeded demo data.
// There is NO session in this mode, so every Supabase effect stays inert and nothing
// is persisted: it is a viewer for the UI, not a usable account. Delete the env line
// (or run `npm run build`, where the var is absent) to get the real login back.
const DEV_AUTH_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === '1';

const seedDemoData = () => {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;   // real or already-seeded data — leave it
    let s = 0x9e3779b9;
    const rnd = () => (((s = (s * 1664525 + 1013904223) >>> 0) / 0x100000000));
    const jit = (n: number, spread: number) => Math.round((n + (rnd() - 0.5) * spread) / 2.5) * 2.5;
    const BASE: Record<string, number> = {
      'Bench Press': 70, 'Incline Dumbbell Press': 28, 'Shoulder Press': 45, 'Lateral Raises': 12,
      'Tricep Pushdowns': 25, Deadlift: 130, 'Pull-ups': 0, 'Barbell Row': 65, 'Face Pulls': 22,
      'Barbell Curl': 30, Squat: 100, 'Romanian Deadlift': 90, 'Leg Press': 160, 'Leg Curl': 45,
      'Calf Raises': 80,
    };
    const DAYS = ['push', 'pull', 'legs'];
    const now = Date.now();
    const workouts: any[] = [];
    const bw: any[] = [];
    for (let wk = 17; wk >= 0; wk--) {
      const prog = (17 - wk) / 17;                       // linear progression over ~4 months
      for (let d = 0; d < 3; d++) {
        const type = DAYS[d];
        const date = new Date(now - (wk * 7 + (2 - d) * 2) * 86400000);
        workouts.push({
          id: crypto.randomUUID(),
          type,
          bodyWeight: null,
          date: date.toISOString(),
          notes: '',
          exercises: (pick(STARTER_TEMPLATES, type) as string[]).map((name) => {
            const top = (BASE[name] ?? 40) * (1 + prog * 0.22);
            return {
              name,
              notes: '',
              sets: Array.from({ length: 3 }, (_, i) => ({
                reps: 6 + Math.floor(rnd() * 5),
                weight: BASE[name] === 0 ? null : Math.max(2.5, jit(top - i * top * 0.08, 5)),
              })),
            };
          }),
        });
      }
      bw.push({
        id: crypto.randomUUID(),
        date: new Date(now - wk * 7 * 86400000).toISOString(),
        weight: Math.round((78 + (17 - wk) * 0.18 + (rnd() - 0.5)) * 10) / 10,
      });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
    localStorage.setItem(BW_LOG_KEY, JSON.stringify(bw));
    localStorage.setItem(GOAL_KEY, '3');
    localStorage.setItem(PREFS_KEY, JSON.stringify({ name: 'Demo', units: 'kg', split: 'ppl' }));
  } catch { /* a private-mode localStorage throw just means no seed — the app still loads */ }
};

if (DEV_AUTH_BYPASS) seedDemoData();

// The tiles a split shows: its days, then Custom (always available, whatever you train).
const daysOfSplit = (id: string): SessionType[] => [...(pick(SPLIT_BY_ID, id)?.days ?? []), CUSTOM_DAY];

// Type → label, derived from SPLITS so a day is named in exactly one place. It holds
// EVERY day type from every split (not just the current one): it labels history and
// it's the import sanitiser's whitelist, so a type missing here would fold imported
// sessions to 'custom'. First declaration wins, so a day shared by two splits keeps
// the name the split that defines it first gives it ('legs' → "Leg Day").
const TYPE_CONFIG: Record<string, { label: string }> = [...SPLITS.flatMap(s => s.days), CUSTOM_DAY]
  .reduce((acc, d) => (acc[d.name] ??= { label: d.label }, acc), {} as Record<string, { label: string }>);

// What a day is CALLED. The user can rename any tile ("Push Day" → "Chest & Delts");
// the override lives in `prefs.dayNames`, keyed by the same type id, so renaming is
// display-only — history, stats and the import whitelist all still key off the id.
// Every label read goes through here rather than TYPE_CONFIG directly.
const labelForType = (type: string, dayNames: Record<string, string> = {}) =>
  pick(dayNames, type) || (pick(TYPE_CONFIG, type) ?? TYPE_CONFIG.custom).label;

// `dayNames` comes from a cache, a server JSON column or an imported backup, so it
// gets the same treatment as `hidden`: coerce anything that isn't a string→string
// map back to empty rather than letting a bad blob render as a label.
const safeDayNames = (v: any): Record<string, string> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.entries(v).filter(([, name]) => typeof name === 'string' && name)) as Record<string, string>
    : {};

// Recharts takes colour strings, not classes, so the tokens are mirrored here.
// `accent` is the single-series line colour and `series2` the bodyweight amber; the
// rest are neutrals. The muscle-focus donut no longer keeps a fixed categorical
// palette here — it derives its slice colours from the accent (muscleDonutPalette).
const CHART = {
  dark:  { accent: '#2E7BD6', series2: '#E0A63C', grid: '#26313A', axis: '#5A6874', surface: '#151C21', line: '#26313A', muted: '#8B9AA7' },
  light: { accent: '#1B5FBF', series2: '#A9741F', grid: '#D7DEE3', axis: '#93A1AC', surface: '#FFFFFF', line: '#D7DEE3', muted: '#5A6874' },
};

// Accent presets. Each is a light+dark pair; the token strings are RGB triplets
// (dropped straight into `--accent` / `--accent-ink`), `hex` mirrors the accent for
// charts. Red and green are excluded so an accent never impersonates crit/good.
// Every ink/accent contrast was checked against WCAG (worst ink-on-accent 4.23,
// worst accent-on-surface 4.03) — don't hand-edit without re-checking. Both the
// single-series exercise line and the muscle-focus donut follow the accent (the
// donut derives an analogous+shade fan from it — see muscleDonutPalette).
const WHITE_INK = '255 255 255';
const DARK_INK  = '13 18 21';
type AccentTone = { accent: string; ink: string; hex: string };
const ACCENTS: Record<string, { label: string; light: AccentTone; dark: AccentTone }> = {
  blue:    { label: 'Blue',    light: { accent: '27 95 191',  ink: WHITE_INK, hex: '#1B5FBF' }, dark: { accent: '46 123 214',  ink: WHITE_INK, hex: '#2E7BD6' } },
  indigo:  { label: 'Indigo',  light: { accent: '79 70 229',  ink: WHITE_INK, hex: '#4F46E5' }, dark: { accent: '129 140 248', ink: DARK_INK,  hex: '#818CF8' } },
  violet:  { label: 'Violet',  light: { accent: '124 58 237', ink: WHITE_INK, hex: '#7C3AED' }, dark: { accent: '139 92 246',  ink: WHITE_INK, hex: '#8B5CF6' } },
  magenta: { label: 'Magenta', light: { accent: '190 29 176', ink: WHITE_INK, hex: '#BE1DB0' }, dark: { accent: '210 75 224',  ink: DARK_INK,  hex: '#D24BE0' } },
  pink:    { label: 'Pink',    light: { accent: '219 39 119', ink: WHITE_INK, hex: '#DB2777' }, dark: { accent: '244 114 182', ink: DARK_INK,  hex: '#F472B6' } },
  rose:    { label: 'Rose',    light: { accent: '225 29 72',  ink: WHITE_INK, hex: '#E11D48' }, dark: { accent: '251 113 133', ink: DARK_INK,  hex: '#FB7185' } },
  orange:  { label: 'Orange',  light: { accent: '194 65 12',  ink: WHITE_INK, hex: '#C2410C' }, dark: { accent: '251 146 60',  ink: DARK_INK,  hex: '#FB923C' } },
  amber:   { label: 'Amber',   light: { accent: '180 83 9',   ink: WHITE_INK, hex: '#B45309' }, dark: { accent: '245 158 11',  ink: DARK_INK,  hex: '#F59E0B' } },
  red:     { label: 'Red',     light: { accent: '220 38 38',  ink: WHITE_INK, hex: '#DC2626' }, dark: { accent: '248 113 113', ink: DARK_INK,  hex: '#F87171' } },
  orange2: { label: 'Gold',    light: { accent: '161 98 7',   ink: WHITE_INK, hex: '#A16207' }, dark: { accent: '234 179 8',   ink: DARK_INK,  hex: '#EAB308' } },
  lime:    { label: 'Lime',    light: { accent: '77 124 15',  ink: WHITE_INK, hex: '#4D7C0F' }, dark: { accent: '163 230 53',  ink: DARK_INK,  hex: '#A3E635' } },
  green:   { label: 'Green',   light: { accent: '21 128 61',  ink: WHITE_INK, hex: '#15803D' }, dark: { accent: '34 197 94',   ink: DARK_INK,  hex: '#22C55E' } },
  emerald: { label: 'Emerald', light: { accent: '4 120 87',   ink: WHITE_INK, hex: '#047857' }, dark: { accent: '52 211 153',  ink: DARK_INK,  hex: '#34D399' } },
  teal:    { label: 'Teal',    light: { accent: '15 118 110', ink: WHITE_INK, hex: '#0F766E' }, dark: { accent: '20 184 166',  ink: DARK_INK,  hex: '#14B8A6' } },
  cyan:    { label: 'Cyan',    light: { accent: '14 116 144', ink: WHITE_INK, hex: '#0E7490' }, dark: { accent: '34 211 238',  ink: DARK_INK,  hex: '#22D3EE' } },
  sky:     { label: 'Sky',     light: { accent: '3 105 161',  ink: WHITE_INK, hex: '#0369A1' }, dark: { accent: '56 189 248',  ink: DARK_INK,  hex: '#38BDF8' } },
  purple:  { label: 'Purple',  light: { accent: '147 51 234', ink: WHITE_INK, hex: '#9333EA' }, dark: { accent: '168 85 247',  ink: WHITE_INK, hex: '#A855F7' } },
  slate:   { label: 'Slate',   light: { accent: '71 85 105',  ink: WHITE_INK, hex: '#475569' }, dark: { accent: '124 139 160', ink: DARK_INK,  hex: '#7C8BA0' } },
};
const ACCENT_IDS = Object.keys(ACCENTS);
const accentTone = (id: string, theme: Theme): AccentTone => (pick(ACCENTS, id) ?? ACCENTS.blue)[theme];

// Base (neutral) palettes. Each was generated by re-tinting the Graphite ramp at
// CONSTANT OKLCH lightness — only hue/chroma shift — so every contrast ratio is
// preserved by construction (verified: ink ≥ 18 / muted ≥ 5.7 / faint ≥ 2.6 on
// surface, both themes). `tokens` override the neutral CSS vars; `chart` mirrors
// the neutrals as hex for recharts. Don't hand-edit without re-generating.
type BaseTone = { tokens: Record<string, string>; chart: { surface: string; line: string; grid: string; axis: string; muted: string } };
const BASES: Record<string, { label: string; light: BaseTone; dark: BaseTone }> = {
  graphite: { label: 'Graphite',
    light: { tokens: { '--ground':'238 241 243','--surface':'255 255 255','--raised':'231 236 239','--line':'215 222 227','--ink':'13 18 21','--muted':'90 104 116','--faint':'147 161 172' }, chart: { surface:'#ffffff', line:'#d7dee3', grid:'#d7dee3', axis:'#5a6874', muted:'#5a6874' } },
    dark:  { tokens: { '--ground':'13 18 21','--surface':'21 28 33','--raised':'30 39 46','--line':'38 49 58','--ink':'230 237 243','--muted':'139 154 167','--faint':'90 104 116' }, chart: { surface:'#151c21', line:'#26313a', grid:'#26313a', axis:'#8b9aa7', muted:'#8b9aa7' } } },
  warm: { label: 'Warm',
    light: { tokens: { '--ground':'253 239 219','--surface':'255 253 232','--raised':'251 233 207','--line':'239 219 189','--ink':'19 17 15','--muted':'106 101 96','--faint':'162 158 154' }, chart: { surface:'#fffde8', line:'#efdbbd', grid:'#efdbbd', axis:'#6a6560', muted:'#6a6560' } },
    dark:  { tokens: { '--ground':'25 16 3','--surface':'36 26 11','--raised':'48 36 19','--line':'60 46 26','--ink':'237 236 233','--muted':'155 151 146','--faint':'107 101 95' }, chart: { surface:'#241a0b', line:'#3c2e1a', grid:'#3c2e1a', axis:'#9b9792', muted:'#9b9792' } } },
  slate: { label: 'Slate',
    light: { tokens: { '--ground':'233 241 255','--surface':'247 255 255','--raised':'225 235 255','--line':'210 221 251','--ink':'14 17 22','--muted':'95 103 113','--faint':'153 159 167' }, chart: { surface:'#f7ffff', line:'#d2ddfb', grid:'#d2ddfb', axis:'#5f6771', muted:'#5f6771' } },
    dark:  { tokens: { '--ground':'12 17 30','--surface':'21 27 42','--raised':'31 38 55','--line':'40 48 67','--ink':'233 236 240','--muted':'146 153 162','--faint':'94 103 115' }, chart: { surface:'#151b2a', line:'#283043', grid:'#283043', axis:'#9299a2', muted:'#9299a2' } } },
  carbon: { label: 'Carbon',
    light: { tokens: { '--ground':'240 240 240','--surface':'255 255 255','--raised':'235 235 235','--line':'221 221 221','--ink':'17 17 17','--muted':'102 102 102','--faint':'159 159 159' }, chart: { surface:'#ffffff', line:'#dddddd', grid:'#dddddd', axis:'#666666', muted:'#666666' } },
    dark:  { tokens: { '--ground':'17 17 17','--surface':'27 27 27','--raised':'38 38 38','--line':'47 47 47','--ink':'236 236 236','--muted':'152 152 152','--faint':'102 102 102' }, chart: { surface:'#1b1b1b', line:'#2f2f2f', grid:'#2f2f2f', axis:'#989898', muted:'#989898' } } },
  rose: { label: 'Rose',
    light: { tokens: { '--ground':'255 233 249','--surface':'255 247 255','--raised':'255 225 246','--line':'254 210 233','--ink':'19 16 16','--muted':'108 100 100','--faint':'163 157 157' }, chart: { surface:'#fff7ff', line:'#fed2e9', grid:'#fed2e9', axis:'#6c6464', muted:'#6c6464' } },
    dark:  { tokens: { '--ground':'32 12 23','--surface':'43 21 33','--raised':'57 31 45','--line':'69 40 56','--ink':'238 235 235','--muted':'157 150 150','--faint':'109 99 100' }, chart: { surface:'#2b1521', line:'#452838', grid:'#452838', axis:'#9d9696', muted:'#9d9696' } } },
  sage: { label: 'Sage',
    light: { tokens: { '--ground':'225 246 227','--surface':'238 255 240','--raised':'214 243 217','--line':'198 230 200','--ink':'16 18 16','--muted':'98 104 99','--faint':'156 160 157' }, chart: { surface:'#eefff0', line:'#c6e6c8', grid:'#c6e6c8', axis:'#626863', muted:'#626863' } },
    dark:  { tokens: { '--ground':'7 21 8','--surface':'15 31 17','--raised':'24 43 26','--line':'32 53 34','--ink':'234 237 235','--muted':'148 153 149','--faint':'97 104 98' }, chart: { surface:'#0f1f11', line:'#203522', grid:'#203522', axis:'#949995', muted:'#949995' } } },
  ocean: { label: 'Ocean',
    light: { tokens: { '--ground':'226 244 252','--surface':'239 255 255','--raised':'216 239 250','--line':'199 226 237','--ink':'14 18 19','--muted':'94 104 108','--faint':'153 160 163' }, chart: { surface:'#efffff', line:'#c7e2ed', grid:'#c7e2ed', axis:'#5e686c', muted:'#5e686c' } },
    dark:  { tokens: { '--ground':'8 19 24','--surface':'16 29 35','--raised':'25 40 47','--line':'33 50 58','--ink':'233 237 238','--muted':'144 154 157','--faint':'92 104 109' }, chart: { surface:'#101d23', line:'#21323a', grid:'#21323a', axis:'#909a9d', muted:'#909a9d' } } },
};
const BASE_IDS = Object.keys(BASES);

// Semantic-colour sets (good / warn / crit as RGB triplets). All validated on the
// surfaces (good/warn as text ≥ 3, crit as button bg vs white text ≥ 3.5). `cvd`
// is Wong-derived so good and crit stay distinct under red-green colour blindness.
type SemTone = { good: string; warn: string; crit: string };
const SEMANTICS: Record<string, { label: string; light: SemTone; dark: SemTone }> = {
  plates: { label: 'Plates', light: { good:'47 125 58',  warn:'169 116 31', crit:'176 42 37' },  dark: { good:'63 163 77',  warn:'224 166 60', crit:'200 51 46' } },
  vivid:  { label: 'Vivid',  light: { good:'21 128 61',  warn:'180 83 9',   crit:'220 38 38' },  dark: { good:'34 197 94',  warn:'245 158 11', crit:'240 68 68' } },
  cvd:    { label: 'Colour-blind', light: { good:'4 120 87', warn:'180 83 9', crit:'194 65 12' }, dark: { good:'16 185 129', warn:'245 158 11', crit:'226 78 18' } },
};
const SEM_IDS = Object.keys(SEMANTICS);

// ── Prefs sanitisation ────────────────────────────────────────────────────────
// `prefs` arrives from three untrusted places — the localStorage cache, the
// `settings.prefs` JSON column, and an imported backup — and it used to be merged
// over DEFAULT_PREFS with only `hidden` and `dayNames` checked. Everything else
// passed through verbatim, so a hand-edited blob could set `units: "stone"` (every
// weight then rendered as kg but labelled "stone") or `base: "__proto__"` (the theme
// resolver threw, blanking the app on every device the blob synced to).
//
// The merge stays forward-compatible — an unknown FIELD is still preserved, so a
// blob written by a newer build round-trips — but every field the app actually
// reads is now pinned to a known-good value. One function, used by all three paths,
// so they can't drift apart again.
const oneOf = <T,>(v: any, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v) ? v : fallback;

const MAX_NAME_LEN = 40;
const REST_SECONDS = [30, 60, 90, 120, 180] as const;
const GOAL_CARD_STYLES: GoalCardStyle[] = ['liquid', 'bubbles', 'mosaic', 'glow', 'ring', 'plates', 'liquidNumber'];
const SPLIT_IDS = SPLITS.map(s => s.id);
const WIDGET_KEYS = Object.keys(WIDGET_LABELS);

// ── Legal pages ───────────────────────────────────────────────────────────────
// The two published policies. They are static files in public/, generated from the
// repo's markdown by `npm run legal` — deliberately NOT app screens, so they stay
// readable when the app itself fails to mount, and so they keep a real URL that can
// be linked from a store listing. Both stores require the privacy policy to be
// reachable *inside* the app as well (Apple 5.1.1(i), Google Play's User Data
// policy, which also bars PDFs and geofenced URLs). Washington's My Health My Data
// Act adds a second, separate requirement: the consumer-health-data policy needs its
// own prominent link on the landing page, which for a single-page app is the
// signed-out LoginScreen — hence LegalLinks renders on every auth state, not just
// signup. See PRIVACY-POLICY-GUIDE.md for why each of those is worded that way.
const PRIVACY_URL     = '/privacy.html';
const CHD_PRIVACY_URL = '/consumer-health-data-privacy.html';
const TERMS_URL       = '/terms.html';
// Play requires account deletion to be startable from OUTSIDE the app too — a web
// page a user can reach without reinstalling — and that URL goes in the Data safety
// form. The in-app "Delete account" button satisfies Apple 5.1.1(v) but not this.
const DELETE_REQUEST_URL = '/delete-account.html';
// The FAQ is informational, not a contract — published by `npm run legal` like the
// policies, but it carries no draft/placeholder machinery and deliberately restates
// no fact gated by compliance/verified.json (it links the policy instead). It also
// serves as the store-listing "inquiry mechanism", so the contact address is on it.
const FAQ_URL = '/faq.html';
// The one address every privacy route terminates at. legal/PRIVACY.md § 13 and the
// two other published policies name it; keep them in step. It goes into the export
// so a file that outlives this app still tells its holder where to send a request.
const PRIVACY_CONTACT = 'smalkaisk@gmail.com';
// Stamped into the consent/acceptance records at signup so a later revision is
// distinguishable from the version the user actually agreed to. Bump POLICY_VERSION
// whenever a change would require re-consent (a new health-data category, purpose or
// recipient); bump TERMS_VERSION when the Terms change under legal/TERMS.md § 16.
// 1.1 (2026-08-05): legal/PRIVACY.md v1.1 discloses two things v1.0 did not — the
// authentication provider's sign-in security log (IP + email), which is the one record
// that SURVIVES account deletion, and a 90-day retention for it; plus Google as the
// recipient behind the contact address. A new recipient is a material change under
// § 12, so this bumps. It also fixes the failure that made the bump necessary: v1.0 was
// edited after publication while the header still read 1.0, so the stamp named a
// document whose text had moved. Version, effective date and this constant now change
// together — see § 12.
const POLICY_VERSION  = '1.1';
// 1.1 (2026-08-02): legal/TERMS.md v1.1 answers an external review — it defines the terms
// v1.0 left vague and states practices the app already has (device-clock dating, offline
// reconciliation, what survives deletion). §§ 8, 9, 12, 13 and 14 changed, which § 16.3
// makes material, so the acceptance record has to name the version the user actually read.
// 1.2 (2026-08-05): legal/TERMS.md v1.2 answers the v4 liability audit — § 2.2 defers to
// § 8.5 on data protection, § 12.7 grows from three survivors of a deletion to five (its
// old list closed "and nothing else", which support email and the sign-in log both made
// false), § 12.9 now describes the dormancy rule instead of denying one exists, § 13.1(a)
// drops the non-existent store listing, § 17.3/17.4 stop putting exclusive Latvian
// jurisdiction on consumers outside the EEA/UK, and § 19.8 lets the clauses that decide a
// post-deletion dispute survive. §§ 12, 13 and 17 changed, which § 16.3 makes material.
const TERMS_VERSION   = '1.2';
// The date the versions above take effect. A version bump alone must NOT lock anyone
// out: legal/TERMS.md § 16.2 promises at least 30 days' email notice before a change
// takes effect and § 16.3 promises the user may keep using the current version, and
// export their data, until that date. So the re-consent gate is scheduled, not
// immediate — it compares against this constant, and before it passes the app only
// shows a banner. **When you bump POLICY_VERSION or TERMS_VERSION, set this to at
// least 30 days ahead and send the § 16.2 notice.** Leaving it in the past turns the
// bump into an instant lockout, which is the thing this exists to prevent.
const POLICIES_EFFECTIVE_FROM = '2026-09-04';
// Minimum age. legal/TERMS.md § 4.1 sets this at 18 and § 4.3 commits to closing any
// account found to belong to someone younger — so 18 is the number the whole app must
// use. Do not lower it here without changing the Terms: they are the binding document.
const MIN_AGE = 18;

// ── Consent evidence (GDPR Art. 7(1)) ─────────────────────────────────────────
// Art. 7(1) puts the burden of DEMONSTRATING consent on the controller, and EDPB
// Guidelines 05/2020 ¶ 105-108 want the workflow and the text shown, not just a
// boolean. The signup call writes the record into auth user metadata because that
// exists before any settings row does and survives an abandoned onboarding — but
// metadata is writable by the user it belongs to, so it is a record, not evidence.
// `public.consents` (migration 0004) is the evidence half: append-only by
// construction (INSERT + SELECT policies, deliberately no UPDATE and no DELETE).
//
// These two helpers are module-scope and pure so the QA harness can exercise them.

// The rows the evidence table should hold for an account, derived from the metadata
// written at signup. A timestamp that isn't there yields no row — an account created
// before the metadata existed records nothing rather than inventing a date.
//
// The timestamp must also PARSE, and what gets stored is the normalised ISO form. Both
// halves of that matter, and neither is defensive tidiness: this metadata is writable by
// the user it describes (that is the whole reason the evidence table exists), the three
// rows go in as ONE insert, and Postgres rejects the whole statement if any value is not
// a timestamp. So `age_confirmed_at: 'lol'` used to stop the health-data and terms rows
// being filed too — letting a user unilaterally suppress the controller's Art. 7(1)
// evidence, which is precisely backwards. Normalising as well as validating keeps the
// insert to values Postgres is guaranteed to accept, rather than the wider set
// Date.parse happens to tolerate.
const consentRowsFor = (userId: string, meta: any): any[] => {
  const m = meta && typeof meta === 'object' ? meta : {};
  const rows: any[] = [];
  const add = (kind: string, at: any, version: any, document: string) => {
    if (typeof at !== 'string' || at.trim() === '') return;
    const t = Date.parse(at);
    if (!Number.isFinite(t)) return;
    rows.push({ user_id: userId, kind, version: typeof version === 'string' ? version : '', granted_at: new Date(t).toISOString(), document });
  };
  add('health_data', m.health_data_consent_at, m.health_data_consent_version, PRIVACY_URL);
  add('terms',       m.terms_accepted_at,      m.terms_version,               TERMS_URL);
  add('age',         m.age_confirmed_at,       '',                            TERMS_URL);
  return rows;
};

// Has the user agreed to the versions currently in force? legal/PRIVACY.md § 12 and
// legal/TERMS.md § 16.3 both promise affirmative acceptance BEFORE a material change
// takes effect, and EDPB ¶ 110 says consent does not survive a considerable change to
// the processing. Bumping POLICY_VERSION/TERMS_VERSION used to change nothing for an
// existing user — the stamp was written and never read. Now it raises the re-consent
// gate. An account with no record at all (missing metadata) also lands here, which is
// the right answer: no evidence of consent means ask again.
const needsReconsentFor = (meta: any): boolean => {
  const m = meta && typeof meta === 'object' ? meta : {};
  return m.health_data_consent_version !== POLICY_VERSION || m.terms_version !== TERMS_VERSION;
};

// …and is it due yet? Splitting "out of date" from "must act now" is what keeps the
// gate compatible with TERMS.md § 16.3's grace window: between a bump and its
// effective date the user is asked, not blocked. An unparseable or missing date is
// treated as NOT due — a typo in the constant must not lock the whole user base out,
// and the failure mode of asking late is smaller than the failure mode of asking at
// the wrong moment.
const reconsentDue = (now: number = Date.now(), from: string = POLICIES_EFFECTIVE_FROM): boolean => {
  const t = Date.parse(from);
  return Number.isFinite(t) && now >= t;
};

// ── Browser tab title ───────────────────────────────────────────────────────
// There's no router, so without this every screen shares the one <title> baked
// into index.html. `documentTitleFor` maps the active pre-render gate (or, past
// them, `currentScreen`) to a tab label; an effect in GymTrackerApp writes it on
// every change, and ErrorBoundary sets its own. Wording mirrors the published
// legal pages ("History — FitPulse"); the dashboard keeps index.html's base
// title rather than a redundant "Home —". Gates that are transient by nature
// (the auth loader, the hydrate loader) keep the base title rather than flash a
// label nobody reads — `settling` carries that.
const BASE_TITLE = 'FitPulse — Gym Tracker';
const SCREEN_TITLES: Record<string, string> = {
  home: BASE_TITLE,
  enterBodyWeight: 'Log body weight — FitPulse',
  workout: 'Workout — FitPulse',
  history: 'History — FitPulse',
  progress: 'Progress — FitPulse',
  settings: 'Settings — FitPulse',
};
const documentTitleFor = (g: {
  settling: boolean; configured: boolean; recovery: boolean; signedIn: boolean;
  onboarding: boolean; reconsent: boolean; screen: string;
}): string => {
  if (!g.configured) return 'Backend not configured — FitPulse';
  if (g.settling) return BASE_TITLE;
  if (g.recovery) return 'Set a new password — FitPulse';
  if (!g.signedIn) return 'Sign in — FitPulse';
  if (g.onboarding) return 'Welcome — FitPulse';
  if (g.reconsent) return 'Review updated policies — FitPulse';
  return pick(SCREEN_TITLES, g.screen) ?? BASE_TITLE;
};

const sanitizePrefs = (raw: any): Prefs => {
  const p = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    ...DEFAULT_PREFS,
    ...p,
    name:     typeof p.name === 'string' ? p.name.trim().slice(0, MAX_NAME_LEN) : '',
    gender:   oneOf<Gender>(p.gender, ['male', 'female', 'other', ''], ''),
    units:    oneOf<Units>(p.units, ['kg', 'lb'], 'kg'),
    // Only real widget keys — an unknown key would silently hide nothing, but an
    // array of objects would break the `.includes` reads that drive every screen.
    hidden:   Array.isArray(p.hidden) ? p.hidden.filter((k: any) => WIDGET_KEYS.includes(k)) : [],
    muscleMetric:  oneOf<MuscleMetric>(p.muscleMetric, ['sets', 'volume', 'sessions'], 'sets'),
    bwChart:       oneOf<'line' | 'bar'>(p.bwChart, ['line', 'bar'], 'line'),
    accent:        oneOf(p.accent, ACCENT_IDS, 'blue'),
    base:          oneOf(p.base, BASE_IDS, 'graphite'),
    semantics:     oneOf(p.semantics, SEM_IDS, 'plates'),
    restTimer:     typeof p.restTimer === 'boolean' ? p.restTimer : DEFAULT_PREFS.restTimer,
    restSeconds:   oneOf(p.restSeconds, REST_SECONDS as readonly number[], DEFAULT_PREFS.restSeconds),
    workoutTimer:  typeof p.workoutTimer === 'boolean' ? p.workoutTimer : DEFAULT_PREFS.workoutTimer,
    goalCardStyle: oneOf<GoalCardStyle>(p.goalCardStyle, GOAL_CARD_STYLES, 'liquid'),
    // '' is meaningful (not chosen yet → the home card shows the chooser), so it's
    // an allowed value rather than a fallback.
    split:         oneOf(p.split, ['', ...SPLIT_IDS], ''),
    dayNames:      safeDayNames(p.dayNames),
  };
};

// Resolve every customizable CSS token for a theme, from the user's choices. One
// place so the runtime effect and the pre-paint stamp stay in agreement.
const resolveThemeVars = (accent: string, base: string, semantics: string, theme: Theme): Record<string, string> => {
  const a = accentTone(accent, theme);
  const b = (pick(BASES, base) ?? BASES.graphite)[theme];
  const s = (pick(SEMANTICS, semantics) ?? SEMANTICS.plates)[theme];
  return { ...b.tokens, '--accent': a.accent, '--accent-ink': a.ink, '--good': s.good, '--warn': s.warn, '--crit': s.crit };
};

// Recharts reads hex, not CSS tokens — so charts get their neutrals from the base
// and their accent from the accent choice. series2 (bodyweight amber) is fixed; the
// muscle-focus donut derives its slice palette from the accent (see below).
const resolveChart = (prefs: { accent: string; base: string } | undefined, theme: Theme) => {
  const fixed = CHART[theme];
  if (!prefs) return fixed;
  const b = (pick(BASES, prefs.base) ?? BASES.graphite)[theme].chart;
  return { ...fixed, accent: accentTone(prefs.accent, theme).hex, surface: b.surface, line: b.line, grid: b.grid, axis: b.axis, muted: b.muted };
};

// ─── Accent-derived donut palette ───────────────────────────────────────────────
// The muscle-focus donut tints its slices from an analogous+shade fan around the
// chosen accent — a coordinated family of the accent, never the raw accent itself.
// Small self-contained HSL helpers (no colour library in the app). h in degrees,
// s/l in %.
// Falls back to the default blue rather than throwing on a malformed value: the hex
// it reads comes from the accent table, which is keyed by a stored pref — so a bad
// id used to reach here as undefined and take the whole dashboard down with it.
//
// DERIVED from the accent table, never written out. A hand-copied '#2E7BD6' here is a
// THIRD mirror of one colour (ACCENTS already carries it twice per tone — rgb triple
// for the CSS token, hex for the chart layer), and it is the one nothing would catch:
// retune blue's dark hex and the donut quietly keeps fanning its slices around the old
// one, only for users whose accent failed to resolve. `blue` is DEFAULT_PREFS.accent
// and sanitizePrefs' fallback, so this stays the colour an unresolved pref lands on.
const FALLBACK_HEX = ACCENTS.blue.dark.hex;
const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const src = typeof hex === 'string' && /^#?[0-9a-fA-F]{6}$/.test(hex.trim()) ? hex.trim() : FALLBACK_HEX;
  const m = src.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r)      h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else                h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
};

const hslToHex = (h: number, s: number, l: number): string => {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if      (h < 60)  { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
};

// Build `count` slice colours from the accent hex. Anchored on the accent's own HSL,
// so the fan inherits the theme-correct lightness zone (light accents are deep, dark
// accents lifted). Each slice steps hue OUTWARD within a bounded arc (never offset 0,
// so no slice equals the raw accent) and shifts lightness, so even near-hue slices
// separate by brightness — the part that keeps it readable under colour blindness.
const DONUT_HUE_OFFSETS  = [-14, 18, -34, 40, -54, 58, -74, 78];
const DONUT_LIGHT_DELTAS = [8, -8, 14, -14, 4, -4, 18, -18];
const muscleDonutPalette = (accentHex: string, theme: Theme, count: number): string[] => {
  const { h, s, l } = hexToHsl(accentHex);
  const sat  = Math.max(45, Math.min(85, s));       // floor so desaturated accents (Slate) stay distinguishable
  const loL  = theme === 'dark' ? 40 : 32;          // clamp band: not too dark on graphite…
  const hiL  = theme === 'dark' ? 72 : 62;          // …not too pale on white
  return Array.from({ length: count }, (_, i) => {
    const hue = h + DONUT_HUE_OFFSETS[i % DONUT_HUE_OFFSETS.length];
    const lig = Math.max(loL, Math.min(hiL, l + DONUT_LIGHT_DELTAS[i % DONUT_LIGHT_DELTAS.length]));
    return hslToHex(hue, sat, lig);
  });
};

// Sums reps × weight over an exercise's sets. Tolerates a missing/!array `sets` and
// non-numeric entries: this runs over every stored row on the dashboard, so one
// malformed exercise from an old cache must degrade to 0, not throw and blank the
// screen. `num` also stops a NaN/Infinity in the data propagating into the total —
// once the sum is NaN every volume readout on the page renders "NaN".
const num = (v: any) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const volumeOf = (exercise: any) =>
  Array.isArray(exercise?.sets)
    ? exercise.sets.reduce((sum: number, s: any) => sum + num(s?.reps) * num(s?.weight), 0)
    : 0;

// ─── Units ───────────────────────────────────────────────────────────────────
// Everything is stored in kg. These convert only at the display and input edges,
// so switching units never rewrites stored data. null weight = bodyweight and
// must stay null through every conversion (never become 0 lb).
const LB_PER_KG = 2.2046226218;
const KG_PER_LB = 0.45359237;

const toDisplayWeight = (kg: number | null, units: Units): number | null =>
  kg == null ? null : units === 'lb' ? kg * LB_PER_KG : kg;

// Parse a value the user typed in the current units and return kg to store.
// Blank stays null (the bodyweight-optional rule).
//
// This is the ONLY gate between the keyboard and the database, and it used to pass
// through whatever parseFloat produced. `<input type="number">` blocks letters but
// happily accepts "-50" and "1e39": a negative weight made session volume negative
// (which the donut then dropped from its slices while still counting it in the
// total, rendering percentages over 100), and 1e39 exceeds Postgres `real`, so the
// insert failed forever with no retry — a row stuck at "not synced" for good.
// Out-of-range now reads as "no value" rather than being stored.
const fromInputWeight = (val: string, units: Units): number | null => {
  if (typeof val !== 'string' || val.trim() === '') return null;
  const n = parseFloat(val);
  if (!Number.isFinite(n) || n < 0) return null;
  const kg = units === 'lb' ? n * KG_PER_LB : n;
  return kg > MAX_WEIGHT_KG ? null : kg;
};

// Reps typed into an input. Same contract: a whole number in range, else 0 (which
// every caller treats as "not a usable set").
const fromInputReps = (val: string): number => {
  const n = Math.trunc(parseFloat(val));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, MAX_REPS);
};

// A BODY weight, unlike a lift, is never null-as-bodyweight and never zero — 0 kg
// is a mistyped entry, not a data point, and it drags the chart to the floor. The
// import sanitiser already rejected `weight <= 0`; the live inputs did not.
const fromInputBodyWeight = (val: string, units: Units): number | null => {
  const kg = fromInputWeight(val, units);
  return kg != null && kg > 0 ? kg : null;
};

// Trim a display number to 1 dp, dropping a trailing .0. Non-finite input renders
// as "0" rather than the literal string "NaN"/"Infinity" — these are read mid-set at
// arm's length, and a garbled number is worse than a zero.
const trim1 = (n: number) => {
  if (!Number.isFinite(n)) return '0';
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

// A stored kg weight, formatted for display. null → "Bodyweight".
const fmtWeight = (kg: number | null, units: Units): string =>
  kg == null ? 'Bodyweight' : `${trim1(toDisplayWeight(kg, units) as number)} ${units}`;

// Total training volume (stored kg), in the display units.
//
// Every return value ends in " <unit>". That matters because the donut's centre
// readout strips a trailing unit with /(kg|lb)$/ and prints `units` beneath instead:
// the kg branch used to abbreviate to "2.5t", which that regex does NOT match, so a
// 2500 kg total rendered as "2.5t" sitting above the caption "kg" — two units, one
// of them wrong. (It was a label mismatch, not a 1000× error; the number itself was
// right.) Abbreviation thresholds stay per-unit — abbreviating lb at 1 000 would cost
// a digit on the very common 2 000-5 000 lb session, which reads fine in full.
const VOLUME_ABBREV_AT = { kg: 1000, lb: 100000 } as const;
const fmtVolume = (kg: number, units: Units = 'kg') => {
  const n = Number.isFinite(kg) ? kg : 0;
  const v = units === 'lb' ? n * LB_PER_KG : n;
  return Math.abs(v) >= VOLUME_ABBREV_AT[units]
    ? `${(v / 1000).toFixed(1)}k ${units}`
    : `${Math.round(v)} ${units}`;
};

// A session length in seconds, as a clock: M:SS, or H:MM:SS once it passes an hour.
const fmtDuration = (totalSeconds: number) => {
  const s = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
};

// The same length in words — clearer than a colon clock in history, where "47:12"
// next to a date reads like a time of day. e.g. "45s", "47 min", "1h 5m".
const fmtDurationWords = (totalSeconds: number) => {
  const s = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

// The donut's centre/tooltip/legend label for a metric value.
const metricValueLabel = (metric: MuscleMetric, value: number, units: Units): string =>
  metric === 'volume'   ? fmtVolume(value, units)
  : metric === 'sessions' ? `${value} session${value !== 1 ? 's' : ''}`
  : `${value} set${value !== 1 ? 's' : ''}`;

// Midnight (local) of a date, as epoch ms — the key for bucketing/comparing by
// calendar day. Local, not UTC: parsing an ISO date as UTC midnight would shove a
// late-evening session onto the day before.
const startOfDayMs = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// Whole calendar days between two local-midnight stamps.
//
// Dividing the ms difference by 86 400 000 is wrong twice a year: local midnights
// two calendar days apart are 49 h apart across a DST fall-back, giving 2.041 — so a
// streak with a tolerated two-day gap spanning the changeover measured as MORE than
// two days and was declared broken. Rounding restores the calendar-day count the
// comparison is actually about (the drift is only ±1 h, far from a 0.5-day error).
const daysBetween = (laterMs: number, earlierMs: number) =>
  Math.round((laterMs - earlierMs) / 86400000);

// ─── useTheme ──────────────────────────────────────────────────────────────────
// Light or dark, pinned to the user's choice. Defaults to the OS preference on
// first load (no stored side yet), then stays on whatever they pick.
type Theme = 'light' | 'dark';

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

// 'light'/'dark' pin a side, persisted in THEME_KEY. index.html stamps the saved
// side before paint; an absent/legacy value falls back to the OS preference here.
type ThemeMode = 'light' | 'dark';

const useTheme = () => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* ignore */ }
    return prefersDark() ? 'dark' : 'light';
  });

  const theme: Theme = mode;

  // Pin the resolved side on the root so the in-app choice governs the tokens.
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    try { localStorage.setItem(THEME_KEY, m); } catch { /* ignore */ }
  };

  // Header quick-toggle: flip to the opposite of whatever is showing.
  const toggle = () => setMode(theme === 'dark' ? 'light' : 'dark');

  return { theme, mode, setMode, toggle };
};

// ─── Toggle ────────────────────────────────────────────────────────────────────
// The pill switch with a sliding knob, used for every on/off setting. Two sizes:
// 'sm' for the in-workout timer bar, 'md' (default) for Settings rows. Pass an
// aria-label through — it's forwarded to the button.
const Toggle = ({ on, onClick, size = 'md', ...rest }: any) => {
  const track = size === 'sm' ? 'w-9 h-5' : 'w-10 h-6';
  const knob  = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <button
      type="button" role="switch" aria-checked={on} onClick={onClick} {...rest}
      className={`relative ${track} rounded-full transition-colors flex-shrink-0 ${on ? 'bg-accent' : 'bg-raised border border-line'}`}
    >
      <span className={`absolute top-0.5 ${knob} rounded-full bg-surface shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
};

// Shared across every WorkoutScreen mount — see primeAudio for why it isn't per-mount.
let sharedAudioCtx: any = null;

// ─── SetRow ────────────────────────────────────────────────────────────────────
// The scoreboard line. Weight is the number you look for, so it leads — unless
// there wasn't one, in which case reps are the whole story.
const SetRow = ({ index, set, isTop, onRemove, units = 'kg' }: any) => {
  const bodyweight = set.weight == null;

  return (
    <div className="flex items-center justify-between gap-3 bg-raised rounded-ctl px-3 py-2">
      <span className={`${label} text-faint`}>Set {index + 1}</span>
      <div className="flex items-baseline gap-1.5">
        {bodyweight ? (
          <span className="text-[11px] font-semibold text-faint mr-1">Bodyweight</span>
        ) : (
          <>
            <span className={`${readout} text-2xl ${isTop ? 'text-accent' : ''}`}>{trim1(toDisplayWeight(set.weight, units) as number)}</span>
            <span className="text-[11px] font-semibold text-muted">{units}</span>
            <span className="mx-1 text-faint">×</span>
          </>
        )}
        <span className={`${readout} text-2xl`}>{set.reps}</span>
        <span className="text-[11px] font-semibold text-muted">reps</span>
      </div>
      {onRemove ? (
        <button onClick={onRemove} aria-label={`Remove set ${index + 1}`} className="-m-1.5 p-1.5 text-faint hover:text-crit transition-colors">
          <X size={15} />
        </button>
      ) : <span className="w-[15px]" />}
    </div>
  );
};

// ─── ExerciseCard ──────────────────────────────────────────────────────────────
const ExerciseCard = ({ exercise, exerciseIndex, exerciseCount = 1, addSet, removeSet, removeExercise, moveExercise, updateExerciseNotes, last, units = 'kg' }: any) => {
  const [reps, setReps]     = useState('');
  const [weight, setWeight] = useState('');

  // Abs can be loaded or not, so weight is optional for them — reps alone is a
  // complete set.
  const weightOptional = BODYWEIGHT_OPTIONAL.has(exercise.name);

  // A typed value the parsers reject (negative, or past the storable ceiling) must be
  // REFUSED visibly, not silently dropped. fromInputWeight returns null for both
  // "blank" and "out of range", and null means bodyweight — so without this check,
  // typing -5 into the weight box logged a perfectly valid-looking Bodyweight set.
  const repsInvalid   = reps !== '' && fromInputReps(reps) <= 0;
  const weightInvalid = weight !== '' && fromInputWeight(weight, units) == null;
  const invalidMsg =
    repsInvalid   ? `Reps must be a whole number between 1 and ${MAX_REPS}.` :
    weightInvalid ? `Weight must be between 0 and ${trim1(toDisplayWeight(MAX_WEIGHT_KG, units) as number)} ${units}.` :
    null;

  const canAddSet = !!reps && !repsInvalid && !weightInvalid && (weightOptional || !!weight);

  const handleAddSet = () => {
    if (canAddSet) {
      addSet(exerciseIndex, reps, weight);
      setReps('');
      setWeight('');
    }
  };

  const noSets    = exercise.sets.length === 0;
  const topWeight = noSets ? null : Math.max(...exercise.sets.map((s: any) => s.weight ?? 0));
  const volume    = volumeOf(exercise);

  // What this lift did last time, as a target to beat. Long sessions get trimmed
  // rather than wrapping the card — the first few sets are the working ones.
  const LAST_SHOWN = 4;
  const lastLine = last?.sets?.length
    ? last.sets.slice(0, LAST_SHOWN)
        .map((s: any) => `${s.weight == null ? 'BW' : trim1(toDisplayWeight(s.weight, units) as number)} × ${s.reps}`)
        .join(' · ') + (last.sets.length > LAST_SHOWN ? ' …' : '')
    : null;

  return (
    <div className={`${card} ${noSets ? 'border-dashed' : ''} p-4`}>
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink truncate">{exercise.name}</h3>
          <p className="text-xs text-faint mt-0.5 tabular-nums">
            {noSets
              ? 'No sets yet'
              : `${exercise.sets.length} set${exercise.sets.length !== 1 ? 's' : ''}` +
                // Unloaded sets move nothing, so "0 kg moved" would be noise.
                (volume > 0 ? ` · ${fmtVolume(volume, units)} moved` : '')}
          </p>
          {lastLine && (
            <p className="text-xs text-muted mt-1 tabular-nums truncate">
              <span className="text-faint">Last</span> {lastLine}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0 -mr-1.5">
          {moveExercise && exerciseCount > 1 && (
            <>
              <button
                onClick={() => moveExercise(exerciseIndex, -1)}
                disabled={exerciseIndex === 0}
                aria-label={`Move ${exercise.name} up`}
                className="p-1.5 text-faint hover:text-ink disabled:opacity-30 disabled:hover:text-faint transition-colors"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => moveExercise(exerciseIndex, 1)}
                disabled={exerciseIndex === exerciseCount - 1}
                aria-label={`Move ${exercise.name} down`}
                className="p-1.5 text-faint hover:text-ink disabled:opacity-30 disabled:hover:text-faint transition-colors"
              >
                <ChevronDown size={16} />
              </button>
            </>
          )}
          <button
            onClick={() => removeExercise(exerciseIndex)}
            aria-label={`Remove ${exercise.name}`}
            className="p-1.5 text-faint hover:text-crit transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {!noSets && (
        <div className="flex flex-col gap-1.5 mb-3">
          {exercise.sets.map((set: any, si: number) => (
            <SetRow
              key={si}
              index={si}
              set={set}
              units={units}
              isTop={exercise.sets.length > 1 && set.weight != null && set.weight === topWeight}
              onRemove={() => removeSet(exerciseIndex, si)}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-7 gap-2 mb-3">
        <input
          type="number" inputMode="numeric" min="0" step="1" placeholder="Reps" aria-label="Reps"
          value={reps} onChange={e => setReps(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddSet()}
          className={`${input} col-span-2 text-center text-sm`}
        />
        <input
          type="number" inputMode="decimal" min="0" step="0.1"
          placeholder={weightOptional ? `${units} — optional` : units}
          aria-label={weightOptional ? `Weight in ${units} (optional — leave blank for bodyweight)` : `Weight in ${units}`}
          value={weight} onChange={e => setWeight(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddSet()}
          className={`${input} col-span-2 text-center text-sm`}
        />
        <button
          onClick={handleAddSet}
          disabled={!canAddSet}
          className={`${btnPrimary} col-span-3 text-sm py-2.5 disabled:bg-raised disabled:text-faint disabled:cursor-not-allowed disabled:brightness-100`}
        >
          Add Set
        </button>
      </div>

      {invalidMsg && <p role="alert" className="-mt-2 mb-3 text-[11px] text-crit">{invalidMsg}</p>}

      <textarea
        value={exercise.notes || ''}
        onChange={e => updateExerciseNotes(exerciseIndex, e.target.value)}
        placeholder="Notes (optional)"
        aria-label={`Notes for ${exercise.name}`}
        className={`${input} w-full text-sm min-h-16 resize-none`}
      />
    </div>
  );
};

// ─── ExercisePicker ────────────────────────────────────────────────────────────
// The searchable, muscle-grouped catalogue chooser used by the live WorkoutScreen.
// The one input does triple duty: it matches a muscle group ("chest" opens the whole
// Chest group), otherwise filters exercise names, and the + commits whatever was
// typed as a one-off. `onAdd(name)` is the only output. Groups come from ALL_GROUPS
// for a custom session, else the type's curated EXERCISES list. `closeOnAdd`
// collapses the panel after a pick — the in-workout UX.
const ExercisePicker = ({ workoutType, onAdd, closeOnAdd = true }: any) => {
  const [showExerciseList, setShowExerciseList]     = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [openGroup, setOpenGroup]                   = useState<string | null>(null);

  const availableGroups: ExerciseGroup[] = workoutType === 'custom' ? ALL_GROUPS : pick(EXERCISES, workoutType) ?? [];

  // Filtering keeps the grouping — empty groups drop out rather than leaving a bare heading.
  const query     = customExerciseName.trim().toLowerCase();
  const searching = query.length > 0;
  const visibleGroups: ExerciseGroup[] = (query
    ? availableGroups.map(g =>
        g.group.toLowerCase().includes(query)
          ? g
          : { ...g, items: g.items.filter(ex => ex.toLowerCase().includes(query)) })
    : availableGroups
  ).filter(g => g.items.length > 0);
  const matchCount = visibleGroups.reduce((n, g) => n + g.items.length, 0);

  const commit = (name: string) => {
    onAdd(name);
    setCustomExerciseName('');
    if (closeOnAdd) setShowExerciseList(false);
  };
  const handleAddCustomExercise = () => {
    const name = customExerciseName.trim();
    if (name) commit(name);
  };

  return (
    <>
      {showExerciseList && (
        <div className={`${card} mt-3 overflow-hidden`}>
          {/* Search is pinned — only the catalogue below it scrolls. */}
          <div className="flex gap-2 p-3">
            <input
              type="text"
              placeholder="Search exercise or muscle group…"
              aria-label="Search by exercise or muscle group, or type a new exercise name"
              value={customExerciseName}
              onChange={e => setCustomExerciseName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCustomExercise()}
              className={`${input} flex-1 py-2 text-sm`}
            />
            <button
              onClick={handleAddCustomExercise}
              disabled={!customExerciseName.trim()}
              aria-label="Add as a new exercise"
              className={`${btnPrimary} px-3 disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="h-px bg-line" />

          {/* One collapsed row per muscle group — open the one you want rather than
              scrolling past every exercise in the catalogue. A search expands the
              hits automatically, since you've already said what you're after. */}
          {matchCount > 0 ? (
            <div className="flex flex-col">
              {visibleGroups.map(g => {
                const open = searching || openGroup === g.group;
                return (
                  <div key={g.group} className="border-b border-line last:border-b-0">
                    <button
                      onClick={() => setOpenGroup(openGroup === g.group ? null : g.group)}
                      aria-expanded={open}
                      className="w-full flex items-center justify-between gap-3 px-3 py-3 hover:bg-raised/60 transition-colors"
                    >
                      <span className={label}>{g.group}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-faint tabular-nums">{g.items.length}</span>
                        <ChevronDown size={14} className={`text-faint transition-transform ${open ? 'rotate-180' : ''}`} />
                      </span>
                    </button>

                    {open && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 px-3 pb-3">
                        {g.items.map(ex => (
                          <button
                            key={ex}
                            onClick={() => commit(ex)}
                            className="text-left px-3 py-2.5 rounded-ctl text-sm text-ink hover:bg-raised transition-colors"
                          >
                            {ex}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-faint text-center px-4 py-6">
              Nothing matches “{customExerciseName.trim()}”. Hit + to add it as a new exercise.
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => setShowExerciseList(v => !v)}
        className={`${btnSecondary} w-full p-3.5 mt-3 flex items-center justify-center gap-2`}
      >
        <Plus size={18} className={showExerciseList ? 'rotate-45 transition-transform' : 'transition-transform'} />
        {showExerciseList ? 'Close' : 'Add Exercise'}
      </button>
    </>
  );
};

// ─── WorkoutScreen ─────────────────────────────────────────────────────────────
const WorkoutScreen = ({ workout, workoutType, addExercise, addSet, removeSet, removeExercise, moveExercise, updateExerciseNotes, finishWorkout, cancelWorkout, workoutNotes, setWorkoutNotes, patchWorkout, lastByExercise = {}, dayNames = {}, units = 'kg', restTimer = false, restSeconds = 90, workoutTimer = false }: any) => {
  const [showCancelConfirm, setShowCancelConfirm]   = useState(false);

  // Per-session timer state lives on the workout object, seeded from the saved
  // defaults but overridden only here — the in-workout toggles never write back to
  // Settings, and the choice persists/resumes with the session. Fall back to the
  // prop for sessions saved before these fields existed.
  const sessionOn = workout.workoutTimer ?? workoutTimer;
  const restOn    = workout.restTimer ?? restTimer;
  const patch     = (p: any) => patchWorkout && patchWorkout(p);
  const toggleSessionTimer = () => patch({ workoutTimer: !sessionOn });
  // Switching rest OFF must also stop any countdown already running. It used to only
  // flip the flag, so the interval kept going behind a UI that said "off" — with the
  // Pause/Skip controls hidden — and the phone vibrated and chimed 90s later with no
  // way to cancel it short of toggling rest back on.
  const toggleRestTimer = () => {
    if (restOn) skipRest();
    patch({ restTimer: !restOn });
  };

  // Session clock — counts up from the start, minus any paused time. Frozen while
  // paused (pausedAt set); derived from wall-clock each tick otherwise, so it stays
  // accurate through tab throttling. Pause bookkeeping lives on the workout too.
  const startMs        = new Date(workout.date).getTime();
  const pausedMs       = workout.pausedMs || 0;
  const sessionPaused  = workout.pausedAt != null;
  const computeElapsed = () => {
    const end = sessionPaused ? new Date(workout.pausedAt).getTime() : Date.now();
    return Math.max(0, Math.round((end - startMs - pausedMs) / 1000));
  };
  const [elapsed, setElapsed] = useState(computeElapsed);
  useEffect(() => {
    setElapsed(computeElapsed());
    if (!sessionOn || sessionPaused) return;
    const id = setInterval(() => setElapsed(computeElapsed()), 1000);
    return () => clearInterval(id);
  }, [sessionOn, sessionPaused, startMs, pausedMs, workout.pausedAt]);

  const pauseSession  = () => patch({ pausedAt: new Date().toISOString() });
  const resumeSession = () => patch({ pausedMs: pausedMs + (Date.now() - new Date(workout.pausedAt).getTime()), pausedAt: null });

  // Rest timer — a between-sets countdown. The one countdown interval in the app;
  // keep it session-level (not per card), and always clear the ref so it can't leak
  // or double up. `rest` is seconds remaining, null when idle; `restPaused` freezes
  // the count without discarding it (the interval is cleared while paused).
  const [rest, setRest]         = useState<number | null>(null);
  const [restPaused, setRestPaused] = useState(false);
  const [restDone, setRestDone]     = useState(false);   // brief flash when rest ends
  const restRef                 = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef                = useRef<any>(null);
  const clearRest = () => { if (restRef.current) { clearInterval(restRef.current); restRef.current = null; } };

  // Desktop has no vibrate, so the countdown ending was silent — add a short chime
  // via WebAudio and a visual flash. The context is created on the user gesture that
  // starts the rest (browsers block audio created cold).
  // One context per DOCUMENT, not per WorkoutScreen mount. Browsers cap how many a
  // page may create (~6); starting and discarding that many sessions in one page load
  // used to exhaust the cap, after which `new AC()` threw into the catch below and the
  // chime silently stopped working for the rest of the page's life. A module-level
  // context is created at most once and reused by every session.
  const primeAudio = () => {
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      if (!sharedAudioCtx) sharedAudioCtx = new AC();
      audioRef.current = sharedAudioCtx;
      if (sharedAudioCtx.state === 'suspended') sharedAudioCtx.resume();
    } catch { /* ignore */ }
  };
  const chime = () => {
    try {
      const ctx = audioRef.current;
      if (!ctx) return;
      const beep = (freq: number, at: number) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        osc.connect(gain); gain.connect(ctx.destination);
        const t = ctx.currentTime + at;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        osc.start(t); osc.stop(t + 0.24);
      };
      beep(880, 0); beep(1174, 0.12);   // two-tone "done"
    } catch { /* ignore */ }
  };
  const doneFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRestComplete = () => {
    setRestPaused(false);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200);
    chime();
    setRestDone(true);
    // Tracked in a ref so a rapid second rest can't have its green flash cancelled by
    // the previous rest's stale timeout, and so unmount clears it.
    if (doneFlashRef.current) clearTimeout(doneFlashRef.current);
    doneFlashRef.current = setTimeout(() => setRestDone(false), 1500);
  };

  // The countdown is DEADLINE-based, not decrement-based. It used to tick `r - 1`
  // once a second, so it only advanced while the tab was awake — background the app
  // or lock the phone (exactly what you do between sets) and the countdown froze,
  // then resumed from where it left off and never fired while it mattered. Desktop
  // Chrome throttles hidden tabs to one tick a minute for the same effect. Storing
  // the target time and deriving the remainder means wall-clock decides, and coming
  // back to a rest that expired while hidden completes it immediately.
  const restEndRef = useRef<number | null>(null);
  const tickRest = () => {
    const end = restEndRef.current;
    if (end == null) return;
    const left = Math.ceil((end - Date.now()) / 1000);
    if (left <= 0) { clearRest(); restEndRef.current = null; setRest(null); onRestComplete(); }
    else setRest(left);
  };
  // Reused by start and resume so paused time picks up cleanly.
  const runRest = (secs: number) => {
    clearRest();
    restEndRef.current = Date.now() + secs * 1000;
    setRest(Math.ceil(secs));
    restRef.current = setInterval(tickRest, 250);   // sub-second so the display lands on time
  };
  const startRest  = (secs: number = restSeconds) => { primeAudio(); setRestDone(false); setRestPaused(false); runRest(secs); };
  const pauseRest  = () => { clearRest(); setRestPaused(true); };
  const resumeRest = () => { primeAudio(); setRestPaused(false); runRest(rest ?? restSeconds); };
  const skipRest   = () => { clearRest(); restEndRef.current = null; setRestPaused(false); setRest(null); };
  const resetRest  = () => startRest();   // restart the countdown from the full duration
  const bumpRest   = (delta: number) => {
    setRest(r => {
      if (r == null) return r;
      const next = Math.max(0, r + delta);
      // Move the deadline too, or the next tick would immediately overwrite `rest`
      // with the un-bumped remainder.
      if (!restPaused) restEndRef.current = Date.now() + next * 1000;
      return next;
    });
  };
  // Re-derive the moment the tab comes back: a rest that ran out while hidden must
  // complete on return rather than silently continue from a stale number.
  useEffect(() => {
    const onVisible = () => { if (!document.hidden && restRef.current) tickRest(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });
  // Clear both timers on unmount (leaving the workout).
  useEffect(() => () => {
    clearRest();
    if (doneFlashRef.current) clearTimeout(doneFlashRef.current);
  }, []);

  // Logging a set auto-starts the countdown, but only if the setting is on. Manual
  // Start/Pause below stays available regardless, so you can rest off-schedule.
  const addSetAndRest = (...args: any[]) => { (addSet as any)(...args); if (restOn) startRest(); };

  const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const cfg                = { label: labelForType(workoutType, dayNames) };

  const totalVolume = workout.exercises.reduce((sum: number, ex: any) => sum + volumeOf(ex), 0);
  const totalSets   = workout.exercises.reduce((sum: number, ex: any) => sum + ex.sets.length, 0);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-36">

      {/* Session header — the running totals lead, the detail follows. */}
      <div className={`${card} p-4 mb-3`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className={label}>{cfg.label}</h2>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className={`${readout} text-4xl`}>{fmtVolume(totalVolume, units)}</span>
              <span className="text-xs font-semibold text-muted">moved</span>
            </div>
            {/* Session timer — total elapsed time. Toggle is a per-session override
                (never touches Settings); pause/resume freezes the count. */}
            <div className="flex items-center gap-2 mt-3">
              <Toggle
                size="sm"
                on={!!sessionOn}
                aria-label={`${sessionOn ? 'Stop' : 'Start'} session timer`}
                onClick={toggleSessionTimer}
              />
              <Timer size={13} className="text-muted" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Session</span>
              <span className="text-[10px] text-faint hidden sm:inline">total time</span>
              {sessionOn ? (
                <>
                  <span className={`font-display font-semibold tabular-nums text-sm ${sessionPaused ? 'text-muted' : 'text-ink'}`}>{fmtDuration(elapsed)}</span>
                  <button
                    onClick={sessionPaused ? resumeSession : pauseSession}
                    aria-label={sessionPaused ? 'Resume session timer' : 'Pause session timer'}
                    className="p-1 -m-1 text-muted hover:text-ink transition-colors"
                  >
                    {sessionPaused ? <Play size={14} /> : <Pause size={14} />}
                  </button>
                  {sessionPaused && <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">paused</span>}
                </>
              ) : (
                <span className="text-xs text-faint">off</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={label}>Body wt</p>
            {/* A skipped weigh-in is null — show a dash, not "Bodyweight" (which
                reads as a real reading and only makes sense for a set's load). */}
            <p className={`${readout} text-xl mt-1 ${workout.bodyWeight == null ? '' : 'text-accent'}`}>
              {workout.bodyWeight == null ? '—' : fmtWeight(workout.bodyWeight, units)}
            </p>
            <p className="text-xs text-faint mt-2 tabular-nums">{totalSets} set{totalSets !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {workout.exercises.map((exercise: any, i: number) => (
          <ExerciseCard
            key={exercise._uid ?? `${exerciseIdOf(exercise)}-${i}`}
            exercise={exercise}
            exerciseIndex={i}
            exerciseCount={workout.exercises.length}
            addSet={addSetAndRest}
            removeSet={removeSet}
            removeExercise={removeExercise}
            moveExercise={moveExercise}
            updateExerciseNotes={updateExerciseNotes}
            last={lastByExercise[exerciseIdOf(exercise)]}
            units={units}
          />
        ))}
      </div>

      {/* Exercise picker */}
      <ExercisePicker workoutType={workoutType} onAdd={addExercise} />

      <div className={`${card} p-4 mt-3`}>
        <label htmlFor="workout-notes" className={`${label} block mb-2`}>Session Notes</label>
        <textarea
          id="workout-notes"
          value={workoutNotes}
          onChange={e => setWorkoutNotes(e.target.value)}
          placeholder="How did it feel?"
          className={`${input} w-full min-h-24 resize-none`}
        />
      </div>

      {/* Sticky action bar — primary action sits in the thumb zone. The rest
          controls ride just above it whenever resting is enabled: a Start button
          while idle, and the running/paused countdown otherwise. */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line pb-safe z-40">
        {/* Rest timer — the between-sets countdown, toggled here too. Always shown so
            it can be switched on/off mid-workout without visiting Settings. */}
        <div className={`border-b border-line transition-colors ${restDone ? 'bg-good/15' : ''}`}>
          <div className="max-w-3xl mx-auto flex items-center gap-2.5 px-3 py-2">
            <Toggle
              size="sm"
              on={!!restOn}
              aria-label={`${restOn ? 'Disable' : 'Enable'} rest timer`}
              onClick={toggleRestTimer}
            />
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${restDone ? 'text-good' : restOn && rest != null && !restPaused ? 'text-accent' : 'text-muted'}`}>Rest</span>
            <span className="text-[10px] text-faint hidden sm:inline">between sets</span>
            {!restOn ? (
              <span className="text-xs text-faint">off</span>
            ) : rest != null ? (
              <span className={`${readout} text-lg tabular-nums ${restPaused ? 'text-muted' : 'text-accent'}`}>{fmtClock(rest)}</span>
            ) : restDone ? (
              <span className="text-xs font-semibold text-good">Rest done</span>
            ) : (
              <span className="text-xs text-faint">idle</span>
            )}
            {restOn && (
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                {rest == null ? (
                  <button onClick={() => startRest()} className={`${btnSecondary} px-3 py-1.5 text-xs flex items-center gap-1.5`}>
                    <Timer size={13} /> Start rest
                  </button>
                ) : (
                  <>
                    <button onClick={() => bumpRest(-15)} className={`${btnSecondary} px-3 py-1.5 text-xs`}>−15s</button>
                    <button onClick={() => bumpRest(15)} className={`${btnSecondary} px-3 py-1.5 text-xs`}>+15s</button>
                    <button onClick={restPaused ? resumeRest : pauseRest} className={`${btnSecondary} px-3 py-1.5 text-xs`}>{restPaused ? 'Resume' : 'Pause'}</button>
                    <button onClick={resetRest} className={`${btnSecondary} px-3 py-1.5 text-xs`}>Reset</button>
                    <button onClick={skipRest} className={`${btnSecondary} px-3 py-1.5 text-xs`}>Skip</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="max-w-3xl mx-auto flex gap-2 p-3">
          {showCancelConfirm ? (
            <>
              <button onClick={cancelWorkout} className={`${btnDanger} flex-1 p-3.5`}>
                Discard session
              </button>
              <button onClick={() => setShowCancelConfirm(false)} className={`${btnSecondary} flex-1 p-3.5`}>
                Keep going
              </button>
            </>
          ) : (
            <>
              <button
                onClick={finishWorkout}
                disabled={totalSets === 0}
                title={totalSets === 0 ? 'Log at least one set to finish' : undefined}
                className={`${btnPrimary} flex-1 p-3.5 disabled:bg-raised disabled:text-faint disabled:cursor-not-allowed disabled:brightness-100`}
              >
                Finish workout
              </button>
              <button onClick={() => setShowCancelConfirm(true)} className={`${btnSecondary} px-5 p-3.5`}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── HistoryScreen ─────────────────────────────────────────────────────────────
const HistoryScreen = ({ workouts, deleteWorkout, updateWorkout, units = 'kg', split = '', dayNames = {} }: any) => {
  // Row-scoped UI state holds the workout's uuid, never its position. `workouts`
  // is replaced out from under this screen — hydrate lands a few hundred ms after
  // the cache paints, and a session added or deleted on another device shifts
  // every index past it — so a stored index can come to name a different row,
  // and Save/Delete would then hit the wrong session. The uuid can't drift.
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [viewingNotes, setViewingNotes]       = useState<string | null>(null);
  const [editingWorkout, setEditingWorkout]   = useState<string | null>(null);
  const [editData, setEditData]               = useState<any>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [filterType, setFilterType]           = useState('all');
  const [search, setSearch]                   = useState('');
  const [addExerciseName, setAddExerciseName] = useState('');
  // List vs. calendar is a local view choice — both read the same `filtered`
  // data, so the tab bar and currentScreen stay untouched.
  const [viewMode, setViewMode]               = useState('list');
  const [selectedDay, setSelectedDay]         = useState<number | null>(null);
  const [calMonth, setCalMonth]               = useState(() => {
    const newest = workouts.reduce((acc: number, w: any) => Math.max(acc, new Date(w.date).getTime()), 0);
    const base = newest ? new Date(newest) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // Every day type of every split lives in TYPE_CONFIG, which would make this an
  // eleven-item list of mostly-empty options. Offer only what's useful: the types
  // actually logged, plus the current split's days (so a fresh split still filters).
  const filterTypes = useMemo(() => {
    const wanted = new Set<string>([
      ...workouts.map((w: any) => w.type),
      ...daysOfSplit(split).map(d => d.name),
    ]);
    return Object.keys(TYPE_CONFIG).filter(t => wanted.has(t));
  }, [workouts, split]);

  // Display order is newest-first. Sort a copy — every row carries its own uuid,
  // so nothing downstream needs to know where it sat in the stored array.
  const sortedWorkouts = [...workouts]
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Both filter controls can go out from under an applied filter: the bar hides
  // below the threshold, and the type list is derived from what's logged, so
  // deleting the last 'push' session orphans a `filterType` of 'push'. Either way
  // History would keep filtering — a short or empty list, with the select snapped
  // back to "All types" (a value with no option) or no control on screen at all.
  // So the filter is read through what's currently *reachable*, not raw state.
  const showFilters  = sortedWorkouts.length > 3;
  const activeType   = showFilters && filterTypes.includes(filterType) ? filterType : 'all';
  const activeSearch = showFilters ? search : '';

  // …and state follows, so a type that comes back later (import, restore) can't
  // silently re-apply a filter the user long since stopped seeing.
  useEffect(() => {
    if (filterType !== 'all' && !filterTypes.includes(filterType)) setFilterType('all');
  }, [filterTypes, filterType]);

  // Type + text filter. Search matches the type label, any exercise name, or notes.
  const q = activeSearch.trim().toLowerCase();
  const filtered = sortedWorkouts.filter((w: any) => {
    if (activeType !== 'all' && w.type !== activeType) return false;
    if (!q) return true;
    return labelForType(w.type, dayNames).toLowerCase().includes(q)
      // `ex.name` is guarded too: an exercise logged without one (legacy/corrupt row)
      // would throw here on every keystroke and take History down with it.
      || exercisesOf(w).some((ex: any) => typeof ex?.name === 'string' && ex.name.toLowerCase().includes(q))
      || (w.notes ?? '').toLowerCase().includes(q);
  });

  const toggleWorkout = (id: string) => {
    setExpandedWorkout(expandedWorkout === id ? null : id);
    setViewingNotes(null);
    setEditingWorkout(null);
    setConfirmingDelete(null);
  };

  const startEditing = (id: string, w: any) => {
    setEditingWorkout(id);
    setEditData(JSON.parse(JSON.stringify(w)));
  };

  const cancelEditing = () => { setEditingWorkout(null); setEditData(null); };

  // Rows are keyed by uuid, so edits/deletes route straight through — no lookup
  // by position, which would be wrong the moment the array is re-sorted, filtered
  // down to one calendar day, or replaced by a hydrate mid-edit.
  const saveEditing = (id: string) => {
    const cleaned = normalizeEditedSets(editData);
    // finishWorkout refuses to log a session with no sets; an edit must not be able
    // to create one either. Deleting the last set is a request to delete the session.
    if (cleaned.exercises.length === 0) { setConfirmingDelete(id); return; }
    updateWorkout(id, cleaned);
    setEditingWorkout(null);
    setEditData(null);
  };

  const confirmDelete = (id: string) => {
    deleteWorkout(id);
    setExpandedWorkout(null);
    setEditingWorkout(null);
    setConfirmingDelete(null);
    setViewingNotes(null);   // else the next row opened inherits an open notes panel
  };

  const updateSetValue = (exIdx: number, setIdx: number, field: string, val: string) => {
    const u = { ...editData };
    // Weight is typed in display units and stored in kg (blank → bodyweight/null),
    // through the same range-checked parser as the live session, so a History edit
    // can't introduce a negative or overflowing value the logger would reject.
    //
    // Reps keep the RAW string while the field is being edited. Coercing a cleared
    // field straight to 0 meant selecting "12" and deleting it re-rendered the input
    // as "0", so typing "8" gave "08" — you could never simply retype a number. The
    // empty string is normalised away on save (see normalizeEditedSets); nothing that
    // reads reps in the meantime treats '' as a number.
    //
    // Weight keeps the raw string for the same reason, and for a sharper one: a
    // rejected weight comes back as `null`, and null MEANS BODYWEIGHT. Storing it
    // straight would silently convert a loaded set into a bodyweight set — the field
    // would blank, the placeholder would flip to "BW", and Save would persist that.
    // Out-of-range input is held as typed and refused on save instead (see
    // editInvalid / normalizeEditedSets).
    u.exercises[exIdx].sets[setIdx][field] =
      val === '' ? (field === 'weight' ? null : '')
      : field === 'weight' ? (fromInputWeight(val, units) == null ? val : fromInputWeight(val, units))
      : fromInputReps(val);
    setEditData(u);
  };

  // Any set value the parsers can't accept, held as a raw string by updateSetValue.
  // Save is blocked while one exists, so nothing out-of-range can be persisted and
  // nothing is silently reinterpreted.
  const editInvalid = editData
    ? typeof editData.bodyWeight === 'string' ||
      exercisesOf(editData).some((ex: any) =>
        (Array.isArray(ex.sets) ? ex.sets : []).some((s: any) =>
          (typeof s.weight === 'string' && s.weight !== '') ||
          (typeof s.reps === 'string' && s.reps !== '' && fromInputReps(s.reps) <= 0)))
    : false;

  // Reps may hold an in-progress '' (above); a set that still has no real reps when
  // the edit is saved is dropped, and an exercise left with no sets goes with it —
  // the same shape finishWorkout enforces for a new session.
  const normalizeEditedSets = (w: any) => ({
    ...w,
    exercises: exercisesOf(w)
      .map((ex: any) => ({
        ...ex,
        sets: (Array.isArray(ex.sets) ? ex.sets : [])
          .map((s: any) => ({
            ...s,
            reps: typeof s.reps === 'number' ? s.reps : fromInputReps(String(s.reps ?? '')),
            // A string here is a value the parser refused; drop back to bodyweight
            // rather than storing the raw text. Save is blocked while any exists, so
            // this is only a belt-and-braces normalisation.
            weight: typeof s.weight === 'number' || s.weight == null ? s.weight : fromInputWeight(String(s.weight), units),
          }))
          .filter((s: any) => s.reps > 0),
      }))
      .filter((ex: any) => ex.sets.length > 0),
  });

  const addSetToEdit = (exIdx: number) => {
    const u = { ...editData };
    u.exercises[exIdx].sets = [...u.exercises[exIdx].sets, { reps: 0, weight: null }];
    setEditData(u);
  };

  const addExerciseToEdit = () => {
    const name = addExerciseName.trim();
    if (!name) return;
    setEditData({ ...editData, exercises: [...editData.exercises, { name, exerciseId: idForName(name), sets: [], notes: '' }] });
    setAddExerciseName('');
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const editInput = 'bg-raised border border-line rounded-ctl px-2 py-1.5 text-ink text-center text-sm tabular-nums focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors';

  // ── Calendar view: bucket the (already filtered, newest-first) sessions by
  // local calendar day. The key is midday-safe local time — parsing the ISO
  // date as UTC midnight would shove late-evening sessions onto the day before.
  const dayKeyOf = (iso: string) => startOfDayMs(new Date(iso));
  const daysMap = new Map<number, any[]>();
  filtered.forEach((w: any) => {
    const k = dayKeyOf(w.date);
    if (!daysMap.has(k)) daysMap.set(k, []);
    daysMap.get(k)!.push(w);
  });

  const calYear     = calMonth.getFullYear();
  const calMon      = calMonth.getMonth();
  const firstDow    = new Date(calYear, calMon, 1).getDay();
  const daysInMonth = new Date(calYear, calMon + 1, 0).getDate();
  const monthLabel  = calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const now         = new Date();
  const todayKey    = startOfDayMs(now);
  const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const shiftMonth = (delta: number) => { setCalMonth(new Date(calYear, calMon + delta, 1)); setSelectedDay(null); };

  // Until the user taps a day, the detail defaults to the month's latest
  // session; navigating months clears the manual pick (via shiftMonth).
  const monthDayKeys = [...daysMap.keys()].filter(k => {
    const d = new Date(k); return d.getFullYear() === calYear && d.getMonth() === calMon;
  });
  const newestMonthDay = monthDayKeys.length ? Math.max(...monthDayKeys) : null;
  // A picked day can empty out under the user — delete its last session, or filter
  // it away — and holding it then reads as "No sessions this month" while the rest
  // of the month sits in the grid. Fall back to the default pick when that happens.
  const activeDay = selectedDay != null && daysMap.has(selectedDay) ? selectedDay : newestMonthDay;
  const activeDayWorkouts = activeDay != null ? (daysMap.get(activeDay) ?? []) : [];
  const activeDayLabel = activeDay != null
    ? new Date(activeDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  // The row list draws from the whole filtered set in list mode, or just the
  // selected day in calendar mode — same rows, keyed by uuid either way.
  const rowsToShow = viewMode === 'list' ? filtered : activeDayWorkouts;

  return (
    // pb-24 clears the fixed bottom tab bar; without it the last session row (and
    // its expanded editor) sat permanently behind the bar, unreachable by scrolling.
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-24">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-ink">History</h2>
        {sortedWorkouts.length > 0 && (
          <Segmented
            value={viewMode}
            onChange={(v: string) => { setViewMode(v); setExpandedWorkout(null); }}
            options={[{ value: 'list', label: 'List' }, { value: 'calendar', label: 'Calendar' }]}
          />
        )}
      </div>

      {/* Filter + search — feeds both views; hidden until there's enough history. */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-3">
          <select
            value={activeType} onChange={e => { setFilterType(e.target.value); setExpandedWorkout(null); }}
            aria-label="Filter by session type"
            className={`${input} py-2 text-sm`}
          >
            <option value="all">All types</option>
            {filterTypes.map(t => <option key={t} value={t}>{labelForType(t, dayNames)}</option>)}
          </select>
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setExpandedWorkout(null); }}
            placeholder="Search exercise or notes…"
            aria-label="Search sessions"
            className={`${input} flex-1 min-w-[140px] py-2 text-sm`}
          />
        </div>
      )}

      {sortedWorkouts.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <p className="text-muted text-sm">No sessions logged yet.</p>
        </div>
      ) : (
        <>
          {viewMode === 'calendar' && (
            <div className={`${card} p-3 sm:p-4 mb-4`}>
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className={`${btnSecondary} w-8 h-8 grid place-items-center`}>
                  <ChevronLeft size={16} />
                </button>
                <span className="font-display text-lg font-bold uppercase tracking-wide text-ink">{monthLabel}</span>
                <button onClick={() => shiftMonth(1)} aria-label="Next month" className={`${btnSecondary} w-8 h-8 grid place-items-center`}>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekdayLabels.map((d, i) => (
                  <div key={i} className="text-center font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDow }).map((_, i) => <div key={`pad-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayKey = new Date(calYear, calMon, day).getTime();
                  const dayWorkouts = daysMap.get(dayKey) ?? [];
                  const has = dayWorkouts.length > 0;
                  const isToday = dayKey === todayKey;
                  const isSel = dayKey === activeDay;
                  const dots = Math.min(dayWorkouts.length, 3);
                  const cellCls = [
                    'aspect-square rounded-ctl flex flex-col items-center justify-center transition-colors',
                    isSel ? 'bg-accent/10 ring-1 ring-accent' : has ? 'bg-raised' : '',
                    !isSel && isToday ? 'ring-1 ring-accent/40' : '',
                    has ? 'hover:ring-1 hover:ring-accent cursor-pointer' : '',
                  ].join(' ');
                  const inner = (
                    <>
                      <span className={`text-sm tabular-nums ${has ? 'text-ink font-semibold' : 'text-faint'}`}>{day}</span>
                      <span className="flex items-center justify-center gap-0.5 h-2 mt-0.5">
                        {Array.from({ length: dots }).map((_, di) => (
                          <span key={di} className="w-1.5 h-1.5 rounded-full bg-accent" />
                        ))}
                        {dayWorkouts.length > 3 && (
                          <span className="text-[9px] text-accent font-semibold leading-none">+{dayWorkouts.length - 3}</span>
                        )}
                      </span>
                    </>
                  );
                  return has ? (
                    <button
                      key={dayKey}
                      onClick={() => { setSelectedDay(dayKey); setExpandedWorkout(null); }}
                      aria-label={`${dayWorkouts.length} session${dayWorkouts.length !== 1 ? 's' : ''} on ${new Date(dayKey).toLocaleDateString()}`}
                      className={cellCls}
                    >
                      {inner}
                    </button>
                  ) : (
                    <div key={dayKey} className={cellCls}>{inner}</div>
                  );
                })}
              </div>
            </div>
          )}

          {rowsToShow.length === 0 ? (
            <div className={`${card} p-12 text-center`}>
              <p className="text-muted text-sm">
                {viewMode === 'calendar' ? 'No sessions this month.' : 'No sessions match that filter.'}
              </p>
            </div>
          ) : (
        <div className="flex flex-col gap-2">
          {viewMode === 'calendar' && activeDay != null && (
            <h3 className={`${label} mb-1`}>{activeDayLabel}</h3>
          )}
          {rowsToShow.map((workout: any) => {
            // Key by the row uuid, not list position — the same row renders in the
            // list and the calendar day-detail, and every expand/edit/delete keyed
            // below routes to the right stored workout regardless of subset, sort
            // order, or a hydrate replacing the array while a row is open.
            const rowId          = workout.id;
            const isEditing      = editingWorkout === rowId;
            const displayWorkout = isEditing ? editData : workout;
            const typeCfg        = { label: labelForType(workout.type, dayNames) };
            const isOpen         = expandedWorkout === rowId;
            const exerciseList   = exercisesOf(workout);
            const sessionVolume  = exerciseList.reduce((s: number, ex: any) => s + volumeOf(ex), 0);

            return (
              <div key={rowId} className={`${card} overflow-hidden`}>
                <button
                  onClick={() => toggleWorkout(rowId)}
                  aria-expanded={isOpen}
                  className="w-full p-4 text-left hover:bg-raised/60 transition-colors"
                >
                  <div className="flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-ink truncate">{typeCfg.label}</h3>
                      <p className="text-xs text-faint mt-0.5 flex items-center gap-1.5">
                        <span>{formatDate(workout.date)}</span>
                        {workout.duration != null && (
                          <span className="flex items-center gap-1 tabular-nums" title="Workout duration">
                            <Timer size={11} /> {fmtDurationWords(workout.duration)}
                          </span>
                        )}
                        {workout._sync === 'error' && (
                          <span className="flex items-center gap-1 text-warn" title="Saved on this device only — not synced to the server yet">
                            <CloudOff size={11} /> Not synced
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className={`${readout} text-lg text-accent`}>{fmtVolume(sessionVolume, units)}</p>
                        <p className="text-xs text-faint mt-0.5 tabular-nums">
                          {exerciseList.length} exercise{exerciseList.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ChevronRight size={16} className={`text-faint transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-line">
                    <div className="p-3 border-b border-line flex gap-2 flex-wrap items-center">
                      {confirmingDelete === rowId ? (
                        <>
                          <span className="text-sm text-ink">Delete this session?</span>
                          <div className="ml-auto flex gap-2">
                            <button onClick={e => { e.stopPropagation(); confirmDelete(rowId); }} className={`${btnDanger} flex items-center gap-2 px-3 py-1.5 text-sm`}>
                              <Trash2 size={13} /> Delete
                            </button>
                            <button onClick={e => { e.stopPropagation(); setConfirmingDelete(null); }} className={`${btnSecondary} px-3 py-1.5 text-sm`}>
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : !isEditing ? (
                        <button
                          onClick={e => { e.stopPropagation(); startEditing(rowId, workout); }}
                          className={`${btnSecondary} flex items-center gap-2 px-3 py-1.5 text-sm`}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={e => { e.stopPropagation(); saveEditing(rowId); }}
                            disabled={editInvalid}
                            title={editInvalid ? 'Some values are out of range' : undefined}
                            className={`${btnPrimary} flex items-center gap-2 px-3 py-1.5 text-sm disabled:bg-raised disabled:text-faint disabled:cursor-not-allowed disabled:brightness-100`}
                          >
                            <Save size={13} /> Save
                          </button>
                          <button onClick={e => { e.stopPropagation(); cancelEditing(); }} className={`${btnSecondary} flex items-center gap-2 px-3 py-1.5 text-sm`}>
                            <X size={13} /> Cancel
                          </button>
                          <button onClick={e => { e.stopPropagation(); setConfirmingDelete(rowId); }} className={`${btnDanger} flex items-center gap-2 px-3 py-1.5 text-sm ml-auto`}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </>
                      )}
                    </div>

                    {isEditing && (
                      <div className="p-4 border-b border-line">
                        <label htmlFor={`bw-${rowId}`} className={`${label} block mb-2`}>Body weight ({units})</label>
                        {/* Held as a raw string when the parser refuses it. Clearing the
                            field legitimately means "no weigh-in" and DELETES the paired
                            row on save — so an out-of-range value must not resolve to the
                            same null, or a typo would silently delete a weigh-in. */}
                        <input
                          id={`bw-${rowId}`}
                          type="number" min="0" step="0.1" inputMode="decimal"
                          value={typeof editData.bodyWeight === 'string'
                            ? editData.bodyWeight
                            : editData.bodyWeight == null ? '' : trim1(toDisplayWeight(editData.bodyWeight, units) as number)}
                          onChange={e => {
                            const raw = e.target.value;
                            const kg = raw === '' ? null : fromInputBodyWeight(raw, units);
                            setEditData({ ...editData, bodyWeight: raw !== '' && kg == null ? raw : kg });
                          }}
                          className={`${input} w-full ${typeof editData.bodyWeight === 'string' ? 'border-crit' : ''}`}
                        />
                        {typeof editData.bodyWeight === 'string' && (
                          <p role="alert" className="mt-1 text-[11px] text-crit">
                            Enter a body weight between 0 and {trim1(toDisplayWeight(MAX_WEIGHT_KG, units) as number)} {units}, or clear the field to remove the weigh-in.
                          </p>
                        )}
                      </div>
                    )}

                    {isEditing ? (
                      <div className="p-4 border-b border-line">
                        <label className={`${label} block mb-2`}>Session notes</label>
                        <textarea
                          value={editData.notes || ''}
                          onChange={e => setEditData({ ...editData, notes: e.target.value })}
                          placeholder="How did it feel?"
                          className={`${input} w-full min-h-20 resize-none text-sm`}
                        />
                      </div>
                    ) : displayWorkout.notes ? (
                      <div className="p-4 border-b border-line">
                        <button
                          onClick={() => setViewingNotes(viewingNotes === rowId ? null : rowId)}
                          className="flex items-center gap-2 text-muted hover:text-ink text-sm font-medium transition-colors"
                        >
                          <FileText size={14} className="text-accent" />
                          {viewingNotes === rowId ? 'Hide notes' : 'View notes'}
                          <ChevronDown size={13} className={`transition-transform ${viewingNotes === rowId ? 'rotate-180' : ''}`} />
                        </button>
                        {viewingNotes === rowId && (
                          <p className="mt-3 text-sm text-muted bg-raised rounded-ctl p-3">{displayWorkout.notes}</p>
                        )}
                      </div>
                    ) : null}

                    <div className="p-4 flex flex-col gap-5">
                      {exercisesOf(displayWorkout).map((exercise: any, exIdx: number) => {
                        // A bodyweight set is null, not 0 — coalesce so Math.max
                        // isn't skewed and the top-set highlight tracks real load.
                        const topWeight = exercise.sets.length
                          ? Math.max(...exercise.sets.map((s: any) => s.weight ?? 0))
                          : null;

                        return (
                          <div key={exIdx}>
                            <div className="flex justify-between items-center gap-3 mb-2">
                              <h4 className="font-semibold text-ink text-sm truncate">{exercise.name}</h4>
                              {isEditing ? (
                                <button
                                  onClick={() => {
                                    const u = { ...editData };
                                    u.exercises.splice(exIdx, 1);
                                    setEditData(u);
                                  }}
                                  aria-label={`Remove ${exercise.name}`}
                                  className="text-faint hover:text-crit transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              ) : (
                                <span className="text-xs text-faint tabular-nums flex-shrink-0">{fmtVolume(volumeOf(exercise), units)}</span>
                              )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                              {exercise.sets.map((set: any, si: number) => (
                                isEditing ? (
                                  <div key={si} className="flex justify-between items-center gap-2 bg-raised rounded-ctl px-3 py-2">
                                    <span className={`${label} text-faint`}>Set {si + 1}</span>
                                    <div className="flex gap-2 items-center">
                                      <input type="number" inputMode="numeric" min="0" step="1" aria-label="Reps" value={set.reps} onChange={e => updateSetValue(exIdx, si, 'reps', e.target.value)} className={`${editInput} w-14 ${typeof set.reps === 'string' && set.reps !== '' && fromInputReps(set.reps) <= 0 ? 'border-crit' : ''}`} />
                                      <span className="text-faint text-sm">×</span>
                                      {/* '' keeps this controlled when the set is bodyweight; value shows display units. */}
                                      <input type="number" inputMode="decimal" min="0" step="0.1" aria-label="Weight (blank for bodyweight)" placeholder="BW" value={typeof set.weight === 'string' ? set.weight : set.weight == null ? '' : trim1(toDisplayWeight(set.weight, units) as number)} onChange={e => updateSetValue(exIdx, si, 'weight', e.target.value)} className={`${editInput} w-16 ${typeof set.weight === 'string' && set.weight !== '' ? 'border-crit' : ''}`} />
                                      <span className="text-muted text-xs font-semibold">{units}</span>
                                      <button
                                        onClick={() => { const u = { ...editData }; u.exercises[exIdx].sets.splice(si, 1); setEditData(u); }}
                                        aria-label={`Remove set ${si + 1}`}
                                        className="ml-1 -m-1 p-1.5 text-faint hover:text-crit transition-colors"
                                      >
                                        <X size={13} />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <SetRow
                                    key={si}
                                    index={si}
                                    set={set}
                                    units={units}
                                    isTop={exercise.sets.length > 1 && set.weight === topWeight}
                                  />
                                )
                              ))}
                            </div>

                            {isEditing && (
                              <button
                                onClick={() => addSetToEdit(exIdx)}
                                className={`${btnSecondary} mt-2 w-full py-1.5 text-xs flex items-center justify-center gap-1.5`}
                              >
                                <Plus size={13} /> Add set
                              </button>
                            )}

                            {isEditing ? (
                              <textarea
                                value={exercise.notes || ''}
                                onChange={e => { const u = { ...editData }; u.exercises[exIdx].notes = e.target.value; setEditData(u); }}
                                placeholder="Exercise notes (optional)"
                                className={`${input} w-full text-sm min-h-16 resize-none mt-2`}
                              />
                            ) : exercise.notes ? (
                              <p className="text-xs text-faint mt-2 pl-1">{exercise.notes}</p>
                            ) : null}

                            {exIdx < exercisesOf(displayWorkout).length - 1 && (
                              <div className="h-px bg-line mt-4" />
                            )}
                          </div>
                        );
                      })}

                      {/* Add a forgotten exercise back into a logged session. Free-text,
                          like the workout picker's one-off — any name is valid. */}
                      {isEditing && (
                        <div className="flex gap-2 pt-1 border-t border-line">
                          <input
                            type="text" value={addExerciseName}
                            onChange={e => setAddExerciseName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addExerciseToEdit()}
                            placeholder="Add an exercise…"
                            aria-label="Add an exercise to this session"
                            className={`${input} flex-1 py-2 text-sm`}
                          />
                          <button
                            onClick={addExerciseToEdit}
                            disabled={!addExerciseName.trim()}
                            aria-label="Add exercise"
                            className={`${btnPrimary} px-3 disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── MuscleGroupDonut ────────────────────────────────────────────────────────────
// Shows where a lifter's sets go, as a share donut. Used on both the Progress tab
// (full, honouring its timeframe) and Home (compact, all-time) — the caller
// date-filters `workouts` and picks the size. The ring answers "what's my split"
// at a glance; the legend beside it carries the exact numbers, since you can't
// read a count off a slice. `theme` selects the CHART palette, like the charts.
const MuscleGroupDonut = ({ workouts, theme, prefs, metric = 'sets', units = 'kg', size = 220, sliceLimit = 6, emptyMessage = 'No sets logged yet.' }: any) => {
  const c    = resolveChart(prefs, theme);
  const data = muscleGroupBreakdown(workouts, metric);

  if (data.length === 0) {
    // "No sets logged" is a lie when sets EXIST but every one of them was loadless
    // (planks, cardio) and the metric is volume — which zeroes them, so the breakdown
    // comes back empty. The caption that explains this lives further down and was
    // unreachable in exactly the case where it was needed.
    const hasLoadlessSets = metric === 'volume' && muscleGroupBreakdown(workouts, 'sets').length > 0;
    return (
      <p className="text-xs text-faint text-center py-6">
        {hasLoadlessSets
          ? 'Sets were logged, but none carried external load — nothing to measure by volume. Switch the metric to Sets to see them.'
          : emptyMessage}
      </p>
    );
  }

  // A ring of a dozen 2%-slivers is unreadable, so the top real groups keep their
  // own colour and everything past the budget — plus any free-text "Other" — folds
  // into one neutral arc. Folding only kicks in when it compresses ≥2 groups: a lone
  // leftover keeps its own colour rather than hiding behind an unlabelled catch-all.
  // `total` is the denominator for the slice percentages, so it must stay the sum of
  // the slice values for every metric.
  const total      = data.reduce((n, d) => n + d.value, 0);
  // …but the CENTRE readout is a headline count, and for 'sessions' the sum is not
  // one: that metric tallies each workout once PER MUSCLE GROUP it touched, so three
  // full-body sessions across three groups summed to nine and the hole read
  // "9 sessions". The real answer is how many workouts are represented in the ring —
  // counted from the same rows the slices were built from, NOT `workouts.length`,
  // which also counts rows that contributed no group at all (no exercises, or nothing
  // attributable) and would put a headline above the chart that the chart can't
  // account for.
  const centreTotal = metric === 'sessions'
    ? workouts.filter((w: any) => exercisesOf(w).some((ex: any) => groupForExercise(ex))).length
    : total;
  const realGroups = data.filter(d => d.group !== OTHER_GROUP);
  const otherReal  = data.find(d => d.group === OTHER_GROUP);
  const leftover   = [...realGroups.slice(sliceLimit), ...(otherReal ? [otherReal] : [])];
  const foldedVal  = leftover.reduce((n, d) => n + d.value, 0);
  const slices     = leftover.length >= 2
    ? [...realGroups.slice(0, sliceLimit),
       { group: OTHER_GROUP, value: foldedVal, pct: total ? (foldedVal / total) * 100 : 0, count: leftover.length }]
    : data;

  // The catch-all recedes to the muted neutral; real groups take an accent-derived
  // fan (analogous hue + shade) in slice order. The legend renders these same slices,
  // in the same order, so a group's ring colour and its legend dot can never drift
  // apart — and the folded arc is always spelled out in the legend rather than left
  // as a mystery wedge.
  const realCount = slices.filter(d => d.group !== OTHER_GROUP).length;
  const palette   = muscleDonutPalette(c.accent, theme, Math.max(realCount, 1));
  const colorAt = (group: string, i: number) =>
    group === OTHER_GROUP ? c.muted : palette[i % palette.length];

  // Volume zeroes bodyweight/cardio (no external load moved), so those groups drop
  // off the ring entirely. Count how many vanished against the set tally so the
  // absence can be captioned rather than silently misread as "not trained".
  const hiddenByVolume = metric === 'volume'
    ? muscleGroupBreakdown(workouts, 'sets').length - data.length
    : 0;

  // Past four rows a single column runs long and leaves the donut's right side
  // empty, so split into two filled top-to-bottom (ranks down the first column,
  // then the rest down the second) rather than row-wise.
  const twoCols   = slices.length > 4;
  const legendCss = twoCols
    ? { gridTemplateRows: `repeat(${Math.ceil(slices.length / 2)}, minmax(0, 1fr))`, gridAutoFlow: 'column' as const, gridAutoColumns: 'minmax(0, 1fr)' }
    : undefined;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <ChartArea h={size}>
            <Chart
              kind="donut"
              slices={slices}
              fills={slices.map((d, i) => colorAt(d.group, i))}
              surface={c.surface} line={c.line} muted={c.muted}
              formatter={(v: any, _n: any, p: any) => [`${metricValueLabel(metric, v, units)} · ${Math.round(p.payload.pct)}%`, p.payload.count > 1 ? `Other · ${p.payload.count} groups` : p.payload.group]}
            />
          </ChartArea>
          {/* Centre readout — the metric total in the hole. Overlay so it needs no
              chart colour; pointer-events-none keeps slice hovers alive underneath. */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* fmtVolume always ends in the unit now (it used to return "2.5t" for the
                kg branch, which this strip missed — so 2500 kg rendered as "2.5" over
                a "kg" caption, wrong by 1000×). The abbreviation marker stays. */}
            <span className={`${readout} text-2xl`}>{metric === 'volume' ? fmtVolume(centreTotal, units).replace(/ (kg|lb)$/, '') : centreTotal}</span>
            {/* For 'sessions' the centre counts workouts while the slices divide up
                group-tallies, so the two are different quantities. Say which one the
                headline is, rather than leaving "3" over slices reading 33% each. */}
            <span className={`${label} text-[10px] mt-0.5`}>{metric === 'volume' ? units : metric === 'sessions' ? 'sessions total' : metric}</span>
          </div>
        </div>

        {/* Legend mirrors the ring slice-for-slice: same order, same colours, and
            the folded arc spelled out as "Other · N groups" so no wedge is unlabelled. */}
        <ul className="w-full grid gap-x-4 gap-y-1.5" style={legendCss}>
          {slices.map((d, i) => {
            const folded = d.group === OTHER_GROUP && (d as any).count > 1;
            return (
              <li key={d.group} className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-chip flex-shrink-0" style={{ background: colorAt(d.group, i) }} />
                <span className="text-ink truncate">{folded ? `Other · ${(d as any).count} groups` : d.group}</span>
                <span className="ml-auto tabular-nums text-muted flex-shrink-0">
                  {metric === 'volume' ? fmtVolume(d.value, units) : d.value}<span className="text-faint"> · {Math.round(d.pct)}%</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Volume drops loadless work; say so, so an empty-looking ring isn't misread. */}
      {hiddenByVolume > 0 && (
        <p className="mt-3 text-[11px] text-faint text-center sm:text-left">
          {hiddenByVolume} {hiddenByVolume === 1 ? 'group' : 'groups'} with no logged load (bodyweight, cardio) aren’t counted by volume.
        </p>
      )}
    </div>
  );
};

// ─── BodyWeightTrend ─────────────────────────────────────────────────────────────
// The body-weight chart, as a line or bars per the user's choice. Shared by the
// Home sparkline (compact) and the Progress card. `data` arrives already in display
// units, so this only draws. The series follows the user's chosen accent (like the
// Progress exercise line), so body weight reads in the app's colour everywhere.
const BodyWeightTrend = ({ data, theme, prefs, chartType = 'line', units = 'kg', height = 220, compact = false }: any) => {
  const c = resolveChart(prefs, theme);
  return (
    <ChartArea h={height}>
      <Chart
        kind="bodyweight"
        data={data} chartType={chartType} units={units} height={height} compact={compact}
        accent={c.accent} grid={c.grid} axis={c.axis} surface={c.surface} line={c.line} muted={c.muted}
      />
    </ChartArea>
  );
};

// ─── ProgressScreen ────────────────────────────────────────────────────────────
// Sentinel the exercise select uses for the "every exercise" aggregate view.
// Double underscore keeps it clear of any real exercise name.
const ALL_EXERCISES = '__all__';

const ProgressScreen = ({ workouts, bodyWeightLog, theme, prefs }: any) => {
  const { units = 'kg', muscleMetric = 'sets', bwChart = 'line', hidden = [] } = prefs ?? {};
  const accent = resolveChart(prefs, theme).accent;
  const [timeframe, setTimeframe]               = useState('30days');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [customStartDate, setCustomStartDate]   = useState('');
  const [customEndDate, setCustomEndDate]       = useState('');

  const c = resolveChart(prefs, theme);

  // Exercises used in history, identified by stable id so a display-name rename
  // doesn't split one exercise into two entries. Labelled with the current catalogue
  // name when known, else the most recent name it was logged under.
  const exerciseOptions = (() => {
    const lastName: Record<string, string> = bareMap();
    for (const w of workouts) for (const e of exercisesOf(w)) lastName[exerciseIdOf(e)] = e.name;
    return Object.keys(lastName)
      .map(id => ({ id, label: pick(EXERCISE_NAME_BY_ID, id) ?? pick(lastName, id) ?? id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  })();
  const labelForId = (id: string) => exerciseOptions.find(o => o.id === id)?.label ?? id;

  const filterByDate = <T extends { date: string }>(items: T[]): T[] => {
    const now = new Date();
    if (timeframe === 'custom') {
      if (!customStartDate || !customEndDate) return [];
      // Parse as LOCAL day boundaries and make the end inclusive of its whole day —
      // otherwise `new Date('2026-07-16')` is UTC midnight and drops that day's own
      // afternoon sessions.
      const [sy, sm, sd] = customStartDate.split('-').map(Number);
      const [ey, em, ed] = customEndDate.split('-').map(Number);
      const s = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      const e = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      if (s > e) return [];   // backwards range → nothing (the UI flags why)
      return items.filter(i => { const d = new Date(i.date); return d >= s && d <= e; });
    }
    if (timeframe === 'all') return items;
    const start = new Date(now);
    if (timeframe === '30days')  start.setDate(now.getDate() - 30);
    if (timeframe === '3months') {
      // setMonth alone overflows on a long month: on 31 May it asks for "31 Feb" and
      // Date rolls that forward to 3 Mar, quietly clipping the first days of the
      // window. Pin to day 1 first, subtract the months, then clamp the day to one
      // that exists in the target month.
      const day = now.getDate();
      start.setDate(1);
      start.setMonth(now.getMonth() - 3);
      const lastOfTarget = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      start.setDate(Math.min(day, lastOfTarget));
    }
    // Unparseable dates compare as NaN (always false), so they'd vanish from every
    // window including "all" — filter them explicitly instead of by accident.
    return items.filter(i => {
      const t = new Date(i.date).getTime();
      return Number.isFinite(t) && t >= start.getTime();
    });
  };

  // The workouts inside the selected window, computed once per (data, timeframe)
  // change. Every per-exercise series and the muscle breakdown read this instead
  // of re-filtering the whole history each — the All-exercises view would
  // otherwise re-scan `workouts` once per exercise (O(exercises × workouts)).
  const windowedWorkouts = useMemo(
    () => filterByDate(workouts),
    [workouts, timeframe, customStartDate, customEndDate],
  );

  // The exercise select carries this sentinel when the user wants every
  // exercise at once. It can't collide with a real name (double underscore).
  // The All-exercises view then renders the same top-set chart per exercise.
  const isAllExercises = selectedExercise === ALL_EXERCISES;

  // Top-set series (max weight per session, in display units) for one exercise,
  // keyed by stable id — the data behind a single chart. Reused for the single- and
  // all-exercise views. Reads the pre-filtered window, not the full history.
  const seriesForExercise = (id: string) =>
    windowedWorkouts.flatMap((w: any) => {
      const ex = exercisesOf(w).find((e: any) => exerciseIdOf(e) === id);
      if (!ex || !Array.isArray(ex.sets) || ex.sets.length === 0) return [];
      // A session in which EVERY set was bodyweight has no top weight to plot.
      // Coercing null to 0 drew a line pinned at zero with tooltips reading
      // "0 kg × 30 reps" — a chart asserting data that was never recorded. Such a
      // session contributes no point; an exercise that is always bodyweight
      // therefore yields an empty series, and the caller renders the empty state.
      const loaded = ex.sets.filter((s: any) => s.weight != null);
      if (loaded.length === 0) return [];
      const maxWeight    = Math.max(...loaded.map((s: any) => s.weight));
      const maxWeightSet = loaded.find((s: any) => s.weight === maxWeight);
      return [{
        date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        maxWeight: Math.round((toDisplayWeight(maxWeight, units) as number) * 10) / 10,
        repsAtMaxWeight: maxWeightSet?.reps ?? 0,
      }];
    });

  // Every logged exercise's series, bucketed by muscle group in the donut's order
  // so the All-exercises view echoes the Muscle group balance card above it.
  const getExercisesByGroup = () => {
    const inWindow: any[] = windowedWorkouts;
    const lastName: Record<string, string> = bareMap();
    for (const w of inWindow) for (const e of exercisesOf(w)) lastName[exerciseIdOf(e)] = e.name;
    const order = muscleGroupBreakdown(inWindow, muscleMetric).map(d => d.group);
    const rank  = (g: string) => { const i = order.indexOf(g); return i === -1 ? order.length : i; };
    const groups: Record<string, { id: string; name: string; data: any[] }[]> = bareMap();
    for (const id of Object.keys(lastName)) {
      const data = seriesForExercise(id);
      if (data.length === 0) continue;
      const g    = pick(MUSCLE_BY_ID, id) ?? pick(MUSCLE_BY_NAME, pick(lastName, id)) ?? OTHER_GROUP;
      const name = pick(EXERCISE_NAME_BY_ID, id) ?? pick(lastName, id) ?? id;
      (groups[g] ?? (groups[g] = [])).push({ id, name, data });
    }
    return Object.entries(groups)
      .map(([group, items]) => ({ group, items: items.sort((a, b) => a.name.localeCompare(b.name)) }))
      .sort((a, b) => rank(a.group) - rank(b.group));
  };

  // Sorted before mapping: the stored log is in INSERTION order, so a back-dated
  // weigh-in (editing an old session's body weight) landed at the end of the array
  // and the line doubled back across the X axis instead of reading left-to-right.
  const getBodyWeightData = () =>
    [...filterByDate(bodyWeightLog)]
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((e: any) => ({
        date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        bodyWeight: Math.round((toDisplayWeight(e.weight, units) as number) * 10) / 10,
      }));

  // Chart datasets, memoised on their real inputs so an unrelated re-render
  // (theme or colour-pref change) doesn't recompute the series.
  const exerciseData     = useMemo(
    () => (!selectedExercise || isAllExercises ? [] : seriesForExercise(selectedExercise)),
    [windowedWorkouts, selectedExercise, isAllExercises, units],
  );
  const exercisesByGroup = useMemo(
    () => (isAllExercises ? getExercisesByGroup() : []),
    [windowedWorkouts, isAllExercises, units, muscleMetric],
  );
  const bodyWeightData   = useMemo(
    () => getBodyWeightData(),
    [bodyWeightLog, timeframe, customStartDate, customEndDate, units],
  );

  // One exercise's top-set chart card. Shared so the single-exercise view and
  // every card in the All-exercises view are visually identical.
  const topSetCard = (name: string, data: any[]) => (
    <div key={name} className={`${card} p-4 mb-3`}>
      <h3 className={`${label} mb-4`}>{name} — top set</h3>
      {data.length === 0 ? (
        // Every set in range was bodyweight, so there is no load to trend. Say so
        // rather than drawing a flat line at zero.
        <p className="py-8 text-center text-xs text-faint">
          Logged as bodyweight — no external load to chart.
        </p>
      ) : (
        <ChartArea h={220}>
          <Chart
            kind="topset"
            data={data} units={units}
            accent={accent} grid={c.grid} axisStroke={c.axis} surface={c.surface} line={c.line} muted={c.muted}
          />
        </ChartArea>
      )}
    </div>
  );

  return (
    // pb-24 clears the fixed bottom tab bar. Without it the last card on the screen
    // (the body-weight chart, and its X-axis labels) sat permanently behind the bar
    // with no way to scroll it into view.
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-24">
      <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-ink mb-4">Progress</h2>

      <div className={`${card} p-4 mb-3`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="timeframe" className={`${label} block mb-2`}>Timeframe</label>
            <select id="timeframe" value={timeframe} onChange={e => setTimeframe(e.target.value)} className={`${input} w-full`}>
              <option value="30days">Last 30 days</option>
              <option value="3months">Last 3 months</option>
              <option value="all">All time</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          <div>
            <label htmlFor="exercise" className={`${label} block mb-2`}>Exercise</label>
            <select id="exercise" value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} className={`${input} w-full`}>
              <option value="">Choose an exercise…</option>
              {exerciseOptions.length > 0 && <option value={ALL_EXERCISES}>All exercises</option>}
              {exerciseOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        </div>
        {timeframe === 'custom' && (
          <div className="mt-3 pt-3 border-t border-line">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="start" className={`${label} block mb-2`}>Start</label>
                <input id="start" type="date" value={customStartDate} max={customEndDate || undefined} onChange={e => setCustomStartDate(e.target.value)} className={`${input} w-full text-sm`} />
              </div>
              <div>
                <label htmlFor="end" className={`${label} block mb-2`}>End</label>
                <input id="end" type="date" value={customEndDate} min={customStartDate || undefined} onChange={e => setCustomEndDate(e.target.value)} className={`${input} w-full text-sm`} />
              </div>
            </div>
            {customStartDate && customEndDate && new Date(customStartDate) > new Date(customEndDate) && (
              <p className="text-xs text-warn mt-2">Start date is after the end date — nothing to show. Swap them to see results.</p>
            )}
          </div>
        )}
      </div>

      {/* Where the sets went — the tab's overview, so it sits above the per-exercise
          detail. filterByDate makes it honour the timeframe selector for free. */}
      {workouts.length > 0 && !hidden.includes('prog.muscle') && (
        <div className={`${card} p-4 mb-3`}>
          <h3 className={`${label} mb-4`}>Muscle group balance</h3>
          <MuscleGroupDonut
            workouts={windowedWorkouts}
            theme={theme}
            prefs={prefs}
            metric={muscleMetric}
            units={units}
            size={230}
            sliceLimit={5}
            emptyMessage="No sets logged in this timeframe."
          />
        </div>
      )}

      {/* All exercises — the same top-set chart as the single view, one per
          exercise, grouped under muscle-group headings (donut order). */}
      {!hidden.includes('prog.exercise') && isAllExercises && exercisesByGroup.length > 0 &&
        exercisesByGroup.map(g => (
          <div key={g.group} className="mb-3">
            <h3 className={`${label} mb-2 px-1`}>{g.group}</h3>
            {g.items.map(it => topSetCard(it.name, it.data))}
          </div>
        ))}

      {!hidden.includes('prog.exercise') && isAllExercises && exercisesByGroup.length === 0 && (
        <div className={`${card} p-8 mb-3 text-center`}>
          <p className="text-muted text-sm">No sets logged in this timeframe.</p>
        </div>
      )}

      {!hidden.includes('prog.exercise') && !isAllExercises && selectedExercise && exerciseData.length > 0 &&
        topSetCard(labelForId(selectedExercise), exerciseData)}

      {!hidden.includes('prog.exercise') && !isAllExercises && selectedExercise && exerciseData.length === 0 && (
        <div className={`${card} p-8 mb-3 text-center`}>
          <p className="text-muted text-sm">No <span className="text-ink font-medium">{labelForId(selectedExercise)}</span> logged in this timeframe.</p>
        </div>
      )}

      {!hidden.includes('prog.bodyweight') && bodyWeightData.length > 0 && (
        <div className={`${card} p-4`}>
          <h3 className={`${label} mb-4`}>Body weight</h3>
          <BodyWeightTrend data={bodyWeightData} theme={theme} prefs={prefs} chartType={bwChart} units={units} />
        </div>
      )}

      {workouts.length === 0 && (
        <div className={`${card} p-12 text-center`}>
          <p className="text-muted text-sm">Log a session to see progress.</p>
        </div>
      )}
    </div>
  );
};

// ─── Settings ──────────────────────────────────────────────────────────────────
// A small segmented pill for the either/or choices, styled through tokens.
const Segmented = ({ value, onChange, options }: any) => (
  <div className="inline-flex bg-raised border border-line rounded-ctl p-0.5 gap-0.5">
    {options.map((o: any) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        aria-pressed={value === o.value}
        className={`px-3 py-1.5 rounded-chip text-sm font-semibold transition-colors ${value === o.value ? 'bg-accent text-accent-ink' : 'text-muted hover:text-ink'}`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const SettingsScreen = ({ prefs, updatePrefs, toggleHidden, theme, themeMode = 'dark', setThemeMode, onExport, onImport, onClearData, onSignOut, onChangePassword, onChangeEmail, onDeleteAccount, userEmail, consentAt, consentVersion, termsAt, termsVersion, onDone }: any) => {
  const dashKeys = ['dash.stats', 'dash.muscle', 'dash.bodyweight', 'dash.log'];
  const progKeys = ['prog.muscle', 'prog.bodyweight', 'prog.exercise'];
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearBusy, setClearBusy]             = useState(false);
  const [clearMsg, setClearMsg]               = useState<string | null>(null);
  const [importMsg, setImportMsg]             = useState<string | null>(null);
  const [exportMsg, setExportMsg]             = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Change-password, inline in the Account card (the same inline-confirm pattern the
  // destructive Data actions use, not a sub-screen — auth isn't part of the router).
  const [pwOpen, setPwOpen]         = useState(false);
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [pwBusy, setPwBusy]         = useState(false);
  const [pwMsg, setPwMsg]           = useState<{ ok: boolean; text: string } | null>(null);

  const closePw = () => { setPwOpen(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setShowPw(false); setPwMsg(null); };

  const savePassword = async () => {
    if (pwBusy) return;
    if (!currentPw)                  { setPwMsg({ ok: false, text: 'Enter your current password.' }); return; }
    if (newPw.length < MIN_PASSWORD) { setPwMsg({ ok: false, text: `Password must be at least ${MIN_PASSWORD} characters.` }); return; }
    if (newPw !== confirmPw)         { setPwMsg({ ok: false, text: "Passwords don't match." }); return; }
    setPwBusy(true); setPwMsg(null);
    const err = await onChangePassword(currentPw, newPw);
    setPwBusy(false);
    if (err) { setPwMsg({ ok: false, text: err }); return; }
    setCurrentPw(''); setNewPw(''); setConfirmPw(''); setShowPw(false);
    setPwMsg({ ok: true, text: 'Password updated.' });
    setPwOpen(false);
  };

  // Change email. GDPR Art. 16 is the right to have inaccurate personal data
  // rectified, and the email address is personal data the user could not correct —
  // `updateUser` was wired for passwords only. It is also the identifier every notice
  // is sent to: TERMS.md § 5.1 obliges the user to keep it current and § 19.5 deems a
  // notice received 24 hours after it is sent, so an address they cannot change is a
  // duty they cannot discharge. The provider sends a confirmation link to BOTH the old
  // and the new address, so the change only lands once the new mailbox is proven —
  // which is why the success copy says "check your inbox", not "done".
  const [emailOpen, setEmailOpen]   = useState(false);
  const [newEmail, setNewEmail]     = useState('');
  const [emailPw, setEmailPw]       = useState('');
  const [showEmailPw, setShowEmailPw] = useState(false);
  const [emailBusy, setEmailBusy]   = useState(false);
  const [emailMsg, setEmailMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  const closeEmail = () => { setEmailOpen(false); setNewEmail(''); setEmailPw(''); setShowEmailPw(false); setEmailMsg(null); };

  const saveEmail = async () => {
    if (emailBusy) return;
    const addr = newEmail.trim();
    if (!addr)                 { setEmailMsg({ ok: false, text: 'Enter your new email address.' }); return; }
    if (addr === userEmail)    { setEmailMsg({ ok: false, text: 'That is already your email address.' }); return; }
    if (!emailPw)              { setEmailMsg({ ok: false, text: 'Enter your current password to confirm.' }); return; }
    setEmailBusy(true); setEmailMsg(null);
    const err = await onChangeEmail(emailPw, addr);
    setEmailBusy(false);
    if (err) { setEmailMsg({ ok: false, text: err }); return; }
    setNewEmail(''); setEmailPw(''); setShowEmailPw(false);
    setEmailMsg({ ok: true, text: 'Check both inboxes — we sent a confirmation link to your old and new address. The change takes effect once you confirm.' });
  };

  // Delete account — a two-step confirm because it's irreversible (wipes the
  // login itself, not just the data). On success the app signs out, so this
  // screen unmounts and we only ever return here on failure.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteBusy, setDeleteBusy]             = useState(false);
  const [deleteMsg, setDeleteMsg]               = useState<string | null>(null);
  // Deleting the account is the single most destructive action the app offers, and it
  // used to need nothing but two clicks — while merely CHANGING the password correctly
  // required the current one. Anyone with a borrowed unlocked phone could wipe the
  // account irreversibly. Same bar as the password change now.
  const [deletePw, setDeletePw]                 = useState('');

  const deleteAccount = async () => {
    if (deleteBusy || !deletePw) return;
    setDeleteBusy(true); setDeleteMsg(null);
    const err = await onDeleteAccount(deletePw);
    if (err) { setDeleteBusy(false); setDeleteMsg(err); setDeletePw(''); }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';   // let the same file be picked again later
    if (!file || !onImport) return;
    onImport(file).then((ok: boolean) => setImportMsg(ok ? 'Backup restored.' : 'That file could not be read.'));
  };

  // A show/hide toggle: checked = the widget is shown (i.e. not in `hidden`).
  const widgetRow = (k: string) => {
    const shown = !prefs.hidden.includes(k);
    return (
      <div key={k} className="flex items-center justify-between gap-3 py-2">
        <span className="text-sm text-ink">{WIDGET_LABELS[k]}</span>
        <Toggle
          on={shown}
          aria-label={`${shown ? 'Hide' : 'Show'} ${WIDGET_LABELS[k]}`}
          onClick={() => toggleHidden(k)}
        />
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-24 flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <button onClick={onDone} className="p-2 -ml-2 rounded-ctl text-muted hover:text-ink transition-colors" aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-ink">Settings</h2>
      </div>

      {/* Appearance */}
      <div className={`${card} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-ink">Theme</span>
          <Segmented value={themeMode} onChange={(v: ThemeMode) => setThemeMode && setThemeMode(v)}
            options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        </div>

        <div className="h-px bg-line my-4" />
        <h3 className={`${label} mb-3`}>Accent colour</h3>
        <div className="flex flex-wrap gap-2.5">
          {ACCENT_IDS.map(id => {
            const on = prefs.accent === id;
            return (
              <button
                key={id}
                onClick={() => updatePrefs({ accent: id })}
                aria-pressed={on}
                aria-label={ACCENTS[id].label}
                title={ACCENTS[id].label}
                className={`w-9 h-9 rounded-full transition-transform ${on ? 'ring-2 ring-offset-2 ring-offset-surface ring-ink scale-105' : 'hover:scale-105'}`}
                style={{ background: accentTone(id, theme).hex }}
              />
            );
          })}
        </div>

        <div className="h-px bg-line my-4" />
        <h3 className={`${label} mb-3`}>Background</h3>
        <div className="flex flex-wrap gap-2">
          {BASE_IDS.map(id => {
            const on = prefs.base === id;
            const b = BASES[id][theme];
            return (
              <button
                key={id}
                onClick={() => updatePrefs({ base: id })}
                aria-pressed={on}
                className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-ctl border transition-colors ${on ? 'border-accent' : 'border-line hover:bg-raised'}`}
              >
                {/* A little surface/ink chip previews the palette. */}
                <span className="w-5 h-5 rounded-chip border border-line grid place-items-center" style={{ background: `rgb(${b.tokens['--surface']})` }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: `rgb(${b.tokens['--ink']})` }} />
                </span>
                <span className="text-sm text-ink">{BASES[id].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Units */}
      <div className={`${card} p-4`}>
        <h3 className={`${label} mb-3`}>Units</h3>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-ink">Weight unit</span>
          <Segmented value={prefs.units} onChange={(v: Units) => updatePrefs({ units: v })}
            options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} />
        </div>
        <p className="text-xs text-faint mt-2">Changes the display only — your workouts stay stored in kilograms.</p>
      </div>

      {/* Training split — the same choice the home card makes; five options is one
          too many for Segmented, so it's a select. */}
      <div className={`${card} p-4`}>
        <h3 className={`${label} mb-3`}>Training</h3>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-ink">Split</span>
          <select
            value={prefs.split || 'ppl'}
            onChange={e => updatePrefs({ split: e.target.value })}
            aria-label="Training split"
            className={`${input} py-2 text-sm`}
          >
            {SPLITS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <p className="text-xs text-faint mt-2">Sets which sessions the home screen offers. Past workouts keep their own type.</p>
      </div>

      {/* Display */}
      <div className={`${card} p-4`}>
        <h3 className={`${label} mb-3`}>Display</h3>
        <div className="flex flex-wrap items-center justify-between gap-2 py-1">
          <span className="text-sm text-ink">Most-trained metric</span>
          <Segmented value={prefs.muscleMetric} onChange={(v: MuscleMetric) => updatePrefs({ muscleMetric: v })}
            options={[{ value: 'sets', label: 'Sets' }, { value: 'volume', label: 'Volume' }, { value: 'sessions', label: 'Sessions' }]} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 py-1">
          <span className="text-sm text-ink">Body-weight chart</span>
          <Segmented value={prefs.bwChart} onChange={(v: 'line' | 'bar') => updatePrefs({ bwChart: v })}
            options={[{ value: 'line', label: 'Line' }, { value: 'bar', label: 'Bar' }]} />
        </div>
        <div className="py-1">
          <span className="text-sm text-ink">Weekly-goal tile</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              { value: 'liquid',       label: 'Liquid' },
              { value: 'bubbles',      label: 'Bubbles' },
              { value: 'mosaic',       label: 'Mosaic' },
              { value: 'glow',         label: 'Glow' },
              { value: 'ring',         label: 'Ring' },
              { value: 'plates',       label: 'Plates' },
              { value: 'liquidNumber', label: 'Digits' },
            ].map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => updatePrefs({ goalCardStyle: o.value as GoalCardStyle })}
                aria-pressed={prefs.goalCardStyle === o.value}
                className={`px-3 py-1.5 rounded-ctl border text-sm font-semibold transition-colors ${prefs.goalCardStyle === o.value ? 'bg-accent border-accent text-accent-ink' : 'bg-raised border-line text-muted hover:text-ink'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        {prefs.muscleMetric === 'volume' && (
          <p className="text-xs text-faint mt-2">Volume is reps × weight, so bodyweight and cardio work counts as zero.</p>
        )}
      </div>

      {/* Workout */}
      <div className={`${card} p-4`}>
        <h3 className={`${label} mb-3`}>Workout</h3>
        <div className="flex items-center justify-between gap-3 py-1">
          <span className="text-sm text-ink">Session timer</span>
          <Toggle
            on={prefs.workoutTimer}
            aria-label={`${prefs.workoutTimer ? 'Disable' : 'Enable'} session timer`}
            onClick={() => updatePrefs({ workoutTimer: !prefs.workoutTimer })}
          />
        </div>
        <p className="text-xs text-faint mb-1">Times each session and saves the length to your history.</p>
        <div className="flex items-center justify-between gap-3 py-1">
          <span className="text-sm text-ink">Rest timer</span>
          <Toggle
            on={prefs.restTimer}
            aria-label={`${prefs.restTimer ? 'Disable' : 'Enable'} rest timer`}
            onClick={() => updatePrefs({ restTimer: !prefs.restTimer })}
          />
        </div>
        {prefs.restTimer && (
          <div className="flex flex-wrap items-center justify-between gap-2 py-1">
            <span className="text-sm text-ink">Rest duration</span>
            <Segmented value={prefs.restSeconds} onChange={(v: number) => updatePrefs({ restSeconds: v })}
              options={[{ value: 60, label: '60s' }, { value: 90, label: '90s' }, { value: 120, label: '2m' }, { value: 180, label: '3m' }]} />
          </div>
        )}
      </div>

      {/* Widgets */}
      <div className={`${card} p-4`}>
        <h3 className={`${label} mb-1`}>Dashboard widgets</h3>
        {dashKeys.map(widgetRow)}
        <div className="h-px bg-line my-3" />
        <h3 className={`${label} mb-1`}>Progress widgets</h3>
        {progKeys.map(widgetRow)}
      </div>

      {/* Account — profile + the signed-in identity; data syncs to this account. */}
      <div className={`${card} p-4`}>
        <h3 className={`${label} mb-3`}>Account</h3>

        {/* Profile */}
        <div className="mb-3">
          <label htmlFor="settings-name" className="text-sm text-ink block mb-2">Name</label>
          <input
            id="settings-name"
            type="text"
            value={prefs.name}
            onChange={e => updatePrefs({ name: e.target.value })}
            onBlur={e => { const t = e.target.value.trim(); if (t !== prefs.name) updatePrefs({ name: t }); }}
            placeholder="Your name"
            autoComplete="given-name"
            maxLength={MAX_NAME_LEN}
            className={`${input} w-full`}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-ink">Gender</span>
          <Segmented value={prefs.gender} onChange={(v: Gender) => updatePrefs({ gender: v })}
            options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
        </div>

        <div className="h-px bg-line my-4" />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm text-ink truncate">{userEmail ?? 'Signed in'}</p>
            <p className="text-xs text-faint mt-0.5">Your workouts sync to this account.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => (emailOpen ? closeEmail() : (closePw(), setEmailOpen(true)))} className={`${btnSecondary} flex items-center gap-2 px-3 py-2 text-sm`}>
              <Mail size={14} /> Change email
            </button>
            <button onClick={() => (pwOpen ? closePw() : (closeEmail(), setPwOpen(true)))} className={`${btnSecondary} flex items-center gap-2 px-3 py-2 text-sm`}>
              <KeyRound size={14} /> Change password
            </button>
            <button onClick={() => onSignOut && onSignOut()} className={`${btnSecondary} flex items-center gap-2 px-3 py-2 text-sm`}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>

        {emailOpen && (
          <form className="mt-4 pt-4 border-t border-line flex flex-col gap-3" onSubmit={e => { e.preventDefault(); saveEmail(); }}>
            <div>
              <label htmlFor="settings-new-email" className={`${label} block mb-1.5`}>New email address</label>
              <input
                id="settings-new-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className={`${input} w-full`}
                placeholder="you@example.com"
              />
            </div>
            <PasswordField
              id="settings-email-current-password"
              label="Current password"
              value={emailPw}
              onChange={setEmailPw}
              autoComplete="current-password"
              show={showEmailPw}
              onToggleShow={() => setShowEmailPw(s => !s)}
            />
            {emailMsg && <p className={`text-xs ${emailMsg.ok ? 'text-good' : 'text-crit'}`}>{emailMsg.text}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={emailBusy || !newEmail || !emailPw} className={`${btnPrimary} px-3 py-2 text-sm disabled:opacity-50`}>
                {emailBusy ? 'Sending…' : 'Send confirmation'}
              </button>
              <button type="button" onClick={closeEmail} className={`${btnSecondary} px-3 py-2 text-sm`}>Cancel</button>
            </div>
            <p className="text-xs text-faint">
              We confirm your current password first, then email a link to both your current and your new address.
              Your login only changes once you follow it, so you cannot lose access by mistyping.
            </p>
          </form>
        )}

        {pwOpen && (
          <form className="mt-4 pt-4 border-t border-line flex flex-col gap-3" onSubmit={e => { e.preventDefault(); savePassword(); }}>
            <PasswordField
              id="settings-current-password"
              label="Current password"
              value={currentPw}
              onChange={setCurrentPw}
              autoComplete="current-password"
              show={showPw}
              onToggleShow={() => setShowPw(s => !s)}
              autoFocus
            />
            <PasswordField
              id="settings-new-password"
              label="New password"
              value={newPw}
              onChange={setNewPw}
              autoComplete="new-password"
              show={showPw}
              onToggleShow={() => setShowPw(s => !s)}
            />
            <div>
              <PasswordField
                id="settings-confirm-password"
                label="Confirm password"
                value={confirmPw}
                onChange={setConfirmPw}
                autoComplete="new-password"
                show={showPw}
                onToggleShow={() => setShowPw(s => !s)}
              />
              <p className="text-xs text-faint mt-2">At least {MIN_PASSWORD} characters.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pwBusy || !currentPw || !newPw || (confirmPw.length > 0 && newPw !== confirmPw)}
                className={`${btnPrimary} flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50`}
              >
                {pwBusy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {pwBusy ? 'Saving…' : 'Save password'}
              </button>
              <button type="button" onClick={closePw} className={`${btnSecondary} px-3 py-2 text-sm`}>Cancel</button>
            </div>
          </form>
        )}
        {pwMsg && <p className={`text-xs mt-2 ${pwMsg.ok ? 'text-muted' : 'text-crit'}`}>{pwMsg.text}</p>}

        {/* Delete account — irreversible: removes the login and every synced row. */}
        <div className="h-px bg-line my-4" />
        {!confirmingDelete ? (
          <>
            <button onClick={() => { setConfirmingDelete(true); setDeleteMsg(null); }} className={`${btnSecondary} flex items-center gap-2 px-3 py-2 text-sm`}>
              <Trash2 size={14} /> Delete account
            </button>
            {/* The out-of-app deletion route. Google Play requires deletion to be
                startable by someone who has uninstalled the app or can't sign in, via
                a web URL that also goes in the Data safety form — the button above
                satisfies Apple 5.1.1(v) but not that. Linking it here as well keeps
                the two routes described in one place. */}
            <p className="text-xs text-faint mt-2">
              Can't reach the app?{' '}
              <a href={DELETE_REQUEST_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:brightness-110">
                Request deletion another way
              </a>.
            </p>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink">Permanently delete your account and all its data? This can't be undone.</p>
            <label htmlFor="delete-pw" className="text-xs text-muted">Enter your password to confirm.</label>
            <input
              id="delete-pw"
              type="password"
              autoComplete="current-password"
              value={deletePw}
              onChange={e => setDeletePw(e.target.value)}
              className={`${input} w-full py-2 text-sm`}
            />
            <div className="flex gap-2">
              <button
                onClick={deleteAccount}
                disabled={deleteBusy || !deletePw}
                className={`${btnDanger} flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50`}
              >
                {deleteBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleteBusy ? 'Deleting…' : 'Delete permanently'}
              </button>
              <button onClick={() => { setConfirmingDelete(false); setDeletePw(''); }} disabled={deleteBusy} className={`${btnSecondary} px-3 py-2 text-sm`}>Cancel</button>
            </div>
          </div>
        )}
        {deleteMsg && <p className="text-xs text-crit mt-2">{deleteMsg}</p>}
      </div>

      {/* Data — backups. Export writes a JSON file; import replaces the account's
          data. Data lives in your Supabase project (and a local cache). */}
      <div className={`${card} p-4`}>
        <h3 className={`${label} mb-3`}>Data</h3>
        <div className="flex flex-wrap gap-2">
          {/* Export reports failure like every other data action. It used to swallow
              its own error, and this is the button the privacy policy names as the
              access and portability route — silently doing nothing is the one outcome
              a rights mechanism may not have. */}
          <button onClick={() => setExportMsg(onExport?.() ?? null)} className={`${btnSecondary} flex items-center gap-2 px-3 py-2 text-sm`}>
            <Download size={14} /> Export backup
          </button>
          <button onClick={() => fileRef.current?.click()} className={`${btnSecondary} flex items-center gap-2 px-3 py-2 text-sm`}>
            <Upload size={14} /> Import backup
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImportFile} className="hidden" />
        </div>
        {exportMsg && <p className="text-xs text-crit mt-2">{exportMsg}</p>}
        {importMsg && <p className="text-xs text-muted mt-2">{importMsg}</p>}
        <p className="text-xs text-faint mt-2">
          Your data syncs to your Supabase account, with a local cache for offline reads. Export gives you a
          portable backup — it is your full copy under GDPR Art. 15 and Art. 20, and it is unencrypted, so keep
          the file somewhere you would keep anything else about your health.
        </p>

        <div className="h-px bg-line my-4" />
        {/* Named "Delete all my data", never "Clear all data". This wipes the SERVER
            rows as well as this device's cache, and the privacy policy used to describe
            it as the way to clear the device copy — so somebody tidying a shared computer
            would have destroyed their whole training history. The device-only action is
            Sign out, which is what the policy now points at. */}
        {!confirmingClear ? (
          <>
            <button onClick={() => { setConfirmingClear(true); setClearMsg(null); }} className={`${btnSecondary} flex items-center gap-2 px-3 py-2 text-sm`}>
              <Trash2 size={14} /> Delete all my data
            </button>
            <p className="text-xs text-faint mt-2">
              Erases your workouts, weigh-ins and settings everywhere — this device and the server —
              but keeps your login. To clear only this device, sign out.
            </p>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink">Delete every workout, weight and setting, on all your devices?</span>
            <div className="ml-auto flex gap-2">
              <button
                disabled={clearBusy}
                onClick={async () => {
                  // Awaited: the handler reports a failed server delete, and closing the
                  // confirm before knowing the outcome is what made a failure look like
                  // a success.
                  setClearBusy(true);
                  const err = onClearData ? await onClearData() : null;
                  setClearBusy(false);
                  setClearMsg(err);
                  if (!err) setConfirmingClear(false);
                }}
                className={`${btnDanger} flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50`}
              >
                <Trash2 size={14} /> {clearBusy ? 'Deleting…' : 'Delete everything'}
              </button>
              <button disabled={clearBusy} onClick={() => { setConfirmingClear(false); setClearMsg(null); }} className={`${btnSecondary} px-3 py-2 text-sm disabled:opacity-50`}>Cancel</button>
            </div>
          </div>
        )}
        {clearMsg && <p className="text-xs text-crit mt-2">{clearMsg}</p>}
      </div>

      {/* Legal — both stores require the privacy policy to be reachable from inside
          the app (Apple 5.1.1(i); Google Play's User Data policy), and the consent
          record is surfaced here because a consent you can't see is one you can't
          meaningfully withdraw. */}
      <div className={`${card} p-4`}>
        <h3 className={`${label} mb-3`}>Help &amp; legal</h3>
        <div className="flex flex-col gap-2">
          <a href={FAQ_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:brightness-110 transition-all">FAQ</a>
          <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:brightness-110 transition-all">Terms of Service</a>
          <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:brightness-110 transition-all">Privacy Policy</a>
          <a href={CHD_PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:brightness-110 transition-all">Consumer Health Data Privacy</a>
        </div>
        {/* The acceptance record TERMS.md § 3.2 promises the user can ask for — shown
            rather than only stored, since a consent you can't see is one you can't
            meaningfully withdraw. */}
        {(consentAt || termsAt) && (
          <div className="text-xs text-faint mt-3 space-y-1">
            {consentAt && (
              <p>
                Health-data consent given {new Date(consentAt).toLocaleDateString()}
                {consentVersion && <> under policy v{consentVersion}</>}. Withdraw it by deleting your account above.
              </p>
            )}
            {termsAt && (
              <p>Terms {termsVersion && <>v{termsVersion} </>}accepted {new Date(termsAt).toLocaleDateString()}.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Auth gate screens ─────────────────────────────────────────────────────────
// Auth-access convention: these pre-render GATES (Login / ResetPassword) render
// before GymTrackerApp mounts, so they have no container handlers to receive and
// call `supabase.auth.*` directly, mapping errors with the shared authErrorText.
// IN-APP screens are the opposite — SettingsScreen never touches supabase; its
// auth actions (changePassword, deleteAccount, signOut) are injected as props by
// GymTrackerApp and stay presentational. One rule, split by where the screen sits
// relative to the mount: gate → direct; in-app → injected.
//
// A full-screen shell shared by the pre-app states (loading / login / config
// error), so they match the app chrome instead of flashing bare.
const AuthShell = ({ children }: any) => (
  <div className="min-h-screen bg-ground text-ink flex flex-col items-center justify-center px-6">
    <div className="w-full max-w-sm animate-fade-rise">{children}</div>
  </div>
);

// The landing-page policy links. Rendered on every LoginScreen state (sign-in,
// sign-up, forgot, sent) because the signed-out screen IS this app's homepage, and
// My Health My Data Act §19.373.020 requires the consumer-health-data policy to
// carry its own prominent homepage link — a link to the general privacy policy does
// not satisfy it, so the two are listed separately and never collapsed into one.
// target=_blank so following one never discards a half-typed sign-up form. The FAQ
// link is informational — it is not part of the MHMDA homepage-link requirement, but
// the signed-out screen is where a store-listing visitor lands, so it belongs here.
const LegalLinks = () => (
  <p className="text-[11px] text-faint text-center mt-5 leading-relaxed">
    <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="hover:text-muted transition-colors underline underline-offset-2">Terms</a>
    <span className="mx-1.5">·</span>
    <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="hover:text-muted transition-colors underline underline-offset-2">Privacy Policy</a>
    <span className="mx-1.5">·</span>
    <a href={CHD_PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="hover:text-muted transition-colors underline underline-offset-2">Consumer Health Data Privacy</a>
    <span className="mx-1.5">·</span>
    <a href={FAQ_URL} target="_blank" rel="noopener noreferrer" className="hover:text-muted transition-colors underline underline-offset-2">FAQ</a>
  </p>
);

const FullScreenLoader = () => (
  <AuthShell>
    <div className="flex flex-col items-center gap-3 text-muted">
      <Loader2 size={28} className="animate-spin text-accent" />
      <p className="text-sm">Loading…</p>
    </div>
  </AuthShell>
);

// Shown when the Supabase env vars are missing — the app can't run without a
// backend, so say exactly what to do rather than crash.
const ConfigError = () => (
  <AuthShell>
    <div className={`${card} p-6`}>
      <h1 className="font-display text-xl font-bold uppercase tracking-wide text-ink mb-2">Backend not configured</h1>
      <p className="text-sm text-muted mb-3">
        Set <code className="text-ink">VITE_SUPABASE_URL</code> and{' '}
        <code className="text-ink">VITE_SUPABASE_ANON_KEY</code> in a{' '}
        <code className="text-ink">.env.local</code> file (see <code className="text-ink">.env.example</code>), then restart the dev server.
      </p>
    </div>
  </AuthShell>
);

// Map a Supabase auth error to friendly, anti-enumeration copy. Supabase returns
// the same "Invalid login credentials" for a wrong password and an unknown email
// on purpose — we keep that ambiguity rather than leaking which was wrong.
const authErrorText = (error: any): string => {
  const msg = String(error?.message ?? '');
  if (error?.status === 429 || /rate limit/i.test(msg)) return 'Too many attempts. Wait a minute and try again.';
  if (/invalid login credentials/i.test(msg))            return 'Email or password is incorrect.';
  if (/email not confirmed/i.test(msg))                  return 'Please confirm your email first — check your inbox for the link.';
  if (/different from the old password|should be different/i.test(msg)) return 'Choose a password different from your current one.';
  if (error?.code === 'current_password_required' || /current password/i.test(msg)) return 'Your current password is incorrect.';
  if (/reauthentication|session/i.test(msg))             return 'Please sign out and back in, then try again.';
  if (/password should be at least|password.*short|at least \d+ characters/i.test(msg)) return msg; // surface the length rule as-is
  return 'Something went wrong. Please try again.';
};

// Above Supabase's default of 6, deliberately. GDPR Art. 32 asks for security
// "appropriate to the risk", and the risk here is special-category health data — a
// six-character floor is not proportionate to that, and legal/PRIVACY.md § 8 offers
// "concrete measures" for exactly this data. NIST SP 800-63B puts the floor for
// user-chosen secrets at 8 and favours length over composition rules, so this asks
// for length only: no character-class requirement, nothing that pushes users toward
// `Passw0rd!`. The server is still the real gate — raise the project's own minimum
// to match in the dashboard (see SUPABASE-SETUP.md), and turn on leaked-password
// protection there, which is the higher-value control of the two and costs nothing.
// Sign-in is deliberately NOT length-checked: an existing shorter password must keep
// working, or raising this would lock people out of their own accounts.
const MIN_PASSWORD = 10;

// A password input with a show/hide toggle. `id` keeps the label association and
// lets password managers tell fields apart; `autoComplete` must be
// 'current-password' for sign-in and 'new-password' for signup/reset/change.
const PasswordField = ({ id, label: fieldLabel, value, onChange, autoComplete, show, onToggleShow, autoFocus }: any) => (
  <>
    <label htmlFor={id} className={`${label} block mb-2`}>{fieldLabel}</label>
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${input} w-full pr-11`}
        placeholder="••••••••"
        autoFocus={autoFocus}
      />
      <button
        type="button"
        onClick={onToggleShow}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 px-3 flex items-center text-muted hover:text-ink transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </>
);

// The FitPulse mark + wordmark, shared by every auth screen.
const AuthHeader = () => (
  <div className="flex items-center gap-2 justify-center mb-6">
    <div className="w-10 h-10 rounded-ctl bg-accent grid place-items-center">
      <Dumbbell size={22} className="text-accent-ink" />
    </div>
    <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-ink">FitPulse</h1>
  </div>
);

// Password sign-in + open signup, with an inline forgot-password panel. Success
// is handled by onAuthStateChange (which sets the session and drops the gate),
// so there's no local "signed in" state — only the signup-confirm and
// reset-sent panels need one.
const LoginScreen = () => {
  const [mode, setMode]       = useState<'signin' | 'signup'>('signin');
  const [forgot, setForgot]   = useState(false);
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow]       = useState(false);
  // idle → working → (sent = a confirm/reset email went out) | error
  const [status, setStatus]   = useState<'idle' | 'working' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg]   = useState('');
  const [sentKind, setSentKind] = useState<'confirm' | 'reset'>('confirm');
  // TWO separate boxes, and they must stay separate.
  //   `accepted` — acceptance of the Terms, which legal/TERMS.md § 3.1 defines as
  //     "ticking the acceptance box and selecting Create account". That action forms
  //     the contract, so the box has to exist for the Terms to be true.
  //   `consent`  — explicit consent to health-data processing (GDPR Art. 9(2)(a)).
  // Merging them into one tick would void the second: MHMDA § 19.373.010 says consent
  // may not be obtained through "a consumer's agreement to general terms of use", and
  // Art. 9 explicit consent must be specific to the sensitive data. Neither is ever
  // pre-ticked — a pre-ticked box fails both regimes and reads as a dark pattern.
  const [accepted, setAccepted] = useState(false);
  const [consent, setConsent]   = useState(false);

  const addr = email.trim();
  const busy = status === 'working';
  const mismatch = mode === 'signup' && confirm.length > 0 && password !== confirm;
  const unagreed = mode === 'signup' && (!accepted || !consent);

  const reset = () => { setStatus('idle'); setErrMsg(''); setPassword(''); setConfirm(''); setShow(false); setAccepted(false); setConsent(false); };
  const switchMode = (m: 'signin' | 'signup') => { setMode(m); setForgot(false); reset(); };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: addr, password });
    if (error) { setStatus('error'); setErrMsg(authErrorText(error)); }
    // success → onAuthStateChange sets the session and the gate falls through.
  };

  const signUp = async () => {
    // The consent + acceptance record. Written as user metadata in the same call that
    // creates the account, so it exists before any settings row does and survives an
    // abandoned onboarding — the settings row is written later and only once
    // onboarding finishes, so it is the wrong place to keep proof of consent. The
    // Terms half is not optional bookkeeping: legal/TERMS.md § 3.2 promises "we keep a
    // record of which version of these Terms you accepted and when", and § 16 needs it
    // to know who accepted what. Caveat worth knowing: user metadata is writable by the
    // user it belongs to, so this is a record, not tamper-proof evidence. An
    // insert-only `consents` table with RLS would be; that's a migration, and
    // migrations here are applied by hand in the SQL editor.
    const consentAt = new Date().toISOString();
    const { data, error } = await supabase.auth.signUp({
      email: addr,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          health_data_consent_at: consentAt,
          health_data_consent_version: POLICY_VERSION,
          terms_accepted_at: consentAt,
          terms_version: TERMS_VERSION,
          age_confirmed_at: consentAt,
        },
      },
    });
    if (error) { setStatus('error'); setErrMsg(authErrorText(error)); return; }
    // An already-registered email comes back as an obfuscated user with an empty
    // identities[] and NO error — that is Supabase deliberately refusing to confirm
    // whether the address has an account. We used to un-obfuscate it with "That email
    // is already registered", which handed anyone an account-existence oracle: signup
    // is open, so a stranger could test any address without knowing a password. It
    // also contradicted the ambiguity signIn and sendReset are careful to preserve.
    //
    // Supabase still emails the existing owner (a "someone tried to sign up" notice),
    // so the real user is told; the person at the keyboard is not. Both cases show
    // the identical check-your-inbox screen.
    //
    // data.session present → "Confirm email" is off, onAuthStateChange logs us in.
    if (data.session) return;
    setSentKind('confirm'); setStatus('sent');
  };

  const submit = () => {
    if (!addr || !password || busy) return;
    // Belt and braces — the button is already disabled. These are the one pair of
    // gates that must never be bypassable: without the consent tick every subsequent
    // row of health data is unlawfully processed rather than merely undocumented, and
    // without the Terms tick no contract was ever formed.
    if (unagreed) return;
    if (mode === 'signup' && (password !== confirm || password.length < MIN_PASSWORD)) {
      setStatus('error');
      setErrMsg(password !== confirm ? "Passwords don't match." : `Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    setStatus('working'); setErrMsg('');
    (mode === 'signin' ? signIn : signUp)();
  };

  const sendReset = async () => {
    if (!addr || busy) return;
    setStatus('working'); setErrMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(addr, { redirectTo: window.location.origin });
    // Neutral copy regardless of whether the email exists — except a rate limit,
    // which is worth telling them about.
    if (error && error.status === 429) { setStatus('error'); setErrMsg(authErrorText(error)); return; }
    setSentKind('reset'); setStatus('sent');
  };

  // ── Sent confirmation (signup-confirm or reset-link) ──
  if (status === 'sent') {
    return (
      <AuthShell>
        <AuthHeader />
        <div className={`${card} p-6 text-center`}>
          <Mail size={28} className="text-accent mx-auto mb-3" />
          <p className="text-sm text-ink font-medium mb-1">Check your email</p>
          <p className="text-xs text-muted">
            {sentKind === 'confirm'
              ? <>We sent a confirmation link to {addr}. Click it, then sign in.</>
              : <>If an account exists for {addr}, we've sent a password reset link.</>}
          </p>
          <button
            onClick={() => { setForgot(false); setMode('signin'); reset(); }}
            className={`${btnSecondary} mt-4 px-4 py-2 text-sm`}
          >
            Back to sign in
          </button>
        </div>
        <LegalLinks />
      </AuthShell>
    );
  }

  // ── Forgot-password request ──
  if (forgot) {
    return (
      <AuthShell>
        <AuthHeader />
        <form className={`${card} p-6`} onSubmit={e => { e.preventDefault(); sendReset(); }}>
          <label htmlFor="reset-email" className={`${label} block mb-2`}>Email</label>
          <input
            id="reset-email"
            type="email" inputMode="email" autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={`${input} w-full`}
            placeholder="you@example.com"
            autoFocus
          />
          <button
            type="submit"
            disabled={busy || !addr}
            className={`${btnPrimary} w-full mt-4 p-3 flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
          {status === 'error' && <p className="text-xs text-crit mt-2">{errMsg}</p>}
          <button
            type="button"
            onClick={() => { setForgot(false); reset(); }}
            className="text-xs text-muted hover:text-ink transition-colors mt-3 block mx-auto"
          >
            Back to sign in
          </button>
        </form>
        <LegalLinks />
      </AuthShell>
    );
  }

  // ── Sign in / create account ──
  return (
    <AuthShell>
      <AuthHeader />
      <form className={`${card} p-6`} onSubmit={e => { e.preventDefault(); submit(); }}>
        <label htmlFor="login-email" className={`${label} block mb-2`}>Email</label>
        <input
          id="login-email"
          type="email" inputMode="email" autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={`${input} w-full mb-4`}
          placeholder="you@example.com"
          autoFocus
        />

        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          show={show}
          onToggleShow={() => setShow(s => !s)}
        />

        {mode === 'signup' && (
          <div className="mt-4">
            <PasswordField
              id="login-confirm"
              label="Confirm password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              show={show}
              onToggleShow={() => setShow(s => !s)}
            />
            {mismatch && <p className="text-xs text-crit mt-2">Passwords don't match.</p>}
            <p className="text-xs text-faint mt-2">At least {MIN_PASSWORD} characters.</p>

            {/* Box 1 — the contract. legal/TERMS.md § 3.1 defines acceptance as this
                tick plus Create account, and § 4.1 sets the age floor at 18. */}
            <label htmlFor="signup-terms" className="flex items-start gap-2.5 mt-4 cursor-pointer">
              <input
                id="signup-terms"
                type="checkbox"
                checked={accepted}
                onChange={e => setAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-accent cursor-pointer"
              />
              <span className="text-xs text-muted leading-relaxed">
                I'm {MIN_AGE} or older and I accept the{' '}
                <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:brightness-110">Terms of Service</a>
                {' '}and the{' '}
                <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:brightness-110">Privacy Policy</a>.
              </span>
            </label>

            {/* Box 2 — explicit consent to health-data processing (GDPR Art. 9(2)(a)),
                deliberately NOT merged with box 1. Named categories, named purpose and
                the withdrawal route stated inline, because Art. 9 consent must be
                specific and informed, and MHMDA's consent request must disclose the
                categories, the purpose, who it is shared with, and how to withdraw. */}
            <label htmlFor="signup-consent" className="flex items-start gap-2.5 mt-3 cursor-pointer">
              <input
                id="signup-consent"
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-accent cursor-pointer"
              />
              <span className="text-xs text-muted leading-relaxed">
                I explicitly consent to FitPulse storing the health data I log — my body weight,
                my training history, and my gender if I choose to give it — for the sole purpose
                of showing me my own history. It is never sold, shared or advertised against.
                I can withdraw consent at any time by deleting my account.
              </span>
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !addr || !password || mismatch || unagreed}
          className={`${btnPrimary} w-full mt-4 p-3 flex items-center justify-center gap-2 disabled:opacity-50`}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        {status === 'error' && <p className="text-xs text-crit mt-2">{errMsg}</p>}

        {mode === 'signin' && (
          <button
            type="button"
            onClick={() => { setForgot(true); reset(); }}
            className="text-xs text-muted hover:text-ink transition-colors mt-3 block"
          >
            Forgot password?
          </button>
        )}

        <div className="h-px bg-line my-4" />
        <p className="text-xs text-muted text-center">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-accent font-semibold hover:brightness-110 transition-all"
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </form>
      <LegalLinks />
    </AuthShell>
  );
};

// Shown when the user follows a password-reset link — they already hold a real
// (recovery) session, so we only collect the new password. There's no way out
// except setting one or explicitly signing out, so a half-finished reset can't
// strand them in the app with an unknown password.
const ResetPasswordScreen = ({ onDone, onSignOut }: any) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [show, setShow]         = useState(false);
  const [status, setStatus]     = useState<'idle' | 'working' | 'error'>('idle');
  const [errMsg, setErrMsg]     = useState('');

  const busy = status === 'working';
  const mismatch = confirm.length > 0 && password !== confirm;

  const submit = async () => {
    if (busy) return;
    if (password.length < MIN_PASSWORD) { setStatus('error'); setErrMsg(`Password must be at least ${MIN_PASSWORD} characters.`); return; }
    if (password !== confirm)           { setStatus('error'); setErrMsg("Passwords don't match."); return; }
    setStatus('working'); setErrMsg('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setStatus('error'); setErrMsg(authErrorText(error)); return; }
    onDone();   // clears the recovery flag → gate falls through to the app
  };

  return (
    <AuthShell>
      <AuthHeader />
      <form className={`${card} p-6`} onSubmit={e => { e.preventDefault(); submit(); }}>
        <KeyRound size={28} className="text-accent mx-auto mb-3" />
        <p className="text-sm text-ink font-medium text-center mb-1">Set a new password</p>
        <p className="text-xs text-muted text-center mb-4">Choose a new password for your account.</p>

        <PasswordField
          id="reset-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          show={show}
          onToggleShow={() => setShow(s => !s)}
          autoFocus
        />
        <div className="mt-4">
          <PasswordField
            id="reset-confirm"
            label="Confirm password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            show={show}
            onToggleShow={() => setShow(s => !s)}
          />
          {mismatch && <p className="text-xs text-crit mt-2">Passwords don't match.</p>}
          <p className="text-xs text-faint mt-2">At least {MIN_PASSWORD} characters.</p>
        </div>

        <button
          type="submit"
          disabled={busy || !password || mismatch}
          className={`${btnPrimary} w-full mt-4 p-3 flex items-center justify-center gap-2 disabled:opacity-50`}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {busy ? 'Saving…' : 'Save new password'}
        </button>
        {status === 'error' && <p className="text-xs text-crit mt-2">{errMsg}</p>}

        <button
          type="button"
          onClick={() => onSignOut && onSignOut()}
          className="text-xs text-muted hover:text-ink transition-colors mt-3 block mx-auto"
        >
          Sign out instead
        </button>
      </form>
    </AuthShell>
  );
};

// Shown once, right after the first login on a brand-new account (see the
// `needsOnboarding` gate). Only the name is required — it's the un-onboarded
// sentinel (empty = un-onboarded) and drives the greeting. Weight unit has a
// default and gender is optional (both are changeable in Settings), matching the
// "you can change any of this later" copy. "Get started" commits and drops the gate.
const OnboardingScreen = ({ initialPrefs, onDone }: any) => {
  const [name, setName]     = useState('');
  const [units, setUnits]   = useState<Units>(initialPrefs?.units ?? 'kg');
  const [gender, setGender] = useState<Gender>(initialPrefs?.gender ?? '');

  return (
    <AuthShell>
      <AuthHeader />
      <form className={`${card} p-6`} onSubmit={e => { e.preventDefault(); if (name.trim()) onDone({ name: name.trim(), units, gender }); }}>
        <p className="text-sm text-ink font-medium text-center mb-1">Welcome to FitPulse</p>
        <p className="text-xs text-muted text-center mb-5">Set up your profile. You can change any of this later in Settings.</p>

        <div className="mb-4">
          <label htmlFor="onboard-name" className={`${label} block mb-2`}>Name</label>
          <input
            id="onboard-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="What should we call you?"
            autoComplete="given-name"
            maxLength={MAX_NAME_LEN}
            autoFocus
            className={`${input} w-full`}
          />
        </div>

        <div className="mb-4">
          <span className={`${label} block mb-2`}>Weight unit</span>
          <Segmented value={units} onChange={(v: Units) => setUnits(v)}
            options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} />
        </div>

        <div className="mb-5">
          <span className={`${label} block mb-2`}>Gender <span className="text-faint normal-case">(optional)</span></span>
          <Segmented value={gender} onChange={(v: Gender) => setGender(v)}
            options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
        </div>

        <button type="submit" disabled={!name.trim()} className={`${btnPrimary} w-full p-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}>
          Get started
        </button>
      </form>
    </AuthShell>
  );
};

// ─── ReconsentScreen ───────────────────────────────────────────────────────────
// Raised when the versions a user actually agreed to are behind the ones now in
// force (see needsReconsentFor). legal/PRIVACY.md § 12 promises we will never make a
// material change quietly and rely on continued use as consent, legal/TERMS.md § 16.3
// promises affirmative acceptance before a material revision takes effect, and EDPB
// Guidelines 05/2020 ¶ 110 says consent does not survive a considerable change to the
// processing. Before this gate existed, bumping POLICY_VERSION changed nothing for an
// existing user: the stamp was written at signup and never read again.
//
// The two boxes stay separate here for the same reason they are separate at signup —
// merging Art. 9 consent into a general acceptance would void the health-data half —
// and neither is pre-ticked. Sign out is offered because the only honest alternative
// to accepting is to leave, and a gate with no exit is a dark pattern.
//
// **Export is on this screen deliberately.** A first version of this gate had only
// Accept and Sign out, which put Settings — and therefore the export — behind the
// consent. That made data access conditional on agreeing to new terms: Art. 15 and
// Art. 20 cannot be conditioned that way, and attaching a detriment to refusing
// consent is exactly the Art. 7(4) weakness the rest of this design is careful to
// avoid. TERMS.md § 16.3 promises the same thing in contract terms ("you may export
// Your Data at any time before and during that period"). A user who does not want to
// agree must still be able to leave with their data.
//
// **Deletion is on this screen for the same class of reason, and it was missed the
// first time.** The health-data tick-box tells the user they can withdraw consent from
// Settings — and Settings is behind this gate, so while the gate is up that sentence is
// false and the only exit is Sign out, which leaves every row on the server. GDPR
// Art. 7(3) requires withdrawal to be as easy as giving consent; a gate whose refusal
// path cannot reach the withdrawal it advertises fails that, and it is the same
// "published text describes behaviour the code does not have" failure the rest of this
// change exists to clear out. So the full two-step, password-confirmed deletion lives
// here too, alongside the out-of-app route for anyone who cannot complete it.
const ReconsentScreen = ({ onAccept, onSignOut, onExport, onDeleteAccount }: any) => {
  const [accepted, setAccepted] = useState(false);
  const [consent, setConsent]   = useState(false);
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState('');
  const [exportErr, setExportErr] = useState<string | null>(null);
  // Same shape as SettingsScreen's: two steps, and the current password, because the
  // action is identical and irreversible. A weaker confirmation here would make the
  // re-consent gate the easiest place in the app to destroy an account from.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePw, setDeletePw]                 = useState('');
  const [deleteBusy, setDeleteBusy]             = useState(false);
  const [deleteMsg, setDeleteMsg]               = useState<string | null>(null);

  const submit = async () => {
    if (busy || !accepted || !consent) return;
    setBusy(true); setErr('');
    const msg = await onAccept();
    setBusy(false);
    if (msg) setErr(msg);
  };

  const remove = async () => {
    if (deleteBusy || !deletePw || !onDeleteAccount) return;
    setDeleteBusy(true); setDeleteMsg(null);
    const msg = await onDeleteAccount(deletePw);
    // On success the account is gone and the app signs out, so this screen unmounts —
    // we only ever get back here on failure.
    if (msg) { setDeleteBusy(false); setDeleteMsg(msg); setDeletePw(''); }
  };

  return (
    <AuthShell>
      <AuthHeader />
      <form className={`${card} p-6`} onSubmit={e => { e.preventDefault(); submit(); }}>
        <p className="text-sm text-ink font-medium text-center mb-1">We've updated our policies</p>
        <p className="text-xs text-muted text-center mb-5">
          Please read the current versions and confirm. Your data is untouched in the meantime, and nothing
          new happens with it until you agree.
        </p>

        <label htmlFor="reconsent-terms" className="flex items-start gap-2.5 cursor-pointer">
          <input
            id="reconsent-terms"
            type="checkbox"
            checked={accepted}
            onChange={e => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-accent cursor-pointer"
          />
          <span className="text-xs text-muted leading-relaxed">
            I accept the current{' '}
            <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:brightness-110">Terms of Service</a>
            {' '}and{' '}
            <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:brightness-110">Privacy Policy</a>.
          </span>
        </label>

        <label htmlFor="reconsent-consent" className="flex items-start gap-2.5 mt-3 cursor-pointer">
          <input
            id="reconsent-consent"
            type="checkbox"
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-accent cursor-pointer"
          />
          <span className="text-xs text-muted leading-relaxed">
            I explicitly consent to FitPulse continuing to store the health data I log — my body weight,
            my training history, and my gender if I gave it — for the sole purpose of showing me my own
            history. I can withdraw consent at any time from Settings, or by deleting my account below.
          </span>
        </label>

        {err && <p className="text-xs text-crit mt-3">{err}</p>}

        <button
          type="submit"
          disabled={busy || !accepted || !consent}
          className={`${btnPrimary} w-full p-3 mt-5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : null}
          {busy ? 'Saving…' : 'Agree and continue'}
        </button>

        <div className="mt-4 pt-4 border-t border-line">
          <p className="text-xs text-muted leading-relaxed">
            You don't have to agree. If you would rather not, take your data with you — this is the same
            full copy you can always get from Settings, and it works whether or not you accept.
          </p>
          <button
            type="button"
            onClick={() => setExportErr(onExport?.() ?? null)}
            className={`${btnSecondary} w-full p-2.5 mt-3 flex items-center justify-center gap-2 text-sm`}
          >
            <Download size={14} /> Export my data
          </button>
          {exportErr && <p className="text-xs text-crit mt-2">{exportErr}</p>}

          {/* Withdrawing consent. Signing out leaves every row on the server, so it is
              not a withdrawal — this is. Art. 7(3): as easy to withdraw as to give. */}
          {!confirmingDelete ? (
            <>
              <button
                type="button"
                onClick={() => { setConfirmingDelete(true); setDeleteMsg(null); }}
                className="w-full text-xs text-muted hover:text-crit mt-3"
              >
                Or delete my account and all its data
              </button>
              <p className="text-xs text-faint mt-2 text-center">
                Can't complete it here?{' '}
                <a href={DELETE_REQUEST_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:brightness-110">
                  Request deletion another way
                </a>.
              </p>
            </>
          ) : (
            <div className="flex flex-col gap-2 mt-3">
              <p className="text-xs text-ink">Permanently delete your account and all its data? This can't be undone — export first if you want a copy.</p>
              <label htmlFor="reconsent-delete-pw" className="text-xs text-muted">Enter your password to confirm.</label>
              <input
                id="reconsent-delete-pw"
                type="password"
                autoComplete="current-password"
                value={deletePw}
                onChange={e => setDeletePw(e.target.value)}
                className={`${input} w-full py-2 text-sm`}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={remove}
                  disabled={deleteBusy || !deletePw}
                  className={`${btnDanger} flex items-center gap-2 px-3 py-2 text-sm disabled:opacity-50`}
                >
                  {deleteBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {deleteBusy ? 'Deleting…' : 'Delete permanently'}
                </button>
                <button type="button" onClick={() => { setConfirmingDelete(false); setDeletePw(''); }} disabled={deleteBusy} className={`${btnSecondary} px-3 py-2 text-sm`}>Cancel</button>
              </div>
            </div>
          )}
          {deleteMsg && <p className="text-xs text-crit mt-2">{deleteMsg}</p>}
        </div>

        <button type="button" onClick={() => onSignOut && onSignOut()} className="w-full text-xs text-muted hover:text-ink mt-3">
          Sign out instead
        </button>
      </form>
    </AuthShell>
  );
};

// ─── GymTrackerApp ─────────────────────────────────────────────────────────────
const GymTrackerApp = () => {
  const [currentScreen, setCurrentScreen]             = useState('home');
  const [workouts, setWorkouts]                       = useState<any[]>([]);
  const [bodyWeightLog, setBodyWeightLog]             = useState<{ id: string; date: string; weight: number }[]>([]);
  const [weeklyGoal, setWeeklyGoal]                   = useState(GOAL_DEFAULT);
  const [currentWorkout, setCurrentWorkout]           = useState<any>(null);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string | null>(null);
  const [bodyWeight, setBodyWeight]                   = useState('');
  const [workoutNotes, setWorkoutNotes]               = useState('');
  const [quickBWInput, setQuickBWInput]               = useState('');
  const [manageBW, setManageBW]                       = useState(false);   // show the BW-entry editor
  const [pickingSplit, setPickingSplit]               = useState(false);   // re-opened the split chooser from "Change split"
  const [renamingDays, setRenamingDays]               = useState(false);   // the home card is showing the day-name editor
  const [prefs, setPrefs]                             = useState<Prefs>(DEFAULT_PREFS);
  // The tab Settings was opened from, so Back returns there instead of always Home.
  const [settingsFrom, setSettingsFrom]               = useState('home');
  // Set true once the mount load has run, so the active-session write effect can't
  // clobber stored data with the empty initial state before the load reads it.
  const loadedRef = useRef(false);

  // ── Backend auth/sync state ──────────────────────────────────────────────────
  // session   — the Supabase session (null = signed out). authReady gates the
  //             pre-app render so we don't flash the login screen mid-check.
  // hydrated  — the signed-in user's data has been pulled from Supabase (and any
  //             one-time localStorage migration run). The settings write-back
  //             effect waits on this so it can't upsert defaults over real data.
  const [session, setSession]     = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const [hydrated, setHydrated]   = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);  // first login on a brand-new account
  // The policies moved on since this user last agreed — see needsReconsentFor. Read
  // straight off the session's metadata, so it resolves without waiting for hydrate.
  const [needsReconsent, setNeedsReconsent]   = useState(false);
  // True once a localStorage write has thrown (quota full, or Safari private mode,
  // where setItem always throws). The offline banner promises unsynced rows are
  // "saved on this device" — if the cache write failed that promise is false and the
  // row lives only in memory, so the user needs telling rather than a swallowed catch.
  const [cacheWriteFailed, setCacheWriteFailed] = useState(false);
  // Bumping this re-runs the hydrate effect. It exists because hydrate is keyed on
  // the USER id (so a tab focus or token refresh no longer re-fetches), which also
  // removed the accidental retry those events used to provide: open the app offline
  // and the fetch throws, and without this nothing would ever re-fetch for the life
  // of the tab — no cross-device changes, and a first-ever hydrate that failed would
  // leave `isFirstLogin` unevaluated and skip onboarding permanently.
  const [hydrateNonce, setHydrateNonce] = useState(0);
  const [hydrateFailed, setHydrateFailed] = useState(false);
  const reHydrate = () => setHydrateNonce(n => n + 1);

  // Coming back online is the moment a failed hydrate can succeed, so retry then.
  useEffect(() => {
    const onOnline = () => reHydrate();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  // Live mirrors of the two row arrays. Effects read these when they need "the state
  // right now" rather than the state captured by the render that scheduled them —
  // hydrate uses them to snapshot which ids existed when its fetch was issued.
  const workoutsRef = useRef<any[]>([]);
  const bwRef       = useRef<any[]>([]);

  // Drop this device's cached copy of the account. Used only where the user ASKED to
  // leave (sign-out, clear-all-data, account deletion) — never on an involuntary
  // session loss, which would take unsynced rows with it. The keys are per-origin, so
  // a stale cache is also a cross-user leak; `CACHE_OWNER_KEY` is what makes that
  // safe without deleting anything (see the hydrate effect).
  //
  // This list must stay equal to the one PRIVACY.md § 5 publishes, because § 5 offers
  // sign-out as THE control for a shared or borrowed computer and states that it clears
  // every key in that table. It used to leave `gym-theme` and `gym-theme-vars` behind —
  // the second of which is the palette RESOLVED FROM the signed-in user's prefs, so a
  // borrowed machine kept a trace of them. The ErrorBoundary's recovery path always
  // cleared both; the two now agree. `tests/qa/fuzz.test.mjs` guards the pair.
  const clearLocalCache = () => {
    try {
      [STORAGE_KEY, BW_LOG_KEY, GOAL_KEY, PREFS_KEY, ACTIVE_KEY, CACHE_OWNER_KEY, THEME_KEY, THEME_VARS_KEY]
        .forEach(k => localStorage.removeItem(k));
    } catch { /* ignore */ }
  };
  // ── Offline sync safety (roadmap Phase 0) ────────────────────────────────────
  // Rows carry a client-only `_sync` marker: 'pending' (write in flight) or
  // 'error' (write failed — saved on THIS device only). Absent = server-confirmed.
  // It is never sent to Postgres (the mappers in supabase.ts pick only real
  // columns) and it survives the localStorage cache across a reload, so `hydrate`
  // can PRESERVE a not-yet-synced row instead of overwriting it with the server
  // set. `notice` is a transient toast for self-healing failures (e.g. a delete
  // that bounced back and got re-added).
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<any>(null);
  const flash = (msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 5000);
  };
  const markSync = (rows: any[], id: string, state: 'pending' | 'error' | null) =>
    rows.map(r => (r.id === id ? { ...r, _sync: state ?? undefined } : r));
  // Whether body_weight_log has the `workout_id` column (migration 0001). Detected
  // from a hydrate fetch (below) rather than assumed, so this build is correct both
  // before and after 0001 is applied: while absent, weigh-ins insert without the
  // column (no 400) and fall back to the date-string pairing; once the column
  // appears, finish-time weigh-ins link to their workout and the ON DELETE CASCADE
  // becomes the real relation. Once true it stays true — a column can't disappear.
  const bwHasWorkoutId = useRef(false);
  // recovery — the user arrived via a password-reset link. That link returns a
  // real session, so without this flag the gate below would drop them straight
  // into the app; instead it pins them on ResetPasswordScreen until they set a
  // new password (or explicitly sign out).
  // The password-recovery gate. It has to survive a RELOAD: supabase-js consumes
  // and strips the URL hash on the first load, so a refresh on the reset screen
  // fires no second PASSWORD_RECOVERY — the flag went false while the recovery
  // session was still valid, and the gate fell straight through to the dashboard
  // with the password never changed. sessionStorage scopes it to this tab, so it
  // dies with the tab rather than pinning a future visit.
  const RECOVERY_KEY = 'gym-recovery';
  const [recovery, setRecoveryState] = useState(() => {
    try { return sessionStorage.getItem(RECOVERY_KEY) === '1'; } catch { return false; }
  });
  const setRecovery = (on: boolean) => {
    setRecoveryState(on);
    try { on ? sessionStorage.setItem(RECOVERY_KEY, '1') : sessionStorage.removeItem(RECOVERY_KEY); } catch { /* ignore */ }
  };

  const { theme, mode, setMode, toggle } = useTheme();

  const units = prefs.units;
  const updatePrefs  = (patch: Partial<Prefs>) => setPrefs(p => ({ ...p, ...patch }));
  const toggleHidden = (key: string) =>
    setPrefs(p => ({ ...p, hidden: p.hidden.includes(key) ? p.hidden.filter(k => k !== key) : [...p.hidden, key] }));

  // Rename a day tile. Blank (or all-whitespace) clears the override so the day
  // falls back to its catalogue name — that's also what the reset button sends.
  const renameDay = (type: string, name: string) =>
    setPrefs(p => {
      const dayNames = { ...p.dayNames };
      if (name.trim()) dayNames[type] = name; else delete dayNames[type];
      return { ...p, dayNames };
    });

  // Colour choices → CSS tokens. One effect applies every override (accent, base
  // neutrals, semantics) for the active theme; overriding the tokens cascades to
  // every utility across the app.
  useEffect(() => {
    const vars = resolveThemeVars(prefs.accent, prefs.base, prefs.semantics, theme);
    for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v);
  }, [prefs.accent, prefs.base, prefs.semantics, theme]);

  // Persist the resolved vars for BOTH themes so index.html can stamp them before
  // first paint (no flash of the default palette on reload).
  //
  // Gated on a session like every other write-back, and for the same reason spelled
  // out at `deleteAccount`: sign-out calls `resetLocalState()`, which sets `prefs`
  // back to DEFAULT_PREFS — an ungated effect saw that as a change and re-created
  // this key microseconds after `clearLocalCache` removed it, so the wipe never
  // stuck. `!!session` rather than the `signedIn` binding because that one is
  // declared further down the component and this dependency array is evaluated
  // during render.
  useEffect(() => {
    if (!session) return;
    try {
      localStorage.setItem(THEME_VARS_KEY, JSON.stringify({
        light: resolveThemeVars(prefs.accent, prefs.base, prefs.semantics, 'light'),
        dark:  resolveThemeVars(prefs.accent, prefs.base, prefs.semantics, 'dark'),
      }));
    } catch { /* ignore */ }
  }, [prefs.accent, prefs.base, prefs.semantics, !!session]);

  // Load from localStorage. Reads synchronously before the write-back effects
  // below fire on mount — don't reorder or early-return past this.
  //
  // Each key is read in its OWN try. They used to share one, so a single unparsable
  // value (`gym-workouts` holding `null`, `{}`, or a truncated string — anything
  // `.map` can't run on) threw past the reads of prefs, the weigh-in log AND the
  // in-progress session, silently discarding all three. The write-backs then
  // serialised the empty initial state over them. One bad key now costs that key only.
  const readCache = <T,>(key: string, parse: (raw: string) => T): T | undefined => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? parse(raw) : undefined;
    } catch (e) {
      console.error(`Ignoring unreadable cache key ${key}`, e);
      return undefined;
    }
  };
  // JSON.parse gives back whatever was stored, including `null` or an object; every
  // caller below expects a list, so anything else becomes an empty one.
  const parseArray = (raw: string): any[] => {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter(r => r && typeof r === 'object') : [];
  };

  useEffect(() => {
    // A `_sync: 'pending'` in the cache is stale — its in-flight write died with
    // the previous page load, so it will never resolve on its own. Demote it to
    // 'error' so it surfaces in the unsynced banner and re-uploads on the next
    // successful write/hydrate, instead of sitting invisible forever.
    const normalizeSync = (r: any) => (r._sync === 'pending' ? { ...r, _sync: 'error' } : r);

    // Back-fill a local id on cache entries that predate row ids, so the cached
    // list is editable until hydrate swaps in the server rows.
    const loadedWorkouts = (readCache(STORAGE_KEY, parseArray) ?? [])
      .map((w: any) => normalizeSync({ ...w, id: w.id ?? crypto.randomUUID() }));
    if (loadedWorkouts.length > 0) setWorkouts(loadedWorkouts);

    // Clamp on read: a goal saved before the 7/week cap would otherwise survive it.
    const storedGoal = readCache(GOAL_KEY, raw => parseInt(raw, 10));
    if (storedGoal != null && Number.isFinite(storedGoal)) setWeeklyGoal(clampGoal(storedGoal));

    // Pin every field to a known-good value — a hand-edited blob could otherwise set
    // an unknown `base`/`accent`, which the theme resolver then threw on.
    const storedPrefs = readCache(PREFS_KEY, raw => JSON.parse(raw));
    if (storedPrefs) setPrefs(sanitizePrefs(storedPrefs));

    // Cache entries may predate row ids (old localStorage) — back-fill a local id
    // so keys/edits work until hydrate replaces them with the server rows. Carry
    // `_sync` through: a weigh-in that failed to sync must keep its mark across a
    // reload, or the hydrate merge would treat it as synced and drop it.
    const withId = (e: any) => normalizeSync({ id: e.id ?? crypto.randomUUID(), date: e.date, weight: e.weight, ...(e._sync ? { _sync: e._sync } : {}), ...(e.workoutId != null ? { workoutId: e.workoutId } : {}) });
    const storedBW = readCache(BW_LOG_KEY, parseArray);
    if (storedBW) {
      setBodyWeightLog(storedBW.map(withId));
    } else if (loadedWorkouts.length > 0) {
      // Migrate existing workout body weights into the log — but only REAL
      // weigh-ins. A skipped one is bodyWeight null, and toDisplayWeight(null) * 10
      // coerces to 0, which would plot a phantom 0 kg point and drag the chart.
      setBodyWeightLog(loadedWorkouts.filter((w: any) => w.bodyWeight != null).map((w: any) => withId({ date: w.date, weight: w.bodyWeight })));
    }

    // Resume an in-progress session if one was persisted (a refresh, phone lock,
    // or tab reap mid-workout). Drop us straight back onto the workout screen.
    //
    // A session older than MAX_RESUME_MS (dead phone overnight, tab restored days
    // later) is resumed too — the SETS are the user's work and must never be thrown
    // away to tidy up a clock. Only the timing is untrustworthy, so the timer is
    // switched off for the resumed session and the elapsed clock is not shown;
    // finishWorkout then logs no duration at all rather than "13h".
    const active = readCache(ACTIVE_KEY, raw => JSON.parse(raw));
    if (active?.workout && Array.isArray(active.workout.exercises)) {
      const startedMs = new Date(active.workout.date).getTime();
      const stale = !Number.isFinite(startedMs) || Date.now() - startedMs > MAX_RESUME_MS;
      // Back-fill `_uid` on a session persisted by an older build, so its cards get
      // stable React keys rather than falling back to index-keyed drafts.
      setCurrentWorkout({
        ...active.workout,
        ...(stale ? { workoutTimer: false, pausedMs: 0, pausedAt: null } : {}),
        exercises: active.workout.exercises.map((ex: any) => (ex?._uid ? ex : { ...ex, _uid: crypto.randomUUID() })),
      });
      setSelectedWorkoutType(active.type ?? active.workout.type ?? 'custom');
      setWorkoutNotes(active.notes ?? '');
      setCurrentScreen('workout');
    }
  }, []);

  // ── Supabase: track the auth session ─────────────────────────────────────────
  // getSession() resolves the persisted session on load; onAuthStateChange keeps
  // us in step with sign-in (magic-link return) and sign-out.
  useEffect(() => {
    if (!supabaseEnabled) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data }: any) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event: any, s: any) => {
      setSession(s);
      // A reset link returns a genuine session AND fires PASSWORD_RECOVERY (after
      // supabase-js parses the URL hash) — catch it so the gate shows the
      // set-new-password screen instead of the app.
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (!s) {
        // A session can end WITHOUT the user asking: an expired or revoked refresh
        // token, the account deleted elsewhere, a sign-out in another tab. Those are
        // exactly the moments most likely to coincide with being offline, so this
        // must NOT wipe the cache — rows marked `_sync: 'error'` exist only there,
        // and deleting them would destroy the very data the "saved on this device"
        // banner promised was safe. An in-progress workout is the same: dropping
        // `currentWorkout` would clear ACTIVE_KEY and bin every set just logged.
        //
        // Nothing of the previous user is VISIBLE meanwhile — the `!session` gate
        // renders LoginScreen over the whole app. The cross-user leak only becomes
        // real if a DIFFERENT account then signs in, and that is caught by the cache
        // owner check in the hydrate effect, which wipes on a genuine user change.
        // Explicit sign-out still clears everything (see signOut) — that's intent.
        setHydrated(false);
        setNeedsOnboarding(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // One-time lift of this device's localStorage snapshot into Supabase, run only
  // when the account has no server data yet (first login on a device that has been
  // used offline). Returns the inserted rows so hydrate can seed state from them.
  const migrateLocalToServer = async (userId: string) => {
    try {
      const rawW     = localStorage.getItem(STORAGE_KEY);
      const rawBW    = localStorage.getItem(BW_LOG_KEY);
      const rawGoal  = localStorage.getItem(GOAL_KEY);
      const rawPrefs = localStorage.getItem(PREFS_KEY);
      const asArray = (v: any) => (Array.isArray(v) ? v : []);
      const localWorkouts = asArray(rawW  ? JSON.parse(rawW)  : []);
      const localBW       = asArray(rawBW ? JSON.parse(rawBW) : []);
      // Only genuine logged data is worth migrating. `rawGoal`/`rawPrefs` used to be
      // enough to trigger this, but the write-back effects mean BOTH keys exist on
      // any browser that has ever run the app — including straight after a sign-out,
      // which re-writes `gym-prefs` with DEFAULT_PREFS. So signing up a second
      // account on one browser ran a "migration" of nothing, whose only effect was
      // the settings upsert below — and that row's existence is exactly what
      // `isFirstLogin` reads, so a reload mid-onboarding skipped the gate forever.
      if (localWorkouts.length === 0 && localBW.length === 0) return null;

      // The cache is as untrusted as a backup file: it may predate a schema change or
      // have been hand-edited. Migration used to insert it raw, so one bad row (a null
      // weight, a 1e39 weight, an unparseable date) failed the whole batch — and the
      // catch below then discarded the rest of the migration silently.
      const cleanW  = localWorkouts.map(cleanImportedWorkout).filter(Boolean);
      const cleanBW = localBW.map(cleanImportedBW).filter(Boolean);

      let workoutRows: any[] = [];
      if (cleanW.length) {
        const { data, error } = await supabase.from('workouts').insert(cleanW.map(workoutToRow)).select();
        if (error) throw error;
        workoutRows = data ?? [];
      }
      let bwRows: any[] = [];
      if (cleanBW.length) {
        const { data, error } = await supabase.from('body_weight_log')
          .insert(cleanBW.map(bwToRow)).select();
        if (error) {
          // Don't leave the workouts migrated but the weigh-ins lost: undo and let the
          // caller fall back to a plain hydrate, which keeps the cache intact.
          const ids = workoutRows.map((r: any) => r.id);
          if (ids.length) await supabase.from('workouts').delete().in('id', ids);
          throw error;
        }
        bwRows = data ?? [];
      }
      const goal     = rawGoal  ? clampGoal(parseInt(rawGoal, 10)) : null;
      const prefsObj = rawPrefs ? sanitizePrefs(JSON.parse(rawPrefs)) : null;
      let settingsRow: any = null;
      if (goal != null || prefsObj) {
        const { data, error } = await supabase.from('settings')
          .upsert({ user_id: userId, weekly_goal: goal, prefs: prefsObj }).select().maybeSingle();
        if (error) throw error;
        settingsRow = data;
      }
      return { workoutRows, bwRows, settingsRow };
    } catch (e) {
      console.error('Migration failed', e);
      reportError(e, { at: 'migrateLocalToServer' });
      return null;
    }
  };

  // ── Supabase: hydrate state for the signed-in user ───────────────────────────
  // Runs whenever a session appears. Server is the source of truth; the
  // localStorage load above already painted the cache, so this replaces it. Only
  // after this sets `hydrated` does the settings write-back effect start upserting.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    // Whose cache is on this device? If it belongs to somebody else, this is a
    // different account signing in on a shared browser: drop the previous user's
    // rows, prefs and in-progress session BEFORE merging, or their data would paint
    // this dashboard and `mergeUnsynced` would re-append their unsynced rows into
    // this account (and upload them under this user's id on the next write).
    //
    // This is the ONLY place the cache is wiped for a user change — an involuntary
    // sign-out deliberately leaves it alone, because it usually happens offline and
    // the cache may hold the only copy of unsynced work.
    const uid = session.user.id;
    let cacheOwner: string | null = null;
    try { cacheOwner = localStorage.getItem(CACHE_OWNER_KEY); } catch { /* ignore */ }
    const foreignCache = cacheOwner != null && cacheOwner !== uid;
    if (foreignCache) {
      clearLocalCache();
      resetLocalState();
      workoutsRef.current = [];
      bwRef.current = [];
    }
    // Claim the cache for this user. Written before the fetch so an interrupted
    // hydrate still leaves the ownership recorded for whatever was cached.
    try { localStorage.setItem(CACHE_OWNER_KEY, uid); } catch { /* ignore */ }

    // Snapshot the ids present BEFORE the fetch is issued (see mergeUnsynced). Read
    // from refs rather than the closure so this is the state as of right now, not as
    // of the render that scheduled the effect.
    const knownWorkoutIds = new Set<string>(foreignCache ? [] : workoutsRef.current.map((r: any) => r.id));
    const knownBWIds      = new Set<string>(foreignCache ? [] : bwRef.current.map((r: any) => r.id));
    (async () => {
      try {
        const [wRes, bwRes, sRes] = await Promise.all([
          supabase.from('workouts').select('*').order('date', { ascending: true }),
          supabase.from('body_weight_log').select('*').order('date', { ascending: true }),
          supabase.from('settings').select('*').eq('user_id', session.user.id).maybeSingle(),
        ]);
        if (cancelled) return;
        let workoutRows  = wRes.data ?? [];
        let bwRows       = bwRes.data ?? [];
        let settingsRow  = sRes.data ?? null;

        // No server settings row yet = first login on this account → onboard once.
        // Captured before migration reassigns settingsRow below.
        const isFirstLogin = !settingsRow;

        let migrated = false;
        if (workoutRows.length === 0 && bwRows.length === 0 && !settingsRow) {
          const m = await migrateLocalToServer(session.user.id);
          if (m) { workoutRows = m.workoutRows; bwRows = m.bwRows; settingsRow = m.settingsRow; migrated = true; }
        }
        if (cancelled) return;

        // Feature-detect the workout_id column (migration 0001) from the fetched
        // rows: PostgREST's select('*') returns the key even when null, so its
        // presence on any row means the column is live. Latches on — this decides
        // whether finishWorkout links new weigh-ins (see bwHasWorkoutId).
        if (bwRows.some((r: any) => r && 'workout_id' in r)) bwHasWorkoutId.current = true;

        // Server is the source of truth, BUT a row that failed to sync (offline,
        // maintenance window) lives only in local state/cache with a `_sync` mark.
        // Merge rather than replace so hydrate can't silently drop it: prefer the
        // local copy for an unsynced edit (id matches), and re-append an unsynced
        // insert whose id never reached the server. On the migration path we plain-
        // replace — migration already consumed the whole cache, so merging would
        // duplicate every row.
        // `knownIds` is the set of row ids that existed in state when this fetch was
        // ISSUED. It's what makes "the server doesn't have it" mean "it was deleted"
        // rather than "it hadn't been written yet": the snapshot is a point-in-time
        // read, and a row inserted WHILE it was in flight is legitimately absent from
        // it. Without this, pressing Finish during a hydrate (which a token refresh
        // or a tab focus can trigger at any moment) dropped the just-saved session
        // from state, and the write-back then flushed the truncated array to the
        // cache. Only rows the snapshot could have seen are eligible to be removed.
        // Defaults to "every current row was already known", i.e. the pre-existing
        // behaviour, so a caller that omits it can only be conservative.
        const mergeUnsynced = (
          serverRows: any[], mapRow: (r: any) => any, prev: any[],
          knownIds: Set<string> = new Set(prev.map((r: any) => r.id)),
        ) => {
          const unsynced = prev.filter(r => r._sync);
          const byId = new Map(unsynced.map(r => [r.id, r]));
          const serverIds = new Set(serverRows.map(r => r.id));
          const serverDates = new Set(serverRows.map(r => r.date));
          const merged  = serverRows.map(r => byId.get(r.id) ?? mapRow(r));
          // An unsynced insert whose id never reached the server is re-appended so
          // it isn't lost — UNLESS a server row already carries its exact date, which
          // means the insert actually committed and we only lost the ack. Re-adding
          // it then would duplicate the row, so drop the orphan and keep the server
          // copy. (Session/weigh-in dates are ms-precision ISO strings, so a genuine
          // offline insert on a new day won't false-match an existing server date.)
          const orphans = unsynced.filter(r => !serverIds.has(r.id) && !serverDates.has(r.date));
          // Rows that appeared after the fetch was issued: keep them regardless of
          // their sync mark. `knownIds` guards the mirror case too — a row the user
          // just deleted was in knownIds, so it stays deleted rather than being
          // resurrected by the stale snapshot.
          const fresh = prev.filter(r =>
            !r._sync && !knownIds.has(r.id) && !serverIds.has(r.id) && !serverDates.has(r.date));
          return [...merged, ...orphans, ...fresh];
        };
        if (migrated) {
          setWorkouts(workoutRows.map(rowToWorkout));
          setBodyWeightLog(bwRows.map(rowToBW));
        } else {
          setWorkouts(prev => mergeUnsynced(workoutRows, rowToWorkout, prev, knownWorkoutIds));
          setBodyWeightLog(prev => mergeUnsynced(bwRows, rowToBW, prev, knownBWIds));
        }
        if (settingsRow) {
          if (Number.isFinite(settingsRow.weekly_goal)) setWeeklyGoal(clampGoal(settingsRow.weekly_goal));
          // Same sanitiser as the cache and import paths. The server blob is NOT
          // trustworthy just because it came from Postgres — whatever a hostile or
          // buggy import wrote there is what syncs back down, to every device.
          if (settingsRow.prefs) setPrefs(sanitizePrefs(settingsRow.prefs));
        }
        if (isFirstLogin) setNeedsOnboarding(true);   // greet the new account for name/units/gender
        if (!cancelled) setHydrateFailed(false);
      } catch (e) {
        console.error('Hydrate failed', e);   // keep the localStorage cache; app still usable offline
        reportError(e, { at: 'hydrate' });
        // Record it so (a) the banner can offer a retry and (b) the settings
        // write-back stays out. Without the flag, a first-ever hydrate that failed
        // offline let the debounced upsert create a settings row from DEFAULT_PREFS —
        // after which `isFirstLogin` is false forever and onboarding never runs.
        if (!cancelled) setHydrateFailed(true);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
    // Keyed on the USER, not the session object. supabase-js re-emits an auth event
    // carrying a freshly-parsed session on every tab focus / phone unlock (and on
    // each token refresh), and setSession made each one a new object identity — so
    // this effect re-ran a full three-table hydrate every time the app came to the
    // foreground, replacing state from the server mid-edit. A settings toggle made in
    // the second before a tab switch was reverted (hydrate read the row before the
    // 600ms-debounced upsert committed), and a just-finished onboarding was re-raised
    // because its settings row hadn't been written yet. There is nothing to re-fetch
    // while the same user stays signed in.
    // `hydrateNonce` is the manual/automatic retry hook — see reHydrate.
  }, [session?.user?.id, hydrateNonce]);

  // ── Consent: the gate flag, and the append-only evidence rows ────────────────
  // Two jobs, one pass over the same metadata:
  //
  //  1. Decide whether the versions this user agreed to are still current. This is
  //     what makes POLICY_VERSION/TERMS_VERSION mean something — until now they were
  //     written at signup and never read, so bumping one changed nothing for anybody.
  //
  //  2. Mirror the metadata record into `public.consents` (migration 0004), which is
  //     append-only, so the CONTROLLER can demonstrate consent under Art. 7(1). The
  //     metadata copy is writable by the user it describes, which makes it a record
  //     rather than evidence; it stays as the capture path because it exists before
  //     any other row does and survives an abandoned onboarding.
  //
  // Feature-detected like the workout_id column: while migration 0004 is unapplied
  // the select errors, and the app carries on with the metadata record alone rather
  // than failing. Backfills on the first hydrate after the table appears, so accounts
  // created before it are not left without evidence.
  //
  // Keyed on the user id AND the two version strings, never on the session object —
  // supabase-js hands us a new session on every tab focus and token refresh, and the
  // version strings are stable, so this does not re-run when the app comes forward.
  const healthConsentVersion = session?.user?.user_metadata?.health_data_consent_version;
  const acceptedTermsVersion = session?.user?.user_metadata?.terms_version;
  useEffect(() => {
    if (!session) { setNeedsReconsent(false); return; }
    const meta = session.user.user_metadata ?? {};
    setNeedsReconsent(needsReconsentFor(meta));

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from('consents').select('kind, granted_at');
        if (cancelled) return;
        if (error) {
          // Two very different situations, and they stopped being equally harmless the
          // day 0004 went live. "Table absent" is the feature-detect case and is
          // expected while the migration is unapplied; anything else now means RLS is
          // misconfigured, the grant was revoked, or the network is persistently down —
          // in which case the Art. 7(1) evidence quietly stops being written, and this
          // is the only place that could ever say so. It used to `return` on both, with
          // a comment claiming it logged. It didn't.
          const missingTable = /relation .*consents.* does not exist|schema cache|PGRST205|42P01/i
            .test(`${(error as any).code ?? ''} ${error.message ?? ''}`);
          if (!missingTable) {
            console.error('Consent evidence read failed', error);
            reportError(error, { at: 'consentEvidence.read' });
          }
          return;
        }
        // Newest recorded grant per kind. Keying the comparison on the INSTANT rather
        // than on kind:version means a genuine second consent event files a second row
        // (the table is an audit trail, so the sequence is the point) while an
        // unchanged one files nothing — and `>` rather than `!==` is what keeps that
        // idempotent: if a timestamp ever round-tripped through Postgres in a form that
        // didn't compare equal, an inequality test would append a duplicate row on
        // every single mount, for ever, to a table with no DELETE policy.
        const newestByKind = new Map<string, number>();
        for (const r of (data ?? []) as any[]) {
          const t = Date.parse(r.granted_at ?? '');
          if (Number.isFinite(t) && t > (newestByKind.get(r.kind) ?? -Infinity)) newestByKind.set(r.kind, t);
        }
        const missing = consentRowsFor(session.user.id, meta)
          .filter(r => Date.parse(r.granted_at) > (newestByKind.get(r.kind) ?? -Infinity));
        if (!missing.length || cancelled) return;
        const { error: insertError } = await supabase.from('consents').insert(missing);
        if (insertError) {
          console.error('Consent evidence write failed', insertError);
          reportError(insertError, { at: 'consentEvidence' });
        }
      } catch (e) {
        console.error('Consent evidence check failed', e);
        reportError(e, { at: 'consentEvidence' });
      }
    })();
    return () => { cancelled = true; };
    // `hydrateNonce` for the same reason the hydrate effect takes it: keying on the user
    // id removed the accidental retry that tab-focus re-runs used to provide, and this
    // is the effect carrying the Art. 7(1) burden. Without it, a user whose first load
    // of a session happens offline (or meets one transient 5xx) never files their
    // evidence rows for the whole life of that tab. It costs one identifier and reuses
    // the `online` listener and the banner's Retry that already exist.
  }, [session?.user?.id, healthConsentVersion, acceptedTermsVersion, hydrateNonce]);

  // Persist the active session on every change so it survives a reload. Skips the
  // first run (mount) so the empty initial state can't clear a just-loaded session
  // before the load effect's restore re-renders.
  useEffect(() => {
    if (!loadedRef.current) { loadedRef.current = true; return; }
    try {
      if (currentWorkout) {
        localStorage.setItem(ACTIVE_KEY, JSON.stringify({ workout: currentWorkout, type: selectedWorkoutType, notes: workoutNotes }));
      } else {
        localStorage.removeItem(ACTIVE_KEY);
      }
    } catch { /* ignore */ }
  }, [currentWorkout, selectedWorkoutType, workoutNotes]);

  // The four cache write-backs. All gated on `signedIn`, which fixes two things at
  // once: (1) on mount they used to fire with the EMPTY initial state and blank the
  // cache before the load effect's setState re-rendered — safe only by effect
  // ordering, and NOT safe if the load effect threw; (2) after a sign-out they
  // re-wrote the defaults straight back over the keys `clearLocalCache` had just
  // removed, so a wipe never actually stuck.
  //
  // `cacheWriteFailed` surfaces a quota/private-mode failure instead of swallowing
  // it — the header banner promises unsynced rows are "saved on this device", and
  // that promise is false if setItem threw.
  const writeCache = (key: string, value: string) => {
    try { localStorage.setItem(key, value); setCacheWriteFailed(false); }
    catch { setCacheWriteFailed(true); }
  };

  // A STABLE gate, not the session object. supabase-js hands us a new session object
  // on every token refresh and tab focus, so depending on `session` itself would
  // re-serialise the whole workouts array into localStorage each time the app came
  // back to the foreground — pure waste that grows with history length.
  const signedIn = !!session;

  // Keep the refs in step on every render, before any effect can read them.
  workoutsRef.current = workouts;
  bwRef.current       = bodyWeightLog;

  useEffect(() => {
    if (!signedIn) return;
    writeCache(STORAGE_KEY, JSON.stringify(workouts));
  }, [workouts, signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    writeCache(BW_LOG_KEY, JSON.stringify(bodyWeightLog));
  }, [bodyWeightLog, signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    writeCache(GOAL_KEY, String(weeklyGoal));
  }, [weeklyGoal, signedIn]);

  useEffect(() => {
    if (!signedIn) return;
    writeCache(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs, signedIn]);

  // Sync weekly goal + prefs to Supabase (one row per user). Debounced so a slider
  // drag or colour-picker sweep is one upsert, not dozens. Gated on `hydrated` so
  // it can't fire with default values before the initial load lands. Also gated on
  // `!needsOnboarding`: while a brand-new account is still on the onboarding gate we
  // must NOT write a settings row — its absence is exactly what `isFirstLogin` reads,
  // so writing one here would make a reload mid-onboarding skip the gate forever.
  // Completing onboarding clears the flag and changes prefs, firing this write.
  useEffect(() => {
    // `hydrateFailed` matters as much as `hydrated`: if the initial fetch threw we do
    // not KNOW whether a settings row exists, and writing one would permanently
    // suppress onboarding for a brand-new account (its absence is the sentinel).
    if (!hydrated || hydrateFailed || !session || needsOnboarding) return;
    const t = setTimeout(() => {
      supabase.from('settings')
        .upsert({ user_id: session.user.id, weekly_goal: weeklyGoal, prefs, updated_at: new Date().toISOString() })
        .then(({ error }: any) => { if (error) { console.error('Settings save failed', error); reportError(error, { at: 'settingsUpsert' }); } });
    }, 600);
    return () => clearTimeout(t);
    // Keyed on the user id, not the session object: supabase-js hands us a new session
    // object on every tab focus and token refresh, and depending on it scheduled a
    // redundant settings upsert each time the app returned to the foreground.
  }, [weeklyGoal, prefs, hydrated, hydrateFailed, session?.user?.id, needsOnboarding]);

  // ── Workout actions ──────────────────────────────────────────────────────────
  const startWorkout = (type: string) => {
    setSelectedWorkoutType(type);
    setCurrentScreen('enterBodyWeight');
  };

  const confirmBodyWeight = () => {
    // Weigh-in is optional — a blank entry starts the session with bodyWeight null
    // (fromInputWeight already maps blank → null), and finish won't log a null.
    setCurrentWorkout({
      type: selectedWorkoutType,
      bodyWeight: fromInputBodyWeight(bodyWeight, units),   // typed in display units → stored kg
      // The day's starter exercises, already on screen — the user only fills in
      // reps and weight. Untouched cards are dropped by finishWorkout.
      exercises: starterExercises(selectedWorkoutType!),
      date: new Date().toISOString(),
      notes: '',
      // Per-session timer state — seeded from the saved defaults but overridden only
      // for this session. pausedMs/pausedAt track the session-clock pause.
      workoutTimer: prefs.workoutTimer,
      restTimer: prefs.restTimer,
      pausedMs: 0,
      pausedAt: null,
    });
    setCurrentScreen('workout');
  };

  // Merge a patch into the active session (per-session timer toggles + pause state).
  const patchCurrentWorkout = (p: any) => setCurrentWorkout((w: any) => (w ? { ...w, ...p } : w));

  const addExercise = (name: string) => {
    // Stamp the stable id at write time (see idForName) so a later display-name
    // rename doesn't orphan this session. name is kept for display + legacy reads.
    setCurrentWorkout((w: any) => ({ ...w, exercises: [...w.exercises, newExerciseCard(name)] }));
  };

  const addSet = (exIdx: number, reps: string, weight: string) => {
    // Weight is typed in display units and stored in kg; blank = bodyweight (null),
    // never the NaN that parseFloat('') would give. Both parsers reject out-of-range
    // input, so a stray '-' can't log a negative set.
    const load = fromInputWeight(weight, units);
    const count = fromInputReps(reps);
    if (count <= 0) return;   // nothing to log; the button's canAddSet guard agrees
    setCurrentWorkout((w: any) => {
      const exercises = w.exercises.map((ex: any, i: number) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, { reps: count, weight: load }] } : ex
      );
      return { ...w, exercises };
    });
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setCurrentWorkout((w: any) => {
      const exercises = w.exercises.map((ex: any, i: number) =>
        i === exIdx ? { ...ex, sets: ex.sets.filter((_: any, si: number) => si !== setIdx) } : ex
      );
      return { ...w, exercises };
    });
  };

  const removeExercise = (exIdx: number) => {
    setCurrentWorkout((w: any) => ({
      ...w,
      exercises: w.exercises.filter((_: any, i: number) => i !== exIdx)
    }));
  };

  const updateExerciseNotes = (exIdx: number, notes: string) => {
    setCurrentWorkout((w: any) => {
      const exercises = w.exercises.map((ex: any, i: number) => i === exIdx ? { ...ex, notes } : ex);
      return { ...w, exercises };
    });
  };

  const finishWorkout = async () => {
    // Drop exercises that never got a set — an empty card is nothing to log and
    // would just clutter history. `_uid` is per-card React bookkeeping, not part of
    // the record, so it's stripped here rather than riding into the exercises JSONB.
    const exercises = currentWorkout.exercises
      .filter((ex: any) => ex.sets.length > 0)
      .map(({ _uid, ...ex }: any) => ex);
    if (exercises.length === 0) return;   // the Finish button also guards this
    // Session length = wall-clock from start, minus any paused time (freeze at the
    // pause point if still paused). Logged only when the session timer is on — read
    // from the per-session override, not the saved default.
    const startMs   = new Date(currentWorkout.date).getTime();
    const pausedMs  = currentWorkout.pausedMs || 0;
    const endMs     = currentWorkout.pausedAt != null ? new Date(currentWorkout.pausedAt).getTime() : Date.now();
    // Capped: a session restored from an old cache (or a device whose clock moved)
    // would otherwise log a multi-day duration as a permanent record. MAX_RESUME_MS
    // normally prevents that on load; this is the belt to its braces.
    const rawDuration = Number.isFinite(startMs) ? Math.round((endMs - startMs - pausedMs) / 1000) : 0;
    const duration    = Math.min(Math.max(0, rawDuration), MAX_DURATION_S);
    const timerOn   = currentWorkout.workoutTimer ?? prefs.workoutTimer;
    // Strip the per-session timer bookkeeping from the permanent record.
    const { workoutTimer: _wt, restTimer: _rt, pausedMs: _pm, pausedAt: _pa, ...base } = currentWorkout;
    const completed = { ...base, exercises, notes: workoutNotes, ...(timerOn ? { duration } : {}) };

    // Optimistic: show it immediately under a temp id and `_sync: 'pending'`, then
    // swap in the row the server returns (with its real uuid, unmarked = synced).
    // If the insert fails we mark the temp row `_sync: 'error'` — it stays in state
    // and the localStorage cache, and hydrate now preserves it, so it isn't lost.
    const tempId = crypto.randomUUID();
    setWorkouts(prev => [...prev, { ...completed, id: tempId, _sync: 'pending' }]);
    // Only log a real weigh-in — a skipped (null) body weight isn't a data point.
    const bwTempId = completed.bodyWeight != null ? crypto.randomUUID() : null;
    if (bwTempId) {
      setBodyWeightLog(prev => [...prev, { id: bwTempId, date: completed.date, weight: completed.bodyWeight, _sync: 'pending' }]);
    }
    setCurrentWorkout(null);
    setSelectedWorkoutType(null);
    setBodyWeight('');
    setWorkoutNotes('');
    setCurrentScreen('home');

    const { data, error } = await supabase.from('workouts').insert(workoutToRow(completed)).select().single();
    if (error) { console.error('Save workout failed', error); setWorkouts(prev => markSync(prev, tempId, 'error')); }
    else setWorkouts(prev => prev.map(w => w.id === tempId ? rowToWorkout(data) : w));
    if (bwTempId) {
      // Link the weigh-in to its workout by real FK when 0001 is live and the
      // workout row saved (so we have its id); otherwise omit workout_id and rely
      // on the date-string pairing as before. bwToRow only emits the column when
      // workoutId is set, so a pre-0001 insert can't reference a missing column.
      const workoutId = bwHasWorkoutId.current && !error && data ? data.id : undefined;
      const { data: bw, error: bwErr } = await supabase.from('body_weight_log')
        .insert(bwToRow({ date: completed.date, weight: completed.bodyWeight, workoutId })).select().single();
      if (bwErr) { console.error('Save weigh-in failed', bwErr); setBodyWeightLog(prev => markSync(prev, bwTempId, 'error')); }
      else setBodyWeightLog(prev => prev.map(e => e.id === bwTempId ? rowToBW(bw) : e));
    }
  };

  const cancelWorkout = () => {
    setCurrentWorkout(null);
    setSelectedWorkoutType(null);
    setBodyWeight('');
    setWorkoutNotes('');
    setCurrentScreen('home');
  };

  const logBodyWeight = async () => {
    if (!quickBWInput) return;
    const kg = fromInputBodyWeight(quickBWInput, units);   // typed in display units → stored kg
    if (kg == null) return;
    const temp = { id: crypto.randomUUID(), date: new Date().toISOString(), weight: kg, _sync: 'pending' };
    setBodyWeightLog(prev => [...prev, temp]);
    setQuickBWInput('');
    const { data, error } = await supabase.from('body_weight_log')
      .insert(bwToRow({ date: temp.date, weight: kg })).select().single();
    if (error) { console.error('Save weigh-in failed', error); setBodyWeightLog(prev => markSync(prev, temp.id, 'error')); }
    else setBodyWeightLog(prev => prev.map(e => e.id === temp.id ? rowToBW(data) : e));
  };

  // ── The workout ⇄ finish-time weigh-in pairing ───────────────────────────────
  // A finish-time weigh-in is linked to its workout by exact date-string equality
  // (body_weight_log.date === workouts.date). That join key lives in ONE place —
  // here — so every handler that touches a workout's weigh-in shares the same
  // notion of "the paired entry" instead of re-deriving the match inline. (A
  // standalone quick-log has its own timestamp, so it never collides with a
  // workout's date.) Migration 0001's workout_id FK makes this a real relation
  // server-side once applied; until then these keep local + server state in step.
  const pairedWeighIn = (dateKey: string) => bodyWeightLog.find(e => e.date === dateKey);

  // Reconcile the log so the entry paired to `dateKey` matches `weightKg`
  // (null = no weigh-in) — delete, update, or insert as needed, in state and on
  // the server. This is the edit path (History changed a finish-time weight);
  // finishWorkout does its own optimistic/_sync insert for a brand-new session.
  // `workoutId` (the edited workout's id) links a newly-inserted weigh-in via FK
  // when 0001 is live — passed through bwToRow, which drops it pre-0001.
  const reconcilePairedWeighIn = async (dateKey: string, weightKg: number | null, workoutId?: string) => {
    const existing = pairedWeighIn(dateKey);
    if (weightKg == null) {
      if (existing) {
        setBodyWeightLog(prev => prev.filter(e => e.id !== existing.id));   // optimistic
        const { error } = await supabase.from('body_weight_log').delete().eq('id', existing.id);
        if (error) {
          // Put it back so local matches the server (the row is still there) instead
          // of silently dropping a weigh-in that reappears on the next hydrate.
          console.error('Delete weigh-in failed', error);
          setBodyWeightLog(prev => prev.some(e => e.id === existing.id) ? prev : [...prev, existing]);
          flash("Couldn't update the weigh-in — you may be offline.");
        }
      }
    } else if (existing) {
      // Mark 'error' on failure (as updateWorkout does) so hydrate's merge prefers
      // this local edit over the stale server row rather than reverting it.
      setBodyWeightLog(prev => prev.map(e => e.id === existing.id ? { ...e, weight: weightKg, _sync: 'pending' } : e));
      const { error } = await supabase.from('body_weight_log').update({ weight: weightKg }).eq('id', existing.id);
      setBodyWeightLog(prev => markSync(prev, existing.id, error ? 'error' : null));
      if (error) { console.error('Update weigh-in failed', error); flash('Weigh-in saved on this device only — not synced yet.'); }
    } else {
      // Optimistic insert under a temp id, mirroring finishWorkout — an offline add
      // keeps its 'error' mark and survives hydrate instead of vanishing.
      const link   = bwHasWorkoutId.current ? workoutId : undefined;
      const tempId = crypto.randomUUID();
      setBodyWeightLog(prev => [...prev, { id: tempId, date: dateKey, weight: weightKg, _sync: 'pending' }]);
      const { data, error } = await supabase.from('body_weight_log')
        .insert(bwToRow({ date: dateKey, weight: weightKg, workoutId: link })).select().single();
      if (error) { console.error('Add weigh-in failed', error); setBodyWeightLog(prev => markSync(prev, tempId, 'error')); flash('Weigh-in saved on this device only — not synced yet.'); }
      else setBodyWeightLog(prev => prev.map(e => e.id === tempId ? rowToBW(data) : e));
    }
  };

  // Identity is the row uuid, never the array index: HistoryScreen keys its rows
  // by uuid and passes it straight here, so a sorted/filtered/calendar subset —
  // or an array replaced by hydrate mid-edit — always routes to the right row.
  const deleteWorkout = async (id: string) => {
    const removed = workouts.find(w => w.id === id);
    // Remove the paired finish-time weigh-in too, so deleting a workout doesn't
    // strand an orphan in the body-weight chart. The 0001 FK cascade enforces this
    // server-side once applied — this keeps local state correct now, before it lands.
    const pairedBW = removed ? pairedWeighIn(removed.date) : undefined;
    setWorkouts(w => w.filter(x => x.id !== id));   // optimistic
    if (pairedBW) setBodyWeightLog(log => log.filter(e => e.id !== pairedBW.id));
    const { error } = await supabase.from('workouts').delete().eq('id', id);
    if (error) {
      console.error('Delete workout failed', error);
      if (removed)  setWorkouts(prev => [...prev, removed]);
      if (pairedBW) setBodyWeightLog(prev => [...prev, pairedBW]);
      flash("Couldn't delete — you may be offline. The workout is still saved.");
      return;
    }
    if (pairedBW) {
      const { error: e2 } = await supabase.from('body_weight_log').delete().eq('id', pairedBW.id);
      if (e2) {
        // The workout is gone but its weigh-in delete bounced — the row still lives
        // on the server and would silently reappear on the next hydrate. Put it back
        // in local state so the two stay in step until the delete can be retried.
        console.error('Delete paired weigh-in failed', e2);
        setBodyWeightLog(prev => prev.some(e => e.id === pairedBW.id) ? prev : [...prev, pairedBW]);
      }
    }
  };

  // Rows whose insert-fallback is in flight (see below). Without this, two Saves on
  // the same device-only row both see a zero-row UPDATE and both INSERT, leaving a
  // duplicate session on the server that the id-adoption never claims.
  const insertFallbackInFlight = useRef<Set<string>>(new Set());

  const updateWorkout = async (id: string, updated: any) => {
    setWorkouts(w => w.map(item => item.id === id ? { ...updated, id, _sync: 'pending' } : item));   // optimistic
    // The id this row ends up under: the fallback below may adopt a server-assigned
    // one, and the paired weigh-in must be linked to THAT, not the dead local id.
    let effectiveId = id;
    // `.select()` so we learn how many rows the UPDATE actually matched. Editing a
    // workout that only exists on this device (its insert failed offline) matched
    // ZERO rows and returned NO error — so the row's `_sync` mark was cleared as if
    // it had synced, and the next hydrate, seeing an unmarked row the server didn't
    // have, dropped it from state, cache and server alike. Editing a session was
    // enough to delete it.
    const { data, error } = await supabase.from('workouts').update(workoutToRow(updated)).eq('id', id).select();
    if (error) {
      // Mark 'error' so the merge in hydrate prefers this local edit over the stale
      // server row (same id).
      console.error('Update workout failed', error);
      setWorkouts(prev => markSync(prev, id, 'error'));
    } else if (!data || data.length === 0) {
      // Nothing to update — this row never reached the server. Insert it instead, so
      // the edit is what finally syncs it. Guarded so a double-Save can't insert twice.
      if (insertFallbackInFlight.current.has(id)) return;
      insertFallbackInFlight.current.add(id);
      try {
        const { data: inserted, error: insErr } = await supabase.from('workouts')
          .insert(workoutToRow(updated)).select().single();
        if (insErr) {
          console.error('Update fell back to insert and failed', insErr);
          setWorkouts(prev => markSync(prev, id, 'error'));
        } else {
          // Adopt the server's uuid so later edits/deletes address the real row. If
          // the row was deleted locally while the insert was in flight, nothing here
          // matches — so delete the row we just created rather than orphaning it on
          // the server, where it would reappear at the next hydrate.
          let adopted = false;
          setWorkouts(prev => {
            const hit = prev.some(w => w.id === id);
            adopted = hit;
            return hit ? prev.map(w => (w.id === id ? rowToWorkout(inserted) : w)) : prev;
          });
          // setWorkouts' updater runs synchronously during the dispatch, so `adopted`
          // is settled by the time this reads it.
          if (!adopted) {
            await supabase.from('workouts').delete().eq('id', inserted.id);
            return;   // the row is gone; there is no weigh-in left to reconcile
          }
          effectiveId = inserted.id;
        }
      } finally {
        insertFallbackInFlight.current.delete(id);
      }
    } else {
      setWorkouts(prev => markSync(prev, id, null));   // clear the mark: it reads as synced
    }

    // Keep the body-weight log in step: the finish-time entry shares the workout's
    // date, so edit/clear it here too — otherwise the chart and readout keep the
    // old (or wrong) number the History edit was meant to fix.
    await reconcilePairedWeighIn(updated.date, updated.bodyWeight, effectiveId);
  };

  // Remove a body-weight data point (a fat-fingered entry, say). Keyed by row uuid.
  const deleteBodyWeightEntry = async (id: string) => {
    const removed = bodyWeightLog.find(e => e.id === id);
    setBodyWeightLog(log => log.filter(e => e.id !== id));   // optimistic
    const { error } = await supabase.from('body_weight_log').delete().eq('id', id);
    if (error) { console.error('Delete weigh-in failed', error); if (removed) setBodyWeightLog(prev => [...prev, removed]); flash("Couldn't delete — you may be offline. The entry is still saved."); }
  };

  // Move an exercise up/down within the active session so it can be reordered.
  const moveExercise = (idx: number, dir: -1 | 1) => {
    setCurrentWorkout((w: any) => {
      const to = idx + dir;
      if (to < 0 || to >= w.exercises.length) return w;
      const exercises = [...w.exercises];
      [exercises[idx], exercises[to]] = [exercises[to], exercises[idx]];
      return { ...w, exercises };
    });
  };

  // Open Settings while remembering the tab we came from, so Back returns there.
  // Guard against re-entry: opening Settings *from* Settings would set
  // settingsFrom='settings' and trap Back (it'd navigate to itself).
  const openSettings  = () => { if (currentScreen !== 'settings') { setSettingsFrom(currentScreen); setCurrentScreen('settings'); } };
  const closeSettings = () => setCurrentScreen(settingsFrom);
  // The header gear toggles Settings: a second press closes it (back to where it
  // was opened from), matching the Back arrow.
  const toggleSettings = () => (currentScreen === 'settings' ? closeSettings() : openSettings());

  // ── Data management (export / import / wipe) ─────────────────────────────────
  // The export doubles as the GDPR Art. 15 (access) and Art. 20 (portability) response —
  // the privacy policy points at this button for both — so it has to carry everything we
  // hold about the person, not just the rows the app draws charts from. `account` adds
  // the three things that used to be missing: the email address (which is the login and
  // is not in `prefs`), when the account was created, and the consent/acceptance record
  // that TERMS.md § 3.2 separately promises on request. It is a sibling key rather than
  // a change to the existing four, so `importData` — which reads only the keys it knows
  // and ignores the rest — still accepts a file written by this version.
  //
  // It returns `string | null` like the destructive handlers, and for the same reason:
  // this used to be `catch { /* ignore */ }`, so a failure (quota, a blocked download,
  // a revoked object URL) produced no file, no error and no report — the user pressed
  // the button that the privacy policy names as their access AND portability route and
  // nothing at all happened. A rights mechanism that can fail silently is worse than
  // one that is absent, because the absence is at least visible.
  const exportData = (): string | null => {
    try {
      // Refuse rather than hand over a copy that silently isn't one. If the server fetch
      // failed, state holds whatever the local cache had — possibly nothing — and this
      // file is what a user gets when they exercise Art. 15/20. In Settings an empty
      // dashboard is at least a visible cue; on the re-consent gate, where Export is the
      // ONLY affordance a refusing user has, there is no cue at all, and the JSON would
      // announce itself as the full copy. An access response that is quietly partial is
      // worse than a failed one, because nobody knows to ask again.
      if (hydrateFailed) {
        return "We couldn't reach the server, so this copy could be incomplete. Check your connection and try again rather than keeping a partial file.";
      }
      const meta = session?.user?.user_metadata ?? {};
      const payload = {
        app: 'FitPulse', version: 1, exportedAt: new Date().toISOString(),
        // What this file is, in the file itself — so a copy that outlives this
        // conversation still tells its holder what it does and does not contain.
        // Art. 15(1) wants the supplementary information (purposes, recipients,
        // retention, rights, complaint route) alongside the copy of the data; that
        // lives in the policy, and this points at it rather than duplicating a second
        // version of it that could drift.
        about: {
          note: 'Your FitPulse data, exported for GDPR Art. 15 (access) and Art. 20 (portability).',
          notIncluded: 'Infrastructure request logs (including IP addresses) are held by our providers, not by the app, and are not part of this file. Ask us and we will request them.',
          privacyPolicy: PRIVACY_URL,
          contact: PRIVACY_CONTACT,
        },
        account: {
          email: session?.user?.email ?? null,
          createdAt: session?.user?.created_at ?? null,
          lastSignInAt: session?.user?.last_sign_in_at ?? null,
          healthDataConsentAt: meta.health_data_consent_at ?? null,
          healthDataConsentVersion: meta.health_data_consent_version ?? null,
          termsAcceptedAt: meta.terms_accepted_at ?? null,
          termsVersion: meta.terms_version ?? null,
          ageConfirmedAt: meta.age_confirmed_at ?? null,
        },
        workouts, bodyWeightLog, weeklyGoal, prefs,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `fitpulse-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return null;
    } catch (e) {
      console.error('Export failed', e);
      reportError(e, { at: 'exportData' });
      return 'Export failed. If your browser blocked the download, allow it for this site and try again.';
    }
  };

  // Returns a promise so Settings can report success/failure to the user.
  const importData = (file: File): Promise<boolean> =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const d = JSON.parse(String(reader.result));
          if (!Array.isArray(d.workouts) || !session) { resolve(false); return; }
          // A backup we didn't write (or one from a future schema) can't be trusted
          // to mean what this code thinks it means. `app` was only added alongside
          // `version`, so a file carrying neither is an early export and is allowed.
          if (d.app != null && d.app !== 'FitPulse') { resolve(false); return; }
          if (d.version != null && d.version !== 1)  { resolve(false); return; }
          const uid = session.user.id;

          // Sanitise before we touch the account: a file that parsed but yields no
          // usable workouts is treated as invalid rather than a signal to wipe
          // everything — so a corrupt backup can't destroy existing data.
          const cleanWorkouts = d.workouts.map(cleanImportedWorkout).filter(Boolean);
          if (d.workouts.length && !cleanWorkouts.length) { resolve(false); return; }
          const cleanBW = (Array.isArray(d.bodyWeightLog) ? d.bodyWeightLog : [])
            .map(cleanImportedBW).filter(Boolean);
          // An import that would REPLACE everything with nothing is a truncated or
          // half-written file, not an intentional wipe — and the old guard above only
          // fires when `workouts` is non-empty, so `{"workouts":[]}` used to sail
          // through and delete the account. Wiping has its own button; this isn't it.
          if (!cleanWorkouts.length && !cleanBW.length) { resolve(false); return; }

          // Non-destructive replace: INSERT the new rows first, and only once every
          // insert has succeeded delete the old ones. A failed import then leaves the
          // account's existing data intact instead of wiping it between a delete and
          // a throw. Capture the pre-existing ids up front so the final delete removes
          // exactly the old set, not the rows we just added.
          const [{ data: oldW }, { data: oldBW }] = await Promise.all([
            supabase.from('workouts').select('id').eq('user_id', uid),
            supabase.from('body_weight_log').select('id').eq('user_id', uid),
          ]);
          const oldWIds  = (oldW  ?? []).map((r: any) => r.id);
          const oldBWIds = (oldBW ?? []).map((r: any) => r.id);

          let wRows: any[] = [];
          if (cleanWorkouts.length) {
            const { data, error } = await supabase.from('workouts').insert(cleanWorkouts.map(workoutToRow)).select();
            if (error) throw error;
            wRows = data ?? [];
          }
          // Undo the inserts we've already made. Its own failure must not mask the
          // error that triggered it, so it reports rather than throws — a rollback
          // that can't run is exactly the case where the user needs to be told the
          // account is now holding both sets of rows.
          const rollback = async (rows: any[], table: string) => {
            const ids = rows.map((r: any) => r.id);
            if (!ids.length) return true;
            const { error } = await supabase.from(table).delete().in('id', ids);
            if (error) { console.error(`Import rollback of ${table} failed`, error); reportError(error, { at: 'importRollback', table }); }
            return !error;
          };

          let bwRows: any[] = [];
          if (cleanBW.length) {
            const { data, error } = await supabase.from('body_weight_log')
              .insert(cleanBW.map(bwToRow)).select();
            if (error) {
              // Roll back the workouts we just inserted so a half-done import doesn't
              // leave new rows sitting duplicated alongside the still-present old set.
              await rollback(wRows, 'workouts');
              throw error;
            }
            bwRows = data ?? [];
          }

          // The settings upsert used to run AFTER the old rows were deleted, so its
          // failure reported "import failed" on an account that had already been
          // replaced. Write it while everything is still reversible.
          const goal     = Number.isFinite(d.weeklyGoal) ? clampGoal(d.weeklyGoal) : GOAL_DEFAULT;
          const prefsObj = sanitizePrefs(d.prefs);
          const { error: sErr } = await supabase.from('settings')
            .upsert({ user_id: uid, weekly_goal: goal, prefs: prefsObj, updated_at: new Date().toISOString() });
          if (sErr) {
            await rollback(bwRows, 'body_weight_log');
            await rollback(wRows, 'workouts');
            throw sErr;
          }

          // Every insert landed — now it's safe to drop the old rows. These deletes
          // used to discard their result, so a failure (offline, or an `in()` list
          // long enough to blow the URL limit) left the old rows in place next to the
          // new ones and still reported success: history silently doubled on the next
          // hydrate. Chunk the ids to stay well inside the query-string limit, and
          // treat a failure as a failed import.
          const deleteByIds = async (ids: string[], table: string) => {
            for (let i = 0; i < ids.length; i += 200) {
              const { error } = await supabase.from(table).delete().in('id', ids.slice(i, i + 200));
              if (error) throw error;
            }
          };
          try {
            await deleteByIds(oldWIds, 'workouts');
            await deleteByIds(oldBWIds, 'body_weight_log');
          } catch (delErr) {
            // The new rows are live and the old ones are (partly) still there. Undo the
            // import so the account is left as it was rather than holding both sets.
            await rollback(bwRows, 'body_weight_log');
            await rollback(wRows, 'workouts');
            throw delErr;
          }

          setWorkouts(wRows.map(rowToWorkout));
          setBodyWeightLog(bwRows.map(rowToBW));
          setWeeklyGoal(goal);
          setPrefs(prefsObj);
          resolve(true);
        } catch (e) { console.error('Import failed', e); resolve(false); }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });

  // Drop all in-memory data back to defaults — shared by a full wipe, sign-out, and
  // any session loss (expiry, revocation, sign-out in another tab). It must clear
  // EVERYTHING user-identifying: the localStorage cache is per-origin, not per-user,
  // so whatever survives here is what the next account to sign in on this browser
  // sees. That included the live session — the next user could land inside the
  // previous user's workout and press Finish, filing it under their own account.
  const resetLocalState = () => {
    setWorkouts([]);
    setBodyWeightLog([]);
    setWeeklyGoal(GOAL_DEFAULT);
    setPrefs(DEFAULT_PREFS);
    setCurrentWorkout(null);
    setSelectedWorkoutType(null);
    setWorkoutNotes('');
    setBodyWeight('');
    setQuickBWInput('');
    setCurrentScreen('home');
  };

  // Erase this account's data — server rows AND the device cache — while keeping the
  // login. Returns null on success or friendly error copy, like the other destructive
  // handlers, because a deletion the user was TOLD succeeded and which silently did not
  // is a GDPR Art. 17 / MHMDA failure, not a cosmetic bug. The old version swallowed
  // every delete error into console.error, cleared the local cache regardless, and let
  // the confirm close — so an offline wipe emptied the screen, convinced the user their
  // data was gone, and left every row on the server.
  const clearAllData = async (): Promise<string | null> => {
    // Delete the settings row BEFORE resetting state. The other order armed the
    // 600ms-debounced settings write-back (resetLocalState changes `prefs`), which
    // then recreated the row just after the DELETE landed — so the account kept a
    // settings row, `isFirstLogin` stayed false, and the user was never re-onboarded
    // despite every other trace of them being gone.
    if (session) {
      const uid = session.user.id;
      const results = await Promise.all([
        supabase.from('workouts').delete().eq('user_id', uid),
        supabase.from('body_weight_log').delete().eq('user_id', uid),
        supabase.from('settings').delete().eq('user_id', uid),
      ]);
      const failures = results.filter(({ error }: any) => error);
      if (failures.length) {
        // Stop here. Leaving the cache in place is deliberate: it is now the only
        // copy of anything that never reached the server, and the rows we failed to
        // delete are still up there — so wiping the screen would claim a deletion
        // that did not happen.
        failures.forEach(({ error }: any) => {
          console.error('Clear data failed', error);
          reportError(error, { at: 'clearAllData' });
        });
        // Deliberately not "nothing was deleted": the three deletes run in parallel and
        // some may have landed, so the only honest report is that it is incomplete.
        return "Couldn't delete everything — you may be offline. Some data may still be on the server. Please try again when you're back online.";
      }
      // The settings row is gone, so re-raise onboarding for this same signed-in user
      // rather than leaving them on a nameless dashboard until they sign out.
      setNeedsOnboarding(true);
    }
    resetLocalState();
    clearLocalCache();
    return null;
  };

  // End the session and drop the in-memory data (the next sign-in re-hydrates).
  const signOut = async () => {
    let failed = false;
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out failed', e);
      failed = true;
    }
    // Only clear on a sign-out that actually happened. If the call threw (offline),
    // supabase-js may have left the session in place — and clearing anyway used to
    // leave the user apparently still signed in, looking at an empty dashboard,
    // while the write-backs (still gated on a truthy `signedIn`) immediately
    // re-serialised those defaults over the cache we had just deleted.
    if (!failed) {
      setSession(null);          // don't wait for the event; the gate must close now
      resetLocalState();
      clearLocalCache();
    } else {
      flash("Couldn't sign out — you may be offline. Your data is untouched.");
    }
    setRecovery(false);   // signing out from the reset screen must clear the flag, or it re-pins us there
  };

  // Change the signed-in user's password (from Settings). Returns null on
  // success or friendly error copy — the component stays presentational.
  const changePassword = async (currentPassword: string, newPassword: string): Promise<string | null> => {
    // The project enforces "Require current password when changing password", so
    // updateUser must carry current_password — without it Supabase 400s with
    // current_password_required. (current_password isn't in supabase-js's typed
    // attributes yet, hence the cast.)
    const { error } = await supabase.auth.updateUser({
      current_password: currentPassword,
      password: newPassword,
    } as any);
    return error ? authErrorText(error) : null;
  };

  // Change the account's email address (GDPR Art. 16 — rectification). The provider
  // sends a confirmation link to the old address AND the new one, and the change only
  // commits when both are followed, so a typo cannot orphan the account. `onAuthStateChange`
  // delivers the updated session when the confirmation lands.
  //
  // Re-authenticate first, exactly as deleteAccount does, and for the same reason: an
  // email change is an account-takeover pivot. A session token alone lives in
  // localStorage, so a borrowed unlocked device has it — and if the provider's "Secure
  // email change" (confirm from BOTH addresses) is ever off, a single click moves the
  // login to an attacker's inbox and a password reset completes the takeover. Proving
  // knowledge of the current password closes that at the app layer even when the
  // dashboard setting lags. signInWithPassword refreshes THIS session rather than opening
  // a second one, so the updateUser below still runs as this user.
  const changeEmail = async (currentPassword: string, email: string): Promise<string | null> => {
    const addr = session?.user?.email;
    if (!addr) return 'You need to be signed in to change your email.';
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: addr, password: currentPassword });
    if (authErr) return authErrorText(authErr);

    const { error } = await supabase.auth.updateUser({ email });
    return error ? authErrorText(error) : null;
  };

  // Record acceptance of the versions currently in force, after a re-consent gate.
  // Writes the same metadata keys signUp does, so one shape of record covers both the
  // first acceptance and every later one; the consent-evidence effect then files the
  // matching append-only rows. `age_confirmed_at` is deliberately NOT re-stamped —
  // the user's age was confirmed once and does not change, and re-dating it would
  // destroy the original confirmation this record exists to preserve.
  const acceptCurrentPolicies = async (): Promise<string | null> => {
    const now = new Date().toISOString();
    const { error } = await supabase.auth.updateUser({
      data: {
        health_data_consent_at: now,
        health_data_consent_version: POLICY_VERSION,
        terms_accepted_at: now,
        terms_version: TERMS_VERSION,
      },
    });
    if (error) {
      console.error('Re-consent failed', error);
      reportError(error, { at: 'acceptCurrentPolicies' });
      return authErrorText(error);
    }
    setNeedsReconsent(false);
    return null;
  };

  // Permanently delete the signed-in user's account. The server-side
  // delete_account() RPC (see schema.sql) removes their auth.users row; the
  // cascade FKs wipe every workout/weigh-in/setting. Returns null on success or
  // friendly error copy. On success we sign out — which drops us to the login
  // gate and clears the in-memory + cached state.
  const deleteAccount = async (password: string): Promise<string | null> => {
    // Re-authenticate first. The RPC is SECURITY DEFINER and irreversible, and a
    // session token alone (which lives in localStorage, so a borrowed unlocked device
    // has it) was previously enough to invoke it. Re-signing in with the same email
    // proves the person at the keyboard knows the password; it refreshes the session
    // rather than creating a second one, so the RPC below still runs as this user.
    const email = session?.user?.email;
    if (!email) return 'You need to be signed in to delete your account.';
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    // Map properly rather than blaming the password for everything: this endpoint is
    // rate-limited, so a retry after one typo would otherwise report "incorrect
    // password" for the CORRECT password, and an offline attempt would say the same.
    if (authErr) return authErrorText(authErr);

    const { error } = await supabase.rpc('delete_account');
    if (error) {
      // Reported, not just logged. Four published documents promise immediate
      // self-service erasure, and the most likely cause of a failure here is that
      // migration 0002 was never run against prod — in which case this button has
      // never worked and nothing else would ever tell us. The copy names the
      // out-of-app route rather than only saying "try again", because a user who
      // came here to exercise a deletion right must leave with a way to exercise it.
      console.error('Delete account failed', error);
      reportError(error, { at: 'deleteAccount' });
      return `Could not delete your account. Please try again, or email us — see ${DELETE_REQUEST_URL} for the other ways to request deletion.`;
    }
    // Drop the local cache so a later signup on this device can't re-migrate the
    // deleted account's data. signOut clears it again after the state reset settles,
    // which is what makes the wipe stick — the write-backs are gated on `session`, so
    // nothing re-serialises the defaults over these keys in between.
    clearLocalCache();
    await signOut();
    return null;
  };

  // ── Derived stats ────────────────────────────────────────────────────────────
  // A streak tolerates up to this many days between sessions (rest days). The SAME
  // threshold gates both the gap from today and the gaps between sessions, so the
  // head and body checks agree on what "still going" means (they used to differ —
  // 1 day vs 2 — which let a streak read as alive while its head check killed it).
  const STREAK_GAP_DAYS = 2;
  const getWorkoutStreak = () => {
    const todayMs = startOfDayMs(new Date());

    // Drop unparseable dates before they reach the maths. One of them (an imported
    // "last tuesday") produced NaN here, and because every NaN comparison is false
    // the head check below could not declare the streak broken — so a user who
    // hadn't trained in months still read as being on a streak.
    const uniqueDays = [...new Set(
      workouts
        .map((w: any) => startOfDayMs(new Date(w.date)))
        .filter((ms: number) => Number.isFinite(ms))
    )].sort((a, b) => b - a);
    if (uniqueDays.length === 0) return 0;

    // Broken if the most recent session is already beyond the rest-day tolerance.
    // A future-dated session (clock skew, a hand-edited import) gives a negative
    // gap, which must not read as "trained recently" — clamp it to today.
    if (daysBetween(todayMs, Math.min(uniqueDays[0], todayMs)) > STREAK_GAP_DAYS) return 0;

    let streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      if (daysBetween(uniqueDays[i - 1], uniqueDays[i]) <= STREAK_GAP_DAYS) streak++;
      else break;
    }
    return streak;
  };

  // Sessions in a trailing window. Bounded at BOTH ends: the upper bound stops a
  // future-dated session (clock skew, or a hand-edited backup) counting toward a
  // week it isn't in — which let the goal tile read 100% off sessions that hadn't
  // happened yet. An unparseable date is excluded rather than compared as NaN.
  const workoutsSince = (days: number) => {
    // Step the DATE, don't subtract milliseconds. `startOfDayMs(now) - n*86400000`
    // lands at 23:00 or 01:00 of the target day across a DST boundary, so a session
    // logged in the first or last hour of the window fell in or out arbitrarily —
    // the same class of bug `daysBetween` exists to avoid.
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    const cutoff = startOfDayMs(from);
    const now = Date.now();
    return workouts.filter((w: any) => {
      const t = new Date(w.date).getTime();
      return Number.isFinite(t) && t >= cutoff && t <= now;
    });
  };

  // Sessions logged in the trailing 7 days — the raw count (used by the plates tile)
  // and the goal percentage (capped at 100, used by every other tile). Measured in
  // whole calendar days rather than 7×24h from the current time of day, so a session
  // doesn't drop out of "this week" partway through the day it was logged on.
  const weeklyCount = workoutsSince(7).length;
  const getWeeklyGoalProgress = () =>
    weeklyGoal > 0 ? Math.min((weeklyCount / weeklyGoal) * 100, 100) : 0;

  // The dashboard muscle-focus donut is scoped to the last 30 days — a rolling
  // "what have I been hitting lately" read, distinct from Progress's selectable
  // window. The heading carries the range so the number isn't mistaken for all-time.
  const last30Workouts = workoutsSince(30);

  // The most recent session by actual date, not array position — every "latest"
  // readout keys off this so an out-of-order workouts array (e.g. a re-appended
  // orphan) can't mislabel "Last session"/"Last type".
  const latestWorkout: any = workouts.length
    ? workouts.reduce((a: any, b: any) => (new Date(b.date).getTime() >= new Date(a.date).getTime() ? b : a))
    : null;

  const getDaysSinceLastWorkout = () => {
    if (!latestWorkout) return 'No workouts yet';
    const lastDay  = startOfDayMs(new Date(latestWorkout.date));
    if (!Number.isFinite(lastDay)) return '—';
    const diff = daysBetween(startOfDayMs(new Date()), lastDay);
    if (diff <= 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
  };

  // The weigh-in log in date order, oldest first. The stored array is in INSERTION
  // order, which stops matching date order the moment a back-dated entry is appended
  // — editing a three-month-old session's body weight pushed that entry to the end,
  // and the charts below (which just walk the array) then drew a line that jumped
  // backwards across the whole X axis. Everything date-ordered reads this.
  const bwByDate = useMemo(
    () => [...bodyWeightLog]
      .filter(e => Number.isFinite(new Date(e.date).getTime()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [bodyWeightLog]
  );

  // Latest logged body weight in kg, or null. The card converts to display units.
  const latestBodyWeightKg: number | null = bwByDate.length === 0 ? null : bwByDate[bwByDate.length - 1].weight;

  const getLatestWorkoutType = () => {
    if (!latestWorkout) return '—';
    return labelForType(latestWorkout.type, prefs.dayNames);
  };

  // Body weight chart data for home — the 15 most RECENT entries by date (not the
  // last 15 inserted), in display units.
  const bwChartData = bwByDate.slice(-15).map(e => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    bodyWeight: Math.round((toDisplayWeight(e.weight, units) as number) * 10) / 10,
  }));

  const entryTypeCfg  = { label: labelForType(selectedWorkoutType ?? 'custom', prefs.dayNames) };

  // What each exercise was last logged at, keyed by stable id — the reference line
  // on a session card ("Last: 80 × 8 · 80 × 8"), so you know what to beat without
  // leaving the session. Newest wins, so the walk is oldest-first.
  const lastByExercise = useMemo(() => {
    const map: Record<string, { date: string; sets: any[] }> = bareMap();
    [...workouts]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(w => (w.exercises ?? []).forEach((ex: any) => {
        if (ex.sets?.length) map[exerciseIdOf(ex)] = { date: w.date, sets: ex.sets };
      }));
    return map;
  }, [workouts]);

  // Which split's days the home card offers. An account that already has history
  // predates the pref, and its sessions are push/pull/legs — so it reads as PPL
  // rather than being stopped by a chooser. The inference stays here (nothing
  // writes `split` implicitly), so the pref keeps meaning "the user picked this".
  const splitId       = prefs.split || (workouts.length ? 'ppl' : '');
  const choosingSplit = pickingSplit || !splitId;

  // A typed body weight the parser won't accept (negative, zero, past the storable
  // ceiling). Drives the Log button's disabled state and the message beneath it.
  const quickBWInvalid = quickBWInput !== '' && fromInputBodyWeight(quickBWInput, units) == null;

  const goalPct    = getWeeklyGoalProgress();
  const goalMet    = goalPct >= 100;
  const streak     = getWorkoutStreak();
  const inSession  = currentScreen === 'workout' || currentScreen === 'enterBodyWeight';

  // Keep the browser tab label in step with the current gate / screen — see
  // documentTitleFor. Must run before the early returns below (it's a hook), and
  // its inputs are the same ones those returns branch on.
  useEffect(() => {
    document.title = documentTitleFor({
      settling: !authReady || (!hydrated && !prefs.name),
      configured: supabaseEnabled,
      recovery,
      signedIn: !!session,
      onboarding: needsOnboarding,
      reconsent: needsReconsent && reconsentDue(),
      screen: currentScreen,
    });
  }, [authReady, hydrated, prefs.name, recovery, session, needsOnboarding, needsReconsent, currentScreen]);

  // Auth/config gates. Every hook above runs on each render, so these early
  // returns are safe. Missing env → config help; still checking → loader;
  // reset link in progress → set-new-password (checked before !session because
  // a recovery link carries a real session we must not let through); signed out
  // → login.
  if (!supabaseEnabled) return <ConfigError />;
  if (!authReady)       return <FullScreenLoader />;
  if (recovery)         return <ResetPasswordScreen onDone={() => setRecovery(false)} onSignOut={signOut} />;
  if (!session && !DEV_AUTH_BYPASS) return <LoginScreen />;
  // `needsOnboarding` is set asynchronously by the hydrate effect (after it learns
  // there's no server settings row), so until hydrate resolves the render would fall
  // through to the dashboard and flash it. Show a NEUTRAL loader during that window —
  // not the onboarding card, which would greet a returning user (signed out, or a
  // fresh device with no cached name) with "Welcome / set up your profile" while
  // their hydrate is in flight. Gate on `!prefs.name` (the un-onboarded default) so a
  // returning user with a cached name keeps their instant cache-painted dashboard.
  if (!hydrated && !prefs.name) return <FullScreenLoader />;
  // First login on a brand-new account: greet once for name/units/gender. Set in
  // the hydrate effect, so prefs are already loaded (units prefill). updatePrefs
  // persists via the existing localStorage + debounced Supabase write-backs.
  if (needsOnboarding)  return <OnboardingScreen initialPrefs={prefs} onDone={(patch: any) => { updatePrefs(patch); setNeedsOnboarding(false); }} />;
  // The policies have moved on since this user agreed. Placed AFTER onboarding: a
  // brand-new account was stamped with the current versions seconds ago, so it never
  // reaches this gate, and a returning user meets one gate rather than two. It sits
  // before the app because §12 promises acceptance *before* a material change takes
  // effect — showing the dashboard first and asking afterwards would be exactly the
  // "rely on continued use as consent" that the same sentence rules out.
  // Only once the new versions are actually IN FORCE. Between a bump and its effective
  // date the user keeps full access and sees the banner below instead — TERMS.md § 16.2
  // promises 30 days' notice and § 16.3 promises the current version stays usable until
  // then, and a gate that raised on deploy would break both.
  if (needsReconsent && reconsentDue()) {
    return (
      <ReconsentScreen
        onAccept={acceptCurrentPolicies}
        onSignOut={signOut}
        onExport={exportData}
        // Withdrawing consent has to be reachable from the screen that asks for it —
        // Settings is behind this gate, and signing out deletes nothing (Art. 7(3)).
        onDeleteAccount={deleteAccount}
      />
    );
  }

  // Any row saved on this device but not confirmed by the server (a failed write).
  // Drives the persistent banner below — it clears itself when a retry succeeds.
  const unsyncedCount =
    workouts.filter((w: any) => w._sync === 'error').length +
    bodyWeightLog.filter((e: any) => e._sync === 'error').length;

  return (
    <div className="min-h-screen bg-ground text-ink">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* A 20kg plate, seen face on. */}
            <span className="grid h-6 w-6 place-items-center rounded-full bg-accent" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-surface" />
            </span>
            <span className="font-display text-xl font-bold uppercase tracking-[0.08em] text-ink">FitPulse</span>
          </div>
          <div className="flex items-center">
            <button
              onClick={toggle}
              className="p-2 rounded-ctl text-muted hover:text-ink transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {/* Hidden during a session — leaving to Settings mid-workout used to
                strand the in-progress session with no way back. */}
            {!inSession && (
              <button
                onClick={toggleSettings}
                className={`p-2 -mr-2 rounded-ctl transition-colors ${currentScreen === 'settings' ? 'text-accent' : 'text-muted hover:text-ink'}`}
                aria-label={currentScreen === 'settings' ? 'Close settings' : 'Settings'}
                aria-current={currentScreen === 'settings' ? 'page' : undefined}
              >
                <Settings size={17} />
              </button>
            )}
          </div>
        </div>
        {/* Knurling — the grip band on a bar. */}
        <div className="knurl h-[3px] opacity-70" aria-hidden="true" />
      </header>

      {/* Policy change announced but not yet in force. This is the § 16.2 notice
          surface in the app: the user keeps full access until POLICIES_EFFECTIVE_FROM,
          and is told before then rather than meeting a gate with no warning. Once the
          date passes, the ReconsentScreen gate replaces this. */}
      {needsReconsent && !reconsentDue() && (
        <div role="status" className="bg-accent/10 border-b border-accent/30">
          <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-2 text-accent">
            <FileText size={15} className="flex-shrink-0" />
            <span className="text-xs font-medium">
              We've updated our{' '}
              <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="underline">Terms</a>
              {' '}and{' '}
              <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>.
              They take effect on {new Date(POLICIES_EFFECTIVE_FROM).toLocaleDateString()} — nothing changes for you until then.
            </span>
          </div>
        </div>
      )}

      {/* Persistent sync warning — shown whenever a write is saved on this device
          but hasn't reached the server. Clears itself once a retry succeeds. */}
      {unsyncedCount > 0 && !cacheWriteFailed && (
        <div role="status" className="bg-warn/15 border-b border-warn/30">
          <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-2 text-warn">
            <CloudOff size={15} className="flex-shrink-0" />
            <span className="text-xs font-medium">
              {unsyncedCount} change{unsyncedCount !== 1 ? 's' : ''} saved on this device only — not synced yet. They'll upload when you're back online.
            </span>
            {/* A failed hydrate no longer self-heals on the next tab focus (that churn
                was removed deliberately), so offer the retry explicitly. */}
            <button onClick={reHydrate} className="ml-auto shrink-0 rounded-chip border border-warn/40 px-2 py-0.5 text-[11px] font-semibold hover:bg-warn/10">
              Retry now
            </button>
          </div>
        </div>
      )}

      {/* The stronger warning: the on-device cache itself couldn't be written (quota
          full, or Safari private browsing where setItem always throws). The banner
          above would be actively wrong here — nothing is saved anywhere, so a reload
          loses it. This used to be a swallowed catch. */}
      {cacheWriteFailed && (
        <div role="alert" className="bg-crit/15 border-b border-crit/30">
          <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-2 text-crit">
            <CloudOff size={15} className="flex-shrink-0" />
            <span className="text-xs font-medium">
              This device's storage is full or unavailable, so nothing is being saved locally.
              {unsyncedCount > 0
                ? ` ${unsyncedCount} unsynced change${unsyncedCount !== 1 ? 's' : ''} would be lost by a reload — reconnect before closing the app.`
                : ' Your sessions still sync to the server while you’re online.'}
            </span>
          </div>
        </div>
      )}

      {/* ── Home ── */}
      {currentScreen === 'home' && (
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-24 flex flex-col gap-3">

          {/* Greeting — only once the user has set a name at onboarding. */}
          {prefs.name && (
            <h2 className="font-display text-2xl font-bold text-ink -mb-1 truncate">Hi, {prefs.name}</h2>
          )}

          {/* Stat row */}
          {!prefs.hidden.includes('dash.stats') && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { key: 'streak', caption: 'Streak',   value: streak,          unit: streak === 1 ? 'day' : 'days' },
              { key: 'week' },   // the goal tile is rendered by WeekGoalTile — it draws its own value/unit
              { key: 'total',  caption: 'Sessions', value: workouts.length, unit: 'all time' },
            ].map(({ key, caption, value, unit }) => (
              key === 'week' ? (
                <WeekGoalTile key="week" style={prefs.goalCardStyle} pct={goalPct} met={goalMet} count={weeklyCount} goal={weeklyGoal} />
              ) : (
                <div key={key} className={`${card} p-3 sm:p-4 flex flex-col items-center text-center min-h-[132px] sm:min-h-[148px]`}>
                  <span className={`${label} text-[10px]`}>{caption}</span>
                  <p className={`${readout} text-5xl sm:text-6xl leading-none my-auto text-accent`}>{value}</p>
                  <p className="text-[11px] text-faint">{unit}</p>
                </div>
              )
            ))}
          </div>
          )}

          {/* Start a session — the reason the app is open. Which days appear is the
              user's split; until one is chosen (or inferred) this card is the chooser. */}
          <div className={`${card} p-4`}>
            <h2 className={`${label} mb-3`}>{choosingSplit ? 'Choose your split' : renamingDays ? 'Name your days' : 'Start a session'}</h2>

            {choosingSplit ? (
              <div className="grid grid-cols-2 gap-2">
                {SPLITS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { updatePrefs({ split: s.id }); setPickingSplit(false); }}
                    className={`flex flex-col justify-end text-left p-4 min-h-[84px] rounded-ctl border bg-raised active:scale-[0.99] transition-all ${s.id === splitId ? 'border-accent' : 'border-line hover:border-accent'}`}
                  >
                    <span className="block font-semibold text-sm text-ink">{s.label}</span>
                    <span className="block text-[11px] mt-1 leading-tight text-faint">{s.sub}</span>
                  </button>
                ))}
              </div>
            ) : renamingDays ? (
              /* Rename — the tile order, one row each. The name is display-only:
                 it's stored against the type id, so history keeps its thread. */
              <div className="flex flex-col gap-2">
                {daysOfSplit(splitId).map(({ name, label: defaultLabel }) => (
                  <div key={name} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={prefs.dayNames[name] ?? ''}
                      onChange={e => renameDay(name, e.target.value)}
                      placeholder={defaultLabel}
                      aria-label={`Name for ${defaultLabel}`}
                      maxLength={24}
                      className={`${input} flex-1 py-2 text-sm`}
                    />
                    <button
                      onClick={() => renameDay(name, '')}
                      disabled={!prefs.dayNames[name]}
                      aria-label={`Reset ${defaultLabel} to its default name`}
                      title="Reset to default"
                      className="p-2 text-faint hover:text-ink disabled:opacity-30 disabled:hover:text-faint transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <p className="text-xs text-faint">Renaming is display only — past sessions keep their history.</p>
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-2">
              {daysOfSplit(splitId).map(({ name, sub }) => (
                <button
                  key={name}
                  onClick={() => startWorkout(name)}
                  className="group relative overflow-hidden flex flex-col justify-end text-left p-4 min-h-[112px] rounded-ctl border border-line bg-raised hover:border-accent active:scale-[0.99] transition-all"
                >
                  <span className="relative">
                    <span className="block font-semibold text-sm text-ink">{labelForType(name, prefs.dayNames)}</span>
                    <span className="block text-[11px] mt-1 leading-tight text-faint">{sub}</span>
                  </span>
                </button>
              ))}
            </div>
            )}

            {/* The card's own controls. They sit under the tiles, not beside the
                heading — starting a session is the card's job, these are the ways
                out of it — but the primary one carries the accent so it reads as an
                action, not fine print. */}
            <div className="flex gap-2 mt-3">
              {(!choosingSplit || splitId) && (
                <button
                  onClick={() => { if (renamingDays) { setRenamingDays(false); return; } setPickingSplit(!choosingSplit); }}
                  className={`${btnPrimary} ${label} !text-accent-ink flex-1 py-2.5`}
                >
                  {renamingDays ? 'Done' : choosingSplit ? 'Cancel' : 'Change split'}
                </button>
              )}
              {!choosingSplit && !renamingDays && (
                <button
                  onClick={() => setRenamingDays(true)}
                  className={`${btnSecondary} ${label} !text-ink px-4 py-2.5`}
                >
                  Rename days
                </button>
              )}
            </div>
          </div>

          {/* Muscle focus — scoped to the last 30 days, so it reads as a recent
              training-balance snapshot. Progress carries the selectable window. */}
          {workouts.length > 0 && !prefs.hidden.includes('dash.muscle') && (
            <div className={`${card} p-4`}>
              <h3 className={`${label} mb-3`}>Muscle focus · Last 30 days</h3>
              <MuscleGroupDonut workouts={last30Workouts} theme={theme} prefs={prefs} metric={prefs.muscleMetric} units={units} size={150} sliceLimit={5} emptyMessage="No sets logged in the last 30 days." />
            </div>
          )}

          {/* Body weight */}
          {!prefs.hidden.includes('dash.bodyweight') && (
          <div className={`${card} p-4`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className={label}>Body weight</h3>
              <div className="flex items-baseline gap-1">
                <span className={`${readout} text-2xl ${latestBodyWeightKg == null ? '' : 'text-accent'}`}>{latestBodyWeightKg == null ? '—' : trim1(toDisplayWeight(latestBodyWeightKg, units) as number)}</span>
                {latestBodyWeightKg != null && <span className="text-[11px] font-semibold text-accent/70">{units}</span>}
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="number" min="0" step="0.1" inputMode="decimal"
                placeholder={`Log today's weight (${units})`}
                aria-label={`Log today's body weight in ${units}`}
                value={quickBWInput}
                onChange={e => setQuickBWInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && logBodyWeight()}
                className={`${input} flex-1 py-2 text-sm`}
              />
              <button
                onClick={logBodyWeight}
                disabled={!quickBWInput || quickBWInvalid}
                className={`${btnPrimary} px-4 text-sm disabled:bg-raised disabled:text-faint disabled:cursor-not-allowed disabled:brightness-100`}
              >
                Log
              </button>
            </div>
            {/* logBodyWeight silently returns on an unusable value, so say why rather
                than letting the Log button look broken. */}
            {quickBWInvalid && (
              <p role="alert" className="-mt-2 mb-3 text-[11px] text-crit">
                Enter a body weight between 0 and {trim1(toDisplayWeight(MAX_WEIGHT_KG, units) as number)} {units}.
              </p>
            )}

            {bwChartData.length >= 2 ? (
              <BodyWeightTrend data={bwChartData} theme={theme} prefs={prefs} chartType={prefs.bwChart} units={units} height={140} compact />
            ) : (
              <p className="text-xs text-faint text-center py-6">Log two entries to see a trend.</p>
            )}

            {/* Manage entries — the only place to correct or remove a mistyped
                weight, since a data point is otherwise permanent. */}
            {bodyWeightLog.length > 0 && (
              <div className="mt-3 pt-3 border-t border-line">
                <button
                  onClick={() => setManageBW(v => !v)}
                  aria-expanded={manageBW}
                  className="flex items-center gap-2 text-muted hover:text-ink text-xs font-medium transition-colors"
                >
                  {manageBW ? 'Hide entries' : `Edit entries (${bodyWeightLog.length})`}
                  <ChevronDown size={12} className={`transition-transform ${manageBW ? 'rotate-180' : ''}`} />
                </button>
                {manageBW && (
                  <ul className="mt-2 flex flex-col gap-1 max-h-48 overflow-y-auto">
                    {[...bodyWeightLog]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(e => (
                        <li key={e.id} className="flex items-center justify-between gap-2 bg-raised rounded-ctl px-3 py-1.5">
                          <span className="text-xs text-muted tabular-nums">
                            {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-ink tabular-nums">{trim1(toDisplayWeight(e.weight, units) as number)} {units}</span>
                            <button
                              onClick={() => deleteBodyWeightEntry(e.id)}
                              aria-label={`Delete body weight entry from ${new Date(e.date).toLocaleDateString()}`}
                              className="-m-1.5 p-1.5 text-faint hover:text-crit transition-colors"
                            >
                              <X size={13} />
                            </button>
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          )}

          {/* Session log — quiet reference, so it sits last. */}
          {!prefs.hidden.includes('dash.log') && (
          <div className={`${card} p-4`}>
            <h3 className={`${label} mb-3`}>Log</h3>
            <dl className="flex flex-col">
              {[
                { term: 'Last session', value: getDaysSinceLastWorkout() },
                { term: 'Last type',    value: getLatestWorkoutType()    },
              ].map(row => (
                <div key={row.term} className="flex justify-between items-center py-2 border-b border-line">
                  <dt className="text-sm text-muted">{row.term}</dt>
                  <dd className="text-sm font-semibold text-ink tabular-nums">{row.value}</dd>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3">
                <dt className="text-sm text-muted">Weekly goal</dt>
                <dd className="flex items-center gap-2">
                  <button
                    onClick={() => setWeeklyGoal(g => Math.max(GOAL_MIN, g - 1))}
                    aria-label="Decrease weekly goal"
                    className="w-7 h-7 rounded-ctl bg-raised border border-line hover:border-accent grid place-items-center text-muted hover:text-ink transition-colors leading-none"
                  >−</button>
                  <span className="text-sm font-semibold text-ink w-16 text-center tabular-nums">{weeklyGoal} / week</span>
                  <button
                    onClick={() => setWeeklyGoal(g => Math.min(GOAL_MAX, g + 1))}
                    aria-label="Increase weekly goal"
                    className="w-7 h-7 rounded-ctl bg-raised border border-line hover:border-accent grid place-items-center text-muted hover:text-ink transition-colors leading-none"
                  >+</button>
                </dd>
              </div>
            </dl>
          </div>
          )}
        </div>
      )}

      {/* ── Enter Body Weight ── */}
      {currentScreen === 'enterBodyWeight' && (
        <div className="max-w-md mx-auto px-4 py-10">
          <div className={`${card} p-6`}>
            <div className="mb-6">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-ink leading-none">{entryTypeCfg.label}</h2>
              <p className="text-xs text-faint mt-1.5">Weigh in, or skip to start</p>
            </div>

            <label htmlFor="entry-bw" className={`${label} block mb-2`}>Body weight ({units}) — optional</label>
            <input
              id="entry-bw"
              type="number" min="0" step="0.1" inputMode="decimal"
              value={bodyWeight}
              onChange={e => setBodyWeight(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmBodyWeight()}
              className={`${input} w-full font-display text-3xl font-bold tabular-nums text-center py-4 !text-accent`}
              placeholder={units === 'lb' ? '182' : '82.5'}
              autoFocus
            />

            <div className="flex gap-2 mt-5">
              <button
                onClick={confirmBodyWeight}
                className={`${btnPrimary} flex-1 p-3.5`}
              >
                {bodyWeight ? 'Start session' : 'Skip & start'}
              </button>
              <button onClick={cancelWorkout} className={`${btnSecondary} px-5 p-3.5`}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Workout ── */}
      {currentScreen === 'workout' && currentWorkout && (
        <WorkoutScreen
          workout={currentWorkout}
          workoutType={selectedWorkoutType!}
          addExercise={addExercise}
          addSet={addSet}
          removeSet={removeSet}
          removeExercise={removeExercise}
          moveExercise={moveExercise}
          updateExerciseNotes={updateExerciseNotes}
          finishWorkout={finishWorkout}
          cancelWorkout={cancelWorkout}
          workoutNotes={workoutNotes}
          setWorkoutNotes={setWorkoutNotes}
          patchWorkout={patchCurrentWorkout}
          lastByExercise={lastByExercise}
          dayNames={prefs.dayNames}
          units={units}
          restTimer={prefs.restTimer}
          restSeconds={prefs.restSeconds}
          workoutTimer={prefs.workoutTimer}
        />
      )}

      {/* ── History ── */}
      {currentScreen === 'history' && (
        <HistoryScreen workouts={workouts} deleteWorkout={deleteWorkout} updateWorkout={updateWorkout} units={units} split={splitId} dayNames={prefs.dayNames} />
      )}

      {/* ── Progress ── */}
      {currentScreen === 'progress' && (
        <ProgressScreen workouts={workouts} bodyWeightLog={bodyWeightLog} theme={theme} prefs={prefs} />
      )}

      {/* ── Settings ── */}
      {currentScreen === 'settings' && (
        <SettingsScreen
          prefs={prefs} updatePrefs={updatePrefs} toggleHidden={toggleHidden}
          theme={theme} themeMode={mode} setThemeMode={setMode}
          onExport={exportData} onImport={importData} onClearData={clearAllData}
          onSignOut={signOut} onChangePassword={changePassword} onChangeEmail={changeEmail} onDeleteAccount={deleteAccount} userEmail={session?.user?.email}
          consentAt={session?.user?.user_metadata?.health_data_consent_at}
          consentVersion={session?.user?.user_metadata?.health_data_consent_version}
          termsAt={session?.user?.user_metadata?.terms_accepted_at}
          termsVersion={session?.user?.user_metadata?.terms_version}
          onDone={closeSettings}
        />
      )}

      {/* ── Bottom Tab Bar ── */}
      {!inSession && (
        <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line z-50">
          <div className="max-w-3xl mx-auto flex">
            {[
              { label: 'Dashboard', screen: 'home',     Icon: Dumbbell   },
              { label: 'History',   screen: 'history',  Icon: Calendar   },
              { label: 'Progress',  screen: 'progress', Icon: TrendingUp },
            ].map(({ label: tabLabel, screen, Icon }) => {
              const active = currentScreen === screen;
              return (
                <button
                  key={screen}
                  onClick={() => setCurrentScreen(screen)}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex-1 flex flex-col items-center gap-1 pt-3 pb-safe transition-colors"
                >
                  {/* The selected edge — reads before the colour does. */}
                  <span className={`absolute top-0 h-[2px] w-10 rounded-chip transition-colors ${active ? 'bg-accent' : 'bg-transparent'}`} />
                  <Icon size={19} className={active ? 'text-accent' : 'text-faint'} />
                  <span className={`font-display text-[11px] font-semibold uppercase tracking-[0.1em] ${active ? 'text-accent' : 'text-faint'}`}>
                    {tabLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Transient toast — self-healing failures (a delete that bounced back).
          Auto-clears after a few seconds via `flash`. */}
      {notice && (
        <div className="fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 pointer-events-none">
          <div role="status" className="pointer-events-auto flex items-center gap-2 rounded-ctl bg-raised border border-line px-3 py-2 shadow-lg">
            <CloudOff size={15} className="flex-shrink-0 text-warn" />
            <span className="text-xs font-medium text-ink">{notice}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ErrorBoundary ─────────────────────────────────────────────────────────────
// Without one, ANY render/effect throw unmounts the whole tree and leaves a blank
// white page with no way back — and the throws that matter here are the ones fed by
// persisted state (a corrupt cache, a hostile backup, a prefs blob that syncs from
// the server), so a reload reproduces the crash forever. Hence the second button:
// dropping the local caches is the one recovery a user can perform themselves, and
// it's safe because the server is the source of truth for everything except
// device-only unsynced rows. `resetTokens` also strips the pre-paint theme stamp,
// which is what a poisoned appearance pref would have corrupted.
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: any) {
    console.error('App crashed', error, info);
    reportError(error, { boundary: 'root', componentStack: info?.componentStack });
    try { document.title = 'Something broke — FitPulse'; } catch { /* ignore */ }
  }

  private recover = () => {
    try {
      [STORAGE_KEY, BW_LOG_KEY, GOAL_KEY, PREFS_KEY, ACTIVE_KEY, THEME_KEY, THEME_VARS_KEY]
        .forEach(k => localStorage.removeItem(k));
    } catch { /* ignore */ }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center p-4">
        <div className={`${card} w-full max-w-md p-6 text-center animate-fade-rise`}>
          <h1 className="font-display text-xl font-bold uppercase tracking-wide text-ink">Something broke</h1>
          <p className="mt-2 text-sm text-muted">
            The app hit an error it couldn't recover from. Your workouts are saved on the server — reloading is safe.
          </p>
          <p className="mt-3 rounded-ctl bg-raised p-2 text-left text-[11px] font-mono text-faint break-words">
            {this.state.error.message || String(this.state.error)}
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button onClick={() => window.location.reload()} className={`${btnPrimary} p-3`}>Reload</button>
            <button onClick={this.recover} className={`${btnSecondary} p-3`}>Reload and clear this device's cache</button>
          </div>
          <p className="mt-3 text-[11px] text-faint">
            Clearing the cache only removes local copies. Anything not yet synced to the server would be lost.
          </p>
        </div>
      </div>
    );
  }
}

const GymTrackerAppWithBoundary = () => (
  <ErrorBoundary><GymTrackerApp /></ErrorBoundary>
);

export default GymTrackerAppWithBoundary;
