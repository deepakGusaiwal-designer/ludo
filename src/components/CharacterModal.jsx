import { useState } from "react";
import { Cancel01Icon, Tick02Icon, UserIcon } from "hugeicons-react";
import {
  CHARACTERS,
  getSelectedCharacter,
  saveSelectedCharacter,
} from "../scene/characterManager.js";
import { useModalPhysics } from "../hooks/useModalPhysics.js";
import { ShinyButton } from "./reactbits/ShinyButton.jsx";

export function CharacterModal({ isOpen, sceneRef, onCancel }) {
  const modalRef = useModalPhysics();
  const [selectedChar, setSelectedChar] = useState(getSelectedCharacter);

  if (!isOpen) return null;

  const handleSelect = (charId) => {
    setSelectedChar(charId);
    saveSelectedCharacter(charId);
    sceneRef.current?.setCharacterPawn(charId);
  };

  return (
    <div className="glass-modal-overlay">
      <div className="glass-modal-card character-card" ref={modalRef}>
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
          <div className="glass-modal-icon-badge">
            <UserIcon size={24} color="#34d399" />
          </div>
          <div>
            <h3 className="glass-modal-title">Choose Token Character</h3>
            <p className="glass-modal-subtitle">
              Select your 3D character piece for all pawns on the board
            </p>
          </div>
        </div>

        <div className="character-grid">
          {CHARACTERS.map((char) => {
            const isSelected = selectedChar === char.id;
            return (
              <button
                key={char.id}
                type="button"
                className={`character-card-btn ${isSelected ? "active" : ""}`}
                onClick={() => handleSelect(char.id)}
              >
                <div className="character-card-top">
                  <span className="character-emoji">{char.previewEmoji}</span>
                  {char.badge && (
                    <span className={`character-badge ${char.badge.toLowerCase().replace(/\s+/g, "-")}`}>
                      {char.badge}
                    </span>
                  )}
                </div>

                <div className="character-card-info">
                  <div className="character-name">
                    <span>{char.name}</span>
                    {isSelected && (
                      <span className="character-check">
                        <Tick02Icon size={16} />
                      </span>
                    )}
                  </div>
                  <div className="character-desc">{char.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="glass-modal-actions">
          <ShinyButton
            variant="primary"
            onClick={onCancel}
          >
            ✓ Done
          </ShinyButton>
        </div>
      </div>
    </div>
  );
}
