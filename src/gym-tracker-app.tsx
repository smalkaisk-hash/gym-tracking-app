import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, TrendingUp, Dumbbell, Calendar, FileText, Edit2, Save, Zap, Target, Activity, BarChart3, ChevronRight, ChevronDown, Flame, Layers, Maximize2, Anchor, Mountain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const EXERCISES = {
  push: [
    'Bench Press', 'Incline Bench Press', 'Decline Bench Press',
    'Dumbbell Press', 'Shoulder Press', 'Lateral Raises',
    'Front Raises', 'Tricep Dips', 'Tricep Pushdowns',
    'Overhead Tricep Extension', 'Close Grip Bench Press', 'Push-ups'
  ],
  pull: [
    'Deadlift', 'Barbell Row', 'Dumbbell Row',
    'Pull-ups', 'Chin-ups', 'Lat Pulldown',
    'Seated Cable Row', 'Face Pulls', 'Barbell Curl',
    'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl'
  ],
  legs: [
    'Squat', 'Front Squat', 'Leg Press',
    'Romanian Deadlift', 'Leg Curl', 'Leg Extension',
    'Lunges', 'Bulgarian Split Squat', 'Calf Raises',
    'Seated Calf Raises', 'Hip Thrust', 'Glute Bridge'
  ]
} as const;

const ALL_EXERCISES = [...EXERCISES.push, ...EXERCISES.pull, ...EXERCISES.legs].sort();

const STORAGE_KEY  = 'gym-workouts';
const BW_LOG_KEY   = 'gym-bw-log';
const GOAL_KEY     = 'gym-weekly-goal';

const card       = 'bg-zinc-900 border border-white/[0.06] rounded-2xl shadow-xl shadow-black/50';
const input      = 'bg-zinc-800 border border-white/[0.06] rounded-xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/60 transition-colors';
const btnPrimary = 'bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20';
const btnSecondary = 'bg-zinc-800 hover:bg-zinc-700 border border-white/[0.06] text-white font-bold rounded-xl transition-colors';
const btnDanger  = 'bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors';

const TYPE_CONFIG: Record<string, { label: string; Icon: any; color: string; iconBg: string }> = {
  push:   { label: 'Push Day', Icon: Maximize2, color: 'text-orange-500', iconBg: 'bg-orange-500/10' },
  pull:   { label: 'Pull Day', Icon: Anchor,    color: 'text-orange-500', iconBg: 'bg-orange-500/10' },
  legs:   { label: 'Leg Day',  Icon: Mountain,  color: 'text-orange-500', iconBg: 'bg-orange-500/10' },
  custom: { label: 'Custom',   Icon: Layers,    color: 'text-zinc-400',   iconBg: 'bg-zinc-700'      },
};

