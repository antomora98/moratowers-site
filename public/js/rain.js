import { CAUSE_LABEL, LEDGER } from "./data.js";
const html = document.documentElement;
const still = () => html.dataset.motion === "off" || matchMedia("(prefers-reduced-motion: reduce)").matches;
const css = getComputedStyle(html);
const INK = css.getPropertyValue("--dim").trim() || "#8d8a78";
const STRENGTH = 0.12;
const SPEED = [1.6, 4.5], TRAIL = [8, 18];
const TAPE = LEDGER.map(([n, , c]) => `${n} ${CAUSE_LABEL[c]}`).join("   ").replace(/\s/g, " ");
const canvas = document.createElement("canvas");
canvas.className = "rain-in";
canvas.setAttribute("aria-hidden", "true");
document.body.prepend(canvas);
const ctx = canvas.getContext("2d");
let W = 0, H = 0, dpr = 1, cw = 8, ch = 16, cols = 0, rows = 0, streams = [];
let carried = false;
function layout(keep) {
  dpr = Math.min(2, devicePixelRatio || 1);
  W = innerWidth;
  H = innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const mono = css.getPropertyValue("--mono").trim() || "monospace";
  ctx.font = `12px ${mono}`;
  ctx.textBaseline = "top";
  cw = Math.ceil(ctx.measureText("M").width) + 2;
  ch = 16;
  cols = Math.ceil(W / cw);
  rows = Math.ceil(H / ch);
  const n = Math.max(12, Math.round(cols * 0.32));
  carried = !!keep && carryOn();
  if (!carried) streams = Array.from({ length: n }, () => spawn({}, true));
}
const KEY = "rain-in";
function carryOn() {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) || "null"), gap = (Date.now() - (s && s.t)) / 1e3;
    if (!s || s.w !== W || s.h !== H || !(gap >= 0 && gap < 5)) return false;
    streams = s.streams;
    step(gap);
    return true;
  } catch (e) {
    return false;
  }
}
function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ w: W, h: H, t: Date.now(), streams }));
  } catch (e) {
  }
}
addEventListener("pageswap", save);
addEventListener("pagehide", save);
function spawn(s, first) {
  s.c = Math.floor(Math.random() * cols);
  s.v = SPEED[0] + Math.random() * (SPEED[1] - SPEED[0]);
  s.L = TRAIL[0] + Math.random() * (TRAIL[1] - TRAIL[0]);
  s.y = first ? Math.random() * (rows + s.L) : -Math.random() * 10;
  s.off = Math.floor(Math.random() * TAPE.length);
  return s;
}
function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = INK;
  for (const s of streams) {
    const x = s.c * cw;
    for (let k = 0; k < s.L; k++) {
      const r = Math.floor(s.y) - k;
      if (r < 0 || r >= rows) continue;
      const y = r * ch;
      const g = TAPE[(s.off + r) % TAPE.length];
      if (g === " ") continue;
      ctx.globalAlpha = STRENGTH * (1 - k / s.L) * (k === 0 ? 1.4 : 1);
      ctx.fillText(g, x + 1, y);
    }
  }
  ctx.globalAlpha = 1;
}
function step(dt) {
  for (const s of streams) {
    s.y += s.v * dt;
    if (s.y - s.L > rows) spawn(s, false);
  }
}
let last = 0, raf = 0;
function frame(t) {
  raf = 0;
  const dt = last ? Math.min(0.1, (t - last) / 1e3) : 0;
  last = t;
  step(dt);
  draw();
  if (!still() && !document.hidden) raf = requestAnimationFrame(frame);
  else last = 0;
}
function start() {
  if (!raf && !still() && !document.hidden) raf = requestAnimationFrame(frame);
}
layout(true);
if (still()) {
  if (!carried) for (let i = 0; i < 120; i++) step(1 / 30);
  draw();
} else {
  draw();
  start();
}
addEventListener("resize", () => {
  layout();
  if (still()) draw();
});
document.addEventListener("visibilitychange", start);
new MutationObserver(() => {
  if (still()) draw();
  else start();
}).observe(html, { attributes: true, attributeFilter: ["data-motion"] });
