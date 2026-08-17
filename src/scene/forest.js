import * as THREE from "three";

import { getMaterial } from "./materials.js";

const CONFIG = {
  forestRadius: 32,
  boardSafeRadius: 8,

  treeCount: 42,
  bushCount: 45,
  rockCount: 40,
  grassCount: 60,
  nearBoardGrassCount: 25,
  logCount: 7,

  deerCount: 4,
  rabbitCount: 6,
  butterflyCount: 12,
  mushroomCount: 15,
  flowerCount: 20,

  mobileTreeCount: 18,
  mobileGrassCount: 25,
  mobileNearBoardGrassCount: 10,
};

const PALETTE = {
  treeTrunk: ["#594431", "#644b34", "#715239"],
  foliage: ["#2c4932", "#34543a", "#3e6041", "#466746", "#2a412f"],
  bush: ["#304d35", "#3b5b3d", "#456744", "#263f2d"],
  rock: ["#5d6258", "#67695f", "#4d554c", "#726e61"],
  grass: ["#506847", "#5c714e", "#405a3d", "#667855"],
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
export function createForest({ isMobile, qualityTier = "auto" }) {
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

  const geometries = {
    treeTrunk: new THREE.CylinderGeometry(0.22, 0.34, 2.8, 7),
    foliageLarge: new THREE.IcosahedronGeometry(1.55, 1),
    foliageMedium: new THREE.IcosahedronGeometry(1.15, 1),
    foliageSmall: new THREE.IcosahedronGeometry(0.8, 1),
    bush: new THREE.IcosahedronGeometry(0.7, 1),
    rock: new THREE.IcosahedronGeometry(0.55, 1),
    grass: new THREE.ConeGeometry(0.045, 0.55, 4),
    log: new THREE.CylinderGeometry(0.22, 0.27, 2.5, 7),
    logEnd: new THREE.CircleGeometry(0.22, 8),
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

  /** A spot closely surrounding the board edges (radius 6.3 to 11.2). */
  function nearBoardPosition() {
    const angle = random(0, Math.PI * 2);
    const radius = random(6.3, 11.2);
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

    const foliageMaterial = getMaterial(pick(PALETTE.foliage));

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

    const material = getMaterial(pick(PALETTE.bush));

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

  function createGrass() {
    const group = new THREE.Group();

    const material = getMaterial(pick(PALETTE.grass));

    for (let i = 0, count = randomInt(3, 5); i < count; i++) {
      const blade = new THREE.Mesh(geometries.grass, material);

      blade.position.set(random(-0.35, 0.35), 0.25, random(-0.35, 0.35));
      blade.rotation.z = random(-0.35, 0.35);
      blade.rotation.x = random(-0.2, 0.2);
      blade.rotation.y = random(0, Math.PI * 2);

      group.add(blade);
    }

    const baseRotZ = random(-0.15, 0.15);
    const baseRotX = random(-0.1, 0.1);
    group.rotation.z = baseRotZ;
    group.rotation.x = baseRotX;

    group.userData = {
      isGrass: true,
      baseRotZ,
      baseRotX,
      windScale: random(0.85, 1.45),
      windPhase: random(0, Math.PI * 2),
    };

    return group;
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

  /* —— Place everything —— */

  const activeTier = qualityTier === "high" ? "high" : qualityTier === "low" ? "low" : (qualityTier === "medium" || isMobile) ? "medium" : "high";

  let treeCount = CONFIG.treeCount;
  let grassCount = CONFIG.grassCount;
  let nearBoardCount = CONFIG.nearBoardGrassCount;
  let cloudCount = 14;
  let butterflyCount = CONFIG.butterflyCount;
  let mushroomCount = CONFIG.mushroomCount;
  let flowerCount = CONFIG.flowerCount;
  let logCount = CONFIG.logCount;

  if (activeTier === "medium") {
    treeCount = 16;
    grassCount = 20;
    nearBoardCount = 8;
    cloudCount = 3;
    butterflyCount = 2;
    mushroomCount = 5;
    flowerCount = 6;
    logCount = 4;
  } else if (activeTier === "low") {
    treeCount = 8;
    grassCount = 8;
    nearBoardCount = 3;
    cloudCount = 0;
    butterflyCount = 0;
    mushroomCount = 2;
    flowerCount = 3;
    logCount = 2;
  }

  for (let i = 0; i < treeCount; i++) {
    const tree = createTree();
    const { x, z } = forestPosition();
    tree.position.set(x, 0, z);
    forest.add(tree);
  }

  const bushCount = activeTier === "low" ? 6 : activeTier === "medium" ? 15 : CONFIG.bushCount;
  for (let i = 0; i < bushCount; i++) {
    const bush = createBush();
    const { x, z } = forestPosition();
    bush.position.set(x, 0, z);
    bush.scale.setScalar(random(0.8, 1.4));
    forest.add(bush);
  }

  const rockCount = activeTier === "low" ? 5 : activeTier === "medium" ? 12 : CONFIG.rockCount;
  for (let i = 0; i < rockCount; i++) {
    const rock = createRock();
    const { x, z } = forestPosition();
    rock.position.x = x;
    rock.position.z = z;
    forest.add(rock);
  }

  for (let i = 0; i < grassCount; i++) {
    const grass = createGrass();
    const { x, z } = forestPosition();
    grass.position.set(x, 0, z);
    grass.scale.setScalar(random(0.7, 1.3));
    forest.add(grass);
  }

  // Dense Grass Ringing Directly Around the Board Edges
  for (let i = 0; i < nearBoardCount; i++) {
    const grass = createGrass();
    const { x, z } = nearBoardPosition();
    grass.position.set(x, 0, z);
    grass.scale.setScalar(random(0.8, 1.45));
    forest.add(grass);
  }

  for (let i = 0; i < logCount; i++) {
    const log = createLog();
    const { x, z } = forestPosition();
    log.position.set(x, 0.25, z);
    log.rotation.y = random(0, Math.PI * 2);
    log.scale.setScalar(random(0.7, 1.1));
    forest.add(log);
  }

  // Deer
  const deerCount = activeTier === "low" ? 0 : activeTier === "medium" ? 1 : CONFIG.deerCount;
  for (let i = 0; i < deerCount; i++) {
    const deer = createDeer();
    const { x, z } = forestPosition();
    deer.position.set(x, 0, z);
    deer.rotation.y = random(0, Math.PI * 2);
    forest.add(deer);
  }

  // Rabbits
  const rabbitCount = activeTier === "low" ? 0 : activeTier === "medium" ? 2 : CONFIG.rabbitCount;
  for (let i = 0; i < rabbitCount; i++) {
    const rabbit = createRabbit();
    const { x, z } = forestPosition();
    rabbit.position.set(x, 0, z);
    rabbit.rotation.y = random(0, Math.PI * 2);
    forest.add(rabbit);
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
    forest.add(bf);
  }

  // Mushrooms
  for (let i = 0; i < mushroomCount; i++) {
    const mushroom = createMushroom();
    const { x, z } = forestPosition();
    mushroom.position.set(x, 0, z);
    mushroom.rotation.y = random(0, Math.PI * 2);
    forest.add(mushroom);
  }

  // Flowers
  for (let i = 0; i < flowerCount; i++) {
    const flower = createFlower();
    const { x, z } = forestPosition();
    flower.position.set(x, 0, z);
    flower.rotation.y = random(0, Math.PI * 2);
    forest.add(flower);
  }

  // 3D Sky Clouds
  for (let i = 0; i < cloudCount; i++) {
    const cloud = createCloud();
    cloud.position.set(random(-35, 35), random(16, 26), random(-35, 35));
    forest.add(cloud);
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

  function createPerson({ shirtColor, skinColor, isSitting = false }) {
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

  // Place 2 campsites in the forest clearing
  const campsite1 = createCampsite(13.5, -8.5, 0.4);
  forest.add(campsite1);

  const campsite2 = createCampsite(-12.5, 11.5, 2.1);
  forest.add(campsite2);

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
    size: 0.045,
    transparent: true,
    opacity: 0.35,
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
    size: 0.08,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });

  const rainParticles = new THREE.Points(rainGeometry, rainMaterial);
  forest.add(rainParticles);

  if (activeTier === "low") {
    particles.visible = false;
    rainParticles.visible = false;
  }

  /** Gentle sway + wind wave + animal animation, called once per frame. */
  function update(time) {
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

      // Realistic travelling wind wave effect on grass blades
      if (data.isGrass) {
        const gx = object.position.x;
        const gz = object.position.z;
        const wave1 = Math.sin(windTime + gx * 0.14 + gz * 0.18) * 0.22;
        const wave2 = Math.cos(windTime * 0.65 - gx * 0.12 + gz * 0.09) * 0.11;
        const gust = Math.sin(windTime * 0.35 + gx * 0.04) * 0.08;
        const totalWind = (wave1 + wave2 + gust) * data.windScale;

        object.rotation.z = data.baseRotZ + totalWind * 0.85;
        object.rotation.x =
          data.baseRotX +
          totalWind * 0.45 +
          Math.sin(windTime * 3.8 + data.windPhase) * 0.05;
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

      // People idle animation
      if (data.isPerson) {
        data.head.rotation.y = Math.sin(time * data.swaySpeed + data.swayOffset) * 0.15;
        data.leftArm.rotation.x = Math.sin(time * data.swaySpeed * 1.3 + data.swayOffset) * 0.05 - 0.4;
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
  }

  return { forest, ground, particles, update, dispose };
}
