import * as THREE from "three";

import gsap from "gsap";

import { COLORS, TOKEN_HEIGHT } from "../game/constants.js";

import { baseWorldPosition, placementsFor } from "../game/rules.js";

import {
  playClick,
  playDiceRoll,
  playThunderCrash,
  playTokenCapture,
  playTokenFinish,
  playTokenHop,
  playTokenSpawn,
  playVictoryFanfare,
  setAmbientMode,
} from "../game/audio.js";

import { ANIMATION_KEYS } from "./animationManager.js";
import { createBoard } from "./board.js";
import { createCameraRig } from "./cameraRig.js";
import { createDice } from "./dice.js";
import { createEffectsSystem } from "./effects.js";
import { createForest } from "./forest.js";
import { createTokens } from "./tokens.js";
import { disposeMaterials } from "./materials.js";
import { celebration } from "../utils/celebrationEffects.js";

import {
  getSavedBrightness,
  getSavedQualityPreference,
  PerformanceMonitor,
  QUALITY_TIERS,
} from "./performanceManager.js";
import {
  WEATHER_PRESETS,
  TIME_OF_DAY_PRESETS,
  getSelectedWeather,
  saveSelectedWeather,
  getSelectedTimeOfDay,
  saveSelectedTimeOfDay,
  createWeatherParticles,
} from "./weatherManager.js";
import { createCelestialSystem } from "./celestial.js";

/**
 * Owns everything three.js. React never touches this directly
 * beyond mounting it and calling its methods; the rules live
 * in src/game and know nothing about it.
 *
 * Every animation returns a promise, so the turn machine can
 * simply await each step.
 */
export class LudoScene {
  constructor(container) {
    this.container = container;

    this.disposed = false;

    /** ids of tokens mid-flight, which placement sync leaves alone */
    this.animating = new Set();

    this.handlers = { tokenClick: null, diceClick: null };

    const isMobile = window.innerWidth < 768;

    const effectiveTier = getSavedQualityPreference();
    this.qualityTier = effectiveTier;

    /* scene */

    this.scene = new THREE.Scene();

    const skyColor = new THREE.Color("#203127");
    this.scene.background = skyColor;

    // Atmospheric forest fog (reduced density for crisp visibility)
    this.scene.fog = new THREE.Fog(
      skyColor,
      isMobile ? 38 : 35,
      isMobile ? 100 : 95
    );

    /* camera */

    this.camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      180,
    );

    this.camera.position.set(0, 17, 21);

    /* renderer */

    this.renderer = new THREE.WebGLRenderer({
      antialias: effectiveTier !== QUALITY_TIERS.LIGHT,
      powerPreference: "high-performance",
    });

    this.renderer.setSize(container.clientWidth, container.clientHeight);

