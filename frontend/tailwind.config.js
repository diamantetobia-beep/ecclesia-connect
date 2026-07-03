/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        church: {
          navy: '#1A2A44',
          gold: '#C9A96E',
          cream: '#F5F0EB',
        }
      }
    },
  },
  plugins: [],
}