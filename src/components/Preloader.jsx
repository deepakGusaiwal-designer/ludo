import { useEffect, useState } from "react";
import gsap from "gsap";

const LOADING_STEPS = [
  "Awakening the mystical forest...",
  "Carving emerald board tiles...",
  "Summoning 3D hero pawns...",
  "Polishing lucky dice...",
  "Entering the board...",
];

export function Preloader({ isReady }) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1800; // 1.8s smooth minimum load time

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 95));

      setProgress(pct);

      const stepIdx = Math.min(
        LOADING_STEPS.length - 1,
        Math.floor((elapsed / duration) * LOADING_STEPS.length),
      );
      setStatusIndex(stepIdx);

      if (elapsed >= duration && isReady) {
        clearInterval(interval);
        setProgress(100);
        setStatusIndex(LOADING_STEPS.length - 1);

        setTimeout(() => {
          gsap.to(".preloader-overlay", {
            opacity: 0,
            scale: 1.05,
            duration: 0.65,
            ease: "power2.inOut",
            onComplete: () => setIsDone(true),
          });
        }, 300);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isReady]);

  if (isDone) return null;

  return (
    <div className="preloader-overlay">
      {/* Ambient background particles and glowing orbs */}
      <div className="preloader-backdrop-glow preloader-glow-top" />
      <div className="preloader-backdrop-glow preloader-glow-bottom" />

      <div className="preloader-card">
        {/* Animated Brand Logo */}
        <div className="preloader-logo-wrap">
          <img src="/logo.png" alt="Ludo Logo" className="preloader-logo-img" />
          <div className="preloader-logo-shimmer" />
        </div>

        {/* 3D Tumbling Modal Dice Scene */}
        <div className="preloader-dice-stage">
          <div className="preloader-dice-shadow" />
          <div className="preloader-dice-cube">
            {/* Face 1: Front */}
            <div className="dice-face face-front">
              <span className="dice-pip center red-pip" />
            </div>

            {/* Face 2: Top */}
            <div className="dice-face face-top">
              <span className="dice-pip top-left green-pip" />
              <span className="dice-pip bottom-right green-pip" />
            </div>

            {/* Face 3: Right */}
            <div className="dice-face face-right">
              <span className="dice-pip top-left yellow-pip" />
              <span className="dice-pip center yellow-pip" />
              <span className="dice-pip bottom-right yellow-pip" />
            </div>

            {/* Face 4: Left */}
            <div className="dice-face face-left">
              <span className="dice-pip top-left blue-pip" />
              <span className="dice-pip top-right blue-pip" />
              <span className="dice-pip bottom-left blue-pip" />
              <span className="dice-pip bottom-right blue-pip" />
            </div>

            {/* Face 5: Bottom */}
            <div className="dice-face face-bottom">
              <span className="dice-pip top-left" />
              <span className="dice-pip top-right" />
              <span className="dice-pip center" />
              <span className="dice-pip bottom-left" />
              <span className="dice-pip bottom-right" />
            </div>

            {/* Face 6: Back */}
            <div className="dice-face face-back">
              <span className="dice-pip top-left red-pip" />
              <span className="dice-pip top-right red-pip" />
              <span className="dice-pip mid-left red-pip" />
              <span className="dice-pip mid-right red-pip" />
              <span className="dice-pip bottom-left red-pip" />
              <span className="dice-pip bottom-right red-pip" />
            </div>
          </div>
        </div>

        {/* Loading Information & Elastic Progress Bar */}
        <div className="preloader-info">
          <div className="preloader-status-row">
            <span className="preloader-status-text">
              {LOADING_STEPS[statusIndex]}
            </span>
            <span className="preloader-percent">{progress}%</span>
          </div>

          <div className="preloader-bar-track">
            <div
              className="preloader-bar-fill"
              style={{ width: `${progress}%` }}
            >
              <div className="preloader-bar-light" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
