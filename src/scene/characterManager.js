import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { preloadAnimations } from "./animationManager.js";

const STORAGE_KEY = "ludo_selected_character";

const BASE_URL = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");

export const CHARACTERS = [
  {
    id: "woman-cutie",
    name: "Cutie Girl",
    desc: "Charming and stylish character with playful aesthetic (Default)",
    modelPaths: [
      `${BASE_URL}/modal/woman-cutie.glb`,
      `/modal/woman-cutie.glb`,
      `./modal/woman-cutie.glb`,
    ],
    previewEmoji: "🌸",
    badge: "Default",
    targetHeight: 0.64,
  },
  {
    id: "warrior-pawn",
    name: "Warrior Pawn",
    desc: "Armored mythical warrior token forged for conquest",
    modelPaths: [
      `${BASE_URL}/modal/pawn_model/scene.gltf`,
      `${BASE_URL}/modal/pawn__model/scene.gltf`,
      `/modal/pawn_model/scene.gltf`,
      `/modal/pawn__model/scene.gltf`,
      `./modal/pawn_model/scene.gltf`,
    ],
    previewEmoji: "⚔️",
    badge: "Warrior",
    targetHeight: 0.62,
  },
  {
    id: "woman-officer",
    name: "Officer Lady",
    desc: "Disciplined uniform hero ready for strategic battle",
    modelPaths: [
      `${BASE_URL}/modal/woman-officer.glb`,
      `/modal/woman-officer.glb`,
      `./modal/woman-officer.glb`,
    ],
    previewEmoji: "👮‍♀️",
    badge: "New",
    targetHeight: 0.64,
  },
  {
    id: "rabbit",
    name: "Little Rabbit",
    desc: "Adorable bunny token with bouncy spirit and charming energy",
    modelPaths: [
      `${BASE_URL}/modal/rabbit.glb`,
      `${BASE_URL}/modal/Little-Rabbit.glb`,
      `${BASE_URL}/modal/Little+Rabbit.glb`,
      `/modal/rabbit.glb`,
      `/modal/Little-Rabbit.glb`,
      `/modal/Little+Rabbit.glb`,
      `./modal/rabbit.glb`,
    ],
    previewEmoji: "🐰",
    badge: "Cute",
    targetHeight: 0.64,
  },
  {
    id: "peon",
    name: "Royal Peon",
    desc: "Crafted 3D luxury chess-style peon pawn piece",
    modelPaths: [
      `${BASE_URL}/modal/peon.glb`,
      `/modal/peon.glb`,
      `./modal/peon.glb`,
    ],
    previewEmoji: "♟️",
    badge: "Pawn",
    targetHeight: 0.57,
  },
  {
    id: "classic",
    name: "Classic Pawn",
    desc: "Traditional wooden & crystal geometric Ludo token piece",
    modelPaths: [],
    previewEmoji: "🎲",
    badge: "Retro",
    targetHeight: 0.60,
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
 * Tries candidate URLs in order until one loads successfully.
 */
export async function loadCharacterModel(charId) {
  const char = CHARACTERS.find((c) => c.id === charId) || CHARACTERS[0];
  if (!char.modelPaths || char.modelPaths.length === 0) return null;

  if (modelCache.has(charId)) {
    return modelCache.get(charId);
  }

  let gltf = null;
  let lastError = null;

  for (const url of char.modelPaths) {
    try {
      gltf = await new Promise((resolve, reject) => {
        gltfLoader.load(url, resolve, undefined, reject);
      });
      if (gltf && gltf.scene) {
        break; // Successfully loaded
      }
    } catch (err) {
      lastError = err;
    }
  }

  if (!gltf || !gltf.scene) {
    console.warn(`[loadCharacterModel] Could not load model for [${charId}]. Falling back gracefully.`, lastError);
    return null;
  }

  try {
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
    console.error(`Failed to process character model [${charId}]:`, error);
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
