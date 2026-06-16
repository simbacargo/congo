/* eslint-disable react-refresh/only-export-components */
// ─── SHARED ANIMATION TOOLKIT ────────────────────────────────────────────────
// Centralizes the three animation engines so each section can pull the right
// tool: Framer Motion for declarative scroll reveals, React Spring for
// physics-based numbers, and GSAP (ScrollTrigger) for pinned/timeline work.

import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useSpring, useSpringValue, animated } from '@react-spring/web';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger, motion, animated };

// ─── FRAMER MOTION VARIANTS ──────────────────────────────────────────────────

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7, ease: 'easeOut' } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

// Stagger container — children inherit `delayChildren` cadence.
export const stagger = (gap = 0.09, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

// ─── REVEAL ──────────────────────────────────────────────────────────────────
// Drop-in wrapper that plays `fadeUp` (or any variant) once the element scrolls
// into view. Honours prefers-reduced-motion through MotionConfig at the root.

export function Reveal({
  children,
  variants = fadeUp,
  className = '',
  as = 'div',
  amount = 0.3,
  once = true,
  ...rest
}) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

// Stagger group: animates its direct <Reveal>/motion children in sequence.
export function RevealGroup({
  children,
  className = '',
  gap = 0.09,
  delay = 0,
  amount = 0.2,
  once = true,
  ...rest
}) {
  return (
    <motion.div
      className={className}
      variants={stagger(gap, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// ─── REACT SPRING: ANIMATED NUMBER ───────────────────────────────────────────
// Physics-driven counter. Springs toward `value`, formatting on each frame.
// Used for the live stat tiles so numbers settle with natural momentum.

export function SpringNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  className = '',
  config = { mass: 1, tension: 70, friction: 26 },
}) {
  const spring = useSpringValue(0, { config });
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (inView) spring.start(value);
    else spring.start(value, { immediate: false });
  }, [inView, value, spring]);

  return (
    <animated.span ref={ref} className={className}>
      {spring.to((n) => format(n))}
    </animated.span>
  );
}

// Re-export the spring primitives for bespoke component-level physics.
export { useSpring, useSpringValue };

// ─── GSAP CONTEXT HOOK ───────────────────────────────────────────────────────
// StrictMode-safe GSAP setup. Runs `setup(ctx, scope)` inside a gsap.context
// scoped to the returned ref, and reverts everything (including ScrollTriggers)
// on cleanup so React 19's double-invoke effects don't stack animations.

export function useGsap(setup, deps = []) {
  const scope = useRef(null);
  useEffect(() => {
    if (!scope.current) return;
    const ctx = gsap.context((self) => setup(self, scope.current), scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return scope;
}
