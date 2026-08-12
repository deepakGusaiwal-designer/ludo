import { useCallback, useEffect, useRef, useState } from "react";

import { labelFor } from "../game/constants.js";

import {
  applyMove,
  createInitialState,
  currentColor,
  earnsExtraTurn,
  evaluateRoll,
  nextPlayerIndex,
  tokenById,
} from "../game/rules.js";

const FORFEIT_PAUSE = 1200;

const DEAD_ROLL_PAUSE = 1100;

const HANDOVER_PAUSE = 700;

const FORCED_MOVE_PAUSE = 600;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const rollValue = () => 1 + Math.floor(Math.random() * 6);

/**
 * The turn machine.
 *
 * The authoritative game lives in a ref so that async steps
 * never read stale state; `publish` copies it into React state
 * whenever the UI needs to repaint.
 *
 * Statuses:
 *   idle      waiting for a roll
 *   rolling   dice in the air
 *   choosing  waiting for the player to pick a token
 *   moving    a token is travelling, input is locked
 *   over      somebody won
 */
const STORAGE_KEY = "ludo_game_state";

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.state && Array.isArray(parsed.state.tokens)) {
      if (parsed.status === "rolling" || parsed.status === "moving") {
        parsed.status = "idle";
        parsed.dice = null;
        parsed.legalMoves = [];
        parsed.message = `${labelFor(currentColor(parsed.state))} to roll.`;
      }
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load saved Ludo state:", e);
  }
  return null;
}

export function useLudoGame(sceneRef, ready) {
  const machine = useRef(null);
  if (!machine.current) {
    machine.current = loadSavedState() || {
      state: createInitialState(),
      status: "idle",
      dice: null,
      legalMoves: [],
      message: "Red to roll. A 6 brings a token out of the yard.",
    };
  }

  const alive = useRef(true);

  const [view, setView] = useState(() => ({ ...machine.current }));

  const publish = useCallback(() => {
    if (alive.current) {
      setView({ ...machine.current });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(machine.current));
      } catch (e) {
        console.error("Failed to save Ludo state:", e);
      }
    }
  }, []);

  useEffect(() => {
    alive.current = true;

    return () => {
      alive.current = false;
    };
  }, []);

  const advanceTurn = useCallback(() => {
    const m = machine.current;

    m.state = {
      ...m.state,
      currentPlayer: nextPlayerIndex(m.state),
      sixCount: 0,
      dice: null,
    };

    m.dice = null;
    m.legalMoves = [];
    m.status = "idle";
    m.message = `${labelFor(currentColor(m.state))} to roll.`;

    sceneRef.current?.setHighlights([]);
    sceneRef.current?.setTurnColor(currentColor(m.state));

    publish();
  }, [publish, sceneRef]);

  /** Moves a token the player has chosen (or the only legal one). */
  const play = useCallback(
    async (tokenId) => {
      const m = machine.current;

      const scene = sceneRef.current;

      if (!scene || m.status !== "choosing") return;

      if (!m.legalMoves.includes(tokenId)) return;

      const dice = m.dice;

      const mover = labelFor(currentColor(m.state));

      m.status = "moving";
      m.legalMoves = [];

      scene.setHighlights([]);
      publish();

      const result = applyMove(m.state, tokenId, dice);

      await scene.playMove(result, result.state.tokens);

      if (!alive.current) return;

      m.state = result.state;

      const events = [];

      if (result.captured.length > 0) {
        const victim = tokenById(result.state, result.captured[0]);

        events.push(`${mover} knocked ${labelFor(victim.color)} back to the yard`);
      }

      if (result.finished) events.push(`${mover} brought a token home`);

      if (result.won) {
        m.status = "over";
        m.dice = null;
        m.message = `${labelFor(result.state.winner)} has all four tokens home.`;
        publish();
        return;
      }

      if (earnsExtraTurn({ dice, captured: result.captured, finished: result.finished })) {
        events.push("roll again");

        m.message = `${events.join(" — ")}.`;
        m.status = "idle";
        m.dice = null;

        publish();
        return;
      }

      if (events.length > 0) {
        m.message = `${events.join(" — ")}.`;
        publish();
      }

      await wait(HANDOVER_PAUSE);

      if (!alive.current) return;

      advanceTurn();
    },
    [advanceTurn, publish, sceneRef],
  );

  const roll = useCallback(async () => {
    const m = machine.current;

    const scene = sceneRef.current;

    if (!scene || m.status !== "idle" || m.state.winner) return;

    const name = labelFor(currentColor(m.state));

    m.status = "rolling";
    m.message = `${name} is rolling…`;

    publish();

    const value = await scene.rollDice(rollValue());

    if (!alive.current) return;

    m.dice = value;

    const outcome = evaluateRoll(m.state, value);

    m.state = { ...m.state, sixCount: outcome.sixCount, dice: value };

    if (outcome.kind === "forfeit") {
      m.status = "moving";
      m.message = `${name} rolled three sixes — turn forfeited.`;

      publish();

      await wait(FORFEIT_PAUSE);

      if (alive.current) advanceTurn();

      return;
    }

    if (outcome.kind === "pass") {
      m.status = "moving";
      m.message = `${name} rolled ${value} — no legal move.`;

      publish();

      await wait(DEAD_ROLL_PAUSE);

      if (alive.current) advanceTurn();

      return;
    }

    if (outcome.kind === "reroll") {
      m.status = "idle";
      m.message = `${name} rolled a 6 but has no legal move. Roll again.`;

      publish();

      return;
    }

    m.legalMoves = outcome.legalMoves;
    m.status = "choosing";

    scene.setHighlights(outcome.legalMoves);

    m.message =
      outcome.kind === "forced"
        ? `${name} rolled ${value} — only one move available.`
        : `${name} rolled ${value} — pick a token.`;

    publish();

    // Nothing to decide, so take it after a beat.
    if (outcome.kind === "forced") {
      await wait(FORCED_MOVE_PAUSE);

      if (alive.current && machine.current.status === "choosing") {
        play(outcome.legalMoves[0]);
      }
    }
  }, [advanceTurn, play, publish, sceneRef]);

  const restart = useCallback(() => {
    const m = machine.current;

    m.state = createInitialState();
    m.status = "idle";
    m.dice = null;
    m.legalMoves = [];
    m.message = "Red to roll. A 6 brings a token out of the yard.";

    sceneRef.current?.resetTokens(m.state.tokens);
    sceneRef.current?.setTurnColor("red");

    publish();
  }, [publish, sceneRef]);

  /* wire board input once the scene exists */

  useEffect(() => {
    const scene = sceneRef.current;

    if (!ready || !scene) return undefined;

    scene.onDiceClick(() => roll());
    scene.onTokenClick((tokenId) => play(tokenId));

    scene.setTurnColor(currentColor(machine.current.state));
    scene.syncPlacements(machine.current.state.tokens, false);

    if (
      machine.current.status === "choosing" &&
      machine.current.legalMoves.length > 0
    ) {
      scene.setHighlights(machine.current.legalMoves);
    }

    return () => {
      scene.onDiceClick(null);
      scene.onTokenClick(null);
    };
  }, [play, ready, roll, sceneRef]);

  return {
    ...view,
    canRoll: view.status === "idle" && !view.state.winner,
    roll,
    play,
    restart,
  };
}
