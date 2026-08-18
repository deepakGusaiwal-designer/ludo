import * as THREE from "three";

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

  /* Base + Top Slab */
  const base = new THREE.Mesh(
    track(new THREE.BoxGeometry(BOARD_SIZE + 0.65, 0.42, BOARD_SIZE + 0.65)),
    boardMaterials.base,
  );
  base.position.y = 0.21;
  base.castShadow = true;
  base.receiveShadow = true;
  boardGroup.add(base);

  const top = new THREE.Mesh(
    track(new THREE.BoxGeometry(BOARD_SIZE, 0.14, BOARD_SIZE)),
    boardMaterials.board,
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

  for (const [row, col] of STAR_CELLS) {
    const star = new THREE.Mesh(starGeometry, starMaterial);
    const { x, z } = cellToWorld(row, col);
    star.rotation.x = -Math.PI / 2;
    star.position.set(x, 0.648, z);
    star.receiveShadow = true;
    boardGroup.add(star);
  }

  /* Center Finish Area (Seamless 3D Extruded Triangles with Gold Trim) */
  boardGroup.add(createCenter(track));

  return {
    boardGroup,
    dispose() {
      owned.forEach((geometry) => geometry.dispose());
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
