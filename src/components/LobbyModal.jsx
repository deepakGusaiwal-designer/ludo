import { useState } from "react";
import { PLAYER_COLORS, labelFor } from "../game/constants.js";
import { GsapRadio } from "./GsapFormControls.jsx";

const PRESETS = [
  {
    id: "pvp_1v1_ai",
    label: "⚔️ 1v1 Duel vs 🤖 AI Bot",
    desc: "Red (Human) vs Yellow (Computer AI) opposite corners",
    config: {
      activeCount: 2,
      controllers: {
        red: "human",
        green: "off",
        yellow: "computer",
        blue: "off",
      },
    },
  },
  {
    id: "pvp_2",
    label: "⚔️ 1v1 Match (2 Players)",
    desc: "Red vs Yellow local duel (Green & Blue disabled)",
    config: {
      activeCount: 2,
      controllers: {
        red: "human",
        green: "off",
        yellow: "human",
        blue: "off",
      },
    },
  },
  {
    id: "vs_bots",
    label: "👤 1 Player vs 🤖 3 Bots",
    desc: "Play solo as Red against 3 Computer AI opponents",
    config: {
      activeCount: 4,
      controllers: {
        red: "human",
        green: "computer",
        yellow: "computer",
        blue: "computer",
      },
    },
  },
  {
    id: "pvp_4",
    label: "👥 4 Players (Pass & Play)",
    desc: "All 4 colors controlled by Human players",
    config: {
      activeCount: 4,
      controllers: {
        red: "human",
        green: "human",
        yellow: "human",
        blue: "human",
      },
    },
  },
];

export function LobbyModal({ isOpen, currentConfig, onStartMatch, onCancel }) {
  const [selectedPreset, setSelectedPreset] = useState("vs_bots");
  const [difficulty, setDifficulty] = useState(
    currentConfig?.difficulty || "smart",
  );
  const [controllers, setControllers] = useState(
    currentConfig?.controllers || PRESETS[0].config.controllers,
  );

  if (!isOpen) return null;

  const handleApplyPreset = (preset) => {
    setSelectedPreset(preset.id);
    setControllers(preset.config.controllers);
  };

  const handleControllerChange = (color, type) => {
    setSelectedPreset("custom");
    setControllers((prev) => ({ ...prev, [color]: type }));
  };

  const handleStart = () => {
    const activeCount = Object.values(controllers).filter(
      (type) => type !== "off",
    ).length;

    if (activeCount < 2) {
      alert("Please enable at least 2 players to start a game!");
      return;
    }

    onStartMatch({
      difficulty,
      controllers,
      activeCount,
    });
  };

  return (
    <div className="glass-modal-overlay">
      <div className="glass-modal-card lobby-card">
        {onCancel && (
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onCancel}
            title="Close setup"
          >
            ✕
          </button>
        )}
        <div className="glass-modal-icon">🎮</div>
        <h2 className="glass-modal-title">Game Setup & Players</h2>
        <p className="glass-modal-desc">
          Choose your game mode, active players, and computer bot difficulty:
        </p>

        {/* Quick Presets */}
        <div className="lobby-preset-grid">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`lobby-preset-btn ${selectedPreset === preset.id ? "active" : ""}`}
              onClick={() => handleApplyPreset(preset)}
            >
              <div className="lobby-preset-title">{preset.label}</div>
              <div className="lobby-preset-desc">{preset.desc}</div>
            </button>
          ))}
        </div>

        {/* Custom Color Settings */}
        <div className="lobby-color-settings">
          <h4 className="lobby-section-title">Color Controller Setup</h4>
          <div className="lobby-color-grid">
            {PLAYER_COLORS.map((color) => (
              <div key={color} className="lobby-color-row">
                <div className={`lobby-color-badge ${color}`}>
                  {labelFor(color)}
                </div>
                <select
                  value={controllers[color] || "human"}
                  onChange={(e) => handleControllerChange(color, e.target.value)}
                  className="lobby-select"
                >
                  <option value="human">👤 Human</option>
                  <option value="computer">🤖 Computer (AI)</option>
                  <option value="off">❌ Disabled (Off)</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="lobby-difficulty-row">
          <label className="lobby-section-title">AI Difficulty:</label>
          <div className="lobby-radio-group">
            <GsapRadio
              name="difficulty"
              value="smart"
              checked={difficulty === "smart"}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              🧠 Smart Strategy
            </GsapRadio>
            <GsapRadio
              name="difficulty"
              value="easy"
              checked={difficulty === "easy"}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              🎲 Casual Easy
            </GsapRadio>
          </div>
        </div>

        {/* Actions */}
        <div className="glass-modal-actions">
          {onCancel && (
            <button
              type="button"
              className="glass-btn glass-btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            className="glass-btn glass-btn-primary"
            onClick={handleStart}
          >
            🚀 Start New Match
          </button>
        </div>
      </div>
    </div>
  );
}
