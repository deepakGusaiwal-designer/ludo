import { BotIcon, CrownIcon, DiceFaces06Icon, UserIcon } from "hugeicons-react";
import { COLORS, PLAYER_COLORS, getPlayerName, labelFor } from "../game/constants.js";
import { currentColor } from "../game/rules.js";

export function TurnPanel({ state, dice, message, canRoll, onRoll, playerConfig, onlineState }) {
  const color = state.winner ?? currentColor(state);
  const activeColor = state.winner ?? currentColor(state);
  const isWinner = Boolean(state.winner);
  const controller = playerConfig?.controllers?.[color] || "human";

  const activePlayerName = getPlayerName(activeColor, playerConfig, onlineState);
  const winnerName = isWinner ? getPlayerName(state.winner, playerConfig, onlineState) : "";

  return (
    <>
      {/* Prominent Top Player Turn Banner */}
      <div className={`top-turn-banner ${activeColor} ${isWinner ? "winner" : ""}`}>
        <div className="top-turn-pulse-dot" style={{ background: COLORS[activeColor] }} />
        <span className="top-turn-text">
          {isWinner ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <CrownIcon size={16} color="#fbbf24" /> {winnerName.toUpperCase()} WINS!
            </span>
          ) : (
            <>
              CURRENT TURN: <strong className="top-turn-color-name">{activePlayerName.toUpperCase()}</strong>
              <span className="top-turn-type" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                ({controller === "computer" ? <><BotIcon size={12} /> AI Bot</> : <><UserIcon size={12} /> Human</>})
              </span>
            </>
          )}
        </span>
      </div>

      {/* <div className={`panel turn-panel ${activeColor}-turn`}>
        <div className="turn-row">
          <span className="turn-dot pulsing" style={{ background: COLORS[color] }} />

          <span className="turn-name">
            {isWinner ? `${winnerName} wins` : `${activePlayerName}'s Turn`}
          </span>
        </div>

        <p className="turn-message">{message}</p>

        <button
          className={`roll-button ${canRoll ? "can-roll-pulse" : ""}`}
          type="button"
          onClick={onRoll}
          disabled={!canRoll}
        >
          {canRoll ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
              <DiceFaces06Icon size={16} /> Roll Dice Now
            </span>
          ) : (
            "Waiting..."
          )}
        </button>

        <div className="dice-readout">{dice ? `Dice ${dice}` : "Dice —"}</div>
      </div> */}
    </>
  );
}
