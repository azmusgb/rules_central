// tools/split-css.js
//
// Run: node tools/split-css.js path/to/input_deduped.css
// It will overwrite your src/css/{tokens,base,components,pages}.css

const fs = require('fs');
const postcss = require('postcss');

// 1️⃣  Read the source monolith
const src = process.argv[2] || 'static/css/input.css';
if (!fs.existsSync(src)) {
  console.error(`ERROR: Cannot find ${src}`);
  process.exit(1);
}
const root = postcss.parse(fs.readFileSync(src, 'utf8'));

// 2️⃣  Prepare empty AST buckets
const buckets = {
  tokens:  postcss.root(),
  base:    postcss.root(),
  comps:   postcss.root(),
  pages:   postcss.root()
};

// 3️⃣  Distribute each top-level node by selector/type
root.nodes.forEach(node => {
  if (node.type === 'rule' && node.selector.startsWith(':root')) {
    buckets.tokens.append(node);
  } else if (node.type === 'rule' && /^\.(rc-|rc_)/.test(node.selector)) {
    buckets.pages.append(node);
  } else if (node.type === 'rule' && /^(?:\.btn|\.card|\.nav-|\.text-|\.mb-|\.sr-only|\.hidden)/.test(node.selector)) {
    buckets.comps.append(node);
  } else {
    // everything else (resets, typography, layout, utilities) goes to base
    buckets.base.append(node);
  }
});

// 4️⃣  Write out the four files
fs.writeFileSync('src/css/tokens.css',     buckets.tokens.toString());
fs.writeFileSync('src/css/base.css',       buckets.base.toString());
fs.writeFileSync('src/css/components.css', buckets.comps.toString());
fs.writeFileSync('src/css/pages.css',      buckets.pages.toString());

console.log('🎉 Split complete! Check src/css/{tokens,base,components,pages}.css');