import * as THREE from "three";
import gsap from "gsap";

const DEFAULT_DISTANCE = 27;

/**
 * Camera rig with unrestricted user orbit control and angle preset support.
 *
 * User can drag to orbit 360° and zoom with wheel/pinch. Camera maintains
 * the exact user-selected angle without drifting back.
 */
export function createCameraRig(camera, domElement) {
  const target = new THREE.Vector3(0, 0, 0);
  const orbit = { distance: DEFAULT_DISTANCE, height: 14 };

  let dragging = false;
  let previousX = 0;
  let previousY = 0;

  let targetRotationX = 0;
  let targetRotationY = 0;

  let currentRotationX = 0;
  let currentRotationY = 0;

  const activePointers = new Map();
  let initialPinchDistance = 0;

  function getPinchDistance(p1, p2) {
    const dx = p1.clientX - p2.clientX;
    const dy = p1.clientY - p2.clientY;
    return Math.hypot(dx, dy);
  }

  function onPointerDown(event) {
    activePointers.set(event.pointerId, event);

    if (activePointers.size === 1) {
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      if (domElement.setPointerCapture) {
        try {
          domElement.setPointerCapture(event.pointerId);
        } catch (e) {
          // ignore pointer capture errors on mobile
        }
      }
    } else if (activePointers.size === 2) {
      dragging = false;
      const [p1, p2] = Array.from(activePointers.values());
      initialPinchDistance = getPinchDistance(p1, p2);
    }
  }

  function onPointerMove(event) {
    if (activePointers.has(event.pointerId)) {
      activePointers.set(event.pointerId, event);
    }

    if (activePointers.size >= 2) {
      const [p1, p2] = Array.from(activePointers.values());
      const newDistance = getPinchDistance(p1, p2);
      const delta = newDistance - initialPinchDistance;

      if (Math.abs(delta) > 1.5) {
        gsap.killTweensOf(orbit);
        // Inverted Pinch Zoom only
        orbit.distance = THREE.MathUtils.clamp(
          orbit.distance + delta * 0.05,
          6,
          38,
        );
        initialPinchDistance = newDistance;
      }
      return;
    }

    if (!dragging) return;

    // Standard Drag / Orbit controls
    targetRotationY += (event.clientX - previousX) * 0.005;
    targetRotationX += (event.clientY - previousY) * 0.003;
    targetRotationX = THREE.MathUtils.clamp(targetRotationX, -0.65, 1.25);

    previousX = event.clientX;
    previousY = event.clientY;
  }

  function onPointerUp(event) {
    activePointers.delete(event.pointerId);
    if (activePointers.size < 2) {
      initialPinchDistance = 0;
    }
    if (activePointers.size === 0) {
      dragging = false;
    }
    if (domElement.releasePointerCapture) {
      try {
        domElement.releasePointerCapture(event.pointerId);
      } catch (e) {
        // ignore
      }
    }
  }

  function onWheel(event) {
    event.preventDefault();
    gsap.killTweensOf(orbit);

    // Standard Mouse Wheel Zoom
    orbit.distance = THREE.MathUtils.clamp(
      orbit.distance + event.deltaY * 0.012,
      6,
      38,
    );
  }

  domElement.addEventListener("pointerdown", onPointerDown);
  domElement.addEventListener("pointermove", onPointerMove);
  domElement.addEventListener("pointerup", onPointerUp);
  domElement.addEventListener("pointercancel", onPointerUp);
  domElement.addEventListener("wheel", onWheel, { passive: false });

  function update() {
    // Keep camera above board ground surface
    const minHeight = 1.2;
    const minRotX = Math.asin(
      THREE.MathUtils.clamp((minHeight - orbit.height) / Math.max(orbit.distance, 1), -0.99, 0.99),
    );

    targetRotationX = Math.max(targetRotationX, minRotX);
    currentRotationX = Math.max(currentRotationX, minRotX);

    // Camera holds user angle steadily without decaying
    currentRotationY += (targetRotationY - currentRotationY) * 0.08;
    currentRotationX += (targetRotationX - currentRotationX) * 0.08;

    const horizontal = orbit.distance * Math.cos(currentRotationX);

    camera.position.x = target.x + Math.sin(currentRotationY) * horizontal;
    camera.position.z = target.z + Math.cos(currentRotationY) * horizontal;
    camera.position.y = Math.max(
      minHeight,
      orbit.height + Math.sin(currentRotationX) * orbit.distance,
    );

    camera.lookAt(target);
  }

  function setAngle(rotX, rotY, distance = DEFAULT_DISTANCE, targetHeight = 14) {
    gsap.killTweensOf(orbit);
    gsap.to(orbit, {
      distance,
      height: targetHeight,
      duration: 0.9,
      ease: "power2.inOut",
    });

    const animObj = { rx: targetRotationX, ry: targetRotationY };

    gsap.to(animObj, {
      rx: rotX,
      ry: rotY,
      duration: 0.9,
      ease: "power2.inOut",
      onUpdate: () => {
        targetRotationX = animObj.rx;
        targetRotationY = animObj.ry;
      },
    });

    gsap.to(target, { x: 0, y: 0, z: 0, duration: 0.9, ease: "power2.inOut" });
  }

  function focusOn(point, distance = 13) {
    gsap.to(target, {
      x: point.x,
      y: 0,
      z: point.z,
      duration: 1.1,
      ease: "power3.inOut",
    });

    gsap.to(orbit, { distance, duration: 1.1, ease: "power3.inOut" });
  }

  function reset() {
    setAngle(0, 0, DEFAULT_DISTANCE);
  }

  function dispose() {
    gsap.killTweensOf(target);
    gsap.killTweensOf(orbit);

    domElement.removeEventListener("pointerdown", onPointerDown);
    domElement.removeEventListener("pointermove", onPointerMove);
    domElement.removeEventListener("pointerup", onPointerUp);
    domElement.removeEventListener("pointercancel", onPointerUp);
    domElement.removeEventListener("wheel", onWheel);
  }

  return { target, orbit, update, focusOn, reset, setAngle, dispose };
}
