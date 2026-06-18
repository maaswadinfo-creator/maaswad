/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep saffron — primary brand
        brand: {
          50: '#fbf5ea', 100: '#f6e7c9', 200: '#eccd92', 300: '#e2b15a',
          400: '#d8993a', 500: '#c87f1e', 600: '#a96618', 700: '#834e18',
          800: '#5f3a16', 900: '#4a2e13',
        },
        // Burgundy — accent / depth
        burgundy: {
          50: '#fbf0f1', 100: '#f3d8db', 200: '#e2acb3', 300: '#cd7c88',
          400: '#b14e5c', 500: '#8e2c3b', 600: '#74222f', 700: '#5c1b26',
          800: '#45151d', 900: '#321016',
        },
        // Warm neutrals
        cream: '#f7efe1',
        ivory: '#fdf9f1',
        charcoal: {
          700: '#3a322c', 800: '#2a2421', 900: '#1e1a17', 950: '#15110e',
        },
        // alias kept for existing dark-mode classes
        ink: {
          50: '#f7efe1', 100: '#efe3d0', 800: '#2a2421', 900: '#1e1a17', 950: '#15110e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(74,46,19,.05), 0 6px 20px rgba(74,46,19,.07)',
        lift: '0 10px 34px rgba(74,46,19,.16)',
        glow: '0 0 0 4px rgba(200,127,30,.14)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'pulse-ring': { '0%': { boxShadow: '0 0 0 0 rgba(200,127,30,.45)' }, '70%': { boxShadow: '0 0 0 12px rgba(200,127,30,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(200,127,30,0)' } },
        'gradient-pan': { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
      },
    },
  },
  plugins: [],
};
