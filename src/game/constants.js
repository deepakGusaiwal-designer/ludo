/**
 * Board geometry and rule constants.
 *
 * Nothing here imports three.js or touches the DOM, so the
 * rules can be tested without a renderer.
 */

export const BOARD_CELLS = 15;

export const CELL_SIZE = 0.58;

export const BOARD_SIZE = BOARD_CELLS * CELL_SIZE;

/**
 * A token's position is one number counted from its own
 * start square:
 *
 *   -1        waiting in the yard
 *    0 .. 50  the shared ring
 *   51 .. 56  its own home lane
 *   56        home
 *
 * The ring is 52 cells long but a token only walks 51 of
 * them: every player reaches its home lane entrance at
 * relative step 50 and turns inward there.
 */

export const YARD = -1;

export const RING_LENGTH = 52;

export const TRACK_STEPS = 51;

export const LAST_RING_STEP = TRACK_STEPS - 1;

export const HOME_LANE_LENGTH = 6;

export const FINISH_POSITION = TRACK_STEPS + HOME_LANE_LENGTH - 1;

export const TOKENS_PER_PLAYER = 4;

export const MAX_SIXES = 3;

/**
 * Two of a player's own tokens may share a ring square — that's
 * what forms a block. A third is refused. This cap only applies
 * on the shared ring: the home lane is private, and HOME itself
 * stays uncapped so every token a player owns can finish there
 * (capping it would leave the 3rd/4th token permanently unable
 * to finish once two arrived).
 */
export const STACK_LIMIT = 2;

export const COLORS = {
  red: "#f21e1e",
  green: "#00ac24",
  yellow: "#fadf27",
  blue: "#3b71ef",

  redDark: "#a93434",
  greenDark: "#39734b",
  yellowDark: "#b18a2d",
  blueDark: "#3d6095",

  white: "#f4ead1",
  cream: "#eadcbb",
  dark: "#3b3328",
};

/** Turn order, which is also ring order. */
export const PLAYERS = [
  { color: "red", startIndex: 0 },
  { color: "green", startIndex: 13 },
  { color: "yellow", startIndex: 26 },
  { color: "blue", startIndex: 39 },
];

export const PLAYER_COLORS = PLAYERS.map((player) => player.color);

export const START_INDEX = Object.fromEntries(
  PLAYERS.map((player) => [player.color, player.startIndex]),
);

/** Clockwise from red's start square, as [row, col] cells. */
export const COMMON_TRACK = [
  // red side
  [6, 1],
  [6, 2],
  [6, 3],
  [6, 4],
  [6, 5],
  [5, 6],
  [4, 6],
  [3, 6],
  [2, 6],
  [1, 6],
  [0, 6],
  [0, 7],
  [0, 8],

  // green side
  [1, 8],
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8],
  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12],
  [6, 13],
  [6, 14],
  [7, 14],
  [8, 14],

  // yellow side
  [8, 13],
  [8, 12],
  [8, 11],
  [8, 10],
  [8, 9],
  [9, 8],
  [10, 8],
  [11, 8],
  [12, 8],
  [13, 8],
  [14, 8],
  [14, 7],
  [14, 6],

  // blue side
  [13, 6],
  [12, 6],
  [11, 6],
  [10, 6],
  [9, 6],
  [8, 5],
  [8, 4],
  [8, 3],
  [8, 2],
  [8, 1],
  [8, 0],
  [7, 0],
  [6, 0],
];

/**
 * Six cells each. The last sits inside the center triangle,
 * which is where a finished token rests.
 */
export const HOME_LANES = {
  red: [
    [7, 1],
    [7, 2],
    [7, 3],
    [7, 4],
    [7, 5],
    [7, 6],
  ],
  green: [
    [1, 7],
    [2, 7],
    [3, 7],
    [4, 7],
    [5, 7],
    [6, 7],
  ],
  yellow: [
    [7, 13],
    [7, 12],
    [7, 11],
    [7, 10],
    [7, 9],
    [7, 8],
  ],
  blue: [
    [13, 7],
    [12, 7],
    [11, 7],
    [10, 7],
    [9, 7],
    [8, 7],
  ],
};

/**
 * The four start squares plus the four starred squares eight
 * steps further on. No capture happens on these.
 */
export const SAFE_TRACK_INDEXES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

/**
 * Painted stars, derived from the safe set above. Every safe
 * square gets one — start squares included — so "gold star"
 * is the single visual marker for "capture cannot happen here".
 */
export const STAR_CELLS = [...SAFE_TRACK_INDEXES].map(
  (index) => COMMON_TRACK[index],
);

/** Start square and home lane entrance painted per color. */
export const MARKED_CELLS = Object.fromEntries(
  PLAYERS.map(({ color, startIndex }) => [
    color,
    {
      start: COMMON_TRACK[startIndex],
      entrance: COMMON_TRACK[(startIndex + LAST_RING_STEP) % RING_LENGTH],
    },
  ]),
);

/** Where the four idle tokens of each color wait. */
const yardCorners = {
  red: { row: 0, col: 0 },
  green: { row: 0, col: 9 },
  yellow: { row: 9, col: 9 },
  blue: { row: 9, col: 0 },
};

const slotOffsets = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

export const YARD_SLOTS = Object.fromEntries(
  Object.entries(yardCorners).map(([color, corner]) => {
    const center = cellToWorld(corner.row + 2.5, corner.col + 2.5);
    const slots = slotOffsets.map(([sx, sz]) => [
      Number((center.x + sx * 0.72).toFixed(2)),
      Number((center.z + sz * 0.72).toFixed(2)),
    ]);
    return [color, slots];
  }),
);

export const TOKEN_HEIGHT = 0.72;

export const STACK_RADIUS = 0.15;

/** Grid cell to world coordinates on the board plane. */
export function cellToWorld(row, col) {
  return {
    x: (col - (BOARD_CELLS - 1) / 2) * CELL_SIZE,
    z: (row - (BOARD_CELLS - 1) / 2) * CELL_SIZE,
  };
}

export function labelFor(color) {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

export function getPlayerName(color, playerConfig, onlineState) {
  if (!color) return "";
  if (onlineState?.room?.players) {
    const onlinePlayer = onlineState.room.players.find((p) => p.color === color);
    if (onlinePlayer && onlinePlayer.name && onlinePlayer.name.trim()) {
      return onlinePlayer.name.trim();
    }
  }
  if (playerConfig?.names?.[color] && playerConfig.names[color].trim()) {
    return playerConfig.names[color].trim();
  }
  return labelFor(color);
}

