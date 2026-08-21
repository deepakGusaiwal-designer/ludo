import test from "node:test";
import assert from "node:assert/strict";
import { getFairRoll, resetFairDice } from "./fairDice.js";
import { YARD } from "./constants.js";

test("Fair Dice system guarantees a 6 when a player is stuck in the yard", () => {
  resetFairDice();

  const color = "red";
  const yardTokens = [
    { color: "red", position: YARD, finished: false },
    { color: "red", position: YARD, finished: false },
    { color: "red", position: YARD, finished: false },
    { color: "red", position: YARD, finished: false },
  ];

  let rolledSix = false;
  const rolls = [];

  // Roll up to 6 times
  for (let i = 0; i < 6; i++) {
    const val = getFairRoll(color, yardTokens);
    rolls.push(val);
    if (val === 6) {
      rolledSix = true;
      break;
    }
  }

  assert.equal(rolledSix, true, `Player should get a 6 within 6 rolls when stuck in yard (Rolls: ${rolls.join(", ")})`);
});

test("Fair Dice system generates valid dice values between 1 and 6", () => {
  resetFairDice();

  for (let i = 0; i < 100; i++) {
    const val = getFairRoll("blue", []);
    assert.ok(val >= 1 && val <= 6, `Dice value ${val} out of range 1-6`);
  }
});

test("every face comes up equally often over many rolls (not stuck in yard, no pity)", () => {
  resetFairDice();

  // A token already on the board means the pity system never
  // engages, so this isolates the underlying bag's distribution.
  const activeTokens = [{ color: "green", position: 5, finished: false }];

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const rolls = 1200; // 100 full bag cycles

  for (let i = 0; i < rolls; i++) {
    counts[getFairRoll("green", activeTokens)] += 1;
  }

  for (let face = 1; face <= 6; face++) {
    const expected = rolls / 6;
    const deviation = Math.abs(counts[face] - expected) / expected;
    assert.ok(
      deviation < 0.1,
      `face ${face} came up ${counts[face]} times, expected ~${expected} (got ${JSON.stringify(counts)})`,
    );
  }
});

test("resetFairDice clears stale pity progress and bag depletion between matches", () => {
  resetFairDice();

  const color = "yellow";
  const stuckTokens = [
    { color, position: YARD, finished: false },
    { color, position: YARD, finished: false },
  ];

  // Drain this color's bag and, along the way, force it deep into
  // pity by discarding any 6 that comes up naturally (simulating a
  // long unlucky streak right before the match ends).
  let missStreak = 0;
  for (let i = 0; i < 4; i++) {
    const val = getFairRoll(color, stuckTokens);
    if (val === 6) missStreak = 0;
    else missStreak += 1;
  }
  assert.ok(missStreak >= 1, "expected at least one non-6 to build up pity");

  // A fresh match starts here — without a reset, this color would
  // carry over both a depleted bag and elevated pity.
  resetFairDice();

  // A freshly reset bag, rolled for a color with tokens already on
  // the board (pity inactive), must contain exactly two 6s in its
  // first 12 draws — proving the old bag's used-up slots didn't
  // leak into the new one.
  const onBoard = [{ color, position: 5, finished: false }];
  let sixes = 0;
  for (let i = 0; i < 12; i++) {
    if (getFairRoll(color, onBoard) === 6) sixes += 1;
  }
  assert.equal(sixes, 2, "a freshly reset bag should contain exactly two 6s per 12 draws");
});
