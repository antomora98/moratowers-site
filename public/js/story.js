const idx = document.querySelector(".months"), items = [...document.querySelectorAll(".tl > li[id]")];
const links = new Map([...idx.querySelectorAll("a")].map((a) => [a.hash.slice(1), a]));
const seen = /* @__PURE__ */ new Set();
let io, cur, t;
function show(id) {
  if (id === cur) return;
  cur = id;
  for (const [k, a] of links) k === id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
}
let held = 0;
function pick() {
  if (Date.now() < held) return;
  const top = items.find((li) => seen.has(li.id));
  if (top) show(top.id);
  else if (items[0].getBoundingClientRect().top > innerHeight / 2) show(null);
}
function watch() {
  if (io) io.disconnect();
  seen.clear();
  const edge = Math.round(parseFloat(getComputedStyle(idx).top) + idx.offsetHeight);
  room(edge);
  io = new IntersectionObserver((es) => {
    for (const e of es) e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id);
    pick();
  }, { rootMargin: `-${edge}px 0px -50% 0px` });
  items.forEach((li) => io.observe(li));
}
const page = document.querySelector(".storypage"), base = parseFloat(getComputedStyle(page).paddingBottom);
function room(edge) {
  page.style.paddingBottom = "";
  const need = items.at(-1).getBoundingClientRect().top + scrollY + innerHeight - edge - document.documentElement.scrollHeight;
  if (need > 0) page.style.paddingBottom = `${base + need}px`;
}
watch();
if (document.fonts) document.fonts.ready.then(watch);
for (const [k, a] of links) a.addEventListener("click", () => {
  held = Date.now() + 800;
  show(k);
});
addEventListener("scroll", pick, { passive: true });
addEventListener("resize", () => {
  clearTimeout(t);
  t = setTimeout(watch, 150);
});
