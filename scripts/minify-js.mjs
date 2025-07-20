// Simple JS minifier used during `npm run build:js`
// Avoids external dependencies like terser in offline environments
import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

const dir = path.resolve('static/js');
const files = await readdir(dir);

function simpleMinify(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments
    .replace(/\/\/.*(?=[\n\r])/g, '') // remove line comments
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/\s*([{};:,])\s*/g, '$1') // trim around separators
    .trim();
}

for (const file of files) {
  if (file.endsWith('.js') && !file.endsWith('.min.js')) {
    const p = path.join(dir, file);
    const src = await readFile(p, 'utf8');
    const outPath = p.replace(/\.js$/, '.min.js');
    const min = simpleMinify(src);
    await writeFile(outPath, min, 'utf8');
  }
}

console.log('Minification complete.');
