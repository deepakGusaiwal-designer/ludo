import * as THREE from "three";

const STORAGE_KEY_WEATHER = "ludo_selected_weather";
const STORAGE_KEY_TIME = "ludo_selected_time_of_day";

export const WEATHER_PRESETS = [
  {
    id: "clear",
    name: "Clear Forest",
    desc: "Lush enchanted woodland with canopy pines, birch groves, and wildlife",
    emoji: "🌲",
    badge: "Forest",
    skyColor: "#38bdf8",
    fogColor: "#bae6fd",
    fogNear: 35,
    fogFar: 110,
    ambientColor: "#fdf8ee",
    ambientIntensityMult: 1.1,
    sunColor: "#fff8db",
    sunIntensityMult: 1.1,
    hemiSky: "#bae6fd",
    hemiGround: "#15803d",
    fillColor: "#93c5fd",
    bounceColor: "#fef08a",
  },
  {
    id: "ice",
    name: "Glacier Ice",
    desc: "Antarctica frozen glacier realm with icebergs and crystal peaks",
    emoji: "❄️",
    badge: "Frozen",
    skyColor: "#7dd3fc",
    fogColor: "#bae6fd",
    fogNear: 35,
    fogFar: 105,
    ambientColor: "#e0f2fe",
    ambientIntensityMult: 1.2,
    sunColor: "#f0f9ff",
    sunIntensityMult: 1.25,
    hemiSky: "#bae6fd",
    hemiGround: "#0369a1",
    fillColor: "#7dd3fc",
    bounceColor: "#e0f2fe",
  },
  {
    id: "heavy_rain",
    name: "Stormy Ocean",
    desc: "Vast tempestuous open blue ocean with rain and liquid water sounds",
    emoji: "🌊",
    badge: "Ocean",
    skyColor: "#38bdf8",
    fogColor: "#bae6fd",
    fogNear: 35,
    fogFar: 105,
    ambientColor: "#bae6fd",
    ambientIntensityMult: 1.1,
    sunColor: "#e0f2fe",
    sunIntensityMult: 1.05,
    hemiSky: "#7dd3fc",
    hemiGround: "#0284c7",
    fillColor: "#38bdf8",
    bounceColor: "#bae6fd",
  },
  {
    id: "desert",
    name: "Desert Dunes",
    desc: "Endless golden sand dunes with canyon rocks and heat haze",
    emoji: "🏜️",
    badge: "Desert",
    skyColor: "#60a5fa",
    fogColor: "#fef08a",
    fogNear: 38,
    fogFar: 110,
    ambientColor: "#fef3c7",
    ambientIntensityMult: 1.25,
    sunColor: "#fef08a",
    sunIntensityMult: 1.4,
    hemiSky: "#93c5fd",
    hemiGround: "#d97706",
    fillColor: "#fde047",
    bounceColor: "#f59e0b",
  },
  {
    id: "heaven",
    name: "Heaven Mode",
    desc: "Celestial Elysian paradise with floating clouds and glowing crystals",
    emoji: "✨",
    badge: "Divine",
    skyColor: "#dbeefe",
    fogColor: "#e6f4fe",
    fogNear: 45,
    fogFar: 140,
    ambientColor: "#fffbeb",
    ambientIntensityMult: 1.55,
    sunColor: "#fffdf0",
    sunIntensityMult: 1.65,
    hemiSky: "#e0f2fe",
    hemiGround: "#dcfce7",
    fillColor: "#bae6fd",
    bounceColor: "#fef08a",
  },
  {
    id: "hell",
    name: "Hell & Fire",
    desc: "Fiery volcanic brimstone realm with lava rocks and rising embers",
    emoji: "🔥",
    badge: "Infernal",
    skyColor: "#7f1d1d",
    fogColor: "#991b1b",
    fogNear: 30,
    fogFar: 88,
    ambientColor: "#ff6a38",
    ambientIntensityMult: 1.05,
    sunColor: "#ff3d00",
    sunIntensityMult: 0.9,
    hemiSky: "#ff5252",
    hemiGround: "#1f0404",
    fillColor: "#e64a19",
    bounceColor: "#ff1744",
  },
];

