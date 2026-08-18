import { useRef } from "react";
import gsap from "gsap";

/**
 * React Bits - GlassSurface
 * High-clarity frosted liquid glass surface with refractive borders and depth shadow.
 */
export function GlassSurface({
  children,
  className = "",
  elevation = "medium", // "low" | "medium" | "high"
  ...props
}) {
  return (
    <div
      className={`react-bits-glass-surface elevation-${elevation} ${className}`}
      {...props}
    >
      <div className="glass-surface-reflection" />
      <div className="glass-surface-content">{children}</div>
    </div>
  );
}

/**
 * React Bits - GlassSurfaceButton
 * Interactive tactile button with real frosted glass surface, refractive border,
 * and animated specular light gleam.
 */
export function GlassButton({
  children,
  onClick,
  variant = "primary", // "primary" | "secondary" | "danger" | "gold"
  className = "",
  disabled = false,
  type = "button",
  ...props
}) {
  const btnRef = useRef(null);

  const handlePointerDown = () => {
    if (disabled || !btnRef.current) return;
    gsap.to(btnRef.current, {
      scale: 0.95,
      duration: 0.12,
      ease: "power2.out",
    });
  };

  const handlePointerUp = () => {
    if (disabled || !btnRef.current) return;
    gsap.to(btnRef.current, {
      scale: 1,
      duration: 0.35,
      ease: "elastic.out(1.2, 0.4)",
    });
  };

  return (
    <button
      ref={btnRef}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      className={`glass-surface-btn btn-${variant} ${className}`}
      {...props}
    >
      <span className="glass-surface-specular" />
      <span className="glass-surface-gleam" />
      <span className="glass-surface-content">{children}</span>
    </button>
  );
}
