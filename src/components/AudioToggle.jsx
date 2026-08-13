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
      className="icon-hud-btn"
      onClick={handleToggle}
      title={muted ? "Unmute Sound" : "Mute Sound"}
      aria-label={muted ? "Unmute Sound" : "Mute Sound"}
    >
      {muted ? <VolumeOffIcon size={16} /> : <VolumeHighIcon size={16} />}
    </button>
  );
}