const tooltipStyle = { backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' };

// ─── ExerciseCard ──────────────────────────────────────────────────────────────
const ExerciseCard = ({ exercise, exerciseIndex, addSet, removeSet, removeExercise, updateExerciseNotes }: any) => {
  const [reps, setReps]     = useState('');
  const [weight, setWeight] = useState('');

  const inputCls = 'bg-zinc-800 border border-white/[0.06] rounded-xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/60 transition-colors';

  const handleAddSet = () => {
    if (reps && weight) {
      addSet(exerciseIndex, reps, weight);
      setReps('');
      setWeight('');
    }
  };

  const noSets = exercise.sets.length === 0;

  return (
    <div className={`${card} ${noSets ? 'border-dashed' : ''} p-4 sm:p-5`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-white">{exercise.name}</h3>
          {noSets && <p className="text-xs text-zinc-600 mt-0.5">No sets logged yet</p>}
        </div>
        <button onClick={() => removeExercise(exerciseIndex)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-zinc-600 hover:text-red-500 flex-shrink-0">
          <Trash2 size={17} />
        </button>
      </div>

      {exercise.sets.length > 0 && (
        <div className="space-y-2 mb-3">
          {exercise.sets.map((set: any, si: number) => (
            <div key={si} className="flex justify-between items-center bg-zinc-800 px-4 py-3 rounded-xl">
              <span className="text-zinc-500 text-sm">Set {si + 1}</span>
              <span className="font-semibold text-white text-sm">{set.reps} reps × {set.weight} kg</span>
              <button onClick={() => removeSet(exerciseIndex, si)} className="text-zinc-600 hover:text-red-500 transition-colors ml-2">
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-7 gap-2 mb-3">
        <input
          type="number" placeholder="Reps"
          value={reps} onChange={e => setReps(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddSet()}
          className={`${inputCls} col-span-2 text-sm`}
        />
        <input
          type="number" step="0.1" placeholder="kg"
          value={weight} onChange={e => setWeight(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddSet()}
          className={`${inputCls} col-span-2 text-sm`}
        />
        <button
          onClick={handleAddSet}
          disabled={!reps || !weight}
          className="col-span-3 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl transition-colors text-sm disabled:cursor-not-allowed"
        >
          + Set
        </button>
      </div>

      <textarea
        value={exercise.notes || ''}
        onChange={e => updateExerciseNotes(exerciseIndex, e.target.value)}
        placeholder="Notes (optional)"
        className={`${inputCls} w-full text-sm min-h-16 resize-none`}
      />
    </div>
  );
};

// ─── WorkoutScreen ─────────────────────────────────────────────────────────────
const WorkoutScreen = ({ workout, workoutType, addExercise, addSet, removeSet, removeExercise, updateExerciseNotes, finishWorkout, cancelWorkout, workoutNotes, setWorkoutNotes }: any) => {
  const [showExerciseList, setShowExerciseList]     = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [showCancelConfirm, setShowCancelConfirm]   = useState(false);

  const cfg               = TYPE_CONFIG[workoutType] ?? TYPE_CONFIG.custom;
  const WorkoutIcon       = cfg.Icon;
  const availableExercises = workoutType === 'custom' ? ALL_EXERCISES : (EXERCISES as any)[workoutType] ?? [];

  const handleAddCustomExercise = () => {
    const name = customExerciseName.trim();
    if (name) {
      addExercise(name);
      setCustomExerciseName('');
      setShowExerciseList(false);
    }
  };

  const inputCls = 'bg-zinc-800 border border-white/[0.06] rounded-xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/60 transition-colors';

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-32">

      {/* Header */}
      <div className={`${card} p-4 sm:p-5 mb-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{cfg.label}</h2>
            <p className="text-zinc-500 text-sm mt-1">Body weight: <span className="text-white font-semibold">{workout.bodyWeight} kg</span></p>
          </div>
          <div className={`w-12 h-12 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
            <WorkoutIcon size={22} className={cfg.color} />
          </div>
        </div>
      </div>

      {/* Add exercise button */}
      <button
        onClick={() => setShowExerciseList(v => !v)}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold p-4 rounded-xl mb-4 flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={20} />
        {showExerciseList ? 'Close List' : 'Add Exercise'}
      </button>

      {/* Exercise picker */}
      {showExerciseList && (
        <div className={`${card} p-4 mb-4 max-h-72 sm:max-h-80 overflow-y-auto`}>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Type custom exercise name..."
              value={customExerciseName}
              onChange={e => setCustomExerciseName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCustomExercise()}
              className={`${inputCls} flex-1 py-2 text-sm`}
            />
            <button
              onClick={handleAddCustomExercise}
              disabled={!customExerciseName.trim()}
              className={`${btnPrimary} px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="h-px bg-white/[0.06] mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {availableExercises.map((ex: string) => (
              <button
                key={ex}
                onClick={() => { addExercise(ex); setShowExerciseList(false); }}
                className="text-left p-3 hover:bg-zinc-800 rounded-xl transition-colors text-sm text-white font-medium"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exercise cards */}
      <div className="space-y-3 sm:space-y-4">
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

      {/* Workout notes */}
      <div className={`${card} p-4 sm:p-5 mt-4 mb-24`}>
        <label className="block mb-2 text-sm font-semibold text-zinc-400 uppercase tracking-wider">Workout Notes</label>
        <textarea
          value={workoutNotes}
          onChange={e => setWorkoutNotes(e.target.value)}
          placeholder="How did it feel?"
          className={`${input} w-full min-h-24 resize-none`}
        />
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-white/[0.06] p-4 z-40">
        <div className="max-w-3xl mx-auto flex gap-3">
          {showCancelConfirm ? (
            <>
              <button onClick={cancelWorkout} className={`${btnDanger} flex-1 p-4`}>
                Discard Session
              </button>
              <button onClick={() => setShowCancelConfirm(false)} className={`${btnSecondary} flex-1 p-4`}>
                Keep Going
              </button>
            </>
          ) : (
            <>
              <button
                onClick={finishWorkout}
                disabled={workout.exercises.length === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold p-4 rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                Finish Workout
              </button>
              <button onClick={() => setShowCancelConfirm(true)} className={`${btnSecondary} flex-1 p-4`}>
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

  const cancelEditing  = () => { setEditingWorkout(null); setEditData(null); };

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
    u.exercises[exIdx].sets[setIdx][field] = parseFloat(val);
    setEditData(u);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const inputCls = 'bg-zinc-800 border border-white/[0.06] rounded-xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/60 transition-colors';

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <Calendar size={18} className="text-orange-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">History</h2>
      </div>

      {sortedWorkouts.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <Calendar size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">No workouts yet. Complete your first session!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedWorkouts.map((workout: any, index: number) => {
            const isEditing      = editingWorkout === index;
            const displayWorkout = isEditing ? editData : workout;
            const typeCfg        = TYPE_CONFIG[workout.type] ?? TYPE_CONFIG.custom;
            const TypeIcon       = typeCfg.Icon;

            return (
              <div key={index} className={`${card} overflow-hidden`}>
                {/* Row */}
                <button onClick={() => toggleWorkout(index)} className="w-full p-4 sm:p-5 text-left hover:bg-zinc-800/40 transition-colors">
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${typeCfg.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <TypeIcon size={18} className={typeCfg.color} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white truncate">{typeCfg.label}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{formatDate(workout.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm text-zinc-500">{workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}</p>
                        <p className="text-sm font-semibold text-zinc-400">{workout.bodyWeight} kg</p>
                      </div>
                      <ChevronRight size={17} className={`text-zinc-600 transition-transform ${expandedWorkout === index ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </button>

                {/* Expanded */}
                {expandedWorkout === index && (
                  <div className="border-t border-white/[0.06]">

                    {/* Action bar */}
                    <div className="p-4 border-b border-white/[0.06] flex gap-2 flex-wrap">
                      {!isEditing ? (
                        <button
                          onClick={e => { e.stopPropagation(); startEditing(index, workout); }}
                          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-white/[0.06] px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                      ) : (
                        <>
                          <button onClick={e => { e.stopPropagation(); saveEditing(index); }} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors">
                            <Save size={13} /> Save
                          </button>
                          <button onClick={e => { e.stopPropagation(); cancelEditing(); }} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-white/[0.06] px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors">
                            <X size={13} /> Cancel
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(index); }} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ml-auto">
                            <Trash2 size={13} /> Delete
                          </button>
                        </>
                      )}
                    </div>

                    {/* Edit body weight */}
                    {isEditing && (
                      <div className="p-4 border-b border-white/[0.06]">
                        <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Body Weight (kg)</label>
                        <input
                          type="number" step="0.1"
                          value={editData.bodyWeight}
                          onChange={e => setEditData({ ...editData, bodyWeight: parseFloat(e.target.value) })}
                          className={`${inputCls} w-full`}
                        />
                      </div>
                    )}

                    {/* Workout notes */}
                    {displayWorkout.notes && (
                      <div className="p-4 border-b border-white/[0.06]">
                        <button
                          onClick={() => setViewingNotes(viewingNotes === index ? null : index)}
                          className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
                        >
                          <FileText size={15} className="text-orange-500" />
                          {viewingNotes === index ? 'Hide notes' : 'View notes'}
                          <ChevronDown size={13} className={`transition-transform ${viewingNotes === index ? 'rotate-180' : ''}`} />
                        </button>
                        {(viewingNotes === index || isEditing) && (
                          isEditing ? (
                            <textarea
                              value={editData.notes}
                              onChange={e => setEditData({ ...editData, notes: e.target.value })}
                              className={`${inputCls} w-full mt-3 min-h-20 resize-none`}
                            />
                          ) : (
                            <p className="mt-3 text-sm text-zinc-300 bg-zinc-800 rounded-xl p-3">{displayWorkout.notes}</p>
                          )
                        )}
                      </div>
                    )}

                    {/* Exercises */}
                    <div className="p-4 space-y-5">
                      {displayWorkout.exercises.map((exercise: any, exIdx: number) => (
                        <div key={exIdx}>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-white">{exercise.name}</h4>
                            {isEditing && (
                              <button
                                onClick={() => {
                                  const u = { ...editData };
                                  u.exercises.splice(exIdx, 1);
                                  setEditData(u);
                                }}
                                className="text-zinc-600 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            {exercise.sets.map((set: any, si: number) => (
                              <div key={si} className="flex justify-between items-center bg-zinc-800 rounded-xl px-4 py-2.5">
                                {isEditing ? (
                                  <>
                                    <span className="text-xs text-zinc-500">Set {si + 1}</span>
                                    <div className="flex gap-2 items-center">
                                      <input type="number" value={set.reps} onChange={e => updateSetValue(exIdx, si, 'reps', e.target.value)} className="w-16 bg-zinc-700 border border-white/[0.06] rounded-lg p-1.5 text-white text-center text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/30" />
                                      <span className="text-zinc-500 text-sm">×</span>
                                      <input type="number" step="0.1" value={set.weight} onChange={e => updateSetValue(exIdx, si, 'weight', e.target.value)} className="w-16 bg-zinc-700 border border-white/[0.06] rounded-lg p-1.5 text-white text-center text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/30" />
                                      <span className="text-zinc-500 text-sm">kg</span>
                                      <button onClick={() => { const u = { ...editData }; u.exercises[exIdx].sets.splice(si, 1); setEditData(u); }} className="text-zinc-600 hover:text-red-500 transition-colors ml-1">
                                        <X size={13} />
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-xs text-zinc-500">Set {si + 1}</span>
                                    <span className="text-sm font-semibold text-white">{set.reps} reps × {set.weight} kg</span>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>

                          {exercise.notes && (
                            <div className="mt-2">
                              {isEditing ? (
                                <textarea
                                  value={exercise.notes}
                                  onChange={e => { const u = { ...editData }; u.exercises[exIdx].notes = e.target.value; setEditData(u); }}
                                  className={`${inputCls} w-full text-sm min-h-16 resize-none mt-1`}
                                />
                              ) : (
                                <p className="text-xs text-zinc-500 mt-1.5 pl-1">
                                  <span className="text-zinc-600">Note: </span>{exercise.notes}
                                </p>
                              )}
                            </div>
                          )}

                          {exIdx < displayWorkout.exercises.length - 1 && (
                            <div className="border-b border-white/[0.06] mt-4" />
                          )}
                        </div>
                      ))}
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
const ProgressScreen = ({ workouts, bodyWeightLog }: any) => {
  const [timeframe, setTimeframe]           = useState('30days');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [customStartDate, setCustomStartDate]   = useState('');
  const [customEndDate, setCustomEndDate]       = useState('');

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
      const maxWeight    = Math.max(...ex.sets.map((s: any) => s.weight));
      const maxWeightSet = ex.sets.find((s: any) => s.weight === maxWeight);
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

  const selectCls = 'w-full bg-zinc-800 border border-white/[0.06] rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/60 transition-colors';
  const inputCls  = 'w-full bg-zinc-800 border border-white/[0.06] rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/60 transition-colors';

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <TrendingUp size={18} className="text-orange-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">Progress</h2>
      </div>

      {/* Merged filter card */}
      <div className={`${card} p-4 sm:p-5 mb-4 sm:mb-6`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Timeframe</label>
            <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className={selectCls}>
              <option value="30days">Last 30 Days</option>
              <option value="3months">Last 3 Months</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Exercise</label>
            <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)} className={selectCls}>
              <option value="">Choose an exercise...</option>
              {allExercisesUsed.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>
        </div>
        {timeframe === 'custom' && (
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/[0.06]">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Start</label>
              <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">End</label>
              <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}
      </div>

      {/* Exercise progress chart */}
      {selectedExercise && exerciseData.length > 0 && (
        <div className={`${card} p-4 sm:p-5 mb-4`}>
          <h3 className="font-bold text-white mb-5 flex items-center gap-2">
            <BarChart3 size={17} className="text-orange-500" />
            {selectedExercise} — Max Weight
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={exerciseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#52525b" style={{ fontSize: '11px' }} />
              <YAxis stroke="#52525b" style={{ fontSize: '11px' }} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(value: any, name: string, props: any) =>
                  [`${value} kg (${props.payload.repsAtMaxWeight} reps)`, 'Max Weight']
                }
              />
              <Line type="monotone" dataKey="maxWeight" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {selectedExercise && exerciseData.length === 0 && (
        <div className={`${card} p-8 mb-4 text-center`}>
          <p className="text-zinc-500 text-sm">No data for <span className="text-white">{selectedExercise}</span> in this timeframe.</p>
        </div>
      )}

      {/* Body weight chart */}
      {bodyWeightData.length > 0 && (
        <div className={`${card} p-4 sm:p-5`}>
          <h3 className="font-bold text-white mb-5 flex items-center gap-2">
            <Activity size={17} className="text-orange-500" />
            Body Weight
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={bodyWeightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" stroke="#52525b" style={{ fontSize: '11px' }} />
              <YAxis stroke="#52525b" style={{ fontSize: '11px' }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#a1a1aa' }} formatter={(v: any) => [`${v} kg`, 'Body Weight']} />
              <Line type="monotone" dataKey="bodyWeight" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {workouts.length === 0 && (
        <div className={`${card} p-12 text-center`}>
          <TrendingUp size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">Complete your first workout to see progress.</p>
        </div>
      )}
    </div>
  );
};

// ─── GymTrackerApp ─────────────────────────────────────────────────────────────
const GymTrackerApp = () => {
  const [currentScreen, setCurrentScreen]         = useState('home');
  const [workouts, setWorkouts]                   = useState<any[]>([]);
  const [bodyWeightLog, setBodyWeightLog]         = useState<{ date: string; weight: number }[]>([]);
  const [weeklyGoal, setWeeklyGoal]               = useState(4);
  const [currentWorkout, setCurrentWorkout]       = useState<any>(null);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string | null>(null);
  const [bodyWeight, setBodyWeight]               = useState('');
  const [workoutNotes, setWorkoutNotes]           = useState('');
  const [quickBWInput, setQuickBWInput]           = useState('');

  // Load from localStorage
  useEffect(() => {
    try {
      const stored      = localStorage.getItem(STORAGE_KEY);
      const storedBW    = localStorage.getItem(BW_LOG_KEY);
      const storedGoal  = localStorage.getItem(GOAL_KEY);

      const loadedWorkouts = stored ? JSON.parse(stored) : [];
      if (loadedWorkouts.length > 0) setWorkouts(loadedWorkouts);
      if (storedGoal) setWeeklyGoal(parseInt(storedGoal));

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
    setCurrentWorkout((w: any) => {
      const exercises = w.exercises.map((ex: any, i: number) =>
        i === exIdx ? { ...ex, sets: [...ex.sets, { reps: parseInt(reps), weight: parseFloat(weight) }] } : ex
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
    const today    = new Date();
    const todayMs  = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const dayMs    = 86400000;

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
    const last    = new Date(workouts[workouts.length - 1].date);
    const today   = new Date();
    const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const diff    = Math.round((todayDay - lastDay) / 86400000);
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

  // For enterBodyWeight screen
  const entryTypeCfg  = TYPE_CONFIG[selectedWorkoutType ?? 'custom'] ?? TYPE_CONFIG.custom;
  const EntryTypeIcon = entryTypeCfg.Icon;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* Header */}
      <header className="bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-center items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/30">
              <Zap size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">FitPulse</h1>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
      </header>

      {/* ── Home ── */}
      {currentScreen === 'home' && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24 space-y-3 sm:space-y-4">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Streak',    value: getWorkoutStreak(),                        sub: 'days',     Icon: Zap,      iconBg: 'bg-orange-500/10' },
              { label: 'This Week', value: `${Math.round(getWeeklyGoalProgress())}%`, sub: 'of goal',  Icon: Target,   iconBg: 'bg-orange-500/10' },
              { label: 'Total',     value: workouts.length,                           sub: 'sessions', Icon: Activity, iconBg: 'bg-orange-500/10' },
            ].map(({ label, value, sub, Icon, iconBg }) => (
              <div key={label} className={`${card} p-3 sm:p-4`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${iconBg} flex items-center justify-center mb-2 sm:mb-3`}>
                  <Icon size={14} className="text-orange-500" />
                </div>
                <p className="text-2xl sm:text-4xl font-black tracking-tight text-white">{value}</p>
                <p className="text-[10px] sm:text-xs text-zinc-500 mt-1 uppercase tracking-wider">{sub}</p>
                {label === 'This Week' && (
                  <div className="w-full bg-zinc-800 rounded-full h-1 mt-2 sm:mt-3">
                    <div className="bg-orange-500 h-1 rounded-full transition-all" style={{ width: `${getWeeklyGoalProgress()}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className={`${card} p-4 sm:p-5`}>
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChart3 size={14} className="text-orange-500" /> Quick Stats
            </h3>
            <div className="space-y-0">
              {[
                { label: 'Last Workout', value: getDaysSinceLastWorkout() },
                { label: 'Last Type',    value: getLatestWorkoutType()    },
                { label: 'Body Weight',  value: getLatestBodyWeight()     },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-zinc-800">
                  <span className="text-sm text-zinc-500">{row.label}</span>
                  <span className="text-sm font-semibold text-white">{row.value}</span>
                </div>
              ))}
              {/* Weekly goal control */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-zinc-500">Weekly Goal</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWeeklyGoal(g => Math.max(1, g - 1))}
                    className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white font-bold transition-colors text-base leading-none"
                  >−</button>
                  <span className="text-sm font-semibold text-white w-14 text-center">{weeklyGoal}/week</span>
                  <button
                    onClick={() => setWeeklyGoal(g => Math.min(14, g + 1))}
                    className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white font-bold transition-colors text-base leading-none"
                  >+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Body Weight */}
          <div className={`${card} p-4 sm:p-5`}>
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-orange-500" /> Body Weight
            </h3>
            <div className="flex gap-2 mb-3">
              <input
                type="number" step="0.1"
                placeholder="Log today's weight (kg)"
                value={quickBWInput}
                onChange={e => setQuickBWInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuickBWLog()}
                className={`${input} flex-1 py-2 text-sm`}
              />
              <button
                onClick={handleQuickBWLog}
                disabled={!quickBWInput}
                className={`${btnPrimary} px-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                Log
              </button>
            </div>
            {bwChartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={155}>
                <LineChart data={bwChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#52525b" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#52525b" style={{ fontSize: '11px' }} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#a1a1aa' }} formatter={(v: any) => [`${v} kg`, 'Body Weight']} />
                  <Line type="monotone" dataKey="bodyWeight" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-zinc-600 text-center py-5">Log 2+ entries to see your trend</p>
            )}
          </div>

          {/* Start Workout */}
          <div className={`${card} p-4 sm:p-5`}>
            <h2 className="text-sm sm:text-base font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Dumbbell size={16} className="text-orange-500" /> Start Workout
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { name: 'push',   label: 'Push Day', sub: 'Chest · Shoulders · Triceps', Icon: Maximize2, custom: false },
                { name: 'pull',   label: 'Pull Day', sub: 'Back · Biceps · Deadlifts',   Icon: Anchor,   custom: false },
                { name: 'legs',   label: 'Leg Day',  sub: 'Quads · Hamstrings · Glutes', Icon: Mountain, custom: false },
                { name: 'custom', label: 'Custom',   sub: 'Build your own routine',       Icon: Layers,   custom: true  },
              ].map(({ name, label, sub, Icon, custom }) => (
                <button
                  key={name}
                  onClick={() => startWorkout(name)}
                  className={`group text-left p-4 sm:p-5 rounded-xl border-l-2 border border-white/[0.06] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/40 ${
                    custom ? 'bg-zinc-800 border-l-zinc-600' : 'bg-zinc-800 border-l-orange-500'
                  }`}
                >
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 sm:mb-3 ${custom ? 'bg-zinc-700' : 'bg-orange-500/15'}`}>
                    <Icon size={18} className={custom ? 'text-zinc-400' : 'text-orange-500'} />
                  </div>
                  <p className="font-bold text-white text-sm">{label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-tight">{sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Enter Body Weight ── */}
      {currentScreen === 'enterBodyWeight' && (
        <div className="max-w-lg mx-auto px-4 py-10">
          <div className={`${card} p-6`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-11 h-11 rounded-xl ${entryTypeCfg.iconBg} flex items-center justify-center`}>
                <EntryTypeIcon size={22} className={entryTypeCfg.color} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{entryTypeCfg.label}</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Enter your body weight to start</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-zinc-400">Weight (kg)</label>
                <input
                  type="number" step="0.1"
                  value={bodyWeight}
                  onChange={e => setBodyWeight(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmBodyWeight()}
                  className={`${input} w-full text-lg p-4`}
                  placeholder="e.g. 82.5"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={confirmBodyWeight} disabled={!bodyWeight} className={`${btnPrimary} flex-1 p-4 disabled:opacity-40 disabled:cursor-not-allowed`}>
                  Start Session
                </button>
                <button onClick={cancelWorkout} className={`${btnSecondary} flex-1 p-4`}>
                  Cancel
                </button>
              </div>
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
        <ProgressScreen workouts={workouts} bodyWeightLog={bodyWeightLog} />
      )}

      {/* ── Bottom Tab Bar ── */}
      {currentScreen !== 'workout' && currentScreen !== 'enterBodyWeight' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-white/[0.06] z-50">
          <div className="max-w-7xl mx-auto flex">
            {[
              { label: 'Dashboard', screen: 'home',     Icon: Dumbbell   },
              { label: 'History',   screen: 'history',  Icon: Calendar   },
              { label: 'Progress',  screen: 'progress', Icon: TrendingUp },
            ].map(({ label, screen, Icon }) => {
              const active = currentScreen === screen;
              return (
                <button
                  key={screen}
                  onClick={() => setCurrentScreen(screen)}
                  className="flex-1 flex flex-col items-center gap-1 py-3 pb-safe transition-colors"
                >
                  <Icon size={22} className={active ? 'text-orange-500' : 'text-zinc-600'} />
                  <span className={`text-xs font-medium ${active ? 'text-orange-500' : 'text-zinc-600'}`}>{label}</span>
                  {active && <span className="w-1 h-1 rounded-full bg-orange-500" />}
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
