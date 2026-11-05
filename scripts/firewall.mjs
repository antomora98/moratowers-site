// Leak firewall engine. It holds no patterns: they are read from the file named by
// FIREWALL_PATTERNS (one `rule<TAB>regex<TAB>options` per line). It prints rule names
// and file paths only, never the matched text, and exits non-zero on any hit.
//
//   node scripts/firewall.mjs                 scan src/, public/, dist/ and the last commit message
//   node scripts/firewall.mjs --staged        scan staged files (pre-commit)
//   node scripts/firewall.mjs --message FILE  scan a commit message file (commit-msg)
//   node scripts/firewall.mjs --history       scan every object, commit message and ref name a push
//                                             could send (all refs and reflogs), not just the tree
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const fail = (msg) => { console.error(`firewall: ${msg}`); process.exit(2); };

const patternsPath = process.env.FIREWALL_PATTERNS;
if (!patternsPath) fail('FIREWALL_PATTERNS is not set. Failing closed.');
let rawRules;
try { rawRules = readFileSync(patternsPath, 'utf8'); } catch { fail('cannot read the patterns file. Failing closed.'); }

const rules = [];
for (const line of rawRules.split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  const [name, source, opts = ''] = line.split('\t');
  if (!name || !source) fail('malformed rule line. Failing closed.');
  let flags = 'u';
  let src = source;
  if (src.startsWith('(?i)')) { flags += 'i'; src = src.slice(4); }
  let re;
  try { re = new RegExp(src, flags); } catch { fail(`rule ${name} does not compile. Failing closed.`); }
  const o = Object.fromEntries(opts.split(/\s+/).filter(Boolean).map((kv) => kv.split('=')).map(([k, v]) => [k, v.split(',')]));
  rules.push({ name, re, skip: o.skip ?? [], scope: o.scope ?? null });
}
if (rules.length === 0) fail('the patterns file holds no rules. Failing closed.');

