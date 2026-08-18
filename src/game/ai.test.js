import test from "node:test";
import assert from "node:assert/strict";

import { chooseBestMove, getNextActiveColor } from "./ai.js";

// state.tokens is always the real array-of-tokens shape (each
// entry keyed by an `id` like "red-0"), never an object keyed by
// tokenId — these mocks match production so the lookups inside
// scoreMove are actually exercised.

test("AI chooses capturing move over simple advance", () => {
  const mockState = {
    tokens: [
      { id: "red-0", color: "red", position: 10 },
      { id: "green-0", color: "green", position: 14 },
    ],
  };

  const legalMoves = [
    { tokenId: "red-0", from: 10, to: 12, captured: [] },
    { tokenId: "red-0", from: 10, to: 14, captured: ["green-0"] }, // capture!
  ];

  const best = chooseBestMove(mockState, legalMoves, "smart");
  assert.equal(best.tokenId, "red-0");
  assert.equal(best.to, 14);
  assert.deepEqual(best.captured, ["green-0"]);
});

test("AI chooses yard release on a 6", () => {
  const mockState = {
    tokens: [
      { id: "red-0", color: "red", position: -1 },
      { id: "red-1", color: "red", position: 5 },
    ],
  };

  const legalMoves = [
    { tokenId: "red-0", from: -1, to: 0, entered: true },
    { tokenId: "red-1", from: 5, to: 11, entered: false },
  ];

  const best = chooseBestMove(mockState, legalMoves, "smart");
  assert.equal(best.entered, true);
});

test("getNextActiveColor skips disabled colors in 2-player mode", () => {
  const controllers = {
    red: "human",
    green: "off",
    yellow: "computer",
    blue: "off",
  };

  assert.equal(getNextActiveColor("red", controllers), "yellow");
  assert.equal(getNextActiveColor("yellow", controllers), "red");
});
