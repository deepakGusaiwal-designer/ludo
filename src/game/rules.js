/**
 * The ludo rules, as pure functions over a plain state
 * object. No three.js, no DOM, no timers — every function
 * either answers a question about a state or returns a new
 * state.
 *
 * Rules covered:
 *   - a 6 is needed to bring a token out of the yard
 *   - a 6 earns another roll, three in a row forfeits the turn
 *   - capturing an opponent earns another roll
 *   - bringing a token home earns another roll
 *   - the eight safe squares (four colored starts + four stars)
 *     block capture absolutely, entry from the yard included
 *   - two tokens of one color form a block that opponents can
 *     neither pass nor land on
 *   - a token must reach home on an exact roll
 *   - if a legal move exists the player must take it
 *   - first player to bring all four tokens home wins
 */

import {
  COMMON_TRACK,
  FINISH_POSITION,
  HOME_LANES,
  LAST_RING_STEP,
  MAX_SIXES,
  PLAYERS,
  RING_LENGTH,
  SAFE_TRACK_INDEXES,
  STACK_LIMIT,
  STACK_RADIUS,
  START_INDEX,
  TOKENS_PER_PLAYER,
  TRACK_STEPS,
  YARD,
  YARD_SLOTS,
  cellToWorld,
} from "./constants.js";

/* ---------------------------------------------------------
   State
--------------------------------------------------------- */

export function createInitialState() {
  const tokens = [];

  for (const { color } of PLAYERS) {
    for (let slot = 0; slot < TOKENS_PER_PLAYER; slot++) {
      tokens.push({
        id: `${color}-${slot}`,
        color,
        slot,
        position: YARD,
        finished: false,
      });
    }
  }

  return {
    tokens,
    currentPlayer: 0,
    dice: null,
    sixCount: 0,
    winner: null,
  };
}

export function currentColor(state) {
  return PLAYERS[state.currentPlayer].color;
}

export function tokenById(state, id) {
  return state.tokens.find((token) => token.id === id);
}

export function tokensFor(state, color) {
  return state.tokens.filter((token) => token.color === color);
}

export function tokensHome(state, color) {
  return tokensFor(state, color).filter((token) => token.finished).length;
}

export function hasWon(state, color) {
  return tokensHome(state, color) === TOKENS_PER_PLAYER;
}

/* ---------------------------------------------------------
   Position helpers
--------------------------------------------------------- */

export function isInYard(token) {
  return token.position === YARD;
}

export function isOnRing(token) {
  return token.position >= 0 && token.position <= LAST_RING_STEP;
}

export function isInHomeLane(token) {
  return token.position > LAST_RING_STEP;
}

/** Which shared ring cell a token stands on. Ring only. */
export function ringIndexOf(token) {
  return (START_INDEX[token.color] + token.position) % RING_LENGTH;
}

/** The [row, col] board cell a token occupies. */
export function cellOf(token) {
  if (isInYard(token)) return null;

  if (isInHomeLane(token)) {
    return HOME_LANES[token.color][token.position - TRACK_STEPS];
  }

  return COMMON_TRACK[ringIndexOf(token)];
}

/* ---------------------------------------------------------
   Blocks
--------------------------------------------------------- */

/** Ring cell -> how many tokens of each color stand there. */
export function buildOccupancy(state) {
  const occupancy = new Map();

  for (const token of state.tokens) {
    if (!isOnRing(token)) continue;

    const index = ringIndexOf(token);

    let counts = occupancy.get(index);

    if (!counts) {
      counts = {};
      occupancy.set(index, counts);
    }

    counts[token.color] = (counts[token.color] || 0) + 1;
  }

  return occupancy;
}

/**
 * Two tokens of one color block everyone else. A player is
 * never blocked by its own tokens.
 */
export function isBlockedFor(occupancy, ringIndex, color) {
  const counts = occupancy.get(ringIndex);

  if (!counts) return false;

  return Object.keys(counts).some(
    (other) => other !== color && counts[other] >= 2,
  );
}

/** How many of a color's own tokens already stand on a ring cell. */
function ownCountAt(occupancy, ringIndex, color) {
  const counts = occupancy.get(ringIndex);
  return counts?.[color] || 0;
}

function pathIsClear(token, from, to, occupancy) {
  const start = START_INDEX[token.color];

  for (let step = from + 1; step <= to; step++) {
    // Home lanes are private, so nothing can block there.
    if (step > LAST_RING_STEP) break;

    if (isBlockedFor(occupancy, (start + step) % RING_LENGTH, token.color)) {
      return false;
    }
  }

  return true;
}

/* ---------------------------------------------------------
   Legal moves
--------------------------------------------------------- */

export function canTokenMove(token, dice, occupancy) {
  if (!dice) return false;

  if (token.finished) return false;

  // Leaving the yard needs a 6, an opponent block on the start
  // square still refuses entry, and the start square can't take
  // a third stacked token of the same color.
  if (isInYard(token)) {
    if (dice !== 6) return false;

    const start = START_INDEX[token.color];

    if (isBlockedFor(occupancy, start, token.color)) return false;

    return ownCountAt(occupancy, start, token.color) < STACK_LIMIT;
  }

  // Home has to be reached exactly.
  const destination = token.position + dice;

  if (destination > FINISH_POSITION) return false;

  if (!pathIsClear(token, token.position, destination, occupancy)) return false;

  // The stack cap only applies on the shared ring — see the
  // STACK_LIMIT comment in constants.js for why HOME is exempt.
  if (destination <= LAST_RING_STEP) {
    const destIndex = (START_INDEX[token.color] + destination) % RING_LENGTH;

    if (ownCountAt(occupancy, destIndex, token.color) >= STACK_LIMIT) {
      return false;
    }
  }

  return true;
}

