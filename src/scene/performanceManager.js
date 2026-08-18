/**
 * Performance Manager: graphics quality presets and brightness.
 */

export const QUALITY_TIERS = {
  ULTRA: "ultra",
  HIGH: "high",
  LIGHT: "light",
};

const STORAGE_KEY = "ludo_graphics_quality";

export function getSavedQualityPreference() {
  if (typeof localStorage === "undefined") return QUALITY_TIERS.HIGH;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === QUALITY_TIERS.ULTRA || saved === QUALITY_TIERS.HIGH || saved === QUALITY_TIERS.LIGHT) {
    return saved;
  }
  return QUALITY_TIERS.HIGH;
}

export function saveQualityPreference(tier) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, tier);
  }
}

/* ---------------------------------------------------------
   Brightness — a simple exposure multiplier, stored as a
   percentage (100 = the scene's normal exposure).
--------------------------------------------------------- */

const BRIGHTNESS_KEY = "ludo_graphics_brightness";

export const BRIGHTNESS_MIN = 60;
export const BRIGHTNESS_MAX = 140;
export const BRIGHTNESS_DEFAULT = 100;

export function getSavedBrightness() {
  if (typeof localStorage === "undefined") return BRIGHTNESS_DEFAULT;
  const saved = Number(localStorage.getItem(BRIGHTNESS_KEY));
  if (Number.isFinite(saved) && saved >= BRIGHTNESS_MIN && saved <= BRIGHTNESS_MAX) {
    return saved;
  }
  return BRIGHTNESS_DEFAULT;
}

export function saveBrightness(percent) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(BRIGHTNESS_KEY, String(percent));
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
