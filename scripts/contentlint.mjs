// Public house-style lint over the rendered pages. It holds nothing private:
// it only checks two typographic rules that fail the build.
//   no em dash (U+2014), no dollar sign directly before a digit.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const RULES = [
  ['em dash', new RegExp(String.fromCharCode(0x2014))],
  ['dollar sign before a digit', /\$[0-9]/],
];
const EXT = new Set(['.html', '.xml', '.txt', '.json', '.svg']);
const bad = [];
(function walk(dir) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f);
    else if (EXT.has(extname(f))) {
      const text = readFileSync(f, 'utf8');
      for (const [name, re] of RULES) if (re.test(text)) bad.push(`${name}: ${f}`);
    }
  }
})('dist');
if (bad.length) {
  console.error('contentlint failed:\n  ' + bad.join('\n  '));
  process.exit(1);
}
console.log('contentlint: clean');
