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

  function onPointerDown(event) {
    dragging = true;
    previousX = event.clientX;
    previousY = event.clientY;
    domElement.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!dragging) return;

    targetRotationY += (event.clientX - previousX) * 0.005;
    targetRotationX += (event.clientY - previousY) * 0.003;

    // Pitch limit: allow low perspective up to steep top-down view
    targetRotationX = THREE.MathUtils.clamp(targetRotationX, -0.65, 1.25);

    previousX = event.clientX;
    previousY = event.clientY;
  }

  function onPointerUp(event) {
    dragging = false;
    if (domElement.hasPointerCapture?.(event.pointerId)) {
      domElement.releasePointerCapture(event.pointerId);
    }
  }

  function onWheel(event) {
    event.preventDefault();
    gsap.killTweensOf(orbit);

    orbit.distance = THREE.MathUtils.clamp(
      orbit.distance + event.deltaY * 0.012,
      14,
      38,
    );
  }

  domElement.addEventListener("pointerdown", onPointerDown);
  domElement.addEventListener("pointermove", onPointerMove);
  domElement.addEventListener("pointerup", onPointerUp);
  domElement.addEventListener("pointercancel", onPointerUp);
  domElement.addEventListener("wheel", onWheel, { passive: false });

  function update() {
    // Keep camera above ground height (y >= 2.0) to prevent viewing bottom of environment
    const minHeight = 2.0;
    const minRotX = Math.asin(
      THREE.MathUtils.clamp((minHeight - orbit.height) / orbit.distance, -0.99, 0.99),
    );

    targetRotationX = Math.max(targetRotationX, minRotX);
    currentRotationX = Math.max(currentRotationX, minRotX);

    // Camera holds user angle steadily without decaying
    currentRotationY += (targetRotationY - currentRotationY) * 0.08;
    currentRotationX += (targetRotationX - currentRotationX) * 0.08;

    const horizontal = orbit.distance * Math.cos(currentRotationX);

    camera.position.x = target.x + Math.sin(currentRotationY) * horizontal;
    camera.position.z = target.z + Math.cos(currentRotationY) * horizontal;
    camera.position.y =
      orbit.height + Math.sin(currentRotationX) * orbit.distance;

    camera.lookAt(target);
  }

  function setAngle(rotX, rotY, distance = DEFAULT_DISTANCE) {
    gsap.killTweensOf(orbit);
    gsap.to(orbit, { distance, duration: 0.9, ease: "power2.inOut" });

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
