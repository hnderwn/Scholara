/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        parchment: {
          DEFAULT: '#F2ECD8',
          light: '#FAF6EC',
          dark: '#EDE4CC',
          border: '#C8B99A',
        },
        navy: {
          DEFAULT: '#0A2463',
          light: '#1A4FAD',
          muted: '#4A6080',
        },
        crimson: {
          DEFAULT: '#BF0A30',
          light: '#D41035',
          soft: '#F9E8EC',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E2C97E',
          dark: '#A8893A',
        },
        ink: {
          DEFAULT: '#2C1F0E',
          muted: '#6B5A42',
        },
        emerald: {
          500: '#10b981',
        },
        red: {
          600: '#dc2626',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        script: ['IM Fell English', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
