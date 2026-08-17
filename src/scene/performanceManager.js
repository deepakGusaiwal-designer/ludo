/**
 * Performance Manager & Hardware Tier Detector
 */

export const QUALITY_TIERS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  AUTO: "auto",
};

const STORAGE_KEY = "ludo_graphics_quality";

export function detectHardwareTier() {
  if (typeof window === "undefined") return "high";
  const isMobile = window.innerWidth < 768;
  const memory = (typeof navigator !== "undefined" && navigator.deviceMemory) || 4;
  const cores = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 4;

  if (isMobile && (memory <= 2 || cores <= 2)) {
    return "low";
  }
  if (isMobile) {
    return "medium";
  }
  return "high";
}

export function getSavedQualityPreference() {
  if (typeof localStorage === "undefined") return "auto";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "high" || saved === "medium" || saved === "low" || saved === "auto") {
    return saved;
  }
  return "auto";
}

export function saveQualityPreference(tier) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, tier);
  }
}

export class PerformanceMonitor {
  constructor(onDownscale, onUpscale) {
    this.onDownscale = onDownscale;
    this.onUpscale = onUpscale;
    this.frameCount = 0;
    this.lastTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.lowFpsDuration = 0;
    this.highFpsDuration = 0;
    this.enabled = true;
    this.currentFps = 60;
  }

  reset() {
    this.frameCount = 0;
    this.lastTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.lowFpsDuration = 0;
    this.highFpsDuration = 0;
    this.enabled = true;
  }

  tick(time) {
    if (!this.enabled) return;

    this.frameCount++;
    const delta = time - this.lastTime;

    if (delta >= 1000) {
      const fps = (this.frameCount * 1000) / delta;
      this.currentFps = Math.round(fps);
      this.frameCount = 0;
      this.lastTime = time;

      if (fps < 30) {
        this.lowFpsDuration += 1;
        this.highFpsDuration = 0;

        // Downscale graphics tier after 2 consecutive low FPS seconds
        if (this.lowFpsDuration >= 2) {
          this.lowFpsDuration = 0;
          if (typeof this.onDownscale === "function") {
            this.onDownscale(this.currentFps);
          }
        }
      } else if (fps > 55) {
        this.highFpsDuration += 1;
        this.lowFpsDuration = 0;

        // Upscale graphics tier if performance remains consistently 55+ FPS for 10s
        if (this.highFpsDuration >= 10) {
          this.highFpsDuration = 0;
          if (typeof this.onUpscale === "function") {
            this.onUpscale(this.currentFps);
          }
        }
      } else {
        this.lowFpsDuration = 0;
        this.highFpsDuration = 0;
      }
    }
  }

  stop() {
    this.enabled = false;
  }
}
