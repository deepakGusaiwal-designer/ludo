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

export function createDice() {
  const diceGroup = new THREE.Group();

  diceGroup.name = "Dice";

  diceGroup.position.set(5.8, 1.2, 0.0);

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

  // show a 1 before the first roll
  const initial = FACE_UP_ROTATION[1];

  diceGroup.rotation.set(initial.x, initial.y, initial.z);

  /* a colored disc under the dice showing whose turn it is */

  const discMaterial = new THREE.MeshStandardMaterial({
    color: COLORS.red,
    roughness: 0.55,
  });

  const discGeometry = new THREE.CylinderGeometry(0.9, 0.9, 0.05, 32);

  const turnDisc = new THREE.Mesh(discGeometry, discMaterial);

  turnDisc.position.set(diceGroup.position.x, 0.03, diceGroup.position.z);
  turnDisc.receiveShadow = true;

  let idleTween = null;

  function startIdle() {
    stopIdle();
    diceGroup.position.y = 1.2;
  }

  function stopIdle() {
    if (idleTween) {
      idleTween.kill();
      idleTween = null;
    }
  }

  startIdle();

  /** Rolls, and resolves with the value once it has settled. */
  function roll(value) {
    stopIdle();

    gsap.killTweensOf(diceGroup.rotation);
    gsap.killTweensOf(diceGroup.position);

    const target = FACE_UP_ROTATION[value];

    // Calculate final multi-turn rotations upfront for seamless deceleration
    const finalX = forwardAngle(diceGroup.rotation.x + Math.PI * randomInt(4, 6), target.x);
    const finalY = forwardAngle(diceGroup.rotation.y + Math.PI * randomInt(4, 6), target.y);
    const finalZ = forwardAngle(diceGroup.rotation.z + Math.PI * randomInt(3, 5), target.z);

    return new Promise((resolve) => {
      const timeline = gsap.timeline({
        onComplete: () => {
          startIdle();
          resolve(value);
        },
      });

      // Upward throw
      timeline.to(diceGroup.position, {
        y: 3.4,
        duration: 0.32,
        ease: "power2.out",
      });

      // Gravity fall
      timeline.to(diceGroup.position, {
        y: 1.2,
        duration: 0.42,
        ease: "power2.in",
      });

      // Micro bounce impact on board
      timeline.to(diceGroup.position, {
        y: 1.38,
        duration: 0.1,
        ease: "power1.out",
      });
      timeline.to(diceGroup.position, {
        y: 1.2,
        duration: 0.12,
        ease: "bounce.out",
      });

      // Single continuous rotation timeline covering the entire throw duration (0.94s)
      timeline.to(
        diceGroup.rotation,
        {
          x: finalX,
          y: finalY,
          z: finalZ,
          duration: 0.94,
          ease: "power3.out",
        },
        0,
      );
    });
  }

  function setTurnColor(color) {
    discMaterial.color.set(COLORS[color]);
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
    discGeometry.dispose();
    discMaterial.dispose();
  }

  return {
    diceGroup,
    diceMesh,
    turnDisc,
    roll,
    setTurnColor,
    setHovered,
    dispose,
  };
}
