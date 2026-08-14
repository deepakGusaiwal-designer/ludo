import { useEffect, useRef, useState } from "react";
import { ArrowDown01Icon, Camera01Icon } from "hugeicons-react";
import { playClick } from "../game/audio.js";

const CAMERA_ANGLES = [
  { id: "3d", label: "3D Perspective", icon: "🌐" },
  { id: "2d", label: "2D Flat Board (Ultra Light)", icon: "🎯" },
  { id: "close", label: "Closest Board View", icon: "🔍" },
  { id: "top", label: "Top Overhead View", icon: "⬇️" },
  { id: "red", label: "Red Corner", icon: "🔴" },
  { id: "green", label: "Green Corner", icon: "🟢" },
  { id: "yellow", label: "Yellow Corner", icon: "🟡" },
  { id: "blue", label: "Blue Corner", icon: "🔵" },
];

export function CameraControls({ sceneRef }) {
  const [activeAngle, setActiveAngle] = useState("3d");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectAngle = (mode) => {
    playClick();
    setActiveAngle(mode);
    setIsOpen(false);
    sceneRef.current?.setCameraAngle(mode);
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

  const activeLabel =
    CAMERA_ANGLES.find((a) => a.id === activeAngle)?.label || "Camera";

  return (
    <div className="camera-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className={`icon-hud-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`Camera View: ${activeLabel}`}
      >
        <Camera01Icon className="hud-icon" size={16} />
        <span className="hud-btn-text">{activeAngle.toUpperCase()}</span>
        <ArrowDown01Icon
          size={14}
          className={`dropdown-arrow ${isOpen ? "open" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="camera-dropdown-menu">
          {CAMERA_ANGLES.map((angle) => (
            <button
              key={angle.id}
              type="button"
              className={`camera-dropdown-item ${activeAngle === angle.id ? "active" : ""}`}
              onClick={() => selectAngle(angle.id)}
            >
              <span className="dropdown-item-icon">{angle.icon}</span>
              <span>{angle.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
