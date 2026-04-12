/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4A90E2',
        'primary-hover': '#6BA3E8',
        'primary-active': '#3A7BC8',
        secondary: '#3B82F6',
        accent: '#22D3EE',
        background: '#FAF9F5',
        text: '#111827',
        page: '#FAF9F5',
        card: '#FFFFFF',
        surface: '#EFEDE8',
        line: '#E5E2DC',
        ink: '#171717',
        'ink-muted': '#525252',
        'ink-faint': '#737373',
      },
      fontFamily: {
        // Satoshi: UI (default via sans) — weights 400–700 from Fontshare (index.html)
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        // Josefin Sans: "bloo" logo only
        brand: ['"Josefin Sans"', 'sans-serif'],
        // Fraunces: meal names / dish titles only
        meal: ['Fraunces', 'serif'],
      },
    },
  },
  plugins: [],
};
