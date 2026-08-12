import { COLORS, labelFor } from "../game/constants.js";

import { currentColor } from "../game/rules.js";

export function TurnPanel({ state, dice, message, canRoll, onRoll }) {
  const color = state.winner ?? currentColor(state);

  return (
    <div className="panel turn-panel">
      <div className="turn-row">
        <span className="turn-dot" style={{ background: COLORS[color] }} />

        <span className="turn-name">
          {state.winner ? `${labelFor(state.winner)} wins` : labelFor(color)}
        </span>
      </div>

      <p className="turn-message">{message}</p>

      <button
        className="roll-button"
        type="button"
        onClick={onRoll}
        disabled={!canRoll}
      >
        Roll dice
      </button>

      <div className="dice-readout">{dice ? `Dice ${dice}` : "Dice —"}</div>
    </div>
  );
}
