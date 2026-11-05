const html = document.documentElement, hero = document.getElementById("hero");
const moving = () => html.dataset.motion !== "off" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
const MS = 560, EASE = "cubic-bezier(.4, 0, .2, 1)";
let going = false;
function fly() {
  if (going) return;
  going = true;
  const go = () => {
    location.href = "/about/";
  };
  const glass = hero.querySelector("canvas.glass");
  if (!moving() || !glass || !hero.classList.contains("glassed")) return go();
  html.classList.add("flying");
  document.querySelectorAll(".enter, .lede").forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0, offset: 0.3 }, { opacity: 0 }], { duration: MS, easing: EASE, fill: "forwards" }));
  const home = document.querySelector(".topnav .home");
  const t = home.getBoundingClientRect(), c = glass.getBoundingClientRect();
  const lw = c.width * (c.width < 640 ? 0.88 : 0.62), lh = lw * 0.125;
  const dx = t.left + t.width / 2 - (c.left + c.width / 2), dy = t.top + t.height / 2 - (c.top + c.height / 2);
  glass.animate(
    [
      { transform: "none", opacity: 1 },
      { opacity: 1, offset: 0.6 },
      { transform: `translate(${dx}px, ${dy}px) scale(${(t.width - 4) / lw})`, opacity: 0 }
    ],
    { duration: MS, easing: EASE, fill: "forwards" }
  );
  home.animate([{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], { duration: MS, easing: EASE, fill: "forwards" });
  setTimeout(go, MS + 20);
}
document.addEventListener("click", (e) => {
  const a = e.target.closest("a, button");
  if (a && !a.closest(".enter")) return;
  e.preventDefault();
  fly();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const a = document.activeElement?.closest?.("a, button");
  if (a && !a.closest(".enter")) return;
  e.preventDefault();
  fly();
});
addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  html.classList.remove("flying");
  hero.querySelector("canvas.glass")?.getAnimations().forEach((a) => a.cancel());
  document.querySelector(".topnav .home")?.getAnimations().forEach((a) => a.cancel());
  document.querySelectorAll(".enter, .lede").forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
  going = false;
});
