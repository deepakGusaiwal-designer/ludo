import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const LOADING_STEPS = [
  "Awakening the mystical forest...",
  "Carving emerald board tiles...",
  "Summoning 3D hero pawns...",
  "Polishing lucky dice...",
  "Entering the board...",
];

export function Preloader({ isReady, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const canvasContainerRef = useRef(null);

  // 3D Dice GLB Preview
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = 140;
    const height = 140;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.2);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
    dirLight.position.set(3, 4, 3);
    scene.add(dirLight);

    const fillLight = new THREE.PointLight(0x60a5fa, 1.5, 10);
    fillLight.position.set(-2, -1, 2);
    scene.add(fillLight);

    let diceModel = null;
    let animId = null;
    const loader = new GLTFLoader();

    loader.load(
      "/modal/dice.glb",
      (gltf) => {
        diceModel = gltf.scene;

        // Auto-center and fit to bounding sphere
        const box = new THREE.Box3().setFromObject(diceModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        diceModel.position.sub(center);
        const scaleFactor = 1.6 / (maxDim || 1);
        diceModel.scale.setScalar(scaleFactor);

        diceModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(diceModel);
      },
      undefined,
      (err) => {
        console.warn("Could not load dice.glb for preloader, falling back", err);
      }
    );

    let startTime = performance.now();
    const animate = (now) => {
      animId = requestAnimationFrame(animate);
      const elapsed = (now - startTime) * 0.001;

      if (diceModel) {
        diceModel.rotation.x = elapsed * 1.8 + Math.sin(elapsed * 0.8) * 0.4;
        diceModel.rotation.y = elapsed * 2.2 + Math.cos(elapsed * 0.9) * 0.4;
        diceModel.rotation.z = elapsed * 1.2;
        diceModel.position.y = Math.sin(elapsed * 2.5) * 0.12;
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1800; // 1.8s smooth minimum load time

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 95));

      setProgress(pct);

      const stepIdx = Math.min(
        LOADING_STEPS.length - 1,
        Math.floor((elapsed / duration) * LOADING_STEPS.length),
      );
      setStatusIndex(stepIdx);

      if (elapsed >= duration && isReady) {
        clearInterval(interval);
        setProgress(100);
        setStatusIndex(LOADING_STEPS.length - 1);

        setTimeout(() => {
          gsap.to(".preloader-overlay", {
            opacity: 0,
            scale: 1.05,
            duration: 0.65,
            ease: "power2.inOut",
            onComplete: () => {
              setIsDone(true);
              onComplete?.();
            },
          });
        }, 300);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isReady, onComplete]);

  if (isDone) return null;

  return (
    <div className="preloader-overlay">
      {/* Ambient background particles and glowing orbs */}
      <div className="preloader-backdrop-glow preloader-glow-top" />
      <div className="preloader-content-wrap">
        {/* Animated Brand Logo */}
        <div className="preloader-logo-wrap">
          <img src="/logo.png" alt="Ludo Logo" className="preloader-logo-img" />
          <div className="preloader-logo-shimmer" />
        </div>

        {/* 3D Model Dice Stage */}
        <div className="preloader-3d-dice-stage" ref={canvasContainerRef}>
          <div className="preloader-dice-shadow-soft" />
        </div>

        {/* Loading Information & Elastic Progress Bar */}
        <div className="preloader-info">
          <div className="preloader-status-row">
            <span className="preloader-status-text">
              {LOADING_STEPS[statusIndex]}
            </span>
            <span className="preloader-percent">{progress}%</span>
          </div>

          <div className="preloader-bar-track">
            <div
              className="preloader-bar-fill"
              style={{ width: `${progress}%` }}
            >
              <div className="preloader-bar-light" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
