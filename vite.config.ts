import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The app is one big module, but its heaviest dependencies change far less often
// than the app code does. Splitting them into their own chunks means a deploy that
// only touches gym-tracker-app.tsx doesn't force a re-download of React, recharts
// and supabase-js — they stay in the browser cache across releases.
export default defineConfig({
  plugins: [react()],
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
