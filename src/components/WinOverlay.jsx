import { labelFor } from "../game/constants.js";

export function WinOverlay({ winner, onRestart }) {
  if (!winner) return null;

  return (
    <div className="overlay">
      <div className="overlay-card">
        <h2 className="overlay-title">{labelFor(winner)} wins</h2>

        <p className="overlay-subtitle">All four tokens are home.</p>

        <button className="roll-button" type="button" onClick={onRestart}>
          Play again
        </button>
      </div>
    </div>
  );
}
