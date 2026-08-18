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