export function getLegalMoves(state, dice) {
  const color = currentColor(state);

  const occupancy = buildOccupancy(state);

  return state.tokens
    .filter((token) => token.color === color)
    .filter((token) => canTokenMove(token, dice, occupancy))
    .map((token) => token.id);
}

/* ---------------------------------------------------------
   Applying a move
--------------------------------------------------------- */

/**
 * Moves a token and resolves captures.
 *
 * Returns the next state plus a description of what happened,
 * which the renderer uses to animate and the UI to narrate.
 */
export function applyMove(state, tokenId, dice) {
  const token = tokenById(state, tokenId);

  if (!token) throw new Error(`unknown token ${tokenId}`);

  const from = token.position;

  const entered = isInYard(token);

  const to = entered ? 0 : from + dice;

  const moved = {
    ...token,
    position: to,
    finished: to === FINISH_POSITION,
  };

  let tokens = state.tokens.map((each) =>
    each.id === tokenId ? moved : each,
  );

  const captured = [];

  // Only tokens standing on the ring can be taken, which is
  // what keeps a token safe once it turns into its home lane.
  if (isOnRing(moved)) {
    const landing = ringIndexOf(moved);

    // The eight safe squares (four colored starts + four stars)
    // block capture absolutely — even entering from the yard onto
    // your own start square leaves an opponent resting there
    // untouched; the two simply share the square. A single move
    // can capture at most one token.
    if (!SAFE_TRACK_INDEXES.has(landing)) {
      const victim = tokens.find(
        (each) =>
          each.id !== moved.id &&
          each.color !== moved.color &&
          isOnRing(each) &&
          ringIndexOf(each) === landing,
      );

      if (victim) {
        captured.push(victim.id);

        tokens = tokens.map((each) =>
          each.id === victim.id
            ? { ...each, position: YARD, finished: false }
            : each,
        );
      }
    }
  }

  const nextState = { ...state, tokens };

  const won = hasWon(nextState, moved.color);

  return {
    state: won ? { ...nextState, winner: moved.color } : nextState,
    tokenId,
    from,
    to,
    entered,
    captured,
    finished: moved.finished,
    won,
    // Squares the token visits, for the hop animation.
    path: entered ? [0] : rangeInclusive(from + 1, to),
  };
}

function rangeInclusive(from, to) {
  const out = [];
  for (let value = from; value <= to; value++) out.push(value);
  return out;
}

/* ---------------------------------------------------------
   Turn flow
--------------------------------------------------------- */

/** A 6, a capture, or a token reaching home all earn another roll. */
export function earnsExtraTurn({ dice, captured, finished }) {
  return dice === 6 || captured.length > 0 || finished;
}

/**
 * What a rolled value means for the player to move. Pure, so
 * the turn machine stays testable.
 */
export function evaluateRoll(state, value) {
  const sixCount = value === 6 ? state.sixCount + 1 : 0;

  if (value === 6 && sixCount >= MAX_SIXES) {
    return { kind: "forfeit", sixCount: 0 };
  }

  const legalMoves = getLegalMoves(state, value);

  if (legalMoves.length === 0) {
    // If no token can use the roll, it's forfeited and the turn
    // ends — even a 6, per the spec's explicit call-out.
    return { kind: "pass", sixCount, legalMoves: [] };
  }

  return {
    kind: legalMoves.length === 1 ? "forced" : "choose",
    sixCount,
    legalMoves,
  };
}

export function nextPlayerIndex(state) {
  return (state.currentPlayer + 1) % PLAYERS.length;
}

/* ---------------------------------------------------------
   Placement
--------------------------------------------------------- */

/** Squares are shared, so tokens on one square need a key. */
export function cellKeyFor(token) {
  if (isInYard(token)) return `yard:${token.color}:${token.slot}`;

  if (isInHomeLane(token)) {
    return `lane:${token.color}:${token.position - TRACK_STEPS}`;
  }

  return `ring:${ringIndexOf(token)}`;
}

/** World position of a token's square, ignoring stacking. */
export function baseWorldPosition(token) {
  if (isInYard(token)) {
    const [x, z] = YARD_SLOTS[token.color][token.slot];
    return { x, z };
  }

  const [row, col] = cellOf(token);

  return cellToWorld(row, col);
}

/**
 * Final world position per token, spreading any stack around
 * a small circle so it stays countable.
 */
export function placementsFor(tokens) {
  const groups = new Map();

  for (const token of tokens) {
    const key = cellKeyFor(token);

    if (!groups.has(key)) groups.set(key, []);

    groups.get(key).push(token);
  }

  const placements = new Map();

  for (const group of groups.values()) {
    group.forEach((token, index) => {
      const base = baseWorldPosition(token);

      if (group.length === 1) {
        placements.set(token.id, { ...base });
        return;
      }

      const angle = (index / group.length) * Math.PI * 2 - Math.PI / 2;

      placements.set(token.id, {
        x: base.x + Math.cos(angle) * STACK_RADIUS,
        z: base.z + Math.sin(angle) * STACK_RADIUS,
      });
    });
  }

  return placements;
}
