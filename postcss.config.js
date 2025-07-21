// postcss.config.js
module.exports = (ctx) => {
  const isProduction = ctx.env === 'production';
  
  return {
    plugins: {
      // Process @import rules first (if using postcss-import)
      'postcss-import': {},
      
      // Enable modern CSS features
      'postcss-preset-env': {
        stage: 1,
        features: {
          'nesting-rules': true,        // Enable CSS nesting
          'custom-media-queries': true, // Enable custom media queries
          'media-query-ranges': true,    // Enable media query ranges like (width >= 600px)
          'custom-properties': true,     // Enable CSS variables
          'color-functional-notation': true, // Modern color syntax
        },
        autoprefixer: {
          flexbox: 'no-2009', // Don't add prefixes for old flexbox spec
        },
        preserve: false, // Don't preserve original syntax
      },
      
      // CSS nesting (redundant with preset-env, but some prefer explicit)
      'postcss-nesting': {},
      
      // Tailwind CSS - should come before autoprefixer
      // tailwindcss: {},
      
      // DaisyUI (if using components)
      // ...(isProduction ? { cssnano: { preset: 'default' } } : {}),
      
      // Autoprefixer - should come after Tailwind
      autoprefixer: {
        overrideBrowserslist: ctx.browserslist ?? undefined,
      },
    },
  };
};