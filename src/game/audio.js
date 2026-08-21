/**
 * Web Audio API procedural sound synthesizer for Ludo sound effects.
 *
 * Provides real-time synthesized sound effects (dice rolling, token hopping,
 * spawn, capture knockout, home finish, victory fanfare, and click sounds)
 * with zero external asset dependencies.
 */

let audioCtx = null;
let muted = localStorage.getItem("ludo_muted") === "true";
let ambientMuted = localStorage.getItem("ludo_ambient_muted") === "true";

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

function updateAmbientVolume() {
  if (ambientMasterGain && audioCtx) {
    const target = (muted || ambientMuted) ? 0 : 0.4;
    ambientMasterGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.15);
  }
}

export function getMuted() {
  return muted;
}

export function setMuted(val) {
  muted = Boolean(val);
  localStorage.setItem("ludo_muted", String(muted));
  updateAmbientVolume();
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

export function getAmbientMuted() {
  return ambientMuted;
}

export function setAmbientMuted(val) {
  ambientMuted = Boolean(val);
  localStorage.setItem("ludo_ambient_muted", String(ambientMuted));
  updateAmbientVolume();
}

export function toggleAmbientMuted() {
  setAmbientMuted(!ambientMuted);
  return ambientMuted;
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

/* ------------------------------------------------------ */
/* Natural Acoustic Procedural Sound Engine               */
/* ------------------------------------------------------ */

let currentAmbientMode = "clear";
let ambientMasterGain = null;
let currentAmbientNodes = [];
let ambientTimerId = null;
let brownNoiseBuffer = null;
let rainDropBuffer = null;
let waterStreamBuffer = null;
let waterPlopBuffer = null;
let fireCrackleBuffer = null;

/** Generates smooth natural Brownian noise (soft, warm analog sound without harsh hiss) */
function getBrownNoiseBuffer(ctx) {
  if (brownNoiseBuffer) return brownNoiseBuffer;
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.025 * white) / 1.025;
      data[i] = lastOut * 3.2;
    }
  }
  brownNoiseBuffer = buffer;
  return buffer;
}

/** Generates realistic soft, soothing organic rain droplet impacts */
function getRainDropBuffer(ctx) {
  if (rainDropBuffer) return rainDropBuffer;
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < bufferSize; i++) {
      // Gentle, sparse organic rain pitter-patter
      if (Math.random() < 0.0012) {
        const dropLen = Math.floor(sampleRate * (0.006 + Math.random() * 0.012));
        const freq = 380 + Math.random() * 450;
        const decay = 0.006 + Math.random() * 0.01;
        for (let j = 0; j < dropLen && i + j < bufferSize; j++) {
          const t = j / sampleRate;
          data[i + j] += Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / decay) * (0.035 + Math.random() * 0.045);
        }
      }
    }
  }
  rainDropBuffer = buffer;
  return buffer;
}

/** Generates realistic organic trickling water brook / flowing liquid water texture */
function getWaterStreamBuffer(ctx) {
  if (waterStreamBuffer) return waterStreamBuffer;
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let b0 = 0, b1 = 0, b2 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.96 * b0 + white * 0.04;
      b1 = 0.94 * b1 + b0 * 0.06;
      b2 = 0.92 * b2 + b1 * 0.08;

      // Micro liquid ripples & bubbles
      if (Math.random() < 0.0025) {
        const freq = 280 + Math.random() * 260;
        const bLen = Math.floor(sampleRate * (0.012 + Math.random() * 0.02));
        for (let j = 0; j < bLen && i + j < bufferSize; j++) {
          const t = j / sampleRate;
          data[i + j] += Math.sin(2 * Math.PI * (freq + t * 350) * t) * Math.exp(-t / 0.01) * 0.035;
        }
      }

      data[i] += b2 * 1.6;
    }
  }

  waterStreamBuffer = buffer;
  return buffer;
}

