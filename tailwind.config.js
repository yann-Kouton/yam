/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:   '#E77E23',
        secondary: '#2FA761',
        dark:      '#1A3A2A',
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body:    ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