export const TIME_OF_DAY_PRESETS = [
  {
    id: "sunny",
    name: "Sunny Day",
    desc: "Bright crisp azure blue sky with vibrant daytime sun",
    emoji: "☀️",
    badge: "Day",
    sunPosition: [-32, 45, 20],
    skyColorOverride: {
      clear: "#38bdf8",     // Vibrant bright blue sunny sky
      ice: "#7dd3fc",       // Crisp arctic cyan sky
      heavy_rain: "#38bdf8",// Sunny ocean sky
      desert: "#60a5fa",    // Clear desert blue sky
      heaven: "#dbeefe",    // Divine celeste pearl sky
      hell: "#7f1d1d",      // Volcanic day
    },
    fogColorOverride: {
      clear: "#bae6fd",
      ice: "#bae6fd",
      heavy_rain: "#bae6fd",
      desert: "#fde68a",
      heaven: "#e6f4fe",
      hell: "#991b1b",
    },
    ambientMult: 1.15,
    sunIntensity: 2.4,
    exposureMult: 1.0,
    sunColor: "#fff8db",
    ambientColor: "#fdf8ee",
    skyTint: 1.0,
  },
  {
    id: "evening",
    name: "Golden Sunset",
    desc: "Blazing golden orange sunset sky with warm sunset sunbeams",
    emoji: "🌅",
    badge: "Dusk",
    sunPosition: [-48, 13, 30],
    skyColorOverride: {
      clear: "#ea580c",     // Blazing golden orange sunset
      ice: "#f97316",       // Golden glacier sunset
      heavy_rain: "#c2410c",// Dramatic fiery sunset
      desert: "#f59e0b",    // Deep amber desert dusk
      heaven: "#fbcfe8",    // Rose-gold ethereal dusk
      hell: "#5c0e0e",
    },
    fogColorOverride: {
      clear: "#fed7aa",
      ice: "#fed7aa",
      heavy_rain: "#fdba74",
      desert: "#fde68a",
      heaven: "#fce7f3",
      hell: "#3f0a0a",
    },
    ambientMult: 0.9,
    sunIntensity: 2.0,
    exposureMult: 0.98,
    sunColor: "#ff7a00",    // Rich golden orange sunset sun
    ambientColor: "#fed7aa",// Warm amber ambient
    skyTint: 1.0,
  },
  {
    id: "night",
    name: "Moonlit Night",
    desc: "Pitch-black starry night with radiant silvery moon",
    emoji: "🌙",
    badge: "Night",
    sunPosition: [28, 42, -22],
    skyColorOverride: {
      clear: "#020617",     // Midnight pitch-black
      ice: "#020617",
      heavy_rain: "#020617",
      desert: "#020617",
      heaven: "#030712",
      hell: "#120303",
    },
    fogColorOverride: {
      clear: "#090d16",
      ice: "#090d16",
      heavy_rain: "#090d16",
      desert: "#090d16",
      heaven: "#0f172a",
      hell: "#190404",
    },
    ambientMult: 0.42,
    sunIntensity: 0.85,
    exposureMult: 0.85,
    sunColor: "#dbeafe",    // Silvery lunar blue light
    ambientColor: "#1e293b",// Cool midnight ambient
    skyTint: 1.0,
  },
  {
    id: "dark_night",
    name: "Dark Midnight",
    desc: "Pitch-black cosmic starry night with glowing moon and starfield",
    emoji: "🌌",
    badge: "Dark",
    sunPosition: [22, 46, -26],
    skyColorOverride: {
      clear: "#000000",     // Pure pitch black
      ice: "#000000",
      heavy_rain: "#000000",
      desert: "#000000",
      heaven: "#02040a",
      hell: "#0a0101",
    },
    fogColorOverride: {
      clear: "#04060a",
      ice: "#04060a",
      heavy_rain: "#04060a",
      desert: "#04060a",
      heaven: "#080c14",
      hell: "#0e0202",
    },
    ambientMult: 0.3,
    sunIntensity: 0.6,
    exposureMult: 0.8,
    sunColor: "#93c5fd",
    ambientColor: "#0f172a",
    skyTint: 1.0,
  },
];

