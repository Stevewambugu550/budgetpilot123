/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eefdf5',
          100: '#d6f9e6',
          200: '#aff2cf',
          300: '#78e6b1',
          400: '#3ad28d',
          500: '#15b870',
          600: '#0a9659',
          700: '#0a7849',
          800: '#0c5f3c',
          900: '#0b4e33',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
