import * as THREE from "three";
import gsap from "gsap";

/**
 * Visual effects system: Confetti explosions, hop ripples, and landing sparkles.
 */
export function createEffectsSystem(scene) {
  const activeParticles = [];
  const activeRipples = [];

  /* --- Confetti System --- */
  const confettiGeometry = new THREE.PlaneGeometry(0.12, 0.2);
  const confettiColors = [
    "#f21e1e",
    "#00ac24",
    "#fadf27",
    "#3b71ef",
    "#ff69b4",
    "#00ffff",
    "#ffd700",
  ];
  const confettiMaterials = confettiColors.map(
    (color) =>
      new THREE.MeshStandardMaterial({
        color,
        side: THREE.DoubleSide,
        roughness: 0.3,
        metalness: 0.2,
      }),
  );

  function triggerConfetti(origin = { x: 0, y: 1.5, z: 0 }, count = 40) {
    for (let i = 0; i < count; i++) {
      const mat = confettiMaterials[Math.floor(Math.random() * confettiMaterials.length)];
      const mesh = new THREE.Mesh(confettiGeometry, mat);

      mesh.position.set(
        origin.x + (Math.random() - 0.5) * 0.4,
        origin.y + Math.random() * 0.3,
        origin.z + (Math.random() - 0.5) * 0.4,
      );

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );

      scene.add(mesh);

      const vx = (Math.random() - 0.5) * 6.5;
      const vy = 5.5 + Math.random() * 7.5;
      const vz = (Math.random() - 0.5) * 6.5;

      const rx = (Math.random() - 0.5) * 14;
      const ry = (Math.random() - 0.5) * 14;

      activeParticles.push({
        mesh,
        vx,
        vy,
        vz,
        rx,
        ry,
        life: 1.0,
        maxLife: 2.2 + Math.random() * 1.2,
        age: 0,
      });
    }
  }

  /* --- Hop Landing Ripple & Spark Effect --- */
  const innerRingGeo = new THREE.RingGeometry(0.08, 0.28, 32);
  const sparkGeo = new THREE.SphereGeometry(0.028, 4, 4);

  function triggerHopRipple(position, colorHex = "#ffffff") {
    // 1. Dual Concentric Expanding Rings
    const spawnRing = (delay, targetScale, duration) => {
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });

      const ring = new THREE.Mesh(innerRingGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(position.x, position.y + 0.012, position.z);
      ring.scale.set(0.2, 0.2, 0.2);

      scene.add(ring);

      gsap.to(ring.scale, {
        x: targetScale,
        y: targetScale,
        z: targetScale,
        duration,
        delay,
        ease: "power3.out",
      });

      gsap.to(ringMat, {
        opacity: 0,
        duration,
        delay,
        ease: "power2.inOut",
        onComplete: () => {
          scene.remove(ring);
          ringMat.dispose();
        },
      });
    };

    // Primary wave
    spawnRing(0, 3.0, 0.48);
    // Staggered secondary wave
    spawnRing(0.07, 3.8, 0.58);

    // 2. Landing Spark Particles Splash
    const sparkMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
    });

    const sparkCount = 6;
    for (let i = 0; i < sparkCount; i++) {
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      const angle = (i / sparkCount) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 1.6 + Math.random() * 1.8;

      spark.position.set(
        position.x + Math.cos(angle) * 0.1,
        position.y + 0.05 + Math.random() * 0.08,
        position.z + Math.sin(angle) * 0.1,
      );

      scene.add(spark);

      const vx = Math.cos(angle) * speed;
      const vy = 0.8 + Math.random() * 1.2;
      const vz = Math.sin(angle) * speed;

      activeParticles.push({
        mesh: spark,
        vx,
        vy,
        vz,
        rx: 0,
        ry: 0,
        life: 1.0,
        maxLife: 0.35 + Math.random() * 0.15,
        age: 0,
      });
    }
  }

  /* --- Frame Update Loop --- */
  function update(delta) {
    for (let i = activeParticles.length - 1; i >= 0; i--) {
      const p = activeParticles[i];
      p.age += delta;

      if (p.age >= p.maxLife) {
        scene.remove(p.mesh);
        activeParticles.splice(i, 1);
        continue;
      }

      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;

      p.vy -= 9.8 * delta; // Gravity

      p.mesh.rotation.x += p.rx * delta;
      p.mesh.rotation.y += p.ry * delta;

      // Fade out near end of life
      const remaining = (p.maxLife - p.age) / p.maxLife;
      if (p.mesh.material.opacity !== undefined) {
        p.mesh.material.transparent = true;
        p.mesh.material.opacity = Math.min(1, remaining * 2);
      }
    }
  }

  function dispose() {
    activeParticles.forEach((p) => scene.remove(p.mesh));
    confettiGeometry.dispose();
    confettiMaterials.forEach((m) => m.dispose());
    innerRingGeo.dispose();
    sparkGeo.dispose();
  }

  return {
    triggerConfetti,
    triggerHopRipple,
    update,
    dispose,
  };
}
