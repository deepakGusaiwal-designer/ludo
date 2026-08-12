import { useState } from "react";
import { getMuted, playClick, toggleMuted } from "../game/audio.js";

export function AudioToggle() {
  const [muted, setMutedState] = useState(() => getMuted());

  const handleToggle = () => {
    const next = toggleMuted();
    setMutedState(next);
    if (!next) playClick();
  };

  return (
    <button
      type="button"
      className="audio-toggle-btn"
      onClick={handleToggle}
      title={muted ? "Unmute sound effects" : "Mute sound effects"}
      aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
    >
      {muted ? "🔇 Sound Off" : "🔊 Sound On"}
    </button>
  );
}
