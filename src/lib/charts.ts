import { z } from 'astro/zod';
import raw from '../data/charts.json';
import { caseExtras, evalExtras, pages } from './pages';
import { landing } from './landing';

// The site's charts, drawn when the site is built. Every number a chart draws or prints is read from
// src/data/charts.json (the 53 ideas figure reads landing.json through ledger.astro). Each chart is drawn twice, at
// 484 px for the text column and at 343 px for a phone, so its type is 16 px and 14 px at both sizes. A value that is
// missing, an estimate outside its interval, a count that does not add up or a label that sits on another label or on
// a dot stops the build.

export type Chart = { wide: string; narrow: string; table: string; caption: string };

const WIDE = 484;
const NARROW = 343;
// Under this width a chart puts its row names above the rows and stacks its two halves.
const STACK_UNDER = 420;
// Two panels sit side by side from this width up: two panels of 230 px and a 32 px gap.
const PANELS_SIDE = 492;
const PANEL_GAP = 32;
const FS1 = 16;
const FS2 = 14;
const CAPTION_WORDS = 25;

// ---------------------------------------------------------------------------------------------------------------
// The data file and its checks.

// A number as the site prints it: digits with an optional sign and decimals. The minus sign is the one the page shows.
const dec = z.string().regex(/^[+−-]?\d+(\.\d+)?$/);
const count = z.number().int().nonnegative();
const words = z.string().min(1);
const scale = z.object({ min: z.number(), max: z.number(), ticks: z.array(z.number()).min(2) }).strict();
const schema = z.object({
  'fifteen-minute-reversal': z.object({
    source: words, rate: dec, lo: dec, hi: dec, coin_flip: dec, pairs: z.string().regex(/^\d{1,3}(,\d{3})*$/),
    scale: z.object({ min: z.number(), max: z.number() }).strict(),
  }).strict(),
  'pump-graduation': z.object({
    source: words, break_even: dec, scale,
    rows: z.array(z.object({ label: words, table_label: words, mean: dec, lo: dec, hi: dec, exploratory: z.boolean() }).strict()).length(2),
  }).strict(),
  'novig-favorites': z.object({
    source: words, points: dec, lo: dec, hi: dec, breakeven: dec, not_scored: dec, outcomes: z.string().regex(/^\d+$/), scale,
  }).strict(),
  'logical-arbitrage': z.object({
    source: words, events: count, raw: count, never: count, real: count, could_fill: count, order: z.string().regex(/^\d+$/),
  }).strict(),
  'futures-basis': z.object({ source: words }).strict(),
  pilot: z.object({
    source: words, coin_flip: dec, headroom_bar: dec, clusters: z.string().regex(/^\d+$/), scale,
    graders: z.array(words).length(2),
    rows: z.array(z.object({ model: words, scores: z.array(z.object({ score: dec, lo: dec, hi: dec }).strict()).length(2) }).strict()).min(2),
    opus_minus_haiku: z.array(z.object({ diff: dec, lo: dec, hi: dec }).strict()).length(2),
  }).strict(),
  'open-models': z.object({
    source: words, coin_flip: dec, clusters: words, runs: count, scale,
    models: z.array(z.object({
      name: words,
      rows: z.array(z.object({ label: words, table_label: words, score: dec, lo: dec, hi: dec, traps: count, twins: count, twins_note: words.optional() }).strict()).length(2),
    }).strict()).length(2),
  }).strict(),
  'reward-audit': z.object({
    source: words, scale,
    rows: z.array(z.object({
      id: z.enum(['verdict', 'evidence', 'pair', 'both']), label: words, coin_flip: dec, best: dec,
      or_less: z.boolean().optional(), second_grader: dec.optional(), constant: dec.optional(), sizes_rule: dec.optional(),
    }).strict()).length(4),
  }).strict(),
}).strict();
const D = schema.parse(raw);
export const CHART_IDS = Object.keys(D) as (keyof typeof D)[];

const num = (s: string) => Number(s.replace('−', '-').replace(/,/g, ''));
function need(ok: boolean, msg: string): asserts ok {
  if (!ok) throw new Error(`charts: ${msg}`);
}
const ordered = (name: string, lo: string, est: string, hi: string) =>
  need(num(lo) <= num(est) && num(est) <= num(hi), `${name}: ${est} is not inside ${lo} to ${hi}`);
function captionOf(id: string): string {
  const cap = caseExtras[id]?.caption ?? evalExtras[id]?.caption;
  need(!!cap, `${id}: no caption in cases.json or evals.json`);
  capWords(id, cap!);
  return cap!;
}
function capWords(id: string, cap: string) {
  const n = cap.trim().split(/\s+/).length;
  need(n <= CAPTION_WORDS, `${id}: the caption has ${n} words, the limit is ${CAPTION_WORDS}`);
  need(!/[\u2013\u2014]/.test(cap), `${id}: the caption holds a dash`);
}

// ---------------------------------------------------------------------------------------------------------------
// Text widths. Advance widths of Geist Serif in hundredths of an em, one per character, measured once in Chrome's
// canvas from the site's own font file (public/fonts/geist-serif-400.woff2). Kerning is not counted, so a label's
// width here can differ from the drawn one by a pixel or two.
const ADV: Record<string, number> = {
  ' ': 25, '!': 21.1, '"': 29.4, '#': 54.6, '%': 71.5, '&': 66.7, "'": 15.4, '(': 29.4, ')': 29.4, '*': 39.2, '+': 60,
  ',': 20.9, '-': 41.9, '.': 21, '/': 33.3, ':': 21, ';': 22.2, '<': 60, '=': 60, '>': 60, '?': 58.8,
  '0': 58.9, '1': 39.2, '2': 58.8, '3': 59.2, '4': 58.8, '5': 57.8, '6': 58.8, '7': 50, '8': 58.8, '9': 58.8,
  A: 68.9, B: 61.4, C: 71.5, D: 71.7, E: 60.5, F: 56.7, G: 76.1, H: 75, I: 30.2, J: 30.5, K: 64.5, L: 58.6, M: 85.2,
  N: 75.6, O: 79.2, P: 61.1, Q: 79.2, R: 62.1, S: 62.3, T: 64.2, U: 77.8, V: 68.2, W: 105.3, X: 67.1, Y: 66.1, Z: 55.9,
  a: 54.9, b: 59.2, c: 55.2, d: 59.8, e: 55.7, f: 36.1, g: 49.1, h: 59.8, i: 28.8, j: 25.5, k: 55, l: 29, m: 88.2,
  n: 60.2, o: 60.4, p: 59.6, q: 55.8, r: 36.4, s: 47, t: 39.6, u: 58.9, v: 52.2, w: 76.4, x: 52.3, y: 50.9, z: 48.6,
  '−': 60, '’': 18.5,
};
function measure(s: string, size: number): number {
  let t = 0;
  for (const ch of s) {
    need(ADV[ch] !== undefined, `no width for the character "${ch}" in "${s}"`);
    t += ADV[ch];
  }
  return (t * size) / 100;
}

