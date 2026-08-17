import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * HumanModelViewer React Component
 * Renders the 3D human character model (`/modal/human.glb`) inside a self-contained
 * Three.js WebGL canvas with studio lighting, orbiting controls, and idle animation loop.
 *
 * Props:
 * - `teamColor`: Optional color hex string to tint character materials (e.g., "#f21e1e")
 * - `autoRotate`: Enable continuous smooth 3D rotation (default: true)
 * - `height`: Canvas container height CSS string (default: "320px")
 * - `className`: Custom CSS class for the container
 */
export function HumanModelViewer({
  teamColor = null,
  autoRotate = true,
  height = "320px",
  className = "",
}) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return undefined;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 1.2, 2.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(3, 5, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-3, 2, -3);
    scene.add(fillLight);

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 1.0;
    controls.maxDistance = 6.0;

    // 4. Load GLTF Human Model & Idle Animation
    let mixer = null;
    let animFrameId = null;
    const clock = new THREE.Clock();

    const loader = new GLTFLoader();
    loader.load(
      "/modal/human.glb",
      (gltf) => {
        const model = gltf.scene;

        // Auto-center and fit model into view
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);

        const targetHeight = 1.6;
        const scale = targetHeight / (size.y || 1);
        model.scale.set(scale, scale, scale);

        box.setFromObject(model);
        const minY = box.min.y;
        model.position.y = -minY;

        // Material Customization (Jacket Team Color & Facial Glow)
        const tintColor = teamColor ? new THREE.Color(teamColor) : null;
        model.traverse((child) => {
          if (child.isMesh && child.material) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = child.material.clone();

            if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
            const box = child.geometry.boundingBox;
            const minY = box ? box.min.y : 0;
            const maxY = box ? box.max.y : 2.5;
            const height = maxY - minY;

            // Jacket condition: main coat body & sleeves (minY >= 1.00 && maxY <= 2.18 && height >= 0.90)
            if (minY >= 1.00 && maxY <= 2.18 && height >= 0.90 && tintColor) {
              child.material.color = tintColor;
              child.material.emissive = tintColor;
              child.material.emissiveIntensity = 0.18;
            } else if (minY >= 2.00) {
              // Warm radiant facial glow
              child.material.emissive = new THREE.Color("#ffe082");
              child.material.emissiveIntensity = 0.40;
            }
          }
        });

        scene.add(model);

        // Play Idle Animation Clip
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          const idleClip =
            gltf.animations.find((a) => a.name.toLowerCase() === "idle") ||
            gltf.animations[0];
          const action = mixer.clipAction(idleClip);
          action.play();
        }

        setLoading(false);
      },
      undefined,
      (err) => {
        console.error("Failed to load /modal/human.glb:", err);
        setError("Could not load 3D Human Model");
        setLoading(false);
      },
    );

    // 5. Render Loop
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 6. Responsive Resize Observer
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [teamColor, autoRotate]);

  return (
    <div
      className={`human-model-container ${className}`}
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: "16px",
        overflow: "hidden",
        background: "radial-gradient(circle at center, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#38bdf8",
            fontSize: "13px",
            fontWeight: "600",
            backdropFilter: "blur(4px)",
          }}
        >
          Loading 3D Human Character...
        </div>
      )}

      {error && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ef4444",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          {error}
        </div>
      )}

      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
