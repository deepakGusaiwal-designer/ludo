import { useEffect, useRef, useState } from "react";

import { LudoScene } from "../scene/LudoScene.js";

/**
 * Creates the three.js scene once the container is mounted and
 * tears it down on unmount. Under StrictMode this runs twice in
 * development, which is exactly why LudoScene.dispose has to be
 * thorough.
 */
export function useLudoScene(containerRef) {
  const sceneRef = useRef(null);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return undefined;

    const scene = new LudoScene(container);

    sceneRef.current = scene;

    setReady(true);

    return () => {
      setReady(false);
      sceneRef.current = null;
      scene.dispose();
    };
  }, [containerRef]);

  return { sceneRef, ready };
}
