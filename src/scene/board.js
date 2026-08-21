import * as THREE from "three";
import gsap from "gsap";

import {
  BOARD_CELLS,
  BOARD_SIZE,
  CELL_SIZE,
  COLORS,
  HOME_LANES,
  MARKED_CELLS,
  PLAYER_COLORS,
  STAR_CELLS,
  cellToWorld,
} from "../game/constants.js";

import { boardMaterials, colorMaterial, getMaterial } from "./materials.js";

const HOME_SIZE = 6;

export const BOARD_THEMES = {
  clear: {
    baseColor: "#6b4226", // Warm mahogany woodland wood plinth
    topColor: "#f7f0df",  // Maple cream board surface
    roughness: 0.75,
    metalness: 0.05,
    topRoughness: 0.7,
    topMetalness: 0.05,
  },
  ice: {
    baseColor: "#183248", // Glacier frozen ice-stone plinth
    topColor: "#e6f2fc",  // Arctic frost slab
    roughness: 0.32,
    metalness: 0.25,
    topRoughness: 0.35,
    topMetalness: 0.15,
  },
  heavy_rain: {
    baseColor: "#112538", // Weathered oceanic driftwood plinth
    topColor: "#d9e8f5",  // Sea-spray marine slate
    roughness: 0.6,
    metalness: 0.1,
    topRoughness: 0.55,
    topMetalness: 0.1,
  },
  desert: {
    baseColor: "#804323", // Terracotta canyon sandstone plinth
    topColor: "#faebd0",  // Fine golden dune sand
    roughness: 0.85,
    metalness: 0.05,
    topRoughness: 0.8,
    topMetalness: 0.05,
  },
  heaven: {
    baseColor: "#fdfbf7", // Pure alabaster ivory plinth with golden sheen
    topColor: "#ffffff",  // Radiant diamond marble
    roughness: 0.16,
    metalness: 0.35,
    topRoughness: 0.18,
    topMetalness: 0.25,
  },
  hell: {
    baseColor: "#1e0b0b", // Obsidian charred volcanic rock plinth
    topColor: "#2d1b1b",  // Smoky ash basalt
    roughness: 0.82,
    metalness: 0.15,
    topRoughness: 0.78,
    topMetalness: 0.15,
  },
};

function isYardCell(r, c) {
  return (
    (r < 6 && c < 6) ||
    (r < 6 && c >= 9) ||
    (r >= 9 && c >= 9) ||
    (r >= 9 && c < 6)
  );
}

function isCenterCell(r, c) {
  return r >= 6 && r <= 8 && c >= 6 && c <= 8;
}

function createUnderglowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  gradient.addColorStop(0.22, "rgba(147, 197, 253, 0.95)");
  gradient.addColorStop(0.5, "rgba(56, 189, 248, 0.6)");
  gradient.addColorStop(0.78, "rgba(37, 99, 235, 0.2)");
  gradient.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * The board itself: base, grid, the four yards, the colored
 * home lanes, the painted start/star squares and the center.
 */
