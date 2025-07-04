module.exports = {
  darkMode: 'class',
  content: [
    "./*.html",
    "./templates/**/*.html",
    "./static/**/*.html",
    "./static/js/**/*.js",
    "./src/**/*.js",
  ],
  safelist: [
    'hidden-by-filter',
    'bg-dark-700',
    'bg-dark-800',
    'bg-dark-900',
    'border-slate-700',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#a0b4ff',
          500: '#4f6fff',
          600: '#3f5bf0',
          700: '#334fc8',
        },
        accent: {
          DEFAULT: '#14b8a6',
          purple: '#c084fc',
        },
        dark: {
          700: '#374151',
          800: '#111827',
          850: '#0f172a',
          900: '#0e1524',
          950: '#070b16',
        },
        slate: {
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          700: '#334155',
        },
      },
      animation: {
        typing: 'typing 2s steps(22)',
        'blink-caret': 'blink 1s step-end infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        typing: {
          from: { width: '0' },
          to: { width: '100%' },
        },
        blink: {
          '50%': { 'border-color': 'transparent' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-16px) scale(1.04)' },
        },
      },
      backgroundImage: {
        'hero-pattern': "linear-gradient(120deg, #111827 0%, #4f6fff 100%)",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#4f6fff",
          "secondary": "#c084fc",
          "accent": "#14b8a6",
          "neutral": "#64748b",
          "base-100": "#ffffff",
        },
        dark: {
          "primary": "#4f6fff",
          "secondary": "#c084fc",
          "accent": "#14b8a6",
          "neutral": "#64748b",
          "base-100": "#0e1524",
        }
      }
    ],
    darkTheme: "dark",
  },
};