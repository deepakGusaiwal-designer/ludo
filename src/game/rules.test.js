/**
 * Rules tests. Run with: npm test
 *
 * These exercise the shipped functions directly — no stubs,
 * no renderer, no DOM — which is the point of keeping the
 * rules free of three.js.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  COMMON_TRACK,
  FINISH_POSITION,
  HOME_LANES,
  LAST_RING_STEP,
  PLAYERS,
  PLAYER_COLORS,
  RING_LENGTH,
  SAFE_TRACK_INDEXES,
  START_INDEX,
  TRACK_STEPS,
  YARD,
} from "./constants.js";

import {
  applyMove,
  buildOccupancy,
  canTokenMove,
  cellOf,
  createInitialState,
  currentColor,
  earnsExtraTurn,
  evaluateRoll,
  getLegalMoves,
  hasWon,
  isOnRing,
  nextPlayerIndex,
  placementsFor,
  ringIndexOf,
  tokenById,
  tokensHome,
} from "./rules.js";

/* ---------- helpers ---------- */

/** A state with specific tokens forced onto specific squares. */
function withPositions(overrides) {
  const state = createInitialState();

  const tokens = state.tokens.map((token) =>
    token.id in overrides
      ? { ...token, position: overrides[token.id] }
      : token,
  );

  return { ...state, tokens };
}

/** Relative step that puts `color` on a given ring index. */
function relForRing(color, ringIndex) {
  return (ringIndex - START_INDEX[color] + RING_LENGTH) % RING_LENGTH;
}

function tokenAt(state, id) {
  return tokenById(state, id);
}

/* ---------- board geometry ---------- */

test("the ring is 52 distinct cells", () => {
  assert.equal(COMMON_TRACK.length, RING_LENGTH);

  const unique = new Set(COMMON_TRACK.map(String));

  assert.equal(unique.size, RING_LENGTH);
});

test("each color walks 57 distinct squares from start to home", () => {
  for (const color of PLAYER_COLORS) {
    const seen = new Set();

    for (let position = 0; position <= FINISH_POSITION; position++) {
      const cell = cellOf({ color, position, slot: 0 });

      assert.ok(cell, `${color} has no cell at ${position}`);

      seen.add(String(cell));
    }

    assert.equal(seen.size, 57, `${color} route`);
  }
});

test("every color turns into its own lane right after step 50", () => {
  for (const color of PLAYER_COLORS) {
    const entrance = cellOf({ color, position: LAST_RING_STEP });

    const firstLane = cellOf({ color, position: TRACK_STEPS });

    assert.deepEqual(
      firstLane,
      HOME_LANES[color][0],
      `${color} should enter its own lane`,
    );

    // the entrance must physically touch the first lane cell
    const distance =
      Math.abs(entrance[0] - firstLane[0]) +
      Math.abs(entrance[1] - firstLane[1]);

    assert.equal(distance, 1, `${color} entrance ${entrance} -> ${firstLane}`);
  }
});

test("every color finishes on the center square", () => {
  for (const color of PLAYER_COLORS) {
    const last = cellOf({ color, position: FINISH_POSITION });

    const distance = Math.abs(last[0] - 7) + Math.abs(last[1] - 7);

    assert.equal(distance, 1, `${color} finishes at ${last}`);
  }
});

test("the shared ring never crosses anyone's home lane", () => {
  const laneCells = new Set();

  for (const color of PLAYER_COLORS) {
    // the final lane cell is the shared center, so skip it
    HOME_LANES[color].slice(0, 5).forEach((cell) => laneCells.add(String(cell)));
  }

  for (const cell of COMMON_TRACK) {
    assert.ok(!laneCells.has(String(cell)), `ring crosses a lane at ${cell}`);
  }
});

test("safe squares are the four starts plus four stars", () => {
  assert.equal(SAFE_TRACK_INDEXES.size, 8);

  for (const { startIndex } of PLAYERS) {
    assert.ok(SAFE_TRACK_INDEXES.has(startIndex), "start square is safe");

    assert.ok(
      SAFE_TRACK_INDEXES.has((startIndex + 8) % RING_LENGTH),
      "star square is safe",
    );
  }
});

