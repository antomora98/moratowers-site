import { CASES, GATE_WORD, CAUSE_LABEL, LEDGER } from "./data.js";
const html = document.documentElement;
const motionOn = () => html.dataset.motion !== "off";
const css = getComputedStyle(html);
const tok = (name, dflt) => css.getPropertyValue(name).trim() || dflt;
const COLORS = [tok("--dim", "#8d8a78"), tok("--ink", "#e6e1cf"), tok("--paper", "#fffff8"), tok("--mode", "#8b2e1f")];
const DIM = 0, INK = 1, PAPER = 2, RED = 3;
const FACE = '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace';
const _ = "";
const GLYPHS = {
  m: [_, _, "###########.", "##...##...##", "##...##...##", "##...##...##", "##...##...##"],
  o: [_, _, ".#######.", "##.....##", "##.....##", "##.....##", ".#######."],
  r: [_, _, "#######.", "##....##", "##......", "##......", "##......"],
  a: [_, _, ".#######.", ".......##", ".########", "##.....##", ".########"],
  t: [".##...", ".##...", "######", ".##...", ".##...", ".##...", "..####"],
  w: [_, _, "##........##", "##...##...##", "##...##...##", "##...##...##", ".##########."],
  e: [_, _, ".#######.", "##.....##", "#########", "##.......", ".#######."],
  s: [_, _, ".########", "##.......", ".#######.", ".......##", "########."],
  ".": [_, _, _, _, _, _, "##"],
  d: [".......##", ".......##", ".########", "##.....##", "##.....##", "##.....##", ".########"],
  v: [_, _, "##......##", "##......##", ".##....##.", "..##..##..", "...####..."]
};
const GROWS = 7, GAP = 2;
const glyphW = (k) => Math.max(...GLYPHS[k].map((s) => s.length));
function word(text) {
  const cells = [];
  let x = 0;
  [...text].forEach((k, i) => {
    if (i) x += GAP;
    GLYPHS[k].forEach((row, r) => [...row].forEach((ch2, c) => {
      if (ch2 === "#") cells.push([r, x + c]);
    }));
    x += glyphW(k);
  });
  return { w: x, cells };
}
const INDENT = 14;
const plansFrom = (wordOf, rowsOf, indent) => [["moratowers.dev"], ["mora", "towers", ".dev"]].map((lines) => {
  const words = lines.map((t) => wordOf(t)), H = rowsOf;
  const cells = [];
  words.forEach((wd, i) => wd.cells.forEach(([r, c]) => cells.push([r + i * (H + 1), c + i * indent])));
  return { w: Math.max(...words.map((x, i) => x.w + i * indent)), h: lines.length * (H + 1) - 1, cells };
});
let PLANS = plansFrom(word, GROWS, INDENT);
const SERIF_ALL = html.dataset.look === "geistall";
const GLASS = html.dataset.mark === "glass";
const TFACE = '"Geist Serif", Georgia, serif';
const SERIF_ROWS = 15;
function serifWord(text, rows2 = SERIF_ROWS) {
  const sw = 6, sh = 12;
  const c = document.createElement("canvas").getContext("2d");
  c.font = `100px ${TFACE}`;
  const top = c.measureText("dt").actualBoundingBoxAscent / 100;
  const size2 = rows2 * sh / top;
  c.font = `${size2}px ${TFACE}`;
  const m = c.measureText(text);
  const W = Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + 2, A = rows2 * sh;
  c.canvas.width = W;
  c.canvas.height = A + 2;
  c.font = `${size2}px ${TFACE}`;
  c.fillStyle = "#fff";
  c.textBaseline = "alphabetic";
  c.fillText(text, m.actualBoundingBoxLeft + 1, A);
  const d = c.getImageData(0, 0, c.canvas.width, c.canvas.height).data, cells = [];
  const cols2 = Math.ceil(c.canvas.width / sw), rws = Math.ceil(c.canvas.height / sh);
  for (let r = 0; r < rws; r++) for (let k = 0; k < cols2; k++) {
    let a = 0, n = 0;
    for (let y = r * sh; y < Math.min((r + 1) * sh, c.canvas.height); y++) for (let x = k * sw; x < Math.min((k + 1) * sw, c.canvas.width); x++) {
      a += d[(y * c.canvas.width + x) * 4 + 3];
      n++;
    }
    if (a / (n * 255) > 0.3) cells.push([r, k]);
  }
  return { w: cols2, cells };
}
const STAIR_ROWS = 10;
const serifPlans = () => {
  const stair = (t) => serifWord(t, STAIR_ROWS);
  return [plansFrom(serifWord, SERIF_ROWS, 0)[0], plansFrom(stair, STAIR_ROWS, Math.round(0.32 * stair("mora").w))[1]];
};
function mulberry32(seed2) {
  let a = seed2 | 0;
  return () => {
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const tally = (i) => LEDGER.reduce((m, row) => m.set(row[i], (m.get(row[i]) || 0) + 1), /* @__PURE__ */ new Map());
const phrases = [
  ...LEDGER.map(([n, , cause]) => [[String(n).padStart(2, "0") + " " + CAUSE_LABEL[cause], 0]]),
  [[`${LEDGER.length} closed`, 0]],
  [[`${Object.keys(CASES).length} public`, 0]],
  ...[...tally(2)].map(([cause, k]) => [[`${k} ${CAUSE_LABEL[cause]}`, 0]])
];
const shuffle = mulberry32(20261017);
for (let i = phrases.length - 1; i > 0; i--) {
  const j = Math.floor(shuffle() * (i + 1));
  [phrases[i], phrases[j]] = [phrases[j], phrases[i]];
}
let TAPE = "", VERDICT = [];
const STARTS = [];
for (const parts of phrases) {
  STARTS.push(TAPE.length);
  for (const [text, v] of parts) {
    TAPE += text;
    for (let i = 0; i < text.length; i++) VERDICT.push(v);
  }
  TAPE += "   ";
  VERDICT.push(0, 0, 0);
}
const LEN = TAPE.length;
VERDICT = Uint8Array.from(VERDICT);
const CHARS = [...new Set(TAPE.replace(/ /g, "") + TAPE.toUpperCase().replace(/[^A-Z0-9]/g, ""))];
const GI = new Map(CHARS.map((ch2, i) => [ch2, i]));
const TAPE_G = Int16Array.from(TAPE, (ch2) => ch2 === " " ? -1 : GI.get(ch2));
const TAPE_T = Int16Array.from(TAPE, (ch2) => /[a-z0-9]/i.test(ch2) ? GI.get(ch2.toUpperCase()) : -1);
const mod = (x) => (x % LEN + LEN) % LEN;
const canvas = document.querySelector("canvas.rain");
const ctx = canvas.getContext("2d");
const hero = document.getElementById("hero");
const titleCan = document.createElement("canvas");
const tctx = titleCan.getContext("2d");
const atlas = document.createElement("canvas");
const actx = atlas.getContext("2d");
const SPEED = [3.2, 9.5], TRAIL = [9, 22], TRAVEL = [14, 52], WAIT = [0.5, 4];
const AREA = 40;
const TOP = 0.28;
const TRAIL_A = 0.6, HEAD_A = 0.42, RED_ROWS = 1.6, FLASH_S = 0.42;
const TILE_A = 0.24;
const QUIET = [0.14, 0.42];
const HUSH = { block: 0.45, line: 0.04 }, FEATHER = { block: 44, line: 12 };
const MODE = new URLSearchParams(location.search).get("rain") || document.documentElement.dataset.rain || "full";
const NORED = MODE !== "full", ONCE = MODE === "once", NONE = MODE === "none", ONCE_S = 2.5;
let elapsed = 0, heroRows = 0;
const STEP = 1 / 30;
let dpr = 1, VW = 0, VH = 0, cw = 7.8, ch = 16, cols = 0, rows = 0, cellW = 0, cellH = 0, ty0 = 0, tr0 = 0;
let mult = new Float32Array(0), owner = new Int32Array(0), title = [], streams = [], flashing = /* @__PURE__ */ new Set(), rnd = mulberry32(1);
function buildAtlas(font) {
  cellW = Math.ceil(cw * dpr) + 2;
  cellH = Math.ceil(ch * dpr);
  atlas.width = CHARS.length * cellW;
  atlas.height = COLORS.length * cellH;
  actx.clearRect(0, 0, atlas.width, atlas.height);
  actx.font = `${font * dpr}px ${SERIF_ALL ? TFACE : FACE}`;
  actx.textBaseline = "middle";
  actx.textAlign = SERIF_ALL ? "center" : "left";
  COLORS.forEach((color, k) => {
    actx.fillStyle = color;
    CHARS.forEach((c, g) => actx.fillText(c, SERIF_ALL ? g * cellW + cellW / 2 : g * cellW + 1, k * cellH + cellH / 2 + 0.5 * dpr));
  });
}
const px = (c) => Math.round(c * cw * dpr) - 1;
const py = (r) => Math.round(r * ch * dpr);
function glyph(c2d, g, color, c, r, a, oy) {
  c2d.globalAlpha = a;
  c2d.drawImage(atlas, g * cellW, color * cellH, cellW, cellH, px(c), py(r) - oy, cellW, cellH);
}
function hush(quiet, x0, y0, xr, y1, inner, f) {
  const ca = Math.max(0, Math.floor((x0 - f) / cw)), cb = Math.min(cols - 1, Math.floor((xr + f) / cw));
  const ra = Math.max(0, Math.floor((y0 - f) / ch)), rb = Math.min(rows - 1, Math.floor((y1 + f) / ch));
  for (let r = ra; r <= rb; r++) {
    const cy = (r + 0.5) * ch, dy = Math.max(y0 - cy, 0, cy - y1);
    for (let c = ca; c <= cb; c++) {
      const cx = (c + 0.5) * cw, dx = Math.max(x0 - cx, 0, cx - xr);
      const d = Math.hypot(dx, dy) / f;
      if (d >= 1) continue;
      const k = inner + (1 - inner) * d * d * (3 - 2 * d);
      const i = r * cols + c;
      if (k < quiet[i]) quiet[i] = k;
    }
  }
}
function hushText(quiet) {
  const sy = window.scrollY, range = document.createRange();
  const lines = [];
  const add = (r) => {
    if (r.width && r.height) lines.push([r.left, r.top + sy, r.right, r.bottom + sy]);
  };
  document.querySelectorAll(".dek, .ways-h, .ways li a, .key, .compare").forEach((el) => {
    range.selectNodeContents(el);
    for (const r of range.getClientRects()) add(r);
  });
  document.querySelectorAll(".ways .tag, .cta").forEach((el) => add(el.getBoundingClientRect()));
  if (!lines.length) return;
  const b = lines.reduce((m, l) => [Math.min(m[0], l[0]), Math.min(m[1], l[1]), Math.max(m[2], l[2]), Math.max(m[3], l[3])], [Infinity, Infinity, -Infinity, -Infinity]);
  hush(quiet, ...b, HUSH.block, FEATHER.block);
  for (const l of lines) hush(quiet, ...l, HUSH.line, FEATHER.line);
}
function layout() {
  dpr = Math.max(1, Math.min(2, devicePixelRatio || 1));
  VW = canvas.clientWidth;
  VH = canvas.clientHeight;
  canvas.width = Math.round(VW * dpr);
  canvas.height = Math.round(VH * dpr);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `100px ${FACE}`;
  const adv = SERIF_ALL ? 0.6 : ctx.measureText("M").width / 100 || 0.6;
  const m = parseFloat(getComputedStyle(html).getPropertyValue("--m")) || 20;
  let plan = PLANS[PLANS.length - 1], font = 0;
  for (const p of PLANS) {
    font = Math.min(18, (VW - 2 * m) / (p.w * adv));
    plan = p;
    if (font >= (SERIF_ALL ? 5.5 : 10.5)) break;
  }
  font = Math.max(6, font);
  cw = font * adv;
  ch = font * 16 / 13;
  if (!GLASS) hero.style.height = `${Math.ceil((plan.h + 4) * ch)}px`;
  const hr = hero.getBoundingClientRect(), heroTop = hr.top + window.scrollY, heroH = hr.height;
  cols = Math.ceil(VW / cw);
  rows = Math.ceil(Math.max(document.documentElement.scrollHeight, VH) / ch);
  buildAtlas(font);
  const c0 = Math.round(m / cw), r0 = Math.round((heroTop + (heroH - plan.h * ch) / 2) / ch);
  owner = new Int32Array(cols * rows).fill(-1);
  title = GLASS ? [] : plan.cells.map(([r, c]) => ({ r: r + r0, c: c + c0, g: -1, flash: 0 })).filter((t) => t.c < cols && t.r < rows);
  title.forEach((t, i) => {
    owner[t.r * cols + t.c] = i;
  });
  const quiet = new Float32Array(cols * rows).fill(1);
  for (const t of title) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const r = t.r + dy, c = t.c + dx;
        if (r < 0 || r >= rows || c < 0 || c >= cols) continue;
        const d = Math.max(Math.abs(dx) / 2, Math.abs(dy));
        quiet[r * cols + c] = Math.min(quiet[r * cols + c], d <= 1 ? QUIET[0] : QUIET[1]);
      }
    }
  }
  hushText(quiet);
  mult = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    const v = Math.min(1, (r + 0.5) / 5) * Math.min(1, (rows - r - 0.5) / 5), e = v * v * (3 - 2 * v);
    for (let c = 0; c < cols; c++) mult[r * cols + c] = e * quiet[r * cols + c];
  }
  for (const t of title) mult[t.r * cols + t.c] = 0;
  heroRows = Math.ceil((heroTop + heroH) / ch);
  if (MODE !== "full") {
    const hb = (heroTop + heroH) / ch;
    for (let r = 0; r < rows; r++) {
      const k = Math.max(0, Math.min(1, (hb - r) / 2));
      if (k < 1) for (let c = 0; c < cols; c++) mult[r * cols + c] *= k;
    }
  }
  tr0 = Math.min(...title.map((t) => t.r));
  const tr1 = Math.max(...title.map((t) => t.r));
  ty0 = py(tr0);
  titleCan.width = canvas.width;
  titleCan.height = Math.max(1, py(tr1 + 1) - ty0);
  seed();
}
function busy(s) {
  for (const o of streams) if (o !== s && o.wait <= 0 && o.c === s.c && o.start < s.end + 3 && s.start < o.end + 3) return true;
  return false;
}
function spawn(s, first) {
  for (let k = 0; k < 4; k++) {
    s.c = Math.floor(rnd() * cols);
    s.start = rnd() < TOP && tr0 > 2 ? Math.floor(rnd() * (tr0 - 1)) : Math.floor(rnd() * rows);
    s.end = Math.min(rows, s.start + Math.round(TRAVEL[0] + (TRAVEL[1] - TRAVEL[0]) * rnd()));
    if (!busy(s)) break;
  }
  s.v = SPEED[0] + (SPEED[1] - SPEED[0]) * rnd() ** 1.4;
  s.L = TRAIL[0] + (TRAIL[1] - TRAIL[0]) * rnd();
  s.b = 0.55 + 0.45 * ((s.v - SPEED[0]) / (SPEED[1] - SPEED[0]));
  s.off = mod(STARTS[Math.floor(rnd() * STARTS.length)] - s.start);
  s.y = first ? s.start + rnd() * (s.end - s.start + s.L) : s.start;
  s.ri = Math.floor(s.y);
  s.wait = 0;
}
function seed() {
  rnd = mulberry32(20261017 + cols * 31 + rows);
  streams = [];
  const n = Math.max(24, Math.round(cols * rows / AREA));
  for (let i = 0; i < n; i++) {
    const s = { wait: 1 };
    streams.push(s);
    spawn(s, true);
    if (rnd() < 0.25) s.wait = WAIT[0] + rnd() * (WAIT[1] - WAIT[0]);
  }
  if (NONE || ONCE && elapsed > ONCE_S) streams = [];
  else if (ONCE) {
    streams = streams.filter((s) => s.start < heroRows);
    for (const s of streams) {
      s.end = Math.min(s.end, heroRows + 2);
      s.y = s.start - rnd() * 8;
      s.ri = Math.floor(s.y);
      s.wait = 0;
      s.v = Math.max(s.v, 14);
      s.L = Math.min(s.L, 8);
    }
  }
  const colOff = /* @__PURE__ */ new Map();
  title.forEach((t) => {
    if (!colOff.has(t.c)) colOff.set(t.c, STARTS[Math.floor(rnd() * STARTS.length)]);
    let p = mod(colOff.get(t.c) + t.r);
    while (TAPE_T[p] < 0) p = mod(p + 1);
    t.g = TAPE_T[p];
    t.flash = 0;
  });
  flashing.clear();
  paintTitle();
}
function paintCell(t) {
  const x = Math.round(t.c * cw * dpr), y = py(t.r) - ty0, w = Math.round((t.c + 1) * cw * dpr) - x, h = py(t.r + 1) - py(t.r);
  tctx.clearRect(x, y, w, h);
  tctx.globalAlpha = TILE_A;
  tctx.fillStyle = COLORS[INK];
  tctx.fillRect(x, y, w, h);
  glyph(tctx, t.g, INK, t.c, t.r, 1, ty0);
}
function paintTitle() {
  tctx.clearRect(0, 0, titleCan.width, titleCan.height);
  for (const t of title) paintCell(t);
}
function rewrite(t, g) {
  t.flash = 1;
  flashing.add(t);
  if (t.g === g) return;
  t.g = g;
  paintCell(t);
}
function update(dt) {
  elapsed += dt;
  for (const s of streams) {
    if (s.wait > 0) {
      s.wait -= dt;
      if (s.wait <= 0) spawn(s, false);
      continue;
    }
    s.y += s.v * dt;
    const ri = Math.floor(s.y);
    for (let r = Math.max(s.start, s.ri + 1); r <= ri && r < s.end; r++) {
      const k = owner[r * cols + s.c];
      if (k < 0) continue;
      const g = TAPE_T[(s.off + r) % LEN];
      if (g >= 0) rewrite(title[k], g);
      else {
        title[k].flash = 1;
        flashing.add(title[k]);
      }
    }
    s.ri = ri;
    if (s.y - s.L > s.end) s.wait = ONCE ? Infinity : WAIT[0] + rnd() * (WAIT[1] - WAIT[0]);
  }
  const fall = Math.exp(-dt / FLASH_S);
  for (const t of flashing) {
    t.flash *= fall;
    if (t.flash < 0.02) {
      t.flash = 0;
      flashing.delete(t);
    }
  }
}
function draw() {
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const sy = window.scrollY, oy = Math.round(sy * dpr);
  const va = Math.floor(sy / ch), vb = Math.ceil((sy + VH) / ch);
  for (const s of streams) {
    if (s.wait > 0) continue;
    const top = Math.max(Math.ceil(s.y - s.L), s.start, va), bot = Math.min(Math.floor(s.y), s.end - 1, vb);
    for (let r = top; r <= bot; r++) {
      const m = mult[r * cols + s.c];
      if (m < 0.01) continue;
      const age = s.y - r;
      const f = 1 - age / s.L;
      let a = f * f * s.b * m;
      if (age < 0.3) a *= age / 0.3;
      const land = (s.end - r) / 4;
      if (land < 1) a *= land;
      if (a < 0.015) continue;
      const p = (s.off + r) % LEN, g = TAPE_G[p];
      if (g < 0) continue;
      if (VERDICT[p] && age < RED_ROWS && !NORED) {
        const k = 1 - age / RED_ROWS;
        glyph(ctx, g, RED, s.c, r, a * k, oy);
        glyph(ctx, g, DIM, s.c, r, a * TRAIL_A * (1 - k), oy);
      } else if (age < 1) {
        glyph(ctx, g, INK, s.c, r, a * HEAD_A * (1 - age), oy);
        glyph(ctx, g, DIM, s.c, r, a * TRAIL_A * age, oy);
      } else {
        glyph(ctx, g, DIM, s.c, r, a * TRAIL_A, oy);
      }
    }
  }
  if (title.length && ty0 - oy < canvas.height && ty0 - oy + titleCan.height > 0) {
    ctx.globalAlpha = 1;
    ctx.drawImage(titleCan, 0, ty0 - oy);
    for (const t of flashing) glyph(ctx, t.g, PAPER, t.c, t.r, t.flash, oy);
  }
  ctx.globalAlpha = 1;
}
function still() {
  seed();
  if (MODE !== "full") streams = [];
  for (let i = 0; i < 300; i++) update(1 / 60);
  title.forEach((t) => {
    t.flash = 0;
  });
  flashing.clear();
  draw();
}
let raf = 0, last = 0, acc = 0, dirty = false, ready = false;
const settled = () => NONE || ONCE && !flashing.size && streams.every((s) => s.wait === Infinity);
const running = () => ready && !document.hidden && motionOn() && !settled();
function frame(now) {
  raf = 0;
  const dt = last ? Math.min(0.1, (now - last) / 1e3) : 0;
  last = now;
  if (running()) {
    acc += dt;
    if (acc >= STEP - 2e-3) {
      update(Math.min(acc, 0.05));
      acc = 0;
      dirty = true;
    }
  }
  if (dirty) {
    draw();
    dirty = false;
  }
  if (running()) raf = requestAnimationFrame(frame);
  else last = 0;
}
const wake = () => {
  if (!raf && ready) raf = requestAnimationFrame(frame);
};
function halt() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  last = 0;
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) halt();
  else wake();
});
addEventListener("scroll", () => {
  dirty = true;
  wake();
}, { passive: true });
function relayout() {
  halt();
  layout();
  if (motionOn()) {
    dirty = true;
    wake();
  } else still();
}
let startedWithFont = false;
function start() {
  startedWithFont = fontIn;
  layout();
  ready = true;
  canvas.classList.add("drawn");
  if (motionOn()) {
    dirty = true;
    wake();
  } else still();
}
let size = "";
new ResizeObserver(() => {
  const now = `${canvas.clientWidth}x${canvas.clientHeight}x${document.body.clientHeight}x${devicePixelRatio}`;
  if (!ready || now === size) {
    size = now;
    return;
  }
  size = now;
  relayout();
}).observe(document.body);
addEventListener("resize", () => {
  if (ready && `${canvas.clientWidth}x${canvas.clientHeight}` !== `${VW}x${VH}`) relayout();
});
addEventListener("pageshow", (e) => {
  if (e.persisted && ready) {
    if (motionOn()) wake();
    else still();
  }
});
const bar = document.querySelector(".bar");
if (bar) {
  let swap = function(el, text) {
    if (!el || el.textContent === text) return;
    el.textContent = text;
    if (motionOn()) el.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: T_FADE, easing: `cubic-bezier(${curve})` });
  }, printBar = function(slug) {
    const c = slug && CASES[slug];
    const st = c ? { mode: GATE_WORD[c.gate], path: `~/moratowers/src/content/cases/${slug}.md`, pos: `case ${c.n} of 5   ${CAUSE_LABEL[c.cause]}`, short: `${c.n}/5` } : idle;
    swap(F.mode, st.mode);
    swap(F.path, st.path);
    swap(F.pl, st.pos);
    swap(F.ps, st.short);
    F.causes.classList.toggle("lit", !!c);
    F.causes.querySelectorAll("li").forEach((li) => li.classList.toggle("on", !!c && li.dataset.cause === c.cause));
  };
  const F = { mode: bar.querySelector(".mode"), path: bar.querySelector(".path"), pl: bar.querySelector(".pl"), ps: bar.querySelector(".ps"), causes: bar.querySelector(".causes") };
  const idle = { mode: F.mode.textContent, path: F.path.textContent, pos: F.pl.textContent, short: F.ps.textContent };
  const curve = (tok("--ease-soft", "cubic-bezier(.16, 1, .3, 1)").match(/cubic-bezier\(([^)]+)\)/) || [0, ".16, 1, .3, 1"])[1];
  const T_FADE = parseFloat(tok("--t-fade", "280ms")) || 280;
  document.querySelectorAll(".ways li a").forEach((a) => {
    const on = () => printBar(a.dataset.slug), off = () => printBar(null);
    a.addEventListener("pointerenter", on);
    a.addEventListener("pointerleave", off);
    a.addEventListener("focus", on);
    a.addEventListener("blur", off);
  });
  const sw = bar.querySelector(".motion");
  const paintSwitch = () => {
    const on = motionOn();
    sw.setAttribute("aria-pressed", String(on));
    sw.textContent = on ? "motion: on" : "motion: off";
  };
  sw.addEventListener("click", () => {
    const on = !motionOn();
    html.dataset.motion = on ? "on" : "off";
    try {
      localStorage.setItem("motion", on ? "on" : "off");
    } catch (e) {
    }
    if (!on) {
      document.getAnimations().forEach((a) => {
        try {
          a.finish();
        } catch (e) {
          a.cancel();
        }
      });
      html.classList.remove("opening");
      halt();
      if (ready) still();
    } else wake();
    paintSwitch();
  });
  paintSwitch();
}
addEventListener("pageswap", (e) => {
  const vt = e.viewTransition;
  if (!vt) return;
  ["ready", "finished", "updateCallbackDone"].forEach((k) => {
    if (vt[k]) vt[k].catch(() => {
    });
  });
  if (!motionOn()) vt.skipTransition();
});
let fontIn = false;
const fontsReady = (document.fonts ? Promise.all([document.fonts.load(`13px ${FACE}`), SERIF_ALL && document.fonts.load(`40px ${TFACE}`)]).catch(() => {
}) : Promise.resolve()).then(() => {
  if (SERIF_ALL) PLANS = serifPlans();
  fontIn = true;
});
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(start);
fontsReady.then(() => {
  if (ready && !startedWithFont) relayout();
});
