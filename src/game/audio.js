/**
 * Web Audio API procedural sound synthesizer for Ludo sound effects.
 *
 * Provides real-time synthesized sound effects (dice rolling, token hopping,
 * spawn, capture knockout, home finish, victory fanfare, and click sounds)
 * with zero external asset dependencies.
 */

let audioCtx = null;
let muted = localStorage.getItem("ludo_muted") === "true";

function getContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Global user gesture listener to bypass browser audio autoplay restrictions
if (typeof window !== "undefined") {
  const unlockAudioGesture = () => {
    const ctx = getContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
    if (!muted) {
      startForestAmbience();
    }
    window.removeEventListener("click", unlockAudioGesture);
    window.removeEventListener("touchstart", unlockAudioGesture);
    window.removeEventListener("keydown", unlockAudioGesture);
  };
  window.addEventListener("click", unlockAudioGesture);
  window.addEventListener("touchstart", unlockAudioGesture);
  window.addEventListener("keydown", unlockAudioGesture);
}

export function getMuted() {
  return muted;
}

export function setMuted(val) {
  muted = Boolean(val);
  localStorage.setItem("ludo_muted", String(muted));
  if (muted) {
    stopForestAmbience();
  } else {
    startForestAmbience();
  }
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

/* ------------------------------------------------------ */
/* Forest Night Ambience & Bonfire Audio Generator       */
/* ------------------------------------------------------ */

let ambienceNode = null;
let crackleTimer = null;
let cricketTimer = null;
let owlTimer = null;

function createNoiseBuffer(ctx, seconds = 4) {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createBonfireBuffer(ctx, seconds = 5) {
  const bufferSize = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // Generate organic bonfire wood pop crackles
    if (Math.random() < 0.0025) {
      const popLen = Math.floor(ctx.sampleRate * (0.006 + Math.random() * 0.015));
      const popAmp = 0.15 + Math.random() * 0.35;
      for (let j = 0; j < popLen && i + j < bufferSize; j++) {
        const t = j / popLen;
        data[i + j] += (Math.random() * 2 - 1) * popAmp * Math.exp(-t * 8);
      }
      i += popLen;
    }
  }
  return buffer;
}

export function startForestAmbience() {
  if (muted || (ambienceNode && ambienceNode.active)) return;
  const ctx = getContext();
  if (!ctx) return;

  // Set guard immediately to prevent recursion
  ambienceNode = { active: true };

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.18, ctx.currentTime);

  // 1. Hardware-Accelerated Bonfire Wood Crackle (Zero GC Overhead)
  const crackleBuffer = createBonfireBuffer(ctx, 5);
  const crackleSource = ctx.createBufferSource();
  crackleSource.buffer = crackleBuffer;
  crackleSource.loop = true;

  const crackleFilter = ctx.createBiquadFilter();
  crackleFilter.type = "bandpass";
  crackleFilter.frequency.value = 1800;
  crackleFilter.Q.value = 1.8;

  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.7;

  crackleSource.connect(crackleFilter);
  crackleFilter.connect(crackleGain);
  crackleGain.connect(masterGain);
  crackleSource.start();

  // 2. Crisp Night Cricket Chirp Sounds
  const scheduleCricket = () => {
    if (muted || !ambienceNode) return;
    const now = ctx.currentTime;
    const pulses = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < pulses; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(4500 + Math.random() * 400, now + i * 0.045);

      gain.gain.setValueAtTime(0.06, now + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.045 + 0.035);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now + i * 0.045);
      osc.stop(now + i * 0.045 + 0.04);
    }

    const nextDelay = 3500 + Math.random() * 5000;
    cricketTimer = setTimeout(scheduleCricket, nextDelay);
  };
  scheduleCricket();

  // 3. Warm Night Owl Call (Echoing Hoot)
  const scheduleOwl = () => {
    if (muted || !ambienceNode) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(370, now);
    osc.frequency.exponentialRampToValueAtTime(310, now + 0.42);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.50);

    const nextDelay = 10000 + Math.random() * 16000;
    owlTimer = setTimeout(scheduleOwl, nextDelay);
  };
  owlTimer = setTimeout(scheduleOwl, 4000);

  masterGain.connect(ctx.destination);

  ambienceNode = {
    masterGain,
    stop() {
      if (crackleTimer) clearTimeout(crackleTimer);
      if (cricketTimer) clearTimeout(cricketTimer);
      if (owlTimer) clearTimeout(owlTimer);
      ambienceNode = null;
    },
  };
}

export function stopForestAmbience() {
  if (ambienceNode) {
    ambienceNode.stop();
  }
}

/** Mobile Haptic Vibration Helper */
export function vibrate(pattern = 25) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore if user preference / browser permission blocks vibration
    }
  }
}

/** UI button click sound with touch haptics */
export function playClick() {
  vibrate(20);
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}

/** Multi-impact dice tumble and roll sound */
export function playDiceRoll() {
  vibrate([25, 30, 25, 45]);
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const timings = [0, 0.07, 0.16, 0.27, 0.40, 0.55, 0.72];

  timings.forEach((t, index) => {
    const isLand = index === timings.length - 1;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = isLand ? "triangle" : "sine";
    const baseFreq = isLand ? 150 : 320 + Math.random() * 450;
    osc.frequency.setValueAtTime(baseFreq, now + t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, now + t + (isLand ? 0.16 : 0.04));

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(isLand ? 800 : 2600, now + t);

    const volume = isLand ? 0.38 : 0.14 + Math.random() * 0.08;
    gain.gain.setValueAtTime(volume, now + t);
    gain.gain.exponentialRampToValueAtTime(0.001, now + t + (isLand ? 0.18 : 0.05));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + t);
    osc.stop(now + t + (isLand ? 0.2 : 0.06));
  });
}

/** Wooden piece click on each hop step with pitch scaling */
export function playTokenHop(stepIndex = 0, totalSteps = 1) {
  vibrate(30);
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const isFinalStep = stepIndex === totalSteps - 1;
  const baseFreq = 400 + Math.min(stepIndex * 38, 380);

  osc.type = "sine";
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + (isFinalStep ? 0.08 : 0.04));

  const volume = isFinalStep ? 0.28 : 0.18;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinalStep ? 0.1 : 0.05));

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + (isFinalStep ? 0.11 : 0.06));
}

/** Chime burst sound when bringing a token out of the yard on a 6 */
export function playTokenSpawn() {
  vibrate([40, 25, 45]);
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [440, 554.37, 659.25, 880];

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + idx * 0.065);

    gain.gain.setValueAtTime(0.24, now + idx * 0.065);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.065);
    osc.stop(now + idx * 0.065 + 0.16);
  });
}

/** Retro impact zap sound when capturing an opponent token */
export function playTokenCapture() {
  vibrate([60, 40, 60, 40, 90]);
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(780, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.32);

  gain.gain.setValueAtTime(0.32, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.36);
}

/** Flourish chime chord when reaching home finish */
export function playTokenFinish() {
  vibrate([50, 40, 80]);
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const chord = [523.25, 659.25, 783.99, 1046.5];

  chord.forEach((freq) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  });
}

/** Grand victory fanfare when a player wins the game */
export function playVictoryFanfare() {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const sequence = [
    { freq: 523.25, time: 0, duration: 0.18 },
    { freq: 659.25, time: 0.18, duration: 0.18 },
    { freq: 783.99, time: 0.36, duration: 0.18 },
    { freq: 1046.5, time: 0.54, duration: 0.65 },
  ];

  sequence.forEach(({ freq, time, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0.3, now + time);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + duration + 0.05);
  });
}
