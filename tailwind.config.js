/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10bb82',
          50: '#e6f9f3',
          100: '#ccf3e7',
          200: '#99e7cf',
          300: '#66dbb7',
          400: '#33cf9f',
          500: '#10bb82',
          600: '#0d9668',
          700: '#0a704e',
          800: '#074b34',
          900: '#03251a',
        },
        secondary: {
          DEFAULT: '#1800ad',
          50: '#e6e0ff',
          100: '#ccc2ff',
          200: '#9985ff',
          300: '#6647ff',
          400: '#330aff',
          500: '#1800ad',
          600: '#13008a',
          700: '#0e0068',
          800: '#0a0045',
          900: '#050023',
        },
      },
    },
  },
  plugins: [],
};
