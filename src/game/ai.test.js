import test from "node:test";
import assert from "node:assert/strict";

import { chooseBestMove, getNextActiveColor } from "./ai.js";

test("AI chooses capturing move over simple advance", () => {
  const mockState = {
    tokens: {
      red_0: { color: "red", position: 10 },
      green_0: { color: "green", position: 14 },
    },
  };

  const legalMoves = [
    { tokenId: "red_0", from: 10, to: 12, captured: [] },
    { tokenId: "red_0", from: 10, to: 14, captured: ["green_0"] }, // capture!
  ];

  const best = chooseBestMove(mockState, legalMoves, "smart");
  assert.equal(best.tokenId, "red_0");
  assert.equal(best.to, 14);
  assert.deepEqual(best.captured, ["green_0"]);
});

test("AI chooses yard release on a 6", () => {
  const mockState = { tokens: {} };
  const legalMoves = [
    { tokenId: "red_0", from: -1, to: 0, entered: true },
    { tokenId: "red_1", from: 5, to: 11, entered: false },
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
