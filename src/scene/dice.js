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

export function createDice() {
  const diceGroup = new THREE.Group();

  diceGroup.name = "Dice";

  diceGroup.position.set(7, 1.2, -0.2);

  const bodyGeometry = new THREE.BoxGeometry(1.25, 1.25, 1.25, 4, 4, 4);

  const diceMaterial = new THREE.MeshPhysicalMaterial({
    color: "#fcfaf4",
    transmission: 0.35,
    opacity: 0.98,
    transparent: true,
    roughness: 0.28,
    metalness: 0.02,
    ior: 1.45,
    thickness: 0.7,
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
    reflectivity: 0.5,
  });

  const diceMesh = new THREE.Mesh(bodyGeometry, diceMaterial);

  diceMesh.castShadow = true;
  diceMesh.receiveShadow = true;

  diceGroup.add(diceMesh);

  // Soft inner core for subtle color diffusion
  const innerGemGeometry = new THREE.OctahedronGeometry(0.5, 0);
  const innerGemMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    emissive: COLORS.red,
    emissiveIntensity: 0.2,
    roughness: 0.4,
    metalness: 0.1,
    transparent: true,
    opacity: 0.35,
  });
  const innerGem = new THREE.Mesh(innerGemGeometry, innerGemMaterial);
  diceGroup.add(innerGem);

  const pipGeometry = new THREE.SphereGeometry(0.108, 16, 12);
  const pipRingGeometry = new THREE.TorusGeometry(0.115, 0.018, 10, 24);

  const pipMaterial = new THREE.MeshStandardMaterial({
    color: "#111116",
    roughness: 0.15,
    metalness: 0.85,
  });

  const pipRingMaterial = new THREE.MeshStandardMaterial({
    color: "#d4af37",
    roughness: 0.3,
    metalness: 0.9,
  });

  function addFace(value, face) {
    for (const [px, py] of PIP_LAYOUT[value]) {
      const sx = px * PIP_SCALE;
      const sy = py * PIP_SCALE;

      const position = {
        front: [sx, sy, FACE_OFFSET],
        back: [-sx, sy, -FACE_OFFSET],
        right: [FACE_OFFSET, sy, -sx],
        left: [-FACE_OFFSET, sy, sx],
        top: [sx, FACE_OFFSET, -sy],
        bottom: [sx, -FACE_OFFSET, sy],
      }[face];

      const pip = new THREE.Mesh(pipGeometry, pipMaterial);
      pip.position.set(...position);
      pip.castShadow = true;
      diceGroup.add(pip);

      // Gold highlight ring around each dot
      const ring = new THREE.Mesh(pipRingGeometry, pipRingMaterial);
      ring.position.set(...position);
      if (face === "front" || face === "back") ring.rotation.x = 0;
      else if (face === "top" || face === "bottom") ring.rotation.x = Math.PI / 2;
      else ring.rotation.y = Math.PI / 2;
      diceGroup.add(ring);
    }
  }

  addFace(1, "front");
  addFace(6, "back");
  addFace(2, "right");
  addFace(5, "left");
  addFace(3, "top");
  addFace(4, "bottom");

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
    innerGemMaterial.emissive.set(COLORS[color]);
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
    innerGemGeometry.dispose();
    innerGemMaterial.dispose();
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