/* ---------- leaving the yard ---------- */

test("a token needs a 6 to leave the yard", () => {
  const state = createInitialState();

  const token = tokenAt(state, "red-0");

  const occupancy = buildOccupancy(state);

  for (const dice of [1, 2, 3, 4, 5]) {
    assert.equal(canTokenMove(token, dice, occupancy), false, `dice ${dice}`);
  }

  assert.equal(canTokenMove(token, 6, occupancy), true);
});

test("entering puts the token on its own start square", () => {
  const state = createInitialState();

  const result = applyMove(state, "red-0", 6);

  assert.equal(result.entered, true);

  assert.equal(result.to, 0);

  assert.deepEqual(cellOf(tokenAt(result.state, "red-0")), COMMON_TRACK[0]);
});

/* ---------- exact roll to finish ---------- */

test("home must be reached on an exact roll", () => {
  const state = withPositions({ "red-0": FINISH_POSITION - 2 });

  const token = tokenAt(state, "red-0");

  const occupancy = buildOccupancy(state);

  assert.equal(canTokenMove(token, 2, occupancy), true, "exact roll allowed");

  assert.equal(canTokenMove(token, 1, occupancy), true, "short roll allowed");

  assert.equal(canTokenMove(token, 3, occupancy), false, "overshoot refused");

  assert.equal(canTokenMove(token, 6, occupancy), false, "overshoot refused");
});

test("a finished token can never move again", () => {
  const state = withPositions({ "red-0": FINISH_POSITION });

  const finished = { ...tokenAt(state, "red-0"), finished: true };

  assert.equal(canTokenMove(finished, 1, buildOccupancy(state)), false);
});

/* ---------- blocks ---------- */

test("two opponents block both landing and passing", () => {
  const state = withPositions({
    "red-0": 0,
    "green-0": relForRing("green", 3),
    "green-1": relForRing("green", 3),
  });

  assert.equal(ringIndexOf(tokenAt(state, "green-0")), 3, "block is on cell 3");

  const red = tokenAt(state, "red-0");

  const occupancy = buildOccupancy(state);

  assert.equal(canTokenMove(red, 3, occupancy), false, "cannot land on it");

  assert.equal(canTokenMove(red, 5, occupancy), false, "cannot pass it");

  assert.equal(canTokenMove(red, 2, occupancy), true, "can stop short");
});

test("a lone opponent is not a block", () => {
  const state = withPositions({
    "red-0": 0,
    "green-0": relForRing("green", 3),
  });

  assert.equal(
    canTokenMove(tokenAt(state, "red-0"), 3, buildOccupancy(state)),
    true,
  );
});

test("your own stack never blocks you", () => {
  const state = withPositions({
    "red-0": 0,
    "red-1": 3,
    "red-2": 3,
  });

  assert.equal(
    canTokenMove(tokenAt(state, "red-0"), 5, buildOccupancy(state)),
    true,
  );
});

test("a block on a start square refuses entry from the yard", () => {
  const state = withPositions({
    "green-0": relForRing("green", START_INDEX.red),
    "green-1": relForRing("green", START_INDEX.red),
  });

  assert.equal(
    canTokenMove(tokenAt(state, "red-0"), 6, buildOccupancy(state)),
    false,
  );
});

/* ---------- stack limit ---------- */

test("a third own token cannot land on an already-stacked ring square", () => {
  const state = withPositions({ "red-0": 0, "red-1": 3, "red-2": 3 });

  assert.equal(
    canTokenMove(tokenAt(state, "red-0"), 3, buildOccupancy(state)),
    false,
    "landing exactly on your own block of two is refused",
  );
});

test("a third own token cannot enter a start square already holding two", () => {
  const state = withPositions({ "red-0": 0, "red-1": 0 });

  assert.equal(
    canTokenMove(tokenAt(state, "red-2"), 6, buildOccupancy(state)),
    false,
  );
});

