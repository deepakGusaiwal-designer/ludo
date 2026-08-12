import { useState } from "react";
import { playClick } from "../game/audio.js";

/**
 * Camera View Selector HUD control letting players pick whatever angle
 * they want to see the board from (3D Perspective, Top 2D Overhead, or
 * Player Corner views).
 */
export function CameraControls({ sceneRef }) {
  const [activeAngle, setActiveAngle] = useState("3d");

  const selectAngle = (mode) => {
    playClick();
    setActiveAngle(mode);
    sceneRef.current?.setCameraAngle(mode);
  };

  return (
    <div className="camera-controls" title="Change Camera View Angle">
      <span className="camera-label">📷 View:</span>
      <button
        type="button"
        className={`cam-btn ${activeAngle === "3d" ? "active" : ""}`}
        onClick={() => selectAngle("3d")}
      >
        3D
      </button>
      <button
        type="button"
        className={`cam-btn ${activeAngle === "close" ? "active" : ""}`}
        onClick={() => selectAngle("close")}
      >
        Close
      </button>
      <button
        type="button"
        className={`cam-btn ${activeAngle === "top" ? "active" : ""}`}
        onClick={() => selectAngle("top")}
      >
        Top
      </button>
      <button
        type="button"
        className={`cam-btn ${activeAngle === "red" ? "active" : ""}`}
        onClick={() => selectAngle("red")}
      >
        Red
      </button>
      <button
        type="button"
        className={`cam-btn ${activeAngle === "green" ? "active" : ""}`}
        onClick={() => selectAngle("green")}
      >
        Green
      </button>
      <button
        type="button"
        className={`cam-btn ${activeAngle === "yellow" ? "active" : ""}`}
        onClick={() => selectAngle("yellow")}
      >
        Yellow
      </button>
      <button
        type="button"
        className={`cam-btn ${activeAngle === "blue" ? "active" : ""}`}
        onClick={() => selectAngle("blue")}
      >
        Blue
      </button>
    </div>
  );
}
