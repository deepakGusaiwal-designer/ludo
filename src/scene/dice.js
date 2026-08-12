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

  const diceMesh = new THREE.Mesh(
    bodyGeometry,
    getMaterial("#ffffff", { roughness: 0.38 }),
  );

  diceMesh.castShadow = true;
  diceMesh.receiveShadow = true;

  diceGroup.add(diceMesh);

  const pipGeometry = new THREE.SphereGeometry(0.09, 12, 8);

  const pipMaterial = getMaterial("#302a22", { roughness: 0.65 });

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

    idleTween = gsap.to(diceGroup.position, {
      y: 1.35,
      duration: 2.2,
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

  /** Rolls, and resolves with the value once it has settled. */
  function roll(value) {
    stopIdle();

    gsap.killTweensOf(diceGroup.rotation);
    gsap.killTweensOf(diceGroup.position);

    const target = FACE_UP_ROTATION[value];

    const tumble = {
      x: diceGroup.rotation.x + Math.PI * randomInt(3, 5),
      y: diceGroup.rotation.y + Math.PI * randomInt(3, 5),
      z: diceGroup.rotation.z + Math.PI * randomInt(2, 4),
    };

    return new Promise((resolve) => {
      const timeline = gsap.timeline({
        onComplete: () => {
          startIdle();
          resolve(value);
        },
      });

      timeline.to(diceGroup.position, {
        y: 3.2,
        duration: 0.35,
        ease: "power2.out",
      });

      timeline.to(
        diceGroup.rotation,
        { ...tumble, duration: 0.9, ease: "power2.inOut" },
        "<",
      );

      timeline.to(diceGroup.position, {
        y: 1.2,
        duration: 0.5,
        ease: "bounce.out",
      });

      timeline.to(diceGroup.rotation, {
        x: forwardAngle(tumble.x, target.x),
        y: forwardAngle(tumble.y, target.y),
        z: forwardAngle(tumble.z, target.z),
        duration: 0.45,
        ease: "back.out(1.5)",
      });
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
    pipGeometry.dispose();
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
