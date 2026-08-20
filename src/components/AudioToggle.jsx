import { useState } from "react";
import { VolumeHighIcon, VolumeOffIcon } from "hugeicons-react";
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
      className="icon-hud-btn sfx-hud-btn"
      onClick={handleToggle}
      title={muted ? "Unmute Game SFX" : "Mute Game SFX"}
      aria-label={muted ? "Unmute Game SFX" : "Mute Game SFX"}
    >
      {muted ? <VolumeOffIcon size={18} /> : <VolumeHighIcon size={18} />}
      <span className="hud-btn-text">SFX</span>
    </button>
  );
}
