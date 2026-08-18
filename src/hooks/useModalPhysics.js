import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Hook to add interactive 3D spring tilt & entrance physics to glass modal cards.
 */
export function useModalPhysics() {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Entrance spring animation
    gsap.fromTo(
      card,
      {
        opacity: 0,
        scale: 0.86,
        y: 24,
        rotateX: 8,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        rotateX: 0,
        duration: 0.35,
        ease: "back.out(1.7)",
      },
    );

    // Interactive 3D tilt tracking cursor physics
    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const normX = (x / rect.width - 0.5) * 2;
      const normY = (y / rect.height - 0.5) * 2;

      gsap.to(card, {
        rotateY: normX * 4,
        rotateX: -normY * 4,
        transformPerspective: 1200,
        duration: 0.2,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: "elastic.out(1.1, 0.35)",
      });
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return cardRef;
}
