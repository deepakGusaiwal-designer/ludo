import { useEffect, useState } from "react";
import gsap from "gsap";

const LOADING_STEPS = [
  "Awakening the mystical forest...",
  "Carving emerald board tiles...",
  "Summoning 3D hero pawns...",
  "Polishing lucky dice...",
  "Entering the board...",
];

export function Preloader({ isReady, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 750; // Fast and snappy 0.75s load

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
            scale: 1.04,
            duration: 0.45,
            ease: "power2.inOut",
            onComplete: () => {
              setIsDone(true);
              onComplete?.();
            },
          });
        }, 150);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [isReady, onComplete]);

  if (isDone) return null;

  return (
    <div className="preloader-overlay">
      {/* Ambient background glowing orbs */}
      <div className="preloader-backdrop-glow preloader-glow-top" />
      <div className="preloader-backdrop-glow preloader-glow-bottom" />

      <div className="preloader-content-wrap">
        {/* Animated Brand Logo */}
        <div className="preloader-logo-wrap">
          <img src="/logo.png" alt="Ludo Logo" className="preloader-logo-img" />
          <div className="preloader-title-tag">3D REALTIME MULTIPLAYER</div>
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
