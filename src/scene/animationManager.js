import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const gltfLoader = new GLTFLoader();
const animationCache = new Map();
let loadPromise = null;

export const ANIMATION_KEYS = {
  IDLE: "idle",
  WALKING: "walking",
  RUNNING: "running",
  JUMP: "jump",
  SITTING: "sitting",
  TALKING: "talking",
};

const ANIMATION_PATHS = {
  idle: "/modal/animations/idle.glb",
  walking: "/modal/animations/walking.glb",
  running: "/modal/animations/running.glb",
  jump: "/modal/animations/jump.glb",
  sitting: "/modal/animations/sitting.glb",
  talking: "/modal/animations/talking.glb",
};

/**
 * Normalizes bone track names so they target the bone nodes regardless of prefix.
 */
function normalizeClipTracks(clip) {
  if (!clip || !clip.tracks) return clip;

  for (const track of clip.tracks) {
    // Convert paths like "Armature.mixamorig:Hips.quaternion" or "mixamorigHips.quaternion"
    // into standard node target "mixamorig:Hips.quaternion"
    const parts = track.name.split(".");
    const property = parts[parts.length - 1];
    let nodeName = parts.slice(0, -1).join(".");

    // Strip common armature prefixes
    nodeName = nodeName.replace(/^Armature\|/, "").replace(/^Armature\./, "").replace(/^gangster\./, "").replace(/^gangster_mesh\./, "");

    // Ensure colon syntax if missing
    if (nodeName.startsWith("mixamorig") && !nodeName.includes(":")) {
      nodeName = nodeName.replace("mixamorig", "mixamorig:");
    }

    track.name = `${nodeName}.${property}`;
  }

  return clip;
}

/**
 * Preloads and caches all GLTF/GLB character animations.
 */
export async function preloadAnimations() {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const promises = Object.entries(ANIMATION_PATHS).map(async ([key, url]) => {
      if (animationCache.has(key)) return [key, animationCache.get(key)];
      try {
        const res = await fetch(url, { method: "HEAD" });
        const contentType = res.headers.get("content-type") || "";
        // If file doesn't exist or Vite serves SPA HTML fallback, skip silently
        if (!res.ok || contentType.includes("text/html")) {
          return [key, null];
        }

        const gltf = await new Promise((resolve, reject) => {
          gltfLoader.load(url, resolve, undefined, reject);
        });
        if (gltf.animations && gltf.animations.length > 0) {
          const clip = gltf.animations[0];
          clip.name = key;
          normalizeClipTracks(clip);
          animationCache.set(key, clip);
          return [key, clip];
        }
      } catch {
        // Fall back to procedural physics animation without console noise
      }
      return [key, null];
    });

    await Promise.all(promises);
    return animationCache;
  })();

  return loadPromise;
}

export function getAnimation(key) {
  return animationCache.get(key) || null;
}

/**
 * Manages an AnimationMixer for a specific 3D character instance.
 */
export class CharacterAnimator {
  constructor(rootModel) {
    this.root = rootModel;
    this.mixer = new THREE.AnimationMixer(rootModel);
    this.actions = new Map();
    this.currentAction = null;
    this.currentKey = null;

    // Register all currently loaded clips
    this.bindClips();

    // Start with idle animation if available
    this.play(ANIMATION_KEYS.IDLE, { loop: THREE.LoopRepeat, duration: 0.3 });
  }

  bindClips() {
    for (const [key, clip] of animationCache.entries()) {
      if (clip && !this.actions.has(key)) {
        try {
          const action = this.mixer.clipAction(clip);
          this.actions.set(key, action);
        } catch (e) {
          console.warn(`[CharacterAnimator] Failed to bind clip [${key}]:`, e);
        }
      }
    }
  }

  play(key, { loop = THREE.LoopRepeat, duration = 0.25, timeScale = 1.0, clampWhenFinished = false } = {}) {
    if (this.currentKey === key && this.currentAction?.isRunning()) return;

    if (!this.actions.has(key)) {
      this.bindClips();
    }

    const action = this.actions.get(key);
    if (!action) return;

    action.setLoop(loop);
    action.clampWhenFinished = clampWhenFinished;
    action.timeScale = timeScale;
    action.reset();

    if (this.currentAction && this.currentAction !== action) {
      this.currentAction.crossFadeTo(action, duration, true);
    }
    action.play();
    this.currentAction = action;
    this.currentKey = key;
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.root);
    }
  }
}
