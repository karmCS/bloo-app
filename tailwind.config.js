/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7CB9E8',
        'primary-hover': '#5FA8DF',
        'primary-active': '#4A97D0',
        accent: '#D4522A',
        'macro-green': '#2D6A4F',
        page: '#F7F5F0',
        card: '#FFFFFF',
        surface: '#EFEDE8',
        line: '#E8E3DA',
        ink: '#1A1A1A',
        'ink-muted': '#8C8070',
        'ink-faint': '#B5AFA6',
      },
      fontFamily: {
        sans: ['Epilogue', 'system-ui', 'sans-serif'],
        brand: ['Fraunces', 'Georgia', 'serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
