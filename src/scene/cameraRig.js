import * as THREE from "three";

import gsap from "gsap";

const DEFAULT_DISTANCE = 27;

/**
 * Drag to orbit, wheel to zoom.
 *
 * The rig rebuilds camera.position every frame, so nothing
 * may write to the camera directly — a tween on
 * camera.position would be overwritten before it is drawn.
 * Framing changes go through focusOn/reset instead, which
 * move the orbit target and distance.
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

    targetRotationY += (event.clientX - previousX) * 0.004;
    targetRotationX += (event.clientY - previousY) * 0.002;

    targetRotationX = THREE.MathUtils.clamp(targetRotationX, -0.25, 0.35);

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
      orbit.distance + event.deltaY * 0.01,
      16,
      35,
    );
  }

  domElement.addEventListener("pointerdown", onPointerDown);
  domElement.addEventListener("pointermove", onPointerMove);
  domElement.addEventListener("pointerup", onPointerUp);
  domElement.addEventListener("pointercancel", onPointerUp);
  domElement.addEventListener("wheel", onWheel, { passive: false });

  function update() {
    if (!dragging) {
      targetRotationY *= 0.995;
      targetRotationX *= 0.995;
    }

    currentRotationY += (targetRotationY - currentRotationY) * 0.04;
    currentRotationX += (targetRotationX - currentRotationX) * 0.04;

    const horizontal = orbit.distance * Math.cos(currentRotationX);

    camera.position.x = target.x + Math.sin(currentRotationY) * horizontal;
    camera.position.z = target.z + Math.cos(currentRotationY) * horizontal;
    camera.position.y =
      orbit.height + Math.sin(currentRotationX) * orbit.distance;

    camera.lookAt(target);
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
    gsap.to(target, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1.2,
      ease: "power3.inOut",
    });

    gsap.to(orbit, {
      distance: DEFAULT_DISTANCE,
      duration: 1.2,
      ease: "power3.inOut",
    });
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

  return { target, orbit, update, focusOn, reset, dispose };
}
