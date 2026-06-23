/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B9D',
        secondary: '#C44569',
        accent: '#FFD93D',
        bg: '#FFF5F8',
        textDark: '#2D3436',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
