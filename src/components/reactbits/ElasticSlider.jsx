import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { Sun01Icon } from "hugeicons-react";

/**
 * React Bits - ElasticSlider
 * Interactive slider with elastic rubber-band physics, floating tooltip,
 * dynamic icon reactions, and frosted glass surface.
 */
export function ElasticSlider({
  value = 100,
  min = 50,
  max = 150,
  step = 5,
  onChange,
  icon: Icon = Sun01Icon,
  label = "Brightness",
  unit = "%",
  className = "",
}) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const fillRef = useRef(null);
  const thumbRef = useRef(null);
  const tooltipRef = useRef(null);
  const iconRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  // Sync fill width smoothly
  useEffect(() => {
    if (fillRef.current) {
      gsap.to(fillRef.current, {
        width: `${percent}%`,
        duration: isDragging ? 0.05 : 0.25,
        ease: "power2.out",
      });
    }
    if (thumbRef.current) {
      gsap.to(thumbRef.current, {
        left: `${percent}%`,
        duration: isDragging ? 0.05 : 0.25,
        ease: "power2.out",
      });
    }
  }, [percent, isDragging]);

  const updateFromClientX = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const rawRatio = (clientX - rect.left) / rect.width;
    const clampedRatio = Math.min(1, Math.max(0, rawRatio));
    const rawVal = min + clampedRatio * (max - min);
    const steppedVal = Math.round(rawVal / step) * step;
    const finalVal = Math.min(max, Math.max(min, steppedVal));

    if (finalVal !== value && onChange) {
      onChange(finalVal);
    }

    // Elastic Rubber-Band Deformation
    if (trackRef.current) {
      if (rawRatio < 0 || rawRatio > 1) {
        const overdrag = rawRatio < 0 ? Math.abs(rawRatio) : rawRatio - 1;
        const stretch = Math.min(0.12, overdrag * 0.2);
        gsap.to(trackRef.current, {
          scaleX: 1.04 + stretch,
          scaleY: 1.1 - stretch * 0.6,
          duration: 0.1,
          ease: "power1.out",
        });
      } else {
        gsap.to(trackRef.current, {
          scaleX: 1.02,
          scaleY: 1.08,
          duration: 0.15,
          ease: "power2.out",
        });
      }
    }

    // Dynamic Icon Rotation & Scale
    if (iconRef.current) {
      const rot = ((finalVal - min) / (max - min)) * 90 - 45;
      gsap.to(iconRef.current, {
        rotate: rot,
        scale: 1.15 + (finalVal / max) * 0.2,
        duration: 0.15,
        ease: "power1.out",
      });
    }
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    updateFromClientX(clientX);

    // Elastic Scale-Up & Glow
    if (trackRef.current) {
      gsap.to(trackRef.current, {
        scaleX: 1.02,
        scaleY: 1.08,
        boxShadow: "0 10px 30px rgba(242, 181, 68, 0.45), 0 0 20px rgba(242, 181, 68, 0.35)",
        duration: 0.25,
        ease: "back.out(2)",
      });
    }

    if (tooltipRef.current) {
      gsap.fromTo(
        tooltipRef.current,
        { scale: 0.7, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.25, ease: "back.out(2)" }
      );
    }

    const onPointerMove = (moveEvent) => {
      const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      updateFromClientX(moveX);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);

      // Elastic Spring Snapback
      if (trackRef.current) {
        gsap.to(trackRef.current, {
          scaleX: 1,
          scaleY: 1,
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
          duration: 0.5,
          ease: "elastic.out(1.2, 0.4)",
        });
      }

      if (iconRef.current) {
        gsap.to(iconRef.current, {
          scale: 1,
          rotate: 0,
          duration: 0.4,
          ease: "elastic.out(1.2, 0.4)",
        });
      }

      if (tooltipRef.current) {
        gsap.to(tooltipRef.current, {
          scale: 0.8,
          opacity: 0,
          y: 8,
          duration: 0.2,
          ease: "power2.in",
        });
      }
    };

    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(max, value + step);
      if (onChange) onChange(next);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      const prev = Math.max(min, value - step);
      if (onChange) onChange(prev);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`react-bits-elastic-slider-container ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className="elastic-slider-header">
        <span className="elastic-slider-label">
          {Icon && (
            <span className="elastic-slider-icon" ref={iconRef}>
              <Icon size={16} color="#f2b544" />
            </span>
          )}
          {label}
        </span>
        <span className="elastic-slider-value">
          {value}
          {unit}
        </span>
      </div>

      <div
        className={`elastic-slider-track-wrap ${isDragging ? "is-dragging" : ""}`}
        ref={trackRef}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        <div className="elastic-slider-bg-glass" />
        <div className="elastic-slider-fill" ref={fillRef} style={{ width: `${percent}%` }}>
          <div className="elastic-slider-fill-shimmer" />
        </div>

        <div
          className="elastic-slider-thumb"
          ref={thumbRef}
          style={{ left: `${percent}%` }}
        >
          <div className="elastic-slider-thumb-dot" />
          <div
            className="elastic-slider-tooltip"
            ref={tooltipRef}
            style={{ opacity: isDragging ? 1 : 0 }}
          >
            {value}
            {unit}
          </div>
        </div>
      </div>
    </div>
  );
}
