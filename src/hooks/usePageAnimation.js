// Reusable GSAP animation hook for page/component entrance animations.
// Provides staggered fade-in for cards and sections.
// Must NOT contain UI, routing, or API logic.
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Animate child elements on mount.
 * @param {object} [options]
 * @param {string} [options.selector=".anim-item"] - CSS selector for elements to animate
 * @param {number} [options.stagger=0.08] - delay between each element
 * @param {number} [options.y=30] - initial Y offset
 * @param {number} [options.duration=0.5] - animation duration
 * @param {string} [options.ease="power3.out"] - GSAP ease
 * @returns {{ scopeRef: React.RefObject }}
 */
export function usePageAnimation(options = {}) {
  const {
    selector = ".anim-item",
    stagger = 0.08,
    y = 30,
    duration = 0.5,
    ease = "power3.out",
  } = options;

  const scopeRef = useRef(null);

  useLayoutEffect(() => {
    if (!scopeRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        selector,
        { y, opacity: 0 },
        { y: 0, opacity: 1, duration, stagger, ease }
      );
    }, scopeRef);

    return () => ctx.revert();
  }, [selector, stagger, y, duration, ease]);

  return { scopeRef };
}

/**
 * Animate a single element (e.g. a card that loads data) after data arrives.
 * Call trigger() to replay the animation.
 */
export function useRevealAnimation(options = {}) {
  const { y = 20, duration = 0.4, ease = "power2.out" } = options;
  const ref = useRef(null);

  const trigger = () => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { y, opacity: 0 },
      { y: 0, opacity: 1, duration, ease }
    );
  };

  return { ref, trigger };
}

