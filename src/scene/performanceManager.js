/**
 * Performance Manager & Hardware Tier Detector
 * 
 * Automatically detects device GPU & CPU tier, monitors live FPS,
 * and provides quality preset levels ('high', 'medium', 'low', 'auto')
 * to ensure smooth 60 FPS performance on lower-end mobile devices.
 */

const STORAGE_KEY = "ludo_graphics_quality";

export const QUALITY_TIERS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  AUTO: "auto",
};

/** Detect hardware capabilities */
export function detectHardwareTier() {
  const isMobile = window.innerWidth < 768;
  const memory = navigator.deviceMemory || 4; // GB
  const cores = navigator.hardwareConcurrency || 4;

  if (isMobile && (memory <= 2 || cores <= 2)) {
    return QUALITY_TIERS.LOW;
  }
  if (isMobile) {
    return QUALITY_TIERS.MEDIUM;
  }
  return QUALITY_TIERS.HIGH;
}

export function getSavedQualityPreference() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && Object.values(QUALITY_TIERS).includes(saved)) {
    return saved;
  }
  return QUALITY_TIERS.AUTO;
}

export function saveQualityPreference(tier) {
  localStorage.setItem(STORAGE_KEY, tier);
}

export class PerformanceMonitor {
  constructor(onDownscale) {
    this.onDownscale = onDownscale;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.lowFpsDuration = 0;
    this.enabled = true;
  }

  tick(time) {
    if (!this.enabled) return;

    this.frameCount++;
    const delta = time - this.lastTime;

    // Check FPS every 1 second (1000ms)
    if (delta >= 1000) {
      const fps = (this.frameCount * 1000) / delta;
      this.frameCount = 0;
      this.lastTime = time;

      if (fps < 30) {
        this.lowFpsDuration += 1;
        // If FPS stays below 30 for 3 seconds, auto-downscale
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
