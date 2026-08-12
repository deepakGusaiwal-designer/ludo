import * as THREE from "three";

import { getMaterial } from "./materials.js";

const CONFIG = {
  forestRadius: 32,
  boardSafeRadius: 8,

  treeCount: 42,
  bushCount: 45,
  rockCount: 40,
  grassCount: 180,
  logCount: 7,

  mobileTreeCount: 25,
  mobileGrassCount: 80,
};

const PALETTE = {
  treeTrunk: ["#594431", "#644b34", "#715239"],
  foliage: ["#2c4932", "#34543a", "#3e6041", "#466746", "#2a412f"],
  bush: ["#304d35", "#3b5b3d", "#456744", "#263f2d"],
  rock: ["#5d6258", "#67695f", "#4d554c", "#726e61"],
  grass: ["#506847", "#5c714e", "#405a3d", "#667855"],
  log: ["#523b2b", "#62452e", "#463426"],
  ground: "#334535",
};

const random = (min, max) => Math.random() * (max - min) + min;

const randomInt = (min, max) => Math.floor(random(min, max + 1));

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/**
 * Builds the surrounding forest. Returns the group plus the
 * geometries it owns so they can be released on unmount.
 */
export function createForest({ isMobile }) {
  const forest = new THREE.Group();

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

  function createTree() {
    const tree = new THREE.Group();

    const height = random(0.85, 1.35);

    const trunkMaterial = getMaterial(pick(PALETTE.treeTrunk));

    const trunk = new THREE.Mesh(geometries.treeTrunk, trunkMaterial);

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
    const rock = new THREE.Mesh(
      geometries.rock,
      getMaterial(pick(PALETTE.rock)),
    );

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

    for (let i = 0, count = randomInt(4, 8); i < count; i++) {
      const blade = new THREE.Mesh(geometries.grass, material);

      blade.position.set(random(-0.3, 0.3), 0.25, random(-0.3, 0.3));
      blade.rotation.z = random(-0.3, 0.3);
      blade.rotation.y = random(0, Math.PI * 2);

      group.add(blade);
    }

    return group;
  }

  function createLog() {
    const log = new THREE.Group();

    const body = new THREE.Mesh(geometries.log, getMaterial(pick(PALETTE.log)));

    body.rotation.z = Math.PI / 2;
    body.castShadow = true;

    log.add(body);

    const end = new THREE.Mesh(geometries.logEnd, getMaterial("#3c2b20"));

    end.rotation.y = Math.PI / 2;
    end.position.x = 1.25;

    log.add(end);

    return log;
  }

  const treeCount = isMobile ? CONFIG.mobileTreeCount : CONFIG.treeCount;

  for (let i = 0; i < treeCount; i++) {
    const tree = createTree();
    const { x, z } = forestPosition();
    tree.position.set(x, 0, z);
    forest.add(tree);
  }

  for (let i = 0; i < CONFIG.bushCount; i++) {
    const bush = createBush();
    const { x, z } = forestPosition();
    bush.position.set(x, 0, z);
    bush.scale.setScalar(random(0.8, 1.4));
    forest.add(bush);
  }

  for (let i = 0; i < CONFIG.rockCount; i++) {
    const rock = createRock();
    const { x, z } = forestPosition();
    rock.position.x = x;
    rock.position.z = z;
    forest.add(rock);
  }

  const grassCount = isMobile ? CONFIG.mobileGrassCount : CONFIG.grassCount;

  for (let i = 0; i < grassCount; i++) {
    const grass = createGrass();
    const { x, z } = forestPosition();
    grass.position.set(x, 0, z);
    grass.scale.setScalar(random(0.6, 1.2));
    forest.add(grass);
  }

  for (let i = 0; i < CONFIG.logCount; i++) {
    const log = createLog();
    const { x, z } = forestPosition();
    log.position.set(x, 0.25, z);
    log.rotation.y = random(0, Math.PI * 2);
    log.scale.setScalar(random(0.7, 1.1));
    forest.add(log);
  }

  /* ground */

  const groundGeometry = new THREE.CircleGeometry(45, 64);

  const ground = new THREE.Mesh(
    groundGeometry,
    getMaterial(PALETTE.ground, { roughness: 1 }),
  );

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

  /** Gentle sway, called once per frame. */
  function update(time) {
    forest.traverse((object) => {
      const data = object.userData;

      if (data && data.swayAmount) {
        object.rotation.z =
          Math.sin(time * data.swaySpeed + data.phase) * data.swayAmount;
      }
    });

    particles.rotation.y = time * 0.008;
    particles.position.x = Math.sin(time * 0.12) * 0.5;
    particles.position.z = Math.cos(time * 0.09) * 0.4;
  }

  function dispose() {
    Object.values(geometries).forEach((geometry) => geometry.dispose());
    groundGeometry.dispose();
    particleGeometry.dispose();
    particleMaterial.dispose();
  }

  return { forest, ground, particles, update, dispose };
}
