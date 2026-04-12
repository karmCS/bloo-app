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
        background: '#EFF6FF',
        text: '#111827',
        'dark-bg-1': '#1a1a2e',
        'dark-bg-2': '#252535',
        'dark-bg-3': '#1f1f30',
        'dark-form': '#2d2d42',
        'dark-border': '#393c55',
        'dark-text': '#abbbc2',
        'dark-text-light': '#9e9eb8',
        'dark-text-muted': '#6e6e8a',
      },
      fontFamily: {
        sans: ['Barlow', 'Inter', 'sans-serif'],
        brand: ['Josefin Sans', 'sans-serif'],
        meal: ['DM Sans', 'sans-serif'],
        vendor: ['Jost', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
