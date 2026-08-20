import { useEffect, useRef, useState } from "react";
import { ArrowDown01Icon, Sun02Icon } from "hugeicons-react";
import { playClick } from "../game/audio.js";
import {
  TIME_OF_DAY_PRESETS,
  getSelectedTimeOfDay,
  saveSelectedTimeOfDay,
} from "../scene/weatherManager.js";

export function TimeOfDayDropdown({ sceneRef }) {
  const [activeTime, setActiveTime] = useState(getSelectedTimeOfDay);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectTime = (timeId) => {
    playClick();
    setActiveTime(timeId);
    setIsOpen(false);
    saveSelectedTimeOfDay(timeId);
    sceneRef.current?.setTimeOfDay(timeId);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentPreset =
    TIME_OF_DAY_PRESETS.find((t) => t.id === activeTime) || TIME_OF_DAY_PRESETS[0];

  return (
    <div className="camera-dropdown-container time-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className={`icon-hud-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`Time of Day: ${currentPreset.name}`}
      >
        <span style={{ fontSize: "17px", lineHeight: 1 }}>
          {currentPreset.emoji}
        </span>
        <span className="hud-btn-text">{currentPreset.badge}</span>
        <ArrowDown01Icon
          size={14}
          className={`dropdown-arrow ${isOpen ? "open" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="camera-dropdown-menu time-dropdown-menu">
          {TIME_OF_DAY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`camera-dropdown-item ${activeTime === preset.id ? "active" : ""}`}
              onClick={() => selectTime(preset.id)}
            >
              <span className="dropdown-item-icon">{preset.emoji}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
