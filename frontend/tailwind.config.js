/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F0F9F1',
          100: '#DCF2DF',
          200: '#BCE5C2',
          300: '#8DD199',
          400: '#56B468',
          500: '#329646',
          600: '#237835',
          700: '#1C5F2C',
          800: '#184C25',
          900: '#0B4F27',
          950: '#062B15',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