export function createBoard() {
  const boardGroup = new THREE.Group();
  boardGroup.name = "LudoBoard";

  const owned = [];
  const track = (geometry) => {
    owned.push(geometry);
    return geometry;
  };

  /* Bottom Night Glow Halo & Ambient Lighting */
  const underglowTex = createUnderglowTexture();
  const underglowMat = new THREE.MeshBasicMaterial({
    map: underglowTex,
    color: "#38bdf8",
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const underglowMesh = new THREE.Mesh(
    track(new THREE.PlaneGeometry(BOARD_SIZE + 4.6, BOARD_SIZE + 4.6)),
    underglowMat,
  );
  underglowMesh.rotation.x = -Math.PI / 2;
  underglowMesh.position.y = 0.035;
  boardGroup.add(underglowMesh);

  // Soft inner core glow
  const innerGlowMat = new THREE.MeshBasicMaterial({
    map: underglowTex,
    color: "#60a5fa",
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const innerGlowMesh = new THREE.Mesh(
    track(new THREE.PlaneGeometry(BOARD_SIZE + 2.0, BOARD_SIZE + 2.0)),
    innerGlowMat,
  );
  innerGlowMesh.rotation.x = -Math.PI / 2;
  innerGlowMesh.position.y = 0.055;
  boardGroup.add(innerGlowMesh);

  // 4 Corner Ambient Underglow PointLights
  const cornerLights = [];
  const cornerOffsets = [
    [-5.6, -5.6],
    [5.6, -5.6],
    [-5.6, 5.6],
    [5.6, 5.6],
  ];

  cornerOffsets.forEach(([cx, cz]) => {
    const light = new THREE.PointLight(0x38bdf8, 0.0, 8.0, 2.0);
    light.position.set(cx, 0.22, cz);
    boardGroup.add(light);
    cornerLights.push(light);
  });

  /* Base + Top Slab with dedicated theme materials */
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(BOARD_THEMES.clear.baseColor),
    roughness: BOARD_THEMES.clear.roughness,
    metalness: BOARD_THEMES.clear.metalness,
  });

  const topMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(BOARD_THEMES.clear.topColor),
    roughness: BOARD_THEMES.clear.topRoughness,
    metalness: BOARD_THEMES.clear.topMetalness,
  });

  const base = new THREE.Mesh(
    track(new THREE.BoxGeometry(BOARD_SIZE + 0.65, 0.42, BOARD_SIZE + 0.65)),
    baseMaterial,
  );
  base.position.y = 0.21;
  base.castShadow = true;
  base.receiveShadow = true;
  boardGroup.add(base);

  const top = new THREE.Mesh(
    track(new THREE.BoxGeometry(BOARD_SIZE, 0.14, BOARD_SIZE)),
    topMaterial,
  );
  top.position.y = 0.49;
  top.receiveShadow = true;
  boardGroup.add(top);

  /* Grid Tiles — Only generate visible track cells to prevent Z-fighting and reduce draw calls */
  const cellGeometry = track(
    new THREE.BoxGeometry(CELL_SIZE * 0.94, 0.08, CELL_SIZE * 0.94),
  );

  const gridGroup = new THREE.Group();
  gridGroup.name = "LudoGrid";

  for (let row = 0; row < BOARD_CELLS; row++) {
    for (let col = 0; col < BOARD_CELLS; col++) {
      if (isYardCell(row, col) || isCenterCell(row, col)) {
        continue; // Skip cells under yards and center finish
      }

      const mesh = new THREE.Mesh(cellGeometry, boardMaterials.white);
      const { x, z } = cellToWorld(row, col);
      mesh.position.set(x, 0.60, z);
      mesh.receiveShadow = true;
      gridGroup.add(mesh);
    }
  }

  boardGroup.add(gridGroup);

  /* The Four Yards */
  const yardCorners = {
    red: { row: 0, col: 0 },
    green: { row: 0, col: 9 },
    yellow: { row: 9, col: 9 },
    blue: { row: 9, col: 0 },
  };

  const yardGeometry = track(
    new THREE.BoxGeometry(HOME_SIZE * CELL_SIZE, 0.10, HOME_SIZE * CELL_SIZE),
  );
  const yardWhiteBaseGeometry = track(
    new THREE.BoxGeometry(4.5 * CELL_SIZE, 0.04, 4.5 * CELL_SIZE),
  );
  const yardInnerGeometry = track(
    new THREE.BoxGeometry(4.3 * CELL_SIZE, 0.04, 4.3 * CELL_SIZE),
  );
  const slotWhiteBaseGeometry = track(
    new THREE.CylinderGeometry(0.25, 0.25, 0.02, 24),
  );
  const slotGeometry = track(
    new THREE.CylinderGeometry(0.21, 0.21, 0.02, 24),
  );

  for (const color of PLAYER_COLORS) {
    const corner = yardCorners[color];
    const group = new THREE.Group();
    group.name = `${color}Yard`;

    const { x, z } = cellToWorld(corner.row + 2.5, corner.col + 2.5);

    const pad = new THREE.Mesh(yardGeometry, colorMaterial(color));
    pad.position.set(x, 0.05, z);
    pad.receiveShadow = true;
    group.add(pad);

    const whiteBase = new THREE.Mesh(yardWhiteBaseGeometry, boardMaterials.white);
    whiteBase.position.set(x, 0.09, z);
    whiteBase.receiveShadow = true;
    group.add(whiteBase);

    const inner = new THREE.Mesh(yardInnerGeometry, colorMaterial(color));
    inner.position.set(x, 0.11, z);
    inner.receiveShadow = true;
    group.add(inner);

    // 4 yard token circle slots
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const slotBase = new THREE.Mesh(slotWhiteBaseGeometry, boardMaterials.white);
      slotBase.position.set(x + sx * 0.72, 0.125, z + sz * 0.72);
      slotBase.receiveShadow = true;
      group.add(slotBase);

      const slot = new THREE.Mesh(slotGeometry, boardMaterials.white);
      slot.position.set(x + sx * 0.72, 0.14, z + sz * 0.72);
      slot.receiveShadow = true;
      group.add(slot);
    }

    group.position.y = 0.56;
    boardGroup.add(group);
  }

  /* Home Lanes — Raised colored tiles with zero Z-fighting */
  const homeLaneGeometry = track(
    new THREE.BoxGeometry(CELL_SIZE * 0.94, 0.04, CELL_SIZE * 0.94),
  );

  for (const color of PLAYER_COLORS) {
    for (const [row, col] of HOME_LANES[color].slice(0, 5)) {
      const mesh = new THREE.Mesh(homeLaneGeometry, colorMaterial(color));
      const { x, z } = cellToWorld(row, col);
      mesh.position.set(x, 0.655, z);
      mesh.receiveShadow = true;
      boardGroup.add(mesh);
    }
  }

  /* Start squares & Home Lane Entrances */
  for (const color of PLAYER_COLORS) {
    const { start, entrance } = MARKED_CELLS[color];
    for (const [row, col] of [start, entrance]) {
      const mesh = new THREE.Mesh(homeLaneGeometry, colorMaterial(color));
      const { x, z } = cellToWorld(row, col);
      mesh.position.set(x, 0.655, z);
      mesh.receiveShadow = true;
      boardGroup.add(mesh);
    }
  }

  /* Eight Safe Stars */
  const starShape = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const radius = i % 2 === 0 ? CELL_SIZE * 0.38 : CELL_SIZE * 0.14;
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) starShape.moveTo(x, y);
    else starShape.lineTo(x, y);
  }
  starShape.closePath();

  const starExtrudeSettings = {
    depth: 0.02,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.005,
    bevelThickness: 0.005,
  };
  const starGeometry = track(new THREE.ExtrudeGeometry(starShape, starExtrudeSettings));
  const starMaterial = getMaterial("#f59e0b", { roughness: 0.25, metalness: 0.85 });

  // Start squares carry a raised colored overlay (top at ~0.675),
  // so their stars sit above it; the rest lie on the bare track.
  const startCellKeys = new Set(
    PLAYER_COLORS.map((color) => MARKED_CELLS[color].start.join(",")),
  );

  for (const [row, col] of STAR_CELLS) {
    const star = new THREE.Mesh(starGeometry, starMaterial);
    const { x, z } = cellToWorld(row, col);
    const onStartSquare = startCellKeys.has(`${row},${col}`);
    star.rotation.x = -Math.PI / 2;
    star.position.set(x, onStartSquare ? 0.676 : 0.648, z);
    star.receiveShadow = true;
    boardGroup.add(star);
  }

  /* Center Finish Area (Seamless 3D Extruded Triangles with Gold Trim) */
  boardGroup.add(createCenter(track));

  function setTheme(themeId, animated = true) {
    const theme = BOARD_THEMES[themeId] || BOARD_THEMES.clear;
    const targetBaseColor = new THREE.Color(theme.baseColor);
    const targetTopColor = new THREE.Color(theme.topColor);

    if (!animated) {
      baseMaterial.color.copy(targetBaseColor);
      baseMaterial.roughness = theme.roughness;
      baseMaterial.metalness = theme.metalness;
      topMaterial.color.copy(targetTopColor);
      topMaterial.roughness = theme.topRoughness;
      topMaterial.metalness = theme.topMetalness;
      return;
    }

    gsap.to(baseMaterial.color, {
      r: targetBaseColor.r,
      g: targetBaseColor.g,
      b: targetBaseColor.b,
      duration: 0.85,
      ease: "power2.out",
    });
    gsap.to(baseMaterial, {
      roughness: theme.roughness,
      metalness: theme.metalness,
      duration: 0.85,
      ease: "power2.out",
    });

    gsap.to(topMaterial.color, {
      r: targetTopColor.r,
      g: targetTopColor.g,
      b: targetTopColor.b,
      duration: 0.85,
      ease: "power2.out",
    });
    gsap.to(topMaterial, {
      roughness: theme.topRoughness,
      metalness: theme.topMetalness,
      duration: 0.85,
      ease: "power2.out",
    });
  }

  const GLOW_COLORS = {
    clear: "#38bdf8",
    ice: "#06b6d4",
    heavy_rain: "#38bdf8",
    desert: "#f59e0b",
    heaven: "#fef08a",
    hell: "#ff4500",
  };

  let targetGlowIntensity = 0.0;

  function setNightGlow(isNight, themeId = "clear", animated = true) {
    const glowHex = GLOW_COLORS[themeId] || "#38bdf8";
    const targetColor = new THREE.Color(glowHex);
    const targetOpacity = isNight ? 0.88 : 0.0;
    const targetInnerOpacity = isNight ? 0.75 : 0.0;
    targetGlowIntensity = isNight ? 1.4 : 0.0;

    if (!animated) {
      underglowMat.color.copy(targetColor);
      underglowMat.opacity = targetOpacity;
      innerGlowMat.color.copy(targetColor);
      innerGlowMat.opacity = targetInnerOpacity;
      cornerLights.forEach((l) => {
        l.color.copy(targetColor);
        l.intensity = targetGlowIntensity;
      });
      return;
    }

    gsap.to(underglowMat.color, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: 0.85,
      ease: "power2.out",
    });
    gsap.to(underglowMat, {
      opacity: targetOpacity,
      duration: 0.85,
      ease: "power2.out",
    });
    gsap.to(innerGlowMat.color, {
      r: targetColor.r,
      g: targetColor.g,
      b: targetColor.b,
      duration: 0.85,
      ease: "power2.out",
    });
    gsap.to(innerGlowMat, {
      opacity: targetInnerOpacity,
      duration: 0.85,
      ease: "power2.out",
    });
    cornerLights.forEach((l) => {
      gsap.to(l.color, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 0.85,
        ease: "power2.out",
      });
      gsap.to(l, {
        intensity: targetGlowIntensity,
        duration: 0.85,
        ease: "power2.out",
      });
    });
  }

  function update(elapsedTime) {
    if (targetGlowIntensity > 0.01) {
      const pulse = 1.0 + Math.sin(elapsedTime * 2.2) * 0.04;
      underglowMesh.scale.setScalar(pulse);
      const lightPulse = targetGlowIntensity * (1.0 + Math.sin(elapsedTime * 2.0) * 0.1);
      cornerLights.forEach((l) => {
        l.intensity = lightPulse;
      });
    }
  }

  return {
    boardGroup,
    setTheme,
    setNightGlow,
    update,
    dispose() {
      owned.forEach((geometry) => geometry.dispose());
      baseMaterial.dispose();
      topMaterial.dispose();
      underglowMat.dispose();
      innerGlowMat.dispose();
      underglowTex.dispose();
    },
  };
}