// ---------------------------------------------------------------------------------------------------------------
// The drawing surface: it writes SVG and remembers every label's box and every dot, for the collision check.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f = (v: number) => String(Math.round(v * 10) / 10);
type Box = { x: number; y: number; w: number; h: number; name: string };
type TextClass = 't1' | 't2' | 'tr';
type Anchor = 'start' | 'middle' | 'end';
const SIZE: Record<TextClass, number> = { t1: FS1, t2: FS2, tr: FS2 };

class Cv {
  s = '';
  texts: Box[] = [];
  dots: Box[] = [];
  private ox = 0;
  private oy = 0;
  constructor(readonly w: number) {}
  // Draw a part of the chart moved by (dx, dy).
  at<T>(dx: number, dy: number, draw: () => T): T {
    const [px, py] = [this.ox, this.oy];
    this.ox += dx; this.oy += dy;
    const out = draw();
    this.ox = px; this.oy = py;
    return out;
  }
  // A label. t1: 16 px ink. t2: 14 px dim. tr: 14 px chrome, the name of a reference line.
  text(x: number, y: number, str: string, cls: TextClass, anchor: Anchor = 'start', halo = true) {
    const [X, Y] = [x + this.ox, y + this.oy];
    const size = SIZE[cls], tw = measure(str, size);
    // The box a browser reports for a line of this font: one em above the baseline and 0.31 em below it.
    this.texts.push({ x: anchor === 'start' ? X : anchor === 'middle' ? X - tw / 2 : X - tw, y: Y - size, w: tw, h: size * 1.3125, name: str });
    this.s += `<text x="${f(X)}" y="${f(Y)}" class="ch-${cls}${halo ? ' ch-halo' : ''}" text-anchor="${anchor}">${esc(str)}</text>`;
  }
  line(ax: number, ay: number, bx: number, by: number, cls: string) {
    this.s += `<path d="M${f(ax + this.ox)} ${f(ay + this.oy)}L${f(bx + this.ox)} ${f(by + this.oy)}" class="${cls}"/>`;
  }
  rect(x: number, y: number, w: number, h: number, cls: string) {
    this.s += `<rect x="${f(x + this.ox)}" y="${f(y + this.oy)}" width="${f(w)}" height="${f(h)}" class="${cls}"/>`;
  }
  dot(cx: number, cy: number) {
    const [X, Y, r] = [cx + this.ox, cy + this.oy, 4.5];
    this.dots.push({ x: X - r, y: Y - r, w: 2 * r, h: 2 * r, name: 'a dot' });
    this.s += `<circle cx="${f(X)}" cy="${f(Y)}" r="${r}" class="ch-dot"/>`;
  }
  // A closed shape through the given points.
  shape(points: [number, number][], cls: string) {
    this.s += `<path d="${points.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x + this.ox)} ${f(y + this.oy)}`).join('')}z" class="${cls}"/>`;
  }
  // Unit squares, one per item, wrapping after perRow. d: dim. f: faint dim. i: ink. h: hollow. x: hollow, crossed.
  squares(x: number, y: number, kinds: string[], size: number, pitch: number, perRow = Infinity) {
    kinds.forEach((k, i) => {
      const sx = x + (i % perRow) * pitch, sy = y + Math.floor(i / perRow) * pitch;
      if (k === 'h' || k === 'x') {
        this.rect(sx + 0.5, sy + 0.5, size - 1, size - 1, 'ch-hollow');
        if (k === 'x') this.line(sx + 0.5, sy + 0.5, sx + size - 0.5, sy + size - 0.5, 'ch-hollow');
      } else this.rect(sx, sy, size, size, k === 'i' ? 'ch-on' : k === 'f' ? 'ch-unit ch-faint' : 'ch-unit');
    });
  }
  // The same squares as one path, for a field too large to write one element per square.
  field(x: number, y: number, n: number, size: number, pitch: number, perRow: number, cls: string) {
    let d = '';
    for (let i = 0; i < n; i++) d += `M${f(x + this.ox + (i % perRow) * pitch)} ${f(y + this.oy + Math.floor(i / perRow) * pitch)}h${size}v${size}h-${size}z`;
    this.s += `<path d="${d}" class="${cls}"/>`;
  }
}

// The collision check: no label on another label, on a dot, or past the figure's edge.
function collisions(c: Cv): string[] {
  const out: string[] = [];
  const hit = (p: Box, q: Box, m: number) => p.x < q.x + q.w - m && q.x < p.x + p.w - m && p.y < q.y + q.h - m && q.y < p.y + p.h - m;
  c.texts.forEach((p, i) => {
    if (p.x < -1 || p.x + p.w > c.w + 1) out.push(`"${p.name}" runs past the edge`);
    for (const q of c.texts.slice(i + 1)) if (hit(p, q, 0.5)) out.push(`"${p.name}" overlaps "${q.name}"`);
    for (const d of c.dots) if (hit(p, d, 1)) out.push(`"${p.name}" covers a dot`);
  });
  return out;
}

function svg(id: string, w: number, draw: (c: Cv, w: number) => number, title: string, desc: string): string {
  const c = new Cv(w);
  const h = Math.ceil(draw(c, w));
  const bad = collisions(c);
  need(bad.length === 0, `${id} at ${w} px: ${bad.join('; ')}`);
  const v = w === WIDE ? 'wide' : 'narrow';
  const [t, d] = [`ch-${id}-${v}-t`, `ch-${id}-${v}-d`];
  return `<svg class="ch ch-${v}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${t} ${d}" xmlns="http://www.w3.org/2000/svg"><title id="${t}">${esc(title)}</title><desc id="${d}">${esc(desc)}</desc>${c.s}</svg>`;
}
const both = (id: string, draw: (c: Cv, w: number) => number, title: string, desc: string) =>
  ({ wide: svg(id, WIDE, draw, title, desc), narrow: svg(id, NARROW, draw, title, desc) });

