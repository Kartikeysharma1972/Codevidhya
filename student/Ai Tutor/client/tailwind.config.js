/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EAF4FB',
          100: '#D6EEF8',
          200: '#B3D9F2',
          300: '#7EC8E3',
          400: '#5BA4CF',
          500: '#2E86C1',
          600: '#2471A3',
          700: '#1A5276',
          800: '#154360',
          900: '#0E2F44',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'Inter', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'blob-1': 'blobFloat 8s ease-in-out infinite',
        'blob-2': 'blobFloat 12s ease-in-out infinite reverse',
        'blob-3': 'blobFloat 10s ease-in-out infinite 2s',
        'mesh-shift': 'meshShift 16s ease-in-out infinite',
        'gentle-float': 'gentleFloat 6s ease-in-out infinite',
        'gentle-float-slow': 'gentleFloat 9s ease-in-out infinite',
        'doodle-float': 'doodleFloat 12s ease-in-out infinite',
        'sparkle-bg': 'sparkleBg 8s ease-in-out infinite',
      },
      keyframes: {
        blobFloat: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 15px) scale(0.97)' },
        },
        meshShift: {
          '0%, 100%': { backgroundPosition: '0% 50%, 100% 50%, 50% 100%' },
          '50%': { backgroundPosition: '100% 50%, 0% 50%, 50% 0%' },
        },
        gentleFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        doodleFloat: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(8px, -12px) rotate(6deg)' },
        },
        sparkleBg: {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '0.5' },
        },
      }
    },
  },
  plugins: [],
}
