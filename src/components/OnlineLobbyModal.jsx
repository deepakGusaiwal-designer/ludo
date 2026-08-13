import { useEffect, useRef, useState } from "react";
import { PLAYER_COLORS, labelFor } from "../game/constants.js";
import { GsapRadio } from "./GsapFormControls.jsx";

export function OnlineLobbyModal({
  isOpen,
  onlineState,
  onStartMatch,
  onCancel,
}) {
  const [tab, setTab] = useState("mode"); // "mode" | "create" | "join" | "room"
  const [playerName, setPlayerName] = useState("Player 1");
  const [matchMode, setMatchMode] = useState("1v1"); // "1v1" | "4p"
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const launchedRef = useRef(false);

  const {
    isConnected,
    room,
    myColor,
    error,
    createRoom,
    joinRoom,
    startOnlineMatch,
    leaveRoom,
  } = onlineState;

  // Auto-launch match for all connected clients when host launches
  useEffect(() => {
    if (room?.started && !launchedRef.current) {
      launchedRef.current = true;
      onStartMatch(room);
    } else if (!room?.started) {
      launchedRef.current = false;
    }
  }, [room, onStartMatch]);

  if (!isOpen) return null;

  const handleCreate = async (modeToUse = matchMode) => {
    const ok = await createRoom(playerName, modeToUse);
    if (ok) setTab("room");
  };

  const handleJoin = async () => {
    if (!joinCode) return;
    const ok = await joinRoom(joinCode, playerName);
    if (ok) setTab("room");
  };

  const handleCopyCode = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = () => {
    startOnlineMatch();
    onStartMatch(room);
  };

  return (
    <div className="glass-modal-overlay">
      <div className="glass-modal-card lobby-card online-lobby-card">
        {onCancel && (
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onCancel}
            title="Close online lobby"
          >
            ✕
          </button>
        )}
        <div className="glass-modal-icon">🌐</div>
        <h2 className="glass-modal-title">Online Realtime Multiplayer</h2>
        <p className="glass-modal-desc">
          Play with friends across different PCs and physical locations:
        </p>

        {/* Server Connection Status */}
        <div className="online-status-bar">
          <span className={`status-dot ${isConnected ? "online" : "offline"}`} />
          <span>{isConnected ? "Connected to Server" : "Connecting to Server..."}</span>
        </div>

        {error && <div className="online-error-alert">⚠️ {error}</div>}

        {/* Mode Selector */}
        {!room && tab === "mode" && (
          <div className="lobby-preset-grid">
            <button
              type="button"
              className="lobby-preset-btn"
              onClick={() => setTab("create")}
            >
              <div className="lobby-preset-title">➕ Create Online Room</div>
              <div className="lobby-preset-desc">Host a room and invite friends via Room Code</div>
            </button>

            <button
              type="button"
              className="lobby-preset-btn"
              onClick={() => setTab("join")}
            >
              <div className="lobby-preset-title">🔑 Join Friend's Room</div>
              <div className="lobby-preset-desc">Enter a Room Code to join an existing match</div>
            </button>
          </div>
        )}

        {/* Create Room Tab */}
        {!room && tab === "create" && (
          <div className="online-form">
            <div className="form-group">
              <label className="lobby-section-title">Your Player Name:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="online-input"
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label className="lobby-section-title">Match Mode:</label>
              <div className="lobby-radio-group" style={{ marginTop: "6px" }}>
                <GsapRadio
                  name="matchMode"
                  value="1v1"
                  checked={matchMode === "1v1"}
                  onChange={(e) => setMatchMode(e.target.value)}
                >
                  ⚔️ 1v1 Match (2 Players)
                </GsapRadio>
                <GsapRadio
                  name="matchMode"
                  value="4p"
                  checked={matchMode === "4p"}
                  onChange={(e) => setMatchMode(e.target.value)}
                >
                  👥 4 Players Battle
                </GsapRadio>
              </div>
            </div>

            <div className="glass-modal-actions">
              <button
                type="button"
                className="glass-btn glass-btn-secondary"
                onClick={() => setTab("mode")}
              >
                Back
              </button>
              <button
                type="button"
                className="glass-btn glass-btn-primary"
                onClick={() => handleCreate(matchMode)}
                disabled={!isConnected}
              >
                Create Room
              </button>
            </div>
          </div>
        )}

        {/* Join Room Tab */}
        {!room && tab === "join" && (
          <div className="online-form">
            <div className="form-group">
              <label className="lobby-section-title">Your Player Name:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="online-input"
                placeholder="Enter your name"
              />
            </div>
            <div className="form-group">
              <label className="lobby-section-title">Enter 5-Character Room Code:</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="online-input code-input"
                placeholder="e.g. LUDO-8K92P"
              />
            </div>
            <div className="glass-modal-actions">
              <button
                type="button"
                className="glass-btn glass-btn-secondary"
                onClick={() => setTab("mode")}
              >
                Back
              </button>
              <button
                type="button"
                className="glass-btn glass-btn-primary"
                onClick={handleJoin}
                disabled={!isConnected || !joinCode}
              >
                Join Room
              </button>
            </div>
          </div>
        )}

        {/* Room Lobby View */}
        {room && (
          <div className="online-room-view">
            {/* Room Code Badge */}
            <div className="room-code-card">
              <div className="code-label">SHARE THIS ROOM CODE WITH FRIENDS:</div>
              <div className="code-display-row">
                <span className="code-text">{room.code}</span>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={handleCopyCode}
                >
                  {copied ? "✓ Copied!" : "📋 Copy Code"}
                </button>
              </div>
            </div>

            {/* Connected Players List */}
            <div className="lobby-color-settings">
              <h4 className="lobby-section-title">
                Connected Players ({room.players.length}/4):
              </h4>
              <div className="lobby-color-grid">
                {PLAYER_COLORS.map((color) => {
                  const player = room.players.find((p) => p.color === color);
                  const isMe = color === myColor;
                  return (
                    <div key={color} className="lobby-color-row">
                      <div className={`lobby-color-badge ${color}`}>
                        {labelFor(color)}
                      </div>
                      <span className="player-name-span">
                        {player
                          ? `${player.name} ${player.isHost ? "👑" : ""} ${isMe ? "(You)" : ""}`
                          : "🤖 Computer AI"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Room Actions */}
            <div className="glass-modal-actions">
              <button
                type="button"
                className="glass-btn glass-btn-secondary"
                onClick={leaveRoom}
              >
                Leave Room
              </button>
              {room.players.find((p) => p.socketId === onlineState.socket?.id)?.isHost && (
                <button
                  type="button"
                  className="glass-btn glass-btn-primary"
                  onClick={handleStartGame}
                >
                  🚀 Launch Match
                </button>
              )}
            </div>
          </div>
        )}

        {/* Global Cancel */}
        {!room && onCancel && (
          <div className="glass-modal-actions" style={{ marginTop: "14px" }}>
            <button
              type="button"
              className="glass-btn glass-btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
