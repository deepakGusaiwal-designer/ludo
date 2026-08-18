import { useEffect, useRef, useState  } from "react";
import gsap from "gsap";

/**
 * Animated Radio Button with GSAP scale and ripple glow effects.
 */
export function GsapRadio({ name, value, checked, onChange, label, children, className = "" }) {
  const circleRef = useRef(null);
  const dotRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!circleRef.current || !dotRef.current) return;

    if (checked) {
      gsap.to(circleRef.current, {
        scale: 1.1,
        borderColor: "#f2b544",
        backgroundColor: "rgba(242, 181, 68, 0.2)",
        boxShadow: "0 0 12px rgba(242, 181, 68, 0.6)",
        duration: 0.25,
        ease: "back.out(1.7)",
      });
      gsap.to(dotRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.25,
        ease: "back.out(2)",
      });
    } else {
      gsap.to(circleRef.current, {
        scale: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: "0 0 0px rgba(0, 0, 0, 0)",
        duration: 0.2,
        ease: "power2.out",
      });
      gsap.to(dotRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.15,
        ease: "power2.in",
      });
    }
  }, [checked]);

  const handleMouseEnter = () => {
    if (!checked && circleRef.current) {
      gsap.to(circleRef.current, {
        scale: 1.08,
        borderColor: "rgba(242, 181, 68, 0.6)",
        duration: 0.2,
      });
    }
  };

  const handleMouseLeave = () => {
    if (!checked && circleRef.current) {
      gsap.to(circleRef.current, {
        scale: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
        duration: 0.2,
      });
    }
  };

  return (
    <label
      ref={containerRef}
      className={`gsap-custom-radio-label ${className} ${checked ? "checked" : ""}`.trim()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="gsap-hidden-input"
      />
      <span className="gsap-radio-box" ref={circleRef}>
        <span className="gsap-radio-dot" ref={dotRef} />
      </span>
      <span className="gsap-radio-text">{label || children}</span>
    </label>
  );
}

/**
 * Animated Checkbox with GSAP checkmark flip and scale animations.
 */
