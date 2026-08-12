import { useRef, useState } from "react";

import { useLudoGame } from "../hooks/useLudoGame.js";
import { useLudoScene } from "../hooks/useLudoScene.js";

import { AudioToggle } from "./AudioToggle.jsx";
import { CameraControls } from "./CameraControls.jsx";
import { ResetModal } from "./ResetModal.jsx";
import { Scoreboard } from "./Scoreboard.jsx";
import { TurnPanel } from "./TurnPanel.jsx";
import { WinOverlay } from "./WinOverlay.jsx";

/**
 * Ties the three layers together: a container the scene draws
 * into, the turn machine, and the HUD that reads from it.
 */
export function LudoGame() {
  const containerRef = useRef(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const { sceneRef, ready } = useLudoScene(containerRef);

  const { state, dice, message, canRoll, roll, restart } = useLudoGame(
    sceneRef,
    ready,
  );

  const handleConfirmReset = () => {
    setIsResetModalOpen(false);
    restart();
  };

  return (
    <div className="ludo">
      <div className="canvas-host" ref={containerRef} />

      <header className="hud">
        <div>
          <div className="hud-title">Forest Ludo</div>
          <div className="hud-subtitle">Rainy Forest Board</div>
        </div>
        <CameraControls sceneRef={sceneRef} />
        <AudioToggle />
        <button
          type="button"
          className="reset-game-btn"
          onClick={() => setIsResetModalOpen(true)}
          title="Reset game state"
        >
          🔄 Reset Game
        </button>
      </header>

      <Scoreboard state={state} />

      <TurnPanel
        state={state}
        dice={dice}
        message={message}
        canRoll={canRoll}
        onRoll={roll}
      />

      <WinOverlay winner={state.winner} onRestart={restart} />

      <ResetModal
        isOpen={isResetModalOpen}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}
