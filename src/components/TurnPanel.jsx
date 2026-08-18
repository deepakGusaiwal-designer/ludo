import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getPlayerName } from "../game/constants.js";
import { currentColor } from "../game/rules.js";

function formatPossessiveTurn(name) {
  if (!name || !name.trim()) return "Turn";
  const trimmed = name.trim();
  if (trimmed.endsWith("s") || trimmed.endsWith("S")) {
    return `${trimmed}' Turn`;
  }
  return `${trimmed}'s Turn`;
}

export function TurnPanel({ state, playerConfig, onlineState }) {
  const activeColor = state.winner ?? currentColor(state);
  const isWinner = Boolean(state.winner);
  const controller = playerConfig?.controllers?.[activeColor] || "human";

  const activePlayerName = getPlayerName(activeColor, playerConfig, onlineState);
  const winnerName = isWinner ? getPlayerName(state.winner, playerConfig, onlineState) : "";

  const prevTurnKey = useRef(null);

  useEffect(() => {
    if (isWinner) {
      toast.success(`👑 ${winnerName.toUpperCase()} WINS!`, {
        id: "game-winner-toast",
        duration: 4000,
      });
      return;
    }

    const turnKey = `${activeColor}-${state.currentPlayer}`;
    if (prevTurnKey.current !== turnKey) {
      prevTurnKey.current = turnKey;

      const colorEmoji =
        activeColor === "red"
          ? "🔴"
          : activeColor === "green"
            ? "🟢"
            : activeColor === "yellow"
              ? "🟡"
              : "🔵";

      const typeBadge = controller === "computer" ? " 🤖" : "";
      const turnText = formatPossessiveTurn(activePlayerName);

      toast(`${colorEmoji} ${turnText}${typeBadge}`, {
        id: "turn-toast",
        duration: 2000,
      });
    }
  }, [state.currentPlayer, activeColor, activePlayerName, controller, isWinner, winnerName]);

  return null;
}
