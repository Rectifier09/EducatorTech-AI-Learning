"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const PARTICLE_COUNT = 10;

/**
 * A brief whisper of gold particles emitted from a point inside this
 * component's container, the moment `trigger` flips from false to true.
 * The origin defaults to the container centre; pass `originX`/`originY`
 * (any CSS length/percent) to anchor the burst on a focal point — e.g. an
 * option's trailing ✓ — instead of the geometric middle of a large box.
 * Self-contained: creates/animates/cleans up its own DOM nodes via the
 * Web Animations API. Renders nothing when the user prefers reduced motion.
 */
export function GoldBurst({
  trigger,
  originX = "50%",
  originY = "50%",
  delayMs = 0,
}: {
  trigger: boolean;
  originX?: string;
  originY?: string;
  /**
   * Milliseconds to wait after `trigger` flips true before the particles
   * emit. Lets the burst land a beat *after* a settling state change (e.g. an
   * option turning green + spring-settling) so the celebration punctuates the
   * acknowledgement rather than colliding with it. Defaults to 0 (immediate).
   */
  delayMs?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wasTriggered = useRef(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const justFlippedOn = trigger && !wasTriggered.current;
    wasTriggered.current = trigger;
    if (!justFlippedOn || reduced) return;

    const particles: HTMLSpanElement[] = [];

    function emit() {
      const container = containerRef.current;
      if (!container) return;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const particle = document.createElement("span");
        particle.style.position = "absolute";
        particle.style.left = originX;
        particle.style.top = originY;
        particle.style.width = "6px";
        particle.style.height = "6px";
        particle.style.borderRadius = "9999px";
        particle.style.background =
          "radial-gradient(circle, var(--gold-bright), var(--gold))";
        particle.style.pointerEvents = "none";
        container.appendChild(particle);
        particles.push(particle);

        const angle = Math.random() * Math.PI * 2;
        const dist = 24 + Math.random() * 32;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;

        const animation = particle.animate(
          [
            { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
            {
              transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`,
              opacity: 0,
            },
          ],
          {
            duration: 600 + Math.random() * 260,
            easing: "cubic-bezier(.22,1,.36,1)",
          },
        );
        animation.onfinish = () => particle.remove();
      }
    }

    const timer = delayMs > 0 ? window.setTimeout(emit, delayMs) : (emit(), 0);

    return () => {
      if (timer) window.clearTimeout(timer);
      particles.forEach((p) => p.remove());
    };
  }, [trigger, reduced, originX, originY, delayMs]);

  if (reduced) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-visible"
    />
  );
}
