import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, TrendingUp, Dumbbell, Calendar, FileText, Edit2, Save, Target, Activity, ChevronRight, ChevronDown, Flame, Layers, Maximize2, Anchor, Mountain, Sun, Moon, Settings, ChevronLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

// Vite hashes and copies these into dist/assets at build time.
import pushImg from '../Assets/pexels-tima-miroshnichenko-5327522.jpg';
import pullImg from '../Assets/pexels-zeal-creative-studios-58866141-34043598.jpg';
import legsImg from '../Assets/pexels-kong-khawlhring-3896794-5799855.jpg';
import customImg from '../Assets/pexels-koolshooters-8544616.jpg';

// The catalogue, grouped by muscle. The groups are the picker's structure — a
// flat 80-item alphabetical list buries Box Squat between Barbell Row and
// Bulgarian Split Squat.
//
// Grouped by what the muscle actually does, not by where a given listicle files
// it — chest flyes are pressing (push); pullovers are lat-driven (pull).
// Names are the identity used in stored workouts: add freely, but renaming one
// orphans it from every session already logged under the old string.
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
      'Wide Grip Push-ups', 'Diamond Push-ups', 'Plyometric Push-ups',
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

// Stored workouts keep only an exercise name, so to tally by muscle we need the
// reverse of the catalogue: name → group. Built once at load. Names are unique
// across ALL_GROUPS (they're React keys too), so there are no collisions.
const EXERCISE_GROUP_INDEX: Record<string, string> = Object.fromEntries(
  ALL_GROUPS.flatMap(g => g.items.map(name => [name, g.group]))
);

// A free-text exercise the user typed isn't in the catalogue — it lands here.
const OTHER_GROUP = 'Other';

// The muscle-group breakdown, by whichever metric the user picked, sorted
// most-trained first. Pure and takes an already date-filtered list, so both the
// Progress and Home cards reuse it — the caller decides the window.
//   sets     — a plank set counts like a squat set; the even-handed default.
//   volume   — reps × weight; heavy but zeroes bodyweight/cardio (no load logged).
//   sessions — how many separate workouts touched the group (once each).
type MuscleMetric = 'sets' | 'volume' | 'sessions';

