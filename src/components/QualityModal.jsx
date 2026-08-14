import { useState, useEffect } from "react";
import { Cancel01Icon, CpuIcon, FlashIcon, SparklesIcon } from "hugeicons-react";
import {
  getSavedQualityPreference,
  saveQualityPreference,
  QUALITY_TIERS,
} from "../scene/performanceManager.js";

export function QualityModal({ isOpen, onClose, sceneRef }) {
  const [selectedQuality, setSelectedQuality] = useState(QUALITY_TIERS.AUTO);

  useEffect(() => {
    if (isOpen) {
      setSelectedQuality(getSavedQualityPreference());
    }
  }, [isOpen]);

  const handleSelectQuality = (tier) => {
    setSelectedQuality(tier);
    saveQualityPreference(tier);
    if (sceneRef && sceneRef.current) {
      sceneRef.current.setQualityTier(tier);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="glass-modal-overlay">
      <div className="glass-modal-card">
        <button
          type="button"
          className="modal-close-icon-btn"
          onClick={onClose}
          title="Close quality settings"
        >
          <Cancel01Icon size={16} />
        </button>

        <div className="glass-modal-icon">
          <CpuIcon size={38} color="#3b71ef" />
        </div>

        <h3 className="glass-modal-title">Graphics Performance</h3>
        <p className="glass-modal-desc">
          Choose a graphics quality preset to optimize 3D performance on your mobile phone or desktop device.
        </p>

        <div className="quality-preset-grid">
          <button
            type="button"
            className={`quality-preset-btn ${selectedQuality === QUALITY_TIERS.AUTO ? "active" : ""}`}
            onClick={() => handleSelectQuality(QUALITY_TIERS.AUTO)}
          >
            <SparklesIcon size={20} />
            <div className="quality-info">
              <strong>Auto (Recommended)</strong>
              <span>Auto-detects hardware & auto-adjusts if FPS drops below 30</span>
            </div>
          </button>

          <button
            type="button"
            className={`quality-preset-btn ${selectedQuality === QUALITY_TIERS.HIGH ? "active" : ""}`}
            onClick={() => handleSelectQuality(QUALITY_TIERS.HIGH)}
          >
            <SparklesIcon size={20} />
            <div className="quality-info">
              <strong>High Quality</strong>
              <span>Full 3D soft shadows, maximum grass, 14 sky clouds & high resolution</span>
            </div>
          </button>

          <button
            type="button"
            className={`quality-preset-btn ${selectedQuality === QUALITY_TIERS.MEDIUM ? "active" : ""}`}
            onClick={() => handleSelectQuality(QUALITY_TIERS.MEDIUM)}
          >
            <FlashIcon size={20} />
            <div className="quality-info">
              <strong>Medium (Balanced)</strong>
              <span>Basic shadows, medium foliage density & balanced battery usage</span>
            </div>
          </button>

          <button
            type="button"
            className={`quality-preset-btn ${selectedQuality === QUALITY_TIERS.LOW ? "active" : ""}`}
            onClick={() => handleSelectQuality(QUALITY_TIERS.LOW)}
          >
            <CpuIcon size={20} />
            <div className="quality-info">
              <strong>Low (Fastest 60 FPS)</strong>
              <span>No shadow maps, lightweight foliage — smooth on any budget phone</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
