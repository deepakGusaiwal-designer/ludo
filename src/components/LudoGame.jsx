import { useCallback, useEffect, useRef, useState } from "react";
import {
  CloudAngledRainZapIcon,
  CpuIcon,
  Globe02Icon,
  RefreshIcon,
  Settings02Icon,
  UserIcon,
} from "hugeicons-react";
import { Toaster, toast } from "sonner";

import { useLudoGame } from "../hooks/useLudoGame.js";
import { useLudoScene } from "../hooks/useLudoScene.js";
import { useOnlineLudo } from "../hooks/useOnlineLudo.js";

import { AmbientToggle } from "./AmbientToggle.jsx";
import { AudioToggle } from "./AudioToggle.jsx";
import { CameraControls } from "./CameraControls.jsx";
import { CharacterModal } from "./CharacterModal.jsx";
import { LobbyModal } from "./LobbyModal.jsx";
import { OnlineLobbyModal } from "./OnlineLobbyModal.jsx";
import { Preloader } from "./Preloader.jsx";
import { QualityModal } from "./QualityModal.jsx";
import { ResetModal } from "./ResetModal.jsx";
import { TimeOfDayDropdown } from "./TimeOfDayDropdown.jsx";
import { TurnPanel } from "./TurnPanel.jsx";
import { WeatherModal } from "./WeatherModal.jsx";
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
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

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

  useEffect(() => {
    if (onlineState.notification) {
      toast.info(onlineState.notification, { duration: 2500 });
    }
  }, [onlineState.notification]);

  const handleCopyRoomCode = () => {
    if (onlineState?.room?.code) {
      navigator.clipboard.writeText(onlineState.room.code);
      toast.success(`Room Code ${onlineState.room.code} copied!`, { duration: 1500 });
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
      const namesObj = {};
      roomConfig.players?.forEach((p) => {
        if (p.color && p.name) namesObj[p.color] = p.name;
      });
      startNewMatch({
        difficulty: roomConfig.difficulty || "smart",
        controllers: roomConfig.controllers,
        names: namesObj,
        activeCount: roomConfig.players?.length || 2,
      });
    },
    [startNewMatch],
  );

  return (
    <div className="ludo">
      <Preloader isReady={ready} />
      <div className="canvas-host" ref={containerRef} />

      {/* Modern Sonner Toast Container (Compact, Subtle & Offset Below Header) */}
      <Toaster
        position="top-center"
        offset="68px"
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(10, 22, 17, 0.82)",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            color: "#f1f5f9",
            fontWeight: 700,
            fontSize: "12px",
            padding: "5px 14px",
            minHeight: "32px",
            width: "fit-content",
            borderRadius: "999px",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.35)",
            margin: "0 auto",
            letterSpacing: "0.01em",
          },
        }}
      />

      <header className="hud">
        <div className="hud-brand">
          <img src="/logo.png" alt="Ludo Logo" className="hud-logo" />
          {onlineState.room && (
            <div
              className="online-room-badge"
              onClick={handleCopyRoomCode}
              style={{ cursor: "pointer" }}
              title="Click to copy Room Code"
            >
              Room: <strong>{onlineState.room.code}</strong>
            </div>
          )}
        </div>

        <div className="hud-actions">
          <button
            type="button"
            className="icon-hud-btn weather-hud-btn"
            onClick={() => setIsWeatherModalOpen(true)}
            title="Environment & Realm Modes"
          >
            <CloudAngledRainZapIcon size={19} />
            <span className="hud-btn-text">Mode</span>
          </button>
          <button
            type="button"
            className="icon-hud-btn online-hud-btn"
            onClick={() => setIsOnlineModalOpen(true)}
            title="Play Online with Friends"
          >
            <Globe02Icon size={19} />
            <span className="hud-btn-text">Online</span>
          </button>
          <button
            type="button"
            className="icon-hud-btn lobby-btn"
            onClick={() => setIsLobbyOpen(true)}
            title="Change Player & AI Settings"
          >
            <Settings02Icon size={19} />
            <span className="hud-btn-text">Setup</span>
          </button>
          <button
            type="button"
            className="icon-hud-btn reset-game-btn"
            onClick={() => setIsResetModalOpen(true)}
            title="Reset game state"
          >
            <RefreshIcon size={19} />
          </button>
        </div>
      </header>

      {/* Floating Bottom-Left Controls: Camera, Time of Day, Ambient & SFX Audio */}
      <div className="hud-corner-left">
        <CameraControls sceneRef={sceneRef} />
        <TimeOfDayDropdown sceneRef={sceneRef} />
        <AmbientToggle />
        <AudioToggle />
      </div>

      {/* Floating Bottom-Right Controls: Hero Pawn & Graphics (Single Room Badge in Header Only) */}
      <div className="hud-corner-right">
        <button
          type="button"
          className="icon-hud-btn hero-hud-btn"
          onClick={() => setIsCharacterModalOpen(true)}
          title="Choose 3D Pawn Character"
        >
          <UserIcon size={18} />
          <span className="hud-btn-text">Hero</span>
        </button>
        <button
          type="button"
          className="icon-hud-btn graphics-hud-btn"
          onClick={() => setIsQualityModalOpen(true)}
          title="3D Graphics Performance Settings"
        >
          <CpuIcon size={18} />
          <span className="hud-btn-text">Graphics</span>
        </button>
      </div>

      <TurnPanel
        state={state}
        playerConfig={playerConfig}
        onlineState={onlineState}
      />

      <WinOverlay winner={state.winner} onRestart={restart} />

      <ResetModal
        isOpen={isResetModalOpen}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />

      <WeatherModal
        isOpen={isWeatherModalOpen}
        sceneRef={sceneRef}
        onCancel={() => setIsWeatherModalOpen(false)}
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
