import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import particlesCurveVertexShader from "./shaders/particles/Funnel/vertex.glsl";
import particlesCurveFragmentShader from "./shaders/particles/Funnel/fragment.glsl";
import GIF from "gif.js";
/**
 * Base
 */
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
});
renderer.setClearColor("#181818");
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Particles
 */
const particles = {};
particles.geometry = new THREE.BufferGeometry();
let count = 128;
let positions = new Float32Array(count * count * 3);
let offsets = new Float32Array(count * count); // Random offset for each particle

const radius = 1;
const length = 15;

let mainR = 0.2;
let outerLimit = 0.99;
let innerLimit = 0.08;

for (let y = 0; y < count; y++) {
  for (let x = 0; x < count; x++) {
    const i = y * count + x;
    const i3 = i * 3;

    const angle = Math.random() * Math.PI * 2;
    let r = Math.sqrt(Math.random()) * radius; // Random radial distance
    const z = Math.random() * length; // Random z-position along tunnel

    // Sphere
    let xPos = r * Math.cos(angle);
    let yPos = r * Math.sin(angle);
    let zPos = z;

    let inout = (Math.random() - 0.5) * 2;
    let lim = inout >= 0 ? outerLimit : innerLimit;
    let rand = mainR + Math.pow(Math.random(), 3) * lim * inout;

    r = THREE.MathUtils.randFloat(0.5 * mainR, 1.2 * mainR);

    let pos = new THREE.Vector3().setFromCylindricalCoords(
      rand,
      Math.PI * 2 * Math.random(),
      0
    );

    positions[i3 + 0] = pos.x;
    positions[i3 + 1] = pos.z;
    positions[i3 + 2] = z;

    offsets[i] = Math.random();
  }
}

particles.geometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);
particles.geometry.setAttribute(
  "aOffset",
  new THREE.BufferAttribute(offsets, 1)
);

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
    uTunnelLength: { value: length },
  },
  side: THREE.DoubleSide,
  transparent: true,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending,
});
particles.points = new THREE.Points(particles.geometry, particles.material);
scene.add(particles.points);

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
const duration = 2; // seconds
const fps = 50;
const totalFrames = duration * fps;

// Function to render and capture each frame
async function captureFrames() {
  for (let i = 0; i < totalFrames; i++) {
    const progress = i / totalFrames;

    const elapsedTime = (i / fps) * duration;

    particles.material.uniforms.uTime.value = elapsedTime;

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
    link.download = "animation.gif";
    link.click();
  });

  gif.render();
}

// Start capturing frames
window.addEventListener("click", () => {
  // captureFrames();
});