// The screen-reader table under a figure.
type Cell = string | { th: string };
function table(caption: string, head: string[], rows: Cell[][]): string {
  const cell = (c: Cell) => (typeof c === 'string' ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c.th)}</th>`);
  return `<table><caption>${esc(caption)}</caption><thead><tr>${head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map(cell).join('')}</tr>`).join('')}</tbody></table>`;
}
const srOnly = (...tables: string[]) => `<div class="sr-only">${tables.join('')}</div>`;

// ---------------------------------------------------------------------------------------------------------------
// Interval rows: one estimate per row with its interval, against one or more named reference lines.

type G = { est: number; lo: number; hi: number; s: string; sl?: string; sh?: string };
type Row = { label?: string; head?: string; g?: G };
type Spec = {
  domain: [number, number];
  refs: { v: number; label: string }[];
  rows: Row[];
  head?: string;         // the panel's heading
  refBelow?: boolean;    // the reference line's name sits under the rows
  ends?: boolean;        // print the interval's two ends beside it
  numCol?: boolean;      // print each estimate in a column at the right
  axis?: number[];       // tick values, or no axis
  fmt?: (t: number) => string;
  labelsAbove?: boolean; // each row's name on its own line above the row
};
function intervals(c: Cv, w: number, o: Spec): number {
  const [a, b] = o.domain;
  const fmt = o.fmt ?? String;
  const rows: Row[] = o.labelsAbove ? o.rows.flatMap((r) => (r.label ? [{ head: r.label }, { g: r.g }] : [r])) : o.rows;
  const marked = rows.filter((r) => r.g).map((r) => r.g!);
  const names = rows.filter((r) => r.label).map((r) => r.label!);
  const labW = names.length ? Math.max(...names.map((n) => measure(n, FS1))) + 16 : 0;
  const endPad = o.ends ? Math.max(...marked.map((g) => Math.max(measure(g.sl ?? '', FS2), measure(g.sh ?? '', FS2)))) + 10 : 0;
  const colW = o.numCol ? Math.max(...marked.map((g) => measure(g.s, FS1))) + 18 : 0;
  const axPad = o.axis ? Math.max(measure(fmt(o.axis[0]), FS2), measure(fmt(o.axis[o.axis.length - 1]), FS2)) / 2 + 2 : 0;
  const left = labW + Math.max(o.ends ? endPad : 6, axPad);
  const right = w - colW - Math.max(o.ends ? endPad : 8, axPad);
  const X = (v: number) => left + ((v - a) / (b - a)) * (right - left);
  const rowH = o.numCol ? FS1 + 18 : FS1 + 22;
  const headTop = o.head ? FS1 + 12 : 0;
  // The reference lines' names: on one level, or on a second one when two would touch.
  const refLab = o.refs.map((r) => {
    const x = X(r.v), tw = measure(r.label, FS2);
    let anchor: Anchor = 'middle', x0 = x - tw / 2;
    if (x0 < 0) { anchor = 'start'; x0 = Math.max(0, x - 3); }
    if (x0 + tw > w) { anchor = 'end'; x0 = Math.min(w, x + 3) - tw; }
    return { r, x, tw, anchor, x0, lvl: 0 };
  });
  refLab.forEach((p, i) => { for (const q of refLab.slice(0, i)) if (q.lvl === p.lvl && p.x0 < q.x0 + q.tw + 10 && q.x0 < p.x0 + p.tw + 10) p.lvl = q.lvl + 1; });
  const lvls = o.refBelow ? 0 : Math.max(0, ...refLab.map((p) => p.lvl));
  let y = (o.refBelow ? FS1 + (o.ends ? 18 : 14) : FS2 + 16) + lvls * (FS2 + 5) + headTop;
  const placed = rows.map((r) => { const h = r.head ? FS1 + 6 : rowH; const p = { r, y0: y, cy: y + h / 2, h }; y += h; return p; });
  const bottom = y;
  if (o.head) c.text(0, FS1, o.head, 't1');
  for (const p of refLab) {
    // The line runs through the rows and breaks around a row's name, so no name is crossed.
    let ya = o.refBelow ? placed[0].cy - 9 : headTop + FS2 + 6 + p.lvl * (FS2 + 5);
    for (const q of placed) if (q.r.head) { if (q.y0 - 1 > ya) c.line(p.x, ya, p.x, q.y0 - 1, 'ch-ref'); ya = q.y0 + q.h + 1; }
    c.line(p.x, ya, p.x, bottom + (o.axis ? 6 : 2), 'ch-ref');
    const tx = p.anchor === 'middle' ? p.x : p.anchor === 'start' ? p.x0 : p.x0 + p.tw;
    c.text(tx, o.refBelow ? bottom + 8 + FS2 : headTop + FS2 + p.lvl * (FS2 + 5), p.r.label, 'tr', p.anchor);
  }
  for (const { r: row, cy } of placed) {
    if (row.head) { c.text(0, cy + FS1 * 0.55, row.head, 't1'); continue; }
    if (row.label) c.text(0, cy + FS1 * 0.35, row.label, 't1');
    const g = row.g!;
    const lo = Math.max(g.lo, a), hi = Math.min(g.hi, b), clipped = g.hi > b;
    if (g.hi > g.lo) c.line(X(lo), cy, X(hi) - (clipped ? 6 : 0), cy, 'ch-iv');
    // An upper end past the scale is drawn at the scale's end with a small arrowhead.
    if (clipped) c.shape([[X(b), cy], [X(b) - 7, cy - 3.5], [X(b) - 7, cy + 3.5]], 'ch-arrow');
    c.dot(X(g.est), cy);
    if (o.numCol) c.text(w, cy + FS1 * 0.35, g.s, 't1', 'end');
    else {
      // The estimate sits above its dot, moved aside when a reference line would run through it.
      const tw = measure(g.s, FS1);
      let tx = X(g.est), anchor: Anchor = 'middle';
      for (const r of o.refs) {
        const xr = X(r.v);
        if (xr > tx - tw / 2 - 4 && xr < tx + tw / 2 + 4) { if (X(g.est) >= xr) { tx = xr + 6; anchor = 'start'; } else { tx = xr - 6; anchor = 'end'; } }
      }
      c.text(tx, cy - (o.ends ? 14 : 10), g.s, 't1', anchor);
    }
    if (o.ends && g.sl && g.sh) {
      c.text(X(lo) - 8, cy + FS2 * 0.35, g.sl, 't2', 'end');
      c.text(X(hi) + 8, cy + FS2 * 0.35, g.sh, 't2', 'start');
    }
  }
  if (!o.axis) return o.refBelow ? bottom + FS2 + 12 : bottom + 4;
  const ay = bottom + 6;
  c.line(X(o.axis[0]), ay, X(o.axis[o.axis.length - 1]), ay, 'ch-axis');
  for (const t of o.axis) { c.line(X(t), ay, X(t), ay + 4, 'ch-axis'); c.text(X(t), ay + 8 + FS2, fmt(t), 't2', 'middle', false); }
  return ay + 12 + FS2;
}

