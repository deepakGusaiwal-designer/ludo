import { useEffect } from "react";
import { CrownIcon } from "hugeicons-react";
import { labelFor } from "../game/constants.js";
import { celebration } from "../utils/celebrationEffects.js";

export function WinOverlay({ winner, onRestart }) {
  useEffect(() => {
    if (winner) {
      celebration.startVictoryCelebration(winner);
    }
    return () => {
      celebration.stopVictoryCelebration();
    };
  }, [winner]);

  if (!winner) return null;

  const handleRestart = () => {
    celebration.stopVictoryCelebration();
    onRestart?.();
  };

  return (
    <div className="overlay">
      <div className="overlay-card">
        <CrownIcon size={48} color="#fbbf24" style={{ marginBottom: "12px" }} />
        <h2 className="overlay-title">{labelFor(winner)} wins</h2>

        <p className="overlay-subtitle">All four tokens are home.</p>

        <button className="roll-button" type="button" onClick={handleRestart}>
          Play again
        </button>
      </div>
    </div>
  );
}
