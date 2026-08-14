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
  constructor(onDownscale) {
    this.onDownscale = onDownscale;
    this.frameCount = 0;
    this.lastTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.lowFpsDuration = 0;
    this.enabled = true;
  }

  tick(time) {
    if (!this.enabled) return;

    this.frameCount++;
    const delta = time - this.lastTime;

    if (delta >= 1000) {
      const fps = (this.frameCount * 1000) / delta;
      this.frameCount = 0;
      this.lastTime = time;

      if (fps < 30) {
        this.lowFpsDuration += 1;
        if (this.lowFpsDuration >= 3) {
          this.lowFpsDuration = 0;
          this.enabled = false;
          if (typeof this.onDownscale === "function") {
            this.onDownscale();
          }
        }
      } else {
        this.lowFpsDuration = 0;
      }
    }
  }

  stop() {
    this.enabled = false;
  }
}
