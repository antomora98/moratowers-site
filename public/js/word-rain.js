// The footer's digit rain: a few columns of digits fall inside the letters of the big word, and nowhere else. The word
// is text in the page; this draws on a canvas over it and keeps only what lies inside the same word, drawn again at
// the same size and place. If the browser cannot set letter spacing on a canvas, the two would not line up, so nothing
// is drawn and the word stands alone. With motion off the digits are drawn once and hold still.
const foot = document.querySelector(".wordfoot");
const word = foot && foot.querySelector("[data-word]");
const html = document.documentElement;
const calmQ = matchMedia("(prefers-reduced-motion: reduce)");
const calm = () => html.dataset.motion === "off" || calmQ.matches;
// SHARE: the share of columns that carry a run of digits, so it reads as a little rain, not a screen of numbers.
const CELL_W = 11, CELL_H = 16, SHARE = 0.36;
function start() {
  const cv = document.createElement("canvas");
  cv.className = "digits";
  cv.setAttribute("aria-hidden", "true");
  const ctx = cv.getContext("2d");
  if (!ctx || !("letterSpacing" in ctx)) return;
  foot.appendChild(cv);
  const mask = document.createElement("canvas"), mctx = mask.getContext("2d");
  const css = getComputedStyle(html);
  const mono = css.getPropertyValue("--mono").trim() || "monospace";
  const ink = css.getPropertyValue("--ink").trim() || "#e6e1cf";
  let W = 0, H = 0, dpr = 1, cols = [], seen = false, running = false, last = 0, raf = 0;
  const digit = () => String((Math.random() * 10) | 0);
  // One falling run per column: where its head is, how fast it falls, how long its tail is, and its digits.
  const spawn = (fresh) => {
    const len = 5 + ((Math.random() * 9) | 0);
    return { y: fresh ? Math.random() * (H / CELL_H + len) : -Math.random() * 12, v: 2.2 + Math.random() * 3.6, len, ch: Array.from({ length: 40 }, digit) };
  };
  function layout() {
    const r = foot.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    if (!W || !H) return;
    dpr = Math.min(2, devicePixelRatio || 1);
    for (const c of [cv, mask]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    // The word again, on the mask, where the page draws it: same font, size, spacing and baseline.
    const ws = getComputedStyle(word), b = word.getBoundingClientRect(), size = parseFloat(ws.fontSize);
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mctx.clearRect(0, 0, W, H);
    mctx.fillStyle = "#000";
    mctx.font = `${ws.fontWeight} ${size}px ${ws.fontFamily}`;
    mctx.letterSpacing = ws.letterSpacing;
    mctx.textBaseline = "alphabetic";
    const t = mctx.measureText(word.textContent), asc = t.fontBoundingBoxAscent, desc = t.fontBoundingBoxDescent;
    mctx.fillText(word.textContent, b.left - r.left, b.top - r.top + (b.height - (asc + desc)) / 2 + asc);
    const n = Math.ceil(W / CELL_W);
    cols = Array.from({ length: n }, () => (Math.random() < SHARE ? spawn(true) : null));
    draw();
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);
    ctx.font = `12px ${mono}`;
    ctx.textBaseline = "top";
    ctx.fillStyle = ink;
    cols.forEach((c, i) => {
      if (!c) return;
      const head = Math.floor(c.y);
      for (let k = 0; k < c.len; k++) {
        const row = head - k;
        if (row < 0 || row * CELL_H > H) continue;
        // The head is the brightest; the tail fades behind it.
        ctx.globalAlpha = (k === 0 ? 0.5 : 0.3) * (1 - k / c.len);
        ctx.fillText(c.ch[((row % 40) + 40) % 40], i * CELL_W, row * CELL_H);
      }
    });
    ctx.globalAlpha = 1;
    // Keep only what lies inside the letters.
    ctx.globalCompositeOperation = "destination-in";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(mask, 0, 0);
  }
  function frame(t) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.1, (t - last) / 1e3);
    last = t;
    const rows = H / CELL_H;
    cols.forEach((c, i) => {
      if (!c) { if (Math.random() < dt * 0.05) cols[i] = spawn(false); return; }
      c.y += c.v * dt;
      if (c.y - c.len > rows) cols[i] = Math.random() < 0.6 ? null : spawn(false);
    });
    draw();
    raf = requestAnimationFrame(frame);
  }
  // Fall only while the footer is in the window, the tab is showing and motion is on.
  function sync() {
    const want = seen && !document.hidden && !calm();
    if (want === running) return;
    running = want;
    // One loop at a time: a hidden tab keeps its queued frame, so do not queue a second on return.
    if (want) { last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); }
  }
  new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; sync(); }).observe(foot);
  document.addEventListener("visibilitychange", sync);
  calmQ.addEventListener("change", sync);
  new ResizeObserver(layout).observe(foot);
  layout();
}
// The mask needs the word's own font, so wait for it.
if (word) document.fonts.load(`400 40px "Geist Serif"`).then(start, start);
