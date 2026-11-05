const html = document.documentElement;
const motionOn = () => html.dataset.motion !== "off";
const token = (name) => getComputedStyle(html).getPropertyValue(name).trim();
const ms = (name, dflt) => {
  const v = token(name);
  const n = parseFloat(v);
  return Number.isFinite(n) ? /ms$/.test(v) ? n : n * 1e3 : dflt;
};
const ease = () => token("--ease-soft") || "cubic-bezier(.16, 1, .3, 1)";
const main = document.getElementById("main");
const GATE = main.dataset.gate;
const bar = document.querySelector(".bar");
const F = { mode: bar.querySelector(".mode"), path: bar.querySelector(".path"), pl: bar.querySelector(".pl"), ps: bar.querySelector(".ps") };
const BAR0 = { path: F.path.textContent, pl: F.pl.textContent, ps: F.ps.textContent };
function swap(el, text) {
  if (el.textContent === text) return;
  el.textContent = text;
  if (motionOn()) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms("--t-fade", 280), easing: ease() });
}
const ack = () => {
  if (motionOn()) F.mode.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: ms("--t-ack", 320), easing: ease() });
};
const sw = bar.querySelector(".motion");
function paint() {
  const on = motionOn();
  sw.setAttribute("aria-pressed", String(on));
  sw.textContent = on ? "motion: on" : "motion: off";
}
sw.addEventListener("click", () => {
  const on = !motionOn();
  html.dataset.motion = on ? "on" : "off";
  try {
    localStorage.setItem("motion", on ? "on" : "off");
  } catch (e) {
  }
  if (!on) document.getAnimations().forEach((a) => {
    try {
      a.finish();
    } catch (e) {
      a.cancel();
    }
  });
  paint();
});
paint();
const stack = document.getElementById("cases");
const track = stack.querySelector(".track");
const cards = [...stack.querySelectorAll(".card")];
const here = cards.findIndex((c) => c.hasAttribute("aria-current"));
let cur = here;
const tall = () => matchMedia("(min-width: 1100px)").matches;
const PITCH = 96, CARD_H = 88, GAP = 12;
if (/(?:\?|&)still(?:&|=|$)/.test(location.search)) cards.forEach((c) => {
  c.href += "?still";
});
function place() {
  const W = stack.clientWidth, H = stack.clientHeight;
  const top = Math.max(0, (H - (4 * PITCH + CARD_H)) / 2);
  cards.forEach((c, i) => {
    const d = i - cur, a = Math.min(3, Math.abs(d));
    if (tall()) {
      c.style.transform = `translate3d(0, ${(top + i * PITCH).toFixed(2)}px, 0)`;
      c.style.opacity = i === cur ? "1" : "0.8";
    } else {
      const x = (W - c.offsetWidth) / 2 + d * (c.offsetWidth + GAP), s = 1 - a * 0.04, inset = c.offsetWidth * (1 - s) / 2;
      const shown = (Math.min(x + c.offsetWidth - inset, W) - Math.max(x + inset, 0)) / (c.offsetWidth - 2 * inset);
      c.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) scale(${s.toFixed(3)})`;
      c.style.opacity = (shown >= 0.5 ? Math.max(0.84, 1 - a * 0.16) : 1 - a * 0.16).toFixed(2);
    }
    c.classList.toggle("is-on", i === cur);
    c.tabIndex = i === cur ? 0 : -1;
  });
}
function settle() {
  stack.classList.remove("ready");
  place();
  void stack.offsetWidth;
  stack.classList.add("ready");
}
let leaned = 0;
function lean(dir) {
  const now = performance.now();
  if (!motionOn() || now - leaned < ms("--t-end", 300)) return;
  leaned = now;
  const px = (parseFloat(token("--lean")) || 8) * -dir;
  const to = tall() ? `translate3d(0, ${px}px, 0)` : `translate3d(${px}px, 0, 0)`;
  track.animate([{ transform: "none" }, { transform: to, offset: 0.35, easing: "ease-out" }, { transform: "none", easing: "ease-in-out" }], { duration: ms("--t-end", 300) });
}
let navT = 0;
function move(to, how) {
  ack();
  if (to < 0 || to > cards.length - 1) {
    lean(to < 0 ? -1 : 1);
    return;
  }
  if (to === cur) return;
  cur = to;
  place();
  const c = cards[cur];
  swap(F.path, `~/moratowers/src/content/cases/${c.dataset.slug}.md`);
  swap(F.pl, `case ${c.dataset.n} of 5`);
  swap(F.ps, `${c.dataset.n} of 5`);
  if (how === "key" && stack.contains(document.activeElement)) c.focus({ preventScroll: true });
  clearTimeout(navT);
  if (cur === here) return;
  const rest = motionOn() ? ms("--t-soft", 360) + (how === "wheel" || how === "swipe" ? 200 : 40) : how === "wheel" ? 200 : 0;
  navT = setTimeout(() => open(c, how), rest);
}
function open(card, how) {
  try {
    if (how === "key" && stack.contains(document.activeElement)) sessionStorage.setItem("flow-stack-focus", "1");
  } catch (e) {
  }
  location.href = card.href;
}
let acc = 0, lastWheel = 0;
stack.addEventListener("wheel", (e) => {
  let d = tall() ? e.deltaY : e.deltaX;
  if (!tall() && Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
  e.preventDefault();
  if (e.deltaMode === 1) d *= 16;
  else if (e.deltaMode === 2) d *= 400;
  const now = performance.now();
  if (now - lastWheel > 220 || Math.sign(d) !== Math.sign(acc)) acc = 0;
  lastWheel = now;
  acc += d;
  if (Math.abs(acc) >= 80) {
    const s = Math.sign(acc);
    acc = 0;
    move(cur + s, "wheel");
  }
}, { passive: false });
let press = null, swallow = false;
stack.addEventListener("pointerdown", (e) => {
  if (e.button === 0) press = { x: e.clientX, y: e.clientY, moved: false };
});
stack.addEventListener("pointermove", (e) => {
  if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) press.moved = true;
});
stack.addEventListener("pointerup", (e) => {
  const p = press;
  press = null;
  if (!p || !p.moved) return;
  const dx = p.x - e.clientX, dy = p.y - e.clientY;
  const d = tall() ? dy : dx, other = tall() ? dx : dy;
  if (Math.abs(d) < 24 || Math.abs(d) < Math.abs(other)) return;
  swallow = true;
  move(cur + Math.sign(d), "swipe");
});
stack.addEventListener("pointercancel", () => {
  press = null;
});
stack.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
  e.preventDefault();
  if (swallow) {
    swallow = false;
    return;
  }
  const i = cards.indexOf(card);
  const how = e.detail === 0 ? "key" : "click";
  if (i === cur && i !== here) {
    clearTimeout(navT);
    open(card, how);
    return;
  }
  if (i === here && cur === here) {
    ack();
    return;
  }
  move(i, how);
});
document.addEventListener("keydown", (e) => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  if (!stack.contains(e.target)) return;
  const k = e.key;
  let to = null;
  if (k === "j" || k === "ArrowDown" || k === "ArrowRight") to = cur + 1;
  else if (k === "k" || k === "ArrowUp" || k === "ArrowLeft") to = cur - 1;
  else if (k === "Home") to = 0;
  else if (k === "End") to = cards.length - 1;
  if (to === null) return;
  e.preventDefault();
  move(to, "key");
});
F.mode.textContent = GATE;
addEventListener("resize", settle);
addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  clearTimeout(navT);
  cur = here;
  settle();
  F.path.textContent = BAR0.path;
  F.pl.textContent = BAR0.pl;
  F.ps.textContent = BAR0.ps;
});
settle();
try {
  if (sessionStorage.getItem("flow-stack-focus")) {
    sessionStorage.removeItem("flow-stack-focus");
    cards[here].focus({ preventScroll: true });
  }
} catch (e) {
}
