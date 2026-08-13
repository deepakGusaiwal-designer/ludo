import { useEffect } from "react";

export function ResetModal({ isOpen, onConfirm, onCancel }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="glass-modal-overlay">
      <div className="glass-modal-card">
        <button
          type="button"
          className="modal-close-icon-btn"
          onClick={onCancel}
          title="Close dialog"
        >
          ✕
        </button>
        <div className="glass-modal-icon">⚠️</div>
        <h3 className="glass-modal-title">Reset Game?</h3>
        <p className="glass-modal-desc">
          Are you sure you want to reset all token positions back to their yards?
          Current game progress will be cleared.
        </p>

        <div className="glass-modal-actions">
          <button
            type="button"
            className="glass-btn glass-btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            className="glass-btn glass-btn-danger"
            onClick={onConfirm}
          >
            Reset Game
          </button>
        </div>
      </div>
    </div>
  );
}