export function GsapCheckbox({ checked, onChange, label, children }) {
  const boxRef = useRef(null);
  const markRef = useRef(null);

  useEffect(() => {
    if (!boxRef.current || !markRef.current) return;

    if (checked) {
      gsap.to(boxRef.current, {
        scale: 1.08,
        borderColor: "#f2b544",
        backgroundColor: "rgba(242, 181, 68, 0.25)",
        boxShadow: "0 0 10px rgba(242, 181, 68, 0.5)",
        duration: 0.22,
        ease: "back.out(1.5)",
      });
      gsap.fromTo(
        markRef.current,
        { scale: 0, rotate: -45 },
        {
          scale: 1,
          rotate: 0,
          opacity: 1,
          duration: 0.25,
          ease: "back.out(2)",
        },
      );
    } else {
      gsap.to(boxRef.current, {
        scale: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        boxShadow: "0 0 0px rgba(0, 0, 0, 0)",
        duration: 0.2,
      });
      gsap.to(markRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.15,
      });
    }
  }, [checked]);

  return (
    <label className={`gsap-custom-checkbox-label ${checked ? "checked" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="gsap-hidden-input"
      />
      <span className="gsap-checkbox-box" ref={boxRef}>
        <span className="gsap-checkbox-mark" ref={markRef}>
          ✓
        </span>
      </span>
      <span className="gsap-checkbox-text">{label || children}</span>
    </label>
  );
}

/**
 * Animated GSAP Dropdown Select block with spring physics & custom glass style.
 */
export function GsapSelect({ value, onChange, options = [], className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const arrowRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    if (!menuRef.current || !arrowRef.current) return;

    if (isOpen) {
      gsap.fromTo(
        menuRef.current,
        { opacity: 0, y: -8, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "back.out(1.5)" },
      );
      gsap.to(arrowRef.current, { rotate: 180, duration: 0.2 });
    } else {
      gsap.to(arrowRef.current, { rotate: 0, duration: 0.2 });
    }
  }, [isOpen]);

  const handleSelect = (val) => {
    if (triggerRef.current) {
      gsap.to(triggerRef.current, {
        scale: 0.97,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
      });
    }
    onChange(val);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`gsap-select-container ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`gsap-select-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="gsap-select-label">{selectedOption?.label || value}</span>
        <span ref={arrowRef} className="gsap-select-arrow">
          ▼
        </span>
      </button>

      {isOpen && (
        <div ref={menuRef} className="gsap-select-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`gsap-select-item ${option.value === value ? "active" : ""}`}
              onClick={() => handleSelect(option.value)}
            >
              <span>{option.label}</span>
              {option.value === value && <span className="gsap-select-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Apple-style Elastic Capsule Range Slider with GSAP spring physics.
 */
export function GsapSlider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  icon: Icon,
  label = "Brightness",
  unit = "%",
}) {
  const trackRef = useRef(null);
  const fillRef = useRef(null);
  const iconRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const updateFromPointer = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const rawRatio = (clientX - rect.left) / rect.width;
    const clampedRatio = Math.min(1, Math.max(0, rawRatio));
    const rawVal = min + clampedRatio * (max - min);
    const steppedVal = Math.round(rawVal / step) * step;
    const finalVal = Math.min(max, Math.max(min, steppedVal));

    if (finalVal !== value) {
      onChange(finalVal);
    }

    // Elastic stretch if dragged outside bounds
    if (rawRatio < 0 || rawRatio > 1) {
      const overdrag = rawRatio < 0 ? Math.abs(rawRatio) : rawRatio - 1;
      const stretch = Math.min(0.08, overdrag * 0.15);
      gsap.to(trackRef.current, {
        scaleX: 1.03 + stretch,
        scaleY: 1.06 - stretch * 0.5,
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
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    updateFromPointer(clientX);

    gsap.to(trackRef.current, {
      scaleX: 1.02,
      scaleY: 1.08,
      boxShadow: "0 8px 28px rgba(242, 181, 68, 0.4), 0 0 16px rgba(242, 181, 68, 0.3)",
      duration: 0.25,
      ease: "back.out(2)",
    });

    if (iconRef.current) {
      gsap.to(iconRef.current, { scale: 1.2, rotate: 15, duration: 0.25, ease: "back.out(2)" });
    }

    const onPointerMove = (moveEvent) => {
      const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      updateFromPointer(moveX);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);

      // Apple elastic snap release
      if (trackRef.current) {
        gsap.to(trackRef.current, {
          scaleX: 1,
          scaleY: 1,
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)",
          duration: 0.5,
          ease: "elastic.out(1.2, 0.4)",
        });
      }
      if (iconRef.current) {
        gsap.to(iconRef.current, { scale: 1, rotate: 0, duration: 0.4, ease: "elastic.out(1.2, 0.4)" });
      }
    };

    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchmove", onPointerMove);
    window.addEventListener("touchend", onPointerUp);
  };

  return (
    <div className="apple-slider-container">
      <div className="apple-slider-header">
        <span className="apple-slider-label">
          {Icon && <Icon size={16} />} {label}
        </span>
        <span className="apple-slider-value">{value}{unit}</span>
      </div>

      <div
        ref={trackRef}
        className={`apple-slider-capsule ${isDragging ? "dragging" : ""}`}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        <div
          ref={fillRef}
          className="apple-slider-fill"
          style={{ width: `${percent}%` }}
        />

        <div className="apple-slider-content">
          <span ref={iconRef} className="apple-slider-icon" style={{ opacity: 0.7 + (percent / 100) * 0.3 }}>
            {Icon && <Icon size={18} />}
          </span>
          <span className="apple-slider-indicator-text">{value}{unit}</span>
        </div>
      </div>
    </div>
  );
}
