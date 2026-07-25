/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // We build a dark-first user interface
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a', // Deep slate-900 background
        darkCard: '#1e293b', // Slate-800 card color
        darkBorder: '#334155', // Slate-700 border color
        accentBlue: '#3b82f6', // Glowing blue highlights
        accentIndigo: '#6366f1', // Indigo actions
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
