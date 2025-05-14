/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'linear-dark': '#0F0F0F',
        'linear-dark-lighter': '#1F1F1F',
        'linear-dark-lightest': '#2F2F2F',
        'linear-accent': '#5E6AD2',
        'linear-accent-lighter': '#7E8AE2',
        'linear-text': '#E5E5E5',
        'linear-text-secondary': '#A0A0A0',
        'linear-border': '#3F3F3F',
        'linear-success': '#4CAF50',
        'linear-warning': '#FFC107',
        'linear-error': '#F44336',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
