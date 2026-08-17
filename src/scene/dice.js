import * as THREE from "three";
import gsap from "gsap";
import { COLORS } from "../game/constants.js";

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
 * Face layout on procedural cube:
 *   +Z = 1   -Z = 6   +X = 2
 *   -X = 5   +Y = 3   -Y = 4
 */
const FACE_UP_ROTATION = {
  1: { x: -Math.PI / 2, y: 0, z: 0 },
  2: { x: 0, y: 0, z: Math.PI / 2 },
  3: { x: 0, y: 0, z: 0 },
  4: { x: Math.PI, y: 0, z: 0 },
  5: { x: 0, y: 0, z: -Math.PI / 2 },
  6: { x: Math.PI / 2, y: 0, z: 0 },
};

const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function createDice() {
  const diceGroup = new THREE.Group();
  diceGroup.name = "Dice";
  diceGroup.position.set(7, 1.2, -0.2);

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

  /* A colored disc under the dice showing whose turn it is */
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

    const targetRot = FACE_UP_ROTATION[value] || FACE_UP_ROTATION[1];
    const targetEuler = new THREE.Euler(targetRot.x, targetRot.y, targetRot.z, "XYZ");
    const targetQuat = new THREE.Quaternion().setFromEuler(targetEuler);

    const startQuat = diceGroup.quaternion.clone();

    // Generate random multi-turn tumble quaternion
    const tumbleAxis = new THREE.Vector3(
      randomInt(1, 3) * (Math.random() < 0.5 ? 1 : -1),
      randomInt(1, 3) * (Math.random() < 0.5 ? 1 : -1),
      randomInt(1, 3) * (Math.random() < 0.5 ? 1 : -1),
    ).normalize();
    const tumbleTurns = randomInt(2, 4) * Math.PI * 2;

    return new Promise((resolve) => {
      const timeline = gsap.timeline({
        onComplete: () => {
          diceGroup.quaternion.copy(targetQuat);
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

      // Quaternion SLERP animation
      const rotProgress = { progress: 0 };
      timeline.to(
        rotProgress,
        {
          progress: 1,
          duration: 0.94,
          ease: "power3.out",
          onUpdate: () => {
            const p = rotProgress.progress;
            diceGroup.quaternion.slerpQuaternions(startQuat, targetQuat, p);

            const remainingSpin = (1 - p) * tumbleTurns;
            if (remainingSpin > 0.001) {
              const currentTumble = new THREE.Quaternion().setFromAxisAngle(tumbleAxis, remainingSpin);
              diceGroup.quaternion.multiply(currentTumble);
            }
          },
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
