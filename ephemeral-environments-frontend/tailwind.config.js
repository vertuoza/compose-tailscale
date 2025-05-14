/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'linear-dark': '#0D0E14',
        'linear-dark-lighter': '#1C1D22',
        'linear-dark-lightest': '#26272C',
        'linear-sidebar': '#1A1B21',
        'linear-accent': '#5E6AD2',
        'linear-accent-lighter': '#7E8AE2',
        'linear-text': '#E5E5E5',
        'linear-text-secondary': '#A0A0A0',
        'linear-border': '#2E2F34',
        'linear-success': '#4CAF50',
        'linear-warning': '#FFC107',
        'linear-error': '#F44336',
        'linear-yellow': '#F2C94C',
        'linear-orange': '#F2994A',
        'linear-purple': '#9B51E0',
        'linear-blue': '#2F80ED',
        'linear-green': '#27AE60',
        'linear-red': '#EB5757',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'linear-gradient': 'linear-gradient(to bottom right, rgba(30, 31, 38, 0.5), rgba(20, 21, 26, 0.5))',
        'linear-texture': "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMxQTFCMjEiIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGZpbGw9IiMyMDIxMjciIGQ9Ik0wIDBoMjB2MjBoLTIweiIvPjxwYXRoIGZpbGw9IiMyMDIxMjciIGQ9Ik0yMCAyMGgyMHYyMGgtMjB6Ii8+PC9nPjwvc3ZnPg==')",
      },
      boxShadow: {
        'linear': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'linear-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'linear-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'linear': '4px',
      },
    },
  },
  plugins: [],
}
