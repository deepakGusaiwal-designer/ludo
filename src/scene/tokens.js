import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

import {
  COLORS,
  PLAYER_COLORS,
  TOKENS_PER_PLAYER,
  TOKEN_HEIGHT,
  YARD_SLOTS,
} from "../game/constants.js";

import { colorMaterial, getMaterial } from "./materials.js";

/**
 * Builds the sixteen 3D human character tokens loaded from `/modal/human.glb`,
 * applies team home colors (Red, Green, Yellow, Blue), and plays idle animation.
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
  const tokenGroups = [];
  const mixers = [];

  for (const color of PLAYER_COLORS) {
    for (let slot = 0; slot < TOKENS_PER_PLAYER; slot++) {
      const id = `${color}-${slot}`;

      const group = new THREE.Group();

      group.name = `Token-${id}`;

      const material = colorMaterial(color);

      // Fallback/placeholder primitive meshes while GLTF loads
      const body = new THREE.Mesh(bodyGeometry, material);
      body.name = "placeholder-body";
      body.position.y = 0.22;
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      const head = new THREE.Mesh(headGeometry, material);
      head.name = "placeholder-head";
      head.position.y = 0.41;
      head.castShadow = true;
      group.add(head);

      const foot = new THREE.Mesh(
        footGeometry,
        getMaterial(COLORS[`${color}Dark`]),
      );
      foot.name = "placeholder-foot";
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

      group.userData = {
        id,
        color,
        slot,
        ring,
        placeholderBody: body,
        placeholderHead: head,
        placeholderFoot: foot,
      };

      boardGroup.add(group);

      byId.set(id, group);
      tokenGroups.push(group);
    }
  }

  // Load 3D Human Model (/modal/human.glb)
  const loader = new GLTFLoader();
  loader.load(
    "/modal/human.glb",
    (gltf) => {
      const model = gltf.scene;
      const idleClip =
        gltf.animations?.find((a) => a.name.toLowerCase() === "idle") ||
        gltf.animations?.[0];

      // Calculate model dimensions and scale to fit Ludo tile
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);

      const targetHeight = 0.74;
      const scale = targetHeight / (size.y || 1);
      model.scale.set(scale, scale, scale);

      // Center model base directly on board tile
      box.setFromObject(model);
      const minY = box.min.y;
      model.position.y = -minY;

      tokenGroups.forEach((group) => {
        const { color, placeholderBody, placeholderHead, placeholderFoot } =
          group.userData;

        // Remove placeholder primitives
        if (placeholderBody) group.remove(placeholderBody);
        if (placeholderHead) group.remove(placeholderHead);
        if (placeholderFoot) group.remove(placeholderFoot);

        const characterInstance = SkeletonUtils.clone(model);
        characterInstance.name = `HumanCharacter-${group.userData.id}`;

        const teamColorHex = COLORS[color];

        // Shared material cache per team color to avoid 384 unique material clones
        if (!loader._materialCache) loader._materialCache = new Map();

        characterInstance.traverse((child, subIdx) => {
          if (child.isMesh) {
            // Compute geometry bounding box to identify submesh parts
            if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
            const box = child.geometry.boundingBox;
            const minY = box ? box.min.y : 0;
            const maxY = box ? box.max.y : 2.5;
            const height = maxY - minY;

            // Jacket condition: main coat body & sleeves
            const isJacket = minY >= 1.00 && maxY <= 2.18 && height >= 0.90;
            // Hair condition: top of head hair submeshes
            const isHair = minY >= 1.80 && maxY >= 2.45;
            // Face / Skin condition: face area
            const isFace = minY >= 2.00 && !isHair;

            // Only main outer jacket/pants cast shadows to save 75%+ shadow render overhead
            child.castShadow = isJacket || minY <= 0.8;
            child.receiveShadow = false;

            if (child.material) {
              const cacheKey = `${color}-${child.name || subIdx}`;
              if (!loader._materialCache.has(cacheKey)) {
                const mat = child.material.clone();
                mat.roughness = 0.42;
                mat.metalness = 0.10;

                if (isJacket) {
                  mat.color = new THREE.Color(teamColorHex);
                  mat.emissive = new THREE.Color(teamColorHex);
                  mat.emissiveIntensity = 0.18;
                } else if (isHair) {
                  // Jet Black Hair
                  mat.color = new THREE.Color("#0a0a0c");
                  mat.emissive = new THREE.Color("#000000");
                  mat.emissiveIntensity = 0;
                  mat.roughness = 0.65;
                } else if (isFace) {
                  // Radiant fair skin tone
                  mat.color = new THREE.Color("#fde6d8");
                  mat.emissive = new THREE.Color("#ffd8c7");
                  mat.emissiveIntensity = 0.22;
                  mat.roughness = 0.40;
                }
                loader._materialCache.set(cacheKey, mat);
              }
              child.material = loader._materialCache.get(cacheKey);
            }
          }
        });

        // Store Mixamo bone joint references for leg-by-leg step walking animation
        const bones = {};
        characterInstance.traverse((node) => {
          if (node.isBone || (node.name && node.name.startsWith("mixamorig:"))) {
            const name = node.name.toLowerCase();
            if (name.includes("leftupleg")) bones.leftUpLeg = node;
            else if (name.includes("rightupleg")) bones.rightUpLeg = node;
            else if (name.includes("leftleg") && !name.includes("up")) bones.leftKnee = node;
            else if (name.includes("rightleg") && !name.includes("up")) bones.rightKnee = node;
            // else if (name.includes("leftarm") && !name.includes("fore")) bones.leftArm = node;
            // else if (name.includes("rightarm") && !name.includes("fore")) bones.rightArm = node;
            else if (name.includes("hips")) bones.hips = node;
            else if (name.includes("spine")) bones.spine = node;
          }
        });

        group.userData.bones = bones;

        // Set up AnimationMixer & play idle animation clip
        const mixer = new THREE.AnimationMixer(characterInstance);
        let idleAction = null;
        if (idleClip) {
          idleAction = mixer.clipAction(idleClip);
          idleAction.play();
        }
        mixers.push(mixer);

        group.userData.mixer = mixer;
        group.userData.idleAction = idleAction;
        group.add(characterInstance);
      });
    },
    undefined,
    (err) => {
      console.warn("Could not load /modal/human.glb:", err);
    },
  );

  return {
    byId,
    all: [...byId.values()],
    mixers,
    update(delta) {
      mixers.forEach((m) => m.update(delta));
    },
    dispose() {
      bodyGeometry.dispose();
      headGeometry.dispose();
      footGeometry.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
    },
  };
}