export function getSelectedWeather() {
  if (typeof localStorage === "undefined") return "clear";
  const saved = localStorage.getItem(STORAGE_KEY_WEATHER);
  if (saved && WEATHER_PRESETS.some((w) => w.id === saved)) {
    return saved;
  }
  return "clear";
}

export function saveSelectedWeather(weatherId) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY_WEATHER, weatherId);
  }
}

export function getSelectedTimeOfDay() {
  if (typeof localStorage === "undefined") return "sunny";
  const saved = localStorage.getItem(STORAGE_KEY_TIME);
  if (saved && TIME_OF_DAY_PRESETS.some((t) => t.id === saved)) {
    return saved;
  }
  return "sunny";
}

export function saveSelectedTimeOfDay(timeId) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY_TIME, timeId);
  }
}

let cachedCircleTexture = null;
export function getCircleParticleTexture() {
  if (cachedCircleTexture) return cachedCircleTexture;
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  gradient.addColorStop(0.45, "rgba(255, 255, 255, 0.9)");
  gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.35)");
  gradient.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  cachedCircleTexture = texture;
  return texture;
}

let cachedRainTexture = null;
export function getRainStreakTexture() {
  if (cachedRainTexture) return cachedRainTexture;
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0.0, "rgba(255, 255, 255, 0.0)");
  gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.45)");
  gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.9)");
  gradient.addColorStop(1.0, "rgba(255, 255, 255, 1.0)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(16, 64, 12, 60, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  cachedRainTexture = texture;
  return texture;
}

/**
 * Creates dynamic environmental particle systems (Rain, Embers, Sand, Sparkles, Mist).
 */