/** Generates resonant liquid water droplet plops / drips into pools of water */
function getWaterPlopBuffer(ctx) {
  if (waterPlopBuffer) return waterPlopBuffer;
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < bufferSize; i++) {
      // Natural water plop: sine tone with upward pitch curve & liquid envelope
      if (Math.random() < 0.0016) {
        const baseFreq = 400 + Math.random() * 450;
        const riseFreq = baseFreq + 220 + Math.random() * 280;
        const plopLen = Math.floor(sampleRate * (0.022 + Math.random() * 0.03));
        const amp = 0.06 + Math.random() * 0.06;

        for (let j = 0; j < plopLen && i + j < bufferSize; j++) {
          const t = j / sampleRate;
          const prog = j / plopLen;
          const currentFreq = baseFreq + (riseFreq - baseFreq) * Math.sqrt(prog);
          const env = Math.sin(Math.PI * Math.min(1, prog * 3.5)) * Math.exp(-prog * 4.2);
          data[i + j] += Math.sin(2 * Math.PI * currentFreq * t) * env * amp;
        }
      }
    }
  }

  waterPlopBuffer = buffer;
  return buffer;
}

/** Generates natural acoustic wood crackle / lava bubbling pops */
function getFireCrackleBuffer(ctx) {
  if (fireCrackleBuffer) return fireCrackleBuffer;
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * 3;
  const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < bufferSize; i++) {
      if (Math.random() < 0.0018) {
        const popLen = Math.floor(sampleRate * (0.004 + Math.random() * 0.012));
        const freq = 600 + Math.random() * 1600;
        const amp = 0.2 + Math.random() * 0.45;
        for (let j = 0; j < popLen && i + j < bufferSize; j++) {
          const t = j / sampleRate;
          data[i + j] += (Math.random() * 2 - 1) * Math.exp(-t / 0.003) * amp +
                         Math.sin(2 * Math.PI * freq * t) * Math.exp(-t / 0.005) * amp * 0.5;
        }
      }
    }
  }
  fireCrackleBuffer = buffer;
  return buffer;
}

function stopCurrentAmbient() {
  if (ambientTimerId) {
    clearTimeout(ambientTimerId);
    ambientTimerId = null;
  }
  if (currentAmbientNodes.length > 0) {
    currentAmbientNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    currentAmbientNodes = [];
  }
}

/** Play occasional distant, natural woodland bird warbles */
function scheduleNaturalBirdChirp(ctx, destGain) {
  if (muted || currentAmbientMode !== "clear") return;

  const delay = 4500 + Math.random() * 7000;
  ambientTimerId = setTimeout(() => {
    if (muted || currentAmbientMode !== "clear") return;
    try {
      const now = ctx.currentTime;
      const baseFreq = 2200 + Math.random() * 1200;
      const chirpCount = 2 + Math.floor(Math.random() * 2);

      for (let i = 0; i < chirpCount; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const tStart = now + i * (0.12 + Math.random() * 0.08);
        const tDur = 0.07 + Math.random() * 0.05;

        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFreq + Math.random() * 300, tStart);
        osc.frequency.exponentialRampToValueAtTime(baseFreq + 800 + Math.random() * 400, tStart + tDur * 0.5);
        osc.frequency.exponentialRampToValueAtTime(baseFreq + 200, tStart + tDur);

        gain.gain.setValueAtTime(0.001, tStart);
        gain.gain.linearRampToValueAtTime(0.045, tStart + tDur * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, tStart + tDur);

        osc.connect(gain);
        gain.connect(destGain);

        osc.start(tStart);
        osc.stop(tStart + tDur + 0.02);
      }
    } catch (e) {}
    scheduleNaturalBirdChirp(ctx, destGain);
  }, delay);
}

