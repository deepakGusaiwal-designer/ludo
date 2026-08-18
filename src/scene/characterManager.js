import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { preloadAnimations } from "./animationManager.js";

const STORAGE_KEY = "ludo_selected_character";

export const CHARACTERS = [
  {
    id: "woman-cutie",
    name: "Cutie Girl",
    desc: "Charming and stylish character with playful aesthetic (Default)",
    modelPath: "/modal/woman-cutie.glb",
    previewEmoji: "🌸",
    badge: "Default",
    targetHeight: 0.58,
  },
  {
    id: "woman-officer",
    name: "Officer Lady",
    desc: "Disciplined uniform hero ready for strategic battle",
    modelPath: "/modal/woman-officer.glb",
    previewEmoji: "👮‍♀️",
    badge: "New",
    targetHeight: 0.58,
  },
  {
    id: "peon",
    name: "Royal Peon",
    desc: "Crafted 3D luxury chess-style peon pawn piece",
    modelPath: "/modal/peon.glb",
    previewEmoji: "♟️",
    badge: "Pawn",
    targetHeight: 0.52,
  },
  {
    id: "classic",
    name: "Classic Pawn",
    desc: "Traditional wooden & crystal geometric Ludo token piece",
    modelPath: null,
    previewEmoji: "🎲",
    badge: "Retro",
    targetHeight: 0.55,
  },
];

// Start preloading FBX animation clips in background
preloadAnimations().catch(() => {});

export function getSelectedCharacter() {
  if (typeof localStorage === "undefined") return "woman-cutie";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && CHARACTERS.some((c) => c.id === saved)) {
    return saved;
  }
  return "woman-cutie";
}

export function saveSelectedCharacter(charId) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, charId);
  }
}

const gltfLoader = new GLTFLoader();
const modelCache = new Map();

/**
 * Loads, normalizes dimensions, and caches a character GLTF model template.
 */
export async function loadCharacterModel(charId) {
  const char = CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];
  if (!char.modelPath) return null;

  if (modelCache.has(charId)) {
    return modelCache.get(charId);
  }

  try {
    const gltf = await new Promise((resolve, reject) => {
      gltfLoader.load(char.modelPath, resolve, undefined, reject);
    });

    const root = gltf.scene;

    root.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Force update world matrices to calculate accurate bounding box
    root.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const targetHeight = char.targetHeight || 0.58;
    const height = size.y > 0.05 ? size.y : Math.max(size.x, size.z);
    const scale = targetHeight / (height || 1.0);

    const container = new THREE.Group();
    root.scale.set(scale, scale, scale);
    root.position.set(
      -center.x * scale,
      -box.min.y * scale,
      -center.z * scale,
    );
    container.add(root);

    modelCache.set(charId, container);
    return container;
  } catch (error) {
    console.error(`Failed to load character model [${charId}]:`, error);
    return null;
  }
}

/**
 * Clones a character template using SkeletonUtils so that armatures and bones are cloned properly.
 */
export function cloneCharacterInstance(template) {
  if (!template) return null;
  return SkeletonUtils.clone(template);
}
