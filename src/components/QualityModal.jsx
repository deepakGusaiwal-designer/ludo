import { useState, useEffect } from "react";
import { Cancel01Icon, CpuIcon, FlashIcon, Sun01Icon, SparklesIcon } from "hugeicons-react";
import {
  getSavedQualityPreference,
  saveQualityPreference,
  getSavedBrightness,
  saveBrightness,
  BRIGHTNESS_MIN,
  BRIGHTNESS_MAX,
  QUALITY_TIERS,
} from "../scene/performanceManager.js";
import { useModalPhysics } from "../hooks/useModalPhysics.js";
import { GsapRadio } from "./GsapFormControls.jsx";
import { ShinyButton } from "./reactbits/ShinyButton.jsx";
import { ElasticSlider } from "./reactbits/ElasticSlider.jsx";

const PRESETS = [
  {
    tier: QUALITY_TIERS.ULTRA,
    icon: SparklesIcon,
    title: "Ultra",
    desc: "Densest forest, 4K soft shadows & every visual flourish on",
  },
  {
    tier: QUALITY_TIERS.HIGH,
    icon: FlashIcon,
    title: "High (Default)",
    desc: "Full soft shadows, rich foliage & a balanced, smooth frame rate",
  },
  {
    tier: QUALITY_TIERS.LIGHT,
    icon: CpuIcon,
    title: "Light",
    desc: "No shadow maps, lightweight scenery — fastest on any device",
  },
];

export function QualityModal({ isOpen, onClose, sceneRef }) {
  const modalRef = useModalPhysics();
  const [selectedQuality, setSelectedQuality] = useState(QUALITY_TIERS.HIGH);
  const [brightness, setBrightness] = useState(100);

  useEffect(() => {
    if (isOpen) {
      setSelectedQuality(getSavedQualityPreference());
      setBrightness(getSavedBrightness());
    }
  }, [isOpen]);

  const handleSelectQuality = (tier) => {
    setSelectedQuality(tier);
    saveQualityPreference(tier);
    if (sceneRef && sceneRef.current) {
      sceneRef.current.setQualityTier(tier);
    }
  };

  const handleBrightnessChange = (val) => {
    const value = Number(val);
    setBrightness(value);
    saveBrightness(value);
    if (sceneRef && sceneRef.current) {
      sceneRef.current.setBrightness(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="glass-modal-overlay">
      <div className="glass-modal-card" ref={modalRef}>
        <button
          type="button"
          className="modal-close-icon-btn"
          onClick={onClose}
          title="Close quality settings"
        >
          <Cancel01Icon size={16} />
        </button>

        <div className="glass-modal-icon">
          <CpuIcon size={38} color="#f2b544" />
        </div>

        <h3 className="glass-modal-title">Graphics Performance</h3>
        <p className="glass-modal-desc">
          Choose a graphics quality preset and adjust brightness to fine-tune 3D performance and look.
        </p>

        <div className="quality-radio-group">
          {PRESETS.map(({ tier, icon: Icon, title, desc }) => (
            <GsapRadio
              key={tier}
              name="quality"
              value={tier}
              checked={selectedQuality === tier}
              onChange={() => handleSelectQuality(tier)}
              className="quality-radio-card"
            >
              <span className="quality-radio-icon">
                <Icon size={20} />
              </span>
              <span className="quality-radio-info">
                <strong>{title}</strong>
                <span>{desc}</span>
              </span>
            </GsapRadio>
          ))}
        </div>

        <div className="brightness-control">
          <ElasticSlider
            value={brightness}
            min={BRIGHTNESS_MIN}
            max={BRIGHTNESS_MAX}
            step={5}
            onChange={handleBrightnessChange}
            icon={Sun01Icon}
            label="Brightness"
            unit="%"
          />
        </div>

        <div className="glass-modal-actions">
          <ShinyButton
            variant="primary"
            onClick={onClose}
          >
            ✓ Done
          </ShinyButton>
        </div>
      </div>
    </div>
  );
}
