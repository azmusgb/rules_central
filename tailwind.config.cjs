module.exports = {
  darkMode: 'class',
  content: ['./templates/**/*.html', './static/js/**/*.js'],
  safelist: ['hidden', 'block'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#28C76F',
          600: '#28C76F',
          700: '#1fa85b',
          gradientStart: '#667eea',
          gradientEnd: '#764ba2'
        },
        danger: {
          gradientStart: '#ff6b6b',
          gradientEnd: '#ee5a24'
        },
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
        sans: ['Inter', 'sans-serif']
      },
      boxShadow: {
        soft: '0 2px 6px rgb(0 0 0 / 0.2)',
        glow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        pulse: '0 0 20px rgba(59, 130, 246, 0.3)'
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