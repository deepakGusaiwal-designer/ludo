import { useState } from "react";
import { MusicNote03Icon, HeadphoneMuteIcon } from "hugeicons-react";
import { getAmbientMuted, playClick, toggleAmbientMuted } from "../game/audio.js";

export function AmbientToggle() {
  const [ambientMuted, setAmbientMutedState] = useState(() => getAmbientMuted());

  const handleToggle = () => {
    const next = toggleAmbientMuted();
    setAmbientMutedState(next);
    playClick();
  };

  return (
    <button
      type="button"
      className={`icon-hud-btn ambient-hud-btn ${ambientMuted ? "is-muted" : "active"}`}
      onClick={handleToggle}
      title={ambientMuted ? "Play Ambient Realm Sounds" : "Mute Ambient Realm Sounds"}
      aria-label={ambientMuted ? "Play Ambient Realm Sounds" : "Mute Ambient Realm Sounds"}
    >
      {ambientMuted ? (
        <HeadphoneMuteIcon size={18} />
      ) : (
        <MusicNote03Icon size={18} />
      )}
      <span className="hud-btn-text">Ambient</span>
    </button>
  );
}