/** Sets the dynamic background atmospheric audio with natural organic sound synthesis */
export function setAmbientMode(modeId = "clear") {
  currentAmbientMode = modeId;
  const ctx = getContext();
  if (!ctx) return;

  if (!ambientMasterGain) {
    ambientMasterGain = ctx.createGain();
    ambientMasterGain.gain.setValueAtTime((muted || ambientMuted) ? 0 : 0.32, ctx.currentTime);
    ambientMasterGain.connect(ctx.destination);
  }

  stopCurrentAmbient();

  const now = ctx.currentTime;
  const brownNoise = getBrownNoiseBuffer(ctx);

  if (modeId === "heavy_rain") {
    // 1. Soothing Flowing Liquid Water Stream / Brook Bed
    const waterSrc = ctx.createBufferSource();
    waterSrc.buffer = getWaterStreamBuffer(ctx);
    waterSrc.loop = true;

    const waterFilter = ctx.createBiquadFilter();
    waterFilter.type = "bandpass";
    waterFilter.frequency.setValueAtTime(380, now);
    waterFilter.Q.setValueAtTime(1.1, now);

    const waterGain = ctx.createGain();
    waterGain.gain.setValueAtTime(0.14, now);

    waterSrc.connect(waterFilter);
    waterFilter.connect(waterGain);
    waterGain.connect(ambientMasterGain);
    waterSrc.start(now);
    currentAmbientNodes.push(waterSrc, waterFilter, waterGain);

    // 2. Resonant Liquid Water Droplet "Plops" & Puddle Drips
    const plopSrc = ctx.createBufferSource();
    plopSrc.buffer = getWaterPlopBuffer(ctx);
    plopSrc.loop = true;

    const plopFilter = ctx.createBiquadFilter();
    plopFilter.type = "bandpass";
    plopFilter.frequency.setValueAtTime(850, now);
    plopFilter.Q.setValueAtTime(1.2, now);

    const plopGain = ctx.createGain();
    plopGain.gain.setValueAtTime(0.13, now);

    plopSrc.connect(plopFilter);
    plopFilter.connect(plopGain);
    plopGain.connect(ambientMasterGain);
    plopSrc.start(now);
    currentAmbientNodes.push(plopSrc, plopFilter, plopGain);

    // 3. Gentle Soft Rain Pitter-Patter
    const dropSrc = ctx.createBufferSource();
    dropSrc.buffer = getRainDropBuffer(ctx);
    dropSrc.loop = true;

    const dropFilter = ctx.createBiquadFilter();
    dropFilter.type = "lowpass";
    dropFilter.frequency.setValueAtTime(950, now);

    const dropGain = ctx.createGain();
    dropGain.gain.setValueAtTime(0.06, now);

    dropSrc.connect(dropFilter);
    dropFilter.connect(dropGain);
    dropGain.connect(ambientMasterGain);
    dropSrc.start(now);
    currentAmbientNodes.push(dropSrc, dropFilter, dropGain);

    // 4. Soft, Cozy Background Rain Haze Bed
    const rainSrc = ctx.createBufferSource();
    rainSrc.buffer = brownNoise;
    rainSrc.loop = true;

    const rainLowpass = ctx.createBiquadFilter();
    rainLowpass.type = "lowpass";
    rainLowpass.frequency.setValueAtTime(680, now);

    const rainHighpass = ctx.createBiquadFilter();
    rainHighpass.type = "highpass";
    rainHighpass.frequency.setValueAtTime(120, now);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.09, now);

    rainSrc.connect(rainLowpass);
    rainLowpass.connect(rainHighpass);
    rainHighpass.connect(rainGain);
    rainGain.connect(ambientMasterGain);
    rainSrc.start(now);
    currentAmbientNodes.push(rainSrc, rainLowpass, rainHighpass, rainGain);

    // 5. Very Soft, Distant Ocean Wave Swells
    const waveSrc = ctx.createBufferSource();
    waveSrc.buffer = brownNoise;
    waveSrc.loop = true;

    const waveFilter = ctx.createBiquadFilter();
    waveFilter.type = "lowpass";
    waveFilter.frequency.setValueAtTime(110, now);

    const waveLfo = ctx.createOscillator();
    waveLfo.frequency.setValueAtTime(0.07, now); // ~14 sec natural calm tide
    const waveLfoGain = ctx.createGain();
    waveLfoGain.gain.setValueAtTime(40, now);
    waveLfo.connect(waveLfoGain);
    waveLfoGain.connect(waveFilter.frequency);
    waveLfo.start(now);

    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.07, now);

    waveSrc.connect(waveFilter);
    waveFilter.connect(waveGain);
    waveGain.connect(ambientMasterGain);
    waveSrc.start(now);
    currentAmbientNodes.push(waveSrc, waveFilter, waveLfo, waveLfoGain, waveGain);

  } else if (modeId === "desert") {
    // Natural Desert Canyon Winds: Gentle warm breeze
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = brownNoise;
    windSrc.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.setValueAtTime(240, now);
    windFilter.Q.setValueAtTime(1.4, now);

    const windLfo = ctx.createOscillator();
    windLfo.frequency.setValueAtTime(0.12, now);
    const windLfoGain = ctx.createGain();
    windLfoGain.gain.setValueAtTime(120, now);
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    windLfo.start(now);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.14, now);

    windSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(ambientMasterGain);
    windSrc.start(now);
    currentAmbientNodes.push(windSrc, windFilter, windLfo, windLfoGain, windGain);

    // Subtle soft low ground draft
    const draftSrc = ctx.createBufferSource();
    draftSrc.buffer = brownNoise;
    draftSrc.loop = true;

    const draftFilter = ctx.createBiquadFilter();
    draftFilter.type = "lowpass";
    draftFilter.frequency.setValueAtTime(150, now);

    const draftGain = ctx.createGain();
    draftGain.gain.setValueAtTime(0.08, now);

    draftSrc.connect(draftFilter);
    draftFilter.connect(draftGain);
    draftGain.connect(ambientMasterGain);
    draftSrc.start(now);
    currentAmbientNodes.push(draftSrc, draftFilter, draftGain);

  } else if (modeId === "hell") {
    // Underworld Warm Gentle Magma Swell
    const magmaSrc = ctx.createBufferSource();
    magmaSrc.buffer = brownNoise;
    magmaSrc.loop = true;

    const magmaFilter = ctx.createBiquadFilter();
    magmaFilter.type = "lowpass";
    magmaFilter.frequency.setValueAtTime(120, now);

    const magmaGain = ctx.createGain();
    magmaGain.gain.setValueAtTime(0.16, now);

    magmaSrc.connect(magmaFilter);
    magmaFilter.connect(magmaGain);
    magmaGain.connect(ambientMasterGain);
    magmaSrc.start(now);
    currentAmbientNodes.push(magmaSrc, magmaFilter, magmaGain);

    // Natural Soft Wood/Lava Crackle
    const crackleSrc = ctx.createBufferSource();
    crackleSrc.buffer = getFireCrackleBuffer(ctx);
    crackleSrc.loop = true;

    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = "bandpass";
    crackleFilter.frequency.setValueAtTime(900, now);
    crackleFilter.Q.setValueAtTime(0.8, now);

    const crackleGain = ctx.createGain();
    crackleGain.gain.setValueAtTime(0.06, now);

    crackleSrc.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(ambientMasterGain);
    crackleSrc.start(now);
    currentAmbientNodes.push(crackleSrc, crackleFilter, crackleGain);

  } else if (modeId === "ice") {
    // Natural Glacial Wind: Peaceful calm arctic breeze
    const iceSrc = ctx.createBufferSource();
    iceSrc.buffer = brownNoise;
    iceSrc.loop = true;

    const iceFilter = ctx.createBiquadFilter();
    iceFilter.type = "bandpass";
    iceFilter.frequency.setValueAtTime(280, now);
    iceFilter.Q.setValueAtTime(1.5, now);

    const iceLfo = ctx.createOscillator();
    iceLfo.frequency.setValueAtTime(0.12, now);
    const iceLfoGain = ctx.createGain();
    iceLfoGain.gain.setValueAtTime(120, now);
    iceLfo.connect(iceLfoGain);
    iceLfoGain.connect(iceFilter.frequency);
    iceLfo.start(now);

    const iceGain = ctx.createGain();
    iceGain.gain.setValueAtTime(0.13, now);

    iceSrc.connect(iceFilter);
    iceFilter.connect(iceGain);
    iceGain.connect(ambientMasterGain);
    iceSrc.start(now);
    currentAmbientNodes.push(iceSrc, iceFilter, iceLfo, iceLfoGain, iceGain);

    // Deep soft sub-ice resonance
    const subIceSrc = ctx.createBufferSource();
    subIceSrc.buffer = brownNoise;
    subIceSrc.loop = true;
    const subIceFilter = ctx.createBiquadFilter();
    subIceFilter.type = "lowpass";
    subIceFilter.frequency.setValueAtTime(130, now);
    const subIceGain = ctx.createGain();
    subIceGain.gain.setValueAtTime(0.08, now);

    subIceSrc.connect(subIceFilter);
    subIceFilter.connect(subIceGain);
    subIceGain.connect(ambientMasterGain);
    subIceSrc.start(now);
    currentAmbientNodes.push(subIceSrc, subIceFilter, subIceGain);

  } else if (modeId === "heaven") {
    // Warm Acoustic Singing-Bowl / Celestial Harmonic Resonance
    const bowlTones = [174.61, 261.63, 392.0, 523.25];
    bowlTones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.045 / (idx + 1), now);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12 + idx * 0.04, now);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.015, now);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start(now);

      osc.connect(gain);
      gain.connect(ambientMasterGain);
      osc.start(now);
      currentAmbientNodes.push(osc, gain, lfo, lfoGain);
    });

    // Soft celestial airy shimmer
    const airSrc = ctx.createBufferSource();
    airSrc.buffer = brownNoise;
    airSrc.loop = true;
    const airFilter = ctx.createBiquadFilter();
    airFilter.type = "bandpass";
    airFilter.frequency.setValueAtTime(1100, now);
    airFilter.Q.setValueAtTime(4.0, now);
    const airGain = ctx.createGain();
    airGain.gain.setValueAtTime(0.12, now);

    airSrc.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(ambientMasterGain);
    airSrc.start(now);
    currentAmbientNodes.push(airSrc, airFilter, airGain);

  } else {
    // Clear Forest: Soft Woodland Tree Canopy Breeze & Distant Birds
    const forestBreeze = ctx.createBufferSource();
    forestBreeze.buffer = brownNoise;
    forestBreeze.loop = true;

    const breezeFilter = ctx.createBiquadFilter();
    breezeFilter.type = "lowpass";
    breezeFilter.frequency.setValueAtTime(380, now);

    const breezeLfo = ctx.createOscillator();
    breezeLfo.frequency.setValueAtTime(0.12, now);
    const breezeLfoGain = ctx.createGain();
    breezeLfoGain.gain.setValueAtTime(120, now);
    breezeLfo.connect(breezeLfoGain);
    breezeLfoGain.connect(breezeFilter.frequency);
    breezeLfo.start(now);

    const breezeGain = ctx.createGain();
    breezeGain.gain.setValueAtTime(0.32, now);

    forestBreeze.connect(breezeFilter);
    breezeFilter.connect(breezeGain);
    breezeGain.connect(ambientMasterGain);
    forestBreeze.start(now);
    currentAmbientNodes.push(forestBreeze, breezeFilter, breezeLfo, breezeLfoGain, breezeGain);

    // Schedule natural woodland bird calls
    scheduleNaturalBirdChirp(ctx, ambientMasterGain);
  }
}

