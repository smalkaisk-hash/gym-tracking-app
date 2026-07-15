import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, TrendingUp, Dumbbell, Calendar, FileText, Edit2, Save, Target, Activity, ChevronRight, ChevronDown, Flame, Layers, Maximize2, Anchor, Mountain, Sun, Moon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

const STORAGE_KEY = 'gym-workouts';
const BW_LOG_KEY  = 'gym-bw-log';
const GOAL_KEY    = 'gym-weekly-goal';

// Seven days in a week, and almost nobody trains twice in one.
const GOAL_MIN = 1;
const GOAL_MAX = 7;
const THEME_KEY   = 'gym-theme';

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
const CHART = {
  dark:  { accent: '#2E7BD6', series2: '#E0A63C', grid: '#26313A', axis: '#5A6874', surface: '#151C21', line: '#26313A', muted: '#8B9AA7' },
  light: { accent: '#1B5FBF', series2: '#A9741F', grid: '#D7DEE3', axis: '#93A1AC', surface: '#FFFFFF', line: '#D7DEE3', muted: '#5A6874' },
};

const volumeOf = (exercise: any) =>
  exercise.sets.reduce((sum: number, s: any) => sum + (s.reps || 0) * (s.weight || 0), 0);

const fmtVolume = (kg: number) =>
  kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)} kg`;

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
const SetRow = ({ index, set, isTop, onRemove }: any) => {
  const bodyweight = set.weight == null;

  return (
    <div className="flex items-center justify-between gap-3 bg-raised rounded-ctl px-3 py-2">
      <span className={`${label} text-faint`}>Set {index + 1}</span>
      <div className="flex items-baseline gap-1.5">
        {bodyweight ? (
          <span className="text-[11px] font-semibold text-faint mr-1">Bodyweight</span>
        ) : (
          <>
            <span className={`${readout} text-2xl ${isTop ? 'text-accent' : ''}`}>{set.weight}</span>
            <span className="text-[11px] font-semibold text-muted">kg</span>
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
const ExerciseCard = ({ exercise, exerciseIndex, addSet, removeSet, removeExercise, updateExerciseNotes }: any) => {
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
                (volume > 0 ? ` · ${fmtVolume(volume)} moved` : '')}
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
          placeholder={weightOptional ? 'kg — optional' : 'kg'}
          aria-label={weightOptional ? 'Weight in kilograms (optional — leave blank for bodyweight)' : 'Weight in kilograms'}
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
const WorkoutScreen = ({ workout, workoutType, addExercise, addSet, removeSet, removeExercise, updateExerciseNotes, finishWorkout, cancelWorkout, workoutNotes, setWorkoutNotes }: any) => {
  const [showExerciseList, setShowExerciseList]     = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [showCancelConfirm, setShowCancelConfirm]   = useState(false);
  const [openGroup, setOpenGroup]                   = useState<string | null>(null);

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
              <span className={`${readout} text-4xl`}>{fmtVolume(totalVolume).replace(/ kg|t$/, '')}</span>
              <span className="text-xs font-semibold text-muted">{totalVolume >= 1000 ? 'tonnes moved' : 'kg moved'}</span>
            </div>
          </div>
          <div className="text-right">
            <p className={label}>Body wt</p>
            <p className={`${readout} text-xl mt-1`}>{workout.bodyWeight}<span className="text-[11px] font-semibold text-muted ml-1">kg</span></p>
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
            addSet={addSet}
            removeSet={removeSet}
            removeExercise={removeExercise}
            updateExerciseNotes={updateExerciseNotes}
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

      {/* Sticky action bar — primary action sits in the thumb zone. */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line p-3 pb-safe z-40">
        <div className="max-w-3xl mx-auto flex gap-2">
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
const HistoryScreen = ({ workouts, deleteWorkout, updateWorkout }: any) => {
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
    // Clearing the weight field means bodyweight, not NaN.
    u.exercises[exIdx].sets[setIdx][field] =
      field === 'weight' && val.trim() === '' ? null : parseFloat(val);
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
                        <p className={`${readout} text-lg`}>{fmtVolume(sessionVolume)}</p>
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
                        <label htmlFor={`bw-${index}`} className={`${label} block mb-2`}>Body weight (kg)</label>
                        <input
                          id={`bw-${index}`}
                          type="number" step="0.1" inputMode="decimal"
                          value={editData.bodyWeight}
                          onChange={e => setEditData({ ...editData, bodyWeight: parseFloat(e.target.value) })}
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
                                <span className="text-xs text-faint tabular-nums flex-shrink-0">{fmtVolume(volumeOf(exercise))}</span>
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
                                      {/* ?? '' keeps this controlled when the set is bodyweight. */}
                                      <input type="number" inputMode="decimal" step="0.1" aria-label="Weight (blank for bodyweight)" placeholder="BW" value={set.weight ?? ''} onChange={e => updateSetValue(exIdx, si, 'weight', e.target.value)} className={`${editInput} w-16`} />
                                      <span className="text-muted text-xs font-semibold">kg</span>
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

// ─── ProgressScreen ────────────────────────────────────────────────────────────
const ProgressScreen = ({ workouts, bodyWeightLog, theme }: any) => {
  const [timeframe, setTimeframe]               = useState('30days');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [customStartDate, setCustomStartDate]   = useState('');
  const [customEndDate, setCustomEndDate]       = useState('');

  const c = CHART[theme as Theme];

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
        maxWeight,
        repsAtMaxWeight: maxWeightSet?.reps ?? 0,
      }];
    });
  };

  const getBodyWeightData = () =>
    filterByDate(bodyWeightLog).map((e: any) => ({
      date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      bodyWeight: e.weight,
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

      {selectedExercise && exerciseData.length > 0 && (
        <div className={`${card} p-4 mb-3`}>
          <h3 className={`${label} mb-4`}>{selectedExercise} — top set</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={exerciseData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={c.grid} vertical={false} />
              <XAxis dataKey="date" {...axis} tickLine={false} />
              <YAxis {...axis} tickLine={false} width={44} unit=" kg" />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: c.muted }}
                cursor={{ stroke: c.grid }}
                formatter={(value: any, _name: string, props: any) =>
                  [`${value} kg × ${props.payload.repsAtMaxWeight} reps`, 'Top set']
                }
              />
              <Line type="monotone" dataKey="maxWeight" stroke={c.accent} strokeWidth={2} dot={{ fill: c.accent, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {selectedExercise && exerciseData.length === 0 && (
        <div className={`${card} p-8 mb-3 text-center`}>
          <p className="text-muted text-sm">No <span className="text-ink font-medium">{selectedExercise}</span> logged in this timeframe.</p>
        </div>
      )}

      {bodyWeightData.length > 0 && (
        <div className={`${card} p-4`}>
          <h3 className={`${label} mb-4`}>Body weight</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={bodyWeightData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={c.grid} vertical={false} />
              <XAxis dataKey="date" {...axis} tickLine={false} />
              <YAxis {...axis} tickLine={false} width={44} unit=" kg" domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: c.muted }} cursor={{ stroke: c.grid }} formatter={(v: any) => [`${v} kg`, 'Body weight']} />
              <Line type="monotone" dataKey="bodyWeight" stroke={c.series2} strokeWidth={2} dot={{ fill: c.series2, r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
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

  const { theme, toggle } = useTheme();
  const c = CHART[theme];

  // Load from localStorage. Reads synchronously before the write-back effects
  // below fire on mount — don't reorder or early-return past this.
  useEffect(() => {
    try {
      const stored     = localStorage.getItem(STORAGE_KEY);
      const storedBW   = localStorage.getItem(BW_LOG_KEY);
      const storedGoal = localStorage.getItem(GOAL_KEY);

      const loadedWorkouts = stored ? JSON.parse(stored) : [];
      if (loadedWorkouts.length > 0) setWorkouts(loadedWorkouts);
      // Clamp on read: a goal saved before the 7/week cap would otherwise survive it.
      if (storedGoal) {
        const g = parseInt(storedGoal);
        if (!Number.isNaN(g)) setWeeklyGoal(Math.min(GOAL_MAX, Math.max(GOAL_MIN, g)));
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

  // ── Workout actions ──────────────────────────────────────────────────────────
  const startWorkout = (type: string) => {
    setSelectedWorkoutType(type);
    setCurrentScreen('enterBodyWeight');
  };

  const confirmBodyWeight = () => {
    if (!bodyWeight) return;
    setCurrentWorkout({
      type: selectedWorkoutType,
      bodyWeight: parseFloat(bodyWeight),
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
    // A blank weight means bodyweight, stored as null — not 0, and never the NaN
    // that parseFloat('') would give.
    const load = weight.trim() === '' ? null : parseFloat(weight);
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
    setBodyWeightLog(prev => [...prev, { date: new Date().toISOString(), weight: parseFloat(quickBWInput) }]);
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

  const getLatestBodyWeight = () => {
    if (bodyWeightLog.length === 0) return '—';
    const sorted = [...bodyWeightLog].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return `${sorted[0].weight} kg`;
  };

  const getLatestWorkoutType = () => {
    if (workouts.length === 0) return '—';
    const cfg = TYPE_CONFIG[workouts[workouts.length - 1].type];
    return cfg?.label ?? '—';
  };

  // Body weight chart data for home (last 15 entries)
  const bwChartData = bodyWeightLog.slice(-15).map(e => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    bodyWeight: e.weight,
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
          <button
            onClick={toggle}
            className="p-2 -mr-2 rounded-ctl text-muted hover:text-ink transition-colors"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
        {/* Knurling — the grip band on a bar. */}
        <div className="knurl h-[3px] opacity-70" aria-hidden="true" />
      </header>

      {/* ── Home ── */}
      {currentScreen === 'home' && (
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-24 flex flex-col gap-3">

          {/* Stat row */}
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

          {/* Body weight */}
          <div className={`${card} p-4`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className={label}>Body weight</h3>
              <div className="flex items-baseline gap-1">
                <span className={`${readout} text-2xl`}>{getLatestBodyWeight().replace(' kg', '')}</span>
                {bodyWeightLog.length > 0 && <span className="text-[11px] font-semibold text-muted">kg</span>}
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="number" step="0.1" inputMode="decimal"
                placeholder="Log today's weight"
                aria-label="Log today's body weight in kilograms"
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
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={bwChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={c.grid} vertical={false} />
                  <XAxis dataKey="date" stroke={c.axis} tickLine={false} style={{ fontSize: '10px', fontFamily: 'Barlow, system-ui, sans-serif' }} />
                  <YAxis stroke={c.axis} tickLine={false} width={38} domain={['dataMin - 1', 'dataMax + 1']} style={{ fontSize: '10px', fontFamily: 'Barlow, system-ui, sans-serif' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: c.surface, border: `1px solid ${c.line}`, borderRadius: '6px', fontFamily: 'Barlow, system-ui, sans-serif', fontSize: '12px' }}
                    labelStyle={{ color: c.muted }}
                    cursor={{ stroke: c.grid }}
                    formatter={(v: any) => [`${v} kg`, 'Body weight']}
                  />
                  <Line type="monotone" dataKey="bodyWeight" stroke={c.series2} strokeWidth={2} dot={{ fill: c.series2, r: 2.5, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-faint text-center py-6">Log two entries to see a trend.</p>
            )}
          </div>

          {/* Session log — quiet reference, so it sits last. */}
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

            <label htmlFor="entry-bw" className={`${label} block mb-2`}>Body weight (kg)</label>
            <input
              id="entry-bw"
              type="number" step="0.1" inputMode="decimal"
              value={bodyWeight}
              onChange={e => setBodyWeight(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmBodyWeight()}
              className={`${input} w-full font-display text-3xl font-bold tabular-nums text-center py-4`}
              placeholder="82.5"
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
        />
      )}

      {/* ── History ── */}
      {currentScreen === 'history' && (
        <HistoryScreen workouts={workouts} deleteWorkout={deleteWorkout} updateWorkout={updateWorkout} />
      )}

      {/* ── Progress ── */}
      {currentScreen === 'progress' && (
        <ProgressScreen workouts={workouts} bodyWeightLog={bodyWeightLog} theme={theme} />
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
