// Error tracking — the app's second piece of backend-facing infra, kept out of
// gym-tracker-app.tsx the same way the Supabase client is (see supabase.ts).
//
// Why this exists: every production failure in this app previously reached only
// `console.error`, which no one ever sees — a user hits a failed sync or a crash
// and just leaves. This routes those to Sentry so they're actually observed.
//
// Two properties make it safe to ship unconditionally:
//   • It is a NO-OP until VITE_SENTRY_DSN is set. No DSN → no network, no cost,
//     nothing loaded. The app runs identically (including fully offline) whether
//     or not monitoring is configured, so a missing DSN is a valid state, not a
//     broken one. Set the DSN in .env.local to turn it on; that's the whole setup.
//   • The Sentry SDK is loaded via a dynamic import(), so Vite code-splits it into
//     its own chunk. When no DSN is present that chunk is never fetched — the
//     "gym basement, no signal" first paint carries none of its weight.
//
// Reporting is best-effort by construction: if the SDK fails to load or send, we
// swallow it and fall back to console. Monitoring must never be able to break the
// thing it monitors.

const DSN = (import.meta.env.VITE_SENTRY_DSN as string | undefined) || undefined;

export const monitoringEnabled = Boolean(DSN);

// Resolves to the Sentry namespace once init succeeds, or null if disabled/failed.
// Cached so repeated reportError calls share one load and one init.
let ready: Promise<any | null> | null = null;

function load(): Promise<any | null> {
  if (!DSN) return Promise.resolve(null);
  if (ready) return ready;
  ready = import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({
        dsn: DSN,
        environment: import.meta.env.MODE,
        // No performance/session-replay sampling: this is a personal app and we
        // only want the errors, not tracing volume. Bump these if that changes.
        tracesSampleRate: 0,
        // Don't let the SDK's own transport noise (offline sends, rate limits)
        // surface as app errors.
        beforeSend: (event: any) => event,
      });
      return Sentry;
    })
    .catch((e) => {
      console.error('Sentry failed to load; error reporting is off for this session.', e);
      return null;
    });
  return ready;
}

// Call once at startup. Installs Sentry's global handlers (window.onerror +
// unhandledrejection are captured automatically by Sentry.init). Cheap no-op
// when there's no DSN.
export function initMonitoring(): void {
  void load();
}

// Report a handled error with optional context (which handler, which row, etc.).
// Always safe to call — no DSN means it does nothing but the local console.error
// the call site already does. Never throws.
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (!DSN) return;
  load()
    .then((Sentry) => {
      if (!Sentry) return;
      Sentry.captureException(error, context ? { extra: context } : undefined);
    })
    .catch(() => { /* reporting is best-effort; never surface its own failure */ });
}
