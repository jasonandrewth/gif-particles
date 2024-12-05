import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import particlesCurveVertexShader from "./shaders/particles/Spiral/vertex.glsl";
import particlesCurveFragmentShader from "./shaders/particles/Spiral/fragment.glsl";
import GIF from "gif.js";
import GUI from "lil-gui";

// 1. Möbius Strip Parametric Equation
function getMöbiusPoint(u, v) {
  // u controls the loop around the strip (0 to 2 * PI)
  // v controls the width along the strip (-1 to 1)
  const a = 2; // Radius of Möbius strip
  const x = (a + v * Math.cos(u / 2)) * Math.cos(u);
  const y = (a + v * Math.cos(u / 2)) * Math.sin(u);
  const z = v * Math.sin(u / 2);
  return new THREE.Vector3(x * 0.06, y * 0.06, z * 0.06);
}

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 });
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("./particles/sfi-particle-blur.png");
texture.flipY = false;
/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Materials
  particlesMaterial.uniforms.uResolution.value.set(
    sizes.width * sizes.pixelRatio,
    sizes.height * sizes.pixelRatio
  );

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, -0.5, -0.1);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setClearColor("#181818");
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Particles
 */
const particles = {};
particles.geometry = new THREE.BufferGeometry();
let count = 64;
let countSphere = count * count * 0.65;
let positions = new Float32Array(count * count * 3);
const radius = 0.13;
const gap = 15;

for (let y = 0; y < count; y++) {
  for (let x = 0; x < count; x++) {
    const i = y * count + x;
    const i2 = i * 2;
    const i3 = i * 3;

    const u = (i / (count * count)) * Math.PI * 2; // loop along strip
    const v = (Math.random() - 0.5) * 2; // random width along the strip
    const point = getMöbiusPoint(u, v);
    positions[i3 + 0] = point.x;
    positions[i3 + 1] = point.y;
    positions[i3 + 2] = point.z;
  }
}

const speedFactors = new Float32Array(count * count);
for (let i = 0; i < count; i++) {
  for (let j = 0; j < count; j++) {
    const index = i * count + j;

    //Size
    // speedFactors[index] = Math.random();

    speedFactors[index] = Math.random();
  }
}

particles.geometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);
particles.geometry.setAttribute(
  "aSpeedFactor",
  new THREE.Float32BufferAttribute(speedFactors, 1)
);
console.log(speedFactors);

particles.material = new THREE.ShaderMaterial({
  vertexShader: particlesCurveVertexShader,
  fragmentShader: particlesCurveFragmentShader,
  uniforms: {
    uResolution: new THREE.Uniform(
      new THREE.Vector2(
        sizes.width * sizes.pixelRatio,
        sizes.height * sizes.pixelRatio
      )
    ),
    uParticleTex: new THREE.Uniform(texture),
    uTime: new THREE.Uniform(0),
    uProgress: new THREE.Uniform(0),
  },
  side: THREE.DoubleSide,
  transparent: false,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending,
});
particles.points = new THREE.Points(particles.geometry, particles.material);
scene.add(particles.points);

/**
 * Tweaks
 */
gui
  .add(particles.material.uniforms.uProgress, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("uProgress")
  .listen();

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;
const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;

  previousTime = elapsedTime;

  //   console.log(elapsedTime * 0.1);

  particles.material.uniforms.uTime.value = elapsedTime;
  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

// GIF creation setup
const gif = new GIF({
  workers: 2,
  quality: 10,
  workerScript: "./gif.worker.js", // Adjust path as necessary
});

// Set GIF loop duration and frame count
const duration = 10; // seconds
const fps = 20;
const totalFrames = duration * fps;

// Function to render and capture each frame
async function captureFrames() {
  for (let i = 0; i < totalFrames; i++) {
    const progress = i / totalFrames;
    // * 2.0 * Math.PI

    const elapsedTime = (i / fps) * duration;

    particles.material.uniforms.uTime.value = elapsedTime;
    particles.material.uniforms.uProgress.value = progress;

    // Render the scene
    renderer.render(scene, camera);

    // Add current frame to GIF
    gif.addFrame(renderer.domElement, { copy: true, delay: 1000 / fps });
  }

  // Render and download GIF
  gif.on("finished", function (blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "animationStrip.gif";
    link.click();
  });

  gif.render();
}

// Start capturing frames
window.addEventListener("click", () => {
  //   captureFrames();
});