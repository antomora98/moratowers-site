import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
const html = document.documentElement, hero = document.getElementById("hero");
const moving = () => html.dataset.motion !== "off" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.8;
renderer.domElement.className = "glass";
renderer.domElement.setAttribute("aria-hidden", "true");
hero.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(getComputedStyle(html).getPropertyValue("--bg").trim() || "#0f0e0b");
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(16, 1, 0.1, 2e3);
const group = new THREE.Group();
scene.add(group);
let size = null, px = 0, py = 0;
const EM_MARK = 1623 / 320, EM_LINE = 2985 / 320;
let line = null, lineH = 0;
function fit() {
  const w = hero.clientWidth, h = hero.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (!size) return;
  const fill = w < 640 ? 0.88 : 0.62;
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const dist = Math.max(size.x / fill / (2 * tan * camera.aspect), size.y / 0.6 / (2 * tan));
  camera.position.set(0, 0, dist);
  camera.near = dist / 100;
  camera.far = dist * 100;
  camera.updateProjectionMatrix();
  camera.lookAt(0, 0, 0);
  if (!line) return;
  const em = size.x / EM_MARK * (w < 640 ? 0.46 : 0.21);
  const k = em / (line.userData.w / EM_LINE);
  line.scale.set(k, k, k * line.userData.zfix);
  lineH = line.userData.h * k;
  const gap = size.x / EM_MARK * 0.22;
  line.position.y = -(size.y / 2 + gap + lineH / 2);
  const pxPerUnit = h / (2 * tan * dist);
  html.style.setProperty("--glass-bottom", `${((size.y / 2 + gap + lineH) * pxPerUnit).toFixed(1)}px`);
}
function pose(k) {
  group.rotation.y = 0.06 + 0.1 * Math.sin(k * 0.3) + px * 0.3;
  group.rotation.x = -0.02 + py * 0.2;
  html.style.setProperty("--drift-x", `${((group.rotation.y - 0.06) * 60).toFixed(2)}px`);
  html.style.setProperty("--sheen", `${(50 + (group.rotation.y - 0.06) * 260).toFixed(1)}%`);
  html.style.setProperty("--drift-y", `${((group.rotation.x + 0.02) * 30).toFixed(2)}px`);
}
const loader = new GLTFLoader();
Promise.allSettled([loader.loadAsync(hero.dataset.markSrc), loader.loadAsync(hero.dataset.lineSrc)]).then(([m, l]) => {
  if (m.status !== "fulfilled") return;
  const mark = m.value.scene, box = new THREE.Box3().setFromObject(mark);
  if (html.dataset.glass === "warm") mark.traverse((o) => {
    if (!o.isMesh) return;
    Object.assign(o.material, { iridescence: 0, dispersion: 0, attenuationDistance: 6e-3, roughness: 0.06 });
    o.material.attenuationColor = new THREE.Color("#d8c7a0");
    o.material.needsUpdate = true;
  });
  size = box.getSize(new THREE.Vector3());
  mark.position.sub(box.getCenter(new THREE.Vector3()));
  group.add(mark);
  if (l.status === "fulfilled") {
    let glassMat = null;
    mark.traverse((o) => {
      if (o.isMesh && !glassMat) glassMat = o.material;
    });
    const raw = l.value.scene, lb = new THREE.Box3().setFromObject(raw), ls = lb.getSize(new THREE.Vector3());
    raw.position.sub(lb.getCenter(new THREE.Vector3()));
    raw.traverse((o) => {
      if (o.isMesh) o.material = glassMat;
    });
    line = new THREE.Group();
    line.add(raw);
    line.userData = { w: ls.x, h: ls.y, zfix: 0.55 * (size.z / (size.x / EM_MARK)) / (ls.z / (ls.x / EM_LINE)) };
    group.add(line);
    hero.classList.add("lined");
  }
  fit();
  // Prepare the glass's shaders before the first frame, so the swap from the flat word does not stall.
  (renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve()).catch(() => {}).then(() => {
  const t0 = performance.now();
  renderer.setAnimationLoop((t) => {
    if (!moving()) {
      pose(0);
      renderer.render(scene, camera);
      renderer.setAnimationLoop(null);
      return;
    }
    pose((t - t0) / 1e3);
    renderer.render(scene, camera);
  });
  hero.classList.add("glassed");
  });
});
addEventListener("pointermove", (e) => {
  px = e.clientX / innerWidth - 0.5;
  py = e.clientY / innerHeight - 0.5;
});
new ResizeObserver(fit).observe(hero);
