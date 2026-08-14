import { useEffect, useRef, useState  } from "react";
import gsap from "gsap";

/**
 * Animated Radio Button with GSAP scale and ripple glow effects.
 */
export function GsapRadio({ name, value, checked, onChange, label, children }) {
  const circleRef = useRef(null);
  const dotRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!circleRef.current || !dotRef.current) return;

    if (checked) {
      gsap.to(circleRef.current, {
        scale: 1.1,
        borderColor: "#34d399",
        backgroundColor: "rgba(52, 211, 153, 0.2)",
        boxShadow: "0 0 12px rgba(52, 211, 153, 0.6)",
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
        borderColor: "rgba(52, 211, 153, 0.6)",
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
      className={`gsap-custom-radio-label ${checked ? "checked" : ""}`}
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
        borderColor: "#34d399",
        backgroundColor: "rgba(52, 211, 153, 0.25)",
        boxShadow: "0 0 10px rgba(52, 211, 153, 0.5)",
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