const muscleGroupBreakdown = (workouts: any[], metric: MuscleMetric): { group: string; value: number; pct: number }[] => {
  const totals: Record<string, number> = {};
  for (const w of workouts) {
    const seen = new Set<string>();
    for (const ex of w.exercises) {
      const g = EXERCISE_GROUP_INDEX[ex.name] ?? OTHER_GROUP;
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

// Seven days in a week, and almost nobody trains twice in one.
const GOAL_MIN = 1;
const GOAL_MAX = 7;
const THEME_KEY   = 'gym-theme';

// User-chosen view settings, all set from the Settings screen. Persisted as one
// JSON blob and merged over DEFAULT_PREFS on load, so adding a field later never
// breaks data saved by an older build.
type Units = 'kg' | 'lb';
type Prefs = {
  units: Units;
  hidden: string[];              // widget keys the user hid (see WIDGET_LABELS)
  muscleMetric: MuscleMetric;
  bwChart: 'line' | 'bar';
  accent: string;                // ACCENTS id
  base: string;                  // BASES id (neutral palette)
  semantics: string;             // SEMANTICS id (good/warn/crit set)
  restTimer: boolean;            // start a rest countdown after each set
  restSeconds: number;           // its default duration
};
const DEFAULT_PREFS: Prefs = {
  units: 'kg', hidden: [], muscleMetric: 'sets', bwChart: 'line',
  accent: 'blue', base: 'graphite', semantics: 'plates', restTimer: true, restSeconds: 90,
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

// A number that is meant to be read at arm's length, mid-set.
const readout = 'font-display font-bold tabular-nums leading-none text-ink';

const TYPE_CONFIG: Record<string, { label: string; Icon: any; color: string; iconBg: string }> = {
  push:   { label: 'Push Day', Icon: Maximize2, color: 'text-accent', iconBg: 'bg-accent/10' },
  pull:   { label: 'Pull Day', Icon: Anchor,    color: 'text-accent', iconBg: 'bg-accent/10' },
  legs:   { label: 'Leg Day',  Icon: Mountain,  color: 'text-accent', iconBg: 'bg-accent/10' },
  custom: { label: 'Custom',   Icon: Layers,    color: 'text-muted',  iconBg: 'bg-raised'    },
};

// Home-screen session picker. A tile with `img` renders the photo full-bleed;
// one without stays a flat surface.
//
// `pos` is the crop knob, per photo — the tile is a wide letterbox, so only a
// horizontal band of each shot survives. Lower % = image sits lower in the box,
// subject drops in frame. It must be a literal class string for Tailwind's
// scanner to emit the rule.
type SessionType = { name: string; label: string; sub: string; img?: string; pos?: string };

const SESSION_TYPES: SessionType[] = [
  { name: 'push',   label: 'Push Day', sub: 'Chest · Shoulders · Triceps', img: pushImg, pos: 'object-[center_80%]' },
  { name: 'pull',   label: 'Pull Day', sub: 'Back · Biceps · Deadlifts',   img: pullImg, pos: 'object-[center_50%]' },
  { name: 'legs',   label: 'Leg Day',  sub: 'Quads · Hamstrings · Glutes', img: legsImg, pos: 'object-[center_55%]' },
  { name: 'custom', label: 'Custom',   sub: 'Build your own',              img: customImg, pos: 'object-[center_55%]' },
];

// Recharts takes colour strings, not classes, so the tokens are mirrored here.
// `cat` is the donut's categorical sequence — assigned to slices in fixed order,
// never cycled. The order is CVD-safe by adjacency (validated with the dataviz
// palette checker in both themes: worst adjacent ΔE 9.1 light / 8.4 dark). Slot 0
// is the app's accent blue, so the chart still reads as FitPulse. Don't reorder
// or hand-edit these without re-running the validator.
const CHART = {
  dark:  { accent: '#2E7BD6', series2: '#E0A63C', grid: '#26313A', axis: '#5A6874', surface: '#151C21', line: '#26313A', muted: '#8B9AA7',
           cat: ['#3987e5', '#008300', '#d55181', '#c98500', '#199e70', '#d95926', '#9085e9'] },
  light: { accent: '#1B5FBF', series2: '#A9741F', grid: '#D7DEE3', axis: '#93A1AC', surface: '#FFFFFF', line: '#D7DEE3', muted: '#5A6874',
           cat: ['#2a78d6', '#008300', '#e87ba4', '#eda100', '#1baf7a', '#eb6834', '#4a3aa7'] },
};

// Accent presets. Each is a light+dark pair; the token strings are RGB triplets
// (dropped straight into `--accent` / `--accent-ink`), `hex` mirrors the accent for
// charts. Red and green are excluded so an accent never impersonates crit/good.
// Every ink/accent contrast was checked against WCAG (worst ink-on-accent 4.23,
// worst accent-on-surface 4.03) — don't hand-edit without re-checking. The donut's
// categorical palette is deliberately NOT re-tinted (it's CVD-validated as a set);
// only the single-series exercise line follows the accent.
const WHITE_INK = '255 255 255';
const DARK_INK  = '13 18 21';
type AccentTone = { accent: string; ink: string; hex: string };
const ACCENTS: Record<string, { label: string; light: AccentTone; dark: AccentTone }> = {
  blue:    { label: 'Blue',    light: { accent: '27 95 191',  ink: WHITE_INK, hex: '#1B5FBF' }, dark: { accent: '46 123 214',  ink: WHITE_INK, hex: '#2E7BD6' } },
  indigo:  { label: 'Indigo',  light: { accent: '67 56 202',  ink: WHITE_INK, hex: '#4338CA' }, dark: { accent: '129 140 248', ink: DARK_INK,  hex: '#818CF8' } },
  violet:  { label: 'Violet',  light: { accent: '109 40 217', ink: WHITE_INK, hex: '#6D28D9' }, dark: { accent: '139 92 246',  ink: WHITE_INK, hex: '#8B5CF6' } },
  magenta: { label: 'Magenta', light: { accent: '162 28 175', ink: WHITE_INK, hex: '#A21CAF' }, dark: { accent: '210 75 224',  ink: DARK_INK,  hex: '#D24BE0' } },
  pink:    { label: 'Pink',    light: { accent: '190 24 93',  ink: WHITE_INK, hex: '#BE185D' }, dark: { accent: '244 114 182', ink: DARK_INK,  hex: '#F472B6' } },
  rose:    { label: 'Rose',    light: { accent: '190 18 60',  ink: WHITE_INK, hex: '#BE123C' }, dark: { accent: '251 113 133', ink: DARK_INK,  hex: '#FB7185' } },
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
  purple:  { label: 'Purple',  light: { accent: '126 34 206', ink: WHITE_INK, hex: '#7E22CE' }, dark: { accent: '168 85 247',  ink: WHITE_INK, hex: '#A855F7' } },
  slate:   { label: 'Slate',   light: { accent: '71 85 105',  ink: WHITE_INK, hex: '#475569' }, dark: { accent: '124 139 160', ink: DARK_INK,  hex: '#7C8BA0' } },
};
const ACCENT_IDS = Object.keys(ACCENTS);
const accentTone = (id: string, theme: Theme): AccentTone => (ACCENTS[id] ?? ACCENTS.blue)[theme];

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
    light: { tokens: { '--ground':'242 240 239','--surface':'255 255 254','--raised':'236 235 233','--line':'222 220 218','--ink':'19 17 15','--muted':'106 101 96','--faint':'162 158 154' }, chart: { surface:'#fffffe', line:'#dedcda', grid:'#dedcda', axis:'#6a6560', muted:'#6a6560' } },
    dark:  { tokens: { '--ground':'19 17 14','--surface':'29 26 24','--raised':'40 37 34','--line':'50 47 43','--ink':'237 236 233','--muted':'155 151 146','--faint':'107 101 95' }, chart: { surface:'#1d1a18', line:'#322f2b', grid:'#322f2b', axis:'#9b9792', muted:'#9b9792' } } },
  slate: { label: 'Slate',
    light: { tokens: { '--ground':'238 241 244','--surface':'253 255 255','--raised':'233 235 239','--line':'218 221 226','--ink':'14 17 22','--muted':'95 103 113','--faint':'153 159 167' }, chart: { surface:'#fdffff', line:'#dadde2', grid:'#dadde2', axis:'#5f6771', muted:'#5f6771' } },
    dark:  { tokens: { '--ground':'14 17 22','--surface':'23 27 33','--raised':'33 38 45','--line':'42 48 55','--ink':'233 236 240','--muted':'146 153 162','--faint':'94 103 115' }, chart: { surface:'#171b21', line:'#2a3037', grid:'#2a3037', axis:'#9299a2', muted:'#9299a2' } } },
  carbon: { label: 'Carbon',
    light: { tokens: { '--ground':'240 240 240','--surface':'255 255 255','--raised':'235 235 235','--line':'221 221 221','--ink':'17 17 17','--muted':'102 102 102','--faint':'159 159 159' }, chart: { surface:'#ffffff', line:'#dddddd', grid:'#dddddd', axis:'#666666', muted:'#666666' } },
    dark:  { tokens: { '--ground':'17 17 17','--surface':'27 27 27','--raised':'38 38 38','--line':'47 47 47','--ink':'236 236 236','--muted':'152 152 152','--faint':'102 102 102' }, chart: { surface:'#1b1b1b', line:'#2f2f2f', grid:'#2f2f2f', axis:'#989898', muted:'#989898' } } },
  rose: { label: 'Rose',
    light: { tokens: { '--ground':'242 240 240','--surface':'255 255 255','--raised':'237 234 234','--line':'223 220 220','--ink':'19 16 16','--muted':'108 100 100','--faint':'163 157 157' }, chart: { surface:'#ffffff', line:'#dfdcdc', grid:'#dfdcdc', axis:'#6c6464', muted:'#6c6464' } },
    dark:  { tokens: { '--ground':'20 16 16','--surface':'30 26 26','--raised':'42 36 36','--line':'52 46 46','--ink':'238 235 235','--muted':'157 150 150','--faint':'109 99 100' }, chart: { surface:'#1e1a1a', line:'#342e2e', grid:'#342e2e', axis:'#9d9696', muted:'#9d9696' } } },
  sage: { label: 'Sage',
    light: { tokens: { '--ground':'239 241 240','--surface':'254 255 254','--raised':'234 236 234','--line':'219 221 220','--ink':'16 18 16','--muted':'98 104 99','--faint':'156 160 157' }, chart: { surface:'#fefffe', line:'#dbdddc', grid:'#dbdddc', axis:'#626863', muted:'#626863' } },
    dark:  { tokens: { '--ground':'15 18 16','--surface':'25 28 25','--raised':'35 39 36','--line':'44 49 45','--ink':'234 237 235','--muted':'148 153 149','--faint':'97 104 98' }, chart: { surface:'#191c19', line:'#2c312d', grid:'#2c312d', axis:'#949995', muted:'#949995' } } },
  ocean: { label: 'Ocean',
    light: { tokens: { '--ground':'238 241 242','--surface':'253 255 255','--raised':'232 236 237','--line':'217 222 223','--ink':'14 18 19','--muted':'94 104 108','--faint':'153 160 163' }, chart: { surface:'#fdffff', line:'#d9dedf', grid:'#d9dedf', axis:'#5e686c', muted:'#5e686c' } },
    dark:  { tokens: { '--ground':'13 18 20','--surface':'22 28 30','--raised':'32 39 41','--line':'41 49 52','--ink':'233 237 238','--muted':'144 154 157','--faint':'92 104 109' }, chart: { surface:'#161c1e', line:'#293134', grid:'#293134', axis:'#909a9d', muted:'#909a9d' } } },
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

// Resolve every customizable CSS token for a theme, from the user's choices. One
// place so the runtime effect and the pre-paint stamp stay in agreement.
const resolveThemeVars = (accent: string, base: string, semantics: string, theme: Theme): Record<string, string> => {
  const a = accentTone(accent, theme);
  const b = (BASES[base] ?? BASES.graphite)[theme];
  const s = (SEMANTICS[semantics] ?? SEMANTICS.plates)[theme];
  return { ...b.tokens, '--accent': a.accent, '--accent-ink': a.ink, '--good': s.good, '--warn': s.warn, '--crit': s.crit };
};

// Recharts reads hex, not CSS tokens — so charts get their neutrals from the base
// and their accent from the accent choice. series2 (bodyweight amber) and the
// donut's CVD-validated `cat` palette are deliberately fixed.
const resolveChart = (prefs: { accent: string; base: string } | undefined, theme: Theme) => {
  const fixed = CHART[theme];
  if (!prefs) return fixed;
  const b = (BASES[prefs.base] ?? BASES.graphite)[theme].chart;
  return { ...fixed, accent: accentTone(prefs.accent, theme).hex, surface: b.surface, line: b.line, grid: b.grid, axis: b.axis, muted: b.muted };
};

const volumeOf = (exercise: any) =>
  exercise.sets.reduce((sum: number, s: any) => sum + (s.reps || 0) * (s.weight || 0), 0);

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
const fromInputWeight = (val: string, units: Units): number | null => {
  if (val.trim() === '') return null;
  const n = parseFloat(val);
  if (Number.isNaN(n)) return null;
  return units === 'lb' ? n * KG_PER_LB : n;
};

// Trim a display number to 1 dp, dropping a trailing .0.
const trim1 = (n: number) => {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};

// A stored kg weight, formatted for display. null → "Bodyweight".
const fmtWeight = (kg: number | null, units: Units): string =>
  kg == null ? 'Bodyweight' : `${trim1(toDisplayWeight(kg, units) as number)} ${units}`;

// Total training volume (stored kg), in the display units. Tonnes only apply to kg.
const fmtVolume = (kg: number, units: Units = 'kg') => {
  if (units === 'lb') {
    const lb = kg * LB_PER_KG;
    return lb >= 100000 ? `${(lb / 1000).toFixed(1)}k lb` : `${Math.round(lb)} lb`;
  }
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)} kg`;
};

// The donut's centre/tooltip/legend label for a metric value.
const metricValueLabel = (metric: MuscleMetric, value: number, units: Units): string =>
  metric === 'volume'   ? fmtVolume(value, units)
  : metric === 'sessions' ? `${value} session${value !== 1 ? 's' : ''}`
  : `${value} set${value !== 1 ? 's' : ''}`;

// ─── useTheme ──────────────────────────────────────────────────────────────────
// Follows the OS until the user picks a side, then stays pinned to their choice.
type Theme = 'light' | 'dark';

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const useTheme = () => {
  const [pinned, setPinned] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved === 'light' || saved === 'dark';
    } catch { return false; }
  });

  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* ignore */ }
    return prefersDark() ? 'dark' : 'light';
  });

  // While unpinned the CSS media query already handles the paint; this keeps the
  // chart colours in step with it.
  useEffect(() => {
    if (pinned) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [pinned]);

  useEffect(() => {
    if (pinned) document.documentElement.dataset.theme = theme;
  }, [theme, pinned]);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setPinned(true);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  };

  return { theme, toggle };
};

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
        <button onClick={onRemove} aria-label={`Remove set ${index + 1}`} className="text-faint hover:text-crit transition-colors">
          <X size={15} />
        </button>
      ) : <span className="w-[15px]" />}
    </div>
  );
};

// ─── ExerciseCard ──────────────────────────────────────────────────────────────
const ExerciseCard = ({ exercise, exerciseIndex, addSet, removeSet, removeExercise, updateExerciseNotes, units = 'kg' }: any) => {
  const [reps, setReps]     = useState('');
  const [weight, setWeight] = useState('');

  // Abs can be loaded or not, so weight is optional for them — reps alone is a
  // complete set.
  const weightOptional = BODYWEIGHT_OPTIONAL.has(exercise.name);
  const canAddSet      = !!reps && (weightOptional || !!weight);

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
        </div>
        <button
          onClick={() => removeExercise(exerciseIndex)}
          aria-label={`Remove ${exercise.name}`}
          className="p-1.5 -m-1.5 text-faint hover:text-crit transition-colors flex-shrink-0"
        >
          <Trash2 size={16} />
        </button>
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
          type="number" inputMode="numeric" placeholder="Reps" aria-label="Reps"
          value={reps} onChange={e => setReps(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddSet()}
          className={`${input} col-span-2 text-center text-sm`}
        />
        <input
          type="number" inputMode="decimal" step="0.1"
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

// ─── WorkoutScreen ─────────────────────────────────────────────────────────────
const WorkoutScreen = ({ workout, workoutType, addExercise, addSet, removeSet, removeExercise, updateExerciseNotes, finishWorkout, cancelWorkout, workoutNotes, setWorkoutNotes, units = 'kg', restTimer = false, restSeconds = 90 }: any) => {
  const [showExerciseList, setShowExerciseList]     = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [showCancelConfirm, setShowCancelConfirm]   = useState(false);
  const [openGroup, setOpenGroup]                   = useState<string | null>(null);

  // Rest timer — a between-sets countdown. The one interval in the app; keep it
  // session-level (not per card), and always clear the ref so it can't leak or
  // double up. `rest` is seconds remaining, or null when idle.
  const [rest, setRest]   = useState<number | null>(null);
  const restRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearRest = () => { if (restRef.current) { clearInterval(restRef.current); restRef.current = null; } };
  const startRest = () => {
    if (!restTimer) return;
    clearRest();
    setRest(restSeconds);
    restRef.current = setInterval(() => {
      setRest(r => {
        if (r == null) return r;
        if (r <= 1) { clearRest(); if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200); return null; }
        return r - 1;
      });
    }, 1000);
  };
  const bumpRest = (delta: number) => setRest(r => (r == null ? r : Math.max(0, r + delta)));
  useEffect(() => clearRest, []);   // clear on unmount (leaving the workout)

  // Logging a set starts the rest countdown.
  const addSetAndRest = (...args: any[]) => { (addSet as any)(...args); startRest(); };

  const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const cfg                = TYPE_CONFIG[workoutType] ?? TYPE_CONFIG.custom;
  const WorkoutIcon        = cfg.Icon;
  const availableGroups: ExerciseGroup[] = workoutType === 'custom' ? ALL_GROUPS : EXERCISES[workoutType] ?? [];

  // The one input does triple duty: it matches muscle groups ("chest" opens the
  // whole Chest group), falls back to matching exercise names, and the + button
  // still commits whatever you typed as a one-off. Filtering keeps the grouping —
  // empty groups drop out rather than leaving a bare heading.
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

  const totalVolume = workout.exercises.reduce((sum: number, ex: any) => sum + volumeOf(ex), 0);
  const totalSets   = workout.exercises.reduce((sum: number, ex: any) => sum + ex.sets.length, 0);

  const handleAddCustomExercise = () => {
    const name = customExerciseName.trim();
    if (name) {
      addExercise(name);
      setCustomExerciseName('');
      setShowExerciseList(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-36">

      {/* Session header — the running totals lead, the detail follows. */}
      <div className={`${card} p-4 mb-3`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <WorkoutIcon size={16} className={cfg.color} />
              <h2 className={label}>{cfg.label}</h2>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className={`${readout} text-4xl`}>{fmtVolume(totalVolume, units)}</span>
              <span className="text-xs font-semibold text-muted">moved</span>
            </div>
          </div>
          <div className="text-right">
            <p className={label}>Body wt</p>
            <p className={`${readout} text-xl mt-1`}>{fmtWeight(workout.bodyWeight, units)}</p>
            <p className="text-xs text-faint mt-2 tabular-nums">{totalSets} set{totalSets !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowExerciseList(v => !v)}
        className={`${btnSecondary} w-full p-3.5 mb-3 flex items-center justify-center gap-2`}
      >
        <Plus size={18} className={showExerciseList ? 'rotate-45 transition-transform' : 'transition-transform'} />
        {showExerciseList ? 'Close' : 'Add Exercise'}
      </button>

      {/* Exercise picker */}
      {showExerciseList && (
        <div className={`${card} mb-3 overflow-hidden`}>
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
                            onClick={() => { addExercise(ex); setCustomExerciseName(''); setShowExerciseList(false); }}
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

      <div className="flex flex-col gap-3">
        {workout.exercises.map((exercise: any, i: number) => (
          <ExerciseCard
            key={i}
            exercise={exercise}
            exerciseIndex={i}
            addSet={addSetAndRest}
            removeSet={removeSet}
            removeExercise={removeExercise}
            updateExerciseNotes={updateExerciseNotes}
            units={units}
          />
        ))}
      </div>

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
          countdown rides just above it while it's running. */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line pb-safe z-40">
        {rest != null && (
          <div className="border-b border-line">
            <div className="max-w-3xl mx-auto flex items-center gap-3 px-3 py-2">
              <span className={`${label} text-accent`}>Rest</span>
              <span className={`${readout} text-xl text-accent tabular-nums`}>{fmtClock(rest)}</span>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => bumpRest(-15)} className={`${btnSecondary} px-3 py-1.5 text-xs`}>−15s</button>
                <button onClick={() => bumpRest(15)} className={`${btnSecondary} px-3 py-1.5 text-xs`}>+15s</button>
                <button onClick={() => { clearRest(); setRest(null); }} className={`${btnSecondary} px-3 py-1.5 text-xs`}>Skip</button>
              </div>
            </div>
          </div>
        )}
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
                disabled={workout.exercises.length === 0}
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
const HistoryScreen = ({ workouts, deleteWorkout, updateWorkout, units = 'kg' }: any) => {
  const [expandedWorkout, setExpandedWorkout] = useState<number | null>(null);
  const [viewingNotes, setViewingNotes]       = useState<number | null>(null);
  const [editingWorkout, setEditingWorkout]   = useState<number | null>(null);
  const [editData, setEditData]               = useState<any>(null);

  // Display order is newest-first, but the mutators index into the unsorted
  // array — so originalIndex has to survive the sort.
  const sortedWorkouts = workouts
    .map((w: any, i: number) => ({ ...w, originalIndex: i }))
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const toggleWorkout = (i: number) => {
    setExpandedWorkout(expandedWorkout === i ? null : i);
    setViewingNotes(null);
    setEditingWorkout(null);
  };

  const startEditing = (i: number, w: any) => {
    setEditingWorkout(i);
    setEditData(JSON.parse(JSON.stringify(w)));
  };

  const cancelEditing = () => { setEditingWorkout(null); setEditData(null); };

  const saveEditing = (i: number) => {
    updateWorkout(sortedWorkouts[i].originalIndex, editData);
    setEditingWorkout(null);
    setEditData(null);
  };

  const handleDelete = (i: number) => {
    if (window.confirm('Delete this workout?')) {
      deleteWorkout(sortedWorkouts[i].originalIndex);
      setExpandedWorkout(null);
      setEditingWorkout(null);
    }
  };

  const updateSetValue = (exIdx: number, setIdx: number, field: string, val: string) => {
    const u = { ...editData };
    // Weight is typed in display units and stored in kg (blank → bodyweight/null);
    // reps are just an integer.
    u.exercises[exIdx].sets[setIdx][field] =
      field === 'weight' ? fromInputWeight(val, units) : parseFloat(val);
    setEditData(u);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const editInput = 'bg-raised border border-line rounded-ctl px-2 py-1.5 text-ink text-center text-sm tabular-nums focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors';

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4">
      <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-ink mb-4">History</h2>

      {sortedWorkouts.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <p className="text-muted text-sm">No sessions logged yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sortedWorkouts.map((workout: any, index: number) => {
            const isEditing      = editingWorkout === index;
            const displayWorkout = isEditing ? editData : workout;
            const typeCfg        = TYPE_CONFIG[workout.type] ?? TYPE_CONFIG.custom;
            const isOpen         = expandedWorkout === index;
            const sessionVolume  = workout.exercises.reduce((s: number, ex: any) => s + volumeOf(ex), 0);

            return (
              <div key={index} className={`${card} overflow-hidden`}>
                <button
                  onClick={() => toggleWorkout(index)}
                  aria-expanded={isOpen}
                  className="w-full p-4 text-left hover:bg-raised/60 transition-colors"
                >
                  <div className="flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-ink truncate">{typeCfg.label}</h3>
                      <p className="text-xs text-faint mt-0.5">{formatDate(workout.date)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className={`${readout} text-lg`}>{fmtVolume(sessionVolume, units)}</p>
                        <p className="text-xs text-faint mt-0.5 tabular-nums">
                          {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ChevronRight size={16} className={`text-faint transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-line">
                    <div className="p-3 border-b border-line flex gap-2 flex-wrap">
                      {!isEditing ? (
                        <button
                          onClick={e => { e.stopPropagation(); startEditing(index, workout); }}
                          className={`${btnSecondary} flex items-center gap-2 px-3 py-1.5 text-sm`}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                      ) : (
                        <>
                          <button onClick={e => { e.stopPropagation(); saveEditing(index); }} className={`${btnPrimary} flex items-center gap-2 px-3 py-1.5 text-sm`}>
                            <Save size={13} /> Save
                          </button>
                          <button onClick={e => { e.stopPropagation(); cancelEditing(); }} className={`${btnSecondary} flex items-center gap-2 px-3 py-1.5 text-sm`}>
                            <X size={13} /> Cancel
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(index); }} className={`${btnDanger} flex items-center gap-2 px-3 py-1.5 text-sm ml-auto`}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </>
                      )}
                    </div>

                    {isEditing && (
                      <div className="p-4 border-b border-line">
                        <label htmlFor={`bw-${index}`} className={`${label} block mb-2`}>Body weight ({units})</label>
                        <input
                          id={`bw-${index}`}
                          type="number" step="0.1" inputMode="decimal"
                          value={editData.bodyWeight == null ? '' : trim1(toDisplayWeight(editData.bodyWeight, units) as number)}
                          onChange={e => setEditData({ ...editData, bodyWeight: fromInputWeight(e.target.value, units) })}
                          className={`${input} w-full`}
                        />
                      </div>
                    )}

                    {displayWorkout.notes && (
                      <div className="p-4 border-b border-line">
                        <button
                          onClick={() => setViewingNotes(viewingNotes === index ? null : index)}
                          className="flex items-center gap-2 text-muted hover:text-ink text-sm font-medium transition-colors"
                        >
                          <FileText size={14} className="text-accent" />
                          {viewingNotes === index ? 'Hide notes' : 'View notes'}
                          <ChevronDown size={13} className={`transition-transform ${viewingNotes === index ? 'rotate-180' : ''}`} />
                        </button>
                        {(viewingNotes === index || isEditing) && (
                          isEditing ? (
                            <textarea
                              value={editData.notes}
                              onChange={e => setEditData({ ...editData, notes: e.target.value })}
                              className={`${input} w-full mt-3 min-h-20 resize-none text-sm`}
                            />
                          ) : (
                            <p className="mt-3 text-sm text-muted bg-raised rounded-ctl p-3">{displayWorkout.notes}</p>
                          )
                        )}
                      </div>
                    )}

                    <div className="p-4 flex flex-col gap-5">
                      {displayWorkout.exercises.map((exercise: any, exIdx: number) => {
                        const topWeight = exercise.sets.length
                          ? Math.max(...exercise.sets.map((s: any) => s.weight))
                          : null;

                        return (
                          <div key={exIdx}>
                            <div className="flex justify-between items-center gap-3 mb-2">
                              <h4 className="font-semibold text-ink text-sm">{exercise.name}</h4>
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
                                      <input type="number" inputMode="numeric" aria-label="Reps" value={set.reps} onChange={e => updateSetValue(exIdx, si, 'reps', e.target.value)} className={`${editInput} w-14`} />
                                      <span className="text-faint text-sm">×</span>
                                      {/* '' keeps this controlled when the set is bodyweight; value shows display units. */}
                                      <input type="number" inputMode="decimal" step="0.1" aria-label="Weight (blank for bodyweight)" placeholder="BW" value={set.weight == null ? '' : trim1(toDisplayWeight(set.weight, units) as number)} onChange={e => updateSetValue(exIdx, si, 'weight', e.target.value)} className={`${editInput} w-16`} />
                                      <span className="text-muted text-xs font-semibold">{units}</span>
                                      <button
                                        onClick={() => { const u = { ...editData }; u.exercises[exIdx].sets.splice(si, 1); setEditData(u); }}
                                        aria-label={`Remove set ${si + 1}`}
                                        className="text-faint hover:text-crit transition-colors ml-1"
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

                            {exercise.notes && (
                              isEditing ? (
                                <textarea
                                  value={exercise.notes}
                                  onChange={e => { const u = { ...editData }; u.exercises[exIdx].notes = e.target.value; setEditData(u); }}
                                  className={`${input} w-full text-sm min-h-16 resize-none mt-2`}
                                />
                              ) : (
                                <p className="text-xs text-faint mt-2 pl-1">{exercise.notes}</p>
                              )
                            )}

                            {exIdx < displayWorkout.exercises.length - 1 && (
                              <div className="h-px bg-line mt-4" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
const MuscleGroupDonut = ({ workouts, theme, prefs, metric = 'sets', units = 'kg', size = 220, sliceLimit = 6, legendLimit, emptyMessage = 'No sets logged yet.' }: any) => {
  const c    = resolveChart(prefs, theme);
  const data = muscleGroupBreakdown(workouts, metric);

  if (data.length === 0) {
    return <p className="text-xs text-faint text-center py-6">{emptyMessage}</p>;
  }

  // A ring of thirteen 2%-slivers is unreadable, so keep the top few and fold the
  // rest (plus any real "Other") into a single trailing slice.
  const top       = data.slice(0, sliceLimit).filter(d => d.group !== OTHER_GROUP);
  const folded    = data.filter(d => !top.includes(d)).reduce((n, d) => n + d.value, 0);
  const total     = data.reduce((n, d) => n + d.value, 0);
  const slices    = folded > 0
    ? [...top, { group: OTHER_GROUP, value: folded, pct: (folded / total) * 100 }]
    : top;

  // The catch-all recedes to the muted neutral; real groups take catalogue hues in
  // fixed order. One helper feeds both the slices and the legend swatches, so a
  // group's ring colour and its legend dot never drift apart.
  const colorAt = (group: string, i: number) =>
    group === OTHER_GROUP ? c.muted : c.cat[i % c.cat.length];

  const legendRows = legendLimit ? data.slice(0, legendLimit) : data;
  // The legend indexes the full ranked list, but colours must match the ring — so
  // map each legend group back to its slice position (folded groups get muted).
  const sliceIndexOf = (group: string) => slices.findIndex(s => s.group === group);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices} dataKey="value" nameKey="group"
              innerRadius="62%" outerRadius="88%" paddingAngle={1.5}
              startAngle={90} endAngle={-270}
              stroke={c.surface} strokeWidth={2} isAnimationActive={false}
            >
              {slices.map((d, i) => <Cell key={d.group} fill={colorAt(d.group, i)} />)}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: c.surface, border: `1px solid ${c.line}`, borderRadius: '6px', fontFamily: 'Barlow, system-ui, sans-serif', fontSize: '12px' }}
              labelStyle={{ color: c.muted }}
              formatter={(v: any, _n: any, p: any) => [`${metricValueLabel(metric, v, units)} · ${Math.round(p.payload.pct)}%`, p.payload.group]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Centre readout — the metric total in the hole. Overlay so it needs no
            chart colour; pointer-events-none keeps slice hovers alive underneath. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`${readout} text-2xl`}>{metric === 'volume' ? fmtVolume(total, units).replace(/ (kg|lb)$/, '') : total}</span>
          <span className={`${label} text-[10px] mt-0.5`}>{metric === 'volume' ? units : metric}</span>
        </div>
      </div>

      <ul className="w-full flex flex-col gap-1.5">
        {legendRows.map(d => {
          const si = sliceIndexOf(d.group);
          const swatch = si >= 0 ? colorAt(d.group, si) : c.muted;
          return (
            <li key={d.group} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-chip flex-shrink-0" style={{ background: swatch }} />
              <span className="text-ink truncate">{d.group}</span>
              <span className="ml-auto tabular-nums text-muted flex-shrink-0">
                {metric === 'volume' ? fmtVolume(d.value, units) : d.value}<span className="text-faint"> · {Math.round(d.pct)}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ─── BodyWeightTrend ─────────────────────────────────────────────────────────────
// The body-weight chart, as a line or bars per the user's choice. Shared by the
// Home sparkline (compact) and the Progress card. `data` arrives already in display
// units, so this only draws. Bars reuse the line's colour — no palette change.
const BodyWeightTrend = ({ data, theme, prefs, chartType = 'line', units = 'kg', height = 220, compact = false }: any) => {
  const c = resolveChart(prefs, theme);
  const font = { fontSize: compact ? '10px' : '11px', fontFamily: 'Barlow, system-ui, sans-serif' };
  const margin = { top: 4, right: compact ? 4 : 8, left: compact ? -20 : -12, bottom: 0 };
  const chrome = (
    <>
      <CartesianGrid strokeDasharray="2 4" stroke={c.grid} vertical={false} />
      <XAxis dataKey="date" stroke={c.axis} tickLine={false} style={font} />
      <YAxis stroke={c.axis} tickLine={false} width={compact ? 38 : 44} domain={['dataMin - 1', 'dataMax + 1']} style={font} unit={compact ? undefined : ` ${units}`} />
      <Tooltip
        contentStyle={{ backgroundColor: c.surface, border: `1px solid ${c.line}`, borderRadius: '6px', fontFamily: 'Barlow, system-ui, sans-serif', fontSize: '12px' }}
        labelStyle={{ color: c.muted }}
        cursor={{ stroke: c.grid }}
        formatter={(v: any) => [`${v} ${units}`, 'Body weight']}
      />
    </>
  );
  return (
    <ResponsiveContainer width="100%" height={height}>
      {chartType === 'bar' ? (
        <BarChart data={data} margin={margin}>
          {chrome}
          <Bar dataKey="bodyWeight" fill={c.series2} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      ) : (
        <LineChart data={data} margin={margin}>
          {chrome}
          <Line type="monotone" dataKey="bodyWeight" stroke={c.series2} strokeWidth={2} dot={{ fill: c.series2, r: compact ? 2.5 : 3, strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
};

// ─── ProgressScreen ────────────────────────────────────────────────────────────
const ProgressScreen = ({ workouts, bodyWeightLog, theme, prefs }: any) => {
  const { units = 'kg', muscleMetric = 'sets', bwChart = 'line', hidden = [] } = prefs ?? {};
  const accent = resolveChart(prefs, theme).accent;
  const [timeframe, setTimeframe]               = useState('30days');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [customStartDate, setCustomStartDate]   = useState('');
  const [customEndDate, setCustomEndDate]       = useState('');

  const c = resolveChart(prefs, theme);

  const allExercisesUsed = [...new Set(
    workouts.flatMap((w: any) => w.exercises.map((e: any) => e.name))
  )].sort() as string[];

  const filterByDate = <T extends { date: string }>(items: T[]): T[] => {
    const now = new Date();
    if (timeframe === 'custom') {
      if (!customStartDate || !customEndDate) return [];
      const s = new Date(customStartDate), e = new Date(customEndDate);
      return items.filter(i => { const d = new Date(i.date); return d >= s && d <= e; });
    }
    const start = new Date();
    if (timeframe === '30days')  start.setDate(now.getDate() - 30);
    if (timeframe === '3months') start.setMonth(now.getMonth() - 3);
    return items.filter(i => new Date(i.date) >= start);
  };

  const getExerciseData = () => {
    if (!selectedExercise) return [];
    return filterByDate(workouts).flatMap((w: any) => {
      const ex = w.exercises.find((e: any) => e.name === selectedExercise);
      if (!ex || ex.sets.length === 0) return [];
      // Bodyweight sets carry no load, so they count as 0 here rather than NaN.
      const maxWeight    = Math.max(...ex.sets.map((s: any) => s.weight ?? 0));
      const maxWeightSet = ex.sets.find((s: any) => (s.weight ?? 0) === maxWeight);
      return [{
        date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        maxWeight: Math.round((toDisplayWeight(maxWeight, units) as number) * 10) / 10,
        repsAtMaxWeight: maxWeightSet?.reps ?? 0,
      }];
    });
  };

  const getBodyWeightData = () =>
    filterByDate(bodyWeightLog).map((e: any) => ({
      date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      bodyWeight: Math.round((toDisplayWeight(e.weight, units) as number) * 10) / 10,
    }));

  const exerciseData   = getExerciseData();
  const bodyWeightData = getBodyWeightData();

  const tooltipStyle = {
    backgroundColor: c.surface,
    border: `1px solid ${c.line}`,
    borderRadius: '6px',
    fontFamily: 'Barlow, system-ui, sans-serif',
    fontSize: '12px',
  };

  const axis = { stroke: c.axis, style: { fontSize: '11px', fontFamily: 'Barlow, system-ui, sans-serif' } };

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4">
      <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-ink mb-4">Progress</h2>

      <div className={`${card} p-4 mb-3`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="timeframe" className={`${label} block mb-2`}>Timeframe</label>
            <select id="timeframe" value={timeframe} onChange={e => setTimeframe(e.target.value)} className={`${input} w-full`}>
              <option value="30days">Last 30 days</option>
              <option value="3months">Last 3 months</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          <div>
            <label htmlFor="exercise" className={`${label} block mb-2`}>Exercise</label>
            <select id="exercise" value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} className={`${input} w-full`}>
              <option value="">Choose an exercise…</option>
              {allExercisesUsed.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>
        </div>
        {timeframe === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-line">
            <div>
              <label htmlFor="start" className={`${label} block mb-2`}>Start</label>
              <input id="start" type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className={`${input} w-full text-sm`} />
            </div>
            <div>
              <label htmlFor="end" className={`${label} block mb-2`}>End</label>
              <input id="end" type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className={`${input} w-full text-sm`} />
            </div>
          </div>
        )}
      </div>

      {/* Where the sets went — the tab's overview, so it sits above the per-exercise
          detail. filterByDate makes it honour the timeframe selector for free. */}
      {workouts.length > 0 && !hidden.includes('prog.muscle') && (
        <div className={`${card} p-4 mb-3`}>
          <h3 className={`${label} mb-4`}>Muscle group balance</h3>
          <MuscleGroupDonut
            workouts={filterByDate(workouts)}
            theme={theme}
            prefs={prefs}
            metric={muscleMetric}
            units={units}
            size={230}
            emptyMessage="No sets logged in this timeframe."
          />
        </div>
      )}

      {!hidden.includes('prog.exercise') && selectedExercise && exerciseData.length > 0 && (
        <div className={`${card} p-4 mb-3`}>
          <h3 className={`${label} mb-4`}>{selectedExercise} — top set</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={exerciseData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={c.grid} vertical={false} />
              <XAxis dataKey="date" {...axis} tickLine={false} />
              <YAxis {...axis} tickLine={false} width={44} unit={` ${units}`} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: c.muted }}
                cursor={{ stroke: c.grid }}
                formatter={(value: any, _name: string, props: any) =>
                  [`${value} ${units} × ${props.payload.repsAtMaxWeight} reps`, 'Top set']
                }
              />
              <Line type="monotone" dataKey="maxWeight" stroke={accent} strokeWidth={2} dot={{ fill: accent, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!hidden.includes('prog.exercise') && selectedExercise && exerciseData.length === 0 && (
        <div className={`${card} p-8 mb-3 text-center`}>
          <p className="text-muted text-sm">No <span className="text-ink font-medium">{selectedExercise}</span> logged in this timeframe.</p>
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
        onClick={() => onChange(o.value)}
        aria-pressed={value === o.value}
        className={`px-3 py-1.5 rounded-chip text-sm font-semibold transition-colors ${value === o.value ? 'bg-accent text-accent-ink' : 'text-muted hover:text-ink'}`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const SettingsScreen = ({ prefs, updatePrefs, toggleHidden, theme, onDone }: any) => {
  const dashKeys = ['dash.stats', 'dash.muscle', 'dash.bodyweight', 'dash.log'];
  const progKeys = ['prog.muscle', 'prog.bodyweight', 'prog.exercise'];

  // A show/hide toggle: checked = the widget is shown (i.e. not in `hidden`).
  const widgetRow = (k: string) => {
    const shown = !prefs.hidden.includes(k);
    return (
      <div key={k} className="flex items-center justify-between gap-3 py-2">
        <span className="text-sm text-ink">{WIDGET_LABELS[k]}</span>
        <button
          role="switch" aria-checked={shown}
          aria-label={`${shown ? 'Hide' : 'Show'} ${WIDGET_LABELS[k]}`}
          onClick={() => toggleHidden(k)}
          className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${shown ? 'bg-accent' : 'bg-raised border border-line'}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all ${shown ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
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

        <div className="h-px bg-line my-4" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-ink">Status colours</span>
          <Segmented value={prefs.semantics} onChange={(v: string) => updatePrefs({ semantics: v })}
            options={SEM_IDS.map(id => ({ value: id, label: SEMANTICS[id].label }))} />
        </div>
        <p className="text-xs text-faint mt-2">The success / warning / danger colours. “Colour-blind” keeps success and danger distinct for red-green colour blindness.</p>
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
        {prefs.muscleMetric === 'volume' && (
          <p className="text-xs text-faint mt-2">Volume is reps × weight, so bodyweight and cardio work counts as zero.</p>
        )}
      </div>

      {/* Workout */}
      <div className={`${card} p-4`}>
        <h3 className={`${label} mb-3`}>Workout</h3>
        <div className="flex items-center justify-between gap-3 py-1">
          <span className="text-sm text-ink">Rest timer</span>
          <button
            role="switch" aria-checked={prefs.restTimer}
            aria-label={`${prefs.restTimer ? 'Disable' : 'Enable'} rest timer`}
            onClick={() => updatePrefs({ restTimer: !prefs.restTimer })}
            className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${prefs.restTimer ? 'bg-accent' : 'bg-raised border border-line'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all ${prefs.restTimer ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
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
    </div>
  );
};

// ─── GymTrackerApp ─────────────────────────────────────────────────────────────
const GymTrackerApp = () => {
  const [currentScreen, setCurrentScreen]             = useState('home');
  const [workouts, setWorkouts]                       = useState<any[]>([]);
  const [bodyWeightLog, setBodyWeightLog]             = useState<{ date: string; weight: number }[]>([]);
  const [weeklyGoal, setWeeklyGoal]                   = useState(4);
  const [currentWorkout, setCurrentWorkout]           = useState<any>(null);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string | null>(null);
  const [bodyWeight, setBodyWeight]                   = useState('');
  const [workoutNotes, setWorkoutNotes]               = useState('');
  const [quickBWInput, setQuickBWInput]               = useState('');
  const [prefs, setPrefs]                             = useState<Prefs>(DEFAULT_PREFS);

  const { theme, toggle } = useTheme();
  const c = CHART[theme];

  const units = prefs.units;
  const updatePrefs  = (patch: Partial<Prefs>) => setPrefs(p => ({ ...p, ...patch }));
  const toggleHidden = (key: string) =>
    setPrefs(p => ({ ...p, hidden: p.hidden.includes(key) ? p.hidden.filter(k => k !== key) : [...p.hidden, key] }));

  // Colour choices → CSS tokens. One effect applies every override (accent, base
  // neutrals, semantics) for the active theme; overriding the tokens cascades to
  // every utility across the app.
  useEffect(() => {
    const vars = resolveThemeVars(prefs.accent, prefs.base, prefs.semantics, theme);
    for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v);
  }, [prefs.accent, prefs.base, prefs.semantics, theme]);

  // Persist the resolved vars for BOTH themes so index.html can stamp them before
  // first paint (no flash of the default palette on reload).
  useEffect(() => {
    try {
      localStorage.setItem('gym-theme-vars', JSON.stringify({
        light: resolveThemeVars(prefs.accent, prefs.base, prefs.semantics, 'light'),
        dark:  resolveThemeVars(prefs.accent, prefs.base, prefs.semantics, 'dark'),
      }));
    } catch { /* ignore */ }
  }, [prefs.accent, prefs.base, prefs.semantics]);

  // Load from localStorage. Reads synchronously before the write-back effects
  // below fire on mount — don't reorder or early-return past this.
  useEffect(() => {
    try {
      const stored     = localStorage.getItem(STORAGE_KEY);
      const storedBW   = localStorage.getItem(BW_LOG_KEY);
      const storedGoal = localStorage.getItem(GOAL_KEY);
      const storedPrefs = localStorage.getItem(PREFS_KEY);

      const loadedWorkouts = stored ? JSON.parse(stored) : [];
      if (loadedWorkouts.length > 0) setWorkouts(loadedWorkouts);
      // Clamp on read: a goal saved before the 7/week cap would otherwise survive it.
      if (storedGoal) {
        const g = parseInt(storedGoal);
        if (!Number.isNaN(g)) setWeeklyGoal(Math.min(GOAL_MAX, Math.max(GOAL_MIN, g)));
      }
      // Merge over defaults so a blob saved by an older build (missing fields) still
      // loads; guard hidden is an array in case of hand-edited/corrupt storage.
      if (storedPrefs) {
        const p = JSON.parse(storedPrefs);
        setPrefs({ ...DEFAULT_PREFS, ...p, hidden: Array.isArray(p?.hidden) ? p.hidden : [] });
      }

      if (storedBW) {
        setBodyWeightLog(JSON.parse(storedBW));
      } else if (loadedWorkouts.length > 0) {
        // Migrate existing workout body weights into the log
        setBodyWeightLog(loadedWorkouts.map((w: any) => ({ date: w.date, weight: w.bodyWeight })));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts)); } catch { /* ignore */ }
  }, [workouts]);

  useEffect(() => {
    try { localStorage.setItem(BW_LOG_KEY, JSON.stringify(bodyWeightLog)); } catch { /* ignore */ }
  }, [bodyWeightLog]);

  useEffect(() => {
    try { localStorage.setItem(GOAL_KEY, String(weeklyGoal)); } catch { /* ignore */ }
  }, [weeklyGoal]);

  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  }, [prefs]);

  // ── Workout actions ──────────────────────────────────────────────────────────
  const startWorkout = (type: string) => {
    setSelectedWorkoutType(type);
    setCurrentScreen('enterBodyWeight');
  };

  const confirmBodyWeight = () => {
    if (!bodyWeight) return;
    setCurrentWorkout({
      type: selectedWorkoutType,
      bodyWeight: fromInputWeight(bodyWeight, units),   // typed in display units → stored kg
      exercises: [],
      date: new Date().toISOString(),
      notes: ''
    });
    setCurrentScreen('workout');
  };

  const addExercise = (name: string) => {
    setCurrentWorkout((w: any) => ({ ...w, exercises: [...w.exercises, { name, sets: [], notes: '' }] }));
  };

  const addSet = (exIdx: number, reps: string, weight: string) => {
    // Weight is typed in display units and stored in kg; blank = bodyweight (null),
    // never the NaN that parseFloat('') would give.
    const load = fromInputWeight(weight, units);
    setCurrentWorkout((w: any) => {
      const exercises = w.exercises.map((ex: any, i: number) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, { reps: parseInt(reps), weight: load }] } : ex
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

  const finishWorkout = () => {
    const completed = { ...currentWorkout, notes: workoutNotes };
    setWorkouts(prev => [...prev, completed]);
    setBodyWeightLog(prev => [...prev, { date: completed.date, weight: completed.bodyWeight }]);
    setCurrentWorkout(null);
    setSelectedWorkoutType(null);
    setBodyWeight('');
    setWorkoutNotes('');
    setCurrentScreen('home');
  };

  const cancelWorkout = () => {
    setCurrentWorkout(null);
    setSelectedWorkoutType(null);
    setBodyWeight('');
    setWorkoutNotes('');
    setCurrentScreen('home');
  };

  const handleQuickBWLog = () => {
    if (!quickBWInput) return;
    const kg = fromInputWeight(quickBWInput, units);   // typed in display units → stored kg
    if (kg == null) return;
    setBodyWeightLog(prev => [...prev, { date: new Date().toISOString(), weight: kg }]);
    setQuickBWInput('');
  };

  const deleteWorkout = (i: number) => setWorkouts(w => w.filter((_, idx) => idx !== i));

  const updateWorkout = (i: number, updated: any) =>
    setWorkouts(w => w.map((item, idx) => idx === i ? updated : item));

  // ── Derived stats ────────────────────────────────────────────────────────────
  const getWorkoutStreak = () => {
    if (workouts.length === 0) return 0;
    const today   = new Date();
    const todayMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const dayMs   = 86400000;

    const uniqueDays = [...new Set(
      workouts.map((w: any) => {
        const d = new Date(w.date);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      })
    )].sort((a, b) => b - a);

    // Streak is 0 if most recent workout is more than 1 day ago
    if (todayMs - uniqueDays[0] > dayMs) return 0;

    let streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      if ((uniqueDays[i - 1] - uniqueDays[i]) / dayMs <= 2) streak++;
      else break;
    }
    return streak;
  };

  const getWeeklyGoalProgress = () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const count = workouts.filter((w: any) => new Date(w.date) >= cutoff).length;
    return Math.min((count / weeklyGoal) * 100, 100);
  };

  const getDaysSinceLastWorkout = () => {
    if (workouts.length === 0) return 'No workouts yet';
    const last     = new Date(workouts[workouts.length - 1].date);
    const today    = new Date();
    const lastDay  = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const diff     = Math.round((todayDay - lastDay) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
  };

  // Latest logged body weight in kg, or null. The card converts to display units.
  const latestBodyWeightKg: number | null = bodyWeightLog.length === 0
    ? null
    : [...bodyWeightLog].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight;

  const getLatestWorkoutType = () => {
    if (workouts.length === 0) return '—';
    const cfg = TYPE_CONFIG[workouts[workouts.length - 1].type];
    return cfg?.label ?? '—';
  };

  // Body weight chart data for home (last 15 entries), in display units.
  const bwChartData = bodyWeightLog.slice(-15).map(e => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    bodyWeight: Math.round((toDisplayWeight(e.weight, units) as number) * 10) / 10,
  }));

  const entryTypeCfg  = TYPE_CONFIG[selectedWorkoutType ?? 'custom'] ?? TYPE_CONFIG.custom;
  const EntryTypeIcon = entryTypeCfg.Icon;

  const goalPct    = getWeeklyGoalProgress();
  const goalMet    = goalPct >= 100;
  const streak     = getWorkoutStreak();
  const inSession  = currentScreen === 'workout' || currentScreen === 'enterBodyWeight';

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
            <button
              onClick={() => setCurrentScreen('settings')}
              className={`p-2 -mr-2 rounded-ctl transition-colors ${currentScreen === 'settings' ? 'text-accent' : 'text-muted hover:text-ink'}`}
              aria-label="Settings"
              aria-current={currentScreen === 'settings' ? 'page' : undefined}
            >
              <Settings size={17} />
            </button>
          </div>
        </div>
        {/* Knurling — the grip band on a bar. */}
        <div className="knurl h-[3px] opacity-70" aria-hidden="true" />
      </header>

      {/* ── Home ── */}
      {currentScreen === 'home' && (
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-24 flex flex-col gap-3">

          {/* Stat row */}
          {!prefs.hidden.includes('dash.stats') && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { key: 'streak', caption: 'Streak',    value: streak,                  unit: streak === 1 ? 'day' : 'days', Icon: Flame },
              { key: 'week',   caption: 'This week', value: `${Math.round(goalPct)}`, unit: '% of goal',                  Icon: Target },
              { key: 'total',  caption: 'Sessions',  value: workouts.length,          unit: 'all time',                   Icon: Activity },
            ].map(({ key, caption, value, unit, Icon }) => (
              <div key={key} className={`${card} p-3 sm:p-4`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon size={13} className={key === 'streak' && streak > 0 ? 'text-good' : 'text-faint'} />
                  <span className={`${label} text-[10px]`}>{caption}</span>
                </div>
                <p className={`${readout} text-3xl sm:text-4xl ${key === 'week' && goalMet ? 'text-good' : ''}`}>{value}</p>
                <p className="text-[11px] text-faint mt-1">{unit}</p>
                {key === 'week' && (
                  <div className="w-full bg-raised rounded-chip h-1 mt-2.5 overflow-hidden">
                    <div
                      className={`h-1 rounded-chip transition-all ${goalMet ? 'bg-good' : 'bg-accent'}`}
                      style={{ width: `${goalPct}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          )}

          {/* Start a session — the reason the app is open. */}
          <div className={`${card} p-4`}>
            <h2 className={`${label} mb-3`}>Start a session</h2>
            <div className="grid grid-cols-2 gap-2">
              {SESSION_TYPES.map(({ name, label: btnLabel, sub, img, pos }) => (
                <button
                  key={name}
                  onClick={() => startWorkout(name)}
                  className={`group relative overflow-hidden flex flex-col justify-end text-left p-4 min-h-[112px] rounded-ctl border border-line hover:border-accent active:scale-[0.99] transition-all ${img ? '' : 'bg-raised'}`}
                >
                  {img && (
                    <>
                      <img
                        src={img}
                        alt=""
                        aria-hidden="true"
                        className={`absolute inset-0 h-full w-full object-cover ${pos ?? 'object-center'} transition-transform duration-300 group-hover:scale-[1.04]`}
                      />
                      {/* The shot is lit dark, so this tile commits to a dark ground in
                          both themes rather than washing the photo out in light. */}
                      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/20" />
                    </>
                  )}
                  <span className="relative">
                    <span className={`block font-semibold text-sm ${img ? 'text-white' : 'text-ink'}`}>{btnLabel}</span>
                    <span className={`block text-[11px] mt-1 leading-tight ${img ? 'text-white/75' : 'text-faint'}`}>{sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Muscle focus — all-time split, so it reads as a stable overview rather
              than jittering with a rolling window. Time-scoping lives on Progress. */}
          {workouts.length > 0 && !prefs.hidden.includes('dash.muscle') && (
            <div className={`${card} p-4`}>
              <h3 className={`${label} mb-3`}>Muscle focus</h3>
              <MuscleGroupDonut workouts={workouts} theme={theme} prefs={prefs} metric={prefs.muscleMetric} units={units} size={150} sliceLimit={5} legendLimit={3} />
            </div>
          )}

          {/* Body weight */}
          {!prefs.hidden.includes('dash.bodyweight') && (
          <div className={`${card} p-4`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className={label}>Body weight</h3>
              <div className="flex items-baseline gap-1">
                <span className={`${readout} text-2xl`}>{latestBodyWeightKg == null ? '—' : trim1(toDisplayWeight(latestBodyWeightKg, units) as number)}</span>
                {latestBodyWeightKg != null && <span className="text-[11px] font-semibold text-muted">{units}</span>}
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="number" step="0.1" inputMode="decimal"
                placeholder={`Log today's weight (${units})`}
                aria-label={`Log today's body weight in ${units}`}
                value={quickBWInput}
                onChange={e => setQuickBWInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuickBWLog()}
                className={`${input} flex-1 py-2 text-sm`}
              />
              <button
                onClick={handleQuickBWLog}
                disabled={!quickBWInput}
                className={`${btnPrimary} px-4 text-sm disabled:bg-raised disabled:text-faint disabled:cursor-not-allowed disabled:brightness-100`}
              >
                Log
              </button>
            </div>

            {bwChartData.length >= 2 ? (
              <BodyWeightTrend data={bwChartData} theme={theme} prefs={prefs} chartType={prefs.bwChart} units={units} height={140} compact />
            ) : (
              <p className="text-xs text-faint text-center py-6">Log two entries to see a trend.</p>
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
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-ctl ${entryTypeCfg.iconBg} grid place-items-center`}>
                <EntryTypeIcon size={20} className={entryTypeCfg.color} />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold uppercase tracking-wide text-ink leading-none">{entryTypeCfg.label}</h2>
                <p className="text-xs text-faint mt-1.5">Weigh in to start</p>
              </div>
            </div>

            <label htmlFor="entry-bw" className={`${label} block mb-2`}>Body weight ({units})</label>
            <input
              id="entry-bw"
              type="number" step="0.1" inputMode="decimal"
              value={bodyWeight}
              onChange={e => setBodyWeight(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmBodyWeight()}
              className={`${input} w-full font-display text-3xl font-bold tabular-nums text-center py-4`}
              placeholder={units === 'lb' ? '182' : '82.5'}
              autoFocus
            />

            <div className="flex gap-2 mt-5">
              <button
                onClick={confirmBodyWeight}
                disabled={!bodyWeight}
                className={`${btnPrimary} flex-1 p-3.5 disabled:bg-raised disabled:text-faint disabled:cursor-not-allowed disabled:brightness-100`}
              >
                Start session
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
          updateExerciseNotes={updateExerciseNotes}
          finishWorkout={finishWorkout}
          cancelWorkout={cancelWorkout}
          workoutNotes={workoutNotes}
          setWorkoutNotes={setWorkoutNotes}
          units={units}
          restTimer={prefs.restTimer}
          restSeconds={prefs.restSeconds}
        />
      )}

      {/* ── History ── */}
      {currentScreen === 'history' && (
        <HistoryScreen workouts={workouts} deleteWorkout={deleteWorkout} updateWorkout={updateWorkout} units={units} />
      )}

      {/* ── Progress ── */}
      {currentScreen === 'progress' && (
        <ProgressScreen workouts={workouts} bodyWeightLog={bodyWeightLog} theme={theme} prefs={prefs} />
      )}

      {/* ── Settings ── */}
      {currentScreen === 'settings' && (
        <SettingsScreen prefs={prefs} updatePrefs={updatePrefs} toggleHidden={toggleHidden} theme={theme} onDone={() => setCurrentScreen('home')} />
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
    </div>
  );
};

export default GymTrackerApp;