export function createWeatherParticles(scene) {
  const container = new THREE.Group();
  container.name = "WeatherParticles";
  scene.add(container);

  const circleTex = getCircleParticleTexture();
  const rainTex = getRainStreakTexture();

  // 1. Rain Particle System
  const RAIN_COUNT = 1800;
  const rainGeo = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(RAIN_COUNT * 3);
  const rainVelocities = new Float32Array(RAIN_COUNT);

  for (let i = 0; i < RAIN_COUNT; i++) {
    rainPositions[i * 3 + 0] = (Math.random() - 0.5) * 45;
    rainPositions[i * 3 + 1] = Math.random() * 30;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 45;
    rainVelocities[i] = 18 + Math.random() * 12;
  }

  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));

  const rainMat = new THREE.PointsMaterial({
    color: "#a8c5db",
    size: 0.22,
    map: rainTex,
    transparent: true,
    opacity: 0.75,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });

  const rainSystem = new THREE.Points(rainGeo, rainMat);
  rainSystem.visible = false;
  container.add(rainSystem);

  // 2. Fiery Embers System (Hell Mode)
  const EMBER_COUNT = 320;
  const emberGeo = new THREE.BufferGeometry();
  const emberPositions = new Float32Array(EMBER_COUNT * 3);
  const emberData = [];

  for (let i = 0; i < EMBER_COUNT; i++) {
    emberPositions[i * 3 + 0] = (Math.random() - 0.5) * 35;
    emberPositions[i * 3 + 1] = Math.random() * 12;
    emberPositions[i * 3 + 2] = (Math.random() - 0.5) * 35;
    emberData.push({
      speedY: 0.8 + Math.random() * 1.5,
      driftX: (Math.random() - 0.5) * 0.8,
      driftZ: (Math.random() - 0.5) * 0.8,
      phase: Math.random() * Math.PI * 2,
    });
  }

  emberGeo.setAttribute("position", new THREE.BufferAttribute(emberPositions, 3));

  const emberMat = new THREE.PointsMaterial({
    color: "#ff5722",
    size: 0.28,
    map: circleTex,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const emberSystem = new THREE.Points(emberGeo, emberMat);
  emberSystem.visible = false;
  container.add(emberSystem);

  // 3. Sand Storm / Fine Wind-Thrown Desert Sands (Desert Mode)
  const SAND_COUNT = 850;
  const sandGeo = new THREE.BufferGeometry();
  const sandPositions = new Float32Array(SAND_COUNT * 3);
  const sandData = [];

  for (let i = 0; i < SAND_COUNT; i++) {
    sandPositions[i * 3 + 0] = (Math.random() - 0.5) * 46;
    sandPositions[i * 3 + 1] = 0.1 + Math.random() * 9.5;
    sandPositions[i * 3 + 2] = (Math.random() - 0.5) * 46;
    sandData.push({
      baseSpeedX: 3.5 + Math.random() * 5.0,
      driftY: (Math.random() - 0.5) * 0.6,
      driftZ: 0.8 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
      gustFactor: 0.6 + Math.random() * 0.8,
    });
  }

  sandGeo.setAttribute("position", new THREE.BufferAttribute(sandPositions, 3));

  const sandMat = new THREE.PointsMaterial({
    color: "#f5c07b",
    size: 0.09,
    map: circleTex,
    transparent: true,
    opacity: 0.78,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });

  const sandSystem = new THREE.Points(sandGeo, sandMat);
  sandSystem.visible = false;
  container.add(sandSystem);

  // 4. Celestial Holy Sparkles (Heaven Mode)
  const SPARKLE_COUNT = 240;
  const sparkleGeo = new THREE.BufferGeometry();
  const sparklePositions = new Float32Array(SPARKLE_COUNT * 3);
  const sparkleData = [];

  for (let i = 0; i < SPARKLE_COUNT; i++) {
    sparklePositions[i * 3 + 0] = (Math.random() - 0.5) * 32;
    sparklePositions[i * 3 + 1] = 0.5 + Math.random() * 15;
    sparklePositions[i * 3 + 2] = (Math.random() - 0.5) * 32;
    sparkleData.push({
      speedY: 0.4 + Math.random() * 0.8,
      radius: 0.5 + Math.random() * 1.5,
      angle: Math.random() * Math.PI * 2,
      orbitSpeed: (Math.random() - 0.5) * 0.7,
    });
  }

  sparkleGeo.setAttribute("position", new THREE.BufferAttribute(sparklePositions, 3));

  const sparkleMat = new THREE.PointsMaterial({
    color: "#fff1b8",
    size: 0.36,
    map: circleTex,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const sparkleSystem = new THREE.Points(sparkleGeo, sparkleMat);
  sparkleSystem.visible = false;
  container.add(sparkleSystem);

  // 5. Glacier Snow & Ice Crystals (Glacier Ice Mode)
  const SNOW_COUNT = 380;
  const snowGeo = new THREE.BufferGeometry();
  const snowPositions = new Float32Array(SNOW_COUNT * 3);
  const snowData = [];

  for (let i = 0; i < SNOW_COUNT; i++) {
    snowPositions[i * 3 + 0] = (Math.random() - 0.5) * 42;
    snowPositions[i * 3 + 1] = Math.random() * 22;
    snowPositions[i * 3 + 2] = (Math.random() - 0.5) * 42;
    snowData.push({
      speedY: 1.2 + Math.random() * 2.2,
      driftX: (Math.random() - 0.5) * 1.2,
      phase: Math.random() * Math.PI * 2,
    });
  }

  snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPositions, 3));

  const snowMat = new THREE.PointsMaterial({
    color: "#e0f4ff",
    size: 0.3,
    map: circleTex,
    transparent: true,
    opacity: 0.85,
    blending: THREE.NormalBlending,
    depthWrite: false,
  });

  const snowSystem = new THREE.Points(snowGeo, snowMat);
  snowSystem.visible = false;
  container.add(snowSystem);

  let activeWeather = "clear";

  function setWeatherMode(weatherId) {
    activeWeather = weatherId;
    rainSystem.visible = weatherId === "heavy_rain";
    emberSystem.visible = weatherId === "hell";
    sandSystem.visible = weatherId === "desert";
    sparkleSystem.visible = weatherId === "heaven";
    snowSystem.visible = weatherId === "ice";
  }

  function update(delta, elapsedTime) {
    if (activeWeather === "heavy_rain") {
      const pos = rainGeo.attributes.position.array;
      for (let i = 0; i < RAIN_COUNT; i++) {
        pos[i * 3 + 1] -= rainVelocities[i] * delta;
        if (pos[i * 3 + 1] < 0) {
          pos[i * 3 + 1] = 25 + Math.random() * 5;
          pos[i * 3 + 0] = (Math.random() - 0.5) * 45;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 45;
        }
      }
      rainGeo.attributes.position.needsUpdate = true;
    } else if (activeWeather === "hell") {
      const pos = emberGeo.attributes.position.array;
      for (let i = 0; i < EMBER_COUNT; i++) {
        const d = emberData[i];
        pos[i * 3 + 1] += d.speedY * delta;
        pos[i * 3 + 0] += Math.sin(elapsedTime * 2.0 + d.phase) * delta * 0.6;
        pos[i * 3 + 2] += Math.cos(elapsedTime * 2.0 + d.phase) * delta * 0.6;
        if (pos[i * 3 + 1] > 12) {
          pos[i * 3 + 1] = 0.1 + Math.random() * 0.5;
          pos[i * 3 + 0] = (Math.random() - 0.5) * 35;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 35;
        }
      }
      emberGeo.attributes.position.needsUpdate = true;
    } else if (activeWeather === "desert") {
      const pos = sandGeo.attributes.position.array;
      const windGust =
        Math.sin(elapsedTime * 1.6) * 1.5 + Math.cos(elapsedTime * 3.2) * 0.9;
      const gustStrength = Math.max(0.35, 1.0 + windGust * 0.45);

      for (let i = 0; i < SAND_COUNT; i++) {
        const d = sandData[i];
        // Sweeping wind velocity
        pos[i * 3 + 0] += d.baseSpeedX * gustStrength * d.gustFactor * delta;
        // Low skimming turbulence with parabolic dips
        pos[i * 3 + 1] +=
          Math.sin(elapsedTime * 3.5 + d.phase) * delta * 0.6 +
          d.driftY * delta;
        // Swirling crosswind drift
        pos[i * 3 + 2] +=
          (d.driftZ * gustStrength +
            Math.cos(elapsedTime * 2.2 + i * 0.1) * 0.6) *
          delta;

        if (pos[i * 3 + 0] > 24) {
          pos[i * 3 + 0] = -24;
          pos[i * 3 + 1] = 0.1 + Math.random() * 8.5;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 44;
        }
      }
      sandGeo.attributes.position.needsUpdate = true;
    } else if (activeWeather === "heaven") {
      const pos = sparkleGeo.attributes.position.array;
      for (let i = 0; i < SPARKLE_COUNT; i++) {
        const d = sparkleData[i];
        d.angle += d.orbitSpeed * delta;
        pos[i * 3 + 1] += d.speedY * delta;
        pos[i * 3 + 0] += Math.cos(d.angle) * delta * 0.8;
        pos[i * 3 + 2] += Math.sin(d.angle) * delta * 0.8;
        if (pos[i * 3 + 1] > 16) {
          pos[i * 3 + 1] = 0.5;
          pos[i * 3 + 0] = (Math.random() - 0.5) * 32;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 32;
        }
      }
      sparkleGeo.attributes.position.needsUpdate = true;
    } else if (activeWeather === "ice") {
      const pos = snowGeo.attributes.position.array;
      for (let i = 0; i < SNOW_COUNT; i++) {
        const d = snowData[i];
        pos[i * 3 + 1] -= d.speedY * delta;
        pos[i * 3 + 0] += Math.sin(elapsedTime * 1.2 + d.phase) * delta * 0.8 + d.driftX * delta;
        if (pos[i * 3 + 1] < 0) {
          pos[i * 3 + 1] = 20 + Math.random() * 4;
          pos[i * 3 + 0] = (Math.random() - 0.5) * 42;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 42;
        }
      }
      snowGeo.attributes.position.needsUpdate = true;
    }
  }

  function dispose() {
    scene.remove(container);
    rainGeo.dispose();
    rainMat.dispose();
    emberGeo.dispose();
    emberMat.dispose();
    sandGeo.dispose();
    sandMat.dispose();
    sparkleGeo.dispose();
    sparkleMat.dispose();
    snowGeo.dispose();
    snowMat.dispose();
  }

  return {
    container,
    setWeatherMode,
    update,
    dispose,
  };
}
