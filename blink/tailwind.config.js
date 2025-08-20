/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'blink-green': '#00D084',
        'grocer-blue': '#2196F3',
      },
    },
  },
  plugins: [],
}
