/* tailwind.config.js — Bear theme · 2025-07-13 */
import defaultTheme from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';

export default {
  darkMode: 'class',                          // toggled by static/js/theme.js
  content: [
    'templates/**/*.html',
    'static/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        bear: {
          red:  '#DD4C4F',  // primary accent (Bear icon red)
          grey: '#8E8E93',  // subtle text / icons
          smoke:'#F9F9FA',  // light sections
          ink:  '#1D1D1F',  // dark surface
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Text', ...defaultTheme.fontFamily.sans],
      },
      maxWidth: {
        wrapper: '72rem',   // 1152 px ≈ Bear’s content column
      },
      boxShadow: {
        card: '0 4px 12px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    plugin(({ addUtilities }) => {
      /* squiggle underline used in “notes you’ll love” headline */
      addUtilities({
        '.underline-squiggle': {
          background:
            "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"6\" viewBox=\"0 0 160 6\"><path fill=\"none\" stroke=\"%23DD4C4F\" stroke-width=\"3\" d=\"M0 3 Q20 6 40 3 T80 3 T120 3 T160 3\"/></svg>') repeat-x bottom/auto 6px",
          paddingBottom: '0.25rem',
        },
      });
    }),
  ],
};
