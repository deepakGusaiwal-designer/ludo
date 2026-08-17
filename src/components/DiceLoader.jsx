import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * DiceLoader Component
 * Full-screen game loading screen featuring a 3D tumbling dice (`/modal/dice.glb`),
 * animated progress bar, and status tips. Fades out smoothly when `ready` is true.
 */
export function DiceLoader({ ready = false, onLoaded = null }) {
  const mountRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Simulated smooth progress counter up to 90% while assets load, then 100% when ready
  useEffect(() => {
    let timer = null;
    if (!ready && progress < 90) {
      timer = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.floor(Math.random() * 8 + 4), 90));
      }, 150);
    } else if (ready && progress < 100) {
      setProgress(100);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [ready, progress]);

  // Handle smooth fade out on completion
  useEffect(() => {
    if (progress >= 100) {
      const fadeTimer = setTimeout(() => {
        setFadingOut(true);
      }, 300);

      const hideTimer = setTimeout(() => {
        setHidden(true);
        onLoaded?.();
      }, 900);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [progress, onLoaded]);

  // 3D Tumbling Dice WebGL Canvas
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(180, 180);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffd8a8, 2.2);
    dirLight1.position.set(3, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.0);
    dirLight2.position.set(-3, -2, -2);
    scene.add(dirLight2);

    let diceGroup = new THREE.Group();
    scene.add(diceGroup);

    // Fallback cube geometry while loading GLB
    const geom = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const mat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.2 });
    let mesh = new THREE.Mesh(geom, mat);
    diceGroup.add(mesh);

    // Load 3D Dice GLB Model
    const loader = new GLTFLoader();
    loader.load(
      "/modal/dice.glb",
      (gltf) => {
        const model = gltf.scene;
        diceGroup.remove(mesh);
        geom.dispose();
        mat.dispose();

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 1.35 / maxDim : 1;
        model.scale.set(scale, scale, scale);

        const newBox = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        newBox.getCenter(center);
        model.position.sub(center);

        model.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.roughness = 0.18;
            child.material.metalness = 0.08;
          }
        });

        diceGroup.add(model);
      },
      undefined,
      (err) => {
        console.warn("Could not load /modal/dice.glb for loader:", err);
      }
    );

    // Continuous 3D Tumbling Animation Loop
    let animFrameId = null;
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      if (diceGroup) {
        diceGroup.rotation.x += 0.018;
        diceGroup.rotation.y += 0.024;
        diceGroup.rotation.z += 0.012;
      }
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (hidden) return null;

  const getStatusText = () => {
    if (progress < 35) return "Initializing 3D Graphics Engine...";
    if (progress < 70) return "Loading 3D Characters & Textures...";
    if (progress < 95) return "Building Forest World & Atmosphere...";
    return "Ready! Entering Game...";
  };

  return (
    <div
      className={`dice-loader-overlay ${fadingOut ? "fade-out" : ""}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at center, #26180a 0%, #0d0803 100%)",
        color: "#ffffff",
        transition: "opacity 0.6s ease, transform 0.6s ease",
        opacity: fadingOut ? 0 : 1,
        transform: fadingOut ? "scale(1.04)" : "scale(1)",
        pointerEvents: fadingOut ? "none" : "all",
      }}
    >
      {/* Ambient glowing golden backdrop circle */}
      <div
        style={{
          position: "absolute",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.28) 0%, rgba(0, 0, 0, 0) 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      {/* 3D Dice Canvas Container */}
      <div
        ref={mountRef}
        style={{
          width: "180px",
          height: "180px",
          position: "relative",
          zIndex: 2,
          filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.6))",
        }}
      />

      {/* Title & Brand */}
      <h1
        style={{
          marginTop: "16px",
          fontSize: "24px",
          fontWeight: "900",
          letterSpacing: "0.12em",
          background: "linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #d97706 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 4px 18px rgba(245, 158, 11, 0.4)",
          margin: "12px 0 4px 0",
        }}
      >
        FOREST LUDO 3D
      </h1>

      {/* Dynamic Status Text */}
      <p
        style={{
          fontSize: "12px",
          fontWeight: "600",
          color: "#cbd5e1",
          letterSpacing: "0.04em",
          marginBottom: "20px",
          minHeight: "18px",
        }}
      >
        {getStatusText()}
      </p>

      {/* Progress Bar Container */}
      <div
        style={{
          width: "240px",
          height: "8px",
          borderRadius: "999px",
          background: "rgba(255, 255, 255, 0.12)",
          padding: "2px",
          border: "1px solid rgba(251, 191, 36, 0.35)",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.6)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            borderRadius: "999px",
            background: "linear-gradient(90deg, #b45309 0%, #f59e0b 50%, #fef08a 100%)",
            boxShadow: "0 0 14px rgba(245, 158, 11, 0.85)",
            transition: "width 0.15s ease-out",
          }}
        />
      </div>

      {/* Percentage Readout */}
      <div
        style={{
          marginTop: "8px",
          fontSize: "11px",
          fontWeight: "800",
          color: "#fbbf24",
          letterSpacing: "0.08em",
        }}
      >
        {progress}%
      </div>
    </div>
  );
}