const root = process.cwd();
const BINARY = new Set(['.woff2', '.woff', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.pdf']);
const hits = new Set();
// Machine-generated, no prose: never scanned.
const IGNORED = (rel) => rel === 'package-lock.json' || rel.startsWith('node_modules/') || rel.includes('/node_modules/');
// Pinned files (Antonio's yes, 2026-11-03): third-party or binary bytes that read as noise to the
// rules, so they are not scanned as text. Each must instead match its official copy byte for byte (three.js from the
// npm tarball three@0.170.0; the glass models from their original exports); any other content is a hit. Keyed by the path
// under public/ (and the same path under dist/).
const PINNED = {
  // The two glass models are the original Vitrum exports (mark.glb 28b589f0..., line1.glb 12ed4289...) after gltfpack 1.3.0
  // -vn 12 (2026-11-05: quantized, no decoder, materials kept; 6.7 MB to 1.1 MB).
  'models/mark.glb': 'f4083c92a4f82a3b9ec86df608f32b3a1b5dc29c0b5ebd9c329aa386f032cf5c',
  'models/line1.glb': '5f35ba84b23b86a882f199a4fd6d778e0eab1ff51a1f4874eee2bb4986d71fb3',
  // GoatCounter's count.js, copied unchanged from https://gc.zgo.at/count.js on 2026-11-05 (ISC license).
  'js/count.js': '792b7abd26c1fb6ae62906833e09a301251e2641816e69e4f95aba518f3fe3f0',
  'vendor/three-0.170.0/build/three.module.js': 'ce1fa418de16a19495a9f72495580e3015d7745c296d3ce0485897f902ddedfb',
};
const pinnedKey = (rel) => { const m = rel.match(/^(?:public|dist)\/(.+)$/); return m && PINNED[m[1]] ? m[1] : null; };
function checkPinned(rel, bytes, shown = null) {
  const key = pinnedKey(rel);
  if (createHash('sha256').update(bytes).digest('hex') !== PINNED[key]) hits.add(`pinned_mismatch  ${shown || rel}`);
  check(rel, null, shown);
}

function check(path, content, shown = null) {
  const rel = path.split('\\').join('/');
  if (IGNORED(rel)) return;
  const where = shown || rel;
  const ext = extname(rel).slice(1);
  for (const r of rules) {
    if (r.scope && !r.scope.some((s) => rel === s || rel.startsWith(s))) continue;
    // skip=ext applies to bundled output only (dist/), never to source scripts.
    const skipped = rel.startsWith('dist/') && r.skip.includes(ext);
    if (content !== null && !skipped && r.re.test(content)) hits.add(`${r.name}  ${where}`);
    if (r.re.test(rel)) hits.add(`${r.name}  ${where} (file name)`);
  }
}
function checkMessage(label, msg) {
  for (const r of rules) if (r.re.test(msg)) hits.add(`${r.name}  ${label}`);
}
function walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (pinnedKey(relative(root, full))) checkPinned(relative(root, full), readFileSync(full));
    else check(relative(root, full), BINARY.has(extname(full)) ? null : readFileSync(full, 'utf8'));
  }
}
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const args = process.argv.slice(2);
if (args[0] === '--staged') {
  for (const f of git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z').split('\0').filter(Boolean)) {
    if (pinnedKey(f)) { checkPinned(f, execFileSync('git', ['show', `:${f}`], { maxBuffer: 1 << 28 })); continue; }
    const bin = BINARY.has(extname(f));
    check(f, bin ? null : execFileSync('git', ['show', `:${f}`], { encoding: 'utf8', maxBuffer: 1 << 28 }));
  }
  try { checkMessage('branch name', git('rev-parse', '--abbrev-ref', 'HEAD')); } catch { /* no commits yet */ }
} else if (args[0] === '--history') {
  // Blobs under every path they ever had (the lockfile stays exempt, as in the tree scan), every
  // commit message, every ref name. Hits name the path and the blob or commit, never the text.
  const big = { encoding: 'utf8', maxBuffer: 1 << 30, stdio: ['pipe', 'pipe', 'ignore'] };
  const paths = new Map();
  for (const line of git('rev-list', '--all', '--reflog', '--objects').split('\n')) {
    const i = line.indexOf(' ');
    if (i > 0 && !paths.has(line.slice(0, i))) paths.set(line.slice(0, i), new Set());
    if (i > 0) paths.get(line.slice(0, i)).add(line.slice(i + 1));
  }
  const types = execFileSync('git', ['cat-file', '--batch-check=%(objectname) %(objecttype)'], { ...big, input: [...paths.keys()].join('\n') + '\n' });
  for (const line of types.split('\n')) {
    const [sha, type] = line.split(' ');
    if (type !== 'blob') continue;
    let text = null;
    for (const p of paths.get(sha)) {
      if (IGNORED(p)) continue;
      if (pinnedKey(p)) { checkPinned(p, execFileSync('git', ['cat-file', 'blob', sha], { ...big, encoding: 'buffer' }), `${p} (blob ${sha.slice(0, 8)})`); continue; }
      if (text === null && !BINARY.has(extname(p))) text = execFileSync('git', ['cat-file', 'blob', sha], big);
      check(p, BINARY.has(extname(p)) ? null : text, `${p} (blob ${sha.slice(0, 8)})`);
    }
  }
  for (const entry of git('log', '--all', '--reflog', '--format=%H%x00%B%x01').split('\x01')) {
    const [sha, msg] = entry.replace(/^\n/, '').split('\0');
    if (sha) checkMessage(`commit ${sha.slice(0, 8)} message`, msg || '');
  }
  checkMessage('ref names', git('for-each-ref', '--format=%(refname)'));
} else if (args[0] === '--message') {
  checkMessage('commit message', readFileSync(args[1], 'utf8'));
} else {
  for (const d of ['src', 'public', 'dist']) walk(join(root, d));
  if (existsSync(join(root, 'dist/rss.xml')) === false && existsSync(join(root, 'dist'))) hits.add('missing_feed  dist/rss.xml');
  try { checkMessage('last commit message', git('log', '-1', '--format=%B')); } catch { /* no commits yet */ }
}

if (hits.size) {
  console.error('firewall: HIT');
  for (const h of [...hits].sort()) console.error(`  ${h}`);
  process.exit(1);
}
console.log('firewall: clean');
