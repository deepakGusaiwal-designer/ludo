import * as THREE from "three";
import gsap from "gsap";

import {
  COLORS,
  PLAYER_COLORS,
  TOKENS_PER_PLAYER,
  TOKEN_HEIGHT,
  YARD_SLOTS,
} from "../game/constants.js";

import { colorMaterial, getMaterial } from "./materials.js";
import {
  cloneCharacterInstance,
  getSelectedCharacter,
  loadCharacterModel,
} from "./characterManager.js";
import {
  CharacterAnimator,
  ANIMATION_KEYS,
  preloadAnimations,
} from "./animationManager.js";

/**
 * Builds the sixteen pieces and returns them keyed by the id
 * the rules engine uses (`red-0`, `green-3`, ...), so the
 * scene and the rules never need to agree on array order.
 *
 * Supports 3D Character Pawns (Woman Cutie, Woman Officer, Gangster, Classic).
 */
export function createTokens(boardGroup, initialCharacterId = null) {
  let currentCharacterId = initialCharacterId || getSelectedCharacter();

  const bodyGeometry = new THREE.CylinderGeometry(0.22, 0.275, 0.44, 20);
  const headGeometry = new THREE.SphereGeometry(
    0.23,
    16,
    8,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  const footGeometry = new THREE.CylinderGeometry(0.285, 0.285, 0.077, 20);

  const ringGeometry = new THREE.TorusGeometry(0.375, 0.055, 8, 26);
  const ringMaterial = new THREE.MeshStandardMaterial({
    color: "#fff6cf",
    emissive: "#e8c766",
    emissiveIntensity: 1.4,
    roughness: 0.4,
  });

  const byId = new Map();
  const tokenVisuals = new Map();

  function buildClassicPawn(color) {
    const group = new THREE.Group();
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

    return group;
  }

  function applyTeamColorsToModel(model, color) {
    const teamHex = COLORS[color];
    const teamThreeColor = new THREE.Color(teamHex);

    // List of material names or mesh names that correspond to clothing / outfits / pawns
    const CLOTHING_MATERIAL_NAMES = new Set([
      "Material.067",  // Woman cutie skirt / pants
      "Material.068",  // Woman cutie top / shirt
      "Material.062",  // Woman cutie ribbon / bow
      "Material.059",  // Woman cutie socks
      "Material.324",  // Woman officer pants
      "lambert2SG.004", // Woman officer jacket / top
      "lambert2SG.003", // Woman officer hat fabric
      "Material.329",  // Woman officer epaulets
      "Material.330",  // Woman officer insignia
      "Material.001",  // Peon pawn material
    ]);

    const CLOTHING_MESH_KEYWORDS = [
      "Vert.028", "Vert.029", "Vert028", "Vert029",
      "Vert.031", "Vert.078", "Vert031", "Vert078",
      "Object_7", "Object7", "Cylinder.017", "Cylinder017",
      "Cube.028", "Cube028", "Cube.024", "Cube024",
      "peon_mesh", "Circle", "peon",
    ];

    const NON_CLOTHING_KEYWORDS = [
      "Retopo", "EYE", "Eye", "eye", "Material.064", "Material.326", "Material.327", "Material.069", "Material.328",
    ];

    model.traverse((child) => {
      if (!child.isMesh) return;

      const isPants = Boolean(
        child.name?.toLowerCase().includes("pants") ||
        child.parent?.name?.toLowerCase().includes("pants") ||
        child.name === "Roundcube.002"
      );

      const isForbidden = !isPants && NON_CLOTHING_KEYWORDS.some(
        (kw) => (child.name && child.name.includes(kw)) || (child.material?.name && child.material.name.includes(kw))
      );
      if (isForbidden) return;

      const isClothingMesh = isPants || CLOTHING_MESH_KEYWORDS.some((kw) =>
        child.name && child.name.includes(kw)
      );

      const processMaterial = (mat) => {
        if (!mat) return mat;

        if (isPants) {
          const clonedMat = mat.clone();
          clonedMat.color = teamThreeColor.clone();
          if (clonedMat.emissive) {
            clonedMat.emissive = teamThreeColor.clone().multiplyScalar(0.25);
          }
          return clonedMat;
        }

        const isClothingMat = Boolean(
          mat?.name && CLOTHING_MATERIAL_NAMES.has(mat.name)
        );
        const isPeon =
          mat?.name === "Material.001" ||
          child.name.includes("peon") ||
          child.name.includes("Circle");
        const isWarriorPawn =
          child.name?.startsWith("Object_") ||
          child.parent?.name?.includes("pawn.stl") ||
          child.name?.includes("pawn.stl");

        if (isPeon) {
          const clonedMat = mat.clone();
          // Real authentic team colors with shiny mirror luster
          clonedMat.color = teamThreeColor.clone();
          clonedMat.roughness = 0.12; // Ultra shiny polish
          clonedMat.metalness = 0.35; // Glossy sheen
          clonedMat.emissive = teamThreeColor.clone().multiplyScalar(0.18);
          if ("clearcoat" in clonedMat) {
            clonedMat.clearcoat = 1.0;
            clonedMat.clearcoatRoughness = 0.08;
          }
          return clonedMat;
        }

        if (isWarriorPawn) {
          const clonedMat = (mat || new THREE.MeshStandardMaterial()).clone();
          const goldColor = new THREE.Color("#d4a036");
          // Subtle 12% gold warmth so team color remains crisp and dominant
          const blendedColor = teamThreeColor.clone().lerp(goldColor, 0.12);

          clonedMat.color = blendedColor;
          clonedMat.roughness = 0.22; // Smooth glossy armor
          clonedMat.metalness = 0.38; // Subtle metallic sheen
          clonedMat.emissive = teamThreeColor.clone().multiplyScalar(0.14);
          if ("clearcoat" in clonedMat) {
            clonedMat.clearcoat = 0.65;
            clonedMat.clearcoatRoughness = 0.10;
          }
          return clonedMat;
        }

        if (mat.name?.includes("tripo") || child.name?.includes("tripo")) {
          const clonedMat = mat.clone();
          // Apply team color to rabbit token piece
          clonedMat.color = teamThreeColor.clone();
          if (clonedMat.emissive) {
            clonedMat.emissive = teamThreeColor.clone().multiplyScalar(0.18);
          }
          return clonedMat;
        }

        if (isClothingMat || isClothingMesh) {
          const clonedMat = mat.clone();
          clonedMat.color = teamThreeColor.clone();
          if (clonedMat.emissive) {
            clonedMat.emissive = teamThreeColor.clone().multiplyScalar(0.15);
          }
          return clonedMat;
        }
        return mat;
      };

      if (Array.isArray(child.material)) {
        child.material = child.material.map(processMaterial);
      } else {
        child.material = processMaterial(child.material);
      }
    });
  }

  function buildCharacterPawn(template, color) {
    const group = new THREE.Group();

    // Clone 3D character mesh directly on board without base disk
    const charModel = cloneCharacterInstance(template);
    if (charModel) {
      applyTeamColorsToModel(charModel, color);
      charModel.scale.set(1.19, 1.19, 1.19);
      charModel.position.y = 0.00;
      group.add(charModel);

      // Create AnimationMixer controller using FBX animation clips
      const animator = new CharacterAnimator(charModel);
      group.userData.animator = animator;

      // Detect and cache bone nodes for dynamic body rigging physics fallback
      const rigData = {
        spine: null,
        head: null,
        leftArm: null,
        rightArm: null,
        initialRotations: new Map(),
      };

      charModel.traverse((child) => {
        if (child.isBone) {
          const n = child.name.toLowerCase();
          if (n.includes("spine1") || (n.includes("spine") && !rigData.spine)) {
            rigData.spine = child;
          } else if (n.includes("head")) {
            rigData.head = child;
          } else if (n.includes("leftarm")) {
            rigData.leftArm = child;
          } else if (n.includes("rightarm")) {
            rigData.rightArm = child;
          }
          rigData.initialRotations.set(child, {
            x: child.rotation.x,
            y: child.rotation.y,
            z: child.rotation.z,
          });
        }
      });

      group.userData.rigData = rigData;
    }

    return group;
  }

  // Build initial token groups
  for (const color of PLAYER_COLORS) {
    for (let slot = 0; slot < TOKENS_PER_PLAYER; slot++) {
      const id = `${color}-${slot}`;
      const group = new THREE.Group();
      group.name = `Token-${id}`;

      // Visual sub-container where character or classic model lives
      const visualContainer = new THREE.Group();
      visualContainer.name = "visual";
      group.add(visualContainer);
      tokenVisuals.set(id, visualContainer);

      // Start with classic pawn immediately so there's zero pop-in lag
      const initialMesh = buildClassicPawn(color);
      visualContainer.add(initialMesh);

      // The "you can move this" highlight ring, hidden until needed
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.00;
      ring.visible = false;
      group.add(ring);

      const [x, z] = YARD_SLOTS[color][slot];
      group.position.set(x, TOKEN_HEIGHT, z);
      group.userData = { id, color, slot, ring, baseScale: 1.0, isMoving: false };

      boardGroup.add(group);
      byId.set(id, group);
    }
  }

  // Load and apply selected character asynchronously
  async function applyCharacter(charId) {
    currentCharacterId = charId;

    if (charId === "classic") {
      for (const color of PLAYER_COLORS) {
        for (let slot = 0; slot < TOKENS_PER_PLAYER; slot++) {
          const id = `${color}-${slot}`;
          const visual = tokenVisuals.get(id);
          if (!visual) continue;

          while (visual.children.length > 0) {
            visual.remove(visual.children[0]);
          }
          visual.add(buildClassicPawn(color));
        }
      }
      return;
    }

    const [template] = await Promise.all([
      loadCharacterModel(charId),
      preloadAnimations().catch(() => {}),
    ]);

    if (currentCharacterId !== charId) return;

    if (!template) {
      // Graceful fallback to classic pawn if model failed to load
      for (const color of PLAYER_COLORS) {
        for (let slot = 0; slot < TOKENS_PER_PLAYER; slot++) {
          const id = `${color}-${slot}`;
          const visual = tokenVisuals.get(id);
          if (!visual) continue;

          while (visual.children.length > 0) {
            visual.remove(visual.children[0]);
          }
          visual.add(buildClassicPawn(color));
        }
      }
      return;
    }

    for (const color of PLAYER_COLORS) {
      for (let slot = 0; slot < TOKENS_PER_PLAYER; slot++) {
        const id = `${color}-${slot}`;
        const visual = tokenVisuals.get(id);
        if (!visual) continue;

        while (visual.children.length > 0) {
          visual.remove(visual.children[0]);
        }

        const charMesh = buildCharacterPawn(template, color);
        visual.add(charMesh);

        // Smooth GSAP spawn scale pop
        gsap.fromTo(
          charMesh.scale,
          { x: 0.4, y: 0.4, z: 0.4 },
          { x: 1, y: 1, z: 1, duration: 0.35, ease: "back.out(1.8)" },
        );
      }
    }
  }

  // Trigger initial character load
  if (currentCharacterId && currentCharacterId !== "classic") {
    applyCharacter(currentCharacterId);
  }

  return {
    byId,
    all: [...byId.values()],
    setCharacter(charId) {
      applyCharacter(charId);
    },
    getCharacter() {
      return currentCharacterId;
    },
    syncActiveControllers(controllers) {
      if (!controllers) return;
      for (const [id, group] of byId.entries()) {
        const color = group.userData.color;
        const isActive = controllers[color] !== "off";
        if (group.visible !== isActive) {
          group.visible = isActive;
          if (isActive) {
            gsap.fromTo(
              group.scale,
              { x: 0.4, y: 0.4, z: 0.4 },
              { x: 1, y: 1, z: 1, duration: 0.3, ease: "back.out(1.8)" },
            );
          }
        }
      }
    },
    update(elapsedTime, delta) {
      let index = 0;
      for (const [id, group] of byId.entries()) {
        if (!group.visible) continue;
        index++;

        // Update AnimationMixer directly with zero per-frame binding overhead
        if (group.userData.animator) {
          group.userData.animator.update(delta);
        }

        if (group.userData.isMoving) continue;

        const visual = tokenVisuals.get(id);
        const charMesh = visual?.children[0];
        const rigData = charMesh?.userData?.rigData;

        // If no FBX animation is playing on this mesh, run procedural breathing
        if (!group.userData.animator?.currentAction?.isRunning()) {
          const phase = elapsedTime * 2.2 + index * 0.7;
          const breathe = Math.sin(phase);

          if (rigData?.spine) {
            const initX = rigData.initialRotations.get(rigData.spine)?.x || 0;
            rigData.spine.rotation.x = initX + breathe * 0.035;
          }

          if (rigData?.head) {
            const initY = rigData.initialRotations.get(rigData.head)?.y || 0;
            rigData.head.rotation.y = initY + Math.sin(elapsedTime * 1.2 + index * 1.1) * 0.04;
          }

          if (rigData?.leftArm) {
            const initZ = rigData.initialRotations.get(rigData.leftArm)?.z || 0;
            rigData.leftArm.rotation.z = initZ + breathe * 0.02;
          }
          if (rigData?.rightArm) {
            const initZ = rigData.initialRotations.get(rigData.rightArm)?.z || 0;
            rigData.rightArm.rotation.z = initZ - breathe * 0.02;
          }

          if (visual) {
            visual.position.y = Math.sin(phase) * 0.012;
          }
        }
      }
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
