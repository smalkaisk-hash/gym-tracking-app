import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Content-Security-Policy, injected into the BUILT index.html only (apply: 'build').
// It is deliberately NOT in index.html itself: that file is also served by the dev
// server, where a restrictive connect-src/script-src would break Vite HMR. GitHub Pages
// cannot set response headers, so a `<meta http-equiv>` is the only delivery mechanism —
// which means the header-only directives (frame-ancestors, X-Frame-Options) are not
// available here, so clickjacking protection still needs a host that sets headers.
//
// There is no XSS sink in the app today (React escapes all interpolation; no
// dangerouslySetInnerHTML), so this is defence-in-depth: the load-bearing directive is
// connect-src, which contains where a future injection could exfiltrate to. script-src
// and style-src carry 'unsafe-inline' on purpose — index.html has an inline pre-paint
// theme script, and React writes inline style attributes; a static host can't use a
// nonce, and a hash would silently disable the theme script on any edit. The win is
// real without them (connect/object/base/form).
//
// IF you enable error reporting (set VITE_SENTRY_DSN — see src/monitoring.ts, which is
// itself a legal edit gated by scripts/check-monitoring-claim.mjs), Sentry's ingest host
// must be added to connect-src below or reports will be CSP-blocked.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const csp = {
  name: 'inject-csp',
  apply: 'build' as const,
  transformIndexHtml() {
    return [{
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
      injectTo: 'head-prepend' as const,
    }]
  },
}

// The app is one big module, but its heaviest dependencies change far less often
// than the app code does. Splitting them into their own chunks means a deploy that
// only touches gym-tracker-app.tsx doesn't force a re-download of React, recharts
// and supabase-js — they stay in the browser cache across releases.
export default defineConfig({
  plugins: [react(), csp],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/react-dom/') || /\/react\//.test(id) || id.includes('/scheduler/')) return 'react'
          if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-vendor/') || id.includes('/internmap/')) return 'recharts'
          if (id.includes('/@supabase/')) return 'supabase'
        },
      },
    },
  },
})