    if (effectiveTier === QUALITY_TIERS.LIGHT) {
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(1.0);
    } else if (effectiveTier === QUALITY_TIERS.ULTRA) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3.0));
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // The base exposure the scene was tuned at; brightness is a
    // user multiplier applied on top of it (see setBrightness).
    this.baseExposure = isMobile ? 1.02 : 0.95;
    this.brightness = getSavedBrightness();
    this.renderer.toneMappingExposure = this.baseExposure * (this.brightness / 100);

    container.appendChild(this.renderer.domElement);

    /* lighting */

    this.hemiLight = new THREE.HemisphereLight("#c8d6c5", "#1b281f", isMobile ? 1.4 : 1.25);
    this.scene.add(this.hemiLight);

    // Cozy atmospheric ambient fill light
    this.ambientLight = new THREE.AmbientLight("#d4c4a8", isMobile ? 0.50 : 0.42);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight("#ffd8a8", 2.2);

    this.sunLight.position.set(-15, 28, 12);
    this.sunLight.castShadow = effectiveTier !== QUALITY_TIERS.LIGHT;
    const shadowMapSize =
      effectiveTier === QUALITY_TIERS.ULTRA ? 4096 : effectiveTier === QUALITY_TIERS.HIGH ? 2048 : 1024;
    this.sunLight.shadow.mapSize.width = shadowMapSize;
    this.sunLight.shadow.mapSize.height = shadowMapSize;
    this.sunLight.shadow.camera.left = -25;
    this.sunLight.shadow.camera.right = 25;
    this.sunLight.shadow.camera.top = 25;
    this.sunLight.shadow.camera.bottom = -25;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 70;
    this.sunLight.shadow.bias = -0.0003;

    this.scene.add(this.sunLight);

    // Cool blue-green fill from opposite side for forest depth
    this.fillLight = new THREE.DirectionalLight("#a4c8b0", 0.6);
    this.fillLight.position.set(12, 10, -14);
    this.scene.add(this.fillLight);

    // Warm ground bounce light
    this.bounceLight = new THREE.PointLight("#d4a96a", 0.5, 40);
    this.bounceLight.position.set(0, 0.5, 0);
    this.scene.add(this.bounceLight);

    // Focused Board Center Spotlight for Night / Midnight Play
    this.boardSpotLight = new THREE.SpotLight(0xffffff, 0, 48, Math.PI / 4.0, 0.5, 1.2);
    this.boardSpotLight.position.set(0, 22, 0);
    this.boardSpotLight.target.position.set(0, 0.5, 0);
    this.scene.add(this.boardSpotLight);
    this.scene.add(this.boardSpotLight.target);

    // 4 Focused Quadrant Spotlights for High-Contrast Vivid Night Gameplay
    this.quadrantSpotLights = [];
    const quadPositions = [
      { pos: [-3.2, 12, -3.2], target: [-3.2, 0.5, -3.2] }, // Red
      { pos: [3.2, 12, -3.2], target: [3.2, 0.5, -3.2] },   // Green
      { pos: [3.2, 12, 3.2], target: [3.2, 0.5, 3.2] },     // Yellow
      { pos: [-3.2, 12, 3.2], target: [-3.2, 0.5, 3.2] },   // Blue
    ];

    quadPositions.forEach((q) => {
      const qLight = new THREE.SpotLight(0xffffff, 0, 24, Math.PI / 3.8, 0.55, 1.4);
      qLight.position.set(...q.pos);
      qLight.target.position.set(...q.target);
      this.scene.add(qLight);
      this.scene.add(qLight.target);
      this.quadrantSpotLights.push(qLight);
    });

    /* celestial & atmosphere (3D Sun, Moon, Starfield) */
    this.celestial = createCelestialSystem(this.scene);

    /* weather & environment */
    this.weatherParticles = createWeatherParticles(this.scene);
    this.currentWeather = getSelectedWeather();
    this.currentTimeOfDay = getSelectedTimeOfDay();
    this.lightningTimer = 0;
    this.nextLightningTime = 3.5 + Math.random() * 4.5;
    this.applyEnvironment(this.currentWeather, this.currentTimeOfDay, false);

    /* contents */

    this.effects = createEffectsSystem(this.scene);

    const isNightInit = this.currentTimeOfDay === "night" || this.currentTimeOfDay === "dark_night";

    this.forest = createForest({ isMobile, qualityTier: effectiveTier });
    this.forest.setTheme(this.currentWeather, false);
    this.forest.setTimeOfDay?.(this.currentTimeOfDay, false);

    this.perfMonitor = new PerformanceMonitor(null);

    this.scene.add(this.forest.forest);
    this.scene.add(this.forest.ground);
    this.scene.add(this.forest.particles);

    this.board = createBoard();
    this.board.setTheme?.(this.currentWeather, false);
    this.board.setNightGlow?.(isNightInit, this.currentWeather, false);

    this.scene.add(this.board.boardGroup);

    this.tokens = createTokens(this.board.boardGroup);

    this.tokenMeshes = [];

    this.tokens.all.forEach((token) =>
      token.traverse((child) => {
        if (child.isMesh) this.tokenMeshes.push(child);
      }),
    );

    this.dice = createDice();

    this.scene.add(this.dice.diceGroup);
    this.scene.add(this.dice.turnDisc);

    /* input */

    this.rig = createCameraRig(this.camera, this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();

    this.pointer = new THREE.Vector2();

    this.hoveredToken = null;

    this.diceHovered = false;

    this.onClick = this.onClick.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onResize = this.onResize.bind(this);

    this.renderer.domElement.addEventListener("click", this.onClick);
    this.renderer.domElement.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("resize", this.onResize);

    /* loop */

    this.clock = new THREE.Clock();

    this.frame = null;

    this.renderLoop = this.renderLoop.bind(this);

    this.renderLoop();
  }

  /* ------------------------------------------------------ */
  /* loop                                                    */
  /* ------------------------------------------------------ */

  renderLoop() {
    if (this.disposed) return;

    this.frame = requestAnimationFrame(this.renderLoop);

    if (this.perfMonitor) {
      this.perfMonitor.tick(performance.now());
    }

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.forest.update(elapsedTime);

    this.celestial?.update(elapsedTime, this.camera);
    this.board?.update?.(elapsedTime);

    this.effects.update(delta);

    if (this.weatherParticles) {
      this.weatherParticles.update(delta, elapsedTime);
    }

    if (this.currentWeather === "heavy_rain") {
      this.lightningTimer += delta;
      if (this.lightningTimer >= this.nextLightningTime) {
        this.lightningTimer = 0;
        this.nextLightningTime = 3.5 + Math.random() * 5.0;
        this.triggerLightningFlash();
      }
    }

    if (this.tokens && typeof this.tokens.update === "function") {
      this.tokens.update(elapsedTime, delta);
    }

    this.rig.update();

    this.renderer.render(this.scene, this.camera);
  }

  setQualityTier(tier) {
    this.qualityTier = tier;
    const isMobile = window.innerWidth < 768;

    if (tier === QUALITY_TIERS.LIGHT) {
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(1.0);
    } else if (tier === QUALITY_TIERS.ULTRA) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3.0));
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    }

    if (this.forest) {
      this.scene.remove(this.forest.forest);
      this.scene.remove(this.forest.ground);
      this.scene.remove(this.forest.particles);
      this.forest.dispose();

      this.forest = createForest({ isMobile, qualityTier: tier });
      this.forest.setTheme(this.currentWeather, false);
      this.scene.add(this.forest.forest);
      this.scene.add(this.forest.ground);
      this.scene.add(this.forest.particles);
    }
  }

  onResize() {
    const { clientWidth, clientHeight } = this.container;

    if (!clientWidth || !clientHeight) return;

    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(clientWidth, clientHeight);

    const maxDpr =
      this.qualityTier === QUALITY_TIERS.LIGHT ? 1.0 : this.qualityTier === QUALITY_TIERS.ULTRA ? 3.0 : 2.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
  }

  /** Brightness is a 60–140% exposure multiplier over the scene's base look. */
  setBrightness(percent) {
    this.brightness = percent;
    this.renderer.toneMappingExposure = this.baseExposure * (percent / 100);
  }

  /* ------------------------------------------------------ */
  /* input                                                   */
  /* ------------------------------------------------------ */

  updatePointer(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
  }

  syncActiveControllers(controllers) {
    this.tokens?.syncActiveControllers(controllers);
  }

  pickToken() {
    const activeTokens = this.tokens.all.filter((t) => t.visible);
    const hits = this.raycaster.intersectObjects(activeTokens, true);

    if (!hits.length) return null;

    let object = hits[0].object;

    while (object && !object.userData?.id) object = object.parent;

    return object;
  }

  onClick(event) {
    this.updatePointer(event);

    const diceTargets = [
      this.dice.diceMesh,
      ...(this.dice.clickableMeshes || []),
    ];
    if (this.raycaster.intersectObjects(diceTargets, true).length) {
      playClick();
      this.handlers.diceClick?.();
      return;
    }

    const token = this.pickToken();

    if (token) {
      playClick();
      this.handlers.tokenClick?.(token.userData.id);
    }
  }

  onPointerMove(event) {
    this.updatePointer(event);

    const diceTargets = [
      this.dice.diceMesh,
      ...(this.dice.clickableMeshes || []),
    ];
    const overDice =
      this.raycaster.intersectObjects(diceTargets, true).length > 0;

    if (overDice !== this.diceHovered) {
      this.diceHovered = overDice;
      this.dice.setHovered(overDice);
    }

    const token = overDice ? null : this.pickToken();

    if (token === this.hoveredToken) {
      this.renderer.domElement.style.cursor =
        overDice || this.hoveredToken ? "pointer" : "default";
      return;
    }

    if (this.hoveredToken) {
      const prevBase = this.hoveredToken.userData.baseScale || 1.0;
      gsap.to(this.hoveredToken.scale, {
        x: prevBase,
        y: prevBase,
        z: prevBase,
        duration: 0.2,
      });
    }

    this.hoveredToken = token;

    if (token) {
      const base = token.userData.baseScale || 1.0;
      const targetScale = base * 1.12;
      gsap.to(token.scale, {
        x: targetScale,
        y: targetScale,
        z: targetScale,
        duration: 0.2,
        ease: "back.out(2)",
      });
    }

    this.renderer.domElement.style.cursor =
      overDice || token ? "pointer" : "default";
  }

  onTokenClick(handler) {
    this.handlers.tokenClick = handler;
  }

  onDiceClick(handler) {
    this.handlers.diceClick = handler;
  }

  /* ------------------------------------------------------ */
  /* game-facing API                                         */
  /* ------------------------------------------------------ */

  setCameraAngle(mode) {
    if (this.forest) {
      this.forest.forest.visible = mode !== "2d";
    }

    const isMobile = window.innerWidth < 768;

    switch (mode) {
      case "2d":
        this.rig.setAngle(1.48, 0, isMobile ? 14.5 : 13.8, 0);
        break;
      case "close":
      case "closest":
        this.rig.setAngle(-0.05, 0, 8.5, 2.0);
        break;
      case "top":
        this.rig.setAngle(1.15, 0, isMobile ? 16.5 : 15.5, 11);
        break;
      case "red":
        this.rig.setAngle(0.2, -Math.PI / 2, isMobile ? 17.5 : 16.5, 11);
        break;
      case "green":
        this.rig.setAngle(0.2, 0, isMobile ? 17.5 : 16.5, 11);
        break;
      case "yellow":
        this.rig.setAngle(0.2, Math.PI / 2, isMobile ? 17.5 : 16.5, 11);
        break;
      case "blue":
        this.rig.setAngle(0.2, Math.PI, isMobile ? 17.5 : 16.5, 11);
        break;
      case "3d":
      case "default":
      default:
        this.rig.setAngle(isMobile ? 0.38 : 0.08, 0, isMobile ? 19.2 : 18.2, isMobile ? 12.8 : 11.2);
        break;
    }
  }

  rollDice(value) {
    playDiceRoll();
    return this.dice.roll(value);
  }

  setTurnColor(color) {
    this.dice.setTurnColor(color);
  }

  setCharacterPawn(charId) {
    return this.tokens?.setCharacter(charId);
  }

  /** Shows the pulsing ring under exactly these tokens. */
  setHighlights(tokenIds) {
    const wanted = new Set(tokenIds);

    for (const token of this.tokens.all) {
      const { ring, id } = token.userData;

      const on = wanted.has(id);

      gsap.killTweensOf(ring.scale);
      gsap.killTweensOf(ring.rotation);

      ring.scale.set(1, 1, 1);
      ring.visible = on;

      if (on) {
        gsap.to(ring.scale, {
          x: 1.25,
          y: 1.25,
          z: 1.25,
          duration: 0.55,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        gsap.to(ring.rotation, {
          z: Math.PI * 2,
          duration: 3.5,
          repeat: -1,
          ease: "none",
        });
      }
    }
  }

  /**
   * Snaps or slides every token to where the given game state
   * says it should be, spreading any stack and shrinking stacked tokens.
   */
  syncPlacements(tokens, animate = false) {
    const placements = placementsFor(tokens);

    for (const [id, position] of placements) {
      if (this.animating.has(id)) continue;

      const mesh = this.tokens.byId.get(id);

      if (!mesh) continue;

      const count = position.count || 1;
      const targetScale = count > 1 ? (count === 2 ? 0.76 : 0.66) : 1.0;
      mesh.userData.baseScale = targetScale;

      if (!animate) {
        gsap.killTweensOf(mesh.position);
        gsap.killTweensOf(mesh.scale);
        mesh.position.set(position.x, TOKEN_HEIGHT, position.z);
        mesh.scale.set(targetScale, targetScale, targetScale);
        continue;
      }

      gsap.to(mesh.position, {
        x: position.x,
        z: position.z,
        duration: 0.22,
        ease: "power2.inOut",
      });

      gsap.to(mesh.scale, {
        x: targetScale,
        y: targetScale,
        z: targetScale,
        duration: 0.22,
        ease: "power2.inOut",
      });
    }
  }

  /** Resets every piece to its yard slot. */
  resetTokens(tokens) {
    for (const mesh of this.tokens.all) {
      gsap.killTweensOf(mesh.position);
      gsap.killTweensOf(mesh.scale);
      mesh.userData.baseScale = 1.0;
      mesh.scale.set(1, 1, 1);
    }

    this.animating.clear();
    this.hoveredToken = null;

    this.setHighlights([]);

    // Staggered smooth parabolic flight for every token returning to yard
    this.tokens.all.forEach((mesh, index) => {
      const { color, slot } = mesh.userData;
      const target = baseWorldPosition({ color, slot, position: -1 });

      gsap
        .timeline({ delay: index * 0.03 })
        .to(mesh.position, { y: 1.5, duration: 0.25, ease: "power2.out" })
        .to(mesh.position, {
          x: target.x,
          z: target.z,
          duration: 0.4,
          ease: "power2.inOut",
        })
        .to(mesh.position, {
          y: TOKEN_HEIGHT,
          duration: 0.28,
          ease: "bounce.out",
          onComplete: () => {
            this.effects.triggerHopRipple(target, COLORS[color]);
          },
        });
    });

    this.rig.reset();
  }

  /**
   * Plays a move produced by applyMove, then settles every
   * token onto the resulting state.
   */
  async playMove(result, nextTokens) {
    const mesh = this.tokens.byId.get(result.tokenId);

    if (!mesh) return;

    const { color, slot } = mesh.userData;

    this.animating.add(result.tokenId);

    if (result.entered) await this.enterFromYard(mesh, color, slot);
    else await this.hopAlong(mesh, color, slot, result.path);

    this.animating.delete(result.tokenId);

    if (result.finished) {
      playTokenFinish();
      mesh.userData.animator?.play(ANIMATION_KEYS.TALKING, { loop: THREE.LoopRepeat, duration: 0.3 });
      const pos = baseWorldPosition({ color, slot, position: result.to });
      this.effects.triggerConfetti({ x: pos.x, y: TOKEN_HEIGHT + 0.5, z: pos.z }, 85);
      celebration.triggerCenterConfetti(1.25);
    }

    if (result.won) {
      playVictoryFanfare();
      this.effects.triggerConfetti({ x: 0, y: 2, z: 0 }, 180);
      celebration.startVictoryCelebration(color);
    }

    // knocked-out pieces fly home while the turn continues
    const flights = result.captured.map((id) => this.sendHome(id));

    this.syncPlacements(nextTokens, true);

    await Promise.all(flights);

    this.syncPlacements(nextTokens, true);
  }

  enterFromYard(mesh, color, slot) {
    const target = baseWorldPosition({ color, slot, position: 0 });

    gsap.killTweensOf(mesh.position);
    mesh.userData.isMoving = true;
    mesh.userData.animator?.play(ANIMATION_KEYS.JUMP, { duration: 0.2 });

    playTokenSpawn();

    return new Promise((resolve) => {
      const dx = target.x - mesh.position.x;
      const dz = target.z - mesh.position.z;
      const angle = Math.atan2(dx, dz);

      gsap
        .timeline({
          onComplete: () => {
            this.effects.triggerHopRipple(target, COLORS[color]);
            this.triggerSquashBounce(mesh);
            mesh.userData.isMoving = false;
            mesh.userData.animator?.play(ANIMATION_KEYS.IDLE, { duration: 0.3 });
            resolve();
          },
        })
        .to(mesh.rotation, { y: angle, duration: 0.2, ease: "power1.out" }, 0)
        .to(mesh.position, { y: 1.6, duration: 0.22, ease: "power2.out" })
        .to(mesh.position, {
          x: target.x,
          z: target.z,
          duration: 0.4,
          ease: "power2.inOut",
        })
        .to(mesh.position, {
          y: TOKEN_HEIGHT,
          duration: 0.42,
          ease: "bounce.out",
        });
    });
  }

  /** One hop per square, so a move reads as a count. */
  hopAlong(mesh, color, slot, path) {
    gsap.killTweensOf(mesh.position);
    mesh.userData.isMoving = true;
    mesh.userData.animator?.play(ANIMATION_KEYS.RUNNING, { loop: THREE.LoopRepeat, timeScale: 1.4 });

    return new Promise((resolve) => {
      const timeline = gsap.timeline({
        onComplete: () => {
          mesh.userData.isMoving = false;
          mesh.userData.animator?.play(ANIMATION_KEYS.IDLE, { duration: 0.3 });
          resolve();
        },
      });

      path.forEach((position, stepIndex) => {
        const target = baseWorldPosition({ color, slot, position });

        timeline.to(mesh.position, {
          x: target.x,
          z: target.z,
          duration: 0.2,
          ease: "power1.inOut",
          onStart: () => {
            playTokenHop(stepIndex, path.length);
            const dx = target.x - mesh.position.x;
            const dz = target.z - mesh.position.z;
            if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
              const angle = Math.atan2(dx, dz);
              gsap.to(mesh.rotation, { y: angle, duration: 0.12, ease: "power1.out" });
            }
          },
        });

        timeline.to(
          mesh.position,
          { y: 1.15, duration: 0.1, ease: "power2.out" },
          "<",
        );

        timeline.to(mesh.position, {
          y: TOKEN_HEIGHT,
          duration: 0.1,
          ease: "bounce.out",
          onComplete: () => {
            this.effects.triggerHopRipple(target, COLORS[color]);
            this.triggerSquashBounce(mesh);
          },
        });
      });
    });
  }

  /** Squash on landing impact, then spring back smoothly */
  triggerSquashBounce(mesh) {
    const baseScale = mesh.userData.baseScale || 1.0;
    gsap.killTweensOf(mesh.scale);
    gsap
      .timeline()
      .to(mesh.scale, {
        x: baseScale * 1.14,
        y: baseScale * 0.82,
        z: baseScale * 1.14,
        duration: 0.07,
        ease: "power2.out",
      })
      .to(mesh.scale, {
        x: baseScale,
        y: baseScale,
        z: baseScale,
        duration: 0.18,
        ease: "back.out(2.2)",
      });
  }

  sendHome(tokenId) {
    const mesh = this.tokens.byId.get(tokenId);

    if (!mesh) return Promise.resolve();

    const { color, slot } = mesh.userData;

    const target = baseWorldPosition({ color, slot, position: -1 });

    this.animating.add(tokenId);

    gsap.killTweensOf(mesh.position);

    playTokenCapture();

    return new Promise((resolve) => {
      gsap
        .timeline({
          onComplete: () => {
            this.effects.triggerHopRipple(target, "#ff4444");
            this.animating.delete(tokenId);
            resolve();
          },
        })
        .to(mesh.position, { y: 1.6, duration: 0.2, ease: "power2.out" })
        .to(mesh.position, {
          x: target.x,
          z: target.z,
          duration: 0.5,
          ease: "power2.inOut",
        })
        .to(mesh.position, {
          y: TOKEN_HEIGHT,
          duration: 0.3,
          ease: "bounce.out",
        });
    });
  }

  /* ------------------------------------------------------ */
  /* weather & environment                                   */
  /* ------------------------------------------------------ */

  setWeather(weatherId) {
    this.currentWeather = weatherId;
    saveSelectedWeather(weatherId);
    this.applyEnvironment(weatherId, this.currentTimeOfDay, true);
  }

  setTimeOfDay(timeId) {
    this.currentTimeOfDay = timeId;
    saveSelectedTimeOfDay(timeId);
    this.applyEnvironment(this.currentWeather, timeId, true);
  }

  getWeather() {
    return this.currentWeather;
  }

  getTimeOfDay() {
    return this.currentTimeOfDay;
  }

  triggerLightningFlash() {
    if (this.disposed || !this.ambientLight || !this.sunLight) return;
    playThunderCrash();
    const baseAmb = this.targetAmbientIntensity || 0.35;
    const baseSun = this.targetSunIntensity || 0.4;

    const tl = gsap.timeline();
    tl.to(this.ambientLight, {
      intensity: baseAmb * 3.8,
      duration: 0.05,
      ease: "power1.in",
    })
      .to(this.ambientLight, { intensity: baseAmb * 1.3, duration: 0.04 })
      .to(this.ambientLight, {
        intensity: baseAmb * 4.8,
        duration: 0.07,
        ease: "power2.out",
      })
      .to(this.ambientLight, {
        intensity: baseAmb,
        duration: 0.45,
        ease: "power2.out",
      });

    gsap.to(this.sunLight, {
      intensity: baseSun * 3.2,
      duration: 0.08,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
    });
  }

  applyEnvironment(weatherId, timeId, animated = true) {
    const weather =
      WEATHER_PRESETS.find((w) => w.id === weatherId) || WEATHER_PRESETS[0];
    const time =
      TIME_OF_DAY_PRESETS.find((t) => t.id === timeId) ||
      TIME_OF_DAY_PRESETS[0];

    const isMobile = window.innerWidth < 768;

    // Target colors
    const skyHex =
      time.skyColorOverride?.[weatherId] ||
      time.skyColorOverride?.clear ||
      weather.skyColor;
    const fogHex =
      time.fogColorOverride?.[weatherId] ||
      time.fogColorOverride?.clear ||
      weather.fogColor;

    const targetSky = new THREE.Color(skyHex);
    const targetFog = new THREE.Color(fogHex);
    const targetSunCol = new THREE.Color(time.sunColor || weather.sunColor);
    const targetAmbientCol = new THREE.Color(time.ambientColor || weather.ambientColor);
    const targetHemiSky = new THREE.Color(skyHex);
    const targetHemiGround = new THREE.Color(weather.hemiGround);
    const targetFillCol = new THREE.Color(weather.fillColor);
    const targetBounceCol = new THREE.Color(weather.bounceColor);

    // Target intensities
    const targetAmbIntensity =
      (isMobile ? 0.5 : 0.42) *
      weather.ambientIntensityMult *
      time.ambientMult;
    const targetSunIntensity = time.sunIntensity * weather.sunIntensityMult;
    const targetHemiIntensity =
      (isMobile ? 1.4 : 1.25) *
      weather.ambientIntensityMult *
      time.ambientMult;
    const targetFillIntensity =
      0.6 * weather.sunIntensityMult * time.ambientMult;
    const targetBounceIntensity =
      0.5 * weather.ambientIntensityMult * time.ambientMult;

    this.targetAmbientIntensity = targetAmbIntensity;
    this.targetSunIntensity = targetSunIntensity;

    const [targetSunX, targetSunY, targetSunZ] = time.sunPosition;
    const dur = animated ? 0.85 : 0;
    const ease = "power2.out";

    const isNight = timeId === "night" || timeId === "dark_night";
    const targetBoardSpotIntensity = isNight ? (timeId === "dark_night" ? 4.8 : 3.4) : 0.0;
    const targetQuadSpotIntensity = isNight ? (timeId === "dark_night" ? 2.2 : 1.6) : 0.0;
    const targetSpotCol = new THREE.Color(timeId === "dark_night" ? "#ffffff" : "#f1f5f9");

    if (!animated) {
      if (this.scene.fog) {
        this.scene.fog.color.copy(targetFog);
        this.scene.fog.near = weather.fogNear;
        this.scene.fog.far = weather.fogFar;
      }
      this.scene.background = targetSky;
      if (this.ambientLight) {
        this.ambientLight.color.copy(targetAmbientCol);
        this.ambientLight.intensity = targetAmbIntensity;
      }
      if (this.sunLight) {
        this.sunLight.color.copy(targetSunCol);
        this.sunLight.intensity = targetSunIntensity;
        this.sunLight.position.set(targetSunX, targetSunY, targetSunZ);
      }
      if (this.hemiLight) {
        this.hemiLight.color.copy(targetHemiSky);
        this.hemiLight.groundColor.copy(targetHemiGround);
        this.hemiLight.intensity = targetHemiIntensity;
      }
      if (this.fillLight) {
        this.fillLight.color.copy(targetFillCol);
        this.fillLight.intensity = targetFillIntensity;
      }
      if (this.bounceLight) {
        this.bounceLight.color.copy(targetBounceCol);
        this.bounceLight.intensity = targetBounceIntensity;
      }
      if (this.boardSpotLight) {
        this.boardSpotLight.color.copy(targetSpotCol);
        this.boardSpotLight.intensity = targetBoardSpotIntensity;
      }
      this.quadrantSpotLights?.forEach((ql) => {
        ql.color.copy(targetSpotCol);
        ql.intensity = targetQuadSpotIntensity;
      });

      this.weatherParticles?.setWeatherMode(weatherId);
      this.celestial?.setTimeOfDay(timeId, weatherId, false);
      this.forest?.setTheme(weatherId, false);
      this.forest?.setTimeOfDay?.(timeId, false);
      this.board?.setTheme?.(weatherId, false);
      this.board?.setNightGlow?.(isNight, weatherId, false);
      setAmbientMode(weatherId);
      return;
    }

    // Animated transition
    if (this.scene.fog) {
      gsap.to(this.scene.fog.color, {
        r: targetFog.r,
        g: targetFog.g,
        b: targetFog.b,
        duration: dur,
        ease,
      });
      gsap.to(this.scene.fog, {
        near: weather.fogNear,
        far: weather.fogFar,
        duration: dur,
        ease,
      });
    }

    if (this.scene.background && this.scene.background.isColor) {
      gsap.to(this.scene.background, {
        r: targetSky.r,
        g: targetSky.g,
        b: targetSky.b,
        duration: dur,
        ease,
      });
    } else {
      this.scene.background = targetSky;
    }

    if (this.ambientLight) {
      gsap.to(this.ambientLight.color, {
        r: targetAmbientCol.r,
        g: targetAmbientCol.g,
        b: targetAmbientCol.b,
        duration: dur,
        ease,
      });
      gsap.to(this.ambientLight, {
        intensity: targetAmbIntensity,
        duration: dur,
        ease,
      });
    }

    if (this.sunLight) {
      gsap.to(this.sunLight.color, {
        r: targetSunCol.r,
        g: targetSunCol.g,
        b: targetSunCol.b,
        duration: dur,
        ease,
      });
      gsap.to(this.sunLight, {
        intensity: targetSunIntensity,
        duration: dur,
        ease,
      });
      gsap.to(this.sunLight.position, {
        x: targetSunX,
        y: targetSunY,
        z: targetSunZ,
        duration: dur * 1.2,
        ease,
      });
    }

    if (this.hemiLight) {
      gsap.to(this.hemiLight.color, {
        r: targetHemiSky.r,
        g: targetHemiSky.g,
        b: targetHemiSky.b,
        duration: dur,
        ease,
      });
      gsap.to(this.hemiLight.groundColor, {
        r: targetHemiGround.r,
        g: targetHemiGround.g,
        b: targetHemiGround.b,
        duration: dur,
        ease,
      });
      gsap.to(this.hemiLight, {
        intensity: targetHemiIntensity,
        duration: dur,
        ease,
      });
    }

    if (this.fillLight) {
      gsap.to(this.fillLight.color, {
        r: targetFillCol.r,
        g: targetFillCol.g,
        b: targetFillCol.b,
        duration: dur,
        ease,
      });
      gsap.to(this.fillLight, {
        intensity: targetFillIntensity,
        duration: dur,
        ease,
      });
    }

    if (this.bounceLight) {
      gsap.to(this.bounceLight.color, {
        r: targetBounceCol.r,
        g: targetBounceCol.g,
        b: targetBounceCol.b,
        duration: dur,
        ease,
      });
      gsap.to(this.bounceLight, {
        intensity: targetBounceIntensity,
        duration: dur,
        ease,
      });
    }

    if (this.boardSpotLight) {
      gsap.to(this.boardSpotLight.color, {
        r: targetSpotCol.r,
        g: targetSpotCol.g,
        b: targetSpotCol.b,
        duration: dur,
        ease,
      });
      gsap.to(this.boardSpotLight, {
        intensity: targetBoardSpotIntensity,
        duration: dur,
        ease,
      });
    }

    this.quadrantSpotLights?.forEach((ql) => {
      gsap.to(ql.color, {
        r: targetSpotCol.r,
        g: targetSpotCol.g,
        b: targetSpotCol.b,
        duration: dur,
        ease,
      });
      gsap.to(ql, {
        intensity: targetQuadSpotIntensity,
        duration: dur,
        ease,
      });
    });

    this.weatherParticles?.setWeatherMode(weatherId);
    this.celestial?.setTimeOfDay(timeId, weatherId, true);
    this.forest?.setTheme(weatherId, true);
    this.forest?.setTimeOfDay?.(timeId, true);
    this.board?.setTheme?.(weatherId, true);
    this.board?.setNightGlow?.(isNight, weatherId, true);
    setAmbientMode(weatherId);
  }

  /* ------------------------------------------------------ */
  /* teardown                                                */
  /* ------------------------------------------------------ */

  dispose() {
    if (this.disposed) return;

    this.disposed = true;

    if (this.frame) cancelAnimationFrame(this.frame);

    this.boardFloat?.kill();

    this.tokens.all.forEach((token) => {
      gsap.killTweensOf(token.position);
      gsap.killTweensOf(token.scale);
      gsap.killTweensOf(token.userData.ring.scale);
    });

    this.renderer.domElement.removeEventListener("click", this.onClick);
    this.renderer.domElement.removeEventListener(
      "pointermove",
      this.onPointerMove,
    );
    window.removeEventListener("resize", this.onResize);

    this.celestial?.dispose();
    this.weatherParticles?.dispose();
    this.effects?.dispose();
    this.rig.dispose();
    this.dice.dispose();
    this.tokens.dispose();
    this.board.dispose();
    this.forest.dispose();

    disposeMaterials();

    this.renderer.dispose();

    // StrictMode mounts twice in development, so hand the WebGL
    // context back rather than leaking one per mount.
    this.renderer.forceContextLoss?.();

    this.renderer.domElement.remove();
  }
}
