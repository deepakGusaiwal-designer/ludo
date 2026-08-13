import * as THREE from "three";

import {
  COLORS,
  PLAYER_COLORS,
  TOKENS_PER_PLAYER,
  TOKEN_HEIGHT,
  YARD_SLOTS,
} from "../game/constants.js";

import { colorMaterial, getMaterial } from "./materials.js";

/**
 * Builds the sixteen pieces and returns them keyed by the id
 * the rules engine uses (`red-0`, `green-3`, ...), so the
 * scene and the rules never need to agree on array order.
 */
export function createTokens(boardGroup) {
  const bodyGeometry = new THREE.CylinderGeometry(0.18, 0.23, 0.38, 20);

  const headGeometry = new THREE.SphereGeometry(
    0.20,
    16,
    8,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );

  const footGeometry = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 20);

  const ringGeometry = new THREE.TorusGeometry(0.31, 0.045, 8, 26);

  const ringMaterial = new THREE.MeshStandardMaterial({
    color: "#fff6cf",
    emissive: "#e8c766",
    emissiveIntensity: 1.4,
    roughness: 0.4,
  });

  const byId = new Map();

  for (const color of PLAYER_COLORS) {
    for (let slot = 0; slot < TOKENS_PER_PLAYER; slot++) {
      const id = `${color}-${slot}`;

      const group = new THREE.Group();

      group.name = `Token-${id}`;

      const material = colorMaterial(color);

      const body = new THREE.Mesh(bodyGeometry, material);
      body.position.y = 0.22;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      const head = new THREE.Mesh(headGeometry, material);
      head.position.y = 0.41;
      head.castShadow = true;
      group.add(head);

      const foot = new THREE.Mesh(
        footGeometry,
        getMaterial(COLORS[`${color}Dark`]),
      );
      foot.position.y = 0.03;
      foot.castShadow = true;
      group.add(foot);

      // the "you can move this" ring, hidden until needed
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.00;
      ring.visible = false;
      group.add(ring);

      const [x, z] = YARD_SLOTS[color][slot];

      group.position.set(x, TOKEN_HEIGHT, z);

      group.userData = { id, color, slot, ring };

      boardGroup.add(group);

      byId.set(id, group);
    }
  }

  return {
    byId,
    all: [...byId.values()],
    dispose() {
      bodyGeometry.dispose();
      headGeometry.dispose();
      footGeometry.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
    },
  };
}
