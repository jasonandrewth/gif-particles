import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import particlesCurveVertexShader from "./shaders/particles/Sphere/vertex.glsl";
import particlesCurveFragmentShader from "./shaders/particles/Sphere/fragment.glsl";
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
  alpha: true,
});
// renderer.setClearColor(0xffffff, 0);
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Particles
 */
const particles = {};

const initParticles = (count) => {
  particles.geometry = new THREE.BufferGeometry();
  let countSphere = count * count * 0.65;
  let positions = new Float32Array(count * count * 3);
  const radius = 0.13;
  const gap = 15;

  for (let y = 0; y < count; y++) {
    for (let x = 0; x < count; x++) {
      const i = y * count + x;
      const i3 = i * 3;

      //generate points on a sphere
      let theta = Math.random() * Math.PI * 2;
      let phi = Math.acos(Math.random() * 2 - 1); //between 0 and pi

      // Sphere
      let xPos = Math.sin(phi) * Math.cos(theta) * radius;
      let yPos = Math.sin(phi) * Math.sin(theta) * radius;
      let zPos = Math.cos(phi) * radius;

      // Plane
      // xPos = (y / count - 0.5) * gap;
      // yPos = (x / count - 0.5) * gap;
      // zPos = 0;

      if (countSphere <= i) {
        positions[i3 + 0] = xPos;
        positions[i3 + 1] = yPos;
        positions[i3 + 2] = zPos;
      } else {
        positions[i3 + 0] = (Math.random() - 0.5) * 1.0;
        positions[i3 + 1] = (Math.random() - 0.5) * 0.3;
        positions[i3 + 2] = (Math.random() - 0.5) * 1.0;
      }
    }
  }

  const speedFactors = new Float32Array(count * count);
  const sizeFactors = new Float32Array(count * count);
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      const index = i * count + j;

      //Size
      // speedFactors[index] = Math.random();

      if (countSphere <= index) {
        // speedFactors[index] = 1 + Math.floor(Math.random() * 3);
        speedFactors[index] = 1;
      } else {
        // speedFactors[index] =(-1 + Math.floor(Math.random() * -3));
        speedFactors[index] = 0.0;
      }

      sizeFactors[index] = Math.random();
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
  particles.geometry.setAttribute(
    "aSizeFactor",
    new THREE.Float32BufferAttribute(sizeFactors, 1)
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
    },
    side: THREE.DoubleSide,
    transparent: false,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  particles.points = new THREE.Points(particles.geometry, particles.material);
};

initParticles(128);
scene.add(particles.points);

/**
 * Tweaks
 */

const tweakParams = {
  particleCount: 256,
};
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
  .name("Particle Size")
  .onChange((v) => {
    particles.material.uniforms.uSize.value = v;
  });
gui
  .add(tweakParams, "particleCount")
  .min(32)
  .max(512)
  .step(8)
  .name("Particle Count")
  .onChange((v) => {
    scene.remove(particles.points);
    scene.remove(particles.material);
    scene.remove(particles.geometry);
    particles.material = null;
    initParticles(v);
    scene.add(particles.points);
  });

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

  console.log(particles.material.uniforms.uSize.value);

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
const duration = 5; // seconds
const fps = 20;
const totalFrames = duration * fps;

// Function to render and capture each frame
async function captureFrames() {
  for (let i = 0; i < totalFrames; i++) {
    const progress = i / totalFrames;
    // * 2.0 * Math.PI
    console.log(progress);

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
    link.download = "animationSphere.gif";
    link.click();
  });

  gif.render();
}

// Start capturing frames
window.addEventListener("click", () => {
  captureFrames();
});
