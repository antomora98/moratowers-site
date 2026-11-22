// Story page: a thin bar at the top of the window that fills as the reader moves down the page. The reading time under
// the title is counted when the site is built (story.astro).
const bar = document.querySelector(".readbar");
if (bar) {
  let queued = false;
  const draw = () => {
    queued = false;
    // The share of the page already scrolled: 0 at the top, 1 at the very bottom.
    const span = document.documentElement.scrollHeight - innerHeight;
    const k = span > 0 ? Math.min(1, Math.max(0, scrollY / span)) : 1;
    bar.style.transform = `scaleX(${k.toFixed(4)})`;
  };
  const ask = () => {
    if (!queued) { queued = true; requestAnimationFrame(draw); }
  };
  addEventListener("scroll", ask, { passive: true });
  addEventListener("resize", ask);
  draw();
}
