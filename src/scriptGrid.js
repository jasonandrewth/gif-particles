import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import particlesCurveVertexShader from "./shaders/particles/Grid/vertex.glsl";
import particlesCurveFragmentShader from "./shaders/particles/Grid/fragment.glsl";
import GIF from "gif.js";
import GUI from "lil-gui";
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
camera.position.set(0, 0, -0.1);
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
  alpha: true,
});
renderer.setClearColor(0x000000, 0); // the default
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Particles
 */
const particles = {};
particles.geometry = new THREE.BufferGeometry();
let count = 24;
let positions = new Float32Array(count * count * count * 3);
const radius = 0.13;
const spacing = 0.04; // Distance between particles
const convergenceFactor = 0.5; // Degree of convergence (adjust to your needs)

let index = 0;
for (let x = 0; x < count; x++) {
  for (let y = 0; y < count; y++) {
    for (let z = 0; z < count; z++) {
      //   const i = index++;

      //generate points on a sphere
      let theta = Math.random() * Math.PI * 2;
      let phi = Math.acos(Math.random() * 2 - 1); //between 0 and pi

      // Sphere
      let xPos = Math.sin(phi) * Math.cos(theta) * radius;
      let yPos = Math.sin(phi) * Math.sin(theta) * radius;
      let zPos = Math.cos(phi) * radius;
      //Grid
      xPos = (x - count / 2) * spacing;
      yPos = (y - count / 2) * spacing; // y position
      zPos = (z - count / 2) * spacing; // z position
      zPos = zPos + 0.5;

      console.log(zPos);

      // Apply trapezoidal convergence based on `z` position
      let scale = 1 - convergenceFactor * (z / count);
      // xPos *= scale;
      // yPos *= scale;

      positions[index * 3 + 0] = xPos;
      positions[index * 3 + 1] = yPos;
      positions[index * 3 + 2] = zPos;
      index++;
    }
  }
}

const speedFactors = new Float32Array(count * count * count);
for (let i = 0; i < count * count * count; i++) {
  const index = i;

  //Size
  // speedFactors[index] = Math.random();

  speedFactors[index] = 0.5 + Math.random() * (1 - 0.5);
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
    uSize: new THREE.Uniform(0.5),
    uProgress: new THREE.Uniform(0),
    uShowPoint: new THREE.Uniform(false),
    uSpeed: new THREE.Uniform(0.5),
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
gui
  .add(particles.material.uniforms.uSize, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("Particle Size");
gui
  .add(particles.material.uniforms.uSpeed, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("Speed");

gui.add(particles.material.uniforms.uShowPoint, "value").name("Show Points");

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
    link.download = "animationGrid.gif";
    link.click();
  });

  gif.render();
}

// Start capturing frames
window.addEventListener("click", () => {
  //   captureFrames();
});