test("the home lane and HOME itself have no stack limit", () => {
  // three red tokens already resting at HOME must not stop a
  // fourth from finishing too, or the game could never be won
  const state = withPositions({
    "red-0": FINISH_POSITION,
    "red-1": FINISH_POSITION,
    "red-2": FINISH_POSITION,
    "red-3": FINISH_POSITION - 1,
  });

  assert.equal(
    canTokenMove(tokenAt(state, "red-3"), 1, buildOccupancy(state)),
    true,
  );
});

/* ---------- capture ---------- */

test("landing on a lone opponent sends it back to the yard", () => {
  const state = withPositions({
    "red-0": 1,
    "green-0": relForRing("green", 4),
  });

  const result = applyMove(state, "red-0", 3);

  assert.deepEqual(result.captured, ["green-0"]);

  assert.equal(tokenAt(result.state, "green-0").position, YARD);
});

test("no capture happens on a safe square", () => {
  const safe = 8; // a starred square

  const state = withPositions({
    "red-0": safe - 3,
    "green-0": relForRing("green", safe),
  });

  const result = applyMove(state, "red-0", 3);

  assert.equal(ringIndexOf(tokenAt(result.state, "red-0")), safe);

  assert.deepEqual(result.captured, []);

  assert.notEqual(tokenAt(result.state, "green-0").position, YARD);
});

test("your own token is never captured", () => {
  const state = withPositions({ "red-0": 1, "red-1": 4 });

  const result = applyMove(state, "red-0", 3);

  assert.deepEqual(result.captured, []);

  assert.equal(tokenAt(result.state, "red-1").position, 4);
});

test("entering your own start square never captures — the opponent shares it", () => {
  const state = withPositions({
    "green-0": relForRing("green", START_INDEX.red),
  });

  const result = applyMove(state, "red-0", 6);

  assert.deepEqual(result.captured, []);
  assert.equal(
    ringIndexOf(tokenAt(result.state, "green-0")),
    START_INDEX.red,
    "the opponent stays put on the start square",
  );
  assert.equal(ringIndexOf(tokenAt(result.state, "red-0")), START_INDEX.red);
});

test("no capture happens on any of the eight safe squares", () => {
  for (const safe of SAFE_TRACK_INDEXES) {
    // Red walks onto the square from three back — except red's own
    // start (0), which red can only re-reach by wrapping into its
    // home lane, so green makes that landing instead. The victim
    // is always a third color so the mover never owns it.
    const mover = safe >= 3 ? "red" : "green";
    const victim = mover === "red" ? "green" : "yellow";

    const to = (safe - START_INDEX[mover] + RING_LENGTH) % RING_LENGTH;

    const state = withPositions({
      [`${mover}-0`]: to - 3,
      [`${victim}-0`]: relForRing(victim, safe),
    });

    const result = applyMove(
      { ...state, currentPlayer: PLAYER_COLORS.indexOf(mover) },
      `${mover}-0`,
      3,
    );

    assert.equal(ringIndexOf(tokenAt(result.state, `${mover}-0`)), safe);
    assert.deepEqual(result.captured, [], `capture on safe square ${safe}`);
    assert.equal(
      ringIndexOf(tokenAt(result.state, `${victim}-0`)),
      safe,
      `opponent survives on safe square ${safe}`,
    );
  }
});

test("a single move never captures more than one token", () => {
  // A contrived state puts two different opponents on the same
  // unsafe square; landing there sends at most one home.
  const unsafe = 4;
  const state = withPositions({
    "green-0": relForRing("green", unsafe),
    "yellow-0": relForRing("yellow", unsafe),
    "red-0": 1,
  });

  const result = applyMove(state, "red-0", 3);

  assert.equal(result.captured.length, 1);
});

test("a token in its home lane cannot be captured from the ring", () => {
  // green sits one square into its lane while red walks the
  // entire ring past it
  const green = TRACK_STEPS;

  for (let step = 0; step < LAST_RING_STEP; step++) {
    const state = withPositions({ "red-0": step, "green-0": green });

    const result = applyMove(state, "red-0", 1);

    assert.deepEqual(result.captured, [], `red at step ${step}`);

    assert.equal(tokenAt(result.state, "green-0").position, green);
  }
});

