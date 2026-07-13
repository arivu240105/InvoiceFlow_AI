/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4fe',
          100: '#dbe5fc',
          200: '#bfd2fa',
          300: '#93b4f6',
          400: '#608df0',
          500: '#3b6be8',
          600: '#254edb',
          700: '#1d3ebd',
          800: '#1c3599',
          900: '#1b2f7a',
          950: '#111a4b',
        },
        slate: {
          850: '#151e2e',
          900: '#0b0f19',
          950: '#060a13',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
