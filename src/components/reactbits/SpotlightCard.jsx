import { useRef, useState } from "react";

/**
 * React Bits - SpotlightCard
 * Frosted glass card with dynamic mouse/touch-following specular glow spotlight.
 */
export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(242, 181, 68, 0.18)",
  ...props
}) {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`spotlight-card ${className}`}
      {...props}
    >
      <div
        className="spotlight-layer"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 75%)`,
        }}
      />
      <div className="spotlight-content">{children}</div>
    </div>
  );
}
