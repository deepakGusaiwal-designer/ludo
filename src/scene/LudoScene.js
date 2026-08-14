import * as THREE from "three";

import gsap from "gsap";

import { COLORS, TOKEN_HEIGHT } from "../game/constants.js";

import { baseWorldPosition, placementsFor } from "../game/rules.js";

import {
  playClick,
  playDiceRoll,
  playTokenCapture,
  playTokenFinish,
  playTokenHop,
  playTokenSpawn,
  playVictoryFanfare,
} from "../game/audio.js";

import { createBoard } from "./board.js";
import { createCameraRig } from "./cameraRig.js";
import { createDice } from "./dice.js";
import { createEffectsSystem } from "./effects.js";
import { createForest } from "./forest.js";
import { createTokens } from "./tokens.js";
import { disposeMaterials } from "./materials.js";

import {
  detectHardwareTier,
  getSavedQualityPreference,
  PerformanceMonitor,
  QUALITY_TIERS,
} from "./performanceManager.js";

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

    const savedQuality = getSavedQualityPreference();
    const effectiveTier = savedQuality === QUALITY_TIERS.AUTO ? detectHardwareTier() : savedQuality;
    this.qualityTier = effectiveTier;

    /* scene */

    this.scene = new THREE.Scene();

    const skyColor = new THREE.Color("#203127");
    this.scene.background = skyColor;

    // Atmospheric forest fog
    this.scene.fog = new THREE.Fog(skyColor, isMobile ? 26 : 20, isMobile ? 75 : 60);

    /* camera */

    this.camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );

    this.camera.position.set(0, 17, 21);

    /* renderer */

    this.renderer = new THREE.WebGLRenderer({
      antialias: effectiveTier !== QUALITY_TIERS.LOW,
      powerPreference: "high-performance",
    });

    this.renderer.setSize(container.clientWidth, container.clientHeight);

    if (effectiveTier === QUALITY_TIERS.LOW) {
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(1.0);
    } else if (effectiveTier === QUALITY_TIERS.MEDIUM) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3.0));
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = isMobile ? 1.02 : 0.95;

    container.appendChild(this.renderer.domElement);

    /* lighting */

    this.scene.add(new THREE.HemisphereLight("#c8d6c5", "#1b281f", isMobile ? 1.4 : 1.25));

    // Cozy atmospheric ambient fill light
    const ambient = new THREE.AmbientLight("#d4c4a8", isMobile ? 0.50 : 0.42);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight("#ffd8a8", 2.2);

    sun.position.set(-15, 28, 12);
    sun.castShadow = effectiveTier !== QUALITY_TIERS.LOW;
    sun.shadow.mapSize.width = effectiveTier === QUALITY_TIERS.HIGH ? 2048 : 1024;
    sun.shadow.mapSize.height = effectiveTier === QUALITY_TIERS.HIGH ? 2048 : 1024;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 70;
    sun.shadow.bias = -0.0003;

    this.scene.add(sun);

    // Cool blue-green fill from opposite side for forest depth
    const fill = new THREE.DirectionalLight("#a4c8b0", 0.6);
    fill.position.set(12, 10, -14);
    this.scene.add(fill);

    // Warm ground bounce light
    const bounce = new THREE.PointLight("#d4a96a", 0.5, 40);
    bounce.position.set(0, 0.5, 0);
    this.scene.add(bounce);

    /* contents */

    this.effects = createEffectsSystem(this.scene);

    this.forest = createForest({ isMobile, qualityTier: effectiveTier });

    this.perfMonitor = new PerformanceMonitor(() => {
      if (this.qualityTier !== QUALITY_TIERS.LOW) {
        this.setQualityTier(QUALITY_TIERS.LOW);
      }
    });

    this.scene.add(this.forest.forest);
    this.scene.add(this.forest.ground);
    this.scene.add(this.forest.particles);

    this.board = createBoard();

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

    this.forest.update(this.clock.getElapsedTime());

    this.effects.update(delta);

    this.rig.update();

    this.renderer.render(this.scene, this.camera);
  }

  setQualityTier(tier) {
    this.qualityTier = tier;
    const isMobile = window.innerWidth < 768;

    if (tier === QUALITY_TIERS.LOW) {
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(1.0);
    } else if (tier === QUALITY_TIERS.MEDIUM) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3.0));
    }

    if (this.forest) {
      this.scene.remove(this.forest.forest);
      this.scene.remove(this.forest.ground);
      this.scene.remove(this.forest.particles);
      this.forest.dispose();

      this.forest = createForest({ isMobile, qualityTier: tier });
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

    const maxDpr = this.qualityTier === QUALITY_TIERS.LOW ? 1.0 : this.qualityTier === QUALITY_TIERS.MEDIUM ? 1.5 : 3.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
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

  pickToken() {
    const hits = this.raycaster.intersectObjects(this.tokenMeshes);

    if (!hits.length) return null;

    let object = hits[0].object;

    while (object && !object.userData?.id) object = object.parent;

    return object;
  }

  onClick(event) {
    this.updatePointer(event);

    if (this.raycaster.intersectObject(this.dice.diceMesh).length) {
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

    const overDice =
      this.raycaster.intersectObject(this.dice.diceMesh).length > 0;

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
    switch (mode) {
      case "close":
      case "closest":
        this.rig.setAngle(-0.05, 0, 9.5, 2.2);
        break;
      case "top":
      case "2d":
        this.rig.setAngle(1.15, 0, 24, 14);
        break;
      case "red":
        this.rig.setAngle(0.2, -Math.PI / 2, 25, 14);
        break;
      case "green":
        this.rig.setAngle(0.2, 0, 25, 14);
        break;
      case "yellow":
        this.rig.setAngle(0.2, Math.PI / 2, 25, 14);
        break;
      case "blue":
        this.rig.setAngle(0.2, Math.PI, 25, 14);
        break;
      case "3d":
      case "default":
      default:
        this.rig.setAngle(0, 0, 27, 14);
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
      const pos = baseWorldPosition({ color, slot, position: result.to });
      this.effects.triggerConfetti({ x: pos.x, y: TOKEN_HEIGHT + 0.5, z: pos.z }, 45);
    }

    if (result.won) {
      playVictoryFanfare();
      this.effects.triggerConfetti({ x: 0, y: 2, z: 0 }, 120);
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

    playTokenSpawn();

    return new Promise((resolve) => {
      gsap
        .timeline({
          onComplete: () => {
            this.effects.triggerHopRipple(target, COLORS[color]);
            this.triggerSquashBounce(mesh);
            resolve();
          },
        })
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

    return new Promise((resolve) => {
      const timeline = gsap.timeline({ onComplete: resolve });

      path.forEach((position, stepIndex) => {
        const target = baseWorldPosition({ color, slot, position });

        timeline.to(mesh.position, {
          x: target.x,
          z: target.z,
          duration: 0.2,
          ease: "power1.inOut",
          onStart: () => {
            playTokenHop(stepIndex, path.length);
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
