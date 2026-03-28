/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        secondary: '#3B82F6',
        accent: '#22D3EE',
        background: '#EFF6FF',
        text: '#111827',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        brand: ['Josefin Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
