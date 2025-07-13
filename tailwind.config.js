const plugin = require('tailwindcss/plugin');
module.exports = {
  darkMode: 'class',
  content: ['./templates/**/*.html', './static/js/**/*.js'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { lg: '960px' }
    },
    extend: {
      colors: {
        'surface-0': 'var(--surface-0)',
        'surface-1': 'var(--surface-1)',
        'ink-900': 'var(--ink-900)',
        'ink-600': 'var(--ink-600)',
        'ink-400': 'var(--ink-400)',
        'accent-r': 'var(--accent-r)',
        'accent-r-dark': 'var(--accent-r-dark)'
      },
      fontFamily: {
        sans: ['SF Pro','Inter','system-ui','sans-serif']
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem'
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0,0,0,.04)'
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-up-slow': 'fade-up 0.8s ease-out both'
      }
    }
  },
  plugins: [
    plugin(function({ addBase }) {
      addBase({
        ':root': {
          '--surface-0': '#FFFFFF',
          '--surface-1': '#F7F7F7',
          '--ink-900': '#1B1B1D',
          '--ink-600': '#414145',
          '--ink-400': '#8E8E94',
          '--accent-r': '#FF2D20',
          '--accent-r-dark': '#FF4034'
        },
        '.dark :root': {
          '--surface-0': '#1B1B1D',
          '--surface-1': '#2B2B2E',
          '--ink-900': '#F0F0F3',
          '--ink-600': '#CCCCD0',
          '--ink-400': '#9A9AA0'
        }
      });
    }),
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ],
  variants: {
    extend: {
      animation: ['motion-safe','motion-reduce']
    }
  }
};