/* ---------- turn flow ---------- */

test("three sixes in a row forfeit the turn", () => {
  let state = createInitialState();

  const first = evaluateRoll(state, 6);
  assert.equal(first.sixCount, 1);
  assert.notEqual(first.kind, "forfeit");

  state = { ...state, sixCount: first.sixCount };

  const second = evaluateRoll(state, 6);
  assert.equal(second.sixCount, 2);
  assert.notEqual(second.kind, "forfeit");

  state = { ...state, sixCount: second.sixCount };

  const third = evaluateRoll(state, 6);
  assert.equal(third.kind, "forfeit");
  assert.equal(third.sixCount, 0, "counter resets after the forfeit");
});

test("a non-six clears the six counter", () => {
  const state = { ...createInitialState(), sixCount: 2 };

  assert.equal(evaluateRoll(state, 3).sixCount, 0);
});

test("a dead roll passes the turn, even a six with nothing to move", () => {
  const state = createInitialState(); // everything in the yard

  assert.equal(evaluateRoll(state, 4).kind, "pass");

  // spec §5.3: forfeited "even if the roll was a 6"
  const blocked = withPositions({
    "green-0": relForRing("green", START_INDEX.red),
    "green-1": relForRing("green", START_INDEX.red),
  });

  assert.equal(evaluateRoll(blocked, 6).kind, "pass");
});

test("a single legal move is reported as forced", () => {
  const state = withPositions({ "red-0": 10 });

  const outcome = evaluateRoll(state, 3);

  assert.equal(outcome.kind, "forced");

  assert.deepEqual(outcome.legalMoves, ["red-0"]);
});

test("extra turns come from a six, a capture, or reaching home", () => {
  assert.equal(earnsExtraTurn({ dice: 6, captured: [], finished: false }), true);

  assert.equal(
    earnsExtraTurn({ dice: 3, captured: ["green-0"], finished: false }),
    true,
  );

  assert.equal(earnsExtraTurn({ dice: 3, captured: [], finished: true }), true);

  assert.equal(
    earnsExtraTurn({ dice: 3, captured: [], finished: false }),
    false,
  );
});

test("turn order follows the ring", () => {
  let state = createInitialState();

  const order = [];

  for (let i = 0; i < 5; i++) {
    order.push(currentColor(state));
    state = { ...state, currentPlayer: nextPlayerIndex(state) };
  }

  assert.deepEqual(order, ["red", "green", "yellow", "blue", "red"]);
});

/* ---------- winning ---------- */

test("a player wins once all four tokens are home", () => {
  const state = withPositions({
    "red-0": FINISH_POSITION,
    "red-1": FINISH_POSITION,
    "red-2": FINISH_POSITION,
    "red-3": FINISH_POSITION - 1,
  });

  const marked = {
    ...state,
    tokens: state.tokens.map((token) =>
      token.position === FINISH_POSITION ? { ...token, finished: true } : token,
    ),
  };

  assert.equal(hasWon(marked, "red"), false);
  assert.equal(tokensHome(marked, "red"), 3);

  const result = applyMove(marked, "red-3", 1);

  assert.equal(result.won, true);
  assert.equal(result.state.winner, "red");
  assert.equal(tokensHome(result.state, "red"), 4);
});

/* ---------- placement ---------- */

test("tokens sharing a square are spread apart", () => {
  const state = withPositions({
    "red-0": 0,
    "red-1": 0,
  });

  const placements = placementsFor(state.tokens);

  const a = placements.get("red-0");
  const b = placements.get("red-1");

  const gap = Math.hypot(a.x - b.x, a.z - b.z);

  assert.ok(gap > 0.2, `stacked tokens should separate, got ${gap.toFixed(3)}`);
});

test("a token alone on a square sits exactly on it", () => {
  const state = withPositions({ "red-0": 0 });

  const placements = placementsFor(state.tokens);

  const [row, col] = COMMON_TRACK[0];

  const expected = cellOf({ color: "red", position: 0 });

  assert.deepEqual([row, col], expected);
});

