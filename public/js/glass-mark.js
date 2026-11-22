// The landing's hero: the tower m, extruded and finished in chrome. The outline is in font units with y up. A still of
// this scene's first frame (public/img/tower-m-chrome.webp) holds the mark's place until the canvas has drawn; when the
// shape, material, studio, camera or pose changes, render that still again: serve the build, hide everything but this
// canvas, screenshot the hero at 2x on a transparent ground with motion off, and crop evenly about the hero's centre.
import * as THREE from "three";
const TOWER_M = "M23 4L85 41Q96 48 100 54Q104 60 104 73L104 429Q104 443 100.5 449.5Q97 456 86 460L26 483L26 487L179 545L184 545L184 448Q253 542 348 542Q420 542 466 494.5Q512 447 512 366L512 73Q512 60 516 54Q520 48 531 41L593 4L593 0L347 0L347 4L409 41Q420 48 424 54Q428 60 428 73L428 332Q428 403 398 436Q368 469 316 469Q281 469 247 456.5Q213 444 188 427L188 73Q188 60 192 54Q196 48 207 41L269 4L269 0L23 0Z M347 4L409 41Q420 48 424 54Q428 60 428 73L428 579Q428 593 424.5 599.5Q421 606 410 610L350 633L350 637L503 695L508 695L508 598Q577 692 672 692Q744 692 790 644.5Q836 597 836 516L836 73Q836 60 840 54Q844 48 855 41L917 4L917 0L671 0L671 4L733 41Q744 48 748 54Q752 60 752 73L752 482Q752 553 722 586Q692 619 640 619Q605 619 571 606.5Q537 594 512 577L512 73Q512 60 516 54Q520 48 531 41L593 4L593 0L347 0Z M672 4L734 41Q745 48 749 54Q753 60 753 73L753 729Q753 743 749.5 749.5Q746 756 734 760L671 783L671 787L832 845L837 845L837 73Q837 60 841 54Q845 48 856 41L918 4L918 0L672 0Z";
function shapesOf(d) {
  const out = [];
  let s = null;
  for (const [, cmd, args] of d.matchAll(/([MLQZ])([^MLQZ]*)/g)) {
    const n = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === "M") { s = new THREE.Shape(); s.moveTo(n[0], n[1]); out.push(s); }
    else if (cmd === "L") s.lineTo(n[0], n[1]);
    else if (cmd === "Q") s.quadraticCurveTo(n[0], n[1], n[2], n[3]);
    else s.closePath();
  }
  return out;
}
// The mark's home: the landing's hero, or the small mark after the name on About ([data-chrome-mark]).
const html = document.documentElement, hero = document.getElementById("hero") || document.querySelector("[data-chrome-mark]");
// How much of its box the mark fills: half the hero's width on the landing, nearly all of the small box.
const badge = !hero.id, fillW = badge ? 0.94 : 0.5, fillH = badge ? 0.94 : 0.62;
// Asked once, then kept current: the reader's reduced-motion setting.
const calm = matchMedia("(prefers-reduced-motion: reduce)");
let reduced = calm.matches;
calm.addEventListener("change", (e) => { reduced = e.matches; });
const moving = () => html.dataset.motion !== "off" && !reduced;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.domElement.className = "glass";
renderer.domElement.setAttribute("aria-hidden", "true");
hero.appendChild(renderer.domElement);
const scene = new THREE.Scene();
// No scene background: the canvas is clear around the mark, so the rain behind it shows through.
renderer.setClearColor(0x000000, 0);
// A studio for the chrome to mirror: light sky, one bright band above a hard horizon, dark floor, and soft upright
// bands so the light slides across the faces as the mark sways.
function studio() {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const g = c.getContext("2d");
  const v = g.createLinearGradient(0, 0, 0, 512);
  [[0, "#4b4944"], [0.3, "#a9a69d"], [0.47, "#e2dfd6"], [0.53, "#ffffff"], [0.6, "#f4f1e8"], [0.64, "#16140f"], [1, "#070605"]].forEach(([o, col]) => v.addColorStop(o, col));
  g.fillStyle = v;
  g.fillRect(0, 0, 1024, 512);
  g.globalCompositeOperation = "multiply";
  const h = g.createLinearGradient(0, 0, 1024, 0);
  for (let i = 0; i <= 16; i++) h.addColorStop(i / 16, i % 2 ? "#ffffff" : "#a8a59c");
  g.fillStyle = h;
  g.fillRect(0, 0, 1024, 512);
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular(studio()).texture;
const camera = new THREE.PerspectiveCamera(16, 1, 0.1, 2e4);
const group = new THREE.Group();
scene.add(group);
const geo = new THREE.ExtrudeGeometry(shapesOf(TOWER_M), { depth: 150, bevelEnabled: true, bevelThickness: 16, bevelSize: 13, bevelSegments: 5, curveSegments: 10 });
geo.computeBoundingBox();
const size = geo.boundingBox.getSize(new THREE.Vector3());
geo.translate(...geo.boundingBox.getCenter(new THREE.Vector3()).negate().toArray());
const chrome = new THREE.MeshStandardMaterial({ color: "#ecebe6", metalness: 1, roughness: 0.1 });
group.add(new THREE.Mesh(geo, chrome));
// px, py: where the pointer is. sx, sy: where the mark has turned to so far; it eases toward the pointer.
let px = 0, py = 0, sx = 0, sy = 0, still = false;
function fit() {
  // Never larger than the window: if the stylesheet that sizes the box is missing or stale, the box takes its size
  // from the canvas, and without this cap each fit would grow it.
  const w = Math.min(hero.clientWidth, innerWidth), h = Math.min(hero.clientHeight, innerHeight);
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const dist = Math.max(size.x / fillW / (2 * tan * camera.aspect), size.y / fillH / (2 * tan));
  camera.position.set(0, 0, dist);
  camera.near = dist / 100;
  camera.far = dist * 100;
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);
  if (!badge) html.style.setProperty("--glass-bottom", `${(size.y / 2 * h / (2 * tan * dist)).toFixed(1)}px`);
  // Resizing clears the canvas. When the loop has stopped (motion off), draw the still mark again.
  if (still) renderer.render(scene, camera);
}
function pose(k) {
  group.rotation.y = 0.1 + 0.16 * Math.sin(k * 0.3) + sx * 0.35;
  group.rotation.x = -0.03 + sy * 0.2;
}
fit();
// The first frame is always the still's frame: time zero, pointer at rest. The still is swapped for the canvas one
// frame after that frame is drawn, so the swap shows nothing.
let t0 = null, shown = false;
function frame(t) {
  if (!moving()) {
    sx = sy = 0;
    pose(0);
    renderer.render(scene, camera);
    queueMicrotask(() => renderer.setAnimationLoop(null));
    still = true;
  } else {
    if (t0 === null) t0 = t;
    else { sx += (px - sx) * 0.06; sy += (py - sy) * 0.06; }
    pose((t - t0) / 1e3);
    renderer.render(scene, camera);
  }
  if (!shown) { shown = true; requestAnimationFrame(() => hero.classList.add("glassed")); }
}
// Compile the shaders before the first frame, off the frame path, so that frame is not a long one.
const start = () => renderer.setAnimationLoop(frame);
renderer.compileAsync(scene, camera).then(start, start);
addEventListener("pointermove", (e) => {
  px = e.clientX / innerWidth - 0.5;
  py = e.clientY / innerHeight - 0.5;
});
new ResizeObserver(fit).observe(hero);
