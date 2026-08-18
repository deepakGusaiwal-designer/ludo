import { useState } from "react";
import {
  Brain01Icon,
  Cancel01Icon,
  DiceFaces06Icon,
  GameController01Icon,
} from "hugeicons-react";
import { PLAYER_COLORS, labelFor } from "../game/constants.js";
import { GsapRadio, GsapSelect } from "./GsapFormControls.jsx";
import { useModalPhysics } from "../hooks/useModalPhysics.js";

const CONTROLLER_OPTIONS = [
  { value: "human", label: "👤 Human Player" },
  { value: "computer", label: "🤖 Computer (AI)" },
  { value: "off", label: "❌ Disabled (Off)" },
];

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
  const modalRef = useModalPhysics();
  const [selectedPreset, setSelectedPreset] = useState("vs_bots");
  const [difficulty, setDifficulty] = useState(
    currentConfig?.difficulty || "smart",
  );
  const [controllers, setControllers] = useState(
    currentConfig?.controllers || PRESETS[0].config.controllers,
  );
  const [names, setNames] = useState(
    currentConfig?.names || {
      red: "Red",
      green: "Green",
      yellow: "Yellow",
      blue: "Blue",
    },
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

  const handleNameChange = (color, value) => {
    setNames((prev) => ({ ...prev, [color]: value }));
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
      names,
      activeCount,
    });
  };

  return (
    <div className="glass-modal-overlay">
      <div className="glass-modal-card lobby-card" ref={modalRef}>
        {onCancel && (
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onCancel}
            title="Close setup"
          >
            <Cancel01Icon size={16} />
          </button>
        )}
        <div className="glass-modal-icon">
          <GameController01Icon size={38} color="#f2b544" />
        </div>
        <h2 className="glass-modal-title">Game Setup & Players</h2>
        <p className="glass-modal-desc">
          Choose your game mode, player names, and computer bot difficulty:
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
          <div className="lobby-section-header">
            <h4 className="lobby-section-title">Color Controller & Name Setup</h4>
            <span className="lobby-section-hint">Customize player names & control types</span>
          </div>
          <div className="lobby-color-list">
            {PLAYER_COLORS.map((color) => {
              const isDisabled = controllers[color] === "off";
              return (
                <div
                  key={color}
                  className={`lobby-player-card ${color} ${isDisabled ? "is-disabled" : ""}`}
                >
                  <div className="lobby-player-header">
                    <div className={`lobby-color-badge ${color}`}>
                      <span className="badge-dot" />
                      <span className="badge-name">{labelFor(color)}</span>
                    </div>
                    <span className="lobby-status-label">
                      {isDisabled ? "Disabled" : controllers[color] === "computer" ? "🤖 AI Bot" : "👤 Human"}
                    </span>
                  </div>

                  <div className="lobby-player-inputs">
                    <div className="lobby-input-wrapper">
                      <input
                        type="text"
                        className="lobby-name-input"
                        placeholder={`${labelFor(color)} Name`}
                        value={names[color] || ""}
                        onChange={(e) => handleNameChange(color, e.target.value)}
                        disabled={isDisabled}
                      />
                    </div>
                    <div className="lobby-select-wrapper">
                      <GsapSelect
                        value={controllers[color] || "human"}
                        onChange={(val) => handleControllerChange(color, val)}
                        options={CONTROLLER_OPTIONS}
                        className="lobby-select-gsap"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
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
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <Brain01Icon size={14} /> Smart Strategy
              </span>
            </GsapRadio>
            <GsapRadio
              name="difficulty"
              value="easy"
              checked={difficulty === "easy"}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <DiceFaces06Icon size={14} /> Casual Easy
              </span>
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
