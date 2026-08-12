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

const TILE_HEIGHT = 0.12;

const HOME_SIZE = 6;

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

  /* base + top */

  const base = new THREE.Mesh(
    track(
      new THREE.BoxGeometry(BOARD_SIZE + 0.65, 0.42, BOARD_SIZE + 0.65),
    ),
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

  /* grid — one shared geometry for all 225 cells */

  const cellGeometry = track(
    new THREE.BoxGeometry(CELL_SIZE * 0.94, 0.12, CELL_SIZE * 0.94),
  );

  const gridGroup = new THREE.Group();

  gridGroup.name = "LudoGrid";

  for (let row = 0; row < BOARD_CELLS; row++) {
    for (let col = 0; col < BOARD_CELLS; col++) {
      const mesh = new THREE.Mesh(cellGeometry, boardMaterials.white);

      const { x, z } = cellToWorld(row, col);

      mesh.position.set(x, 0.62, z);
      mesh.receiveShadow = true;

      gridGroup.add(mesh);
    }
  }

  boardGroup.add(gridGroup);

  /* the four yards */

  const yardCorners = {
    red: { row: 0, col: 0 },
    green: { row: 0, col: 9 },
    yellow: { row: 9, col: 9 },
    blue: { row: 9, col: 0 },
  };

  const yardGeometry = track(
    new THREE.BoxGeometry(HOME_SIZE * CELL_SIZE, 0.14, HOME_SIZE * CELL_SIZE),
  );

  const yardInnerGeometry = track(
    new THREE.BoxGeometry(4.3 * CELL_SIZE, 0.04, 4.3 * CELL_SIZE),
  );

  const slotGeometry = track(new THREE.CylinderGeometry(0.20, 0.20, 0.02, 24));

  for (const color of PLAYER_COLORS) {
    const corner = yardCorners[color];

    const group = new THREE.Group();

    group.name = `${color}Yard`;

    const { x, z } = cellToWorld(corner.row + 2.5, corner.col + 2.5);

    const pad = new THREE.Mesh(yardGeometry, colorMaterial(color));

    pad.position.set(x, 0.07, z);
    pad.receiveShadow = true;

    group.add(pad);

    // Colored home board floor showing the player's vibrant color
    const inner = new THREE.Mesh(yardInnerGeometry, colorMaterial(color));

    inner.position.set(x, 0.13, z);
    inner.receiveShadow = true;

    group.add(inner);

    // White circle target slots for tokens
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const slot = new THREE.Mesh(slotGeometry, boardMaterials.white);

      slot.position.set(x + sx * 0.72, 0.15, z + sz * 0.72);
      slot.receiveShadow = true;

      group.add(slot);
    }

    group.position.y = 0.56;

    boardGroup.add(group);
  }

  /* home lanes, painted over the grid */

  const overlayGeometry = track(
    new THREE.BoxGeometry(CELL_SIZE * 0.94, 0.04, CELL_SIZE * 0.94),
  );

  for (const color of PLAYER_COLORS) {
    // the last lane cell is the center triangle, drawn below
    for (const [row, col] of HOME_LANES[color].slice(0, 5)) {
      const mesh = new THREE.Mesh(overlayGeometry, colorMaterial(color));

      const { x, z } = cellToWorld(row, col);

      mesh.position.set(x, 0.70, z);

      boardGroup.add(mesh);
    }
  }

  /* start squares and home lane entrances */

  for (const color of PLAYER_COLORS) {
    const { start, entrance } = MARKED_CELLS[color];

    for (const [row, col] of [start, entrance]) {
      const mesh = new THREE.Mesh(overlayGeometry, colorMaterial(color));

      const { x, z } = cellToWorld(row, col);

      mesh.position.set(x, 0.70, z);

      boardGroup.add(mesh);
    }
  }

  /* the eight safe stars */

  const starShape = new THREE.Shape();

  for (let i = 0; i < 8; i++) {
    const radius = i % 2 === 0 ? CELL_SIZE * 0.4 : CELL_SIZE * 0.15;

    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) starShape.moveTo(x, y);
    else starShape.lineTo(x, y);
  }

  starShape.closePath();

  const starGeometry = track(new THREE.ShapeGeometry(starShape));

  const starMaterial = getMaterial("#b9a06a", { roughness: 0.6 });

  for (const [row, col] of STAR_CELLS) {
    const star = new THREE.Mesh(starGeometry, starMaterial);

    const { x, z } = cellToWorld(row, col);

    star.rotation.x = -Math.PI / 2;
    star.position.set(x, 0.681, z);

    boardGroup.add(star);
  }

  /* center finish */

  boardGroup.add(createCenter(track));

  return {
    boardGroup,
    dispose() {
      owned.forEach((geometry) => geometry.dispose());
    },
  };
}

/**
 * Four triangles, each pointing along the direction its home
 * lane arrives from, so a token that finishes lands inside
 * its own color.
 *
 *   red    lane runs along row 7 from the left
 *   green  lane runs down column 7 from the top
 *   yellow lane runs along row 7 from the right
 *   blue   lane runs up column 7 from the bottom
 *
 * Shapes are built in the XY plane and rotated flat, which
 * maps shape +y onto world -z.
 */
function createCenter(track) {
  const centerGroup = new THREE.Group();

  centerGroup.name = "CenterFinish";

  const half = (3 * CELL_SIZE) / 2;

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

  for (const [color, [a, b]] of Object.entries(triangles)) {
    const shape = new THREE.Shape();

    shape.moveTo(0, 0);
    shape.lineTo(a[0], a[1]);
    shape.lineTo(b[0], b[1]);
    shape.closePath();

    const mesh = new THREE.Mesh(
      track(new THREE.ShapeGeometry(shape)),
      colorMaterial(color),
    );

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.08;

    centerGroup.add(mesh);
  }

  const border = new THREE.Mesh(
    track(new THREE.BoxGeometry(3 * CELL_SIZE + 0.08, 0.04, 3 * CELL_SIZE + 0.08)),
    getMaterial("#c49b50", { roughness: 0.5 }),
  );

  border.position.y = 0.02;

  centerGroup.add(border);

  centerGroup.position.set(0, 0.64, 0);

  return centerGroup;
}