/**
 * 4 Triangles meeting at the center finish with solid 3D extrusion,
 * eliminating all jagged borders and Z-fighting.
 */
function createCenter(track) {
  const centerGroup = new THREE.Group();
  centerGroup.name = "CenterFinish";

  const half = (3 * CELL_SIZE) / 2;

  // Solid gold border base tray
  const borderGeometry = track(
    new THREE.BoxGeometry(3 * CELL_SIZE + 0.06, 0.08, 3 * CELL_SIZE + 0.06),
  );
  const border = new THREE.Mesh(
    borderGeometry,
    getMaterial("#d97706", { roughness: 0.25, metalness: 0.85 }),
  );
  border.position.set(0, 0.60, 0);
  border.receiveShadow = true;
  centerGroup.add(border);

  // White separator plate
  const whitePlateGeometry = track(
    new THREE.BoxGeometry(3 * CELL_SIZE, 0.02, 3 * CELL_SIZE),
  );
  const whitePlate = new THREE.Mesh(whitePlateGeometry, boardMaterials.white);
  whitePlate.position.set(0, 0.645, 0);
  whitePlate.receiveShadow = true;
  centerGroup.add(whitePlate);

  const triangles = {
    green: [
      [-half, half],
      [half, half],
    ],
    blue: [
      [half, -half],
      [-half, -half],
    ],
    red: [
      [-half, -half],
      [-half, half],
    ],
    yellow: [
      [half, half],
      [half, -half],
    ],
  };

  const extrudeSettings = {
    depth: 0.025,
    bevelEnabled: false,
  };

  for (const [color, [a, b]] of Object.entries(triangles)) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(a[0] * 0.985, a[1] * 0.985);
    shape.lineTo(b[0] * 0.985, b[1] * 0.985);
    shape.closePath();

    const geometry = track(new THREE.ExtrudeGeometry(shape, extrudeSettings));
    const mesh = new THREE.Mesh(geometry, colorMaterial(color));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.655, 0);
    mesh.receiveShadow = true;

    centerGroup.add(mesh);
  }

  return centerGroup;
}
