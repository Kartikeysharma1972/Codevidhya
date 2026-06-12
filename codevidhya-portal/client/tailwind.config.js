/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#EEF4FF',
          100: '#DBE7FF',
          200: '#B6CEFF',
          300: '#86ACFF',
          400: '#5B86FF',
          500: '#3B6BFF',
          600: '#2A52E0',
          700: '#1F3FB3',
          800: '#192F86',
          900: '#142669',
        },
      },
      boxShadow: {
        soft: '0 30px 60px -25px rgba(15,23,42,0.18)',
      },
    },
  },
  plugins: [],
};
