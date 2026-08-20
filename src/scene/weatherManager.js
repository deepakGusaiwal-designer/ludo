import * as THREE from "three";

const STORAGE_KEY_WEATHER = "ludo_selected_weather";
const STORAGE_KEY_TIME = "ludo_selected_time_of_day";

export const WEATHER_PRESETS = [
  {
    id: "clear",
    name: "Clear Forest",
    desc: "Lush enchanted woodland with green trees, grass, and wildlife",
    emoji: "🌲",
    badge: "Forest",
    skyColor: "#203127",
    fogColor: "#203127",
    fogNear: 35,
    fogFar: 95,
    ambientColor: "#d4c4a8",
    ambientIntensityMult: 1.0,
    sunColor: "#ffd8a8",
    sunIntensityMult: 1.0,
    hemiSky: "#c8d6c5",
    hemiGround: "#1b281f",
    fillColor: "#a4c8b0",
    bounceColor: "#d4a96a",
  },
  {
    id: "ice",
    name: "Glacier Ice",
    desc: "Antarctica frozen glacier realm with icebergs and crystal peaks",
    emoji: "❄️",
    badge: "Frozen",
    skyColor: "#152636",
    fogColor: "#1c3347",
    fogNear: 32,
    fogFar: 90,
    ambientColor: "#b8e2f8",
    ambientIntensityMult: 1.15,
    sunColor: "#dcf0fa",
    sunIntensityMult: 1.2,
    hemiSky: "#c8ecff",
    hemiGround: "#182c3d",
    fillColor: "#82c8fa",
    bounceColor: "#a8e2fa",
  },
  {
    id: "heavy_rain",
    name: "Stormy Ocean",
    desc: "Vast tempestuous open blue ocean with rain and lightning strikes",
    emoji: "🌊",
    badge: "Ocean",
    skyColor: "#0e314d",
    fogColor: "#134266",
    fogNear: 32,
    fogFar: 92,
    ambientColor: "#7bb9e8",
    ambientIntensityMult: 1.1,
    sunColor: "#a3dbff",
    sunIntensityMult: 1.0,
    hemiSky: "#5eaef0",
    hemiGround: "#0b2e4f",
    fillColor: "#4ea3eb",
    bounceColor: "#2b7bbd",
  },
  {
    id: "desert",
    name: "Desert Dunes",
    desc: "Endless golden sand dunes with canyon rocks and heat haze",
    emoji: "🏜️",
    badge: "Desert",
    skyColor: "#4a2c14",
    fogColor: "#543318",
    fogNear: 35,
    fogFar: 95,
    ambientColor: "#e6b278",
    ambientIntensityMult: 1.2,
    sunColor: "#ffbe76",
    sunIntensityMult: 1.35,
    hemiSky: "#fcd69d",
    hemiGround: "#422410",
    fillColor: "#de9d5b",
    bounceColor: "#e89e46",
  },
  {
    id: "heaven",
    name: "Heaven Mode",
    desc: "Celestial divine clouds with glowing quartz crystal pillars",
    emoji: "✨",
    badge: "Divine",
    skyColor: "#2a3d52",
    fogColor: "#324860",
    fogNear: 38,
    fogFar: 100,
    ambientColor: "#ffecc2",
    ambientIntensityMult: 1.4,
    sunColor: "#fff4d6",
    sunIntensityMult: 1.45,
    hemiSky: "#c4e6ff",
    hemiGround: "#243d4f",
    fillColor: "#90caf9",
    bounceColor: "#ffd54f",
  },
  {
    id: "hell",
    name: "Hell & Fire",
    desc: "Fiery volcanic brimstone realm with lava rocks and rising embers",
    emoji: "🔥",
    badge: "Infernal",
    skyColor: "#2e0808",
    fogColor: "#3d0a0a",
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
    desc: "Bright crisp noon sunlight and vibrant daytime atmosphere",
    emoji: "☀️",
    badge: "Day",
    sunPosition: [-15, 28, 12],
    ambientMult: 1.0,
    sunIntensity: 2.2,
    exposureMult: 1.0,
    skyTint: 1.0,
  },
  {
    id: "evening",
    name: "Golden Sunset",
    desc: "Warm orange golden-hour dusk with long dramatic shadows",
    emoji: "🌅",
    badge: "Dusk",
    sunPosition: [-28, 9, 18],
    ambientMult: 0.85,
    sunIntensity: 1.7,
    exposureMult: 0.95,
    skyTint: 0.88,
  },
  {
    id: "night",
    name: "Moonlit Night",
    desc: "Cool deep midnight atmosphere with silvery moonlight",
    emoji: "🌙",
    badge: "Night",
    sunPosition: [16, 22, -18],
    ambientMult: 0.55,
    sunIntensity: 0.95,
    exposureMult: 0.85,
    skyTint: 0.65,
  },
  {
    id: "dark_night",
    name: "Dark Midnight",
    desc: "Mysterious pitch-black starry night with intense glowing board",
    emoji: "🌌",
    badge: "Dark",
    sunPosition: [10, 16, -20],
    ambientMult: 0.38,
    sunIntensity: 0.6,
    exposureMult: 0.78,
    skyTint: 0.45,
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
