// Checks the content security policy on every rendered page. The build fails when a page has
// no policy meta tag or more than one, when it is not the first element of the head (a meta policy
// governs only what is parsed after it), when the charset declaration does not end within the
// first 1024 bytes, when a script or style element comes before it, when an
// inline script or style is not hashed in it, when a script or stylesheet is not same-origin,
// or when style attributes exist without 'unsafe-inline' on style-src-attr.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createHash } from 'node:crypto';

const hash = (s) => `'sha256-${createHash('sha256').update(s).digest('base64')}'`;
const unescape = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const bad = [];

function check(f, html) {
  const metas = [...html.matchAll(/<meta http-equiv="content-security-policy" content="([^"]*)">/g)];
  if (metas.length !== 1) return bad.push(`${f}: ${metas.length} policy meta tags`);
  const head = html.match(/<head>\s*/);
  if (!head || head.index + head[0].length !== metas[0].index) bad.push(`${f}: the policy is not the first element of the head`);
  const charset = html.match(/<meta charset="utf-8">/i);
  if (!charset || charset.index + charset[0].length > 1024) bad.push(`${f}: the charset meta does not end within the first 1024 bytes`);
  const policy = unescape(metas[0][1]);
  const directive = (name) => (policy.match(new RegExp(`(?:^|;)\\s*${name} ([^;]*)`)) || [])[1] || '';
  const scriptSrc = directive('script-src'), styleSrc = directive('style-src');
  if (html.search(/<(script|style)\b/) < metas[0].index) bad.push(`${f}: a script or style comes before the policy`);
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const src = attrs.match(/\ssrc="([^"]*)"/);
    if (src) { if (!src[1].startsWith('/') || src[1].startsWith('//')) bad.push(`${f}: script from ${src[1]}`); }
    else if (!scriptSrc.includes(hash(body))) bad.push(`${f}: inline script not in script-src; its hash is ${hash(body)} (${body.trim().split('\n')[0].slice(0, 60)})`);
  }
  for (const [, body] of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g))
    if (!styleSrc.includes(hash(body))) bad.push(`${f}: inline style not in style-src; its hash is ${hash(body)}`);
  for (const [, href] of html.matchAll(/<link rel="stylesheet" href="([^"]*)"/g))
    if (!href.startsWith('/') || href.startsWith('//')) bad.push(`${f}: stylesheet from ${href}`);
  if (/\sstyle="/.test(html) && !/style-src-attr [^;]*'unsafe-inline'/.test(policy)) bad.push(`${f}: style attributes without style-src-attr 'unsafe-inline'`);
}

(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f);
    else if (extname(f) === '.html') check(f, readFileSync(f, 'utf8'));
  }
})('dist');

if (bad.length) {
  console.error('cspcheck failed:\n  ' + bad.join('\n  '));
  process.exit(1);
}
console.log('cspcheck: clean');
