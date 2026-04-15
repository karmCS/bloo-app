/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        'primary-hover': '#1d4ed8',
        'primary-active': '#1e40af',
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
        sans: ['Inter', 'system-ui', 'sans-serif'],
        brand: ['"Josefin Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        label: ['Jost', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
