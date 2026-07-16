// Supabase client + the row⇄state mappers. This is the app's one piece of
// backend infra — the UI still lives entirely in gym-tracker-app.tsx.
//
// The anon key is safe to ship to the browser ONLY because Row Level Security
// scopes every row to auth.uid() (see schema.sql). Never disable RLS.
import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// When the env vars are absent we render a config screen rather than crash at
// import time (createClient throws on an empty url).
export const supabaseEnabled = Boolean(url && anon);
export const supabase: any = supabaseEnabled ? createClient(url as string, anon as string) : null;

// ── Row ⇄ in-memory shape mappers ────────────────────────────────────────────
// State keeps the app's original camelCase shapes (see "Data shapes" in
// CLAUDE.md) so every screen, stat and chart reads the exact same objects as
// before. Only the Postgres rows are snake_case; map at the boundary. Dates are
// stored as text, so the ISO string the app generates round-trips byte-for-byte
// — the body-weight log correlates to a workout by exact date string.
export const rowToWorkout = (r: any) => ({
  id: r.id,
  type: r.type,
  bodyWeight: r.body_weight,            // may be null — a skipped weigh-in, distinct from 0
  exercises: r.exercises ?? [],
  date: r.date,
  notes: r.notes ?? '',
  ...(r.duration != null ? { duration: r.duration } : {}),
});

export const workoutToRow = (w: any) => ({
  type: w.type,
  body_weight: w.bodyWeight ?? null,
  exercises: w.exercises ?? [],
  date: w.date,
  notes: w.notes ?? '',
  duration: w.duration ?? null,
});

export const rowToBW = (r: any) => ({ id: r.id, date: r.date, weight: r.weight });
