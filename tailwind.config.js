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
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        accent: {
          DEFAULT: '#2dd4bf',
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
        'hero-pattern': "linear-gradient(120deg, #111827 0%, #8b5cf6 100%)",
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
          "primary": "#8b5cf6",
          "secondary": "#c084fc",
          "accent": "#2dd4bf",
          "neutral": "#64748b",
          "base-100": "#ffffff",
        },
        dark: {
          "primary": "#8b5cf6",
          "secondary": "#c084fc",
          "accent": "#2dd4bf",
          "neutral": "#64748b",
          "base-100": "#0e1524",
        }
      }
    ],
    darkTheme: "dark",
  },
};