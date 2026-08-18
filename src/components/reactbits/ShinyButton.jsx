import { useRef } from "react";
import gsap from "gsap";

/**
 * React Bits - ShinyButton / GlassButton
 * Ultra-tactile frosted glass surface button with animated metallic shimmer & GSAP micro-interaction.
 */
export function ShinyButton({
  children,
  onClick,
  variant = "primary", // "primary" | "secondary" | "danger" | "glass"
  className = "",
  disabled = false,
  type = "button",
  ...props
}) {
  const btnRef = useRef(null);

  const handlePointerDown = () => {
    if (disabled || !btnRef.current) return;
    gsap.to(btnRef.current, {
      scale: 0.96,
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
      className={`glass-surface-btn react-bits-shiny-btn btn-${variant} ${className}`}
      {...props}
    >
      <span className="glass-surface-specular" />
      <span className="shiny-gleam-overlay" />
      <span className="shiny-btn-content">{children}</span>
    </button>
  );
}

export const GlassButton = ShinyButton;

/**
 * React Bits - ShinyText
 * Metallic specular light reflection passing smoothly over text headings and labels.
 */
export function ShinyText({ children, className = "", color = "#ffffff" }) {
  return (
    <span className={`react-bits-shiny-text ${className}`} style={{ color }}>
      {children}
    </span>
  );
}
