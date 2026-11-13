/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          light: '#F7F7FB',
          dark: '#0E0F1A',
          DEFAULT: 'var(--color-bg)',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#161827',
          DEFAULT: 'var(--color-surface)',
          2: 'var(--color-surface-2)',
        },
        border: {
          light: '#E4E6F0',
          dark: '#2A2D45',
          DEFAULT: 'var(--color-border)',
        },
        text: {
          light: '#12131F',
          dark: '#ECEDF7',
          DEFAULT: 'var(--color-text)',
        },
        muted: {
          light: '#6B6F8A',
          dark: '#8E92B0',
          DEFAULT: 'var(--color-muted)',
        },
        primary: {
          light: '#7C3AED',
          dark: '#8B5CF6',
          DEFAULT: 'var(--color-primary)',
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        online: '#22C55E',
        danger: '#EF4444',
        gender: {
          male: '#0EA5E9',
          female: '#F43F5E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
        'accent-gradient-hover': 'linear-gradient(135deg, #6D28D9 0%, #DB2777 100%)',
      },
    },
  },
  plugins: [],
};

