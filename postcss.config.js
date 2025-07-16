module.exports = {
  plugins: {
    'postcss-nesting': {},
    tailwindcss: {},
    autoprefixer: {},
    'postcss-preset-env': {
      stage: 1,
      features: {
        'nesting-rules': true,
        'custom-media-queries': true,
        'media-query-ranges': true
      }
    },
  }
}