/** Deep, natural rolling thunder rumble with soft atmospheric diffusion */
export function playThunderCrash() {
  vibrate([60, 40, 90, 50, 110]);
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const brownNoise = getBrownNoiseBuffer(ctx);

  // 1. Distant lightning air tear (soft acoustic rush, no harsh electronic crack)
  const tear = ctx.createBufferSource();
  tear.buffer = brownNoise;
  const tearFilter = ctx.createBiquadFilter();
  tearFilter.type = "bandpass";
  tearFilter.frequency.setValueAtTime(750, now);
  tearFilter.Q.setValueAtTime(1.5, now);

  const tearGain = ctx.createGain();
  tearGain.gain.setValueAtTime(0.001, now);
  tearGain.gain.linearRampToValueAtTime(0.28, now + 0.04);
  tearGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  tear.connect(tearFilter);
  tearFilter.connect(tearGain);
  tearGain.connect(ctx.destination);
  tear.start(now);
  tear.stop(now + 0.4);

  // 2. Deep acoustic rolling thunder sub-bass rumble
  const rumble = ctx.createBufferSource();
  rumble.buffer = brownNoise;
  const rumbleFilter = ctx.createBiquadFilter();
  rumbleFilter.type = "lowpass";
  rumbleFilter.frequency.setValueAtTime(130, now);
  rumbleFilter.frequency.linearRampToValueAtTime(55, now + 2.8);

  const rumbleGain = ctx.createGain();
  rumbleGain.gain.setValueAtTime(0.001, now);
  rumbleGain.gain.linearRampToValueAtTime(0.48, now + 0.18);
  rumbleGain.gain.linearRampToValueAtTime(0.35, now + 0.8);
  rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

  rumble.connect(rumbleFilter);
  rumbleFilter.connect(rumbleGain);
  rumbleGain.connect(ctx.destination);
  rumble.start(now);
  rumble.stop(now + 3.5);
}
