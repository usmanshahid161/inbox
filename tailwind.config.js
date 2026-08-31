/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        brand: {
          50: '#eefbf8',
          100: '#d2f4ec',
          200: '#a6e8da',
          300: '#71d4c1',
          400: '#3fb8a3',
          500: '#219c89',
          600: '#127d6e',
          700: '#116459',
          800: '#124f47',
          900: '#12423c',
          950: '#052622'
        },
        navy: {
          50: '#eef1f6',
          100: '#dde2ea',
          200: '#b0bccd',
          300: '#8391a8',
          400: '#546279',
          500: '#374862',
          600: '#28374d',
          700: '#1c2838',
          800: '#131c29',
          900: '#0e1520',
          950: '#0a0f18'
        },
        accent: {
          50: '#fef3ee',
          100: '#fde3d5',
          200: '#fac4aa',
          300: '#f79e74',
          400: '#f2703c',
          500: '#e8541c',
          600: '#d43e12',
          700: '#b02f11',
          800: '#8c2815',
          900: '#722414',
          950: '#3e0f08'
        },
        ink: {
          50: '#f7f7f6',
          100: '#eeedea',
          200: '#dcdad4',
          300: '#c1beb4',
          400: '#a19c8e',
          500: '#89836f',
          600: '#6f6a59',
          700: '#5a5648',
          800: '#3f3c33',
          900: '#242219',
          950: '#141309'
        }
      },
      boxShadow: {
        panel: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        popover: '0 4px 16px -4px rgb(0 0 0 / 0.12), 0 2px 4px -2px rgb(0 0 0 / 0.08)'
      },
      borderRadius: {
        xl: '0.75rem'
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.2s ease-out'
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } }
      }
    }
  },
  plugins: []
}
