import * as THREE from "three";
import gsap from "gsap";

import { getMaterial } from "./materials.js";
import {
  getCircleParticleTexture,
  getRainStreakTexture,
} from "./weatherManager.js";

export const FOREST_THEMES = {
  clear: {
    ground: "#42573d",
    groundRoughness: 0.88,
    groundBumpScale: 0.12,
    groundMetalness: 0.05,
    bark: "#7a6040",
    rock: "#6a6d62",
    foliage: ["#2c4932", "#34543a", "#3e6041", "#466746", "#2a412f"],
    bush: ["#304d35", "#3b5b3d", "#456744", "#263f2d"],
  },
  desert: {
    ground: "#c89456",
    groundRoughness: 0.92,
    groundBumpScale: 0.08,
    groundMetalness: 0.02,
    bark: "#8c6e4e",
    rock: "#b88a58",
    foliage: ["#9e8749", "#ab9556", "#8a773d", "#948043", "#a89052"],
    bush: ["#a0874c", "#8f7940", "#b3995d", "#7d6935"],
  },
  hell: {
    ground: "#140505",
    groundRoughness: 0.85,
    groundBumpScale: 0.28,
    groundMetalness: 0.1,
    bark: "#260e0e",
    rock: "#3a1414",
    foliage: ["#3b0f0f", "#4d1414", "#5e1a1a", "#2e0b0b", "#481212"],
    bush: ["#421111", "#541616", "#330d0d", "#491313"],
  },
  heaven: {
    ground: "#e2f9ec",
    groundRoughness: 0.32,
    groundBumpScale: 0.04,
    groundMetalness: 0.08,
    bark: "#f8f0e5",
    rock: "#e0f2fe",
    foliage: ["#99f6e4", "#a7f3d0", "#bae6fd", "#fbcfe8", "#fde047"],
    bush: ["#a7f3d0", "#bae6fd", "#fbcfe8", "#fef08a"],
  },
  ice: {
    ground: "#8cd4f5",
    groundRoughness: 0.12,
    groundBumpScale: 0.08,
    groundMetalness: 0.18,
    bark: "#4a6878",
    rock: "#a5d8f0",
    foliage: ["#6ab8d9", "#7ecae8", "#5aa8c9", "#8ddcf7", "#73c2e3"],
    bush: ["#6ebfe0", "#84d2f0", "#5cb0d4", "#77cceb"],
  },
  heavy_rain: {
    ground: "#0d6db8",
    groundRoughness: 0.05,
    groundBumpScale: 0.16,
    groundMetalness: 0.3,
    bark: "#32251a",
    rock: "#1e527a",
    foliage: ["#1c3324", "#223e2c", "#172b1e", "#274732", "#1e3726"],
    bush: ["#1f3827", "#172b1e", "#25422e", "#1b3022"],
  },
};

const CONFIG = {
  forestRadius: 32,
  boardSafeRadius: 9.8,

  treeCount: 36,
  pineTreeCount: 24,
  birchTreeCount: 16,
  nearBoardTreeCount: 6,
  bushCount: 36,
  rockCount: 32,
  logCount: 6,

  deerCount: 4,
  rabbitCount: 6,
  butterflyCount: 12,
  mushroomCount: 15,
  flowerCount: 20,

  mobileTreeCount: 20,
  mobilePineCount: 14,
  mobileBirchCount: 10,
  mobileNearBoardTreeCount: 3,
};

const PALETTE = {
  treeTrunk: ["#594431", "#644b34", "#715239"],
  foliage: ["#2c4932", "#34543a", "#3e6041", "#466746", "#2a412f"],
  bush: ["#304d35", "#3b5b3d", "#456744", "#263f2d"],
  rock: ["#5d6258", "#67695f", "#4d554c", "#726e61"],
  log: ["#523b2b", "#62452e", "#463426"],
  ground: "#334535",
  deer: ["#8b6642", "#9c7a52", "#7a5e3a"],
  rabbit: ["#b8a88a", "#a89878", "#c4b898", "#958570"],
  butterfly: ["#e8a832", "#e84848", "#5898e8", "#d858d8", "#58c878"],
  mushroom: ["#cc3333", "#cc6633", "#cc9933", "#e8d888"],
  mushroomSpot: "#f4ead1",
  flower: ["#e85888", "#d84888", "#e8a832", "#c858d8", "#f8f888", "#5898e8"],
};

const random = (min, max) => Math.random() * (max - min) + min;

const randomInt = (min, max) => Math.floor(random(min, max + 1));

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/* ——————————————————————————————————
   Procedural canvas textures
—————————————————————————————————— */

function createBarkTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#5a4430";
  ctx.fillRect(0, 0, 64, 128);

  for (let y = 0; y < 128; y += 3) {
    ctx.fillStyle = `rgba(${30 + Math.random() * 40},${20 + Math.random() * 25},${10 + Math.random() * 15},${0.2 + Math.random() * 0.3})`;
    ctx.fillRect(0, y, 64, 2);
  }
  for (let i = 0; i < 35; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.12})`;
    ctx.fillRect(Math.random() * 64, Math.random() * 128, 1 + Math.random() * 3, 3 + Math.random() * 8);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createGroundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // Rich earthy soil base
  ctx.fillStyle = "#2c3b2e";
  ctx.fillRect(0, 0, 256, 256);

  // Earth patches
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const g = 35 + Math.random() * 35;
    ctx.fillStyle = `rgba(${g - 5},${g + 18},${g - 10},${0.1 + Math.random() * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hard soil & gravel specs
  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = `rgba(65,55,42,${0.08 + Math.random() * 0.14})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 7, 2 + Math.random() * 7);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  return tex;
}

function createGroundBumpMap() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // Neutral grey base
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 256, 256);

  // Heavy rough gravel & dirt noise
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const val = Math.floor(Math.random() * 255);
    const radius = 0.5 + Math.random() * 2.8;
    ctx.fillStyle = `rgb(${val},${val},${val})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soil cracks & stone ridges
  ctx.strokeStyle = "#252525";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    let cx = Math.random() * 256;
    let cy = Math.random() * 256;
    ctx.moveTo(cx, cy);
    for (let j = 0; j < 5; j++) {
      cx += (Math.random() - 0.5) * 35;
      cy += (Math.random() - 0.5) * 35;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  return tex;
}

function createRockTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#606358";
  ctx.fillRect(0, 0, 64, 64);

  for (let i = 0; i < 120; i++) {
    const shade = 70 + Math.random() * 50;
    ctx.fillStyle = `rgba(${shade},${shade - 5},${shade - 10},${0.08 + Math.random() * 0.15})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 64, Math.random() * 64, 1 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Builds the surrounding forest with animals, textures, and foliage.
 */
export function createForest({ isMobile, qualityTier = "high" }) {
  const forest = new THREE.Group();

  const barkTexture = createBarkTexture();
  const groundTexture = createGroundTexture();
  const groundBumpMap = createGroundBumpMap();
  const rockTexture = createRockTexture();

  const barkMaterial = new THREE.MeshStandardMaterial({
    map: barkTexture,
    roughness: 0.9,
    color: "#7a6040",
  });

  const texturedRockMaterial = new THREE.MeshStandardMaterial({
    map: rockTexture,
    roughness: 0.85,
    color: "#6a6d62",
  });

  // Dynamic theme-adaptive materials
  const foliageMaterials = PALETTE.foliage.map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.88 })
  );
  const bushMaterials = PALETTE.bush.map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.88 })
  );

  // Realm specific materials
  const desertRockMat = new THREE.MeshStandardMaterial({
    map: rockTexture,
    roughness: 0.92,
    color: "#c49258",
  });
  const desertPillarMat = new THREE.MeshStandardMaterial({
    roughness: 0.9,
    color: "#b8854c",
  });
  const desertRedRockMat = new THREE.MeshStandardMaterial({
    roughness: 0.88,
    color: "#b45309",
  });
  const desertSandstoneMat = new THREE.MeshStandardMaterial({
    roughness: 0.94,
    color: "#d97706",
  });
  const cactusMat1 = new THREE.MeshStandardMaterial({
    color: "#2e7d32",
    roughness: 0.78,
    metalness: 0.04,
  });
  const cactusMat2 = new THREE.MeshStandardMaterial({
    color: "#388e3c",
    roughness: 0.82,
    metalness: 0.04,
  });
  const cactusFlowerMat = new THREE.MeshStandardMaterial({
    color: "#f59e0b",
    roughness: 0.5,
    emissive: "#d97706",
    emissiveIntensity: 0.45,
  });

  const volcanicSpireMat = new THREE.MeshStandardMaterial({
    roughness: 0.82,
    color: "#1c0909",
  });
  const magmaRockMat = new THREE.MeshStandardMaterial({
    roughness: 0.65,
    color: "#2b0d0d",
    emissive: "#ff3700",
    emissiveIntensity: 1.2,
  });

  const icebergMat = new THREE.MeshStandardMaterial({
    color: "#d2f0ff",
    roughness: 0.12,
    metalness: 0.15,
    transparent: true,
    opacity: 0.92,
  });
  const iceSpireMat = new THREE.MeshStandardMaterial({
    color: "#8ed4f5",
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.9,
  });

  // Ocean realm materials
  const shipHullMat = new THREE.MeshStandardMaterial({
    color: "#2e1c14",
    roughness: 0.75,
  });
  const shipSailMat = new THREE.MeshStandardMaterial({
    color: "#f8fafc",
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  const boatHullMat = new THREE.MeshStandardMaterial({
    color: "#0284c7",
    roughness: 0.5,
  });
  const boatWoodMat = new THREE.MeshStandardMaterial({
    color: "#b45309",
    roughness: 0.75,
  });
  const lighthouseWhiteMat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.6,
  });
  const lighthouseRedMat = new THREE.MeshStandardMaterial({
    color: "#dc2626",
    roughness: 0.6,
  });
  const buildingStoneMat = new THREE.MeshStandardMaterial({
    color: "#475569",
    roughness: 0.85,
  });
  const buildingWindowMat = new THREE.MeshStandardMaterial({
    color: "#ffedd5",
    emissive: "#f59e0b",
    emissiveIntensity: 2.2,
    roughness: 0.3,
  });
  const buoyRedMat = new THREE.MeshStandardMaterial({
    color: "#ef4444",
    roughness: 0.4,
  });
  const buoyLightMat = new THREE.MeshStandardMaterial({
    color: "#fef08a",
    emissive: "#eab308",
    emissiveIntensity: 2.8,
  });
  function createSoftBlurGlowTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0.0, "rgba(255, 255, 240, 0.95)");
    gradient.addColorStop(0.18, "rgba(255, 200, 100, 0.75)");
    gradient.addColorStop(0.42, "rgba(255, 150, 40, 0.35)");
    gradient.addColorStop(0.72, "rgba(255, 110, 20, 0.1)");
    gradient.addColorStop(1.0, "rgba(255, 80, 0, 0.0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  const softBlurGlowTexture = createSoftBlurGlowTexture();

  const lampIronMat = new THREE.MeshStandardMaterial({
    color: "#1e293b",
    roughness: 0.45,
    metalness: 0.85,
  });
  const lampGoldTrimMat = new THREE.MeshStandardMaterial({
    color: "#eab308",
    roughness: 0.35,
    metalness: 0.9,
  });
  const lampGlassLitMat = new THREE.MeshStandardMaterial({
    color: "#fffde7",
    emissive: "#f59e0b",
    emissiveIntensity: 1.8,
    roughness: 0.7,
    transparent: true,
    opacity: 0.85,
  });
  const lampBlurGlowMat = new THREE.MeshBasicMaterial({
    map: softBlurGlowTexture,
    color: "#ffb74d",
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  const lampGroundPoolMat = new THREE.MeshBasicMaterial({
    map: softBlurGlowTexture,
    color: "#ff9800",
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const geometries = {
    lampPedestal: new THREE.CylinderGeometry(0.24, 0.36, 0.35, 8),
    lampPole: new THREE.CylinderGeometry(0.06, 0.085, 2.4, 8),
    lampCollar: new THREE.TorusGeometry(0.11, 0.025, 6, 12),
    lampArm: new THREE.TorusGeometry(0.26, 0.028, 6, 12, Math.PI),
    lampSphereCup: new THREE.CylinderGeometry(0.22, 0.12, 0.16, 8),
    lampFrostedBulb: new THREE.SphereGeometry(0.18, 12, 10),
    lampBlurPlane: new THREE.PlaneGeometry(2.2, 2.2),
    lampPagodaCap: new THREE.ConeGeometry(0.3, 0.22, 8),
    lampFinial: new THREE.ConeGeometry(0.06, 0.18, 5),
    lampGroundPool: new THREE.PlaneGeometry(4.0, 4.0),
    treeTrunk: new THREE.CylinderGeometry(0.22, 0.34, 2.8, 7),
    pineTrunk: new THREE.CylinderGeometry(0.18, 0.28, 3.4, 7),
    birchTrunk: new THREE.CylinderGeometry(0.14, 0.22, 3.8, 7),
    foliageLarge: new THREE.IcosahedronGeometry(1.55, 1),
    foliageMedium: new THREE.IcosahedronGeometry(1.15, 1),
    foliageSmall: new THREE.IcosahedronGeometry(0.8, 1),
    pineConeLarge: new THREE.ConeGeometry(1.65, 2.2, 7),
    pineConeMedium: new THREE.ConeGeometry(1.25, 1.9, 7),
    pineConeSmall: new THREE.ConeGeometry(0.85, 1.6, 7),
    bush: new THREE.IcosahedronGeometry(0.7, 1),
    rock: new THREE.IcosahedronGeometry(0.55, 1),
    log: new THREE.CylinderGeometry(0.22, 0.27, 2.5, 7),
    logEnd: new THREE.CircleGeometry(0.22, 8),
    desertRock: new THREE.DodecahedronGeometry(1.2, 1),
    desertPillar: new THREE.CylinderGeometry(0.6, 0.9, 4.5, 6),
    volcanicSpire: new THREE.ConeGeometry(0.8, 5.2, 5),
    magmaRock: new THREE.DodecahedronGeometry(1.4, 1),
    iceberg: new THREE.ConeGeometry(1.9, 6.2, 6),
    iceSpire: new THREE.ConeGeometry(0.7, 4.5, 5),
    // Animal geometries
    deerBody: new THREE.CylinderGeometry(0.18, 0.2, 0.9, 8),
    deerHead: new THREE.SphereGeometry(0.14, 8, 6),
    deerLeg: new THREE.CylinderGeometry(0.035, 0.04, 0.55, 5),
    deerAntler: new THREE.ConeGeometry(0.025, 0.35, 4),
    rabbitBody: new THREE.SphereGeometry(0.16, 8, 6),
    rabbitHead: new THREE.SphereGeometry(0.11, 8, 6),
    rabbitEar: new THREE.CylinderGeometry(0.02, 0.035, 0.2, 5),
    rabbitTail: new THREE.SphereGeometry(0.06, 6, 5),
    butterfly: new THREE.PlaneGeometry(0.18, 0.12),
    mushroomCap: new THREE.SphereGeometry(0.15, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    mushroomStem: new THREE.CylinderGeometry(0.04, 0.05, 0.18, 6),
    mushroomSpot: new THREE.CircleGeometry(0.03, 6),
    flowerPetal: new THREE.CircleGeometry(0.06, 6),
    flowerCenter: new THREE.SphereGeometry(0.035, 6, 5),
    flowerStem: new THREE.CylinderGeometry(0.012, 0.015, 0.3, 4),
    lotusPad: new THREE.CircleGeometry(0.38, 10),
    lotusPetal: new THREE.ConeGeometry(0.08, 0.32, 5),
    orchidStem: new THREE.CylinderGeometry(0.015, 0.02, 0.55, 5),
    orchidPetal: new THREE.SphereGeometry(0.08, 6, 6),
    orchidLip: new THREE.ConeGeometry(0.07, 0.16, 5),
    rosePetal: new THREE.SphereGeometry(0.075, 6, 6, 0, Math.PI * 2, 0, Math.PI / 1.8),
    roseCenter: new THREE.SphereGeometry(0.05, 6, 6),
    crystalObelisk: new THREE.CylinderGeometry(0.08, 0.28, 2.8, 6),
    crystalShard: new THREE.ConeGeometry(0.22, 1.4, 5),
    haloTorus: new THREE.TorusGeometry(0.9, 0.04, 8, 24),
    templePillarShaft: new THREE.CylinderGeometry(0.24, 0.28, 3.4, 12),
    templePillarCapital: new THREE.CylinderGeometry(0.38, 0.24, 0.35, 12),
    templePillarBase: new THREE.CylinderGeometry(0.36, 0.42, 0.35, 12),
    relicOctahedron: new THREE.OctahedronGeometry(0.42, 0),
    fountainBasin: new THREE.CylinderGeometry(1.1, 0.85, 0.35, 14),
    fountainPedestal: new THREE.CylinderGeometry(0.3, 0.38, 0.65, 12),
    lotusPondWater: new THREE.CircleGeometry(1.6, 16),
    spiritOrb: new THREE.SphereGeometry(0.12, 8, 8),
    archLintel: new THREE.BoxGeometry(3.6, 0.45, 0.6),
    archPediment: new THREE.ConeGeometry(2.2, 0.85, 4),
    doveBody: new THREE.ConeGeometry(0.1, 0.38, 5),
    doveWing: new THREE.PlaneGeometry(0.35, 0.18),
    brazierBowl: new THREE.CylinderGeometry(0.38, 0.22, 0.3, 10),
    brazierPedestal: new THREE.CylinderGeometry(0.14, 0.22, 0.9, 8),
    pavilionDome: new THREE.SphereGeometry(2.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    rainbowArc: new THREE.TorusGeometry(36, 0.9, 8, 64, Math.PI),
    angelWing: new THREE.ConeGeometry(0.35, 1.6, 4),
    angelBody: new THREE.CylinderGeometry(0.18, 0.28, 1.4, 8),
    angelHead: new THREE.SphereGeometry(0.18, 8, 8),
    armillaryRing: new THREE.TorusGeometry(0.65, 0.035, 8, 24),
    steppingStone: new THREE.CylinderGeometry(0.35, 0.4, 0.06, 8),
    isletBase: new THREE.ConeGeometry(1.2, 1.8, 6),
    isletTop: new THREE.CylinderGeometry(1.3, 1.1, 0.35, 8),
    lyreFrame: new THREE.TorusGeometry(0.45, 0.04, 6, 18, Math.PI),
    cactusTrunk: new THREE.CylinderGeometry(0.24, 0.28, 3.2, 8),
    cactusArmH: new THREE.CylinderGeometry(0.16, 0.16, 0.85, 8),
    cactusArmV: new THREE.CylinderGeometry(0.15, 0.16, 1.3, 8),
    cactusCap: new THREE.SphereGeometry(0.24, 8, 6),
    barrelCactus: new THREE.SphereGeometry(0.48, 8, 8),
    pricklyPad: new THREE.CylinderGeometry(0.35, 0.35, 0.08, 7),
    desertArchRock: new THREE.TorusGeometry(3.5, 0.7, 6, 16, Math.PI),
    desertMesa: new THREE.CylinderGeometry(2.4, 3.2, 2.2, 7),
  };

  /** A spot in the ring of trees, never on top of the board. */
  function forestPosition() {
    let x;
    let z;

    do {
      const angle = random(0, Math.PI * 2);
      const radius = random(11, CONFIG.forestRadius);

      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
    } while (Math.hypot(x, z) < CONFIG.boardSafeRadius);

    return { x, z };
  }

  /** A spot surrounding the clearing near the board edges (radius 11.8 to 16.0). */
  function nearBoardPosition() {
    const angle = random(0, Math.PI * 2);
    const radius = random(11.8, 16.0);
    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
    };
  }

  function createTree() {
    const tree = new THREE.Group();

    const height = random(0.85, 1.35);

    const trunk = new THREE.Mesh(geometries.treeTrunk, barkMaterial);

    trunk.scale.setScalar(height);
    trunk.position.y = 1.4 * height;
    trunk.rotation.z = random(-0.05, 0.05);
    trunk.castShadow = true;
    trunk.receiveShadow = true;

    tree.add(trunk);

    const foliageMaterial = pick(foliageMaterials);

    const bottom = new THREE.Mesh(geometries.foliageLarge, foliageMaterial);
    bottom.position.y = 2.65 * height;
    bottom.scale.set(1.25 * height, 0.9 * height, 1.25 * height);
    bottom.castShadow = true;
    tree.add(bottom);

    const middle = new THREE.Mesh(geometries.foliageMedium, foliageMaterial);
    middle.position.set(random(-0.15, 0.15), 3.75 * height, 0);
    middle.scale.setScalar(1.05 * height);
    middle.castShadow = true;
    tree.add(middle);

    const top = new THREE.Mesh(geometries.foliageSmall, foliageMaterial);
    top.position.set(random(-0.15, 0.15), 4.65 * height, 0);
    top.scale.setScalar(0.9 * height);
    top.castShadow = true;
    tree.add(top);

    tree.scale.setScalar(random(0.85, 1.15));
    tree.rotation.y = random(0, Math.PI * 2);

    tree.userData = {
      swayAmount: random(0.008, 0.018),
      swaySpeed: random(2.5, 5),
      phase: random(0, Math.PI * 2),
    };

    return tree;
  }

  function createBush() {
    const bush = new THREE.Group();

    const material = pick(bushMaterials);

    for (let i = 0, count = randomInt(3, 6); i < count; i++) {
      const mesh = new THREE.Mesh(geometries.bush, material);

      const scale = random(0.5, 1);

      mesh.scale.set(scale * 1.2, scale * random(0.7, 1), scale);
      mesh.position.set(random(-0.5, 0.5), scale * 0.45, random(-0.5, 0.5));
      mesh.castShadow = true;

      bush.add(mesh);
    }

    bush.rotation.y = random(0, Math.PI * 2);

    return bush;
  }

  function createRock() {
    const rock = new THREE.Mesh(geometries.rock, texturedRockMaterial);

    const scale = random(0.3, 1);

    rock.scale.set(
      scale * random(1.1, 1.8),
      scale * random(0.5, 0.9),
      scale * random(0.8, 1.3),
    );

    rock.rotation.set(
      random(0, Math.PI),
      random(0, Math.PI),
      random(0, Math.PI),
    );

    rock.position.y = scale * 0.25;
    rock.castShadow = true;

    return rock;
  }

  function createPineTree() {
    const pine = new THREE.Group();
    const height = random(0.85, 1.4);
    const foliageMaterial = pick(foliageMaterials);

    const trunk = new THREE.Mesh(geometries.pineTrunk, barkMaterial);
    trunk.scale.setScalar(height);
    trunk.position.y = 1.7 * height;
    trunk.rotation.z = random(-0.04, 0.04);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    pine.add(trunk);

    const layer1 = new THREE.Mesh(geometries.pineConeLarge, foliageMaterial);
    layer1.position.y = 2.7 * height;
    layer1.scale.setScalar(height);
    layer1.castShadow = true;
    pine.add(layer1);

    const layer2 = new THREE.Mesh(geometries.pineConeMedium, foliageMaterial);
    layer2.position.y = 3.8 * height;
    layer2.scale.setScalar(height);
    layer2.castShadow = true;
    pine.add(layer2);

    const layer3 = new THREE.Mesh(geometries.pineConeSmall, foliageMaterial);
    layer3.position.y = 4.8 * height;
    layer3.scale.setScalar(height);
    layer3.castShadow = true;
    pine.add(layer3);

    pine.scale.setScalar(random(0.85, 1.25));
    pine.rotation.y = random(0, Math.PI * 2);

    pine.userData = {
      swayAmount: random(0.006, 0.015),
      swaySpeed: random(2.0, 4.5),
      phase: random(0, Math.PI * 2),
    };

    return pine;
  }

  function createBirchTree() {
    const tree = new THREE.Group();
    const height = random(0.9, 1.35);
    const foliageMaterial = pick(foliageMaterials);

    const trunk = new THREE.Mesh(geometries.birchTrunk, barkMaterial);
    trunk.scale.setScalar(height);
    trunk.position.y = 1.9 * height;
    trunk.rotation.z = random(-0.05, 0.05);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(geometries.foliageMedium, foliageMaterial);
      puff.position.set(
        random(-0.35, 0.35) * height,
        (3.4 + i * 0.95) * height,
        random(-0.35, 0.35) * height
      );
      puff.scale.set(
        random(0.8, 1.1) * height,
        random(0.9, 1.2) * height,
        random(0.8, 1.1) * height
      );
      puff.castShadow = true;
      tree.add(puff);
    }

    tree.scale.setScalar(random(0.85, 1.2));
    tree.rotation.y = random(0, Math.PI * 2);

    tree.userData = {
      swayAmount: random(0.008, 0.016),
      swaySpeed: random(2.2, 4.8),
      phase: random(0, Math.PI * 2),
    };

    return tree;
  }

  function createSmallTree() {
    const tree = new THREE.Group();
    const height = random(0.55, 0.9);
    const foliageMaterial = pick(foliageMaterials);

    const trunk = new THREE.Mesh(geometries.treeTrunk, barkMaterial);
    trunk.scale.set(0.65 * height, height, 0.65 * height);
    trunk.position.y = 1.4 * height;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    const foliage = new THREE.Mesh(geometries.foliageMedium, foliageMaterial);
    foliage.position.y = 2.6 * height;
    foliage.scale.setScalar(1.2 * height);
    foliage.castShadow = true;
    tree.add(foliage);

    const top = new THREE.Mesh(geometries.foliageSmall, foliageMaterial);
    top.position.y = 3.4 * height;
    top.scale.setScalar(height);
    top.castShadow = true;
    tree.add(top);

    tree.scale.setScalar(random(0.75, 1.1));
    tree.rotation.y = random(0, Math.PI * 2);

    tree.userData = {
      swayAmount: random(0.005, 0.012),
      swaySpeed: random(2.8, 5.2),
      phase: random(0, Math.PI * 2),
    };

    return tree;
  }

  function createLog() {
    const log = new THREE.Group();

    const body = new THREE.Mesh(geometries.log, barkMaterial);

    body.rotation.z = Math.PI / 2;
    body.castShadow = true;

    log.add(body);

    const end = new THREE.Mesh(geometries.logEnd, getMaterial("#3c2b20"));

    end.rotation.y = Math.PI / 2;
    end.position.x = 1.25;

    log.add(end);

    return log;
  }

  /* —— Animals —— */

  function createDeer() {
    const deer = new THREE.Group();
    const color = pick(PALETTE.deer);
    const mat = getMaterial(color, { roughness: 0.75 });
    const darkMat = getMaterial("#5a4632", { roughness: 0.8 });

    // Body
    const body = new THREE.Mesh(geometries.deerBody, mat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.7;
    body.castShadow = true;
    deer.add(body);

    // Head
    const head = new THREE.Mesh(geometries.deerHead, mat);
    head.position.set(0.55, 0.9, 0);
    head.castShadow = true;
    deer.add(head);

    // Nose
    const noseMat = getMaterial("#2a1e15");
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 4), noseMat);
    nose.position.set(0.68, 0.88, 0);
    deer.add(nose);

    // Legs (4)
    for (const [lx, lz] of [[-0.25, 0.1], [-0.25, -0.1], [0.25, 0.1], [0.25, -0.1]]) {
      const leg = new THREE.Mesh(geometries.deerLeg, darkMat);
      leg.position.set(lx, 0.28, lz);
      leg.castShadow = true;
      deer.add(leg);
    }

    // Antlers
    for (const side of [-1, 1]) {
      const antler = new THREE.Mesh(geometries.deerAntler, darkMat);
      antler.position.set(0.5, 1.1, side * 0.1);
      antler.rotation.z = side * 0.3;
      deer.add(antler);
    }

    // Tail
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), getMaterial("#f4ead1"));
    tail.position.set(-0.48, 0.72, 0);
    deer.add(tail);

    const s = random(0.7, 1.1);
    deer.scale.setScalar(s);

    deer.userData = {
      animalType: "deer",
      bobSpeed: random(1.5, 2.5),
      bobAmount: random(0.015, 0.03),
      phase: random(0, Math.PI * 2),
    };

    return deer;
  }

  function createRabbit() {
    const rabbit = new THREE.Group();
    const color = pick(PALETTE.rabbit);
    const mat = getMaterial(color, { roughness: 0.7 });

    // Body
    const body = new THREE.Mesh(geometries.rabbitBody, mat);
    body.position.y = 0.2;
    body.scale.set(1, 0.85, 0.9);
    body.castShadow = true;
    rabbit.add(body);

    // Head
    const head = new THREE.Mesh(geometries.rabbitHead, mat);
    head.position.set(0.18, 0.32, 0);
    head.castShadow = true;
    rabbit.add(head);

    // Eyes
    const eyeMat = getMaterial("#1a1a1a");
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 5, 4), eyeMat);
      eye.position.set(0.27, 0.35, side * 0.06);
      rabbit.add(eye);
    }

    // Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 3), getMaterial("#e8a0a0"));
    nose.position.set(0.29, 0.31, 0);
    rabbit.add(nose);

    // Ears
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(geometries.rabbitEar, mat);
      ear.position.set(0.14, 0.47, side * 0.05);
      ear.rotation.z = side * 0.15;
      rabbit.add(ear);
    }

    // Tail
    const tail = new THREE.Mesh(geometries.rabbitTail, getMaterial("#f0e8d8"));
    tail.position.set(-0.18, 0.18, 0);
    rabbit.add(tail);

    const s = random(0.65, 1.0);
    rabbit.scale.setScalar(s);

    rabbit.userData = {
      animalType: "rabbit",
      bobSpeed: random(3, 5),
      bobAmount: random(0.02, 0.04),
      phase: random(0, Math.PI * 2),
    };

    return rabbit;
  }

  function createButterfly() {
    const butterfly = new THREE.Group();
    const color = pick(PALETTE.butterfly);
    const mat = new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide,
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });

    // Left wing
    const leftWing = new THREE.Mesh(geometries.butterfly, mat);
    leftWing.position.set(0, 0, 0.08);
    leftWing.rotation.y = 0.3;
    butterfly.add(leftWing);

    // Right wing
    const rightWing = new THREE.Mesh(geometries.butterfly, mat);
    rightWing.position.set(0, 0, -0.08);
    rightWing.rotation.y = -0.3;
    butterfly.add(rightWing);

    // Body
    const bodyMat = getMaterial("#2a2218");
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 4), bodyMat);
    body.rotation.z = Math.PI / 2;
    butterfly.add(body);

    butterfly.userData = {
      animalType: "butterfly",
      flySpeed: random(1.5, 3.5),
      flyRadius: random(0.8, 2.5),
      flyHeight: random(1.5, 5),
      wingSpeed: random(8, 14),
      phase: random(0, Math.PI * 2),
      originX: 0,
      originZ: 0,
      leftWing,
      rightWing,
    };

    return butterfly;
  }

  function createMushroom() {
    const mushroom = new THREE.Group();
    const color = pick(PALETTE.mushroom);

    const capMat = getMaterial(color, { roughness: 0.5 });
    const cap = new THREE.Mesh(geometries.mushroomCap, capMat);
    cap.position.y = 0.18;
    cap.castShadow = true;
    mushroom.add(cap);

    const stemMat = getMaterial("#f0e8d0", { roughness: 0.6 });
    const stem = new THREE.Mesh(geometries.mushroomStem, stemMat);
    stem.position.y = 0.09;
    mushroom.add(stem);

    // White spots on cap
    const spotMat = getMaterial(PALETTE.mushroomSpot, { roughness: 0.4 });
    for (let i = 0; i < randomInt(2, 5); i++) {
      const spot = new THREE.Mesh(geometries.mushroomSpot, spotMat);
      const a = random(0, Math.PI * 2);
      const r = random(0.04, 0.11);
      spot.position.set(
        Math.cos(a) * r,
        0.22 + random(0.02, 0.08),
        Math.sin(a) * r,
      );
      spot.rotation.x = -Math.PI / 2 + random(-0.3, 0.3);
      spot.rotation.z = random(0, Math.PI);
      mushroom.add(spot);
    }

    const s = random(0.5, 1.3);
    mushroom.scale.setScalar(s);

    return mushroom;
  }

  function createFlower() {
    const flower = new THREE.Group();
    const color = pick(PALETTE.flower);

    const stemMat = getMaterial("#4a6840", { roughness: 0.7 });
    const stem = new THREE.Mesh(geometries.flowerStem, stemMat);
    stem.position.y = 0.15;
    flower.add(stem);

    const petalMat = getMaterial(color, { roughness: 0.45 });
    const petalCount = randomInt(4, 7);
    for (let i = 0; i < petalCount; i++) {
      const petal = new THREE.Mesh(geometries.flowerPetal, petalMat);
      const angle = (i / petalCount) * Math.PI * 2;
      petal.position.set(
        Math.cos(angle) * 0.055,
        0.32,
        Math.sin(angle) * 0.055,
      );
      petal.rotation.x = -Math.PI / 2 + 0.4;
      petal.rotation.z = angle;
      flower.add(petal);
    }

    const centerMat = getMaterial("#f8e840", { roughness: 0.35 });
    const center = new THREE.Mesh(geometries.flowerCenter, centerMat);
    center.position.y = 0.32;
    flower.add(center);

    const s = random(0.6, 1.2);
    flower.scale.setScalar(s);

    return flower;
  }

  const HEAVEN_FLOWER_PALETTE = {
    petals: [
      "#ff8ec3",
      "#ffa6ea",
      "#6ee7b7",
      "#38bdf8",
      "#c084fc",
      "#fde047",
      "#f472b6",
      "#a78bfa",
      "#ffffff",
      "#fda4af",
      "#7dd3fc",
    ],
    centers: ["#fef08a", "#fef9c3", "#a7f3d0", "#bae6fd", "#fbcfe8"],
    stems: ["#34d399", "#10b981", "#6ee7b7", "#059669"],
  };

  function createHeavenFlower({ isGlowing = true } = {}) {
    const flower = new THREE.Group();
    const petalColor = pick(HEAVEN_FLOWER_PALETTE.petals);
    const centerColor = pick(HEAVEN_FLOWER_PALETTE.centers);
    const stemColor = pick(HEAVEN_FLOWER_PALETTE.stems);

    const stemMat = getMaterial(stemColor, { roughness: 0.45, metalness: 0.1 });
    const stem = new THREE.Mesh(geometries.flowerStem, stemMat);
    stem.position.y = 0.14;
    flower.add(stem);

    const petalMat = getMaterial(petalColor, {
      roughness: 0.35,
      metalness: 0.12,
      emissive: petalColor,
      emissiveIntensity: isGlowing ? 0.38 : 0.18,
    });

    const petalCount = randomInt(5, 8);
    for (let i = 0; i < petalCount; i++) {
      const petal = new THREE.Mesh(geometries.flowerPetal, petalMat);
      const angle = (i / petalCount) * Math.PI * 2;
      petal.position.set(
        Math.cos(angle) * 0.065,
        0.28,
        Math.sin(angle) * 0.065
      );
      petal.rotation.x = -Math.PI / 2 + 0.35;
      petal.rotation.z = angle;
      petal.scale.set(1.15, 1.3, 1.15);
      flower.add(petal);
    }

    const centerMat = getMaterial(centerColor, {
      roughness: 0.2,
      emissive: centerColor,
      emissiveIntensity: 0.85,
    });
    const center = new THREE.Mesh(geometries.flowerCenter, centerMat);
    center.position.y = 0.29;
    center.scale.setScalar(1.25);
    flower.add(center);

    const s = random(0.28, 0.48);
    flower.scale.setScalar(s);
    flower.rotation.y = random(0, Math.PI * 2);

    flower.userData = {
      isHeavenFlower: true,
      baseScale: s,
      pulsePhase: random(0, Math.PI * 2),
      swaySpeed: random(1.8, 3.2),
      swayAmount: random(0.04, 0.08),
    };

    return flower;
  }

  /* ——————————————————————————————————
     Heaven Realm Flora: Lotuses, Orchids, Roses & Blossom Trees
  —————————————————————————————————— */

  const LOTUS_PALETTE = ["#ff70a6", "#ff9ec6", "#ffb8df", "#ffffff", "#fce7f3", "#f472b6"];
  const ORCHID_PALETTE = ["#d946ef", "#c084fc", "#e879f9", "#a855f7", "#f43f5e"];
  const ROSE_PALETTE = ["#f43f5e", "#fb7185", "#fda4af", "#e11d48", "#fbbf24", "#ffffff"];
  const BLOSSOM_PALETTE = ["#fbcfe8", "#f472b6", "#fce7f3", "#fed7aa", "#e9d5ff"];

  function createLotusFlower() {
    const lotus = new THREE.Group();
    const petalColor = pick(LOTUS_PALETTE);

    // Green lilypad base
    const padMat = getMaterial("#059669", { roughness: 0.6, metalness: 0.05 });
    const pad = new THREE.Mesh(geometries.lotusPad, padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.03;
    pad.receiveShadow = true;
    lotus.add(pad);

    // Outer & inner petal rings
    const petalMat = getMaterial(petalColor, {
      roughness: 0.3,
      metalness: 0.12,
      emissive: petalColor,
      emissiveIntensity: 0.35,
    });

    const petalCount = 9;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const petal = new THREE.Mesh(geometries.lotusPetal, petalMat);
      petal.position.set(
        Math.cos(angle) * 0.14,
        0.12,
        Math.sin(angle) * 0.14
      );
      petal.rotation.x = 0.45;
      petal.rotation.y = angle;
      petal.scale.set(1.2, 1.1, 1.2);
      petal.castShadow = true;
      lotus.add(petal);
    }

    // Inner glowing golden stamen
    const centerMat = getMaterial("#ffd166", {
      roughness: 0.2,
      emissive: "#fbbf24",
      emissiveIntensity: 0.95,
    });
    const center = new THREE.Mesh(geometries.flowerCenter, centerMat);
    center.position.y = 0.15;
    center.scale.setScalar(1.6);
    lotus.add(center);

    const s = random(0.32, 0.55);
    lotus.scale.setScalar(s);
    lotus.rotation.y = random(0, Math.PI * 2);

    lotus.userData = {
      isHeavenFlower: true,
      baseScale: s,
      pulsePhase: random(0, Math.PI * 2),
      swaySpeed: random(1.5, 2.8),
      swayAmount: random(0.02, 0.05),
    };

    return lotus;
  }

  function createOrchidFlower() {
    const orchid = new THREE.Group();
    const petalColor = pick(ORCHID_PALETTE);

    // Slender arching stem
    const stemMat = getMaterial("#10b981", { roughness: 0.5 });
    const stem = new THREE.Mesh(geometries.orchidStem, stemMat);
    stem.position.y = 0.25;
    stem.rotation.z = random(-0.15, 0.15);
    orchid.add(stem);

    // 3 outer petals + 2 upper wings
    const petalMat = getMaterial(petalColor, {
      roughness: 0.35,
      emissive: petalColor,
      emissiveIntensity: 0.4,
    });

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(geometries.orchidPetal, petalMat);
      petal.position.set(
        Math.cos(angle) * 0.11,
        0.48 + Math.sin(angle) * 0.05,
        Math.sin(angle) * 0.11
      );
      petal.scale.set(0.9, 1.3, 0.5);
      petal.rotation.z = angle;
      petal.castShadow = true;
      orchid.add(petal);
    }

    // Lower orchid lip (labellum)
    const lipMat = getMaterial("#fda4af", {
      roughness: 0.25,
      emissive: "#f43f5e",
      emissiveIntensity: 0.7,
    });
    const lip = new THREE.Mesh(geometries.orchidLip, lipMat);
    lip.position.set(0, 0.42, 0.09);
    lip.rotation.x = Math.PI / 3;
    orchid.add(lip);

    const s = random(0.30, 0.52);
    orchid.scale.setScalar(s);
    orchid.rotation.y = random(0, Math.PI * 2);

    orchid.userData = {
      isHeavenFlower: true,
      baseScale: s,
      pulsePhase: random(0, Math.PI * 2),
      swaySpeed: random(2.0, 3.8),
      swayAmount: random(0.05, 0.1),
    };

    return orchid;
  }

  function createRoseFlower() {
    const rose = new THREE.Group();
    const petalColor = pick(ROSE_PALETTE);

    // Stem
    const stemMat = getMaterial("#047857", { roughness: 0.6 });
    const stem = new THREE.Mesh(geometries.flowerStem, stemMat);
    stem.position.y = 0.16;
    rose.add(stem);

    // Spiral overlapping rose petals
    const petalMat = getMaterial(petalColor, {
      roughness: 0.38,
      metalness: 0.08,
      emissive: petalColor,
      emissiveIntensity: 0.3,
    });

    const petalRings = 3;
    for (let r = 0; r < petalRings; r++) {
      const count = 4 + r * 2;
      const radius = 0.05 + r * 0.045;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + r * 0.5;
        const petal = new THREE.Mesh(geometries.rosePetal, petalMat);
        petal.position.set(
          Math.cos(angle) * radius,
          0.28 - r * 0.02,
          Math.sin(angle) * radius
        );
        petal.rotation.x = -Math.PI / 2 + 0.35 + r * 0.15;
        petal.rotation.z = angle;
        petal.scale.set(0.9 + r * 0.2, 1.0 + r * 0.2, 0.9 + r * 0.2);
        petal.castShadow = true;
        rose.add(petal);
      }
    }

    // Rose core
    const centerMat = getMaterial(petalColor, { roughness: 0.2, emissive: petalColor, emissiveIntensity: 0.6 });
    const center = new THREE.Mesh(geometries.roseCenter, centerMat);
    center.position.y = 0.29;
    rose.add(center);

    const s = random(0.28, 0.48);
    rose.scale.setScalar(s);
    rose.rotation.y = random(0, Math.PI * 2);

    rose.userData = {
      isHeavenFlower: true,
      baseScale: s,
      pulsePhase: random(0, Math.PI * 2),
      swaySpeed: random(1.8, 3.0),
      swayAmount: random(0.03, 0.07),
    };

    return rose;
  }

  const marbleMat = new THREE.MeshStandardMaterial({
    color: "#fdfbf7",
    roughness: 0.18,
    metalness: 0.25,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: "#fde047",
    roughness: 0.2,
    metalness: 0.85,
    emissive: "#eab308",
    emissiveIntensity: 0.4,
  });

  function createCelestialTemplePillar() {
    const pillar = new THREE.Group();
    const height = random(0.85, 1.25);

    // Base Plinth
    const base = new THREE.Mesh(geometries.templePillarBase, marbleMat);
    base.position.y = 0.18 * height;
    base.scale.setScalar(height);
    base.castShadow = true;
    pillar.add(base);

    // Gold Base Ring
    const goldRing1 = new THREE.Mesh(geometries.templePillarBase, goldTrimMat);
    goldRing1.position.y = 0.36 * height;
    goldRing1.scale.set(0.95 * height, 0.15 * height, 0.95 * height);
    pillar.add(goldRing1);

    // Fluted Column Shaft
    const shaft = new THREE.Mesh(geometries.templePillarShaft, marbleMat);
    shaft.position.y = 2.05 * height;
    shaft.scale.setScalar(height);
    shaft.castShadow = true;
    pillar.add(shaft);

    // Gold Capital Ring
    const goldRing2 = new THREE.Mesh(geometries.templePillarBase, goldTrimMat);
    goldRing2.position.y = 3.75 * height;
    goldRing2.scale.set(0.95 * height, 0.15 * height, 0.95 * height);
    pillar.add(goldRing2);

    // Capital Top
    const capital = new THREE.Mesh(geometries.templePillarCapital, marbleMat);
    capital.position.y = 3.92 * height;
    capital.scale.setScalar(height);
    capital.castShadow = true;
    pillar.add(capital);

    // Optional Glowing Apex Crystal
    if (Math.random() < 0.6) {
      const apexColor = pick(["#38bdf8", "#f472b6", "#fde047", "#67e8f9"]);
      const apexMat = new THREE.MeshStandardMaterial({
        color: apexColor,
        roughness: 0.1,
        emissive: apexColor,
        emissiveIntensity: 0.9,
      });
      const apex = new THREE.Mesh(geometries.crystalShard, apexMat);
      apex.position.y = 4.45 * height;
      apex.scale.setScalar(0.7 * height);
      pillar.add(apex);
    }

    pillar.rotation.y = random(0, Math.PI * 2);
    return pillar;
  }

  function createLevitatingStarRelic() {
    const relic = new THREE.Group();

    // Marble Pedestal
    const base = new THREE.Mesh(geometries.templePillarBase, marbleMat);
    base.position.y = 0.2;
    base.scale.set(0.8, 0.6, 0.8);
    base.castShadow = true;
    relic.add(base);

    const pillar = new THREE.Mesh(geometries.templePillarShaft, marbleMat);
    pillar.position.y = 0.9;
    pillar.scale.set(0.7, 0.35, 0.7);
    relic.add(pillar);

    // Gold pedestal bowl
    const bowl = new THREE.Mesh(geometries.templePillarCapital, goldTrimMat);
    bowl.position.y = 1.5;
    bowl.scale.set(0.75, 0.4, 0.75);
    relic.add(bowl);

    // Levitating Holy Polyhedron Star
    const relicColor = pick(["#38bdf8", "#f472b6", "#fde047", "#a78bfa", "#67e8f9"]);
    const relicMat = new THREE.MeshStandardMaterial({
      color: relicColor,
      roughness: 0.1,
      metalness: 0.3,
      emissive: relicColor,
      emissiveIntensity: 0.85,
    });
    const starGeo = Math.random() < 0.5 ? geometries.relicOctahedron : geometries.relicDodecahedron;
    const star = new THREE.Mesh(starGeo, relicMat);
    star.position.y = 2.2;
    relic.add(star);

    // Rotating Energy Ring
    const haloMat = new THREE.MeshBasicMaterial({ color: "#fef08a", transparent: true, opacity: 0.8 });
    const halo = new THREE.Mesh(geometries.haloTorus, haloMat);
    halo.position.y = 2.2;
    halo.scale.setScalar(0.42);
    relic.add(halo);

    relic.userData = {
      isStarRelic: true,
      star,
      halo,
      baseY: 2.2,
      spinSpeed: random(1.2, 2.5),
      floatSpeed: random(1.5, 2.8),
      phase: random(0, Math.PI * 2),
    };

    return relic;
  }

  function createCelestialFountain() {
    const fountain = new THREE.Group();

    // Base & Pedestal
    const base = new THREE.Mesh(geometries.fountainPedestal, marbleMat);
    base.position.y = 0.32;
    base.castShadow = true;
    fountain.add(base);

    // Large Lower Basin
    const basin = new THREE.Mesh(geometries.fountainBasin, marbleMat);
    basin.position.y = 0.75;
    basin.castShadow = true;
    fountain.add(basin);

    // Gold Rim
    const goldRim = new THREE.Mesh(geometries.fountainBasin, goldTrimMat);
    goldRim.position.y = 0.92;
    goldRim.scale.set(1.02, 0.08, 1.02);
    fountain.add(goldRim);

    // Holy Azure Water Disk
    const waterMat = new THREE.MeshStandardMaterial({
      color: "#38bdf8",
      roughness: 0.08,
      metalness: 0.3,
      emissive: "#0284c7",
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.88,
    });
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.95, 14), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.88;
    fountain.add(water);

    // Center Lotus
    const centerLotus = createLotusFlower();
    centerLotus.position.set(0, 0.89, 0);
    centerLotus.scale.setScalar(0.45);
    fountain.add(centerLotus);

    const s = random(0.8, 1.2);
    fountain.scale.setScalar(s);

    fountain.userData = {
      isFountain: true,
      water,
      phase: random(0, Math.PI * 2),
    };

    return fountain;
  }

  function createLotusPond() {
    const pond = new THREE.Group();

    // Water Surface
    const waterMat = new THREE.MeshStandardMaterial({
      color: "#0284c7",
      roughness: 0.06,
      metalness: 0.4,
      emissive: "#0369a1",
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.85,
    });
    const water = new THREE.Mesh(geometries.lotusPondWater, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.02;
    water.receiveShadow = true;
    pond.add(water);

    // Marble Perimeter Stones
    const stoneCount = 12;
    for (let i = 0; i < stoneCount; i++) {
      const angle = (i / stoneCount) * Math.PI * 2;
      const stone = new THREE.Mesh(geometries.rock, marbleMat);
      stone.position.set(
        Math.cos(angle) * 1.55,
        0.05,
        Math.sin(angle) * 1.55
      );
      stone.scale.set(0.35, 0.22, 0.35);
      stone.castShadow = true;
      pond.add(stone);
    }

    // 3 Floating Sacred Lotuses
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + random(-0.3, 0.3);
      const dist = random(0.4, 1.0);
      const lotus = createLotusFlower();
      lotus.position.set(Math.cos(angle) * dist, 0.03, Math.sin(angle) * dist);
      lotus.scale.setScalar(random(0.35, 0.5));
      pond.add(lotus);
    }

    return pond;
  }

  function createDivineSpiritOrb() {
    const orb = new THREE.Group();
    const color = pick(["#fef08a", "#67e8f9", "#f472b6", "#a78bfa"]);

    const orbMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geometries.spiritOrb, orbMat);
    orb.add(mesh);

    orb.userData = {
      isSpiritOrb: true,
      originX: 0,
      originZ: 0,
      orbitRadius: random(6.5, 22),
      orbitSpeed: random(0.4, 1.1),
      orbitAngle: random(0, Math.PI * 2),
      baseY: random(1.2, 3.5),
      bobSpeed: random(1.5, 3.0),
      phase: random(0, Math.PI * 2),
    };

    return orb;
  }

  function createCelestialArch() {
    const arch = new THREE.Group();

    // Twin Marble Pillars (Left & Right)
    const pillarLeft = createCelestialTemplePillar();
    pillarLeft.position.set(-1.4, 0, 0);
    arch.add(pillarLeft);

    const pillarRight = createCelestialTemplePillar();
    pillarRight.position.set(1.4, 0, 0);
    arch.add(pillarRight);

    // Architrave Lintel Beam
    const lintel = new THREE.Mesh(geometries.archLintel, marbleMat);
    lintel.position.set(0, 4.3, 0);
    lintel.castShadow = true;
    arch.add(lintel);

    // Gold Trim Lintel Plate
    const goldPlate = new THREE.Mesh(geometries.archLintel, goldTrimMat);
    goldPlate.position.set(0, 4.58, 0);
    goldPlate.scale.set(1.02, 0.2, 1.02);
    arch.add(goldPlate);

    // Triangular Pediment
    const pediment = new THREE.Mesh(geometries.archPediment, marbleMat);
    pediment.position.set(0, 5.05, 0);
    pediment.rotation.y = Math.PI / 4;
    pediment.scale.set(1.15, 0.9, 0.45);
    pediment.castShadow = true;
    arch.add(pediment);

    // Radiant Golden Sun Crest in Pediment
    const crestMat = new THREE.MeshBasicMaterial({ color: "#fef08a" });
    const sunCrest = new THREE.Mesh(geometries.haloTorus, crestMat);
    sunCrest.position.set(0, 5.05, 0.25);
    sunCrest.scale.setScalar(0.45);
    arch.add(sunCrest);

    return arch;
  }

  function createCelestialDove() {
    const dove = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.3,
      emissive: "#f0fdf4",
      emissiveIntensity: 0.3,
    });
    const goldBeakMat = new THREE.MeshBasicMaterial({ color: "#fbbf24" });

    // Body
    const body = new THREE.Mesh(geometries.doveBody, whiteMat);
    body.rotation.x = Math.PI / 2;
    dove.add(body);

    // Beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 4), goldBeakMat);
    beak.position.set(0, 0, 0.22);
    beak.rotation.x = Math.PI / 2;
    dove.add(beak);

    // Wings
    const leftWing = new THREE.Mesh(geometries.doveWing, whiteMat);
    leftWing.position.set(-0.2, 0.05, 0);
    leftWing.rotation.x = Math.PI / 2;
    leftWing.rotation.z = -0.3;
    dove.add(leftWing);

    const rightWing = new THREE.Mesh(geometries.doveWing, whiteMat);
    rightWing.position.set(0.2, 0.05, 0);
    rightWing.rotation.x = Math.PI / 2;
    rightWing.rotation.z = 0.3;
    dove.add(rightWing);

    dove.userData = {
      isDove: true,
      leftWing,
      rightWing,
      orbitRadius: random(13, 26),
      orbitSpeed: random(0.5, 0.9),
      orbitAngle: random(0, Math.PI * 2),
      flightHeight: random(5.5, 9.5),
      flapSpeed: random(12, 18),
      phase: random(0, Math.PI * 2),
    };

    return dove;
  }

  function createCelestialBrazier() {
    const brazier = new THREE.Group();

    const ped = new THREE.Mesh(geometries.brazierPedestal, marbleMat);
    ped.position.y = 0.45;
    ped.castShadow = true;
    brazier.add(ped);

    const bowl = new THREE.Mesh(geometries.brazierBowl, goldTrimMat);
    bowl.position.y = 0.95;
    bowl.castShadow = true;
    brazier.add(bowl);

    // Holy Flame Core
    const flameColor = pick(["#38bdf8", "#fde047", "#f472b6"]);
    const flameMat = new THREE.MeshBasicMaterial({ color: flameColor });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 6), flameMat);
    flame.position.y = 1.25;
    brazier.add(flame);

    const light = new THREE.PointLight(flameColor, 2.2, 8);
    light.position.y = 1.35;
    brazier.add(light);

    brazier.userData = {
      isBrazier: true,
      flame,
      light,
      phase: random(0, Math.PI * 2),
    };

    return brazier;
  }

  function createCelestialPavilion() {
    const pav = new THREE.Group();

    // 6 Columns in a Hexagon
    const colCount = 6;
    const pRadius = 2.4;
    for (let i = 0; i < colCount; i++) {
      const angle = (i / colCount) * Math.PI * 2;
      const col = createCelestialTemplePillar();
      col.position.set(Math.cos(angle) * pRadius, 0, Math.sin(angle) * pRadius);
      col.scale.setScalar(0.75);
      pav.add(col);
    }

    // Dome Roof
    const domeMat = new THREE.MeshStandardMaterial({
      color: "#fde047",
      roughness: 0.25,
      metalness: 0.75,
      emissive: "#eab308",
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
    });
    const dome = new THREE.Mesh(geometries.pavilionDome, domeMat);
    dome.position.y = 3.2;
    dome.scale.set(1.2, 0.75, 1.2);
    dome.castShadow = true;
    pav.add(dome);

    // Apex Spire
    const spire = new THREE.Mesh(geometries.crystalShard, goldTrimMat);
    spire.position.y = 4.3;
    spire.scale.set(0.6, 1.2, 0.6);
    pav.add(spire);

    return pav;
  }

  function createPrismRainbowArc() {
    const rainbowGroup = new THREE.Group();
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7"];

    colors.forEach((col, idx) => {
      const arcMat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(34 + idx * 0.45, 0.22, 6, 48, Math.PI),
        arcMat
      );
      arc.rotation.z = Math.PI;
      rainbowGroup.add(arc);
    });

    rainbowGroup.position.set(0, 0, -22);
    rainbowGroup.rotation.y = -0.25;
    return rainbowGroup;
  }

  function createAngelicStatue() {
    const statue = new THREE.Group();

    // Marble Pedestal
    const base = new THREE.Mesh(geometries.templePillarBase, marbleMat);
    base.position.y = 0.2;
    base.scale.set(0.9, 0.6, 0.9);
    base.castShadow = true;
    statue.add(base);

    // Robed Body
    const body = new THREE.Mesh(geometries.angelBody, marbleMat);
    body.position.y = 1.1;
    body.castShadow = true;
    statue.add(body);

    // Serene Head
    const head = new THREE.Mesh(geometries.angelHead, marbleMat);
    head.position.y = 1.95;
    head.castShadow = true;
    statue.add(head);

    // Golden Halo
    const haloMat = new THREE.MeshBasicMaterial({ color: "#fef08a", transparent: true, opacity: 0.9 });
    const halo = new THREE.Mesh(geometries.haloTorus, haloMat);
    halo.position.set(0, 2.35, 0.05);
    halo.rotation.x = Math.PI / 4;
    halo.scale.setScalar(0.32);
    statue.add(halo);

    // Arched Wings (Left & Right)
    const leftWing = new THREE.Mesh(geometries.angelWing, marbleMat);
    leftWing.position.set(-0.55, 1.4, -0.2);
    leftWing.rotation.set(-0.2, -0.4, 0.45);
    leftWing.scale.set(0.65, 1.0, 0.65);
    leftWing.castShadow = true;
    statue.add(leftWing);

    const rightWing = new THREE.Mesh(geometries.angelWing, marbleMat);
    rightWing.position.set(0.55, 1.4, -0.2);
    rightWing.rotation.set(-0.2, 0.4, -0.45);
    rightWing.scale.set(0.65, 1.0, 0.65);
    rightWing.castShadow = true;
    statue.add(rightWing);

    const s = random(0.85, 1.25);
    statue.scale.setScalar(s);
    return statue;
  }

  function createArmillarySphereShrine() {
    const shrine = new THREE.Group();

    // Marble Plinth
    const base = new THREE.Mesh(geometries.templePillarBase, marbleMat);
    base.position.y = 0.2;
    base.scale.set(0.8, 0.5, 0.8);
    base.castShadow = true;
    shrine.add(base);

    const shaft = new THREE.Mesh(geometries.templePillarShaft, marbleMat);
    shaft.position.y = 0.95;
    shaft.scale.set(0.6, 0.4, 0.6);
    shrine.add(shaft);

    const bowl = new THREE.Mesh(geometries.templePillarCapital, goldTrimMat);
    bowl.position.y = 1.6;
    bowl.scale.set(0.7, 0.35, 0.7);
    shrine.add(bowl);

    // 3 Interlocking Rotating Golden Armillary Rings
    const ring1 = new THREE.Mesh(geometries.armillaryRing, goldTrimMat);
    ring1.position.y = 2.4;
    shrine.add(ring1);

    const ring2 = new THREE.Mesh(geometries.armillaryRing, goldTrimMat);
    ring2.position.y = 2.4;
    ring2.rotation.x = Math.PI / 2;
    shrine.add(ring2);

    const ring3 = new THREE.Mesh(geometries.armillaryRing, goldTrimMat);
    ring3.position.y = 2.4;
    ring3.rotation.y = Math.PI / 4;
    shrine.add(ring3);

    // Glowing Central Core Star
    const starMat = new THREE.MeshStandardMaterial({
      color: "#fde047",
      roughness: 0.1,
      emissive: "#eab308",
      emissiveIntensity: 0.95,
    });
    const star = new THREE.Mesh(geometries.spiritOrb, starMat);
    star.position.y = 2.4;
    star.scale.setScalar(1.8);
    shrine.add(star);

    shrine.userData = {
      isArmillary: true,
      ring1,
      ring2,
      ring3,
      star,
      phase: random(0, Math.PI * 2),
    };

    return shrine;
  }

  function createFloatingCrystalIslet() {
    const islet = new THREE.Group();

    // Inverted Floating Rock Base
    const rockMat = new THREE.MeshStandardMaterial({
      color: "#fdfbf7",
      roughness: 0.3,
      metalness: 0.15,
    });
    const rock = new THREE.Mesh(geometries.isletBase, rockMat);
    rock.rotation.x = Math.PI;
    rock.position.y = -0.7;
    rock.castShadow = true;
    islet.add(rock);

    // Grassy Pearl Top Cap
    const grassMat = new THREE.MeshStandardMaterial({
      color: "#a7f3d0",
      roughness: 0.4,
      metalness: 0.05,
    });
    const top = new THREE.Mesh(geometries.isletTop, grassMat);
    top.position.y = 0.15;
    top.castShadow = true;
    islet.add(top);

    // Perched Crystal Cluster
    const crystal = createCelestialCrystal();
    crystal.position.set(0, 0.3, 0);
    crystal.scale.setScalar(0.65);
    islet.add(crystal);

    // Little Lotus Blossom
    const lotus = createLotusFlower();
    lotus.position.set(0.45, 0.32, 0.25);
    lotus.scale.setScalar(0.35);
    islet.add(lotus);

    const s = random(0.85, 1.35);
    islet.scale.setScalar(s);

    islet.userData = {
      isFloatingIslet: true,
      baseY: random(3.0, 5.5),
      bobSpeed: random(0.7, 1.4),
      tiltSpeed: random(0.5, 1.0),
      phase: random(0, Math.PI * 2),
    };

    return islet;
  }

  function createCelestialLyre() {
    const lyre = new THREE.Group();

    const base = new THREE.Mesh(geometries.templePillarBase, marbleMat);
    base.position.y = 0.2;
    base.scale.set(0.7, 0.5, 0.7);
    base.castShadow = true;
    lyre.add(base);

    // Gold Lyre Frame
    const frame = new THREE.Mesh(geometries.lyreFrame, goldTrimMat);
    frame.position.set(0, 0.9, 0);
    frame.rotation.z = Math.PI;
    lyre.add(frame);

    const crossbar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.85, 8),
      goldTrimMat
    );
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 1.35, 0);
    lyre.add(crossbar);

    // Glowing Harp Strings
    const stringMat = new THREE.MeshBasicMaterial({ color: "#fef08a", transparent: true, opacity: 0.85 });
    for (let i = -3; i <= 3; i++) {
      const str = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.8, 4),
        stringMat
      );
      str.position.set(i * 0.08, 0.95, 0);
      lyre.add(str);
    }

    return lyre;
  }

  function createMarbleSteppingPath(startX, startZ, endX, endZ, steps = 5) {
    const group = new THREE.Group();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = startX + (endX - startX) * t;
      const z = startZ + (endZ - startZ) * t;
      const stone = new THREE.Mesh(geometries.steppingStone, marbleMat);
      stone.position.set(x + random(-0.06, 0.06), 0.02, z + random(-0.06, 0.06));
      stone.scale.setScalar(random(0.85, 1.15));
      stone.receiveShadow = true;
      group.add(stone);
    }
    return group;
  }

  /* —— Desert Mode: Saguaro Cacti, Barrel Cacti, Prickly Pears & Sandstone Formations —— */

  function createSaguaroCactus() {
    const cactus = new THREE.Group();
    const cMat = Math.random() < 0.5 ? cactusMat1 : cactusMat2;
    const height = random(0.85, 1.35);

    // Main Trunk
    const trunk = new THREE.Mesh(geometries.cactusTrunk, cMat);
    trunk.position.y = 1.6 * height;
    trunk.scale.set(height, height, height);
    trunk.castShadow = true;
    cactus.add(trunk);

    const topCap = new THREE.Mesh(geometries.cactusCap, cMat);
    topCap.position.y = 3.2 * height;
    topCap.scale.setScalar(height);
    topCap.castShadow = true;
    cactus.add(topCap);

    // Top Bloom Flower
    if (Math.random() < 0.65) {
      const flower = new THREE.Mesh(geometries.roseCenter, cactusFlowerMat);
      flower.position.y = 3.42 * height;
      flower.scale.setScalar(1.2 * height);
      cactus.add(flower);
    }

    // Arms
    const armCount = Math.floor(random(1, 3.5));
    for (let i = 0; i < armCount; i++) {
      const armGroup = new THREE.Group();
      const armSide = i % 2 === 0 ? 1 : -1;
      const armY = (1.4 + i * 0.75) * height;

      // Horizontal joint
      const hJoint = new THREE.Mesh(geometries.cactusArmH, cMat);
      hJoint.rotation.z = Math.PI / 2;
      hJoint.position.x = armSide * 0.45 * height;
      hJoint.scale.set(height, height, height);
      hJoint.castShadow = true;
      armGroup.add(hJoint);

      // Vertical arm
      const vArm = new THREE.Mesh(geometries.cactusArmV, cMat);
      vArm.position.set(armSide * 0.85 * height, 0.65 * height, 0);
      vArm.scale.set(height, height, height);
      vArm.castShadow = true;
      armGroup.add(vArm);

      const armCap = new THREE.Mesh(geometries.cactusCap, cMat);
      armCap.position.set(armSide * 0.85 * height, 1.3 * height, 0);
      armCap.scale.setScalar(0.7 * height);
      armCap.castShadow = true;
      armGroup.add(armCap);

      // Arm flower
      if (Math.random() < 0.5) {
        const aFlower = new THREE.Mesh(geometries.roseCenter, cactusFlowerMat);
        aFlower.position.set(armSide * 0.85 * height, 1.45 * height, 0);
        aFlower.scale.setScalar(0.9 * height);
        armGroup.add(aFlower);
      }

      armGroup.position.y = armY;
      armGroup.rotation.y = (i * Math.PI) / 3 + random(-0.2, 0.2);
      cactus.add(armGroup);
    }

    const s = random(0.85, 1.25);
    cactus.scale.setScalar(s);
    cactus.rotation.y = random(0, Math.PI * 2);

    cactus.userData = {
      swayAmount: random(0.004, 0.009),
      swaySpeed: random(1.8, 3.2),
      phase: random(0, Math.PI * 2),
    };

    return cactus;
  }

  function createPricklyPearCactus() {
    const cluster = new THREE.Group();
    const cMat = Math.random() < 0.5 ? cactusMat1 : cactusMat2;
    const padCount = randomInt(4, 7);

    for (let i = 0; i < padCount; i++) {
      const pad = new THREE.Mesh(geometries.pricklyPad, cMat);
      const angle = (i / padCount) * Math.PI * 2 + random(-0.3, 0.3);
      const dist = i === 0 ? 0 : random(0.25, 0.65);
      const height = i === 0 ? 0.35 : random(0.3, 0.85);

      pad.position.set(Math.cos(angle) * dist, height, Math.sin(angle) * dist);
      pad.rotation.set(random(-0.3, 0.3), random(0, Math.PI), random(-0.3, 0.3));
      pad.scale.set(random(0.7, 1.1), random(0.8, 1.3), random(0.7, 1.1));
      pad.castShadow = true;
      cluster.add(pad);

      if (Math.random() < 0.6) {
        const flower = new THREE.Mesh(geometries.roseCenter, cactusFlowerMat);
        flower.position.set(
          pad.position.x + random(-0.1, 0.1),
          pad.position.y + 0.35,
          pad.position.z + random(-0.1, 0.1)
        );
        flower.scale.setScalar(0.75);
        cluster.add(flower);
      }
    }

    const s = random(0.7, 1.15);
    cluster.scale.setScalar(s);
    return cluster;
  }

  function createBarrelCactus() {
    const barrel = new THREE.Group();
    const cMat = cactusMat2;

    const mesh = new THREE.Mesh(geometries.barrelCactus, cMat);
    mesh.position.y = 0.42;
    mesh.scale.set(random(0.85, 1.2), random(0.75, 1.1), random(0.85, 1.2));
    mesh.castShadow = true;
    barrel.add(mesh);

    const bloom = new THREE.Mesh(geometries.roseCenter, cactusFlowerMat);
    bloom.position.y = mesh.position.y + 0.45;
    bloom.scale.setScalar(0.9);
    barrel.add(bloom);

    const s = random(0.7, 1.2);
    barrel.scale.setScalar(s);
    return barrel;
  }

  function createDesertRockFormation() {
    const group = new THREE.Group();
    const mat = pick([desertRockMat, desertRedRockMat, desertSandstoneMat]);
    const numRocks = randomInt(3, 5);

    for (let i = 0; i < numRocks; i++) {
      const rock = new THREE.Mesh(geometries.desertRock, mat);
      const s = random(0.7, 2.0);
      rock.scale.set(s * random(1.0, 1.5), s * random(0.6, 1.1), s * random(0.9, 1.4));
      rock.position.set(
        (i - numRocks / 2) * 1.1 + random(-0.3, 0.3),
        s * 0.4,
        random(-0.6, 0.6)
      );
      rock.rotation.set(random(0, Math.PI), random(0, Math.PI), random(0, Math.PI));
      rock.castShadow = true;
      group.add(rock);
    }

    const s = random(0.85, 1.4);
    group.scale.setScalar(s);
    return group;
  }

  function createDesertNaturalArch() {
    const archGroup = new THREE.Group();
    const mat = desertRedRockMat;

    const arc = new THREE.Mesh(geometries.desertArchRock, mat);
    arc.position.y = 0.2;
    arc.rotation.z = Math.PI;
    arc.castShadow = true;
    archGroup.add(arc);

    // Flanking sandstone crags
    const rockL = new THREE.Mesh(geometries.desertRock, mat);
    rockL.position.set(-3.4, 0.8, 0);
    rockL.scale.set(2.0, 1.8, 1.8);
    rockL.castShadow = true;
    archGroup.add(rockL);

    const rockR = new THREE.Mesh(geometries.desertRock, mat);
    rockR.position.set(3.4, 0.8, 0);
    rockR.scale.set(2.0, 1.8, 1.8);
    rockR.castShadow = true;
    archGroup.add(rockR);

    const s = random(0.75, 1.25);
    archGroup.scale.setScalar(s);
    archGroup.rotation.y = random(0, Math.PI * 2);
    return archGroup;
  }

  const CRYSTAL_PALETTE = ["#38bdf8", "#f472b6", "#a78bfa", "#fde047", "#67e8f9", "#ffffff"];

  function createCelestialCrystal() {
    const group = new THREE.Group();
    const color = pick(CRYSTAL_PALETTE);

    const crystalMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.12,
      metalness: 0.2,
      emissive: color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.94,
    });

    // Central Obelisk Pillar
    const mainPillar = new THREE.Mesh(geometries.crystalObelisk, crystalMat);
    mainPillar.position.y = 1.4;
    mainPillar.castShadow = true;
    group.add(mainPillar);

    // Flanking Shards
    const shardCount = 3;
    for (let i = 0; i < shardCount; i++) {
      const shard = new THREE.Mesh(geometries.crystalShard, crystalMat);
      const angle = (i / shardCount) * Math.PI * 2;
      shard.position.set(
        Math.cos(angle) * 0.35,
        0.7,
        Math.sin(angle) * 0.35
      );
      shard.rotation.x = Math.cos(angle) * 0.25;
      shard.rotation.z = Math.sin(angle) * 0.25;
      shard.scale.setScalar(random(0.65, 0.95));
      shard.castShadow = true;
      group.add(shard);
    }

    // Glowing Golden Halo Ring above the crystal
    const haloMat = new THREE.MeshBasicMaterial({
      color: "#fef08a",
      transparent: true,
      opacity: 0.85,
    });
    const halo = new THREE.Mesh(geometries.haloTorus, haloMat);
    halo.position.y = 2.9;
    halo.rotation.x = Math.PI / 3;
    halo.scale.setScalar(0.45);
    group.add(halo);

    const s = random(0.65, 1.25);
    group.scale.setScalar(s);
    group.rotation.y = random(0, Math.PI * 2);

    group.userData = {
      isCelestialCrystal: true,
      crystalMat,
      halo,
      baseEmissive: 0.8,
      pulsePhase: random(0, Math.PI * 2),
      pulseSpeed: random(1.6, 2.8),
    };

    return group;
  }

  function createDivineCloud() {
    const cloud = new THREE.Group();
    const puffCount = randomInt(4, 6);
    const divCloudMat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.55,
      metalness: 0.05,
      transparent: true,
      opacity: 0.86,
      emissive: "#e0f2fe",
      emissiveIntensity: 0.25,
    });

    for (let i = 0; i < puffCount; i++) {
      const puff = new THREE.Mesh(geometries.blossomFoliage, divCloudMat);
      const scale = random(0.85, 1.4);
      puff.scale.set(scale * 1.45, scale * 0.7, scale * 1.15);
      puff.position.set(
        (i - puffCount / 2) * 1.15 + random(-0.25, 0.25),
        random(-0.15, 0.2),
        random(-0.35, 0.35)
      );
      cloud.add(puff);
    }

    cloud.scale.setScalar(random(0.9, 1.4));
    cloud.userData = {
      isDivineCloud: true,
      baseY: random(0.3, 0.9),
      bobSpeed: random(0.9, 1.8),
      phase: random(0, Math.PI * 2),
    };

    return cloud;
  }

  /* —— 3D Fluffy Sky Clouds —— */

  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.85,
    metalness: 0.05,
    transparent: true,
    opacity: 0.88,
  });

  const cloudGeo = new THREE.IcosahedronGeometry(1.8, 1);

  function createCloud() {
    const cloud = new THREE.Group();
    const puffCount = randomInt(4, 7);

    for (let i = 0; i < puffCount; i++) {
      const puff = new THREE.Mesh(cloudGeo, cloudMaterial);
      const scale = random(0.85, 1.65);
puff.scale.set(scale * 1.35, scale * random(0.65, 0.95), scale * 1.1);
      puff.position.set(
        (i - puffCount / 2) * 1.5 + random(-0.4, 0.4),
        random(-0.25, 0.35),
        random(-0.6, 0.6)
      );
      cloud.add(puff);
    }

    cloud.userData = {
      isCloud: true,
      speed: random(0.35, 0.85),
    };

    return cloud;
  }

  /* --- Bonfires & People (Campers) --- */

  const shirtColors = ["#3b71ef", "#e84848", "#e8a832", "#456744", "#a858d8", "#00ac24"];
  const skinColors = ["#f8d5b2", "#e0ac69", "#8d5524", "#c68642"];

  function createBonfire() {
    const group = new THREE.Group();

    // Ring of small rocks around fire base
    const rockCount = 8;
    const ringRadius = 0.65;
    for (let i = 0; i < rockCount; i++) {
      const angle = (i / rockCount) * Math.PI * 2;
      const rx = Math.cos(angle) * ringRadius + random(-0.04, 0.04);
      const rz = Math.sin(angle) * ringRadius + random(-0.04, 0.04);
      const rock = new THREE.Mesh(geometries.rock, texturedRockMaterial);
      rock.scale.set(0.32, 0.22, 0.32);
      rock.position.set(rx, 0.08, rz);
      rock.castShadow = true;
      group.add(rock);
    }

    // Stacked wooden logs in a teepee shape
    const logGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.75, 6);
    const logCount = 5;
    for (let i = 0; i < logCount; i++) {
      const angle = (i / logCount) * Math.PI * 2;
      const log = new THREE.Mesh(logGeo, barkMaterial);
      log.position.set(Math.cos(angle) * 0.22, 0.28, Math.sin(angle) * 0.22);
      log.rotation.x = -Math.cos(angle) * 0.45;
      log.rotation.z = Math.sin(angle) * 0.45;
      log.castShadow = true;
      group.add(log);
    }

    // Glowing fire core
    const fireMaterial = new THREE.MeshStandardMaterial({
      color: "#ff3300",
      emissive: "#ff6600",
      emissiveIntensity: 3.5,
      roughness: 0.2,
    });
    const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.7, 7), fireMaterial);
    flameCore.position.y = 0.35;
    group.add(flameCore);

    const innerFlameMat = new THREE.MeshBasicMaterial({ color: "#ffee55" });
    const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 6), innerFlameMat);
    innerFlame.position.y = 0.38;
    group.add(innerFlame);

    // Flickering warm light
    const light = new THREE.PointLight("#ff8822", 3.0, 14);
    light.position.set(0, 0.55, 0);
    light.castShadow = true;
    group.add(light);

    // Floating embers
    const sparkCount = 7;
    const sparkGroup = new THREE.Group();
    const sparkMat = new THREE.MeshBasicMaterial({ color: "#ffcc22" });
    const sparkGeo = new THREE.SphereGeometry(0.03, 4, 4);

    for (let i = 0; i < sparkCount; i++) {
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.set(random(-0.25, 0.25), random(0.4, 1.3), random(-0.25, 0.25));
      spark.userData = {
        baseY: spark.position.y,
        speed: random(1.5, 3.0),
        offset: random(0, Math.PI * 2),
      };
      sparkGroup.add(spark);
    }
    group.add(sparkGroup);

    group.userData = {
      isBonfire: true,
      light,
      flameCore,
      innerFlame,
      sparkGroup,
    };

    return group;
  }

  function createPerson({ shirtColor, skinColor, isSitting = false } = {}) {
    const person = new THREE.Group();

    const shirtMat = getMaterial(shirtColor || pick(shirtColors));
    const skinMat = getMaterial(skinColor || pick(skinColors));
    const pantsMat = getMaterial("#2b3a4a");
    const hairMat = getMaterial(pick(["#221c19", "#4a3728", "#8c603a", "#b58750"]));

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.5, 8), shirtMat);
    torso.position.y = isSitting ? 0.42 : 0.7;
    torso.castShadow = true;
    person.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), skinMat);
    head.position.y = isSitting ? 0.78 : 1.06;
    head.castShadow = true;
    person.add(head);

    // Hair / Cap
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.135, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
    hair.position.y = isSitting ? 0.81 : 1.09;
    person.add(hair);

    // Arms
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.38, 6), shirtMat);
    leftArm.position.set(-0.19, isSitting ? 0.4 : 0.68, 0.08);
    leftArm.rotation.x = isSitting ? -0.5 : 0.1;
    leftArm.rotation.z = 0.2;
    leftArm.castShadow = true;
    person.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.38, 6), shirtMat);
    rightArm.position.set(0.19, isSitting ? 0.4 : 0.68, 0.08);
    rightArm.rotation.x = isSitting ? -0.5 : 0.1;
    rightArm.rotation.z = -0.2;
    rightArm.castShadow = true;
    person.add(rightArm);

    // Legs
    if (isSitting) {
      const leftLegUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.32, 6), pantsMat);
      leftLegUpper.position.set(-0.09, 0.24, 0.14);
      leftLegUpper.rotation.x = Math.PI / 2 - 0.15;
      leftLegUpper.castShadow = true;
      person.add(leftLegUpper);

      const rightLegUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.32, 6), pantsMat);
      rightLegUpper.position.set(0.09, 0.24, 0.14);
      rightLegUpper.rotation.x = Math.PI / 2 - 0.15;
      rightLegUpper.castShadow = true;
      person.add(rightLegUpper);

      const leftLegLower = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.28, 6), pantsMat);
      leftLegLower.position.set(-0.09, 0.11, 0.29);
      leftLegLower.castShadow = true;
      person.add(leftLegLower);

      const rightLegLower = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.28, 6), pantsMat);
      rightLegLower.position.set(0.09, 0.11, 0.29);
      rightLegLower.castShadow = true;
      person.add(rightLegLower);
    } else {
      const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.48, 6), pantsMat);
      leftLeg.position.set(-0.09, 0.24, 0);
      leftLeg.castShadow = true;
      person.add(leftLeg);

      const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.48, 6), pantsMat);
      rightLeg.position.set(0.09, 0.24, 0);
      rightLeg.castShadow = true;
      person.add(rightLeg);
    }

    person.userData = {
      isPerson: true,
      head,
      leftArm,
      rightArm,
      swayOffset: random(0, Math.PI * 2),
      swaySpeed: random(1.2, 2.0),
    };

    return person;
  }

  function createCampsite(x, z, angleOffset = 0) {
    const camp = new THREE.Group();
    camp.position.set(x, 0, z);

    const bonfire = createBonfire();
    camp.add(bonfire);

    const benchDistance = 1.35;
    const benchCount = 3;

    for (let i = 0; i < benchCount; i++) {
      const angle = angleOffset + (i / benchCount) * Math.PI * 2;
      const lx = Math.cos(angle) * benchDistance;
      const lz = Math.sin(angle) * benchDistance;

      const logBench = new THREE.Mesh(geometries.log, barkMaterial);
      logBench.rotation.x = Math.PI / 2;
      logBench.rotation.z = angle + Math.PI / 2;
      logBench.position.set(lx, 0.12, lz);
      logBench.scale.set(0.65, 0.55, 0.65);
      logBench.castShadow = true;
      camp.add(logBench);

      if (i < 2) {
        const person = createPerson({ isSitting: true });
        person.position.set(lx, 0, lz);
        person.rotation.y = angle + Math.PI;
        camp.add(person);
      }
    }

    const standAngle = angleOffset + (2.4 / benchCount) * Math.PI * 2;
    const sx = Math.cos(standAngle) * 1.45;
    const sz = Math.sin(standAngle) * 1.45;

    const standingPerson = createPerson({ isSitting: false });
    standingPerson.position.set(sx, 0, sz);
    standingPerson.rotation.y = standAngle + Math.PI;
    camp.add(standingPerson);

    return camp;
  }

  /**
   * Cozy 4-person campsite with a central stone-ringed bonfire, 4 log benches,
   * and 4 people dressed in Red, Blue, Green, and Yellow sitting together around the fire.
   */
  function createFourPlayerCampfire(x, z, angleOffset = Math.PI / 4) {
    const camp = new THREE.Group();
    camp.position.set(x, 0, z);

    // 1. Central Bonfire
    const bonfire = createBonfire();
    camp.add(bonfire);

    // 2. Cobblestone Fire Pit Circle
    const pitStoneCount = 8;
    for (let i = 0; i < pitStoneCount; i++) {
      const stoneAngle = (i / pitStoneCount) * Math.PI * 2;
      const sRadius = 0.68;
      const stone = new THREE.Mesh(geometries.rock, texturedRockMaterial);
      stone.position.set(
        Math.cos(stoneAngle) * sRadius,
        0.08,
        Math.sin(stoneAngle) * sRadius
      );
      stone.scale.set(0.35, 0.25, 0.35);
      stone.castShadow = true;
      camp.add(stone);
    }

    // 3. Four Log Benches + Four Sitting People (Themed Red, Blue, Green, Yellow)
    const benchDistance = 1.35;
    const playerShirtColors = ["#ef4444", "#3b82f6", "#22c55e", "#eab308"];
    const skinTones = ["#ffd0a8", "#d2986c", "#f3caa4", "#e8ba90"];

    for (let i = 0; i < 4; i++) {
      const angle = angleOffset + (i / 4) * Math.PI * 2;
      const lx = Math.cos(angle) * benchDistance;
      const lz = Math.sin(angle) * benchDistance;

      // Log Bench
      const logBench = new THREE.Mesh(geometries.log, barkMaterial);
      logBench.rotation.x = Math.PI / 2;
      logBench.rotation.z = angle + Math.PI / 2;
      logBench.position.set(lx, 0.12, lz);
      logBench.scale.set(0.68, 0.58, 0.68);
      logBench.castShadow = true;
      camp.add(logBench);

      // Person sitting on the bench facing the fire
      const person = createPerson({
        shirtColor: playerShirtColors[i],
        skinColor: skinTones[i],
        isSitting: true,
      });
      person.position.set(lx, 0, lz);
      person.rotation.y = angle + Math.PI; // Face the fire
      camp.add(person);
    }

    // 4. Camping kettle over hot embers
    const kettle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.13, 0.2, 8),
      new THREE.MeshStandardMaterial({ color: "#2d3748", roughness: 0.35, metalness: 0.8 })
    );
    kettle.position.set(0.36, 0.1, 0.26);
    kettle.castShadow = true;
    camp.add(kettle);

    return camp;
  }

  /* --- Ocean Realm: Ships, Boats, Lighthouses & Coastal Buildings --- */

  function createSailingShip() {
    const ship = new THREE.Group();

    // Hull
    const hullGeo = new THREE.BoxGeometry(1.5, 0.85, 4.2);
    const hull = new THREE.Mesh(hullGeo, shipHullMat);
    hull.position.y = 0.35;
    hull.castShadow = true;
    ship.add(hull);

    // Deck Cabin
    const cabinGeo = new THREE.BoxGeometry(1.15, 0.65, 1.2);
    const cabin = new THREE.Mesh(cabinGeo, shipHullMat);
    cabin.position.set(0, 0.88, -0.9);
    cabin.castShadow = true;
    ship.add(cabin);

    // Cabin Windows
    const windowGeo = new THREE.PlaneGeometry(0.22, 0.22);
    const win1 = new THREE.Mesh(windowGeo, buildingWindowMat);
    win1.position.set(0.59, 0.88, -0.9);
    win1.rotation.y = Math.PI / 2;
    ship.add(win1);

    // Masts
    const mastGeo = new THREE.CylinderGeometry(0.06, 0.08, 3.8, 6);
    const mast1 = new THREE.Mesh(mastGeo, shipHullMat);
    mast1.position.set(0, 2.3, 0.6);
    ship.add(mast1);

    const mast2 = new THREE.Mesh(mastGeo, shipHullMat);
    mast2.position.set(0, 2.0, -0.5);
    mast2.scale.set(0.9, 0.85, 0.9);
    ship.add(mast2);

    // Billowing Cloth Sails
    const sailGeo = new THREE.PlaneGeometry(1.9, 1.6, 3, 2);
    const sailPos = sailGeo.attributes.position;
    for (let i = 0; i < sailPos.count; i++) {
      const z = Math.sin(sailPos.getY(i) * 1.8) * 0.25;
      sailPos.setZ(i, z);
    }
    sailGeo.computeVertexNormals();

    const sail1 = new THREE.Mesh(sailGeo, shipSailMat);
    sail1.position.set(0, 2.4, 0.6);
    sail1.rotation.y = Math.PI / 2 + 0.15;
    ship.add(sail1);

    const sail2 = new THREE.Mesh(sailGeo, shipSailMat);
    sail2.position.set(0, 2.1, -0.5);
    sail2.scale.set(0.85, 0.8, 0.85);
    sail2.rotation.y = Math.PI / 2 + 0.15;
    ship.add(sail2);

    // Flag
    const flagMat = new THREE.MeshStandardMaterial({
      color: "#ef4444",
      side: THREE.DoubleSide,
    });
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), flagMat);
    flag.position.set(0, 4.1, 0.6);
    flag.rotation.y = Math.PI / 2;
    ship.add(flag);

    ship.userData = {
      isShip: true,
      baseY: 0,
      bobSpeed: random(1.2, 1.8),
      bobAmount: random(0.12, 0.22),
      rollSpeed: random(0.9, 1.5),
      rollAmount: random(0.05, 0.09),
      pitchAmount: random(0.04, 0.07),
      phase: random(0, Math.PI * 2),
    };

    return ship;
  }

  function createSmallBoat({ isMotor = false } = {}) {
    const boat = new THREE.Group();

    // Hull
    const hullGeo = new THREE.BoxGeometry(0.9, 0.45, 2.2);
    const hull = new THREE.Mesh(hullGeo, isMotor ? boatHullMat : boatWoodMat);
    hull.position.y = 0.18;
    hull.castShadow = true;
    boat.add(hull);

    // Benches / Cockpit
    const seatGeo = new THREE.BoxGeometry(0.7, 0.1, 0.35);
    const seat1 = new THREE.Mesh(seatGeo, boatWoodMat);
    seat1.position.set(0, 0.3, 0);
    boat.add(seat1);

    if (isMotor) {
      const glassMat = new THREE.MeshStandardMaterial({
        color: "#a5f3fc",
        roughness: 0.1,
        transparent: true,
        opacity: 0.7,
      });
      const shield = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.35, 0.08),
        glassMat
      );
      shield.position.set(0, 0.48, 0.4);
      boat.add(shield);

      const motor = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.4, 0.3),
        shipHullMat
      );
      motor.position.set(0, 0.3, -1.05);
      boat.add(motor);
    } else {
      const oarGeo = new THREE.CylinderGeometry(0.02, 0.03, 1.5, 4);
      const oar1 = new THREE.Mesh(oarGeo, boatWoodMat);
      oar1.position.set(0.55, 0.35, 0);
      oar1.rotation.z = -Math.PI / 3;
      boat.add(oar1);

      const oar2 = new THREE.Mesh(oarGeo, boatWoodMat);
      oar2.position.set(-0.55, 0.35, 0);
      oar2.rotation.z = Math.PI / 3;
      boat.add(oar2);
    }

    boat.userData = {
      isShip: true,
      baseY: 0,
      bobSpeed: random(1.8, 2.8),
      bobAmount: random(0.08, 0.16),
      rollSpeed: random(1.4, 2.2),
      rollAmount: random(0.07, 0.12),
      pitchAmount: random(0.05, 0.09),
      phase: random(0, Math.PI * 2),
    };

    return boat;
  }

  function createLighthouse() {
    const lighthouse = new THREE.Group();

    // Stone base foundation
    const baseGeo = new THREE.CylinderGeometry(1.7, 2.0, 1.2, 10);
    const base = new THREE.Mesh(baseGeo, buildingStoneMat);
    base.position.y = 0.6;
    base.castShadow = true;
    lighthouse.add(base);

    // Striped Tower Sections (Alternating Red and White)
    const sectionHeight = 1.3;
    const sectionCount = 4;
    for (let i = 0; i < sectionCount; i++) {
      const rTop = 1.4 - i * 0.15;
      const rBot = 1.55 - i * 0.15;
      const secGeo = new THREE.CylinderGeometry(rTop, rBot, sectionHeight, 10);
      const secMat = i % 2 === 0 ? lighthouseWhiteMat : lighthouseRedMat;
      const sec = new THREE.Mesh(secGeo, secMat);
      sec.position.y = 1.2 + (i + 0.5) * sectionHeight;
      sec.castShadow = true;
      lighthouse.add(sec);
    }

    const towerTopY = 1.2 + sectionCount * sectionHeight;

    // Gallery Balcony
    const galleryGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.25, 10);
    const gallery = new THREE.Mesh(galleryGeo, lighthouseRedMat);
    gallery.position.y = towerTopY + 0.12;
    lighthouse.add(gallery);

    // Glass Lantern Room
    const lanternGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.95, 8);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: "#ffedd5",
      emissive: "#ffb703",
      emissiveIntensity: 3.5,
      roughness: 0.1,
    });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.y = towerTopY + 0.72;
    lighthouse.add(lantern);

    // Conical Roof Cupola
    const roofGeo = new THREE.ConeGeometry(1.05, 0.9, 10);
    const roof = new THREE.Mesh(roofGeo, lighthouseRedMat);
    roof.position.y = towerTopY + 1.65;
    lighthouse.add(roof);

    // Rotating Beacon Light Beam
    const beacon = new THREE.Group();
    beacon.position.y = towerTopY + 0.72;

    const beamLight = new THREE.PointLight("#ffea79", 3.2, 26);
    beacon.add(beamLight);

    const beamConeMat = new THREE.MeshBasicMaterial({
      color: "#ffee88",
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beamGeo = new THREE.ConeGeometry(1.6, 12, 8, 1, true);
    const beam = new THREE.Mesh(beamGeo, beamConeMat);
    beam.position.set(0, 0, 6);
    beam.rotation.x = Math.PI / 2;
    beacon.add(beam);

    lighthouse.add(beacon);

    lighthouse.userData = {
      isLighthouse: true,
      beacon,
    };

    return lighthouse;
  }

  function createCoastalBuilding() {
    const building = new THREE.Group();

    // Wooden stilts supporting building above water
    const stiltMat = shipHullMat;
    const stiltGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 6);
    const stiltPositions = [
      [-0.9, -0.9],
      [0.9, -0.9],
      [-0.9, 0.9],
      [0.9, 0.9],
      [0, -0.9],
      [0, 0.9],
    ];
    stiltPositions.forEach(([sx, sz]) => {
      const stilt = new THREE.Mesh(stiltGeo, stiltMat);
      stilt.position.set(sx, 0.9, sz);
      building.add(stilt);
    });

    // Main House Structure
    const houseGeo = new THREE.BoxGeometry(2.2, 1.5, 2.2);
    const house = new THREE.Mesh(houseGeo, buildingStoneMat);
    house.position.y = 2.5;
    house.castShadow = true;
    building.add(house);

    // Glowing Windows
    const winMat = buildingWindowMat;
    const winGeo = new THREE.PlaneGeometry(0.4, 0.45);
    const w1 = new THREE.Mesh(winGeo, winMat);
    w1.position.set(0, 2.5, 1.11);
    building.add(w1);

    const w2 = new THREE.Mesh(winGeo, winMat);
    w2.position.set(1.11, 2.5, 0);
    w2.rotation.y = Math.PI / 2;
    building.add(w2);

    // Pitched Roof
    const roofGeo = new THREE.ConeGeometry(1.9, 1.1, 4);
    const roofMat = lighthouseRedMat;
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.8;
    roof.rotation.y = Math.PI / 4;
    building.add(roof);

    return building;
  }

  function createNavBuoy() {
    const buoy = new THREE.Group();

    const buoyBody = new THREE.Mesh(
      new THREE.ConeGeometry(0.45, 1.2, 7),
      buoyRedMat
    );
    buoyBody.position.y = 0.4;
    buoy.add(buoyBody);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.08, 6, 12),
      lighthouseWhiteMat
    );
    ring.position.y = 0.2;
    ring.rotation.x = Math.PI / 2;
    buoy.add(ring);

    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      buoyLightMat
    );
    light.position.y = 1.05;
    buoy.add(light);

    buoy.userData = {
      isShip: true,
      baseY: 0,
      bobSpeed: random(2.2, 3.5),
      bobAmount: 0.12,
      rollSpeed: random(1.8, 3.0),
      rollAmount: 0.14,
      pitchAmount: 0.12,
      phase: random(0, Math.PI * 2),
    };

    return buoy;
  }

  const activeStreetLamps = [];

  function createStreetLampPost(x, z, rotationY = 0) {
    const lamp = new THREE.Group();

    // 1. Pedestal Base
    const baseMesh = new THREE.Mesh(geometries.lampPedestal, lampIronMat);
    baseMesh.position.y = 0.18;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    lamp.add(baseMesh);

    // 2. Base Decorative Ring
    const baseRing = new THREE.Mesh(geometries.lampCollar, lampGoldTrimMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.35;
    lamp.add(baseRing);

    // 3. Fluted Iron Pole
    const poleMesh = new THREE.Mesh(geometries.lampPole, lampIronMat);
    poleMesh.position.y = 1.55;
    poleMesh.castShadow = true;
    lamp.add(poleMesh);

    // 4. Middle Collar Ring
    const midRing = new THREE.Mesh(geometries.lampCollar, lampGoldTrimMat);
    midRing.rotation.x = Math.PI / 2;
    midRing.position.y = 1.8;
    lamp.add(midRing);

    // 5. Scroll Arm / Bracket
    const armMesh = new THREE.Mesh(geometries.lampArm, lampIronMat);
    armMesh.position.set(0, 2.65, 0.16);
    armMesh.rotation.x = 0.4;
    lamp.add(armMesh);

    // 6. Spherical Cup Holder
    const cupMesh = new THREE.Mesh(geometries.lampSphereCup, lampIronMat);
    cupMesh.position.y = 2.75;
    cupMesh.castShadow = true;
    lamp.add(cupMesh);

    // 7. Frosted Glass Flame Bulb (Translucent with soft emissive center)
    const bulbMesh = new THREE.Mesh(geometries.lampFrostedBulb, lampGlassLitMat);
    bulbMesh.position.y = 2.95;
    lamp.add(bulbMesh);

    // 8. Soft Blurred Glow Planes (Crossed 3D Haze for feather-soft glow from all angles)
    const glowPlane1 = new THREE.Mesh(geometries.lampBlurPlane, lampBlurGlowMat);
    glowPlane1.position.y = 2.95;
    lamp.add(glowPlane1);

    const glowPlane2 = new THREE.Mesh(geometries.lampBlurPlane, lampBlurGlowMat);
    glowPlane2.position.y = 2.95;
    glowPlane2.rotation.y = Math.PI / 2;
    lamp.add(glowPlane2);

    // 9. Soft Blurred Ground Light Pool under Lamp & Board corner
    const groundPool = new THREE.Mesh(geometries.lampGroundPool, lampGroundPoolMat);
    groundPool.rotation.x = -Math.PI / 2;
    groundPool.position.set(0, 0.04, 0.6);
    lamp.add(groundPool);

    // 10. Pagoda Roof Cap
    const capMesh = new THREE.Mesh(geometries.lampPagodaCap, lampIronMat);
    capMesh.position.y = 3.22;
    capMesh.castShadow = true;
    lamp.add(capMesh);

    // 11. Golden Finial Spire
    const finialMesh = new THREE.Mesh(geometries.lampFinial, lampGoldTrimMat);
    finialMesh.position.y = 3.42;
    lamp.add(finialMesh);

    // 12. Omnidirectional Warm PointLight
    const lampLight = new THREE.PointLight(0xffa834, 3.2, 14.0, 1.2);
    lampLight.position.set(0, 2.95, 0.25);
    lamp.add(lampLight);

    // 13. Focused Downward Beam Light aimed at Board Corner Area
    const spotBeam = new THREE.SpotLight(0xffb74d, 2.8, 12.0, Math.PI / 2.8, 0.55, 1.2);
    spotBeam.position.set(0, 2.95, 0.1);
    spotBeam.target.position.set(0, 0.2, 1.8);
    lamp.add(spotBeam);
    lamp.add(spotBeam.target);

    lamp.position.set(x, 0, z);
    lamp.rotation.y = rotationY;

    lamp.userData = {
      isStreetLamp: true,
      light: lampLight,
      spotLight: spotBeam,
      glow1: glowPlane1,
      glow2: glowPlane2,
      baseIntensity: 3.2,
      baseSpotIntensity: 2.8,
      flickerOffset: Math.random() * 100,
    };

    return lamp;
  }

  /* —— Place everything —— */

  // Three manual presets only: "ultra" is denser than the scene's
  // tuned defaults, "high" is those defaults, "light" is a sparse
  // pass for weaker hardware. No auto-detection here — whichever
  // tier the player picked in Graphics settings applies as-is.
  const activeTier = qualityTier === "ultra" ? "ultra" : qualityTier === "light" ? "light" : "high";

  // Layer groups for dynamic realm switching
  const forestGroup = new THREE.Group();
  const floraGroup = new THREE.Group();
  const animalsGroup = new THREE.Group();
  const rocksGroup = new THREE.Group();
  const desertRocksGroup = new THREE.Group();
  const hellRealmGroup = new THREE.Group();
  const iceGlacierGroup = new THREE.Group();
  const oceanRealmGroup = new THREE.Group();
  const heavenFloraGroup = new THREE.Group();
  const streetLampsGroup = new THREE.Group();
  streetLampsGroup.name = "StreetLampsGroup";

  forest.add(forestGroup);
  forest.add(floraGroup);
  forest.add(animalsGroup);
  forest.add(rocksGroup);
  forest.add(desertRocksGroup);
  forest.add(hellRealmGroup);
  forest.add(iceGlacierGroup);
  forest.add(oceanRealmGroup);
  forest.add(heavenFloraGroup);
  forest.add(streetLampsGroup);

  // Place exactly 1 street lamp at each of the four corners of the board (4 corner lamps total)
  const lampPlacements = [
    // Northwest corner (Red player area)
    { x: -5.8, z: -5.8, rot: -Math.PI / 4 },
    // Northeast corner (Green player area)
    { x: 5.8, z: -5.8, rot: Math.PI / 4 },
    // Southeast corner (Yellow player area)
    { x: 5.8, z: 5.8, rot: (3 * Math.PI) / 4 },
    // Southwest corner (Blue player area)
    { x: -5.8, z: 5.8, rot: (-3 * Math.PI) / 4 },
  ];

  lampPlacements.forEach((p) => {
    const streetLamp = createStreetLampPost(p.x, p.z, p.rot);
    streetLampsGroup.add(streetLamp);
    activeStreetLamps.push(streetLamp);
  });

  let treeCount = CONFIG.treeCount;
  let pineTreeCount = CONFIG.pineTreeCount;
  let birchTreeCount = CONFIG.birchTreeCount;
  let nearBoardTreeCount = CONFIG.nearBoardTreeCount;
  let cloudCount = 0;
  let butterflyCount = CONFIG.butterflyCount;
  let mushroomCount = CONFIG.mushroomCount;
  let flowerCount = CONFIG.flowerCount;
  let logCount = CONFIG.logCount;

  if (activeTier === "ultra") {
    treeCount = 52;
    pineTreeCount = 36;
    birchTreeCount = 22;
    nearBoardTreeCount = 8;
    cloudCount = 0;
    butterflyCount = 16;
    mushroomCount = 20;
    flowerCount = 26;
    logCount = 10;
  } else if (activeTier === "light") {
    treeCount = 12;
    pineTreeCount = 8;
    birchTreeCount = 6;
    nearBoardTreeCount = 2;
    cloudCount = 0;
    butterflyCount = 0;
    mushroomCount = 2;
    flowerCount = 3;
    logCount = 2;
  }

  // 1. Forest Canopy Trees (Deciduous)
  for (let i = 0; i < treeCount; i++) {
    const tree = createTree();
    const { x, z } = forestPosition();
    tree.position.set(x, 0, z);
    forestGroup.add(tree);
  }

  // 2. Evergreen Pine Trees
  for (let i = 0; i < pineTreeCount; i++) {
    const pine = createPineTree();
    const { x, z } = forestPosition();
    pine.position.set(x, 0, z);
    forestGroup.add(pine);
  }

  // 3. Birch & Blossom Trees
  for (let i = 0; i < birchTreeCount; i++) {
    const birch = createBirchTree();
    const { x, z } = forestPosition();
    birch.position.set(x, 0, z);
    forestGroup.add(birch);
  }

  // 4. Near-Board Decorative Grove Trees & Saplings
  for (let i = 0; i < nearBoardTreeCount; i++) {
    const { x, z } = nearBoardPosition();
    const smallTree = Math.random() < 0.5 ? createSmallTree() : createBirchTree();
    smallTree.position.set(x, 0, z);
    smallTree.scale.multiplyScalar(0.85);
    forestGroup.add(smallTree);
  }

  const bushCount = activeTier === "light" ? 6 : activeTier === "ultra" ? 62 : CONFIG.bushCount;
  for (let i = 0; i < bushCount; i++) {
    const bush = createBush();
    const { x, z } = forestPosition();
    bush.position.set(x, 0, z);
    bush.scale.setScalar(random(0.8, 1.4));
    forestGroup.add(bush);
  }

  for (let i = 0; i < logCount; i++) {
    const log = createLog();
    const { x, z } = forestPosition();
    log.position.set(x, 0.25, z);
    log.rotation.y = random(0, Math.PI * 2);
    log.scale.setScalar(random(0.7, 1.1));
    forestGroup.add(log);
  }

  // 5. Standard Rocks (Used in Forest & Ocean)
  const rockCount = activeTier === "light" ? 5 : activeTier === "ultra" ? 52 : CONFIG.rockCount;
  for (let i = 0; i < rockCount; i++) {
    const rock = createRock();
    const { x, z } = forestPosition();
    rock.position.x = x;
    rock.position.z = z;
    rocksGroup.add(rock);
  }

  // 4. Wildlife & Animals
  const deerCount = activeTier === "light" ? 0 : activeTier === "ultra" ? 6 : CONFIG.deerCount;
  for (let i = 0; i < deerCount; i++) {
    const deer = createDeer();
    const { x, z } = forestPosition();
    deer.position.set(x, 0, z);
    deer.rotation.y = random(0, Math.PI * 2);
    animalsGroup.add(deer);
  }

  // Rabbits
  const rabbitCount = activeTier === "light" ? 0 : activeTier === "ultra" ? 9 : CONFIG.rabbitCount;
  for (let i = 0; i < rabbitCount; i++) {
    const rabbit = createRabbit();
    const { x, z } = forestPosition();
    rabbit.position.set(x, 0, z);
    rabbit.rotation.y = random(0, Math.PI * 2);
    animalsGroup.add(rabbit);
  }

  // Butterflies
  const butterflies = [];
  for (let i = 0; i < butterflyCount; i++) {
    const bf = createButterfly();
    const { x, z } = forestPosition();
    bf.position.set(x, random(1.5, 4), z);
    bf.userData.originX = x;
    bf.userData.originZ = z;
    butterflies.push(bf);
    animalsGroup.add(bf);
  }

  // 5. Flora (Flowers & Mushrooms)
  for (let i = 0; i < mushroomCount; i++) {
    const mushroom = createMushroom();
    const { x, z } = forestPosition();
    mushroom.position.set(x, 0, z);
    mushroom.rotation.y = random(0, Math.PI * 2);
    floraGroup.add(mushroom);
  }

  for (let i = 0; i < flowerCount; i++) {
    const flower = createFlower();
    const { x, z } = forestPosition();
    flower.position.set(x, 0, z);
    flower.rotation.y = random(0, Math.PI * 2);
    floraGroup.add(flower);
  }

  // 6. Near-Board 4-Person Bonfire Gathering & Campsites
  const nearBoardCampfire = createFourPlayerCampfire(6.5, 6.2, Math.PI / 4);
  forestGroup.add(nearBoardCampfire);

  const campsite1 = createCampsite(14.5, -9.5, 0.4);
  forestGroup.add(campsite1);

  const campsite2 = createCampsite(-13.5, 12.5, 2.1);
  forestGroup.add(campsite2);

  // 6b. Heaven Mode: Floral Paradise (Lotuses, Orchids, Roses, Celestial Blossoms & Graceful Blossom Trees)
  const heavenFlowerCreators = [
    createLotusFlower,
    createOrchidFlower,
    createRoseFlower,
    createHeavenFlower,
  ];

  // 1. Direct Board Perimeter Garland (Hugging all 4 edges)
  const perimeterFlowerCount = activeTier === "ultra" ? 180 : activeTier === "light" ? 60 : 130;
  for (let i = 0; i < perimeterFlowerCount; i++) {
    const creator = pick(heavenFlowerCreators);
    const flower = creator();
    const side = Math.floor(random(0, 4));
    const offset = random(-4.7, 4.7);
    const edgeDist = random(4.45, 5.2);

    let fx = 0;
    let fz = 0;
    if (side === 0) {
      // North Edge
      fx = offset;
      fz = -edgeDist;
    } else if (side === 1) {
      // South Edge
      fx = offset;
      fz = edgeDist;
    } else if (side === 2) {
      // East Edge
      fx = edgeDist;
      fz = offset;
    } else {
      // West Edge
      fx = -edgeDist;
      fz = offset;
    }

    flower.position.set(fx + random(-0.15, 0.15), 0, fz + random(-0.15, 0.15));
    heavenFloraGroup.add(flower);
  }

  // 2. Lush Corner Flower Bouquets
  const corners = [
    { cx: 4.8, cz: 4.8 },
    { cx: -4.8, cz: 4.8 },
    { cx: 4.8, cz: -4.8 },
    { cx: -4.8, cz: -4.8 },
  ];
  const cornerBouquetCount = activeTier === "ultra" ? 14 : activeTier === "light" ? 6 : 10;
  corners.forEach(({ cx, cz }) => {
    for (let j = 0; j < cornerBouquetCount; j++) {
      const creator = pick(heavenFlowerCreators);
      const flower = creator();
      const angle = random(0, Math.PI * 2);
      const dist = random(0.2, 1.2);
      flower.position.set(cx + Math.cos(angle) * dist, 0, cz + Math.sin(angle) * dist);
      heavenFloraGroup.add(flower);
    }
  });

  // 3. Surface Meadow Flower Scatter
  const surfaceHeavenCount = activeTier === "ultra" ? 280 : activeTier === "light" ? 70 : 200;
  for (let i = 0; i < surfaceHeavenCount; i++) {
    const creator = pick(heavenFlowerCreators);
    const flower = creator();
    const angle = random(0, Math.PI * 2);
    const radius = random(6.2, 29);
    flower.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    heavenFloraGroup.add(flower);
  }

  // 4. Grand Celestial Marble Temple Colonnades & Pillars (Forming divine temple gateways)
  const pillarCount = activeTier === "ultra" ? 18 : activeTier === "light" ? 6 : 14;
  for (let i = 0; i < pillarCount; i++) {
    const pillar = createCelestialTemplePillar();
    const angle = (i / pillarCount) * Math.PI * 2;
    const radius = random(16, 28);
    pillar.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    heavenFloraGroup.add(pillar);
  }

  // 5. Levitating Sacred Polyhedral Star Relics (Hovering at 4 corners outside board)
  const relicCoords = [
    { rx: 6.8, rz: 6.8 },
    { rx: -6.8, rz: 6.8 },
    { rx: 6.8, rz: -6.8 },
    { rx: -6.8, rz: -6.8 },
  ];
  relicCoords.forEach(({ rx, rz }) => {
    const relic = createLevitatingStarRelic();
    relic.position.set(rx, 0, rz);
    heavenFloraGroup.add(relic);
  });

  // 6. Sacred Lotus Reflection Ponds & Celestial Fountain
  const pond1 = createLotusPond();
  pond1.position.set(13.0, 0, -9.5);
  heavenFloraGroup.add(pond1);

  const pond2 = createLotusPond();
  pond2.position.set(-12.5, 0, -11.0);
  heavenFloraGroup.add(pond2);

  const fountain = createCelestialFountain();
  fountain.position.set(-6.8, 0, 6.2);
  heavenFloraGroup.add(fountain);

  // 7. Drifting Divine Spirit Light Orbs
  const orbCount = activeTier === "ultra" ? 16 : activeTier === "light" ? 4 : 10;
  for (let i = 0; i < orbCount; i++) {
    const orb = createDivineSpiritOrb();
    heavenFloraGroup.add(orb);
  }

  // 8. Glowing Celestial Crystal Monoliths (Aquamarine, Rose Quartz & Sunstone with Golden Halos)
  const crystalCount = activeTier === "ultra" ? 18 : activeTier === "light" ? 4 : 12;
  for (let i = 0; i < crystalCount; i++) {
    const crystal = createCelestialCrystal();
    const angle = (i / crystalCount) * Math.PI * 2 + random(-0.2, 0.2);
    const radius = random(10.5, 26);
    crystal.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    heavenFloraGroup.add(crystal);
  }

  // 9. Low-Floating Heavenly Cloud Banks (Giving the ethereal celestial floating look)
  const divCloudCount = activeTier === "ultra" ? 14 : activeTier === "light" ? 4 : 9;
  for (let i = 0; i < divCloudCount; i++) {
    const cloud = createDivineCloud();
    const angle = (i / divCloudCount) * Math.PI * 2;
    const radius = random(11, 27);
    cloud.position.set(Math.cos(angle) * radius, cloud.userData.baseY, Math.sin(angle) * radius);
    heavenFloraGroup.add(cloud);
  }

  // 10. Grand Celestial Portal Arches (North & South Gateways)
  const arch1 = createCelestialArch();
  arch1.position.set(0, 0, -20);
  heavenFloraGroup.add(arch1);

  const arch2 = createCelestialArch();
  arch2.position.set(0, 0, 20);
  arch2.rotation.y = Math.PI;
  heavenFloraGroup.add(arch2);

  // 11. Golden Domed Celestial Pavilions
  const pav1 = createCelestialPavilion();
  pav1.position.set(-18.5, 0, -8.0);
  heavenFloraGroup.add(pav1);

  const pav2 = createCelestialPavilion();
  pav2.position.set(18.5, 0, 8.0);
  heavenFloraGroup.add(pav2);

  // 12. Golden Holy Chalice Braziers (Lining near-board approaches)
  const brazierSpots = [
    { bx: 5.6, bz: 3.2 },
    { bx: 5.6, bz: -3.2 },
    { bx: -5.6, bz: 3.2 },
    { bx: -5.6, bz: -3.2 },
    { bx: 3.2, bz: 5.6 },
    { bx: -3.2, bz: 5.6 },
    { bx: 3.2, bz: -5.6 },
    { bx: -3.2, bz: -5.6 },
  ];
  brazierSpots.forEach(({ bx, bz }) => {
    const br = createCelestialBrazier();
    br.position.set(bx, 0, bz);
    heavenFloraGroup.add(br);
  });

  // 13. Flying Celestial White Doves in the Sky
  const doveCount = activeTier === "ultra" ? 10 : activeTier === "light" ? 3 : 6;
  for (let i = 0; i < doveCount; i++) {
    const dove = createCelestialDove();
    heavenFloraGroup.add(dove);
  }

  // 14. Ethereal Prism Rainbow Arc
  const rainbow = createPrismRainbowArc();
  heavenFloraGroup.add(rainbow);

  // 15. Winged Angel Guardian Statues (At 4 Corner Entries)
  const angelCoords = [
    { ax: 10.5, az: 10.5, rot: -Math.PI * 0.75 },
    { ax: -10.5, az: 10.5, rot: Math.PI * 0.75 },
    { ax: 10.5, az: -10.5, rot: -Math.PI * 0.25 },
    { ax: -10.5, az: -10.5, rot: Math.PI * 0.25 },
  ];
  angelCoords.forEach(({ ax, az, rot }) => {
    const angel = createAngelicStatue();
    angel.position.set(ax, 0, az);
    angel.rotation.y = rot;
    heavenFloraGroup.add(angel);
  });

  // 16. Rotating Golden Armillary Sphere Shrines
  const armillary1 = createArmillarySphereShrine();
  armillary1.position.set(0, 0, -13.5);
  heavenFloraGroup.add(armillary1);

  const armillary2 = createArmillarySphereShrine();
  armillary2.position.set(0, 0, 13.5);
  heavenFloraGroup.add(armillary2);

  // 17. Levitating Floating Crystal Islets
  const isletCount = activeTier === "ultra" ? 8 : activeTier === "light" ? 3 : 6;
  for (let i = 0; i < isletCount; i++) {
    const islet = createFloatingCrystalIslet();
    const angle = (i / isletCount) * Math.PI * 2 + random(-0.2, 0.2);
    const radius = random(14, 24);
    islet.position.set(Math.cos(angle) * radius, islet.userData.baseY, Math.sin(angle) * radius);
    heavenFloraGroup.add(islet);
  }

  // 18. Golden Celestial Lyres / Harps
  const lyre1 = createCelestialLyre();
  lyre1.position.set(8.5, 0, -5.5);
  lyre1.rotation.y = Math.PI / 4;
  heavenFloraGroup.add(lyre1);

  const lyre2 = createCelestialLyre();
  lyre2.position.set(-8.5, 0, -5.5);
  lyre2.rotation.y = -Math.PI / 4;
  heavenFloraGroup.add(lyre2);

  // 19. Pearl-Marble Stepping Pathways (Connecting board corners to temples & ponds)
  const path1 = createMarbleSteppingPath(4.5, 4.5, 10.0, 10.0, 6);
  heavenFloraGroup.add(path1);

  const path2 = createMarbleSteppingPath(-4.5, 4.5, -10.0, 10.0, 6);
  heavenFloraGroup.add(path2);

  const path3 = createMarbleSteppingPath(4.5, -4.5, 10.0, -10.0, 6);
  heavenFloraGroup.add(path3);

  const path4 = createMarbleSteppingPath(-4.5, -4.5, -10.0, -10.0, 6);
  heavenFloraGroup.add(path4);

  // 7. Desert Realm Layer (Saguaro Cacti, Barrel Cacti, Sandstone Arches, Mesas & Heavy Boulder Formations)
  
  // A. Grand Natural Desert Arches
  const dArch1 = createDesertNaturalArch();
  dArch1.position.set(0, 0, -22);
  desertRocksGroup.add(dArch1);

  const dArch2 = createDesertNaturalArch();
  dArch2.position.set(21, 0, 10);
  dArch2.rotation.y = -Math.PI / 3;
  desertRocksGroup.add(dArch2);

  // B. Saguaro Cactus Trees
  const saguaroCount = activeTier === "light" ? 14 : activeTier === "ultra" ? 42 : 28;
  for (let i = 0; i < saguaroCount; i++) {
    const cactus = createSaguaroCactus();
    const { x, z } = forestPosition();
    cactus.position.set(x, 0, z);
    desertRocksGroup.add(cactus);
  }

  // C. Prickly Pear & Barrel Cacti
  const lowCactusCount = activeTier === "light" ? 12 : activeTier === "ultra" ? 36 : 24;
  for (let i = 0; i < lowCactusCount; i++) {
    const creator = Math.random() < 0.55 ? createPricklyPearCactus : createBarrelCactus;
    const cactus = creator();
    const { x, z } = forestPosition();
    cactus.position.set(x, 0, z);
    desertRocksGroup.add(cactus);
  }

  // D. Sandstone Monoliths, Red Rock Pillars & Heavy Boulders
  const desertCount = activeTier === "light" ? 28 : activeTier === "ultra" ? 85 : 55;
  for (let i = 0; i < desertCount; i++) {
    const { x, z } = forestPosition();
    if (i % 4 === 0) {
      // Sandstone Pillar / Hoodoo
      const pillar = new THREE.Mesh(geometries.desertPillar, desertPillarMat);
      const s = random(0.8, 1.8);
      pillar.scale.set(s, s * random(1.0, 2.0), s);
      pillar.position.set(x, s * 2.25, z);
      pillar.rotation.y = random(0, Math.PI * 2);
      pillar.castShadow = true;
      desertRocksGroup.add(pillar);
    } else if (i % 4 === 1) {
      // Rock Formation Cluster
      const form = createDesertRockFormation();
      form.position.set(x, 0, z);
      desertRocksGroup.add(form);
    } else {
      // Red Rock / Sandstone Boulders
      const rockMat = Math.random() < 0.5 ? desertRedRockMat : desertRockMat;
      const dRock = new THREE.Mesh(geometries.desertRock, rockMat);
      const s = random(0.8, 2.4);
      dRock.scale.set(s * random(1.1, 1.7), s * random(0.6, 1.2), s * random(0.9, 1.5));
      dRock.position.set(x, s * 0.45, z);
      dRock.rotation.set(random(0, Math.PI), random(0, Math.PI), random(0, Math.PI));
      dRock.castShadow = true;
      desertRocksGroup.add(dRock);
    }
  }

  // 8. Hell Realm Layer (Volcanic Spires & Magma Boulders)
  const hellCount = activeTier === "light" ? 12 : activeTier === "ultra" ? 48 : 34;
  for (let i = 0; i < hellCount; i++) {
    const { x, z } = forestPosition();
    if (i % 2 === 0) {
      const spire = new THREE.Mesh(geometries.volcanicSpire, volcanicSpireMat);
      const s = random(0.9, 1.7);
      spire.scale.set(s, s * random(1.0, 1.8), s);
      spire.position.set(x, s * 2.6, z);
      spire.rotation.y = random(0, Math.PI * 2);
      spire.castShadow = true;
      hellRealmGroup.add(spire);
    } else {
      const mRock = new THREE.Mesh(geometries.magmaRock, magmaRockMat);
      const s = random(0.8, 1.8);
      mRock.scale.set(s * random(1.0, 1.5), s * random(0.7, 1.2), s);
      mRock.position.set(x, s * 0.5, z);
      mRock.rotation.set(random(0, Math.PI), random(0, Math.PI), random(0, Math.PI));
      mRock.castShadow = true;
      hellRealmGroup.add(mRock);
    }
  }

  // 9. Glacier Ice Realm Layer (Towering Icebergs & Frozen Crystal Spires)
  const iceCount = activeTier === "light" ? 12 : activeTier === "ultra" ? 48 : 34;
  for (let i = 0; i < iceCount; i++) {
    const { x, z } = forestPosition();
    if (i % 2 === 0) {
      const iceberg = new THREE.Mesh(geometries.iceberg, icebergMat);
      const s = random(0.9, 1.8);
      iceberg.scale.set(s * random(0.9, 1.4), s * random(1.0, 1.6), s);
      iceberg.position.set(x, s * 3.1, z);
      iceberg.rotation.y = random(0, Math.PI * 2);
      iceberg.castShadow = true;
      iceGlacierGroup.add(iceberg);
    } else {
      const iceSpire = new THREE.Mesh(geometries.iceSpire, iceSpireMat);
      const s = random(0.8, 1.5);
      iceSpire.scale.set(s, s * random(0.9, 1.5), s);
      iceSpire.position.set(x, s * 2.25, z);
      iceSpire.rotation.y = random(0, Math.PI * 2);
      iceSpire.castShadow = true;
      iceGlacierGroup.add(iceSpire);
    }
  }

  // 10. Ocean Realm Layer (Ships, Boats, Lighthouses & Coastal Buildings)
  const shipCount = activeTier === "light" ? 2 : 4;
  for (let i = 0; i < shipCount; i++) {
    const ship = createSailingShip();
    const { x, z } = forestPosition();
    ship.position.set(x, 0, z);
    ship.rotation.y = random(0, Math.PI * 2);
    const s = random(0.85, 1.35);
    ship.scale.setScalar(s);
    oceanRealmGroup.add(ship);
  }

  const boatCount = activeTier === "light" ? 3 : 8;
  for (let i = 0; i < boatCount; i++) {
    const boat = createSmallBoat({ isMotor: i % 2 === 0 });
    const { x, z } = forestPosition();
    boat.position.set(x, 0, z);
    boat.rotation.y = random(0, Math.PI * 2);
    const s = random(0.8, 1.25);
    boat.scale.setScalar(s);
    oceanRealmGroup.add(boat);
  }

  // 2 Lighthouses
  const lighthouse1 = createLighthouse();
  lighthouse1.position.set(16.5, 0, -11.5);
  oceanRealmGroup.add(lighthouse1);

  const lighthouse2 = createLighthouse();
  lighthouse2.position.set(-15.5, 0, 14.5);
  oceanRealmGroup.add(lighthouse2);

  // Coastal Waterfront Stilt Buildings
  const buildingCount = activeTier === "light" ? 2 : 5;
  for (let i = 0; i < buildingCount; i++) {
    const bldg = createCoastalBuilding();
    const { x, z } = forestPosition();
    bldg.position.set(x, 0, z);
    bldg.rotation.y = random(0, Math.PI * 2);
    oceanRealmGroup.add(bldg);
  }

  // Floating Navigational Buoys
  const buoyCount = activeTier === "light" ? 2 : 6;
  for (let i = 0; i < buoyCount; i++) {
    const buoy = createNavBuoy();
    const { x, z } = forestPosition();
    buoy.position.set(x, 0, z);
    oceanRealmGroup.add(buoy);
  }

  // 3D Sky Clouds
  for (let i = 0; i < cloudCount; i++) {
    const cloud = createCloud();
    cloud.position.set(random(-35, 35), random(16, 26), random(-35, 35));
    forest.add(cloud);
  }

  /* ground */

  const groundGeometry = new THREE.CircleGeometry(45, 64);

  // Apply subtle hard/rough micro-terrain height contour displacement
  const posAttr = groundGeometry.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const dist = Math.hypot(vx, vy);
    // Keep area directly under board (radius < 6.2) perfectly flat for clean board placement
    if (dist > 6.2) {
      const heightBump =
        Math.sin(vx * 0.35) * Math.cos(vy * 0.35) * 0.14 +
        Math.sin(vx * 0.9 + vy * 0.7) * 0.05 +
        Math.cos(vx * 1.5 - vy * 1.2) * 0.03;
      posAttr.setZ(i, heightBump);
    }
  }
  groundGeometry.computeVertexNormals();

  const groundMaterial = new THREE.MeshStandardMaterial({
    map: groundTexture,
    bumpMap: groundBumpMap,
    bumpScale: 0.18,
    roughness: 0.95,
    metalness: 0.1,
    color: PALETTE.ground,
  });

  const ground = new THREE.Mesh(groundGeometry, groundMaterial);

  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.03;
  ground.receiveShadow = true;

  /* drifting motes */

  const particleCount = isMobile ? 40 : 90;

  const particleGeometry = new THREE.BufferGeometry();

  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = random(-25, 25);
    positions[i * 3 + 1] = random(1, 12);
    positions[i * 3 + 2] = random(-25, 25);
  }

  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );

  const particleMaterial = new THREE.PointsMaterial({
    color: "#d7dfbd",
    size: 0.08,
    map: getCircleParticleTexture(),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);

  /* --- Rain Atmosphere --- */
  const rainCount = isMobile ? 180 : 350;
  const rainGeometry = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(rainCount * 3);
  const rainVelocities = new Float32Array(rainCount);

  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = random(-28, 28);
    rainPositions[i * 3 + 1] = random(0, 22);
    rainPositions[i * 3 + 2] = random(-28, 28);
    rainVelocities[i] = random(18, 28);
  }

  rainGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(rainPositions, 3),
  );

  const rainMaterial = new THREE.PointsMaterial({
    color: "#a8c8e8",
    size: 0.14,
    map: getRainStreakTexture(),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  const rainParticles = new THREE.Points(rainGeometry, rainMaterial);
  forest.add(rainParticles);

  if (activeTier === "low") {
    particles.visible = false;
    rainParticles.visible = false;
  }

  let currentThemeId = "clear";

  /** Gentle sway + wind wave + animal animation, called once per frame. */
  function update(time) {
    if (currentThemeId === "heavy_rain") {
      groundBumpMap.offset.x = (time * 0.04) % 1;
      groundBumpMap.offset.y = (time * 0.025) % 1;
    }

    const windTime = time * 2.2;

    forest.traverse((object) => {
      const data = object.userData;

      if (!data) return;

      // Floating Cloud Drift
      if (data.isCloud) {
        object.position.x += data.speed * 0.025;
        if (object.position.x > 42) {
          object.position.x = -42;
        }
      }

      // Tree & bush wind sway
      if (data.swayAmount) {
        const gx = object.position.x || 0;
        const gz = object.position.z || 0;
        object.rotation.z =
          Math.sin(time * data.swaySpeed + data.phase + gx * 0.08 + gz * 0.08) *
          data.swayAmount;
        object.rotation.x =
          Math.cos(time * (data.swaySpeed * 0.8) + data.phase) *
          (data.swayAmount * 0.5);
      }

      // Deer / rabbit idle bob
      if (data.animalType === "deer" || data.animalType === "rabbit") {
        object.position.y =
          Math.sin(time * data.bobSpeed + data.phase) * data.bobAmount;
      }

      // Butterfly flight
      if (data.animalType === "butterfly") {
        const t = time * data.flySpeed + data.phase;
        object.position.x = data.originX + Math.sin(t) * data.flyRadius;
        object.position.z = data.originZ + Math.cos(t * 0.7) * data.flyRadius;
        object.position.y = data.flyHeight + Math.sin(t * 1.3) * 0.6;
        object.rotation.y = t;

        // Wing flapping
        const wingAngle = Math.sin(time * data.wingSpeed) * 0.5;
        if (data.leftWing) data.leftWing.rotation.y = 0.3 + wingAngle;
        if (data.rightWing) data.rightWing.rotation.y = -0.3 - wingAngle;
      }

      // Bonfire flickering and embers
      if (data.isBonfire) {
        data.light.intensity = 2.4 + Math.sin(time * 16) * 0.45 + Math.cos(time * 23) * 0.3;
        data.flameCore.scale.setScalar(0.95 + Math.sin(time * 11) * 0.08);
        data.innerFlame.scale.setScalar(0.9 + Math.cos(time * 14) * 0.1);

        data.sparkGroup.children.forEach((spark) => {
          const sd = spark.userData;
          spark.position.y = sd.baseY + Math.sin(time * sd.speed + sd.offset) * 0.3;
        });
      }

      // Street lamp high-power flame flicker & soft blurred glow pulse
      if (data.isStreetLamp) {
        const flicker =
          Math.sin(time * 7.5 + data.flickerOffset) * 0.22 +
          Math.cos(time * 13.0 + data.flickerOffset * 1.4) * 0.12;
        if (data.light) {
          data.light.intensity = data.baseIntensity + flicker;
        }
        if (data.spotLight) {
          data.spotLight.intensity = data.baseSpotIntensity + flicker * 0.8;
        }
        const pulse = 1.0 + Math.sin(time * 4.5 + data.flickerOffset) * 0.06;
        if (data.glow1) data.glow1.scale.setScalar(pulse);
        if (data.glow2) data.glow2.scale.setScalar(pulse);
      }

      // People idle animation
      if (data.isPerson) {
        data.head.rotation.y =
          Math.sin(time * data.swaySpeed + data.swayOffset) * 0.15;
        data.leftArm.rotation.x =
          Math.sin(time * data.swaySpeed * 1.3 + data.swayOffset) * 0.05 - 0.4;
      }

      // Ship & boat buoyant floating & pitch-roll wave rocking
      if (data.isShip) {
        object.position.y =
          (data.baseY || 0) +
          Math.sin(time * data.bobSpeed + data.phase) * data.bobAmount;
        object.rotation.z =
          Math.sin(time * data.rollSpeed + data.phase) * data.rollAmount;
        object.rotation.x =
          Math.cos(time * (data.rollSpeed * 0.75) + data.phase) *
          data.pitchAmount;
      }

      // Heaven flower subtle glow breathing pulse & petal sway
      if (data.isHeavenFlower) {
        object.rotation.z =
          Math.sin(time * data.swaySpeed + data.pulsePhase) * (data.swayAmount || 0.05);
        const pulse = 1.0 + Math.sin(time * 2.2 + data.pulsePhase) * 0.05;
        object.scale.setScalar(data.baseScale * pulse);
      }

      // Celestial crystal emissive breathing pulse & rotating halo
      if (data.isCelestialCrystal) {
        const pulse = Math.sin(time * data.pulseSpeed + data.pulsePhase) * 0.25;
        data.crystalMat.emissiveIntensity = data.baseEmissive + pulse;
        if (data.halo) {
          data.halo.rotation.z = time * 0.8;
          data.halo.rotation.y = time * 0.4;
        }
      }

      // Levitating sacred star relic floating & spinning
      if (data.isStarRelic) {
        data.star.rotation.y = time * data.spinSpeed;
        data.star.rotation.x = time * (data.spinSpeed * 0.7);
        const floatY = data.baseY + Math.sin(time * data.floatSpeed + data.phase) * 0.18;
        data.star.position.y = floatY;
        data.halo.position.y = floatY;
        data.halo.rotation.z = -time * data.spinSpeed;
      }

      // Divine spirit light orb orbiting & bobbing
      if (data.isSpiritOrb) {
        data.orbitAngle += data.orbitSpeed * 0.012;
        object.position.x = Math.cos(data.orbitAngle) * data.orbitRadius;
        object.position.z = Math.sin(data.orbitAngle) * data.orbitRadius;
        object.position.y =
          data.baseY + Math.sin(time * data.bobSpeed + data.phase) * 0.35;
      }

      // Divine cloud gentle floating bob
      if (data.isDivineCloud) {
        object.position.y =
          data.baseY + Math.sin(time * data.bobSpeed + data.phase) * 0.22;
      }

      // Flying celestial white dove animation
      if (data.isDove) {
        data.orbitAngle += data.orbitSpeed * 0.012;
        object.position.x = Math.cos(data.orbitAngle) * data.orbitRadius;
        object.position.z = Math.sin(data.orbitAngle) * data.orbitRadius;
        object.position.y =
          data.flightHeight + Math.sin(time * 2.2 + data.phase) * 0.45;
        object.rotation.y = -data.orbitAngle + Math.PI / 2;

        const flap = Math.sin(time * data.flapSpeed) * 0.65;
        data.leftWing.rotation.z = -0.3 + flap;
        data.rightWing.rotation.z = 0.3 - flap;
      }

      // Celestial brazier holy flame flicker
      if (data.isBrazier) {
        data.flame.scale.y = 1.0 + Math.sin(time * 12 + data.phase) * 0.15;
        data.light.intensity = 2.0 + Math.cos(time * 15 + data.phase) * 0.4;
      }

      // Armillary sphere 3D multi-axis ring rotation
      if (data.isArmillary) {
        data.ring1.rotation.z = time * 0.85;
        data.ring2.rotation.y = time * 0.65;
        data.ring3.rotation.x = time * 0.45;
        const starPulse = 1.6 + Math.sin(time * 3.0 + data.phase) * 0.25;
        data.star.scale.setScalar(starPulse);
      }

      // Floating crystal islet gentle levitation & tilt
      if (data.isFloatingIslet) {
        object.position.y =
          data.baseY + Math.sin(time * data.bobSpeed + data.phase) * 0.25;
        object.rotation.z =
          Math.sin(time * data.tiltSpeed + data.phase) * 0.04;
        object.rotation.x =
          Math.cos(time * (data.tiltSpeed * 0.8) + data.phase) * 0.04;
      }

      // Rotating lighthouse beacon searchlight
      if (data.isLighthouse) {
        data.beacon.rotation.y = time * 1.6;
      }
    });

    if (activeTier !== "low") {
      particles.rotation.y = time * 0.008;
      particles.position.x = Math.sin(time * 0.12) * 0.5;
      particles.position.z = Math.cos(time * 0.09) * 0.4;

      // Rain falling animation
      const rainPosArray = rainGeometry.attributes.position.array;
      for (let i = 0; i < rainCount; i++) {
        rainPosArray[i * 3 + 1] -= rainVelocities[i] * 0.018;
        if (rainPosArray[i * 3 + 1] < 0) {
          rainPosArray[i * 3 + 1] = random(18, 24);
          rainPosArray[i * 3] = random(-28, 28);
          rainPosArray[i * 3 + 2] = random(-28, 28);
        }
      }
      rainGeometry.attributes.position.needsUpdate = true;
    }
  }

  function setTheme(themeId, animated = true) {
    currentThemeId = themeId;
    const theme = FOREST_THEMES[themeId] || FOREST_THEMES.clear;
    const dur = animated ? 0.85 : 0;
    const ease = "power2.out";

    // Toggle Realm Asset Layer Visibilities
    forestGroup.visible = themeId === "clear";
    floraGroup.visible = themeId === "clear";
    heavenFloraGroup.visible = themeId === "heaven";
    animalsGroup.visible = themeId === "clear";
    rocksGroup.visible = themeId === "clear";
    desertRocksGroup.visible = themeId === "desert";
    hellRealmGroup.visible = themeId === "hell";
    iceGlacierGroup.visible = themeId === "ice";
    oceanRealmGroup.visible = themeId === "heavy_rain";

    // 1. Ground Surface
    const groundTargetColor = new THREE.Color(theme.ground);
    if (!animated) {
      groundMaterial.color.copy(groundTargetColor);
      groundMaterial.roughness = theme.groundRoughness;
      groundMaterial.metalness = theme.groundMetalness || 0.05;
      groundMaterial.bumpScale = theme.groundBumpScale;
      barkMaterial.color.set(theme.bark);
      texturedRockMaterial.color.set(theme.rock);

      theme.foliage.forEach((col, idx) => {
        if (foliageMaterials[idx]) foliageMaterials[idx].color.set(col);
      });
      theme.bush.forEach((col, idx) => {
        if (bushMaterials[idx]) bushMaterials[idx].color.set(col);
      });
      return;
    }

    gsap.to(groundMaterial.color, {
      r: groundTargetColor.r,
      g: groundTargetColor.g,
      b: groundTargetColor.b,
      duration: dur,
      ease,
    });
    gsap.to(groundMaterial, {
      roughness: theme.groundRoughness,
      metalness: theme.groundMetalness || 0.05,
      bumpScale: theme.groundBumpScale,
      duration: dur,
      ease,
    });

    const barkCol = new THREE.Color(theme.bark);
    gsap.to(barkMaterial.color, {
      r: barkCol.r,
      g: barkCol.g,
      b: barkCol.b,
      duration: dur,
      ease,
    });

    const rockCol = new THREE.Color(theme.rock);
    gsap.to(texturedRockMaterial.color, {
      r: rockCol.r,
      g: rockCol.g,
      b: rockCol.b,
      duration: dur,
      ease,
    });

    theme.foliage.forEach((col, idx) => {
      if (foliageMaterials[idx]) {
        const c = new THREE.Color(col);
        gsap.to(foliageMaterials[idx].color, {
          r: c.r,
          g: c.g,
          b: c.b,
          duration: dur,
          ease,
        });
      }
    });

    theme.bush.forEach((col, idx) => {
      if (bushMaterials[idx]) {
        const c = new THREE.Color(col);
        gsap.to(bushMaterials[idx].color, {
          r: c.r,
          g: c.g,
          b: c.b,
          duration: dur,
          ease,
        });
      }
    });
  }

  function setTimeOfDay(timeId, animated = true) {
    const isNight = timeId === "night" || timeId === "dark_night";
    const targetScale = isNight ? 1.0 : 0.001;
    const dur = animated ? 0.65 : 0;
    const ease = "power2.out";

    if (!animated) {
      streetLampsGroup.visible = isNight;
      streetLampsGroup.scale.setScalar(targetScale);
      activeStreetLamps.forEach((lamp) => {
        if (lamp.userData.light) {
          lamp.userData.light.intensity = isNight ? lamp.userData.baseIntensity : 0.0;
        }
        if (lamp.userData.spotLight) {
          lamp.userData.spotLight.intensity = isNight ? lamp.userData.baseSpotIntensity : 0.0;
        }
      });
      return;
    }

    if (isNight) {
      streetLampsGroup.visible = true;
    }

    gsap.to(streetLampsGroup.scale, {
      x: targetScale,
      y: targetScale,
      z: targetScale,
      duration: dur,
      ease,
      onComplete: () => {
        streetLampsGroup.visible = isNight;
      },
    });

    activeStreetLamps.forEach((lamp) => {
      if (lamp.userData.light) {
        gsap.to(lamp.userData.light, {
          intensity: isNight ? lamp.userData.baseIntensity : 0.0,
          duration: dur,
          ease,
        });
      }
      if (lamp.userData.spotLight) {
        gsap.to(lamp.userData.spotLight, {
          intensity: isNight ? lamp.userData.baseSpotIntensity : 0.0,
          duration: dur,
          ease,
        });
      }
    });
  }

  function dispose() {
    Object.values(geometries).forEach((geometry) => geometry.dispose());
    groundGeometry.dispose();
    groundMaterial.dispose();
    particleGeometry.dispose();
    particleMaterial.dispose();
    cloudGeo.dispose();
    cloudMaterial.dispose();
    rainGeometry.dispose();
    rainMaterial.dispose();
    barkTexture.dispose();
    barkMaterial.dispose();
    groundTexture.dispose();
    groundBumpMap.dispose();
    rockTexture.dispose();
    texturedRockMaterial.dispose();
    desertRockMat.dispose();
    desertPillarMat.dispose();
    desertRedRockMat.dispose();
    desertSandstoneMat.dispose();
    cactusMat1.dispose();
    cactusMat2.dispose();
    cactusFlowerMat.dispose();
    volcanicSpireMat.dispose();
    magmaRockMat.dispose();
    icebergMat.dispose();
    iceSpireMat.dispose();
    shipHullMat.dispose();
    shipSailMat.dispose();
    boatHullMat.dispose();
    boatWoodMat.dispose();
    lighthouseWhiteMat.dispose();
    lighthouseRedMat.dispose();
    buildingStoneMat.dispose();
    buildingWindowMat.dispose();
    buoyRedMat.dispose();
    lampIronMat.dispose();
    lampGoldTrimMat.dispose();
    lampGlassLitMat.dispose();
    lampBlurGlowMat.dispose();
    lampGroundPoolMat.dispose();
    softBlurGlowTexture.dispose();
    foliageMaterials.forEach((m) => m.dispose());
    bushMaterials.forEach((m) => m.dispose());
  }

  return { forest, ground, particles, update, setTheme, setTimeOfDay, dispose };
}
