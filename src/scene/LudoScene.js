import * as THREE from "three";

import gsap from "gsap";

import { TOKEN_HEIGHT } from "../game/constants.js";

import { baseWorldPosition, placementsFor } from "../game/rules.js";

import { createBoard } from "./board.js";
import { createCameraRig } from "./cameraRig.js";
import { createDice } from "./dice.js";
import { createForest } from "./forest.js";
import { createTokens } from "./tokens.js";
import { disposeMaterials } from "./materials.js";

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

    /* scene */

    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color("#304338");

    this.scene.fog = new THREE.Fog(new THREE.Color("#304338"), 18, 58);

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
      antialias: true,
      powerPreference: "high-performance",
    });

    this.renderer.setSize(container.clientWidth, container.clientHeight);

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75),
    );

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    container.appendChild(this.renderer.domElement);

    /* lighting */

    this.scene.add(new THREE.HemisphereLight("#dcebd5", "#28362b", 1.7));

    const sun = new THREE.DirectionalLight("#ffe4b8", 3);

    sun.position.set(-15, 28, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 70;
    sun.shadow.bias = -0.0003;

    this.scene.add(sun);

    /* contents */

    this.forest = createForest({ isMobile });

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

    this.boardFloat = gsap.to(this.board.boardGroup.position, {
      y: 0.04,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

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

    this.forest.update(this.clock.getElapsedTime());

    this.rig.update();

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const { clientWidth, clientHeight } = this.container;

    if (!clientWidth || !clientHeight) return;

    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(clientWidth, clientHeight);

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.25 : 1.75),
    );
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
      this.handlers.diceClick?.();
      return;
    }

    const token = this.pickToken();

    if (token) this.handlers.tokenClick?.(token.userData.id);
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
      gsap.to(this.hoveredToken.scale, { x: 1, y: 1, z: 1, duration: 0.2 });
    }

    this.hoveredToken = token;

    if (token) {
      gsap.to(token.scale, {
        x: 1.12,
        y: 1.12,
        z: 1.12,
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

  rollDice(value) {
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

      ring.scale.set(1, 1, 1);
      ring.visible = on;

      if (on) {
        gsap.to(ring.scale, {
          x: 1.2,
          y: 1.2,
          z: 1.2,
          duration: 0.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }
    }
  }

  /**
   * Snaps or slides every token to where the given game state
   * says it should be, spreading any stack.
   */
  syncPlacements(tokens, animate = false) {
    const placements = placementsFor(tokens);

    for (const [id, position] of placements) {
      if (this.animating.has(id)) continue;

      const mesh = this.tokens.byId.get(id);

      if (!mesh) continue;

      if (!animate) {
        gsap.killTweensOf(mesh.position);
        mesh.position.set(position.x, TOKEN_HEIGHT, position.z);
        continue;
      }

      gsap.to(mesh.position, {
        x: position.x,
        z: position.z,
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
      mesh.scale.set(1, 1, 1);
    }

    this.animating.clear();
    this.hoveredToken = null;

    this.setHighlights([]);
    this.syncPlacements(tokens, false);
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

    // knocked-out pieces fly home while the turn continues
    const flights = result.captured.map((id) => this.sendHome(id));

    this.syncPlacements(nextTokens, true);

    await Promise.all(flights);

    this.syncPlacements(nextTokens, true);
  }

  enterFromYard(mesh, color, slot) {
    const target = baseWorldPosition({ color, slot, position: 0 });

    gsap.killTweensOf(mesh.position);

    return new Promise((resolve) => {
      gsap
        .timeline({ onComplete: resolve })
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

      for (const position of path) {
        const target = baseWorldPosition({ color, slot, position });

        timeline.to(mesh.position, {
          x: target.x,
          z: target.z,
          duration: 0.2,
          ease: "power1.inOut",
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
        });
      }
    });
  }

  sendHome(tokenId) {
    const mesh = this.tokens.byId.get(tokenId);

    if (!mesh) return Promise.resolve();

    const { color, slot } = mesh.userData;

    const target = baseWorldPosition({ color, slot, position: -1 });

    this.animating.add(tokenId);

    gsap.killTweensOf(mesh.position);

    return new Promise((resolve) => {
      gsap
        .timeline({
          onComplete: () => {
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
