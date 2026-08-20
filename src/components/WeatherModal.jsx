import { useState } from "react";
import {
  Cancel01Icon,
  CloudAngledRainZapIcon,
  Tick02Icon,
} from "hugeicons-react";
import {
  WEATHER_PRESETS,
  getSelectedWeather,
  saveSelectedWeather,
} from "../scene/weatherManager.js";
import { useModalPhysics } from "../hooks/useModalPhysics.js";
import { ShinyButton } from "./reactbits/ShinyButton.jsx";

export function WeatherModal({ isOpen, sceneRef, onCancel }) {
  const modalRef = useModalPhysics();
  const [selectedWeather, setSelectedWeather] = useState(getSelectedWeather);

  if (!isOpen) return null;

  const handleSelect = (weatherId) => {
    setSelectedWeather(weatherId);
    saveSelectedWeather(weatherId);
    sceneRef.current?.setWeather(weatherId);
  };

  return (
    <div className="glass-modal-overlay">
      <div className="glass-modal-card weather-modal-card" ref={modalRef}>
        {onCancel && (
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onCancel}
            title="Close"
          >
            <Cancel01Icon size={16} />
          </button>
        )}

        <div className="glass-modal-header">
          <div className="glass-modal-icon-badge weather-icon-badge">
            <CloudAngledRainZapIcon size={24} color="#38bdf8" />
          </div>
          <div>
            <h3 className="glass-modal-title">Environment Mode</h3>
            <p className="glass-modal-subtitle">
              Choose dynamic environment realm and weather atmosphere
            </p>
          </div>
        </div>

        <div className="character-grid weather-grid">
          {WEATHER_PRESETS.map((weather) => {
            const isSelected = selectedWeather === weather.id;
            return (
              <button
                key={weather.id}
                type="button"
                className={`character-card-btn weather-card-btn ${isSelected ? "active" : ""}`}
                onClick={() => handleSelect(weather.id)}
              >
                <div className="character-card-top">
                  <span className="character-emoji">{weather.emoji}</span>
                  {weather.badge && (
                    <span className={`character-badge weather-badge ${weather.id}`}>
                      {weather.badge}
                    </span>
                  )}
                </div>

                <div className="character-card-info">
                  <div className="character-name">
                    <span>{weather.name}</span>
                    {isSelected && (
                      <span className="character-check">
                        <Tick02Icon size={16} />
                      </span>
                    )}
                  </div>
                  <div className="character-desc">{weather.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="glass-modal-actions">
          <ShinyButton variant="primary" onClick={onCancel}>
            ✓ Done
          </ShinyButton>
        </div>
      </div>
    </div>
  );
}
