import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
const q = new URLSearchParams(location.search);
const knob = (k, d, lo, hi) => {
  const v = Number(q.get(k));
  return q.has(k) && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
};
const still = q.has("still") || matchMedia("(prefers-reduced-motion: reduce)").matches;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: still });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = knob("exp", 1.8, 0.5, 3);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(986635);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 2e3);
const group = new THREE.Group();
scene.add(group);
new GLTFLoader().load("/models/mark.glb", (g) => {
  const mark = g.scene;
  mark.traverse((o) => {
    if (!o.isMesh) return;
    Object.assign(o.material, { iridescence: 0, dispersion: 0, attenuationDistance: 6e-3, roughness: 0.06 });
    o.material.attenuationColor = new THREE.Color("#d8c7a0");
    o.material.needsUpdate = true;
  });
  const box = new THREE.Box3().setFromObject(mark), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  mark.position.sub(c);
  group.add(mark);
  const fill = knob("fill", innerWidth < 640 ? 0.86 : 0.6, 0.3, 0.95);
  const dist = s.x / fill / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
  camera.position.set(0, 0, dist);
  camera.lookAt(0, 0, 0);
  camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight * 0.1, innerWidth, innerHeight);
  group.rotation.y = knob("ry", 0.1, -0.6, 0.6);
  group.rotation.x = knob("rx", -0.02, -0.3, 0.3);
  if (still) {
    renderer.render(scene, camera);
    document.title += " (ready)";
    return;
  }
  let px = 0, py = 0;
  addEventListener("pointermove", (e) => {
    px = e.clientX / innerWidth - 0.5;
    py = e.clientY / innerHeight - 0.5;
  });
  const t0 = performance.now();
  renderer.setAnimationLoop((t) => {
    const k = (t - t0) / 1e3;
    group.rotation.y = 0.1 + 0.2 * Math.sin(k * 0.3) + px * 0.6;
    group.rotation.x = -0.02 + py * 0.35;
    renderer.render(scene, camera);
  });
});
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
