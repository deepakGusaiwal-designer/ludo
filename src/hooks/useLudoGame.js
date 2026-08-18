import { useCallback, useEffect, useRef, useState } from "react";

import { PLAYER_COLORS, getPlayerName, labelFor } from "../game/constants.js";
import {
  DEFAULT_PLAYER_CONFIG,
  chooseBestMove,
  getNextActiveColor,
} from "../game/ai.js";

import {
  applyMove,
  createInitialState,
  currentColor,
  earnsExtraTurn,
  evaluateRoll,
  tokenById,
} from "../game/rules.js";
import { getFairRoll } from "../game/fairDice.js";

const FORFEIT_PAUSE = 1200;
const DEAD_ROLL_PAUSE = 1100;
const HANDOVER_PAUSE = 700;
const FORCED_MOVE_PAUSE = 600;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const STORAGE_KEY = "ludo_game_state";
const CONFIG_KEY = "ludo_player_config";

function loadSavedConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_PLAYER_CONFIG;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.controllers) return parsed;
  } catch (e) {
    console.error("Failed to load saved player config:", e);
  }
  return DEFAULT_PLAYER_CONFIG;
}

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

export function useLudoGame(sceneRef, ready, onlineState = null) {
  const [playerConfig, setPlayerConfig] = useState(loadSavedConfig);

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
  const pendingRemoteMoveRef = useRef(null);

  const [view, setView] = useState(() => ({ ...machine.current }));

  const isRoomHost =
    onlineState?.room &&
    (onlineState.room.players?.find((p) => p.isHost)?.socketId === onlineState.socket?.id ||
      onlineState.room.hostId === onlineState.socket?.id);

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

  // Sync active controllers to remove unplayable tokens (e.g. 2-player mode)
  useEffect(() => {
    if (ready && sceneRef.current) {
      sceneRef.current.syncActiveControllers(playerConfig.controllers);
    }
  }, [playerConfig.controllers, ready, sceneRef]);

  // Sync room config when playing in online room
  useEffect(() => {
    if (onlineState?.room?.controllers) {
      setPlayerConfig((prev) => ({
        ...prev,
        controllers: onlineState.room.controllers,
        difficulty: onlineState.room.difficulty || prev.difficulty,
      }));
    }
  }, [onlineState?.room?.controllers, onlineState?.room?.difficulty]);

  // Handle reconnected game state (e.g. after page refresh)
  useEffect(() => {
    if (onlineState?.reconnectedGameState && ready && sceneRef.current) {
      const restored = onlineState.reconnectedGameState;
      if (restored && restored.state) {
        machine.current = { ...restored };
        sceneRef.current.syncPlacements(restored.state.tokens, false);
        sceneRef.current.setTurnColor(currentColor(restored.state));
        sceneRef.current.syncActiveControllers(playerConfig.controllers);
        publish();
      }
    }
  }, [onlineState?.reconnectedGameState, ready, playerConfig.controllers, publish, sceneRef]);

  const advanceTurn = useCallback(() => {
    const m = machine.current;

    const current = currentColor(m.state);
    const nextColor = getNextActiveColor(current, playerConfig.controllers);
    const nextIndex = PLAYER_COLORS.indexOf(nextColor);

    m.state = {
      ...m.state,
      currentPlayer: nextIndex,
      sixCount: 0,
      dice: null,
    };

    m.dice = null;
    m.legalMoves = [];
    m.status = "idle";

    const isComputer = playerConfig.controllers[nextColor] === "computer";
    const name = getPlayerName(nextColor, playerConfig, onlineState);
    m.message = `${name}${isComputer ? " (AI)" : ""} to roll.`;

    sceneRef.current?.setHighlights([]);
    sceneRef.current?.setTurnColor(currentColor(m.state));

    publish();

    if (onlineState?.room) {
      onlineState.syncGameState(m);
    }
  }, [playerConfig, onlineState, publish, sceneRef]);

  /** Moves a token the player has chosen (or the only legal one). */
  const play = useCallback(
    async (tokenId) => {
      const m = machine.current;
      const scene = sceneRef.current;

      if (!scene || m.status !== "choosing") return;
      if (!m.legalMoves.includes(tokenId)) return;

      const dice = m.dice;
      const activeColor = currentColor(m.state);
      const mover = getPlayerName(activeColor, playerConfig, onlineState);

      m.status = "moving";
      m.legalMoves = [];

      scene.setHighlights([]);
      publish();

      // Emit network move if this is my turn or if I am the host driving an AI bot
      const isMyTurn = onlineState?.room && onlineState.myColor === activeColor;
      const isHostDrivingAI =
        onlineState?.room && isRoomHost && playerConfig.controllers[activeColor] === "computer";

      if (isMyTurn || isHostDrivingAI) {
        onlineState.sendMoveToken(tokenId, activeColor);
      }

      const result = applyMove(m.state, tokenId, dice);
      await scene.playMove(result, result.state.tokens);

      if (!alive.current) return;

      m.state = result.state;
      const events = [];

      if (result.captured.length > 0) {
        const victim = tokenById(result.state, result.captured[0]);
        events.push(
          `${mover} knocked ${getPlayerName(victim.color, playerConfig, onlineState)} back to the yard`
        );
      }

      if (result.finished) events.push(`${mover} brought a token home`);

      if (result.won) {
        m.status = "over";
        m.dice = null;
        m.message = `${getPlayerName(result.state.winner, playerConfig, onlineState)} has all four tokens home.`;
        publish();
        if (onlineState?.room) onlineState.syncGameState(m);
        return;
      }

      if (earnsExtraTurn({ dice, captured: result.captured, finished: result.finished })) {
        events.push("roll again");
        m.message = `${events.join(" — ")}.`;
        m.status = "idle";
        m.dice = null;
        publish();
        if (onlineState?.room) onlineState.syncGameState(m);
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
    [advanceTurn, playerConfig, onlineState, isRoomHost, publish, sceneRef],
  );

  const roll = useCallback(async () => {
    const m = machine.current;
    const scene = sceneRef.current;

    if (!scene || m.status !== "idle" || m.state.winner) return;

    const activeColor = currentColor(m.state);
    const name = getPlayerName(activeColor, playerConfig, onlineState);

    m.status = "rolling";
    m.message = `${name} is rolling…`;
    publish();

    const value = await scene.rollDice(
      getFairRoll(activeColor, m.state.tokens),
    );

    // Broadcast roll to peers
    const isMyTurn = onlineState?.room && onlineState.myColor === activeColor;
    const isHostDrivingAI =
      onlineState?.room && isRoomHost && playerConfig.controllers[activeColor] === "computer";

    if (isMyTurn || isHostDrivingAI) {
      onlineState.sendRollDice(activeColor, value);
    }

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

    m.legalMoves = outcome.legalMoves;
    m.status = "choosing";
    scene.setHighlights(outcome.legalMoves);

    const isComputer = playerConfig.controllers[activeColor] === "computer";
    m.message =
      outcome.kind === "forced"
        ? `${name} rolled ${value} — forced move.`
        : `${name} rolled ${value} — ${isComputer ? "AI thinking..." : "pick a token."}`;

    publish();

    // Forced single move for Human (only run locally if active player)
    if (outcome.kind === "forced" && !isComputer && (!onlineState?.room || isMyTurn)) {
      await wait(FORCED_MOVE_PAUSE);
      if (alive.current && machine.current.status === "choosing") {
        play(outcome.legalMoves[0]);
      }
    }
  }, [advanceTurn, play, playerConfig, isRoomHost, publish, sceneRef, onlineState]);

  const restart = useCallback(() => {
    const m = machine.current;

    m.state = createInitialState();
    m.status = "idle";
    m.dice = null;
    m.legalMoves = [];
    m.message = "Red to roll. A 6 brings a token out of the yard.";

    sceneRef.current?.resetTokens(m.state.tokens);
    sceneRef.current?.setTurnColor("red");
    sceneRef.current?.syncActiveControllers(playerConfig.controllers);

    publish();
    if (onlineState?.room) onlineState.syncGameState(m);
  }, [playerConfig.controllers, publish, sceneRef, onlineState]);

  const startNewMatch = useCallback(
    (newConfig) => {
      setPlayerConfig(newConfig);
      try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
      } catch (e) {
        console.error("Failed to save player config:", e);
      }

      const m = machine.current;
      m.state = createInitialState();

      // Find first active player
      const startColor = getNextActiveColor("blue", newConfig.controllers);
      m.state.currentPlayer = PLAYER_COLORS.indexOf(startColor);

      m.status = "idle";
      m.dice = null;
      m.legalMoves = [];

      const isComputer = newConfig.controllers[startColor] === "computer";
      const startName = getPlayerName(startColor, newConfig, onlineState);
      m.message = `${startName}${isComputer ? " (AI)" : ""} to roll.`;

      sceneRef.current?.resetTokens(m.state.tokens);
      sceneRef.current?.setTurnColor(startColor);
      sceneRef.current?.syncActiveControllers(newConfig.controllers);

      publish();
      if (onlineState?.room) onlineState.syncGameState(m);
    },
    [onlineState, publish, sceneRef],
  );

  /* Automated Computer AI Turn Loop */
  useEffect(() => {
    if (!ready || view.state.winner) return undefined;

    const activeColor = currentColor(view.state);
    const controllerType = playerConfig.controllers[activeColor];

    if (controllerType !== "computer") return undefined;

    // In online rooms, only the host calculates and executes AI moves to prevent conflicts
    if (onlineState?.room && !isRoomHost) return undefined;

    let timer;

    if (view.status === "idle") {
      timer = setTimeout(() => {
        if (alive.current && machine.current.status === "idle") {
          roll();
        }
      }, 750);
    } else if (view.status === "choosing" && view.legalMoves.length > 0) {
      timer = setTimeout(() => {
        if (alive.current && machine.current.status === "choosing") {
          const candidates = machine.current.legalMoves.map((tokenId) => {
            const result = applyMove(
              machine.current.state,
              tokenId,
              machine.current.dice,
            );
            return {
              tokenId,
              from: tokenById(machine.current.state, tokenId)?.position,
              to: result.to,
              entered: result.entered,
              finished: result.finished,
              captured: result.captured,
            };
          });

          const chosen = chooseBestMove(
            machine.current.state,
            candidates,
            playerConfig.difficulty,
          );

          if (chosen) {
            play(chosen.tokenId);
          }
        }
      }, 650);
    }

    return () => clearTimeout(timer);
  }, [
    view.status,
    view.state,
    view.legalMoves,
    playerConfig,
    ready,
    isRoomHost,
    onlineState?.room,
    roll,
    play,
  ]);

  const rollRemote = useCallback(
    async (presetValue) => {
      const m = machine.current;
      const scene = sceneRef.current;
      if (!scene || m.status !== "idle" || m.state.winner) return;

      const activeColor = currentColor(m.state);
      const name = getPlayerName(activeColor, playerConfig, onlineState);

      m.status = "rolling";
      m.message = `${name} is rolling…`;
      publish();

      const value = await scene.rollDice(presetValue);

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

      m.legalMoves = outcome.legalMoves;
      m.status = "choosing";
      scene.setHighlights(outcome.legalMoves);

      m.message = `${name} rolled ${value} — choosing piece...`;
      publish();

      // If remote move arrived while rolling was animating, apply immediately
      if (pendingRemoteMoveRef.current) {
        const moveId = pendingRemoteMoveRef.current;
        pendingRemoteMoveRef.current = null;
        play(moveId);
      }
    },
    [advanceTurn, play, playerConfig, onlineState, publish, sceneRef],
  );

  /* Listen to remote WebSocket events */
  useEffect(() => {
    if (!onlineState?.socket) return undefined;
    const socket = onlineState.socket;

    const handleRemoteRoll = ({ color, value }) => {
      if (onlineState.room && onlineState.myColor !== color) {
        rollRemote(value);
      }
    };

    const handleRemoteMove = ({ tokenId, color }) => {
      if (onlineState.room && onlineState.myColor !== color) {
        if (machine.current.status === "choosing") {
          play(tokenId);
        } else {
          pendingRemoteMoveRef.current = tokenId;
        }
      }
    };

    const handleRemoteStateSync = (syncedSnapshot) => {
      if (syncedSnapshot && syncedSnapshot.state) {
        machine.current = { ...syncedSnapshot };
        sceneRef.current?.syncPlacements(syncedSnapshot.state.tokens, false);
        sceneRef.current?.setTurnColor(currentColor(syncedSnapshot.state));
        publish();
      }
    };

    socket.on("remote_roll_dice", handleRemoteRoll);
    socket.on("remote_move_token", handleRemoteMove);
    socket.on("remote_state_sync", handleRemoteStateSync);

    return () => {
      socket.off("remote_roll_dice", handleRemoteRoll);
      socket.off("remote_move_token", handleRemoteMove);
      socket.off("remote_state_sync", handleRemoteStateSync);
    };
  }, [onlineState, rollRemote, play, publish, sceneRef]);

  /* Wire board input */
  useEffect(() => {
    const scene = sceneRef.current;
    if (!ready || !scene) return undefined;

    scene.onDiceClick(() => {
      const activeColor = currentColor(machine.current.state);
      if (onlineState?.room) {
        if (onlineState.myColor === activeColor) roll();
      } else if (playerConfig.controllers[activeColor] === "human") {
        roll();
      }
    });

    scene.onTokenClick((tokenId) => {
      const activeColor = currentColor(machine.current.state);
      if (onlineState?.room) {
        if (onlineState.myColor === activeColor) play(tokenId);
      } else if (playerConfig.controllers[activeColor] === "human") {
        play(tokenId);
      }
    });

    scene.setTurnColor(currentColor(machine.current.state));
    scene.syncPlacements(machine.current.state.tokens, false);
    scene.syncActiveControllers(playerConfig.controllers);

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
  }, [play, playerConfig, ready, roll, sceneRef, onlineState]);

  const activeColor = currentColor(view.state);
  const isCurrentHuman = onlineState?.room
    ? onlineState.myColor === activeColor
    : playerConfig.controllers[activeColor] === "human";

  return {
    ...view,
    playerConfig,
    canRoll: view.status === "idle" && !view.state.winner && isCurrentHuman,
    roll,
    play,
    restart,
    startNewMatch,
  };
}
