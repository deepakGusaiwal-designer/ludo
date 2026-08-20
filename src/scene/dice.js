import * as THREE from "three";

import gsap from "gsap";

import { COLORS } from "../game/constants.js";

import { getMaterial } from "./materials.js";

const PIP_LAYOUT = {
  1: [[0, 0]],
  2: [
    [-1, -1],
    [1, 1],
  ],
  3: [
    [-1, -1],
    [0, 0],
    [1, 1],
  ],
  4: [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ],
  5: [
    [-1, -1],
    [1, -1],
    [0, 0],
    [-1, 1],
    [1, 1],
  ],
  6: [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ],
};

/**
 * Face layout on the cube:
 *
 *   +Z = 1   -Z = 6   +X = 2
 *   -X = 5   +Y = 3   -Y = 4
 *
 * The camera looks down at the board, so the value a player
 * reads is whichever face points at +Y. These rotations bring
 * the rolled face to the top.
 */
const FACE_UP_ROTATION = {
  1: { x: -Math.PI / 2, y: 0, z: 0 },
  2: { x: 0, y: 0, z: Math.PI / 2 },
  3: { x: 0, y: 0, z: 0 },
  4: { x: Math.PI, y: 0, z: 0 },
  5: { x: 0, y: 0, z: -Math.PI / 2 },
  6: { x: Math.PI / 2, y: 0, z: 0 },
};

const FACE_OFFSET = 0.632;

const PIP_SCALE = 0.27;

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Nearest equivalent angle at or above `from`, so the dice
 * always settles by spinning forwards rather than unwinding.
 */
function forwardAngle(from, target) {
  const turn = Math.PI * 2;

  return target + Math.ceil((from - target) / turn) * turn;
}

function createRoundedCubeGeometry(size = 1.25, radius = 0.14) {
  const shape = new THREE.Shape();
  const half = size / 2;
  const r = Math.min(radius, half);
  shape.moveTo(-half + r, -half);
  shape.lineTo(half - r, -half);
  shape.quadraticCurveTo(half, -half, half, -half + r);
  shape.lineTo(half, half - r);
  shape.quadraticCurveTo(half, half, half - r, half);
  shape.lineTo(-half + r, half);
  shape.quadraticCurveTo(-half, half, -half, half - r);
  shape.lineTo(-half, -half + r);
  shape.quadraticCurveTo(-half, -half, -half + r, -half);

  const extrudeSettings = {
    depth: size - r * 2,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: r,
    bevelThickness: r,
    curveSegments: 12,
  };
  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.center();
  return geom;
}

export const DICE_SPOTS = {
  red: { x: -5.4, y: 1.2, z: -2.0 },
  green: { x: 2.0, y: 1.2, z: -5.4 },
  yellow: { x: 5.4, y: 1.2, z: 2.0 },
  blue: { x: -2.0, y: 1.2, z: 5.4 },
};

