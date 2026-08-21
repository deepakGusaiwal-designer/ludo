import * as THREE from "three";
import gsap from "gsap";

/* ——————————————————————————————————
   Procedural Canvas Glow & Texture Generators
—————————————————————————————————— */

function createSunGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  gradient.addColorStop(0.2, "rgba(255, 235, 150, 0.95)");
  gradient.addColorStop(0.45, "rgba(255, 175, 45, 0.65)");
  gradient.addColorStop(0.75, "rgba(255, 110, 10, 0.25)");
  gradient.addColorStop(1.0, "rgba(255, 80, 0, 0.0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createSunHaloTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0.0, "rgba(255, 240, 190, 0.6)");
  gradient.addColorStop(0.35, "rgba(255, 180, 60, 0.35)");
  gradient.addColorStop(0.7, "rgba(255, 120, 20, 0.12)");
  gradient.addColorStop(1.0, "rgba(255, 60, 0, 0.0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createMoonTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // Soft lunar silvery-blue base
  ctx.fillStyle = "#dcebff";
  ctx.fillRect(0, 0, 256, 256);

  // Lunar maria & craters
  for (let i = 0; i < 28; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 6 + Math.random() * 26;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, "rgba(145, 175, 210, 0.45)");
    grad.addColorStop(0.65, "rgba(175, 200, 230, 0.3)");
    grad.addColorStop(1, "rgba(220, 235, 255, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Smaller crater dots
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 2 + Math.random() * 6;
    ctx.fillStyle = "rgba(130, 160, 195, 0.35)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createMoonGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0.0, "rgba(235, 245, 255, 0.9)");
  gradient.addColorStop(0.25, "rgba(175, 215, 255, 0.6)");
  gradient.addColorStop(0.6, "rgba(120, 185, 255, 0.22)");
  gradient.addColorStop(1.0, "rgba(80, 150, 255, 0.0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function createStarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  gradient.addColorStop(0.3, "rgba(220, 240, 255, 0.8)");
  gradient.addColorStop(0.7, "rgba(160, 200, 255, 0.3)");
  gradient.addColorStop(1.0, "rgba(100, 160, 255, 0.0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates and manages the dynamic 3D Sun, Moon, and Starfield system.
 */
export function createCelestialSystem(scene) {
  const celestialGroup = new THREE.Group();
  scene.add(celestialGroup);

  // Textures
  const sunGlowTex = createSunGlowTexture();
  const sunHaloTex = createSunHaloTexture();
  const moonTexture = createMoonTexture();
  const moonGlowTex = createMoonGlowTexture();
  const starTex = createStarTexture();

  /* ——————————————————————————————————
     1. Sun System
  —————————————————————————————————— */
  const sunGroup = new THREE.Group();

  // Sun Core Sphere
  const sunCoreGeo = new THREE.SphereGeometry(2.6, 24, 24);
  const sunCoreMat = new THREE.MeshBasicMaterial({
    color: "#fffbd0",
    fog: false,
  });
  const sunCore = new THREE.Mesh(sunCoreGeo, sunCoreMat);
  sunGroup.add(sunCore);

  // Sun Inner Radiant Corona Billboard
  const sunGlowGeo = new THREE.PlaneGeometry(8.5, 8.5);
  const sunGlowMat = new THREE.MeshBasicMaterial({
    map: sunGlowTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
    opacity: 0.95,
  });
  const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
  sunGroup.add(sunGlow);

  // Sun Wide Atmospheric Halo Billboard
  const sunHaloGeo = new THREE.PlaneGeometry(16.0, 16.0);
  const sunHaloMat = new THREE.MeshBasicMaterial({
    map: sunHaloTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
    opacity: 0.75,
  });
  const sunHalo = new THREE.Mesh(sunHaloGeo, sunHaloMat);
  sunGroup.add(sunHalo);

  celestialGroup.add(sunGroup);

  /* ——————————————————————————————————
     2. Moon System
  —————————————————————————————————— */
  const moonGroup = new THREE.Group();

  // Moon Core Sphere with Crater Texture
  const moonCoreGeo = new THREE.SphereGeometry(2.2, 24, 24);
  const moonCoreMat = new THREE.MeshBasicMaterial({
    map: moonTexture,
    color: "#e8f3ff",
    fog: false,
  });
  const moonCore = new THREE.Mesh(moonCoreGeo, moonCoreMat);
  moonGroup.add(moonCore);

  // Moon Glowing Ethereal Corona Billboard
  const moonGlowGeo = new THREE.PlaneGeometry(7.2, 7.2);
  const moonGlowMat = new THREE.MeshBasicMaterial({
    map: moonGlowTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
    opacity: 0.9,
  });
  const moonGlow = new THREE.Mesh(moonGlowGeo, moonGlowMat);
  moonGroup.add(moonGlow);

  // Outer Soft Lunar Aura Billboard
  const moonAuraGeo = new THREE.PlaneGeometry(13.5, 13.5);
  const moonAuraMat = new THREE.MeshBasicMaterial({
    map: moonGlowTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
    opacity: 0.45,
  });
  const moonAura = new THREE.Mesh(moonAuraGeo, moonAuraMat);
  moonGroup.add(moonAura);

  celestialGroup.add(moonGroup);

  /* ——————————————————————————————————
     3. Twinkling Night Starfield
  —————————————————————————————————— */
  const starCount = 320;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  const starColorPalette = [
    new THREE.Color("#ffffff"),
    new THREE.Color("#d4e8ff"),
    new THREE.Color("#ffeec2"),
    new THREE.Color("#c8e0ff"),
    new THREE.Color("#f0d8ff"),
  ];

  for (let i = 0; i < starCount; i++) {
    // Upper hemisphere distribution
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * 0.45 * Math.PI + 0.05; // upper sky dome
    const r = 58 + Math.random() * 18;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi) + 12; // elevated above board
    const z = r * Math.sin(phi) * Math.sin(theta);

    starPositions[i * 3] = x;
    starPositions[i * 3 + 1] = y;
    starPositions[i * 3 + 2] = z;

    const col = starColorPalette[Math.floor(Math.random() * starColorPalette.length)];
    starColors[i * 3] = col.r;
    starColors[i * 3 + 1] = col.g;
    starColors[i * 3 + 2] = col.b;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 1.6,
    map: starTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });

  const starField = new THREE.Points(starGeo, starMat);
  celestialGroup.add(starField);

  /* ——————————————————————————————————
     Astronomical Configuration Maps
  —————————————————————————————————— */
  const CELESTIAL_CONFIG = {
    sunny: {
      sunPos: [-32, 45, 20],
      sunScale: 1.1,
      sunCoreCol: "#fffde0",
      sunCoronaCol: "#fde047",
      sunOpacity: 1.0,
      moonPos: [28, -25, -20],
      moonScale: 0.001,
      moonOpacity: 0.0,
      starOpacity: 0.0,
    },
    evening: {
      sunPos: [-48, 11, 30], // Low blazing golden orange sunset sun
      sunScale: 1.45,
      sunCoreCol: "#ff7a00",
      sunCoronaCol: "#ea580c",
      sunOpacity: 1.0,
      moonPos: [36, 12, -28], // Crescent moon rising on opposite horizon
      moonScale: 0.55,
      moonOpacity: 0.4,
      starOpacity: 0.35,
    },
    night: {
      sunPos: [-25, -35, 18],
      sunScale: 0.001,
      sunOpacity: 0.0,
      moonPos: [28, 42, -22], // Glowing full moon high in sky
      moonScale: 1.25,
      moonOpacity: 1.0,
      starOpacity: 0.95,
    },
    dark_night: {
      sunPos: [-20, -42, 15],
      sunScale: 0.001,
      sunOpacity: 0.0,
      moonPos: [22, 46, -26], // Radiant silvery moon with deep starfield
      moonScale: 1.35,
      moonOpacity: 1.0,
      starOpacity: 1.0,
    },
  };

  /**
   * Smoothly transitions the Sun, Moon, and Starfield to match the selected time of day.
   */
  function setTimeOfDay(timeId, weatherId, animated = true) {
    const config = CELESTIAL_CONFIG[timeId] || CELESTIAL_CONFIG.sunny;
    const dur = animated ? 0.85 : 0;
    const ease = "power2.out";

    if (!animated) {
      sunGroup.position.set(...config.sunPos);
      sunGroup.scale.setScalar(config.sunScale);
      sunCoreMat.color.set(config.sunCoreCol);
      sunGlowMat.opacity = config.sunOpacity * 0.95;
      sunHaloMat.opacity = config.sunOpacity * 0.75;

      moonGroup.position.set(...config.moonPos);
      moonGroup.scale.setScalar(config.moonScale);
      moonGlowMat.opacity = config.moonOpacity * 0.9;
      moonAuraMat.opacity = config.moonOpacity * 0.45;

      starMat.opacity = config.starOpacity;
      return;
    }

    // Sun animations
    gsap.to(sunGroup.position, {
      x: config.sunPos[0],
      y: config.sunPos[1],
      z: config.sunPos[2],
      duration: dur,
      ease,
    });
    gsap.to(sunGroup.scale, {
      x: config.sunScale,
      y: config.sunScale,
      z: config.sunScale,
      duration: dur,
      ease,
    });
    const targetSunCore = new THREE.Color(config.sunCoreCol);
    gsap.to(sunCoreMat.color, {
      r: targetSunCore.r,
      g: targetSunCore.g,
      b: targetSunCore.b,
      duration: dur,
      ease,
    });
    gsap.to(sunGlowMat, {
      opacity: config.sunOpacity * 0.95,
      duration: dur,
      ease,
    });
    gsap.to(sunHaloMat, {
      opacity: config.sunOpacity * 0.75,
      duration: dur,
      ease,
    });

    // Moon animations
    gsap.to(moonGroup.position, {
      x: config.moonPos[0],
      y: config.moonPos[1],
      z: config.moonPos[2],
      duration: dur,
      ease,
    });
    gsap.to(moonGroup.scale, {
      x: config.moonScale,
      y: config.moonScale,
      z: config.moonScale,
      duration: dur,
      ease,
    });
    gsap.to(moonGlowMat, {
      opacity: config.moonOpacity * 0.9,
      duration: dur,
      ease,
    });
    gsap.to(moonAuraMat, {
      opacity: config.moonOpacity * 0.45,
      duration: dur,
      ease,
    });

    // Starfield animation
    gsap.to(starMat, {
      opacity: config.starOpacity,
      duration: dur,
      ease,
    });
  }

  /**
   * Per-frame animation update for solar flares, moon aura, and billboarding.
   */
  function update(time, camera) {
    // Face the glow billboard planes toward the active camera
    if (camera) {
      sunGlow.quaternion.copy(camera.quaternion);
      sunHalo.quaternion.copy(camera.quaternion);
      moonGlow.quaternion.copy(camera.quaternion);
      moonAura.quaternion.copy(camera.quaternion);
    }

    // Solar corona subtle breathing pulsation
    const solarPulse = 1.0 + Math.sin(time * 1.8) * 0.05;
    sunGlow.scale.setScalar(solarPulse);
    sunHalo.scale.setScalar(1.0 + Math.cos(time * 1.2) * 0.08);

    // Lunar shimmer pulsation
    const moonPulse = 1.0 + Math.sin(time * 1.4 + 1.2) * 0.04;
    moonGlow.scale.setScalar(moonPulse);
    moonAura.scale.setScalar(1.0 + Math.cos(time * 0.9) * 0.06);

    // Starfield gentle cosmic drift & twinkling
    starField.rotation.y = time * 0.003;
  }

  function dispose() {
    sunCoreGeo.dispose();
    sunCoreMat.dispose();
    sunGlowGeo.dispose();
    sunGlowMat.dispose();
    sunHaloGeo.dispose();
    sunHaloMat.dispose();

    moonCoreGeo.dispose();
    moonCoreMat.dispose();
    moonGlowGeo.dispose();
    moonGlowMat.dispose();
    moonAuraGeo.dispose();
    moonAuraMat.dispose();

    starGeo.dispose();
    starMat.dispose();

    sunGlowTex.dispose();
    sunHaloTex.dispose();
    moonTexture.dispose();
    moonGlowTex.dispose();
    starTex.dispose();

    scene.remove(celestialGroup);
  }

  return {
    celestialGroup,
    sunGroup,
    moonGroup,
    starField,
    setTimeOfDay,
    update,
    dispose,
  };
}
