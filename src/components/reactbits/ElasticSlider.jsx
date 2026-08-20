import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";
import { Sun01Icon } from "hugeicons-react";

/**
 * React Bits - ElasticSlider
 * Interactive buttery-smooth slider with real-time responsive tracking,
 * micro-elastic deformation, floating tooltip, and frosted glass surface.
 */
export function ElasticSlider({
  value = 100,
  min = 50,
  max = 150,
  step = 1,
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
  const isDraggingRef = useRef(false);

  const [isDragging, setIsDragging] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  // Sync internal display value when external prop changes
  useEffect(() => {
    if (!isDraggingRef.current) {
      setDisplayValue(value);
      const p = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
      if (fillRef.current) {
        gsap.to(fillRef.current, {
          width: `${p}%`,
          duration: 0.25,
          ease: "power2.out",
        });
      }
      if (thumbRef.current) {
        gsap.to(thumbRef.current, {
          left: `${p}%`,
          duration: 0.25,
          ease: "power2.out",
        });
      }
    }
  }, [value, min, max]);

  const updateFromClientX = useCallback(
    (clientX) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const rawRatio = (clientX - rect.left) / rect.width;
      const clampedRatio = Math.min(1, Math.max(0, rawRatio));
      const rawVal = min + clampedRatio * (max - min);
      const steppedVal =
        step >= 1
          ? Math.round(rawVal / step) * step
          : Math.round(rawVal * 10) / 10;
      const finalVal = Math.min(max, Math.max(min, steppedVal));

      const p = ((finalVal - min) / (max - min)) * 100;

      // Instant 120Hz/60Hz zero-lag direct DOM updates
      if (fillRef.current) {
        fillRef.current.style.width = `${p}%`;
      }
      if (thumbRef.current) {
        thumbRef.current.style.left = `${p}%`;
      }

      setDisplayValue(finalVal);

      if (onChange) {
        onChange(finalVal);
      }

      // Smooth elastic rubber-band deformation on overdrag
      if (trackRef.current) {
        if (rawRatio < 0 || rawRatio > 1) {
          const overdrag = rawRatio < 0 ? Math.abs(rawRatio) : rawRatio - 1;
          const stretch = Math.min(0.08, overdrag * 0.15);
          trackRef.current.style.transform = `scaleX(${1 + stretch}) scaleY(${1 - stretch * 0.5})`;
        } else {
          trackRef.current.style.transform = "scaleX(1.015) scaleY(1.04)";
        }
      }

      // Subtle dynamic icon tilt
      if (iconRef.current) {
        const rot = ((finalVal - min) / (max - min)) * 60 - 30;
        iconRef.current.style.transform = `rotate(${rot}deg) scale(1.15)`;
      }
    },
    [min, max, step, onChange]
  );

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);

    updateFromClientX(e.clientX);

    if (trackRef.current) {
      gsap.killTweensOf(trackRef.current);
      gsap.to(trackRef.current, {
        scaleX: 1.015,
        scaleY: 1.04,
        boxShadow:
          "0 8px 24px rgba(242, 181, 68, 0.4), 0 0 16px rgba(242, 181, 68, 0.3)",
        duration: 0.15,
        ease: "power2.out",
      });
    }

    if (tooltipRef.current) {
      gsap.fromTo(
        tooltipRef.current,
        { scale: 0.75, opacity: 0, y: 6 },
        { scale: 1, opacity: 1, y: 0, duration: 0.18, ease: "power2.out" }
      );
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    updateFromClientX(e.clientX);
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    // Smooth spring snapback
    if (trackRef.current) {
      gsap.to(trackRef.current, {
        scaleX: 1,
        scaleY: 1,
        boxShadow: "0 3px 12px rgba(0, 0, 0, 0.35)",
        duration: 0.35,
        ease: "elastic.out(1.1, 0.4)",
      });
    }

    if (iconRef.current) {
      gsap.to(iconRef.current, {
        scale: 1,
        rotate: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }

    if (tooltipRef.current) {
      gsap.to(tooltipRef.current, {
        scale: 0.8,
        opacity: 0,
        y: 4,
        duration: 0.15,
        ease: "power2.in",
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(max, value + (step || 1));
      if (onChange) onChange(next);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      const prev = Math.max(min, value - (step || 1));
      if (onChange) onChange(prev);
    }
  };

  const percent = Math.min(
    100,
    Math.max(0, ((displayValue - min) / (max - min)) * 100)
  );

  return (
    <div
      ref={containerRef}
      className={`react-bits-elastic-slider-container ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuenow={displayValue}
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
          {displayValue}
          {unit}
        </span>
      </div>

      <div
        className={`elastic-slider-track-wrap ${isDragging ? "is-dragging" : ""}`}
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="elastic-slider-bg-glass" />
        <div
          className="elastic-slider-fill"
          ref={fillRef}
          style={{ width: `${percent}%` }}
        >
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
            {displayValue}
            {unit}
          </div>
        </div>
      </div>
    </div>
  );
}
