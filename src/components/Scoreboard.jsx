import { COLORS, PLAYERS, TOKENS_PER_PLAYER, getPlayerName, labelFor } from "../game/constants.js";

import { currentColor, tokensHome } from "../game/rules.js";

export function Scoreboard({ state, playerConfig, onlineState }) {
  const active = state.winner ? null : currentColor(state);

  return (
    <div className="panel scoreboard">
      {PLAYERS.map(({ color }) => (
        <div
          key={color}
          className={`score-row${color === active ? " active" : ""}`}
        >
          <span
            className="score-swatch"
            style={{ background: COLORS[color] }}
            aria-hidden="true"
          />

          <span className="score-name">{getPlayerName(color, playerConfig, onlineState)}</span>

          <span className="score-count">
            {tokensHome(state, color)}/{TOKENS_PER_PLAYER}
          </span>
        </div>
      ))}
    </div>
  );
}
