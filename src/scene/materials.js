import * as THREE from "three";

import { COLORS } from "../game/constants.js";

/**
 * Shared material cache. Every mesh in the forest pulls from
 * here so a few hundred objects cost a handful of materials.
 */
const cache = new Map();

export function getMaterial(color, options = {}) {
  const key = [
    color,
    options.roughness ?? 1,
    options.metalness ?? 0,
    options.transparent ?? false,
  ].join("_");

  if (cache.has(key)) return cache.get(key);

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 1,
    metalness: options.metalness ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
  });

  cache.set(key, material);

  return material;
}

export const boardMaterials = {
  base: getMaterial("#8b6545", { roughness: 0.8 }),
  board: getMaterial(COLORS.cream, { roughness: 0.72 }),
  white: getMaterial(COLORS.white, { roughness: 0.72 }),
  dark: getMaterial(COLORS.dark, { roughness: 0.75 }),
  red: getMaterial(COLORS.red, { roughness: 0.55 }),
  green: getMaterial(COLORS.green, { roughness: 0.55 }),
  yellow: getMaterial(COLORS.yellow, { roughness: 0.55 }),
  blue: getMaterial(COLORS.blue, { roughness: 0.55 }),
};

export function colorMaterial(color) {
  return boardMaterials[color];
}

/** Frees everything the cache holds. Called on unmount. */
export function disposeMaterials() {
  cache.forEach((material) => material.dispose());
  cache.clear();
}