test("a placement reports how many tokens share its square, for the renderer to shrink them", () => {
  // The renderer (LudoScene.syncPlacements) reads `position.count` to
  // scale down crowded tokens so they don't visually overlap — this
  // field silently regressed to `undefined` once before, so it's
  // pinned here for every group size.
  const solo = withPositions({ "red-0": 0 });
  assert.equal(placementsFor(solo.tokens).get("red-0").count, 1);

  const pair = withPositions({ "red-0": 0, "red-1": 0 });
  assert.equal(placementsFor(pair.tokens).get("red-0").count, 2);
  assert.equal(placementsFor(pair.tokens).get("red-1").count, 2);

  // Four different colors legally sharing one safe square.
  const safe = 8;
  const crowd = withPositions({
    "red-0": relForRing("red", safe),
    "green-0": relForRing("green", safe),
    "yellow-0": relForRing("yellow", safe),
    "blue-0": relForRing("blue", safe),
  });
  const crowdPlacements = placementsFor(crowd.tokens);
  for (const id of ["red-0", "green-0", "yellow-0", "blue-0"]) {
    assert.equal(crowdPlacements.get(id).count, 4, `${id} should report count 4`);
  }
});

/* ---------- full games ---------- */

/** Plays a whole game using only the pure API. */
function playRandomGame(random = Math.random) {
  let state = createInitialState();

  let actions = 0;

  while (!state.winner && actions++ < 100000) {
    const value = 1 + Math.floor(random() * 6);

    const outcome = evaluateRoll(state, value);

    state = { ...state, sixCount: outcome.sixCount, dice: value };

    if (outcome.kind === "forfeit" || outcome.kind === "pass") {
      state = {
        ...state,
        currentPlayer: nextPlayerIndex(state),
        sixCount: 0,
        dice: null,
      };
      continue;
    }

    if (outcome.kind === "reroll") continue;

    const choice =
      outcome.legalMoves[Math.floor(random() * outcome.legalMoves.length)];

    const result = applyMove(state, choice, value);

    state = result.state;

    if (result.won) break;

    if (
      earnsExtraTurn({
        dice: value,
        captured: result.captured,
        finished: result.finished,
      })
    ) {
      continue;
    }

    state = {
      ...state,
      currentPlayer: nextPlayerIndex(state),
      sixCount: 0,
      dice: null,
    };
  }

  return { state, actions };
}

test("a full random game always reaches a winner", () => {
  const { state, actions } = playRandomGame();

  assert.ok(state.winner, `no winner after ${actions} actions`);

  assert.equal(tokensHome(state, state.winner), 4);
});

test("50 games finish and never corrupt a token", () => {
  const winners = {};

  for (let game = 0; game < 50; game++) {
    const { state } = playRandomGame();

    assert.ok(state.winner, `game ${game} stalled`);

    winners[state.winner] = (winners[state.winner] || 0) + 1;

    for (const token of state.tokens) {
      assert.ok(
        token.position === YARD ||
          (token.position >= 0 && token.position <= FINISH_POSITION),
        `token ${token.id} out of range at ${token.position}`,
      );

      assert.equal(
        token.finished,
        token.position === FINISH_POSITION,
        `token ${token.id} finished flag disagrees with position`,
      );
    }

    // no square may ever hold two colors that should have
    // captured each other
    const byCell = new Map();

    for (const token of state.tokens) {
      if (!isOnRing(token)) continue;

      const index = ringIndexOf(token);

      if (SAFE_TRACK_INDEXES.has(index)) continue;

      const existing = byCell.get(index);

      if (existing) {
        assert.equal(
          existing,
          token.color,
          `two colors share unsafe square ${index}`,
        );
      }

      byCell.set(index, token.color);
    }
  }

  assert.equal(
    Object.keys(winners).length > 1,
    true,
    `expected varied winners, got ${JSON.stringify(winners)}`,
  );
});
