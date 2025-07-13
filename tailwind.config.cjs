module.exports = {
  darkMode: 'class',
  content: ['./templates/**/*.html', './static/js/**/*.js'],
  safelist: ['hidden', 'block'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF5E62',
          500: '#FF5E62',
          600: '#FF5E62',
          700: '#E04E4D',
          gradientStart: '#FF5E62',
          gradientEnd: '#FFC371'
        },
        danger: {
          gradientStart: '#ff6b6b',
          gradientEnd: '#ee5a24'
        },
        'surface-white': '#FFFFFF',
        'surface-shade': '#FAFAFA',
        'ink-900': '#1C1C1E',
        'ink-600': '#444448',
        'ink-400': '#94949A',
        'accent-red': '#FF3B30',
        'accent-red-dark': '#FF453A',
        status: {
          active: '#22c55e',
          draft: '#fbbf24',
          archived: '#9ca3af'
        },
        background: {
          darkStart: '#0f0f23',
          darkMid: '#1a1a3e',
          darkEnd: '#2d1b69'
        }
      },
      fontFamily: {
        sans: [
          '\'SF Pro\'',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ]
      },
      boxShadow: {
        soft: '0 2px 8px rgb(0 0 0 / 0.08)',
        glow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        pulse: '0 0 20px rgba(59, 130, 246, 0.3)'
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem'
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'pulse-glow': {
          from: { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          to: { boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }
        }
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
};