import {
  LAST_RING_STEP,
  PLAYER_COLORS,
  RING_LENGTH,
  SAFE_TRACK_INDEXES,
  START_INDEX,
} from "./constants.js";
import { isOnRing, ringIndexOf } from "./rules.js";

/**
 * Evaluates a legal move and assigns a strategic heuristic score.
 */
function scoreMove(state, move) {
  let score = 0;

  // 1. Capture opponent token (Highest Priority)
  if (move.captured && move.captured.length > 0) {
    score += 100 * move.captured.length;
  }

  // 2. Reach center Home (High Priority)
  if (move.finished) {
    score += 85;
  }

  // 3. Releasing token from Yard onto the board on a 6 (High Priority)
  if (move.entered) {
    score += 70;
  }

  const token = state.tokens.find((each) => each.id === move.tokenId);

  // `move.to` is a per-color relative step (0 at that color's own
  // start), not a shared board index — it has to be converted to
  // a ring cell before comparing against SAFE_TRACK_INDEXES, which
  // is a shared-board coordinate.
  if (token && typeof move.to === "number" && move.to <= LAST_RING_STEP) {
    const ringIndex = (START_INDEX[token.color] + move.to) % RING_LENGTH;

    // 4. Moving onto a Safe Square (Stars or Start squares)
    if (SAFE_TRACK_INDEXES.has(ringIndex)) {
      score += 45;
    }
  }

  // 5. Prefer advancing tokens that are closer to home
  if (typeof move.to === "number") {
    score += Math.floor(move.to * 0.5);
  }

  // 6. Escape from a dangerous position (if an opponent is within 6 steps behind)
  if (token && isOnRing(token)) {
    const myIndex = ringIndexOf(token);

    const isVulnerable = state.tokens.some((other) => {
      if (other.color === token.color || !isOnRing(other)) return false;

      const dist = (myIndex - ringIndexOf(other) + RING_LENGTH) % RING_LENGTH;
      return dist >= 1 && dist <= 6;
    });

    if (isVulnerable) {
      score += 35;
    }
  }

  return score;
}

/**
 * Chooses the best move for a computer AI player from available legal moves.
 */
export function chooseBestMove(state, legalMoves, difficulty = "smart") {
  if (!legalMoves || legalMoves.length === 0) return null;
  if (legalMoves.length === 1) return legalMoves[0];

  if (difficulty === "easy") {
    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[randomIndex];
  }

  let bestMove = legalMoves[0];
  let bestScore = -Infinity;

  for (const move of legalMoves) {
    const score = scoreMove(state, move);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

/**
 * Default player configuration:
 * 1 Human player (Red) vs 3 Computer Bots (Green, Yellow, Blue).
 */
export const DEFAULT_PLAYER_CONFIG = {
  activeCount: 4, // 2, 3, or 4
  difficulty: "smart", // "easy" or "smart"
  controllers: {
    red: "human",
    green: "computer",
    yellow: "computer",
    blue: "computer",
  },
  names: {
    red: "Red",
    green: "Green",
    yellow: "Yellow",
    blue: "Blue",
  },
};

/**
 * Gets next active turn color, skipping disabled colors.
 */
export function getNextActiveColor(currentColor, controllers) {
  const currentIndex = PLAYER_COLORS.indexOf(currentColor);
  for (let i = 1; i <= PLAYER_COLORS.length; i++) {
    const nextColor = PLAYER_COLORS[(currentIndex + i) % PLAYER_COLORS.length];
    if (controllers[nextColor] && controllers[nextColor] !== "off") {
      return nextColor;
    }
  }
  return currentColor;
}
