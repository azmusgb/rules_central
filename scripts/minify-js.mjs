import { readdir, readFile, writeFile } from 'fs/promises';
import { minify } from 'terser';
import path from 'path';

const dir = path.resolve('static/js');
const files = await readdir(dir);
for (const file of files) {
  if (file.endsWith('.js') && !file.endsWith('.min.js')) {
    const p = path.join(dir, file);
    const src = await readFile(p, 'utf8');
    const result = await minify(src);
    const outPath = p.replace(/\.js$/, '.min.js');
    await writeFile(outPath, result.code, 'utf8');
  }
}
console.log('Minification complete.');