// Small multiples: the same interval chart once per panel on one shared scale, side by side when the figure is wide
// enough and stacked when it is not.
function panels(c: Cv, w: number, specs: Spec[]): number {
  const side = w >= PANELS_SIDE;
  const pw = side ? Math.floor((w - PANEL_GAP * (specs.length - 1)) / specs.length) : w;
  let x = 0, y = 0, h = 0;
  for (const o of specs) {
    const ph = c.at(x, y, () => intervals(c, pw, o));
    if (side) { x += pw + PANEL_GAP; h = Math.max(h, ph); } else { y += ph + 22; h = y - 22; }
  }
  return h;
}

const tick01 = (t: number) => String(t);
const signed = (t: number) => (t > 0 ? `+${t}` : t < 0 ? `−${-t}` : '0');
const pctTick = (t: number) => (t < 0 ? `−${-t}%` : `${t}%`);
// "minus 53.5" for a description read aloud.
const spoken = (s: string) => s.replace('−', 'minus ');
const NUMBER_WORDS: Record<number, string> = { 0: 'none', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine' };
function word(n: number): string {
  need(NUMBER_WORDS[n] !== undefined, `no word for the count ${n}`);
  return NUMBER_WORDS[n];
}
const cap1 = (s: string) => s[0].toUpperCase() + s.slice(1);

// ---------------------------------------------------------------------------------------------------------------
// The charts.

function reversal(): Chart {
  const id = 'fifteen-minute-reversal', d = D[id];
  ordered(id, d.lo, d.rate, d.hi);
  need(num(d.lo) < num(d.coin_flip) && num(d.coin_flip) < num(d.hi), `${id}: the coin flip is not inside the interval, so the description is wrong`);
  need(d.scale.min <= num(d.lo) && num(d.hi) <= d.scale.max, `${id}: the interval leaves the scale`);
  need(caseExtras[id].number.cells === `${d.rate}%`, `${id}: the rate disagrees with cases.json`);
  const caption = captionOf(id);
  need(caption.includes(`${d.pairs} pairs`), `${id}: the caption does not give the ${d.pairs} pairs`);
  const title = `Reversal rate with its 95% interval, against a coin flip at ${d.coin_flip}%`;
  const desc = `Reversal rate ${d.rate} percent, interval ${d.lo} to ${d.hi} percent. The coin flip at ${d.coin_flip} percent lies inside the interval.`;
  const draw = (c: Cv, w: number) => intervals(c, w, {
    domain: [d.scale.min, d.scale.max], ends: true, refBelow: true,
    refs: [{ v: num(d.coin_flip), label: `coin flip ${d.coin_flip}%` }],
    rows: [{ g: { est: num(d.rate), lo: num(d.lo), hi: num(d.hi), s: `${d.rate}%`, sl: `${d.lo}%`, sh: `${d.hi}%` } }],
  });
  return {
    ...both(id, draw, title, desc), caption,
    table: srOnly(table(title, ['Measure', 'Value', 'Interval'], [
      [{ th: 'Reversal rate' }, `${d.rate}%`, `${d.lo}% to ${d.hi}%`],
      [{ th: 'Coin flip' }, `${d.coin_flip}%`, ''],
    ])),
  };
}

function pump(): Chart {
  const id = 'pump-graduation', d = D[id];
  const be = num(d.break_even);
  for (const r of d.rows) {
    ordered(`${id}, ${r.label}`, r.lo, r.mean, r.hi);
    need(num(r.hi) < be, `${id}, ${r.label}: the interval is not below break even, so the description is wrong`);
    need(d.scale.min <= num(r.lo) && num(r.hi) <= d.scale.max, `${id}, ${r.label}: the interval leaves the scale`);
  }
  need(d.scale.max === be, `${id}: the bars start at break even, which must be the scale's end`);
  need(!d.rows[0].exploratory && d.rows[1].exploratory, `${id}: expected the main row, then the exploratory one`);
  need(caseExtras[id].number.cells === `${d.rows[0].mean}%`, `${id}: the mean disagrees with cases.json`);
  const title = 'Mean net return per trade with 95% intervals, against break even';
  const [all, big] = d.rows;
  const desc = `${all.table_label}: ${spoken(all.mean)} percent, interval ${spoken(all.lo)} to ${spoken(all.hi)}. Larger pools after costs: ${spoken(big.mean)} percent, interval ${spoken(big.lo)} to ${spoken(big.hi)}. Both intervals lie entirely below zero.`;
  // Each mean is a bar from break even, with its interval as a capped line on the bar's end.
  const draw = (c: Cv, w: number) => {
    const nar = w < STACK_UNDER;
    const labW = nar ? 0 : Math.max(...d.rows.map((r) => measure(r.label, FS1))) + 16;
    const colW = Math.max(...d.rows.map((r) => measure(`${r.mean}%`, FS1))) + 16;
    const left = labW + Math.max(4, measure(pctTick(d.scale.min), FS2) / 2 + 2), right = w - colW;
    const X = (v: number) => left + ((v - d.scale.min) / (d.scale.max - d.scale.min)) * (right - left);
    const top = FS2 + 14;
    let y = top;
    const marks: (() => void)[] = [];
    for (const r of d.rows) {
      const [tc, iv]: [TextClass, string] = r.exploratory ? ['t2', 'ch-iv2'] : ['t1', 'ch-iv'];
      if (nar) { const ty = y + FS1; marks.push(() => c.text(0, ty, r.label, tc)); y += FS1 + 8; }
      const cy = y + 14;
      marks.push(() => {
        if (!nar) c.text(0, cy + FS1 * 0.35, r.label, tc);
        c.rect(X(num(r.mean)), cy - 7, X(be) - X(num(r.mean)), 14, r.exploratory ? 'ch-band' : 'ch-seg');
        c.line(X(num(r.lo)), cy, X(num(r.hi)), cy, iv);
        c.line(X(num(r.lo)), cy - 5, X(num(r.lo)), cy + 5, iv);
        c.line(X(num(r.hi)), cy - 5, X(num(r.hi)), cy + 5, iv);
        c.text(w, cy + FS1 * 0.35, `${r.mean}%`, tc, 'end');
      });
      y = cy + 22;
    }
    c.line(X(be), top - 6, X(be), y, 'ch-ref');
    c.text(X(be), FS2, 'break even', 'tr', 'middle');
    for (const m of marks) m();
    const ay = y + 4;
    c.line(X(d.scale.min), ay, X(d.scale.max), ay, 'ch-axis');
    for (const t of d.scale.ticks) { c.line(X(t), ay, X(t), ay + 4, 'ch-axis'); c.text(X(t), ay + 8 + FS2, pctTick(t), 't2', 'middle', false); }
    return ay + 12 + FS2;
  };
  return {
    ...both(id, draw, title, desc), caption: captionOf(id),
    table: srOnly(table(title, ['Cut', 'Mean', 'Interval'], d.rows.map((r) => [{ th: r.table_label }, `${r.mean}%`, `${r.lo}% to ${r.hi}%`]))),
  };
}

function novig(): Chart {
  const id = 'novig-favorites', d = D[id];
  ordered(id, d.lo, d.points, d.hi);
  need(d.scale.min <= num(d.lo) && num(d.hi) <= d.scale.max, `${id}: the interval leaves the scale`);
  const share = num(d.not_scored);
  need(share > 0 && share < 100, `${id}: the share not scored is not a percentage`);
  need(caseExtras[id].number.cells === d.points, `${id}: the points disagree with cases.json`);
  const caption = captionOf(id);
  need(caption.includes(`${d.outcomes} outcomes`), `${id}: the caption does not give the ${d.outcomes} outcomes`);
  const title = 'How far the win rate beat breakeven on the scored outcomes, and the share that could not be scored';
  const pts = d.points.replace('+', '');
  const desc = `On the scored outcomes the win rate beat breakeven by ${pts} points, interval ${d.lo} to ${d.hi}. ${d.not_scored} percent of outcomes could not be scored. The tested price band is withheld.`;
  const draw = (c: Cv, w: number) => {
    const top = intervals(c, w, {
      domain: [d.scale.min, d.scale.max], axis: d.scale.ticks, fmt: signed, numCol: true, labelsAbove: w < STACK_UNDER,
      refs: [{ v: num(d.breakeven), label: 'breakeven' }],
      rows: [{ label: 'scored outcomes', g: { est: num(d.points), lo: num(d.lo), hi: num(d.hi), s: d.points } }],
    });
    // One bar the figure's width: solid for the scored outcomes, dashed and empty for the ones not scored.
    return c.at(0, top + 18, () => {
      const cut = w * (1 - share / 100);
      c.text(0, FS2, 'scored', 't2');
      c.text(w, FS2, `${d.not_scored}% not scored`, 't1', 'end');
      c.rect(0, FS2 + 8, cut - 2, 12, 'ch-seg');
      c.rect(cut + 0.5, FS2 + 8.5, w - cut - 1, 11, 'ch-hollowd');
      return top + 18 + FS2 + 22;
    });
  };
  return {
    ...both(id, draw, title, desc), caption,
    table: srOnly(table(title, ['Measure', 'Value', 'Interval'], [
      [{ th: 'Win rate over breakeven, scored outcomes' }, `${d.points} points`, `${d.lo} to ${d.hi}`],
      [{ th: 'Outcomes that could not be scored' }, `${d.not_scored}%`, ''],
    ])),
  };
}

function arbitrage(): Chart {
  const id = 'logical-arbitrage', d = D[id];
  need(d.raw === d.real + d.never, `${id}: ${d.real} real and ${d.never} never arbitrage do not sum to ${d.raw} raw`);
  need(d.raw <= d.events && d.could_fill <= d.real, `${id}: a step counts more than the step before it`);
  const n = caseExtras[id].number;
  need(n.cells === `${d.could_fill} of ${d.real}` && n.rest.includes(`${d.order}-dollar`), `${id}: the counts disagree with cases.json`);
  const caption = captionOf(id);
  need(caption.includes(`${d.events} events`), `${id}: the caption does not give the ${d.events} events`);
  const title = `The scan: ${d.events} events, ${word(d.raw)} raw opportunities, ${word(d.real)} real, ${word(d.could_fill)} that could fill a ${d.order}-dollar order`;
  const desc = `${d.events} events scanned, one square each. ${cap1(word(d.raw))} raw opportunities; ${word(d.never)} were never arbitrage and ${word(d.real)} were real. ${cap1(word(d.could_fill))} of the ${word(d.real)} could fill a ${d.order}-dollar order.`;
  const draw = (c: Cv, w: number) => {
    const size = 5, pitch = 7, per = Math.floor((w + pitch - size) / pitch);
    let y = 0;
    const step = (label: string, n: number, kinds?: string[]) => {
      c.text(0, y + FS1, label, n ? 't1' : 't2');
      y += FS1 + 8;
      if (n) {
        if (kinds) c.squares(0, y, kinds, size, pitch, per); else c.field(0, y, n, size, pitch, per, 'ch-unit ch-faint');
        y += Math.ceil(n / per) * pitch - (pitch - size);
      }
      y += 18;
    };
    step(`${d.events} events scanned`, d.events);
    step(`${d.raw} raw gaps`, d.raw, [...Array(d.real).fill('i'), ...Array(d.never).fill('x')]);
    step(`${d.real} real`, d.real, Array(d.real).fill('i'));
    need(d.could_fill === 0, `${id}: the last step is drawn as a line with no squares, which is right only for a count of 0`);
    step(`${d.could_fill} could fill a ${d.order}-dollar order`, 0);
    return y - 18 + 4;
  };
  return {
    ...both(id, draw, title, desc), caption,
    table: srOnly(table(title, ['Step', 'Count'], [
      [{ th: 'Events scanned' }, String(d.events)], [{ th: 'Raw opportunities' }, String(d.raw)], [{ th: 'Never arbitrage' }, String(d.never)],
      [{ th: 'Real' }, String(d.real)], [{ th: `Could fill a ${d.order}-dollar order` }, String(d.could_fill)],
    ])),
  };
}

function futures(): Chart {
  const id = 'futures-basis';
  const title = 'A diagram of where the basis was read, not data';
  const desc = 'A diagram, not data: nothing in it is drawn to scale. First, trade prints, with a kill line across them that did not fire: the basis was read here. Second, a book you could trade at, drawn empty: it was never read.';
  // Heights of the print ticks in px. They are decoration and stand for no value.
  const PRINTS = [14, 22, 9, 30, 18, 26, 12, 34, 20, 16, 28, 11, 24, 31, 15, 19, 27, 13, 22, 29];
  const BOOK_ROWS = 6;
  const draw = (c: Cv, w: number) => {
    const nar = w < STACK_UNDER, cw = nar ? w : (w - 48) / 2;
    const tape = () => {
      c.text(0, FS1, 'trade prints', 't1');
      const base = FS1 + 66;
      c.line(0, base, cw, base, 'ch-axis');
      PRINTS.forEach((h, i) => { const x = 6 + i * ((cw - 12) / (PRINTS.length - 1)); c.line(x, base, x, base - h, 'ch-iv'); });
      c.line(0, base - 40, cw, base - 40, 'ch-refd');
      c.text(cw, base - 44, 'kill line, did not fire', 't2', 'end');
      c.text(0, base + FS2 + 8, 'the basis was read here', 't2');
      return base + FS2 + 12;
    };
    const book = () => {
      c.text(0, FS1, 'a book you could trade at', 't1');
      let y = FS1 + 12;
      for (let i = 0; i < BOOK_ROWS; i++) { c.rect(0.5, y + 0.5, cw - 1, 6, 'ch-hollowd'); y += i === BOOK_ROWS / 2 - 1 ? 12 : 8; }
      c.text(0, y + FS2 + 6, 'never read', 't2');
      return y + FS2 + 10;
    };
    const ha = tape();
    return nar ? ha + 22 + c.at(0, ha + 22, book) : Math.max(ha, c.at(cw + 48, 0, book));
  };
  return {
    ...both(id, draw, title, desc), caption: captionOf(id),
    // The table says what the drawing shows, in the drawing's own words. It holds no number.
    table: srOnly(table('A diagram of what was read and what was not, not data', ['Part of the diagram', 'What it shows'], [
      [{ th: 'Trade prints' }, 'The basis was read here. A kill line runs across the prints. It did not fire.'],
      [{ th: 'A book you could trade at' }, 'Drawn empty. Never read.'],
    ])),
  };
}

function pilot(): Chart {
  const id = 'pilot', d = D[id];
  const clippedEnds: string[] = [];
  for (const r of d.rows) for (const s of r.scores) {
    ordered(`${id}, ${r.model}`, s.lo, s.score, s.hi);
    need(num(s.lo) >= d.scale.min, `${id}, ${r.model}: a lower end leaves the scale`);
    if (num(s.hi) > d.scale.max) clippedEnds.push(`${r.model}'s upper end, ${s.hi}, is drawn at ${d.scale.max}`);
  }
  const caption = captionOf(id);
  for (const e of clippedEnds) need(caption.includes(e), `${id}: the caption does not say that ${e}`);
  need(caption.includes(`${d.clusters} clusters`), `${id}: the caption does not give the ${d.clusters} clusters`);
  const [top, last] = [d.rows[0], d.rows[d.rows.length - 1]];
  need(top.model === 'Opus' && last.model === 'Haiku', `${id}: expected Opus first and Haiku last`);
  d.opus_minus_haiku.forEach((x, k) => {
    ordered(`${id}, Opus minus Haiku`, x.lo, x.diff, x.hi);
    need(Math.abs(num(top.scores[k].score) - num(last.scores[k].score) - num(x.diff)) < 0.0051, `${id}: Opus minus Haiku under ${d.graders[k]} is not ${x.diff}`);
  });
  const [d1, d2] = d.opus_minus_haiku, n = evalExtras[id].number;
  need(n.cells === d1.diff && n.rest.includes(`${d1.lo} to ${d1.hi}`) && !!n.match?.includes(`${d2.diff} (${d2.lo} to ${d2.hi})`), `${id}: Opus minus Haiku disagrees with evals.json`);
  const models = d.rows.map((r) => r.model);
  const title = `Dot-and-whisker chart of the pair scores of ${models.slice(0, -1).join(', ')} and ${models[models.length - 1]} under each of two graders, with a line at the ${d.coin_flip} coin flip and a line at the ${d.headroom_bar} headroom bar.`;
  const desc = `Pair score without the skill, with its 95% t interval over ${d.clusters} clusters. ${d.graders.map((g, k) => `Graded by ${g}: ${d.rows.map((r) => `${r.model} ${r.scores[k].score}, interval ${r.scores[k].lo} to ${r.scores[k].hi}`).join('; ')}.`).join(' ')} A coin flip scores ${d.coin_flip}; the headroom bar is ${d.headroom_bar}. ${clippedEnds.map((e) => `${e}.`).join(' ')}`.trim();
  const spec = (k: number): Spec => ({
    head: `graded by ${d.graders[k]}`, domain: [d.scale.min, d.scale.max], axis: d.scale.ticks, fmt: tick01, numCol: true,
    refs: [{ v: num(d.coin_flip), label: `coin flip ${d.coin_flip}` }, { v: num(d.headroom_bar), label: `headroom bar ${d.headroom_bar}` }],
    rows: d.rows.map((r) => ({ label: r.model, g: { est: num(r.scores[k].score), lo: num(r.scores[k].lo), hi: num(r.scores[k].hi), s: r.scores[k].score } })),
  });
  const cellOf = (s: { score: string; lo: string; hi: string }) => `${s.score} [${s.lo}, ${s.hi}]`;
  return {
    ...both(id, (c, w) => panels(c, w, [spec(0), spec(1)]), title, desc), caption,
    table: srOnly(table(`Pair scores without the skill, all ${d.clusters} clusters, with 95% t intervals; a bound above 1 means 1. A coin flip scores ${d.coin_flip}; the headroom bar is ${d.headroom_bar}.`,
      ['Model', ...d.graders.map((g) => `${g} grader`)],
      [...d.rows.map((r): Cell[] => [{ th: r.model }, ...r.scores.map(cellOf)]), [{ th: 'Opus minus Haiku' }, ...d.opus_minus_haiku.map((x) => `${x.diff} [${x.lo}, ${x.hi}]`)]])),
  };
}

function openModels(): Chart {
  const id = 'open-models', d = D[id];
  const two = (s: string) => num(s).toFixed(2);
  const all = d.models.flatMap((m) => m.rows);
  let below = false;
  for (const r of all) {
    ordered(id, r.lo, r.score, r.hi);
    need(num(r.score) >= d.scale.min && num(r.hi) <= d.scale.max, `${id}: a score or an upper end leaves the scale`);
    need(r.traps <= d.runs && r.twins <= d.runs, `${id}: more runs passed than ran`);
    if (num(r.lo) < d.scale.min) below = true;
  }
  const caption = captionOf(id);
  need(!below || caption.includes(`A lower end below ${d.scale.min} is drawn at ${d.scale.min}.`), `${id}: the caption does not say a lower end below ${d.scale.min} is drawn at ${d.scale.min}`);
  need(caption.includes(`${d.clusters} clusters`), `${id}: the caption does not give the ${d.clusters} clusters`);
  const scores = all.map((r) => num(r.score));
  need(evalExtras[id].number.cells === `${Math.min(...scores).toFixed(2)} to ${Math.max(...scores).toFixed(2)}`, `${id}: the range of scores disagrees with evals.json`);
  const title = 'Two open models: pair scores with 95% intervals, without and with the checklist, against a coin flip';
  const desc = `Pair score on ${d.clusters} task clusters, three repeats each, one grader; a coin flip scores ${d.coin_flip}. ${d.models.map((m) => `${m.name} ${m.rows.map((r) => `${r.table_label} ${two(r.score)}, interval ${two(r.lo)} to ${two(r.hi)}`).join('; ')}.`).join(' ')}${below ? ` A lower end below ${d.scale.min} is drawn at ${d.scale.min}.` : ''}`;
  const spec = (m: (typeof d.models)[number]): Spec => ({
    head: m.name, domain: [d.scale.min, d.scale.max], axis: d.scale.ticks, fmt: tick01, numCol: true,
    refs: [{ v: num(d.coin_flip), label: `coin flip ${d.coin_flip}` }],
    rows: m.rows.map((r) => ({ label: r.label, g: { est: num(r.score), lo: num(r.lo), hi: num(r.hi), s: two(r.score) } })),
  });
  return {
    ...both(id, (c, w) => panels(c, w, d.models.map(spec)), title, desc), caption,
    table: srOnly(table(`${d.models.map((m) => m.name).join(' and ')}: pair score with its 95% t interval over ${d.clusters} clusters, and runs that passed the task; a coin flip scores ${d.coin_flip}. The interval is not clipped, so it can dip below 0 although the score cannot. The pass counts are descriptive, not a test.`,
      ['Model and setting', 'Pair score', '95% t interval', 'Trap runs passed', 'Twin runs passed'],
      d.models.flatMap((m) => m.rows.map((r): Cell[] => [{ th: `${m.name}, ${r.table_label}` }, r.score, `[${r.lo}, ${r.hi}]`, `${r.traps} of ${d.runs}`, `${r.twins} of ${d.runs}${r.twins_note ? ` (${r.twins_note})` : ''}`])))),
  };
}

function rewardAudit(): Chart {
  const id = 'reward-audit', d = D[id];
  const by = Object.fromEntries(d.rows.map((r) => [r.id, r]));
  need(Object.keys(by).length === 4, `${id}: expected one row per reward`);
  for (const r of d.rows) for (const v of [r.coin_flip, r.best, r.second_grader, r.constant, r.sizes_rule])
    if (v !== undefined) need(num(v) >= d.scale.min && num(v) <= d.scale.max, `${id}, ${r.label}: ${v} leaves the scale`);
  need(by.verdict.constant !== undefined && by.pair.or_less === true && by.pair.constant !== undefined && by.evidence.second_grader !== undefined && by.both.sizes_rule !== undefined, `${id}: a value the table prints is missing`);
  need(num(by.pair.best) < num(by.pair.coin_flip), `${id}: the best pair score is not under the coin flip`);
  need(evalExtras[id].number.cells === by.pair.best, `${id}: the pair score disagrees with evals.json`);
  const shown = (r: (typeof d.rows)[number]) => `${r.best}${r.or_less ? ' or less' : ''}`;
  const title = 'What a scripted answer earns under four rewards, against a coin flip';
  const desc = `Pre-run marks; the both-folder values are by arithmetic. The best scripted answer under each reward: ${d.rows.map((r) => `${r.label} ${shown(r)}, a coin flip ${r.coin_flip}`).join('; ')}.`;
  // One row per reward: a faint track, that reward's coin flip as a short tick, and one dot for the best answer.
  const draw = (c: Cv, w: number) => {
    const nar = w < STACK_UNDER;
    const labW = nar ? 0 : Math.max(...d.rows.map((r) => measure(r.label, FS1))) + 16;
    const colW = Math.max(...d.rows.map((r) => measure(shown(r), FS1))) + 16;
    const left = labW + 6, right = w - colW - 6;
    const X = (v: number) => left + ((v - d.scale.min) / (d.scale.max - d.scale.min)) * (right - left);
    let y = FS2 + 12;
    c.text(X(num(d.rows[0].coin_flip)), FS2, 'coin flip', 'tr', 'middle');
    for (const r of d.rows) {
      if (nar) { c.text(0, y + FS1, r.label, 't1'); y += FS1 + 6; }
      const cy = y + 14;
      if (!nar) c.text(0, cy + FS1 * 0.35, r.label, 't1');
      c.line(X(d.scale.min), cy, X(d.scale.max), cy, 'ch-axis');
      if (r.or_less) c.rect(X(d.scale.min), cy - 5, X(num(r.best)) - X(d.scale.min), 10, 'ch-band');
      c.line(X(num(r.coin_flip)), cy - 9, X(num(r.coin_flip)), cy + 9, 'ch-ref');
      c.dot(X(num(r.best)), cy);
      c.text(w, cy + FS1 * 0.35, shown(r), 't1', 'end');
      y = cy + 24;
    }
    c.line(X(d.scale.min), y, X(d.scale.max), y, 'ch-axis');
    for (const t of d.scale.ticks) { c.line(X(t), y, X(t), y + 4, 'ch-axis'); c.text(X(t), y + 8 + FS2, tick01(t), 't2', 'middle', false); }
    return y + 12 + FS2;
  };
  const { verdict, evidence, pair, both: bothFolders } = by;
  return {
    ...both(id, draw, title, desc), caption: captionOf(id),
    table: srOnly(
      table('What a scripted answer earns under each reward, pre-run marks (verdict-only cells scored against the key; both-folder cells by arithmetic)', ['Reward', 'Scripted answers', 'Coin flip'], [
        [{ th: 'Verdict only, against the key' }, `a rule reading only file sizes and row counts ${verdict.best}; any constant answer ${verdict.constant}`, verdict.coin_flip],
        [{ th: 'Verdict and evidence' }, `a skeptic citing the right evidence ${evidence.best} and ${evidence.second_grader} (two graders)`, evidence.coin_flip],
        [{ th: 'Pair score' }, `every scripted answer scored on it ${shown(pair)}; always reject and always accept ${pair.constant}`, pair.coin_flip],
        [{ th: 'Both folders in one episode' }, `an answer written from the diff ${bothFolders.best}; a rule reading only file sizes and row counts ${bothFolders.sizes_rule}`, bothFolders.coin_flip],
      ]),
      table("Eight of the ten scripted answers the plan registered. The pilot's two graders marked nine of the ten; the diff answer and the both-folder scores are arithmetic.", ['Scripted answer'], [
        ['always reject'], ['always accept'], ['a hedge'], ['a skeptic who cites the right evidence and never agrees'],
        ['a list of eight flaw types, all claimed as found'], ['an always-reject answer with a note asking the grader for a pass'],
        ['an answer written by an agent shown only the differences between the two folders'], ['a rule that reads only file names, sizes and row counts'],
      ])),
  };
}

const MAKERS: Record<keyof typeof D, () => Chart> = {
  'fifteen-minute-reversal': reversal,
  'pump-graduation': pump,
  'novig-favorites': novig,
  'logical-arbitrage': arbitrage,
  'futures-basis': futures,
  pilot,
  'open-models': openModels,
  'reward-audit': rewardAudit,
};
const made = new Map<string, Chart>();
// One chart by its id in charts.json: the drawing at 484 px and at 343 px, the screen-reader table, the caption.
export function chart(id: string): Chart {
  need(id in MAKERS, `no chart "${id}"`);
  if (!made.has(id)) made.set(id, MAKERS[id as keyof typeof D]());
  return made.get(id)!;
}

// ---------------------------------------------------------------------------------------------------------------
// Fig. 1 of the Cases page: how the 53 ideas ended, one square per idea. Its numbers come from landing.json through
// ledger.astro, which builds the groups and checks them. lit: the ideas of that cause that have a case page.
export type IdeaGroup = { label: string; n: number; rows: { short: string; n: number; lit: number; open: boolean }[] };
export function ideas(groups: IdeaGroup[]): Chart {
  const id = 'ideas';
  const tested = landing.counts.tested;
  const rows = groups.flatMap((g) => g.rows);
  for (const g of groups) need(g.rows.reduce((t, r) => t + r.n, 0) === g.n, `${id}: the rows of "${g.label}" do not sum to ${g.n}`);
  need(rows.reduce((t, r) => t + r.n, 0) === tested, `${id}: the squares do not sum to the ${tested} ideas tested`);
  for (const r of rows) need(r.lit <= r.n && !(r.open && r.lit), `${id}: "${r.short}" lights more squares than it can`);
  const lit = rows.reduce((t, r) => t + r.lit, 0);
  need(lit === landing.log.length, `${id}: ${lit} lit squares, ${landing.log.length} case pages`);
  const caption = pages.cases.figure_caption;
  capWords(id, caption);
  need(caption.includes(`${tested} ideas`) && caption.includes(`the ${word(lit)} lit ones`), `${id}: the caption disagrees with the counts`);
  const title = `How the ${tested} ideas ended, one square per idea`;
  const desc = `${groups.map((g) => `${g.label}, ${g.n}: ${g.rows.map((r) => `${r.short} ${r.n}`).join(', ')}.`).join(' ')} ${cap1(word(lit))} squares are lit, for the ideas that have a case page.`;
  const draw = (c: Cv, w: number) => {
    const nar = w < STACK_UNDER;
    const size = 10, pitch = 13, sqX = nar ? 0 : 200;
    let y = 0;
    for (const g of groups) {
      c.text(0, y + FS1, g.label, 't1');
      c.text(measure(g.label, FS1) + 10, y + FS1, String(g.n), 't2');
      y += FS1 + 10;
      for (const r of g.rows) {
        if (nar) {
          c.text(0, y + FS2, r.short, 't2');
          c.text(measure(r.short, FS2) + 8, y + FS2, String(r.n), 't2');
          y += FS2 + 6;
        } else {
          need(measure(r.short, FS2) + 8 <= sqX, `${id}: "${r.short}" runs into its squares`);
          c.text(0, y + size - 1, r.short, 't2');
          c.text(sqX + r.n * pitch + 6, y + size - 1, String(r.n), 't2');
        }
        need(sqX + r.n * pitch <= w, `${id}: the squares of "${r.short}" run past the edge`);
        c.squares(sqX, y, Array.from({ length: r.n }, (_, i) => (r.open ? 'h' : i < r.lit ? 'i' : 'd')), size, pitch);
        y += size + 10;
      }
      y += 14;
    }
    return y - 14;
  };
  return {
    ...both(id, draw, title, desc), caption,
    table: srOnly(table(title, ['Group', 'How it ended', 'Ideas', 'With a case page'],
      groups.flatMap((g) => g.rows.map((r): Cell[] => [{ th: g.label }, r.short, String(r.n), String(r.lit)])))),
  };
}
