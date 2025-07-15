const plugin = require('tailwindcss/plugin');

module.exports = {
  darkMode: 'class',
  content: ['./templates/**/*.html', './static/js/**/*.js'],
  safelist: ['hidden', 'block', 'border-primary-600', 'bg-primary-600', 'text-primary-600'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF0F0',
          100: '#FFD6D6',
          200: '#FFB5B5',
          300: '#FF7B7B',
          400: '#E06B6B',
          500: '#D45A5A',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          ink: '#1F1F1F',
          paper: '#F5F5F7'
        },
        bear: {
          red: '#FF5E62',
          grey: '#A7A7A7',
          smoke: '#FBFBFD',
          ink: '#111827'
        },
        ink: {
          DEFAULT: 'rgba(31, 31, 31, 0.9)',
          secondary: 'rgba(31, 31, 31, 0.7)',
          tertiary: 'rgba(31, 31, 31, 0.5)'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '\'SF Pro\'',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        mono: [
          'Inter',
          'Menlo',
          'monospace'
        ]
      },
      maxWidth: {
        wrapper: '72rem'
      },
      boxShadow: {
        soft: '0 2px 8px rgb(0 0 0 / 0.08)',
        glow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        pulse: '0 0 20px rgba(59, 130, 246, 0.3)',
        card: '0 4px 12px rgba(0,0,0,0.04)',
        'bear-card': '0 4px 24px -6px rgba(0, 0, 0, 0.08)',
        'bear-button': '0 2px 0 rgba(0, 0, 0, 0.05) inset'
      },
      spacing: {
        '0.5': '0.125rem',
        '7.5': '1.875rem',
        '15': '3.75rem',
        18: '4.5rem',
        22: '5.5rem'
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        '3xl': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }]
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
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    plugin(({ addUtilities, addComponents }) => {
      addUtilities({
        '.underline-squiggle': {
          background:
            "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"6\" viewBox=\"0 0 160 6\"><path fill=\"none\" stroke=\"%23DD4C4F\" stroke-width=\"3\" d=\"M0 3 Q20 6 40 3 T80 3 T120 3 T160 3\"/></svg>') repeat-x bottom/auto 6px",
          paddingBottom: '0.25rem',
        },
        '.ring-focus-ring': {
          boxShadow: '0 0 0 2px var(--focus-ring)',
        },
        '.text-text-secondary': {
          color: 'var(--text-secondary)',
        },
        '.text-text': {
          color: 'var(--text)',
        },
        '.stroke-linecap-round': {
          strokeLinecap: 'round',
        },
      });
      addComponents({
        '.bear-illustration-path': {
          strokeWidth: '1.5px',
          strokeLinecap: 'round',
          vectorEffect: 'non-scaling-stroke'
        },
        '.cta-primary': {
          padding: '0.75rem 1.5rem',
          borderRadius: '9999px',
          backgroundColor: '#FF7B7B',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px -2px rgba(255, 123, 123, 0.4)'
          }
        }
      });
    }),
  ],
};