module.exports = {
  darkMode: 'class',
  content: ['./templates/**/*.html', './static/js/**/*.js'],
  safelist: ['hidden','block'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#28C76F',
          600: '#28C76F',
          700: '#1fa85b'
        }
      },
      fontFamily: {
        sans: ['Inter','sans-serif']
      },
      boxShadow: {
        soft: '0 2px 6px rgb(0 0 0 / 0.2)'
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
};
