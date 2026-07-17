import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, TrendingUp, Dumbbell, Calendar, FileText, Edit2, Save, Target, Activity, ChevronRight, ChevronDown, ChevronUp, Flame, Layers, Maximize2, Anchor, Mountain, Sun, Moon, Settings, ChevronLeft, Timer, Download, Upload, Pause, Play, LogOut, LogIn, Mail, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { supabase, supabaseEnabled, rowToWorkout, workoutToRow, rowToBW } from './supabase';

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
const ACTIVE_KEY  = 'gym-active-session';   // in-progress workout, so a refresh can't lose it

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
  workoutTimer: boolean;         // time the whole session and log its duration
};
const DEFAULT_PREFS: Prefs = {
  units: 'kg', hidden: [], muscleMetric: 'sets', bwChart: 'line',
  accent: 'blue', base: 'graphite', semantics: 'plates', restTimer: true, restSeconds: 90,
  workoutTimer: true,
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

// ─── useTheme ──────────────────────────────────────────────────────────────────
// Follows the OS until the user picks a side, then stays pinned to their choice.
type Theme = 'light' | 'dark';

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

// 'system' follows the OS; 'light'/'dark' pin a side. Persisted in THEME_KEY —
// index.html only stamps light/dark before paint, so 'system' (or absent) means
// follow the media query, matching this hook.
type ThemeMode = 'light' | 'dark' | 'system';

const useTheme = () => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch { /* ignore */ }
    return 'system';
  });

  const [systemTheme, setSystemTheme] = useState<Theme>(() => prefersDark() ? 'dark' : 'light');

  // Track the OS preference always; it's only *used* while mode is 'system', but
  // keeping it live means switching back to System resolves instantly.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setSystemTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const theme: Theme = mode === 'system' ? systemTheme : mode;

  // Pin the resolved side on the root while explicit; drop the stamp in System so
  // the CSS media query governs again.
  useEffect(() => {
    if (mode === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = mode;
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    try { localStorage.setItem(THEME_KEY, m); } catch { /* ignore */ }
  };

  // Header quick-toggle: flip to the opposite of whatever is showing.
  const toggle = () => setMode(theme === 'dark' ? 'light' : 'dark');

  return { theme, mode, setMode, toggle };
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
const ExerciseCard = ({ exercise, exerciseIndex, exerciseCount = 1, addSet, removeSet, removeExercise, moveExercise, updateExerciseNotes, units = 'kg' }: any) => {
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
const WorkoutScreen = ({ workout, workoutType, addExercise, addSet, removeSet, removeExercise, moveExercise, updateExerciseNotes, finishWorkout, cancelWorkout, workoutNotes, setWorkoutNotes, patchWorkout, units = 'kg', restTimer = false, restSeconds = 90, workoutTimer = false }: any) => {
  const [showExerciseList, setShowExerciseList]     = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [showCancelConfirm, setShowCancelConfirm]   = useState(false);
  const [openGroup, setOpenGroup]                   = useState<string | null>(null);

  // Per-session timer state lives on the workout object, seeded from the saved
  // defaults but overridden only here — the in-workout toggles never write back to
  // Settings, and the choice persists/resumes with the session. Fall back to the
  // prop for sessions saved before these fields existed.
  const sessionOn = workout.workoutTimer ?? workoutTimer;
  const restOn    = workout.restTimer ?? restTimer;
  const patch     = (p: any) => patchWorkout && patchWorkout(p);
  const toggleSessionTimer = () => patch({ workoutTimer: !sessionOn });
  const toggleRestTimer    = () => patch({ restTimer: !restOn });

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
  const primeAudio = () => {
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      if (!audioRef.current) audioRef.current = new AC();
      if (audioRef.current.state === 'suspended') audioRef.current.resume();
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
  const onRestComplete = () => {
    setRestPaused(false);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(200);
    chime();
    setRestDone(true);
    setTimeout(() => setRestDone(false), 1500);
  };
  // Drive the countdown; reused by start and resume so paused time picks up cleanly.
  const runRest = () => {
    clearRest();
    restRef.current = setInterval(() => {
      setRest(r => {
        if (r == null) return r;
        if (r <= 1) { clearRest(); onRestComplete(); return null; }
        return r - 1;
      });
    }, 1000);
  };
  const startRest  = (secs: number = restSeconds) => { primeAudio(); setRestDone(false); setRest(secs); setRestPaused(false); runRest(); };
  const pauseRest  = () => { clearRest(); setRestPaused(true); };
  const resumeRest = () => { primeAudio(); setRestPaused(false); runRest(); };
  const skipRest   = () => { clearRest(); setRestPaused(false); setRest(null); };
  const resetRest  = () => startRest();   // restart the countdown from the full duration
  const bumpRest   = (delta: number) => setRest(r => (r == null ? r : Math.max(0, r + delta)));
  useEffect(() => clearRest, []);   // clear on unmount (leaving the workout)

  // Logging a set auto-starts the countdown, but only if the setting is on. Manual
  // Start/Pause below stays available regardless, so you can rest off-schedule.
  const addSetAndRest = (...args: any[]) => { (addSet as any)(...args); if (restOn) startRest(); };

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
            {/* Session timer — total elapsed time. Toggle is a per-session override
                (never touches Settings); pause/resume freezes the count. */}
            <div className="flex items-center gap-2 mt-3">
              <button
                role="switch" aria-checked={!!sessionOn}
                aria-label={`${sessionOn ? 'Stop' : 'Start'} session timer`}
                onClick={toggleSessionTimer}
                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${sessionOn ? 'bg-accent' : 'bg-raised border border-line'}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface shadow transition-all ${sessionOn ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
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
            <p className={`${readout} text-xl mt-1`}>
              {workout.bodyWeight == null ? '—' : fmtWeight(workout.bodyWeight, units)}
            </p>
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
            exerciseCount={workout.exercises.length}
            addSet={addSetAndRest}
            removeSet={removeSet}
            removeExercise={removeExercise}
            moveExercise={moveExercise}
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
          controls ride just above it whenever resting is enabled: a Start button
          while idle, and the running/paused countdown otherwise. */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line pb-safe z-40">
        {/* Rest timer — the between-sets countdown, toggled here too. Always shown so
            it can be switched on/off mid-workout without visiting Settings. */}
        <div className={`border-b border-line transition-colors ${restDone ? 'bg-good/15' : ''}`}>
          <div className="max-w-3xl mx-auto flex items-center gap-2.5 px-3 py-2">
            <button
              role="switch" aria-checked={!!restOn}
              aria-label={`${restOn ? 'Disable' : 'Enable'} rest timer`}
              onClick={toggleRestTimer}
              className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${restOn ? 'bg-accent' : 'bg-raised border border-line'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface shadow transition-all ${restOn ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
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
const HistoryScreen = ({ workouts, deleteWorkout, updateWorkout, units = 'kg' }: any) => {
  const [expandedWorkout, setExpandedWorkout] = useState<number | null>(null);
  const [viewingNotes, setViewingNotes]       = useState<number | null>(null);
  const [editingWorkout, setEditingWorkout]   = useState<number | null>(null);
  const [editData, setEditData]               = useState<any>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
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

  // Display order is newest-first, but the mutators index into the unsorted
  // array — so originalIndex has to survive the sort.
  const sortedWorkouts = workouts
    .map((w: any, i: number) => ({ ...w, originalIndex: i }))
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Type + text filter. Search matches the type label, any exercise name, or notes.
  // Render + mutators both index into `filtered`, so originalIndex still routes
  // edits/deletes to the right stored workout.
  const q = search.trim().toLowerCase();
  const filtered = sortedWorkouts.filter((w: any) => {
    if (filterType !== 'all' && w.type !== filterType) return false;
    if (!q) return true;
    return (TYPE_CONFIG[w.type]?.label ?? '').toLowerCase().includes(q)
      || w.exercises.some((ex: any) => ex.name.toLowerCase().includes(q))
      || (w.notes ?? '').toLowerCase().includes(q);
  });

  const toggleWorkout = (i: number) => {
    setExpandedWorkout(expandedWorkout === i ? null : i);
    setViewingNotes(null);
    setEditingWorkout(null);
    setConfirmingDelete(null);
  };

  const startEditing = (i: number, w: any) => {
    setEditingWorkout(i);
    setEditData(JSON.parse(JSON.stringify(w)));
  };

  const cancelEditing = () => { setEditingWorkout(null); setEditData(null); };

  // Rows are keyed by originalIndex (see the map below), so edits/deletes route
  // straight through it — no `filtered[i]` lookup, which would be wrong once the
  // calendar renders a single day's subset instead of the whole list.
  const saveEditing = (oi: number) => {
    updateWorkout(workouts[oi].id, editData);   // oi = originalIndex → resolve the row uuid
    setEditingWorkout(null);
    setEditData(null);
  };

  const confirmDelete = (oi: number) => {
    deleteWorkout(workouts[oi].id);
    setExpandedWorkout(null);
    setEditingWorkout(null);
    setConfirmingDelete(null);
  };

  const updateSetValue = (exIdx: number, setIdx: number, field: string, val: string) => {
    const u = { ...editData };
    // Weight is typed in display units and stored in kg (blank → bodyweight/null);
    // reps coerce to an integer, blank → 0 so a cleared field can't store NaN.
    u.exercises[exIdx].sets[setIdx][field] =
      field === 'weight' ? fromInputWeight(val, units) : (val === '' ? 0 : parseInt(val, 10) || 0);
    setEditData(u);
  };

  const addSetToEdit = (exIdx: number) => {
    const u = { ...editData };
    u.exercises[exIdx].sets = [...u.exercises[exIdx].sets, { reps: 0, weight: null }];
    setEditData(u);
  };

  const addExerciseToEdit = () => {
    const name = addExerciseName.trim();
    if (!name) return;
    setEditData({ ...editData, exercises: [...editData.exercises, { name, sets: [], notes: '' }] });
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
  const dayKeyOf = (iso: string) => {
    const d = new Date(iso);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
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
  const todayKey    = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const shiftMonth = (delta: number) => { setCalMonth(new Date(calYear, calMon + delta, 1)); setSelectedDay(null); };

  // Until the user taps a day, the detail defaults to the month's latest
  // session; navigating months clears the manual pick (via shiftMonth).
  const monthDayKeys = [...daysMap.keys()].filter(k => {
    const d = new Date(k); return d.getFullYear() === calYear && d.getMonth() === calMon;
  });
  const newestMonthDay = monthDayKeys.length ? Math.max(...monthDayKeys) : null;
  const activeDay = selectedDay != null ? selectedDay : newestMonthDay;
  const activeDayWorkouts = activeDay != null ? (daysMap.get(activeDay) ?? []) : [];
  const activeDayLabel = activeDay != null
    ? new Date(activeDay).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  // The row list draws from the whole filtered set in list mode, or just the
  // selected day in calendar mode — same rows, keyed by originalIndex either way.
  const rowsToShow = viewMode === 'list' ? filtered : activeDayWorkouts;

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4">
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
      {sortedWorkouts.length > 3 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <select
            value={filterType} onChange={e => { setFilterType(e.target.value); setExpandedWorkout(null); }}
            aria-label="Filter by session type"
            className={`${input} py-2 text-sm`}
          >
            <option value="all">All types</option>
            {Object.keys(TYPE_CONFIG).map(t => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
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
            // Key by originalIndex, not list position — the same row renders in
            // the list and the calendar day-detail, and every expand/edit/delete
            // keyed below routes to the right stored workout regardless of subset.
            const index          = workout.originalIndex;
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
                      <p className="text-xs text-faint mt-0.5 flex items-center gap-1.5">
                        <span>{formatDate(workout.date)}</span>
                        {workout.duration != null && (
                          <span className="flex items-center gap-1 tabular-nums" title="Workout duration">
                            <Timer size={11} /> {fmtDurationWords(workout.duration)}
                          </span>
                        )}
                      </p>
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
                    <div className="p-3 border-b border-line flex gap-2 flex-wrap items-center">
                      {confirmingDelete === index ? (
                        <>
                          <span className="text-sm text-ink">Delete this session?</span>
                          <div className="ml-auto flex gap-2">
                            <button onClick={e => { e.stopPropagation(); confirmDelete(index); }} className={`${btnDanger} flex items-center gap-2 px-3 py-1.5 text-sm`}>
                              <Trash2 size={13} /> Delete
                            </button>
                            <button onClick={e => { e.stopPropagation(); setConfirmingDelete(null); }} className={`${btnSecondary} px-3 py-1.5 text-sm`}>
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : !isEditing ? (
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
                          <button onClick={e => { e.stopPropagation(); setConfirmingDelete(index); }} className={`${btnDanger} flex items-center gap-2 px-3 py-1.5 text-sm ml-auto`}>
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
                          onClick={() => setViewingNotes(viewingNotes === index ? null : index)}
                          className="flex items-center gap-2 text-muted hover:text-ink text-sm font-medium transition-colors"
                        >
                          <FileText size={14} className="text-accent" />
                          {viewingNotes === index ? 'Hide notes' : 'View notes'}
                          <ChevronDown size={13} className={`transition-transform ${viewingNotes === index ? 'rotate-180' : ''}`} />
                        </button>
                        {viewingNotes === index && (
                          <p className="mt-3 text-sm text-muted bg-raised rounded-ctl p-3">{displayWorkout.notes}</p>
                        )}
                      </div>
                    ) : null}

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

                            {exIdx < displayWorkout.exercises.length - 1 && (
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
    return <p className="text-xs text-faint text-center py-6">{emptyMessage}</p>;
  }

  // A ring of a dozen 2%-slivers is unreadable, so the top real groups keep their
  // own colour and everything past the budget — plus any free-text "Other" — folds
  // into one neutral arc. Folding only kicks in when it compresses ≥2 groups: a lone
  // leftover keeps its own colour rather than hiding behind an unlabelled catch-all.
  const total      = data.reduce((n, d) => n + d.value, 0);
  const realGroups = data.filter(d => d.group !== OTHER_GROUP);
  const otherReal  = data.find(d => d.group === OTHER_GROUP);
  const leftover   = [...realGroups.slice(sliceLimit), ...(otherReal ? [otherReal] : [])];
  const foldedVal  = leftover.reduce((n, d) => n + d.value, 0);
  const slices     = leftover.length >= 2
    ? [...realGroups.slice(0, sliceLimit),
       { group: OTHER_GROUP, value: foldedVal, pct: total ? (foldedVal / total) * 100 : 0, count: leftover.length }]
    : data;

  // The catch-all recedes to the muted neutral; real groups take catalogue hues in
  // fixed order. The legend renders these same slices, in the same order, so a
  // group's ring colour and its legend dot can never drift apart — and the folded
  // arc is always spelled out in the legend rather than left as a mystery wedge.
  const colorAt = (group: string, i: number) =>
    group === OTHER_GROUP ? c.muted : c.cat[i % c.cat.length];

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
                formatter={(v: any, _n: any, p: any) => [`${metricValueLabel(metric, v, units)} · ${Math.round(p.payload.pct)}%`, p.payload.count > 1 ? `Other · ${p.payload.count} groups` : p.payload.group]}
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

  const allExercisesUsed = [...new Set(
    workouts.flatMap((w: any) => w.exercises.map((e: any) => e.name))
  )].sort() as string[];

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
    const start = new Date();
    if (timeframe === '30days')  start.setDate(now.getDate() - 30);
    if (timeframe === '3months') start.setMonth(now.getMonth() - 3);
    return items.filter(i => new Date(i.date) >= start);
  };

  // The exercise select carries this sentinel when the user wants every
  // exercise at once. It can't collide with a real name (double underscore).
  // The All-exercises view then renders the same top-set chart per exercise.
  const isAllExercises = selectedExercise === ALL_EXERCISES;

  // Top-set series (max weight per session, in display units) for one exercise —
  // the data behind a single chart. Reused for the single- and all-exercise views.
  const seriesForExercise = (name: string) =>
    filterByDate(workouts).flatMap((w: any) => {
      const ex = w.exercises.find((e: any) => e.name === name);
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

  // Every logged exercise's series, bucketed by muscle group in the donut's order
  // so the All-exercises view echoes the Muscle group balance card above it.
  const getExercisesByGroup = () => {
    const inWindow = filterByDate(workouts);
    const names = [...new Set(inWindow.flatMap((w: any) => w.exercises.map((e: any) => e.name)))] as string[];
    const order = muscleGroupBreakdown(inWindow, muscleMetric).map(d => d.group);
    const rank  = (g: string) => { const i = order.indexOf(g); return i === -1 ? order.length : i; };
    const groups: Record<string, { name: string; data: any[] }[]> = {};
    for (const name of names) {
      const data = seriesForExercise(name);
      if (data.length === 0) continue;
      const g = EXERCISE_GROUP_INDEX[name] ?? OTHER_GROUP;
      (groups[g] ?? (groups[g] = [])).push({ name, data });
    }
    return Object.entries(groups)
      .map(([group, items]) => ({ group, items: items.sort((a, b) => a.name.localeCompare(b.name)) }))
      .sort((a, b) => rank(a.group) - rank(b.group));
  };

  const getExerciseData = () => (!selectedExercise || isAllExercises ? [] : seriesForExercise(selectedExercise));

  const getBodyWeightData = () =>
    filterByDate(bodyWeightLog).map((e: any) => ({
      date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      bodyWeight: Math.round((toDisplayWeight(e.weight, units) as number) * 10) / 10,
    }));

  const exerciseData     = getExerciseData();
  const exercisesByGroup = isAllExercises ? getExercisesByGroup() : [];
  const bodyWeightData   = getBodyWeightData();

  const tooltipStyle = {
    backgroundColor: c.surface,
    border: `1px solid ${c.line}`,
    borderRadius: '6px',
    fontFamily: 'Barlow, system-ui, sans-serif',
    fontSize: '12px',
  };

  const axis = { stroke: c.axis, style: { fontSize: '11px', fontFamily: 'Barlow, system-ui, sans-serif' } };

  // One exercise's top-set chart card. Shared so the single-exercise view and
  // every card in the All-exercises view are visually identical.
  const topSetCard = (name: string, data: any[]) => (
    <div key={name} className={`${card} p-4 mb-3`}>
      <h3 className={`${label} mb-4`}>{name} — top set</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
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
  );

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
              <option value="all">All time</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          <div>
            <label htmlFor="exercise" className={`${label} block mb-2`}>Exercise</label>
            <select id="exercise" value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} className={`${input} w-full`}>
              <option value="">Choose an exercise…</option>
              {allExercisesUsed.length > 0 && <option value={ALL_EXERCISES}>All exercises</option>}
              {allExercisesUsed.map(ex => <option key={ex} value={ex}>{ex}</option>)}
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
            workouts={filterByDate(workouts)}
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
        topSetCard(selectedExercise, exerciseData)}

      {!hidden.includes('prog.exercise') && !isAllExercises && selectedExercise && exerciseData.length === 0 && (
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

const SettingsScreen = ({ prefs, updatePrefs, toggleHidden, theme, themeMode = 'system', setThemeMode, onExport, onImport, onClearData, onSignOut, onChangePassword, userEmail, onDone }: any) => {
  const dashKeys = ['dash.stats', 'dash.muscle', 'dash.bodyweight', 'dash.log'];
  const progKeys = ['prog.muscle', 'prog.bodyweight', 'prog.exercise'];
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [importMsg, setImportMsg]             = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Change-password, inline in the Account card (the "Clear all data" confirm
  // pattern, not a sub-screen — auth isn't part of the router).
  const [pwOpen, setPwOpen]         = useState(false);
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [pwBusy, setPwBusy]         = useState(false);
  const [pwMsg, setPwMsg]           = useState<{ ok: boolean; text: string } | null>(null);

  const closePw = () => { setPwOpen(false); setNewPw(''); setConfirmPw(''); setShowPw(false); setPwMsg(null); };

  const savePassword = async () => {
    if (pwBusy) return;
    if (newPw.length < MIN_PASSWORD) { setPwMsg({ ok: false, text: `Password must be at least ${MIN_PASSWORD} characters.` }); return; }
    if (newPw !== confirmPw)         { setPwMsg({ ok: false, text: "Passwords don't match." }); return; }
    setPwBusy(true); setPwMsg(null);
    const err = await onChangePassword(newPw);
    setPwBusy(false);
    if (err) { setPwMsg({ ok: false, text: err }); return; }
    setNewPw(''); setConfirmPw(''); setShowPw(false);
    setPwMsg({ ok: true, text: 'Password updated.' });
    setPwOpen(false);
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-ink">Theme</span>
          <Segmented value={themeMode} onChange={(v: ThemeMode) => setThemeMode && setThemeMode(v)}
            options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }]} />
        </div>
        <p className="text-xs text-faint mt-2">System follows your device’s light/dark setting.</p>

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
          <span className="text-sm text-ink">Session timer</span>
          <button
            role="switch" aria-checked={prefs.workoutTimer}
            aria-label={`${prefs.workoutTimer ? 'Disable' : 'Enable'} session timer`}
            onClick={() => updatePrefs({ workoutTimer: !prefs.workoutTimer })}
            className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${prefs.workoutTimer ? 'bg-accent' : 'bg-raised border border-line'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all ${prefs.workoutTimer ? 'left-[18px]' : 'left-0.5'}`} />
          </button>
        </div>
        <p className="text-xs text-faint mb-1">Times each session and saves the length to your history.</p>
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

      {/* Account — the signed-in identity; data syncs to this account. */}
      <div className={`${card} p-4`}>
        <h3 className={`${label} mb-3`}>Account</h3>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm text-ink truncate">{userEmail ?? 'Signed in'}</p>
            <p className="text-xs text-faint mt-0.5">Your workouts sync to this account.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => (pwOpen ? closePw() : setPwOpen(true))} className={`${btnSecondary} flex items-center gap-2 px-3 py-2 text-sm`}>
              <KeyRound size={14} /> Change password
            </button>
            <button onClick={() => onSignOut && onSignOut()} className={`${btnSecondary} flex items-center gap-2 px-3 py-2 text-sm`}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>

        {pwOpen && (
          <form className="mt-4 pt-4 border-t border-line flex flex-col gap-3" onSubmit={e => { e.preventDefault(); savePassword(); }}>
            <PasswordField
              id="settings-new-password"
              label="New password"
              value={newPw}
              onChange={setNewPw}
              autoComplete="new-password"
              show={showPw}
              onToggleShow={() => setShowPw(s => !s)}
              autoFocus
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
                disabled={pwBusy || !newPw || (confirmPw.length > 0 && newPw !== confirmPw)}
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
      </div>

      {/* Data — backups. Export writes a JSON file; import replaces the account's
          data. Data lives in your Supabase project (and a local cache). */}
      <div className={`${card} p-4`}>
        <h3 className={`${label} mb-3`}>Data</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={onExport} className={`${btnSecondary} flex items-center gap-2 px-3 py-2 text-sm`}>
            <Download size={14} /> Export backup
          </button>
          <button onClick={() => fileRef.current?.click()} className={`${btnSecondary} flex items-center gap-2 px-3 py-2 text-sm`}>
            <Upload size={14} /> Import backup
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImportFile} className="hidden" />
        </div>
        {importMsg && <p className="text-xs text-muted mt-2">{importMsg}</p>}
        <p className="text-xs text-faint mt-2">Your data syncs to your Supabase account, with a local cache for offline reads. Export gives you a portable backup.</p>

        <div className="h-px bg-line my-4" />
        {!confirmingClear ? (
          <button onClick={() => setConfirmingClear(true)} className={`${btnSecondary} flex items-center gap-2 px-3 py-2 text-sm`}>
            <Trash2 size={14} /> Clear all data
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink">Delete every workout, weight and setting?</span>
            <div className="ml-auto flex gap-2">
              <button onClick={() => { onClearData && onClearData(); setConfirmingClear(false); }} className={`${btnDanger} flex items-center gap-2 px-3 py-2 text-sm`}>
                <Trash2 size={14} /> Delete everything
              </button>
              <button onClick={() => setConfirmingClear(false)} className={`${btnSecondary} px-3 py-2 text-sm`}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Auth gate screens ─────────────────────────────────────────────────────────
// A full-screen shell shared by the pre-app states (loading / login / config
// error), so they match the app chrome instead of flashing bare.
const AuthShell = ({ children }: any) => (
  <div className="min-h-screen bg-ground text-ink flex flex-col items-center justify-center px-6">
    <div className="w-full max-w-sm">{children}</div>
  </div>
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
  if (/different from the old password/i.test(msg))      return 'Choose a password different from your previous one.';
  if (/reauthentication|session/i.test(msg))             return 'Please sign out and back in, then try again.';
  if (/password should be at least|password.*short|at least \d+ characters/i.test(msg)) return msg; // surface the length rule as-is
  return 'Something went wrong. Please try again.';
};

const MIN_PASSWORD = 6;   // Supabase's default minimum; the server is the real gate

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

  const addr = email.trim();
  const busy = status === 'working';
  const mismatch = mode === 'signup' && confirm.length > 0 && password !== confirm;

  const reset = () => { setStatus('idle'); setErrMsg(''); setPassword(''); setConfirm(''); setShow(false); };
  const switchMode = (m: 'signin' | 'signup') => { setMode(m); setForgot(false); reset(); };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: addr, password });
    if (error) { setStatus('error'); setErrMsg(authErrorText(error)); }
    // success → onAuthStateChange sets the session and the gate falls through.
  };

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: addr,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) { setStatus('error'); setErrMsg(authErrorText(error)); return; }
    // Already-registered email: Supabase returns an obfuscated user with an empty
    // identities[] and NO error (anti-enumeration). Detect and steer to sign-in.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setStatus('error'); setErrMsg('That email is already registered. Try signing in instead.'); return;
    }
    // data.session present → "Confirm email" is off, onAuthStateChange logs us in.
    if (data.session) return;
    // Otherwise confirmation is on: no session yet, tell them to check their inbox.
    setSentKind('confirm'); setStatus('sent');
  };

  const submit = () => {
    if (!addr || !password || busy) return;
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
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !addr || !password || mismatch}
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

// ─── GymTrackerApp ─────────────────────────────────────────────────────────────
const GymTrackerApp = () => {
  const [currentScreen, setCurrentScreen]             = useState('home');
  const [workouts, setWorkouts]                       = useState<any[]>([]);
  const [bodyWeightLog, setBodyWeightLog]             = useState<{ id: string; date: string; weight: number }[]>([]);
  const [weeklyGoal, setWeeklyGoal]                   = useState(4);
  const [currentWorkout, setCurrentWorkout]           = useState<any>(null);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string | null>(null);
  const [bodyWeight, setBodyWeight]                   = useState('');
  const [workoutNotes, setWorkoutNotes]               = useState('');
  const [quickBWInput, setQuickBWInput]               = useState('');
  const [manageBW, setManageBW]                       = useState(false);   // show the BW-entry editor
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
  // recovery — the user arrived via a password-reset link. That link returns a
  // real session, so without this flag the gate below would drop them straight
  // into the app; instead it pins them on ResetPasswordScreen until they set a
  // new password (or explicitly sign out).
  const [recovery, setRecovery]   = useState(false);
  const clampGoal = (g: number) => Math.min(GOAL_MAX, Math.max(GOAL_MIN, g));

  const { theme, mode, setMode, toggle } = useTheme();
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

      // Back-fill a local id on cache entries that predate row ids, so the cached
      // list is editable until hydrate swaps in the server rows.
      const loadedWorkouts = (stored ? JSON.parse(stored) : [])
        .map((w: any) => ({ ...w, id: w.id ?? crypto.randomUUID() }));
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

      // Cache entries may predate row ids (old localStorage) — back-fill a local id
      // so keys/edits work until hydrate replaces them with the server rows.
      const withId = (e: any) => ({ id: e.id ?? crypto.randomUUID(), date: e.date, weight: e.weight });
      if (storedBW) {
        setBodyWeightLog(JSON.parse(storedBW).map(withId));
      } else if (loadedWorkouts.length > 0) {
        // Migrate existing workout body weights into the log
        setBodyWeightLog(loadedWorkouts.map((w: any) => withId({ date: w.date, weight: w.bodyWeight })));
      }

      // Resume an in-progress session if one was persisted (a refresh, phone lock,
      // or tab reap mid-workout). Drop us straight back onto the workout screen.
      const storedActive = localStorage.getItem(ACTIVE_KEY);
      if (storedActive) {
        const a = JSON.parse(storedActive);
        if (a && a.workout && Array.isArray(a.workout.exercises)) {
          setCurrentWorkout(a.workout);
          setSelectedWorkoutType(a.type ?? a.workout.type ?? 'custom');
          setWorkoutNotes(a.notes ?? '');
          setCurrentScreen('workout');
        }
      }
    } catch { /* ignore */ }
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
      if (!s) setHydrated(false);   // signed out → require a fresh hydrate next login
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
      const localWorkouts = rawW  ? JSON.parse(rawW)  : [];
      const localBW       = rawBW ? JSON.parse(rawBW) : [];
      if (localWorkouts.length === 0 && localBW.length === 0 && !rawGoal && !rawPrefs) return null;

      let workoutRows: any[] = [];
      if (localWorkouts.length) {
        const { data, error } = await supabase.from('workouts').insert(localWorkouts.map(workoutToRow)).select();
        if (error) throw error;
        workoutRows = data ?? [];
      }
      let bwRows: any[] = [];
      if (localBW.length) {
        const { data, error } = await supabase.from('body_weight_log')
          .insert(localBW.map((e: any) => ({ date: e.date, weight: e.weight }))).select();
        if (error) throw error;
        bwRows = data ?? [];
      }
      const goal     = rawGoal  ? clampGoal(parseInt(rawGoal, 10)) : null;
      const prefsObj = rawPrefs ? JSON.parse(rawPrefs) : null;
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

        if (workoutRows.length === 0 && bwRows.length === 0 && !settingsRow) {
          const migrated = await migrateLocalToServer(session.user.id);
          if (migrated) { workoutRows = migrated.workoutRows; bwRows = migrated.bwRows; settingsRow = migrated.settingsRow; }
        }
        if (cancelled) return;

        setWorkouts(workoutRows.map(rowToWorkout));
        setBodyWeightLog(bwRows.map(rowToBW));
        if (settingsRow) {
          if (Number.isFinite(settingsRow.weekly_goal)) setWeeklyGoal(clampGoal(settingsRow.weekly_goal));
          if (settingsRow.prefs) setPrefs({ ...DEFAULT_PREFS, ...settingsRow.prefs, hidden: Array.isArray(settingsRow.prefs.hidden) ? settingsRow.prefs.hidden : [] });
        }
      } catch (e) {
        console.error('Hydrate failed', e);   // keep the localStorage cache; app still usable offline
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

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

  // Sync weekly goal + prefs to Supabase (one row per user). Debounced so a slider
  // drag or colour-picker sweep is one upsert, not dozens. Gated on `hydrated` so
  // it can't fire with default values before the initial load lands.
  useEffect(() => {
    if (!hydrated || !session) return;
    const t = setTimeout(() => {
      supabase.from('settings')
        .upsert({ user_id: session.user.id, weekly_goal: weeklyGoal, prefs, updated_at: new Date().toISOString() })
        .then(({ error }: any) => { if (error) console.error('Settings save failed', error); });
    }, 600);
    return () => clearTimeout(t);
  }, [weeklyGoal, prefs, hydrated, session]);

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
      bodyWeight: fromInputWeight(bodyWeight, units),   // typed in display units → stored kg
      exercises: [],
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

  const finishWorkout = async () => {
    // Drop exercises that never got a set — an empty card is nothing to log and
    // would just clutter history.
    const exercises = currentWorkout.exercises.filter((ex: any) => ex.sets.length > 0);
    if (exercises.length === 0) return;   // the Finish button also guards this
    // Session length = wall-clock from start, minus any paused time (freeze at the
    // pause point if still paused). Logged only when the session timer is on — read
    // from the per-session override, not the saved default.
    const startMs   = new Date(currentWorkout.date).getTime();
    const pausedMs  = currentWorkout.pausedMs || 0;
    const endMs     = currentWorkout.pausedAt != null ? new Date(currentWorkout.pausedAt).getTime() : Date.now();
    const duration  = Number.isFinite(startMs) ? Math.max(0, Math.round((endMs - startMs - pausedMs) / 1000)) : 0;
    const timerOn   = currentWorkout.workoutTimer ?? prefs.workoutTimer;
    // Strip the per-session timer bookkeeping from the permanent record.
    const { workoutTimer: _wt, restTimer: _rt, pausedMs: _pm, pausedAt: _pa, ...base } = currentWorkout;
    const completed = { ...base, exercises, notes: workoutNotes, ...(timerOn ? { duration } : {}) };

    // Optimistic: show it immediately under a temp id, then swap in the row the
    // server returns (with its real uuid). If the insert fails we keep the temp
    // row — it stays in the localStorage cache, so the session isn't lost.
    const tempId = crypto.randomUUID();
    setWorkouts(prev => [...prev, { ...completed, id: tempId }]);
    // Only log a real weigh-in — a skipped (null) body weight isn't a data point.
    const bwTempId = completed.bodyWeight != null ? crypto.randomUUID() : null;
    if (bwTempId) {
      setBodyWeightLog(prev => [...prev, { id: bwTempId, date: completed.date, weight: completed.bodyWeight }]);
    }
    setCurrentWorkout(null);
    setSelectedWorkoutType(null);
    setBodyWeight('');
    setWorkoutNotes('');
    setCurrentScreen('home');

    const { data, error } = await supabase.from('workouts').insert(workoutToRow(completed)).select().single();
    if (error) console.error('Save workout failed', error);
    else setWorkouts(prev => prev.map(w => w.id === tempId ? rowToWorkout(data) : w));
    if (bwTempId) {
      const { data: bw, error: bwErr } = await supabase.from('body_weight_log')
        .insert({ date: completed.date, weight: completed.bodyWeight }).select().single();
      if (bwErr) console.error('Save weigh-in failed', bwErr);
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

  const handleQuickBWLog = async () => {
    if (!quickBWInput) return;
    const kg = fromInputWeight(quickBWInput, units);   // typed in display units → stored kg
    if (kg == null) return;
    const temp = { id: crypto.randomUUID(), date: new Date().toISOString(), weight: kg };
    setBodyWeightLog(prev => [...prev, temp]);
    setQuickBWInput('');
    const { data, error } = await supabase.from('body_weight_log')
      .insert({ date: temp.date, weight: kg }).select().single();
    if (error) console.error('Save weigh-in failed', error);
    else setBodyWeightLog(prev => prev.map(e => e.id === temp.id ? rowToBW(data) : e));
  };

  // Identity is the row uuid now (not the array index): HistoryScreen resolves
  // workouts[originalIndex].id and passes it here, so a sorted/filtered/calendar
  // subset always routes to the right row.
  const deleteWorkout = async (id: string) => {
    const removed = workouts.find(w => w.id === id);
    setWorkouts(w => w.filter(x => x.id !== id));   // optimistic
    const { error } = await supabase.from('workouts').delete().eq('id', id);
    if (error) { console.error('Delete workout failed', error); if (removed) setWorkouts(prev => [...prev, removed]); }
  };

  const updateWorkout = async (id: string, updated: any) => {
    setWorkouts(w => w.map(item => item.id === id ? { ...updated, id } : item));   // optimistic
    const { error } = await supabase.from('workouts').update(workoutToRow(updated)).eq('id', id);
    if (error) console.error('Update workout failed', error);

    // Keep the body-weight log in step: the finish-time entry shares the workout's
    // date, so edit/clear it here too — otherwise the chart and readout keep the
    // old (or wrong) number the History edit was meant to fix.
    const existing = bodyWeightLog.find(e => e.date === updated.date);
    if (updated.bodyWeight == null) {
      if (existing) {
        setBodyWeightLog(prev => prev.filter(e => e.id !== existing.id));
        const { error: e2 } = await supabase.from('body_weight_log').delete().eq('id', existing.id);
        if (e2) console.error('Delete weigh-in failed', e2);
      }
    } else if (existing) {
      setBodyWeightLog(prev => prev.map(e => e.id === existing.id ? { ...e, weight: updated.bodyWeight } : e));
      const { error: e2 } = await supabase.from('body_weight_log').update({ weight: updated.bodyWeight }).eq('id', existing.id);
      if (e2) console.error('Update weigh-in failed', e2);
    } else {
      const { data, error: e2 } = await supabase.from('body_weight_log')
        .insert({ date: updated.date, weight: updated.bodyWeight }).select().single();
      if (e2) console.error('Add weigh-in failed', e2);
      else setBodyWeightLog(prev => [...prev, rowToBW(data)]);
    }
  };

  // Remove a body-weight data point (a fat-fingered entry, say). Keyed by row uuid.
  const deleteBodyWeightEntry = async (id: string) => {
    const removed = bodyWeightLog.find(e => e.id === id);
    setBodyWeightLog(log => log.filter(e => e.id !== id));   // optimistic
    const { error } = await supabase.from('body_weight_log').delete().eq('id', id);
    if (error) { console.error('Delete weigh-in failed', error); if (removed) setBodyWeightLog(prev => [...prev, removed]); }
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
  const openSettings = () => { setSettingsFrom(currentScreen); setCurrentScreen('settings'); };

  // ── Data management (export / import / wipe) ─────────────────────────────────
  const exportData = () => {
    try {
      const payload = {
        app: 'FitPulse', version: 1, exportedAt: new Date().toISOString(),
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
    } catch { /* ignore */ }
  };

  // Returns a promise so Settings can report success/failure to the user.
  const importData = (file: File): Promise<boolean> =>
    new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const d = JSON.parse(String(reader.result));
          if (!Array.isArray(d.workouts) || !session) { resolve(false); return; }
          const uid = session.user.id;

          // Replace the account's server data wholesale, then seed state from the
          // rows we inserted (so every workout carries its new uuid).
          await supabase.from('workouts').delete().eq('user_id', uid);
          await supabase.from('body_weight_log').delete().eq('user_id', uid);

          let wRows: any[] = [];
          if (d.workouts.length) {
            const { data, error } = await supabase.from('workouts').insert(d.workouts.map(workoutToRow)).select();
            if (error) throw error;
            wRows = data ?? [];
          }
          const bwIn = Array.isArray(d.bodyWeightLog) ? d.bodyWeightLog : [];
          let bwRows: any[] = [];
          if (bwIn.length) {
            const { data, error } = await supabase.from('body_weight_log')
              .insert(bwIn.map((e: any) => ({ date: e.date, weight: e.weight }))).select();
            if (error) throw error;
            bwRows = data ?? [];
          }
          const goal     = Number.isFinite(d.weeklyGoal) ? clampGoal(d.weeklyGoal) : 4;
          const prefsObj = d.prefs
            ? { ...DEFAULT_PREFS, ...d.prefs, hidden: Array.isArray(d.prefs.hidden) ? d.prefs.hidden : [] }
            : DEFAULT_PREFS;
          const { error: sErr } = await supabase.from('settings')
            .upsert({ user_id: uid, weekly_goal: goal, prefs: prefsObj, updated_at: new Date().toISOString() });
          if (sErr) throw sErr;

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

  const clearAllData = async () => {
    setWorkouts([]);
    setBodyWeightLog([]);
    setWeeklyGoal(4);
    setPrefs(DEFAULT_PREFS);
    setCurrentWorkout(null);
    try { localStorage.removeItem(ACTIVE_KEY); } catch { /* ignore */ }
    if (session) {
      const uid = session.user.id;
      const results = await Promise.all([
        supabase.from('workouts').delete().eq('user_id', uid),
        supabase.from('body_weight_log').delete().eq('user_id', uid),
        supabase.from('settings').delete().eq('user_id', uid),
      ]);
      results.forEach(({ error }: any) => { if (error) console.error('Clear data failed', error); });
    }
  };

  // End the session and drop the in-memory data (the next sign-in re-hydrates).
  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch (e) { console.error('Sign out failed', e); }
    setWorkouts([]);
    setBodyWeightLog([]);
    setWeeklyGoal(4);
    setPrefs(DEFAULT_PREFS);
    setCurrentWorkout(null);
    setCurrentScreen('home');
    setRecovery(false);   // signing out from the reset screen must clear the flag, or it re-pins us there
  };

  // Change the signed-in user's password (from Settings). Returns null on
  // success or friendly error copy — the component stays presentational.
  const changePassword = async (newPassword: string): Promise<string | null> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error ? authErrorText(error) : null;
  };

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

  // The dashboard muscle-focus donut is scoped to the last 30 days — a rolling
  // "what have I been hitting lately" read, distinct from Progress's selectable
  // window. The heading carries the range so the number isn't mistaken for all-time.
  const last30Workouts = (() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return workouts.filter((w: any) => new Date(w.date) >= cutoff);
  })();

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

  // Auth/config gates. Every hook above runs on each render, so these early
  // returns are safe. Missing env → config help; still checking → loader;
  // reset link in progress → set-new-password (checked before !session because
  // a recovery link carries a real session we must not let through); signed out
  // → login.
  if (!supabaseEnabled) return <ConfigError />;
  if (!authReady)       return <FullScreenLoader />;
  if (recovery)         return <ResetPasswordScreen onDone={() => setRecovery(false)} onSignOut={signOut} />;
  if (!session)         return <LoginScreen />;

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
                onClick={openSettings}
                className={`p-2 -mr-2 rounded-ctl transition-colors ${currentScreen === 'settings' ? 'text-accent' : 'text-muted hover:text-ink'}`}
                aria-label="Settings"
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
                              className="text-faint hover:text-crit transition-colors"
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
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-ctl ${entryTypeCfg.iconBg} grid place-items-center`}>
                <EntryTypeIcon size={20} className={entryTypeCfg.color} />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold uppercase tracking-wide text-ink leading-none">{entryTypeCfg.label}</h2>
                <p className="text-xs text-faint mt-1.5">Weigh in, or skip to start</p>
              </div>
            </div>

            <label htmlFor="entry-bw" className={`${label} block mb-2`}>Body weight ({units}) — optional</label>
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
          units={units}
          restTimer={prefs.restTimer}
          restSeconds={prefs.restSeconds}
          workoutTimer={prefs.workoutTimer}
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
        <SettingsScreen
          prefs={prefs} updatePrefs={updatePrefs} toggleHidden={toggleHidden}
          theme={theme} themeMode={mode} setThemeMode={setMode}
          onExport={exportData} onImport={importData} onClearData={clearAllData}
          onSignOut={signOut} onChangePassword={changePassword} userEmail={session?.user?.email}
          onDone={() => setCurrentScreen(settingsFrom)}
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
    </div>
  );
};

export default GymTrackerApp;