export function createDice() {
  const diceGroup = new THREE.Group();
  diceGroup.name = "Dice";

  let currentColor = "red";
  const initialPos = DICE_SPOTS.red;
  diceGroup.position.set(initialPos.x, initialPos.y, initialPos.z);

  const bodyGeometry = new THREE.BoxGeometry(1.25, 1.25, 1.25, 6, 6, 6);

  // Classic crisp polished white dice body
  const diceMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.14,
    metalness: 0.02,
  });

  const diceMesh = new THREE.Mesh(bodyGeometry, diceMaterial);
  diceMesh.castShadow = true;
  diceMesh.receiveShadow = true;
  diceGroup.add(diceMesh);

  const pipGeometry = new THREE.CylinderGeometry(0.095, 0.095, 0.03, 16);
  const pipRingGeometry = new THREE.TorusGeometry(0.105, 0.016, 10, 24);

  // Classic crisp dark pips (dots)
  const pipMaterial = new THREE.MeshStandardMaterial({
    color: "#111116",
    roughness: 0.1,
    metalness: 0.8,
  });

  const pipRingMaterial = new THREE.MeshStandardMaterial({
    color: "#d4af37",
    roughness: 0.3,
    metalness: 0.9,
  });

  const FACE_CONFIG = {
    front: { pos: [0, 0, 0.628], rot: [0, 0, 0], val: 1 },
    back: { pos: [0, 0, -0.628], rot: [0, Math.PI, 0], val: 6 },
    right: { pos: [0.628, 0, 0], rot: [0, Math.PI / 2, 0], val: 2 },
    left: { pos: [-0.628, 0, 0], rot: [0, -Math.PI / 2, 0], val: 5 },
    top: { pos: [0, 0.628, 0], rot: [-Math.PI / 2, 0, 0], val: 3 },
    bottom: { pos: [0, -0.628, 0], rot: [Math.PI / 2, 0, 0], val: 4 },
  };

  const PIP_LOCAL_SCALE = 0.25;

  Object.values(FACE_CONFIG).forEach(({ pos, rot, val }) => {
    const faceGroup = new THREE.Group();
    faceGroup.position.set(...pos);
    faceGroup.rotation.set(...rot);

    for (const [px, py] of PIP_LAYOUT[val]) {
      const lx = px * PIP_LOCAL_SCALE;
      const ly = py * PIP_LOCAL_SCALE;

      const pip = new THREE.Mesh(pipGeometry, pipMaterial);
      pip.rotation.x = Math.PI / 2;
      pip.position.set(lx, ly, 0.01);
      pip.castShadow = true;
      faceGroup.add(pip);

      const ring = new THREE.Mesh(pipRingGeometry, pipRingMaterial);
      ring.position.set(lx, ly, 0.012);
      faceGroup.add(ring);
    }

    diceGroup.add(faceGroup);
  });

  // Show a 1 before the first roll
  const initial = FACE_UP_ROTATION[1];
  diceGroup.rotation.set(initial.x, initial.y, initial.z);

  /* 4 Dedicated Dice Landing Spots on the Table */
  const landingSpotsGroup = new THREE.Group();
  landingSpotsGroup.name = "DiceLandingSpots";

  const spotBaseGeo = new THREE.CylinderGeometry(0.92, 0.96, 0.04, 32);
  const spotRingGeo = new THREE.TorusGeometry(0.90, 0.024, 12, 32);
  const spotInnerGeo = new THREE.CylinderGeometry(0.76, 0.76, 0.02, 32);
  const spotHaloGeo = new THREE.RingGeometry(0.92, 1.15, 32);

  const spotMeshes = {};
  const clickableMeshes = [];

  for (const color of ["red", "green", "yellow", "blue"]) {
    const spotPos = DICE_SPOTS[color];
    const spotGroup = new THREE.Group();
    spotGroup.name = `DiceSpot-${color}`;
    spotGroup.position.set(spotPos.x, 0.02, spotPos.z);

    const baseMat = new THREE.MeshStandardMaterial({
      color: "#1c2522",
      roughness: 0.7,
      metalness: 0.2,
    });
    const baseMesh = new THREE.Mesh(spotBaseGeo, baseMat);
    baseMesh.receiveShadow = true;
    spotGroup.add(baseMesh);
    clickableMeshes.push(baseMesh);

    const ringMat = new THREE.MeshStandardMaterial({
      color: "#d4af37",
      roughness: 0.25,
      metalness: 0.85,
    });
    const ringMesh = new THREE.Mesh(spotRingGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.022;
    spotGroup.add(ringMesh);

    const innerMat = new THREE.MeshStandardMaterial({
      color: COLORS[color],
      roughness: 0.35,
      metalness: 0.3,
      emissive: new THREE.Color(COLORS[color]).multiplyScalar(0.15),
    });
    const innerMesh = new THREE.Mesh(spotInnerGeo, innerMat);
    innerMesh.position.y = 0.024;
    innerMesh.receiveShadow = true;
    spotGroup.add(innerMesh);

    const haloMat = new THREE.MeshBasicMaterial({
      color: COLORS[color],
      transparent: true,
      opacity: color === "red" ? 0.6 : 0.15,
      side: THREE.DoubleSide,
    });
    const haloMesh = new THREE.Mesh(spotHaloGeo, haloMat);
    haloMesh.rotation.x = -Math.PI / 2;
    haloMesh.position.y = 0.03;
    spotGroup.add(haloMesh);

    landingSpotsGroup.add(spotGroup);
    spotMeshes[color] = { spotGroup, innerMat, haloMat, haloMesh };
  }

  // Backwards compatibility reference for scene
  const turnDisc = landingSpotsGroup;

  let flightTimeline = null;
  let rollTimeline = null;
  let idleTween = null;
  let isRolling = false;
  let rollResolver = null;
  let lastRollValue = 1;

  function stopAllAnimations(force = false) {
    stopIdle();
    if (flightTimeline) {
      flightTimeline.kill();
      flightTimeline = null;
    }
    if (rollTimeline && (force || !isRolling)) {
      rollTimeline.kill();
      rollTimeline = null;
      isRolling = false;
      if (rollResolver) {
        const resolve = rollResolver;
        rollResolver = null;
        resolve(lastRollValue);
      }
    }
    if (force || !isRolling) {
      gsap.killTweensOf(diceGroup.position);
      gsap.killTweensOf(diceGroup.rotation);
    }
  }

  function startIdle() {
    stopIdle();
    if (isRolling) return;
    const currentSpot = DICE_SPOTS[currentColor] || DICE_SPOTS.red;
    // Gentle hovering breath
    idleTween = gsap.to(diceGroup.position, {
      y: currentSpot.y + 0.08,
      duration: 1.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }

  function stopIdle() {
    if (idleTween) {
      idleTween.kill();
      idleTween = null;
    }
  }

  startIdle();

  /** Smoothly glides the dice in an unbroken parabolic flight to the active player's spot */
  function setTurnColor(color, animated = true) {
    if (!DICE_SPOTS[color]) return;
    currentColor = color;

    // Update glowing active landing spot
    Object.entries(spotMeshes).forEach(([col, { haloMat, haloMesh, innerMat }]) => {
      const isActive = col === color;
      gsap.killTweensOf(haloMesh.scale);
      gsap.killTweensOf(haloMat);

      if (isActive) {
        haloMat.opacity = 0.65;
        innerMat.emissive.set(COLORS[col]).multiplyScalar(0.35);
        gsap.to(haloMesh.scale, {
          x: 1.15,
          y: 1.15,
          z: 1.15,
          duration: 0.7,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      } else {
        haloMat.opacity = 0.12;
        innerMat.emissive.set(COLORS[col]).multiplyScalar(0.08);
        haloMesh.scale.set(1, 1, 1);
      }
    });

    // If currently rolling, let the roll finish safely without interrupting its promise
    if (isRolling) return;

    const targetSpot = DICE_SPOTS[color];
    const startX = diceGroup.position.x;
    const startY = diceGroup.position.y;
    const startZ = diceGroup.position.z;
    const dist = Math.hypot(targetSpot.x - startX, targetSpot.z - startZ);

    if (!animated || dist < 0.08) {
      diceGroup.position.set(targetSpot.x, targetSpot.y, targetSpot.z);
      startIdle();
      return;
    }

    // Stop current animations cleanly
    stopAllAnimations(false);

    const flightDuration = Math.min(0.72, Math.max(0.42, dist * 0.085));
    const apexY = Math.max(startY, targetSpot.y) + Math.min(2.4, 0.9 + dist * 0.16);

    flightTimeline = gsap.timeline({
      onComplete: () => {
        flightTimeline = null;
        diceGroup.position.set(targetSpot.x, targetSpot.y, targetSpot.z);
        startIdle();
      },
    });

    // Horizontal smooth travel
    flightTimeline.to(
      diceGroup.position,
      {
        x: targetSpot.x,
        z: targetSpot.z,
        duration: flightDuration,
        ease: "power2.inOut",
      },
      0
    );

    // Parabolic vertical lift & smooth touchdown
    flightTimeline.to(
      diceGroup.position,
      {
        y: apexY,
        duration: flightDuration * 0.44,
        ease: "power2.out",
      },
      0
    );
    flightTimeline.to(
      diceGroup.position,
      {
        y: targetSpot.y,
        duration: flightDuration * 0.56,
        ease: "power2.inOut",
      },
      flightDuration * 0.44
    );

    // Natural in-flight spin
    flightTimeline.to(
      diceGroup.rotation,
      {
        y: diceGroup.rotation.y + Math.PI * 0.5,
        duration: flightDuration,
        ease: "power1.inOut",
      },
      0
    );
  }

  /** Rolls the dice smoothly from its current spot without snapping or locking */
  function roll(value) {
    lastRollValue = value;
    isRolling = true;

    stopIdle();
    if (flightTimeline) {
      flightTimeline.kill();
      flightTimeline = null;
    }

    const targetSpot = DICE_SPOTS[currentColor] || DICE_SPOTS.red;
    const target = FACE_UP_ROTATION[value];

    // Calculate final multi-turn rotations upfront for seamless deceleration
    const finalX = forwardAngle(diceGroup.rotation.x + Math.PI * randomInt(4, 6), target.x);
    const finalY = forwardAngle(diceGroup.rotation.y + Math.PI * randomInt(4, 6), target.y);
    const finalZ = forwardAngle(diceGroup.rotation.z + Math.PI * randomInt(3, 5), target.z);

    return new Promise((resolve) => {
      rollResolver = resolve;

      if (rollTimeline) {
        rollTimeline.kill();
      }

      rollTimeline = gsap.timeline({
        onComplete: () => {
          rollTimeline = null;
          isRolling = false;
          diceGroup.position.set(targetSpot.x, targetSpot.y, targetSpot.z);
          startIdle();
          if (rollResolver) {
            const res = rollResolver;
            rollResolver = null;
            res(value);
          }
        },
      });

      // Smoothly ensure x/z alignment with active spot during roll (never snap)
      rollTimeline.to(
        diceGroup.position,
        {
          x: targetSpot.x,
          z: targetSpot.z,
          duration: 0.35,
          ease: "power2.out",
        },
        0
      );

      // Upward throw
      rollTimeline.to(
        diceGroup.position,
        {
          y: targetSpot.y + 2.3,
          duration: 0.34,
          ease: "power2.out",
        },
        0
      );

      // Gravity fall
      rollTimeline.to(
        diceGroup.position,
        {
          y: targetSpot.y,
          duration: 0.42,
          ease: "power2.in",
        },
        0.34
      );

      // Micro bounce impact on saucer
      rollTimeline.to(
        diceGroup.position,
        {
          y: targetSpot.y + 0.2,
          duration: 0.1,
          ease: "power1.out",
        },
        0.76
      );
      rollTimeline.to(
        diceGroup.position,
        {
          y: targetSpot.y,
          duration: 0.14,
          ease: "bounce.out",
        },
        0.86
      );

      // Multi-axis tumble rotation
      rollTimeline.to(
        diceGroup.rotation,
        {
          x: finalX,
          y: finalY,
          z: finalZ,
          duration: 0.96,
          ease: "power3.out",
        },
        0
      );
    });
  }

  function setHovered(hovered) {
    gsap.to(diceGroup.scale, {
      x: hovered ? 1.08 : 1,
      y: hovered ? 1.08 : 1,
      z: hovered ? 1.08 : 1,
      duration: 0.2,
      ease: "power2.out",
    });
  }

  function dispose() {
    stopIdle();
    gsap.killTweensOf(diceGroup.rotation);
    gsap.killTweensOf(diceGroup.position);
    gsap.killTweensOf(diceGroup.scale);

    bodyGeometry.dispose();
    diceMaterial.dispose();
    pipGeometry.dispose();
    pipMaterial.dispose();
    pipRingGeometry.dispose();
    pipRingMaterial.dispose();
    spotBaseGeo.dispose();
    spotRingGeo.dispose();
    spotInnerGeo.dispose();
    spotHaloGeo.dispose();

    Object.values(spotMeshes).forEach(({ innerMat, haloMat }) => {
      innerMat.dispose();
      haloMat.dispose();
    });
  }

  return {
    diceGroup,
    diceMesh,
    turnDisc,
    landingSpotsGroup,
    clickableMeshes,
    roll,
    setTurnColor,
    setHovered,
    dispose,
  };
}
