import { useCallback, useRef, useState } from "react";
import { CpuIcon, Globe02Icon, RefreshIcon, Settings02Icon, UserIcon } from "hugeicons-react";

import { useLudoGame } from "../hooks/useLudoGame.js";
import { useLudoScene } from "../hooks/useLudoScene.js";
import { useOnlineLudo } from "../hooks/useOnlineLudo.js";

import { AudioToggle } from "./AudioToggle.jsx";
import { CameraControls } from "./CameraControls.jsx";
import { CharacterModal } from "./CharacterModal.jsx";
import { LobbyModal } from "./LobbyModal.jsx";
import { OnlineLobbyModal } from "./OnlineLobbyModal.jsx";
import { Preloader } from "./Preloader.jsx";
import { QualityModal } from "./QualityModal.jsx";
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
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [roomCopied, setRoomCopied] = useState(false);

  const onlineState = useOnlineLudo();

  const { sceneRef, ready } = useLudoScene(containerRef);

  const {
    state,
    dice,
    message,
    canRoll,
    playerConfig,
    roll,
    restart,
    startNewMatch,
  } = useLudoGame(sceneRef, ready, onlineState);

  const handleCopyRoomCode = () => {
    if (onlineState?.room?.code) {
      navigator.clipboard.writeText(onlineState.room.code);
      setRoomCopied(true);
      setTimeout(() => setRoomCopied(false), 2000);
    }
  };

  const handleConfirmReset = () => {
    setIsResetModalOpen(false);
    restart();
  };

  const handleStartMatch = useCallback(
    (newConfig) => {
      setIsLobbyOpen(false);
      startNewMatch(newConfig);
    },
    [startNewMatch],
  );

  const handleStartOnlineMatch = useCallback(
    (roomConfig) => {
      setIsOnlineModalOpen(false);
      startNewMatch({
        difficulty: roomConfig.difficulty || "smart",
        controllers: roomConfig.controllers,
        activeCount: roomConfig.players.length,
      });
    },
    [startNewMatch],
  );

  return (
    <div className="ludo">
      <Preloader isReady={ready} />
      <div className="canvas-host" ref={containerRef} />

      <header className="hud">
        <div className="hud-brand">
          <img src="/logo.png" alt="Ludo Logo" className="hud-logo" />
          {/* <div className="hud-title">Forest Ludo</div> */}
          {onlineState.room && (
            <div className="online-room-badge">
              Room: <strong>{onlineState.room.code}</strong>
            </div>
          )}
        </div>

        <div className="hud-actions">
          <button
            type="button"
            className="icon-hud-btn online-hud-btn"
            onClick={() => setIsOnlineModalOpen(true)}
            title="Play Online with Friends"
          >
            <Globe02Icon size={16} />
            <span className="hud-btn-text">Online</span>
          </button>
          <button
            type="button"
            className="icon-hud-btn lobby-btn"
            onClick={() => setIsLobbyOpen(true)}
            title="Change Player & AI Settings"
          >
            <Settings02Icon size={16} />
            <span className="hud-btn-text">Setup</span>
          </button>
          <button
            type="button"
            className="icon-hud-btn reset-game-btn"
            onClick={() => setIsResetModalOpen(true)}
            title="Reset game state"
          >
            <RefreshIcon size={16} />
          </button>
        </div>
      </header>

      {/* Floating Bottom-Left Controls: Camera & Audio */}
      <div className="hud-corner-left">
        <CameraControls sceneRef={sceneRef} />
        <AudioToggle />
      </div>

      {/* Floating Bottom-Right Controls: Hero Pawn, Graphics & Room Badge */}
      <div className="hud-corner-right">
        {onlineState.room && (
          <div
            className={`bottom-right-room-badge ${roomCopied ? "copied" : ""}`}
            onClick={handleCopyRoomCode}
            title="Click to copy Room Code"
          >
            <Globe02Icon size={13} color="#38bdf8" />
            <span className="badge-room-label">ROOM:</span>
            <span className="badge-room-code">{onlineState.room.code}</span>
            {roomCopied && <span className="badge-copied-toast">Copied!</span>}
          </div>
        )}
        <button
          type="button"
          className="icon-hud-btn hero-hud-btn"
          onClick={() => setIsCharacterModalOpen(true)}
          title="Choose 3D Pawn Character"
        >
          <UserIcon size={16} />
          <span className="hud-btn-text">Hero</span>
        </button>
        <button
          type="button"
          className="icon-hud-btn graphics-hud-btn"
          onClick={() => setIsQualityModalOpen(true)}
          title="3D Graphics Performance Settings"
        >
          <CpuIcon size={16} />
          <span className="hud-btn-text">Graphics</span>
        </button>
      </div>

      {/* <Scoreboard state={state} playerConfig={playerConfig} onlineState={onlineState} /> */}

      <TurnPanel
        state={state}
        dice={dice}
        message={message}
        canRoll={canRoll}
        onRoll={roll}
        playerConfig={playerConfig}
        onlineState={onlineState}
      />

      <WinOverlay winner={state.winner} onRestart={restart} />

      <ResetModal
        isOpen={isResetModalOpen}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />

      <CharacterModal
        isOpen={isCharacterModalOpen}
        sceneRef={sceneRef}
        onCancel={() => setIsCharacterModalOpen(false)}
      />

      <LobbyModal
        isOpen={isLobbyOpen}
        currentConfig={playerConfig}
        onStartMatch={handleStartMatch}
        onCancel={() => setIsLobbyOpen(false)}
      />

      <OnlineLobbyModal
        isOpen={isOnlineModalOpen}
        onlineState={onlineState}
        onStartMatch={handleStartOnlineMatch}
        onCancel={() => setIsOnlineModalOpen(false)}
      />

      <QualityModal
        isOpen={isQualityModalOpen}
        onClose={() => setIsQualityModalOpen(false)}
        sceneRef={sceneRef}
      />
    </div>
  );
}
