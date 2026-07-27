import React from 'react'
import ReactDOM from 'react-dom/client'

// Self-hosted so the app renders correctly in a gym basement with no signal.
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow/700.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'

import GymTrackerApp from './gym-tracker-app'
import { initMonitoring } from './monitoring'
import './index.css'

// Turn on error reporting before the app mounts, so a crash during first render
// is captured. No-op until VITE_SENTRY_DSN is configured (see monitoring.ts).
initMonitoring()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GymTrackerApp />
  </React.StrictMode>,
)
