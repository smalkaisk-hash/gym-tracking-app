/** @type {import('tailwindcss').Config} */

// Every colour is a CSS custom property defined in src/index.css, so the two
// themes swap at token level and components never name a raw hex.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ground:  token('ground'),   // page
        surface: token('surface'),  // card
        raised:  token('raised'),   // input / inset row
        line:    token('line'),     // hairline
        ink:     token('ink'),      // primary text
        muted:   token('muted'),    // secondary text
        faint:   token('faint'),    // tertiary / decorative

        accent:       token('accent'),      // 20kg calibrated plate
        'accent-ink': token('accent-ink'),  // text on accent

        // Semantic — sourced from the rest of the calibrated plate set.
        good: token('good'),  // 10kg green
        warn: token('warn'),  // 15kg yellow
        crit: token('crit'),  // 25kg red
      },
      fontFamily: {
        sans:    ['Barlow', 'system-ui', 'sans-serif'],
        display: ['"Barlow Condensed"', 'Barlow', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
        ctl:  '6px',
        chip: '3px',
      },
    },
  },
  plugins: [],
}
